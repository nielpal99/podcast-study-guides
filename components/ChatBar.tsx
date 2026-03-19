"use client";

import { useState } from "react";

interface Source {
  id: number;
  text: string;
  score: number | null;
}

const API =
  typeof window !== "undefined" &&
  (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:8000"
    : "https://podcast-study-guides-api.up.railway.app";

export default function ChatBar({ episode }: { episode: string }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function ask() {
    if (!question.trim()) return;
    setLoading(true);
    setOpen(true);
    setAnswer("");
    setSources([]);
    try {
      const res = await fetch(`${API}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ episode, question }),
      });
      const data = await res.json();
      setAnswer(data.answer || data.detail || "No answer returned.");
      setSources(data.sources || []);
    } catch {
      setAnswer("Could not reach the API. Make sure the server is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Drawer */}
      {open && (
        <div style={{
          position: "fixed", bottom: 64, left: 0, right: 0, zIndex: 90,
          background: "#fff", borderTop: "1px solid var(--color-border)",
          maxHeight: "50vh", overflowY: "auto", padding: "1.5rem 2rem",
          boxShadow: "0 -8px 32px rgba(0,0,0,0.08)",
        }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <p style={{ fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-ink-light)" }}>Answer</p>
              <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-ink-light)", fontSize: "1rem" }}>✕</button>
            </div>
            {loading ? (
              <p style={{ color: "var(--color-ink-mid)", fontSize: "0.95rem" }}>Thinking…</p>
            ) : (
              <>
                <p style={{ color: "var(--color-ink)", lineHeight: 1.75, fontSize: "0.95rem", marginBottom: sources.length ? "1.25rem" : 0 }}>{answer}</p>
                {sources.length > 0 && (
                  <div>
                    <p style={{ fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--color-ink-light)", marginBottom: "0.75rem" }}>Sources</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      {sources.map((s) => (
                        <div key={s.id} style={{ background: "var(--color-paper-warm)", borderRadius: 8, padding: "0.75rem 1rem", fontSize: "0.82rem", color: "var(--color-ink-mid)", lineHeight: 1.6 }}>
                          <span style={{ fontWeight: 600, color: "var(--color-red)", marginRight: "0.5rem" }}>[{s.id}]</span>
                          {s.text}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Bar */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(250,249,247,0.96)", backdropFilter: "blur(12px)",
        borderTop: "1px solid var(--color-border)",
        padding: "0.75rem 2rem", display: "flex", gap: "0.75rem", alignItems: "center",
      }}>
        <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", gap: "0.75rem", alignItems: "center", width: "100%" }}>
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && ask()}
            placeholder="Ask anything about this episode…"
            style={{
              flex: 1, border: "1px solid var(--color-border)", borderRadius: 8,
              padding: "0.6rem 1rem", fontSize: "0.9rem", background: "#fff",
              color: "var(--color-ink)", outline: "none", fontFamily: "var(--font-sans)",
            }}
          />
          <button
            onClick={ask}
            disabled={loading}
            style={{
              background: "var(--color-red)", color: "#fff", border: "none",
              borderRadius: 8, padding: "0.6rem 1.25rem", fontSize: "0.85rem",
              fontWeight: 500, cursor: loading ? "wait" : "pointer",
              fontFamily: "var(--font-sans)", whiteSpace: "nowrap",
            }}
          >
            {loading ? "…" : "Ask"}
          </button>
        </div>
      </div>
    </>
  );
}
