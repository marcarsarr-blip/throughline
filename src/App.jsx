// App.jsx — Throughline shell: stepper, stage state machine, live analysis, tweaks
import { useState, useEffect, useRef } from "react";
import { setLevelModel } from "./levelModel.js";
import { Logo } from "./components/primitives.jsx";
import { AnalysisProvider } from "./analysis/context.jsx";
import { analyzeTeam } from "./api/analyze.js";
import { useTweaks, TweaksPanel, TweakSection, TweakRadio } from "./tweaks/TweaksPanel.jsx";
import { StageSetup } from "./stages/StageSetup.jsx";
import { StageJobs } from "./stages/StageJobs.jsx";
import { StageMission } from "./stages/StageMission.jsx";
import { StageActivities } from "./stages/StageActivities.jsx";
import { StageRestructure } from "./stages/StageRestructure.jsx";
import { StageConnect } from "./stages/StageConnect.jsx";
import { StageTransition } from "./stages/StageTransition.jsx";
import { StageExport } from "./stages/StageExport.jsx";

const ACCENTS = [
  { key: "clay", name: "Clay", hue: 42 },
  { key: "forest", name: "Forest", hue: 150 },
  { key: "indigo", name: "Indigo", hue: 264 },
  { key: "plum", name: "Plum", hue: 354 },
];

const STAGES = [
  { key: "setup", label: "Input" },
  { key: "jobs", label: "Jobs" },
  { key: "mission", label: "Mission" },
  { key: "activities", label: "AI map" },
  { key: "restructure", label: "Team shape" },
  { key: "connect", label: "Connect" },
  { key: "transition", label: "Transition" },
  { key: "export", label: "Export" },
];

const TWEAK_DEFAULTS = {
  accent: "indigo",
  levelModel: "spectrum",
  visualStyle: "warm",
  model: "opus",
};

function applyAccent(key) {
  const a = ACCENTS.find((x) => x.key === key) || ACCENTS[0];
  const H = a.hue;
  const r = document.documentElement.style;
  r.setProperty("--accent", `oklch(0.62 0.13 ${H})`);
  r.setProperty("--accent-deep", `oklch(0.50 0.12 ${H})`);
  r.setProperty("--accent-tint", `oklch(0.955 0.028 ${H})`);
  r.setProperty("--accent-tint-2", `oklch(0.90 0.05 ${H})`);
  r.setProperty("--accent-ink", `oklch(0.40 0.10 ${H})`);
}

export default function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  // Set the active naming model during render so children read it this pass.
  setLevelModel(t.levelModel);

  useEffect(() => { applyAccent(t.accent); }, [t.accent]);
  useEffect(() => { document.body.setAttribute("data-style", t.visualStyle); }, [t.visualStyle]);

  const [stage, setStage] = useState(0);
  const [maxReached, setMax] = useState(0);
  const [missionOK, setMissionOK] = useState(false);
  const [levels, setLevels] = useState({});
  const [conns, setConns] = useState({ crm: false, erp: false, lms: false });
  const [analysis, setAnalysis] = useState(null);
  const [setup, setSetup] = useState({
    method: "paste", text: "", teamName: "", sector: "",
    currentMaturity: "assisted", targetDirection: "growth",
  });
  const scrollRef = useRef(null);

  function go(i) {
    if (i > maxReached) setMax(i);
    setStage(i);
    if (scrollRef.current) scrollRef.current.scrollTo({ top: 0, behavior: "smooth" });
  }
  function next() { go(stage + 1); }
  function setLevel(id, lv) { setLevels((p) => ({ ...p, [id]: lv })); }

  // Live analysis: calls the Netlify proxy, then advances on success.
  // Throws on failure so StageSetup can render the error inline.
  async function runAnalysis() {
    const result = await analyzeTeam({
      text: setup.text,
      teamName: setup.teamName,
      sector: setup.sector,
      currentMaturity: setup.currentMaturity,
      targetDirection: setup.targetDirection,
      model: t.model,
    });
    setAnalysis(result);
    setLevels({});
    setMissionOK(false);
    go(1);
  }

  function restart() {
    go(0);
    setAnalysis(null);
    setMissionOK(false);
    setLevels({});
    setConns({ crm: false, erp: false, lms: false });
  }

  const cur = STAGES[stage].key;

  return (
    <div ref={scrollRef} style={{ height: "100vh", overflowY: "auto" }}>
      <AnalysisProvider analysis={analysis}>
        <Header stage={stage} maxReached={maxReached} go={go} setup={setup} analysis={analysis} />

        <main style={{ padding: "40px 32px 90px" }}>
          {cur === "setup" && <StageSetup state={setup} set={(p) => setSetup((s) => ({ ...s, ...p }))} onAnalyze={runAnalysis} />}
          {cur === "jobs" && analysis && <StageJobs onNext={next} />}
          {cur === "mission" && analysis && <StageMission validated={missionOK} onValidate={() => { setMissionOK(true); next(); }} />}
          {cur === "activities" && analysis && <StageActivities levels={levels} setLevel={setLevel} onNext={next} />}
          {cur === "restructure" && analysis && <StageRestructure onNext={next} />}
          {cur === "connect" && <StageConnect conns={conns} toggle={(k) => setConns((p) => ({ ...p, [k]: !p[k] }))} onNext={next} />}
          {cur === "transition" && analysis && <StageTransition conns={conns} onNext={next} />}
          {cur === "export" && analysis && <StageExport state={setup} levels={levels} onRestart={restart} />}
        </main>

        <TweaksPanel>
          <TweakSection label="Analysis model" />
          <TweakRadio label="Claude" value={t.model}
            options={[{ value: "opus", label: "Opus 4.8" }, { value: "sonnet", label: "Sonnet 4.6" }]}
            onChange={(v) => setTweak("model", v)} />
          <div style={{ fontSize: 11.5, color: "rgba(41,38,27,.5)", lineHeight: 1.45, margin: "2px 2px 0", fontFamily: "var(--mono)" }}>
            {t.model === "opus" ? "Most capable · slower · $5/$25 per 1M" : "Faster · cheaper · $3/$15 per 1M"}
          </div>
          <TweakSection label="Accent" />
          <SwatchRow value={t.accent} onChange={(v) => setTweak("accent", v)} />
          <TweakSection label="AI level model" />
          <TweakRadio label="Naming" value={t.levelModel}
            options={["spectrum", "copilot", "maturity"]}
            onChange={(v) => setTweak("levelModel", v)} />
          <div style={{ fontSize: 11.5, color: "rgba(41,38,27,.5)", lineHeight: 1.45, margin: "2px 2px 0", fontFamily: "var(--mono)" }}>
            {t.levelModel === "spectrum" && "Assist · Augment · Automate · Autonomous"}
            {t.levelModel === "copilot" && "Advisor · Copilot · Operator · Agent"}
            {t.levelModel === "maturity" && "Level 1 · 2 · 3 · 4"}
          </div>
          <TweakSection label="Visual style" />
          <TweakRadio label="Treatment" value={t.visualStyle}
            options={["warm", "soft", "editorial"]}
            onChange={(v) => setTweak("visualStyle", v)} />
        </TweaksPanel>
      </AnalysisProvider>
    </div>
  );
}

