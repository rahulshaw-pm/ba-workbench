import { lines, listItems, bullets, section, joinSections, domainNote, domainPromptLine } from "./_shared.js";

const DECISION_HINTS = /\b(decided|agreed|approved|resolved|will proceed)\b/i;
const ACTION_HINTS = /\b(action|todo|to-do|will send|will follow up|owns|by (eod|eow|friday|monday|next week))\b/i;

export default {
  id: "meeting-minutes",
  name: "Meeting Minutes Agent",
  phase: "delivery-closure",
  description: "Summarizes raw meeting notes/transcript into structured minutes with decisions and action items.",
  inputSchema: [
    { key: "meetingTitle", label: "Meeting title", type: "text", required: false },
    { key: "attendees", label: "Attendees", type: "list", required: false, itemPlaceholder: "e.g. Priya (PM)" },
    {
      key: "transcript",
      label: "Raw meeting notes / transcript",
      type: "textarea",
      required: true,
      rows: 10,
    },
    { key: "domainContext", label: "Domain / industry context (optional)", type: "textarea", required: false, rows: 2 },
  ],
  run(input) {
    const noteLines = lines(input.transcript);
    const decisions = noteLines.filter((l) => DECISION_HINTS.test(l));
    const actions = noteLines.filter((l) => ACTION_HINTS.test(l) && !DECISION_HINTS.test(l));
    const discussion = noteLines.filter((l) => !DECISION_HINTS.test(l) && !ACTION_HINTS.test(l));
    return joinSections([
      `# Meeting Minutes${input.meetingTitle ? `: ${input.meetingTitle}` : ""}`,
      domainNote(input),
      section("Attendees", bullets(listItems(input.attendees))),
      section("Decisions", bullets(decisions)),
      section(
        "Action Items",
        bullets(actions.map((a) => `${a} — _Owner: TBD, Due: TBD_`))
      ),
      section("Discussion Notes", bullets(discussion)),
    ]);
  },
  buildPrompt(input) {
    const system =
      "You are a meticulous Business Analyst producing meeting minutes. Given raw, unstructured meeting notes or a " +
      "transcript, produce Markdown minutes with sections: 'Attendees', 'Decisions', 'Action Items' (each with an " +
      "Owner and Due date — infer Owner from the text if a name is mentioned near it, else TBD), and 'Discussion " +
      "Notes' for everything else. Do not fabricate decisions or owners not implied by the text. Stay domain-agnostic " +
      "unless a domain/industry context is given.";
    const prompt = [
      input.meetingTitle ? `Meeting title: ${input.meetingTitle}` : null,
      listItems(input.attendees).length ? `Attendees: ${listItems(input.attendees).join(", ")}` : null,
      domainPromptLine(input),
      "Raw notes/transcript:",
      input.transcript,
    ]
      .filter(Boolean)
      .join("\n");
    return { system, prompt };
  },
};
