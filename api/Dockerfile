# backend/Dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY . .
COPY data ./data 

RUN pip install --no-cache-dir -r requirements.txt

CMD ["uvicorn", "index:app", "--host", "0.0.0.0", "--port", "8000"]
