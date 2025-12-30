import requests
import json
import uuid

BASE_URL = "http://127.0.0.1:8000"
STUDENT_ID = "00000000-0000-0000-0000-000000000002" # Student Yeu Deu (Elo 800)

def test_next_question():
    print(f"\n--- Testing NEXT QUESTION for Student {STUDENT_ID} ---")
    payload = {"student_id": STUDENT_ID}
    try:
        resp = requests.post(f"{BASE_URL}/next-question", json=payload)
        resp.raise_for_status()
        data = resp.json()
        print(f"Status: {data['status']}")
        if data['status'] == 'success':
            q = data['data']
            print(f"Received Question: {q['question_id']}")
            print(f"Concept: {q['concept_id']}")
            print(f"Difficulty: {q['difficulty_elo']}")
            return q
        else:
            print("Response:", data)
            return None
    except Exception as e:
        print(f"Error: {e}")
        return None

def test_submit_answer(question_id):
    print(f"\n--- Testing SUBMIT ANSWER for Question {question_id} ---")
    # Correct answer
    payload = {
        "student_id": STUDENT_ID,
        "question_id": question_id,
        "is_correct": True
    }
    try:
        resp = requests.post(f"{BASE_URL}/submit-answer", json=payload)
        resp.raise_for_status()
        data = resp.json()
        print(f"Status: {data['status']}")
        print(f"Old Elo: {data['old_elo']}")
        print(f"New Elo: {data['new_elo']}")
        print(f"Change: {data['elo_change']}")
        
        # Verify Elo increased (K=24, expected_p < 1, so change > 0)
        if data['elo_change'] > 0:
            print("✅ Elo matches expectation (Positive change for correct answer)")
        else:
            print("❌ Warning: Elo change not positive?")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    q = test_next_question()
    if q:
        test_submit_answer(q['question_id'])
