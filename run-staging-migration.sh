#!/bin/bash

# Run database migration on staging environment

echo "🚀 Running database migration on staging environment..."

# Set staging database URL
export DATABASE_URL="postgresql://career_creator_user:xxxxx@xxxxx/career_creator_staging"

cd backend

# Run migration
echo "📦 Running alembic upgrade..."
alembic upgrade head

echo "✅ Migration completed!"
