"""
Query execution service
"""

import uuid
import time
from typing import Dict, List, Any, Optional
from sqlalchemy import text
from app.core.logger import get_logger

logger = get_logger(__name__)


class QueryService:
    """Service for SQL query execution and management"""
    
    def __init__(self):
        self.query_history = []  # In-memory storage for demo
    
    async def execute_query(
        self,
        sql_query: str,
        parameters: Optional[Dict] = None,
        user_id: str = "anonymous",
        dry_run: bool = False
    ) -> Dict[str, Any]:
        """Execute SQL query safely"""
        
        query_id = str(uuid.uuid4())
        start_time = time.time()
        
        try:
            # Basic SQL injection prevention
            if self._is_dangerous_query(sql_query):
                raise ValueError("Potentially dangerous query detected")
            
            if dry_run:
                # Validate query without executing
                return {
                    "success": True,
                    "data": [],
                    "columns": [],
                    "row_count": 0,
                    "execution_time": 0.0,
                    "query_id": query_id,
                    "metadata": {"dry_run": True}
                }
            
            # Mock query execution for demo
            # In a real implementation, you would connect to the actual database
            mock_data, mock_columns = self._execute_mock_query(sql_query)
            
            execution_time = time.time() - start_time
            
            # Store query history
            self.query_history.append({
                "query_id": query_id,
                "sql_query": sql_query,
                "user_id": user_id,
                "executed_at": time.time(),
                "execution_time": execution_time,
                "row_count": len(mock_data),
                "success": True
            })
            
            return {
                "success": True,
                "data": mock_data,
                "columns": mock_columns,
                "row_count": len(mock_data),
                "execution_time": execution_time,
                "query_id": query_id,
                "metadata": {"mock": True}
            }
            
        except Exception as e:
            execution_time = time.time() - start_time
            error_message = str(e)
            
            logger.error("Query execution failed", 
                        query_id=query_id, 
                        error=error_message)
            
            # Store failed query in history
            self.query_history.append({
                "query_id": query_id,
                "sql_query": sql_query,
                "user_id": user_id,
                "executed_at": time.time(),
                "execution_time": execution_time,
                "row_count": 0,
                "success": False,
                "error_message": error_message
            })
            
            return {
                "success": False,
                "data": [],
                "columns": [],
                "row_count": 0,
                "execution_time": execution_time,
                "query_id": query_id,
                "error": error_message
            }
    
    async def get_query_history(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get query execution history"""
        
        user_queries = [
            q for q in self.query_history 
            if q["user_id"] == user_id
        ]
        
        # Sort by execution time descending
        user_queries.sort(key=lambda x: x["executed_at"], reverse=True)
        
        # Apply pagination
        return user_queries[offset:offset + limit]
    
    async def validate_query(
        self,
        sql_query: str,
        schema_context: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Validate SQL query without executing"""
        
        try:
            # Basic validation
            errors = []
            warnings = []
            suggestions = []
            
            if self._is_dangerous_query(sql_query):
                errors.append("Query contains potentially dangerous operations")
            
            if not sql_query.strip().endswith(';'):
                warnings.append("Query should end with semicolon")
                suggestions.append("Add semicolon at the end")
            
            if "SELECT *" in sql_query.upper():
                warnings.append("Using SELECT * may impact performance")
                suggestions.append("Specify explicit column names")
            
            if not sql_query.upper().strip().startswith(('SELECT', 'WITH')):
                warnings.append("Only SELECT queries are recommended for safety")
            
            return {
                "is_valid": len(errors) == 0,
                "errors": errors,
                "warnings": warnings,
                "suggestions": suggestions,
                "estimated_execution_time": 0.1  # Mock estimate
            }
            
        except Exception as e:
            return {
                "is_valid": False,
                "errors": [str(e)],
                "warnings": [],
                "suggestions": []
            }
    
    def _is_dangerous_query(self, sql_query: str) -> bool:
        """Check for potentially dangerous SQL operations"""
        dangerous_keywords = [
            'DROP', 'DELETE', 'TRUNCATE', 'ALTER', 'CREATE',
            'GRANT', 'REVOKE', 'INSERT', 'UPDATE'
        ]
        
        query_upper = sql_query.upper()
        return any(keyword in query_upper for keyword in dangerous_keywords)
    
    def _execute_mock_query(self, sql_query: str) -> tuple:
        """Execute mock query for demonstration"""
        
        # Mock data based on query patterns
        if "users" in sql_query.lower():
            return [
                {"id": 1, "name": "John Doe", "email": "john@example.com", "created_at": "2024-01-15"},
                {"id": 2, "name": "Jane Smith", "email": "jane@example.com", "created_at": "2024-01-20"},
                {"id": 3, "name": "Bob Johnson", "email": "bob@example.com", "created_at": "2024-02-01"}
            ], ["id", "name", "email", "created_at"]
        
        elif "orders" in sql_query.lower():
            return [
                {"order_id": 101, "user_id": 1, "amount": 99.99, "status": "completed"},
                {"order_id": 102, "user_id": 2, "amount": 149.50, "status": "pending"},
                {"order_id": 103, "user_id": 1, "amount": 75.25, "status": "completed"}
            ], ["order_id", "user_id", "amount", "status"]
        
        elif "products" in sql_query.lower():
            return [
                {"product_id": 1, "name": "Laptop", "price": 999.99, "category": "Electronics"},
                {"product_id": 2, "name": "Book", "price": 19.99, "category": "Education"},
                {"product_id": 3, "name": "Headphones", "price": 79.99, "category": "Electronics"}
            ], ["product_id", "name", "price", "category"]
        
        else:
            # Generic mock response
            return [
                {"column1": "value1", "column2": "value2"},
                {"column1": "value3", "column2": "value4"}
            ], ["column1", "column2"]
