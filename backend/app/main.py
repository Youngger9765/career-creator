from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.api.rooms import router as rooms_router
from app.api.auth import router as auth_router

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

@app.get("/")
async def root():
    return {"message": "Career Creator API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "environment": settings.environment}