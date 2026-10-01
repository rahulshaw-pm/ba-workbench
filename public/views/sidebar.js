function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === "text") node.textContent = value;
    else if (key === "html") node.innerHTML = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) node.appendChild(child);
  return node;
}

export function renderSidebar(sidebarEl, data, activeAgentId) {
  const { agents, phases } = data;
  sidebarEl.innerHTML = "";

  sidebarEl.appendChild(
    el("a", { class: "sidebar-brand", href: "#/" }, [
      el("span", { class: "accent", text: "✳" }),
      el("span", { text: "Agentic BA Workbench" }),
    ])
  );

  const nav = el("div", { class: "sidebar-nav" });
  for (const phase of phases) {
    const phaseAgents = agents.filter((a) => a.phase === phase.id);
    if (!phaseAgents.length) continue;

    const group = el("div", { class: "sidebar-group" });
    group.appendChild(el("h3", { class: "sidebar-group-title", text: phase.label }));

    for (const agent of phaseAgents) {
      const isActive = agent.id === activeAgentId;
      const link = el("a", {
        class: `sidebar-link${isActive ? " active" : ""}`,
        href: `#/agent/${agent.id}`,
        ...(isActive ? { "aria-current": "page" } : {}),
      });
      link.appendChild(el("span", { class: "sidebar-link-icon", "aria-hidden": "true" }));
      link.appendChild(el("span", { class: "sidebar-link-label", text: agent.name }));
      group.appendChild(link);
    }
    nav.appendChild(group);
  }
  sidebarEl.appendChild(nav);
}
