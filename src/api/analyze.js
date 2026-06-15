// analyze.js — calls the Netlify proxy (/api/analyze), which holds the API key
// server-side and returns the structured Throughline analysis.
export async function analyzeTeam(input) {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Unexpected response (${res.status}).`);
  }
  if (!res.ok) {
    throw new Error(data?.error || `Request failed (${res.status}).`);
  }
  return data.analysis;
}
