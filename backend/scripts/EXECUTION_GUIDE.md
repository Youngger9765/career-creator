# Execution Guide: Seed Demo Consultation Records

## Problem: Local Database is Out of Date

The local development database is missing required columns:
- `users.must_change_password`
- `consultation_records.screenshots`

This is expected - local DB hasn't been migrated. **This script is designed for staging/production environments** which have the correct schema.

## Option 1: Execute Directly on Cloud Run (Recommended)

### Step 1: Connect to Cloud Run Instance

```bash
# For STAGING
gcloud run services proxy career-creator-backend-staging --port=8080 --region=asia-east1

# For PRODUCTION
gcloud run services proxy career-creator-backend --port=8080 --region=asia-east1
```

### Step 2: SSH into the Container

```bash
# Get the service name
gcloud run services list --region=asia-east1

# Describe the service to get revision
gcloud run revisions list --service=career-creator-backend-staging --region=asia-east1 --limit=1

# Execute command in the running container
gcloud run services execute career-creator-backend-staging \
  --command="python scripts/seed_demo_consultation_records.py --env staging" \
  --region=asia-east1
```

### Step 3: Verify

```bash
# Query the database to verify records were created
gcloud run services execute career-creator-backend-staging \
  --command="python -c \"
from app.core.database import engine
from sqlmodel import Session, text
with Session(engine) as s:
    result = s.exec(text('SELECT COUNT(*) FROM consultation_records WHERE counselor_id = \\'00000000-0000-0000-0001-000000000001\\''))
    print(f'Total records: {result.first()[0]}')
\"" \
  --region=asia-east1
```

## Option 2: Direct Database Connection from Local Machine

### Step 1: Get Database Credentials

```bash
# Staging
export STAGING_DB_URL="<get from GitHub secrets or GCP Console>"

# Production
export PRODUCTION_DB_URL="<get from GitHub secrets or GCP Console>"
```

### Step 2: Temporarily Override .env

```bash
cd backend

# Backup current .env
cp .env .env.backup

# For STAGING
echo "DATABASE_URL=$STAGING_DB_URL" > .env.temp
echo "DIRECT_DATABASE_URL=$STAGING_DB_URL" >> .env.temp
echo "GCS_BUCKET_NAME=career-creator-472207-screenshots" >> .env.temp

# Run seed script
mv .env .env.local
mv .env.temp .env
python scripts/seed_demo_consultation_records.py --env staging

# Restore local .env
mv .env .env.temp
mv .env.local .env
```

### Step 3: Verify via psql

```bash
# Connect to staging DB
psql "$STAGING_DB_URL"

# Run verification query
SELECT
    cr.id,
    cr.session_date,
    c.name as client_name,
    r.name as room_name
FROM consultation_records cr
JOIN clients c ON c.id = cr.client_id
JOIN rooms r ON r.id = cr.room_id
WHERE cr.counselor_id = '00000000-0000-0000-0001-000000000001'
ORDER BY cr.session_date DESC;
```

## Option 3: GitHub Actions Workflow (Safest)

Create a manual workflow to run the seed script in CI environment.

### Create `.github/workflows/seed-demo-data.yaml`

```yaml
name: Seed Demo Consultation Records

on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options:
          - staging
          - production
      action:
        description: 'Action to perform'
        required: true
        type: choice
        options:
          - seed
          - rollback

jobs:
  seed:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}

    steps:
      - uses: actions/checkout@v4

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt

      - name: Configure environment
        run: |
          cd backend
          if [ "${{ inputs.environment }}" == "staging" ]; then
            echo "DATABASE_URL=${{ secrets.DATABASE_POOLER_URL_STAGING }}" >> .env
            echo "DIRECT_DATABASE_URL=${{ secrets.DATABASE_POOLER_URL_STAGING }}" >> .env
            echo "GCS_BUCKET_NAME=${{ secrets.GCS_BUCKET_NAME_STAGING }}" >> .env
          else
            echo "DATABASE_URL=${{ secrets.DATABASE_POOLER_URL_PRODUCTION }}" >> .env
            echo "DIRECT_DATABASE_URL=${{ secrets.DATABASE_POOLER_URL_PRODUCTION }}" >> .env
            echo "GCS_BUCKET_NAME=${{ secrets.GCS_BUCKET_NAME_PRODUCTION }}" >> .env
          fi

      - name: Seed demo data
        run: |
          cd backend
          if [ "${{ inputs.action }}" == "rollback" ]; then
            python scripts/seed_demo_consultation_records.py \
              --env ${{ inputs.environment }} \
              --rollback
          else
            python scripts/seed_demo_consultation_records.py \
              --env ${{ inputs.environment }}
          fi

      - name: Verify results
        run: |
          cd backend
          python -c "
from app.core.database import engine
from sqlmodel import Session, text

with Session(engine) as session:
    result = session.exec(
        text(\"\"\"
SELECT COUNT(*) as total,
       MIN(session_date) as earliest,
       MAX(session_date) as latest
FROM consultation_records
WHERE counselor_id = '00000000-0000-0000-0001-000000000001'
        \"\"\")
    ).first()
    print(f'Total records: {result[0]}')
    print(f'Date range: {result[1]} to {result[2]}')
"
```

