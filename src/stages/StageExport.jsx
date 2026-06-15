// StageExport.jsx — Stage 8 · Export (basis for discussion, not a decision)
import { useState } from "react";
import { LEVELS } from "../data.js";
import { Card, Eyebrow, Button, StageHeader } from "../components/primitives.jsx";
import { useAnalysis } from "../analysis/context.jsx";

export function StageExport({ onRestart, state, levels }) {
  const { analysis } = useAnalysis();
  const ACTIVITIES = analysis.activities;
  const ROLES = analysis.roles;
  const TRANSITION = analysis.transition;
  const [toast, setToast] = useState(null);
  function fire(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  }
  const movedUp = ACTIVITIES.filter((a) => LEVELS[levels[a.id] || a.proposed].index > LEVELS[a.current].index).length;

  return (
    <div className="fade-in" style={{ maxWidth: 820, margin: "0 auto" }}>
      <StageHeader
        eyebrow="Step 8 · Export"
        title="Take this to the table"
        lede="Throughline's output is a starting point for a real conversation — not a decision. Export it and walk your team through it."
      />

      <Card style={{ marginTop: 26 }} pad={28}>
        <Eyebrow>Summary · {state.teamName || analysis.team?.name || "Your team"}</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginTop: 18 }}>
          <Stat n={ROLES.reduce((a, r) => a + r.jtbd.length, 0)} l="jobs mapped" />
          <Stat n={ACTIVITIES.length} l="activities placed" />
          <Stat n={movedUp} l="shift toward AI" />
          <Stat n={TRANSITION.skills.length} l="skills to build" />
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
        <ExportCard icon="✦" title="Send to Figma" sub="Editable frames — drop into your workshop board and annotate live." onClick={() => fire("Figma frames generated → opening in Figma")} />
        <ExportCard icon="↧" title="Download PDF" sub="A clean one-pager per stage to print and mark up with the team." onClick={() => fire("Building PDF — your download will start shortly")} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 18, padding: "15px 18px", background: "var(--paper-2)", border: "1px solid var(--line-soft)", borderRadius: "var(--radius)" }}>
        <span style={{ fontSize: 17 }}>↻</span>
        <span style={{ fontSize: 13.5, color: "var(--ink-soft)", flex: 1 }}>Want to test a different team, or connect your CRM / ERP / LMS for contextual data?</span>
        <Button variant="ghost" size="sm" onClick={onRestart}>Start a new analysis</Button>
      </div>

      {toast && (
        <div className="fade-in" style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "var(--ink)", color: "var(--paper)", padding: "13px 22px", borderRadius: 999, fontSize: 14, fontWeight: 600, boxShadow: "var(--shadow-lg)", zIndex: 50 }}>{toast}</div>
      )}
    </div>
  );
}

function Stat({ n, l }) {
  return (
    <div>
      <div style={{ fontFamily: "var(--serif)", fontSize: 38, fontWeight: 500, lineHeight: 1, color: "var(--accent-deep)" }}>{n}</div>
      <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 6 }}>{l}</div>
    </div>
  );
}

function ExportCard({ icon, title, sub, onClick }) {
  return (
    <Card hover accent onClick={onClick} pad={22}>
      <div style={{ fontSize: 22, color: "var(--accent)" }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 16, marginTop: 10 }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4, lineHeight: 1.45 }}>{sub}</div>
    </Card>
  );
}
