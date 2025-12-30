import React from "react";
import { BarChart2 } from "lucide-react";

export default function MasteryProfile({ data }) {
  if (!data) return null;

  const getEloColor = (elo) => {
    if (elo >= 1250) return "#10b981"; // Green
    if (elo >= 1000) return "#f59e0b"; // Orange
    return "#ef4444"; // Red
  };

  const getLevelColor = (level) => {
    const colors = {
      Advanced: "#10b981",
      Intermediate: "#6366f1",
      Beginner: "#ef4444",
    };
    return colors[level] || "#6b7280";
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "1.5rem",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        display: "flex",
        alignItems: "center",
        gap: "2rem",
      }}
    >
      {/* Circular Progress */}
      <div style={{ position: "relative", width: "120px", height: "120px" }}>
        <svg width="120" height="120" style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="10"
          />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="#6366f1"
            strokeWidth="10"
            strokeDasharray={`${(data.overall_mastery / 100) * 314} 314`}
            strokeLinecap="round"
          />
        </svg>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: "1.75rem",
              fontWeight: "bold",
              color: "#1f2937",
            }}
          >
            {Math.round(data.overall_mastery)}%
          </div>
          <div style={{ fontSize: "0.65rem", color: "#9ca3af" }}>Mastery</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ flex: 1 }}>
        <h3
          style={{
            margin: "0 0 0.5rem 0",
            fontSize: "1.25rem",
            fontWeight: "bold",
            color: "#1f2937",
          }}
        >
          Your Learning Profile
        </h3>
        <div style={{ display: "flex", gap: "1rem", marginBottom: "0.75rem" }}>
          <div>
            <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
              Average ELO:{" "}
            </span>
            <span
              style={{
                fontSize: "1rem",
                fontWeight: "bold",
                color: getEloColor(data.average_elo),
              }}
            >
              {data.average_elo}
            </span>
          </div>
          <div>
            <span style={{ fontSize: "0.75rem", color: "#6b7280" }}>
              Level:{" "}
            </span>
            <span
              style={{
                fontSize: "0.875rem",
                fontWeight: "bold",
                background: `${getLevelColor(data.level)}20`,
                color: getLevelColor(data.level),
                padding: "2px 8px",
                borderRadius: "6px",
              }}
            >
              {data.level}
            </span>
          </div>
        </div>
        <div style={{ fontSize: "0.875rem", color: "#6b7280" }}>
          {data.mastered_concepts} / {data.total_concepts} concepts mastered
        </div>
      </div>

      {/* Quick Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "1rem",
          borderLeft: "1px solid #e5e7eb",
          paddingLeft: "2rem",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#6366f1" }}
          >
            {data.streak || 0}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Streak</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#10b981" }}
          >
            {data.total_questions}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Total Q</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div
            style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#f59e0b" }}
          >
            {data.today_questions}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Today</div>
        </div>
      </div>
    </div>
  );
}
