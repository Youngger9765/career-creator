# Demo Consultation Records Seeding Guide

## Overview

This guide explains how to create realistic demo consultation records for **Dr. Sarah Chen** (`demo.counselor@example.com`) across staging and production environments.

## What Gets Created

### Data Summary

- **3 Rooms** with different game rules:
  - Room 1: 職業探索諮詢室 (basic_career)
  - Room 2: 價值觀探索室 (basic_values)
  - Room 3: 職能盤點室 (basic_skills)

- **3 Demo Clients**:
  - 張小明 (25歲, 軟體工程師)
  - 李小華 (30歲, 產品經理)
  - 王小美 (28歲, UI設計師)

- **6-9 Consultation Records** (randomly distributed):
  - Session dates: Random dates in past 2 months
  - Duration: 45-90 minutes (random)
  - Screenshots: 2-3 GCS URLs per record
  - Game state: Minimal JSON snapshot
  - Topics: 2-3 random topics per session
  - Notes: Realistic Chinese consultation insights (100-150 characters)

- **3 Counselor Notes** (one per room):
  - Summary observations for each consultation room

### Sample Data

#### Consultation Note Examples

```
"今日諮詢中，案主展現出對探索新職涯方向的強烈意願。透過性格分析卡，發現其 RIASEC 偏向 I 型（調查型）和 A 型（藝術型），建議可考慮 UX 研究或使用者體驗設計相關職位。"

"本次使用優劣勢分析法，案主自評在溝通能力和團隊協作上表現優異，但對數據分析工具較不熟悉。建議可透過線上課程補強技術能力，同時善用其軟實力優勢。"

"職能盤點後發現案主具備跨領域整合能力，過往經驗橫跨行銷、專案管理與產品開發。建議朝產品經理方向發展，善用其多元背景優勢。"
```

#### GCS Screenshot URLs

```
https://storage.googleapis.com/career-creator-screenshots-staging/demo/gameplay-personality-assessment-1.png
https://storage.googleapis.com/career-creator-screenshots-staging/demo/gameplay-values-exploration-2.png
https://storage.googleapis.com/career-creator-screenshots-staging/demo/card-layout-screenshot-1.png
```

## Quick Start

### Option 1: Using Helper Script (Recommended)

```bash
# Seed staging (default)
./scripts/seed-demo-records.sh

# Seed production (requires confirmation)
./scripts/seed-demo-records.sh --production

# Rollback staging
./scripts/seed-demo-records.sh --rollback

# Rollback production
./scripts/seed-demo-records.sh --production --rollback
```

### Option 2: Direct Python Execution

```bash
cd backend

# Seed staging
python scripts/seed_demo_consultation_records.py --env staging

# Seed production (requires manual confirmation)
python scripts/seed_demo_consultation_records.py --env production

# Rollback
python scripts/seed_demo_consultation_records.py --env staging --rollback
```

## Prerequisites

### 1. Environment Setup

Ensure `.env` file exists with:

```bash
DATABASE_URL=postgresql://...
DIRECT_DATABASE_URL=postgresql://...
GCS_BUCKET_NAME=career-creator-screenshots-staging  # or production bucket
```

### 2. Database Requirements

- Dr. Sarah Chen account must exist with UUID: `00000000-0000-0000-0001-000000000001`
- Game rule templates must be seeded:
  - `basic_career`
  - `basic_values`
  - `basic_skills`

Verify with:

```sql
SELECT id, email, name FROM users WHERE email = 'demo.counselor@example.com';
SELECT slug, name FROM game_rule_templates WHERE slug IN ('basic_career', 'basic_values', 'basic_skills');
```

### 3. GCS Bucket (Optional)

Screenshot URLs will be generated pointing to demo images in GCS bucket.

**Note**: URLs are created but images don't need to exist for seeding to succeed. However, for a complete demo experience, you may want to upload sample screenshots to these paths:

- `demo/gameplay-personality-assessment-1.png`
- `demo/gameplay-values-exploration-2.png`
- `demo/gameplay-skills-inventory-1.png`
- `demo/card-layout-screenshot-1.png`
- `demo/card-layout-screenshot-2.png`
- `demo/consultation-session-1.png`
- `demo/consultation-session-2.png`
- `demo/final-result-screenshot.png`

## Execution Flow

### Staging Environment

1. **Verify**: Script checks if Dr. Sarah Chen exists
2. **Create Clients**: 3 fake demo clients (or reuse if exist)
3. **Create Rooms**: 3 rooms with different game rules
4. **Associate**: Link clients to rooms via `room_clients` table
5. **Create Records**: 6-9 consultation records with realistic data
6. **Create Notes**: Counselor notes for each room
7. **Verify**: Display summary of created data

### Production Environment

Same as staging, but requires manual confirmation:

```
⚠️  WARNING: You are about to seed PRODUCTION database.
   Type 'CONFIRM' to proceed:
```

## Verification

### Database Queries

