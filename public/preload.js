// Preload script for better security
// This file runs before the web page loads and provides secure access to Node.js APIs

const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Menu event listeners
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-new-invoice', callback);
    ipcRenderer.on('menu-export-pdf', callback);
  },
  
  // Remove listeners
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('menu-new-invoice');
    ipcRenderer.removeAllListeners('menu-export-pdf');
  }
});
