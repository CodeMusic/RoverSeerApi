# musai/Dockerfile

FROM python:3.11-slim

# 🧼 Optional: install system deps for psycopg2 & uvicorn
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libpq-dev curl && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# 👷 Set work directory
WORKDIR /app

# 🗂 Copy project
COPY . .

# 🔧 Upgrade pip & install dependencies
RUN pip install --upgrade pip
RUN pip install -e .

# 🚀 Run the app
CMD ["uvicorn", "suna.main:app", "--host", "0.0.0.0", "--port", "8000"]
