import React, { memo } from 'react';
import { Calendar } from 'lucide-react';

const QuotationDetails = memo(({ quotationDetails, onUpdate }) => {
  const handleChange = (field, value) => {
    onUpdate({ ...quotationDetails, [field]: value });
  };

  return (
    <div className="section-card quotation-top">
      <div className="card-header">
        <Calendar className="card-icon details" />
        <h2>Quotation Details</h2>
      </div>
      <div className="card-content">
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
            <input
              type="date"
              value={quotationDetails.date}
              onChange={(e) => handleChange('date', e.target.value)}
              className="form-input"
            />
          </div>
        </div>
      </div>
    </div>
  );
});

QuotationDetails.displayName = 'QuotationDetails';

export default QuotationDetails;
