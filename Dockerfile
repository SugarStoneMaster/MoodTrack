FROM --platform=linux/amd64 python:3.11-slim

# --- Build deps per compilare estensioni native (bcrypt, ecc.) -------------
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        gcc \
        pkg-config \
        libffi-dev \
        libssl-dev \
        curl \
        gnupg2 \
        ca-certificates \
        apt-transport-https \
        unixodbc-dev \
    && rm -rf /var/lib/apt/lists/*

# --- ODBC 18 per SQL Server (install dopo i build deps) --------------------
RUN curl -sSL https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor -o /usr/share/keyrings/microsoft.gpg && \
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft.gpg] https://packages.microsoft.com/debian/12/prod bookworm main" \
      > /etc/apt/sources.list.d/mssql-release.list && \
    apt-get update && ACCEPT_EULA=Y apt-get install -y msodbcsql18 && \
    rm -rf /var/lib/apt/lists/*

# --- App -------------------------------------------------------------------
WORKDIR /app
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1

COPY requirements.txt .

# upgrade pip / setuptools / wheel e poi install deps
RUN pip install --upgrade pip setuptools wheel \
 && pip install --no-cache-dir -r requirements.txt

# copy source
COPY app/ ./app

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]