# Demo Consultation Records - Complete Package

## Overview

This package provides everything needed to seed realistic demo consultation records for **Dr. Sarah Chen** (`demo.counselor@example.com`) in both staging and production environments.

## What's Included

### 1. Core Seed Script

**File**: `seed_demo_consultation_records.py`

Comprehensive Python script that creates:
- **3 Rooms** with different game rules (basic_career, basic_values, basic_skills)
- **3 Demo Clients** (張小明, 李小華, 王小美)
- **6-9 Consultation Records** with realistic Chinese notes
- **3 Counselor Notes** (one per room)

**Features**:
- Transaction safety (rollback on error)
- Idempotent (can run multiple times safely)
- Production confirmation prompt
- Rollback support
- Comprehensive logging and verification

### 2. Helper Script

**File**: `seed-demo-records.sh`

Bash wrapper for easy execution:

```bash
# Seed staging
./scripts/seed-demo-records.sh

# Seed production (requires confirmation)
./scripts/seed-demo-records.sh --production

# Rollback
./scripts/seed-demo-records.sh --rollback
```

### 3. GitHub Actions Workflow

**File**: `.github/workflows/seed-demo-data.yaml`

Manual workflow for CI/CD execution:

1. Go to **Actions** tab
2. Select **Seed Demo Consultation Records**
3. Choose environment (staging/production)
4. Choose action (seed/rollback)
5. Run workflow

**Advantages**:
- No local environment setup needed
- Secrets managed by GitHub
- Audit trail in Actions history
- Automatic verification step

### 4. Documentation

- `SEED_DEMO_RECORDS.md` - Complete feature documentation
- `EXECUTION_GUIDE.md` - Step-by-step execution instructions
- `README_DEMO_SEED.md` - This file (overview)

## Quick Start

