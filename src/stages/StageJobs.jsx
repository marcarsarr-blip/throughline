// StageJobs.jsx — Stage 2 · Jobs to be done.
// Roles and JTBD are fully editable here: edit/delete/add team members, and
// edit/delete/add each role's jobs. Changes persist into the shared analysis so
// every downstream stage reflects them.
import { useState } from "react";
import { Card, RoleAvatar, Confidence, Button, StageHeader, NextBar } from "../components/primitives.jsx";
import { useAnalysis } from "../analysis/context.jsx";

export function StageJobs({ onNext }) {
  const { analysis, setAnalysis } = useAnalysis();
  const roles = analysis.roles || [];
  const total = roles.reduce((n, r) => n + (r.jtbd?.length || 0), 0);

  const mutateRoles = (fn) => setAnalysis((prev) => ({ ...prev, roles: fn(prev.roles || []) }));

  const updateRole = (id, patch) => mutateRoles((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const deleteRole = (id) => mutateRoles((rs) => rs.filter((r) => r.id !== id));
  const addRole = () =>
    mutateRoles((rs) => [
      ...rs,
      { id: `role-${Date.now()}`, title: "New role", count: 1, initials: "NR", summary: "", jtbd: [] },
    ]);

  const updateJob = (roleId, idx, patch) =>
    mutateRoles((rs) => rs.map((r) => (r.id === roleId ? { ...r, jtbd: r.jtbd.map((j, i) => (i === idx ? { ...j, ...patch } : j)) } : r)));
  const deleteJob = (roleId, idx) =>
    mutateRoles((rs) => rs.map((r) => (r.id === roleId ? { ...r, jtbd: r.jtbd.filter((_, i) => i !== idx) } : r)));
  const addJob = (roleId) =>
    mutateRoles((rs) => rs.map((r) => (r.id === roleId ? { ...r, jtbd: [...(r.jtbd || []), { statement: "When… I want… so I can…", confidence: "med" }] } : r)));

  return (
    <div className="fade-in" style={{ maxWidth: 920, margin: "0 auto" }}>
      <StageHeader
        eyebrow="Step 2 · Jobs to be done"
        title="Here's what each person is really hired to do"
        lede={`We pulled ${total} job${total === 1 ? "" : "s"}-to-be-done from ${roles.length} role${roles.length === 1 ? "" : "s"}. Edit anything, delete what doesn't fit, or add roles and jobs — these frame everything downstream.`}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 26 }}>
        {roles.map((r) => (
          <Card key={r.id} pad={0}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 13, padding: "16px 18px 14px 22px", borderBottom: "1px solid var(--line-soft)" }}>
              <div style={{ marginTop: 2 }}><RoleAvatar role={r} size={38} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <BareInput
                  value={r.title}
                  onChange={(v) => updateRole(r.id, { title: v })}
                  placeholder="Role title"
                  style={{ fontWeight: 700, fontSize: 16 }}
                />
                <BareInput
                  value={r.summary}
                  onChange={(v) => updateRole(r.id, { summary: v })}
                  placeholder="One-line summary of the role"
                  style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 2 }}
                />
              </div>
              <label style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-faint)" }}>
                ×
                <input
                  type="number" min={1} value={r.count}
                  onChange={(e) => updateRole(r.id, { count: Math.max(1, parseInt(e.target.value, 10) || 1) })}
                  style={{ width: 40, padding: "4px 6px", borderRadius: 6, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", fontSize: 12, fontFamily: "var(--mono)" }}
                />
              </label>
              <IconButton title="Remove this role" onClick={() => deleteRole(r.id)}>✕</IconButton>
            </div>

            <div style={{ padding: "6px 22px 16px" }}>
              {(r.jtbd || []).map((j, i) => (
                <EditableJob
                  key={i}
                  text={j.statement}
                  confidence={j.confidence}
                  onChange={(v) => updateJob(r.id, i, { statement: v })}
                  onDelete={() => deleteJob(r.id, i)}
                />
              ))}
              <button
                onClick={() => addJob(r.id)}
                style={{ marginTop: 10, background: "none", border: "1px dashed var(--line)", color: "var(--ink-soft)", borderRadius: "var(--radius-sm)", padding: "8px 12px", fontSize: 13, fontWeight: 600, width: "100%", cursor: "pointer" }}
              >
                + Add a job
              </button>
            </div>
          </Card>
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <Button variant="ghost" onClick={addRole}>+ Add a team member</Button>
      </div>

      <NextBar
        hint={roles.length ? "Looks right? Next we'll infer the team's mission." : "Add at least one role to continue."}
        onNext={roles.length ? onNext : undefined}
        label="Infer team mission"
      />
    </div>
  );
}

// Borderless input that reveals a border on hover/focus — for inline editing.
function BareInput({ value, onChange, placeholder, style }) {
  const [focus, setFocus] = useState(false);
  return (
    <input
      value={value ?? ""}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={{
        width: "100%", display: "block", background: focus ? "var(--paper)" : "transparent",
        border: `1px solid ${focus ? "var(--accent)" : "transparent"}`, borderRadius: 7,
        padding: "3px 7px", margin: "-3px -7px", color: "var(--ink)", lineHeight: 1.4,
        fontFamily: "var(--sans)", ...style,
      }}
    />
  );
}

function IconButton({ children, onClick, title }) {
  const [h, setH] = useState(false);
  return (
    <button
      title={title} onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        flexShrink: 0, width: 28, height: 28, borderRadius: 7, lineHeight: 1,
        border: "1px solid var(--line)", background: h ? "var(--paper-2)" : "transparent",
        color: h ? "var(--accent-deep)" : "var(--ink-faint)", fontSize: 13, cursor: "pointer",
      }}
    >{children}</button>
  );
}

function EditableJob({ text, confidence, onChange, onDelete }) {
  const [editing, setEditing] = useState(false);
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "13px 0", borderBottom: "1px solid var(--line-soft)" }}>
      <span style={{ marginTop: 5, color: "var(--accent)", fontSize: 15, flexShrink: 0 }}>›</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <textarea
            autoFocus value={text} onChange={(e) => onChange(e.target.value)} onBlur={() => setEditing(false)}
            style={{ width: "100%", border: "1px solid var(--accent)", borderRadius: 8, padding: "8px 10px", fontSize: 14.5, lineHeight: 1.55, resize: "vertical", minHeight: 60, background: "var(--paper)", color: "var(--ink)" }}
          />
        ) : (
          <p onClick={() => setEditing(true)} title="Click to edit" style={{ margin: 0, fontSize: 14.5, lineHeight: 1.55, cursor: "text", fontFamily: "var(--sans)" }}>{text}</p>
        )}
        <div style={{ marginTop: 6 }}><Confidence level={confidence} /></div>
      </div>
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button onClick={() => setEditing(!editing)} style={{ background: "none", border: "none", color: "var(--ink-faint)", fontSize: 12, fontWeight: 600, padding: "4px 6px", cursor: "pointer" }}>
          {editing ? "Done" : "Edit"}
        </button>
        <IconButton title="Delete this job" onClick={onDelete}>✕</IconButton>
      </div>
    </div>
  );
}
