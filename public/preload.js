// Enhanced Preload script with Windows Native Print System APIs
// This file runs before the web page loads and provides secure access to Node.js APIs

const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Menu event listeners
  onMenuAction: (callback) => {
    ipcRenderer.on('menu-new-invoice', callback);
    ipcRenderer.on('menu-export-pdf', callback);
  },
  
  // ==================================================
  // WINDOWS NATIVE PRINT SYSTEM APIs
  // ==================================================
  
  /**
   * Print using Windows' native print dialog
   * @param {Object} options - Print options
   * @param {boolean} options.silent - If true, print without dialog (default: false)
   * @param {boolean} options.printBackground - Print backgrounds (default: true)
   * @param {boolean} options.color - Print in color (default: true)
   * @param {Object} options.margins - Custom margins
   * @param {string} options.pageSize - Paper size (A4, Letter, etc.)
   * @param {boolean} options.landscape - Landscape orientation (default: false)
   * @param {number} options.scaleFactor - Scale factor 1-1000 (default: 100)
   * @param {number} options.copies - Number of copies (default: 1)
   * @param {boolean} options.collate - Collate copies (default: true)
   * @param {boolean} options.showHeaders - Show headers (default: false)
   * @param {boolean} options.showFooters - Show footers (default: false)
   * @param {string} options.header - Header text
   * @param {string} options.footer - Footer text
   * @returns {Promise<Object>} Result object with success status
   */
  print: async (options = {}) => {
    try {
      const result = await ipcRenderer.invoke('native-print', options);
      console.log('Print API result:', result);
      return result;
    } catch (error) {
      console.error('Print API error:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Generate PDF using Windows' native PDF engine
   * @param {Object} options - PDF options
   * @param {Object} options.margins - Custom margins in mm
   * @param {string} options.pageSize - Paper size (A4, Letter, etc.)
   * @param {boolean} options.landscape - Landscape orientation (default: false)
   * @param {boolean} options.printBackground - Include backgrounds (default: true)
   * @param {boolean} options.color - Generate in color (default: true)
   * @param {number} options.scaleFactor - Scale factor 1-1000 (default: 100)
   * @param {string} options.filename - Default filename for save dialog
   * @param {string} options.title - Document title
   * @returns {Promise<Object>} Result object with success status and file path
   */
  printToPDF: async (options = {}) => {
    try {
      const result = await ipcRenderer.invoke('native-print-to-pdf', options);
      console.log('PDF generation result:', result);
      return result;
    } catch (error) {
      console.error('PDF generation error:', error);
      return { success: false, error: error.message };
    }
  },
  
  /**
   * Get list of available printers (Windows native)
   * @returns {Promise<Object>} Result with array of available printers
   */
  getPrinters: async () => {
    try {
      const result = await ipcRenderer.invoke('get-printers');
      console.log('Available printers:', result);
      return result;
    } catch (error) {
      console.error('Get printers error:', error);
      return { success: false, error: error.message, printers: [] };
    }
  },
  
  /**
   * Get the default printer (Windows native)
   * @returns {Promise<Object>} Result with default printer information
   */
  getDefaultPrinter: async () => {
    try {
      const result = await ipcRenderer.invoke('get-default-printer');
      console.log('Default printer:', result);
      return result;
    } catch (error) {
      console.error('Get default printer error:', error);
      return { success: false, error: error.message, defaultPrinter: null };
    }
  },
  
  /**
   * Check if we're running in Electron environment
   * @returns {boolean} True if running in Electron
   */
  isElectron: () => {
    return true;
  },
  
  /**
   * Get platform information
   * @returns {string} Platform (win32, darwin, linux)
   */
  getPlatform: () => {
    return process.platform;
  },
  
  /**
   * Check if running on Windows
   * @returns {boolean} True if running on Windows
   */
  isWindows: () => {
    return process.platform === 'win32';
  },
  
  // ==================================================
  // LEGACY COMPATIBILITY
  // ==================================================
  
  // Legacy menu event listeners (for backward compatibility)
  removeAllListeners: () => {
    ipcRenderer.removeAllListeners('menu-new-invoice');
    ipcRenderer.removeAllListeners('menu-export-pdf');
  },
  
  // Application info
  getAppVersion: () => {
    return '1.0.0'; // You can make this dynamic if needed
  },
  
  // Utility functions
  log: (message, level = 'info') => {
    console.log(`[${level.toUpperCase()}] ${message}`);
  },
  
  // Error reporting
  reportError: (error, context = '') => {
    console.error(`[ERROR] ${context}:`, error);
    // You could extend this to send errors to a logging service
  }
});

// Performance monitoring (optional)
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('electronDev', {
    openDevTools: () => {
      ipcRenderer.send('open-dev-tools');
    },
    
    getMemoryUsage: () => {
      return process.memoryUsage();
    },
    
    getCpuUsage: () => {
      return process.cpuUsage();
    }
  });
}

// Log successful preload
console.log('✅ Preload script loaded successfully with Windows Native Print APIs');
console.log('📄 Available APIs: print, printToPDF, getPrinters, getDefaultPrinter');
console.log(`🖥️  Platform: ${process.platform}`);
console.log(`🏠  Running in: ${process.env.NODE_ENV || 'production'} mode`);
