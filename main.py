import os
import random
import math
import psycopg2
from psycopg2.extras import RealDictCursor
from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional, Any
from dotenv import load_dotenv
from uuid import UUID

# --- CONFIG ---
MASTERY_THRESHOLD = 1250
BASE_K = 24
STRATEGY = "lowest_elo"

load_dotenv()
DB_URL = os.environ.get("DB_URL")

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Adaptive Engine API (Strict)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MODELS ---
class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    status: str
    student_id: Optional[str] = None
    role: Optional[str] = None
    message: Optional[str] = None

# ...

# --- AUTH SIMULATION ---
# Email -> (UUID, Role)
DEMO_USERS = {
    "gioi_deu@test.com": ("00000000-0000-0000-0000-000000000001", "student"),
    "yeu_deu@test.com": ("00000000-0000-0000-0000-000000000002", "student"),
    "yeu_hamso@test.com": ("00000000-0000-0000-0000-000000000003", "student"),
    "teacher@test.com": ("00000000-0000-0000-0000-000000000004", "teacher"),
}

@app.post("/login", response_model=LoginResponse)
def login_endpoint(payload: LoginRequest):
    # Simulating auth. In real app, check hash in DB.
    # For MVP, map email to fixed UUID.
    user_data = DEMO_USERS.get(payload.email)
    
    if user_data and payload.password: # Any password works for demo
        uid, role = user_data
        return LoginResponse(status="success", student_id=uid, role=role)
        
    return LoginResponse(status="error", message="Invalid credentials")

@app.get("/students")
def get_students():
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        # Fetch profiles where role is student
        cur.execute("SELECT id, full_name, role FROM profiles WHERE role = 'student'")
        rows = cur.fetchall()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@app.get("/analytics/{student_id}")
