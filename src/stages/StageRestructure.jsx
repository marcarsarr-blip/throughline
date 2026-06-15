// StageRestructure.jsx — Stage 5 · Team shape (before / after)
import { Eyebrow, RoleAvatar, StageHeader, NextBar } from "../components/primitives.jsx";
import { useAnalysis } from "../analysis/context.jsx";

export function StageRestructure({ onNext }) {
  const { analysis } = useAnalysis();
  const RESTRUCTURE = analysis.restructure;
  const changeColor = { reshaped: "var(--lv-2)", focused: "var(--lv-3)", elevated: "var(--accent)", unchanged: "var(--ink-faint)", new: "var(--accent-deep)" };
  return (
    <div className="fade-in" style={{ maxWidth: 1000, margin: "0 auto" }}>
      <StageHeader
        eyebrow="Step 5 · Team shape"
        title={RESTRUCTURE.headline}
        lede={RESTRUCTURE.narrative}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1.25fr", gap: 24, alignItems: "center", marginTop: 30 }}>
        {/* before */}
        <div>
          <Eyebrow>Today</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 12 }}>
            {RESTRUCTURE.before.map((b) => (
              <div key={b.role} style={{ display: "flex", alignItems: "center", gap: 11, padding: "13px 15px", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius-sm)" }}>
                <RoleAvatar role={b.role} size={30} />
                <span style={{ flex: 1, fontWeight: 600, fontSize: 13.5 }}>{b.label}</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-faint)" }}>×{b.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ textAlign: "center", color: "var(--accent)" }}>
          <div style={{ fontSize: 11, fontFamily: "var(--mono)", color: "var(--ink-faint)", marginBottom: 6, writingMode: "horizontal-tb" }}>+ AI layer</div>
          <span style={{ fontSize: 28 }}>→</span>
        </div>

        {/* after */}
        <div>
          <Eyebrow color="var(--accent)">After redesign</Eyebrow>
          <div style={{ display: "flex", flexDirection: "column", gap: 9, marginTop: 12 }}>
            {RESTRUCTURE.after.map((a, i) => (
              <div key={i} style={{ padding: "13px 15px", background: a.change === "new" ? "var(--accent-tint)" : "var(--surface)", border: `1px solid ${a.change === "new" ? "var(--accent-tint-2)" : "var(--line)"}`, borderRadius: "var(--radius-sm)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 999, background: changeColor[a.change], flexShrink: 0 }} />
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 13.5 }}>{a.label}</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: "0.05em", color: changeColor[a.change], fontWeight: 600 }}>{a.change}</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-faint)" }}>×{a.count}</span>
                </div>
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 6, lineHeight: 1.45, paddingLeft: 19 }}>{a.note}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <NextBar hint="Want the plan grounded in your real numbers? Connect your systems next." onNext={onNext} label="Connect your data" />
    </div>
  );
}
