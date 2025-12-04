import React, { memo, useState, useMemo, useCallback, useRef } from 'react';
import { 
  X, 
  Printer, 
  Download,
  FileText,
  Edit3
} from 'lucide-react';
import './PrintPreviewModal.css';
import '../PrintLayout/VisualLayout.css';
import Logo from "./KmtiLogo.png";
import QuickEditModal from '../QuickEditModal/QuickEditModal';

const PrintPreviewModal = memo(({ 
  isOpen, 
  onClose, 
  companyInfo,
  clientInfo,
  quotationDetails,
  tasks,
  baseRates,
  signatures,
  manualOverrides = {},
  onUpdateTasks,
  onUpdateManualOverrides
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [printMode, setPrintMode] = useState('quotation'); // 'quotation' or 'billing'
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [localTasks, setLocalTasks] = useState(tasks);
  const [localManualOverrides, setLocalManualOverrides] = useState(manualOverrides);
  const previewRef = useRef(null);

  // Sync local state when props change
  React.useEffect(() => {
    setLocalTasks(tasks);
  }, [tasks]);

  React.useEffect(() => {
    setLocalManualOverrides(manualOverrides);
  }, [manualOverrides]);

  // Handle Quick Edit changes
  const handleQuickEditApply = useCallback((editedTasks, editedOverrides) => {
    // Update local state
    setLocalTasks(prevTasks => {
      return prevTasks.map(task => {
        const editedTask = editedTasks.find(t => t.id === task.id);
        if (editedTask && task.isMainTask) {
          return { ...task, ...editedTask };
        }
        return task;
      });
    });
    setLocalManualOverrides(editedOverrides);
    
    // Optionally update parent component
    if (onUpdateTasks) {
      onUpdateTasks(editedTasks);
    }
    if (onUpdateManualOverrides) {
      onUpdateManualOverrides(editedOverrides);
    }
  }, [onUpdateTasks, onUpdateManualOverrides]);


  // Fixed settings for A4 paper
  const settings = {
    paperSize: 'A4',
    orientation: 'portrait',
    margins: 'default',
    zoom: 100,
    showHeaders: true,
    showFooters: true,
  };

  // Calculate paper dimensions (always A4 portrait)
  const paperDimensions = useMemo(() => {
    return {
      width: 210,
      height: 297,
      label: 'A4 (210 × 297 mm)'
    };
  }, []);

  // Calculate margins (always default)
  const margins = useMemo(() => {
    return { top: 5, right: 5, bottom: 5, left: 5, label: 'Default' };
  }, []);

  // Calculate preview scale - fixed at 100%
  const previewScale = useMemo(() => {
    return 1.0;
  }, []);

  // Helper function to calculate task totals with manual overrides
  const calculateTaskTotal = useCallback((task) => {
    // Calculate main task hours and minutes
    const mainTotalHours = (task.hours || 0) + (task.minutes || 0) / 60;
    
    // Aggregate sub-task totals
    const subTasks = localTasks.filter(t => t.parentId === task.id);
    const taskTimeChargeRate = task.type === '2D' ? baseRates.timeChargeRate2D : baseRates.timeChargeRate3D;
    let aggregatedHours = mainTotalHours;
    let aggregatedOvertime = task.overtimeHours;
    let aggregatedSoftware = (task.softwareUnits || 0);
    
    subTasks.forEach(subTask => {
      const subTotalHours = (subTask.hours || 0) + (subTask.minutes || 0) / 60;
      aggregatedHours += subTotalHours;
      aggregatedOvertime += subTask.overtimeHours;
      aggregatedSoftware += (subTask.softwareUnits || 0);
    });
    
    // Calculate base values
    let basicLabor = aggregatedHours * taskTimeChargeRate;
    let overtime = aggregatedOvertime * baseRates.overtimeRate;
    let software = aggregatedSoftware * baseRates.softwareRate;
    
    // Apply manual overrides if they exist
    const override = localManualOverrides[task.id];
    if (override) {
      basicLabor = override.basicLabor !== undefined ? override.basicLabor : basicLabor;
      overtime = override.overtime !== undefined ? override.overtime : overtime;
      software = override.software !== undefined ? override.software : software;
      
      // If total is overridden, use that directly
      if (override.total !== undefined) {
        return override.total;
      }
    }
    
    return basicLabor + overtime + software;
  }, [localTasks, baseRates, localManualOverrides]);

  // Memoize pagination logic and calculations
  const { 
    firstPageTasks, 
    secondPageTasks, 
    needsPagination, 
    useCompression,
    taskTotals: firstPageTaskTotals, 
    secondPageTaskTotals,
    grandTotal, 
    overheadTotal, 
    actualTaskCount, 
    maxRows, 
    mainTasks,
    totalPages,
    secondPageEmptyRows
  } = useMemo(() => {
    // Filter only main tasks for display - LIMIT ASSEMBLY ROWS TO 27
    const mainTasks = localTasks.filter(task => task.isMainTask).slice(0, 27); // MAXIMUM 27 ASSEMBLY ROWS
    
    // Pagination logic based on assembly row count
    const assemblyRowCount = mainTasks.length; // Only count actual assembly rows
    const needsPagination = assemblyRowCount >= 16;
    const useCompression = assemblyRowCount >= 9 && assemblyRowCount <= 15 && !needsPagination;
    
    // Split tasks for pagination
    const firstPageTasks = needsPagination ? mainTasks.slice(0, 15) : mainTasks; // Show 15 rows on first page when paginating
    const secondPageTasks = needsPagination ? mainTasks.slice(15) : [];
    
    // Calculate empty rows for second page - limit expansion after row 22
    const secondPageEmptyRows = (() => {
      if (!needsPagination) return 0;
      const secondPageTaskCount = secondPageTasks.length;
      
      if (secondPageTaskCount <= 7) { // Rows 16-22 (7 rows max with default spacing)
        return Math.max(0, 5); // Default 5 empty rows
      } else { // Rows 23-27 (use available space, no empty rows)
        return 0; // No empty rows, let overhead/total move down naturally
      }
    })();
    
    // Calculate first page totals using helper function
    const firstPageTotals = firstPageTasks.map(calculateTaskTotal);

    // Calculate second page totals using helper function
    const secondPageTotals = needsPagination ? secondPageTasks.map(calculateTaskTotal) : [];

    const firstPageSubtotal = firstPageTotals.reduce((sum, total) => sum + total, 0);
    const secondPageSubtotal = secondPageTotals.reduce((sum, total) => sum + total, 0);
    const subtotalWithoutOverhead = firstPageSubtotal + secondPageSubtotal;
    const overhead = subtotalWithoutOverhead * (baseRates.overheadPercentage / 100);
    const grand = subtotalWithoutOverhead + overhead;
    
    // Calculate task count and max rows
    const taskCount = mainTasks.length + (baseRates.overheadPercentage > 0 ? 1 : 0) + 1; // +1 for nothing follow
    const rows = (() => {
      if (needsPagination) {
        return 15; // Fixed 15 rows on first page when paginating
      } else if (useCompression) {
        return taskCount; // Use actual count for compression
      } else {
        return taskCount > 10 ? Math.min(taskCount, 20) : 10; // Dynamic max rows for normal view
      }
    })();
    
    const totalPages = needsPagination ? 2 : 1;
    
    return { 
      firstPageTasks,
      secondPageTasks,
      needsPagination,
      useCompression,
      taskTotals: firstPageTotals,
      secondPageTaskTotals: secondPageTotals,
      grandTotal: grand,
      overheadTotal: overhead,
      actualTaskCount: taskCount,
      maxRows: rows,
      mainTasks,
      totalPages,
      secondPageEmptyRows
    };
  }, [localTasks, baseRates, calculateTaskTotal]);

  const formatCurrency = useCallback((amount) => {
    return `¥${amount.toLocaleString()}`;
  }, []);

  const formatHours = useCallback((hours, minutes) => {
    const totalHours = hours + (minutes || 0) / 60;
    if (totalHours === 0) return '';
    if (minutes && minutes > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${hours}h`;
  }, []);
  
  // Calculate unit page count for each main task (assembly + sub-parts)
  const getUnitPageCount = useCallback((mainTask) => {
    // Check for manual override first
    const override = localManualOverrides[mainTask.id];
    if (override?.unitPage !== undefined) {
      return override.unitPage;
    }
    // Otherwise calculate: 1 (main task) + number of sub-tasks
    const subTasks = localTasks.filter(t => t.parentId === mainTask.id);
    return 1 + subTasks.length;
  }, [localTasks, localManualOverrides]);

  const getAggregatedHours = useCallback((mainTask, mainTasks) => {
    // Get sub-tasks for this main task
    const subTasks = localTasks.filter(t => t.parentId === mainTask.id);
    
    // Sum up main task + sub-task hours and minutes
    let totalHours = mainTask.hours || 0;
    let totalMinutes = mainTask.minutes || 0;
    
    subTasks.forEach(subTask => {
      totalHours += subTask.hours || 0;
      totalMinutes += subTask.minutes || 0;
    });
    
    // Convert excess minutes to hours
    totalHours += Math.floor(totalMinutes / 60);
    totalMinutes = totalMinutes % 60;
    
    return { hours: totalHours, minutes: totalMinutes };
  }, [localTasks]);

  // Handle print
  const handlePrint = useCallback(async () => {
    setIsProcessing(true);
    try {
      // Get the preview content
      const previewContent = previewRef.current;
      if (!previewContent) {
        throw new Error('Preview content not found');
      }

      if (window.electronAPI) {
        // For Electron - we still need to fix this, but for now use the existing method
        await window.electronAPI.print({
          silent: false,
          printBackground: true,
          color: true,
          margins: {
            marginType: 'custom',
            top: 5,
            bottom: 5,
            left: 5,
            right: 5
          },
          pageSize: 'A4',
          landscape: false
        });
      } else {
        // For web browsers, use a cleaner approach that directly triggers print dialog
        // Create a hidden print container
        const printContainer = document.createElement('div');
        printContainer.id = 'print-only-content';
        printContainer.innerHTML = previewContent.innerHTML;
        printContainer.style.display = 'none';
        
        // Add print-only styles
        const printStyles = document.createElement('style');
        printStyles.id = 'print-only-styles';
        printStyles.textContent = `
          @media screen {
            #print-only-content {
              display: none !important;
            }
          }
          
          @media print {
            /* Hide everything except print content */
            body * {
              visibility: hidden;
            }
            
            #print-only-content,
            #print-only-content * {
              visibility: visible;
            }
            
            #print-only-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              display: block !important;
            }
            
            @page { 
              size: A4 portrait; 
              margin: 5mm; 
            }
            
            /* Copy exact styles from VisualLayout.css and PrintPreviewModal.css */
            .quotation-visual-exact {
              width: 210mm;
              height: 297mm;
              background: white;
              font-family: Arial, sans-serif;
              color: black;
              padding: 8mm;
              box-sizing: border-box;
              position: relative;
              margin: 0;
              overflow: visible;
              transform: none !important;
              scale: 1 !important;
            }
            
            /* Header Section - Original Quotation Layout */
            .header-visual {
              display: block;
              position: relative;
              margin-bottom: 25px;
              margin-top: 0;
              min-height: 150px;
            }
            
            .logo-visual {
              position: absolute;
              left: 0;
              top: 5px;
              width: 125px;
              height: 140px;
            }
            
            .logo-visual img {
              width: 100%;
              height: 100%;
              object-fit: contain;
            }
            
            .center-text-visual {
              position: absolute;
              left: 40%;
              top: 60%;
              transform: translate(-50%, -50%);
              text-align: center;
              white-space: nowrap;
              z-index: 2;
            }
            
            .company-name-visual {
              font-size: 28px;
              font-weight: bold;
              margin-bottom: 10px;
              line-height: 1.1;
              white-space: pre-line;
              color: #000;
            }
            
            .quotation-title-visual {
              font-size: 26px;
              font-weight: bold;
              margin-top: 45px;
              white-space: nowrap;
              color: #000;
            }
            
            .right-details-visual {
              position: absolute;
              right: 0;
              top: 19px;
              width: 280px;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              min-height: 150px;
            }
            
            /* Billing Header Overrides */
            .header-visual.billing-header {
              min-height: 100px;
              margin-bottom: 10px;
              padding-bottom: 0;
              border-bottom: none;
              display: flex;
              align-items: flex-start;
              justify-content: center;
              position: relative;
            }
            
            .billing-header .logo-visual {
              position: absolute;
              left: 50px;
              top: 10px;
              width: 100px;
              height: 100px;
            }
            
            .billing-header .center-text-visual {
              position: static;
              text-align: center;
              transform: none;
              margin-top: 10px;
              margin-left: 25px;
              width: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            
            .billing-header .company-name-visual {
              font-size: 20px;
              font-weight: bold;
              margin-bottom: 8px;
              line-height: 1.2;
              color: #000;
              white-space: nowrap;
            }
            
            .billing-header .company-address-visual {
              font-size: 13px;
              line-height: 1.4;
              color: #000;
              margin-bottom: 15px;
              text-align: center;
              font-weight: normal;
              max-width: 400px;
            }
            
            .billing-header .quotation-title-visual {
              font-size: 18px;
              font-weight: normal;
              margin-top: 0;
              color: #000;
            }
            
            .billing-header .right-details-visual {
              display: none;
            }
            
            /* Company Info */
            .company-info-visual {
              font-size: 12px;
              text-align: right;
              margin-bottom: 25px;
              line-height: 1.4;
              position: relative;
              min-height: auto;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
            }
            
            .company-name-info {
              font-size: 12px;
              font-weight: bold;
              margin-bottom: 0px;
              min-height: auto;
            }
            
            /* Quotation Details - ORIGINAL POSITIONING FOR QUOTATION MODE */
            .quotation-details-visual {
              font-size: 12px;
              position: absolute;
              top: 190px;
              right: 0;
              width: 280px;
            }
            
            /* Billing Details Positioning - Only for billing mode */
            .billing-header + .quotation-details-visual {
              position: absolute;
              right: 8mm;
              top: 210px;
              width: 70mm;
              max-width: 70mm;
              height: 85px;
              display: flex;
              flex-direction: column;
              justify-content: flex-end;
            }
            
            .detail-row-visual {
              display: flex;
              justify-content: space-between;
              margin-bottom: 6px;
              align-items: center;
              min-height: 20px;
            }
            
            .detail-label-visual {
              font-weight: bold;
              font-size: 12px;
            }
            
            .detail-value-visual {
              border-bottom: 1px solid black;
              min-width: 120px;
              padding-bottom: 3px;
              text-align: center;
              font-size: 11px;
              min-height: 16px;
              display: inline-block;
            }
            
            /* Contact Section */
            .contact-section-visual {
              margin-bottom: 35px;
              margin-top: 0px;
              min-height: 90px;
            }
            
            /* Billing Mode - Bottom alignment for contact section */
            .quotation-visual-exact:has(.billing-header) .contact-section-visual {
              min-height: 110px;
              display: flex;
              flex-direction: column;
              justify-content: flex-end;
            }
            
            .quotation-to-visual {
              font-size: 16px;
              font-weight: bold;
              margin-bottom: 10px;
              min-height: 22px;
            }
            
            .client-details-visual {
              font-size: 12px;
              line-height: 1.5;
              min-height: 60px;
            }
            
            .client-company-name {
              font-weight: bold;
            }
            
            .client-person-name {
              font-weight: bold;
            }
            
            /* Table Section */
            .table-visual {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 11px;
            }
            
            .table-visual th,
            .table-visual td {
              border: 1px solid black;
              padding: 5px 3px;
              text-align: center;
              vertical-align: middle;
            }
            
            .table-visual th {
              font-weight: bold;
              background-color: #f5f5f5;
              font-size: 12px;
            }
            
            /* Column widths for the new 7-column layout */
            .table-visual .col-no { width: 4%; }
            .table-visual .col-reference { width: 18%; }
            .table-visual .col-description { width: 30%; text-align: center; }
            .table-visual .col-unit { width: 8%; }
            .table-visual .col-unitpage { width: 8%; }
            .table-visual .col-type { width: 6%; }
            .table-visual .col-price { width: 26%; text-align: center; }
            
            .table-visual .description-cell {
              text-align: left;
              padding-left: 8px;
            }
            
            .table-visual .price-cell {
              text-align: right;
              padding-right: 8px;
            }
            
            .table-visual .nothing-follow {
              text-align: center !important;
              font-weight: bold;
              font-style: italic;
              color: #666;
              letter-spacing: 1px;
            }
            
            /* Terms Section */
            .terms-visual {
              font-size: 13px;
              line-height: 1;
              margin-top: 30px;
              margin-bottom: 30px;
            }
            
            /* Hide terms in billing mode */
            .quotation-visual-exact:has(.billing-header) .terms-visual {
              display: none;
            }
            
            /* Signatures Section */
            .signatures-visual {
              margin-bottom: 20px;
              position: relative;
            }
            
            .signature-row-visual {
              display: flex;
              margin-bottom: 20px;
              position: relative;
              min-height: 80px;
            }
            
            .signature-left-visual {
              flex: 1;
              max-width: 45%;
            }
            
            .signature-right-visual {
              position: absolute;
              right: 0;
              top: 0;
              width: 250px;
            }
            
            .sig-label-visual {
              font-size: 13px;
              margin-bottom: 15px;
              text-align: left;
            }
            
            .sig-line-visual {
              border-bottom: 1px solid black;
              width: 250px;
              height: 30px;
              margin-bottom: 5px;
            }
            
            .sig-name-visual {
              font-weight: bold;
              font-size: 14px;
              text-align: center;
              width: 250px;
            }
            
            .sig-title-visual {
              font-size: 11px;
              text-align: center;
              width: 250px;
              font-style: italic;
            }
            
            /* Bank Details Section - FIXED STYLES */
            .bank-details-section {
              margin-bottom: 15px;
              font-size: 11px;
              color: #000;
              border: 1px solid #000;
              padding: 10px;
              margin-top: -30px;
            }
            
            .bank-details-title {
              font-weight: bold;
              margin-bottom: 8px;
              font-size: 11px;
              color: #000;
            }
            
            .bank-details-grid {
              display: grid;
              grid-template-columns: 1fr;
              gap: 3px;
            }
            
            .bank-detail-row {
              display: flex;
              align-items: flex-start;
              gap: 10px;
              margin-bottom: 2px;
            }
            
            .bank-label {
              font-weight: normal;
              min-width: 200px;
              font-size: 11px;
              flex-shrink: 0;
            }
            
            .bank-value {
              font-weight: normal;
              font-size: 11px;
              flex: 1;
              word-wrap: break-word;
              line-height: 1.3;
            }
            
            /* Footer */
            .footer-visual {
              display: flex;
              justify-content: space-between;
              font-size: 10px;
              font-style: italic;
              color: #666;
              margin-top: 50px;
            }
            
            .footer-visual:has(.bank-details-section) {
              display: block;
              text-align: left;
            }
          }
        `;
        
        // Add elements to document
        document.head.appendChild(printStyles);
        document.body.appendChild(printContainer);
        
        // Trigger print directly
        window.print();
        
        // Clean up after print (whether user prints or cancels)
        setTimeout(() => {
          document.head.removeChild(printStyles);
          document.body.removeChild(printContainer);
        }, 1000);
      }
    } catch (error) {
      console.error('Print failed:', error);
      alert('Print failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [printMode]);

  // Handle PDF download
  const handleDownloadPDF = useCallback(async () => {
    setIsProcessing(true);
    try {
      if (window.electronAPI) {
        const documentType = printMode === 'billing' ? 'BillingStatement' : 'Quotation';
        const documentNo = printMode === 'billing' 
          ? (quotationDetails.invoiceNo || quotationDetails.quotationNo || 'Draft')
          : (quotationDetails.quotationNo || 'Draft');
        
        await window.electronAPI.printToPDF({
          margins: {
            marginType: 'custom',
            top: 5,
            bottom: 5,
            left: 5,
            right: 5
          },
          pageSize: 'A4',
          landscape: false,
          printBackground: true,
          color: true,
          filename: `KMTI_${documentType}_${documentNo}.pdf`
        });
        // Success message is shown by Electron backend
      } else {
        window.print();
        setTimeout(() => {
          alert('💡 To save as PDF:\\n\\n1. In the print dialog, click "Destination"\\n2. Select "Save as PDF"\\n3. Click "Save"');
        }, 500);
      }
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('PDF generation failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [quotationDetails.quotationNo, quotationDetails.invoiceNo, printMode]);

  // Render first page
  const renderFirstPage = () => (
    <div className={`quotation-visual-exact ${needsPagination ? '' : `task-count-${actualTaskCount}`}`}>
      
      {/* Header Section */}
      <div className={`header-visual ${printMode === 'billing' ? 'billing-header' : ''}`}>
        {/* Logo */}
        <div className="logo-visual">
          <img src={Logo} alt="Company Logo" />
        </div>

        {/* Center Text */}
        <div className="center-text-visual">
          <div className="company-name-visual">
            {printMode === 'billing' 
              ? 'KUSAKABE & MAENO TECH., INC'
              : <>KUSAKABE & MAENO<br/>TECH., INC</>
            }
          </div>
          
          {printMode === 'billing' && (
            <div className="company-address-visual">
              Vital Industrial Properties Inc., Bldg B. Unit 2B First Cavite<br/>
              Industrial Estate, Langkaan, Dasmarinas,Cavite, Philippines<br/>
              Vat Reg. TIN: 008-883-390-000
            </div>
          )}
          
          <div className="quotation-title-visual">
            {printMode === 'billing' ? 'BILLING STATEMENT' : 'Quotation'}
          </div>
        </div>

        {/* Right Details - Only show for quotation mode */}
        {printMode === 'billing' ? null : (
          <div className="right-details-visual">
            <div className="company-info-visual">
              <div className="company-name-info">KUSAKABE & MAENO TECH., INC</div>
              {companyInfo.address}<br/>
              {companyInfo.city}<br/>
              {companyInfo.location}<br/>
              {companyInfo.phone}
            </div>
            
            <div className="quotation-details-visual">
              <>
                <div className="detail-row-visual">
                  <span className="detail-label-visual">Quotation No.:</span>
                  <span className="detail-value-visual">{quotationDetails.quotationNo || ''}</span>
                </div>
                <div className="detail-row-visual">
                  <span className="detail-label-visual">Reference No.:</span>
                  <span className="detail-value-visual">{quotationDetails.referenceNo || ''}</span>
                </div>
                <div className="detail-row-visual">
                  <span className="detail-label-visual">Date:</span>
                  <span className="detail-value-visual">{quotationDetails.date || ''}</span>
                </div>
              </>
            </div>
          </div>
        )}
      </div>

      {/* Billing Details Section - Use exact same implementation as quotation details */}
      {printMode === 'billing' && (
        <div className="quotation-details-visual">
          <div className="detail-row-visual">
            <span className="detail-label-visual">DATE:</span>
            <span className="detail-value-visual">{quotationDetails.date || ''}</span>
          </div>
          <div className="detail-row-visual">
            <span className="detail-label-visual">Invoice No.:</span>
            <span className="detail-value-visual">{quotationDetails.invoiceNo || ''}</span>
          </div>
          <div className="detail-row-visual">
            <span className="detail-label-visual">Quotation No.:</span>
            <span className="detail-value-visual">{quotationDetails.quotationNo || ''}</span>
          </div>
          <div className="detail-row-visual">
            <span className="detail-label-visual">Job Order No.:</span>
            <span className="detail-value-visual">{quotationDetails.jobOrderNo || ''}</span>
          </div>
        </div>
      )}

      {/* Contact Section */}
      <div className="contact-section-visual">
        {printMode === 'billing' ? null : (
          <div className="quotation-to-visual">Quotation to:</div>
        )}
        <div className="client-details-visual">
          <div className="client-company-name">{clientInfo.company}</div>
          <div className="client-person-name">{clientInfo.contact}</div>
          {clientInfo.address}<br/>
          {clientInfo.phone}
        </div>
      </div>

      {/* Table */}
      <table className="table-visual">
        <thead>
          <tr>
            <th className="col-no">NO.</th>
            <th className="col-reference">REFERENCE NO.</th>
            <th className="col-description">DESCRIPTION</th>
            <th className="col-unitpage">UNIT PAGE</th>
            <th className="col-type">TYPE</th>
            <th className="col-price">PRICE</th>
          </tr>
        </thead>
        <tbody>
          {/* Task rows */}
          {firstPageTasks.map((task, index) => {
            const aggregatedHours = getAggregatedHours(task, mainTasks);
            const unitPageCount = getUnitPageCount(task);
            return (
              <tr key={task.id}>
                <td>{index + 1}</td>
                <td>{task.referenceNumber || ''}</td>
                <td className="description-cell">{task.description}</td>
                <td>{unitPageCount}</td>
                <td>{task.type || '3D'}</td>
                <td className="price-cell">{formatCurrency(firstPageTaskTotals[index])}</td>
              </tr>
            );
          })}
          
          {/* Administrative overhead row - only on first page when not paginating */}
          {!needsPagination && baseRates.overheadPercentage > 0 && (
            <tr>
              <td></td>
              <td>Administrative overhead</td>
              <td className="description-cell"></td>
              <td></td>
              <td></td>
              <td className="price-cell">{formatCurrency(overheadTotal)}</td>
            </tr>
          )}
          
          {/* Nothing Follow row - only on first page when not paginating */}
          {!needsPagination && (
            <tr>
              <td></td>
              <td></td>
              <td className="description-cell nothing-follow">--- NOTHING FOLLOW ---</td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          )}
          
          {/* Empty rows to fill space when not paginating */}
          {!needsPagination && Array.from({ length: Math.max(0, maxRows - firstPageTasks.length - (baseRates.overheadPercentage > 0 ? 1 : 0) - 1) }, (_, i) => (
            <tr key={`empty-${i}`}>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          ))}
          
          {/* Continuation note when paginating */}
          {needsPagination && (
            <tr className="continuation-note">
              <td></td>
              <td></td>
              <td className="description-cell nothing-follow">--- CONTINUED ON NEXT PAGE ---</td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          )}
          
          {/* Total row - only on first page when not paginating */}
          {!needsPagination && (
            <tr style={{backgroundColor: '#f5f5f5', fontWeight: 'bold', fontSize: '14px'}}>
              <td colSpan="5" style={{textAlign: 'center'}}>Total Amount</td>
              <td className="price-cell">{formatCurrency(grandTotal)}</td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Terms - only show when not paginating */}
      {!needsPagination && (
        <div className="terms-visual">
          Upon receipt of this quotation sheet, kindly send us one copy with your signature.<br/><br/>
          The price will be changed without prior notice due to frequent changes of conversion rate.
        </div>
      )}

      {/* Signatures - only show when not paginating */}
      {!needsPagination && (
        <div className="signatures-visual">
          {printMode === 'billing' ? (
            <>
              {/* Billing Statement Signatures */}
              <div className="signature-row-visual">
                <div className="signature-left-visual">
                  <div className="sig-label-visual">Prepared by:</div>
                  <div className="sig-line-visual"></div>
                  <div className="sig-name-visual">{signatures.billing.preparedBy.name || 'MS. PAULYN MURRILL BEJER'}</div>
                  <div className="sig-title-visual">{signatures.billing.preparedBy.title || 'Accounting Staff'}</div>
                </div>
                <div className="signature-right-visual">
                  <div className="sig-label-visual">Approved by:</div>
                  <div className="sig-line-visual"></div>
                  <div className="sig-name-visual">{signatures.billing.approvedBy.name || 'MR. MICHAEL PEÑANO'}</div>
                  <div className="sig-title-visual">{signatures.billing.approvedBy.title || 'Engineering Manager'}</div>
                </div>
              </div>
              <div className="signature-row-visual">
                <div className="signature-left-visual">
                  <div className="sig-label-visual"></div>
                  <div className="sig-name-visual"></div>
                </div>
                <div className="signature-right-visual">
                  <div className="sig-label-visual">Final Approver:</div>
                  <div className="sig-line-visual"></div>
                  <div className="sig-name-visual">{signatures.billing.finalApprover.name || 'MR. YUICHIRO MAENO'}</div>
                  <div className="sig-title-visual">{signatures.billing.finalApprover.title || 'President'}</div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Quotation Signatures */}
              <div className="signature-row-visual">
                <div className="signature-left-visual">
                  <div className="sig-label-visual">Prepared by:</div>
                  <div className="sig-line-visual"></div>
                  <div className="sig-name-visual">{signatures.quotation.preparedBy.name || 'MR. MICHAEL PEÑANO'}</div>
                  <div className="sig-title-visual">{signatures.quotation.preparedBy.title || 'Engineering Manager'}</div>
                </div>
                <div className="signature-right-visual"></div>
              </div>
              <div className="signature-row-visual">
                <div className="signature-left-visual">
                  <div className="sig-label-visual">Approved by:</div>
                  <div className="sig-line-visual"></div>
                  <div className="sig-name-visual">{signatures.quotation.approvedBy.name || 'MR. YUICHIRO MAENO'}</div>
                  <div className="sig-title-visual">{signatures.quotation.approvedBy.title || 'President'}</div>
                </div>
                <div className="signature-right-visual">
                  <div className="sig-label-visual">Received by:</div>
                  <div className="sig-line-visual"></div>
                  <div className="sig-name-visual">{signatures.quotation.receivedBy.label || '(Signature Over Printed Name)'}</div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Footer - only show when not paginating */}
      {!needsPagination && (
        <div className="footer-visual">
          {printMode === 'billing' ? (
            <>
              {/* Billing Statement Footer with Bank Details */}
              <div className="bank-details-section">
                <div className="bank-details-title">BANK DETAILS (Yen)</div>
                <div className="bank-details-grid">
                  <div className="bank-detail-row">
                    <span className="bank-label">BANK NAME:</span>
                    <span className="bank-value">RIZAL COMMERCIAL BANK CORPORATION</span>
                  </div>
                  <div className="bank-detail-row">
                    <span className="bank-label">SAVINGS ACCOUNT NAME:</span>
                    <span className="bank-value">KUSAKABE & MAENO TECH INC.</span>
                  </div>
                  <div className="bank-detail-row">
                    <span className="bank-label">SAVINGS ACCOUNT NUMBER:</span>
                    <span className="bank-value">0000000011581337</span>
                  </div>
                  <div className="bank-detail-row">
                    <span className="bank-label">BANK ADDRESS:</span>
                    <span className="bank-value">RCBC DASMARINAS BRANCH RCBS BLDG. FCIE COMPOUND, GOVERNOR'S DRIVE LANGKAAN, DASMARINAS CAVITE</span>
                  </div>
                  <div className="bank-detail-row">
                    <span className="bank-label">SWIFT CODE:</span>
                    <span className="bank-value">RCBCPHMM</span>
                  </div>
                  <div className="bank-detail-row">
                    <span className="bank-label">BRANCH CODE:</span>
                    <span className="bank-value">358</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Quotation Footer */}
              <div>cc: admin/acctg/Engineering</div>
              <div>Admin Quotation Template v3.0-2025</div>
            </>
          )}
        </div>
      )}

    </div>
  );

  // Render second page (when needed)
  const renderSecondPage = () => (
    <>
      {/* Page Break Separator - Only visible in preview */}
      <div className="page-separator" style={{
        height: '60px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8f9fa',
        border: '2px dashed #ccc',
        borderRadius: '8px',
        margin: '40px 0',
        color: '#666',
        fontWeight: 'bold',
        fontSize: '14px',
        letterSpacing: '1px'
      }}>
        PAGE 2
      </div>
      
      <div className="quotation-visual-exact" style={{ 
        pageBreakBefore: 'always',
        marginTop: '0' // Reset since separator handles spacing
      }}>
      
      {/* Header Section - Same as first page but without right details */}
      <div className={`header-visual ${printMode === 'billing' ? 'billing-header' : ''}`}>
        {/* Logo */}
        <div className="logo-visual">
          <img src={Logo} alt="Company Logo" />
        </div>

        {/* Center Text */}
        <div className="center-text-visual">
          <div className="company-name-visual">
            {printMode === 'billing' 
              ? 'KUSAKABE & MAENO TECH., INC'
              : <>KUSAKABE & MAENO<br/>TECH., INC</>
            }
          </div>
          
          {printMode === 'billing' && (
            <div className="company-address-visual">
              Vital Industrial Properties Inc., Bldg B. Unit 2B First Cavite<br/>
              Industrial Estate, Langkaan, Dasmarinas,Cavite, Philippines<br/>
              Vat Reg. TIN: 008-883-390-000
            </div>
          )}
          
          <div className="quotation-title-visual">
            {printMode === 'billing' ? 'BILLING STATEMENT' : 'Quotation'}
          </div>
        </div>

        {/* Right Details - Include company info on second page too */}
        {printMode === 'billing' ? null : (
          <div className="right-details-visual">
            <div className="company-info-visual">
              <div className="company-name-info">KUSAKABE & MAENO TECH., INC</div>
              {companyInfo.address}<br/>
              {companyInfo.city}<br/>
              {companyInfo.location}<br/>
              {companyInfo.phone}
            </div>
            
            {/* No quotation details on second page */}
          </div>
        )}
      </div>

      {/* Table Continuation */}
      <table className="table-visual" style={{ marginTop: '40px' }}>
        <thead>
          <tr>
            <th className="col-no">NO.</th>
            <th className="col-reference">REFERENCE NO.</th>
            <th className="col-description">DESCRIPTION</th>
            <th className="col-unitpage">UNIT PAGE</th>
            <th className="col-type">TYPE</th>
            <th className="col-price">PRICE</th>
          </tr>
        </thead>
        <tbody>
          {/* Second page task rows - continue numbering */}
          {secondPageTaskTotals.map((total, index) => {
            const task = firstPageTasks.length > 15 ? mainTasks[firstPageTasks.length + index] : mainTasks[15 + index];
            const aggregatedHours = getAggregatedHours(task, mainTasks);
            const unitPageCount = getUnitPageCount(task);
            const taskNumber = firstPageTasks.length + index + 1; // Continue numbering from first page
            return (
              <tr key={task.id}>
                <td>{taskNumber}</td>
                <td>{task.referenceNumber || ''}</td>
                <td className="description-cell">{task.description}</td>
                <td>{unitPageCount}</td>
                <td>{task.type || '3D'}</td>
                <td className="price-cell">{formatCurrency(total)}</td>
              </tr>
            );
          })}
          
          {/* Administrative overhead row */}
          {baseRates.overheadPercentage > 0 && (
            <tr>
              <td></td>
              <td>Administrative overhead</td>
              <td className="description-cell"></td>
              <td></td>
              <td></td>
              <td className="price-cell">{formatCurrency(overheadTotal)}</td>
            </tr>
          )}
          
          {/* Nothing Follow row */}
          <tr>
            <td></td>
            <td></td>
            <td className="description-cell nothing-follow">--- NOTHING FOLLOW ---</td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          
          {/* Calculate remaining empty rows for second page - based on row limit logic */}
          {Array.from({ 
            length: secondPageEmptyRows 
          }, (_, i) => (
            <tr key={`empty-page2-${i}`}>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          ))}
          
          {/* Total row */}
          <tr style={{backgroundColor: '#f5f5f5', fontWeight: 'bold', fontSize: '14px'}}>
            <td colSpan="5" style={{textAlign: 'center'}}>Total Amount</td>
            <td className="price-cell">{formatCurrency(grandTotal)}</td>
          </tr>
        </tbody>
      </table>

      {/* Terms */}
      <div className="terms-visual">
        Upon receipt of this quotation sheet, kindly send us one copy with your signature.<br/><br/>
        The price will be changed without prior notice due to frequent changes of conversion rate.
      </div>

      {/* Signatures */}
      <div className="signatures-visual">
        {printMode === 'billing' ? (
          <>
            {/* Billing Statement Signatures */}
            <div className="signature-row-visual">
              <div className="signature-left-visual">
                <div className="sig-label-visual">Prepared by:</div>
                <div className="sig-line-visual"></div>
                <div className="sig-name-visual">{signatures.billing.preparedBy.name || 'MS. PAULYN MURRILL BEJER'}</div>
                <div className="sig-title-visual">{signatures.billing.preparedBy.title || 'Accounting Staff'}</div>
              </div>
              <div className="signature-right-visual">
                <div className="sig-label-visual">Approved by:</div>
                <div className="sig-line-visual"></div>
                <div className="sig-name-visual">{signatures.billing.approvedBy.name || 'MR. MICHAEL PEÑANO'}</div>
                <div className="sig-title-visual">{signatures.billing.approvedBy.title || 'Engineering Manager'}</div>
              </div>
            </div>
            <div className="signature-row-visual">
              <div className="signature-left-visual">
                <div className="sig-label-visual"></div>
                <div className="sig-name-visual"></div>
              </div>
              <div className="signature-right-visual">
                <div className="sig-label-visual">Final Approver:</div>
                <div className="sig-line-visual"></div>
                <div className="sig-name-visual">{signatures.billing.finalApprover.name || 'MR. YUICHIRO MAENO'}</div>
                <div className="sig-title-visual">{signatures.billing.finalApprover.title || 'President'}</div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Quotation Signatures */}
            <div className="signature-row-visual">
              <div className="signature-left-visual">
                <div className="sig-label-visual">Prepared by:</div>
                <div className="sig-line-visual"></div>
                <div className="sig-name-visual">{signatures.quotation.preparedBy.name || 'MR. MICHAEL PEÑANO'}</div>
                <div className="sig-title-visual">{signatures.quotation.preparedBy.title || 'Engineering Manager'}</div>
              </div>
              <div className="signature-right-visual"></div>
            </div>
            <div className="signature-row-visual">
              <div className="signature-left-visual">
                <div className="sig-label-visual">Approved by:</div>
                <div className="sig-line-visual"></div>
                <div className="sig-name-visual">{signatures.quotation.approvedBy.name || 'MR. YUICHIRO MAENO'}</div>
                <div className="sig-title-visual">{signatures.quotation.approvedBy.title || 'President'}</div>
              </div>
              <div className="signature-right-visual">
                <div className="sig-label-visual">Received by:</div>
                <div className="sig-line-visual"></div>
                <div className="sig-name-visual">{signatures.quotation.receivedBy.label || '(Signature Over Printed Name)'}</div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="footer-visual">
        {printMode === 'billing' ? (
          <>
            {/* Billing Statement Footer with Bank Details */}
            <div className="bank-details-section">
              <div className="bank-details-title">BANK DETAILS (Yen)</div>
              <div className="bank-details-grid">
                <div className="bank-detail-row">
                  <span className="bank-label">BANK NAME:</span>
                  <span className="bank-value">RIZAL COMMERCIAL BANK CORPORATION</span>
                </div>
                <div className="bank-detail-row">
                  <span className="bank-label">SAVINGS ACCOUNT NAME:</span>
                  <span className="bank-value">KUSAKABE & MAENO TECH INC.</span>
                </div>
                <div className="bank-detail-row">
                  <span className="bank-label">SAVINGS ACCOUNT NUMBER:</span>
                  <span className="bank-value">0000000011581337</span>
                </div>
                <div className="bank-detail-row">
                  <span className="bank-label">BANK ADDRESS:</span>
                  <span className="bank-value">RCBC DASMARINAS BRANCH RCBS BLDG. FCIE COMPOUND, GOVERNOR'S DRIVE LANGKAAN, DASMARINAS CAVITE</span>
                </div>
                <div className="bank-detail-row">
                  <span className="bank-label">SWIFT CODE:</span>
                  <span className="bank-value">RCBCPHMM</span>
                </div>
                <div className="bank-detail-row">
                  <span className="bank-label">BRANCH CODE:</span>
                  <span className="bank-value">358</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Quotation Footer */}
            <div>cc: admin/acctg/Engineering</div>
            <div>Admin Quotation Template v3.0-2025</div>
          </>
        )}
      </div>

      </div>

    </>
  );

  if (!isOpen) return null;

  return (
    <div className="print-preview-modal">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Printer className="title-icon" />
            <h2>Print Preview - {printMode === 'billing' ? 'Billing Statement' : 'Quotation'}</h2>
          </div>
          <div className="modal-header-actions">
            {/* Print Mode Toggle Buttons */}
            <div className="print-mode-buttons">
              <button 
                onClick={() => setPrintMode('quotation')}
                className={`mode-button ${printMode === 'quotation' ? 'active' : ''}`}
              >
                <FileText size={14} />
                Print Quotation
              </button>
              <button 
                onClick={() => setPrintMode('billing')}
                className={`mode-button ${printMode === 'billing' ? 'active' : ''}`}
              >
                <FileText size={14} />
                Print Billing Statement
              </button>
            </div>
            
            <div className="action-separator"></div>
            
            <button 
              onClick={() => setIsQuickEditOpen(true)}
              disabled={isProcessing}
              className="action-button secondary"
            >
              <Edit3 size={14} />
              Quick Edit
            </button>
            <button 
              onClick={handlePrint}
              disabled={isProcessing}
              className="action-button primary"
            >
              <Printer size={14} />
              {isProcessing ? 'Processing...' : 'Print'}
            </button>
            <button 
              onClick={handleDownloadPDF}
              disabled={isProcessing}
              className="action-button export"
            >
              <Download size={14} />
              {isProcessing ? 'Generating PDF...' : 'Download PDF'}
            </button>
            <button onClick={onClose} className="close-button">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="modal-body">
          {/* Preview Panel - Full Width */}
          <div className="preview-panel-full">
            <div className="preview-container">
              <div 
                className="preview-page"
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top center',
                }}
              >
                <div 
                  ref={previewRef}
                  className="preview-content"
                >
                  {/* Render first page */}
                  {renderFirstPage()}
                  
                  {/* Render second page if needed */}
                  {needsPagination && renderSecondPage()}
                </div>
              </div>
            </div>
            
            {/* Preview Info */}
            <div className="preview-info">
              <span className="page-info">
                <FileText size={14} />
                Page {totalPages > 1 ? `1-${totalPages}` : '1'} of {totalPages} • A4 Portrait
              </span>
              <span className="zoom-info">100% zoom</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Edit Modal */}
      <QuickEditModal
        isOpen={isQuickEditOpen}
        onClose={() => setIsQuickEditOpen(false)}
        tasks={localTasks}
        baseRates={baseRates}
        manualOverrides={localManualOverrides}
        onApplyChanges={handleQuickEditApply}
      />
    </div>
  );
});

PrintPreviewModal.displayName = 'PrintPreviewModal';

export default PrintPreviewModal;
