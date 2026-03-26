const API_BASE = "http://localhost:4000";

export function getToken() {
return localStorage.getItem("tonyos_token");
}

export function setToken(token) {
localStorage.setItem("tonyos_token", token);
}

export function clearToken() {
localStorage.removeItem("tonyos_token");
}

export async function api(path, options = {}) {
const token = getToken();
const headers = {
"Content-Type": "application/json",
...(options.headers || {}),
...(token ? { Authorization: `Bearer ${token}` } : {})
};

const res = await fetch(`${API_BASE}${path}`, {
...options,
headers
});

if (!res.ok) {
const err = await res.json().catch(() => ({}));
throw new Error(err.error || `Request failed: ${res.status}`);
}

return res.json();
}
