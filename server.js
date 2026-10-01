import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getAgent, listAgentsMetadata, PHASES } from "./agents/registry.js";
import { getProviderStatus, generate, AiProviderError } from "./lib/aiProvider.js";
import { validateInputAgainstSchema, rejectRestrictedContent, ValidationError } from "./lib/validate.js";
import { SECURITY_HEADERS, sendJson, readJsonBody, createStaticHandler } from "./lib/http.js";
import { heartbeat } from "./lib/presence.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const serveStatic = createStaticHandler(publicDir);

const PORT = Number(process.env.PORT || 3000);
const defaultHosts = [`localhost:${PORT}`, `127.0.0.1:${PORT}`];
const extraHosts = (process.env.ALLOWED_HOSTS || "")
  .split(",")
  .map((h) => h.trim().toLowerCase())
  .filter(Boolean);
const ALLOWED_HOSTS = new Set([...defaultHosts, ...extraHosts]);

function isAllowedHost(host) {
  return Boolean(host) && ALLOWED_HOSTS.has(host.toLowerCase());
}

async function handleAgentsList(req, res) {
  sendJson(res, 200, { agents: listAgentsMetadata(), phases: PHASES });
}

async function handleStatus(req, res) {
  const status = getProviderStatus();
  sendJson(res, 200, { ai: status.configured, route: status.route });
}

async function handlePresence(req, res) {
  const body = await readJsonBody(req);
  const count = heartbeat(body.sessionId);
  sendJson(res, 200, { count });
}

async function handleAgentRun(req, res, id) {
  const agent = getAgent(id);
  if (!agent) return sendJson(res, 404, { error: "Unknown agent" });

  const body = await readJsonBody(req);
  const input = body.input && typeof body.input === "object" ? body.input : {};
  const mode = body.mode === "ai" ? "ai" : "template";

  validateInputAgainstSchema(agent.inputSchema, input);
  rejectRestrictedContent(input);

  if (mode === "template") {
    const output = agent.run(input);
    return sendJson(res, 200, { output, mode: "template" });
  }

  const status = getProviderStatus();
  if (!status.configured) return sendJson(res, 409, { error: "AI provider is not configured" });

  try {
    const { system, prompt } = agent.buildPrompt(input);
    const output = await generate({ system, prompt });
    sendJson(res, 200, { output, mode: "ai", route: status.route });
  } catch (err) {
    const detail = err instanceof AiProviderError ? err.safeMessage : "upstream error";
    sendJson(res, 502, { error: "AI draft failed", detail });
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const host = req.headers.host || "";
    if (!isAllowedHost(host)) {
      return sendJson(res, 403, { error: "Host not allowed" });
    }
    if (req.method === "POST") {
      const origin = req.headers.origin;
      if (origin) {
        const originHost = origin.replace(/^https?:\/\//, "");
        if (!isAllowedHost(originHost)) {
          return sendJson(res, 403, { error: "Cross-origin requests are blocked" });
        }
      }
    }

    const url = new URL(req.url, `http://${host}`);
    const { pathname } = url;

    if (pathname === "/api/agents" && req.method === "GET") {
      return await handleAgentsList(req, res);
    }
    if (pathname === "/api/status" && req.method === "GET") {
      return await handleStatus(req, res);
    }
    if (pathname === "/api/presence" && req.method === "POST") {
      return await handlePresence(req, res);
    }
    const runMatch = pathname.match(/^\/api\/agents\/([a-z0-9-]+)\/run$/);
    if (runMatch && req.method === "POST") {
      return await handleAgentRun(req, res, runMatch[1]);
    }
    if (pathname.startsWith("/api/")) {
      return sendJson(res, 404, { error: "Not found" });
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return sendJson(res, 405, { error: "Method not allowed" });
    }
    return await serveStatic(req, res);
  } catch (err) {
    if (err instanceof ValidationError || err.status === 400 || err.status === 415 || err.status === 413) {
      return sendJson(res, err.status || 400, { error: err.message });
    }
    res.writeHead(500, SECURITY_HEADERS);
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
});

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    console.log(`Agentic BA Workbench listening on http://localhost:${PORT}`);
  });
}

export default server;
