# Dockerfile
FROM --platform=linux/amd64 python:3.11-slim

# --- ODBC 18 per SQL Server ------------------------------------------------
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl gnupg2 ca-certificates apt-transport-https unixodbc-dev && \
    # importa la chiave Microsoft in formato dearmored (no apt-key):
    curl -sSL https://packages.microsoft.com/keys/microsoft.asc \
        | gpg --dearmor -o /usr/share/keyrings/microsoft.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft.gpg] \
        https://packages.microsoft.com/debian/12/prod bookworm main" \
        > /etc/apt/sources.list.d/mssql-release.list && \
    apt-get update && \
    ACCEPT_EULA=Y apt-get install -y msodbcsql18 && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# --- Python deps -----------------------------------------------------------
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- Source ----------------------------------------------------------------
COPY app/ ./app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]