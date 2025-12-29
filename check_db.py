import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.environ.get("DB_URL")

conn = psycopg2.connect(DB_URL)
cur = conn.cursor()

print("--- PROFILES Table ---")
cur.execute("SELECT id, full_name, role FROM profiles")
rows = cur.fetchall()
for r in rows:
    print(r)

conn.close()
