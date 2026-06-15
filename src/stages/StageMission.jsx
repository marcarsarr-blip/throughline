// StageMission.jsx — Stage 3 · Team mission (human review gate)
import { useState } from "react";
import { Card, Eyebrow, HypothesisTag, Button, StageHeader, Arrow } from "../components/primitives.jsx";
import { useAnalysis } from "../analysis/context.jsx";

export function StageMission({ onValidate, validated }) {
  const { analysis } = useAnalysis();
  const MISSION = analysis.mission;
  const [mission, setMission] = useState(MISSION.inferred);
  const [editing, setEditing] = useState(false);
  return (
    <div className="fade-in" style={{ maxWidth: 800, margin: "0 auto" }}>
      <StageHeader
        eyebrow="Step 3 · Team mission"
        title="If those are the jobs, this is the mission"
        lede="We synthesized one mission statement from the jobs above. This is a human checkpoint — confirm it captures the team's real purpose before we redesign anything."
      />

      <Card style={{ marginTop: 26, borderColor: validated ? "var(--accent)" : "var(--line)" }} pad={30}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <Eyebrow>Inferred mission</Eyebrow>
          <HypothesisTag />
        </div>
        {editing ? (
          <textarea
            autoFocus value={mission} onChange={(e) => setMission(e.target.value)}
            style={{ width: "100%", fontFamily: "var(--serif)", fontSize: 23, lineHeight: 1.4, border: "1px solid var(--accent)", borderRadius: 10, padding: 14, minHeight: 120, background: "var(--paper)", color: "var(--ink)" }}
          />
        ) : (
          <p style={{ margin: 0, fontFamily: "var(--serif)", fontSize: 24, lineHeight: 1.4, fontWeight: 500, letterSpacing: "-0.01em" }}>
            "{mission}"
          </p>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <Button variant="ghost" size="sm" onClick={() => setEditing(!editing)}>{editing ? "Save edit" : "Edit wording"}</Button>
        </div>
      </Card>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginTop: 16 }}>
        {MISSION.pillars.map((p, i) => (
          <Card key={i} pad={18}>
            <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--accent)", marginBottom: 8 }}>{String(i + 1).padStart(2, "0")}</div>
            <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4 }}>{p}</div>
          </Card>
        ))}
      </div>

      <div style={{ display: "flex", gap: 11, alignItems: "flex-start", marginTop: 20, padding: "16px 18px", background: "var(--accent-tint)", borderRadius: "var(--radius)", border: "1px solid var(--accent-tint-2)" }}>
        <span style={{ fontSize: 18 }}>✋</span>
        <div style={{ fontSize: 13.5, color: "var(--accent-ink)", lineHeight: 1.5 }}>
          <strong>Human review gate.</strong> The mission shapes how we frame every role. A mission that's slightly off will quietly skew the redesign. Take a minute — this one matters.
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
        <Button size="lg" onClick={onValidate}>
          {validated ? "Mission confirmed ✓" : "Validate & map activities"} {!validated && <Arrow />}
        </Button>
      </div>
    </div>
  );
}
