# Career Creator - Online Card Consultation System

An online card consultation system for career counselors and their visitors.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- Docker & Docker Compose

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/Youngger9765/career-creator.git
cd career-creator
```

2. Install dependencies:

**Frontend:**
```bash
cd frontend
npm install
```

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

3. Run with Docker Compose:
```bash
docker-compose up
```

Or run separately:

**Frontend (http://localhost:3000):**
```bash
cd frontend
npm run dev
```

**Backend (http://localhost:8000):**
```bash
cd backend
uvicorn app.main:app --reload
```

## 🧪 Testing

### Backend Tests (TDD)
```bash
cd backend
pytest
pytest -v  # verbose
pytest --cov  # with coverage
```

### Frontend Tests
```bash
cd frontend
npm run test
```

## 📁 Project Structure

```
career-creator/
├── frontend/          # Next.js frontend
├── backend/           # FastAPI backend
├── docker-compose.yml # Development environment
└── docs/             # Documentation
```

## 📚 Documentation

- [Product Requirements (PRD)](./PRD.md)
- [System Architecture](./ARCHITECTURE.md)
- [Development Guidelines](./CLAUDE.md)

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python 3.11, SQLAlchemy
- **Database**: PostgreSQL (Supabase)
- **Deployment**: GCP Cloud Run

## 📝 License

Private - All rights reserved