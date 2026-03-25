const BASE = window.location.port === "8080" ? "" : "http://localhost:8080";

export async function getTree() {
  const r = await fetch(`${BASE}/api/tree`);
  return r.json();
}

export async function getFile(filePath) {
  const r = await fetch(`${BASE}/api/file?path=${encodeURIComponent(filePath)}`);
  return r.json();
}

export async function saveFile(filePath, content) {
  const r = await fetch(`${BASE}/api/file`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: filePath, content })
  });
  return r.json();
}

export async function mkdir(dirPath) {
  const r = await fetch(`${BASE}/api/mkdir`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: dirPath })
  });
  return r.json();
}

export async function newFile(filePath) {
  const r = await fetch(`${BASE}/api/newfile`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path: filePath })
  });
  return r.json();
}

export function wsUrl() {
  return "ws://localhost:8080/ws";
}
