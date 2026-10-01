// Minimal in-memory "who's online" tracker. Clients send a heartbeat with a
// per-tab session id every ~12s; a session counts as active if its last
// heartbeat was within ACTIVE_WINDOW_MS. No persistence, no identity — just
// an ephemeral presence count that forgets everything on restart.
//
// Caveat: on Vercel's serverless runtime this Map is per-instance, not
// shared across all warm/cold function instances, so the count is
// best-effort there (often accurate for light traffic, can undercount
// under real concurrent load). It's exact on the long-running local/
// Azure-style node:http server.

const ACTIVE_WINDOW_MS = 30_000;
const MAX_TRACKED_SESSIONS = 5000;

const sessions = new Map();

function pruneStale() {
  const cutoff = Date.now() - ACTIVE_WINDOW_MS;
  for (const [id, lastSeen] of sessions) {
    if (lastSeen < cutoff) sessions.delete(id);
  }
}

export function heartbeat(sessionId) {
  pruneStale();
  const valid = typeof sessionId === "string" && sessionId.length > 0 && sessionId.length <= 100;
  if (valid) {
    const isNew = !sessions.has(sessionId);
    if (!isNew || sessions.size < MAX_TRACKED_SESSIONS) {
      sessions.set(sessionId, Date.now());
    }
  }
  return sessions.size;
}
