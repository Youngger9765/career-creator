#!/bin/bash

# Script to rebuild staging database

echo "🔄 Starting staging database rebuild..."

# Export staging environment variables
export DATABASE_URL="postgresql://postgres.nnjdyxiiyhawwbkfyhtr:tJuY08NBljdc00F0@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"
export DIRECT_DATABASE_URL="postgresql://postgres.nnjdyxiiyhawwbkfyhtr:tJuY08NBljdc00F0@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres"

cd backend

echo "⚠️  WARNING: This will DROP and REBUILD the staging database!"
echo "Press Ctrl+C to cancel, or wait 5 seconds to continue..."
sleep 5

# Step 1: Downgrade to base (removes all tables)
echo "📦 Step 1: Dropping all tables..."
alembic downgrade base

# Step 2: Upgrade to latest (recreate all tables)
echo "📦 Step 2: Running all migrations..."
alembic upgrade head

# Step 3: Show current revision
echo "📦 Step 3: Verifying migration status..."
alembic current

echo "✅ Staging database rebuild completed!"
