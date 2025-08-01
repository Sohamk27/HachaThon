"""
Schema management endpoints
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import List, Dict, Any
from app.schemas.schema import (
    SchemaUploadResponse, 
    SchemaInfoResponse, 
    GenerateEmbeddingRequest, 
    GenerateEmbeddingResponse
)
from app.services.schema_service import SchemaService
from app.core.logger import get_logger

logger = get_logger(__name__)
router = APIRouter()


@router.post("/upload", response_model=SchemaUploadResponse)
async def upload_schema(file: UploadFile = File(...)):
    """Upload database schema file"""
    try:
        logger.info("Uploading schema file", filename=file.filename)
        
        schema_service = SchemaService()
        result = await schema_service.upload_schema(file)
        
        return SchemaUploadResponse(
            success=result["success"],
            schema_id=result["schema_id"],
            tables_count=result["tables_count"],
            message=result["message"]
        )
    except Exception as e:
        logger.error("Failed to upload schema", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to upload schema")


@router.get("/info", response_model=SchemaInfoResponse)
async def get_schema_info(schema_id: str = None):
    """Get database schema information"""
    try:
        logger.info("Fetching schema info", schema_id=schema_id)
        
        schema_service = SchemaService()
        schema_info = await schema_service.get_schema_info(schema_id)
        
        return SchemaInfoResponse(
            schema_id=schema_info["schema_id"],
            tables=schema_info["tables"],
            relationships=schema_info["relationships"],
            metadata=schema_info["metadata"]
        )
    except Exception as e:
        logger.error("Failed to fetch schema info", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to fetch schema information")


@router.post("/generate-embedding", response_model=GenerateEmbeddingResponse)
async def generate_schema_embedding(request: GenerateEmbeddingRequest):
    """Generate embeddings for database schema"""
    try:
        logger.info("Generating schema embedding", schema_id=request.schema_id)
        
        schema_service = SchemaService()
        result = await schema_service.generate_embedding(
            schema_id=request.schema_id,
            include_relationships=request.include_relationships,
            embedding_type=request.embedding_type
        )
        
        return GenerateEmbeddingResponse(
            success=result["success"],
            embedding_id=result["embedding_id"],
            schema_id=result["schema_id"],
            embedding_dimensions=result["embedding_dimensions"],
            metadata=result.get("metadata", {})
        )
    except Exception as e:
        logger.error("Failed to generate schema embedding", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to generate schema embedding")
