"""
Database Seeding System
資料庫種子資料系統
"""

import uuid
from datetime import date, datetime, timedelta

from sqlmodel import Session, select

from app.core.auth import DEMO_ACCOUNTS, get_password_hash
from app.core.database import engine
from app.models.client import (
    Client,
    ClientStatus,
    ConsultationRecord,
    CounselorClientRelationship,
    RelationshipStatus,
    RelationshipType,
    RoomClient,
)
from app.models.game_rule import Card, CardDeck, GameRuleTemplate
from app.models.room import Room
from app.models.user import User


def seed_demo_users():
    """創建demo用戶"""
    with Session(engine) as session:
        for demo_data in DEMO_ACCOUNTS:
            # Check if user already exists
            existing = session.exec(
                select(User).where(User.email == demo_data["email"])
            ).first()

            if not existing:
                user = User(
                    email=demo_data["email"],
                    name=demo_data["name"],
                    hashed_password=get_password_hash(demo_data["password"]),
                    roles=demo_data["roles"],
                    is_active=True,
                )
                session.add(user)

        session.commit()
        print("✅ Demo users seeded")


def seed_career_cards():
    """創建職業卡片資料"""

    # First create or get a basic game rule template
    with Session(engine) as session:
        # Create a basic game rule if it doesn't exist
        game_rule = session.exec(
            select(GameRuleTemplate).where(GameRuleTemplate.slug == "basic_career")
        ).first()

        if not game_rule:
            game_rule = GameRuleTemplate(
                name="基本職業探索規則",
                slug="basic_career",
                description="基本的職業卡片探索遊戲規則",
                version="1.0",
                layout_config={"grid": {"rows": 4, "cols": 8}},
                constraint_config={"max_selections": 10},
                validation_rules={"min_selections": 3},
                is_active=True,
            )
            session.add(game_rule)
            session.commit()
            session.refresh(game_rule)

        # Now create a career deck
        career_deck = session.exec(
            select(CardDeck).where(CardDeck.name == "職業探索卡組")
        ).first()

        if not career_deck:
            career_deck = CardDeck(
                name="職業探索卡組",
                description="包含各種職業選項的卡組，適合職涯探索",
                version="1.0",
                is_official=True,
                is_default=True,
                game_rule_id=game_rule.id,
            )
            session.add(career_deck)
            session.commit()
            session.refresh(career_deck)

    career_cards_data = [
        # 科技類
        {
            "card_key": "tech_001",
            "title": "軟體工程師",
            "description": "設計和開發軟體應用程式，解決技術問題",
            "category": "technology",
        },
        {
            "card_key": "tech_002",
            "title": "資料科學家",
            "description": "分析大數據找出商業洞察和預測模型",
            "category": "technology",
        },
        {
            "card_key": "tech_003",
            "title": "產品經理",
            "description": "規劃產品策略，協調團隊實現產品目標",
            "category": "technology",
        },
        {
            "card_key": "tech_004",
            "title": "UI/UX設計師",
            "description": "設計使用者介面和體驗，提升產品易用性",
            "category": "technology",
        },
        {
            "card_key": "tech_005",
            "title": "網路安全工程師",
            "description": "保護企業資訊安全，防範網路攻擊",
            "category": "technology",
        },
        # 商業類
        {
            "card_key": "biz_001",
            "title": "行銷經理",
            "description": "制定行銷策略，推廣產品和品牌",
            "category": "business",
        },
        {
            "card_key": "biz_002",
            "title": "業務代表",
            "description": "開發客戶關係，達成銷售目標",
            "category": "business",
        },
        {
            "card_key": "biz_003",
            "title": "財務分析師",
            "description": "分析財務數據，提供投資建議",
            "category": "business",
        },
        {
            "card_key": "biz_004",
            "title": "人力資源專員",
            "description": "招募人才，管理員工關係和福利",
            "category": "business",
        },
        {
            "card_key": "biz_005",
            "title": "專案經理",
            "description": "規劃和執行專案，確保按時按預算完成",
            "category": "business",
        },
        # 創意類
        {
            "card_key": "creative_001",
            "title": "平面設計師",
            "description": "創作視覺設計，傳達品牌訊息",
            "category": "creative",
        },
        {
            "card_key": "creative_002",
            "title": "內容創作者",
            "description": "撰寫文章、製作影片等數位內容",
            "category": "creative",
        },
        {
            "card_key": "creative_003",
            "title": "攝影師",
            "description": "拍攝照片，記錄美好瞬間和商業需求",
            "category": "creative",
        },
        {
            "card_key": "creative_004",
            "title": "影片剪輯師",
            "description": "編輯影片內容，創造吸引人的視覺故事",
            "category": "creative",
        },
        {
            "card_key": "creative_005",
            "title": "廣告創意",
            "description": "發想創意概念，製作廣告內容",
            "category": "creative",
        },
        # 教育類
        {
            "card_key": "edu_001",
            "title": "小學教師",
            "description": "教導兒童基礎知識，培養學習興趣",
            "category": "education",
        },
        {
            "card_key": "edu_002",
            "title": "企業講師",
            "description": "設計培訓課程，提升員工能力",
            "category": "education",
        },
        {
            "card_key": "edu_003",
            "title": "線上課程創作者",
            "description": "製作數位學習內容，線上教學",
            "category": "education",
        },
        {
            "card_key": "edu_004",
            "title": "職涯顧問",
            "description": "提供職業規劃建議，協助轉職發展",
            "category": "education",
        },
        {
            "card_key": "edu_005",
            "title": "學習設計師",
            "description": "設計學習體驗，優化教學效果",
            "category": "education",
        },
        # 醫療健康類
        {
            "card_key": "health_001",
            "title": "護理師",
            "description": "照護病患健康，協助醫療程序",
            "category": "healthcare",
        },
        {
            "card_key": "health_002",
            "title": "物理治療師",
            "description": "幫助患者恢復身體功能和活動能力",
            "category": "healthcare",
        },
        {
            "card_key": "health_003",
            "title": "營養師",
            "description": "設計營養計畫，促進健康飲食",
            "category": "healthcare",
        },
        {
            "card_key": "health_004",
            "title": "心理諮商師",
            "description": "提供心理支持，協助解決情緒問題",
            "category": "healthcare",
        },
        {
            "card_key": "health_005",
            "title": "牙醫助理",
            "description": "協助牙醫診療，維護口腔健康",
            "category": "healthcare",
        },
        # 服務類
        {
            "card_key": "service_001",
            "title": "客服專員",
            "description": "處理客戶問題，提供優質服務體驗",
            "category": "service",
        },
        {
            "card_key": "service_002",
            "title": "旅遊顧問",
            "description": "規劃旅遊行程，提供旅行建議",
            "category": "service",
        },
        {
            "card_key": "service_003",
            "title": "美容師",
            "description": "提供美容服務，幫助客戶提升外觀",
            "category": "service",
        },
        {
            "card_key": "service_004",
            "title": "餐廳經理",
            "description": "管理餐廳營運，確保服務品質",
            "category": "service",
        },
        {
            "card_key": "service_005",
            "title": "活動企劃",
            "description": "策劃各類活動，創造難忘體驗",
            "category": "service",
        },
        # 手工藝類
        {
            "card_key": "craft_001",
            "title": "木工師傅",
            "description": "製作木製家具和裝飾品",
            "category": "craft",
        },
        {
            "card_key": "craft_002",
            "title": "陶藝家",
            "description": "創作陶瓷藝品，表達創意想法",
            "category": "craft",
        },
        {
            "card_key": "craft_003",
            "title": "裁縫師",
            "description": "設計和製作服裝，修補衣物",
            "category": "craft",
        },
        {
            "card_key": "craft_004",
            "title": "烘焙師",
            "description": "製作麵包糕點，帶來美味享受",
            "category": "craft",
        },
        {
            "card_key": "craft_005",
            "title": "花藝師",
            "description": "設計花束裝飾，美化生活空間",
            "category": "craft",
        },
    ]

    with Session(engine) as session:
        # Create cards
        for card_data in career_cards_data:
            existing = session.exec(
                select(Card).where(
                    Card.card_key == card_data["card_key"],
                    Card.deck_id == career_deck.id,
                )
            ).first()

            if not existing:
                card = Card(
                    deck_id=career_deck.id,
                    card_key=card_data["card_key"],
                    title=card_data["title"],
                    description=card_data["description"],
                    category=card_data["category"],
                    card_metadata={
                        "tags": [card_data["category"]],
                        "difficulty": "初級",
                    },
                )
                session.add(card)

        session.commit()
        print(f"✅ {len(career_cards_data)} career cards seeded")


