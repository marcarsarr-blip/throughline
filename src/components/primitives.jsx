// primitives.jsx — shared UI primitives for Throughline
import { useState } from "react";
import { LEVELS, LEVEL_ORDER } from "../data.js";
import { levelLabel } from "../levelModel.js";
import { useAnalysis } from "../analysis/context.jsx";

export function cx(...a) {
  return a.filter(Boolean).join(" ");
}

// ---- Brand mark ----
export function Logo({ size = 22 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="4" cy="12" r="3" fill="var(--ink)" />
        <circle cx="20" cy="6" r="3" fill="var(--accent)" />
        <circle cx="20" cy="18" r="3" fill="var(--accent)" />
        <path d="M6.6 11 L17.6 6.2 M6.6 13 L17.6 17.8" stroke="var(--ink-faint)" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <span style={{ fontWeight: 600, fontSize: 18, letterSpacing: "-0.01em", fontFamily: "Poppins, system-ui, sans-serif" }}>
        Through<span style={{ fontStyle: "italic", color: "var(--accent-deep)", fontFamily: "Poppins, system-ui, sans-serif" }}>line</span>
      </span>
    </div>
  );
}

// ---- Button ----
export function Button({ children, onClick, variant = "primary", size = "md", disabled, style, type }) {
  const [h, setH] = useState(false);
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    fontFamily: "var(--sans)", fontWeight: 600, borderRadius: 999, border: "1px solid transparent",
    transition: "transform .12s ease, background .15s ease, box-shadow .15s ease, border-color .15s ease",
    whiteSpace: "nowrap", lineHeight: 1, cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.45 : 1,
    padding: size === "lg" ? "14px 24px" : size === "sm" ? "8px 14px" : "11px 19px",
    fontSize: size === "lg" ? 16 : size === "sm" ? 13 : 14.5,
    transform: h && !disabled ? "translateY(-1px)" : "none",
  };
  const variants = {
    primary: { background: "var(--accent)", color: "white", boxShadow: h && !disabled ? "var(--shadow-md)" : "var(--shadow-sm)" },
    ghost: { background: h ? "var(--paper-2)" : "transparent", color: "var(--ink)", borderColor: "var(--line)" },
    soft: { background: h ? "var(--accent-tint-2)" : "var(--accent-tint)", color: "var(--accent-ink)" },
    quiet: { background: "transparent", color: "var(--ink-soft)" },
  };
  return (
    <button
      type={type || "button"} onClick={disabled ? undefined : onClick} disabled={disabled}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {children}
    </button>
  );
}

// ---- Card ----
export function Card({ children, style, pad = 24, hover, onClick, accent }) {
  const [h, setH] = useState(false);
  return (
    <div
      onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)",
        padding: pad, boxShadow: hover && h ? "var(--shadow-md)" : "var(--shadow-sm)",
        transition: "box-shadow .18s ease, transform .18s ease, border-color .18s ease",
        transform: hover && h ? "translateY(-2px)" : "none", cursor: onClick ? "pointer" : "default",
        borderColor: accent && h ? "var(--accent)" : "var(--line)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ---- Eyebrow / section label ----
export function Eyebrow({ children, color }) {
  return (
    <div style={{
      fontSize: 11.5, letterSpacing: "0.14em", textTransform: "uppercase",
      color: color || "var(--ink-faint)", fontWeight: 500, fontFamily: '"Bricolage Grotesque"',
    }}>{children}</div>
  );
}

// ---- Role avatar ----
export function RoleAvatar({ role, size = 34 }) {
  const { roleById } = useAnalysis();
  const r = typeof role === "string" ? roleById[role] : role;
  const initials = r ? r.initials : "?";
  return (
    <div style={{
      width: size, height: size, borderRadius: 9, flexShrink: 0,
      background: "var(--accent-tint)", color: "var(--accent-ink)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontWeight: 700, fontSize: size * 0.36, fontFamily: "var(--sans)",
      border: "1px solid var(--accent-tint-2)",
    }}>{initials}</div>
  );
}

// ---- Level chip (uses current level model labels) ----
export function LevelChip({ level, size = "md" }) {
  const L = LEVELS[level];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      background: `var(${L.tintVar})`, color: "var(--ink)",
      borderRadius: 999, padding: size === "sm" ? "3px 10px 3px 8px" : "5px 13px 5px 10px",
      fontSize: size === "sm" ? 12 : 13, fontWeight: 600, border: "1px solid var(--line-soft)",
    }}>
      <span style={{ width: 8, height: 8, borderRadius: 999, background: `var(${L.cssVar})` }} />
      {levelLabel(level)}
    </span>
  );
}

