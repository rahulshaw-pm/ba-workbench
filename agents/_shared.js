// Internal helpers shared by agent templates. Not part of the public agent contract.

export function lines(text) {
  return String(text || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

export function sentences(text) {
  return String(text || "")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function listItems(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return [];
}

export function bullets(items, { ordered = false } = {}) {
  if (!items.length) return "_None provided._";
  return items.map((item, i) => (ordered ? `${i + 1}. ${item}` : `- ${item}`)).join("\n");
}

export function table(headers, rows) {
  if (!rows.length) return "_No data available._";
  const head = `| ${headers.join(" | ")} |`;
  const sep = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((r) => `| ${r.join(" | ")} |`).join("\n");
  return [head, sep, body].join("\n");
}

export function heading(level, text) {
  return `${"#".repeat(level)} ${text}`;
}

export function domainNote(input) {
  const ctx = String(input?.domainContext || "").trim();
  return ctx ? `> **Domain context:** ${ctx}` : "";
}

export function section(title, body, level = 2) {
  const trimmed = String(body || "").trim();
  return [heading(level, title), trimmed || "_Not specified._"].join("\n\n");
}

export function joinSections(parts) {
  return parts.filter((p) => p != null && String(p).trim() !== "").join("\n\n");
}

export function domainPromptLine(input) {
  const ctx = String(input?.domainContext || "").trim();
  return ctx ? `Domain/industry context: ${ctx}` : "Domain/industry context: not specified — stay domain-agnostic.";
}
