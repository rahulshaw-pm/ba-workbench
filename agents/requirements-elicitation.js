import { lines, bullets, section, joinSections, domainNote, domainPromptLine } from "./_shared.js";

const FUNCTIONAL_HINTS = /\b(must|shall|should|need to|able to|allow|support|enable|provide)\b/i;
const NONFUNCTIONAL_HINTS = /\b(performance|security|availability|scalab|latency|uptime|compliance|accessib|reliab|usab)\b/i;

function classify(noteLines) {
  const functional = [];
  const nonFunctional = [];
  const openQuestions = [];
  for (const line of noteLines) {
    if (NONFUNCTIONAL_HINTS.test(line)) nonFunctional.push(line);
    else if (FUNCTIONAL_HINTS.test(line)) functional.push(line);
    else openQuestions.push(line);
  }
  return { functional, nonFunctional, openQuestions };
}

export default {
  id: "requirements-elicitation",
  name: "Requirements Elicitation Agent",
  phase: "discovery-analysis",
  description: "Turns raw stakeholder notes into a structured, categorized requirements list.",
  inputSchema: [
    {
      key: "rawNotes",
      label: "Raw stakeholder notes / transcript",
      type: "textarea",
      required: true,
      rows: 10,
      placeholder: "Paste meeting notes, emails, or interview transcript here — one point per line works best.",
    },
    { key: "projectName", label: "Project / initiative name", type: "text", required: false },
    {
      key: "stakeholders",
      label: "Known stakeholders",
      type: "list",
      required: false,
      itemPlaceholder: "e.g. Head of Operations",
    },
    {
      key: "constraints",
      label: "Known constraints",
      type: "select",
      required: false,
      options: ["None specified", "Budget-limited", "Time-boxed", "Regulatory", "Legacy-system dependent"],
    },
    { key: "domainContext", label: "Domain / industry context (optional)", type: "textarea", required: false, rows: 2 },
  ],
  run(input) {
    const noteLines = lines(input.rawNotes);
    const { functional, nonFunctional, openQuestions } = classify(noteLines);
    const title = input.projectName ? `Requirements Brief: ${input.projectName}` : "Requirements Brief";
    return joinSections([
      `# ${title}`,
      domainNote(input),
      `_Derived from ${noteLines.length} source note line(s)._`,
      section(
        "Functional Requirements",
        bullets(functional.map((f, i) => `**FR-${i + 1}:** ${f}`))
      ),
      section(
        "Non-Functional Requirements",
        bullets(nonFunctional.map((f, i) => `**NFR-${i + 1}:** ${f}`))
      ),
      section("Assumptions & Open Questions", bullets(openQuestions)),
      section("Stakeholders", bullets(input.stakeholders || [])),
      input.constraints && input.constraints !== "None specified"
        ? section("Known Constraints", `- ${input.constraints}`)
        : "",
    ]);
  },
  buildPrompt(input) {
    const system =
      "You are a senior Business Analyst performing requirements elicitation. Given raw, unstructured stakeholder notes, " +
      "produce a structured requirements brief in Markdown with these sections, in order: 'Functional Requirements' " +
      "(numbered FR-1, FR-2, ...), 'Non-Functional Requirements' (numbered NFR-1, NFR-2, ...), 'Assumptions & Open Questions', " +
      "and 'Stakeholders'. Only use facts implied by the notes — flag ambiguity as an open question instead of inventing detail. " +
      "Stay domain-agnostic unless a domain/industry context is given.";
    const prompt = [
      input.projectName ? `Project: ${input.projectName}` : null,
      domainPromptLine(input),
      input.constraints && input.constraints !== "None specified" ? `Known constraint: ${input.constraints}` : null,
      (input.stakeholders || []).length ? `Known stakeholders: ${input.stakeholders.join(", ")}` : null,
      "Raw stakeholder notes:",
      input.rawNotes,
    ]
      .filter(Boolean)
      .join("\n");
    return { system, prompt };
  },
};
