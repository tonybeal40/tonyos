const el = (id) => document.getElementById(id);

const statusEl = el("status");
const runBtn = el("runBtn");
const openTabBtn = el("openTabBtn");
const homeBtn = el("homeBtn");

// Home button - navigate to TonyOS
homeBtn.addEventListener("click", () => {
  const currentUrl = window.location.href;
  const tonyosUrl = currentUrl.replace(/:5000/, ':3001').replace(/\/[^/]*$/, '/');
  window.location.href = tonyosUrl;
});

const loginBtn = el("loginBtn");
const logoutBtn = el("logoutBtn");
const userInfo = el("userInfo");
const userAvatar = el("userAvatar");
const userNameEl = el("userName");

async function checkAuth() {
  try {
    const res = await fetch("/api/auth/user");
    const user = await res.json();
    if (user && user.id) {
      userInfo.classList.remove("hidden");
      loginBtn.classList.add("hidden");
      userNameEl.textContent = user.name || "User";
      if (user.profileImage) {
        userAvatar.src = user.profileImage;
        userAvatar.style.display = "block";
      } else {
        userAvatar.style.display = "none";
      }
    } else {
      userInfo.classList.add("hidden");
      loginBtn.classList.remove("hidden");
    }
  } catch (e) {
    console.error("Auth check failed:", e);
    userInfo.classList.add("hidden");
    loginBtn.classList.remove("hidden");
  }
}

loginBtn.addEventListener("click", () => {
  window.location.href = "/api/login";
});

logoutBtn.addEventListener("click", () => {
  window.location.href = "/api/logout";
});

const aiDebugBtn = el("aiDebugBtn");
const aiImproveBtn = el("aiImproveBtn");
const aiBuildBtn = el("aiBuildBtn");
const aiExplainBtn = el("aiExplainBtn");

const undoBtn = el("undoBtn");

const newProjectBtn = el("newProjectBtn");
const saveProjectBtn = el("saveProjectBtn");
const loadProjectBtn = el("loadProjectBtn");

const templateSelect = el("templateSelect");
const providerSelect = el("providerSelect");
const modelSelect = el("modelSelect");

const zipBtn = el("zipBtn");
const copyBtn = el("copyBtn");

const sendPrompt = el("sendPrompt");
const promptEl = el("prompt");
const aiOut = el("aiOut");
const aiMeta = el("aiMeta");

const errOut = el("errOut");
const clearErrorsBtn = el("clearErrorsBtn");
const fixErrorBtn = el("fixErrorBtn");

const clearHistoryBtn = el("clearHistoryBtn");
const historyList = el("historyList");

const preview = el("preview");
const tabs = Array.from(document.querySelectorAll(".tab"));

const modal = el("modal");
const modalTitle = el("modalTitle");
const modalBody = el("modalBody");
const closeModalBtn = el("closeModalBtn");

const editors = {
  html: el("html"),
  css: el("css"),
  js: el("js")
};

const LS = {
  lastProjectId: "codebench:lastProjectId",
  projectsIndex: "codebench:projectsIndex",
  promptHistory: "codebench:promptHistory",
  lastMode: "codebench:lastMode",
  lastTemplate: "codebench:lastTemplate",
  lastProvider: "codebench:lastProvider",
  lastModel: "codebench:lastModel"
};

let availableModels = {};

async function loadModels() {
  try {
    const res = await fetch("/api/models");
    const data = await res.json();
    availableModels = data.models || {};
    
    providerSelect.innerHTML = "";
    const providers = Object.keys(availableModels);
    if (!providers.length) {
      providerSelect.innerHTML = '<option value="">No providers</option>';
      modelSelect.innerHTML = '<option value="">No models</option>';
      return;
    }
    
    const providerLabels = { openai: "OpenAI", claude: "Claude", gemini: "Gemini" };
    for (const p of providers) {
      const opt = document.createElement("option");
      opt.value = p;
      opt.textContent = providerLabels[p] || p;
      providerSelect.appendChild(opt);
    }
    
    const savedProvider = localStorage.getItem(LS.lastProvider);
    if (savedProvider && providers.includes(savedProvider)) {
      providerSelect.value = savedProvider;
    }
    
    updateModelSelect();
  } catch (e) {
    console.error("Failed to load models:", e);
  }
}

