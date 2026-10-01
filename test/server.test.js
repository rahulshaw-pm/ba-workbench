import { test, before, after } from "node:test";
import assert from "node:assert/strict";

process.env.NODE_ENV = "test";
process.env.PORT = "4173";
process.env.AI_PROVIDER = "none";

const BASE = "http://127.0.0.1:4173";

let server;

before(async () => {
  ({ default: server } = await import("../server.js"));
  await new Promise((resolve) => server.listen(4173, resolve));
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

function assertSecurityHeaders(headers) {
  assert.equal(headers.get("x-content-type-options"), "nosniff");
  assert.equal(headers.get("referrer-policy"), "no-referrer");
  assert.equal(headers.get("cache-control"), "no-store");
  assert.ok(headers.get("content-security-policy")?.includes("default-src 'self'"));
}

test("GET /api/agents returns 12 agents with no function leakage", async () => {
  const res = await fetch(`${BASE}/api/agents`);
  assert.equal(res.status, 200);
  assertSecurityHeaders(res.headers);
  const data = await res.json();
  assert.equal(data.agents.length, 12);
  for (const agent of data.agents) {
    assert.equal(agent.run, undefined);
    assert.equal(agent.buildPrompt, undefined);
  }
});

test("GET /api/status reports ai: false when no provider is configured", async () => {
  const res = await fetch(`${BASE}/api/status`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.deepEqual(data, { ai: false, route: "none" });
});

test("POST /api/agents/:id/run (template mode) returns a draft", async () => {
  const res = await fetch(`${BASE}/api/agents/user-story/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { featureDescription: "Users can reset their password.", persona: "user", businessGoal: "I regain access" },
      mode: "template",
    }),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.mode, "template");
  assert.ok(data.output.length > 0);
});

test("POST /api/agents/:id/run with a missing required field returns 400", async () => {
  const res = await fetch(`${BASE}/api/agents/user-story/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: {}, mode: "template" }),
  });
  assert.equal(res.status, 400);
});

test("POST with mode: ai returns 409 when no AI provider is configured", async () => {
  const res = await fetch(`${BASE}/api/agents/user-story/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { featureDescription: "Users can reset their password." },
      mode: "ai",
    }),
  });
  assert.equal(res.status, 409);
});

test("POST with restricted content marker is rejected", async () => {
  const res = await fetch(`${BASE}/api/agents/user-story/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { featureDescription: "[restricted] internal plan" },
      mode: "template",
    }),
  });
  assert.equal(res.status, 400);
});

test("POST without application/json content type returns 415", async () => {
  const res = await fetch(`${BASE}/api/agents/user-story/run`, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: "not json",
  });
  assert.equal(res.status, 415);
});

test("POST with an oversized body returns 413", async () => {
  const huge = "x".repeat(150_000);
  const res = await fetch(`${BASE}/api/agents/user-story/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ input: { featureDescription: huge }, mode: "template" }),
  });
  assert.equal(res.status, 413);
});

test("cross-origin requests are rejected", async () => {
  const res = await fetch(`${BASE}/api/agents/user-story/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: "http://evil.example" },
    body: JSON.stringify({ input: { featureDescription: "x" }, mode: "template" }),
  });
  assert.equal(res.status, 403);
});

test("POST /api/presence returns an active count", async () => {
  const res = await fetch(`${BASE}/api/presence`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId: "test-session-1" }),
  });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.ok(Number.isInteger(data.count) && data.count >= 1);
});

test("static file serving returns index.html at /", async () => {
  const res = await fetch(`${BASE}/`);
  assert.equal(res.status, 200);
  assert.ok(res.headers.get("content-type").startsWith("text/html"));
});

test("path traversal attempts do not leak files outside public/", async () => {
  const res = await fetch(`${BASE}/../package.json`);
  const body = await res.text();
  assert.notEqual(res.status, 200);
  assert.ok(!body.includes('"name": "ba-workbench"'));
});
