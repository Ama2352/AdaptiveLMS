import React, { useEffect, useState } from "react";
import { getStudents, getStudentAnalytics } from "../api";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, BarChart2 } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudentName, setSelectedStudentName] = useState("");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const data = await getStudents();
      setStudents(data);
    } catch (err) {
      console.error("Failed to fetch students", err);
    }
  };

  const handleFetchAnalytics = async (student) => {
    setLoading(true);
    try {
      const data = await getStudentAnalytics(student.id);
      setAnalytics(data);
      setSelectedStudent(student.id);
      setSelectedStudentName(student.full_name);
    } catch (err) {
      console.error("Failed to fetch analytics", err);
    } finally {
      setLoading(false);
    }
  };

  const processData = () => {
    if (!analytics || !analytics.logs || analytics.logs.length === 0) {
      return { chartData: [], summary: null };
    }

    let currentAbility = 1000;
    const accumulatedData = analytics.logs.map((log, index) => {
      currentAbility += log.elo_change;

      return {
        step: index + 1,
        questionDiff: log.difficulty_elo || 1000,
        studentElo: currentAbility,
        concept: log.concept_id,
        outcome: log.is_correct ? "Correct" : "Incorrect",
        eloChange: log.elo_change,
        newElo: currentAbility,
      };
    });

    const uniqueConcepts = new Set(analytics.logs.map((l) => l.concept_id))
      .size;
    const finalElo =
      accumulatedData.length > 0
        ? accumulatedData[accumulatedData.length - 1].newElo
        : 1000;
    const totalSteps = accumulatedData.length;
    const totalGrowth = finalElo - 1000;

    return {
      chartData: accumulatedData,
      summary: {
        steps: totalSteps,
        finalElo: Math.round(finalElo),
        uniqueConcepts,
        totalGrowth:
          totalGrowth >= 0
            ? `+${Math.round(totalGrowth)}`
            : Math.round(totalGrowth),
      },
    };
  };

  const { chartData, summary } = processData();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "2rem",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <div
        style={{
          marginBottom: "2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => navigate("/")}
            style={{
              background: "#6366f1",
              border: "none",
              borderRadius: "12px",
              padding: "0.75rem",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
          >
            <ArrowLeft
              style={{ color: "white", width: "20px", height: "20px" }}
            />
          </button>
          <div>
            <div
              style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
            >
              <BarChart2
                style={{ color: "white", width: "24px", height: "24px" }}
              />
              <h1
                style={{
                  margin: 0,
                  color: "white",
                  fontSize: "2rem",
                  fontWeight: "bold",
                }}
              >
                Teacher Analytics
              </h1>
            </div>
            <p
              style={{
                margin: "0.25rem 0 0 0",
                color: "rgba(255,255,255,0.8)",
                fontSize: "0.9rem",
              }}
            >
              Teacher Mode:{" "}
              <strong>
                {localStorage.getItem("userEmail") || "teacher@test.com"}
              </strong>
            </p>
          </div>
        </div>
      </div>

      {/* Student List */}
      <div style={{ marginBottom: "2rem" }}>
        <h2
          style={{
            color: "white",
            fontSize: "1.5rem",
            fontWeight: "bold",
            marginBottom: "1rem",
          }}
        >
          Student List
        </h2>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            overflowX: "auto",
            paddingBottom: "0.5rem",
          }}
        >
          {students.map((s) => (
            <button
              key={s.id}
              onClick={() => handleFetchAnalytics(s)}
              style={{
                background:
                  selectedStudent === s.id
                    ? "#6366f1"
                    : "rgba(255,255,255,0.2)",
                border: "none",
                borderRadius: "16px",
                padding: "1.5rem",
                minWidth: "200px",
                cursor: "pointer",
                transition: "all 0.3s",
                backdropFilter: "blur(10px)",
                color: "white",
              }}
            >
              <User
                style={{
                  margin: "0 auto 0.5rem",
                  width: "32px",
                  height: "32px",
                }}
              />
              <div style={{ fontWeight: "bold", marginBottom: "0.25rem" }}>
                {s.full_name}
              </div>
              <div style={{ fontSize: "0.75rem", opacity: 0.8 }}>
                ID: {s.id.slice(0, 8)}...
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Analytics Content */}
      {selectedStudent && summary ? (
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* Summary Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1rem",
            }}
          >
            {[
              { label: "STEPS", value: summary.steps, color: "#1f2937" },
              { label: "FINAL ELO", value: summary.finalElo, color: "#6366f1" },
              {
                label: "TOTAL GROWTH",
                value: summary.totalGrowth,
                color: "#10b981",
              },
              {
                label: "UNIQUE CONCEPTS",
                value: summary.uniqueConcepts,
                color: "#f59e0b",
              },
            ].map((stat, i) => (
              <div
                key={i}
                style={{
                  background: "white",
                  borderRadius: "16px",
                  padding: "1.5rem",
                  boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  transition: "transform 0.2s",
                }}
              >
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    color: "#9ca3af",
                    letterSpacing: "0.05em",
                    marginBottom: "0.5rem",
                  }}
                >
                  {stat.label}
                </div>
                <div
                  style={{
                    fontSize: "2.5rem",
                    fontWeight: "black",
                    color: stat.color,
                  }}
                >
                  {stat.value}
                </div>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              padding: "2rem",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "1.25rem",
                fontWeight: "bold",
                color: "#1f2937",
                marginBottom: "1.5rem",
              }}
            >
              Learning Trajectory
            </h3>
            <div style={{ width: "100%", height: "400px" }}>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorStudent"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#8b5cf6"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#8b5cf6"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis
                      dataKey="step"
                      stroke="#9ca3af"
                      style={{ fontSize: "12px" }}
                      label={{
                        value: "Step (Questions)",
                        position: "insideBottom",
                        offset: -5,
                      }}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      style={{ fontSize: "12px" }}
                      label={{
                        value: "ELO Score",
                        angle: -90,
                        position: "insideLeft",
                      }}
                      domain={["auto", "auto"]}
                    />
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div
                              style={{
                                background: "white",
                                border: "none",
                                borderRadius: "12px",
                                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                padding: "1rem",
                              }}
                            >
                              <div
                                style={{
                                  fontSize: "0.875rem",
                                  fontWeight: "bold",
                                  color: "#1f2937",
                                  marginBottom: "0.5rem",
                                }}
                              >
                                Step #{data.step}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#6b7280",
                                  marginBottom: "0.25rem",
                                }}
                              >
                                <strong>Concept:</strong> {data.concept}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  marginBottom: "0.5rem",
                                }}
                              >
                                <strong>Outcome:</strong>{" "}
                                <span
                                  style={{
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                    background:
                                      data.outcome === "Correct"
                                        ? "#d1fae5"
                                        : "#fee2e2",
                                    color:
                                      data.outcome === "Correct"
                                        ? "#065f46"
                                        : "#991b1b",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {data.outcome}
                                </span>
                              </div>
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#fbbf24",
                                  marginBottom: "0.25rem",
                                }}
                              >
                                <strong>Question Diff:</strong>{" "}
                                {data.questionDiff}
                              </div>
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#8b5cf6",
                                  fontWeight: "bold",
                                }}
                              >
                                <strong>Student Mastery (ELO):</strong>{" "}
                                {data.studentElo}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Legend />
                    <ReferenceLine
                      y={1250}
                      stroke="#10b981"
                      strokeDasharray="3 3"
                      label="Mastery"
                    />
                    <Line
                      type="monotone"
                      dataKey="studentElo"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{
                        fill: "#8b5cf6",
                        strokeWidth: 2,
                        r: 4,
                        stroke: "white",
                      }}
                      activeDot={{ r: 6 }}
                      name="Student Mastery (ELO)"
                      fill="url(#colorStudent)"
                    />
                    <Line
                      type="stepAfter"
                      dataKey="questionDiff"
                      stroke="#fbbf24"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      name="Question Diff"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "100%",
                    color: "#9ca3af",
                  }}
                >
                  No data available
                </div>
              )}
            </div>
          </div>

          {/* Session Log */}
          <div
            style={{
              background: "white",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            }}
          >
            <div
              style={{
                padding: "1.5rem",
                borderBottom: "1px solid #f3f4f6",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3
                style={{
                  fontSize: "1.25rem",
                  fontWeight: "bold",
                  color: "#1f2937",
                  margin: 0,
                }}
              >
                Detailed Session Log
              </h3>
              <span style={{ fontSize: "0.875rem", color: "#9ca3af" }}>
                {chartData.length} records found
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "left",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        color: "#6b7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Step
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "left",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        color: "#6b7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Concept
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "left",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        color: "#6b7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Outcome
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "right",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        color: "#6b7280",
                        textTransform: "uppercase",
                      }}
                    >
                      Difficulty
                    </th>
                    <th
                      style={{
                        padding: "1rem",
                        textAlign: "right",
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        color: "#6b7280",
                        textTransform: "uppercase",
                      }}
                    >
                      New ELO
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {[...chartData].reverse().map((row, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td
                        style={{
                          padding: "1rem",
                          fontSize: "0.875rem",
                          color: "#9ca3af",
                        }}
                      >
                        #{row.step}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          fontSize: "0.875rem",
                          fontWeight: "600",
                          color: "#1f2937",
                        }}
                      >
                        {row.concept}
                      </td>
                      <td style={{ padding: "1rem" }}>
                        <span
                          style={{
                            padding: "0.25rem 0.75rem",
                            borderRadius: "9999px",
                            fontSize: "0.75rem",
                            fontWeight: "bold",
                            background:
                              row.outcome === "Correct" ? "#d1fae5" : "#fee2e2",
                            color:
                              row.outcome === "Correct" ? "#065f46" : "#991b1b",
                          }}
                        >
                          {row.outcome.toUpperCase()}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          textAlign: "right",
                          fontSize: "0.875rem",
                          color: "#6b7280",
                        }}
                      >
                        {row.questionDiff}
                      </td>
                      <td
                        style={{
                          padding: "1rem",
                          textAlign: "right",
                          fontSize: "0.875rem",
                          fontWeight: "bold",
                          color: "#6366f1",
                        }}
                      >
                        {row.newElo}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            background: "rgba(255,255,255,0.2)",
            backdropFilter: "blur(10px)",
            borderRadius: "20px",
            padding: "4rem",
            textAlign: "center",
            color: "white",
          }}
        >
          <BarChart2
            style={{
              margin: "0 auto 1rem",
              width: "64px",
              height: "64px",
              opacity: 0.5,
            }}
          />
          <h3
            style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
              marginBottom: "0.5rem",
            }}
          >
            Choose a Student to Analyze
          </h3>
          <p style={{ opacity: 0.8 }}>
            Select a student from the list above to visualize their learning
            journey and ELO growth.
          </p>
        </div>
      )}
    </div>
  );
}
