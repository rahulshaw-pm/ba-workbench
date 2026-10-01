import { listItems, table, section, joinSections, domainNote, domainPromptLine } from "./_shared.js";

function moscow(text) {
  if (/\bmust\b|\brequired\b|\bcritical\b/i.test(text)) return "Must";
  if (/\bshould\b|\bimportant\b/i.test(text)) return "Should";
  if (/\bcould\b|\bnice to have\b/i.test(text)) return "Could";
  return "Could";
}

function effortFor(text) {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 4));
}

export default {
  id: "prioritization",
  name: "Prioritization Agent",
  phase: "planning",
  description: "Scores and ranks backlog items using MoSCoW classification and a RICE score.",
  inputSchema: [
    {
      key: "backlogItems",
      label: "Backlog items",
      type: "list",
      required: true,
      itemPlaceholder: "e.g. Add CSV export to reports",
    },
    { key: "domainContext", label: "Domain / industry context (optional)", type: "textarea", required: false, rows: 2 },
  ],
  run(input) {
    const items = listItems(input.backlogItems);
    const scored = items.map((item) => {
      const reach = 100;
      const impact = 2;
      const confidence = 0.8;
      const effort = effortFor(item);
      const rice = Math.round(((reach * impact * confidence) / effort) * 10) / 10;
      return { item, moscow: moscow(item), reach, impact, confidence, effort, rice };
    });
    scored.sort((a, b) => b.rice - a.rice);
    const rows = scored.map((s, i) => [
      `${i + 1}`,
      s.item,
      s.moscow,
      `${s.reach}`,
      `${s.impact}`,
      `${Math.round(s.confidence * 100)}%`,
      `${s.effort}`,
      `${s.rice}`,
    ]);
    return joinSections([
      "# Backlog Prioritization",
      domainNote(input),
      "_RICE uses placeholder Reach/Impact/Confidence defaults and an effort estimate from item length — replace with real estimates before committing to a plan._",
      section(
        "Ranked Backlog",
        table(["Rank", "Item", "MoSCoW", "Reach", "Impact", "Confidence", "Effort", "RICE"], rows)
      ),
    ]);
  },
  buildPrompt(input) {
    const system =
      "You are a senior Product Manager prioritizing a backlog. Given a list of backlog items, classify each with " +
      "MoSCoW (Must/Should/Could/Won't) and estimate RICE components (Reach, Impact 1-3, Confidence %, Effort in " +
      "person-weeks), compute a RICE score, and produce a single Markdown table ranked by RICE score descending with " +
      "columns Rank, Item, MoSCoW, Reach, Impact, Confidence, Effort, RICE. State your estimates are directional, not " +
      "precise. Stay domain-agnostic unless a domain/industry context is given.";
    const prompt = [domainPromptLine(input), `Backlog items: ${listItems(input.backlogItems).join("; ")}`]
      .filter(Boolean)
      .join("\n");
    return { system, prompt };
  },
};
