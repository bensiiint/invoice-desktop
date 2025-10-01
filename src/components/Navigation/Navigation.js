import React, { memo } from 'react';
import {
  FileText,
  Save,
  FolderOpen,
  Printer,
} from "lucide-react";

const Navigation = memo(({
  currentFilePath,
  hasUnsavedChanges,
  onNew,
  onSave,
  onLoad,
  onPrint,
}) => {
  return (
    <nav className="top-nav">
      <div className="nav-brand">
        <div className="brand-icon-container">
          <img src="./icon.png" alt="KMTI Logo" className="brand-icon" />
        </div>
        <div className="brand-text">
          <h1>KMTI Quotation & Billing</h1>
          {currentFilePath && (
            <span className="file-status">
              {currentFilePath} {hasUnsavedChanges && "• Edited"}
            </span>
          )}
        </div>
      </div>

      <div className="nav-actions">
        <button className="action-button secondary" onClick={onNew}>
          <FileText className="action-icon" />
          <span>New</span>
        </button>
        <button className="action-button secondary" onClick={onSave}>
          <Save className="action-icon" />
          <span>Save</span>
        </button>
        <button className="action-button secondary" onClick={onLoad}>
          <FolderOpen className="action-icon" />
          <span>Load</span>
        </button>
        <button className="action-button export" onClick={onPrint}>
          <Printer className="action-icon" />
          <span>Print</span>
        </button>
      </div>
    </nav>
  );
});

Navigation.displayName = 'Navigation';

export default Navigation;
