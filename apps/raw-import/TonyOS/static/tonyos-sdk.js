function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return Array.from(root.querySelectorAll(sel)); }

export async function api(path, body = null) {
  const opts = body
    ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    : { method: "GET" };

  const r = await fetch(path, opts);
  const data = await r.json().catch(() => ({}));

  if (!r.ok) {
    const msg = data?.error || `Request failed: ${r.status}`;
    throw new Error(msg);
  }
  return data;
}

export async function brain({ message, mode = "default", userId = "tony", conversationId = null, context = "" }) {
  const r = await fetch("/api/brain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, mode, userId, conversationId, context })
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(data?.error || `Brain failed: ${r.status}`);
  return data;
}

export function wireToolCards({ selector = ".card.clickable", to = "/chat", param = "mode" } = {}) {
  qsa(selector).forEach(card => {
    const mode = card.dataset.mode || card.getAttribute("data-mode");
    const href = card.dataset.href || card.getAttribute("data-href") || card.getAttribute("href");
    const dest = href || (mode ? `${to}?${param}=${encodeURIComponent(mode)}` : null);
    if (!dest) return;

    card.style.cursor = "pointer";
    card.setAttribute("role", "button");
    card.setAttribute("tabindex", "0");

    const go = () => (window.location.href = dest);
    card.addEventListener("click", go);
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
    });
  });
}

export async function webAnswer(question) {
  return api("/api/web-answer", { question });
}

export async function chat(message, options = {}) {
  return api("/api/chat", {
    message,
    mode: options.mode || "normal",
    mood: options.mood || "neutral",
    truth: options.truth || false
  });
}

export async function research(query, urls = []) {
  return api("/smart_research", { query, urls });
}

export async function offerBuilder(audience, problem, outcome, proof) {
  return api("/api/offer_builder", { audience, problem, outcome, proof });
}

export async function outreachBuilder(persona, context, angle, channel = "email + LinkedIn") {
  return api("/api/outreach_builder", { persona, context, angle, channel });
}

export async function contentIdeas(niche, platform = "LinkedIn", themes = "") {
  return api("/api/content_ideas", { niche, platform, themes });
}

export async function companyIntel(url, goal) {
  return api("/api/company_intel", { url, goal });
}

/**
 * Auto-wires common TonyOS functionality on page load:
 * - Tool card clicks (if not already links)
 * - Form submission handlers
 * - Common UI behaviors
 */
export function wireTonyOS() {
  document.addEventListener("DOMContentLoaded", () => {
    wireToolCards();

    // Wire back buttons
    qsa("[data-back]").forEach(btn => {
      btn.addEventListener("click", () => window.history.back());
    });

    // Wire home buttons
    qsa("[data-home]").forEach(btn => {
      btn.addEventListener("click", () => window.location.href = "/");
    });

    // Wire copy buttons
    qsa("[data-copy]").forEach(btn => {
      btn.addEventListener("click", () => {
        const target = qs(btn.dataset.copy);
        if (target) {
          navigator.clipboard.writeText(target.textContent || target.value);
          btn.textContent = "Copied!";
          setTimeout(() => btn.textContent = "Copy", 1500);
        }
      });
    });

    // Wire clear buttons for textareas
    qsa("[data-clear]").forEach(btn => {
      btn.addEventListener("click", () => {
        const target = qs(btn.dataset.clear);
        if (target) target.value = "";
      });
    });

    // Wire any form with data-tonyos-form for AI tools
    qsa("form[data-tonyos-form]").forEach(form => {
      const inputSel = form.getAttribute("data-input") || "input,textarea";
      const outSel = form.getAttribute("data-output") || "[data-tonyos-output]";
      const mode = form.getAttribute("data-mode") || "default";

      const inputEl = qs(inputSel, form);
      const outEl = qs(outSel) || qs(outSel, form);

      let conversationId = localStorage.getItem(`tonyos_convo_${mode}`) || null;

      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const msg = (inputEl?.value || "").trim();
        if (!msg) return;

        if (outEl) outEl.textContent = "Thinking...";

        try {
          const pageContext = document.body?.innerText?.slice(0, 2000) || "";
          const data = await brain({ message: msg, mode, conversationId, context: pageContext });
          conversationId = data.conversationId;
          localStorage.setItem(`tonyos_convo_${mode}`, conversationId);
          if (outEl) outEl.textContent = data.reply;
        } catch (err) {
          if (outEl) outEl.textContent = `Error: ${String(err.message || err)}`;
        }
      });
    });

    console.log("TonyOS SDK wired.");
  });
}
