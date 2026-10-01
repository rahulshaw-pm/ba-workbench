import { test } from "node:test";
import assert from "node:assert/strict";
import agentsHandler from "../api/agents.js";
import statusHandler from "../api/status.js";
import presenceHandler from "../api/presence.js";
import runHandler from "../api/agents/[id]/run.js";

function mockRes() {
  const res = {
    headers: {},
    statusCode: null,
    body: null,
    setHeader(key, value) {
      this.headers[key] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
  return res;
}

test("api/agents returns 12 agents and sets security headers", () => {
  const res = mockRes();
  agentsHandler({ method: "GET" }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.agents.length, 12);
  assert.equal(res.headers["X-Content-Type-Options"], "nosniff");
});

test("api/status reports unconfigured by default", () => {
  const res = mockRes();
  statusHandler({ method: "GET" }, res);
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { ai: false, route: "none" });
});

test("api/agents/[id]/run runs a template draft", async () => {
  const res = mockRes();
  const req = {
    method: "POST",
    headers: { "content-type": "application/json" },
    query: { id: "user-story" },
    body: { input: { featureDescription: "Users can reset their password." }, mode: "template" },
  };
  await runHandler(req, res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.mode, "template");
  assert.ok(res.body.output.length > 0);
});

test("api/agents/[id]/run rejects an unknown agent", async () => {
  const res = mockRes();
  const req = {
    method: "POST",
    headers: { "content-type": "application/json" },
    query: { id: "not-a-real-agent" },
    body: { input: {}, mode: "template" },
  };
  await runHandler(req, res);
  assert.equal(res.statusCode, 404);
});

test("api/agents/[id]/run returns 409 for AI mode with no provider configured", async () => {
  const res = mockRes();
  const req = {
    method: "POST",
    headers: { "content-type": "application/json" },
    query: { id: "user-story" },
    body: { input: { featureDescription: "x" }, mode: "ai" },
  };
  await runHandler(req, res);
  assert.equal(res.statusCode, 409);
});

test("api/presence returns an active count", () => {
  const res = mockRes();
  const req = { method: "POST", headers: { "content-type": "application/json" }, body: { sessionId: "vercel-test-1" } };
  presenceHandler(req, res);
  assert.equal(res.statusCode, 200);
  assert.ok(Number.isInteger(res.body.count) && res.body.count >= 1);
});