def seed_value_cards():
    """創建價值觀卡片資料"""

    # First create or get a basic game rule template for values
    with Session(engine) as session:
        # Create a basic game rule if it doesn't exist
        game_rule = session.exec(
            select(GameRuleTemplate).where(GameRuleTemplate.slug == "basic_values")
        ).first()

        if not game_rule:
            game_rule = GameRuleTemplate(
                name="價值觀探索規則",
                slug="basic_values",
                description="價值觀卡片探索遊戲規則",
                version="1.0",
                layout_config={"grid": {"rows": 3, "cols": 5}},
                constraint_config={"max_selections": 5},
                validation_rules={"min_selections": 3},
                is_active=True,
            )
            session.add(game_rule)
            session.commit()
            session.refresh(game_rule)

        # Now create a values deck
        values_deck = session.exec(
            select(CardDeck).where(CardDeck.name == "價值觀卡組")
        ).first()

        if not values_deck:
            values_deck = CardDeck(
                name="價值觀卡組",
                description="探索個人價值觀的卡組",
                version="1.0",
                is_official=True,
                is_default=True,
                game_rule_id=game_rule.id,
            )
            session.add(values_deck)
            session.commit()
            session.refresh(values_deck)

    value_cards_data = [
        {
            "card_key": "value_001",
            "title": "成就感",
            "description": "在工作中獲得成功和認可的滿足感",
            "category": "personal_fulfillment",
        },
        {
            "card_key": "value_002",
            "title": "創意發揮",
            "description": "有機會展現創意和想像力",
            "category": "creative_expression",
        },
        {
            "card_key": "value_003",
            "title": "工作穩定",
            "description": "擁有穩定的職業和收入保障",
            "category": "security",
        },
        {
            "card_key": "value_004",
            "title": "彈性時間",
            "description": "能夠彈性安排工作時間和地點",
            "category": "flexibility",
        },
        {
            "card_key": "value_005",
            "title": "團隊合作",
            "description": "與他人協作完成共同目標",
            "category": "collaboration",
        },
        {
            "card_key": "value_006",
            "title": "領導他人",
            "description": "引導和激勵團隊成員",
            "category": "leadership",
        },
        {
            "card_key": "value_007",
            "title": "持續學習",
            "description": "不斷獲得新知識和技能",
            "category": "growth",
        },
        {
            "card_key": "value_008",
            "title": "社會影響",
            "description": "工作能對社會產生正面影響",
            "category": "social_impact",
        },
        {
            "card_key": "value_009",
            "title": "高收入",
            "description": "獲得豐厚的經濟回報",
            "category": "financial_reward",
        },
        {
            "card_key": "value_010",
            "title": "工作生活平衡",
            "description": "工作與個人生活的良好平衡",
            "category": "life_balance",
        },
        {
            "card_key": "value_011",
            "title": "挑戰性",
            "description": "面對具有挑戰性的工作任務",
            "category": "challenge",
        },
        {
            "card_key": "value_012",
            "title": "獨立自主",
            "description": "能夠獨立決策和執行工作",
            "category": "autonomy",
        },
        {
            "card_key": "value_013",
            "title": "人際關係",
            "description": "建立良好的職場人際網絡",
            "category": "relationships",
        },
        {
            "card_key": "value_014",
            "title": "專業聲望",
            "description": "在專業領域獲得尊重和認可",
            "category": "prestige",
        },
        {
            "card_key": "value_015",
            "title": "服務他人",
            "description": "通過工作幫助和服務他人",
            "category": "service",
        },
    ]

    with Session(engine) as session:
        # Get the values deck
        values_deck = session.exec(
            select(CardDeck).where(CardDeck.name == "價值觀卡組")
        ).first()

        if not values_deck:
            print("⚠️ Values deck not found, skipping value cards")
            return

        for card_data in value_cards_data:
            existing = session.exec(
                select(Card).where(
                    Card.card_key == card_data["card_key"],
                    Card.deck_id == values_deck.id,
                )
            ).first()

            if not existing:
                card = Card(
                    deck_id=values_deck.id,
                    card_key=card_data["card_key"],
                    title=card_data["title"],
                    description=card_data["description"],
                    category=card_data["category"],
                    card_metadata={"importance_level": "high"},
                )
                session.add(card)

        session.commit()
        print(f"✅ {len(value_cards_data)} value cards seeded")


