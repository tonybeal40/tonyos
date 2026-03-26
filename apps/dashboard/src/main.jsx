import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { api, clearToken, getToken, setToken } from "./api";

const cardStyle = {
border: "1px solid #ddd",
borderRadius: 12,
padding: 16,
width: 240,
textDecoration: "none",
color: "inherit",
background: "#fff"
};

function Home() {
const cards = [
{ to: "/crm", title: "CRM", desc: "Pipeline, leads, follow-up" },
{ to: "/storybrand", title: "StoryBrand", desc: "Messaging + offer clarity" },
{ to: "/scanner", title: "Market Scanner", desc: "Find and score opportunities" },
{ to: "/tools", title: "Tools", desc: "Codebench + SmartBrain" }
];
return (
<div>
<h2>Operator Dashboard</h2>
<div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
{cards.map(c => (
<Link key={c.to} to={c.to} style={cardStyle}>
<h3 style={{ margin: "0 0 8px 0" }}>{c.title}</h3>
<p style={{ margin: 0, color: "#555" }}>{c.desc}</p>
</Link>
))}
</div>
</div>
);
}

function AuthGate({ onAuth }) {
const [mode, setMode] = useState("login");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [error, setError] = useState("");

const submit = async () => {
try {
setError("");
const endpoint = mode === "login" ? "/auth/login" : "/auth/register";
const payload = mode === "register" ? { email, password, role: "owner" } : { email, password };
const result = await api(endpoint, { method: "POST", body: JSON.stringify(payload) });
setToken(result.token);
onAuth(result.user);
} catch (e) {
setError(e.message);
}
};

return (
<div style={{ maxWidth: 420, margin: "40px auto", fontFamily: "sans-serif" }}>
<h2>{mode === "login" ? "Login" : "Register"} to Tony OS</h2>
<div style={{ display: "grid", gap: 8 }}>
<input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
<input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
<button onClick={submit}>{mode === "login" ? "Login" : "Register"}</button>
<button onClick={() => setMode(mode === "login" ? "register" : "login")}>
Switch to {mode === "login" ? "Register" : "Login"}
</button>
</div>
{error && <p style={{ color: "crimson" }}>{error}</p>}
</div>
);
}

function CRM() {
const [lead, setLead] = useState("");
const [stage, setStage] = useState("Discovery");
const [nextAction, setNextAction] = useState("");
const [rows, setRows] = useState([]);
const [error, setError] = useState("");

const load = async () => {
try {
setError("");
const data = await api("/leads");
setRows(data);
} catch (e) {
setError(e.message);
}
};

useEffect(() => { load(); }, []);

const addLead = async () => {
try {
setError("");
if (!lead.trim()) return;
await api("/leads", {
method: "POST",
body: JSON.stringify({ company: lead, stage, next_action: nextAction || "Follow up" })
});
setLead(""); setStage("Discovery"); setNextAction(""); load();
} catch (e) {
setError(e.message);
}
};

return (
<div>
<h2>CRM</h2>
<div style={{ display: "grid", gap: 8, maxWidth: 700, marginBottom: 12 }}>
<input placeholder="Lead name/company" value={lead} onChange={e => setLead(e.target.value)} />
<input placeholder="Stage" value={stage} onChange={e => setStage(e.target.value)} />
<input placeholder="Next Action" value={nextAction} onChange={e => setNextAction(e.target.value)} />
<button onClick={addLead}>+ New Lead</button>
</div>
{error && <p style={{ color: "crimson" }}>{error}</p>}
<table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
<thead><tr><th>Lead</th><th>Stage</th><th>Next Action</th><th>Created</th></tr></thead>
<tbody>
{rows.map(r => (
<tr key={r.id}><td>{r.company}</td><td>{r.stage}</td><td>{r.next_action}</td><td>{r.created_at}</td></tr>
))}
</tbody>
</table>
</div>
);
}

function StoryBrand() {
const [audience, setAudience] = useState("");
const [problem, setProblem] = useState("");
const [promise, setPromise] = useState("");
const [cta, setCta] = useState("");
const [output, setOutput] = useState("");
const [copied, setCopied] = useState(false);

const generate = () => {
const text = `For ${audience || "[Audience]"}, struggling with ${problem || "[Problem]"}, we provide ${promise || "[Promise]"} so they can win faster without confusion. Next step: ${cta || "[CTA]"}.`;
setOutput(text); setCopied(false);
};

const copyOutput = async () => {
if (!output) return;
await navigator.clipboard.writeText(output);
setCopied(true);
setTimeout(() => setCopied(false), 1200);
};

return (
<div>
<h2>StoryBrand</h2>
<div style={{ display: "grid", gap: 8, maxWidth: 700 }}>
<input placeholder="Audience" value={audience} onChange={e => setAudience(e.target.value)} />
<input placeholder="Problem" value={problem} onChange={e => setProblem(e.target.value)} />
<input placeholder="Promise" value={promise} onChange={e => setPromise(e.target.value)} />
<input placeholder="Call to Action" value={cta} onChange={e => setCta(e.target.value)} />
<div style={{ display: "flex", gap: 8 }}>
<button onClick={generate}>Generate Message</button>
<button onClick={copyOutput} disabled={!output}>{copied ? "Copied!" : "Copy Output"}</button>
</div>
</div>
{output && <div style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 8, padding: 12 }}><strong>Output:</strong><p>{output}</p></div>}
</div>
);
}

