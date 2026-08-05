import { useEffect, useState } from "react";

const API_URL = "http://localhost:8080";

export default function App() {
  const [documentText, setDocumentText] = useState("");
  const [message, setMessage] = useState("");
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/conversations`)
      .then((res) => res.json())
      .then(setHistory)
      .catch(() => {});
  }, []);

  async function sendMessage(e) {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, documentText }),
      });
      const conversation = await res.json();
      setHistory((prev) => [...prev, conversation]);
      setMessage("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", fontFamily: "sans-serif" }}>
      <h1>AI Workspace</h1>

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
