import React, { memo } from 'react';
import { User, MapPin, Phone } from 'lucide-react';

const ClientInfo = memo(({ clientInfo, onUpdate }) => {
  const handleChange = (field, value) => {
    onUpdate({ ...clientInfo, [field]: value });
  };

  return (
    <div className="section-card">
      <div className="card-header">
        <div className="section-icon client">
          <User size={20} color="#a855f7" />
        </div>
        <h2 className="section-title">Client Information</h2>
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
          <div className="input-with-icon">
            <textarea
              value={clientInfo.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="form-textarea"
              rows="3"
              style={{ minHeight: '80px' }}
            />
            <MapPin size={16} className="input-icon" style={{ top: '16px' }} />
          </div>
        </div>
        
        <div className="input-group">
          <label>Client Phone</label>
          <div className="input-with-icon">
            <input
              type="text"
              value={clientInfo.phone}
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

ClientInfo.displayName = 'ClientInfo';

export default ClientInfo;