def get_student_analytics(student_id: UUID):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        # Fetch logs joined with question difficulty
        query = """
            SELECT 
                l.created_at as timestamp, 
                l.elo_change, 
                l.is_correct,
                l.concept_id,
                q.difficulty_elo
            FROM learning_logs l
            LEFT JOIN questions q ON l.question_id = q.id
            WHERE l.user_id = %s
            ORDER BY l.created_at ASC
        """
        cur.execute(query, (str(student_id),))
        logs = cur.fetchall()
        return {"logs": logs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

class NextQuestionRequest(BaseModel):
    student_id: UUID

class SubmitAnswerRequest(BaseModel):
    student_id: UUID
    question_id: str
    is_correct: bool

class QuestionResponse(BaseModel):
    question_id: str
    concept_id: str
    content_text: str
    options: List[dict]
    difficulty_elo: int

class StatusResponse(BaseModel):
    status: str
    message: Optional[str] = None
    data: Optional[QuestionResponse] = None

class ProgressResponse(BaseModel):
    total_concepts: int
    mastered_concepts: int
    current_topic: Optional[str] = None
    overall_mastery: float
    average_elo: int
    level: str
    streak: int
    total_questions: int
    today_questions: int
    chapters: List[dict]
    concepts: List[dict]
    recommended_concept: Optional[dict] = None
    needs_attention: List[dict]
    recent_achievements: List[dict]
    progress_details: List[dict]

class SubmitResponse(BaseModel):
    status: str
    old_elo: float
    new_elo: float
    elo_change: float
    is_mastered: bool
    mastery_threshold: int = MASTERY_THRESHOLD

# --- HELPERS ---
def get_student_progress_logic(student_id: str, conn):
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    # Get all concepts with mastery
    query = """
        SELECT 
            c.id as concept_id, 
            c.name as concept_name,
            c.chapter_id,
            c.prerequisites,
            ch.name as chapter_name,
            ch.order_index as chapter_order,
            coalesce(sm.current_elo, 1000) as current_elo, 
            coalesce(sm.is_mastered, false) as is_mastered,
            sm.updated_at as last_practiced
        FROM concepts c
        LEFT JOIN chapters ch ON c.chapter_id = ch.id
        LEFT JOIN student_mastery sm ON c.id = sm.concept_id AND sm.user_id = %s
        ORDER BY ch.order_index, c.id
    """
    cur.execute(query, (student_id,))
    rows = cur.fetchall()
    
    total = len(rows)
    mastered = sum(1 for r in rows if r['is_mastered'])
    
    # Calculate overall stats
    total_elo = sum(r['current_elo'] for r in rows)
    avg_elo = int(total_elo / total) if total > 0 else 1000
    overall_mastery = round((mastered / total * 100), 1) if total > 0 else 0
    
    # Determine level
    if avg_elo < 1000:
        level = "Beginner"
    elif avg_elo < 1250:
        level = "Intermediate"
    else:
        level = "Advanced"
    
    # Get total questions answered
    cur.execute("SELECT COUNT(*) as count FROM learning_logs WHERE user_id = %s", (student_id,))
    total_questions = cur.fetchone()['count']
    
    # Get today's questions
    cur.execute("""
        SELECT COUNT(*) as count FROM learning_logs 
        WHERE user_id = %s AND DATE(created_at) = CURRENT_DATE
    """, (student_id,))
    today_questions = cur.fetchone()['count']
    
    # Build mastery map for status calculation
    mastery_map = {r['concept_id']: r for r in rows}
    
    # Determine concept statuses
    concept_list = []
    for r in rows:
        c_id = r['concept_id']
        
        # Calculate status
        if r['is_mastered']:
            status = "mastered"
        else:
            prereqs = r['prerequisites'] or []
            all_met = True
            for p_id in prereqs:
                p_data = mastery_map.get(p_id)
                if not p_data or not p_data['is_mastered']:
                    all_met = False
                    break
            status = "ready" if all_met else "locked"
        
        concept_list.append({
            "id": r['concept_id'],
            "name": r['concept_name'],
            "chapter_id": r['chapter_id'],
            "chapter_name": r['chapter_name'],
            "status": status,
            "current_elo": r['current_elo'],
            "is_mastered": r['is_mastered'],
            "prerequisites": r['prerequisites'] or [],
            "last_practiced": r['last_practiced'].isoformat() if r['last_practiced'] else None
        })
    
    # Group by chapters
    chapters_dict = {}
    for c in concept_list:
        ch_id = c['chapter_id']
        if ch_id not in chapters_dict:
            chapters_dict[ch_id] = {
                "id": ch_id,
                "name": c['chapter_name'],
                "mastered_count": 0,
                "total_concepts": 0,
                "progress_percent": 0
            }
        chapters_dict[ch_id]['total_concepts'] += 1
        if c['is_mastered']:
            chapters_dict[ch_id]['mastered_count'] += 1
    
    for ch in chapters_dict.values():
        if ch['total_concepts'] > 0:
            ch['progress_percent'] = round((ch['mastered_count'] / ch['total_concepts']) * 100, 1)
    
    chapters = list(chapters_dict.values())
    
    # Find recommended concept (lowest ELO ready concept)
    ready_concepts = [c for c in concept_list if c['status'] == 'ready']
    recommended = None
    if ready_concepts:
        recommended = min(ready_concepts, key=lambda x: x['current_elo'])
        mastery_gap = MASTERY_THRESHOLD - recommended['current_elo']
        recommended['reason'] = "weakest_ready"
        recommended['explanation'] = f"This is your weakest ready concept ({recommended['current_elo']} ELO). Focus here to unlock advanced topics!"
        recommended['mastery_gap'] = mastery_gap
    
    # Needs attention (ready concepts with declining or low ELO)
    needs_attention = [
        {
            "concept_id": c['id'],
            "name": c['name'],
            "current_elo": c['current_elo'],
            "status": "declining" if c['current_elo'] < 1100 else "low"
        }
        for c in ready_concepts
        if c['current_elo'] < 1200 and not c['is_mastered']
    ][:3]  # Top 3
    
    # Recent achievements (recently mastered concepts)
    cur.execute("""
        SELECT c.id, c.name, sm.updated_at
        FROM student_mastery sm
        JOIN concepts c ON sm.concept_id = c.id
        WHERE sm.user_id = %s AND sm.is_mastered = true
        ORDER BY sm.updated_at DESC
        LIMIT 3
    """, (student_id,))
    recent_masteries = cur.fetchall()
    
    achievements = [
        {
            "type": "mastery",
            "concept": m['name'],
            "timestamp": m['updated_at'].isoformat()
        }
        for m in recent_masteries
    ]
    
    return {
        "overall_mastery": overall_mastery,
        "average_elo": avg_elo,
        "level": level,
        "streak": 0,  # TODO: Implement streak tracking
        "total_questions": total_questions,
        "today_questions": today_questions,
        "total_concepts": total,
        "mastered_concepts": mastered,
        "current_topic": recommended['name'] if recommended else "All concepts mastered!",
        "chapters": chapters,
        "concepts": concept_list,
        "recommended_concept": recommended,
        "needs_attention": needs_attention,
        "recent_achievements": achievements,
        "progress_details": rows
    }


@app.get("/student-progress/{student_id}", response_model=ProgressResponse)
def get_student_progress(student_id: UUID):
    conn = get_db_connection()
    try:
        data = get_student_progress_logic(str(student_id), conn)
        return ProgressResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

# Strict Engine Logic continues...


# --- DB HELPERS ---
def get_db_connection():
    if not DB_URL:
        raise Exception("DB_URL not configured")
    return psycopg2.connect(DB_URL)

# --- STRICT ENGINE LOGIC ---

@app.post("/next-question", response_model=StatusResponse)
def next_question(payload: NextQuestionRequest):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        student_id = str(payload.student_id)

        # 1. Fetch Mastery for ALL concepts
        # We need graph structure too. 
        # Efficient way: Fetch `concepts` table (with prereqs) JOIN `student_mastery`.
        
        query = """
        SELECT 
            c.id as concept_id, 
            c.prerequisites,
            coalesce(sm.current_elo, 0) as current_elo, -- Default 0 if missing (should be seeded though)
            coalesce(sm.is_mastered, false) as is_mastered
        FROM concepts c
        LEFT JOIN student_mastery sm ON c.id = sm.concept_id AND sm.user_id = %s
        """
        cur.execute(query, (student_id,))
        rows = cur.fetchall()
        
        if not rows:
            return StatusResponse(status="error", message="Student mastery not found (did you seed?)")

        # Build lookup maps
        mastery_map = {row['concept_id']: row for row in rows}
        
        # 2. Identify READY & UNMASTERED concepts
        # Ready Rule: Not Mastered AND (No Prereqs OR All Prereqs Mastered)
        candidate_concepts = []
        
        unmastered_count = 0
        
        for cid, data in mastery_map.items():
            if data['is_mastered']:
                continue
            
            # double check threshold just in case DB is stale (schema trigger handles it but let's be strict)
            if data['current_elo'] >= MASTERY_THRESHOLD:
                continue
                
            unmastered_count += 1
            
            prereqs = data['prerequisites'] # JSON list
            
            is_ready = True
            if prereqs:
                for pid in prereqs:
                    # If prereq does not exist in our map (bad data?), assume not ready or skip? 
                    # Assume strict graph integrity.
                    p_data = mastery_map.get(pid)
                    if not p_data: 
                        # Prereq missing from concepts table?
                        is_ready = False 
                        break
                    
                    # Prereq must be mastered (>= 1250)
                    if p_data['current_elo'] < MASTERY_THRESHOLD:
                        is_ready = False
                        break
            
            if is_ready:
                candidate_concepts.append(data)

        if unmastered_count == 0:
            return StatusResponse(status="all_mastered")

        # 4. Fallback: If unmastered > 0 but ready == 0
        if not candidate_concepts and unmastered_count > 0:
            # Fallback strategy: Pick lowest ELO among ALL unmastered
            candidates = [d for d in mastery_map.values() if d['current_elo'] < MASTERY_THRESHOLD]
        else:
            candidates = candidate_concepts

        if not candidates:
             return StatusResponse(status="error", message="No candidates found (All mastered or locked?)")

        # 5. Pick Concept & Question Loop
        # Strategy: Lowest ELO (Tie -> Random).
        # We need to process candidates in order of preference, but handling ties randomly.
        
        # Group by ELO
        candidates_by_elo = {}
        for c in candidates:
            elo = c['current_elo']
            if elo not in candidates_by_elo:
                candidates_by_elo[elo] = []
            candidates_by_elo[elo].append(c)
        
        # Sort ELOs
        sorted_elos = sorted(candidates_by_elo.keys())
        
        target_concept = None
        questions = []
        
        for elo in sorted_elos:
            # Get group (tied at this ELO)
            group = candidates_by_elo[elo]
            # Shuffle group to ensure random tie-break order
            random.shuffle(group)
            
            # Try each concept in this group
            for concept_cand in group:
                cid_cand = concept_cand['concept_id']
                
                # Check for questions
                cur.execute("SELECT * FROM questions WHERE concept_id = %s", (cid_cand,))
                qs = cur.fetchall()
                
                if qs:
                    target_concept = concept_cand
                    questions = qs
                    break
            
            if target_concept:
                break
        
        if not target_concept:
             return StatusResponse(status="error", message="No questions available for any Ready/Unmastered concepts")

        cid = target_concept['concept_id']
        s_elo = target_concept['current_elo']

        # 6. Find closest question
        # diff = abs(q_elo - s_elo)
        candidates_q = []
        min_diff = float('inf')
        
        for q in questions:
            diff = abs(q['difficulty_elo'] - s_elo)
            if diff < min_diff:
                min_diff = diff
                candidates_q = [q]
            elif diff == min_diff:
                candidates_q.append(q)
        
        # Tie-break random
        chosen_q = random.choice(candidates_q)
        
        # Sanitize options (hide is_correct if needed? Prompt said "do not leak correct answer")
        # seed.py stored options as [{"text":..., "is_correct":...}]
        # We must strip is_correct
        safe_options = []
        raw_options = chosen_q['options']
        if isinstance(raw_options, list):
            for opt in raw_options:
                # If opt is dict
                if isinstance(opt, dict):
                    safe_options.append({"text": opt.get("text", "")})
                else: 
                     safe_options.append({"text": str(opt)})
        else:
            safe_options = [{"text": "Options format error"}]

        return StatusResponse(
            status="success",
            data=QuestionResponse(
                question_id=chosen_q['id'],
                concept_id=chosen_q['concept_id'],
                content_text=chosen_q['content_text'],
                options=safe_options,
                difficulty_elo=chosen_q['difficulty_elo']
            )
        )

    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

def _pick_best_concept(candidates: List[dict]) -> dict:
    """Strategy: lowest_elo (tie -> random)"""
    # Find min elo
    min_elo = min(c['current_elo'] for c in candidates)
    
    # Filter those with min_elo
    best_ones = [c for c in candidates if c['current_elo'] == min_elo]
    
    # Random selection among ties
    return random.choice(best_ones)


@app.post("/submit-answer", response_model=SubmitResponse)
def submit_answer(payload: SubmitAnswerRequest):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # 1. Load Question + Concept ID
        cur.execute("SELECT concept_id, difficulty_elo FROM questions WHERE id = %s", (payload.question_id,))
        q_row = cur.fetchone()
        if not q_row:
             raise HTTPException(status_code=404, detail="Question not found")
        
        cid = q_row['concept_id']
        q_elo = q_row['difficulty_elo']
        
        # 2. Load Student Mastery
        cur.execute("SELECT current_elo, total_attempts FROM student_mastery WHERE user_id = %s AND concept_id = %s", 
                    (str(payload.student_id), cid))
        m_row = cur.fetchone()
        
        if not m_row:
             # Should not happen if student exists, maybe concept missing in mastery?
             # Auto-fix or error? Error.
             raise HTTPException(status_code=404, detail="Mastery record not found")
             
        s_elo_old = m_row['current_elo']
        old_attempts = m_row['total_attempts']
        
        # 3. Compute ELO Update (Strict)
        # P = 1 / (1 + 10 ^ ((Q - S)/400) )
        expected_p = 1.0 / (1.0 + 10.0 ** ((q_elo - s_elo_old) / 400.0))
        
        actual_score = 1.0 if payload.is_correct else 0.0
        
        # New = Old + K * (Actual - P)
        # K = 24 Constant
        elo_change = BASE_K * (actual_score - expected_p)
        s_elo_new = s_elo_old + elo_change
        
        # Round logic? Prompt doesn't specify rounding, but DB is int? 
        # Schema: `current_elo int`. So we must round.
        s_elo_new_int = int(round(s_elo_new))
        
        # 4. Update Mastery
        is_mastered = s_elo_new_int >= MASTERY_THRESHOLD
        new_attempts = old_attempts + 1
        
        # Transaction
        cur.execute("""
            UPDATE student_mastery
            SET current_elo = %s,
                total_attempts = %s,
                is_mastered = %s,
                updated_at = now()
            WHERE user_id = %s AND concept_id = %s
        """, (s_elo_new_int, new_attempts, is_mastered, str(payload.student_id), cid))
        
        # 5. Insert Log
        cur.execute("""
            INSERT INTO learning_logs (user_id, question_id, concept_id, is_correct, old_elo, new_elo, elo_change)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (str(payload.student_id), payload.question_id, cid, payload.is_correct, 
              s_elo_old, s_elo_new_int, int(round(elo_change))))
        
        conn.commit()
        
        return SubmitResponse(
            status="success",
            old_elo=s_elo_old,
            new_elo=s_elo_new_int,
            elo_change=elo_change,
            is_mastered=is_mastered
        )

    except HTTPException as he:
        raise he
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
