import React, { memo, useState, useMemo, useCallback, useRef } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  ZoomIn, 
  ZoomOut,
  RotateCw,
  FileText,
  Settings
} from 'lucide-react';
import './PrintPreviewModal.css';
import '../PrintLayout/VisualLayout.css';
import Logo from "./KmtiLogo.png";

// Paper size definitions (in mm)
const PAPER_SIZES = {
  'A4': { width: 210, height: 297, label: 'A4 (210 × 297 mm)' },
  'A3': { width: 297, height: 420, label: 'A3 (297 × 420 mm)' },
  'Letter': { width: 216, height: 279, label: 'Letter (8.5 × 11 in)' },
  'Legal': { width: 216, height: 356, label: 'Legal (8.5 × 14 in)' },
  'A5': { width: 148, height: 210, label: 'A5 (148 × 210 mm)' },
};

const ORIENTATIONS = {
  portrait: 'Portrait',
  landscape: 'Landscape'
};

const ZOOM_LEVELS = [25, 50, 75, 100, 125, 150, 200];

const MARGIN_PRESETS = {
  none: { top: 0, right: 0, bottom: 0, left: 0, label: 'None' },
  minimum: { top: 2, right: 2, bottom: 2, left: 2, label: 'Minimum' },
  default: { top: 5, right: 5, bottom: 5, left: 5, label: 'Default' },
  maximum: { top: 8, right: 8, bottom: 8, left: 8, label: 'Maximum' },
};