def seed_skill_cards():
    """創建技能卡片資料"""

    # First create or get a basic game rule template for skills
    with Session(engine) as session:
        # Create a basic game rule if it doesn't exist
        game_rule = session.exec(
            select(GameRuleTemplate).where(GameRuleTemplate.slug == "basic_skills")
        ).first()

        if not game_rule:
            game_rule = GameRuleTemplate(
                name="技能盤點規則",
                slug="basic_skills",
                description="技能卡片盤點遊戲規則",
                version="1.0",
                layout_config={"grid": {"rows": 3, "cols": 5}},
                constraint_config={"max_selections": 8},
                validation_rules={"min_selections": 5},
                is_active=True,
            )
            session.add(game_rule)
            session.commit()
            session.refresh(game_rule)

        # Now create a skills deck
        skills_deck = session.exec(
            select(CardDeck).where(CardDeck.name == "技能盤點卡組")
        ).first()

        if not skills_deck:
            skills_deck = CardDeck(
                name="技能盤點卡組",
                description="評估個人技能的卡組",
                version="1.0",
                is_official=True,
                is_default=True,
                game_rule_id=game_rule.id,
            )
            session.add(skills_deck)
            session.commit()
            session.refresh(skills_deck)

    skill_cards_data = [
        {
            "card_key": "skill_001",
            "title": "程式設計",
            "description": "編寫和維護程式代碼的能力",
            "category": "technical",
        },
        {
            "card_key": "skill_002",
            "title": "數據分析",
            "description": "收集、處理和分析數據的能力",
            "category": "analytical",
        },
        {
            "card_key": "skill_003",
            "title": "溝通表達",
            "description": "清晰有效地傳達想法和信息",
            "category": "communication",
        },
        {
            "card_key": "skill_004",
            "title": "領導管理",
            "description": "領導團隊和管理專案的能力",
            "category": "leadership",
        },
        {
            "card_key": "skill_005",
            "title": "創意思維",
            "description": "產生新想法和創新解決方案",
            "category": "creative",
        },
        {
            "card_key": "skill_006",
            "title": "問題解決",
            "description": "識別和解決複雜問題的能力",
            "category": "analytical",
        },
        {
            "card_key": "skill_007",
            "title": "團隊協作",
            "description": "與他人有效合作達成目標",
            "category": "interpersonal",
        },
        {
            "card_key": "skill_008",
            "title": "時間管理",
            "description": "有效安排和利用時間的能力",
            "category": "organizational",
        },
        {
            "card_key": "skill_009",
            "title": "學習適應",
            "description": "快速學習新事物並適應變化",
            "category": "adaptability",
        },
        {
            "card_key": "skill_010",
            "title": "銷售技巧",
            "description": "推廣產品和服務的能力",
            "category": "business",
        },
        {
            "card_key": "skill_011",
            "title": "設計美感",
            "description": "創造美觀和功能性設計",
            "category": "creative",
        },
        {
            "card_key": "skill_012",
            "title": "外語能力",
            "description": "掌握一種或多種外國語言",
            "category": "communication",
        },
        {
            "card_key": "skill_013",
            "title": "批判思考",
            "description": "客觀分析和評估信息的能力",
            "category": "analytical",
        },
        {
            "card_key": "skill_014",
            "title": "情緒管理",
            "description": "理解和管理自己及他人情緒",
            "category": "emotional_intelligence",
        },
        {
            "card_key": "skill_015",
            "title": "技術維修",
            "description": "修理和維護技術設備的能力",
            "category": "technical",
        },
    ]

    with Session(engine) as session:
        # Get the skills deck
        skills_deck = session.exec(
            select(CardDeck).where(CardDeck.name == "技能盤點卡組")
        ).first()

        if not skills_deck:
            print("⚠️ Skills deck not found, skipping skill cards")
            return

        for card_data in skill_cards_data:
            existing = session.exec(
                select(Card).where(
                    Card.card_key == card_data["card_key"],
                    Card.deck_id == skills_deck.id,
                )
            ).first()

            if not existing:
                card = Card(
                    deck_id=skills_deck.id,
                    card_key=card_data["card_key"],
                    title=card_data["title"],
                    description=card_data["description"],
                    category=card_data["category"],
                    card_metadata={"skill_level": "intermediate"},
                )
                session.add(card)

        session.commit()
        print(f"✅ {len(skill_cards_data)} skill cards seeded")


