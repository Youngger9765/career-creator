import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.admin import router as admin_router
from app.api.auth import router as auth_router
from app.api.clients import router as clients_router
from app.api.counselor_notes import router as counselor_notes_router
from app.api.file_uploads import router as file_uploads_router
from app.api.game_rules import router as game_rules_router
from app.api.gameplay_states import router as gameplay_states_router
from app.api.qa_feedback import router as qa_feedback_router
from app.api.rooms import router as rooms_router
from app.api.visitors import router as visitors_router
from app.core.config import settings

# Import models to ensure they are registered with SQLModel
from app.models.game_rule import Card, CardDeck, GameRuleTemplate  # noqa: F401
from app.models.gameplay_state import GameplayState  # noqa: F401
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
        "https://career-creator-frontend-production-x43mdhfwsq-de.a.run.app",
        "https://career-creator-frontend-production-849078733818.asia-east1.run.app",
        "null",  # Allow local file:// access for QA HTML
    ]
    allow_credentials = True
elif settings.environment == "staging":
    origins = [
        "https://career-creator-frontend-staging-x43mdhfwsq-de.a.run.app",
        "https://career-creator-frontend-staging-849078733818.asia-east1.run.app",
        "http://localhost:3000",  # Allow local development
        "http://localhost:3001",  # Alternative dev port
        "null",  # Allow local file:// access for QA HTML
    ]
    allow_credentials = True
else:
    # Development: Allow local development ports
    origins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:3003",
        "http://127.0.0.1:3004",
    ]
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(rooms_router)
app.include_router(visitors_router)
app.include_router(game_rules_router, prefix="/api/game-rules", tags=["game-rules"])
app.include_router(admin_router)
app.include_router(clients_router)
app.include_router(counselor_notes_router, prefix="/api")
app.include_router(gameplay_states_router, prefix="/api")
app.include_router(file_uploads_router)
app.include_router(qa_feedback_router)

# Mount static files for uploaded screenshots (development only)
if os.path.exists("uploads"):
    app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


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


@app.get("/debug/db-pool")
async def debug_db_pool():
    """Diagnose database connection pool status (staging only)"""
    if settings.environment not in ["staging", "development"]:
        return {"error": "Only available in staging/development"}

    from app.core.database import engine

    try:
        pool = engine.pool
        return {
            "pool_size": pool.size(),
            "checked_in": pool.checkedin(),
            "checked_out": pool.checkedout(),
            "overflow": pool.overflow(),
            "max_overflow": engine.pool._max_overflow,
            "total_capacity": pool.size() + engine.pool._max_overflow,
        }
    except Exception as e:
        return {"error": str(e)}


@app.get("/debug/db-test")
async def debug_db_test():
    """Test actual database connection (staging only)"""
    if settings.environment not in ["staging", "development"]:
        return {"error": "Only available in staging/development"}

    import time
    import traceback

    from app.core.database import engine

    start = time.time()
    try:
        # Try to execute a simple query
        with engine.connect() as conn:
            result = conn.execute("SELECT 1 as test")
            row = result.fetchone()
            duration = time.time() - start
            return {
                "status": "success",
                "query_result": row[0] if row else None,
                "duration_ms": round(duration * 1000, 2),
            }
    except Exception as e:
        duration = time.time() - start
        return {
            "status": "failed",
            "error": str(e),
            "error_type": type(e).__name__,
            "duration_ms": round(duration * 1000, 2),
            "traceback": traceback.format_exc(),
        }
