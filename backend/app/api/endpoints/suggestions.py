"""
Suggestions endpoints
"""

from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from app.schemas.suggestions import SuggestionsRequest, SuggestionsResponse
from app.services.suggestions_service import SuggestionsService
from app.core.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.post("/", response_model=SuggestionsResponse)
async def get_suggestions(request: SuggestionsRequest):
    """Get query suggestions and recommendations"""
    try:
        logger.info("Getting suggestions", query=request.partial_query[:50])
        
        suggestions_service = SuggestionsService()
        suggestions = await suggestions_service.get_suggestions(
            partial_query=request.partial_query,
            schema_context=request.schema_context,
            user_history=request.user_history
        )
        
        return SuggestionsResponse(suggestions=suggestions)
    except Exception as e:
        logger.error("Failed to get suggestions", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to get suggestions")
