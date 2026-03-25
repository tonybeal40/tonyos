const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

let mainWindow;
let pythonProcess;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    icon: path.join(__dirname, 'icons', 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    },
    backgroundColor: '#0f172a',
    titleBarStyle: 'default',
    show: false
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.loadURL('http://127.0.0.1:5000');

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuTemplate = [
    {
      label: 'TonyOS',
      submenu: [
        { label: 'Home', click: () => mainWindow.loadURL('http://127.0.0.1:5000') },
        { type: 'separator' },
        { label: 'Reload', accelerator: 'CmdOrCtrl+R', click: () => mainWindow.reload() },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'Tools',
      submenu: [
        { label: 'Journal', click: () => mainWindow.loadURL('http://127.0.0.1:5000/journal') },
        { label: 'Chat', click: () => mainWindow.loadURL('http://127.0.0.1:5000/chat') },
        { label: 'Daily Command', click: () => mainWindow.loadURL('http://127.0.0.1:5000/daily') },
        { label: 'CRM', click: () => mainWindow.loadURL('http://127.0.0.1:5000/crm') },
        { label: 'StoryBrand', click: () => mainWindow.loadURL('http://127.0.0.1:5000/storybrand') },
        { label: 'Jobs', click: () => mainWindow.loadURL('http://127.0.0.1:5000/jobs') }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);
}

function getAppPaths() {
  if (app.isPackaged) {
    const appDir = path.join(process.resourcesPath, 'app');
    return {
      appPath: path.join(appDir, 'app.py'),
      cwd: appDir
    };
  } else {
    return {
      appPath: path.join(__dirname, '..', 'app.py'),
      cwd: path.join(__dirname, '..')
    };
  }
}

function startPythonServer() {
  const pythonPath = process.platform === 'win32' ? 'python' : 'python3';
  const { appPath, cwd } = getAppPaths();
  
  console.log(`[TonyOS] Starting server from: ${appPath}`);
  console.log(`[TonyOS] Working directory: ${cwd}`);
  
  pythonProcess = spawn(pythonPath, [appPath], {
    cwd: cwd,
    env: { ...process.env }
  });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`[TonyOS Server] ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[TonyOS Server] ${data}`);
  });

  pythonProcess.on('error', (err) => {
    console.error('Failed to start Python server:', err);
  });
}

function waitForServer(callback, retries = 30) {
  const http = require('http');
  
  const check = () => {
    http.get('http://127.0.0.1:5000/api/health', (res) => {
      if (res.statusCode === 200) {
        callback();
      } else if (retries > 0) {
        setTimeout(check, 500);
        retries--;
      }
    }).on('error', () => {
      if (retries > 0) {
        setTimeout(check, 500);
        retries--;
      }
    });
  };
  
  check();
}

app.whenReady().then(() => {
  startPythonServer();
  waitForServer(createWindow);
});

app.on('window-all-closed', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    waitForServer(createWindow);
  }
});

app.on('before-quit', () => {
  if (pythonProcess) {
    pythonProcess.kill();
  }
});
