import React, { memo } from 'react';
import { Building2, Phone } from 'lucide-react';

const CompanyInfo = memo(({ companyInfo, onUpdate }) => {
  const handleChange = (field, value) => {
    onUpdate({ ...companyInfo, [field]: value });
  };

  return (
    <div className="section-card">
      <div className="card-header">
        <div className="section-icon company">
          <Building2 size={20} color="#10b981" />
        </div>
        <h2 className="section-title">Company Information</h2>
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
          <div className="address-inputs">
            <input
              type="text"
              value={companyInfo.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="form-input"
              placeholder="Street address"
            />
            <input
              type="text"
              value={companyInfo.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className="form-input"
              placeholder="City, Province"
            />
            <input
              type="text"
              value={companyInfo.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="form-input"
              placeholder="Country"
            />
          </div>
        </div>
        
        <div className="input-group">
          <label>Phone</label>
          <div className="input-with-icon">
            <input
              type="text"
              value={companyInfo.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="form-input"
            />
            <Phone size={16} className="input-icon" />
          </div>
        </div>
      </div>
    </div>
  );
});

CompanyInfo.displayName = 'CompanyInfo';

export default CompanyInfo;
