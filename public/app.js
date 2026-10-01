import { fetchJson } from "./lib/api.js";
import { renderLanding } from "./views/landing.js";
import { renderAgentView } from "./views/agentView.js";

const root = document.getElementById("app");
let agentsData = null;
let statusData = null;

function renderError(message) {
  root.innerHTML = "";
  const p = document.createElement("p");
  p.className = "output-error";
  p.textContent = message;
  root.appendChild(p);
}

async function router() {
  try {
    if (!agentsData) agentsData = await fetchJson("/api/agents");
    if (!statusData) statusData = await fetchJson("/api/status");
  } catch (err) {
    return renderError(`Failed to load Agentic BA Workbench: ${err.message}`);
  }

  const hash = location.hash || "#/";
  const match = hash.match(/^#\/agent\/(.+)$/);
  if (match) {
    const agent = agentsData.agents.find((a) => a.id === match[1]);
    if (!agent) return renderError("Unknown agent.");
    return renderAgentView(root, agent, statusData);
  }
  renderLanding(root, agentsData);
}

window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", router);
