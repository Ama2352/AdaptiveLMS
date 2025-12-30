import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getStudentProgress } from "../api";
import MasteryProfile from "../components/MasteryProfile";
import LearningMap from "../components/LearningMap";
import AdaptiveRecommendation from "../components/AdaptiveRecommendation";
import { AlertCircle, Trophy, LogOut } from "lucide-react";

export default function Dashboard() {
  const navigate = useNavigate();
  const [studentId, setStudentId] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = localStorage.getItem("studentId");
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
      console.error("Failed to load progress", e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartLearning = () => {
    navigate("/learning");
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          fontSize: "1.25rem",
        }}
      >
        Loading your learning data...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "2rem",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              color: "white",
              fontSize: "2rem",
              fontWeight: "bold",
            }}
          >
            My Learning Dashboard
          </h1>
          <p
            style={{
              margin: "0.25rem 0 0 0",
              color: "rgba(255,255,255,0.8)",
              fontSize: "0.875rem",
            }}
          >
            Welcome back, {localStorage.getItem("userEmail")}
          </p>
        </div>
        <button
          onClick={handleLogout}
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "none",
            borderRadius: "8px",
            padding: "0.5rem 1rem",
            color: "white",
            fontSize: "0.875rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
            backdropFilter: "blur(10px)",
          }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        {/* Mastery Profile */}
        <MasteryProfile data={progress} />

        {/* Main Content Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 1fr",
            gap: "1.5rem",
          }}
        >
          {/* Left Column: Learning Map */}
          <LearningMap
            chapters={progress?.chapters}
            concepts={progress?.concepts}
          />

          {/* Right Column: Recommendation & Side Panels */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            {/* Adaptive Recommendation */}
            <AdaptiveRecommendation
              recommendation={progress?.recommended_concept}
              onStartLearning={handleStartLearning}
            />

            {/* Needs Attention */}
            {progress?.needs_attention &&
              progress.needs_attention.length > 0 && (
                <div
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "1.5rem",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <AlertCircle size={20} style={{ color: "#f59e0b" }} />
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "1rem",
                        fontWeight: "bold",
                        color: "#1f2937",
                      }}
                    >
                      Needs Attention
                    </h4>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    {progress.needs_attention.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "0.75rem",
                          background: "#fef3c7",
                          borderRadius: "8px",
                          borderLeft: "3px solid #f59e0b",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: "#92400e",
                          }}
                        >
                          {item.name}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "#b45309" }}>
                          {item.current_elo} ELO •{" "}
                          {item.status === "declining"
                            ? "Declining"
                            : "Low mastery"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Recent Achievements */}
            {progress?.recent_achievements &&
              progress.recent_achievements.length > 0 && (
                <div
                  style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "1.5rem",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      marginBottom: "1rem",
                    }}
                  >
                    <Trophy size={20} style={{ color: "#10b981" }} />
                    <h4
                      style={{
                        margin: 0,
                        fontSize: "1rem",
                        fontWeight: "bold",
                        color: "#1f2937",
                      }}
                    >
                      Recent Achievements
                    </h4>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                    }}
                  >
                    {progress.recent_achievements.map((achievement, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "0.75rem",
                          background: "#f0fdf4",
                          borderRadius: "8px",
                          borderLeft: "3px solid #10b981",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: "600",
                            color: "#065f46",
                          }}
                        >
                          ✅ Mastered: {achievement.concept}
                        </div>
                        <div style={{ fontSize: "0.7rem", color: "#059669" }}>
                          {new Date(achievement.timestamp).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}
