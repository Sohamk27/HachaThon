"""
Chat interface endpoints
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import ChatService
from app.core.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.post("/message", response_model=ChatResponse)
async def send_message(request: ChatRequest):
    """Send message to AI assistant"""
    try:
        logger.info("Processing chat message", user_id=request.user_id)
        
        chat_service = ChatService()
        response = await chat_service.process_message(
            message=request.message,
            user_id=request.user_id,
            conversation_id=request.conversation_id,
            context=request.context
        )
        
        return ChatResponse(
            message=response["message"],
            message_type=response["message_type"],
            suggested_actions=response.get("suggested_actions", []),
            metadata=response.get("metadata", {})
        )
    except Exception as e:
        logger.error("Failed to process chat message", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to process message")
