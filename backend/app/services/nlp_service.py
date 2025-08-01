"""
Natural Language Processing Service
Uses OpenAI GPT models for intent parsing, entity extraction, and SQL generation
"""

import json
import re
import asyncio
from typing import Dict, List, Any, Optional
from openai import AsyncOpenAI, APITimeoutError, APIError
from app.core.config import settings
from app.core.logger import get_logger

logger = get_logger(__name__)


class NLPService:
    """Service for natural language processing operations"""
    
    def __init__(self):
        # Check if API key is configured
        if not settings.OPENAI_API_KEY or settings.OPENAI_API_KEY == "your_openai_api_key_here":
            logger.warning("OpenAI API key not configured - will use fallback responses only")
            self.openai_available = False
        else:
            self.openai_available = True
            
        self.client = AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            timeout=settings.OPENAI_TIMEOUT
        )
        self.model = settings.OPENAI_MODEL
        self.temperature = settings.OPENAI_TEMPERATURE
        self.max_tokens = settings.OPENAI_MAX_TOKENS
        self.timeout = settings.OPENAI_TIMEOUT
    
    async def parse_intent(self, query: str) -> Dict[str, Any]:
        """Parse user intent from natural language query"""
        
        # Skip OpenAI if not available
        if not self.openai_available:
            logger.info("Using fallback intent parsing - OpenAI not available")
            return self._fallback_intent_parsing(query)
        
        system_prompt = """
        You are an expert at understanding user intents for SQL database queries.
        Analyze the user's natural language query and determine their intent.
        
        Possible intents include:
        - SELECT: User wants to retrieve data
        - INSERT: User wants to add new data
        - UPDATE: User wants to modify existing data
        - DELETE: User wants to remove data
        - AGGREGATE: User wants summary statistics (count, sum, avg, etc.)
        - JOIN: User wants to combine data from multiple tables
        - FILTER: User wants to filter data based on conditions
        - SORT: User wants to order results
        - SCHEMA: User wants to understand database structure
        
        Return a JSON object with:
        - intent: the primary intent
        - confidence: confidence score (0-1)
        - entities: relevant entities mentioned
        - metadata: additional context
        """
        
        user_prompt = f"Query: {query}"
        
        try:
            # Add timeout for the OpenAI call
            response = await asyncio.wait_for(
                self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=self.temperature,
                    max_tokens=self.max_tokens
                ),
                timeout=self.timeout
            )
            
            result = json.loads(response.choices[0].message.content)
            logger.info("Intent parsed successfully", intent=result.get("intent"))
            return result
            
        except asyncio.TimeoutError:
            logger.error("OpenAI request timed out", timeout=self.timeout)
            return self._fallback_intent_parsing(query)
        except Exception as e:
            logger.error("Error parsing intent", error=str(e), error_type=type(e).__name__)
            # Fallback to simple pattern matching
            return self._fallback_intent_parsing(query)
    
    async def extract_entities(self, query: str, schema_context: Optional[Dict] = None) -> List[Dict[str, Any]]:
        """Extract entities from natural language query"""
        
        # Skip OpenAI if not available
        if not self.openai_available:
            logger.info("Using fallback entity extraction - OpenAI not available")
            return self._fallback_entity_extraction(query)
        
        schema_info = ""
        if schema_context:
            schema_info = f"Available tables and columns: {json.dumps(schema_context, indent=2)}"
        
        system_prompt = f"""
        You are an expert at extracting entities from natural language database queries.
        Extract relevant entities that would be useful for SQL generation.
        
        {schema_info}
        
        Entity types to look for:
        - TABLE_NAME: Table names mentioned or implied
        - COLUMN_NAME: Column names mentioned or implied
        - VALUE: Specific values to filter by
        - OPERATOR: Comparison operators (=, >, <, LIKE, etc.)
        - AGGREGATE_FUNCTION: Functions like COUNT, SUM, AVG, etc.
        - DATE_RANGE: Date or time ranges
        - NUMERIC_VALUE: Numbers mentioned
        - TEXT_VALUE: Text strings to search for
        
        Return a JSON array of entities with:
        - type: entity type
        - value: entity value
        - confidence: confidence score (0-1)
        - position: position in original text
        """
        
        user_prompt = f"Query: {query}"
        
        try:
            response = await asyncio.wait_for(
                self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=self.temperature,
                    max_tokens=self.max_tokens
                ),
                timeout=self.timeout
            )
            
            entities = json.loads(response.choices[0].message.content)
            logger.info("Entities extracted successfully", count=len(entities))
            return entities
            
        except asyncio.TimeoutError:
            logger.error("OpenAI request timed out for entity extraction", timeout=self.timeout)
            return self._fallback_entity_extraction(query)
        except Exception as e:
            logger.error("Error extracting entities", error=str(e), error_type=type(e).__name__)
            return self._fallback_entity_extraction(query)
    
    async def generate_sql(
        self,
        natural_language_query: str,
        schema_context: Optional[Dict] = None,
        conversation_history: Optional[List[Dict]] = None,
        user_preferences: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """Generate SQL query from natural language"""
        
        # Skip OpenAI if not available
        if not self.openai_available:
            logger.info("Using fallback SQL generation - OpenAI not available")
            return self._fallback_sql_generation(natural_language_query)
        
        schema_info = ""
        if schema_context:
            schema_info = f"""
            Database Schema:
            {json.dumps(schema_context, indent=2)}
            """
        
        history_info = ""
        if conversation_history:
            history_info = f"""
            Previous conversation:
            {json.dumps(conversation_history[-3:], indent=2)}  # Last 3 exchanges
            """
        
        preferences_info = ""
        if user_preferences:
            preferences_info = f"""
            User preferences:
            {json.dumps(user_preferences, indent=2)}
            """
        
        system_prompt = f"""
        You are an expert SQL developer. Convert natural language queries to SQL.
        
        {schema_info}
        {history_info}
        {preferences_info}
        
        Guidelines:
        1. Generate safe, parameterized SQL queries
        2. Use proper SQL syntax and best practices
        3. Include appropriate JOINs when querying multiple tables
        4. Use meaningful aliases for readability
        5. Add LIMIT clauses for large result sets
        6. Handle edge cases and potential errors
        
        Return a JSON object with:
        - sql_query: the generated SQL query
        - explanation: human-readable explanation of what the query does
        - confidence: confidence score (0-1)
        - suggested_modifications: array of suggested improvements
        - metadata: additional information (execution_notes, performance_tips, etc.)
        
        IMPORTANT: 
        - Never generate queries that could be destructive without explicit confirmation
        - Always validate table and column names against the schema
        - Use proper escaping and parameterization
        """
        
        user_prompt = f"Convert this to SQL: {natural_language_query}"
        
        try:
            response = await asyncio.wait_for(
                self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=self.temperature,
                    max_tokens=self.max_tokens
                ),
                timeout=self.timeout
            )
            
            result = json.loads(response.choices[0].message.content)
            
            # Validate and sanitize the SQL
            result["sql_query"] = self._sanitize_sql(result["sql_query"])
            
            logger.info("SQL generated successfully", query_length=len(result["sql_query"]))
            return result
            
        except asyncio.TimeoutError:
            logger.error("OpenAI request timed out for SQL generation", timeout=self.timeout)
            return self._fallback_sql_generation(natural_language_query)
        except Exception as e:
            logger.error("Error generating SQL", error=str(e), error_type=type(e).__name__)
            return self._fallback_sql_generation(natural_language_query)
    
    def _sanitize_sql(self, sql_query: str) -> str:
        """Sanitize SQL query for safety"""
        # Remove potentially dangerous keywords
        dangerous_keywords = [
            "DROP", "DELETE", "TRUNCATE", "ALTER", "CREATE", "GRANT", "REVOKE"
        ]
        
        # Check for dangerous patterns
        sql_upper = sql_query.upper()
        for keyword in dangerous_keywords:
            if keyword in sql_upper:
                logger.warning("Potentially dangerous SQL detected", keyword=keyword)
                # Could implement more sophisticated validation here
        
        return sql_query.strip()
    
    def _fallback_intent_parsing(self, query: str) -> Dict[str, Any]:
        """Fallback intent parsing using simple patterns"""
        query_lower = query.lower()
        
        if any(word in query_lower for word in ["show", "list", "get", "find", "select"]):
            intent = "SELECT"
        elif any(word in query_lower for word in ["add", "insert", "create"]):
            intent = "INSERT"
        elif any(word in query_lower for word in ["update", "change", "modify"]):
            intent = "UPDATE"
        elif any(word in query_lower for word in ["delete", "remove"]):
            intent = "DELETE"
        elif any(word in query_lower for word in ["count", "sum", "average", "total"]):
            intent = "AGGREGATE"
        else:
            intent = "SELECT"  # Default to SELECT
        
        return {
            "intent": intent,
            "confidence": 0.7,
            "entities": [],
            "metadata": {"fallback": True}
        }
    
    def _fallback_entity_extraction(self, query: str) -> List[Dict[str, Any]]:
        """Fallback entity extraction using simple patterns"""
        entities = []
        
        # Extract numbers
        numbers = re.findall(r'\b\d+\b', query)
        for num in numbers:
            entities.append({
                "type": "NUMERIC_VALUE",
                "value": int(num),
                "confidence": 0.8,
                "position": query.find(num)
            })
        
        # Extract quoted strings
        quoted_strings = re.findall(r'"([^"]*)"', query) + re.findall(r"'([^']*)'", query)
        for string in quoted_strings:
            entities.append({
                "type": "TEXT_VALUE",
                "value": string,
                "confidence": 0.9,
                "position": query.find(string)
            })
        
        return entities
    
    def _fallback_sql_generation(self, query: str) -> Dict[str, Any]:
        """Fallback SQL generation for simple cases"""
        query_lower = query.lower()
        
        # Try to generate more intelligent fallback queries
        if "people" in query_lower or "users" in query_lower:
            if "first" in query_lower or "10" in query_lower or "limit" in query_lower:
                sql_query = "SELECT * FROM users LIMIT 10;"
                explanation = "Retrieves the first 10 records from the users table"
            else:
                sql_query = "SELECT * FROM users;"
                explanation = "Retrieves all records from the users table"
        elif "count" in query_lower:
            sql_query = "SELECT COUNT(*) FROM users;"
            explanation = "Counts the total number of records in the users table"
        elif "products" in query_lower:
            sql_query = "SELECT * FROM products LIMIT 10;"
            explanation = "Retrieves the first 10 products from the products table"
        elif "orders" in query_lower:
            sql_query = "SELECT * FROM orders LIMIT 10;"
            explanation = "Retrieves the first 10 orders from the orders table"
        else:
            sql_query = "SELECT * FROM users LIMIT 10;"
            explanation = "Default query - please provide more specific requirements or check OpenAI API configuration"
        
        return {
            "sql_query": sql_query,
            "explanation": explanation,
            "confidence": 0.6,
            "suggested_modifications": [
                "Specify exact table and column names",
                "Add WHERE conditions for filtering",
                "Consider JOIN operations if multiple tables are needed",
                "Check OpenAI API key configuration for better results"
            ],
            "metadata": {
                "fallback": True,
                "reason": "OpenAI API unavailable or timed out"
            }
        }
