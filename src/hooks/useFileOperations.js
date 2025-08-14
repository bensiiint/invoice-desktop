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

  // Save Invoice - Using File System Access API
  const saveInvoice = useCallback(async () => {
    try {
      // Check if File System Access API is supported
      if (!("showSaveFilePicker" in window)) {
        alert(
          "File system access is not supported in this browser. Please use Chrome, Edge, or another modern browser."
        );
        return;
      }

      const data = getSaveData();

      // Open file save dialog
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

      // Write the file
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(data, null, 2));
      await writable.close();

      setCurrentFilePath(fileHandle.name);
      setHasUnsavedChanges(false);
      alert(`Quotation saved successfully as ${fileHandle.name}!`);
    } catch (error) {
      if (error.name !== "AbortError") {
        alert("Error saving file: " + error.message);
      }
    }
  }, [getSaveData, setCurrentFilePath, setHasUnsavedChanges]);

  // Load Invoice - Using File System Access API
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
      // Check if File System Access API is supported
      if (!("showOpenFilePicker" in window)) {
        alert(
          "File system access is not supported in this browser. Please use Chrome, Edge, or another modern browser."
        );
        return;
      }

      // Open file picker dialog
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

      // Read the file
      const file = await fileHandle.getFile();
      const contents = await file.text();
      const data = JSON.parse(contents);

      loadData(data, fileHandle.name);
      alert(`Quotation template loaded successfully from ${fileHandle.name}!`);
    } catch (error) {
      if (error.name !== "AbortError") {
        alert("Error loading file: " + error.message);
      }
    }
  }, [hasUnsavedChanges, loadData]);

  // Export PDF
  const exportPDF = useCallback(() => {
    window.print();
  }, []);

  return {
    newInvoice,
    saveInvoice,
    loadInvoice,
    exportPDF,
  };
}
