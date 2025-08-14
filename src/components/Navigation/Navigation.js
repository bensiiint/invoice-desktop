import React, { memo } from 'react';
import {
  FileText,
  Building2,
  Save,
  FolderOpen,
  Download,
} from "lucide-react";

const Navigation = memo(({
  currentFilePath,
  hasUnsavedChanges,
  onNew,
  onSave,
  onLoad,
  onExport,
}) => {
  return (
    <nav className="top-nav">
      <div className="nav-brand">
        <Building2 className="brand-icon" />
        <div className="brand-text">
          <h1>KMTI Quotation App</h1>
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
        <button className="action-button primary" onClick={onSave}>
          <Save className="action-icon" />
          <span>Save</span>
        </button>
        <button className="action-button secondary" onClick={onLoad}>
          <FolderOpen className="action-icon" />
          <span>Load</span>
        </button>
        <button className="action-button export" onClick={onExport}>
          <Download className="action-icon" />
          <span>Export</span>
        </button>
      </div>
    </nav>
  );
});

Navigation.displayName = 'Navigation';

export default Navigation;
