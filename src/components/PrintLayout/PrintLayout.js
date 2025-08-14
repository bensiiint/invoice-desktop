import React, { memo, useMemo } from 'react';

const PrintLayout = memo(({
  companyInfo,
  clientInfo,
  quotationDetails,
  tasks,
  baseRates,
}) => {
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

  const formatCurrency = (amount) => {
    return `¥${amount.toLocaleString()}`;
  };

  return (
    <div className="print-only-layout">
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
  );
});

PrintLayout.displayName = 'PrintLayout';

export default PrintLayout;
