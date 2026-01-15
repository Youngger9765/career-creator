#!/usr/bin/env python3
"""
Seed Demo Consultation Records for Dr. Sarah Chen

Creates minimal but realistic consultation records for demo purposes.
Supports both staging and production environments.
"""

import os
import random
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import List
from uuid import UUID, uuid4

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy.exc import SQLAlchemyError
from sqlmodel import Session, select

from app.core.config import settings
from app.core.database import engine
from app.models.client import Client, ConsultationRecord, RoomClient
from app.models.counselor_note import CounselorNote

# GameRuleTemplate not needed - frontend loads cards from JSON
from app.models.room import Room
from app.models.user import User

# Dr. Sarah Chen's UUID (from DEMO_ACCOUNT_UUIDS)
DR_SARAH_CHEN_UUID = UUID("00000000-0000-0000-0001-000000000001")
DR_SARAH_CHEN_EMAIL = "demo.counselor@example.com"

# Fake demo clients
DEMO_CLIENTS = [
    {
        "name": "張小明",
        "email": "zhang.xiaoming.demo@example.com",
        "phone": "0912-345-001",
        "age": 25,
        "occupation": "軟體工程師",
        "tags": ["職涯轉換", "技術背景", "25-30歲"],
    },
    {
        "name": "李小華",
        "email": "li.xiaohua.demo@example.com",
        "phone": "0912-345-002",
        "age": 30,
        "occupation": "產品經理",
        "tags": ["管理職探索", "跨領域", "30-35歲"],
    },
    {
        "name": "王小美",
        "email": "wang.xiaomei.demo@example.com",
        "phone": "0912-345-003",
        "age": 28,
        "occupation": "UI設計師",
        "tags": ["創意產業", "設計背景", "25-30歲"],
    },
]

# Realistic Chinese consultation notes (100-150 characters each)
CONSULTATION_NOTES_TEMPLATES = [
    "今日諮詢中，案主展現出對探索新職涯方向的強烈意願。透過性格分析卡，發現其 RIASEC 偏向 I 型（調查型）和 A 型（藝術型），建議可考慮 UX 研究或使用者體驗設計相關職位。後續將安排職能盤點，協助釐清核心優勢。",
    "本次使用優劣勢分析法，案主自評在溝通能力和團隊協作上表現優異，但對數據分析工具較不熟悉。建議可透過線上課程補強技術能力，同時善用其軟實力優勢。案主對此方向表示認同，預計兩週後追蹤學習進度。",
    "職能盤點後發現案主具備跨領域整合能力，過往經驗橫跨行銷、專案管理與產品開發。建議朝產品經理方向發展，善用其多元背景優勢。案主對此建議表現出高度興趣，將協助準備相關職位的面試技巧。",
    "透過價值觀卡牌探索，案主最重視「創意發揮」、「工作彈性」與「團隊氛圍」三項。目前工作環境較為制式，難以滿足其創意需求。建議尋找新創公司或設計顧問公司職位，將更符合其價值觀取向。",
    "本週諮詢聚焦於職涯定位問題。案主在技術與管理間猶豫不決，透過技能卡牌盤點，發現其技術深度足夠但更擅長溝通協調。建議可考慮技術主管或架構師等兼具技術與領導的角色，發揮其雙重優勢。",
    "案主反映工作倦怠問題，透過深度訪談發現主要來自缺乏成長空間。建議短期內可透過內部輪調或跨部門專案累積經驗，中長期則規劃轉換至更具挑戰性的職位。案主對此規劃表示認同，將於下次諮詢追蹤執行狀況。",
    "今日重點在於釐清職涯目標與現實落差。案主期望進入 AI 領域，但目前技能組合仍有不足。建議分階段準備：先累積資料分析經驗，再逐步轉向機器學習。已協助規劃三個月學習路徑，包含線上課程與實作專案。",
    "使用職業興趣卡進行探索，案主對「教育培訓」與「內容創作」展現高度興趣。目前從事軟體開發，建議可結合技術背景朝技術講師或技術寫作方向發展。案主對此方向感到驚喜，將進一步研究相關機會。",
    "本次諮詢處理求職準備議題。協助案主優化履歷，突出專案成果與量化數據。同時演練面試常見問題，加強 STAR 法則應用。案主表現進步明顯，預計下週將開始投遞目標職位。",
]

