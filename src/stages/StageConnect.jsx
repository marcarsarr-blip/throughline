// StageConnect.jsx — Stage 6 · Connect. Placeholder for now: the CRM/ERP/LMS
// integrations are not built yet, so this step is informational and simply continues
// to the transition plan without changing the analysis.
import { Card, Button, StageHeader, Arrow } from "../components/primitives.jsx";

export function StageConnect({ onNext }) {
  return (
    <div className="fade-in" style={{ maxWidth: 820, margin: "0 auto" }}>
      <StageHeader
        eyebrow="Step 6 · Connect"
        title="Connect your data"
        lede="Down the line, Throughline will ground the plan in your real numbers by reading your CRM, ERP, and LMS. That integration isn't built yet."
      />

      <Card style={{ marginTop: 26 }} pad={28}>
        <div style={{ display: "flex", gap: 13, alignItems: "flex-start" }}>
          <span style={{
            fontFamily: "var(--mono)", fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
            color: "var(--accent-ink)", background: "var(--accent-tint)", padding: "4px 10px",
            borderRadius: 999, textTransform: "uppercase", whiteSpace: "nowrap", marginTop: 2,
          }}>Coming later</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>
              CRM / ERP / LMS connections are on the roadmap
            </div>
            <p style={{ margin: 0, fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.55 }}>
              When it ships, connecting your systems will sharpen the AI hypotheses and the
              transition plan with live pipeline, cost, and learning data — read-only, never
              writing back. For now, the analysis continues from your documents alone.
            </p>
          </div>
        </div>
      </Card>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
        <span style={{ fontSize: 13.5, color: "var(--ink-faint)" }}>This step is a preview — continuing from the document analysis.</span>
        <Button size="lg" onClick={onNext}>Build the transition path <Arrow /></Button>
      </div>
    </div>
  );
}
