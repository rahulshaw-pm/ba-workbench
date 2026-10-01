import { sentences, table, section, joinSections, domainNote, domainPromptLine } from "./_shared.js";

function mermaidId(i) {
  return `S${i}`;
}

export default {
  id: "process-flow",
  name: "Process Flow Agent",
  phase: "requirements-design",
  description: "Turns a process description into a Mermaid flowchart (as copyable text) plus a step table.",
  inputSchema: [
    { key: "processName", label: "Process name", type: "text", required: false },
    {
      key: "processDescription",
      label: "Process description (one step per sentence works best)",
      type: "textarea",
      required: true,
      rows: 8,
    },
    { key: "domainContext", label: "Domain / industry context (optional)", type: "textarea", required: false, rows: 2 },
  ],
  run(input) {
    const steps = sentences(input.processDescription);
    const nodes = steps.map((s, i) => `  ${mermaidId(i)}["${s.replace(/"/g, "'")}"]`);
    const edges = steps.slice(1).map((_, i) => `  ${mermaidId(i)} --> ${mermaidId(i + 1)}`);
    const mermaid = ["```mermaid", "flowchart TD", ...nodes, ...edges, "```"].join("\n");
    const rows = steps.map((s, i) => [`${i + 1}`, "_TBD_", s, /\bif\b|\bdecision\b|\?/i.test(s) ? "Yes" : "No"]);
    return joinSections([
      `# Process Flow${input.processName ? `: ${input.processName}` : ""}`,
      domainNote(input),
      section("Flowchart (Mermaid — paste into any Mermaid-compatible renderer)", mermaid),
      section("Step Table", table(["#", "Actor", "Action", "Decision point?"], rows)),
    ]);
  },
  buildPrompt(input) {
    const system =
      "You are a senior Business Analyst documenting a process flow. Given a free-text process description, produce a " +
      "Markdown response with two sections: a fenced ```mermaid code block containing a `flowchart TD` diagram of the " +
      "process (including decision diamonds where branching logic is implied), and a step table with columns #, Actor, " +
      "Action, Decision point?. Do not attempt to render the diagram — output it as text only. Stay domain-agnostic " +
      "unless a domain/industry context is given.";
    const prompt = [
      input.processName ? `Process name: ${input.processName}` : null,
      domainPromptLine(input),
      "Process description:",
      input.processDescription,
    ]
      .filter(Boolean)
      .join("\n");
    return { system, prompt };
  },
};
