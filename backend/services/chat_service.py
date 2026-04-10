"""Chat service for ExportSaathi follow-up Q&A."""

import uuid
import logging
import json
from datetime import datetime
from typing import Optional

from models.schemas import ChatMessage, ChatResponse, QueryContext, Source
from services.llm_client import llm_client
from services.redis_client import redis_client

logger = logging.getLogger(__name__)

CHAT_SYSTEM_PROMPT = """You are ExportSaathi, an AI-powered Export Compliance & Certification Co-Pilot for Indian MSMEs.

You are helping a user with their export query. Context about their situation:
- Product: {product_type}
- Destination: {destination_country}

Your guidelines:
- Provide specific, actionable export guidance based on the user's product and destination
- Reference Indian export regulations (DGFT, BIS, FDA, CE, REACH, etc.)
- Be practical and helpful — the user is likely a first-time exporter
- If asked about certifications, give step-by-step processes with costs and timelines
- If asked about documents, explain what's needed and common mistakes
- If asked about logistics, provide practical shipping and customs advice
- Always mention relevant subsidies and government schemes
- If you're unsure about specific regulations, say so rather than making up details
- Keep responses concise but comprehensive
"""


def get_or_create_session(session_id: str, context: QueryContext) -> dict:
    """Get existing session or create a new one in Redis."""
    if session_id:
        data = redis_client.get(f"chat_session:{session_id}")
        if data:
            return json.loads(data)
            
    # Create new if not found or no session_id provided
    session_data = {
        "context": context.model_dump() if context else None,
        "messages": [],
        "created_at": datetime.now().isoformat(),
    }
    return session_data


def save_session(session_id: str, session_data: dict):
    """Save session to Redis with 7 days expiration."""
    redis_client.set(
        f"chat_session:{session_id}", 
        json.dumps(session_data), 
        expire=86400 * 7
    )


def process_question(
    session_id: str,
    question: str,
    context: QueryContext,
) -> ChatResponse:
    """Process a chat question and return AI response."""

    # Get or create session
    session = get_or_create_session(session_id, context)
    
    # Use existing context if available, otherwise fallback
    ctx_data = session.get("context")
    if ctx_data:
        ctx = QueryContext(**ctx_data)
    else:
        ctx = context

    # Add user message
    user_msg_id = str(uuid.uuid4())
    user_msg = ChatMessage(
        message_id=user_msg_id,
        role="user",
        content=question,
        timestamp=datetime.now().isoformat(),
    )
    # Serialize message to dict for storage
    session["messages"].append(user_msg.model_dump())

    # Build messages for LLM
    product_type = ctx.product_type if ctx and ctx.product_type else "Not specified"
    destination_country = ctx.destination_country if ctx and ctx.destination_country else "Not specified"
    
    system_prompt = CHAT_SYSTEM_PROMPT.format(
        product_type=product_type,
        destination_country=destination_country,
    )

    llm_messages = []
    for msg in session["messages"][-10:]:  # Last 10 messages for context
        llm_messages.append({
            "role": msg.get("role"),
            "content": msg.get("content"),
        })

    # Generate response
    try:
        answer = llm_client.chat(
            messages=llm_messages,
            system_prompt=system_prompt,
        )
    except Exception as e:
        logger.error(f"Chat generation failed: {e}")
        answer = "I'm sorry, I encountered an error generating a response. Please try again."

    # Create assistant message
    assistant_msg_id = str(uuid.uuid4())
    assistant_msg = ChatMessage(
        message_id=assistant_msg_id,
        role="assistant",
        content=answer,
        sources=[],
        timestamp=datetime.now().isoformat(),
    )
    session["messages"].append(assistant_msg.model_dump())

    # Save updated session
    save_session(session_id, session)

    return ChatResponse(
        message_id=assistant_msg_id,
        answer=answer,
        sources=[],
        timestamp=datetime.now().isoformat(),
    )


def get_history(session_id: str) -> list[ChatMessage]:
    """Get chat history for a session."""
    data = redis_client.get(f"chat_session:{session_id}")
    if not data:
        return []
        
    session = json.loads(data)
    messages = session.get("messages", [])
    
    # Return as ChatMessage objects
    return [ChatMessage(**msg) for msg in messages]