# GCS screenshot URL - single reference screenshot for all demo records
DEMO_SCREENSHOT_URL = "https://storage.googleapis.com/career-creator-screenshots-production/screenshots/00000000-0000-0000-0001-000000000001/9ce1e522-eea3-4845-b569-3eba0f53c3e7/12af68cc-5928-4795-aeb5-9fec3e94eb35.png"


def get_demo_screenshot_urls(bucket_name: str, count: int = 3) -> List[str]:
    """
    Return demo screenshot URLs.

    All consultation records will use the same reference screenshot
    to ensure consistency across staging and production environments.

    Args:
        bucket_name: GCS bucket name (unused, kept for backward compatibility)
        count: Number of screenshots (unused, kept for backward compatibility)

    Returns:
        List containing the single reference screenshot URL
    """
    return [DEMO_SCREENSHOT_URL]


def get_minimal_game_state(game_rule_slug: str) -> dict:
    """Generate minimal game state JSON for demo purposes"""
    if game_rule_slug == "basic_career":
        return {
            "selected_cards": ["tech_001", "tech_003", "design_001"],
            "timestamp": datetime.utcnow().isoformat(),
            "completion_percentage": random.randint(60, 100),
        }
    elif game_rule_slug == "basic_values":
        return {
            "selected_cards": ["value_001", "value_002", "value_005"],
            "timestamp": datetime.utcnow().isoformat(),
            "completion_percentage": random.randint(70, 100),
        }
    elif game_rule_slug == "basic_skills":
        return {
            "selected_cards": ["skill_001", "skill_003", "skill_007"],
            "timestamp": datetime.utcnow().isoformat(),
            "completion_percentage": random.randint(65, 100),
        }
    return {}


def verify_counselor_exists(session: Session) -> bool:
    """Verify Dr. Sarah Chen exists in database"""
    # Use text query to avoid schema mismatch issues
    from sqlalchemy import text

    result = session.exec(
        text("SELECT id, email, name, roles FROM users WHERE id = :user_id"),
        params={"user_id": str(DR_SARAH_CHEN_UUID)},
    ).first()

    if not result:
        print(f"❌ Error: Counselor {DR_SARAH_CHEN_EMAIL} not found in database")
        print(f"   Expected UUID: {DR_SARAH_CHEN_UUID}")
        return False

    print(f"✓ Found counselor: {result[2]} ({result[1]})")
    return True


def create_demo_clients(session: Session) -> List[Client]:
    """Create demo clients if they don't exist"""
    created_clients = []

    for client_data in DEMO_CLIENTS:
        # Check if client already exists
        existing = session.exec(
            select(Client).where(
                Client.email == client_data["email"],
                Client.counselor_id == DR_SARAH_CHEN_UUID,
            )
        ).first()

        if existing:
            print(
                f"  → Client '{client_data['name']}' already exists, using existing record"
            )
            created_clients.append(existing)
            continue

        client = Client(
            counselor_id=DR_SARAH_CHEN_UUID,
            email=client_data["email"],
            name=client_data["name"],
            phone=client_data["phone"],
            notes=f"{client_data['occupation']}，{client_data['age']}歲",
            tags=client_data["tags"],
            email_verified=False,
        )
        session.add(client)
        created_clients.append(client)
        print(f"  → Created client: {client_data['name']}")

    return created_clients


