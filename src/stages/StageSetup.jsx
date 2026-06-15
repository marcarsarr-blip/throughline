// StageSetup.jsx — Stage 1 · Input. Collects the documents + context and triggers
// the live Claude analysis (via props.onAnalyze, which calls the Netlify proxy).
import { useState, useRef } from "react";
import { MATURITY_STAGES, DIRECTIONS } from "../data.js";
import {
  Card, Eyebrow, Button, DropZone, Field, Input, StageHeader, Arrow, Spinner,
} from "../components/primitives.jsx";

export function StageSetup({ state, set, onAnalyze }) {
  const [method, setMethod] = useState(state.method || "paste");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  const hasText = (state.text || "").trim().length >= 40;

  async function analyze() {
    setError(null);
    setAnalyzing(true);
    try {
      await onAnalyze();
    } catch (e) {
      setError(e.message || "Analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function onFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    const readable = files.filter((f) => /\.(txt|md|csv|json)$/i.test(f.name) || f.type.startsWith("text/"));
    const skipped = files.length - readable.length;
    const texts = await Promise.all(
      readable.map(
        (f) =>
          new Promise((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(`# ${f.name}\n${r.result}`);
            r.onerror = () => resolve("");
            r.readAsText(f);
          }),
      ),
    );
    const joined = texts.filter(Boolean).join("\n\n");
    if (joined) set({ text: ((state.text || "") + "\n\n" + joined).trim() });
    setError(
      skipped > 0
        ? `Read ${readable.length} text file(s). ${skipped} file(s) skipped — paste PDF/DOCX content directly.`
        : null,
    );
    if (joined) setMethod("paste");
  }

  return (
    <div className="fade-in" style={{ maxWidth: 880, margin: "0 auto" }}>
      <StageHeader
        eyebrow="Step 1 · Input"
        title="What work should we look at?"
        lede="Bring the job descriptions or SOPs for a team — one, the other, or both. Throughline reads each document with Claude, works out who does what, and proposes where AI changes the work."
      />

      <Card style={{ marginTop: 26 }} pad={26}>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          {[["paste", "Paste text"], ["upload", "Upload files"]].map(([k, lbl]) => (
            <button key={k} onClick={() => setMethod(k)} style={{
              flex: 1, padding: "10px 14px", borderRadius: "var(--radius-sm)", fontWeight: 600, fontSize: 14,
              border: `1px solid ${method === k ? "var(--accent)" : "var(--line)"}`,
              background: method === k ? "var(--accent-tint)" : "var(--surface)",
              color: method === k ? "var(--accent-ink)" : "var(--ink-soft)", transition: "all .15s ease",
            }}>{lbl}</button>
          ))}
        </div>

        {method === "paste" ? (
          <textarea
            value={state.text}
            onChange={(e) => set({ text: e.target.value })}
            placeholder="Paste the team's job descriptions, an SOP, or a playbook — mix them freely. The more real detail, the sharper the analysis."
            style={{
              width: "100%", minHeight: 170, resize: "vertical", padding: 16, borderRadius: "var(--radius-sm)",
              border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink)", fontSize: 14, lineHeight: 1.6,
            }}
          />
        ) : (
          <>
            <input
              ref={fileRef} type="file" multiple accept=".txt,.md,.csv,.json,text/*"
              style={{ display: "none" }} onChange={(e) => onFiles(e.target.files)}
            />
            <DropZone
              icon="⤓"
              label="Drop or choose job descriptions and / or SOPs"
              sub=".txt .md .csv · paste PDF/DOCX content in the Paste tab"
              onClick={() => fileRef.current?.click()}
            />
            {(state.text || "").trim() && (
              <div style={{ marginTop: 10, fontSize: 12.5, color: "var(--ink-soft)", fontFamily: "var(--mono)" }}>
                {(state.text || "").trim().length.toLocaleString()} characters loaded.
              </div>
            )}
          </>
        )}

        <div style={{ marginTop: 12 }}>
          <InferNote>
            No need to sort or label anything — Throughline reads what you provide and detects on its own whether it's a <strong>job description</strong> or an <strong>SOP</strong>, then treats each accordingly.
          </InferNote>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 18 }}>
          <Field label="Team name — optional">
            <Input defaultValue={state.teamName} onChange={(v) => set({ teamName: v })} placeholder="e.g. Customer Success" />
          </Field>
          <Field label="Sector — improves accuracy">
            <Input defaultValue={state.sector} onChange={(v) => set({ sector: v })} placeholder="e.g. B2B SaaS, ~40 staff" />
          </Field>
        </div>
      </Card>

      {/* Maturity + direction */}
      <Card style={{ marginTop: 16 }} pad={26}>
        <Eyebrow>Current state &amp; ambition</Eyebrow>
        <h3 style={{ margin: "8px 0 4px", fontWeight: 600, fontSize: 21, fontFamily: "Poppins, system-ui, sans-serif" }}>
          Where is this team today, and where should it head?
        </h3>
        <p style={{ margin: "0 0 18px", color: "var(--ink-soft)", fontSize: 14, fontFamily: "Lato" }}>
          This anchors every hypothesis. We won't propose a leap the team isn't ready for.
        </p>

        <MaturityPicker
          label="Current AI maturity"
          value={state.currentMaturity}
          onChange={(v) => set({ currentMaturity: v })}
          options={MATURITY_STAGES}
        />
        <div style={{ height: 16 }} />
        <MaturityPicker
          label="Expected direction"
          value={state.targetDirection}
          onChange={(v) => set({ targetDirection: v })}
          options={DIRECTIONS}
        />
      </Card>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 10, marginTop: 22 }}>
        {error && (
          <div style={{ alignSelf: "stretch", padding: "12px 16px", borderRadius: "var(--radius-sm)", background: "oklch(0.95 0.04 25)", border: "1px solid oklch(0.85 0.08 25)", color: "oklch(0.45 0.12 25)", fontSize: 13.5, lineHeight: 1.5 }}>
            {error}
          </div>
        )}
        <Button size="lg" onClick={analyze} disabled={analyzing || !hasText}>
          {analyzing ? <Spinner label="Analyzing with Claude — this can take up to a minute…" /> : <>Analyze the team <Arrow /></>}
        </Button>
        {!hasText && !analyzing && (
          <div style={{ fontSize: 12.5, color: "var(--ink-faint)" }}>Paste or upload at least a short document to begin.</div>
        )}
      </div>
    </div>
  );
}

