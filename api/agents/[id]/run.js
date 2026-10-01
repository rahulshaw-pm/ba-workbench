import { getAgent } from "../../../agents/registry.js";
import { getProviderStatus, generate, AiProviderError } from "../../../lib/aiProvider.js";
import { validateInputAgainstSchema, rejectRestrictedContent } from "../../../lib/validate.js";
import { withSecurityHeaders } from "../../../lib/vercelHeaders.js";

const MAX_BODY_BYTES = 100_000;

function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch {
      const err = new Error("Invalid JSON body");
      err.status = 400;
      throw err;
    }
  }
  return {};
}

export default async function handler(req, res) {
  withSecurityHeaders(res);
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const contentType = req.headers["content-type"] || "";
  if (!contentType.startsWith("application/json")) {
    return res.status(415).json({ error: "Content-Type must be application/json" });
  }

  const { id } = req.query;
  const agent = getAgent(id);
  if (!agent) return res.status(404).json({ error: "Unknown agent" });

  let body;
  try {
    body = parseBody(req);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message });
  }

  if (JSON.stringify(body ?? {}).length > MAX_BODY_BYTES) {
    return res.status(413).json({ error: "Request body too large" });
  }

  const input = body.input && typeof body.input === "object" ? body.input : {};
  const mode = body.mode === "ai" ? "ai" : "template";

  try {
    validateInputAgainstSchema(agent.inputSchema, input);
    rejectRestrictedContent(input);
  } catch (err) {
    return res.status(err.status || 400).json({ error: err.message });
  }

  if (mode === "template") {
    return res.status(200).json({ output: agent.run(input), mode: "template" });
  }

  const status = getProviderStatus();
  if (!status.configured) {
    return res.status(409).json({ error: "AI provider is not configured" });
  }

  try {
    const { system, prompt } = agent.buildPrompt(input);
    const output = await generate({ system, prompt });
    res.status(200).json({ output, mode: "ai", route: status.route });
  } catch (err) {
    const detail = err instanceof AiProviderError ? err.safeMessage : "upstream error";
    res.status(502).json({ error: "AI draft failed", detail });
  }
}
