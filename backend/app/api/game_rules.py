"""
Game Rules API - 遊戲規則 API 端點 (Application Layer)

根據 ARCHITECTURE.md 三層架構設計，提供遊戲規則選擇和管理功能
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.auth import get_current_user_from_token
from app.core.database import get_session
from app.core.roles import Permission, has_permission
from app.models.game_rule import GameRuleTemplate
from app.models.user import User

router = APIRouter()


@router.get("/")
async def list_game_rules():
    """
    獲取所有可用的遊戲規則

    返回系統內建的三種遊戲規則類型及其配置
    這個端點不需要認證，因為遊戲規則是公開資訊
    """
    from app.game.config import GameRuleConfig

    skill_config = GameRuleConfig.get_skill_assessment_config()
    value_config = GameRuleConfig.get_value_navigation_config()
    career_config = GameRuleConfig.get_career_personality_config()

    rules = [
        {
            "id": "skill_assessment",
            "slug": "skill_assessment",
            "name": "職能盤點卡",
            "description": "評估個人專業技能優勢與待改善領域",
            "version": "1.0",
            "layout_config": skill_config.layout.to_dict(),
            "constraint_config": skill_config.constraints.to_dict(),
            "is_active": True,
        },
        {
            "id": "value_navigation",
            "slug": "value_navigation",
            "name": "價值導航卡",
            "description": "探索個人價值觀與人生重要性排序",
            "version": "1.0",
            "layout_config": value_config.layout.to_dict(),
            "constraint_config": value_config.constraints.to_dict(),
            "is_active": True,
        },
        {
            "id": "career_personality",
            "slug": "career_personality",
            "name": "職游旅人卡",
            "description": "發現職業興趣偏好與性格特質",
            "version": "1.0",
            "layout_config": career_config.layout.to_dict(),
            "constraint_config": career_config.constraints.to_dict(),
            "is_active": True,
        },
    ]

    return rules


@router.get("/{rule_id}")
async def get_game_rule(rule_id: str):
    """
    獲取特定遊戲規則的詳細配置

    根據規則ID返回對應的遊戲規則配置
    """
    from app.game.config import GameRuleConfig

    if rule_id == "skill_assessment":
        config = GameRuleConfig.get_skill_assessment_config()
        return {
            "id": "skill_assessment",
            "slug": "skill_assessment",
            "name": "職能盤點卡",
            "description": "評估個人專業技能優勢與待改善領域",
            "version": "1.0",
            "layout_config": config.layout.to_dict(),
            "constraint_config": config.constraints.to_dict(),
            "is_active": True,
        }
    elif rule_id == "value_navigation":
        config = GameRuleConfig.get_value_navigation_config()
        return {
            "id": "value_navigation",
            "slug": "value_navigation",
            "name": "價值導航卡",
            "description": "探索個人價值觀與人生重要性排序",
            "version": "1.0",
            "layout_config": config.layout.to_dict(),
            "constraint_config": config.constraints.to_dict(),
            "is_active": True,
        }
    elif rule_id == "career_personality":
        config = GameRuleConfig.get_career_personality_config()
        return {
            "id": "career_personality",
            "slug": "career_personality",
            "name": "職游旅人卡",
            "description": "發現職業興趣偏好與性格特質",
            "version": "1.0",
            "layout_config": config.layout.to_dict(),
            "constraint_config": config.constraints.to_dict(),
            "is_active": True,
        }
    else:
        raise HTTPException(status_code=404, detail="Game rule not found")


@router.get("/by-slug/{slug}")
async def get_game_rule_by_slug(slug: str):
    """
    根據slug獲取遊戲規則

    slug即規則的標識符，與ID相同
    """
    return await get_game_rule(slug)


@router.get("/templates", response_model=List[GameRuleTemplate])
async def list_game_rule_templates(
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token),
):
    """
    獲取可用的遊戲規則模板列表

    只有諮詢師可以查看和選擇遊戲規則
    """
    # Check permission
    if not has_permission(current_user, Permission.MANAGE_ROOM):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    statement = (
        select(GameRuleTemplate)
        .where(GameRuleTemplate.is_active)
        .order_by(GameRuleTemplate.name)
    )

    templates = session.exec(statement).all()
    return templates


@router.get("/templates/{template_id}", response_model=GameRuleTemplate)
async def get_game_rule_template(
    template_id: UUID,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_user_from_token),
):
    """
    獲取特定遊戲規則模板的詳細資訊

    包括完整的配置、約束和UI設定
    """
    # Check permission
    if not has_permission(current_user, Permission.MANAGE_ROOM):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    statement = select(GameRuleTemplate).where(
        GameRuleTemplate.id == template_id, GameRuleTemplate.is_active
    )

    template = session.exec(statement).first()
    if not template:
        raise HTTPException(status_code=404, detail="Game rule template not found")

    return template


@router.get("/types")
async def list_game_rule_types():
    """
    獲取支援的遊戲規則類型列表 (靜態配置)

    返回系統內建的三種遊戲規則類型及其基本資訊
    """
    # TODO: Re-enable permission check after testing
    # if not has_permission(current_user, Permission.MANAGE_ROOM):
    #     raise HTTPException(status_code=403, detail="Insufficient permissions")

    from app.game.config import GameRuleConfig

    rule_types = [
        {
            "id": "skill_assessment",
            "name": "職能盤點卡",
            "description": "評估個人專業技能優勢與待改善領域",
            "zones": 2,
            "max_cards_per_zone": 5,
            "config": GameRuleConfig.get_skill_assessment_config(),
        },
        {
            "id": "value_navigation",
            "name": "價值導航卡",
            "description": "探索個人價值觀與人生重要性排序",
            "zones": 9,
            "max_cards_per_zone": 1,
            "config": GameRuleConfig.get_value_navigation_config(),
        },
        {
            "id": "career_personality",
            "name": "職游旅人卡",
            "description": "發現職業興趣偏好與性格特質",
            "zones": 3,
            "max_cards_per_zone": [20, None, 20],  # [喜歡, 中立, 討厭]
            "config": GameRuleConfig.get_career_personality_config(),
        },
    ]

    return {
        "rule_types": rule_types,
        "total": len(rule_types),
        "architecture": "three_layer_engine",
        "engine_version": "1.0",
    }
