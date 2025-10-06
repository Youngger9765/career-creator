from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.admin import router as admin_router
from app.api.auth import router as auth_router

# from app.api.card_events import router as card_events_router  # Disabled for now
from app.api.clients import router as clients_router
from app.api.game_rules import router as game_rules_router

# from app.api.game_sessions import router as game_sessions_router  # Disabled for now
from app.api.rooms import router as rooms_router
from app.api.visitors import router as visitors_router
from app.core.config import settings

# Import models to ensure they are registered with SQLModel
# from app.models.card_event import CardEvent  # noqa: F401  # Disabled for now
from app.models.game_rule import Card, CardDeck, GameRuleTemplate  # noqa: F401

# Disabled for now
# from app.models.game_state import (  # noqa: F401
#     GameActionRecord,
#     GameSession,
# )
from app.models.room import Room  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.visitor import Visitor  # noqa: F401

app = FastAPI(
    title="Career Creator API",
    description="Online card consultation system for career counselors",
    version="1.0.0",
    openapi_url="/api/openapi.json" if settings.environment == "development" else None,
    docs_url="/api/docs" if settings.environment == "development" else None,
    redoc_url="/api/redoc" if settings.environment == "development" else None,
)

# CORS middleware
# Configure CORS based on environment
if settings.environment == "production":
    origins = [
        "https://career-creator-frontend-production-990202338378.asia-east1.run.app",
    ]
elif settings.environment == "staging":
    origins = [
        "https://career-creator-frontend-staging-990202338378.asia-east1.run.app",
        "http://localhost:3000",  # Allow local development
    ]
else:
    # Development: Allow all origins for easier testing
    origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,  # Must be False when origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(rooms_router)
app.include_router(visitors_router)
# app.include_router(card_events_router)  # Disabled for now
app.include_router(game_rules_router, prefix="/api/game-rules", tags=["game-rules"])
# app.include_router(game_sessions_router)  # Disabled for now
app.include_router(admin_router)
app.include_router(clients_router)


@app.get("/")
async def root():
    return {"message": "Career Creator API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "environment": settings.environment,
        "admin_loaded": True,
    }
