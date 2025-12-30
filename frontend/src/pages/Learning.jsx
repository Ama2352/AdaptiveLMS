import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getNextQuestion, submitAnswer, getStudentProgress } from "../api";
import LoadingSpinner from "../components/LoadingSpinner";
import ProgressSidebar from "../components/ProgressSidebar";

export default function Learning() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // Initial load
  const [questionLoading, setQuestionLoading] = useState(false); // Between questions
  const [question, setQuestion] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(null);
  const [selectedOption, setSelectedOption] = useState(null);

  const studentId = localStorage.getItem("studentId");

  useEffect(() => {
    if (!studentId) {
      navigate("/");
      return;
    }
    // Initial fetch of both question and progress
    const init = async () => {
      setLoading(true);
      await Promise.all([
        loadNextQuestion(false), // false = don't set loading inside
        updateProgress(),
      ]);
      setLoading(false);
    };
    init();
  }, [studentId, navigate]);

  const updateProgress = async () => {
    try {
      const p = await getStudentProgress(studentId);
      setProgress(p);
    } catch (e) {
      console.error(e);
    }
  };

  const loadNextQuestion = async (showLoadingEffect = true) => {
    if (showLoadingEffect) setQuestionLoading(true);
    setFeedback(null);
    setSelectedOption(null);
    setQuestion(null);
    setError(null);

    try {
      const res = await getNextQuestion(studentId);
      if (res.status === "error") {
        setError(res.message);
      } else if (res.status === "all_mastered") {
        setError("🎉 All concepts mastered! Great job!");
      } else {
        console.log("Q Data:", res.data);
        setQuestion(res.data);
      }
    } catch (err) {
      setError("Failed to load question. Backend may be offline.");
      console.error(err);
    } finally {
      if (showLoadingEffect) setQuestionLoading(false);
    }
  };

  const handleOptionClick = async (option) => {
    if (feedback || selectedOption) return; // Prevent double clicks

    setSelectedOption(option);

    // Logic Note: Using text matching as per MVP limitation (see Learning.jsx v1)
    const isCorrect = option.text === "Correct Answer";

    try {
      const res = await submitAnswer(
        studentId,
        question.question_id,
        isCorrect
      );
      setFeedback({
        isCorrect,
        oldElo: res.old_elo,
        newElo: res.new_elo,
        change: res.elo_change,
        mastered: res.is_mastered,
      });

      // Update sidebar progress immediately
      updateProgress();
    } catch (err) {
      alert("Error submitting answer");
      setSelectedOption(null); // Reset on error
    }
  };

  // Layout Structure
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <ProgressSidebar
        progress={progress}
        studentId={studentId}
        activeConceptId={question?.concept_id}
      />

      <div
        style={{
          flex: 1,
          padding: "2rem",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        {loading ? (
          <LoadingSpinner text="Initializing session..." />
        ) : questionLoading ? (
          <LoadingSpinner text="Adapting to your level..." />
        ) : error ? (
          <div className="card" style={{ textAlign: "center" }}>
            <h2>Status</h2>
            <p>{error}</p>
            <button onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </button>
          </div>
        ) : question ? (
          <div
            className="card fade-in"
            style={{ maxWidth: "800px", width: "100%" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1rem",
                fontSize: "0.9rem",
                color: "var(--text-secondary)",
              }}
            >
              <span>Concept: {question.concept_id}</span>
              <span>Diff: {question.difficulty_elo}</span>
            </div>

            <h2 style={{ marginTop: 0 }}>
              Question {question.question_id}:{" "}
              {question.content_text
                .replace(/\(Difficulty: \d+\)/, "")
                .replace(/Question for \w+(\s|$)/, "")}
            </h2>

            <div style={{ display: "grid", gap: "1rem", marginTop: "2rem" }}>
              {question.options.map((opt, idx) => {
                const isSelected = selectedOption === opt;
                const isCorrectAnswer = opt.text === "Correct Answer";

                let bgColor = "var(--card-bg)";
                let borderColor = "#334155";

                if (feedback) {
                  if (isCorrectAnswer) {
                    bgColor = "rgba(16, 185, 129, 0.2)"; // Green tint
                    borderColor = "var(--success)";
                  } else if (isSelected && !feedback.isCorrect) {
                    bgColor = "rgba(239, 68, 68, 0.2)"; // Red tint
                    borderColor = "var(--error)";
                  }
                } else if (isSelected) {
                  borderColor = "var(--primary-color)";
                  bgColor = "rgba(99, 102, 241, 0.1)";
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleOptionClick(opt)}
                    disabled={!!selectedOption}
                    style={{
                      backgroundColor: bgColor,
                      border: `1px solid ${borderColor}`,
                      color: "white",
                      textAlign: "left",
                      padding: "1.5rem",
                      opacity:
                        feedback && !isCorrectAnswer && !isSelected ? 0.5 : 1,
                      transition: "all 0.2s",
                    }}
                  >
                    {opt.text}
                  </button>
                );
              })}
            </div>

            {feedback && (
              <div
                className="fade-in"
                style={{
                  marginTop: "2rem",
                  padding: "1.5rem",
                  background: feedback.isCorrect
                    ? "rgba(16, 185, 129, 0.1)"
                    : "rgba(239, 68, 68, 0.1)",
                  borderRadius: "12px",
                  border: `2px solid ${
                    feedback.isCorrect ? "var(--success)" : "var(--error)"
                  }`,
                }}
              >
                <h3
                  style={{
                    margin: "0 0 1rem 0",
                    color: feedback.isCorrect
                      ? "var(--success)"
                      : "var(--error)",
                    fontSize: "1.5rem",
                  }}
                >
                  {feedback.isCorrect ? "✅ Correct!" : "❌ Not quite"}
                </h3>

                <div
                  style={{
                    background: "rgba(99, 102, 241, 0.1)",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                      marginBottom: "0.25rem",
                    }}
                  >
                    Practicing: <strong>{question.concept_id}</strong>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "1rem",
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        ELO:{" "}
                      </span>
                      <strong
                        style={{
                          fontSize: "1.25rem",
                          color: "var(--primary-color)",
                        }}
                      >
                        {feedback.oldElo}
                      </strong>
                      <span
                        style={{
                          margin: "0 0.5rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        →
                      </span>
                      <strong
                        style={{
                          fontSize: "1.25rem",
                          color:
                            feedback.change >= 0
                              ? "var(--success)"
                              : "var(--error)",
                        }}
                      >
                        {feedback.newElo}
                      </strong>
                      <span
                        style={{
                          marginLeft: "0.5rem",
                          padding: "2px 8px",
                          borderRadius: "6px",
                          fontSize: "0.875rem",
                          fontWeight: "bold",
                          background:
                            feedback.change >= 0
                              ? "rgba(16, 185, 129, 0.2)"
                              : "rgba(239, 68, 68, 0.2)",
                          color:
                            feedback.change >= 0
                              ? "var(--success)"
                              : "var(--error)",
                        }}
                      >
                        {feedback.change > 0 ? "+" : ""}
                        {feedback.change ? feedback.change.toFixed(1) : 0}
                      </span>
                    </div>
                  </div>

                  {/* Progress to mastery */}
                  {!feedback.mastered && (
                    <div style={{ marginTop: "0.5rem" }}>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-secondary)",
                          marginBottom: "0.25rem",
                        }}
                      >
                        Progress to mastery (1250 ELO):
                      </div>
                      <div
                        style={{
                          width: "100%",
                          height: "8px",
                          background: "rgba(0,0,0,0.1)",
                          borderRadius: "4px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(
                              (feedback.newElo / 1250) * 100,
                              100
                            )}%`,
                            height: "100%",
                            background: "var(--primary-color)",
                            transition: "width 0.5s ease",
                          }}
                        />
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--text-secondary)",
                          marginTop: "0.25rem",
                        }}
                      >
                        {Math.max(1250 - feedback.newElo, 0)} points to go! 💪
                      </div>
                    </div>
                  )}
                </div>

                {feedback.mastered && (
                  <div
                    style={{
                      padding: "1rem",
                      background:
                        "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
                      borderRadius: "8px",
                      color: "white",
                      textAlign: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
                      🏆
                    </div>
                    <div style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
                      Concept Mastered!
                    </div>
                    <div style={{ fontSize: "0.875rem", opacity: 0.9 }}>
                      You've achieved {feedback.newElo} ELO in{" "}
                      {question.concept_id}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => loadNextQuestion(true)}
                  style={{
                    marginTop: "1rem",
                    width: "100%",
                    padding: "1rem",
                    fontSize: "1rem",
                  }}
                >
                  {feedback.mastered
                    ? "🎯 Next Concept"
                    : "Continue Learning →"}
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
