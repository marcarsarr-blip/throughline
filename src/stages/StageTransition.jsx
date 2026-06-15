// StageTransition.jsx — Stage 7 · Transition path + skills to acquire
import { useState } from "react";
import { URGENCY, SKILL_TYPE } from "../data.js";
import { Card, Eyebrow, StageHeader, NextBar } from "../components/primitives.jsx";
import { useAnalysis } from "../analysis/context.jsx";

export function StageTransition({ onNext, conns = {} }) {
  const { analysis, roleById } = useAnalysis();
  const TRANSITION = analysis.transition;
  const [filter, setFilter] = useState("all");
  const skills = TRANSITION.skills.filter((s) => filter === "all" || s.urgency === filter);
  const live = Object.entries(conns).filter(([, v]) => v).map(([k]) => k.toUpperCase());
  return (
    <div className="fade-in" style={{ maxWidth: 1000, margin: "0 auto" }}>
      <StageHeader
        eyebrow="Step 7 · Transition"
        title="How the team gets from here to there"
        lede="A phased path, plus the theoretical and practical skills each role needs to pick up — sequenced by urgency."
      />

      {live.length > 0 && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 9, marginTop: 18, padding: "10px 15px", background: "var(--accent-tint)", border: "1px solid var(--accent-tint-2)", borderRadius: 999, fontSize: 12.5, color: "var(--accent-ink)", fontWeight: 600 }}>
          <span style={{ width: 8, height: 8, borderRadius: 999, background: "var(--accent)" }} />
          <span style={{ fontFamily: "var(--mono)" }}>Grounded in live data from {live.join(" · ")}</span>
        </div>
      )}

      {/* phases */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 28 }}>
        {TRANSITION.phases.map((p) => (
          <Card key={p.id} pad={20}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: URGENCY[p.urgency].dot }} />
              <Eyebrow>{p.name}</Eyebrow>
            </div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 500, margin: "6px 0 8px" }}>{p.tag}</div>
            <p style={{ margin: "0 0 13px", fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5 }}>{p.focus}</p>
            <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8 }}>
              {p.moves.map((m, j) => (
                <li key={j} style={{ display: "flex", gap: 8, fontSize: 12.5, lineHeight: 1.4, color: "var(--ink)" }}>
                  <span style={{ color: "var(--accent)", marginTop: 1 }}>◦</span>{m}
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      {/* skills */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 32, marginBottom: 14 }}>
        <h2 style={{ margin: 0, fontFamily: "var(--serif)", fontWeight: 500, fontSize: 24 }}>Skills to acquire</h2>
        <div style={{ display: "flex", gap: 6 }}>
          {[["all", "All"], ["immediate", "Immediate"], ["near", "Near-term"], ["future", "Future"]].map(([k, lbl]) => (
            <button key={k} onClick={() => setFilter(k)} style={{
              padding: "6px 13px", borderRadius: 999, fontSize: 12.5, fontWeight: 600,
              border: `1px solid ${filter === k ? "var(--accent)" : "var(--line)"}`,
              background: filter === k ? "var(--accent-tint)" : "var(--surface)",
              color: filter === k ? "var(--accent-ink)" : "var(--ink-soft)",
            }}>{lbl}</button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {skills.map((s, i) => (
          <Card key={i} pad={17}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: URGENCY[s.urgency].dot, marginTop: 6, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.35 }}>{s.name}</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 9, alignItems: "center" }}>
                  <Tag color={SKILL_TYPE[s.type].var}>{SKILL_TYPE[s.type].label}</Tag>
                  <span style={{ fontSize: 11.5, fontFamily: "var(--mono)", color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.05em" }}>{s.mode === "theory" ? "Theory" : "Practice"}</span>
                  <span style={{ fontSize: 11.5, color: "var(--ink-faint)" }}>· {s.forRole === "All" ? "Whole team" : s.forRole === "new" ? "Orchestrator" : roleNames(s.forRole, roleById)}</span>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <NextBar hint="That's the full picture — ready to take it to people." onNext={onNext} label="Export for discussion" />
    </div>
  );
}

function roleNames(csv, roleById) {
  return csv.split(",").map((id) => (roleById[id] ? roleById[id].initials : id)).join(" · ");
}

function Tag({ children, color }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 600, color: "var(--ink)" }}>
      <span style={{ width: 7, height: 7, borderRadius: 2, background: color }} />{children}
    </span>
  );
}
