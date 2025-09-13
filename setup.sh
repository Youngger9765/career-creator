#!/bin/bash

# Create directory structure
echo "Creating monorepo structure..."

# Frontend setup
mkdir -p frontend
cd frontend
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --eslint --turbopack
cd ..

# Backend setup
mkdir -p backend/app/{api,models,schemas,services,core}
mkdir -p backend/tests
mkdir -p backend/alembic

# Create backend requirements
cat > backend/requirements.txt << EOF
fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
psycopg2-binary==2.9.9
pydantic==2.5.3
pydantic[email]
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
alembic==1.13.1
pytest==7.4.4
pytest-asyncio==0.23.3
httpx==0.26.0
EOF

# Create backend main.py
cat > backend/app/main.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Career Creator API",
    description="Online card consultation system for career counselors",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Career Creator API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
EOF

echo "Setup complete!"