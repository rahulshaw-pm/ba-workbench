import { lines, table, section, joinSections, domainNote, domainPromptLine } from "./_shared.js";

export default {
  id: "gap-risk-analysis",
  name: "Gap & Risk Analysis Agent",
  phase: "requirements-design",
  description: "Compares current vs desired state to produce a gap list and an associated risk register.",
  inputSchema: [
    { key: "currentState", label: "Current state", type: "textarea", required: true, rows: 6 },
    { key: "desiredState", label: "Desired future state", type: "textarea", required: true, rows: 6 },
    { key: "domainContext", label: "Domain / industry context (optional)", type: "textarea", required: false, rows: 2 },
  ],
  run(input) {
    const current = lines(input.currentState);
    const desired = lines(input.desiredState);
    const gapCount = Math.max(current.length, desired.length, 1);
    const gaps = [];
    for (let i = 0; i < gapCount; i++) {
      const from = current[i] || "_(not specified in current state)_";
      const to = desired[i] || "_(not specified in desired state)_";
      if (from === to) continue;
      gaps.push([`G-${gaps.length + 1}`, from, to]);
    }
    const risks = gaps.map((g, i) => [`R-${i + 1}`, `Gap ${g[0]} is not closed on time`, "Medium", "Medium", "_Define mitigation owner and plan._"]);
    return joinSections([
      "# Gap & Risk Analysis",
      domainNote(input),
      section("Gap List", table(["ID", "Current State", "Desired State"], gaps)),
      section("Risk Register", table(["ID", "Risk", "Likelihood", "Impact", "Mitigation"], risks)),
    ]);
  },
  buildPrompt(input) {
    const system =
      "You are a senior Business Analyst performing a gap analysis. Given a current-state description and a " +
      "desired-future-state description, produce a Markdown response with two sections: a 'Gap List' table (ID, " +
      "Current State, Desired State) identifying concrete differences, and a 'Risk Register' table (ID, Risk, " +
      "Likelihood, Impact, Mitigation) covering the risk of each gap not being closed. Use High/Medium/Low for " +
      "Likelihood and Impact. Stay domain-agnostic unless a domain/industry context is given.";
    const prompt = [
      domainPromptLine(input),
      "Current state:",
      input.currentState,
      "Desired future state:",
      input.desiredState,
    ]
      .filter(Boolean)
      .join("\n");
    return { system, prompt };
  },
};