// custom accent swatch control
function SwatchRow({ value, onChange }) {
  return (
    <div style={{ display: "flex", gap: 9, padding: "2px 2px 4px" }}>
      {ACCENTS.map((a) => (
        <button key={a.key} onClick={() => onChange(a.key)} title={a.name} style={{
          flex: 1, height: 38, borderRadius: 9, cursor: "pointer",
          background: `oklch(0.62 0.13 ${a.hue})`,
          border: value === a.key ? "2px solid #29261b" : "2px solid transparent",
          outline: value === a.key ? "2px solid rgba(255,255,255,.9)" : "none", outlineOffset: -4,
          boxShadow: value === a.key ? "0 0 0 1px rgba(0,0,0,.15)" : "none",
        }} />
      ))}
    </div>
  );
}

function Header({ stage, maxReached, go, setup, analysis }) {
  const teamLabel = setup.teamName || analysis?.team?.name || "Your team";
  const source = analysis?.team?.source || "Awaiting input";
  return (
    <header style={{ position: "sticky", top: 0, zIndex: 30, background: "color-mix(in oklab, var(--paper) 88%, transparent)", backdropFilter: "blur(10px)", borderBottom: "1px solid var(--line)" }}>
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "16px 32px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Logo />
          <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, color: "var(--ink-faint)" }}>
            <span style={{ fontFamily: "var(--mono)" }}>{teamLabel}</span>
            <span style={{ width: 4, height: 4, borderRadius: 999, background: "var(--line)" }} />
            <span>{source}</span>
          </div>
        </div>
        <Stepper stage={stage} maxReached={maxReached} go={go} />
      </div>
    </header>
  );
}

function Stepper({ stage, maxReached, go }) {
  return (
    <div style={{ display: "flex", gap: 2, marginTop: 14, overflowX: "auto" }}>
      {STAGES.map((s, i) => {
        const active = i === stage;
        const done = i < stage;
        const reachable = i <= maxReached;
        return (
          <button key={s.key} onClick={() => reachable && go(i)} disabled={!reachable} style={{
            flex: 1, minWidth: 78, background: "none", border: "none", padding: "0 0 14px", cursor: reachable ? "pointer" : "default",
            position: "relative", fontFamily: '"Bricolage Grotesque"',
          }}>
            <div style={{ height: 3, borderRadius: 999, background: active ? "var(--accent)" : done ? "var(--accent-tint-2)" : "var(--line)", transition: "background .2s ease" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 9, justifyContent: "center" }}>
              <span style={{
                width: 17, height: 17, borderRadius: 999, fontSize: 10, fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: active ? "var(--accent)" : done ? "var(--accent-tint)" : "var(--paper-2)",
                color: active ? "white" : done ? "var(--accent-ink)" : "var(--ink-faint)",
                border: done || active ? "none" : "1px solid var(--line)",
              }}>{done ? "✓" : i + 1}</span>
              <span style={{ fontSize: 12.5, fontWeight: active ? 700 : 500, color: active ? "var(--ink)" : reachable ? "var(--ink-soft)" : "var(--ink-faint)", whiteSpace: "nowrap" }}>{s.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
