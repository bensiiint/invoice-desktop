import React from "react";
import {
  Navigation,
  QuotationDetails,
  CompanyInfo,
  ClientInfo,
  TasksTable,
  PrintLayout,
} from "./components";
import { useInvoiceState, useFileOperations } from "./hooks";
import "./App.css";

function App() {
  // Use optimized state management
  const {
    // State
    companyInfo,
    clientInfo,
    quotationDetails,
    tasks,
    baseRates,
    currentFilePath,
    hasUnsavedChanges,
    
    // Actions
    updateCompanyInfo,
    updateClientInfo,
    updateQuotationDetails,
    addTask,
    removeTask,
    updateTask,
    updateBaseRate,
    resetToNew,
    loadData,
    getSaveData,
    setCurrentFilePath,
    setHasUnsavedChanges,
  } = useInvoiceState();

  // Use optimized file operations
  const {
    newInvoice,
    saveInvoice,
    loadInvoice,
    exportPDF,
  } = useFileOperations({
    hasUnsavedChanges,
    getSaveData,
    loadData,
    resetToNew,
    setCurrentFilePath,
    setHasUnsavedChanges,
  });

  return (
    <div className="app">
      {/* Top Navigation */}
      <Navigation
        currentFilePath={currentFilePath}
        hasUnsavedChanges={hasUnsavedChanges}
        onNew={newInvoice}
        onSave={saveInvoice}
        onLoad={loadInvoice}
        onExport={exportPDF}
      />

      <div className="app-body">
        {/* Single Page Vertical Layout */}
        <main className="vertical-layout-content">
          <div className="content-wrapper">
            {/* Quotation Details - Moved to Top */}
            <QuotationDetails
              quotationDetails={quotationDetails}
              onUpdate={updateQuotationDetails}
            />

            {/* Company & Client Info Row */}
            <div className="info-row">
              <CompanyInfo
                companyInfo={companyInfo}
                onUpdate={updateCompanyInfo}
              />
              <ClientInfo
                clientInfo={clientInfo}
                onUpdate={updateClientInfo}
              />
            </div>

            {/* Tasks Section */}
            <TasksTable
              tasks={tasks}
              baseRates={baseRates}
              onTaskUpdate={updateTask}
              onTaskAdd={addTask}
              onTaskRemove={removeTask}
              onBaseRateUpdate={updateBaseRate}
            />
          </div>
        </main>

        {/* Hidden Print Layout - Only visible when printing */}
        <PrintLayout
          companyInfo={companyInfo}
          clientInfo={clientInfo}
          quotationDetails={quotationDetails}
          tasks={tasks}
          baseRates={baseRates}
        />
      </div>
    </div>
  );
}

export default App;
