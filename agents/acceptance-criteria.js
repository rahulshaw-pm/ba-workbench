import { listItems, section, joinSections, domainNote, domainPromptLine } from "./_shared.js";

export default {
  id: "acceptance-criteria",
  name: "Acceptance Criteria Agent",
  phase: "requirements-design",
  description: "Generates Given/When/Then acceptance criteria and edge cases for a single user story.",
  inputSchema: [
    {
      key: "userStory",
      label: "User story (As a... I want... so that...)",
      type: "textarea",
      required: true,
      rows: 3,
    },
    { key: "businessRules", label: "Known business rules", type: "list", required: false },
    {
      key: "includeEdgeCases",
      label: "Edge-case depth",
      type: "select",
      required: false,
      options: ["Standard", "Thorough (include negative + boundary cases)"],
    },
    { key: "domainContext", label: "Domain / industry context (optional)", type: "textarea", required: false, rows: 2 },
  ],
  run(input) {
    const rules = listItems(input.businessRules);
    const thorough = input.includeEdgeCases?.startsWith("Thorough");
    const scenarios = [
      [
        "### Scenario 1 — Happy path",
        "**Given** the preconditions described in the story are met,",
        "**When** the user performs the primary action,",
        "**Then** the expected outcome in the story is delivered.",
      ].join("\n"),
      ...rules.map(
        (rule, i) =>
          [
            `### Scenario ${i + 2} — Business rule: ${rule}`,
            "**Given** the user is attempting the action in the story,",
            `**When** the rule "${rule}" applies,`,
            "**Then** the system enforces that rule and communicates the outcome clearly.",
          ].join("\n")
      ),
    ];
    if (thorough) {
      scenarios.push(
        [
          `### Scenario ${scenarios.length + 1} — Negative case`,
          "**Given** required input is missing or invalid,",
          "**When** the user attempts the primary action,",
          "**Then** the system rejects the action with a clear, actionable error message.",
        ].join("\n"),
        [
          `### Scenario ${scenarios.length + 2} — Boundary case`,
          "**Given** input is at the minimum/maximum allowed boundary,",
          "**When** the user attempts the primary action,",
          "**Then** the system handles the boundary value correctly without error.",
        ].join("\n")
      );
    }
    return joinSections([
      "# Acceptance Criteria",
      domainNote(input),
      section("User Story", input.userStory),
      scenarios.join("\n\n"),
    ]);
  },
  buildPrompt(input) {
    const system =
      "You are a senior Business Analyst writing acceptance criteria. Given a user story, known business rules, and an " +
      "edge-case depth preference, produce Given/When/Then scenarios in Markdown: always include a happy-path scenario " +
      "and one scenario per business rule; if 'Thorough' is requested, also add negative and boundary scenarios. Stay " +
      "domain-agnostic unless a domain/industry context is given.";
    const prompt = [
      domainPromptLine(input),
      rulesLine(input),
      `Edge-case depth: ${input.includeEdgeCases || "Standard"}`,
      "User story:",
      input.userStory,
    ]
      .filter(Boolean)
      .join("\n");
    return { system, prompt };
  },
};

function rulesLine(input) {
  const rules = listItems(input.businessRules);
  return rules.length ? `Known business rules: ${rules.join("; ")}` : null;
}
