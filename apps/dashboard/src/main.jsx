import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Route, Routes } from "react-router-dom";

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

function CRM() {
const [lead, setLead] = useState("");
const [stage, setStage] = useState("Discovery");
const [nextAction, setNextAction] = useState("");
const [owner, setOwner] = useState("Dollar");
const [rows, setRows] = useState([]);

useEffect(() => {
const saved = localStorage.getItem("tonyos_crm_rows");
if (saved) setRows(JSON.parse(saved));
}, []);

useEffect(() => {
localStorage.setItem("tonyos_crm_rows", JSON.stringify(rows));
}, [rows]);

const addLead = () => {
if (!lead.trim()) return;
setRows(prev => [{ lead, stage, next: nextAction || "Follow up", owner }, ...prev]);
setLead("");
setStage("Discovery");
setNextAction("");
};

const clearAll = () => {
setRows([]);
localStorage.removeItem("tonyos_crm_rows");
};

return (
<div>
<h2>CRM</h2>
<div style={{ display: "grid", gap: 8, maxWidth: 700, marginBottom: 12 }}>
<input placeholder="Lead name/company" value={lead} onChange={e => setLead(e.target.value)} />
<input placeholder="Stage" value={stage} onChange={e => setStage(e.target.value)} />
<input placeholder="Next Action" value={nextAction} onChange={e => setNextAction(e.target.value)} />
<input placeholder="Owner" value={owner} onChange={e => setOwner(e.target.value)} />
<div style={{ display: "flex", gap: 8 }}>
<button onClick={addLead}>+ New Lead</button>
<button onClick={clearAll}>Clear All</button>
</div>
</div>
<table border="1" cellPadding="8" style={{ borderCollapse: "collapse", width: "100%" }}>
<thead><tr><th>Lead</th><th>Stage</th><th>Next Action</th><th>Owner</th></tr></thead>
<tbody>
{rows.map((r, i) => (
<tr key={i}><td>{r.lead}</td><td>{r.stage}</td><td>{r.next}</td><td>{r.owner}</td></tr>
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
setOutput(text);
setCopied(false);
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
{output && (
<div style={{ marginTop: 16, border: "1px solid #ddd", borderRadius: 8, padding: 12 }}>
<strong>Output:</strong><p style={{ marginTop: 8 }}>{output}</p>
</div>
)}
</div>
);
}

function Scanner() {
const [company, setCompany] = useState("");
const [need, setNeed] = useState(1);
const [budget, setBudget] = useState(1);
const [urgency, setUrgency] = useState(1);
const [leads, setLeads] = useState([]);

const addLead = () => {
if (!company.trim()) return;
const score = Number(need) + Number(budget) + Number(urgency);
setLeads(prev => [{ company, need, budget, urgency, score }, ...prev]);
setCompany(""); setNeed(1); setBudget(1); setUrgency(1);
};

const exportCsv = () => {
if (!leads.length) return;
const header = ["Company","Need","Budget","Urgency","Score"];
const rows = leads.map(l => [l.company,l.need,l.budget,l.urgency,l.score]);
const csv = [header, ...rows].map(r => r.join(",")).join("\n");
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
<label>Need (1-5): <input type="number" min="1" max="5" value={need} onChange={e => setNeed(e.target.value)} /></label>
<label>Budget (1-5): <input type="number" min="1" max="5" value={budget} onChange={e => setBudget(e.target.value)} /></label>
<label>Urgency (1-5): <input type="number" min="1" max="5" value={urgency} onChange={e => setUrgency(e.target.value)} /></label>
<div style={{ display: "flex", gap: 8 }}>
<button onClick={addLead}>Add + Score Lead</button>
<button onClick={exportCsv} disabled={!leads.length}>Export CSV</button>
</div>
</div>
<table border="1" cellPadding="8" style={{ marginTop: 16, borderCollapse: "collapse", width: "100%" }}>
<thead><tr><th>Company</th><th>Need</th><th>Budget</th><th>Urgency</th><th>Total Score</th></tr></thead>
<tbody>
{leads.map((l, i) => (
<tr key={i}><td>{l.company}</td><td>{l.need}</td><td>{l.budget}</td><td>{l.urgency}</td><td>{l.score}</td></tr>
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
return (
<BrowserRouter>
<div style={{ fontFamily: "sans-serif", padding: 24 }}>
<h1>Tony OS Unified Dashboard</h1>
<nav style={{ display: "flex", gap: 12, marginBottom: 16 }}>
<Link to="/">Home</Link>
<Link to="/crm">CRM</Link>
<Link to="/storybrand">StoryBrand</Link>
<Link to="/scanner">Market Scanner</Link>
<Link to="/tools">Tools</Link>
</nav>
<Routes>
<Route path="/" element={<Home />} />
<Route path="/crm" element={<CRM />} />
<Route path="/storybrand" element={<StoryBrand />} />
<Route path="/scanner" element={<Scanner />} />
<Route path="/tools" element={<Tools />} />
</Routes>
</div>
</BrowserRouter>
);
}

createRoot(document.getElementById("root")).render(<App />);
