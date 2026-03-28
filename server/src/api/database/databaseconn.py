# server/src/api/database/databaseconn.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# Устанавливаем переменные окружения явно
os.environ['PGCLIENTENCODING'] = 'UTF8'

# Используем простую строку подключения
SQLALCHEMY_DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/wind_turbine_db"

print("Database URL:", SQLALCHEMY_DATABASE_URL.replace("postgres", "***"))

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True,
    connect_args={
        'client_encoding': 'utf8',
        'options': '-c client_encoding=utf8'
    }
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()