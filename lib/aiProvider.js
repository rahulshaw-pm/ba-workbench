export class AiProviderError extends Error {
  constructor(message) {
    super(message);
    this.safeMessage = message;
  }
}

function env(name, fallback) {
  const v = process.env[name];
  return v == null || v === "" ? fallback : v;
}

function currentProvider() {
  return env("AI_PROVIDER", "none").toLowerCase();
}

export function getProviderStatus() {
  const route = currentProvider();
  if (route === "anthropic") {
    return { configured: Boolean(process.env.ANTHROPIC_API_KEY), route };
  }
  if (route === "azure-openai") {
    const configured = Boolean(
      process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_DEPLOYMENT
    );
    return { configured, route };
  }
  if (route === "ollama") {
    return { configured: true, route };
  }
  return { configured: false, route: "none" };
}

async function callAnthropic({ system, prompt }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  const model = env("ANTHROPIC_MODEL", "claude-sonnet-4-5");
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      system,
      messages: [{ role: "user", content: prompt }],
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new AiProviderError(`Anthropic API error (${res.status})`);
  const data = await res.json();
  return data?.content?.[0]?.text ?? "";
}

async function callAzureOpenAi({ system, prompt }) {
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT.replace(/\/$/, "");
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;
  const apiVersion = env("AZURE_OPENAI_API_VERSION", "2024-06-01");
  const res = await fetch(
    `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "api-key": process.env.AZURE_OPENAI_API_KEY },
      body: JSON.stringify({
        messages: [
          { role: "system", content: system },
          { role: "user", content: prompt },
        ],
        max_tokens: 1500,
      }),
      signal: AbortSignal.timeout(30_000),
    }
  );
  if (!res.ok) throw new AiProviderError(`Azure OpenAI error (${res.status})`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? "";
}

async function callOllama({ system, prompt }) {
  const host = env("OLLAMA_HOST", "http://127.0.0.1:11434");
  const model = env("OLLAMA_MODEL", "llama3.1");
  const res = await fetch(`${host.replace(/\/$/, "")}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new AiProviderError(`Ollama error (${res.status})`);
  const data = await res.json();
  return data?.message?.content ?? "";
}

export async function generate({ system, prompt }) {
  const status = getProviderStatus();
  if (!status.configured) throw new AiProviderError("AI provider is not configured");
  try {
    if (status.route === "anthropic") return await callAnthropic({ system, prompt });
    if (status.route === "azure-openai") return await callAzureOpenAi({ system, prompt });
    if (status.route === "ollama") return await callOllama({ system, prompt });
  } catch (err) {
    if (err instanceof AiProviderError) throw err;
    throw new AiProviderError("AI provider request failed");
  }
  throw new AiProviderError("No AI provider configured");
}