const PrintPreviewModal = memo(({ 
  isOpen, 
  onClose, 
  companyInfo,
  clientInfo,
  quotationDetails,
  tasks,
  baseRates 
}) => {
  // State for print settings
  const [settings, setSettings] = useState({
    paperSize: 'A4',
    orientation: 'portrait',
    margins: 'default',
    zoom: 100,
    showHeaders: true,
    showFooters: true,
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const previewRef = useRef(null);

  // Calculate paper dimensions
  const paperDimensions = useMemo(() => {
    const paper = PAPER_SIZES[settings.paperSize];
    const isLandscape = settings.orientation === 'landscape';
    
    return {
      width: isLandscape ? paper.height : paper.width,
      height: isLandscape ? paper.width : paper.height,
      label: paper.label
    };
  }, [settings.paperSize, settings.orientation]);

  // Calculate margins
  const margins = useMemo(() => {
    return MARGIN_PRESETS[settings.margins];
  }, [settings.margins]);

  // Update setting
  const updateSetting = useCallback((key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  }, []);

  // Calculate preview scale - MATCH PRINT LAYOUT SIZE
  const previewScale = useMemo(() => {
    // Match the actual print layout size - much larger scale
    const baseScale = 1.0; // Full size to match print layout
    return baseScale * (settings.zoom / 100);
  }, [settings.zoom]);

  // Memoize calculations for print layout
  const { taskTotals, grandTotal, overheadTotal, actualTaskCount, maxRows } = useMemo(() => {
    const totals = tasks.map((task) => {
      const basicLabor = task.totalHours * baseRates.timeChargeRate;
      const overtime = task.overtimeHours * baseRates.overtimeRate;
      const software = (task.softwareUnits || 0) * baseRates.softwareRate;
      return basicLabor + overtime + software; // Task subtotal without overhead
    });

    const subtotalWithoutOverhead = totals.reduce((sum, total) => sum + total, 0);
    const overhead = subtotalWithoutOverhead * (baseRates.overheadPercentage / 100);
    const grand = subtotalWithoutOverhead + overhead;
    
    // Calculate task count and max rows
    const taskCount = tasks.length + (baseRates.overheadPercentage > 0 ? 1 : 0);
    const rows = taskCount > 10 ? Math.min(taskCount, 20) : 10;
    
    return { 
      taskTotals: totals, 
      grandTotal: grand,
      overheadTotal: overhead,
      actualTaskCount: taskCount,
      maxRows: rows
    };
  }, [tasks, baseRates]);

  const formatCurrency = useCallback((amount) => {
    return `¥${amount.toLocaleString()}`;
  }, []);

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
            top: margins.top,
            bottom: margins.bottom,
            left: margins.left,
            right: margins.right
          },
          pageSize: settings.paperSize,
          landscape: settings.orientation === 'landscape'
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
  }, [settings, margins]);

  // Handle PDF download
  const handleDownloadPDF = useCallback(async () => {
    setIsProcessing(true);
    try {
      if (window.electronAPI) {
        await window.electronAPI.printToPDF({
          margins: {
            marginType: 'custom',
            top: margins.top,
            bottom: margins.bottom,
            left: margins.left,
            right: margins.right
          },
          pageSize: settings.paperSize,
          landscape: settings.orientation === 'landscape',
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
  }, [quotationDetails.quotationNo, settings, margins]);

  // Handle zoom
  const handleZoomIn = useCallback(() => {
    const currentIndex = ZOOM_LEVELS.indexOf(settings.zoom);
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      updateSetting('zoom', ZOOM_LEVELS[currentIndex + 1]);
    }
  }, [settings.zoom, updateSetting]);

  const handleZoomOut = useCallback(() => {
    const currentIndex = ZOOM_LEVELS.indexOf(settings.zoom);
    if (currentIndex > 0) {
      updateSetting('zoom', ZOOM_LEVELS[currentIndex - 1]);
    }
  }, [settings.zoom, updateSetting]);

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
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Settings Panel */}
          <div className="settings-panel">
            <div className="settings-section">
              <h3>
                <Settings size={16} />
                Print Settings
              </h3>
              
              {/* Paper Size */}
              <div className="setting-group">
                <label>Paper Size</label>
                <select 
                  value={settings.paperSize} 
                  onChange={(e) => updateSetting('paperSize', e.target.value)}
                  className="setting-select"
                >
                  {Object.entries(PAPER_SIZES).map(([key, size]) => (
                    <option key={key} value={key}>{size.label}</option>
                  ))}
                </select>
              </div>

              {/* Orientation */}
              <div className="setting-group">
                <label>Orientation</label>
                <select 
                  value={settings.orientation} 
                  onChange={(e) => updateSetting('orientation', e.target.value)}
                  className="setting-select"
                >
                  {Object.entries(ORIENTATIONS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Margins */}
              <div className="setting-group">
                <label>Margins</label>
                <select 
                  value={settings.margins} 
                  onChange={(e) => updateSetting('margins', e.target.value)}
                  className="setting-select"
                >
                  {Object.entries(MARGIN_PRESETS).map(([key, margin]) => (
                    <option key={key} value={key}>{margin.label}</option>
                  ))}
                </select>
              </div>

              {/* Zoom Controls */}
              <div className="setting-group">
                <label>Zoom</label>
                <div className="zoom-controls">
                  <button 
                    onClick={handleZoomOut} 
                    disabled={settings.zoom <= ZOOM_LEVELS[0]}
                    className="zoom-button"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <select 
                    value={settings.zoom} 
                    onChange={(e) => updateSetting('zoom', parseInt(e.target.value))}
                    className="zoom-select"
                  >
                    {ZOOM_LEVELS.map(zoom => (
                      <option key={zoom} value={zoom}>{zoom}%</option>
                    ))}
                  </select>
                  <button 
                    onClick={handleZoomIn} 
                    disabled={settings.zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
                    className="zoom-button"
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="action-buttons">
              <button 
                onClick={handlePrint}
                disabled={isProcessing}
                className="action-button primary"
              >
                <Printer size={16} />
                {isProcessing ? 'Processing...' : 'Print'}
              </button>
              <button 
                onClick={handleDownloadPDF}
                disabled={isProcessing}
                className="action-button secondary"
              >
                <Download size={16} />
                {isProcessing ? 'Generating PDF...' : 'Download PDF'}
              </button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="preview-panel">
            <div className="preview-container">
              <div 
                className="preview-page"
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top center', /* Back to top center for horizontal centering */
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
                          <th className="col-unit">UNIT<br/>(PAGE)</th>
                          <th className="col-type">TYPE</th>
                          <th className="col-price">PRICE</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Task rows */}
                        {tasks.map((task, index) => (
                          <tr key={task.id}>
                            <td>{index + 1}</td>
                            <td>{task.referenceNumber || ''}</td>
                            <td className="description-cell">{task.description}</td>
                            <td>{task.days > 0 ? task.days : ''}</td>
                            <td>3D</td>
                            <td className="price-cell">{formatCurrency(taskTotals[index])}</td>
                          </tr>
                        ))}
                        
                        {/* Administrative overhead row */}
                        {baseRates.overheadPercentage > 0 && (
                          <tr>
                            <td>{tasks.length + 1}</td>
                            <td>Administrative overhead</td>
                            <td className="description-cell"></td>
                            <td></td>
                            <td></td>
                            <td className="price-cell">{formatCurrency(overheadTotal)}</td>
                          </tr>
                        )}
                        
                        {/* Empty rows to fill space - dynamic based on phase */}
                        {Array.from({ length: Math.max(0, maxRows - tasks.length - (baseRates.overheadPercentage > 0 ? 1 : 0)) }, (_, i) => (
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
                Page 1 of 1 • {paperDimensions.label} • {settings.orientation}
              </span>
              <span className="zoom-info">{settings.zoom}% zoom</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

PrintPreviewModal.displayName = 'PrintPreviewModal';

export default PrintPreviewModal;
