// StageActivities.jsx — Stage 4 · Activities & AI integration
import { useState } from "react";
import { LEVELS, LEVEL_ORDER } from "../data.js";
import { levelLabel } from "../levelModel.js";
import {
  Card, RoleAvatar, LevelChip, LevelSpectrum, Confidence, StageHeader, NextBar,
} from "../components/primitives.jsx";
import { useAnalysis } from "../analysis/context.jsx";

export function StageActivities({ levels, setLevel, onNext }) {
  const { analysis } = useAnalysis();
  const ACTIVITIES = analysis.activities;
  const dist = LEVEL_ORDER.map((k) => ({
    key: k, n: ACTIVITIES.filter((a) => (levels[a.id] || a.proposed) === k).length,
  }));
  const [open, setOpen] = useState(ACTIVITIES[0].id);

  return (
    <div className="fade-in" style={{ maxWidth: 1000, margin: "0 auto" }}>
      <StageHeader
        eyebrow="Step 4 · Activities & AI"
        title="Where AI changes the work — and how far"
        lede="Each activity placed on the spectrum from Assist to Autonomous. These are hypotheses to argue with: drag any one up or down the scale and watch the team picture shift."
      />

      {/* distribution summary */}
      <Card style={{ marginTop: 24 }} pad={20}>
        <div style={{ display: "flex", gap: 10 }}>
          {dist.map((d) => (
            <div key={d.key} style={{ flex: 1, textAlign: "center" }}>
              <div style={{ fontFamily: "var(--serif)", fontSize: 34, fontWeight: 500, lineHeight: 1 }}>{d.n}</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 7, fontSize: 12.5, color: "var(--ink-soft)", fontWeight: 600 }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: `var(${LEVELS[d.key].cssVar})` }} />
                {levelLabel(d.key)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
        {ACTIVITIES.map((a) => (
          <ActivityCard key={a.id} a={a}
            proposed={levels[a.id] || a.proposed}
            setProposed={(lv) => setLevel(a.id, lv)}
            open={open === a.id} toggle={() => setOpen(open === a.id ? null : a.id)} />
        ))}
      </div>

      <NextBar hint="These hypotheses imply a different shape of team." onNext={onNext} label="See team restructuring" />
    </div>
  );
}

function ActivityCard({ a, proposed, setProposed, open, toggle }) {
  const { roleById } = useAnalysis();
  const movement = LEVELS[proposed].index - LEVELS[a.current].index;
  return (
    <Card pad={0} hover>
      <div onClick={toggle} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", cursor: "pointer" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontWeight: 700, fontSize: 15.5 }}>{a.name}</span>
            <div style={{ display: "flex", gap: -4 }}>
              {a.roles.map((rid) => <RoleAvatar key={rid} role={rid} size={22} />)}
            </div>
          </div>
          <div style={{ marginTop: 4, fontSize: 12.5, color: "var(--ink-faint)" }}>
            {movement > 0 ? `Moves ${movement} step${movement > 1 ? "s" : ""} up the spectrum` : "Deliberately stays human-led"}
          </div>
        </div>
        <div style={{ width: 230, flexShrink: 0 }}>
          <LevelSpectrum current={a.current} proposed={proposed} compact />
        </div>
        <LevelChip level={proposed} size="sm" />
        <span style={{ color: "var(--ink-faint)", transform: open ? "rotate(90deg)" : "none", transition: "transform .2s ease", fontSize: 15 }}>›</span>
      </div>

      {open && (
        <div className="fade-in" style={{ padding: "4px 20px 22px", borderTop: "1px solid var(--line-soft)" }}>
          {/* interactive level selector */}
          <div style={{ margin: "18px 0 6px", fontSize: 12, fontWeight: 600, color: "var(--ink-soft)", fontFamily: "var(--mono)" }}>Proposed level — adjust the hypothesis</div>
          <div style={{ display: "flex", gap: 7, marginBottom: 18 }}>
            {LEVEL_ORDER.map((k) => {
              const active = k === proposed;
              const isCur = k === a.current;
              return (
                <button key={k} onClick={(e) => { e.stopPropagation(); setProposed(k); }} style={{
                  flex: 1, padding: "10px 8px", borderRadius: "var(--radius-sm)", textAlign: "left",
                  border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`,
                  background: active ? "var(--accent-tint)" : "var(--surface)", transition: "all .14s ease",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: `var(${LEVELS[k].cssVar})` }} />
                    <span style={{ fontWeight: 700, fontSize: 12.5 }}>{levelLabel(k)}</span>
                    {isCur && <span style={{ fontSize: 9.5, fontFamily: "var(--mono)", color: "var(--ink-faint)", marginLeft: "auto" }}>NOW</span>}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 4, lineHeight: 1.35 }}>{LEVELS[k].blurb}</div>
                </button>
              );
            })}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 22 }}>
            <div>
              <DetailLabel>Why this level</DetailLabel>
              <p style={{ margin: "6px 0 16px", fontSize: 14, lineHeight: 1.55, color: "var(--ink-soft)" }}>{a.rationale}</p>
              <DetailLabel>Expected outputs</DetailLabel>
              <ul style={{ margin: "8px 0 0", paddingLeft: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
                {a.outputs.map((o, i) => (
                  <li key={i} style={{ display: "flex", gap: 9, fontSize: 13.5, alignItems: "flex-start" }}>
                    <span style={{ color: "var(--accent)", marginTop: 1 }}>◆</span>{o}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <DetailLabel>Expected outcome</DetailLabel>
              <div style={{ margin: "8px 0 16px", padding: "16px 18px", background: "var(--paper-2)", borderRadius: "var(--radius-sm)", border: "1px solid var(--line-soft)" }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: 30, fontWeight: 500, color: "var(--accent-deep)", lineHeight: 1 }}>{a.outcome.value}</div>
                <div style={{ fontSize: 12.5, color: "var(--ink-soft)", marginTop: 5 }}>{a.outcome.metric}</div>
              </div>
              <DetailLabel>Who's impacted</DetailLabel>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 9 }}>
                {a.impacted.map((rid) => (
                  <span key={rid} style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "var(--surface)", border: "1px solid var(--line)", borderRadius: 999, padding: "4px 11px 4px 5px", fontSize: 12.5, fontWeight: 600 }}>
                    <RoleAvatar role={rid} size={20} />{roleById[rid]?.title || rid}
                  </span>
                ))}
              </div>
              <div style={{ marginTop: 14 }}><Confidence level={a.confidence} /></div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

function DetailLabel({ children }) {
  return <div style={{ fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-faint)", fontWeight: 500 }}>{children}</div>;
}