def seed_test_users():
    """創建測試用戶（開發環境用）"""
    with Session(engine) as session:
        # 測試諮詢師 1
        existing_user = session.exec(
            select(User).where(User.email == "test@example.com")
        ).first()

        if not existing_user:
            test_user = User(
                id=uuid.uuid4(),
                email="test@example.com",
                name="測試諮詢師",
                hashed_password=get_password_hash("demo123"),
                roles=["counselor"],
                is_active=True,
                created_at=datetime.utcnow(),
            )
            session.add(test_user)

        # 測試諮詢師 2
        existing_user2 = session.exec(
            select(User).where(User.email == "counselor@example.com")
        ).first()

        if not existing_user2:
            test_user2 = User(
                id=uuid.uuid4(),
                email="counselor@example.com",
                name="王諮詢師",
                hashed_password=get_password_hash("test1234"),
                roles=["counselor"],
                is_active=True,
                created_at=datetime.utcnow(),
            )
            session.add(test_user2)

        # 管理員用戶
        existing_admin = session.exec(
            select(User).where(User.email == "admin@example.com")
        ).first()

        if not existing_admin:
            admin_user = User(
                id=uuid.uuid4(),
                email="admin@example.com",
                name="系統管理員",
                hashed_password=get_password_hash("admin123"),
                roles=["admin", "counselor"],
                is_active=True,
                created_at=datetime.utcnow(),
            )
            session.add(admin_user)

        session.commit()
        print("✅ Test users seeded")


