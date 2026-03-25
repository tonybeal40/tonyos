# TonyOS - Local Setup Guide

## Requirements
- Python 3.8 or higher
- pip (Python package manager)

## Quick Start (Double-Click)

**Windows:** Double-click `start.bat`
**Mac/Linux:** Double-click `start.sh` (or run `chmod +x start.sh && ./start.sh`)

## Manual Installation

1. **Extract the zip file** and navigate to the TonyOS folder:
   ```bash
   cd TonyOS
   ```

2. **Install dependencies**:
   ```bash
   pip install flask openai python-dotenv
   ```

3. **Create a `.env` file** in the TonyOS folder with your API key:
   ```
   OPENAI_API_KEY=your-openai-api-key-here
   ```

4. **Run the app**:
   ```bash
   python app.py
   ```

5. **Open your browser** and go to:
   ```
   http://localhost:5000
   ```

## Features

- **AI Chat Console** - Chat with mood selector and Truth Mode
- **StoryBrand OS** - 7-part framework builder with vault and exports
- **Website Analyzer** - Research and competitive analysis
- **Job Search HQ** - Track roles, actions, and interviews
- **Money and Budget** - Two-week budget snapshot
- **Website Builder** - Landing page drafts with live preview
- **Tools** - Execution shortcuts for offers and outreach

## Google Sheets Integration (Optional)

The Money and Budget tool can sync with Google Sheets for persistent transaction tracking:

1. Create a new Google Sheet with a tab named "transactions"
2. Add headers in row 1: `createdAt | amount | category | merchant | note | type | token`
3. Open Extensions > Apps Script
4. Paste the code from `google-sheets-code.gs`
5. Change `API_TOKEN` to a random secret string
6. Deploy as Web App (Execute as: Me, Access: Anyone)
7. Copy the web app URL
8. Edit `templates/memory.html` and update `API_URL` and `API_TOKEN`

Without this setup, transactions save locally in your browser.

## Troubleshooting

**"Missing OPENAI_API_KEY" error:**
Make sure your `.env` file exists and contains a valid API key.

**Port already in use:**
Change the port in `app.py` or kill the process using port 5000.

**Module not found:**
Run `pip install flask openai python-dotenv` again.

## Getting an OpenAI API Key

1. Go to https://platform.openai.com/api-keys
2. Sign in or create an account
3. Click "Create new secret key"
4. Copy the key and paste it in your `.env` file
