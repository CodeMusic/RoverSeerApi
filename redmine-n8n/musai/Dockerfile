# musai/Dockerfile
FROM python:3.11

WORKDIR /app

COPY . .

RUN pip install --upgrade pip
RUN pip install -e .  # or `pip install .` depending on setup

CMD ["uvicorn", "suna.main:app", "--host", "0.0.0.0", "--port", "8000"]
