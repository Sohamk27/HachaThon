"""
Chat-related Pydantic schemas
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    """Request schema for chat messages"""
    message: str = Field(..., description="User message")
    user_id: str = Field(..., description="User identifier")
    conversation_id: Optional[str] = Field(None, description="Conversation identifier")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")


class ChatResponse(BaseModel):
    """Response schema for chat messages"""
    message: str = Field(..., description="Assistant response")
    message_type: str = Field(..., description="Type of message (text, sql, chart, etc.)")
    suggested_actions: List[Dict[str, Any]] = Field(default=[], description="Suggested follow-up actions")
    metadata: Dict[str, Any] = Field(default={}, description="Additional metadata")
