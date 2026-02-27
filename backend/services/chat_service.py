"""Chat service for ExportSaathi follow-up Q&A."""

import uuid
import logging
from datetime import datetime
from typing import Optional

from models.schemas import ChatMessage, ChatResponse, QueryContext, Source
from services.llm_client import llm_client

logger = logging.getLogger(__name__)

# In-memory session store
_sessions: dict[str, dict] = {}

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


def create_session(context: QueryContext) -> str:
    """Create a new chat session."""
    session_id = str(uuid.uuid4())
    _sessions[session_id] = {
        "context": context,
        "messages": [],
        "created_at": datetime.now().isoformat(),
    }
    logger.info(f"Created chat session {session_id}")
    return session_id


def process_question(
    session_id: str,
    question: str,
    context: QueryContext,
) -> ChatResponse:
    """Process a chat question and return AI response."""

    # Create session if it doesn't exist
    if session_id not in _sessions:
        _sessions[session_id] = {
            "context": context,
            "messages": [],
            "created_at": datetime.now().isoformat(),
        }

    session = _sessions[session_id]
    ctx = session["context"] or context

    # Add user message
    user_msg_id = str(uuid.uuid4())
    user_msg = ChatMessage(
        message_id=user_msg_id,
        role="user",
        content=question,
        timestamp=datetime.now().isoformat(),
    )
    session["messages"].append(user_msg)

    # Build messages for LLM
    system_prompt = CHAT_SYSTEM_PROMPT.format(
        product_type=ctx.product_type or "Not specified",
        destination_country=ctx.destination_country or "Not specified",
    )

    llm_messages = []
    for msg in session["messages"][-10:]:  # Last 10 messages for context
        llm_messages.append({
            "role": msg.role,
            "content": msg.content,
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
    session["messages"].append(assistant_msg)

    return ChatResponse(
        message_id=assistant_msg_id,
        answer=answer,
        sources=[],
        timestamp=datetime.now().isoformat(),
    )


def get_history(session_id: str) -> list[ChatMessage]:
    """Get chat history for a session."""
    session = _sessions.get(session_id)
    if not session:
        return []
    return session["messages"]
