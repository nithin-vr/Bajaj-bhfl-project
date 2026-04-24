import { useState } from "react";
import "./App.css";

const API_URL = import.meta.env.VITE_API_URL || "https://bajaj-bhfl-project-sxdi.onrender.com/bfhl";

export default function App() {
  const [input, setInput] = useState("");
  const [response, setResponse] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setResponse(null);

    const data = input
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    if (!data.length) {
      setError("Please enter at least one edge.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/bfhl`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });
      const json = await res.json();
      setResponse(json);
    } catch {
      setError("Failed to reach the backend. Is it running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container">
      <h1>BFHL Graph Hierarchy</h1>

      <form onSubmit={handleSubmit}>
        <label htmlFor="edges">
          Enter edges (comma-separated, e.g. <code>A-&gt;B, B-&gt;C</code>)
        </label>
        <input
          id="edges"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="A->B, A->C, B->D"
          autoComplete="off"
        />
        <button type="submit" disabled={loading}>
          {loading ? "Processing…" : "Submit"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}

      {response && (
        <div className="result">
          <h2>Response</h2>
          <pre>{JSON.stringify(response, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
