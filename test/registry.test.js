import { test } from "node:test";
import assert from "node:assert/strict";
import { AGENTS, PHASES } from "../agents/registry.js";
import { SAMPLE_INPUTS } from "./fixtures/sampleInputs.js";

const KEBAB_CASE = /^[a-z]+(-[a-z0-9]+)*$/;
const VALID_TYPES = new Set(["text", "textarea", "select", "list"]);

test("every agent has the required contract fields", () => {
  for (const agent of AGENTS) {
    assert.equal(typeof agent.id, "string", `${agent.id}: id`);
    assert.match(agent.id, KEBAB_CASE, `${agent.id}: id must be kebab-case`);
    assert.equal(typeof agent.name, "string", `${agent.id}: name`);
    assert.equal(typeof agent.description, "string", `${agent.id}: description`);
    assert.ok(agent.description.length > 0, `${agent.id}: description non-empty`);
    assert.ok(Array.isArray(agent.inputSchema) && agent.inputSchema.length > 0, `${agent.id}: inputSchema`);
    assert.equal(typeof agent.run, "function", `${agent.id}: run()`);
    assert.equal(typeof agent.buildPrompt, "function", `${agent.id}: buildPrompt()`);
  }
});

test("agent ids are unique", () => {
  const ids = AGENTS.map((a) => a.id);
  assert.equal(new Set(ids).size, ids.length);
});

test("every agent phase is a known phase", () => {
  const phaseIds = new Set(PHASES.map((p) => p.id));
  for (const agent of AGENTS) {
    assert.ok(phaseIds.has(agent.phase), `${agent.id}: unknown phase "${agent.phase}"`);
  }
});

test("every input schema field is well-formed and includes domainContext", () => {
  for (const agent of AGENTS) {
    const keys = new Set();
    for (const field of agent.inputSchema) {
      assert.equal(typeof field.key, "string", `${agent.id}: field.key`);
      assert.equal(typeof field.label, "string", `${agent.id}: field.label`);
      assert.ok(VALID_TYPES.has(field.type), `${agent.id}: field "${field.key}" has invalid type`);
      if (field.type === "select") {
        assert.ok(Array.isArray(field.options) && field.options.length > 0, `${agent.id}: select field needs options`);
      }
      keys.add(field.key);
    }
    assert.ok(keys.has("domainContext"), `${agent.id}: missing shared domainContext field`);
  }
});

test("run() produces a non-empty, structured Markdown draft for a sample input", () => {
  for (const agent of AGENTS) {
    const sample = SAMPLE_INPUTS[agent.id];
    assert.ok(sample, `${agent.id}: missing fixture`);
    const output = agent.run(sample);
    assert.equal(typeof output, "string", `${agent.id}: run() must return a string`);
    assert.ok(output.trim().length > 40, `${agent.id}: run() output too short`);
    assert.match(output, /[#\-|]/, `${agent.id}: run() output should contain Markdown structure`);
  }
});

test("buildPrompt() returns a system/prompt pair that echoes domain context", () => {
  for (const agent of AGENTS) {
    const sample = SAMPLE_INPUTS[agent.id];
    const { system, prompt } = agent.buildPrompt(sample);
    assert.ok(system && system.trim().length > 0, `${agent.id}: buildPrompt() system`);
    assert.ok(prompt && prompt.trim().length > 0, `${agent.id}: buildPrompt() prompt`);
    if (sample.domainContext) {
      assert.ok(prompt.includes(sample.domainContext), `${agent.id}: prompt should echo domainContext`);
    }
  }
});
