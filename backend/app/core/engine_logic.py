import random
from psycopg2.extras import RealDictCursor
from .config import MASTERY_THRESHOLD

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
        "streak": 0,
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
