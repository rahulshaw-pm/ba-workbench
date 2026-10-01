export class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.status = 400;
  }
}

export function validateInputAgainstSchema(schema, input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ValidationError("Input must be an object");
  }
  for (const field of schema) {
    const value = input[field.key];
    if (field.type === "list" && value != null && !Array.isArray(value)) {
      throw new ValidationError(`Field "${field.label}" must be a list of values`);
    }
    if (!field.required) continue;
    if (field.type === "list") {
      const items = Array.isArray(value) ? value.filter((v) => String(v ?? "").trim()) : [];
      if (items.length === 0) throw new ValidationError(`Field "${field.label}" is required`);
    } else if (value == null || String(value).trim() === "") {
      throw new ValidationError(`Field "${field.label}" is required`);
    }
  }
}

const RESTRICTED_MARKERS = ["[restricted]", "classification: restricted"];

export function rejectRestrictedContent(input) {
  const texts = [];
  for (const value of Object.values(input || {})) {
    if (typeof value === "string") texts.push(value);
    else if (Array.isArray(value)) {
      for (const v of value) if (typeof v === "string") texts.push(v);
    }
  }
  const lower = texts.join("\n").toLowerCase();
  if (RESTRICTED_MARKERS.some((marker) => lower.includes(marker))) {
    throw new ValidationError("Restricted content is not permitted");
  }
}
