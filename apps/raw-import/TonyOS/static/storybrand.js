(() => {
  const KEY = "storybrand_os_v1";

  const $ = (s) => document.querySelector(s);
  const view = $("#view");
  const projectName = $("#projectName");
  const projectNameText = $("#projectNameText");
  const saveProjectBtn = $("#saveProjectBtn");
  const exportBtn = $("#exportBtn");
  const importFile = $("#importFile");
  const resetBtn = $("#resetBtn");
  const search = $("#search");

  const tabs = Array.from(document.querySelectorAll(".tab"));

  const DEFAULT = () => ({
    version: 1,
    activeId: null,
    projects: []
  });

  let STATE = load();

  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if(!raw) return DEFAULT();
      const parsed = JSON.parse(raw);
      return { ...DEFAULT(), ...parsed, projects: Array.isArray(parsed.projects) ? parsed.projects : [] };
    } catch {
      return DEFAULT();
    }
  }

  function save(){
    localStorage.setItem(KEY, JSON.stringify(STATE));
  }

  function uid(){
    return Math.random().toString(16).slice(2) + "_" + Date.now().toString(16);
  }

  function nowISO(){
    return new Date().toISOString();
  }

  function activeProject(){
    const p = STATE.projects.find(x => x.id === STATE.activeId);
    return p || null;
  }

  function setActive(id){
    STATE.activeId = id;
    save();
    render();
  }

  function setTab(tab){
    tabs.forEach(t => t.classList.toggle("active", t.dataset.tab === tab));
    view.dataset.tab = tab;
    render();
  }

  function esc(s){
    return String(s || "")
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  function splitTags(s){
    return (s || "").split(",").map(x => x.trim()).filter(Boolean).slice(0, 12);
  }

  function sbTemplate(p){
    const brand = p.brand || {};
    const hero = brand.hero || {};
    const problem = brand.problem || {};
    const guide = brand.guide || {};
    const plan = brand.plan || {};
    const cta = brand.cta || {};
    const avoid = brand.avoid || {};
    const success = brand.success || {};

    return [
      `${hero.who || "A customer"} wants ${hero.want || "a clear outcome"}.`,
      `But they struggle with ${problem.external || "a frustrating problem"}, which causes ${problem.internal || "stress and doubt"}.`,
      `They fear ${problem.philosophical || "wasting time and money"}.`,
      ``,
      `You are the guide who has ${guide.empathy || "been there"} and ${guide.authority || "a proven method"}.`,
      `You give them a plan:`,
      `1) ${plan.step1 || "Step one"}`,
      `2) ${plan.step2 || "Step two"}`,
      `3) ${plan.step3 || "Step three"}`,
      ``,
      `You call them to action: ${cta.primary || "Book a call"}.`,
      `If they do nothing, they risk ${avoid.failure || "staying stuck"}.`,
      `If they act, they will achieve ${success.win || "a better future"}.`
    ].join("\n");
  }

  function landingCopy(p){
    const b = p.brand || {};
    const hero = b.hero || {};
    const problem = b.problem || {};
    const success = b.success || {};
    const cta = b.cta || {};
    const oneLiner = `${hero.who || "Teams"} get ${hero.want || "a clear outcome"} without ${problem.external || "the usual pain"}.`;

    const headline = hero.want
      ? `Get ${hero.want} without ${problem.external || "the headache"}`
      : `Clarity that turns into action`;

    const sub = [
      `If you're ${hero.who || "the customer"} trying to ${hero.want || "get the outcome"},`,
      `we help you avoid ${problem.external || "the pain"} so you can ${success.win || "win faster"}.`
    ].join(" ");

    const bullets = [
      `Stop ${problem.internal || "second guessing"}`,
      `Avoid ${problem.external || "wasted effort"}`,
      `Get ${success.win || "measurable results"}`
    ];

    return { oneLiner, headline, sub, bullets, primary: cta.primary || "Get started", secondary: cta.secondary || "See how it works" };
  }

  function emailDraft(p){
    const b = p.brand || {};
    const hero = b.hero || {};
    const problem = b.problem || {};
    const plan = b.plan || {};
    const success = b.success || {};
    const cta = b.cta || {};

    const subject = hero.want
      ? `Quick way to ${hero.want}`
      : `Quick question`;

    const body = [
      `Hi [Name],`,
      ``,
      `If you're trying to ${hero.want || "hit your goal"} but ${problem.external || "things keep getting messy"}, you're not alone.`,
      `Most teams feel ${problem.internal || "frustrated"} because the path isn't clear.`,
      ``,
      `Here's the simple plan we use:`,
      `1) ${plan.step1 || "Clarify the goal"}`,
      `2) ${plan.step2 || "Remove the blockers"}`,
      `3) ${plan.step3 || "Execute with tracking"}`,
      ``,
      `Result: ${success.win || "a clear win you can measure"}.`,
      ``,
      `If it's useful, ${cta.primary || "want me to share a quick outline"}?`,
      ``,
      `Best,`,
      `[Your Name]`
    ].join("\n");

    return { subject, body };
  }

  function makeProject(){
    return {
      id: uid(),
      name: "Untitled",
      createdAt: nowISO(),
      updatedAt: nowISO(),
      notes: "",
      brand: {
        hero: {
          who: "",
          want: ""
        },
        problem: {
          external: "",
          internal: "",
          philosophical: ""
        },
        guide: {
          empathy: "",
          authority: ""
        },
        plan: {
          step1: "",
          step2: "",
          step3: ""
        },
        cta: {
          primary: "",
          secondary: ""
        },
        avoid: {
          failure: ""
        },
        success: {
          win: ""
        }
      }
    };
  }

  function ensureActive(){
    if(STATE.projects.length === 0){
      const p = makeProject();
      STATE.projects.push(p);
      STATE.activeId = p.id;
      save();
    }
    if(!STATE.activeId){
      STATE.activeId = STATE.projects[0].id;
      save();
    }
  }

  function updateActive(mutator){
    const p = activeProject();
    if(!p) return;
    mutator(p);
    p.updatedAt = nowISO();
    save();
    render(false);
  }

  function currentTab(){
    const t = tabs.find(x => x.classList.contains("active"));
    return t ? t.dataset.tab : "builder";
  }

  function render(repaint = true){
    ensureActive();
    const p = activeProject();

    projectName.value = p.name || "";
    projectNameText.textContent = p.name || "Untitled";

    const tab = currentTab();

    if(tab === "builder") view.innerHTML = builderHTML(p);
    if(tab === "outputs") view.innerHTML = outputsHTML(p);
    if(tab === "vault") view.innerHTML = vaultHTML();
    if(tab === "prompts") view.innerHTML = promptsHTML(p);

    if(repaint) wire(p);
  }

  function builderHTML(p){
    const b = p.brand;
    return `
      <div class="grid">
        <div class="card">
          <div class="head">
            <div>
              <div class="h1">StoryBrand Builder</div>
              <div class="h2">Fill the inputs. Get clean outputs. No guessing.</div>
            </div>
            <div class="badge">7 Part Framework</div>
          </div>
          <div class="body">
            ${sectionField("Hero", "Who is the customer", "brand.hero.who", b.hero.who, "Example: Plant managers, founders, directors of ops")}
            ${sectionField("Hero", "What do they want", "brand.hero.want", b.hero.want, "Example: reduce downtime, generate pipeline, ship faster")}
            ${sectionField("Problem", "External problem", "brand.problem.external", b.problem.external, "Example: tooling wears out early, leads are unqualified")}
            ${sectionField("Problem", "Internal problem", "brand.problem.internal", b.problem.internal, "Example: they feel stressed, behind, uncertain")}
            ${sectionField("Problem", "Philosophical problem", "brand.problem.philosophical", b.problem.philosophical, "Example: they should not have to gamble on quality")}
            ${sectionField("Guide", "Empathy line", "brand.guide.empathy", b.guide.empathy, "Example: We have seen this in high-precision environments")}
            ${sectionField("Guide", "Authority proof", "brand.guide.authority", b.guide.authority, "Example: 20+ years, proven process, measurable wins")}
            ${sectionField("Plan", "Step 1", "brand.plan.step1", b.plan.step1, "Example: assess the current state")}
            ${sectionField("Plan", "Step 2", "brand.plan.step2", b.plan.step2, "Example: recommend the fix")}
            ${sectionField("Plan", "Step 3", "brand.plan.step3", b.plan.step3, "Example: implement and track")}
            ${sectionField("CTA", "Primary call to action", "brand.cta.primary", b.cta.primary, "Example: book a call, request a quote")}
            ${sectionField("CTA", "Secondary call to action", "brand.cta.secondary", b.cta.secondary, "Example: download the guide, see case study")}
            ${sectionField("Failure", "If they do nothing", "brand.avoid.failure", b.avoid.failure, "Example: downtime continues, budget wasted")}
            ${sectionField("Success", "If they act", "brand.success.win", b.success.win, "Example: consistent output, confidence, measurable results")}

            <div class="row" style="margin-top:12px">
              <button class="btn primary" id="toOutputs">Generate Outputs</button>
              <button class="btn ghost" id="quickFill">Quick Fill Example</button>
              <div class="muted">Tip: keep sentences short. One idea per field.</div>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="head">
            <div>
              <div class="h1">Project Notes</div>
              <div class="h2">Context you want to remember later</div>
            </div>
            <div class="badge">Optional</div>
          </div>
          <div class="body">
            <div class="field">
              <span class="label">Notes</span>
              <textarea class="textarea" data-bind="notes" placeholder="What is the offer, niche, audience, proof, constraints">${esc(p.notes || "")}</textarea>
            </div>
            <div class="out">
              <pre>${esc(sbTemplate(p))}</pre>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function sectionField(group, label, path, value, placeholder){
    return `
      <div class="field">
        <span class="label">${esc(group)} | ${esc(label)}</span>
        <textarea class="textarea" data-bind="${esc(path)}" placeholder="${esc(placeholder)}">${esc(value || "")}</textarea>
      </div>
    `;
  }

  function outputsHTML(p){
    const sb = sbTemplate(p);
    const land = landingCopy(p);
    const email = emailDraft(p);

    return `
      <div class="grid">
        <div class="card">
          <div class="head">
            <div>
              <div class="h1">Outputs</div>
              <div class="h2">Use these for homepage, pitch, emails, and ads</div>
            </div>
            <div class="row" style="gap:8px">
              <button class="btn ghost" data-copy="sb">Copy Story</button>
              <button class="btn ghost" data-copy="landing">Copy Landing</button>
              <button class="btn ghost" data-copy="email">Copy Email</button>
            </div>
          </div>
          <div class="body">
            <div class="out">
              <pre id="sbOut">${esc(sb)}</pre>
            </div>

            <div style="height:12px"></div>

            <div class="out">
              <pre id="landingOut">${esc(
`ONE LINER
${land.oneLiner}

H1
${land.headline}

SUBHEAD
${land.sub}

BULLETS
- ${land.bullets[0]}
- ${land.bullets[1]}
- ${land.bullets[2]}

CTA
Primary: ${land.primary}
Secondary: ${land.secondary}`
              )}</pre>
            </div>

            <div style="height:12px"></div>

            <div class="out">
              <pre id="emailOut">${esc(
`SUBJECT
${email.subject}

EMAIL
${email.body}`
              )}</pre>
            </div>

            <div style="height:12px"></div>

            <div class="row" style="gap:10px">
              <button class="btn primary" id="exportLandingBtn">Export Landing Page HTML</button>
              <button class="btn" id="generateWebsiteBtn" style="border-color:rgba(56,189,248,.45); background:rgba(56,189,248,.15); color:#4fd1ff;">Open in Website Builder</button>
            </div>
          </div>
        </div>

        <div class="card">
          <div class="head">
            <div>
              <div class="h1">Clarity Checker</div>
              <div class="h2">Score your inputs. Fix the weak spots.</div>
            </div>
            <div class="badge">No fluff</div>
          </div>
          <div class="body">
            ${scoreHTML(p)}
            <div class="muted" style="margin-top:10px">Goal: 12/14 or higher. If below, tighten the Hero Want, Plan Steps, and Success.</div>
          </div>
        </div>
      </div>
    `;
  }

  function scoreHTML(p){
    const b = p.brand;
    const fields = [
      ["Customer", b.hero.who],
      ["Want", b.hero.want],
      ["External", b.problem.external],
      ["Internal", b.problem.internal],
      ["Philosophical", b.problem.philosophical],
      ["Empathy", b.guide.empathy],
      ["Authority", b.guide.authority],
      ["Plan 1", b.plan.step1],
      ["Plan 2", b.plan.step2],
      ["Plan 3", b.plan.step3],
      ["CTA Primary", b.cta.primary],
      ["CTA Secondary", b.cta.secondary],
      ["Failure", b.avoid.failure],
      ["Success", b.success.win]
    ];

    let score = 0;
    const rows = fields.map(([name, val]) => {
      const ok = (val || "").trim().length >= 10;
      if(ok) score += 1;
      return `<div class="row"><div>${esc(name)}</div><div class="badge" style="border-color:${ok ? "rgba(34,197,94,.35)" : "rgba(249,115,115,.35)"}; background:${ok ? "rgba(34,197,94,.12)" : "rgba(249,115,115,.12)"}">${ok ? "OK" : "Weak"}</div></div>`;
    }).join(`<div style="height:8px"></div>`);

    return `
      <div class="row">
        <div class="badge">Score</div>
        <div style="font-weight:900; font-size:22px">${score} / 14</div>
      </div>
      <div style="height:12px"></div>
      ${rows}
    `;
  }

  function vaultHTML(){
    const q = (search.value || "").toLowerCase().trim();
    const list = STATE.projects
      .filter(p => !q || (p.name || "").toLowerCase().includes(q))
      .sort((a,b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    if(list.length === 0){
      return `
        <div class="card">
          <div class="head">
            <div>
              <div class="h1">Vault</div>
              <div class="h2">Saved projects live here</div>
            </div>
          </div>
          <div class="body">
            <div class="muted">No saved projects match your search.</div>
          </div>
        </div>
      `;
    }

    return `
      <div class="card">
        <div class="head">
          <div>
            <div class="h1">Vault</div>
            <div class="h2">${list.length} projects</div>
          </div>
          <div class="badge">Local storage</div>
        </div>
        <div class="body">
          <div class="list">
            ${list.map(p => `
              <div class="item">
                <div class="name">${esc(p.name || "Untitled")}</div>
                <div class="meta">Updated: ${esc(new Date(p.updatedAt).toLocaleString())}</div>
                <div class="actions">
                  <button class="btn ghost" data-open="${esc(p.id)}">Open</button>
                  <button class="btn ghost danger" data-del="${esc(p.id)}">Delete</button>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }

  function promptsHTML(p){
    const blocks = [
      {
        name: "Website One Liner",
        text:
`You are a StoryBrand editor
Rewrite this one-liner in 5 options
Keep it simple and specific
Customer: ${p.brand.hero.who || "[customer]"}
Want: ${p.brand.hero.want || "[want]"}
Problem: ${p.brand.problem.external || "[problem]"}
Success: ${p.brand.success.win || "[success]"}`
      },
      {
        name: "Homepage H1 + Subhead",
        text:
`Write 10 H1 options and 10 subheads using StoryBrand
No hype, no buzzwords
Use 6th grade clarity
Offer should be measurable
Inputs
Customer: ${p.brand.hero.who || "[customer]"}
Want: ${p.brand.hero.want || "[want]"}
Problem: ${p.brand.problem.external || "[problem]"}
Plan: ${p.brand.plan.step1 || "[step1]"}, ${p.brand.plan.step2 || "[step2]"}, ${p.brand.plan.step3 || "[step3]"}
CTA: ${p.brand.cta.primary || "[cta]"}`
      },
      {
        name: "Cold Email",
        text:
`Write a short cold email in a calm, confident tone
No pressure, no buzzwords
Use StoryBrand structure
Inputs
Customer: ${p.brand.hero.who || "[customer]"}
Want: ${p.brand.hero.want || "[want]"}
Problem: ${p.brand.problem.external || "[problem]"}
Proof: ${p.brand.guide.authority || "[proof]"}
Plan: ${p.brand.plan.step1 || "[step1]"} then ${p.brand.plan.step2 || "[step2]"} then ${p.brand.plan.step3 || "[step3]"}
CTA: ${p.brand.cta.secondary || p.brand.cta.primary || "[cta]"}`
      }
    ];

    return `
      <div class="card">
        <div class="head">
          <div>
            <div class="h1">Prompt Pack</div>
            <div class="h2">Copy into ChatGPT or Playground to sharpen messaging</div>
          </div>
          <div class="badge">Reusable</div>
        </div>
        <div class="body">
          <div class="list">
            ${blocks.map((b, i) => `
              <div class="item">
                <div class="name">${esc(b.name)}</div>
                <div class="actions">
                  <button class="btn ghost" data-copyblock="${i}">Copy</button>
                </div>
                <div class="out"><pre id="block_${i}">${esc(b.text)}</pre></div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    `;
  }

  function wire(p){
    projectName.addEventListener("input", () => {
      projectNameText.textContent = projectName.value.trim() || "Untitled";
    });

    saveProjectBtn.onclick = () => {
      const name = projectName.value.trim() || "Untitled";
      updateActive(x => { x.name = name; });
      toast("Saved");
      
      // Sync to Google Sheets
      const proj = activeProject();
      if (proj && window.SheetsSync) {
        window.SheetsSync.sync('Storybrand', {
          id: proj.id,
          projectName: proj.name,
          character: proj.brand?.hero?.who || '',
          problem_external: proj.brand?.problem?.external || '',
          problem_internal: proj.brand?.problem?.internal || '',
          problem_philosophical: proj.brand?.problem?.philosophical || '',
          guide_empathy: proj.brand?.guide?.empathy || '',
          guide_authority: proj.brand?.guide?.authority || '',
          plan_step1: proj.brand?.plan?.step1 || '',
          plan_step2: proj.brand?.plan?.step2 || '',
          plan_step3: proj.brand?.plan?.step3 || '',
          cta_direct: proj.brand?.cta?.primary || '',
          cta_transitional: proj.brand?.cta?.secondary || '',
          success: proj.brand?.success?.win || '',
          failure: proj.brand?.avoid?.failure || '',
          transformation: '',
          oneliner: '',
          createdAt: proj.createdAt,
          updatedAt: proj.updatedAt
        }, 'update');
      }
    };

    view.querySelectorAll("[data-bind]").forEach(el => {
      el.addEventListener("input", () => {
        const path = el.getAttribute("data-bind");
        const value = el.value;
        updateActive(proj => setByPath(proj, path, value));
      });
    });

    const toOutputs = $("#toOutputs");
    if(toOutputs) toOutputs.onclick = () => setTab("outputs");

    const quickFill = $("#quickFill");
    if(quickFill) quickFill.onclick = () => {
      updateActive(proj => {
        proj.name = proj.name && proj.name !== "Untitled" ? proj.name : "Example Offer";
        proj.brand.hero.who = "Operations leaders";
        proj.brand.hero.want = "a reliable process that hits targets";
        proj.brand.problem.external = "inconsistent results and wasted effort";
        proj.brand.problem.internal = "stress and uncertainty";
        proj.brand.problem.philosophical = "work should not feel like gambling";
        proj.brand.guide.empathy = "We have been in the messy middle";
        proj.brand.guide.authority = "We use a proven system with tracking";
        proj.brand.plan.step1 = "Assess the current state";
        proj.brand.plan.step2 = "Create a clear plan";
        proj.brand.plan.step3 = "Execute and track weekly";
        proj.brand.cta.primary = "Book a quick call";
        proj.brand.cta.secondary = "See a short overview";
        proj.brand.avoid.failure = "staying stuck and burning budget";
        proj.brand.success.win = "predictable output and confidence";
      });
      toast("Filled example");
    };

    view.querySelectorAll("[data-copy]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const type = btn.getAttribute("data-copy");
        const id = type === "sb" ? "sbOut" : type === "landing" ? "landingOut" : "emailOut";
        const text = $("#" + id).innerText;
        await copy(text);
        toast("Copied");
      });
    });

    view.querySelectorAll("[data-open]").forEach(btn => {
      btn.addEventListener("click", () => setActive(btn.getAttribute("data-open")));
    });
    view.querySelectorAll("[data-del]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-del");
        const ok = confirm("Delete this project?");
        if(!ok) return;
        STATE.projects = STATE.projects.filter(x => x.id !== id);
        if(STATE.activeId === id){
          STATE.activeId = STATE.projects[0]?.id || null;
        }
        save();
        render();
      });
    });

    view.querySelectorAll("[data-copyblock]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const i = btn.getAttribute("data-copyblock");
        const text = $("#block_" + i).innerText;
        await copy(text);
        toast("Copied");
      });
    });

    const exportLandingBtn = $("#exportLandingBtn");
    if(exportLandingBtn) exportLandingBtn.onclick = () => {
      const proj = activeProject();
      if(!proj) return;
      const html = buildLandingHTML(proj);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (proj.name || "landing") + ".html";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast("Exported HTML");
    };

    const generateWebsiteBtn = $("#generateWebsiteBtn");
    if(generateWebsiteBtn) generateWebsiteBtn.onclick = () => {
      const proj = activeProject();
      if(!proj) return;
      
      const b = proj.brand || {};
      const hero = b.hero || {};
      const problem = b.problem || {};
      const guide = b.guide || {};
      const plan = b.plan || {};
      const cta = b.cta || {};
      const avoid = b.avoid || {};
      const success = b.success || {};
      
      const websiteData = {
        projectName: proj.name || "Untitled",
        headline: hero.want ? `Get ${hero.want} without ${problem.external || "the headache"}` : "Clarity that turns into action",
        subheadline: `If you're ${hero.who || "the customer"} trying to ${hero.want || "get the outcome"}, we help you avoid ${problem.external || "the pain"} so you can ${success.win || "win faster"}.`,
        targetPersona: hero.who || "",
        painPoints: [problem.external, problem.internal, problem.philosophical].filter(Boolean),
        solution: guide.authority || "",
        empathy: guide.empathy || "",
        planSteps: [plan.step1, plan.step2, plan.step3].filter(Boolean),
        ctaPrimary: cta.primary || "Get Started",
        ctaSecondary: cta.secondary || "Learn More",
        successOutcome: success.win || "",
        failureOutcome: avoid.failure || "",
        brand: proj.brand,
        source: "storybrand"
      };
      
      localStorage.setItem("storybrand_website_data", JSON.stringify(websiteData));
      toast("Opening Website Builder...");
      setTimeout(() => {
        window.location.href = "/builder?from=storybrand";
      }, 500);
    };
  }

  function setByPath(obj, path, value){
    const parts = path.split(".");
    let cur = obj;
    for(let i = 0; i < parts.length - 1; i++){
      cur[parts[i]] = cur[parts[i]] || {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }

  async function copy(text){
    try{
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  }

  function exportJSON(){
    const blob = new Blob([JSON.stringify(STATE, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "storybrand_vault.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast("Exported vault");
  }

  function importJSON(file){
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if(data.projects && Array.isArray(data.projects)){
          STATE = { ...DEFAULT(), ...data };
          save();
          render();
          toast("Imported " + data.projects.length + " projects");
        } else {
          toast("Invalid file");
        }
      } catch {
        toast("Error reading file");
      }
    };
    reader.readAsText(file);
  }

  function resetAll(){
    if(!confirm("Reset everything? This will delete all saved projects.")) return;
    localStorage.removeItem(KEY);
    STATE = DEFAULT();
    save();
    render();
    toast("Reset complete");
  }

  function toast(msg){
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2500);
  }

  function websitePack(p){
    const b = p.brand || {};
    const hero = b.hero || {};
    const problem = b.problem || {};
    const guide = b.guide || {};
    const plan = b.plan || {};
    const success = b.success || {};
    const cta = b.cta || {};

    const h1 = hero.want
      ? `Get ${hero.want} without ${problem.external || "the chaos"}`
      : `Clarity that turns into action`;

    const sub = `For ${hero.who || "teams"} who want ${hero.want || "a better outcome"} but keep running into ${problem.external || "the same blockers"}, we bring a simple plan you can execute and track.`;

    const benefits = [
      `Less ${problem.internal || "stress"} and more control`,
      `A clear path to ${success.win || "measurable wins"}`,
      `A plan that does not depend on luck`
    ];

    const steps = [
      plan.step1 || "Assess the current state",
      plan.step2 || "Create a clear plan",
      plan.step3 || "Execute and track weekly"
    ];

    const faq = [
      {
        q: "Who is this for?",
        a: `Best fit: ${hero.who || "a defined customer"} who wants ${hero.want || "a defined outcome"}.`
      },
      {
        q: "How fast can I see results?",
        a: "Usually you see clarity immediately and early results within weeks, depending on effort and constraints."
      },
      {
        q: "What do you need from me?",
        a: "A clear goal, access to the current process, and willingness to follow the plan for 30 days."
      }
    ];

    const testimonials = [
      { name: "Client A", quote: `We finally got ${success.win || "predictable results"} and stopped guessing.` },
      { name: "Client B", quote: `The plan was simple, the execution was clean, and we saw progress fast.` },
      { name: "Client C", quote: `Best part: less chaos, more confidence, and clear weekly tracking.` }
    ];

    const about = [
      `You are not hiring a hype machine.`,
      `You are hiring a guide who has ${guide.empathy || "been in the messy middle"} and brings ${guide.authority || "a proven method"}.`,
      `The goal is simple: ${success.win || "a measurable win"}.`
    ].join(" ");

    const primary = cta.primary || "Get started";
    const secondary = cta.secondary || "See how it works";

    return { h1, sub, benefits, steps, faq, testimonials, about, primary, secondary };
  }

  function buildLandingHTML(p){
    const pack = websitePack(p);
    const b = p.brand || {};
    const hero = b.hero || {};
    const problem = b.problem || {};
    const success = b.success || {};

    const escHtml = (s) => String(s || "")
      .replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;")
      .replaceAll('"',"&quot;").replaceAll("'","&#039;");

    const bullets = pack.benefits.map(x => `<li>${escHtml(x)}</li>`).join("");
    const steps = pack.steps.map((x,i) => `<div class="step"><div class="n">${i+1}</div><div class="txt">${escHtml(x)}</div></div>`).join("");
    const faqs = pack.faq.map(x => `
      <details class="faq">
        <summary>${escHtml(x.q)}</summary>
        <div class="a">${escHtml(x.a)}</div>
      </details>
    `).join("");
    const testi = pack.testimonials.map(x => `
      <div class="tcard">
        <div class="q">"${escHtml(x.quote)}"</div>
        <div class="n">${escHtml(x.name)}</div>
      </div>
    `).join("");

    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${escHtml(p.name || "Landing Page")}</title>
  <style>
    :root{
      --bg:#07070a; --bg2:#0e0f14; --card:#0f1118; --ink:#f5f7ff;
      --muted:#b1b6c8; --line:#23283a;
      --accent:#e11d48; --accent2:#ff3b6a;
      --radius:18px; --shadow: 0 18px 45px rgba(0,0,0,.55);
    }
    *{box-sizing:border-box}
    body{
      margin:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      color:var(--ink);
      background: radial-gradient(1100px 600px at 10% -10%, rgba(225,29,72,.18), transparent 60%),
                  radial-gradient(900px 700px at 90% -20%, rgba(255,59,106,.10), transparent 55%),
                  linear-gradient(180deg, var(--bg) 0%, #04040a 100%);
    }
    .wrap{max-width:1100px;margin:0 auto;padding:28px 16px 60px}
    .top{
      display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap;
      padding:14px 14px; border:1px solid rgba(255,255,255,.08);
      background: rgba(255,255,255,.03); border-radius: var(--radius); box-shadow: var(--shadow);
    }
    .brand{font-weight:900; letter-spacing:.2px}
    .hero{margin-top:18px; padding:22px; border:1px solid rgba(255,255,255,.08);
      background: rgba(255,255,255,.03); border-radius: var(--radius); box-shadow: var(--shadow);}
    h1{margin:0; font-size:42px; line-height:1.05}
    .sub{margin-top:10px; color:var(--muted); font-size:16px; max-width:72ch}
    .cta{margin-top:16px; display:flex; gap:10px; flex-wrap:wrap}
    .btn{
      padding:12px 14px; border-radius:14px; font-weight:900; cursor:pointer;
      border:1px solid rgba(255,255,255,.10); background: rgba(255,255,255,.05); color:var(--ink);
      text-decoration:none; display:inline-block;
    }
    .btn.primary{
      border-color: rgba(225,29,72,.45);
      background: linear-gradient(135deg, rgba(225,29,72,.95), rgba(255,59,106,.85));
      box-shadow: 0 16px 40px rgba(225,29,72,.20);
    }
    .grid{display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:12px}
    @media(max-width:980px){ .grid{grid-template-columns:1fr} h1{font-size:34px}}
    .card{
      padding:16px; border:1px solid rgba(255,255,255,.08);
      background: rgba(255,255,255,.03); border-radius: var(--radius); box-shadow: var(--shadow);
    }
    .h{font-weight:900}
    .p{color:var(--muted); margin-top:8px; line-height:1.5}
    ul{margin:10px 0 0 18px; color:var(--muted); line-height:1.6}
    .steps{display:flex; flex-direction:column; gap:10px; margin-top:10px}
    .step{display:flex; gap:10px; align-items:flex-start; padding:12px; border-radius:16px;
      border:1px solid rgba(255,255,255,.08); background: rgba(0,0,0,.18);}
    .n{width:28px; height:28px; border-radius:12px; display:grid; place-items:center; font-weight:900;
      background: rgba(225,29,72,.16); border:1px solid rgba(225,29,72,.35);}
    .txt{color:var(--muted)}
    .faq{border:1px solid rgba(255,255,255,.08); border-radius:16px; background: rgba(0,0,0,.18); padding:12px; margin-bottom:10px}
    summary{cursor:pointer; font-weight:900}
    .a{color:var(--muted); margin-top:8px; line-height:1.5}
    .tgrid{display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin-top:10px}
    @media(max-width:980px){ .tgrid{grid-template-columns:1fr} }
    .tcard{border:1px solid rgba(255,255,255,.08); border-radius:16px; background: rgba(0,0,0,.18); padding:12px}
    .q{color:var(--muted); line-height:1.5}
    .tcard .n{margin-top:10px; width:auto; height:auto; display:block; padding:6px 10px}
    .foot{margin-top:18px; color:rgba(177,182,200,.75); font-size:12px; text-align:center}
    .mini{margin-top:10px; color:rgba(177,182,200,.75); font-size:12px}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <div class="brand">${escHtml(p.name || "Landing Page")}</div>
      <div class="mini">Customer: ${escHtml(hero.who || "—")} | Goal: ${escHtml(hero.want || "—")}</div>
    </div>

    <div class="hero">
      <h1>${escHtml(pack.h1)}</h1>
      <div class="sub">${escHtml(pack.sub)}</div>
      <div class="cta">
        <a class="btn primary" href="#contact">${escHtml(pack.primary)}</a>
        <a class="btn" href="#plan">${escHtml(pack.secondary)}</a>
      </div>
      <div class="mini">Problem: ${escHtml(problem.external || "—")} | Success: ${escHtml(success.win || "—")}</div>
    </div>

    <div class="grid">
      <div class="card">
        <div class="h">What you get</div>
        <ul>${bullets}</ul>
      </div>
      <div class="card" id="plan">
        <div class="h">The plan</div>
        <div class="steps">${steps}</div>
      </div>

      <div class="card">
        <div class="h">About</div>
        <div class="p">${escHtml(pack.about)}</div>
      </div>

      <div class="card">
        <div class="h">FAQ</div>
        <div class="steps" style="margin-top:10px">${faqs}</div>
      </div>

      <div class="card" style="grid-column:1 / -1">
        <div class="h">Proof</div>
        <div class="tgrid">${testi}</div>
      </div>

      <div class="card" id="contact" style="grid-column:1 / -1">
        <div class="h">Next step</div>
        <div class="p">
          If you want ${escHtml(hero.want || "a clearer outcome")} without ${escHtml(problem.external || "the usual mess")},
          start with a simple conversation
        </div>
        <div class="cta">
          <a class="btn primary" href="mailto:you@example.com">Email me</a>
          <a class="btn" href="#">Add Calendly link</a>
        </div>
      </div>
    </div>

    <div class="foot">Generated by StoryBrand OS | Local-first | No lock-in</div>
  </div>
</body>
</html>`;
  }

  const scanUrl = $("#scanUrl");
  const scanBtn = $("#scanBtn");
  const scanStatus = $("#scanStatus");

  async function scanWebsite() {
    const url = (scanUrl?.value || "").trim();
    if (!url) {
      toast("Enter a website URL");
      return;
    }

    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      toast("URL must start with http:// or https://");
      return;
    }

    scanBtn.disabled = true;
    scanBtn.textContent = "Scanning...";
    scanStatus.textContent = "AI is analyzing the website...";

    try {
      const resp = await fetch("/api/storybrand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, notes: "" })
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || "Scan failed");
      }

      const data = await resp.json();
      
      if (data.success && data.data) {
        fillFormFromJSON(data.data, url);
        toast("Scan complete - form filled");
        scanStatus.textContent = "Scan complete";
      } else if (data.story_script) {
        parseAndFillForm(data.story_script, url);
        toast("Scan complete - parsed from text");
        scanStatus.textContent = "Scan complete";
      } else {
        throw new Error(data.error || "No data returned");
      }
    } catch (err) {
      console.error("Scan error:", err);
      toast("Scan failed: " + err.message);
      scanStatus.textContent = "Scan failed";
    } finally {
      scanBtn.disabled = false;
      scanBtn.textContent = "Scan Website";
    }
  }

  function fillFormFromJSON(data, url) {
    const hostname = url.replace(/^https?:\/\//, "").split("/")[0].replace("www.", "");
    
    updateActive(p => {
      p.name = hostname || p.name;
      p.brand.hero.who = data.character || "";
      p.brand.hero.want = data.want || "";
      p.brand.problem.external = data.external_problem || "";
      p.brand.problem.internal = data.internal_problem || "";
      p.brand.problem.philosophical = data.philosophical || "";
      p.brand.guide.empathy = data.empathy || "";
      p.brand.guide.authority = data.authority || "";
      p.brand.plan.step1 = data.step1 || "";
      p.brand.plan.step2 = data.step2 || "";
      p.brand.plan.step3 = data.step3 || "";
      p.brand.cta.primary = data.cta_primary || "";
      p.brand.cta.secondary = data.cta_secondary || "";
      p.brand.avoid.failure = data.failure || "";
      p.brand.success.win = data.success || "";
      p.notes = `AI Analysis from: ${url}\n\nScanned: ${new Date().toLocaleString()}`;
    });
    render();
  }

  function parseAndFillForm(analysis, url) {
    const hostname = url.replace(/^https?:\/\//, "").split("/")[0].replace("www.", "");
    updateActive(p => {
      p.name = hostname || p.name;
      p.notes = `AI Analysis from: ${url}\n\n${analysis.slice(0, 2000)}`;
    });
    render();
  }

  if (scanBtn) {
    scanBtn.onclick = scanWebsite;
  }

  if (scanUrl) {
    scanUrl.addEventListener("keypress", (e) => {
      if (e.key === "Enter") scanWebsite();
    });
  }

  tabs.forEach(t => {
    t.addEventListener("click", () => setTab(t.dataset.tab));
  });

  exportBtn.onclick = exportJSON;
  importFile.onchange = (e) => {
    if(e.target.files.length) importJSON(e.target.files[0]);
  };
  resetBtn.onclick = resetAll;

  search.addEventListener("input", () => {
    if(currentTab() === "vault") render();
  });

  const newProjectBtn = $("#newProjectBtn");
  if(newProjectBtn) newProjectBtn.onclick = () => {
    const p = makeProject();
    STATE.projects.push(p);
    STATE.activeId = p.id;
    save();
    setTab("builder");
  };

  setTab("builder");
})();
