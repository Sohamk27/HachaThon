"""
Suggestions-related Pydantic schemas
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class SuggestionsRequest(BaseModel):
    """Request schema for getting suggestions"""
    partial_query: str = Field(..., description="Partial natural language query")
    schema_context: Optional[Dict[str, Any]] = Field(None, description="Database schema context")
    user_history: List[Dict[str, Any]] = Field(default=[], description="User query history")


class Suggestion(BaseModel):
    """Individual suggestion schema"""
    text: str = Field(..., description="Suggestion text")
    type: str = Field(..., description="Suggestion type (completion, correction, example)")
    confidence: float = Field(..., description="Confidence score (0-1)")
    metadata: Dict[str, Any] = Field(default={}, description="Additional metadata")


class SuggestionsResponse(BaseModel):
    """Response schema for suggestions"""
    suggestions: List[Suggestion] = Field(..., description="List of suggestions")
