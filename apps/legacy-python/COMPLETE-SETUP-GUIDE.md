# TonyOS Complete Setup Guide

## Download Your App

### Option 1: Download from Replit
1. In Replit, click the three dots (...) menu in the Files panel
2. Click "Download as zip"
3. Save the zip file to your computer
4. Extract the zip file

### Option 2: Use Git (if connected)
```bash
git clone [your-repo-url]
cd TonyOS
```

---

## Run TonyOS on Your Computer

### Prerequisites
1. **Python 3.10+** - Download from https://python.org
2. **Node.js 18+** - Download from https://nodejs.org (for desktop app)
3. **OpenAI API Key** - Get from https://platform.openai.com

### Step 1: Install Python Dependencies
```bash
cd TonyOS
pip install -r requirements.txt
```

### Step 2: Set Up Your API Key
Create a file called `.env` in the TonyOS folder:
```
OPENAI_API_KEY=your-api-key-here
```

### Step 3: Run the App
```bash
python app.py
```
Then open http://localhost:5000 in your browser.

---

## Run as Desktop App (Click to Open)

### Step 1: Install Electron Dependencies
```bash
cd TonyOS/electron
npm install
```

### Step 2: Start Desktop App
```bash
npm start
```

This opens TonyOS in its own window with a menu bar!

### Build Standalone Installer
- **Windows:** `npm run build:win` (creates .exe)
- **Mac:** `npm run build:mac` (creates .dmg)
- **Linux:** `npm run build:linux` (creates AppImage)

---

## Connect Google Sheets (One Sheet for All Apps)

All your TonyOS apps sync to ONE master Google Sheet with separate tabs for each app.

### Step 1: Create Your Google Sheet
1. Go to https://sheets.google.com
2. Create a new blank spreadsheet
3. Name it "TonyOS Master Data"

### Step 2: Add the Apps Script
1. In your sheet, click **Extensions > Apps Script**
2. Delete any existing code
3. Copy ALL the code from `TonyOS/docs/apps-script-endpoint.js`
4. Paste it into the Apps Script editor
5. Click **Save** (disk icon)

### Step 3: Deploy as Web App
1. Click **Deploy > New deployment**
2. Click the gear icon, select **Web app**
3. Set "Execute as" to **Me**
4. Set "Who has access" to **Anyone**
5. Click **Deploy**
6. Click **Authorize access** and allow permissions
7. Copy the Web App URL (starts with https://script.google.com/macros/s/...)

### Step 4: Connect TonyOS
1. Open TonyOS in your browser
2. Click the connection indicator (bottom-right corner)
3. Paste your Web App URL
4. Check "Enable Google Sheets sync"
5. Click Save

### What Gets Synced
Your Google Sheet will automatically create these tabs:
- **Journal** - All journal entries with mood, gratitude, reflections
- **CRM_Contacts** - All your connections and contacts
- **CRM_Activity** - Outreach activities and follow-ups
- **Budget** - Income and expense transactions
- **Daily** - Daily command center entries
- **Jobs** - Job search tracking

---

## Folder Structure

```
TonyOS/
├── app.py                  # Main Flask server
├── requirements.txt        # Python dependencies
├── .env                    # Your API keys (create this)
│
├── static/                 # JavaScript and CSS
│   ├── style.css          # Main styles
│   ├── sheets-sync.js     # Google Sheets sync client
│   ├── connection-status.js # Live/Offline indicator
│   └── *.js               # Other app scripts
│
├── templates/              # HTML pages
│   ├── index.html         # Landing page
│   ├── journal.html       # Journal app
│   ├── crm.html           # CRM dashboard
│   ├── daily.html         # Daily command center
│   ├── jobs.html          # Job search tracker
│   ├── memory.html        # Budget tracker
│   └── *.html             # Other tools
│
├── electron/               # Desktop app files
│   ├── main.js            # Electron main process
│   ├── package.json       # Desktop app config
│   └── icons/             # Put your logo here
│
├── docs/                   # Documentation
│   └── apps-script-endpoint.js  # Google Apps Script code
│
└── COMPLETE-SETUP-GUIDE.md # This file
```

---

## Apps and What They Do

| App | URL | Syncs To | Purpose |
|-----|-----|----------|---------|
| **Journal** | /journal | Journal tab | Daily entries, mood, gratitude, reflections |
| **CRM** | /crm | CRM_Contacts, CRM_Activity | Contact management, outreach tracking |
| **Daily Command** | /daily | Daily tab | One win, pressure, next action |
| **Jobs** | /jobs | Jobs tab | Job search tracking, checklists |
| **Budget** | /memory | Budget tab | Income/expense tracking |
| **StoryBrand** | /storybrand | Local | Brand messaging builder |
| **Chat** | /chat | - | AI chat with mood modes |
| **Research** | /research | - | Website analysis |

---

## Troubleshooting

### "Module not found" error
```bash
pip install -r requirements.txt
```

### "Port 5000 already in use"
Another app is using port 5000. Either:
- Close that app, OR
- Run: `python app.py --port 5001`

### Google Sheets not syncing
1. Check the connection indicator (bottom-right)
2. Click it to open settings
3. Make sure URL is correct and sync is enabled
4. Check that Apps Script is deployed as "Anyone can access"

### Desktop app won't start
1. Make sure Python is installed and in PATH
2. Check that all dependencies are installed
3. Look at the terminal for error messages

---

## Need Help?

All data is saved:
- **Locally** in the PostgreSQL database (or SQLite)
- **To Google Sheets** if sync is enabled

You can always:
1. Export data from the apps
2. Check your Google Sheet for backups
3. Look in the database for stored data