def seed_test_rooms():
    """創建測試房間（開發環境用）"""
    with Session(engine) as session:
        # 獲取測試用戶
        test_user = session.exec(
            select(User).where(User.email == "test@example.com")
        ).first()

        if not test_user:
            print("⚠️ Test user not found, skipping test rooms")
            return

        # 檢查是否已存在測試房間
        existing_room = session.exec(
            select(Room).where(Room.name == "測試諮詢房間")
        ).first()

        if not existing_room:
            # 創建活躍的測試房間
            test_room = Room(
                id=uuid.uuid4(),
                name="測試諮詢房間",
                description="這是一個測試用的諮詢房間",
                counselor_id=test_user.id,
                status="active",
                share_code="TEST123",
                expires_at=datetime.utcnow() + timedelta(days=7),
                created_at=datetime.utcnow(),
            )
            session.add(test_room)

        # 檢查是否已存在過期房間
        existing_expired_room = session.exec(
            select(Room).where(Room.name == "已過期的房間")
        ).first()

        if not existing_expired_room:
            # 創建過期的測試房間
            expired_room = Room(
                id=uuid.uuid4(),
                name="已過期的房間",
                description="這個房間已經過期了",
                counselor_id=test_user.id,
                status="expired",
                share_code="EXPIRED1",
                expires_at=datetime.utcnow() - timedelta(days=1),
                created_at=datetime.utcnow() - timedelta(days=8),
            )
            session.add(expired_room)

        session.commit()
        print("✅ Test rooms seeded")


