import React, { memo, useMemo } from 'react';
import Logo from './KmtiLogo.png';
import './VisualLayout.css';

const PrintLayout = memo(({
  companyInfo,
  clientInfo,
  quotationDetails,
  tasks,
  baseRates,
  isPreview = false
}) => {
  // Memoize calculations
  const { taskTotals, grandTotal, overheadTotal } = useMemo(() => {
    const totals = tasks.map((task) => {
      const basicLabor = task.totalHours * baseRates.timeChargeRate;
      const overtime = task.overtimeHours * baseRates.overtimeRate;
      const software = (task.softwareUnits || 0) * baseRates.softwareRate;
      return basicLabor + overtime + software; // Task subtotal without overhead
    });

    const subtotalWithoutOverhead = totals.reduce((sum, total) => sum + total, 0);
    const overhead = subtotalWithoutOverhead * (baseRates.overheadPercentage / 100);
    const grand = subtotalWithoutOverhead + overhead;
    
    return { 
      taskTotals: totals, 
      grandTotal: grand,
      overheadTotal: overhead
    };
  }, [tasks, baseRates]);

  const formatCurrency = (amount) => {
    return `¥${amount.toLocaleString()}`;
  };

  return (
    <div className="print-only-layout">
      <div className={`quotation-visual-exact ${isPreview ? 'preview-scale' : ''}`}>
        
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
            
            {/* Empty rows to fill space - default 10 rows total */}
            {Array.from({ length: Math.max(0, 10 - tasks.length - (baseRates.overheadPercentage > 0 ? 1 : 0)) }, (_, i) => (
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
  );
});

PrintLayout.displayName = 'PrintLayout';

export default PrintLayout;
