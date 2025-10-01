import React, { memo } from 'react';
import { FileText, Calendar, Phone } from 'lucide-react';

const QuotationDetails = memo(({ quotationDetails, onUpdate }) => {
  const handleChange = (field, value) => {
    onUpdate({ ...quotationDetails, [field]: value });
  };

  return (
    <div className="quotation-details-section">
      <div className="section-header">
        <div className="section-icon quotation">
          <FileText size={20} color="white" />
        </div>
        <h2 className="section-title">Quotation Details</h2>
      </div>
      
      <div className="quotation-grid">
        <div className="input-group">
          <label>Quotation Number</label>
          <input
            type="text"
            value={quotationDetails.quotationNo}
            onChange={(e) => handleChange('quotationNo', e.target.value)}
            className="form-input"
          />
        </div>
        
        <div className="input-group">
          <label>Reference Number</label>
          <input
            type="text"
            value={quotationDetails.referenceNo}
            onChange={(e) => handleChange('referenceNo', e.target.value)}
            className="form-input"
          />
        </div>
        
        <div className="input-group">
          <label>Date</label>
          <div className="input-with-icon">
            <input
              type="date"
              value={quotationDetails.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="form-input"
            />
            <Calendar size={16} className="input-icon" />
          </div>
        </div>
        
        <div className="input-group">
          <label>Invoice Number</label>
          <input
            type="text"
            value={quotationDetails.invoiceNo || ''}
            onChange={(e) => handleChange('invoiceNo', e.target.value)}
            className="form-input"
            placeholder="Used in billing mode"
          />
        </div>
        
        <div className="input-group">
          <label>Job Order Number</label>
          <input
            type="text"
            value={quotationDetails.jobOrderNo || ''}
            onChange={(e) => handleChange('jobOrderNo', e.target.value)}
            className="form-input"
            placeholder="Used in billing mode"
          />
        </div>
      </div>
    </div>
  );
});

QuotationDetails.displayName = 'QuotationDetails';

export default QuotationDetails;
