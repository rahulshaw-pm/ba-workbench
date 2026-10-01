import { listAgentsMetadata, PHASES } from "../agents/registry.js";
import { withSecurityHeaders } from "../lib/vercelHeaders.js";

export default function handler(req, res) {
  withSecurityHeaders(res);
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  res.status(200).json({ agents: listAgentsMetadata(), phases: PHASES });
}
