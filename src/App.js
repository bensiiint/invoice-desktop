import React, { useState, useCallback } from "react";
import {
  Navigation,
  QuotationDetails,
  CompanyInfo,
  ClientInfo,
  TasksTable,
  SignatureForm,
  PrintLayout,
  PrintPreviewModal,
} from "./components";
import { useInvoiceState, useFileOperations } from "./hooks";
import "./App.css";

function App() {
  // Print preview modal state
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  // Manual overrides from TasksTable
  const [manualOverrides, setManualOverrides] = useState({});
  // Use optimized state management
  const {
    // State
    companyInfo,
    clientInfo,
    quotationDetails,
    tasks,
    baseRates,
    signatures,
    currentFilePath,
    hasUnsavedChanges,
    selectedMainTaskId,
    
    // Actions
    updateCompanyInfo,
    updateClientInfo,
    updateQuotationDetails,
    addTask,
    addSubTask,
    removeTask,
    updateTask,
    reorderTasks,
    updateBaseRate,
    updateSignatures,
    setSelectedMainTaskId,
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
  } = useFileOperations({
    hasUnsavedChanges,
    getSaveData,
    loadData,
    resetToNew,
    setCurrentFilePath,
    setHasUnsavedChanges,
  });

  // Handle print preview
  const handlePrintPreview = () => {
    setIsPrintPreviewOpen(true);
  };

  // Handle manual overrides change from TasksTable
  const handleManualOverridesChange = useCallback((overrides) => {
    setManualOverrides(overrides);
  }, []);

  return (
    <div className="app">
      {/* Top Navigation */}
      <Navigation
        currentFilePath={currentFilePath}
        hasUnsavedChanges={hasUnsavedChanges}
        onNew={newInvoice}
        onSave={saveInvoice}
        onLoad={loadInvoice}
        onPrint={handlePrintPreview}
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
              selectedMainTaskId={selectedMainTaskId}
              onTaskUpdate={updateTask}
              onTaskAdd={addTask}
              onSubTaskAdd={addSubTask}
              onTaskRemove={removeTask}
              onTaskReorder={reorderTasks}
              onMainTaskSelect={setSelectedMainTaskId}
              onBaseRateUpdate={updateBaseRate}
              onManualOverridesChange={handleManualOverridesChange}
            />

            {/* Signature Section */}
            <SignatureForm
              signatures={signatures}
              onUpdate={(type, field, value) => updateSignatures(type, field, value)}
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
          signatures={signatures}
          manualOverrides={manualOverrides}
          isPreview={false}
        />
      </div>
      
      {/* Print Preview Modal */}
      <PrintPreviewModal
        isOpen={isPrintPreviewOpen}
        onClose={() => setIsPrintPreviewOpen(false)}
        companyInfo={companyInfo}
        clientInfo={clientInfo}
        quotationDetails={quotationDetails}
        tasks={tasks}
        baseRates={baseRates}
        signatures={signatures}
        manualOverrides={manualOverrides}
      />
    </div>
  );
}

export default App;
