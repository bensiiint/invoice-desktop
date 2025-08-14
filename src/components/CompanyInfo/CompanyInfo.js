import React, { memo } from 'react';
import { Building2 } from 'lucide-react';

const CompanyInfo = memo(({ companyInfo, onUpdate }) => {
  const handleChange = (field, value) => {
    onUpdate({ ...companyInfo, [field]: value });
  };

  const handleAddressChange = (e) => {
    const lines = e.target.value.split('\n');
    onUpdate({
      ...companyInfo,
      address: lines[0] || '',
      city: lines[1] || '',
      location: lines[2] || '',
    });
  };

  return (
    <div className="info-card">
      <div className="card-header">
        <Building2 className="card-icon company" />
        <h2>Company Information</h2>
      </div>
      <div className="card-content">
        <div className="input-group">
          <label>Company Name</label>
          <input
            type="text"
            value={companyInfo.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="form-input"
          />
        </div>
        <div className="input-group">
          <label>Full Address</label>
          <textarea
            value={`${companyInfo.address}\n${companyInfo.city}\n${companyInfo.location}`}
            onChange={handleAddressChange}
            className="form-textarea"
            rows="3"
          />
        </div>
        <div className="input-group">
          <label>Phone</label>
          <input
            type="text"
            value={companyInfo.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="form-input"
          />
        </div>
      </div>
    </div>
  );
});

CompanyInfo.displayName = 'CompanyInfo';

export default CompanyInfo;
