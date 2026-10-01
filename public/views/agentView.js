import { fetchJson } from "../lib/api.js";
import { renderMarkdown } from "../lib/markdown.js";

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === "text") node.textContent = value;
    else node.setAttribute(key, value);
  }
  for (const child of children) node.appendChild(child);
  return node;
}

function renderField(field) {
  const wrap = el("div", { class: "field" });
  wrap.appendChild(el("label", { for: `f-${field.key}`, text: field.label + (field.required ? " *" : "") }));

  if (field.type === "textarea") {
    const ta = el("textarea", { id: `f-${field.key}`, rows: String(field.rows || 4) });
    if (field.placeholder) ta.setAttribute("placeholder", field.placeholder);
    wrap.appendChild(ta);
  } else if (field.type === "select") {
    const select = el("select", { id: `f-${field.key}` });
    for (const opt of field.options || []) select.appendChild(el("option", { value: opt, text: opt }));
    wrap.appendChild(select);
  } else if (field.type === "list") {
    const listWrap = el("div", { class: "list-field", id: `f-${field.key}` });
    const rows = el("div", { class: "list-rows" });
    function addRow(value = "") {
      const row = el("div", { class: "list-row" });
      const input = el("input", { type: "text" });
      if (field.itemPlaceholder) input.setAttribute("placeholder", field.itemPlaceholder);
      input.value = value;
      const remove = el("button", { type: "button", class: "btn-remove", text: "−" });
      remove.addEventListener("click", () => {
        row.remove();
        if (!rows.children.length) addRow();
      });
      row.appendChild(input);
      row.appendChild(remove);
      rows.appendChild(row);
    }
    const addBtn = el("button", { type: "button", class: "btn-add", text: "+ Add" });
    addBtn.addEventListener("click", () => addRow());
    addRow();
    listWrap.appendChild(rows);
    listWrap.appendChild(addBtn);
    wrap.appendChild(listWrap);
  } else {
    const input = el("input", { id: `f-${field.key}`, type: "text" });
    if (field.placeholder) input.setAttribute("placeholder", field.placeholder);
    wrap.appendChild(input);
  }

  if (field.help) wrap.appendChild(el("p", { class: "field-help", text: field.help }));
  return wrap;
}

function collectInput(schema, form) {
  const input = {};
  for (const field of schema) {
    if (field.type === "list") {
      const rows = form.querySelectorAll(`#f-${field.key} .list-row input`);
      input[field.key] = Array.from(rows)
        .map((r) => r.value.trim())
        .filter(Boolean);
    } else {
      const node = form.querySelector(`#f-${field.key}`);
      input[field.key] = node ? node.value : "";
    }
  }
  return input;
}

export function renderAgentView(root, agent, status) {
  root.innerHTML = "";

  const header = el("header", { class: "agent-header" });
  const back = el("a", { href: "#/", class: "back-link", text: "← All agents" });
  header.appendChild(back);
  header.appendChild(el("h1", { text: agent.name }));
  header.appendChild(el("p", { class: "agent-desc", text: agent.description }));
  root.appendChild(header);

  const layout = el("div", { class: "agent-layout" });
  const form = el("form", { class: "agent-form" });
  for (const field of agent.inputSchema) form.appendChild(renderField(field));

  const actions = el("div", { class: "actions" });
  const templateBtn = el("button", { type: "submit", class: "btn btn-primary", text: "Generate (Template)" });
  const aiBtn = el("button", { type: "button", class: "btn btn-secondary", text: "Draft with AI" });
  if (!status.ai) {
    aiBtn.setAttribute("disabled", "disabled");
    aiBtn.setAttribute("title", "AI drafting is not configured on this server.");
  }
  actions.appendChild(templateBtn);
  actions.appendChild(aiBtn);
  if (!status.ai) actions.appendChild(el("span", { class: "ai-hint", text: "AI drafting not configured — set AI_PROVIDER to enable." }));
  form.appendChild(actions);
  layout.appendChild(form);

  const outputPanel = el("div", { class: "output-panel" });
  const outputHeader = el("div", { class: "output-header" });
  outputHeader.appendChild(el("h2", { text: "Output" }));
  const outputActions = el("div", { class: "output-actions" });
  const copyBtn = el("button", { type: "button", class: "btn btn-ghost", text: "Copy" });
  const downloadBtn = el("button", { type: "button", class: "btn btn-ghost", text: "Download .md" });
  copyBtn.setAttribute("disabled", "disabled");
  downloadBtn.setAttribute("disabled", "disabled");
  outputActions.appendChild(copyBtn);
  outputActions.appendChild(downloadBtn);
  outputHeader.appendChild(outputActions);
  outputPanel.appendChild(outputHeader);
  const outputBody = el("div", { class: "output-body" });
  outputBody.appendChild(el("p", { class: "output-empty", text: "Fill in the form and generate a draft." }));
  outputPanel.appendChild(outputBody);
  layout.appendChild(outputPanel);

  root.appendChild(layout);

  let rawOutput = "";

  function setOutput(markdown) {
    rawOutput = markdown;
    outputBody.innerHTML = renderMarkdown(markdown);
    copyBtn.removeAttribute("disabled");
    downloadBtn.removeAttribute("disabled");
  }

  function setBusy(busy) {
    templateBtn.disabled = busy;
    aiBtn.disabled = busy || !status.ai;
  }

  function setError(message) {
    outputBody.innerHTML = "";
    outputBody.appendChild(el("p", { class: "output-error", text: message }));
  }

  async function run(mode) {
    const input = collectInput(agent.inputSchema, form);
    setBusy(true);
    outputBody.innerHTML = "";
    outputBody.appendChild(el("p", { class: "output-loading", text: mode === "ai" ? "Drafting with AI…" : "Generating…" }));
    try {
      const data = await fetchJson(`/api/agents/${agent.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input, mode }),
      });
      setOutput(data.output);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    run("template");
  });
  aiBtn.addEventListener("click", () => run("ai"));

  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(rawOutput);
      copyBtn.textContent = "Copied!";
      setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
    } catch {
      // clipboard unavailable; ignore
    }
  });

  downloadBtn.addEventListener("click", () => {
    const blob = new Blob([rawOutput], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = el("a", { href: url, download: `${agent.id}.md` });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}