def seed_crm_data():
    """創建CRM系統種子資料 - 客戶和諮商師關係"""
    print("🏢 Seeding CRM data...")

    with Session(engine) as session:
        # 獲取諮商師用戶
        counselors = session.exec(
            select(User).where(User.roles.contains(["counselor"]))
        ).all()

        if not counselors:
            print("⚠️ No counselors found, skipping CRM seeding")
            return

        # 創建客戶資料
        clients_data = [
            {
                "email": "alice.chen@example.com",
                "name": "陳雅琪 (Alice Chen)",
                "phone": "0912-345-678",
                "notes": "大學應屆畢業生，主修資訊工程，對職涯方向感到迷茫",
                "tags": ["應屆畢業生", "資訊科技", "職涯探索"],
                "status": ClientStatus.ACTIVE,
            },
            {
                "email": "bob.wang@example.com",
                "name": "王建明 (Bob Wang)",
                "phone": "0923-456-789",
                "notes": "工作5年，考慮轉職到不同產業",
                "tags": ["在職人士", "轉職", "中階主管"],
                "status": ClientStatus.ACTIVE,
            },
            {
                "email": "carol.liu@example.com",
                "name": "劉佳玲 (Carol Liu)",
                "phone": "0934-567-890",
                "notes": "剛從國外回來，尋求本地職場建議",
                "tags": ["海歸", "重新就業", "跨文化適應"],
                "status": ClientStatus.ACTIVE,
            },
        ]

        clients = []
        for client_data in clients_data:
            existing_client = session.exec(
                select(Client).where(Client.email == client_data["email"])
            ).first()

            if not existing_client:
                client = Client(**client_data)
                session.add(client)
                clients.append(client)
                print(f"  ✅ Created client: {client_data['name']}")
            else:
                clients.append(existing_client)

        session.commit()

        # 創建諮商師-客戶關係
        if len(counselors) > 0 and len(clients) > 0:
            counselor1 = counselors[0]

            for i, client in enumerate(clients[:2]):  # 前兩個客戶給第一位諮商師
                existing_rel = session.exec(
                    select(CounselorClientRelationship).where(
                        CounselorClientRelationship.counselor_id == str(counselor1.id),
                        CounselorClientRelationship.client_id == client.id,
                    )
                ).first()

                if not existing_rel:
                    relationship = CounselorClientRelationship(
                        counselor_id=str(counselor1.id),
                        client_id=client.id,
                        relationship_type=RelationshipType.PRIMARY,
                        status=RelationshipStatus.ACTIVE,
                        start_date=date.today() - timedelta(days=30),
                        notes="初次諮詢關係建立",
                    )
                    session.add(relationship)
                    print(
                        f"  ✅ Created relationship: {counselor1.name} -> {client.name}"
                    )

        # 如果有第二位諮商師，分配第三個客戶
        if len(counselors) > 1 and len(clients) > 2:
            counselor2 = counselors[1]
            client3 = clients[2]

            existing_rel = session.exec(
                select(CounselorClientRelationship).where(
                    CounselorClientRelationship.counselor_id == str(counselor2.id),
                    CounselorClientRelationship.client_id == client3.id,
                )
            ).first()

            if not existing_rel:
                relationship = CounselorClientRelationship(
                    counselor_id=str(counselor2.id),
                    client_id=client3.id,
                    relationship_type=RelationshipType.PRIMARY,
                    status=RelationshipStatus.ACTIVE,
                    start_date=date.today() - timedelta(days=15),
                    notes="主要諮詢師",
                )
                session.add(relationship)
                print(f"  ✅ Created relationship: {counselor2.name} -> {client3.name}")

        session.commit()

        # 獲取遊戲規則和卡組
        career_rule = session.exec(
            select(GameRuleTemplate).where(GameRuleTemplate.slug == "basic_career")
        ).first()
        value_rule = session.exec(
            select(GameRuleTemplate).where(GameRuleTemplate.slug == "basic_values")
        ).first()
        skill_rule = session.exec(
            select(GameRuleTemplate).where(GameRuleTemplate.slug == "basic_skills")
        ).first()

        career_deck = session.exec(
            select(CardDeck).where(CardDeck.name == "職業探索卡組")
        ).first()
        value_deck = session.exec(
            select(CardDeck).where(CardDeck.name == "價值觀卡組")
        ).first()
        skill_deck = session.exec(
            select(CardDeck).where(CardDeck.name == "技能卡組")
        ).first()

        # 為每個客戶創建多個房間和諮詢記錄
        room_types = [
            {
                "suffix": "職涯諮詢室",
                "desc": "職涯探索與規劃",
                "topics": ["職涯探索", "技能評估"],
                "game_rule": career_rule,
                "deck": career_deck,
            },
            {
                "suffix": "價值觀討論室",
                "desc": "價值觀澄清與討論",
                "topics": ["價值觀探索", "人生目標設定"],
                "game_rule": value_rule,
                "deck": value_deck,
            },
            {
                "suffix": "技能盤點室",
                "desc": "個人能力評估",
                "topics": ["技能盤點", "能力發展"],
                "game_rule": skill_rule,
                "deck": skill_deck,
            },
        ]

        for client_idx, client in enumerate(clients[:3]):  # 為所有3個客戶創建房間
            # 為每個客戶創建 2-3 個房間
            num_rooms = 3 if client_idx < 2 else 2
            for room_idx in range(num_rooms):
                room_type = room_types[room_idx % len(room_types)]
                room_name = f"{client.name.split(' ')[0]} 的{room_type['suffix']}"

                existing_room = session.exec(
                    select(Room).where(Room.name == room_name)
                ).first()

                if not existing_room:
                    # 分配不同的諮商師
                    counselor = counselors[client_idx % len(counselors)]

                    # 根據房間類型設置不同的到期時間
                    expire_days = [30, 25, 20][room_idx] if room_idx < 3 else 15
                    is_active = room_idx < 2  # 前兩個房間保持活躍

                    room = Room(
                        name=room_name,
                        description=f"為 {client.name} 提供的{room_type['desc']}服務",
                        counselor_id=str(counselor.id),
                        is_active=is_active,
                        expires_at=datetime.utcnow() + timedelta(days=expire_days),
                        session_count=room_idx + 1,
                    )
                    session.add(room)
                    session.commit()
                    session.refresh(room)
                    print(f"  ✅ Created room: {room_name}")

                    # 關聯房間與客戶
                    room_client = RoomClient(room_id=room.id, client_id=client.id)
                    session.add(room_client)
                    print(f"  ✅ Linked room to client: {client.name}")

                    # 為每個房間創建 1-3 個諮詢記錄
                    num_records = [3, 2, 1][room_idx] if room_idx < 3 else 1
                    for record_idx in range(num_records):
                        days_ago = 3 + room_idx * 7 + record_idx * 3  # 分散在不同時間
                        session_date = datetime.utcnow() - timedelta(days=days_ago)

                        record = ConsultationRecord(
                            room_id=room.id,
                            client_id=client.id,
                            counselor_id=str(counselor.id),
                            session_date=session_date,
                            duration_minutes=45
                            + room_idx * 15
                            + record_idx * 5,  # 不同時長
                            topics=(
                                room_type["topics"] + [f"進度檢討 #{record_idx + 1}"]
                                if record_idx > 0
                                else room_type["topics"]
                            ),
                            notes=f"第 {record_idx + 1} 次{room_type['desc']}會議記錄。討論了相關主題，客戶表現積極。",
                            follow_up_required=(client_idx + room_idx + record_idx) % 2
                            == 0,
                            follow_up_date=(
                                date.today() + timedelta(days=7 + record_idx * 3)
                                if (client_idx + room_idx + record_idx) % 2 == 0
                                else None
                            ),
                        )
                        session.add(record)

                    print(
                        f"  ✅ Created {num_records} consultation record(s) for {client.name} in {room.name}"
                    )

        session.commit()

    # Create demo relationships for demo counselor accounts
    # First, refresh clients list to get valid client IDs
    demo_clients = session.exec(select(Client)).all()
    demo_counselors = ["demo-counselor-001", "demo-counselor-002"]

    if len(demo_clients) >= 2:
        # Give demo-counselor-001 the first two clients
        for i, client in enumerate(demo_clients[:2]):
            existing_demo_rel = session.exec(
                select(CounselorClientRelationship).where(
                    CounselorClientRelationship.counselor_id == demo_counselors[0],
                    CounselorClientRelationship.client_id == client.id,
                )
            ).first()

            if not existing_demo_rel:
                demo_relationship = CounselorClientRelationship(
                    counselor_id=demo_counselors[0],
                    client_id=client.id,
                    relationship_type=RelationshipType.PRIMARY,
                    status=RelationshipStatus.ACTIVE,
                    start_date=date.today() - timedelta(days=10),
                    notes="Demo relationship for testing",
                )
                session.add(demo_relationship)
                print(
                    f"  ✅ Created demo relationship: {demo_counselors[0]} -> {client.name}"
                )

        session.commit()

    print("✅ CRM data seeded successfully")


