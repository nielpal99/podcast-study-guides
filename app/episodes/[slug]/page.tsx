import fs from "fs";
import path from "path";
import { notFound } from "next/navigation";
import ChatBar from "@/components/ChatBar";

function getEpisode(slug: string) {
  const filePath = path.join(process.cwd(), "data/episodes", `${slug}.json`);
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export async function generateStaticParams() {
  const dir = path.join(process.cwd(), "data/episodes");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  return files.map((f) => ({ slug: f.replace(".json", "") }));
}

export default async function EpisodePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const ep = getEpisode(slug);
  if (!ep) notFound();

  const s: React.CSSProperties = {
    maxWidth: 860, margin: "0 auto", padding: "0 2rem",
  };

  return (
    <div style={{ background: "var(--color-paper)", minHeight: "100vh", paddingBottom: 100 }}>
      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(250,249,247,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--color-border)",
        padding: "0 2rem", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 52,
      }}>
        <a href="/" style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "1rem", color: "var(--color-ink)", textDecoration: "none" }}>
          ← Podcast Study Guides
        </a>
        <span style={{ fontSize: "0.75rem", color: "var(--color-ink-light)" }}>{ep.show}</span>
      </nav>

      {/* Hero */}
      <header style={{ ...s, paddingTop: 96, paddingBottom: 48 }}>
        <div style={{ fontSize: "0.7rem", color: "var(--color-red)", fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: "0.75rem" }}>{ep.show}</div>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 600, color: "var(--color-ink)", marginBottom: "1.5rem" }}>{ep.title}</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1rem" }}>
          {[
            { label: "Market Cap", value: ep.hero.marketCap },
            { label: "System Revenue", value: ep.hero.systemRevenue },
            { label: "Daily Servings", value: ep.hero.dailyServings },
            { label: "Net Margin", value: ep.hero.netMargin },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 10, padding: "1rem 1.25rem" }}>
              <div style={{ fontSize: "0.6rem", color: "var(--color-ink-light)", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.25rem" }}>{label}</div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.5rem", fontWeight: 600, color: "var(--color-ink)" }}>{value}</div>
            </div>
          ))}
        </div>
      </header>

      {/* Founding Timeline */}
      <section style={{ ...s, marginBottom: 56 }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: 600, color: "var(--color-ink)", marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: "2px solid var(--color-red)" }}>
          Founding Story &amp; Timeline
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {ep.founding.map((item: { year: string; event: string }, i: number) => (
            <div key={i} style={{ display: "flex", gap: "1.25rem", alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0, width: 52, fontFamily: "var(--font-serif)", fontWeight: 600, color: "var(--color-red)", fontSize: "0.9rem", paddingTop: "0.15rem" }}>{item.year}</div>
              <div style={{ color: "var(--color-ink-mid)", lineHeight: 1.65, fontSize: "0.95rem" }}>{item.event}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Business Model */}
      <section style={{ ...s, marginBottom: 56 }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: 600, color: "var(--color-ink)", marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: "2px solid var(--color-red)" }}>
          Business Model
        </h2>
        <p style={{ color: "var(--color-ink-mid)", lineHeight: 1.75, marginBottom: "1.25rem", fontSize: "0.95rem" }}>{ep.bizmodel.summary}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
          {ep.bizmodel.points.map((point: string, i: number) => (
            <div key={i} style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 10, padding: "1.25rem" }}>
              <div style={{ fontSize: "0.6rem", color: "var(--color-red)", fontWeight: 600, letterSpacing: "0.1em", marginBottom: "0.5rem" }}>0{i + 1}</div>
              <p style={{ fontSize: "0.88rem", color: "var(--color-ink-mid)", lineHeight: 1.6 }}>{point}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Financials */}
      <section style={{ ...s, marginBottom: 56 }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: 600, color: "var(--color-ink)", marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: "2px solid var(--color-red)" }}>
          Financial Milestones
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" }}>
          {ep.financials.map((item: { label: string; value: string }, i: number) => (
            <div key={i} style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 10, padding: "1rem 1.25rem" }}>
              <div style={{ fontSize: "0.6rem", color: "var(--color-ink-light)", fontWeight: 500, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.25rem" }}>{item.label}</div>
              <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontWeight: 600, color: "var(--color-ink)" }}>{item.value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Competitive */}
      <section style={{ ...s, marginBottom: 56 }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: 600, color: "var(--color-ink)", marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: "2px solid var(--color-red)" }}>
          Competitive Landscape
        </h2>
        <p style={{ color: "var(--color-ink-mid)", lineHeight: 1.75, marginBottom: "1.25rem", fontSize: "0.95rem" }}>{ep.competitive.summary}</p>
        <ul style={{ display: "flex", flexDirection: "column", gap: "0.75rem", listStyle: "none" }}>
          {ep.competitive.points.map((point: string, i: number) => (
            <li key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <span style={{ color: "var(--color-red)", fontWeight: 600, flexShrink: 0 }}>—</span>
              <span style={{ color: "var(--color-ink-mid)", lineHeight: 1.65, fontSize: "0.95rem" }}>{point}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Lessons */}
      <section style={{ ...s, marginBottom: 56 }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: 600, color: "var(--color-ink)", marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: "2px solid var(--color-red)" }}>
          Key Lessons
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {ep.lessons.points.map((point: string, i: number) => (
            <div key={i} style={{ background: "#fff", border: "1px solid var(--color-border)", borderLeft: "3px solid var(--color-red)", borderRadius: "0 10px 10px 0", padding: "1rem 1.25rem", display: "flex", gap: "1rem", alignItems: "flex-start" }}>
              <span style={{ fontFamily: "var(--font-serif)", fontWeight: 600, color: "var(--color-red)", fontSize: "1.1rem", flexShrink: 0 }}>{i + 1}</span>
              <p style={{ fontSize: "0.93rem", color: "var(--color-ink-mid)", lineHeight: 1.65 }}>{point}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quotes */}
      <section style={{ ...s, marginBottom: 56 }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: 600, color: "var(--color-ink)", marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: "2px solid var(--color-red)" }}>
          Memorable Quotes
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {ep.quotes.map((q: { text: string; speaker: string }, i: number) => (
            <blockquote key={i} style={{ background: "var(--color-red-light)", borderLeft: "3px solid var(--color-red)", borderRadius: "0 10px 10px 0", padding: "1.25rem 1.5rem" }}>
              <p style={{ fontFamily: "var(--font-serif)", fontStyle: "italic", fontSize: "1.05rem", color: "var(--color-ink)", lineHeight: 1.65, marginBottom: "0.5rem" }}>&ldquo;{q.text}&rdquo;</p>
              <cite style={{ fontSize: "0.8rem", color: "var(--color-ink-mid)", fontStyle: "normal" }}>— {q.speaker}</cite>
            </blockquote>
          ))}
        </div>
      </section>

      {/* Discussion */}
      <section style={{ ...s, marginBottom: 56 }}>
        <h2 style={{ fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: 600, color: "var(--color-ink)", marginBottom: "1.5rem", paddingBottom: "0.75rem", borderBottom: "2px solid var(--color-red)" }}>
          Discussion Questions
        </h2>
        <ol style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingLeft: "1.5rem" }}>
          {ep.discussion.questions.map((q: string, i: number) => (
            <li key={i} style={{ color: "var(--color-ink-mid)", lineHeight: 1.65, fontSize: "0.95rem" }}>{q}</li>
          ))}
        </ol>
      </section>

      {/* Chat bar */}
      <ChatBar episode={slug} />
    </div>
  );
}
