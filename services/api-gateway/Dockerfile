# Jarvis OS API Gateway — Phase 0 Dockerfile (no app entry until Phase 2)
FROM python:3.11-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Phase 2: CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
CMD ["python", "-c", "print('Jarvis API gateway scaffold — implement app.main in Phase 2')"]
