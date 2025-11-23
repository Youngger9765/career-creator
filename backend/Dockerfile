# Build stage - install dependencies
FROM python:3.11-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Install Python dependencies to /install directory
RUN pip install --no-cache-dir --prefix=/install -r requirements.txt

# Runtime stage - minimal image
FROM python:3.11-slim

WORKDIR /app

# Copy only the installed packages from builder
COPY --from=builder /install /usr/local

# Copy application code
COPY . .

# Environment variables will be set by Cloud Run
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

# Expose port
EXPOSE 8000

# Start the application (migrations run separately in deployment)
CMD uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}
