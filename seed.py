import os
import json
import pandas as pd
import psycopg2
from psycopg2.extras import execute_values, Json
from dotenv import load_dotenv
import uuid

# Load env variables
load_dotenv()
DB_URL = os.environ.get("DB_URL")

if not DB_URL:
    print("Error: DB_URL not found in .env")
    exit(1)

DATA_DIR = "docs"

def get_db_connection():
    return psycopg2.connect(DB_URL)

def load_csvs():
    """Load all necessary CSVs."""
    print("Loading CSVs...")
    concepts_map_df = pd.read_csv(os.path.join(DATA_DIR, "concept_to_chapter_map.csv"))
    
    # Load nodes.csv to ensure we don't miss concepts that might not have chapter map (though unlikely)
    # or to validate.
    nodes_df = pd.read_csv(os.path.join(DATA_DIR, "nodes.csv"))
    
    # Edges
    edges_path = os.path.join(DATA_DIR, "edges_csv.csv")
    if not os.path.exists(edges_path):
        edges_path = os.path.join(DATA_DIR, "edges.csv")
    edges_df = pd.read_csv(edges_path)
    
    questions_df = pd.read_csv(os.path.join(DATA_DIR, "question_bank.csv"))
    
    return concepts_map_df, nodes_df, edges_df, questions_df

def seed_chapters_and_concepts(conn, concepts_map_df, nodes_df, edges_df):
    """Seed Chapters and Concepts tables."""
    print("Seeding Chapters and Concepts...")
    cur = conn.cursor()
    
    # 1. Chapters
    # Unique chapters from map
    chapters = concepts_map_df['chapter'].dropna().unique()
    chapter_map = {} # name -> id
    
    for idx, chapter_name in enumerate(chapters):
        cur.execute("""
            INSERT INTO chapters (name, order_index)
            VALUES (%s, %s)
            ON CONFLICT (name) DO UPDATE SET order_index = EXCLUDED.order_index
            RETURNING id;
        """, (chapter_name, idx))
        row = cur.fetchone()
        if row:
            chapter_map[chapter_name] = row[0]
        else:
            # If for some reason update didn't return (postgres shouldn't do this with RETURNING), query it
            cur.execute("SELECT id FROM chapters WHERE name = %s", (chapter_name,))
            chapter_map[chapter_name] = cur.fetchone()[0]

    # 2. Concepts
    # Merge concepts from nodes.csv and properties from map
    # Primary list from nodes.csv to match the graph definition
    all_concepts = set(nodes_df['concept_id'].unique())
    # Add any from map that might be missing in nodes
    all_concepts.update(concepts_map_df['concept_id'].unique())
    
    # Map concept -> chapter
    c2ch = dict(zip(concepts_map_df['concept_id'], concepts_map_df['chapter']))
    
    # adjacency
    prereqs = {}
    for _, row in edges_df.iterrows():
        s, t = row['source'], row['target']
        if t not in prereqs:
            prereqs[t] = []
        prereqs[t].append(s)

    # Insert Concepts
    concept_rows = []
    for c_id in all_concepts:
        ch_name = c2ch.get(c_id)
        ch_id = chapter_map.get(ch_name)
        
        prereq_list = prereqs.get(c_id, [])
        
        concept_rows.append((
            c_id, 
            c_id, 
            ch_id, 
            Json(prereq_list)
        ))
        
    execute_values(cur, """
        INSERT INTO concepts (id, name, chapter_id, prerequisites)
        VALUES %s
        ON CONFLICT (id) DO UPDATE 
        SET chapter_id = EXCLUDED.chapter_id,
            prerequisites = EXCLUDED.prerequisites;
    """, concept_rows)
    
    conn.commit()
    print(f"Seeded {len(concept_rows)} concepts.")
    cur.close()

def seed_questions(conn, questions_df):
    """Seed Questions table."""
    print("Seeding Questions...")
    cur = conn.cursor()
    
    question_rows = []
    for _, row in questions_df.iterrows():
        q_id = row['question_id']
        c_id = row['concept_id']
        elo = int(row['elo_difficulty'])
        
        content = f"Question for {c_id} (Difficulty: {elo})"
        # Options: 1 correct, 3 distractors
        # Requirement: "options: 4 choices, exactly 1 correct"
        # Since API needs to validate answer, we can store correct index inside options json or separately?
        # Schema: options jsonb. 
        # Let's verify strict engine logic for answer checking. 
        # "Logic: Load question... selected_option_index OR is_correct"
        # Seed: options = [{"text":..., "is_correct":...}]
        options = [
            {"text": "Correct Answer", "is_correct": True},
            {"text": "Wrong A", "is_correct": False},
            {"text": "Wrong B", "is_correct": False},
            {"text": "Wrong C", "is_correct": False}
        ]
        
        question_rows.append((
            q_id,
            c_id,
            content,
            Json(options),
            elo
        ))
    
    execute_values(cur, """
        INSERT INTO questions (id, concept_id, content_text, options, difficulty_elo)
        VALUES %s
        ON CONFLICT (id) DO UPDATE
        SET options = EXCLUDED.options,
            difficulty_elo = EXCLUDED.difficulty_elo;
    """, question_rows)
    
    conn.commit()
    print(f"Seeded {len(question_rows)} questions.")
    cur.close()

