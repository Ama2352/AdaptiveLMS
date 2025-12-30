import React, { useState } from "react";
import { ChevronDown, ChevronRight, Check, Play, Lock } from "lucide-react";

export default function LearningMap({ chapters, concepts }) {
  const [expandedChapters, setExpandedChapters] = useState({});

  if (!chapters || !concepts) return null;

  const toggleChapter = (chapterId) => {
    setExpandedChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const getStatusIcon = (status) => {
    if (status === "mastered")
      return <Check size={16} style={{ color: "#10b981" }} />;
    if (status === "ready")
      return <Play size={16} style={{ color: "#6366f1" }} />;
    return <Lock size={16} style={{ color: "#9ca3af" }} />;
  };

  const getStatusColor = (status) => {
    if (status === "mastered") return "#10b981";
    if (status === "ready") return "#6366f1";
    return "#9ca3af";
  };

  const getConceptsForChapter = (chapterId) => {
    return concepts.filter((c) => c.chapter_id === chapterId);
  };

  return (
    <div
      style={{
        background: "white",
        borderRadius: "16px",
        padding: "1.5rem",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
      }}
    >
      <h3
        style={{
          margin: "0 0 1rem 0",
          fontSize: "1.25rem",
          fontWeight: "bold",
          color: "#1f2937",
        }}
      >
        Learning Map
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        {chapters.map((chapter) => {
          const isExpanded = expandedChapters[chapter.id];
          const chapterConcepts = getConceptsForChapter(chapter.id);

          return (
            <div
              key={chapter.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
                overflow: "hidden",
              }}
            >
              {/* Chapter Header */}
              <button
                onClick={() => toggleChapter(chapter.id)}
                style={{
                  width: "100%",
                  padding: "1rem",
                  background:
                    chapter.progress_percent === 100 ? "#f0fdf4" : "#f9fafb",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  {isExpanded ? (
                    <ChevronDown size={20} />
                  ) : (
                    <ChevronRight size={20} />
                  )}
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontWeight: "bold", color: "#1f2937" }}>
                      {chapter.name}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>
                      {chapter.mastered_count} / {chapter.total_concepts}{" "}
                      mastered
                    </div>
                  </div>
                </div>

                <div
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  {/* Progress Bar */}
                  <div
                    style={{
                      width: "100px",
                      height: "8px",
                      background: "#e5e7eb",
                      borderRadius: "4px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${chapter.progress_percent}%`,
                        height: "100%",
                        background:
                          chapter.progress_percent === 100
                            ? "#10b981"
                            : "#6366f1",
                        transition: "width 0.3s",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: "bold",
                      color: "#6b7280",
                      minWidth: "50px",
                      textAlign: "right",
                    }}
                  >
                    {Math.round(chapter.progress_percent)}%
                  </span>
                </div>
              </button>

              {/* Concepts List */}
              {isExpanded && (
                <div
                  style={{
                    padding: "0.5rem 1rem 1rem 1rem",
                    background: "white",
                  }}
                >
                  {chapterConcepts.map((concept, idx) => (
                    <div
                      key={concept.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "0.75rem",
                        marginTop: idx > 0 ? "0.5rem" : 0,
                        background:
                          concept.status === "mastered"
                            ? "#f0fdf4"
                            : concept.status === "ready"
                            ? "#eff6ff"
                            : "#f9fafb",
                        borderRadius: "8px",
                        border: `1px solid ${
                          concept.status === "mastered"
                            ? "#d1fae5"
                            : concept.status === "ready"
                            ? "#dbeafe"
                            : "#e5e7eb"
                        }`,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.75rem",
                        }}
                      >
                        {getStatusIcon(concept.status)}
                        <div>
                          <div
                            style={{
                              fontWeight: "600",
                              color: "#1f2937",
                              fontSize: "0.875rem",
                            }}
                          >
                            {concept.name}
                          </div>
                          {concept.last_practiced && (
                            <div
                              style={{ fontSize: "0.7rem", color: "#9ca3af" }}
                            >
                              Last practiced:{" "}
                              {new Date(
                                concept.last_practiced
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "1rem",
                        }}
                      >
                        {/* ELO Progress Bar */}
                        <div style={{ textAlign: "right" }}>
                          <div
                            style={{
                              fontSize: "0.875rem",
                              fontWeight: "bold",
                              color: getStatusColor(concept.status),
                            }}
                          >
                            {concept.current_elo} ELO
                          </div>
                          {concept.status !== "locked" && (
                            <div
                              style={{ fontSize: "0.7rem", color: "#9ca3af" }}
                            >
                              {Math.round((concept.current_elo / 1250) * 100)}%
                              to mastery
                            </div>
                          )}
                        </div>
                        {concept.status !== "locked" && (
                          <div
                            style={{
                              width: "80px",
                              height: "6px",
                              background: "#e5e7eb",
                              borderRadius: "3px",
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                width: `${Math.min(
                                  (concept.current_elo / 1250) * 100,
                                  100
                                )}%`,
                                height: "100%",
                                background: getStatusColor(concept.status),
                              }}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
