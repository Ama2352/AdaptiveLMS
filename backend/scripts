import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()
DB_URL = os.environ.get("DB_URL")

def apply_schema():
    if not DB_URL:
        print("Error: DB_URL not found")
        return

    print("Connecting to DB...")
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    print("Reading schema.sql...")
    with open("schema.sql", "r", encoding="utf-8") as f:
        schema_sql = f.read()

    print("Executing schema...")
    try:
        cur.execute(schema_sql)
        conn.commit()
        print("✅ Schema applied successfully.")
    except Exception as e:
        conn.rollback()
        print(f"❌ Error applying schema: {e}")
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    apply_schema()
