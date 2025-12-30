import axios from "axios";

const API_BASE_URL = "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export const login = async (email, password) => {
  const response = await api.post("/login", { email, password });
  return response.data;
};

export const getNextQuestion = async (studentId) => {
  const response = await api.post("/next-question", { student_id: studentId });
  return response.data;
};

export const submitAnswer = async (studentId, questionId, isCorrect) => {
  const response = await api.post("/submit-answer", {
    student_id: studentId,
    question_id: questionId,
    is_correct: isCorrect,
  });
  return response.data;
};

export const getStudentProgress = async (studentId) => {
  const response = await api.get(`/student-progress/${studentId}`);
  return response.data;
};

export const getStudents = async () => {
  const response = await api.get("/students");
  return response.data;
};

export const getStudentAnalytics = async (studentId) => {
  const response = await api.get(`/analytics/${studentId}`);
  return response.data;
};
