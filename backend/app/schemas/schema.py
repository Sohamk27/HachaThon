"""
Schema-related Pydantic schemas
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field


class SchemaUploadResponse(BaseModel):
    """Response schema for schema upload"""
    success: bool = Field(..., description="Whether upload was successful")
    schema_id: str = Field(..., description="Unique schema identifier")
    tables_count: int = Field(..., description="Number of tables in schema")
    message: str = Field(..., description="Status message")


class TableInfo(BaseModel):
    """Schema for table information"""
    name: str = Field(..., description="Table name")
    columns: List[Dict[str, Any]] = Field(..., description="Column definitions")
    primary_keys: List[str] = Field(default=[], description="Primary key columns")
    foreign_keys: List[Dict[str, Any]] = Field(default=[], description="Foreign key relationships")


class SchemaInfoResponse(BaseModel):
    """Response schema for schema information"""
    schema_id: str = Field(..., description="Schema identifier")
    tables: List[TableInfo] = Field(..., description="Table information")
    relationships: List[Dict[str, Any]] = Field(default=[], description="Table relationships")
    metadata: Dict[str, Any] = Field(default={}, description="Additional metadata")
