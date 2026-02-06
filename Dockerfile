# Root-level Dockerfile for Render when Docker context = repo root
# Use: Dockerfile Path = ./Dockerfile, Docker Context = . (or leave default)
FROM python:3.11-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

EXPOSE 8000

CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
