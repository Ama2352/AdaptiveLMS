import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudentProgress } from "../api";
import LoadingSpinner from "../components/LoadingSpinner";

export default function Dashboard() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem("studentId");
    const email = localStorage.getItem("userEmail");
    if (!id) {
      navigate("/");
    } else {
      setStudentId(id);
      loadProgress(id);
    }
  }, [navigate]);

  const loadProgress = async (id) => {
    try {
      const data = await getStudentProgress(id);
      setProgress(data);
    } catch (e) {
      console.error("Failed to load progress");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading your dashboard..." />;

  return (
    <div
      className="card fade-in"
      style={{ textAlign: "center", maxWidth: "800px" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <h2 style={{ margin: 0 }}>My Dashboard</h2>
        <button
          onClick={() => {
            localStorage.clear();
            navigate("/");
          }}
          style={{
            background: "transparent",
            border: "1px solid #334155",
            color: "#94a3b8",
            fontSize: "0.8rem",
            padding: "0.5rem 1rem",
          }}
        >
          Logout
        </button>
      </div>

      {progress && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1.5rem",
            marginBottom: "3rem",
          }}
        >
          <div
            style={{
              background: "#1e293b",
              padding: "1.5rem",
              borderRadius: "12px",
              border: "1px solid #334155",
            }}
          >
            <h4
              style={{ margin: "0 0 1rem 0", color: "var(--text-secondary)" }}
            >
              Current Focus
            </h4>
            <div
              style={{
                fontSize: "1.1rem",
                fontWeight: "bold",
                color: "var(--primary-color)",
              }}
            >
              {progress.current_topic || "Course Completed!"}
            </div>
          </div>

          <div
            style={{
              background: "#1e293b",
              padding: "1.5rem",
              borderRadius: "12px",
              border: "1px solid #334155",
            }}
          >
            <h4
              style={{ margin: "0 0 1rem 0", color: "var(--text-secondary)" }}
            >
              Progress
            </h4>
            <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
              {Math.round(
                (progress.mastered_concepts / progress.total_concepts) * 100
              )}
              %
            </div>
            <p
              style={{
                fontSize: "0.8rem",
                margin: 0,
                color: "var(--text-secondary)",
              }}
            >
              {progress.mastered_concepts} / {progress.total_concepts} Mastered
            </p>
          </div>
        </div>
      )}

      <div
        style={{
          background: "linear-gradient(to right, #4338ca, #6366f1)",
          padding: "2rem",
          borderRadius: "12px",
        }}
      >
        <h3 style={{ marginTop: 0, color: "white" }}>Ready to continue?</h3>
        <p style={{ color: "#e0e7ff", marginBottom: "1.5rem" }}>
          The adaptive engine has prepared your next challenge based on your
          recent activity.
        </p>
        <button
          onClick={() => navigate("/learning")}
          style={{
            background: "white",
            color: "var(--primary-color)",
            fontWeight: "bold",
            padding: "1rem 3rem",
            fontSize: "1.1rem",
          }}
        >
          Start Learning
        </button>
      </div>
    </div>
  );
}
