FROM python:3.11-slim

WORKDIR /app

# Optional: Uncomment to enable TTS pronunciation (espeak-ng)
# RUN apt-get update && apt-get install -y --no-install-recommends espeak-ng && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000 8080

# Cloud Run sets PORT=8080; Render/local use 8000
CMD ["sh", "-c", "exec uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
