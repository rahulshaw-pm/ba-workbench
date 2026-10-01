import { test } from "node:test";
import assert from "node:assert/strict";
import { heartbeat } from "../lib/presence.js";

test("heartbeat counts distinct sessions and dedups repeats", () => {
  const before = heartbeat("presence-test-a");
  const afterSecond = heartbeat("presence-test-b");
  assert.equal(afterSecond, before + 1);
  const afterRepeat = heartbeat("presence-test-a");
  assert.equal(afterRepeat, afterSecond);
});

test("heartbeat ignores invalid session ids without throwing", () => {
  assert.equal(typeof heartbeat(undefined), "number");
  assert.equal(typeof heartbeat(123), "number");
  assert.equal(typeof heartbeat(""), "number");
  assert.equal(typeof heartbeat("x".repeat(500)), "number");
});