### Recommended: GitHub Actions (Production-Ready)

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "feat: add demo consultation records seeding system"
   git push origin main
   ```

2. **Run Workflow**:
   - Go to GitHub repository → **Actions** tab
   - Click **Seed Demo Consultation Records**
   - Select environment: **staging**
   - Select action: **seed**
   - Click **Run workflow**

3. **Verify**:
   - Check workflow logs for success
   - Login to staging UI as Dr. Sarah Chen
   - Verify consultation records appear

### Alternative: Direct Execution

**Prerequisites**:
- Database must have correct schema (migrations applied)
- Environment variables configured (.env file)
- Dr. Sarah Chen account exists
- Game rule templates seeded

**Execute**:
```bash
cd backend
python scripts/seed_demo_consultation_records.py --env staging
```

## Data Structure

### Demo Clients

| Name | Age | Occupation | Tags |
|------|-----|------------|------|
| 張小明 | 25 | 軟體工程師 | 職涯轉換, 技術背景, 25-30歲 |
| 李小華 | 30 | 產品經理 | 管理職探索, 跨領域, 30-35歲 |
| 王小美 | 28 | UI設計師 | 創意產業, 設計背景, 25-30歲 |

### Rooms

| Room Name | Game Rule | Purpose |
|-----------|-----------|---------|
| 職業探索諮詢室 | basic_career | Career exploration cards |
| 價值觀探索室 | basic_values | Values assessment |
| 職能盤點室 | basic_skills | Skills inventory |

### Consultation Records

- **Count**: 6-9 records (randomly distributed)
- **Date Range**: Past 2 months (random dates)
- **Duration**: 45-90 minutes (random)
- **Screenshots**: 2-3 GCS URLs per record
- **Topics**: 2-3 topics per session (職涯定位, 技能盤點, etc.)
- **Notes**: Realistic Chinese consultation insights (100-150 characters)

### Sample Consultation Note

```
今日諮詢中，案主展現出對探索新職涯方向的強烈意願。透過性格分析卡，發現其 RIASEC 偏向 I 型（調查型）和 A 型（藝術型），建議可考慮 UX 研究或使用者體驗設計相關職位。後續將安排職能盤點，協助釐清核心優勢。
```

## GCS Screenshots

### Auto-Generated URLs

Script generates realistic GCS URLs pointing to:

```
gs://[bucket-name]/demo/gameplay-personality-assessment-1.png
gs://[bucket-name]/demo/gameplay-values-exploration-2.png
gs://[bucket-name]/demo/gameplay-skills-inventory-1.png
gs://[bucket-name]/demo/card-layout-screenshot-1.png
gs://[bucket-name]/demo/card-layout-screenshot-2.png
gs://[bucket-name]/demo/consultation-session-1.png
gs://[bucket-name]/demo/consultation-session-2.png
gs://[bucket-name]/demo/final-result-screenshot.png
```

### Uploading Actual Screenshots (Optional)

To make screenshots actually load in UI:

```bash
# Upload screenshots to GCS
gsutil cp your-screenshots/* gs://career-creator-472207-screenshots/demo/

# Or use web console
# https://console.cloud.google.com/storage/browser/
```

## Verification

### Database Query

```sql
-- Check consultation records
SELECT
    cr.id,
    cr.session_date,
    cr.duration_minutes,
    c.name as client_name,
    r.name as room_name,
    array_length(cr.screenshots, 1) as screenshot_count,
    length(cr.notes) as note_length
FROM consultation_records cr
JOIN clients c ON c.id = cr.client_id
JOIN rooms r ON r.id = cr.room_id
WHERE cr.counselor_id = '00000000-0000-0000-0001-000000000001'
ORDER BY cr.session_date DESC;
```

### Expected Output

```
Total consultation records: 6-9
Total rooms: 3
Total clients: 3
Total counselor notes: 3
```

### UI Verification

1. Login as `demo.counselor@example.com` / `demo123`
2. Navigate to **Consultation Records** page
3. Should see 6-9 records with:
   - Client names (張小明, 李小華, 王小美)
   - Session dates (past 2 months)
   - Duration (45-90 minutes)
   - Chinese consultation notes
   - Screenshot placeholders (or actual images if uploaded)

## Rollback

If you need to remove the demo data:

### Via GitHub Actions

1. Go to **Actions** → **Seed Demo Consultation Records**
2. Select environment
3. Select action: **rollback**
4. Run workflow

### Via Command Line

```bash
cd backend
python scripts/seed_demo_consultation_records.py --env staging --rollback
```

This removes:
- All consultation records for Dr. Sarah Chen
- All counselor notes for Dr. Sarah Chen's rooms
- All room-client associations
- All demo rooms
- All demo clients (張小明, 李小華, 王小美)

**Note**: Dr. Sarah Chen's user account is NOT deleted.

## Troubleshooting

### "column does not exist" Error

**Problem**: Local database schema is outdated.

**Solution**: This script is designed for **staging/production** which have correct schema. Use GitHub Actions workflow or connect to actual staging/production database.

If you must test locally:
```bash
cd backend
alembic upgrade head
python -m app.core.seeds
```

### "Counselor not found" Error

**Problem**: Demo account not seeded.

**Solution**:
```bash
cd backend
python -m app.core.seeds
```

### No Data Visible in UI

**Possible Causes**:
1. Seeded wrong environment
2. Not logged in as Dr. Sarah Chen
3. Browser cache issue

**Solution**:
1. Verify environment variable was correct
2. Login as `demo.counselor@example.com` / `demo123`
3. Clear browser cache and refresh

## Safety Features

### Transaction Management

All database operations use transactions:
- Atomic commits
- Automatic rollback on error
- No partial data states

### Production Safeguards

- Manual confirmation required for production
- Clear warnings displayed
- Environment verification
- Detailed logging

### Idempotency

Script can be run multiple times safely:
- Checks for existing clients before creating
- Skips rooms if game rules don't exist
- No duplicate data created

## File Structure

```
backend/
├── scripts/
│   ├── seed_demo_consultation_records.py   # Main seed script
│   ├── seed-demo-records.sh                # Helper bash script
│   ├── SEED_DEMO_RECORDS.md                # Feature documentation
│   ├── EXECUTION_GUIDE.md                  # Execution instructions
│   └── README_DEMO_SEED.md                 # This file
│
.github/
└── workflows/
    └── seed-demo-data.yaml                 # GitHub Actions workflow
```

## Next Steps

After successfully seeding:

1. **Test Demo Flow**:
   - Login as Dr. Sarah Chen
   - Navigate through consultation records
   - Test filtering/sorting
   - Verify Chinese notes display correctly

2. **Upload Demo Screenshots** (optional):
   - Create professional-looking demo screenshots
   - Upload to GCS `demo/` folder
   - Refresh UI to see images load

3. **Document Demo Script**:
   - Create sales/marketing demo flow
   - Screenshot key features
   - Prepare talking points for demos

4. **Gather Feedback**:
   - Show to stakeholders
   - Note UI improvements needed
   - Iterate on data realism

## Support

For issues:

1. Check [EXECUTION_GUIDE.md](./EXECUTION_GUIDE.md) for detailed troubleshooting
2. Review [SEED_DEMO_RECORDS.md](./SEED_DEMO_RECORDS.md) for complete documentation
3. Check GitHub Actions logs if using workflow
4. Verify database state with SQL queries

## Version History

- **v1.0.0** (2026-01-15): Initial release
  - 3 rooms with different game rules
  - 3 demo clients
  - 6-9 consultation records
  - Realistic Chinese consultation notes
  - GitHub Actions workflow
  - Complete documentation

---

**Author**: Career Creator Team
**Last Updated**: 2026-01-15
**Status**: Production Ready ✅
