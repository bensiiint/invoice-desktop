const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
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

// ==================================================
// WINDOWS NATIVE PRINT SYSTEM IMPLEMENTATION
// ==================================================

// Helper function to convert mm to inches (Windows print system uses inches)
function mmToInches(mm) {
  return mm / 25.4;
}

// Helper function to get print margins in the correct format
function getPrintMargins(options) {
  if (options.margins && options.margins.marginType === 'custom') {
    return {
      marginType: 'custom',
      top: mmToInches(options.margins.top || 5),
      bottom: mmToInches(options.margins.bottom || 5),
      left: mmToInches(options.margins.left || 5),
      right: mmToInches(options.margins.right || 5)
    };
  }
  
  // Default margins
  return {
    marginType: 'default'
  };
}

// IPC Handler: Windows Native Print Dialog
ipcMain.handle('native-print', async (event, options = {}) => {
  try {
    console.log('Native print requested with options:', options);
    
    // Print options for Windows native dialog
    const printOptions = {
      silent: options.silent || false, // false = show Windows print dialog
      printBackground: options.printBackground !== false, // default true
      color: options.color !== false, // default true
      margins: getPrintMargins(options),
      landscape: options.landscape || false,
      scaleFactor: options.scaleFactor || 100,
      pagesPerSheet: options.pagesPerSheet || 1,
      collate: options.collate !== false,
      copies: options.copies || 1,
      header: options.showHeaders ? options.header : '',
      footer: options.showFooters ? options.footer : '',
      pageSize: options.pageSize || 'A4'
    };

    console.log('Processed print options:', printOptions);

    // Use Windows native print dialog
    const result = await mainWindow.webContents.print(printOptions);
    
    if (result) {
      console.log('Print job sent successfully');
      return { success: true, message: 'Document sent to printer successfully' };
    } else {
      console.log('Print job was cancelled by user');
      return { success: false, message: 'Print cancelled by user' };
    }
    
  } catch (error) {
    console.error('Native print failed:', error);
    return { 
      success: false, 
      error: error.message,
      message: 'Failed to print document. Please try again.' 
    };
  }
});

// IPC Handler: Windows Native PDF Generation
ipcMain.handle('native-print-to-pdf', async (event, options = {}) => {
  try {
    console.log('Native PDF generation requested with options:', options);
    
    // PDF generation options using Windows native PDF engine
    const pdfOptions = {
      marginsType: 1, // Custom margins
      pageSize: options.pageSize || 'A4',
      printBackground: options.printBackground !== false,
      printSelectionOnly: false,
      landscape: options.landscape || false,
      scaleFactor: options.scaleFactor || 100,
      headerFooter: {
        title: options.title || '',
        url: ''
      }
    };

    // Set custom margins if provided
    if (options.margins && options.margins.marginType === 'custom') {
      pdfOptions.margins = {
        top: mmToInches(options.margins.top || 5),
        bottom: mmToInches(options.margins.bottom || 5),
        left: mmToInches(options.margins.left || 5),
        right: mmToInches(options.margins.right || 5)
      };
    }

    console.log('Processed PDF options:', pdfOptions);

    // Generate PDF using Electron's native PDF engine (uses Windows printing system)
    const pdfBuffer = await mainWindow.webContents.printToPDF(pdfOptions);
    
    // Show save dialog using Windows native file dialog
    const defaultFilename = options.filename || `KMTI_Quotation_${new Date().toISOString().slice(0, 10)}.pdf`;
    
    const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
      title: 'Save PDF',
      defaultPath: defaultFilename,
      filters: [
        { name: 'PDF Files', extensions: ['pdf'] },
        { name: 'All Files', extensions: ['*'] }
      ],
      properties: ['createDirectory']
    });

    if (canceled || !filePath) {
      console.log('PDF save cancelled by user');
      return { success: false, message: 'PDF save cancelled' };
    }

    // Write PDF file
    fs.writeFileSync(filePath, pdfBuffer);
    
    console.log('PDF saved successfully to:', filePath);
    
    // Show success dialog
    await dialog.showMessageBox(mainWindow, {
      type: 'info',
      title: 'PDF Saved',
      message: 'PDF saved successfully!',
      detail: `File saved to:\n${filePath}`,
      buttons: ['OK']
    });
    
    return { 
      success: true, 
      filePath: filePath,
      message: 'PDF generated and saved successfully' 
    };
    
  } catch (error) {
    console.error('Native PDF generation failed:', error);
    
    // Show error dialog
    await dialog.showErrorBox(
      'PDF Generation Failed', 
      `Failed to generate PDF: ${error.message}\n\nPlease try again or contact support if the problem persists.`
    );
    
    return { 
      success: false, 
      error: error.message,
      message: 'Failed to generate PDF. Please try again.' 
    };
  }
});

// IPC Handler: Get Available Printers (Windows native)
ipcMain.handle('get-printers', async () => {
  try {
    const printers = await mainWindow.webContents.getPrintersAsync();
    console.log('Available printers:', printers);
    return { success: true, printers };
  } catch (error) {
    console.error('Failed to get printers:', error);
    return { success: false, error: error.message, printers: [] };
  }
});

// IPC Handler: Get Default Printer (Windows native)
ipcMain.handle('get-default-printer', async () => {
  try {
    const printers = await mainWindow.webContents.getPrintersAsync();
    const defaultPrinter = printers.find(printer => printer.isDefault);
    console.log('Default printer:', defaultPrinter);
    return { success: true, defaultPrinter };
  } catch (error) {
    console.error('Failed to get default printer:', error);
    return { success: false, error: error.message, defaultPrinter: null };
  }
});

// ==================================================
// APP INITIALIZATION
// ==================================================

// Optimize app initialization
app.whenReady().then(() => {
  createWindow();

  // Performance: Enable hardware acceleration
  app.commandLine.appendSwitch('enable-gpu-rasterization');
  app.commandLine.appendSwitch('enable-zero-copy');
  
  // Enable high quality printing
  app.commandLine.appendSwitch('enable-print-preview');
  app.commandLine.appendSwitch('enable-pdf-plugin');
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

// Cleanup IPC handlers on app quit
app.on('before-quit', () => {
  ipcMain.removeAllListeners('native-print');
  ipcMain.removeAllListeners('native-print-to-pdf');
  ipcMain.removeAllListeners('get-printers');
  ipcMain.removeAllListeners('get-default-printer');
});