// ---- Level spectrum bar: shows the 4 steps, highlights current/proposed ----
export function LevelSpectrum({ current, proposed, compact }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "stretch" }}>
      {LEVEL_ORDER.map((key) => {
        const L = LEVELS[key];
        const isProp = key === proposed;
        const isCur = key === current;
        const inRange = LEVELS[key].index <= LEVELS[proposed].index && LEVELS[key].index >= LEVELS[current].index;
        return (
          <div key={key} style={{ flex: 1, textAlign: "center" }}>
            <div style={{
              height: compact ? 6 : 8, borderRadius: 999,
              background: inRange ? `var(${L.cssVar})` : "var(--line)",
              opacity: inRange ? 1 : 0.55,
              transition: "background .2s ease",
            }} />
            {!compact && (
              <div style={{
                marginTop: 7, fontSize: 11.5, fontWeight: isProp ? 700 : 500,
                color: isProp ? "var(--ink)" : isCur ? "var(--ink-soft)" : "var(--ink-faint)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
              }}>
                {levelLabel(key)}
                {isCur && <Dot title="current" />}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function Dot({ title }) {
  return <span title={title} style={{ width: 5, height: 5, borderRadius: 999, background: "var(--ink-faint)", display: "inline-block" }} />;
}

// ---- Confidence tag ----
export function Confidence({ level }) {
  const map = { high: "High confidence", med: "Worth a look", low: "Speculative" };
  const op = { high: 1, med: 0.6, low: 0.35 };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--ink-faint)", fontFamily: "var(--mono)" }}>
      <span style={{ display: "inline-flex", gap: 2 }}>
        {[0, 1, 2].map((i) => (
          <span key={i} style={{
            width: 4, height: 10, borderRadius: 2,
            background: "var(--accent)", opacity: i < (level === "high" ? 3 : level === "med" ? 2 : 1) ? op[level] : 0.15,
          }} />
        ))}
      </span>
      {map[level]}
    </span>
  );
}

// ---- Hypothesis label ----
export function HypothesisTag() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontFamily: "var(--mono)",
      letterSpacing: "0.04em", color: "var(--accent-ink)", background: "var(--accent-tint)",
      padding: "3px 9px", borderRadius: 999, textTransform: "uppercase", fontWeight: 500,
    }}>Hypothesis</span>
  );
}

// ---- A faint hatched placeholder for "drop something here" ----
export function DropZone({ label, sub, icon, active, onClick }) {
  const [h, setH] = useState(false);
  return (
    <div
      onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        border: `1.5px dashed ${active || h ? "var(--accent)" : "var(--line)"}`,
        borderRadius: "var(--radius)", padding: "38px 24px", textAlign: "center", cursor: "pointer",
        background: active ? "var(--accent-tint)" : h ? "var(--paper-2)" : "var(--paper)",
        transition: "all .18s ease",
      }}
    >
      <div style={{ fontSize: 26, marginBottom: 8, opacity: 0.7 }}>{icon}</div>
      <div style={{ fontWeight: 600, color: "var(--ink)" }}>{label}</div>
      <div style={{ fontSize: 12.5, color: "var(--ink-faint)", marginTop: 3, fontFamily: "var(--mono)" }}>{sub}</div>
    </div>
  );
}

// ---- shared little bits (used across stages) ----
export function StageHeader({ eyebrow, title, lede }) {
  return (
    <div>
      <Eyebrow color="var(--accent)">{eyebrow}</Eyebrow>
      <h1 style={{ margin: "12px 0 0", fontWeight: 500, fontSize: 38, lineHeight: 1.1, letterSpacing: "-0.02em", fontFamily: "Poppins, system-ui, sans-serif" }}>{title}</h1>
      {lede && <p style={{ margin: "14px 0 0", fontSize: 16, color: "var(--ink-soft)", lineHeight: 1.55, maxWidth: "62ch", fontFamily: "Lato" }}>{lede}</p>}
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label style={{ display: "block" }}>
      <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 6, fontFamily: "var(--mono)" }}>{label}</div>
      {children}
    </label>
  );
}

export function Input({ defaultValue, onChange, placeholder }) {
  return (
    <input
      defaultValue={defaultValue} placeholder={placeholder} onChange={(e) => onChange && onChange(e.target.value)}
      style={{ width: "100%", padding: "11px 13px", borderRadius: "var(--radius-sm)", border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", fontSize: 14 }}
    />
  );
}

export function NextBar({ hint, onNext, label }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingTop: 20, borderTop: "1px solid var(--line)" }}>
      <span style={{ fontSize: 13.5, color: "var(--ink-faint)" }}>{hint}</span>
      <Button size="lg" onClick={onNext}>{label} <Arrow /></Button>
    </div>
  );
}

export function Arrow() {
  return <span style={{ fontSize: 16, marginLeft: 1 }}>→</span>;
}

export function Spinner({ label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
      <span style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,.4)", borderTopColor: "white", borderRadius: 999, display: "inline-block", animation: "spin .7s linear infinite" }} />
      {label}
    </span>
  );
}
