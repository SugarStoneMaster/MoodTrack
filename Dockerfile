FROM python:3.11-slim

# -- base image setup --------------------------------------------------------
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# -- dipendenze --------------------------------------------------------------
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# -- codice applicativo ------------------------------------------------------
COPY api/ ./api

# -- avvio -------------------------------------------------------------------
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8080"]