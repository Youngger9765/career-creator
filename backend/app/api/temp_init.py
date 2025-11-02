"""
TEMPORARY ENDPOINT - 僅用於初始化 Production 環境
使用後應立即刪除此檔案
"""

import os

from fastapi import APIRouter, Body, Depends, HTTPException
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.security import get_password_hash
from app.models.user import User

router = APIRouter(prefix="/api/temp", tags=["temporary"])

# 安全密鑰 - 必須提供才能執行
TEMP_INIT_SECRET = os.getenv("TEMP_INIT_SECRET", "")


@router.post("/init-admin")
def init_admin(secret: str = Body(..., embed=True), db: Session = Depends(get_session)):
    """
    臨時端點：建立 admin 帳號

    使用方式:
    POST /api/temp/init-admin
    {"secret": "your-secret-key"}

    ⚠️ 使用後請立即刪除此檔案並重新部署
    """
    # 驗證密鑰
    if not TEMP_INIT_SECRET or secret != TEMP_INIT_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret")

    # 檢查 admin 是否已存在
    existing_admin = db.exec(
        select(User).where(User.email == "demo.admin@example.com")
    ).first()

    if existing_admin:
        return {"status": "exists", "message": "Admin already exists"}

    # 建立 admin 帳號
    admin_user = User(
        email="demo.admin@example.com",
        name="Demo Admin",
        hashed_password=get_password_hash("demo123"),
        roles=["admin", "counselor"],
    )

    db.add(admin_user)
    db.commit()
    db.refresh(admin_user)

    return {
        "status": "created",
        "message": "Admin account created successfully",
        "email": "demo.admin@example.com",
        "password": "demo123",
    }


@router.post("/create-test-users")
def create_test_users(
    secret: str = Body(...),
    count: int = Body(...),
    db: Session = Depends(get_session),
):
    """
    臨時端點：批次建立測試使用者

    使用方式:
    POST /api/temp/create-test-users
    {"secret": "your-secret-key", "count": 100}

    ⚠️ 使用後請立即刪除此檔案並重新部署
    """
    # 驗證密鑰
    if not TEMP_INIT_SECRET or secret != TEMP_INIT_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret")

    if count > 200:
        raise HTTPException(status_code=400, detail="Count too large (max 200)")

    created = 0
    skipped = 0

    for i in range(count):
        email = f"test.user{i}@example.com"

        # 檢查是否已存在
        existing = db.exec(select(User).where(User.email == email)).first()
        if existing:
            skipped += 1
            continue

        # 建立使用者
        user = User(
            email=email,
            name=f"Test User {i}",
            hashed_password=get_password_hash("TestPassword123!"),
            roles=["counselor"],
        )
        db.add(user)
        created += 1

    db.commit()

    return {
        "status": "completed",
        "created": created,
        "skipped": skipped,
        "total": created + skipped,
    }


@router.delete("/cleanup-test-users")
def cleanup_test_users(
    secret: str = Body(..., embed=True), db: Session = Depends(get_session)
):
    """
    臨時端點：清理所有測試使用者

    使用方式:
    DELETE /api/temp/cleanup-test-users
    {"secret": "your-secret-key"}

    ⚠️ 使用後請立即刪除此檔案並重新部署
    """
    # 驗證密鑰
    if not TEMP_INIT_SECRET or secret != TEMP_INIT_SECRET:
        raise HTTPException(status_code=403, detail="Invalid secret")

    # 刪除所有 test.user* 帳號
    deleted = 0
    for i in range(200):  # 清理 0-199
        email = f"test.user{i}@example.com"
        user = db.exec(select(User).where(User.email == email)).first()
        if user:
            db.delete(user)
            deleted += 1

    # 也刪除 loadtest.admin
    loadtest_admin = db.exec(
        select(User).where(User.email == "loadtest.admin@example.com")
    ).first()
    if loadtest_admin:
        db.delete(loadtest_admin)
        deleted += 1

    db.commit()

    return {"status": "completed", "deleted": deleted}
