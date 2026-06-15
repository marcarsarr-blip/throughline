// netlify/functions/analyze.mjs
// Server-side proxy: the Anthropic API key lives here as an env var (ANTHROPIC_API_KEY)
// and never reaches the browser. Receives raw document text + setup, calls Claude, and
// returns the full Throughline analysis as JSON. Stateless — nothing is stored.
//
// Note: we deliberately do NOT use strict structured outputs (output_config.format).
// The full analysis schema is large enough that Anthropic's constrained-decoding grammar
// exceeds its size limit ("compiled grammar is too large"). Instead we describe the exact
// JSON shape in the system prompt and parse the response defensively.
import Anthropic from "@anthropic-ai/sdk";

const MODELS = {
  opus: "claude-opus-4-8",
  sonnet: "claude-sonnet-4-6",
};

const MAX_INPUT_CHARS = 120_000;

const SYSTEM = `You are the analysis engine behind Throughline, a workshop tool that helps SME leaders redesign how a team works with AI. You read a team's job descriptions and/or SOPs and produce a structured redesign that is a BASIS FOR DISCUSSION, not a decision.

Ground everything in the documents you are given. Do not assume the team is a sales team or any other default — infer the real domain from the input. If the input is thin, infer reasonably and lower the confidence fields accordingly.

Produce:
1. roles — every distinct role in the input, each with its real jobs-to-be-done written as "When… I want… so I can…" statements.
2. mission — one synthesized mission sentence + exactly 3 pillars + a short note on where the team's center of gravity sits.
3. activities — the concrete activities the team performs. Place each on the AI spectrum:
   - assist: human does the work; AI answers/drafts on request
   - augment: AI accelerates each step; human leads and owns the outcome
   - automate: AI performs the task end-to-end; human reviews
   - autonomous: AI executes and self-corrects within guardrails; human sets policy
   "current" anchors to the team's stated current AI maturity. "proposed" is where AI should take it given the team's expected direction. Keep relationship- and judgment-heavy work human-led (proposed === current) on purpose. Give each a rationale, concrete expected outputs, one headline outcome (metric + value like "−65%", "+40%", or "By design" for human-led), the impacted roles, and a confidence.
4. restructure — before/after team shape. Do not eliminate roles; reshape them and add at most one new AI-orchestration role.
5. transition — a 3-phase roadmap (immediate / near / future) plus the theoretical and practical skills each role must acquire, sequenced by urgency.

Role ids must be consistent everywhere: every id in activities.roles, activities.impacted, restructure.before[].role, restructure.after[].from (unless "new"), and transition.skills[].forRole (unless "All"/"new") must exist in roles[].id.

OUTPUT FORMAT — return ONLY a single minified JSON object, no markdown fences, no commentary before or after. Use exactly these keys and these enum values:

{
  "team": { "name": string, "sector": string, "source": string },
  "roles": [ { "id": string (short slug), "title": string, "count": integer, "initials": string (1-3 uppercase letters), "summary": string, "jtbd": [ { "statement": string, "confidence": "high"|"med"|"low" } ] } ],
  "mission": { "inferred": string, "pillars": [string, string, string], "note": string },
  "activities": [ { "id": string, "name": string, "roles": [role id], "current": "assist"|"augment"|"automate"|"autonomous", "proposed": "assist"|"augment"|"automate"|"autonomous", "rationale": string, "outputs": [string], "outcome": { "metric": string, "value": string }, "impacted": [role id], "confidence": "high"|"med"|"low" } ],
  "restructure": { "headline": string, "narrative": string, "before": [ { "role": role id, "label": string, "count": integer } ], "after": [ { "label": string, "count": integer, "from": role id|"new", "change": "reshaped"|"focused"|"elevated"|"unchanged"|"new", "note": string } ] },
  "transition": { "phases": [ { "id": string, "name": string, "tag": string, "urgency": "immediate"|"near"|"future", "focus": string, "moves": [string] } ], "skills": [ { "name": string, "type": "technical"|"human"|"hybrid", "urgency": "immediate"|"near"|"future", "mode": "theory"|"practice", "forRole": "All"|"new"|role id } ] }
}`;

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

// Defensive JSON extraction — handles accidental markdown fences or stray prose.
function extractJson(text) {
  let t = (text || "").trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  if (!t.startsWith("{")) {
    const i = t.indexOf("{");
    const j = t.lastIndexOf("}");
    if (i >= 0 && j > i) t = t.slice(i, j + 1);
  }
  return JSON.parse(t);
}

export const handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method not allowed" });
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return json(500, { error: "Server is missing ANTHROPIC_API_KEY. Set it in your Netlify environment (or local .env)." });
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }

  const text = (payload.text || "").trim();
  if (text.length < 40) {
    return json(400, { error: "Paste at least a short job description or SOP to analyze." });
  }
  const model = MODELS[payload.model] || MODELS.opus;
  const teamName = (payload.teamName || "").trim();
  const sector = (payload.sector || "").trim();
  const currentMaturity = payload.currentMaturity || "unspecified";
  const targetDirection = payload.targetDirection || "unspecified";

  const userContent = [
    teamName && `Team name: ${teamName}`,
    sector && `Sector: ${sector}`,
    `Current AI maturity (team's self-assessment): ${currentMaturity}`,
    `Expected direction / ambition: ${targetDirection}`,
    "",
    "Documents (job descriptions and/or SOPs — infer which is which):",
    "---",
    text.slice(0, MAX_INPUT_CHARS),
    "---",
    "Analyze this team and return the structured redesign as a single JSON object.",
  ]
    .filter((l) => l !== false && l !== undefined && l !== null)
    .join("\n");

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system: SYSTEM,
      messages: [{ role: "user", content: userContent }],
    });

    if (response.stop_reason === "refusal") {
      return json(422, { error: "The model declined to analyze this input." });
    }
    const block = response.content.find((b) => b.type === "text");
    if (!block) {
      return json(502, { error: "No analysis was returned. Try again." });
    }
    let analysis;
    try {
      analysis = extractJson(block.text);
    } catch {
      return json(502, { error: "The analysis came back malformed. Try again, or switch model in Tweaks." });
    }
    return json(200, { analysis, model });
  } catch (err) {
    const status = err?.status || 500;
    const message =
      status === 401
        ? "Anthropic rejected the API key (401). Check ANTHROPIC_API_KEY."
        : status === 429
          ? "Rate limited by Anthropic (429). Wait a moment and retry."
          : err?.message || "Analysis failed.";
    return json(status >= 400 && status < 600 ? status : 500, { error: message });
  }
};
