// netlify/functions/analyze-background.mjs
// Background function (up to 15 min) — avoids the ~10s synchronous timeout that an LLM
// analysis would blow past. Returns 202 immediately; the real work runs after, and the
// result is written to a Netlify Blobs store keyed by jobId. The client polls
// analyze-status to retrieve it. The API key stays server-side; the blob is transient
// (deleted on read by the status function).
import Anthropic from "@anthropic-ai/sdk";
import { getStore } from "@netlify/blobs";

export const config = { background: true };

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

export default async (req) => {
  const store = getStore("analyses");
  let jobId;
  try {
    const payload = await req.json();
    jobId = payload.jobId;
    if (!jobId) return new Response("missing jobId", { status: 400 });

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      await store.setJSON(jobId, { status: "error", error: "Server is missing ANTHROPIC_API_KEY." });
      return new Response(null, { status: 202 });
    }

    const text = (payload.text || "").trim();
    if (text.length < 40) {
      await store.setJSON(jobId, { status: "error", error: "Paste at least a short job description or SOP." });
      return new Response(null, { status: 202 });
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
    const response = await client.messages.create({
      model,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system: SYSTEM,
      messages: [{ role: "user", content: userContent }],
    });

    if (response.stop_reason === "refusal") {
      await store.setJSON(jobId, { status: "error", error: "The model declined to analyze this input." });
      return new Response(null, { status: 202 });
    }
    const block = response.content.find((b) => b.type === "text");
    if (!block) {
      await store.setJSON(jobId, { status: "error", error: "No analysis was returned. Try again." });
      return new Response(null, { status: 202 });
    }
    let analysis;
    try {
      analysis = extractJson(block.text);
    } catch {
      await store.setJSON(jobId, { status: "error", error: "The analysis came back malformed. Try again, or switch model in Tweaks." });
      return new Response(null, { status: 202 });
    }
    await store.setJSON(jobId, { status: "done", analysis, model });
  } catch (err) {
    const status = err?.status;
    const message =
      status === 401
        ? "Anthropic rejected the API key (401). Check ANTHROPIC_API_KEY."
        : status === 429
          ? "Rate limited by Anthropic (429). Wait a moment and retry."
          : err?.message || "Analysis failed.";
    if (jobId) {
      try { await getStore("analyses").setJSON(jobId, { status: "error", error: message }); } catch { /* ignore */ }
    }
  }
  return new Response(null, { status: 202 });
};