def create_demo_rooms(session: Session, clients: List[Client]) -> List[Room]:
    """Create 3 rooms for demo clients"""
    rooms = []

    room_names = [
        "職業探索諮詢室",
        "價值觀探索室",
        "職能盤點室",
    ]

    for idx in range(3):
        # Use rotating client assignment
        client = clients[idx % len(clients)]

        room = Room(
            counselor_id=DR_SARAH_CHEN_UUID,
            name=room_names[idx],
            description=f"為 {client.name} 提供的諮詢空間",
            game_rule_id=None,  # No game rule dependency
            card_deck_id=None,  # No deck dependency
            is_active=True,
            session_count=0,
        )
        session.add(room)
        session.flush()  # Get room ID

        # Associate client with room
        room_client = RoomClient(
            room_id=room.id,
            client_id=client.id,
        )
        session.add(room_client)

        rooms.append(room)
        print(f"  → Created room: {room.name} (client: {client.name})")

    return rooms


def create_consultation_records(
    session: Session, rooms: List[Room], bucket_name: str
) -> List[ConsultationRecord]:
    """Create 6-9 consultation records across rooms"""
    records = []
    total_records = random.randint(6, 9)

    # Distribute records across rooms
    for i in range(total_records):
        room = rooms[i % len(rooms)]

        # Get client associated with this room
        room_client = session.exec(
            select(RoomClient).where(RoomClient.room_id == room.id)
        ).first()

        if not room_client:
            print(
                f"  ⚠️  Warning: No client found for room {room.name}, skipping record"
            )
            continue

        # Generate random session date in past 2 months
        days_ago = random.randint(1, 60)
        session_date = datetime.utcnow() - timedelta(days=days_ago)

        record = ConsultationRecord(
            room_id=room.id,
            client_id=room_client.client_id,
            counselor_id=DR_SARAH_CHEN_UUID,
            session_date=session_date,
            duration_minutes=random.randint(45, 90),
            screenshots=get_demo_screenshot_urls(
                bucket_name
            ),  # All use same reference screenshot
            game_state=get_minimal_game_state("basic_career"),
            topics=random.sample(
                ["職涯定位", "技能盤點", "價值觀探索", "求職準備", "面試技巧", "職場適應"],
                k=random.randint(2, 3),
            ),
            notes=random.choice(CONSULTATION_NOTES_TEMPLATES),
            follow_up_required=random.choice([True, False]),
            follow_up_date=None,
        )
        session.add(record)
        records.append(record)

        # Update room session count
        room.session_count += 1

    print(f"  → Created {len(records)} consultation records")
    return records


def create_counselor_notes(session: Session, rooms: List[Room]) -> List[CounselorNote]:
    """Create counselor notes for each room"""
    notes = []

    note_templates = [
        "案主在職涯探索上展現高度投入，目前主要困擾為技術與管理職涯路徑選擇。已協助分析個人優勢與市場趨勢，建議先累積技術深度再轉管理。後續需追蹤執行狀況。",
        "透過多次諮詢觀察，案主的核心價值觀與目前工作環境有明顯落差。建議優先釐清個人價值觀排序，再據此篩選目標產業與公司文化。下次諮詢將聚焦於行動計畫擬定。",
        "案主具備良好的學習能力與適應力，主要挑戰在於缺乏明確職涯目標。已使用職能卡牌協助盤點現有能力，發現其跨領域整合能力突出。建議朝產品或專案管理方向發展。",
    ]

    for idx, room in enumerate(rooms):
        note = CounselorNote(
            room_id=room.id,
            content=note_templates[idx % len(note_templates)],
        )
        session.add(note)
        notes.append(note)

    print(f"  → Created {len(notes)} counselor notes")
    return notes


def rollback_seed_data(session: Session) -> None:
    """Rollback function to clean up demo data if needed"""
    print("\n🗑️  Rollback Mode: Removing demo consultation data...")

    # Delete consultation records
    records = session.exec(
        select(ConsultationRecord).where(
            ConsultationRecord.counselor_id == DR_SARAH_CHEN_UUID
        )
    ).all()
    for record in records:
        session.delete(record)
    print(f"  → Deleted {len(records)} consultation records")

    # Delete counselor notes for demo rooms
    rooms = session.exec(
        select(Room).where(Room.counselor_id == DR_SARAH_CHEN_UUID)
    ).all()
    for room in rooms:
        note = session.exec(
            select(CounselorNote).where(CounselorNote.room_id == room.id)
        ).first()
        if note:
            session.delete(note)

    # Delete room-client associations
    for room in rooms:
        associations = session.exec(
            select(RoomClient).where(RoomClient.room_id == room.id)
        ).all()
        for assoc in associations:
            session.delete(assoc)

    # Delete rooms
    for room in rooms:
        session.delete(room)
    print(f"  → Deleted {len(rooms)} rooms")

    # Delete demo clients
    clients = session.exec(
        select(Client).where(
            Client.counselor_id == DR_SARAH_CHEN_UUID,
            Client.email.in_([c["email"] for c in DEMO_CLIENTS]),
        )
    ).all()
    for client in clients:
        session.delete(client)
    print(f"  → Deleted {len(clients)} clients")

    session.commit()
    print("✅ Rollback completed successfully")


