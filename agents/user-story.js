import { sentences, section, joinSections, domainNote, domainPromptLine } from "./_shared.js";

export default {
  id: "user-story",
  name: "User Story Agent",
  phase: "requirements-design",
  description: "Converts a feature description into INVEST-aligned user stories.",
  inputSchema: [
    {
      key: "featureDescription",
      label: "Feature / capability description",
      type: "textarea",
      required: true,
      rows: 5,
      placeholder: "Describe the feature or capability in a sentence or two per idea.",
    },
    { key: "persona", label: "Primary persona", type: "text", required: false, placeholder: "e.g. account manager" },
    { key: "businessGoal", label: "Business goal / value", type: "text", required: false },
    { key: "domainContext", label: "Domain / industry context (optional)", type: "textarea", required: false, rows: 2 },
  ],
  run(input) {
    const persona = input.persona?.trim() || "user";
    const goal = input.businessGoal?.trim() || "I can accomplish my goal more easily";
    const clauses = sentences(input.featureDescription).slice(0, 5);
    const stories = (clauses.length ? clauses : [input.featureDescription]).map((clause, i) => {
      const want = clause.replace(/^(the system (should|must|will)|users? (can|should|must))\s*/i, "").trim();
      return [
        `### Story ${i + 1}`,
        `As a **${persona}**, I want **${want || "this capability"}**, so that ${goal}.`,
        "",
        "**INVEST check:** Independent • Negotiable • Valuable • Estimable • Small • Testable — review before adding to the backlog.",
      ].join("\n");
    });
    return joinSections([
      "# User Stories",
      domainNote(input),
      section("Source Feature Description", input.featureDescription),
      stories.join("\n\n"),
    ]);
  },
  buildPrompt(input) {
    const system =
      "You are a senior Product Manager writing user stories. Given a feature description, a primary persona, and a " +
      "business goal, produce 2-5 INVEST-aligned user stories in Markdown, each formatted as 'As a <persona>, I want " +
      "<capability>, so that <value>.' followed by one line noting any INVEST risk (e.g. 'may not be Small — consider " +
      "splitting'). Stay domain-agnostic unless a domain/industry context is given.";
    const prompt = [
      `Primary persona: ${input.persona || "end user"}`,
      `Business goal: ${input.businessGoal || "not specified — infer a reasonable one"}`,
      domainPromptLine(input),
      "Feature description:",
      input.featureDescription,
    ]
      .filter(Boolean)
      .join("\n");
    return { system, prompt };
  },
};