function MaturityPicker({ label, value, onChange, options }) {
  return (
    <div>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-soft)", marginBottom: 9, fontFamily: '"Bricolage Grotesque"' }}>{label}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, fontFamily: "Lato" }}>
        {options.map((o) => {
          const active = value === o.key;
          return (
            <button key={o.key} onClick={() => onChange(o.key)} style={{
              textAlign: "left", padding: "12px 13px", borderRadius: "var(--radius-sm)",
              border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`,
              background: active ? "var(--accent-tint)" : "var(--surface)",
              cursor: "pointer", transition: "all .15s ease", fontFamily: "Lato",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                <span style={{ width: 9, height: 9, borderRadius: 999, background: `var(${o.dot})`, flexShrink: 0 }} />
                <span style={{ fontWeight: 700, fontSize: 13, lineHeight: 1.2 }}>{o.label}</span>
              </div>
              <div style={{ fontSize: 11.5, color: "var(--ink-faint)", lineHeight: 1.4 }}>{o.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InferNote({ children }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 12.5, color: "var(--ink-soft)", lineHeight: 1.5 }}>
      <span style={{
        fontFamily: "var(--mono)", fontSize: 9.5, fontWeight: 600, letterSpacing: "0.06em", color: "var(--accent-ink)",
        background: "var(--accent-tint)", padding: "3px 8px", borderRadius: 999, textTransform: "uppercase",
        whiteSpace: "nowrap", marginTop: 1, flexShrink: 0,
      }}>Auto-detect</span>
      <span>{children}</span>
    </div>
  );
}
