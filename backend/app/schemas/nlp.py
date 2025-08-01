"""
NLP-related Pydantic schemas
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class ParseIntentRequest(BaseModel):
    """Request schema for intent parsing"""
    query: str = Field(..., description="Natural language query")
    context: Optional[Dict[str, Any]] = Field(None, description="Additional context")


class ParseIntentResponse(BaseModel):
    """Response schema for intent parsing"""
    intent: str = Field(..., description="Detected intent")
    confidence: float = Field(..., description="Confidence score (0-1)")
    entities: List[Dict[str, Any]] = Field(default=[], description="Extracted entities")
    metadata: Dict[str, Any] = Field(default={}, description="Additional metadata")


class ExtractEntitiesRequest(BaseModel):
    """Request schema for entity extraction"""
    query: str = Field(..., description="Natural language query")
    schema_context: Optional[Dict[str, Any]] = Field(None, description="Database schema context")


class ExtractEntitiesResponse(BaseModel):
    """Response schema for entity extraction"""
    entities: List[Dict[str, Any]] = Field(..., description="Extracted entities")


class GenerateSQLRequest(BaseModel):
    """Request schema for SQL generation"""
    query: str = Field(..., description="Natural language query")
    schema_context: Optional[Dict[str, Any]] = Field(None, description="Database schema context")
    conversation_history: List[Dict[str, Any]] = Field(default=[], description="Chat history")
    user_preferences: Optional[Dict[str, Any]] = Field(None, description="User preferences")


class GenerateSQLResponse(BaseModel):
    """Response schema for SQL generation"""
    sql_query: str = Field(..., description="Generated SQL query")
    explanation: str = Field(..., description="Human-readable explanation")
    confidence: float = Field(..., description="Confidence score (0-1)")
    suggested_modifications: List[str] = Field(default=[], description="Suggested improvements")
    metadata: Dict[str, Any] = Field(default={}, description="Additional metadata")
