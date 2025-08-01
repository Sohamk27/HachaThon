"""
Suggestions service for query recommendations
"""

from typing import Dict, Any, List
from app.core.logger import get_logger

logger = get_logger(__name__)


class SuggestionsService:
    """Service for generating query suggestions"""
    
    def __init__(self):
        pass
    
    async def get_suggestions(
        self,
        partial_query: str,
        schema_context: Dict[str, Any] = None,
        user_history: List[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Get query suggestions based on input and context"""
        
        try:
            suggestions = []
            partial_lower = partial_query.lower().strip()
            
            # Empty or very short input
            if len(partial_lower) < 2:
                return self._get_default_suggestions(schema_context)
            
            # Intent-based suggestions
            if partial_lower.startswith(('show', 'get', 'find', 'list')):
                suggestions.extend(self._get_retrieval_suggestions(schema_context))
            
            elif partial_lower.startswith(('count', 'total', 'sum')):
                suggestions.extend(self._get_aggregation_suggestions(schema_context))
            
            elif partial_lower.startswith(('update', 'change', 'modify')):
                suggestions.extend(self._get_update_suggestions(schema_context))
            
            elif partial_lower.startswith(('delete', 'remove')):
                suggestions.extend(self._get_delete_suggestions(schema_context))
            
            else:
                # General suggestions based on partial input
                suggestions.extend(self._get_general_suggestions(partial_query, schema_context))
            
            # Add history-based suggestions
            if user_history:
                suggestions.extend(self._get_history_suggestions(user_history))
            
            # Remove duplicates and limit results
            unique_suggestions = []
            seen_texts = set()
            
            for suggestion in suggestions:
                if suggestion["text"] not in seen_texts:
                    unique_suggestions.append(suggestion)
                    seen_texts.add(suggestion["text"])
                    
                if len(unique_suggestions) >= 10:  # Limit to 10 suggestions
                    break
            
            return unique_suggestions
            
        except Exception as e:
            logger.error("Failed to generate suggestions", error=str(e))
            return self._get_fallback_suggestions()
    
    def _get_default_suggestions(self, schema_context: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Get default suggestions for empty input"""
        
        suggestions = [
            {
                "text": "Show me all users",
                "type": "completion",
                "confidence": 0.9,
                "metadata": {"intent": "select", "table": "users"}
            },
            {
                "text": "Count total orders",
                "type": "completion", 
                "confidence": 0.9,
                "metadata": {"intent": "aggregate", "table": "orders"}
            },
            {
                "text": "Find recent customers",
                "type": "completion",
                "confidence": 0.8,
                "metadata": {"intent": "select", "table": "users"}
            }
        ]
        
        return suggestions
    
    def _get_retrieval_suggestions(self, schema_context: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Get suggestions for data retrieval queries"""
        
        return [
            {
                "text": "Show me all users who registered this month",
                "type": "completion",
                "confidence": 0.9,
                "metadata": {"intent": "select", "table": "users"}
            },
            {
                "text": "Show me recent orders",
                "type": "completion",
                "confidence": 0.8,
                "metadata": {"intent": "select", "table": "orders"}
            },
            {
                "text": "Show me products by category",
                "type": "completion",
                "confidence": 0.8,
                "metadata": {"intent": "select", "table": "products"}
            }
        ]
    
    def _get_aggregation_suggestions(self, schema_context: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Get suggestions for aggregation queries"""
        
        return [
            {
                "text": "Count total users",
                "type": "completion",
                "confidence": 0.9,
                "metadata": {"intent": "aggregate", "function": "count"}
            },
            {
                "text": "Sum of all order amounts",
                "type": "completion",
                "confidence": 0.8,
                "metadata": {"intent": "aggregate", "function": "sum"}
            },
            {
                "text": "Average order value",
                "type": "completion",
                "confidence": 0.8,
                "metadata": {"intent": "aggregate", "function": "avg"}
            }
        ]
    
    def _get_update_suggestions(self, schema_context: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Get suggestions for update queries"""
        
        return [
            {
                "text": "Update user email address",
                "type": "completion",
                "confidence": 0.7,
                "metadata": {"intent": "update", "table": "users", "warning": "Be careful with updates"}
            },
            {
                "text": "Update order status",
                "type": "completion",
                "confidence": 0.7,
                "metadata": {"intent": "update", "table": "orders", "warning": "Be careful with updates"}
            }
        ]
    
    def _get_delete_suggestions(self, schema_context: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Get suggestions for delete queries"""
        
        return [
            {
                "text": "Delete canceled orders",
                "type": "completion",
                "confidence": 0.6,
                "metadata": {"intent": "delete", "table": "orders", "warning": "Dangerous operation"}
            }
        ]
    
    def _get_general_suggestions(self, partial_query: str, schema_context: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """Get general suggestions based on partial input"""
        
        suggestions = []
        partial_lower = partial_query.lower()
        
        # Table-based suggestions
        if "user" in partial_lower:
            suggestions.append({
                "text": f"{partial_query} from users table",
                "type": "completion",
                "confidence": 0.7,
                "metadata": {"table": "users"}
            })
        
        if "order" in partial_lower:
            suggestions.append({
                "text": f"{partial_query} from orders table",
                "type": "completion",
                "confidence": 0.7,
                "metadata": {"table": "orders"}
            })
        
        if "product" in partial_lower:
            suggestions.append({
                "text": f"{partial_query} from products table",
                "type": "completion",
                "confidence": 0.7,
                "metadata": {"table": "products"}
            })
        
        return suggestions
    
    def _get_history_suggestions(self, user_history: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Get suggestions based on user history"""
        
        suggestions = []
        
        for item in user_history[-3:]:  # Last 3 queries
            suggestions.append({
                "text": f"Re-run: {item.get('query', '')[:50]}...",
                "type": "history",
                "confidence": 0.6,
                "metadata": {"history": True, "original_query": item.get('query', '')}
            })
        
        return suggestions
    
    def _get_fallback_suggestions(self) -> List[Dict[str, Any]]:
        """Fallback suggestions when all else fails"""
        
        return [
            {
                "text": "Show me some data",
                "type": "fallback",
                "confidence": 0.5,
                "metadata": {"fallback": True}
            },
            {
                "text": "Help me write a query",
                "type": "fallback", 
                "confidence": 0.5,
                "metadata": {"fallback": True}
            }
        ]
