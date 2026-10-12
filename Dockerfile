# ==========================================
# Stage 1: Build Frontend (React + Vite PWA)
# ==========================================
FROM node:20-slim AS frontend-builder
WORKDIR /app/web

# Install dependencies
COPY web/package*.json ./
RUN npm ci

# Copy source and build
COPY web/ ./
RUN npm run build

# ==========================================
# Stage 2: Backend (Django + Python 3.12)
# ==========================================
FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Install system libraries needed for psycopg2 / build tools
RUN apt-get update \
    && apt-get install -y --no-install-recommends gcc libpq-dev \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY backend/requirements.txt /app/backend/
RUN pip install --no-cache-dir -r /app/backend/requirements.txt

# Copy backend, media, and content factory output
COPY backend/ /app/backend/
COPY media/ /app/media/
COPY content_factory/ /app/content_factory/

# Copy compiled frontend assets from Stage 1 into /app/web/dist
COPY --from=frontend-builder /app/web/dist /app/web/dist

# Set working directory to backend
WORKDIR /app/backend

# Render expects web services to listen on port 10000 by default
ENV PORT=10000
EXPOSE 10000

# Start script: run migrations, collect static, seed demo data, start gunicorn on $PORT (10000)
CMD ["sh", "-c", "python manage.py migrate --noinput && python manage.py collectstatic --noinput && python manage.py seed_demo --admin-password demo-admin-2026 && gunicorn edusaas.wsgi:application --bind 0.0.0.0:${PORT:-10000} --workers 2 --access-logfile - --error-logfile -"]
