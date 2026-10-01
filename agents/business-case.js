import { listItems, bullets, table, section, joinSections, domainNote, domainPromptLine } from "./_shared.js";

export default {
  id: "business-case",
  name: "Business Case Agent",
  phase: "discovery-analysis",
  description: "Drafts a business case from a problem statement and objectives: metrics, cost-benefit, recommendation.",
  inputSchema: [
    {
      key: "problemStatement",
      label: "Problem / opportunity statement",
      type: "textarea",
      required: true,
      rows: 5,
      placeholder: "What problem or opportunity is driving this initiative?",
    },
    {
      key: "objectives",
      label: "Proposed objectives",
      type: "list",
      required: true,
      itemPlaceholder: "e.g. Reduce manual processing time",
    },
    { key: "targetUsers", label: "Target users / beneficiaries", type: "text", required: false },
    { key: "domainContext", label: "Domain / industry context (optional)", type: "textarea", required: false, rows: 2 },
  ],
  run(input) {
    const objectives = listItems(input.objectives);
    return joinSections([
      "# Business Case",
      domainNote(input),
      section("Problem / Opportunity Statement", input.problemStatement),
      section("Target Users / Beneficiaries", input.targetUsers || "_Not specified._"),
      section(
        "Objectives",
        bullets(objectives.map((o, i) => `**Obj-${i + 1}:** ${o}`))
      ),
      section(
        "Candidate Success Metrics",
        bullets(objectives.map((o) => `Measurable improvement tied to: "${o}" — _define baseline and target._`))
      ),
      section(
        "Cost-Benefit Snapshot",
        table(
          ["Category", "Estimate", "Notes"],
          [
            ["One-time cost", "_TBD_", "Build/implementation effort"],
            ["Ongoing cost", "_TBD_", "Run/maintenance effort"],
            ["Expected benefit", "_TBD_", "Tie to objectives above"],
          ]
        )
      ),
      section(
        "Recommendation",
        "Proceed to detailed requirements elicitation if objectives are confirmed by sponsors and a rough benefit estimate exceeds cost."
      ),
    ]);
  },
  buildPrompt(input) {
    const system =
      "You are a senior Business Analyst drafting a business case for sponsor review. Given a problem/opportunity " +
      "statement and proposed objectives, produce a Markdown business case with sections: 'Problem / Opportunity', " +
      "'Objectives', 'Success Metrics' (specific, measurable), 'Cost-Benefit Snapshot' (a small table), and " +
      "'Recommendation'. Do not invent specific financial figures — use placeholders where real data is needed. " +
      "Stay domain-agnostic unless a domain/industry context is given.";
    const prompt = [
      domainPromptLine(input),
      input.targetUsers ? `Target users: ${input.targetUsers}` : null,
      `Objectives: ${listItems(input.objectives).join("; ")}`,
      "Problem/opportunity statement:",
      input.problemStatement,
    ]
      .filter(Boolean)
      .join("\n");
    return { system, prompt };
  },
};
