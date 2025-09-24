import React, { memo, useMemo } from 'react';
import Logo from './KmtiLogo.png';
import './VisualLayout.css';

const PrintLayout = memo(({ 
companyInfo,
clientInfo,
quotationDetails,
tasks,
baseRates,
signatures,
isPreview = false,
printMode = 'quotation'
}) => {
  // Calculate actual task count including overhead + nothing follow row (only main tasks) - LIMIT ASSEMBLY ROWS TO 27
  const mainTasks = tasks.filter(task => task.isMainTask).slice(0, 27); // MAXIMUM 27 ASSEMBLY ROWS
  const actualTaskCount = mainTasks.length + (baseRates.overheadPercentage > 0 ? 1 : 0) + 1; // +1 for nothing follow
  
  // Pagination logic based on assembly row count
  const assemblyRowCount = mainTasks.length; // Only count actual assembly rows
  const needsPagination = assemblyRowCount >= 16;
  const useCompression = assemblyRowCount >= 9 && assemblyRowCount <= 15 && !needsPagination;
  
  // Split tasks for pagination
  const firstPageTasks = needsPagination ? mainTasks.slice(0, 15) : mainTasks; // Show 15 rows on first page when paginating
  const secondPageTasks = needsPagination ? mainTasks.slice(15) : [];
  
  // Calculate max rows based on pagination - limit second page to 27 total rows
  const maxRows = (() => {
    if (needsPagination) {
      return 15; // Fixed 15 rows on first page when paginating
    } else if (useCompression) {
      return actualTaskCount; // Use actual count for compression
    } else {
      return actualTaskCount > 10 ? Math.min(actualTaskCount, 20) : 10; // Dynamic max rows for normal view
    }
  })();
  
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

  // Memoize calculations for first page
  const { taskTotals: firstPageTaskTotals, firstPageSubtotal } = useMemo(() => {
    const totals = firstPageTasks.map((task) => {
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

    const subtotal = totals.reduce((sum, total) => sum + total, 0);
    
    return { 
      taskTotals: totals, 
      firstPageSubtotal: subtotal
    };
  }, [firstPageTasks, tasks, baseRates]);

  // Memoize calculations for second page (if needed)
  const { taskTotals: secondPageTaskTotals, secondPageSubtotal } = useMemo(() => {
    if (!needsPagination) return { taskTotals: [], secondPageSubtotal: 0 };
    
    const totals = secondPageTasks.map((task) => {
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

    const subtotal = totals.reduce((sum, total) => sum + total, 0);
    
    return { 
      taskTotals: totals, 
      secondPageSubtotal: subtotal
    };
  }, [secondPageTasks, tasks, baseRates, needsPagination]);

  // Calculate grand totals
  const { grandTotal, overheadTotal } = useMemo(() => {
    const subtotalWithoutOverhead = firstPageSubtotal + secondPageSubtotal;
    const overhead = subtotalWithoutOverhead * (baseRates.overheadPercentage / 100);
    const grand = subtotalWithoutOverhead + overhead;
    
    return { 
      grandTotal: grand,
      overheadTotal: overhead
    };
  }, [firstPageSubtotal, secondPageSubtotal, baseRates]);

  const formatCurrency = (amount) => {
    return `¥${amount.toLocaleString()}`;
  };

  const formatHours = (hours, minutes) => {
    const totalHours = hours + (minutes || 0) / 60;
    if (totalHours === 0) return '';
    if (minutes && minutes > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${hours}h`;
  };
  
  const getAggregatedHours = (mainTask) => {
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
  };

  // Render first page
  const renderFirstPage = () => (
    <div className={`quotation-visual-exact ${needsPagination ? '' : `task-count-${actualTaskCount}`} ${isPreview ? 'preview-scale' : ''}`}>
      
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
            <th className="col-type">TYPE</th>
            <th className="col-price">PRICE</th>
          </tr>
        </thead>
        <tbody>
          {/* Task rows */}
          {firstPageTasks.map((task, index) => {
            const aggregatedHours = getAggregatedHours(task);
            return (
              <tr key={task.id}>
                <td>{index + 1}</td>
                <td>{task.referenceNumber || ''}</td>
                <td className="description-cell">{task.description}</td>
                <td>{task.type || '3D'}</td>
                <td className="price-cell">{formatCurrency(firstPageTaskTotals[index])}</td>
              </tr>
            );
          })}
          
          {/* Administrative overhead row - only on first page when not paginating, or last page when paginating */}
          {!needsPagination && baseRates.overheadPercentage > 0 && (
            <tr>
              <td></td>
              <td>Administrative overhead</td>
              <td className="description-cell"></td>
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
            </tr>
          ))}
          
          {/* Continuation note when paginating */}
          {needsPagination && (
            <tr>
              <td></td>
              <td></td>
              <td className="description-cell nothing-follow">--- CONTINUED ON NEXT PAGE ---</td>
              <td></td>
              <td></td>
            </tr>
          )}
          
          {/* Total row - only on first page when not paginating */}
          {!needsPagination && (
            <tr style={{backgroundColor: '#f5f5f5', fontWeight: 'bold', fontSize: '14px'}}>
              <td colSpan="4" style={{textAlign: 'center'}}>Total Amount</td>
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
          <div>cc: admin/acctg/Engineering</div>
          <div>Admin Quotation Template v3.0-2025</div>
        </div>
      )}

    </div>
  );

  // Render second page (when needed)
  const renderSecondPage = () => (
    <div className={`quotation-visual-exact ${isPreview ? 'preview-scale' : ''}`} style={{ pageBreakBefore: 'always' }}>
      
      {/* Header Section - Same as first page but with only company address on right */}
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

        {/* Right Details - Include company address on second page too */}
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

      {/* No client details on second page per requirements */}

      {/* Table Continuation */}
      <table className="table-visual" style={{ marginTop: '40px' }}>
        <thead>
          <tr>
            <th className="col-no">NO.</th>
            <th className="col-reference">REFERENCE NO.</th>
            <th className="col-description">DESCRIPTION</th>
            <th className="col-type">TYPE</th>
            <th className="col-price">PRICE</th>
          </tr>
        </thead>
        <tbody>
          {/* Second page task rows - continue numbering */}
          {secondPageTasks.map((task, index) => {
            const aggregatedHours = getAggregatedHours(task);
            const taskNumber = firstPageTasks.length + index + 1; // Continue numbering from first page
            return (
              <tr key={task.id}>
                <td>{taskNumber}</td>
                <td>{task.referenceNumber || ''}</td>
                <td className="description-cell">{task.description}</td>
                <td>{task.type || '3D'}</td>
                <td className="price-cell">{formatCurrency(secondPageTaskTotals[index])}</td>
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
            </tr>
          ))}
          
          {/* Total row */}
          <tr style={{backgroundColor: '#f5f5f5', fontWeight: 'bold', fontSize: '14px'}}>
            <td colSpan="4" style={{textAlign: 'center'}}>Total Amount</td>
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
        <div>cc: admin/acctg/Engineering</div>
        <div>Admin Quotation Template v3.0-2025</div>
      </div>

    </div>
  );

  return (
    <div className="print-only-layout">
      {renderFirstPage()}
      {needsPagination && renderSecondPage()}
    </div>
  );
});

PrintLayout.displayName = 'PrintLayout';

export default PrintLayout;
