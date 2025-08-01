"""
Schema management service
"""

import uuid
import json
import re
from typing import Dict, Any, List
from fastapi import UploadFile
from app.core.logger import get_logger

logger = get_logger(__name__)


class SchemaService:
    """Service for database schema management"""
    
    def __init__(self):
        self.schemas = {}  # In-memory storage for demo
    
    async def upload_schema(self, file: UploadFile) -> Dict[str, Any]:
        """Upload and parse database schema file"""
        
        try:
            # Read file content
            content = await file.read()
            schema_text = content.decode('utf-8')
            
            # Parse DDL
            schema_data = self._parse_ddl(schema_text)
            
            # Generate schema ID
            schema_id = str(uuid.uuid4())
            
            # Store schema
            self.schemas[schema_id] = {
                "schema_id": schema_id,
                "filename": file.filename,
                "schema_data": schema_data,
                "uploaded_at": "2024-01-01T00:00:00Z"
            }
            
            return {
                "success": True,
                "schema_id": schema_id,
                "tables_count": len(schema_data.get("tables", [])),
                "message": f"Schema uploaded successfully from {file.filename}"
            }
            
        except Exception as e:
            logger.error("Schema upload failed", error=str(e))
            return {
                "success": False,
                "schema_id": None,
                "tables_count": 0,
                "message": f"Failed to upload schema: {str(e)}"
            }
    
    async def get_schema_info(self, schema_id: str = None) -> Dict[str, Any]:
        """Get schema information"""
        
        if schema_id and schema_id in self.schemas:
            schema = self.schemas[schema_id]
            return {
                "schema_id": schema_id,
                "tables": schema["schema_data"].get("tables", []),
                "relationships": schema["schema_data"].get("relationships", []),
                "metadata": {
                    "filename": schema["filename"],
                    "uploaded_at": schema["uploaded_at"]
                }
            }
        
        # Return mock schema for demo
        return self._get_mock_schema()
    
    def _parse_ddl(self, ddl_text: str) -> Dict[str, Any]:
        """Parse DDL text to extract schema information"""
        
        tables = []
        relationships = []
        
        # Simple DDL parsing (in production, use a proper SQL parser)
        table_pattern = r'CREATE TABLE\s+(\w+)\s*\((.*?)\);'
        matches = re.finditer(table_pattern, ddl_text, re.IGNORECASE | re.DOTALL)
        
        for match in matches:
            table_name = match.group(1)
            columns_text = match.group(2)
            
            columns = self._parse_columns(columns_text)
            
            tables.append({
                "name": table_name,
                "columns": columns
            })
        
        return {
            "tables": tables,
            "relationships": relationships
        }
    
    def _parse_columns(self, columns_text: str) -> List[Dict[str, Any]]:
        """Parse column definitions from DDL"""
        
        columns = []
        
        # Split by commas and clean up
        column_lines = [line.strip() for line in columns_text.split(',')]
        
        for line in column_lines:
            if not line or line.upper().startswith(('PRIMARY KEY', 'FOREIGN KEY', 'CONSTRAINT')):
                continue
            
            # Basic column parsing
            parts = line.split()
            if len(parts) >= 2:
                column_name = parts[0].strip('`"[]')
                column_type = parts[1].upper()
                
                columns.append({
                    "name": column_name,
                    "type": column_type,
                    "nullable": "NOT NULL" not in line.upper(),
                    "primary_key": "PRIMARY KEY" in line.upper(),
                    "foreign_key": None  # Would need more complex parsing
                })
        
        return columns
    
    def _get_mock_schema(self) -> Dict[str, Any]:
        """Return mock schema for demonstration"""
        
        return {
            "schema_id": "mock-schema-123",
            "tables": [
                {
                    "name": "users",
                    "columns": [
                        {"name": "id", "type": "INTEGER", "nullable": False, "primary_key": True},
                        {"name": "name", "type": "VARCHAR", "nullable": False, "primary_key": False},
                        {"name": "email", "type": "VARCHAR", "nullable": False, "primary_key": False},
                        {"name": "created_at", "type": "TIMESTAMP", "nullable": True, "primary_key": False}
                    ]
                },
                {
                    "name": "orders",
                    "columns": [
                        {"name": "order_id", "type": "INTEGER", "nullable": False, "primary_key": True},
                        {"name": "user_id", "type": "INTEGER", "nullable": False, "primary_key": False},
                        {"name": "amount", "type": "DECIMAL", "nullable": False, "primary_key": False},
                        {"name": "status", "type": "VARCHAR", "nullable": False, "primary_key": False},
                        {"name": "created_at", "type": "TIMESTAMP", "nullable": True, "primary_key": False}
                    ]
                },
                {
                    "name": "products",
                    "columns": [
                        {"name": "product_id", "type": "INTEGER", "nullable": False, "primary_key": True},
                        {"name": "name", "type": "VARCHAR", "nullable": False, "primary_key": False},
                        {"name": "price", "type": "DECIMAL", "nullable": False, "primary_key": False},
                        {"name": "category", "type": "VARCHAR", "nullable": True, "primary_key": False}
                    ]
                }
            ],
            "relationships": [
                {
                    "from_table": "orders",
                    "to_table": "users",
                    "relationship_type": "many-to-one"
                }
            ],
            "metadata": {
                "filename": "sample_schema.sql",
                "uploaded_at": "2024-01-01T00:00:00Z"
            }
        }
