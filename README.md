# BA Workbench

**Status: working prototype, not production.** A showcase of AI agents for Business Analyst / Product Manager work across the SDLC — each agent does exactly **one** activity, every agent always produces an instant deterministic draft, and an optional "Draft with AI" action calls a real LLM when one is configured.

## What this is

Every agent follows the same hybrid model:

- **Instant draft (always available):** a deterministic, template-based generator — zero setup, works fully offline, same every time for the same input.
- **Draft with AI (optional):** calls a pluggable LLM provider (Anthropic Claude, Azure OpenAI, or local Ollama) to generate a richer draft from the same input. The button is disabled with an explanation when no provider is configured.

Agents are domain-agnostic: there's no industry-specific logic anywhere. Every agent has an optional "Domain / industry context" field that gets echoed into its template and AI prompt, so the same 12 agents work for fintech, healthcare, internal tooling, retail, or anything else.

## Agent roster

| Phase | Agent | Does |
|---|---|---|
| Discovery & Analysis | Requirements Elicitation | Raw stakeholder notes → structured requirements list |
| Discovery & Analysis | Stakeholder & RACI | Stakeholder list + key activities → RACI matrix |
| Discovery & Analysis | Business Case | Problem/opportunity → business case (objectives, metrics, cost-benefit) |
| Requirements & Design | User Story | Feature description → INVEST user stories |
| Requirements & Design | Acceptance Criteria | A user story → Given/When/Then AC + edge cases |
| Requirements & Design | Process Flow | Process description → Mermaid flowchart (text) + step table |
| Requirements & Design | Gap & Risk Analysis | Current vs desired state → gap list + risk register |
| Planning | Epic Decomposition | Epic → candidate stories/tasks with rough sizing |
| Planning | Prioritization | Backlog items → MoSCoW + RICE scoring, ranked |
| Planning | Roadmap | Prioritized themes → quarterly roadmap outline |
| Delivery & Closure | Meeting Minutes | Meeting notes/transcript → structured MoM, decisions, action items |
| Delivery & Closure | Release Notes | Completed items → customer-facing release notes + internal changelog |

## Quick start

Requires Node.js 20+. No dependencies to install.

```sh
npm start
```

Open http://localhost:3000.

## Deploying

**Local / Azure App Service style:** `server.js` is a self-contained `node:http` server (`npm start`) — deploy it anywhere that runs a long-lived Node process.

**Vercel (serverless):** the same `agents/` and `lib/` business logic is also exposed through thin serverless functions under `api/` (`api/agents.js`, `api/status.js`, `api/agents/[id]/run.js`), with the static frontend served from `public/`. `vercel.json` pins an explicit `builds`/`routes` config — Vercel's zero-config detection otherwise misidentifies the project and tries to treat `public/app.js` as the whole app, so don't remove it. Deploy with:

```sh
vercel deploy --prod
```

Configure AI drafting on Vercel via Project Settings → Environment Variables, using the same variables listed below.

## Configuring AI drafting

Copy `.env.example` to `.env` and set `AI_PROVIDER` to one of:

- `anthropic` — set `ANTHROPIC_API_KEY` (and optionally `ANTHROPIC_MODEL`)
- `azure-openai` — set `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`
- `ollama` — run [Ollama](https://ollama.com) locally; optionally set `OLLAMA_HOST` / `OLLAMA_MODEL`

`.env` is never committed (see `.gitignore`), and `/api/status` only ever reports `{ ai: boolean, route: string }` — no secrets or env var names are ever returned to the client.

## Security model

Every response carries a strict Content-Security-Policy (`default-src 'self'`, no inline scripts/styles, no external script hosts), `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`, and `Cache-Control: no-store`. The server also enforces a Host/Origin allowlist, requires `Content-Type: application/json` on POST requests, caps request bodies at 100KB, and rejects any input containing a `[restricted]` classification marker before it reaches a template or an AI provider. The app is stateless — nothing is persisted server-side, and there is no authentication, so it's intended for local or trusted use, not multi-tenant production.

## API reference

- `GET /api/agents` → `{ agents: [...], phases: [...] }` — registry metadata only, no code.
- `POST /api/agents/:id/run` body `{ input: {...}, mode: "template" | "ai" }` → `{ output, mode, route? }`.
- `GET /api/status` → `{ ai: boolean, route: string }`.

## Adding a new agent

1. Create `agents/<id>.js` exporting `{ id, name, phase, description, inputSchema, run(input), buildPrompt(input) }`.
2. Import it and add it to the `AGENTS` array in `agents/registry.js`.

That's it — the API, dynamic form rendering, and tests are all schema-driven.

## Testing

```sh
npm test
```

Covers agent registry integrity (every agent's contract, a sample draft per agent), server behavior (validation, security headers, host/origin checks, body limits, restricted-content rejection, static file serving), and AI provider status resolution.

## Project status

Working prototype for demoing the agent pattern — not a production BA/PM tool. No persistence, no auth, no multi-user support.
