import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudents, getStudentProgress } from "../api";
import LoadingSpinner from "../components/LoadingSpinner";
import KnowledgeGraph from "../components/KnowledgeGraph";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentProgress, setStudentProgress] = useState(null);

  // Mock active concept for viewing purposes (none active)
  const [viewMode, setViewMode] = useState("list"); // 'list' or 'detail'

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const data = await getStudents();
      setStudents(data);
    } catch (e) {
      console.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = async (student) => {
    setLoading(true);
    try {
      const prog = await getStudentProgress(student.id);
      setStudentProgress(prog);
      setSelectedStudent(student);
      setViewMode("detail");
    } catch (e) {
      alert("Failed to load progress");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading class data..." />;

  // Detail View (Graph)
  if (viewMode === "detail" && selectedStudent) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          padding: "1rem",
          background: "#020617",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <button
              onClick={() => setViewMode("list")}
              style={{
                background: "transparent",
                border: "1px solid #334155",
                color: "#e2e8f0",
                padding: "0.5rem 1rem",
              }}
            >
              ← Back to Class
            </button>
            <div>
              <h2 style={{ margin: 0, color: "white" }}>
                {selectedStudent.full_name}
              </h2>
              <span style={{ color: "#64748b", fontSize: "0.9rem" }}>
                Knowledge Graph & Mastery Path
              </span>
            </div>
          </div>

          <div
            style={{
              background: "#1e293b",
              padding: "0.5rem 1.5rem",
              borderRadius: "8px",
              border: "1px solid #334155",
            }}
          >
            <span
              style={{
                color: "#94a3b8",
                fontSize: "0.8rem",
                marginRight: "0.5rem",
              }}
            >
              Total Mastery
            </span>
            <strong style={{ color: "#10b981", fontSize: "1.2rem" }}>
              {studentProgress
                ? Math.round(
                    (studentProgress.mastered_concepts /
                      studentProgress.total_concepts) *
                      100
                  )
                : 0}
              %
            </strong>
          </div>
        </div>

        {/* Graph Container */}
        <div
          style={{
            flex: 1,
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid #334155",
          }}
        >
          <KnowledgeGraph data={studentProgress} />
        </div>
      </div>
    );
  }

  // List View
  return (
    <div style={{ padding: "2rem", maxWidth: "1000px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h1>Teacher Dashboard</h1>
        <button
          onClick={() => {
            localStorage.clear();
            navigate("/");
          }}
          style={{ background: "transparent", border: "1px solid #334155" }}
        >
          Logout
        </button>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>My Students</h3>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "1rem",
          }}
        >
          <thead>
            <tr
              style={{ textAlign: "left", borderBottom: "1px solid #334155" }}
            >
              <th style={{ padding: "1rem" }}>Name</th>
              <th style={{ padding: "1rem" }}>ID</th>
              <th style={{ padding: "1rem" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id} style={{ borderBottom: "1px solid #1e293b" }}>
                <td style={{ padding: "1rem" }}>{s.full_name}</td>
                <td
                  style={{
                    padding: "1rem",
                    fontFamily: "monospace",
                    color: "#94a3b8",
                  }}
                >
                  {s.id}
                </td>
                <td style={{ padding: "1rem" }}>
                  <button
                    onClick={() => handleStudentClick(s)}
                    style={{ fontSize: "0.8rem", padding: "0.5rem 1rem" }}
                  >
                    View Progress
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
