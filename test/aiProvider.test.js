import { test } from "node:test";
import assert from "node:assert/strict";

function withEnv(vars, fn) {
  const keys = [
    "AI_PROVIDER",
    "ANTHROPIC_API_KEY",
    "AZURE_OPENAI_ENDPOINT",
    "AZURE_OPENAI_API_KEY",
    "AZURE_OPENAI_DEPLOYMENT",
  ];
  const saved = Object.fromEntries(keys.map((k) => [k, process.env[k]]));
  for (const k of keys) delete process.env[k];
  Object.assign(process.env, vars);
  try {
    return fn();
  } finally {
    for (const k of keys) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  }
}

test("defaults to unconfigured 'none' provider", async () => {
  const { getProviderStatus } = await import("../lib/aiProvider.js");
  withEnv({}, () => {
    assert.deepEqual(getProviderStatus(), { configured: false, route: "none" });
  });
});

test("anthropic provider is unconfigured without an API key", async () => {
  const { getProviderStatus } = await import("../lib/aiProvider.js");
  withEnv({ AI_PROVIDER: "anthropic" }, () => {
    assert.deepEqual(getProviderStatus(), { configured: false, route: "anthropic" });
  });
});

test("anthropic provider is configured once an API key is present", async () => {
  const { getProviderStatus } = await import("../lib/aiProvider.js");
  withEnv({ AI_PROVIDER: "anthropic", ANTHROPIC_API_KEY: "sk-test" }, () => {
    assert.deepEqual(getProviderStatus(), { configured: true, route: "anthropic" });
  });
});

test("azure-openai provider requires endpoint, key, and deployment", async () => {
  const { getProviderStatus } = await import("../lib/aiProvider.js");
  withEnv({ AI_PROVIDER: "azure-openai", AZURE_OPENAI_ENDPOINT: "https://x" }, () => {
    assert.equal(getProviderStatus().configured, false);
  });
  withEnv(
    {
      AI_PROVIDER: "azure-openai",
      AZURE_OPENAI_ENDPOINT: "https://x",
      AZURE_OPENAI_API_KEY: "key",
      AZURE_OPENAI_DEPLOYMENT: "gpt",
    },
    () => {
      assert.deepEqual(getProviderStatus(), { configured: true, route: "azure-openai" });
    }
  );
});

test("ollama provider is considered configured by default (local, no key needed)", async () => {
  const { getProviderStatus } = await import("../lib/aiProvider.js");
  withEnv({ AI_PROVIDER: "ollama" }, () => {
    assert.deepEqual(getProviderStatus(), { configured: true, route: "ollama" });
  });
});