function updateModelSelect() {
  const provider = providerSelect.value;
  const models = availableModels[provider] || {};
  modelSelect.innerHTML = "";
  
  for (const [id, label] of Object.entries(models)) {
    const opt = document.createElement("option");
    opt.value = id;
    opt.textContent = label;
    modelSelect.appendChild(opt);
  }
  
  const savedModel = localStorage.getItem(LS.lastModel);
  if (savedModel && models[savedModel]) {
    modelSelect.value = savedModel;
  }
  
  localStorage.setItem(LS.lastProvider, provider);
}

providerSelect.addEventListener("change", () => {
  updateModelSelect();
});

modelSelect.addEventListener("change", () => {
  localStorage.setItem(LS.lastModel, modelSelect.value);
});

const MAX_SNAPSHOTS = 5;
const MAX_HISTORY = 10;

let snapshots = [];
let lastErrorText = "";
let currentMode = localStorage.getItem(LS.lastMode) || "improve";

function nowIso() {
  return new Date().toISOString();
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

function switchTab(tabName) {
  tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === tabName));
  Object.entries(editors).forEach(([k, area]) => {
    area.classList.toggle("active", k === tabName);
  });
}

tabs.forEach(t => t.addEventListener("click", () => switchTab(t.dataset.tab)));

function snapshotPush(reason = "snapshot") {
  const snap = {
    t: Date.now(),
    reason,
    html: editors.html.value || "",
    css: editors.css.value || "",
    js: editors.js.value || ""
  };
  snapshots.unshift(snap);
  snapshots = snapshots.slice(0, MAX_SNAPSHOTS);
  undoBtn.disabled = snapshots.length === 0;
}

function snapshotPop() {
  const snap = snapshots.shift();
  undoBtn.disabled = snapshots.length === 0;
  return snap || null;
}

undoBtn.addEventListener("click", () => {
  const snap = snapshotPop();
  if (!snap) return;
  editors.html.value = snap.html;
  editors.css.value = snap.css;
  editors.js.value = snap.js;
  aiOut.textContent = `Undid: ${snap.reason}`;
  run();
});

