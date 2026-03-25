# TonyOS Command Center

Modern Replit-ready dashboard shell for TonyOS modules.

## Tech stack
- Node.js + Express backend
- Vanilla HTML/CSS/JS frontend
- Replit auto-run configuration

## Project structure
```
/tonyos-dashboard
├── public/
│   ├── index.html      # Dashboard UI
│   ├── style.css       # Dark SaaS styling
│   └── app.js          # Live KPI + activity logic
├── server.js           # Express server serving /public
├── package.json        # npm metadata + start script
├── .replit             # Replit run command
├── replit.nix          # Node environment declaration
└── README.md
```

## Getting started
```bash
npm install
npm start
```
Then open https://localhost:3000 (Replit will provide a hosted URL automatically).

## Extending the dashboard
- Add new KPI cards by updating `index.html` + `app.js`
- Pipe real CRM or TonyOS data into the KPI updater
- Push activity events from webhooks or automations
- Layer in modules like Lead Tracker, CRM importer, outreach scheduler, etc.

This project is production-ready for Replit: clone it, drop it into a Repl, hit **Run**, and you have a live dashboard shell.
