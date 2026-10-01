import { listItems, table, section, joinSections, domainNote, domainPromptLine } from "./_shared.js";

export default {
  id: "stakeholder-raci",
  name: "Stakeholder & RACI Agent",
  phase: "discovery-analysis",
  description: "Builds a stakeholder RACI matrix from a stakeholder list and key activities/decisions.",
  inputSchema: [
    { key: "projectName", label: "Project / initiative name", type: "text", required: false },
    {
      key: "stakeholders",
      label: "Stakeholders",
      type: "list",
      required: true,
      itemPlaceholder: "e.g. Product Owner",
    },
    {
      key: "activities",
      label: "Key activities / decisions",
      type: "list",
      required: true,
      itemPlaceholder: "e.g. Approve scope changes",
    },
    { key: "domainContext", label: "Domain / industry context (optional)", type: "textarea", required: false, rows: 2 },
  ],
  run(input) {
    const stakeholders = listItems(input.stakeholders);
    const activities = listItems(input.activities);
    const rows = activities.map((activity, ai) => {
      const cells = stakeholders.map((_, si) => {
        if (si === 0) return "A";
        if (si === (ai % Math.max(stakeholders.length - 1, 1)) + 1) return "R";
        return "C/I";
      });
      return [activity, ...cells];
    });
    return joinSections([
      `# Stakeholder RACI Matrix${input.projectName ? `: ${input.projectName}` : ""}`,
      domainNote(input),
      "_R = Responsible, A = Accountable, C = Consulted, I = Informed. Assignments below are a starting heuristic — adjust per your governance model._",
      table(["Activity / Decision", ...stakeholders], rows),
      section(
        "Stakeholder Notes",
        stakeholders.map((s) => `- **${s}** — interest/influence: _to confirm_`).join("\n")
      ),
    ]);
  },
  buildPrompt(input) {
    const system =
      "You are a senior Business Analyst building a stakeholder engagement plan. Given a list of stakeholders and key " +
      "activities/decisions, produce a Markdown RACI matrix (table with activities as rows and stakeholders as columns, " +
      "cells containing R/A/C/I, with exactly one A per row) followed by a short stakeholder notes section estimating " +
      "each stakeholder's interest and influence as High/Medium/Low with a one-line rationale. Stay domain-agnostic " +
      "unless a domain/industry context is given.";
    const prompt = [
      input.projectName ? `Project: ${input.projectName}` : null,
      domainPromptLine(input),
      `Stakeholders: ${listItems(input.stakeholders).join(", ")}`,
      `Key activities/decisions: ${listItems(input.activities).join(", ")}`,
    ]
      .filter(Boolean)
      .join("\n");
    return { system, prompt };
  },
};
