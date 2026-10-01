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

export function renderLanding(root, data) {
  const { agents, phases } = data;
  root.innerHTML = "";

  const header = el("header", { class: "hero" }, [
    el("div", { class: "brand", html: '<span class="accent">✳</span>AGENTIC BA WORKBENCH' }),
    el("p", { class: "tagline" }, [
      document.createTextNode("Single-activity AI agents for every stage of the BA/PM lifecycle — from evidence to backlog."),
    ]),
  ]);
  root.appendChild(header);

  const main = el("main", { class: "landing" });
  for (const phase of phases) {
    const phaseAgents = agents.filter((a) => a.phase === phase.id);
    if (!phaseAgents.length) continue;
    const section = el("section", { class: "phase-group" });
    section.appendChild(el("h2", { text: phase.label }));
    const grid = el("div", { class: "card-grid" });
    for (const agent of phaseAgents) {
      const card = el("a", { class: "agent-card", href: `#/agent/${agent.id}` }, [
        el("h3", { text: agent.name }),
        el("p", { text: agent.description }),
      ]);
      grid.appendChild(card);
    }
    section.appendChild(grid);
    main.appendChild(section);
  }
  root.appendChild(main);
}
