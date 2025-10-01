import React, { memo } from 'react';
import { FileSignature, Receipt } from 'lucide-react';

const SignatureForm = memo(({ signatures, onUpdate }) => {
  const handleUpdate = (type, field, value) => {
    onUpdate(type, field, value);
  };

  return (
    <>
      {/* Quotation Signatures */}
      <div className="signature-section">
        <div className="signature-header">
          <div className="section-header">
            <div className="section-icon quotation-signatures">
              <FileSignature size={20} color="#6366f1" />
            </div>
            <h2 className="section-title">Quotation Signatures</h2>
          </div>
        </div>
        
        <div className="signature-content">
          <div className="signature-grid">
            {/* Prepared by */}
            <div className="signature-column">
              <div className="input-group">
                <label>Prepared by - Name</label>
                <input
                  type="text"
                  value={signatures.quotation.preparedBy.name}
                  onChange={(e) => handleUpdate('quotation', 'preparedBy', { ...signatures.quotation.preparedBy, name: e.target.value })}
                  className="form-input"
                  placeholder="Enter name"
                />
              </div>
              <div className="input-group">
                <label>Title</label>
                <input
                  type="text"
                  value={signatures.quotation.preparedBy.title}
                  onChange={(e) => handleUpdate('quotation', 'preparedBy', { ...signatures.quotation.preparedBy, title: e.target.value })}
                  className="form-input"
                  placeholder="Enter title"
                />
              </div>
            </div>
            
            {/* Approved by */}
            <div className="signature-column">
              <div className="input-group">
                <label>Approved by - Name</label>
                <input
                  type="text"
                  value={signatures.quotation.approvedBy.name}
                  onChange={(e) => handleUpdate('quotation', 'approvedBy', { ...signatures.quotation.approvedBy, name: e.target.value })}
                  className="form-input"
                  placeholder="Enter name"
                />
              </div>
              <div className="input-group">
                <label>Title</label>
                <input
                  type="text"
                  value={signatures.quotation.approvedBy.title}
                  onChange={(e) => handleUpdate('quotation', 'approvedBy', { ...signatures.quotation.approvedBy, title: e.target.value })}
                  className="form-input"
                  placeholder="Enter title"
                />
              </div>
            </div>
            
            {/* Received by */}
            <div className="signature-column">
              <div className="input-group">
                <label>Received by - Name</label>
                <input
                  type="text"
                  value={signatures.quotation.receivedBy.label}
                  onChange={(e) => handleUpdate('quotation', 'receivedBy', { ...signatures.quotation.receivedBy, label: e.target.value })}
                  className="form-input"
                  placeholder="Enter name"
                />
              </div>
              <div className="input-group">
                <label>Title</label>
                <input
                  type="text"
                  value={signatures.quotation.receivedBy.title || ''}
                  onChange={(e) => handleUpdate('quotation', 'receivedBy', { ...signatures.quotation.receivedBy, title: e.target.value })}
                  className="form-input"
                  placeholder="Enter title"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Statement Signatures */}
      <div className="signature-section">
        <div className="signature-header">
          <div className="section-header">
            <div className="section-icon billing-signatures">
              <Receipt size={20} color="#ec4899" />
            </div>
            <h2 className="section-title">Billing Statement Signatures</h2>
          </div>
        </div>
        
        <div className="signature-content">
          <div className="signature-grid">
            {/* Prepared by */}
            <div className="signature-column">
              <div className="input-group">
                <label>Prepared by - Name</label>
                <input
                  type="text"
                  value={signatures.billing.preparedBy.name}
                  onChange={(e) => handleUpdate('billing', 'preparedBy', { ...signatures.billing.preparedBy, name: e.target.value })}
                  className="form-input"
                  placeholder="Enter name"
                />
              </div>
              <div className="input-group">
                <label>Title</label>
                <input
                  type="text"
                  value={signatures.billing.preparedBy.title}
                  onChange={(e) => handleUpdate('billing', 'preparedBy', { ...signatures.billing.preparedBy, title: e.target.value })}
                  className="form-input"
                  placeholder="Enter title"
                />
              </div>
            </div>
            
            {/* Approved by */}
            <div className="signature-column">
              <div className="input-group">
                <label>Approved by - Name</label>
                <input
                  type="text"
                  value={signatures.billing.approvedBy.name}
                  onChange={(e) => handleUpdate('billing', 'approvedBy', { ...signatures.billing.approvedBy, name: e.target.value })}
                  className="form-input"
                  placeholder="Enter name"
                />
              </div>
              <div className="input-group">
                <label>Title</label>
                <input
                  type="text"
                  value={signatures.billing.approvedBy.title}
                  onChange={(e) => handleUpdate('billing', 'approvedBy', { ...signatures.billing.approvedBy, title: e.target.value })}
                  className="form-input"
                  placeholder="Enter title"
                />
              </div>
            </div>
            
            {/* Final Approver */}
            <div className="signature-column">
              <div className="input-group">
                <label>Final Approver - Name</label>
                <input
                  type="text"
                  value={signatures.billing.finalApprover.name}
                  onChange={(e) => handleUpdate('billing', 'finalApprover', { ...signatures.billing.finalApprover, name: e.target.value })}
                  className="form-input"
                  placeholder="Enter name"
                />
              </div>
              <div className="input-group">
                <label>Title</label>
                <input
                  type="text"
                  value={signatures.billing.finalApprover.title}
                  onChange={(e) => handleUpdate('billing', 'finalApprover', { ...signatures.billing.finalApprover, title: e.target.value })}
                  className="form-input"
                  placeholder="Enter title"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

SignatureForm.displayName = 'SignatureForm';

export default SignatureForm;
