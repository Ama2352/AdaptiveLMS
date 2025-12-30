import random
from fastapi import APIRouter, HTTPException
from psycopg2.extras import RealDictCursor
from ..core.database import get_db_connection
from ..core.config import MASTERY_THRESHOLD, BASE_K
from ..models.engine import NextQuestionRequest, StatusResponse, QuestionResponse, SubmitAnswerRequest, SubmitResponse

router = APIRouter()

@router.post("/next-question", response_model=StatusResponse)
def next_question(payload: NextQuestionRequest):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        student_id = str(payload.student_id)
        
        query = """
        SELECT 
            c.id as concept_id, 
            c.prerequisites,
            coalesce(sm.current_elo, 0) as current_elo, 
            coalesce(sm.is_mastered, false) as is_mastered
        FROM concepts c
        LEFT JOIN student_mastery sm ON c.id = sm.concept_id AND sm.user_id = %s
        """
        cur.execute(query, (student_id,))
        rows = cur.fetchall()
        
        if not rows:
            return StatusResponse(status="error", message="Student mastery not found (did you seed?)")

        mastery_map = {row['concept_id']: row for row in rows}
        candidate_concepts = []
        unmastered_count = 0
        
        for cid, data in mastery_map.items():
            if data['is_mastered'] or data['current_elo'] >= MASTERY_THRESHOLD:
                continue
                
            unmastered_count += 1
            prereqs = data['prerequisites']
            is_ready = True
            if prereqs:
                for pid in prereqs:
                    p_data = mastery_map.get(pid)
                    if not p_data or p_data['current_elo'] < MASTERY_THRESHOLD:
                        is_ready = False
                        break
            
            if is_ready:
                candidate_concepts.append(data)

        if unmastered_count == 0:
            return StatusResponse(status="all_mastered")

        candidates = candidate_concepts if candidate_concepts else [d for d in mastery_map.values() if d['current_elo'] < MASTERY_THRESHOLD]

        if not candidates:
             return StatusResponse(status="error", message="No candidates found")

        candidates_by_elo = {}
        for c in candidates:
            elo = c['current_elo']
            candidates_by_elo.setdefault(elo, []).append(c)
        
        sorted_elos = sorted(candidates_by_elo.keys())
        target_concept = None
        questions = []
        
        for elo in sorted_elos:
            group = candidates_by_elo[elo]
            random.shuffle(group)
            for concept_cand in group:
                cur.execute("SELECT * FROM questions WHERE concept_id = %s", (concept_cand['concept_id'],))
                qs = cur.fetchall()
                if qs:
                    target_concept = concept_cand
                    questions = qs
                    break
            if target_concept:
                break
        
        if not target_concept:
             return StatusResponse(status="error", message="No questions available")

        s_elo = target_concept['current_elo']
        candidates_q = []
        min_diff = float('inf')
        
        for q in questions:
            diff = abs(q['difficulty_elo'] - s_elo)
            if diff < min_diff:
                min_diff = diff
                candidates_q = [q]
            elif diff == min_diff:
                candidates_q.append(q)
        
        chosen_q = random.choice(candidates_q)
        safe_options = []
        raw_options = chosen_q['options']
        if isinstance(raw_options, list):
            for opt in raw_options:
                safe_options.append({"text": opt.get("text", "") if isinstance(opt, dict) else str(opt)})
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
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()

@router.post("/submit-answer", response_model=SubmitResponse)
def submit_answer(payload: SubmitAnswerRequest):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT concept_id, difficulty_elo FROM questions WHERE id = %s", (payload.question_id,))
        q_row = cur.fetchone()
        if not q_row:
             raise HTTPException(status_code=404, detail="Question not found")
        
        cid = q_row['concept_id']
        q_elo = q_row['difficulty_elo']
        
        cur.execute("SELECT current_elo, total_attempts FROM student_mastery WHERE user_id = %s AND concept_id = %s", 
                    (str(payload.student_id), cid))
        m_row = cur.fetchone()
        
        if not m_row:
             raise HTTPException(status_code=404, detail="Mastery record not found")
             
        s_elo_old = m_row['current_elo']
        old_attempts = m_row['total_attempts']
        
        expected_p = 1.0 / (1.0 + 10.0 ** ((q_elo - s_elo_old) / 400.0))
        actual_score = 1.0 if payload.is_correct else 0.0
        
        elo_change = BASE_K * (actual_score - expected_p)
        s_elo_new_int = int(round(s_elo_old + elo_change))
        is_mastered = s_elo_new_int >= MASTERY_THRESHOLD
        
        cur.execute("""
            UPDATE student_mastery
            SET current_elo = %s, total_attempts = %s, is_mastered = %s, updated_at = now()
            WHERE user_id = %s AND concept_id = %s
        """, (s_elo_new_int, old_attempts + 1, is_mastered, str(payload.student_id), cid))
        
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
