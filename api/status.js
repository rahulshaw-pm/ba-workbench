import { getProviderStatus } from "../lib/aiProvider.js";
import { withSecurityHeaders } from "../lib/vercelHeaders.js";

export default function handler(req, res) {
  withSecurityHeaders(res);
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const status = getProviderStatus();
  res.status(200).json({ ai: status.configured, route: status.route });
}
