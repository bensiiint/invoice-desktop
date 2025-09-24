import React, { memo } from 'react';
import { Users } from 'lucide-react';

const SignatureForm = memo(({ signatures, onUpdate }) => {
  const handleUpdate = (type, field, value) => {
    onUpdate(type, field, value);
  };

  return (
    <div className="section-card signature-card">
      <div className="card-header">
        <Users className="card-icon signature" />
        <h2>Signature Details</h2>
      </div>

      <div className="card-content">
        <div className="signature-form-container">
          
          {/* Quotation Signatures */}
          <div className="signature-section">
            <h3>📋 Quotation Signatures</h3>
            
            {/* First Row - Prepared by only (like in print layout) */}
            <div className="signature-print-row">
              <div className="signature-print-left">
                <label>Prepared by:</label>
                <input
                  type="text"
                  value={signatures.quotation.preparedBy.name}
                  onChange={(e) => handleUpdate('quotation', 'preparedBy', { ...signatures.quotation.preparedBy, name: e.target.value })}
                  className="signature-print-input"
                  placeholder="Enter name"
                />
                <input
                  type="text"
                  value={signatures.quotation.preparedBy.title}
                  onChange={(e) => handleUpdate('quotation', 'preparedBy', { ...signatures.quotation.preparedBy, title: e.target.value })}
                  className="signature-print-input title-input"
                  placeholder="Enter title"
                />
              </div>
              <div className="signature-print-right">
                {/* Empty right side for first row */}
              </div>
            </div>

            {/* Second Row - Approved by (left) & Received by (right) */}
            <div className="signature-print-row">
              <div className="signature-print-left">
                <label>Approved by:</label>
                <input
                  type="text"
                  value={signatures.quotation.approvedBy.name}
                  onChange={(e) => handleUpdate('quotation', 'approvedBy', { ...signatures.quotation.approvedBy, name: e.target.value })}
                  className="signature-print-input"
                  placeholder="Enter name"
                />
                <input
                  type="text"
                  value={signatures.quotation.approvedBy.title}
                  onChange={(e) => handleUpdate('quotation', 'approvedBy', { ...signatures.quotation.approvedBy, title: e.target.value })}
                  className="signature-print-input title-input"
                  placeholder="Enter title"
                />
              </div>
              <div className="signature-print-right">
                <label>Received by:</label>
                <input
                  type="text"
                  value={signatures.quotation.receivedBy.label}
                  onChange={(e) => handleUpdate('quotation', 'receivedBy', { ...signatures.quotation.receivedBy, label: e.target.value })}
                  className="signature-print-input"
                  placeholder="Enter received by text"
                />
              </div>
            </div>
          </div>

          {/* Billing Statement Signatures */}
          <div className="signature-section">
            <h3>💰 Billing Statement Signatures</h3>
            
            {/* First Row - Prepared by (left) & Approved by (right) */}
            <div className="signature-print-row">
              <div className="signature-print-left">
                <label>Prepared by:</label>
                <input
                  type="text"
                  value={signatures.billing.preparedBy.name}
                  onChange={(e) => handleUpdate('billing', 'preparedBy', { ...signatures.billing.preparedBy, name: e.target.value })}
                  className="signature-print-input"
                  placeholder="Enter name"
                />
                <input
                  type="text"
                  value={signatures.billing.preparedBy.title}
                  onChange={(e) => handleUpdate('billing', 'preparedBy', { ...signatures.billing.preparedBy, title: e.target.value })}
                  className="signature-print-input title-input"
                  placeholder="Enter title"
                />
              </div>
              <div className="signature-print-right">
                <label>Approved by:</label>
                <input
                  type="text"
                  value={signatures.billing.approvedBy.name}
                  onChange={(e) => handleUpdate('billing', 'approvedBy', { ...signatures.billing.approvedBy, name: e.target.value })}
                  className="signature-print-input"
                  placeholder="Enter name"
                />
                <input
                  type="text"
                  value={signatures.billing.approvedBy.title}
                  onChange={(e) => handleUpdate('billing', 'approvedBy', { ...signatures.billing.approvedBy, title: e.target.value })}
                  className="signature-print-input title-input"
                  placeholder="Enter title"
                />
              </div>
            </div>

            {/* Second Row - Empty (left) & Final Approver (right) */}
            <div className="signature-print-row">
              <div className="signature-print-left">
                {/* Empty left side for second row */}
              </div>
              <div className="signature-print-right">
                <label>Final Approver:</label>
                <input
                  type="text"
                  value={signatures.billing.finalApprover.name}
                  onChange={(e) => handleUpdate('billing', 'finalApprover', { ...signatures.billing.finalApprover, name: e.target.value })}
                  className="signature-print-input"
                  placeholder="Enter name"
                />
                <input
                  type="text"
                  value={signatures.billing.finalApprover.title}
                  onChange={(e) => handleUpdate('billing', 'finalApprover', { ...signatures.billing.finalApprover, title: e.target.value })}
                  className="signature-print-input title-input"
                  placeholder="Enter title"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
});

SignatureForm.displayName = 'SignatureForm';

export default SignatureForm;