def main(environment: str = "staging", rollback: bool = False):
    """Main seed function"""
    print(f"\n{'='*60}")
    print(f"🌱 Seed Demo Consultation Records for Dr. Sarah Chen")
    print(f"{'='*60}")
    print(f"Environment: {environment.upper()}")
    print(f"Bucket: {settings.gcs_bucket_name}")
    print(
        f"Database: {settings.database_url.split('@')[1].split('/')[0] if '@' in settings.database_url else 'unknown'}"
    )
    print(f"{'='*60}\n")

    if rollback:
        with Session(engine) as session:
            rollback_seed_data(session)
        return

    try:
        with Session(engine) as session:
            # Step 1: Verify counselor exists
            print("Step 1: Verifying counselor account...")
            if not verify_counselor_exists(session):
                return

            # Step 2: Create demo clients
            print("\nStep 2: Creating demo clients...")
            clients = create_demo_clients(session)
            session.commit()
            print(f"✓ {len(clients)} clients ready")

            # Step 3: Create rooms with different game rules
            print("\nStep 3: Creating rooms...")
            rooms = create_demo_rooms(session, clients)
            session.commit()
            print(f"✓ {len(rooms)} rooms created")

            # Step 4: Create consultation records
            print("\nStep 4: Creating consultation records...")
            records = create_consultation_records(
                session, rooms, settings.gcs_bucket_name
            )
            session.commit()
            print(f"✓ {len(records)} records created")

            # Step 5: Create counselor notes
            print("\nStep 5: Creating counselor notes...")
            notes = create_counselor_notes(session, rooms)
            session.commit()
            print(f"✓ {len(notes)} notes created")

            # Verification query
            print("\n" + "=" * 60)
            print("📊 Verification Results")
            print("=" * 60)

            total_records = session.exec(
                select(ConsultationRecord).where(
                    ConsultationRecord.counselor_id == DR_SARAH_CHEN_UUID
                )
            ).all()

            print(f"Total consultation records: {len(total_records)}")
            print(f"Total rooms: {len(rooms)}")
            print(f"Total clients: {len(clients)}")
            print(f"Total counselor notes: {len(notes)}")

            print("\n✅ Seed completed successfully!")
            print(f"\n💡 To verify in database:")
            print(
                f"   SELECT * FROM consultation_records WHERE counselor_id = '{DR_SARAH_CHEN_UUID}';"
            )
            print(f"\n🔄 To rollback this seed:")
            print(f"   python scripts/seed_demo_consultation_records.py --rollback")

    except SQLAlchemyError as e:
        print(f"\n❌ Database error: {e}")
        raise
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        raise


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Seed demo consultation records")
    parser.add_argument(
        "--env",
        choices=["staging", "production"],
        default="staging",
        help="Target environment (default: staging)",
    )
    parser.add_argument(
        "--rollback",
        action="store_true",
        help="Remove demo data instead of creating it",
    )

    args = parser.parse_args()

    # Safety check for production
    if args.env == "production" and not args.rollback:
        confirm = input(
            "\n⚠️  WARNING: You are about to seed PRODUCTION database.\n"
            "   Type 'CONFIRM' to proceed: "
        )
        if confirm != "CONFIRM":
            print("Aborted.")
            sys.exit(0)

    main(environment=args.env, rollback=args.rollback)
