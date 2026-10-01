import { readFile } from "node:fs/promises";
import path from "node:path";

export const SECURITY_HEADERS = {
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'self'",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Cache-Control": "no-store",
};

export function sendJson(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { ...SECURITY_HEADERS, "Content-Type": "application/json; charset=utf-8" });
  res.end(body);
}

export const MAX_BODY_BYTES = 100_000;

export async function readJsonBody(req) {
  const contentType = req.headers["content-type"] || "";
  if (!contentType.startsWith("application/json")) {
    const err = new Error("Content-Type must be application/json");
    err.status = 415;
    throw err;
  }
  // Fully drain the request stream even past the size limit (just discarding
  // the overflow) so the connection isn't closed with unread bytes still
  // in flight, which would reset the client's connection instead of
  // delivering a clean 413 response.
  return new Promise((resolve, reject) => {
    let body = "";
    let bytes = 0;
    let tooLarge = false;
    req.on("data", (chunk) => {
      bytes += chunk.length;
      if (bytes > MAX_BODY_BYTES) {
        tooLarge = true;
        body = "";
        return;
      }
      body += chunk;
    });
    req.on("end", () => {
      if (tooLarge) {
        const err = new Error("Request body too large");
        err.status = 413;
        return reject(err);
      }
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch {
        const err = new Error("Invalid JSON body");
        err.status = 400;
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

const CONTENT_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

export function createStaticHandler(publicDir) {
  const root = path.normalize(publicDir);
  return async function serveStatic(req, res) {
    const url = new URL(req.url, "http://localhost");
    const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
    const resolved = path.normalize(path.join(root, pathname));
    const withinRoot = resolved === root || resolved.startsWith(root + path.sep);
    if (!withinRoot) {
      res.writeHead(403, SECURITY_HEADERS);
      res.end("Forbidden");
      return;
    }
    const ext = path.extname(resolved);
    const contentType = CONTENT_TYPES[ext];
    if (!contentType) {
      res.writeHead(404, SECURITY_HEADERS);
      res.end("Not found");
      return;
    }
    try {
      const data = await readFile(resolved);
      res.writeHead(200, { ...SECURITY_HEADERS, "Content-Type": contentType });
      res.end(data);
    } catch {
      res.writeHead(404, SECURITY_HEADERS);
      res.end("Not found");
    }
  };
}

export function isAllowedHost(host, allowlist) {
  if (!host) return false;
  return allowlist.includes(host.toLowerCase());
}
