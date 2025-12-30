import psycopg2
from .config import DB_URL

def get_db_connection():
    if not DB_URL:
        raise Exception("DB_URL not configured")
    return psycopg2.connect(DB_URL)
