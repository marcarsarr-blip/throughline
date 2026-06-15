// netlify/functions/analyze.mjs
// Server-side proxy: the Anthropic API key lives here as an env var (ANTHROPIC_API_KEY)
// and never reaches the browser. Receives raw document text + setup, calls Claude with
// structured outputs, and returns the full Throughline analysis as JSON. Stateless —
// nothing is stored.
import Anthropic from "@anthropic-ai/sdk";

const MODELS = {
  opus: "claude-opus-4-8",
  sonnet: "claude-sonnet-4-6",
};

const MAX_INPUT_CHARS = 120_000;

// JSON Schema for structured outputs. Shapes match what the React stages consume.
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    team: {
      type: "object",
      additionalProperties: false,
      properties: {
        name: { type: "string" },
        sector: { type: "string" },
        source: { type: "string", description: "Short description of the inputs analyzed, e.g. '4 job descriptions + 1 SOP'." },
      },
      required: ["name", "sector", "source"],
    },
    roles: {
      type: "array",
      description: "One entry per distinct role found in the input.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string", description: "Short stable slug, e.g. 'sdr'. Referenced elsewhere." },
          title: { type: "string" },
          count: { type: "integer", description: "Headcount in this role; 1 if unknown." },
          initials: { type: "string", description: "1-3 uppercase letters." },
          summary: { type: "string" },
          jtbd: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                statement: { type: "string", description: "A 'When… I want… so I can…' jobs-to-be-done statement." },
                confidence: { type: "string", enum: ["high", "med", "low"] },
              },
              required: ["statement", "confidence"],
            },
          },
        },
        required: ["id", "title", "count", "initials", "summary", "jtbd"],
      },
    },
    mission: {
      type: "object",
      additionalProperties: false,
      properties: {
        inferred: { type: "string", description: "One synthesized mission sentence." },
        pillars: { type: "array", items: { type: "string" }, description: "Exactly 3 short pillars." },
        note: { type: "string" },
      },
      required: ["inferred", "pillars", "note"],
    },
    activities: {
      type: "array",
      description: "The concrete activities the team performs, placed on the AI spectrum.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string", description: "Short slug, e.g. 'a1'." },
          name: { type: "string" },
          roles: { type: "array", items: { type: "string" }, description: "Role ids that perform this activity." },
          current: { type: "string", enum: ["assist", "augment", "automate", "autonomous"] },
          proposed: { type: "string", enum: ["assist", "augment", "automate", "autonomous"] },
          rationale: { type: "string" },
          outputs: { type: "array", items: { type: "string" } },
          outcome: {
            type: "object",
            additionalProperties: false,
            properties: {
              metric: { type: "string" },
              value: { type: "string", description: "e.g. '−65%', '+40%', 'By design'." },
            },
            required: ["metric", "value"],
          },
          impacted: { type: "array", items: { type: "string" }, description: "Role ids impacted." },
          confidence: { type: "string", enum: ["high", "med", "low"] },
        },
        required: ["id", "name", "roles", "current", "proposed", "rationale", "outputs", "outcome", "impacted", "confidence"],
      },
    },
    restructure: {
      type: "object",
      additionalProperties: false,
      properties: {
        headline: { type: "string" },
        narrative: { type: "string" },
        before: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              role: { type: "string", description: "A role id from roles[]." },
              label: { type: "string" },
              count: { type: "integer" },
            },
            required: ["role", "label", "count"],
          },
        },
        after: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              label: { type: "string" },
              count: { type: "integer" },
              from: { type: "string", description: "Originating role id, or 'new' for a newly created role." },
              change: { type: "string", enum: ["reshaped", "focused", "elevated", "unchanged", "new"] },
              note: { type: "string" },
            },
            required: ["label", "count", "from", "change", "note"],
          },
        },
      },
      required: ["headline", "narrative", "before", "after"],
    },
    transition: {
      type: "object",
      additionalProperties: false,
      properties: {
        phases: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              id: { type: "string" },
              name: { type: "string", description: "Time horizon, e.g. 'Now → 90 days'." },
              tag: { type: "string", description: "Short phase name, e.g. 'Foundations'." },
              urgency: { type: "string", enum: ["immediate", "near", "future"] },
              focus: { type: "string" },
              moves: { type: "array", items: { type: "string" } },
            },
            required: ["id", "name", "tag", "urgency", "focus", "moves"],
          },
        },
        skills: {
          type: "array",
          items: {
            type: "object",
            additionalProperties: false,
            properties: {
              name: { type: "string" },
              type: { type: "string", enum: ["technical", "human", "hybrid"] },
              urgency: { type: "string", enum: ["immediate", "near", "future"] },
              mode: { type: "string", enum: ["theory", "practice"] },
              forRole: { type: "string", description: "'All', 'new', or a role id." },
            },
            required: ["name", "type", "urgency", "mode", "forRole"],
          },
        },
      },
      required: ["phases", "skills"],
    },
  },
  required: ["team", "roles", "mission", "activities", "restructure", "transition"],
};

const SYSTEM = `You are the analysis engine behind Throughline, a workshop tool that helps SME leaders redesign how a team works with AI. You read a team's job descriptions and/or SOPs and produce a structured redesign that is a BASIS FOR DISCUSSION, not a decision.

Ground everything in the documents you are given. Do not assume the team is a sales team or any other default — infer the real domain from the input. If the input is thin, infer reasonably and lower the confidence fields accordingly.

Produce, in order:
1. roles — every distinct role in the input, each with its real jobs-to-be-done written as "When… I want… so I can…" statements.
2. mission — one synthesized mission sentence + exactly 3 pillars + a short note on where the team's center of gravity sits.
3. activities — the concrete activities the team performs. Place each on the AI spectrum:
   - assist: human does the work; AI answers/drafts on request
   - augment: AI accelerates each step; human leads and owns the outcome
   - automate: AI performs the task end-to-end; human reviews
   - autonomous: AI executes and self-corrects within guardrails; human sets policy
   "current" is where it is today (anchor to the team's stated current AI maturity). "proposed" is where AI should take it given the team's expected direction. Keep relationship- and judgment-heavy work human-led (proposed === current) on purpose. Give each a rationale, concrete expected outputs, one headline outcome (metric + value like "−65%", "+40%", or "By design" for human-led), the impacted roles, and a confidence.
4. restructure — before/after team shape. Do not eliminate roles; reshape them and add at most one new AI-orchestration role. Reference role ids consistently.
5. transition — a 3-phase roadmap (immediate / near / future) plus the theoretical and practical skills each role must acquire, sequenced by urgency.

CRITICAL: role ids must be consistent everywhere. Every id used in activities.roles, activities.impacted, restructure.before[].role, restructure.after[].from (unless "new"), and transition.skills[].forRole (unless "All"/"new") must exist in roles[].id. Be concrete and concise.`;

function json(statusCode, body) {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
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
    "Analyze this team and return the structured redesign.",
  ]
    .filter((l) => l !== false && l !== undefined && l !== null)
    .join("\n");

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model,
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: SCHEMA },
      },
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
    const analysis = JSON.parse(block.text);
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
