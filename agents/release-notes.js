import { listItems, bullets, section, joinSections, domainNote, domainPromptLine } from "./_shared.js";

function categorize(item) {
  if (/\b(fix|bug|resolve|patch)\b/i.test(item)) return "fixes";
  if (/\b(add|new|introduce|launch)\b/i.test(item)) return "features";
  return "improvements";
}

export default {
  id: "release-notes",
  name: "Release Notes Agent",
  phase: "delivery-closure",
  description: "Turns a list of completed items into customer-facing release notes and an internal changelog.",
  inputSchema: [
    { key: "releaseVersion", label: "Release version / name", type: "text", required: false },
    {
      key: "completedItems",
      label: "Completed items",
      type: "list",
      required: true,
      itemPlaceholder: "e.g. Fixed CSV export timing out on large reports",
    },
    {
      key: "audience",
      label: "Primary audience",
      type: "select",
      required: false,
      options: ["Customer-facing", "Internal"],
    },
    { key: "domainContext", label: "Domain / industry context (optional)", type: "textarea", required: false, rows: 2 },
  ],
  run(input) {
    const items = listItems(input.completedItems);
    const grouped = { features: [], improvements: [], fixes: [] };
    for (const item of items) grouped[categorize(item)].push(item);
    return joinSections([
      `# Release Notes${input.releaseVersion ? ` — ${input.releaseVersion}` : ""}`,
      domainNote(input),
      section("New Features", bullets(grouped.features)),
      section("Improvements", bullets(grouped.improvements)),
      section("Fixes", bullets(grouped.fixes)),
      section(
        "Internal Changelog",
        bullets(items.map((i) => `\`${categorize(i)}\` ${i}`))
      ),
    ]);
  },
  buildPrompt(input) {
    const system =
      "You are a Product Manager writing release notes. Given a list of completed items and an audience preference, " +
      "group them under 'New Features', 'Improvements', and 'Fixes', then write customer-friendly one-line summaries " +
      "for each (plain language if audience is Customer-facing, more technical if Internal), followed by a terse " +
      "'Internal Changelog' bullet list. Stay domain-agnostic unless a domain/industry context is given.";
    const prompt = [
      input.releaseVersion ? `Release: ${input.releaseVersion}` : null,
      `Audience: ${input.audience || "Customer-facing"}`,
      domainPromptLine(input),
      `Completed items: ${listItems(input.completedItems).join("; ")}`,
    ]
      .filter(Boolean)
      .join("\n");
    return { system, prompt };
  },
};
