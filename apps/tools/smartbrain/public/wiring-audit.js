export function auditButtons(rootDoc){
  const buttons = [...rootDoc.querySelectorAll("button, [role='button'], a.btn, .btn")];
  const bad = [];

  for(const el of buttons){
    const txt = (el.innerText || el.getAttribute("aria-label") || el.id || el.className || "").trim();
    const hasOnclickProp = typeof el.onclick === "function";
    const hasDataAction = el.hasAttribute("data-action") || el.hasAttribute("data-route");

    if(!hasOnclickProp && !hasDataAction){
      bad.push(`UNWIRED: "${txt || "(no label)"}"  selector: ${cssPath(el)}`);
    }
  }

  if(bad.length === 0){
    return "Audit complete: no obvious dead buttons found";
  }

  return [
    `Audit found ${bad.length} likely dead buttons`,
    "",
    ...bad.slice(0, 200),
    "",
    "Fix pattern: add data-action and handle it in app.js wire()"
  ].join("\n");
}

function cssPath(el){
  if(!el) return "";
  const parts = [];
  while(el && el.nodeType === 1 && parts.length < 6){
    let part = el.tagName.toLowerCase();
    if(el.id) { part += `#${el.id}`; parts.unshift(part); break; }
    const cls = (el.className || "").toString().trim().split(/\s+/).filter(Boolean).slice(0,2);
    if(cls.length) part += "." + cls.join(".");
    parts.unshift(part);
    el = el.parentElement;
  }
  return parts.join(" > ");
}
