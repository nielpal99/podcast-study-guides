import Link from "next/link";
import fs from "fs";
import path from "path";

interface Episode {
  slug: string;
  show: string;
  title: string;
  published: boolean;
  tags: string[];
}

function getEpisodes(): Episode[] {
  const dir = path.join(process.cwd(), "data/episodes");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  return files.map((f) => {
    const raw = fs.readFileSync(path.join(dir, f), "utf-8");
    const data = JSON.parse(raw);
    return { slug: data.slug, show: data.show, title: data.title, published: data.published, tags: data.tags };
  });
}

export default function Home() {
  const episodes = getEpisodes();
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-paper)" }}>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: "rgba(250,249,247,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--color-border)",
        padding: "0 2rem", display: "flex", alignItems: "center",
        justifyContent: "space-between", height: 52,
      }}>
        <span style={{ fontFamily: "var(--font-serif)", fontWeight: 600, fontSize: "1rem", color: "var(--color-ink)" }}>
          Podcast Study Guides
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--color-ink-light)", letterSpacing: "0.05em" }}>BETA</span>
      </nav>

      <section style={{ paddingTop: 120, paddingBottom: 64, textAlign: "center", maxWidth: 640, margin: "0 auto", padding: "120px 2rem 64px" }}>
        <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 600, lineHeight: 1.2, color: "var(--color-ink)", marginBottom: "1rem" }}>
          Learn from the best<br /><em>business podcasts</em>
        </h1>
        <p style={{ fontSize: "1.05rem", color: "var(--color-ink-mid)", lineHeight: 1.7 }}>
          Structured study guides with founding timelines, business model breakdowns, financial milestones, and a live Q&A powered by the transcript.
        </p>
      </section>

      <section style={{ maxWidth: 900, margin: "0 auto", padding: "0 2rem 6rem" }}>
        <p style={{ fontSize: "0.7rem", fontWeight: 500, letterSpacing: "0.12em", color: "var(--color-ink-light)", textTransform: "uppercase", marginBottom: "1.5rem" }}>
          Acquired
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.5rem" }}>
          {episodes.map((ep) =>
            ep.published ? (
              <Link key={ep.slug} href={`/episodes/${ep.slug}`} style={{ textDecoration: "none" }}>
                <div style={{ background: "#fff", border: "1px solid var(--color-border)", borderRadius: 12, padding: "1.5rem", cursor: "pointer" }}>
                  <div style={{ fontSize: "0.65rem", color: "var(--color-red)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>{ep.show}</div>
                  <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontWeight: 600, color: "var(--color-ink)", marginBottom: "0.75rem" }}>{ep.title}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                    {ep.tags.map((tag) => (
                      <span key={tag} style={{ fontSize: "0.65rem", background: "var(--color-paper-warm)", color: "var(--color-ink-mid)", padding: "2px 8px", borderRadius: 4, fontWeight: 500 }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </Link>
            ) : (
              <div key={ep.slug} style={{ background: "var(--color-paper-warm)", border: "1px solid var(--color-border)", borderRadius: 12, padding: "1.5rem", opacity: 0.5 }}>
                <div style={{ fontSize: "0.65rem", color: "var(--color-ink-light)", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.5rem" }}>{ep.show}</div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: "1.25rem", fontWeight: 600, color: "var(--color-ink)", marginBottom: "0.75rem" }}>{ep.title}</div>
                <span style={{ fontSize: "0.65rem", color: "var(--color-ink-light)", fontWeight: 500 }}>Coming soon</span>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}
