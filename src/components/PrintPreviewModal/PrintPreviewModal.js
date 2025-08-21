import React, { memo, useState, useMemo, useCallback, useRef } from 'react';
import { 
  X, 
  Printer, 
  Download,
  FileText
} from 'lucide-react';
import './PrintPreviewModal.css';
import '../PrintLayout/VisualLayout.css';
import Logo from "./KmtiLogo.png";

const PrintPreviewModal = memo(({ 
  isOpen, 
  onClose, 
  companyInfo,
  clientInfo,
  quotationDetails,
  tasks,
  baseRates 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const previewRef = useRef(null);

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

  // Memoize calculations for print layout
  const { taskTotals, grandTotal, overheadTotal, actualTaskCount, maxRows, mainTasks } = useMemo(() => {
    // Filter only main tasks for display
    const mainTasks = tasks.filter(task => task.isMainTask);
    
    const totals = mainTasks.map((task) => {
      // Calculate main task hours and minutes
      const mainTotalHours = (task.hours || 0) + (task.minutes || 0) / 60;
      
      // Aggregate sub-task totals
      const subTasks = tasks.filter(t => t.parentId === task.id);
      let aggregatedHours = mainTotalHours;
      let aggregatedOvertime = task.overtimeHours;
      let aggregatedSoftware = (task.softwareUnits || 0);
      
      subTasks.forEach(subTask => {
        const subTotalHours = (subTask.hours || 0) + (subTask.minutes || 0) / 60;
        aggregatedHours += subTotalHours;
        aggregatedOvertime += subTask.overtimeHours;
        aggregatedSoftware += (subTask.softwareUnits || 0);
      });
      
      const basicLabor = aggregatedHours * baseRates.timeChargeRate;
      const overtime = aggregatedOvertime * baseRates.overtimeRate;
      const software = aggregatedSoftware * baseRates.softwareRate;
      return basicLabor + overtime + software; // Task subtotal without overhead
    });

    const subtotalWithoutOverhead = totals.reduce((sum, total) => sum + total, 0);
    const overhead = subtotalWithoutOverhead * (baseRates.overheadPercentage / 100);
    const grand = subtotalWithoutOverhead + overhead;
    
    // Calculate task count and max rows (including nothing follow row)
    const taskCount = mainTasks.length + (baseRates.overheadPercentage > 0 ? 1 : 0) + 1; // +1 for nothing follow
    const rows = taskCount > 10 ? Math.min(taskCount, 20) : 10;
    
    return { 
      taskTotals: totals, 
      grandTotal: grand,
      overheadTotal: overhead,
      actualTaskCount: taskCount,
      maxRows: rows,
      mainTasks // Also return filtered main tasks
    };
  }, [tasks, baseRates]);

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
  
  const getAggregatedHours = useCallback((mainTask, mainTasks) => {
    // Get sub-tasks for this main task
    const subTasks = tasks.filter(t => t.parentId === mainTask.id);
    
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
  }, [tasks]);

  // Handle print
  const handlePrint = useCallback(async () => {
    setIsProcessing(true);
    try {
      if (window.electronAPI) {
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
        window.print();
      }
    } catch (error) {
      console.error('Print failed:', error);
      alert('Print failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  // Handle PDF download
  const handleDownloadPDF = useCallback(async () => {
    setIsProcessing(true);
    try {
      if (window.electronAPI) {
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
          filename: `KMTI_Quotation_${quotationDetails.quotationNo || 'Draft'}.pdf`
        });
        alert('PDF saved successfully!');
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
  }, [quotationDetails.quotationNo]);

  if (!isOpen) return null;

  return (
    <div className="print-preview-modal">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <Printer className="title-icon" />
            <h2>Print Preview</h2>
          </div>
          <div className="modal-header-actions">
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
                  {/* SIMPLE VISUAL LAYOUT - EXACTLY WHAT YOU SEE */}
                  <div className={`quotation-visual-exact task-count-${actualTaskCount}`}>
                    
                    {/* Header Section */}
                    <div className="header-visual">
                      {/* Logo */}
                      <div className="logo-visual">
                        <img src={Logo} alt="Company Logo" />
                      </div>

                      {/* Center Text */}
                      <div className="center-text-visual">
                        <div className="company-name-visual">
                          KUSAKABE & MAENO<br/>
                          TECH., INC
                        </div>
                        <div className="quotation-title-visual">
                          Quotation
                        </div>
                      </div>

                      {/* Right Details */}
                      <div className="right-details-visual">
                        <div className="company-info-visual">
                          <div className="company-name-info">KUSAKABE & MAENO TECH., INC</div>
                          {companyInfo.address}<br/>
                          {companyInfo.city}<br/>
                          {companyInfo.location}<br/>
                          {companyInfo.phone}
                        </div>
                        
                        <div className="quotation-details-visual">
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
                        </div>
                      </div>
                    </div>

                    {/* Contact Section */}
                    <div className="contact-section-visual">
                      <div className="quotation-to-visual">Quotation to:</div>
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
                          <th className="col-unit">HOURS</th>
                          <th className="col-type">TYPE</th>
                          <th className="col-price">PRICE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Task rows */}
                        {mainTasks.map((task, index) => {
                          const aggregatedHours = getAggregatedHours(task, mainTasks);
                          return (
                            <tr key={task.id}>
                              <td>{index + 1}</td>
                              <td>{task.referenceNumber || ''}</td>
                              <td className="description-cell">{task.description}</td>
                              <td>{formatHours(aggregatedHours.hours, aggregatedHours.minutes)}</td>
                              <td>{task.type || '3D'}</td>
                              <td className="price-cell">{formatCurrency(taskTotals[index])}</td>
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
                        
                        {/* Nothing Follow row - security feature */}
                        <tr>
                          <td></td>
                          <td></td>
                          <td className="description-cell nothing-follow">--- NOTHING FOLLOW ---</td>
                          <td></td>
                          <td></td>
                          <td></td>
                        </tr>
                        
                        {/* Empty rows to fill space - dynamic based on phase (reduced by 1 for nothing follow row) */}
                        {Array.from({ length: Math.max(0, maxRows - mainTasks.length - (baseRates.overheadPercentage > 0 ? 1 : 0) - 1) }, (_, i) => (
                          <tr key={`empty-${i}`}>
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
                      {/* First row - Prepared by */}
                      <div className="signature-row-visual">
                        <div className="signature-left-visual">
                          <div className="sig-label-visual">Prepared by:</div>
                          <div className="sig-line-visual"></div>
                          <div className="sig-name-visual">MR. MICHAEL PENANO</div>
                          <div className="sig-title-visual">Engineering Manager</div>
                        </div>
                        <div className="signature-right-visual"></div>
                      </div>

                      {/* Second row - Approved by & Received by */}
                      <div className="signature-row-visual">
                        <div className="signature-left-visual">
                          <div className="sig-label-visual">Approved by:</div>
                          <div className="sig-line-visual"></div>
                          <div className="sig-name-visual">MR. YUICHIRO MAENO</div>
                          <div className="sig-title-visual">President</div>
                        </div>
                        <div className="signature-right-visual">
                          <div className="sig-label-visual">Received by:</div>
                          <div className="sig-line-visual"></div>
                          <div className="sig-name-visual">(Signature Over Printed Name)</div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="footer-visual">
                      <div>cc: admin/acctg/Engineering</div>
                      <div>Admin Quotation Template v3.0-2025</div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
            
            {/* Preview Info */}
            <div className="preview-info">
              <span className="page-info">
                <FileText size={14} />
                Page 1 of 1 • A4 Portrait
              </span>
              <span className="zoom-info">100% zoom</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

PrintPreviewModal.displayName = 'PrintPreviewModal';

export default PrintPreviewModal;
