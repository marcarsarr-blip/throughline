// StageJobs.jsx — Stage 2 · Jobs to be done
import { useState } from "react";
import { Card, RoleAvatar, Confidence, StageHeader, NextBar } from "../components/primitives.jsx";
import { useAnalysis } from "../analysis/context.jsx";

export function StageJobs({ onNext }) {
  const { analysis } = useAnalysis();
  const ROLES = analysis.roles;
  const total = ROLES.reduce((n, r) => n + r.jtbd.length, 0);
  return (
    <div className="fade-in" style={{ maxWidth: 920, margin: "0 auto" }}>
      <StageHeader
        eyebrow="Step 2 · Jobs to be done"
        title="Here's what each person is really hired to do"
        lede={`We pulled ${total} jobs-to-be-done from ${ROLES.length} roles. Edit any that don't match how your team thinks about the work — these frame everything downstream.`}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 26 }}>
        {ROLES.map((r) => (
          <Card key={r.id} pad={0}>
            <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "18px 22px", borderBottom: "1px solid var(--line-soft)" }}>
              <RoleAvatar role={r} size={38} />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16 }}>{r.title}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>{r.summary}</div>
              </div>
              <span style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-faint)" }}>×{r.count}</span>
            </div>
            <div style={{ padding: "6px 22px 16px" }}>
              {r.jtbd.map((j, i) => (
                <EditableJob key={i} text={j.statement} confidence={j.confidence} />
              ))}
            </div>
          </Card>
        ))}
      </div>

      <NextBar hint="Looks right? Next we'll infer the team's mission." onNext={onNext} label="Infer team mission" />
    </div>
  );
}

function EditableJob({ text, confidence }) {
  const [val, setVal] = useState(text);
  const [editing, setEditing] = useState(false);
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "13px 0", borderBottom: "1px solid var(--line-soft)" }}>
      <span style={{ marginTop: 5, color: "var(--accent)", fontSize: 15, flexShrink: 0 }}>›</span>
      <div style={{ flex: 1 }}>
        {editing ? (
          <textarea
            autoFocus value={val} onChange={(e) => setVal(e.target.value)} onBlur={() => setEditing(false)}
            style={{ width: "100%", border: "1px solid var(--accent)", borderRadius: 8, padding: "8px 10px", fontSize: 14.5, lineHeight: 1.55, resize: "vertical", minHeight: 60, background: "var(--paper)", color: "var(--ink)" }}
          />
        ) : (
          <p onClick={() => setEditing(true)} title="Click to edit" style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, cursor: "text", fontFamily: "var(--sans)" }}>{val}</p>
        )}
        <div style={{ marginTop: 6 }}><Confidence level={confidence} /></div>
      </div>
      <button onClick={() => setEditing(!editing)} style={{ background: "none", border: "none", color: "var(--ink-faint)", fontSize: 12, fontWeight: 600, padding: "4px 6px" }}>
        {editing ? "Done" : "Edit"}
      </button>
    </div>
  );
}
