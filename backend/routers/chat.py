"""API routes for chat Q&A."""

import logging
from fastapi import APIRouter, HTTPException

from models.schemas import ChatRequest, ChatResponse, ChatMessage
from services.chat_service import process_question, get_history

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/chat", tags=["Chat"])


@router.post("", response_model=ChatResponse)
async def submit_chat_question(request: ChatRequest):
    """Submit a follow-up question and get AI response."""
    try:
        response = process_question(
            session_id=request.session_id,
            question=request.question,
            context=request.context,
        )
        return response
    except Exception as e:
        logger.error(f"Chat processing failed: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Chat processing failed",
                "detail": str(e),
                "code": "CHAT_FAILED",
            },
        )


@router.get("/{session_id}/history", response_model=list[ChatMessage])
async def get_chat_history(session_id: str):
    """Retrieve chat history for a session."""
    history = get_history(session_id)
    return history
