from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.rooms import router as rooms_router
from app.api.auth import router as auth_router
from app.api.visitors import router as visitors_router
from app.api.card_events import router as card_events_router
from app.api.websocket import router as websocket_router

# Import models to ensure they are registered with SQLModel
from app.models.user import User
from app.models.room import Room
from app.models.visitor import Visitor
from app.models.card_event import CardEvent

app = FastAPI(
    title="Career Creator API",
    description="Online card consultation system for career counselors",
    version="1.0.0",
    openapi_url="/api/openapi.json" if settings.environment == "development" else None,
    docs_url="/api/docs" if settings.environment == "development" else None,
    redoc_url="/api/redoc" if settings.environment == "development" else None,
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(rooms_router)
app.include_router(visitors_router)
app.include_router(card_events_router)
app.include_router(websocket_router)

@app.get("/")
async def root():
    return {"message": "Career Creator API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "environment": settings.environment}