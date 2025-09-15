"""
Admin API endpoints for database management
管理員 API 端點 - 資料庫管理
"""

from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import inspect, text
from sqlmodel import Session

from app.core.auth import get_current_user_from_token
from app.core.database import engine, get_session
from app.core.seeds import run_all_seeds, run_test_seeds

router = APIRouter(prefix="/api/admin", tags=["admin"])


def require_admin(current_user: dict = Depends(get_current_user_from_token)) -> dict:
    """Require admin role for access"""
    if "admin" not in (current_user.get("roles") or []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required",
        )
    return current_user


@router.get("/db/status")
def get_database_status(
    _: dict = Depends(require_admin),
    db: Session = Depends(get_session),
) -> Dict[str, Any]:
    """Get database connection status and basic info"""
    try:
        # Test connection
        result = db.execute(text("SELECT 1"))
        result.scalar()

        # Get database name
        db_name_result = db.execute(text("SELECT current_database()"))
        db_name = db_name_result.scalar()

        # Get database size
        size_result = db.execute(
            text(
                """
                SELECT pg_size_pretty(pg_database_size(current_database())) as size
            """
            )
        )
        db_size = size_result.scalar()

        return {
            "status": "connected",
            "database": db_name,
            "size": db_size,
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
        }


@router.get("/db/tables")
def list_tables(
    _: dict = Depends(require_admin),
    db: Session = Depends(get_session),
) -> List[Dict[str, Any]]:
    """List all tables with row counts"""
    try:
        # Get all table names
        inspector = inspect(engine)
        tables = inspector.get_table_names()

        table_info = []
        for table in tables:
            # Get row count for each table
            count_result = db.execute(text(f"SELECT COUNT(*) FROM {table}"))
            row_count = count_result.scalar()

            # Get column count
            columns = inspector.get_columns(table)

            table_info.append(
                {
                    "name": table,
                    "row_count": row_count,
                    "column_count": len(columns),
                }
            )

        return sorted(table_info, key=lambda x: x["name"])
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list tables: {str(e)}",
        )


@router.get("/db/table/{table_name}")
def get_table_data(
    table_name: str,
    limit: int = 100,
    offset: int = 0,
    _: dict = Depends(require_admin),
    db: Session = Depends(get_session),
) -> Dict[str, Any]:
    """Get table data with pagination"""
    try:
        # Validate table name to prevent SQL injection
        inspector = inspect(engine)
        if table_name not in inspector.get_table_names():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Table '{table_name}' not found",
            )

        # Get total count
        count_result = db.execute(text(f"SELECT COUNT(*) FROM {table_name}"))
        total_count = count_result.scalar()

        # Get columns
        columns = inspector.get_columns(table_name)
        column_names = [col["name"] for col in columns]

        # Get data with pagination
        data_result = db.execute(
            text(f"SELECT * FROM {table_name} LIMIT :limit OFFSET :offset"),
            {"limit": limit, "offset": offset},
        )
        rows = data_result.fetchall()

        # Convert rows to dictionaries
        data = []
        for row in rows:
            data.append(dict(zip(column_names, row)))

        return {
            "table": table_name,
            "columns": column_names,
            "data": data,
            "total": total_count,
            "limit": limit,
            "offset": offset,
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get table data: {str(e)}",
        )


@router.post("/db/seed")
def seed_database(
    include_test: bool = False,
    _: dict = Depends(require_admin),
) -> Dict[str, str]:
    """Seed database with initial data"""
    try:
        if include_test:
            run_all_seeds(include_test_data=True)
            message = "Database seeded with production and test data"
        else:
            run_all_seeds(include_test_data=False)
            message = "Database seeded with production data"

        return {"status": "success", "message": message}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to seed database: {str(e)}",
        )


@router.post("/db/seed/test")
def seed_test_data(
    _: dict = Depends(require_admin),
) -> Dict[str, str]:
    """Seed database with test data only"""
    try:
        run_test_seeds()
        return {
            "status": "success",
            "message": "Database seeded with test data",
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to seed test data: {str(e)}",
        )


@router.delete("/db/table/{table_name}")
def clear_table(
    table_name: str,
    _: dict = Depends(require_admin),
    db: Session = Depends(get_session),
) -> Dict[str, str]:
    """Clear all data from a specific table"""
    try:
        # Validate table name
        inspector = inspect(engine)
        if table_name not in inspector.get_table_names():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Table '{table_name}' not found",
            )

        # Don't allow clearing critical tables
        protected_tables = ["alembic_version"]
        if table_name in protected_tables:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Cannot clear protected table '{table_name}'",
            )

        # Clear the table
        db.execute(text(f"TRUNCATE TABLE {table_name} CASCADE"))
        db.commit()

        return {
            "status": "success",
            "message": f"Table '{table_name}' cleared successfully",
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to clear table: {str(e)}",
        )
