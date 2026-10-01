import { fetchJson } from "./lib/api.js";
import { renderLanding } from "./views/landing.js";
import { renderAgentView } from "./views/agentView.js";
import { renderSidebar } from "./views/sidebar.js";
import { initPresence } from "./lib/presence.js";
import { initEyes } from "./lib/eyes.js";

const root = document.getElementById("app");
const sidebar = document.getElementById("sidebar");
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
  const activeAgentId = match ? match[1] : null;
  renderSidebar(sidebar, agentsData, activeAgentId);
  document.body.classList.remove("sidebar-open");

  if (activeAgentId) {
    const agent = agentsData.agents.find((a) => a.id === activeAgentId);
    if (!agent) return renderError("Unknown agent.");
    return renderAgentView(root, agent, statusData);
  }
  renderLanding(root, agentsData);
}

function initSidebarToggle() {
  const toggle = document.getElementById("sidebar-toggle");
  if (!toggle) return;
  toggle.addEventListener("click", () => {
    const open = document.body.classList.toggle("sidebar-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}

window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", router);
window.addEventListener("DOMContentLoaded", initPresence);
window.addEventListener("DOMContentLoaded", initEyes);
window.addEventListener("DOMContentLoaded", initSidebarToggle);