def run_all_seeds(include_test_data=False):
    """執行所有種子資料"""
    print("🌱 Starting database seeding...")

    try:
        seed_demo_users()
        seed_career_cards()
        seed_value_cards()
        seed_skill_cards()
        seed_crm_data()  # 新增CRM種子資料

        if include_test_data:
            print("\n🧪 Including test data...")
            seed_test_users()
            seed_test_rooms()

        print("🎉 All seeds completed successfully!")

    except Exception as e:
        print(f"❌ Seeding failed: {e}")
        raise


def run_test_seeds():
    """執行測試種子資料（開發環境用）"""
    print("🧪 Starting test data seeding...")

    try:
        seed_test_users()
        seed_test_rooms()

        print("🎉 Test seeds completed successfully!")
        print("\n📋 Test accounts created:")
        print("- Email: test@example.com, Password: demo123")
        print("- Email: counselor@example.com, Password: test1234")
        print("- Email: admin@example.com, Password: admin123")
        print("\n🏠 Test rooms created:")
        print("- 測試諮詢房間 (Share code: TEST123)")
        print("- 已過期的房間 (Share code: EXPIRED1)")

    except Exception as e:
        print(f"❌ Test seeding failed: {e}")
        raise


if __name__ == "__main__":
    run_all_seeds()
