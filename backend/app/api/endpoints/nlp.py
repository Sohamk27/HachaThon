"""
Natural Language Processing endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Any
from app.schemas.nlp import (
    ParseIntentRequest,
    ParseIntentResponse,
    ExtractEntitiesRequest,
    ExtractEntitiesResponse,
    GenerateSQLRequest,
    GenerateSQLResponse
)
from app.services.nlp_service import NLPService
from app.core.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()

@router.post("/parse-intent", response_model=ParseIntentResponse)
async def parse_intent(request: ParseIntentRequest):
    """
    Parse user intent from natural language query
    """
    try:
        logger.info("Parsing intent", query=request.query)
        
        nlp_service = NLPService()
        result = await nlp_service.parse_intent(request.query)
        
        return ParseIntentResponse(
            intent=result["intent"],
            confidence=result["confidence"],
            entities=result.get("entities", []),
            metadata=result.get("metadata", {})
        )
    except Exception as e:
        logger.error("Failed to parse intent", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to parse intent")


@router.post("/extract-entities", response_model=ExtractEntitiesResponse)
async def extract_entities(request: ExtractEntitiesRequest):
    """
    Extract entities from natural language query
    """
    try:
        logger.info("Extracting entities", query=request.query)
        
        nlp_service = NLPService()
        entities = await nlp_service.extract_entities(
            request.query,
            schema_context=request.schema_context
        )
        
        return ExtractEntitiesResponse(entities=entities)
    except Exception as e:
        logger.error("Failed to extract entities", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to extract entities")


@router.post("/generate-sql", response_model=GenerateSQLResponse)
async def generate_sql(request: GenerateSQLRequest):
    """
    Generate SQL query from natural language
    """
    try:
        logger.info("Generating SQL", query=request.query)
        
        nlp_service = NLPService()
        result = await nlp_service.generate_sql(
            natural_language_query=request.query,
            schema_context=request.schema_context,
            conversation_history=request.conversation_history,
            user_preferences=request.user_preferences
        )
        
        return GenerateSQLResponse(
            sql_query=result["sql_query"],
            explanation=result["explanation"],
            confidence=result["confidence"],
            suggested_modifications=result.get("suggested_modifications", []),
            metadata=result.get("metadata", {})
        )
    except Exception as e:
        logger.error("Failed to generate SQL", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to generate SQL query")