### Execute via GitHub UI

1. Go to **Actions** tab
2. Select **Seed Demo Consultation Records**
3. Click **Run workflow**
4. Select environment and action
5. Click **Run workflow**

## Option 4: Update Local Database Schema (For Testing)

If you need to test locally, update your local database schema:

```bash
cd backend

# Check current migration version
alembic current

# Check available migrations
alembic history

# Upgrade to latest
alembic upgrade head
```

**If migrations fail**, rebuild local database:

```bash
# Backup any important data first!

# Drop and recreate
PGPASSWORD=postgres dropdb -h localhost -U postgres career_creator
PGPASSWORD=postgres createdb -h localhost -U postgres career_creator

# Run migrations
alembic upgrade head

# Seed basic data
python -m app.core.seeds

# Now you can run the demo data seed
python scripts/seed_demo_consultation_records.py --env staging
```

## Recommended Approach

For production use, **Option 3 (GitHub Actions)** is recommended because:

1. ✅ No local environment dependencies
2. ✅ Secrets managed by GitHub
3. ✅ Audit trail in Actions history
4. ✅ Can be run by any team member
5. ✅ Production confirmation still required

For quick staging tests, **Option 2 (Direct DB Connection)** works fine.

## Safety Checklist

Before executing:

- [ ] Confirmed target environment (staging/production)
- [ ] Verified Dr. Sarah Chen account exists
- [ ] Checked no existing duplicate data
- [ ] Backed up database (production only)
- [ ] Reviewed script parameters
- [ ] Prepared rollback command

After executing:

- [ ] Verified record count matches expected (6-9)
- [ ] Checked data quality in UI
- [ ] Tested screenshot URLs (if uploaded to GCS)
- [ ] Confirmed counselor notes exist
- [ ] No errors in logs

## Troubleshooting

### Error: "column does not exist"

**Cause**: Database schema is outdated.

**Solution**: Run migrations first:
```bash
alembic upgrade head
```

### Error: "Counselor not found"

**Cause**: Demo account not seeded.

**Solution**: Run base seeds:
```bash
python -m app.core.seeds
```

### Error: "Game rule not found"

**Cause**: Game rule templates not seeded.

**Solution**: Run base seeds:
```bash
python -m app.core.seeds
```

### Script completes but no data visible in UI

**Cause**: Might have seeded wrong environment or cache issue.

**Solution**:
1. Check environment variable was correct
2. Query database directly to confirm data exists
3. Clear browser cache
4. Check if logged in as Dr. Sarah Chen

## Next Steps

After successfully seeding:

1. **Upload Demo Screenshots** (optional but recommended):
   ```bash
   gsutil cp demo-screenshots/* gs://career-creator-472207-screenshots/demo/
   ```

2. **Test in UI**:
   - Login as `demo.counselor@example.com` / `demo123`
   - Navigate to consultation records page
   - Verify all 6-9 records appear
   - Check screenshot rendering
   - Test filtering and sorting

3. **Document Demo Flow**:
   - Create demo script for sales/marketing
   - Screenshot key features
   - Note any UI improvements needed

---

**Last Updated**: 2026-01-15
**Status**: Ready for execution on staging/production
