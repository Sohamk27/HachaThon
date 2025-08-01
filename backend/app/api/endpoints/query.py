"""
Query execution endpoints
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List, Dict, Any
from app.schemas.query import (
    ExecuteQueryRequest,
    ExecuteQueryResponse,
    QueryHistoryResponse,
    ValidateQueryRequest,
    ValidateQueryResponse
)
from app.services.query_service import QueryService
from app.core.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.post("/execute", response_model=ExecuteQueryResponse)
async def execute_query(request: ExecuteQueryRequest):
    """
    Execute SQL query safely
    """
    try:
        logger.info("Executing query", query_preview=request.sql_query[:100])
        
        query_service = QueryService()
        result = await query_service.execute_query(
            sql_query=request.sql_query,
            parameters=request.parameters,
            user_id=request.user_id,
            dry_run=request.dry_run
        )
        
        return ExecuteQueryResponse(
            success=result["success"],
            data=result.get("data", []),
            columns=result.get("columns", []),
            row_count=result.get("row_count", 0),
            execution_time=result.get("execution_time", 0.0),
            query_id=result.get("query_id"),
            metadata=result.get("metadata", {})
        )
    except Exception as e:
        logger.error("Failed to execute query", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to execute query")


@router.get("/history", response_model=List[QueryHistoryResponse])
async def get_query_history(user_id: str, limit: int = 50, offset: int = 0):
    """
    Get query execution history for user
    """
    try:
        logger.info("Fetching query history", user_id=user_id)
        
        query_service = QueryService()
        history = await query_service.get_query_history(
            user_id=user_id,
            limit=limit,
            offset=offset
        )
        
        return [
            QueryHistoryResponse(
                query_id=item["query_id"],
                sql_query=item["sql_query"],
                natural_language_query=item["natural_language_query"],
                executed_at=item["executed_at"],
                execution_time=item["execution_time"],
                row_count=item["row_count"],
                success=item["success"],
                error_message=item.get("error_message")
            )
            for item in history
        ]
    except Exception as e:
        logger.error("Failed to fetch query history", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch query history")


@router.post("/validate", response_model=ValidateQueryResponse)
async def validate_query(request: ValidateQueryRequest):
    """
    Validate SQL query without executing
    """
    try:
        logger.info("Validating query", query_preview=request.sql_query[:100])
        
        query_service = QueryService()
        result = await query_service.validate_query(
            sql_query=request.sql_query,
            schema_context=request.schema_context
        )
        
        return ValidateQueryResponse(
            is_valid=result["is_valid"],
            errors=result.get("errors", []),
            warnings=result.get("warnings", []),
            suggestions=result.get("suggestions", []),
            estimated_execution_time=result.get("estimated_execution_time"),
            metadata=result.get("metadata", {})
        )
    except Exception as e:
        logger.error("Failed to validate query", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to validate query")
