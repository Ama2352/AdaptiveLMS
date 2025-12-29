import { useNavigate } from "react-router-dom";

export default function ProgressSidebar({
  progress,
  studentId,
  activeConceptId,
}) {
  const navigate = useNavigate();

  if (!progress) return null;

  const { total_concepts, mastered_concepts, progress_details } = progress;
  const percent = Math.round((mastered_concepts / total_concepts) * 100) || 0;

  return (
    <div
      className="sidebar"
      style={{
        width: "320px",
        background: "var(--card-bg)",
        padding: "1.5rem",
        height: "100vh",
        overflowY: "auto",
        position: "sticky",
        top: 0,
        borderRight: "1px solid #334155",
        display: "flex",
        flexDirection: "column",
        boxShadow: "4px 0 24px rgba(0,0,0,0.2)",
      }}
    >
      <h3 style={{ marginTop: 0, marginBottom: "1.5rem" }}>Your Journey</h3>

      <div
        style={{
          marginBottom: "2rem",
          background: "#0f172a",
          padding: "1rem",
          borderRadius: "12px",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "0.5rem",
            fontSize: "0.9rem",
            color: "#94a3b8",
          }}
        >
          <span>Mastery Progress</span>
          <span style={{ color: "white", fontWeight: "bold" }}>{percent}%</span>
        </div>
        <div
          style={{
            background: "#334155",
            height: "12px",
            borderRadius: "6px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${percent}%`,
              background:
                "linear-gradient(90deg, var(--primary-color), var(--success))",
              height: "100%",
              transition: "width 1s ease-in-out",
            }}
          ></div>
        </div>
        <p
          style={{
            fontSize: "0.8rem",
            color: "#64748b",
            marginTop: "0.5rem",
            textAlign: "right",
          }}
        >
          {mastered_concepts} of {total_concepts} Concepts Mastered
        </p>
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingRight: "0.5rem" }}>
        {progress_details.map((item) => {
          const isMastered = item.is_mastered;
          const isActive = item.concept_id === activeConceptId;

          return (
            <div
              key={item.concept_id}
              id={`concept-${item.concept_id}`}
              style={{
                padding: "1rem",
                marginBottom: "0.8rem",
                borderRadius: "10px",
                background: isActive
                  ? "rgba(99, 102, 241, 0.2)"
                  : isMastered
                  ? "rgba(16, 185, 129, 0.05)"
                  : "transparent",
                border: isActive
                  ? "1px solid var(--primary-color)"
                  : "1px solid transparent",
                borderLeft: `4px solid ${
                  isMastered
                    ? "var(--success)"
                    : isActive
                    ? "var(--primary-color)"
                    : "transparent"
                }`,
                transition: "all 0.3s ease",
              }}
            >
              <div
                style={{
                  fontSize: "0.9rem",
                  fontWeight: isActive ? 700 : 500,
                  color: isMastered
                    ? "#10b981"
                    : isActive
                    ? "white"
                    : "var(--text-secondary)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {isActive && <span style={{ fontSize: "0.8em" }}>▶</span>}
                {item.concept_name || item.concept_id}
              </div>

              <div
                style={{
                  fontSize: "0.75rem",
                  marginTop: "0.5rem",
                  display: "flex",
                  justifyContent: "space-between",
                  color: "#64748b",
                }}
              >
                <span>
                  ELO:{" "}
                  <strong style={{ color: isActive ? "white" : "inherit" }}>
                    {item.current_elo}
                  </strong>
                </span>
                {isMastered && (
                  <span style={{ color: "var(--success)", fontWeight: "bold" }}>
                    MASTERED
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={() => {
          if (window.confirm("Exit learning session?")) navigate("/dashboard");
        }}
        style={{ marginTop: "1rem", background: "#334155", fontSize: "0.9rem" }}
      >
        Exit Session
      </button>
    </div>
  );
}
