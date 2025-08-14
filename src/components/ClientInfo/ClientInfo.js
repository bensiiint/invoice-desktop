import React, { memo } from 'react';
import { User } from 'lucide-react';

const ClientInfo = memo(({ clientInfo, onUpdate }) => {
  const handleChange = (field, value) => {
    onUpdate({ ...clientInfo, [field]: value });
  };

  return (
    <div className="info-card">
      <div className="card-header">
        <User className="card-icon client" />
        <h2>Client Information</h2>
      </div>
      <div className="card-content">
        <div className="input-group">
          <label>Client Company</label>
          <input
            type="text"
            value={clientInfo.company}
            onChange={(e) => handleChange('company', e.target.value)}
            className="form-input"
          />
        </div>
        <div className="input-group">
          <label>Contact Person</label>
          <input
            type="text"
            value={clientInfo.contact}
            onChange={(e) => handleChange('contact', e.target.value)}
            className="form-input"
          />
        </div>
        <div className="input-group">
          <label>Client Address</label>
          <textarea
            value={clientInfo.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className="form-textarea"
            rows="2"
          />
        </div>
        <div className="input-group">
          <label>Client Phone</label>
          <input
            type="text"
            value={clientInfo.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            className="form-input"
          />
        </div>
      </div>
    </div>
  );
});

ClientInfo.displayName = 'ClientInfo';

export default ClientInfo;
