from fastapi import APIRouter, HTTPException
from uuid import UUID
from psycopg2.extras import RealDictCursor
from ..core.database import get_db_connection, release_db_connection
from ..core.engine_logic import get_student_progress_logic
from ..models.student import ProgressResponse

router = APIRouter()

@router.get("/students")
def get_students():
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        cur.execute("SELECT id, full_name, role FROM profiles WHERE role = 'student'")
        rows = cur.fetchall()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        release_db_connection(conn)

@router.get("/analytics/{student_id}")
def get_student_analytics(student_id: UUID):
    conn = get_db_connection()
    try:
        cur = conn.cursor(cursor_factory=RealDictCursor)
        query = """
            SELECT 
                l.created_at as timestamp, 
                l.elo_change, 
                l.old_elo,
                l.new_elo,
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
        release_db_connection(conn)

@router.get("/student-progress/{student_id}", response_model=ProgressResponse)
def get_student_progress(student_id: UUID):
    conn = get_db_connection()
    try:
        data = get_student_progress_logic(str(student_id), conn)
        return ProgressResponse(**data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        release_db_connection(conn)
