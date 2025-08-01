"""
Query-related Pydantic schemas
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ExecuteQueryRequest(BaseModel):
    """Request schema for query execution"""
    sql_query: str = Field(..., description="SQL query to execute")
    parameters: Optional[Dict[str, Any]] = Field(None, description="Query parameters")
    user_id: str = Field(..., description="User ID for tracking")
    dry_run: bool = Field(False, description="Validate without executing")


class ExecuteQueryResponse(BaseModel):
    """Response schema for query execution"""
    success: bool = Field(..., description="Whether query executed successfully")
    data: List[Dict[str, Any]] = Field(default=[], description="Query result data")
    columns: List[str] = Field(default=[], description="Column names")
    row_count: int = Field(..., description="Number of rows returned")
    execution_time: float = Field(..., description="Execution time in seconds")
    query_id: Optional[str] = Field(None, description="Unique query identifier")
    metadata: Dict[str, Any] = Field(default={}, description="Additional metadata")


class QueryHistoryResponse(BaseModel):
    """Response schema for query history"""
    query_id: str = Field(..., description="Unique query identifier")
    sql_query: str = Field(..., description="SQL query")
    natural_language_query: Optional[str] = Field(None, description="Original NL query")
    executed_at: datetime = Field(..., description="Execution timestamp")
    execution_time: float = Field(..., description="Execution time in seconds")
    row_count: int = Field(..., description="Number of rows returned")
    success: bool = Field(..., description="Whether query was successful")
    error_message: Optional[str] = Field(None, description="Error message if failed")


class ValidateQueryRequest(BaseModel):
    """Request schema for query validation"""
    sql_query: str = Field(..., description="SQL query to validate")
    schema_context: Optional[Dict[str, Any]] = Field(None, description="Database schema context")


class ValidateQueryResponse(BaseModel):
    """Response schema for query validation"""
    is_valid: bool = Field(..., description="Whether query is valid")
    errors: List[str] = Field(default=[], description="Validation errors")
    warnings: List[str] = Field(default=[], description="Validation warnings")
    suggestions: List[str] = Field(default=[], description="Improvement suggestions")
    estimated_execution_time: Optional[float] = Field(None, description="Estimated execution time")
    metadata: Dict[str, Any] = Field(default={}, description="Additional metadata")
