# TonyOS Desktop App

Turn TonyOS into a standalone desktop application you can click and run!

## Prerequisites

Before building, make sure you have installed:

1. **Node.js** (version 18 or higher) - Download from https://nodejs.org
2. **Python 3** with pip - Download from https://python.org
3. **Your OpenAI API Key** set in environment

## Quick Start (Run Without Building)

If you just want to run TonyOS as a desktop app without creating an installer:

1. Open a terminal in the `TonyOS/electron` folder
2. Run these commands:

```bash
# Install dependencies
npm install

# Start the desktop app
npm start
```

This will launch TonyOS in its own window!

## Building a Standalone Installer

### For Windows (.exe installer)

```bash
cd TonyOS/electron
npm install
npm run build:win
```

The installer will be in `TonyOS/electron/dist/`

### For Mac (.dmg)

```bash
cd TonyOS/electron
npm install
npm run build:mac
```

### For Linux (.AppImage)

```bash
cd TonyOS/electron
npm install
npm run build:linux
```

## Adding Your Logo

To use your own logo/icon:

1. Create icons in these sizes:
   - `icon.png` - 512x512 pixels (for Linux)
   - `icon.ico` - 256x256 pixels (for Windows)
   - `icon.icns` - 512x512 pixels (for Mac)

2. Place them in `TonyOS/electron/icons/`

3. Rebuild the app

### Creating Icons

You can use online tools like:
- https://convertio.co/png-ico/ (for Windows .ico)
- https://cloudconvert.com/png-to-icns (for Mac .icns)

## What Gets Packaged

The desktop app includes:
- All TonyOS Python code
- All templates and static files
- Your StoryBrand projects (local storage)
- All tools (Journal, CRM, Chat, etc.)

## Environment Setup

Before running, create a `.env` file in the TonyOS folder with:

```
OPENAI_API_KEY=your-api-key-here
```

## Troubleshooting

### "Python not found"
Make sure Python 3 is installed and in your system PATH.

### "Port 5000 already in use"
Close any other TonyOS instances or apps using port 5000.

### App won't start
Check that all Python dependencies are installed:
```bash
cd TonyOS
pip install -r requirements.txt
```

## Folder Structure

```
TonyOS/
├── electron/
│   ├── main.js          # Electron main process
│   ├── package.json     # Electron config
│   └── icons/           # Your app icons
├── static/              # CSS, JS, images
├── templates/           # HTML templates
├── app.py              # Flask server
└── requirements.txt    # Python dependencies
```

## Support

For issues, check that:
1. Python 3 is installed
2. Node.js 18+ is installed
3. All dependencies are installed
4. Your .env file has the correct API keys
