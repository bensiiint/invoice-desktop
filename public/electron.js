const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const fs = require('fs');

let mainWindow;

function createWindow() {
  // Create the browser window with optimized settings
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false, // Better security and performance
      contextIsolation: true,  // Better security and performance
      preload: path.join(__dirname, 'preload.js'),
      webSecurity: true,
      // Performance optimizations
      experimentalFeatures: false,
      enableRemoteModule: false,
    },
    titleBarStyle: 'default',
    show: false, // Don't show until ready-to-show (prevents flash)
    backgroundColor: '#ffffff', // Prevent white flash
  });

  // Performance improvement: Always prefer build over dev server
  const buildPath = path.join(__dirname, '../build/index.html');
  const hasBuild = fs.existsSync(buildPath);
  
  let startUrl;
  if (hasBuild) {
    // Use build files for better performance
    startUrl = `file://${buildPath}`;
    console.log('Loading from optimized build files');
  } else if (isDev) {
    // Fallback to dev server only if no build exists
    startUrl = 'http://localhost:3000';
    console.log('Loading from development server');
  } else {
    // Production fallback
    startUrl = `file://${buildPath}`;
  }
  
  console.log('Loading URL:', startUrl);
  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Only open dev tools in development and when no build exists
    if (isDev && !hasBuild && process.env.NODE_ENV === 'development') {
      mainWindow.webContents.openDevTools();
    }
  });

  // Handle load errors gracefully
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.log('Failed to load:', validatedURL, errorDescription);
    if (validatedURL.includes('localhost') && hasBuild) {
      console.log('Falling back to build files...');
      mainWindow.loadURL(`file://${buildPath}`);
    }
  });

  // Performance: Remove default menu in production
  if (!isDev) {
    mainWindow.setMenuBarVisibility(false);
  }

  // Emitted when the window is closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create optimized application menu
  createMenu();
}

function createMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Invoice',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('menu-new-invoice');
          }
        },
        { type: 'separator' },
        {
          label: 'Save Invoice',
          accelerator: 'CmdOrCtrl+S',
          click: () => {
            mainWindow.webContents.send('menu-save-invoice');
          }
        },
        {
          label: 'Load Invoice',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            mainWindow.webContents.send('menu-load-invoice');
          }
        },
        { type: 'separator' },
        {
          label: 'Export PDF',
          accelerator: 'CmdOrCtrl+E',
          click: () => {
            mainWindow.webContents.send('menu-export-pdf');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        ...(isDev ? [{ role: 'toggleDevTools' }] : []),
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'close' }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About KMTI Quotation App',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About',
              message: 'KMTI Quotation App',
              detail: 'Version 1.0.0\nBuilt with Electron & React\n\nDeveloped for KUSAKABE & MAENO TECH., INC'
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// Optimize app initialization
app.whenReady().then(() => {
  createWindow();

  // Performance: Enable hardware acceleration
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-zero-copy');
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent navigation to external links
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    require('electron').shell.openExternal(navigationUrl);
  });

  // Performance: Disable node integration in new windows
  contents.on('will-attach-webview', (event, webPreferences, params) => {
    delete webPreferences.preload;
    webPreferences.nodeIntegration = false;
  });
});
