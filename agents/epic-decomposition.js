import { sentences, table, section, joinSections, domainNote, domainPromptLine } from "./_shared.js";

function sizeFor(text) {
  const words = text.split(/\s+/).filter(Boolean).length;
  if (words <= 8) return "S";
  if (words <= 16) return "M";
  return "L";
}

export default {
  id: "epic-decomposition",
  name: "Epic Decomposition Agent",
  phase: "planning",
  description: "Breaks an epic description into candidate stories/tasks with rough t-shirt sizing.",
  inputSchema: [
    { key: "epicDescription", label: "Epic description", type: "textarea", required: true, rows: 6 },
    { key: "targetRelease", label: "Target release / sprint", type: "text", required: false },
    { key: "domainContext", label: "Domain / industry context (optional)", type: "textarea", required: false, rows: 2 },
  ],
  run(input) {
    const candidates = sentences(input.epicDescription);
    const rows = candidates.map((c, i) => [`Story ${i + 1}`, c, sizeFor(c), "_Refine before planning._"]);
    return joinSections([
      "# Epic Decomposition",
      domainNote(input),
      section("Epic", input.epicDescription),
      input.targetRelease ? section("Target Release / Sprint", input.targetRelease) : "",
      section("Candidate Stories / Tasks", table(["ID", "Description", "Rough Size (S/M/L)", "Notes"], rows)),
    ]);
  },
  buildPrompt(input) {
    const system =
      "You are a senior Product Manager decomposing an epic. Given an epic description, split it into 3-8 candidate " +
      "stories or tasks and produce a Markdown table with columns ID, Description, Rough Size (S/M/L), Notes — note " +
      "any dependency between stories. Stay domain-agnostic unless a domain/industry context is given.";
    const prompt = [
      input.targetRelease ? `Target release/sprint: ${input.targetRelease}` : null,
      domainPromptLine(input),
      "Epic description:",
      input.epicDescription,
    ]
      .filter(Boolean)
      .join("\n");
    return { system, prompt };
  },
};
