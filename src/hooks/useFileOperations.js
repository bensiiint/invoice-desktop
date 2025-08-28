import { useCallback } from 'react';

export function useFileOperations({
  hasUnsavedChanges,
  getSaveData,
  loadData,
  resetToNew,
  setCurrentFilePath,
  setHasUnsavedChanges,
}) {
  // New Invoice
  const newInvoice = useCallback(() => {
    if (
      hasUnsavedChanges &&
      !window.confirm(
        "You have unsaved changes. Are you sure you want to create a new invoice?"
      )
    ) {
      return;
    }
    resetToNew();
  }, [hasUnsavedChanges, resetToNew]);

  // Save Invoice - Fixed to prevent immediate completion dialog
  const saveInvoice = useCallback(async () => {
    try {
      const data = getSaveData();
      const jsonString = JSON.stringify(data, null, 2);
      
      // Try File System Access API first (for browsers that support it)
      if ("showSaveFilePicker" in window && window.isSecureContext) {
        try {
          const fileHandle = await window.showSaveFilePicker({
            types: [
              {
                description: "KMTI Quotation files",
                accept: {
                  "application/json": [".json"],
                },
              },
            ],
            suggestedName: `KMTI_Quotation_${
              new Date().toISOString().split("T")[0]
            }.json`,
          });

          const writable = await fileHandle.createWritable();
          await writable.write(jsonString);
          await writable.close();

          // Only show success message after actual save completion
          setCurrentFilePath(fileHandle.name);
          setHasUnsavedChanges(false);
          alert(`Quotation saved successfully as ${fileHandle.name}!`);
          return;
          
        } catch (fsError) {
          if (fsError.name === "AbortError") {
            return; // User cancelled - no message needed
          }
          // If File System API fails, fall through to download method
        }
      }
      
      // Fallback: Download method (works in Electron and all browsers)
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const fileName = `KMTI_Quotation_${new Date().toISOString().split('T')[0]}.json`;
      
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up and show completion message
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 100);
      
      setHasUnsavedChanges(false);
      alert(`Quotation saved as ${fileName}!\nFile saved to your Downloads folder.`);
      
    } catch (error) {
      console.error('Save failed:', error);
      alert(`Error saving file: ${error.message}`);
    }
  }, [getSaveData, setCurrentFilePath, setHasUnsavedChanges]);

  // Load Invoice - Enhanced with better error handling and fallback
  const loadInvoice = useCallback(async () => {
    if (
      hasUnsavedChanges &&
      !window.confirm(
        "You have unsaved changes. Are you sure you want to load another invoice?"
      )
    ) {
      return;
    }

    try {
      // Check if File System Access API is supported AND we're in a secure context
      if ("showOpenFilePicker" in window && window.isSecureContext) {
        try {
          // Try modern File System Access API first
          const [fileHandle] = await window.showOpenFilePicker({
            types: [
              {
                description: "KMTI Quotation files",
                accept: {
                  "application/json": [".json"],
                },
              },
            ],
          });

          // Read the file with enhanced error handling
          const file = await fileHandle.getFile();
          const contents = await file.text();
          
          // More lenient content validation
          if (!contents || contents.trim().length < 2) {
            throw new Error('File appears to be empty or too short');
          }
          
          let data;
          try {
            data = JSON.parse(contents);
          } catch (parseError) {
            throw new Error(`File contains invalid JSON: ${parseError.message}\n\nThis might happen if:\n• File is corrupted\n• File is not a valid quotation template\n• File is still being synced from network drive`);
          }
          
          // Basic data validation
          if (!data || typeof data !== 'object') {
            throw new Error('Invalid quotation file format - not a valid JSON object');
          }

          loadData(data, fileHandle.name);
          alert(`Quotation template loaded successfully from ${fileHandle.name}!`);
          return; // Exit here - don't run fallback
          
        } catch (fsError) {
          if (fsError.name === "AbortError") {
            return; // User cancelled
          }
          console.warn('File System Access API failed, trying fallback:', fsError);
          throw fsError; // Re-throw for fallback handling
        }
      }
      
      // Fallback: Use traditional file input for compatibility
      const fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.accept = '.json';
      fileInput.style.display = 'none';
      
      const loadFile = () => {
        return new Promise((resolve, reject) => {
          fileInput.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) {
              reject(new Error('No file selected'));
              return;
            }
            
            try {
              // Read file with timeout for network drives
              const text = await readFileWithTimeout(file, 15000); // 15 second timeout
              
              // Validate and parse JSON
              if (!text || text.trim().length < 2) {
                throw new Error('File is empty or could not be read from network location');
              }
              
              let data;
              try {
                data = JSON.parse(text);
              } catch (parseError) {
                throw new Error(`Invalid JSON format: ${parseError.message}\n\nTROUBLESHOOTING:\n• Copy file to local computer first\n• Check if file is completely synced\n• Verify file permissions on network drive`);
              }
              
              resolve({ data, fileName: file.name });
            } catch (error) {
              reject(error);
            }
          };
          
          fileInput.onerror = () => {
            reject(new Error('Failed to access file. Check file permissions.'));
          };
        });
      };
      
      // Add to document and trigger
      document.body.appendChild(fileInput);
      fileInput.click();
      
      try {
        const { data, fileName } = await loadFile();
        loadData(data, fileName);
        alert(`Quotation template loaded successfully from ${fileName}!`);
      } finally {
        document.body.removeChild(fileInput);
      }
      
    } catch (error) {
      if (error.name === "AbortError" || error.message.includes('No file selected')) {
        return; // User cancelled
      }
      
      console.error('Load failed:', error);
      
      // Provide helpful error messages
      let errorMessage = 'Failed to load quotation file.';
      
      if (error.message.includes('JSON') || error.message.includes('format')) {
        errorMessage = error.message;
      } else if (error.message.includes('permissions') || error.message.includes('access')) {
        errorMessage = `File access error: ${error.message}\n\nTRY THESE SOLUTIONS:\n• Run the app as administrator\n• Copy file to your local computer\n• Check network drive permissions`;
      } else {
        errorMessage = `Loading failed: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  }, [hasUnsavedChanges, loadData]);

  // Export PDF
  // Note: This function is now replaced by the PrintPreviewModal
  // Keeping for backward compatibility if needed
  const exportPDF = useCallback(() => {
    window.print();
  }, []);

  return {
    newInvoice,
    saveInvoice,
    loadInvoice,
    // exportPDF removed - now handled by PrintPreviewModal
  };
}

// Helper function to read files with timeout for network drives
async function readFileWithTimeout(file, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    // Set up timeout
    const timeoutId = setTimeout(() => {
      reader.abort();
      reject(new Error(`File reading timeout after ${timeout/1000} seconds. Network drive may be slow or inaccessible.`));
    }, timeout);
    
    reader.onload = (e) => {
      clearTimeout(timeoutId);
      const result = e.target.result;
      
      // Additional validation
      if (!result) {
        reject(new Error('File content is empty'));
        return;
      }
      
      resolve(result);
    };
    
    reader.onerror = () => {
      clearTimeout(timeoutId);
      reject(new Error('Failed to read file. Check if file exists and you have read permissions.'));
    };
    
    reader.onabort = () => {
      clearTimeout(timeoutId);
      reject(new Error('File reading was cancelled'));
    };
    
    // Start reading
    reader.readAsText(file);
  });
}