```sql
-- Check consultation records
SELECT
    cr.id,
    cr.session_date,
    cr.duration_minutes,
    c.name as client_name,
    r.name as room_name,
    array_length(cr.screenshots, 1) as screenshot_count
FROM consultation_records cr
JOIN clients c ON c.id = cr.client_id
JOIN rooms r ON r.id = cr.room_id
WHERE cr.counselor_id = '00000000-0000-0000-0001-000000000001'
ORDER BY cr.session_date DESC;

-- Check rooms
SELECT
    r.id,
    r.name,
    r.session_count,
    gr.name as game_rule,
    c.name as client_name
FROM rooms r
JOIN game_rule_templates gr ON gr.id = r.game_rule_id
LEFT JOIN room_clients rc ON rc.room_id = r.id
LEFT JOIN clients c ON c.id = rc.client_id
WHERE r.counselor_id = '00000000-0000-0000-0001-000000000001';

-- Check counselor notes
SELECT
    cn.id,
    r.name as room_name,
    left(cn.content, 50) as note_preview,
    cn.created_at
FROM counselor_notes cn
JOIN rooms r ON r.id = cn.room_id
WHERE r.counselor_id = '00000000-0000-0000-0001-000000000001';
```

### Expected Output

```
Total consultation records: 6-9
Total rooms: 3
Total clients: 3
Total counselor notes: 3
```

## Rollback

If you need to remove the demo data:

```bash
# Rollback staging
./scripts/seed-demo-records.sh --rollback

# Rollback production
./scripts/seed-demo-records.sh --production --rollback
```

This will delete:

1. All consultation records for Dr. Sarah Chen
2. All counselor notes for Dr. Sarah Chen's rooms
3. All room-client associations
4. All rooms owned by Dr. Sarah Chen
5. All demo clients (張小明, 李小華, 王小美)

**Note**: Dr. Sarah Chen's user account is NOT deleted.

## Safety Features

### Transaction Management

All operations use database transactions:

- Rollback on error
- Atomic commits
- Safe for production

### Idempotency

- Script checks for existing clients before creating
- Skips rooms if game rules don't exist
- Can be run multiple times safely

### Production Safeguards

- Manual confirmation required
- Clear warnings displayed
- Environment verification
- Detailed logging

## Troubleshooting

### Error: Counselor not found

```
❌ Error: Counselor demo.counselor@example.com not found in database
   Expected UUID: 00000000-0000-0000-0001-000000000001
```

**Solution**: Run base seeds first:

```bash
cd backend
python -m app.core.seeds
```

### Error: Game rule not found

```
⚠️  Warning: Game rule 'basic_career' not found, skipping room
```

**Solution**: Ensure game rule templates are seeded:

```bash
cd backend
python -m app.core.seeds
```

### Error: .env file not found

```
Error: .env file not found
```

**Solution**: Create `.env` file based on `.env.example`:

```bash
cp .env.example .env
# Edit .env with correct credentials
```

## Script Architecture

### Key Files

- `seed_demo_consultation_records.py`: Main seed script
- `seed-demo-records.sh`: Helper bash script
- `SEED_DEMO_RECORDS.md`: This documentation

### Data Flow

```
┌─────────────────────┐
│  Verify Counselor   │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Create Clients     │ ──────► 3 fake clients
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Create Rooms       │ ──────► 3 rooms (different game rules)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Link Clients       │ ──────► room_clients associations
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Create Records     │ ──────► 6-9 consultation records
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Create Notes       │ ──────► 3 counselor notes
└─────────────────────┘
```

### Design Decisions

1. **Minimal but Realistic**: 6-9 records (not hundreds) for quick demo
2. **Chinese Notes**: Authentic consultation language for local market
3. **Random Dates**: Past 2 months for recent activity appearance
4. **GCS URLs**: Use realistic bucket paths even if images don't exist yet
5. **Game State**: Minimal JSON to demonstrate data structure
6. **Rollback Support**: Clean uninstall for testing/iteration

## Use Cases

### 1. Demo Environment Setup

Create realistic data for:

- Product demos
- User testing
- Screenshots for marketing
- Feature development

### 2. QA Testing

Test consultation record features:

- List view rendering
- Filtering/sorting
- Screenshot display
- Note editing

### 3. Performance Testing

Baseline data for:

- N+1 query detection
- API response time
- UI rendering performance

## Next Steps

After seeding, you can:

1. **Upload Demo Screenshots**: Add actual images to GCS bucket paths
2. **Test UI**: Login as Dr. Sarah Chen and view consultation records
3. **API Testing**: Query `/api/consultations` endpoint
4. **Add More Data**: Run script multiple times to add more records
5. **Customize**: Edit script to add more clients or different game rules

## Support

For issues or questions:

1. Check troubleshooting section above
2. Verify database connection
3. Check seed script logs
4. Review database state with verification queries

---

**Last Updated**: 2026-01-15
**Version**: 1.0.0
**Owner**: Career Creator Team
