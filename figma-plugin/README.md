# Throughline — Figma plugin

Turns a Throughline analysis into **editable Figma frames** (mission, jobs-to-be-done,
AI map, team shape, transition). It runs inside Figma using the Plugin API — which is the
only Figma surface that can create real, editable design content (the REST API can't).

## Install (one time)

The plugin runs in **development mode** — no publishing needed.

1. Open the **Figma desktop app** (development plugins need the desktop app).
2. Menu → **Plugins → Development → Import plugin from manifest…**
3. Select **`figma-plugin/manifest.json`** from this repo.

It now appears under **Plugins → Development → Throughline**.

## Use

1. In the Throughline web app, finish an analysis and open **Step 8 · Export**.
2. Click **Send to Figma** → **Copy analysis for Figma** (copies JSON to your clipboard).
3. In Figma, run **Plugins → Development → Throughline**.
4. Click **Paste from clipboard** (or paste manually), then **Generate frames**.

A board of editable frames appears on your canvas, centered in view. Everything is native
Figma — rearrange, restyle, and annotate freely in your workshop.

## Notes

- No network access and no auth — the plugin only reads the JSON you paste. It stores nothing.
- Fonts: uses **Inter** (bundled with Figma).
- If "Paste from clipboard" is blocked by the browser/Figma, just paste into the textarea with Ctrl/Cmd+V.
