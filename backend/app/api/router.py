"""
Main API router
"""

from fastapi import APIRouter
from app.api.endpoints import nlp, query, schema, chat, suggestions

api_router = APIRouter()

# Include endpoint routers
api_router.include_router(nlp.router, prefix="/nlp", tags=["Natural Language Processing"])
api_router.include_router(query.router, prefix="/query", tags=["Query Execution"])
api_router.include_router(schema.router, prefix="/schema", tags=["Schema Management"])
api_router.include_router(chat.router, prefix="/chat", tags=["Chat Interface"])
api_router.include_router(suggestions.router, prefix="/suggestions", tags=["Suggestions"])
