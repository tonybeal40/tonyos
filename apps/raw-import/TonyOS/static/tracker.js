(() => {
  const STORAGE_KEY = "tonyos_v1";

  const $ = (sel) => document.querySelector(sel);
  const pageEl = $("#page");
  const searchEl = $("#globalSearch");
  const clearSearchBtn = $("#clearSearch");
  const newEntryBtn = $("#newEntryBtn");
  const exportBtn = $("#exportBtn");
  const importFile = $("#importFile");
  const viewHint = $("#viewHint");

  const modalOverlay = $("#modalOverlay");
  const modalClose = $("#modalClose");
  const cancelEntryBtn = $("#cancelEntryBtn");
  const deleteEntryBtn = $("#deleteEntryBtn");
  const entryForm = $("#entryForm");

  const entryIdEl = $("#entryId");
  const entrySectionEl = $("#entrySection");
  const entryDateEl = $("#entryDate");
  const entryTitleEl = $("#entryTitle");
  const entryBodyEl = $("#entryBody");
  const entryTagsEl = $("#entryTags");

  const DEFAULT_STATE = () => ({
    version: 1,
    createdAt: new Date().toISOString(),
    today: [],
    proof: [],
    decisions: [],
    stacks: { job: [], money: [], health: [] },
    prompts: []
  });

  let STATE = loadState();
  let GLOBAL_SEARCH = "";

  const ROUTES = [
    { path: "overview", title: "Overview", hint: "See the whole system in one place." },
    { path: "today", title: "Today", hint: "One priority. One action. One win." },
    { path: "proof", title: "Proof Engine", hint: "Log what you did. Build career equity." },
    { path: "decisions", title: "Decision Log", hint: "Capture decisions to stop second-guessing." },
    { path: "stacks", title: "Stacks", hint: "Job, Money, Health. Keep reality visible." },
    { path: "prompts", title: "Prompts Vault", hint: "Save prompts you actually use." }
  ];

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULT_STATE();
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_STATE(),
        ...parsed,
        stacks: { ...DEFAULT_STATE().stacks, ...(parsed.stacks || {}) }
      };
    } catch {
      return DEFAULT_STATE();
    }
  }

  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(STATE));
  }

  function uid() {
    return Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
  }

  function parseTags(str) {
    return (str || "")
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0, 12);
  }

  function fmtDate(isoOrDate) {
    if (!isoOrDate) return "";
    const d = new Date(isoOrDate);
    if (Number.isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" });
  }

  function toISODateValue(isoOrDate) {
    if (!isoOrDate) return "";
    const d = new Date(isoOrDate);
    if (Number.isNaN(d.getTime())) return "";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function normalizeEntry(e) {
    return {
      id: e.id || uid(),
      createdAt: e.createdAt || new Date().toISOString(),
      date: e.date || "",
      title: e.title || "",
      body: e.body || "",
      tags: Array.isArray(e.tags) ? e.tags : []
    };
  }

  function sectionRef(sectionKey) {
    if (sectionKey.startsWith("stacks.")) {
      const k = sectionKey.split(".")[1];
      return STATE.stacks[k];
    }
    return STATE[sectionKey];
  }

  function sectionLabel(sectionKey) {
    switch (sectionKey) {
      case "today": return "Today";
      case "proof": return "Proof";
      case "decisions": return "Decisions";
      case "prompts": return "Prompts";
      case "stacks.job": return "Job Stack";
      case "stacks.money": return "Money Stack";
      case "stacks.health": return "Health Stack";
      default: return sectionKey;
    }
  }

  function allEntriesFlat() {
    const out = [];
    for (const key of ["today", "proof", "decisions", "prompts"]) {
      for (const e of (STATE[key] || [])) out.push({ ...e, __section: key });
    }
    for (const k of ["job", "money", "health"]) {
      for (const e of (STATE.stacks[k] || [])) out.push({ ...e, __section: `stacks.${k}` });
    }
    return out.map(normalizeEntry);
  }

  function matchesSearch(entry, q) {
    if (!q) return true;
    const s = q.toLowerCase();
    const hay = [
      entry.title || "",
      entry.body || "",
      (entry.tags || []).join(" "),
      entry.__section || ""
    ].join(" ").toLowerCase();
    return hay.includes(s);
  }

  function startOfWeek(d) {
    const x = new Date(d);
    x.setHours(0,0,0,0);
    const day = x.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    x.setDate(x.getDate() + diff);
    return x;
  }

  function weekKeyFor(d) {
    const w = startOfWeek(d);
    const yyyy = w.getFullYear();
    const mm = String(w.getMonth() + 1).padStart(2, "0");
    const dd = String(w.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  function weekLabel(weekKey) {
    const w = new Date(weekKey + "T00:00:00");
    const end = new Date(w);
    end.setDate(end.getDate() + 6);
    return `${fmtDate(w)} to ${fmtDate(end)}`;
  }

  function recentWeeks(n = 12) {
    const now = new Date();
    const cur = startOfWeek(now);
    const keys = [];
    for (let i = 0; i < n; i++) {
      const d = new Date(cur);
      d.setDate(d.getDate() - (7 * i));
      keys.push(weekKeyFor(d));
    }
    return keys;
  }

  function openModal(opts = {}) {
    const { mode = "new", section = currentSectionKey(), entry = null } = opts;

    entryIdEl.value = entry?.id || "";
    entrySectionEl.value = section || "today";
    entryDateEl.value = entry?.date ? toISODateValue(entry.date) : "";
    entryTitleEl.value = entry?.title || "";
    entryBodyEl.value = entry?.body || "";
    entryTagsEl.value = (entry?.tags || []).join(", ");

    $("#modalTitle").textContent = mode === "edit" ? "Edit Entry" : "New Entry";
    deleteEntryBtn.classList.toggle("hidden", mode !== "edit");
    modalOverlay.classList.remove("hidden");
    modalOverlay.setAttribute("aria-hidden", "false");
  }

  function closeModal() {
    modalOverlay.classList.add("hidden");
    modalOverlay.setAttribute("aria-hidden", "true");
    entryForm.reset();
    entryIdEl.value = "";
    deleteEntryBtn.classList.add("hidden");
  }

  function upsertEntry(sectionKey, entry) {
    const arr = sectionRef(sectionKey);
    const normalized = normalizeEntry(entry);
    const idx = arr.findIndex(e => e.id === normalized.id);
    if (idx >= 0) arr[idx] = normalized;
    else arr.unshift(normalized);
    saveState();
  }

  function deleteEntry(sectionKey, id) {
    const arr = sectionRef(sectionKey);
    const idx = arr.findIndex(e => e.id === id);
    if (idx >= 0) arr.splice(idx, 1);
    saveState();
  }

  function findEntryById(id) {
    for (const e of allEntriesFlat()) if (e.id === id) return e;
    return null;
  }

  function exportJSON() {
    const blob = new Blob([JSON.stringify(STATE, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0,10);
    a.href = url;
    a.download = `tonyos_backup_${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function importJSON(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || ""));
        if (!parsed || typeof parsed !== "object") throw new Error("Invalid JSON");
        STATE = {
          ...DEFAULT_STATE(),
          ...parsed,
          stacks: { ...DEFAULT_STATE().stacks, ...(parsed.stacks || {}) }
        };
        saveState();
        render();
        alert("Import complete.");
      } catch {
        alert("Import failed. File is not a valid TonyOS backup.");
      }
    };
    reader.readAsText(file);
  }

  function esc(s) {
    return String(s || "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function entryCardHTML(e) {
    const tags = (e.tags || []).map(t => `<span class="pill">#${esc(t)}</span>`).join("");
    const dateBits = [];
    if (e.date) dateBits.push(`Date: ${esc(fmtDate(e.date))}`);
    dateBits.push(`Created: ${esc(fmtDate(e.createdAt))}`);
    dateBits.push(`Section: <span class="badge">${esc(sectionLabel(e.__section || currentSectionKey()))}</span>`);

    return `
      <div class="entry">
        <div class="row">
          <div>
            <div class="title">${esc(e.title || "(No title)")}</div>
            <div class="meta">${dateBits.map(x => `<span>${x}</span>`).join("")}</div>
          </div>
          <div class="actions">
            <button class="btn btn-ghost" data-action="edit" data-id="${esc(e.id)}">Edit</button>
          </div>
        </div>
        ${e.body ? `<div class="body">${esc(e.body)}</div>` : ""}
        ${tags ? `<div class="pills" style="margin-top:10px">${tags}</div>` : ""}
      </div>
    `;
  }

  function emptyStateHTML(title, text) {
    return `
      <div class="card">
        <div class="card-head">
          <div>
            <div class="card-title">${esc(title)}</div>
            <div class="card-sub">${esc(text)}</div>
          </div>
        </div>
        <div class="card-body">
          <div class="muted">Hit New Entry to start.</div>
        </div>
      </div>
    `;
  }

  function currentRoute() {
    const h = (location.hash || "#/overview").replace(/^#\/?/, "");
    const [path, query] = h.split("?");
    return { path: (path || "overview").trim(), query: query || "" };
  }

  function currentSectionKey() {
    const { path } = currentRoute();
    if (path === "today") return "today";
    if (path === "proof") return "proof";
    if (path === "decisions") return "decisions";
    if (path === "prompts") return "prompts";
    if (path === "stacks") return "stacks.job";
    return "today";
  }

  function setActiveNav() {
    const { path } = currentRoute();
    document.querySelectorAll(".nav a").forEach(a => {
      a.classList.toggle("active", a.dataset.route === path);
    });
    const def = ROUTES.find(r => r.path === path) || ROUTES[0];
    viewHint.textContent = def.hint || "";
  }

  function renderOverview() {
    const all = allEntriesFlat();
    const totals = {
      today: STATE.today.length,
      proof: STATE.proof.length,
      decisions: STATE.decisions.length,
      stacks: (STATE.stacks.job.length + STATE.stacks.money.length + STATE.stacks.health.length),
      prompts: STATE.prompts.length,
      all: all.length
    };

    const wk = weekKeyFor(new Date());
    const proofThisWeek = (STATE.proof || []).filter(e => {
      const d = e.date ? new Date(e.date) : new Date(e.createdAt);
      return weekKeyFor(d) === wk;
    }).length;

    const latest = all
      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)
      .filter(e => matchesSearch(e, GLOBAL_SEARCH))
      .map(e => ({ ...e, __section: e.__section }));

    const latestHTML = latest.length
      ? `<div class="grid">${latest.map(entryCardHTML).join("")}</div>`
      : emptyStateHTML("No matches", "Your search did not match any entries.");

    return `
      <div class="grid">
        <div class="card">
          <div class="card-head">
            <div>
              <div class="card-title">System Snapshot</div>
              <div class="card-sub">This is your proof, your decisions, your control.</div>
            </div>
          </div>
          <div class="card-body">
            <div class="kpis">
              <div class="kpi">
                <div class="label">Total Entries</div>
                <div class="value">${totals.all}</div>
                <div class="trend muted">All sections combined</div>
              </div>
              <div class="kpi">
                <div class="label">Proof This Week</div>
                <div class="value">${proofThisWeek}</div>
                <div class="trend muted">Week starting Monday</div>
              </div>
              <div class="kpi">
                <div class="label">Decisions Logged</div>
                <div class="value">${totals.decisions}</div>
                <div class="trend muted">Stop second-guessing</div>
              </div>
              <div class="kpi">
                <div class="label">Stacks Items</div>
                <div class="value">${totals.stacks}</div>
                <div class="trend muted">Job, Money, Health</div>
              </div>
            </div>

            <div style="margin-top:12px" class="muted">
              Tip: Export a backup before you make big changes.
            </div>
          </div>
        </div>

        <div class="card">
          <div class="card-head">
            <div>
              <div class="card-title">Latest Entries</div>
              <div class="card-sub">Most recent across all sections</div>
            </div>
          </div>
          <div class="card-body">
            ${latestHTML}
          </div>
        </div>
      </div>
    `;
  }

  function renderListPage(sectionKey, title, subtitle, options = {}) {
    const arr = (sectionRef(sectionKey) || []).map(e => ({ ...normalizeEntry(e), __section: sectionKey }));
    const filtered = arr.filter(e => matchesSearch(e, GLOBAL_SEARCH));

    let extraTop = "";
    if (options.weekSelector) {
      const weeks = recentWeeks(14);
      const selected = options.selectedWeekKey || weeks[0];
      extraTop = `
        <div class="row" style="margin-bottom:10px">
          <div class="muted">Weekly view</div>
          <div class="row" style="gap:10px">
            <select id="weekSelect" class="btn btn-ghost" style="padding:10px 12px">
              ${weeks.map(w => `<option value="${esc(w)}" ${w === selected ? "selected" : ""}>${esc(weekLabel(w))}</option>`).join("")}
            </select>
            <span class="badge">Proof</span>
          </div>
        </div>
      `;
    }

    let list = filtered;
    if (options.weekSelector) {
      const selected = options.selectedWeekKey || weekKeyFor(new Date());
      list = filtered.filter(e => {
        const d = e.date ? new Date(e.date) : new Date(e.createdAt);
        return weekKeyFor(d) === selected;
      });
    }

    const body = list.length
      ? `<div class="grid">${list.map(entryCardHTML).join("")}</div>`
      : emptyStateHTML("Nothing here yet", "Add your first entry. Keep it simple and real.");

    return `
      <div class="grid">
        <div class="card">
          <div class="card-head">
            <div>
              <div class="card-title">${esc(title)}</div>
              <div class="card-sub">${esc(subtitle)}</div>
            </div>
            <div class="badge">${esc(sectionLabel(sectionKey))}</div>
          </div>
          <div class="card-body">
            ${extraTop}
            ${body}
          </div>
        </div>
      </div>
    `;
  }

  function renderStacks() {
    const q = GLOBAL_SEARCH;
    const job = STATE.stacks.job.map(e => ({ ...normalizeEntry(e), __section: "stacks.job" })).filter(e => matchesSearch(e, q));
    const money = STATE.stacks.money.map(e => ({ ...normalizeEntry(e), __section: "stacks.money" })).filter(e => matchesSearch(e, q));
    const health = STATE.stacks.health.map(e => ({ ...normalizeEntry(e), __section: "stacks.health" })).filter(e => matchesSearch(e, q));

    function stackBlock(name, sectionKey, items) {
      const preview = items.slice(0, 4);
      return `
        <div class="card">
          <div class="card-head">
            <div>
              <div class="card-title">${esc(name)}</div>
              <div class="card-sub">Keep reality visible. Small entries beat chaos.</div>
            </div>
            <div class="row" style="gap:10px">
              <span class="badge">${items.length} items</span>
              <a class="btn btn-ghost" href="#/stacks?tab=${esc(sectionKey)}">Open</a>
            </div>
          </div>
          <div class="card-body">
            ${preview.length ? `<div class="grid">${preview.map(entryCardHTML).join("")}</div>` : `<div class="muted">No items yet.</div>`}
          </div>
        </div>
      `;
    }

    const { query } = currentRoute();
    const params = new URLSearchParams(query || "");
    const tab = params.get("tab") || "stacks.job";

    const selectedTitle = tab === "stacks.money" ? "Money Stack" : tab === "stacks.health" ? "Health Stack" : "Job Stack";
    const selectedSubtitle =
      tab === "stacks.money" ? "Track the truth. Control beats optimism." :
      tab === "stacks.health" ? "Sleep, energy, meds, mood. Data not judgment." :
      "Track leads, outreach, interviews, next actions.";

    const selectedHTML = renderListPage(tab, selectedTitle, selectedSubtitle);

    return `
      <div class="grid">
        <div class="card">
          <div class="card-head">
            <div>
              <div class="card-title">Stacks</div>
              <div class="card-sub">Your three piles. If these are clean, life is cleaner.</div>
            </div>
          </div>
          <div class="card-body">
            <div class="kpis">
              <div class="kpi"><div class="label">Job</div><div class="value">${STATE.stacks.job.length}</div><div class="trend muted">Leads, interviews, outreach</div></div>
              <div class="kpi"><div class="label">Money</div><div class="value">${STATE.stacks.money.length}</div><div class="trend muted">Budget, bills, income</div></div>
              <div class="kpi"><div class="label">Health</div><div class="value">${STATE.stacks.health.length}</div><div class="trend muted">Sleep, meds, energy</div></div>
              <div class="kpi"><div class="label">All Stacks</div><div class="value">${STATE.stacks.job.length + STATE.stacks.money.length + STATE.stacks.health.length}</div><div class="trend muted">Total items</div></div>
            </div>
          </div>
        </div>

        ${stackBlock("Job Stack", "stacks.job", job)}
        ${stackBlock("Money Stack", "stacks.money", money)}
        ${stackBlock("Health Stack", "stacks.health", health)}

        ${selectedHTML}
      </div>
    `;
  }

  function renderSearchResults() {
    const q = GLOBAL_SEARCH.trim();
    if (!q) return "";

    const items = allEntriesFlat().filter(e => matchesSearch(e, q));
    const top = items.slice(0, 40);
    const body = top.length
      ? `<div class="grid">${top.map(entryCardHTML).join("")}</div>`
      : `<div class="muted">No matches for "${esc(q)}".</div>`;

    return `
      <div class="card" style="margin-top:12px">
        <div class="card-head">
          <div>
            <div class="card-title">Search Results</div>
            <div class="card-sub">Query: "${esc(q)}" | ${items.length} matches</div>
          </div>
        </div>
        <div class="card-body">${body}</div>
      </div>
    `;
  }

  function render() {
    setActiveNav();

    const { path, query } = currentRoute();

    let html = "";
    if (path === "overview") html = renderOverview();
    else if (path === "today") html = renderListPage("today", "Today", "One priority. One action. One win.");
    else if (path === "proof") {
      const params = new URLSearchParams(query || "");
      const wk = params.get("week") || recentWeeks(14)[0];
      html = renderListPage("proof", "Proof Engine", "Log what you did. Build receipts.", { weekSelector: true, selectedWeekKey: wk });
    }
    else if (path === "decisions") html = renderListPage("decisions", "Decision Log", "Context, decision, reason, next step.");
    else if (path === "stacks") html = renderStacks();
    else if (path === "prompts") html = renderListPage("prompts", "Prompts Vault", "Save prompts you actually use, not the ones you wish you used.");
    else {
      location.hash = "#/overview";
      return;
    }

    const sr = renderSearchResults();
    pageEl.innerHTML = html + sr;

    wirePageEvents();
  }

  function wirePageEvents() {
    pageEl.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const entry = findEntryById(id);
        if (!entry) return;
        openModal({ mode: "edit", section: entry.__section || "today", entry });
      });
    });

    const weekSelect = $("#weekSelect");
    if (weekSelect) {
      weekSelect.addEventListener("change", () => {
        const wk = weekSelect.value;
        location.hash = `#/proof?week=${encodeURIComponent(wk)}`;
      });
    }
  }

  window.addEventListener("hashchange", render);

  searchEl.addEventListener("input", () => {
    GLOBAL_SEARCH = searchEl.value || "";
    render();
  });

  clearSearchBtn.addEventListener("click", () => {
    GLOBAL_SEARCH = "";
    searchEl.value = "";
    render();
  });

  newEntryBtn.addEventListener("click", () => {
    const { path, query } = currentRoute();
    let sec = currentSectionKey();
    if (path === "stacks") {
      const params = new URLSearchParams(query || "");
      sec = params.get("tab") || "stacks.job";
    }
    openModal({ mode: "new", section: sec });
  });

  modalClose.addEventListener("click", closeModal);
  cancelEntryBtn.addEventListener("click", closeModal);

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  deleteEntryBtn.addEventListener("click", () => {
    const id = entryIdEl.value;
    const sec = entrySectionEl.value;
    if (id && confirm("Delete this entry?")) {
      deleteEntry(sec, id);
      closeModal();
      render();
    }
  });

  entryForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const id = entryIdEl.value || uid();
    const sec = entrySectionEl.value;
    const entry = {
      id,
      date: entryDateEl.value || "",
      title: entryTitleEl.value.trim(),
      body: entryBodyEl.value.trim(),
      tags: parseTags(entryTagsEl.value)
    };
    upsertEntry(sec, entry);
    closeModal();
    render();
  });

  exportBtn.addEventListener("click", exportJSON);

  importFile.addEventListener("change", () => {
    if (importFile.files && importFile.files[0]) {
      importJSON(importFile.files[0]);
      importFile.value = "";
    }
  });

  render();
})();
