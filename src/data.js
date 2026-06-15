// data.js — the framework constants only. The team scenario is no longer hard-coded:
// roles, mission, activities, restructure, and transition all come from the live
// Claude analysis (see netlify/functions/analyze.mjs) and flow through AnalysisContext.

export const LEVELS = {
  assist: {
    key: "assist", index: 0, label: "Assist",
    short: "AI on call",
    blurb: "Human does the work; AI answers questions and drafts on request.",
    cssVar: "--lv-1", tintVar: "--lv-1-tint",
  },
  augment: {
    key: "augment", index: 1, label: "Augment",
    short: "AI alongside",
    blurb: "AI accelerates each step; human leads, decides, and owns the outcome.",
    cssVar: "--lv-2", tintVar: "--lv-2-tint",
  },
  automate: {
    key: "automate", index: 2, label: "Automate",
    short: "AI runs it",
    blurb: "AI performs the task end-to-end; human reviews and approves results.",
    cssVar: "--lv-3", tintVar: "--lv-3-tint",
  },
  autonomous: {
    key: "autonomous", index: 3, label: "Autonomous",
    short: "AI owns it",
    blurb: "AI executes and self-corrects within guardrails; human sets policy only.",
    cssVar: "--lv-4", tintVar: "--lv-4-tint",
  },
};
export const LEVEL_ORDER = ["assist", "augment", "automate", "autonomous"];

// Alternate naming models, switchable via Tweaks
export const LEVEL_MODELS = {
  spectrum: { assist: "Assist", augment: "Augment", automate: "Automate", autonomous: "Autonomous" },
  copilot: { assist: "Advisor", augment: "Copilot", automate: "Operator", autonomous: "Agent" },
  maturity: { assist: "Level 1", augment: "Level 2", automate: "Level 3", autonomous: "Level 4" },
};

// Current-state maturity stages (team-level) for the input picker
export const MATURITY_STAGES = [
  { key: "assisted", label: "Assisted work", desc: "People do the work; AI answers and drafts on request.", dot: "--lv-1" },
  { key: "delegated", label: "Delegated automation", desc: "Defined tasks handed to AI; people review the output.", dot: "--lv-2" },
  { key: "teams", label: "Human–AI teams", desc: "People and AI work side by side toward shared goals.", dot: "--lv-3" },
  { key: "agentic", label: "Adaptive agentic", desc: "AI runs and adapts processes within human guardrails.", dot: "--lv-4" },
];

// Expected direction (ambition / intent) for the input picker
export const DIRECTIONS = [
  { key: "efficiency", label: "Efficiency", desc: "Do more with less.", dot: "--accent" },
  { key: "growth", label: "Growth", desc: "Scale output and scope.", dot: "--accent" },
  { key: "innovation", label: "Innovation", desc: "New products or services.", dot: "--accent" },
  { key: "transformation", label: "Transformation", desc: "Reinvent how work gets done.", dot: "--accent" },
];

export const SKILL_TYPE = {
  technical: { label: "Technical", var: "--lv-3" },
  human: { label: "Human", var: "--accent" },
  hybrid: { label: "Hybrid", var: "--lv-2" },
};
export const URGENCY = {
  immediate: { label: "Immediate", dot: "var(--accent)" },
  near: { label: "Near-term", dot: "var(--lv-2)" },
  future: { label: "Future", dot: "var(--ink-faint)" },
};
