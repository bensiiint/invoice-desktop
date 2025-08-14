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

  // Calculate preview scale to fit in container
  const previewScale = useMemo(() => {
    const containerHeight = 650; // Increased preview container height
    const containerWidth = 500;  // Increased preview container width
    
    const scaleX = containerWidth / paperDimensions.width;
    const scaleY = containerHeight / paperDimensions.height;
    const baseScale = Math.min(scaleX, scaleY, 1) * 0.9; // 90% of available space for better fit
    
    return baseScale * (settings.zoom / 100);
  }, [paperDimensions, settings.zoom]);

  // Memoize calculations for print layout
  const { taskTotals, grandTotal } = useMemo(() => {
    const totals = tasks.map((task) => {
      const basicLabor = task.totalHours * baseRates.timeChargeRate;
      const overtime = task.overtimeHours * baseRates.overtimeRate;
      const software = (task.softwareUnits || 0) * baseRates.softwareRate;
      const subtotal = basicLabor + overtime + software;
      const overhead = subtotal * (baseRates.overheadPercentage / 100);
      return basicLabor + overtime + software + overhead;
    });

    const grand = totals.reduce((sum, total) => sum + total, 0);
    return { taskTotals: totals, grandTotal: grand };
  }, [tasks, baseRates]);

  const formatCurrency = useCallback((amount) => {
    return `¥${amount.toLocaleString()}`;
  }, []);

  // Handle print
  const handlePrint = useCallback(async () => {
    setIsProcessing(true);
    try {
      // Apply print settings to document
      const printStyles = `
        @page {
          size: ${settings.orientation === 'landscape' ? 'landscape' : 'portrait'};
          margin: ${margins.top}mm ${margins.right}mm ${margins.bottom}mm ${margins.left}mm;
        }
      `;
      
      // Create style element
      const styleEl = document.createElement('style');
      styleEl.textContent = printStyles;
      document.head.appendChild(styleEl);
      
      // Trigger print
      window.print();
      
      // Remove temporary styles
      document.head.removeChild(styleEl);
      
    } catch (error) {
      console.error('Print failed:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [settings, margins]);

  // Handle PDF download
  const handleDownloadPDF = useCallback(async () => {
    setIsProcessing(true);
    try {
      // Dynamic import for html2pdf
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = previewRef.current;
      
      // Add PDF-specific class only to the content element
      if (element) {
        element.classList.add('pdf-generation');
      }
      
      // Wait for styles to apply
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const opt = {
        margin: [margins.top, margins.right, margins.bottom, margins.left],
        filename: `KMTI_Quotation_${quotationDetails.quotationNo || 'Draft'}.pdf`,
        image: { 
          type: 'jpeg', 
          quality: 0.95
        },
        html2canvas: { 
          scale: 2.5,
          useCORS: true,
          letterRendering: true,
          allowTaint: false,
          backgroundColor: '#ffffff',
          width: paperDimensions.width * 3.78,
          height: paperDimensions.height * 3.78,
          scrollX: 0,
          scrollY: 0
        },
        jsPDF: { 
          unit: 'mm', 
          format: [paperDimensions.width, paperDimensions.height],
          orientation: settings.orientation,
          compress: true
        },
        pagebreak: { mode: 'avoid-all' }
      };
      
      await html2pdf().set(opt).from(element).save();
      
    } catch (error) {
      console.error('PDF generation failed:', error);
      // Fallback to print
      handlePrint();
    } finally {
      // Remove PDF-specific class
      const element = previewRef.current;
      if (element) {
        element.classList.remove('pdf-generation');
      }
      setIsProcessing(false);
    }
  }, [quotationDetails.quotationNo, handlePrint, settings, paperDimensions, margins]);

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
                Download PDF
              </button>
            </div>
          </div>

          {/* Preview Panel */}
          <div className="preview-panel">
            <div className="preview-container">
              <div 
                className="preview-page"
                style={{
                  width: `${paperDimensions.width}mm`,
                  height: `${paperDimensions.height}mm`,
                  transform: `scale(${previewScale})`,
                  transformOrigin: 'top left',
                }}
              >
                <div 
                ref={previewRef}
                className={`preview-content ${margins.top === 0 ? 'no-margins' : ''}`}
                style={{
                  '--paper-width': `${paperDimensions.width}mm`,
                  '--paper-height': `${paperDimensions.height}mm`,
                  '--scale-factor': Math.min(paperDimensions.width / 210, paperDimensions.height / 297),
                  '--margin-top': `${margins.top}mm`,
                  '--margin-right': `${margins.right}mm`,
                  '--margin-bottom': `${margins.bottom}mm`,
                  '--margin-left': `${margins.left}mm`
                }}
                >
                  {/* Invoice Content - Exact Copy from PrintLayout */}
                  <div className="quotation-paper-exact">
                    {/* Logo and Header */}
                    <div className="header-section">
                      <div className="logo-section">
                        <div className="company-logo-circle">
                          <img
                            src="/KmtiLogo.png"
                            alt="Company Logo"
                            className="logo-image"
                          />
                        </div>
                      </div>
                      <div className="header-text">
                        <div className="company-name-header">
                          KUSAKABE & MAENO TECH., INC
                        </div>
                        <div className="quotation-title">Quotation</div>
                      </div>
                      <div className="quotation-details-box">
                        <div className="details-container">
                          <div className="detail-line">
                            <span className="detail-label">Quotation. NO.:</span>
                            <span className="detail-value">
                              {quotationDetails.quotationNo}
                            </span>
                          </div>
                          <div className="detail-line">
                            <span className="detail-label">REFERENCE NO.:</span>
                            <span className="detail-value">
                              {quotationDetails.referenceNo}
                            </span>
                          </div>
                          <div className="detail-line">
                            <span className="detail-label">DATE:</span>
                            <span className="detail-value">
                              {quotationDetails.date}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div className="contact-section">
                      <div className="quotation-to">
                        <div className="contact-header">Quotation to</div>
                        <div className="contact-details">
                          <div className="company-name">{clientInfo.company}</div>
                          <div className="contact-person">{clientInfo.contact}</div>
                          <div className="address-line">{clientInfo.address}</div>
                          <div className="phone-line">{clientInfo.phone}</div>
                        </div>
                      </div>
                      <div className="company-from">
                        <div className="contact-header">{companyInfo.name}</div>
                        <div className="from-details">
                          <div className="from-address">{companyInfo.address}</div>
                          <div className="from-address">{companyInfo.city}</div>
                          <div className="from-address">{companyInfo.location}</div>
                          <div className="from-phone">{companyInfo.phone}</div>
                        </div>
                      </div>
                    </div>

                    {/* Items Table */}
                    <table className="quotation-table-exact">
                      <thead>
                        <tr className="table-header">
                          <th className="col-no">No.</th>
                          <th className="col-reference" colSpan="3">
                            REFERENCE NUMBER
                          </th>
                          <th className="col-description">DESCRIPTION</th>
                          <th className="col-unit">
                            Unit
                            <br />
                            (Page)
                          </th>
                          <th className="col-type">Type</th>
                          <th className="col-price" colSpan="2">
                            Price
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {tasks.map((task, index) => (
                          <tr key={task.id} className="item-row">
                            <td className="col-no">{index + 1}</td>
                            <td className="col-reference" colSpan="3">
                              {task.referenceNumber || "　"}
                            </td>
                            <td className="col-description">{task.description}</td>
                            <td className="col-unit">
                              {task.days > 0 ? task.days : "　"}
                            </td>
                            <td className="col-type">{task.unitType}</td>
                            <td className="col-price" colSpan="2">
                              {formatCurrency(taskTotals[index])}
                            </td>
                          </tr>
                        ))}
                        {/* Empty rows to match template */}
                        {Array.from(
                          { length: Math.max(0, 8 - tasks.length) },
                          (_, i) => (
                            <tr key={`empty-${i}`} className="item-row">
                              <td className="col-no">　</td>
                              <td className="col-reference" colSpan="3">
                                　
                              </td>
                              <td className="col-description">　</td>
                              <td className="col-unit">　</td>
                              <td className="col-type">　</td>
                              <td className="col-price" colSpan="2">
                                　
                              </td>
                            </tr>
                          )
                        )}
                        <tr className="total-amount-row">
                          <td colSpan="7" className="total-label">
                            Total Amount
                          </td>
                          <td colSpan="2" className="total-value">
                            {formatCurrency(grandTotal)}
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    {/* Terms */}
                    <div className="terms-section">
                      <p>
                        Upon receipt of this quotation sheet, kindly send us one copy
                        with your signature.
                      </p>
                      <p>
                        The price will be changed without prior notice due to frequent
                        changes of conversion rate.
                      </p>
                    </div>

                    {/* Signatures */}
                    <div className="signatures-section">
                      <div className="signature-top-row">
                        <div className="sig-group">
                          <div className="sig-title">Prepared by:</div>
                          <div className="sig-space"></div>
                          <div className="sig-name">MR. MICHAEL PENAÑO</div>
                          <div className="sig-role">Engineering Manager</div>
                        </div>
                      </div>
                      <div className="signature-bottom-row">
                        <div className="sig-group">
                          <div className="sig-title">Approved by:</div>
                          <div className="sig-space"></div>
                          <div className="sig-name">MR. YUICHIRO MAENO</div>
                          <div className="sig-role">President</div>
                        </div>
                        <div className="sig-group">
                          <div className="sig-title">Received by:</div>
                          <div className="sig-space"></div>
                          <div className="sig-name">(Signature Over Printed Name)</div>
                        </div>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="footer-section">
                      <div className="footer-left">cc: admin/acctg/Engineering</div>
                      <div className="footer-right">
                        Admin Quotation Template v2.0-2016
                      </div>
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
