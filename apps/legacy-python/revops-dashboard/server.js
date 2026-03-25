import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let deals = [
  { company: "PharmaCo", stage: "Qualified", value: 120000, probability: 0.3 },
  { company: "NutraLabs", stage: "Proposal", value: 250000, probability: 0.6 },
  { company: "AeroParts", stage: "Negotiation", value: 400000, probability: 0.8 }
];

app.get("/api/deals", (req, res) => {
  res.json(deals);
});

app.post("/api/deals", (req, res) => {
  deals.push(req.body);
  res.json({ success: true });
});

const PORT = process.env.REVOPS_PORT || 3002;
app.listen(PORT, "0.0.0.0", () =>
  console.log(`RevOps Command Center running on port ${PORT}`)
);
