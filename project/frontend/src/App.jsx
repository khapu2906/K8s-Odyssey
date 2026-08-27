import { useEffect, useState } from "react";

const API_URL = "";

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("token"));
  const [documentText, setDocumentText] = useState("");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : []))
      .then(setHistory)
      .catch(() => {});
  }, [token]);

  function handleLogin(newToken) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }

  function handleLogout() {
    localStorage.removeItem("token");
    setToken(null);
    setHistory([]);
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message, documentText }),
      });

      if (res.status === 401) {
        handleLogout();
        return;
      }

      const conversation = await res.json();
      setHistory((prev) => [...prev, conversation]);
      setMessage("");
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>AI Workspace</h1>
        <button onClick={handleLogout}>Log out</button>
      </div>

      <label>
        Document
        <textarea
          rows={6}
          style={{ width: "100%", display: "block", marginBottom: 16 }}
          placeholder="Paste some text here, then ask a question about it."
          value={documentText}
          onChange={(e) => setDocumentText(e.target.value)}
        />
      </label>

      <div style={{ marginBottom: 24 }}>
        {history.map((c) => (
          <div key={c.id} style={{ marginBottom: 12 }}>
            <div><strong>You:</strong> {c.message}</div>
            <div><strong>AI:</strong> {c.reply}</div>
          </div>
        ))}
      </div>

      <form onSubmit={sendMessage} style={{ display: "flex", gap: 8 }}>
        <input
          style={{ flex: 1 }}
          placeholder="Ask a question about the document above"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Asking..." : "Ask"}
        </button>
      </form>
    </div>
  );
}

function LoginForm({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const path = mode === "login" ? "/api/auth/login" : "/api/auth/signup";
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong");
      return;
    }

    if (mode === "signup") {
      setMode("login");
      setError("Account created — log in now.");
      return;
    }

    onLogin(data.token);
  }

  return (
    <div style={{ maxWidth: 320, margin: "80px auto", fontFamily: "sans-serif" }}>
      <h1>AI Workspace</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          style={{ width: "100%", marginBottom: 8, display: "block" }}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          style={{ width: "100%", marginBottom: 8, display: "block" }}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p style={{ color: "crimson" }}>{error}</p>}
        <button type="submit" style={{ width: "100%" }}>
          {mode === "login" ? "Log in" : "Sign up"}
        </button>
      </form>
      <button
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        style={{ marginTop: 8, background: "none", border: "none", textDecoration: "underline", cursor: "pointer" }}
      >
        {mode === "login" ? "Need an account? Sign up" : "Already have an account? Log in"}
      </button>
    </div>
  );
}
