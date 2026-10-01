import { listItems, table, section, joinSections, domainNote, domainPromptLine } from "./_shared.js";

const HORIZON_QUARTERS = {
  "Next Quarter": ["Q1"],
  "Next 2 Quarters": ["Q1", "Q2"],
  "Next Year": ["Q1", "Q2", "Q3", "Q4"],
};

export default {
  id: "roadmap",
  name: "Roadmap Agent",
  phase: "planning",
  description: "Distributes prioritized themes across a quarterly roadmap outline.",
  inputSchema: [
    {
      key: "themes",
      label: "Prioritized themes / epics",
      type: "list",
      required: true,
      itemPlaceholder: "e.g. Self-service onboarding",
    },
    {
      key: "horizon",
      label: "Planning horizon",
      type: "select",
      required: false,
      options: ["Next Quarter", "Next 2 Quarters", "Next Year"],
    },
    { key: "domainContext", label: "Domain / industry context (optional)", type: "textarea", required: false, rows: 2 },
  ],
  run(input) {
    const themes = listItems(input.themes);
    const quarters = HORIZON_QUARTERS[input.horizon] || HORIZON_QUARTERS["Next Quarter"];
    const rows = themes.map((theme, i) => [quarters[i % quarters.length], theme, "_Define the outcome this theme should deliver._"]);
    return joinSections([
      "# Roadmap Outline",
      domainNote(input),
      section("Roadmap", table(["Quarter", "Theme", "Goal"], rows)),
    ]);
  },
  buildPrompt(input) {
    const system =
      "You are a senior Product Manager building a roadmap. Given a prioritized list of themes/epics and a planning " +
      "horizon, group the themes into quarters (earliest/highest-priority themes first) and produce a Markdown table " +
      "with columns Quarter, Theme, Goal — the Goal column should state the outcome, not the output. Stay " +
      "domain-agnostic unless a domain/industry context is given.";
    const prompt = [
      `Planning horizon: ${input.horizon || "Next Quarter"}`,
      domainPromptLine(input),
      `Prioritized themes: ${listItems(input.themes).join("; ")}`,
    ]
      .filter(Boolean)
      .join("\n");
    return { system, prompt };
  },
};
