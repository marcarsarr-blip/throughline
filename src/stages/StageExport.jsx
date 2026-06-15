// StageExport.jsx — Stage 8 · Export (basis for discussion, not a decision)
import { useState } from "react";
import { LEVELS } from "../data.js";
import { levelLabel } from "../levelModel.js";
import { Card, Eyebrow, Button, StageHeader } from "../components/primitives.jsx";
import { useAnalysis } from "../analysis/context.jsx";

export function StageExport({ onRestart, state, levels }) {
  const { analysis } = useAnalysis();
  const ACTIVITIES = analysis.activities || [];
  const ROLES = analysis.roles || [];
  const TRANSITION = analysis.transition || { phases: [], skills: [] };
  const [toast, setToast] = useState(null);
  function fire(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3200);
  }
  const movedUp = ACTIVITIES.filter((a) => LEVELS[levels[a.id] || a.proposed].index > LEVELS[a.current].index).length;
  const teamName = state.teamName || analysis.team?.name || "Your team";

  function downloadPdf() {
    const html = buildReportHtml({ analysis, levels, teamName });
    const w = window.open("", "_blank");
    if (!w) {
      fire("Allow pop-ups for this site, then click Download PDF again.");
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
    // Give the new window a tick to lay out, then open the print dialog
    // (where the user picks "Save as PDF").
    setTimeout(() => {
      w.focus();
      w.print();
    }, 400);
    fire("Opened a printable report — choose “Save as PDF” in the dialog.");
  }

  return (
    <div className="fade-in" style={{ maxWidth: 820, margin: "0 auto" }}>
      <StageHeader
        eyebrow="Step 8 · Export"
        title="Take this to the table"
        lede="Throughline's output is a starting point for a real conversation — not a decision. Export it and walk your team through it."
      />

      <Card style={{ marginTop: 26 }} pad={28}>
        <Eyebrow>Summary · {teamName}</Eyebrow>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18, marginTop: 18 }}>
          <Stat n={ROLES.reduce((a, r) => a + (r.jtbd?.length || 0), 0)} l="jobs mapped" />
          <Stat n={ACTIVITIES.length} l="activities placed" />
          <Stat n={movedUp} l="shift toward AI" />
          <Stat n={TRANSITION.skills.length} l="skills to build" />
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 16 }}>
        <ExportCard icon="↧" title="Download PDF" sub="A clean report of every stage — open the print dialog and choose Save as PDF." onClick={downloadPdf} />
        <ComingLaterCard icon="✦" title="Send to Figma" sub="Editable workshop frames. Needs a Figma account connection — on the roadmap." />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 11, marginTop: 18, padding: "15px 18px", background: "var(--paper-2)", border: "1px solid var(--line-soft)", borderRadius: "var(--radius)" }}>
        <span style={{ fontSize: 17 }}>↻</span>
        <span style={{ fontSize: 13.5, color: "var(--ink-soft)", flex: 1 }}>Want to analyze a different team?</span>
        <Button variant="ghost" size="sm" onClick={onRestart}>Start a new analysis</Button>
      </div>

      {toast && (
        <div className="fade-in" style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", background: "var(--ink)", color: "var(--paper)", padding: "13px 22px", borderRadius: 999, fontSize: 14, fontWeight: 600, boxShadow: "var(--shadow-lg)", zIndex: 50, maxWidth: "90vw", textAlign: "center" }}>{toast}</div>
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

function ComingLaterCard({ icon, title, sub }) {
  return (
    <Card pad={22} style={{ opacity: 0.92 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ fontSize: 22, color: "var(--ink-faint)" }}>{icon}</div>
        <span style={{ fontFamily: "var(--mono)", fontSize: 9.5, fontWeight: 600, letterSpacing: "0.06em", color: "var(--accent-ink)", background: "var(--accent-tint)", padding: "3px 8px", borderRadius: 999, textTransform: "uppercase" }}>Coming later</span>
      </div>
      <div style={{ fontWeight: 700, fontSize: 16, marginTop: 10, color: "var(--ink-soft)" }}>{title}</div>
      <div style={{ fontSize: 13, color: "var(--ink-faint)", marginTop: 4, lineHeight: 1.45 }}>{sub}</div>
    </Card>
  );
}

// ---- Printable report ----
function esc(s) {
  return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}

function buildReportHtml({ analysis, levels, teamName }) {
  const a = analysis;
  const roleTitle = (id) => (a.roles || []).find((r) => r.id === id)?.title || id;
  const before = (a.roles || []).map((r) => `${esc(r.title)} ×${r.count}`);
  const after = (a.restructure?.after || [])
    .filter((x) => x.change === "new" || x.from === "new" || (a.roles || []).some((r) => r.id === x.from))
    .map((x) => `<li><strong>${esc(x.label)}</strong> ×${x.count} <span class="tag">${esc(x.change)}</span><br><span class="muted">${esc(x.note)}</span></li>`)
    .join("");

  const rolesHtml = (a.roles || [])
    .map(
      (r) => `<div class="role"><h3>${esc(r.title)} <span class="muted">×${r.count}</span></h3>
      <p class="muted">${esc(r.summary)}</p>
      <ul>${(r.jtbd || []).map((j) => `<li>${esc(j.statement)} <span class="conf">(${esc(j.confidence)})</span></li>`).join("")}</ul></div>`,
    )
    .join("");

  const activitiesHtml = (a.activities || [])
    .map((act) => {
      const proposed = levels[act.id] || act.proposed;
      return `<tr><td>${esc(act.name)}</td><td>${esc(levelLabel(act.current))} → <strong>${esc(levelLabel(proposed))}</strong></td><td>${esc(act.outcome?.value)} <span class="muted">${esc(act.outcome?.metric)}</span></td></tr>`;
    })
    .join("");

  const phasesHtml = (a.transition?.phases || [])
    .map(
      (p) => `<div class="phase"><h4>${esc(p.name)} — ${esc(p.tag)}</h4><p class="muted">${esc(p.focus)}</p><ul>${(p.moves || []).map((m) => `<li>${esc(m)}</li>`).join("")}</ul></div>`,
    )
    .join("");

  const skillsHtml = (a.transition?.skills || [])
    .map(
      (s) => `<li>${esc(s.name)} <span class="muted">· ${esc(s.type)} · ${esc(s.mode)} · ${s.forRole === "All" ? "Whole team" : s.forRole === "new" ? "Orchestrator" : esc(roleTitle(s.forRole))}</span></li>`,
    )
    .join("");

  const dateStr = new Date().toLocaleDateString();

  return `<!doctype html><html><head><meta charset="utf-8"><title>Throughline — ${esc(teamName)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Georgia, "Times New Roman", serif; color: #29261b; margin: 40px; line-height: 1.5; }
  h1 { font-size: 26px; margin: 0 0 4px; }
  h2 { font-size: 17px; margin: 28px 0 10px; border-bottom: 2px solid #ddd; padding-bottom: 4px; }
  h3 { font-size: 14px; margin: 14px 0 2px; }
  h4 { font-size: 13px; margin: 10px 0 2px; }
  .sub { color: #6b6657; font-size: 13px; margin: 0 0 2px; }
  .lead { font-style: italic; color: #6b6657; font-size: 13px; }
  .mission { font-size: 18px; font-style: italic; margin: 10px 0; }
  .muted { color: #8a8576; font-weight: normal; }
  .conf { color: #b08; font-size: 11px; }
  .tag { font-size: 10px; text-transform: uppercase; letter-spacing: .05em; color: #a55; }
  ul { margin: 4px 0 8px; padding-left: 18px; } li { margin: 2px 0; font-size: 13px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  td { border-bottom: 1px solid #eee; padding: 6px 8px; vertical-align: top; }
  .cols { display: flex; gap: 30px; } .cols > div { flex: 1; }
  .role { margin-bottom: 6px; }
  @media print { body { margin: 16mm; } h2 { page-break-after: avoid; } .role, .phase { page-break-inside: avoid; } }
</style></head><body>
  <h1>Throughline — ${esc(teamName)}</h1>
  <p class="sub">${esc(a.team?.sector || "")}</p>
  <p class="sub">${esc(a.team?.source || "")} · Generated ${esc(dateStr)}</p>
  <p class="lead">A basis for discussion, not a decision.</p>

  <h2>Team mission</h2>
  <p class="mission">"${esc(a.mission?.inferred)}"</p>
  <ul>${(a.mission?.pillars || []).map((p) => `<li>${esc(p)}</li>`).join("")}</ul>

  <h2>Jobs to be done</h2>
  ${rolesHtml}

  <h2>Where AI changes the work</h2>
  <table><tr><td><strong>Activity</strong></td><td><strong>Current → Proposed</strong></td><td><strong>Outcome</strong></td></tr>${activitiesHtml}</table>

  <h2>Team shape</h2>
  <div class="cols">
    <div><h3>Today</h3><ul>${before.map((b) => `<li>${b}</li>`).join("")}</ul></div>
    <div><h3>After redesign</h3><ul>${after}</ul></div>
  </div>

  <h2>Transition</h2>
  ${phasesHtml}
  <h3>Skills to acquire</h3>
  <ul>${skillsHtml}</ul>
</body></html>`;
}
