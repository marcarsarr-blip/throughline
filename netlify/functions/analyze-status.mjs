// netlify/functions/analyze-status.mjs
// Fast synchronous endpoint the client polls. Returns {status:"pending"} until the
// background function has written a result, then returns the terminal record
// ({status:"done", analysis} or {status:"error", error}) and deletes the blob so
// nothing persists.
import { getStore } from "@netlify/blobs";

export default async (req) => {
  const jobId = new URL(req.url).searchParams.get("jobId");
  if (!jobId) {
    return Response.json({ error: "missing jobId" }, { status: 400 });
  }
  const store = getStore("analyses");
  const record = await store.get(jobId, { type: "json" });
  if (!record) {
    return Response.json({ status: "pending" });
  }
  // Terminal result — hand it back once, then drop it.
  try { await store.delete(jobId); } catch { /* ignore */ }
  return Response.json(record);
};
