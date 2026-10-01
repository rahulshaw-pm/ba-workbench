import { heartbeat } from "../lib/presence.js";
import { withSecurityHeaders } from "../lib/vercelHeaders.js";

export default function handler(req, res) {
  withSecurityHeaders(res);
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const contentType = req.headers["content-type"] || "";
  if (!contentType.startsWith("application/json")) {
    return res.status(415).json({ error: "Content-Type must be application/json" });
  }
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const count = heartbeat(body.sessionId);
  res.status(200).json({ count });
}
