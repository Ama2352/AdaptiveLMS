import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../api";

export default function Login() {
  const [email, setEmail] = useState("yeu_deu@test.com");
  const [password, setPassword] = useState("password");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const resp = await login(email, password);
      if (resp.status === "success" && resp.student_id) {
        localStorage.setItem("studentId", resp.student_id);
        localStorage.setItem("userEmail", email);
        localStorage.setItem("userRole", resp.role || "student");

        if (resp.role === "teacher") {
          navigate("/teacher-dashboard");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError(resp.message || "Login failed");
      }
    } catch (error) {
      setError("Login error. Is backend running?");
    }
  };

  return (
    <div className="card fade-in">
      <h1 style={{ textAlign: "center", marginBottom: "2rem" }}>
        Adaptive Learning Login
      </h1>
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "var(--text-secondary)",
            }}
          >
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="student@test.com"
            required
          />
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              marginBottom: "0.5rem",
              color: "var(--text-secondary)",
            }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </div>
        {error && (
          <p style={{ color: "var(--error)", fontSize: "0.9rem" }}>{error}</p>
        )}
        <button type="submit" style={{ width: "100%" }}>
          Sign In
        </button>
      </form>

      <div
        style={{
          marginTop: "2rem",
          fontSize: "0.9em",
          color: "var(--text-secondary)",
        }}
      >
        <p>
          <strong>Demo Credentials:</strong>
        </p>
        <ul style={{ paddingLeft: "1.2rem" }}>
          <li>gioi_deu@test.com (1200)</li>
          <li>yeu_deu@test.com (800)</li>
          <li>yeu_hamso@test.com (800 mixed)</li>
        </ul>
      </div>
    </div>
  );
}
