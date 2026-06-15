# Throughline

An AI work-redesign studio — a clickable workbench that turns a team's job descriptions / SOPs
into jobs-to-be-done, infers a team mission, and maps where AI changes the work. Built as a
**basis for discussion**, not a decision.

The analysis is **live**: you paste real documents and Claude (Opus 4.8 or Sonnet 4.6) extracts
the roles, JTBD, mission, AI-integration map, restructure, and transition plan. Nothing is
pre-filled and nothing is stored.

Recreated as a Vite + React app from a [Claude Design](https://claude.ai/design) handoff.

## Architecture — the API key stays server-side

A Vite app ships entirely to the browser, so an API key placed "in it" would be readable by every
visitor. Instead, the key lives in a **Netlify serverless function** (`netlify/functions/analyze.mjs`):

```
browser (React)  ──POST /api/analyze──▶  Netlify Function  ──▶  Anthropic API
   no key                                  reads ANTHROPIC_API_KEY (server env)
```

The function receives the document text, calls Claude with structured outputs, and returns the
analysis JSON. The browser never sees the key. The function is stateless — it stores nothing.

## Running locally

You need an Anthropic API key (https://console.anthropic.com → API keys).

```bash
npm install
cp .env.example .env          # then put your key in .env  (ANTHROPIC_API_KEY=sk-ant-...)
npm run dev                   # runs `netlify dev` — Vite + the function together, on http://localhost:8888
```

- `npm run dev` → full stack via `netlify dev` (this is what makes the live analysis work locally).
- `npm run dev:vite` → Vite only (UI renders, but `/api/analyze` returns 404 — no key needed).
- `npm run build` → production build to `dist/`.

## Deploying to Netlify

1. Push this repo to GitHub and "Add new site → Import from Git" in Netlify (build command and
   publish dir come from `netlify.toml` automatically), **or** run `npx netlify deploy --prod`.
2. In Netlify: **Site settings → Environment variables → add `ANTHROPIC_API_KEY`** with your key.
3. Redeploy. The live site now powers analysis with your key, server-side.

> Note: a full Opus analysis can take ~15–25s. If your Netlify plan caps synchronous functions
> below that, switch the model to **Sonnet 4.6** in the Tweaks panel (faster), or raise the
> function timeout on your plan.

## The flow (8 stages)

1. **Input** — paste or upload (.txt/.md/.csv) JDs/SOPs, set the team's current AI maturity and direction
2. **Jobs** — JTBD per role, extracted live, each editable
3. **Mission** — inferred mission with a human-review validation gate
4. **AI map** — every activity placed on **Assist → Augment → Automate → Autonomous**; re-place any hypothesis and the distribution updates
5. **Team shape** — before/after restructuring
6. **Connect** — optional, read-only CRM / ERP / LMS toggles that ground the plan
7. **Transition** — phased roadmap + theory/practice skills by urgency
8. **Export** — Figma / PDF handoff, framed as a basis for discussion

## Customization (Tweaks panel)

The floating **Tweaks** button (bottom-right) switches:
- **Analysis model** — Opus 4.8 (most capable) / Sonnet 4.6 (faster, cheaper)
- **Accent** — Clay / Forest / Indigo / Plum
- **AI level model** — Spectrum / Copilot / Maturity naming
- **Visual style** — Warm / Soft / Editorial

## Notes

- **No data is stored.** Everything is in memory for the session — no backend DB, no persistence. Reloading resets the app.
- Export buttons show the intended action; actual Figma/PDF generation isn't wired.
- File upload reads text files (.txt/.md/.csv) client-side; for PDF/DOCX, paste the content into the Paste tab.

## Structure

```
src/
  data.js                    # framework constants (levels, maturity, directions) — no scenario data
  levelModel.js              # active AI-level naming model
  styles.css                 # design tokens (CSS variables) + globals
  api/analyze.js             # client → /api/analyze
  analysis/context.jsx       # holds the live analysis + role lookup
  components/primitives.jsx   # Logo, Button, Card, LevelSpectrum, etc.
  stages/                    # the 8 stage screens (read from AnalysisContext)
  tweaks/TweaksPanel.jsx     # floating live-customization panel
  App.jsx                    # shell: stepper, state machine, analyze call, tweaks
netlify/functions/analyze.mjs # serverless proxy — holds the key, calls Claude
netlify.toml                 # build + /api/* redirect + dev config
```