def seed_users_and_mastery(conn, concepts_map_df, nodes_df):
    """Seed Students, Teacher, and Initial Mastery."""
    print("Seeding Users and Mastery...")
    cur = conn.cursor()
    
    # 3 std + 1 teacher
    users = [
        {"email": "gioi_deu@test.com", "role": "student", "full_name": "Student Gioi Deu", "uuid": "00000000-0000-0000-0000-000000000001"},
        {"email": "yeu_deu@test.com", "role": "student", "full_name": "Student Yeu Deu", "uuid": "00000000-0000-0000-0000-000000000002"},
        {"email": "yeu_hamso@test.com", "role": "student", "full_name": "Student Yeu HamSo", "uuid": "00000000-0000-0000-0000-000000000003"},
        {"email": "teacher@test.com", "role": "teacher", "full_name": "Teacher One", "uuid": "00000000-0000-0000-0000-000000000004"},
    ]
    
    # NOTE: We are bypassing auth.users insertion because we can't easily hash passwords for Supabase Auth in Python without libs.
    # WE will insert into PROFILES directly. 
    # IF FK exists to auth.users, this will FAIL if those UUIDs don't exist in auth.users.
    # However, for MVP with local dev or if we assume these IDs exist, we proceed.
    # If it fails, the user must manually create users or we accept profiles-only if FK is removed (but schema had FK).
    # Workaround: Insert dummy rows into auth.users IF we have access to it? 
    # Usually `auth` schema is protected.
    # Use: `INSERT INTO auth.users (id, email) VALUES ...` might work if using `postgres` superuser connection provided in DB_URL.
    
    for u in users:
        # Try to insert into auth.users (simplistic)
        try:
            # Check if exists
            cur.execute("SELECT id FROM auth.users WHERE id = %s", (u['uuid'],))
            if not cur.fetchone():
                try:
                    # Minimal insert for FK satisfaction
                    cur.execute("""
                        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
                        VALUES (%s, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', %s, '', now(), now(), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
                    """, (u['uuid'], u['email']))
                except Exception as e:
                    print(f"Warning: Could not insert into auth.users for {u['email']}: {e}")
        except Exception as e:
            print(f"Warning: Could not check auth.users: {e}")

        # Insert Profile
        cur.execute("""
            INSERT INTO profiles (id, role, full_name)
            VALUES (%s, %s, %s)
            ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;
        """, (u['uuid'], u['role'], u['full_name']))
    
    conn.commit()
    
    # Mastery
    # Loop students only
    students = [u for u in users if u['role'] == "student"]
    
    # All concepts
    # Re-fetch all concepts to match DB
    cur.execute("SELECT id, chapter_id FROM concepts")
    db_concepts = cur.fetchall() # list of (id, chapter_id)
    
    # Build concept->chapter_name map for logic
    cur.execute("SELECT id, name FROM chapters")
    ch_rows = cur.fetchall()
    ch_map = {row[0]: row[1] for row in ch_rows} # id -> name
    
    mastery_rows = []
    for s in students:
        s_uuid = s['uuid']
        s_email = s['email']
        
        for (c_id, ch_id) in db_concepts:
            ch_name = ch_map.get(ch_id, "")
            
            base_elo = 1200
            if s_email == "yeu_deu@test.com":
                base_elo = 800
            elif s_email == "yeu_hamso@test.com":
                if "Hàm số" in ch_name:
                    base_elo = 650
                else:
                    base_elo = 800
            
            is_mastered = base_elo >= 1250
            
            mastery_rows.append((
                s_uuid,
                c_id,
                base_elo,
                0,
                is_mastered
            ))
            
    execute_values(cur, """
        INSERT INTO student_mastery (user_id, concept_id, current_elo, total_attempts, is_mastered)
        VALUES %s
        ON CONFLICT (user_id, concept_id) DO UPDATE
        SET current_elo = EXCLUDED.current_elo,
            is_mastered = EXCLUDED.is_mastered;
    """, mastery_rows)
    
    conn.commit()
    print("Seeding Users/Mastery complete.")
    cur.close()

def main():
    conn = get_db_connection()
    try:
        concepts_map_df, nodes_df, edges_df, questions_df = load_csvs()
        seed_chapters_and_concepts(conn, concepts_map_df, nodes_df, edges_df)
        seed_questions(conn, questions_df)
        seed_users_and_mastery(conn, concepts_map_df, nodes_df)
        print("✅ Database seeding finished successfully.")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