function Scanner() {
const [company, setCompany] = useState("");
const [need, setNeed] = useState(1);
const [budget, setBudget] = useState(1);
const [urgency, setUrgency] = useState(1);
const [rows, setRows] = useState([]);
const [error, setError] = useState("");

const load = async () => {
try {
setError("");
const data = await api("/scanner-leads");
setRows(data);
} catch (e) {
setError(e.message);
}
};

useEffect(() => { load(); }, []);

const addLead = async () => {
try {
setError("");
if (!company.trim()) return;
await api("/scanner-leads", { method: "POST", body: JSON.stringify({ company, need, budget, urgency }) });
setCompany(""); setNeed(1); setBudget(1); setUrgency(1); load();
} catch (e) {
setError(e.message);
}
};

const exportCsv = () => {
if (!rows.length) return;
const header = ["Company","Need","Budget","Urgency","Score","Created"];
const data = rows.map(r => [r.company,r.need,r.budget,r.urgency,r.score,r.created_at]);
const csv = [header, ...data].map(r => r.join(",")).join("\n");
const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url; a.download = "market-scanner-leads.csv"; a.click();
URL.revokeObjectURL(url);
};

return (
<div>
<h2>Market Scanner</h2>
<div style={{ display: "grid", gap: 8, maxWidth: 700 }}>
<input placeholder="Company name" value={company} onChange={e => setCompany(e.target.value)} />
<label>Need (1-5): <input type="number" min="1" max="5" value={need} onChange={e => setNeed(Number(e.target.value))} /></label>
<label>Budget (1-5): <input type="number" min="1" max="5" value={budget} onChange={e => setBudget(Number(e.target.value))} /></label>
<label>Urgency (1-5): <input type="number" min="1" max="5" value={urgency} onChange={e => setUrgency(Number(e.target.value))} /></label>
<div style={{ display: "flex", gap: 8 }}>
<button onClick={addLead}>Add + Score Lead</button>
<button onClick={exportCsv} disabled={!rows.length}>Export CSV</button>
</div>
</div>
{error && <p style={{ color: "crimson" }}>{error}</p>}
<table border="1" cellPadding="8" style={{ marginTop: 16, borderCollapse: "collapse", width: "100%" }}>
<thead><tr><th>Company</th><th>Need</th><th>Budget</th><th>Urgency</th><th>Score</th><th>Created</th></tr></thead>
<tbody>
{rows.map(r => (
<tr key={r.id}><td>{r.company}</td><td>{r.need}</td><td>{r.budget}</td><td>{r.urgency}</td><td>{r.score}</td><td>{r.created_at}</td></tr>
))}
</tbody>
</table>
</div>
);
}

function Tools() {
return <h2>Tools module coming online</h2>;
}

function App() {
const [user, setUser] = useState(null);

useEffect(() => {
(async () => {
try {
if (!getToken()) return;
const result = await api("/me");
setUser(result.user);
} catch {
clearToken();
setUser(null);
}
})();
}, []);

const logout = () => { clearToken(); setUser(null); };

if (!user) return <AuthGate onAuth={setUser} />;

return (
<BrowserRouter>
<div style={{ fontFamily: "sans-serif", padding: 24 }}>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
<h1>Tony OS Unified Dashboard</h1>
<div><span style={{ marginRight: 12 }}>{user.email} ({user.role})</span><button onClick={logout}>Logout</button></div>
</div>
<nav style={{ display: "flex", gap: 12, marginBottom: 16 }}>
<Link to="/">Home</Link><Link to="/crm">CRM</Link><Link to="/storybrand">StoryBrand</Link><Link to="/scanner">Market Scanner</Link><Link to="/tools">Tools</Link>
</nav>
<Routes>
<Route path="/" element={<Home />} />
<Route path="/crm" element={<CRM />} />
<Route path="/storybrand" element={<StoryBrand />} />
<Route path="/scanner" element={<Scanner />} />
<Route path="/tools" element={<Tools />} />
<Route path="*" element={<Navigate to="/" replace />} />
</Routes>
</div>
</BrowserRouter>
);
}

createRoot(document.getElementById("root")).render(<App />);
