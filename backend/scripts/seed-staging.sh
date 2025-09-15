#!/bin/bash

# Seed staging database
# This script uses environment variables to avoid exposing credentials

echo "🌱 Seeding staging database..."

# Load staging environment variables
if [ -f ".env.staging" ]; then
    export $(cat .env.staging | grep -v '^#' | xargs)
    echo "✅ Loaded staging environment variables"
else
    echo "❌ .env.staging file not found!"
    exit 1
fi

# Run the seed script
echo "📦 Running seed script..."
python scripts/seed_database.py

if [ $? -eq 0 ]; then
    echo "✅ Seeding completed successfully!"
else
    echo "❌ Seeding failed!"
    exit 1
fi
