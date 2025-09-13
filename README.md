# Career Creator - Online Card Consultation System

An online card consultation system for career counselors and their visitors.

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18.17.0+
- PostgreSQL 15
- Docker & Docker Compose (optional)

### Development Setup

1. Clone the repository:
```bash
git clone https://github.com/Youngger9765/career-creator.git
cd career-creator
```

2. **Install pre-commit hooks:**
```bash
pip install pre-commit
pre-commit install
```

3. Install dependencies:

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
alembic upgrade head  # Run database migrations
```

**Frontend:**
```bash
cd frontend
npm install
```

4. Run development servers:

**With Docker Compose:**
```bash
docker-compose up
```

**Or run separately:**

Backend (http://localhost:8000):
```bash
cd backend
uvicorn app.main:app --reload
```

Frontend (http://localhost:3000):
```bash
cd frontend
npm run dev
```

## 🧪 Testing

### Backend Tests (TDD)
```bash
cd backend
pytest
pytest -v  # verbose
pytest --cov=app --cov-report=term-missing  # with coverage report
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🔧 Code Quality

This project uses pre-commit hooks to ensure code quality. They run automatically on `git commit`.

### Tools included:
- **Python**: Black, Flake8, mypy, isort, Bandit
- **TypeScript/JavaScript**: ESLint, TypeScript compiler, Prettier
- **Security**: Gitleaks (secret detection)
- **Other**: SQL formatter, Markdown linter, Dockerfile linter

### Run manually:
```bash
pre-commit run --all-files
```

### Update hooks:
```bash
pre-commit autoupdate
```

## 📁 Project Structure

```
career-creator/
├── frontend/              # Next.js frontend
│   ├── src/
│   │   ├── app/          # App router pages
│   │   ├── components/   # React components
│   │   └── types/        # TypeScript types
│   └── package.json
│
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── api/          # API endpoints
│   │   ├── models/       # SQLModel models
│   │   └── core/         # Core configs
│   ├── tests/            # pytest tests
│   └── requirements.txt
│
├── .pre-commit-config.yaml  # Pre-commit hooks config
├── docker-compose.yml       # Development environment
└── docs/                    # Documentation
```

## 📚 Documentation

- [Product Requirements (PRD)](./PRD.md)
- [System Architecture](./ARCHITECTURE.md)
- [Development Guidelines](./CLAUDE.md)

## 🛠 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: FastAPI, Python 3.11, SQLModel (SQLAlchemy + Pydantic)
- **Database**: PostgreSQL (Supabase)
- **Testing**: pytest (backend), Jest (frontend)
- **Code Quality**: pre-commit, Black, ESLint, Prettier
- **Deployment**: GCP Cloud Run

## 📝 License

Private - All rights reserved