function buildDoc(html, css, js) {
  const injector = `
<script>
(function(){
  function send(type, payload){
    try {
      parent.postMessage({ __codebench: true, type: type, payload: payload }, "*");
    } catch (e) {}
  }

  window.addEventListener("error", function(ev){
    var msg = (ev && ev.message) ? ev.message : "Unknown error";
    var src = (ev && ev.filename) ? ev.filename : "";
    var line = (ev && ev.lineno) ? ev.lineno : "";
    var col = (ev && ev.colno) ? ev.colno : "";
    send("runtime_error", { message: msg, src: src, line: line, col: col });
  });

  window.addEventListener("unhandledrejection", function(ev){
    var msg = (ev && ev.reason) ? (ev.reason.message || String(ev.reason)) : "Unhandled rejection";
    send("runtime_error", { message: msg, src: "", line: "", col: "" });
  });

  var origErr = console.error;
  console.error = function(){
    try {
      var args = Array.prototype.slice.call(arguments).map(function(a){
        try { return typeof a === "string" ? a : JSON.stringify(a); } catch { return String(a); }
      }).join(" ");
      send("console_error", { message: args });
    } catch (e) {}
    origErr.apply(console, arguments);
  };
})();
<\/script>`;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>${css || ""}</style>
</head>
<body>
${html || ""}
${injector}
<script>
try {
${js || ""}
} catch (e) {
  console.error(e);
  document.body.insertAdjacentHTML("afterbegin",
    "<pre style='color:#b00020;white-space:pre-wrap;'>JS Error: " + (e && e.message ? e.message : e) + "</pre>"
  );
}
<\/script>
</body>
</html>`;
}

function run() {
  setStatus("Running");
  const doc = buildDoc(editors.html.value, editors.css.value, editors.js.value);
  preview.srcdoc = doc;
  setTimeout(() => setStatus("Idle"), 250);
}

runBtn.addEventListener("click", run);

openTabBtn.addEventListener("click", () => {
  const doc = buildDoc(editors.html.value, editors.css.value, editors.js.value);
  const blob = new Blob([doc], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 15000);
});

function setErrorText(txt) {
  lastErrorText = txt || "";
  errOut.textContent = lastErrorText ? lastErrorText : "No errors";
  fixErrorBtn.disabled = !lastErrorText;
}

clearErrorsBtn.addEventListener("click", () => setErrorText(""));

window.addEventListener("message", (ev) => {
  const data = ev.data;
  if (!data || data.__codebench !== true) return;

  if (data.type === "runtime_error") {
    const p = data.payload || {};
    const msg = `Runtime error: ${p.message || "Unknown"}\n${p.src ? "Source: " + p.src : ""}${p.line ? "\nLine: " + p.line + " Col: " + p.col : ""}`.trim();
    setErrorText(msg);
  }

  if (data.type === "console_error") {
    const p = data.payload || {};
    const msg = `Console error: ${p.message || "Unknown"}`.trim();
    setErrorText(msg);
  }
});

function loadHistory() {
  try {
    const raw = localStorage.getItem(LS.promptHistory);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function saveHistory(items) {
  localStorage.setItem(LS.promptHistory, JSON.stringify(items.slice(0, MAX_HISTORY)));
}

function renderHistory() {
  const items = loadHistory();
  historyList.innerHTML = "";
  if (!items.length) {
    historyList.innerHTML = `<div class="projMeta">No history yet</div>`;
    return;
  }

  for (const it of items) {
    const row = document.createElement("div");
    row.className = "histItem";

    const left = document.createElement("div");
    left.className = "histLeft";
    left.innerHTML = `<span class="histMode">${it.mode || "improve"}</span><span class="histText" title="${escapeHtml(it.prompt || "")}">${escapeHtml(it.prompt || "")}</span>`;

    const right = document.createElement("div");
    right.className = "histRight";
    right.textContent = new Date(it.t).toLocaleTimeString();

    row.appendChild(left);
    row.appendChild(right);
    row.addEventListener("click", () => {
      promptEl.value = it.prompt || "";
      currentMode = it.mode || "improve";
      localStorage.setItem(LS.lastMode, currentMode);
      aiMeta.textContent = `Mode: ${currentMode}`;
    });

    historyList.appendChild(row);
  }
}

clearHistoryBtn.addEventListener("click", () => {
  saveHistory([]);
  renderHistory();
});

function escapeHtml(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function callAI(prompt, mode) {
  setStatus("AI working");
  const providerLabel = providerSelect.options[providerSelect.selectedIndex]?.textContent || providerSelect.value;
  const modelLabel = modelSelect.options[modelSelect.selectedIndex]?.textContent || modelSelect.value;
  aiMeta.textContent = `${providerLabel} / ${modelLabel} / ${mode}`;
  aiOut.textContent = "Thinking...";
  currentMode = mode;
  localStorage.setItem(LS.lastMode, currentMode);

  const history = loadHistory();
  history.unshift({ t: Date.now(), mode, prompt });
  saveHistory(history);
  renderHistory();

  try {
    snapshotPush(`AI ${mode}`);

    const provider = providerSelect.value || "openai";
    const model = modelSelect.value || "";
    
    const payload = {
      prompt,
      mode,
      provider,
      model,
      html: editors.html.value || "",
      css: editors.css.value || "",
      js: editors.js.value || ""
    };

    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || "AI request failed");

    if (typeof data.html === "string") editors.html.value = data.html;
    if (typeof data.css === "string") editors.css.value = data.css;
    if (typeof data.js === "string") editors.js.value = data.js;

    aiOut.textContent = data.notes || "Updated your code";
    setErrorText("");
    run();
  } catch (e) {
    aiOut.textContent = "Error: " + (e?.message || e);
  } finally {
    setStatus("Idle");
  }
}

aiDebugBtn.addEventListener("click", () => {
  const p = promptEl.value.trim() || "Debug and fix issues. Make it run with no errors.";
  callAI(p, "debug");
});

aiImproveBtn.addEventListener("click", () => {
  const p = promptEl.value.trim() || "Improve UI, clarity, and reliability without breaking behavior.";
  callAI(p, "improve");
});

aiBuildBtn.addEventListener("click", () => {
  const p = promptEl.value.trim() || "Build something useful from scratch with clean UI.";
  callAI(p, "build");
});

aiExplainBtn.addEventListener("click", async () => {
  const p = promptEl.value.trim() || "Explain what this code does in plain language. Include key parts and how to extend it.";
  await callAI(p, "explain");
});

sendPrompt.addEventListener("click", () => {
  const p = promptEl.value.trim();
  if (!p) {
    aiOut.textContent = "Type a prompt first";
    return;
  }
  callAI(p, currentMode || "improve");
});

promptEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendPrompt.click();
  }
});

fixErrorBtn.addEventListener("click", () => {
  if (!lastErrorText) return;
  const p = `Fix this error. Here is the error:\n\n${lastErrorText}\n\nMake the code run clean.`;
  callAI(p, "debug");
});

function getProjectsIndex() {
  try {
    const raw = localStorage.getItem(LS.projectsIndex);
    const idx = raw ? JSON.parse(raw) : [];
    return Array.isArray(idx) ? idx : [];
  } catch {
    return [];
  }
}

function setProjectsIndex(idx) {
  localStorage.setItem(LS.projectsIndex, JSON.stringify(idx));
}

function projectKey(id) {
  return `codebench:project:${id}`;
}

function openModal(title, html) {
  modalTitle.textContent = title;
  modalBody.innerHTML = html;
  modal.classList.remove("hidden");
}

function closeModal() {
  modal.classList.add("hidden");
  modalBody.innerHTML = "";
}

closeModalBtn.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});

function saveProjectFlow() {
  const idx = getProjectsIndex();
  const lastId = localStorage.getItem(LS.lastProjectId);
  const existing = lastId ? idx.find(p => p.id === lastId) : null;

  openModal("Save project", `
    <div class="projRow">
      <div>
        <div class="projName">Project name</div>
        <div class="projMeta">Choose a name. We save HTML, CSS, JS.</div>
      </div>
    </div>
    <div style="display:flex;gap:10px;align-items:center;">
      <input id="projNameInput" style="flex:1" class="select" placeholder="My project" value="${escapeHtml(existing?.name || "")}" />
      <button class="btn" id="confirmSaveBtn">Save</button>
    </div>
  `);

  setTimeout(() => {
    const input = document.getElementById("projNameInput");
    const btn = document.getElementById("confirmSaveBtn");
    btn.addEventListener("click", () => {
      const name = (input.value || "").trim() || "Untitled";
      const id = existing?.id || `p_${Date.now()}`;
      const payload = { id, name, updatedAt: nowIso(), html: editors.html.value || "", css: editors.css.value || "", js: editors.js.value || "" };

      localStorage.setItem(projectKey(id), JSON.stringify(payload));
      localStorage.setItem(LS.lastProjectId, id);

      const nextIdx = idx.filter(p => p.id !== id);
      nextIdx.unshift({ id, name, updatedAt: payload.updatedAt });
      setProjectsIndex(nextIdx);

      aiOut.textContent = `Saved project: ${name}`;
      closeModal();
    });
  }, 0);
}

function loadProjectFlow() {
  const idx = getProjectsIndex();
  if (!idx.length) {
    openModal("Load project", `<div class="projMeta">No saved projects yet</div>`);
    return;
  }

  const rows = idx.map(p => `
    <div class="projRow">
      <div>
        <div class="projName">${escapeHtml(p.name || "Untitled")}</div>
        <div class="projMeta">Updated: ${escapeHtml(p.updatedAt || "")}</div>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="btn small" data-load="${escapeHtml(p.id)}">Load</button>
        <button class="btn small" data-del="${escapeHtml(p.id)}">Delete</button>
      </div>
    </div>
  `).join("");

  openModal("Load project", rows);

  setTimeout(() => {
    modalBody.querySelectorAll("[data-load]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-load");
        const raw = localStorage.getItem(projectKey(id));
        if (!raw) return;
        const p = JSON.parse(raw);
        editors.html.value = p.html || "";
        editors.css.value = p.css || "";
        editors.js.value = p.js || "";
        localStorage.setItem(LS.lastProjectId, id);
        aiOut.textContent = `Loaded project: ${p.name || "Untitled"}`;
        setErrorText("");
        run();
        closeModal();
      });
    });

    modalBody.querySelectorAll("[data-del]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-del");
        localStorage.removeItem(projectKey(id));
        const nextIdx = getProjectsIndex().filter(p => p.id !== id);
        setProjectsIndex(nextIdx);
        if (localStorage.getItem(LS.lastProjectId) === id) localStorage.removeItem(LS.lastProjectId);
        loadProjectFlow();
      });
    });
  }, 0);
}

function newProjectFlow() {
  snapshotPush("New project");
  editors.html.value = "";
  editors.css.value = "";
  editors.js.value = "";
  setErrorText("");
  aiOut.textContent = "New project started";
  localStorage.removeItem(LS.lastProjectId);
  run();
}

newProjectBtn.addEventListener("click", newProjectFlow);
saveProjectBtn.addEventListener("click", saveProjectFlow);
loadProjectBtn.addEventListener("click", loadProjectFlow);

function tryAutoLoadLastProject() {
  const id = localStorage.getItem(LS.lastProjectId);
  if (!id) return false;
  const raw = localStorage.getItem(projectKey(id));
  if (!raw) return false;
  try {
    const p = JSON.parse(raw);
    editors.html.value = p.html || "";
    editors.css.value = p.css || "";
    editors.js.value = p.js || "";
    aiOut.textContent = `Auto loaded: ${p.name || "Untitled"}`;
    return true;
  } catch {
    return false;
  }
}

function downloadZip() {
  if (!window.JSZip) {
    aiOut.textContent = "JSZip not loaded. Refresh the page.";
    return;
  }

  const zip = new JSZip();
  zip.file("index.html", buildDoc(editors.html.value, editors.css.value, editors.js.value));
  zip.file("style.css", editors.css.value || "");
  zip.file("app.js", editors.js.value || "");

  zip.generateAsync({ type: "blob" }).then((blob) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "codebench-export.zip";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 15000);
    aiOut.textContent = "Downloaded ZIP";
  });
}

zipBtn.addEventListener("click", downloadZip);

copyBtn.addEventListener("click", async () => {
  const payload =
`index.html
${buildDoc(editors.html.value, editors.css.value, editors.js.value)}

style.css
${editors.css.value || ""}

app.js
${editors.js.value || ""}`.trim();

  try {
    await navigator.clipboard.writeText(payload);
    aiOut.textContent = "Copied all files to clipboard";
  } catch {
    aiOut.textContent = "Clipboard blocked. Try HTTPS or allow permissions.";
  }
});

const templates = {
  todo: {
    html: `<div class="wrap">
  <h1>Todo</h1>
  <p class="sub">LocalStorage, search, clean UI</p>
  <div class="row">
    <input id="todoInput" placeholder="Add a task" />
    <button id="addBtn">Add</button>
  </div>
  <div class="row">
    <input id="searchInput" placeholder="Search tasks" />
    <button id="clearDoneBtn" class="ghost">Clear done</button>
  </div>
  <ul id="list"></ul>
</div>`,
    css: `body{ font-family:system-ui; background:#0b1020; color:#e8ecff; margin:0; padding:24px; }
.wrap{ max-width:720px; margin:0 auto; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); border-radius:16px; padding:16px; }
h1{ margin:0 0 6px; }
.sub{ margin:0 0 14px; color:rgba(232,236,255,.75); }
.row{ display:flex; gap:10px; margin:10px 0; }
input{ flex:1; padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,.16); background:rgba(0,0,0,.25); color:#e8ecff; outline:0; }
button{ padding:12px 14px; border-radius:12px; border:1px solid rgba(255,255,255,.16); background:rgba(255,255,255,.08); color:#e8ecff; cursor:pointer; }
button:hover{ border-color:rgba(255,59,106,.65); }
button.ghost{ background:transparent; }
ul{ padding:0; margin:0; }
li{ list-style:none; display:flex; align-items:center; justify-content:space-between; gap:10px; padding:10px 12px; border:1px solid rgba(255,255,255,.12); border-radius:12px; margin:10px 0; background:rgba(0,0,0,.18); }
li.done{ opacity:.65; text-decoration:line-through; }`,
    js: `const KEY = "todo:v1";
const state = { items: load() };
const todoInput = document.getElementById("todoInput");
const searchInput = document.getElementById("searchInput");
const addBtn = document.getElementById("addBtn");
const clearDoneBtn = document.getElementById("clearDoneBtn");
const list = document.getElementById("list");

function load(){ try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; } }
function save(){ localStorage.setItem(KEY, JSON.stringify(state.items)); }
function uid(){ return "t_" + Math.random().toString(16).slice(2) + "_" + Date.now(); }

function addTask(text){ state.items.unshift({ id: uid(), text, done: false }); save(); render(); }
function toggle(id){ const it = state.items.find(x => x.id === id); if(it){ it.done = !it.done; save(); render(); } }
function removeTask(id){ state.items = state.items.filter(x => x.id !== id); save(); render(); }
function clearDone(){ state.items = state.items.filter(x => !x.done); save(); render(); }
function filtered(){ const q = searchInput.value.trim().toLowerCase(); return q ? state.items.filter(x => x.text.toLowerCase().includes(q)) : state.items; }

function render(){
  list.innerHTML = "";
  const items = filtered();
  if(!items.length){ list.innerHTML = "<li><small>No tasks</small></li>"; return; }
  for(const it of items){
    const li = document.createElement("li");
    li.className = it.done ? "done" : "";
    li.innerHTML = '<div style="display:flex;align-items:center;gap:10px"><input type="checkbox" '+(it.done?'checked':'')+'/><span>'+it.text+'</span></div><button class="ghost">Delete</button>';
    li.querySelector('input').addEventListener('change', () => toggle(it.id));
    li.querySelector('button').addEventListener('click', () => removeTask(it.id));
    list.appendChild(li);
  }
}

addBtn.addEventListener("click", () => { const v = todoInput.value.trim(); if(v){ todoInput.value=""; addTask(v); } });
todoInput.addEventListener("keydown", e => { if(e.key==="Enter") addBtn.click(); });
searchInput.addEventListener("input", render);
clearDoneBtn.addEventListener("click", clearDone);
render();`
  },
  landing: {
    html: `<div class="hero">
  <div class="card">
    <div class="pill">Modern landing</div>
    <h1>Ship faster with a clean, focused page</h1>
    <p>Simple copy. Strong CTA. One screen. No fluff.</p>
    <div class="row">
      <button id="primary">Get started</button>
      <button class="ghost" id="secondary">See features</button>
    </div>
  </div>
</div>`,
    css: `body{ margin:0; font-family:system-ui; background:radial-gradient(900px 400px at 20% 0%, rgba(255,59,106,.18), transparent 60%), #07070a; color:#f5f7ff; }
.hero{ min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
.card{ background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); border-radius:24px; padding:48px; max-width:600px; text-align:center; }
.pill{ display:inline-block; background:rgba(255,59,106,.15); border:1px solid rgba(255,59,106,.35); color:#ff7094; padding:6px 14px; border-radius:999px; font-size:13px; margin-bottom:20px; }
h1{ font-size:clamp(28px,5vw,42px); margin:0 0 16px; line-height:1.2; }
p{ color:rgba(245,247,255,.75); margin:0 0 28px; }
.row{ display:flex; gap:12px; justify-content:center; }
button{ padding:14px 24px; border-radius:12px; border:1px solid rgba(255,255,255,.16); background:linear-gradient(180deg,rgba(255,255,255,.1),rgba(255,255,255,.04)); color:#f5f7ff; font-size:15px; cursor:pointer; }
button:hover{ border-color:rgba(255,59,106,.55); }
button.ghost{ background:transparent; }
#primary{ background:linear-gradient(135deg,#ff3b6a,#e11d48); border:none; }`,
    js: `document.getElementById("primary").addEventListener("click", () => alert("Welcome aboard!"));
document.getElementById("secondary").addEventListener("click", () => alert("Features: Fast, Simple, Beautiful"));`
  },
  dashboard: {
    html: `<div class="dash">
  <h1>Dashboard</h1>
  <div class="stats">
    <div class="stat"><div class="label">Users</div><div class="val" id="users">1,234</div></div>
    <div class="stat"><div class="label">Revenue</div><div class="val" id="revenue">$45.6K</div></div>
    <div class="stat"><div class="label">Orders</div><div class="val" id="orders">892</div></div>
    <div class="stat"><div class="label">Growth</div><div class="val green" id="growth">+12%</div></div>
  </div>
  <button id="refreshBtn">Refresh data</button>
</div>`,
    css: `body{ margin:0; padding:24px; font-family:system-ui; background:#0b1020; color:#e8ecff; }
.dash{ max-width:900px; margin:0 auto; }
h1{ margin:0 0 24px; }
.stats{ display:grid; grid-template-columns:repeat(auto-fit, minmax(180px,1fr)); gap:16px; margin-bottom:24px; }
.stat{ background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); border-radius:16px; padding:20px; }
.label{ font-size:13px; color:rgba(232,236,255,.65); margin-bottom:8px; }
.val{ font-size:28px; font-weight:700; }
.val.green{ color:#22c55e; }
button{ padding:12px 20px; border-radius:12px; border:1px solid rgba(255,255,255,.16); background:rgba(255,255,255,.08); color:#e8ecff; cursor:pointer; }
button:hover{ border-color:rgba(255,59,106,.55); }`,
    js: `const data = { users: 1234, revenue: 45600, orders: 892, growth: 12 };

function format(n){ return n >= 1000 ? (n/1000).toFixed(1) + "K" : n; }
function render(){
  document.getElementById("users").textContent = format(data.users);
  document.getElementById("revenue").textContent = "$" + format(data.revenue);
  document.getElementById("orders").textContent = data.orders;
  document.getElementById("growth").textContent = "+" + data.growth + "%";
}

document.getElementById("refreshBtn").addEventListener("click", () => {
  data.users += Math.floor(Math.random() * 50);
  data.revenue += Math.floor(Math.random() * 500);
  data.orders += Math.floor(Math.random() * 10);
  data.growth = Math.floor(Math.random() * 20);
  render();
});

render();`
  },
  form: {
    html: `<div class="wrap">
  <h1>Contact form</h1>
  <form id="form">
    <div class="field"><label>Name</label><input id="name" placeholder="Your name" required /></div>
    <div class="field"><label>Email</label><input id="email" type="email" placeholder="you@example.com" required /></div>
    <div class="field"><label>Message</label><textarea id="message" rows="4" placeholder="How can we help?" required></textarea></div>
    <button type="submit">Send message</button>
    <div id="feedback" class="feedback"></div>
  </form>
</div>`,
    css: `body{ margin:0; padding:24px; font-family:system-ui; background:#0b1020; color:#e8ecff; }
.wrap{ max-width:500px; margin:0 auto; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); border-radius:16px; padding:24px; }
h1{ margin:0 0 20px; font-size:24px; }
.field{ margin-bottom:16px; }
label{ display:block; font-size:13px; color:rgba(232,236,255,.75); margin-bottom:6px; }
input, textarea{ width:100%; padding:12px; border-radius:12px; border:1px solid rgba(255,255,255,.16); background:rgba(0,0,0,.25); color:#e8ecff; outline:0; box-sizing:border-box; }
input:focus, textarea:focus{ border-color:rgba(255,59,106,.55); }
input.error, textarea.error{ border-color:#ef4444; }
button{ width:100%; padding:14px; border-radius:12px; border:none; background:linear-gradient(135deg,#ff3b6a,#e11d48); color:#fff; font-size:15px; cursor:pointer; }
button:hover{ opacity:.9; }
.feedback{ margin-top:16px; padding:12px; border-radius:10px; text-align:center; }
.feedback.success{ background:rgba(34,197,94,.15); color:#22c55e; }
.feedback.error{ background:rgba(239,68,68,.15); color:#ef4444; }`,
    js: `const form = document.getElementById("form");
const feedback = document.getElementById("feedback");

function validate(el, test){
  if(!test){ el.classList.add("error"); return false; }
  el.classList.remove("error"); return true;
}

form.addEventListener("submit", e => {
  e.preventDefault();
  const name = document.getElementById("name");
  const email = document.getElementById("email");
  const message = document.getElementById("message");
  
  let ok = true;
  ok = validate(name, name.value.trim().length >= 2) && ok;
  ok = validate(email, /^[^@]+@[^@]+\\.[^@]+$/.test(email.value)) && ok;
  ok = validate(message, message.value.trim().length >= 10) && ok;
  
  if(!ok){
    feedback.className = "feedback error";
    feedback.textContent = "Please fix the errors above";
    return;
  }
  
  feedback.className = "feedback success";
  feedback.textContent = "Message sent successfully!";
  form.reset();
});`
  }
};

templateSelect.addEventListener("change", () => {
  const v = templateSelect.value;
  if (!v) return;

  localStorage.setItem(LS.lastTemplate, v);

  const t = templates[v];
  if (!t) return;

  snapshotPush(`Template ${v}`);
  editors.html.value = t.html;
  editors.css.value = t.css;
  editors.js.value = t.js;
  setErrorText("");
  aiOut.textContent = `Loaded template: ${v}`;
  run();

  templateSelect.value = "";
});

// Initialize
if (!tryAutoLoadLastProject()) {
  editors.html.value = `<div class="hero">
  <div class="card">
    <div class="pill">Codebench</div>
    <h1>Build anything with AI</h1>
    <p>Write HTML, CSS, JS on the left. See results instantly. Use AI to debug, improve, or build from scratch.</p>
    <div class="row">
      <button id="startBtn">Get started</button>
    </div>
  </div>
</div>`;
  editors.css.value = `body{ margin:0; font-family:system-ui; background:radial-gradient(900px 400px at 20% 0%, rgba(255,59,106,.18), transparent 60%), #07070a; color:#f5f7ff; }
.hero{ min-height:100vh; display:flex; align-items:center; justify-content:center; padding:24px; }
.card{ background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); border-radius:24px; padding:48px; max-width:550px; text-align:center; }
.pill{ display:inline-block; background:rgba(255,59,106,.15); border:1px solid rgba(255,59,106,.35); color:#ff7094; padding:6px 14px; border-radius:999px; font-size:13px; margin-bottom:20px; }
h1{ font-size:clamp(28px,5vw,38px); margin:0 0 16px; line-height:1.2; }
p{ color:rgba(245,247,255,.75); margin:0 0 28px; line-height:1.6; }
.row{ display:flex; gap:12px; justify-content:center; }
button{ padding:14px 28px; border-radius:12px; border:none; background:linear-gradient(135deg,#ff3b6a,#e11d48); color:#fff; font-size:15px; cursor:pointer; transition:all .2s; }
button:hover{ transform:translateY(-2px); box-shadow:0 8px 20px rgba(255,59,106,.35); }`;
  editors.js.value = `document.getElementById("startBtn").addEventListener("click", () => {
  document.querySelector("h1").textContent = "Let's build!";
  document.querySelector("p").textContent = "Try the Templates dropdown or type a prompt and click Build.";
});`;
}

setErrorText("");
renderHistory();
loadModels();
checkAuth();
run();
