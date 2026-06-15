// StageConnect.jsx — Stage 6 · Connect (optional CRM / ERP / LMS)
import { Card, Button, StageHeader, NextBar } from "../components/primitives.jsx";

export function StageConnect({ conns = {}, toggle, onNext }) {
  const items = [
    { key: "crm", name: "CRM", tag: "Sales data", desc: "Live pipeline, deals, and activity history — grounds every AI hypothesis in your real numbers instead of assumptions." },
    { key: "erp", name: "ERP", tag: "Ops & finance", desc: "Headcount, cost, and process data — sharpens the team-shape proposal and the ROI behind each move." },
    { key: "lms", name: "LMS", tag: "Learning", desc: "Course catalog and completion records — turns the skills plan into a trackable, assignable curriculum." },
  ];
  const n = Object.values(conns).filter(Boolean).length;
  return (
    <div className="fade-in" style={{ maxWidth: 920, margin: "0 auto" }}>
      <StageHeader
        eyebrow="Step 6 · Connect"
        title="Plug in your systems for sharper recommendations"
        lede="Everything so far comes from the documents alone. Connect the tools where your real data lives and Throughline grounds the transition plan in your actual pipeline, costs, and learning catalog. Optional — skip it and we'll continue from the analysis."
      />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginTop: 26 }}>
        {items.map((it) => (
          <ConnectCard key={it.key} it={it} connected={!!conns[it.key]} onToggle={() => toggle(it.key)} />
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, alignItems: "center", marginTop: 18, padding: "14px 18px", background: "var(--paper-2)", border: "1px solid var(--line-soft)", borderRadius: "var(--radius)" }}>
        <span style={{ fontFamily: "var(--mono)", fontSize: 9.5, fontWeight: 600, letterSpacing: "0.06em", color: "var(--accent-ink)", background: "var(--accent-tint)", padding: "3px 8px", borderRadius: 999, textTransform: "uppercase", whiteSpace: "nowrap" }}>Read-only</span>
        <span style={{ fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>Throughline only reads context to improve its hypotheses — it never writes back to your systems.</span>
      </div>

      <NextBar
        hint={n ? `${n} system${n > 1 ? "s" : ""} connected — the transition plan will use live context.` : "No systems connected — we'll continue from the document analysis."}
        onNext={onNext} label="Build the transition path"
      />
    </div>
  );
}

function ConnectCard({ it, connected, onToggle }) {
  return (
    <Card pad={22} style={{ display: "flex", flexDirection: "column", borderColor: connected ? "var(--accent)" : "var(--line)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 46, height: 46, borderRadius: 12, background: connected ? "var(--accent)" : "var(--accent-tint)", color: connected ? "white" : "var(--accent-ink)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)", fontWeight: 700, fontSize: 13, border: "1px solid var(--accent-tint-2)", transition: "all .2s ease", flexShrink: 0 }}>{it.name}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{it.name}</div>
          <div style={{ fontFamily: "var(--mono)", fontSize: 10.5, color: "var(--ink-faint)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{it.tag}</div>
        </div>
      </div>
      <p style={{ margin: "14px 0 18px", fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5, flex: 1 }}>{it.desc}</p>
      <Button variant={connected ? "soft" : "ghost"} onClick={onToggle} style={{ width: "100%" }}>
        {connected ? "Connected ✓" : `Connect ${it.name}`}
      </Button>
    </Card>
  );
}
