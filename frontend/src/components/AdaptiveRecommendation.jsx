import React from "react";
import { Target, ArrowRight } from "lucide-react";

export default function AdaptiveRecommendation({
  recommendation,
  onStartLearning,
}) {
  if (!recommendation) {
    return (
      <div
        style={{
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          borderRadius: "16px",
          padding: "2rem",
          color: "white",
          textAlign: "center",
          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
        <h3
          style={{
            fontSize: "1.5rem",
            fontWeight: "bold",
            margin: "0 0 0.5rem 0",
          }}
        >
          Amazing! You've mastered all concepts!
        </h3>
        <p style={{ opacity: 0.9, fontSize: "0.875rem" }}>
          All available topics are complete. Great work!
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
        borderRadius: "16px",
        padding: "2rem",
        color: "white",
        boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "start",
          gap: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.2)",
            borderRadius: "12px",
            padding: "0.75rem",
            backdropFilter: "blur(10px)",
          }}
        >
          <Target size={24} />
        </div>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "0.875rem",
              opacity: 0.9,
              marginBottom: "0.25rem",
            }}
          >
            💡 Next Recommended Concept
          </div>
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              margin: "0 0 0.5rem 0",
            }}
          >
            {recommendation.name}
          </h3>
          <div style={{ fontSize: "0.875rem", opacity: 0.9 }}>
            Current ELO: <strong>{recommendation.current_elo}</strong> | Gap to
            mastery: <strong>{recommendation.mastery_gap}</strong> points
          </div>
        </div>
      </div>

      <div
        style={{
          background: "rgba(255,255,255,0.15)",
          borderRadius: "12px",
          padding: "1rem",
          marginBottom: "1.5rem",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            fontSize: "0.75rem",
            fontWeight: "bold",
            marginBottom: "0.5rem",
            opacity: 0.9,
          }}
        >
          WHY THIS CONCEPT?
        </div>
        <p style={{ fontSize: "0.875rem", margin: 0, lineHeight: 1.5 }}>
          {recommendation.explanation}
        </p>
      </div>

      <button
        onClick={onStartLearning}
        style={{
          width: "100%",
          background: "white",
          color: "#6366f1",
          border: "none",
          borderRadius: "12px",
          padding: "1rem",
          fontSize: "1rem",
          fontWeight: "bold",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = "translateY(-2px)";
          e.target.style.boxShadow = "0 6px 12px rgba(0,0,0,0.15)";
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = "translateY(0)";
          e.target.style.boxShadow = "none";
        }}
      >
        Continue Learning
        <ArrowRight size={20} />
      </button>
    </div>
  );
}
