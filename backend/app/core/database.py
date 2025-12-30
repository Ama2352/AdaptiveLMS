import psycopg2
from psycopg2 import pool
from .config import DB_URL

# Global connection pool
_pool = None

def init_db_pool():
    global _pool
    if _pool is None:
        _pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=1,
            maxconn=20,
            dsn=DB_URL
        )

def get_db_connection():
    global _pool
    if _pool is None:
        init_db_pool()
    return _pool.getconn()

def release_db_connection(conn):
    global _pool
    if _pool is not None and conn is not None:
        _pool.putconn(conn)
