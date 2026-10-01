import { fetchJson } from "./api.js";

const HEARTBEAT_MS = 12_000;
const SESSION_KEY = "ba-workbench-session";

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

async function beat(badge) {
  try {
    const data = await fetchJson("/api/presence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: getSessionId() }),
    });
    const count = Number(data.count) || 1;
    badge.innerHTML = `<span class="live-dot"></span>${count} online`;
    badge.hidden = false;
  } catch {
    // Presence is best-effort decoration — fail silently, never block the page.
  }
}

export function initPresence() {
  const badge = document.getElementById("presence");
  if (!badge) return;
  beat(badge);
  setInterval(() => beat(badge), HEARTBEAT_MS);
}
