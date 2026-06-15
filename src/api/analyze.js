// analyze.js — starts the analysis in a Netlify background function (no timeout),
// then polls the status endpoint until the result is ready. The key stays server-side.
const START_URL = "/.netlify/functions/analyze-background";
const STATUS_URL = "/.netlify/functions/analyze-status";
const POLL_MS = 2500;
const TIMEOUT_MS = 150_000; // ~2.5 min ceiling on the client wait

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function analyzeTeam(input) {
  const jobId =
    (crypto.randomUUID && crypto.randomUUID()) ||
    `${Date.now()}-${Math.round(Math.random() * 1e9)}`;

  const start = await fetch(START_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...input, jobId }),
  });
  // Background functions reply 202; a non-2xx means it didn't even start.
  if (!start.ok && start.status !== 202) {
    let msg = `Could not start analysis (${start.status}).`;
    try {
      const j = await start.json();
      if (j?.error) msg = j.error;
    } catch { /* ignore */ }
    throw new Error(msg);
  }

  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    await sleep(POLL_MS);
    let res;
    try {
      res = await fetch(`${STATUS_URL}?jobId=${encodeURIComponent(jobId)}`);
    } catch {
      continue; // transient network hiccup — keep polling
    }
    if (!res.ok) continue;
    const data = await res.json().catch(() => null);
    if (!data) continue;
    if (data.status === "done") return data.analysis;
    if (data.status === "error") throw new Error(data.error || "Analysis failed.");
    // status === "pending" → keep polling
  }
  throw new Error("Analysis is taking longer than expected. Try Sonnet 4.6 in Tweaks, or a shorter document.");
}
