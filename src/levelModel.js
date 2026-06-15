// levelModel.js — holds the active AI-level naming model so levelLabel() can be
// called from any component. App sets it during render (mirrors the original
// window.__levelModel pattern); children read it in the same render pass.
import { LEVELS, LEVEL_MODELS } from "./data.js";

let current = LEVEL_MODELS.spectrum;

export function setLevelModel(key) {
  current = LEVEL_MODELS[key] || LEVEL_MODELS.spectrum;
}

export function levelLabel(key) {
  return (current && current[key]) || LEVELS[key].label;
}
