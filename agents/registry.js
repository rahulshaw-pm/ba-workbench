import requirementsElicitation from "./requirements-elicitation.js";
import stakeholderRaci from "./stakeholder-raci.js";
import businessCase from "./business-case.js";
import userStory from "./user-story.js";
import acceptanceCriteria from "./acceptance-criteria.js";
import processFlow from "./process-flow.js";
import gapRiskAnalysis from "./gap-risk-analysis.js";
import epicDecomposition from "./epic-decomposition.js";
import prioritization from "./prioritization.js";
import roadmap from "./roadmap.js";
import meetingMinutes from "./meeting-minutes.js";
import releaseNotes from "./release-notes.js";
import { PHASES } from "./phases.js";

export const AGENTS = [
  requirementsElicitation,
  stakeholderRaci,
  businessCase,
  userStory,
  acceptanceCriteria,
  processFlow,
  gapRiskAnalysis,
  epicDecomposition,
  prioritization,
  roadmap,
  meetingMinutes,
  releaseNotes,
];

export function getAgent(id) {
  return AGENTS.find((a) => a.id === id);
}

export function listAgentsMetadata() {
  return AGENTS.map(({ id, name, phase, description, inputSchema }) => ({
    id,
    name,
    phase,
    description,
    inputSchema,
  }));
}

export { PHASES };
