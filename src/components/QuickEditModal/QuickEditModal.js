import React, { useState, useMemo } from 'react';
import { X, Save, RefreshCw } from 'lucide-react';
import './QuickEditModal.css';

const QuickEditModal = ({ 
  isOpen, 
  onClose, 
  tasks,
  baseRates,
  manualOverrides,
  onApplyChanges 
}) => {
  // Local state for editing
  const [editedTasks, setEditedTasks] = useState([]);
  const [editedOverrides, setEditedOverrides] = useState({});

  // Initialize edited data when modal opens
  React.useEffect(() => {
    if (isOpen) {
      // Only include main tasks
      const mainTasks = tasks.filter(task => task.isMainTask);
      setEditedTasks(mainTasks.map(task => ({
        id: task.id,
        referenceNumber: task.referenceNumber || '',
        description: task.description || '',
        type: task.type || '3D',
        hours: task.hours || 0,
        minutes: task.minutes || 0,
        overtimeHours: task.overtimeHours || 0,
        softwareUnits: task.softwareUnits || 0,
      })));
      setEditedOverrides({ ...manualOverrides });
    }
  }, [isOpen, tasks, manualOverrides]);

  // Calculate task total with current edits
  const calculateTaskTotal = (task) => {
    const mainTask = editedTasks.find(t => t.id === task.id);
    if (!mainTask) return 0;

    // Get sub-tasks for this main task
    const subTasks = tasks.filter(t => t.parentId === task.id);
    
    // Calculate aggregated values
    const mainTotalHours = (mainTask.hours || 0) + (mainTask.minutes || 0) / 60;
    let aggregatedHours = mainTotalHours;
    let aggregatedOvertime = mainTask.overtimeHours || 0;
    let aggregatedSoftware = mainTask.softwareUnits || 0;
    
    subTasks.forEach(subTask => {
      const subTotalHours = (subTask.hours || 0) + (subTask.minutes || 0) / 60;
      aggregatedHours += subTotalHours;
      aggregatedOvertime += subTask.overtimeHours || 0;
      aggregatedSoftware += subTask.softwareUnits || 0;
    });

    // Calculate with appropriate rate
    const taskTimeChargeRate = task.type === '2D' ? baseRates.timeChargeRate2D : baseRates.timeChargeRate3D;
    let basicLabor = aggregatedHours * taskTimeChargeRate;
    let overtime = aggregatedOvertime * baseRates.overtimeRate;
    let software = aggregatedSoftware * baseRates.softwareRate;

    // Apply manual overrides if they exist
    const override = editedOverrides[task.id];
    if (override) {
      basicLabor = override.basicLabor !== undefined ? override.basicLabor : basicLabor;
      overtime = override.overtime !== undefined ? override.overtime : overtime;
      software = override.software !== undefined ? override.software : software;
      
      if (override.total !== undefined) {
        return override.total;
      }
    }

    return basicLabor + overtime + software;
  };

  // Calculate totals
  const { subtotal, overhead, grandTotal } = useMemo(() => {
    const sub = editedTasks.reduce((sum, task) => sum + calculateTaskTotal(task), 0);
    const over = sub * (baseRates.overheadPercentage / 100);
    const grand = sub + over;
    return { subtotal: sub, overhead: over, grandTotal: grand };
  }, [editedTasks, editedOverrides, baseRates]);

  // Update task field
  const updateTask = (taskId, field, value) => {
    setEditedTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, [field]: value } : task
      )
    );
  };

  // Update manual override for price
  const updatePrice = (taskId, newPrice) => {
    const numPrice = parseFloat(newPrice) || 0;
    setEditedOverrides(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        total: numPrice
      }
    }));
  };

  // Apply changes and close
  const handleApply = () => {
    onApplyChanges(editedTasks, editedOverrides);
    onClose();
  };

  // Reset to original values
  const handleReset = () => {
    const mainTasks = tasks.filter(task => task.isMainTask);
    setEditedTasks(mainTasks.map(task => ({
      id: task.id,
      referenceNumber: task.referenceNumber || '',
      description: task.description || '',
      type: task.type || '3D',
      hours: task.hours || 0,
      minutes: task.minutes || 0,
      overtimeHours: task.overtimeHours || 0,
      softwareUnits: task.softwareUnits || 0,
    })));
    setEditedOverrides({ ...manualOverrides });
  };

  const formatCurrency = (amount) => {
    return `¥${amount.toLocaleString()}`;
  };

  if (!isOpen) return null;

  return (
    <div className="quick-edit-modal">
      <div className="modal-backdrop" onClick={onClose} />
      <div className="modal-container">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <RefreshCw className="title-icon" />
            <h2>Quick Edit Quotation Values</h2>
          </div>
          <div className="modal-header-actions">
            <button onClick={handleReset} className="action-button secondary">
              <RefreshCw size={14} />
              Reset
            </button>
            <button onClick={handleApply} className="action-button primary">
              <Save size={14} />
              Apply Changes
            </button>
            <button onClick={onClose} className="close-button">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          <div className="edit-instructions">
            <p>Edit the values below. Changes will update the quotation preview and PDF export.</p>
          </div>

          <div className="edit-table-container">
            <table className="edit-table">
              <thead>
                <tr>
                  <th style={{width: '5%'}}>NO.</th>
                  <th style={{width: '20%'}}>Reference No.</th>
                  <th style={{width: '35%'}}>Description</th>
                  <th style={{width: '10%'}}>Type</th>
                  <th style={{width: '15%'}}>Price</th>
                  <th style={{width: '15%'}}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {editedTasks.map((task, index) => {
                  const currentPrice = calculateTaskTotal(task);
                  return (
                    <tr key={task.id}>
                      <td className="center">{index + 1}</td>
                      <td>
                        <input
                          type="text"
                          value={task.referenceNumber}
                          onChange={(e) => updateTask(task.id, 'referenceNumber', e.target.value)}
                          className="edit-input"
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={task.description}
                          onChange={(e) => updateTask(task.id, 'description', e.target.value)}
                          className="edit-input"
                        />
                      </td>
                      <td className="center">
                        <select
                          value={task.type}
                          onChange={(e) => updateTask(task.id, 'type', e.target.value)}
                          className="edit-select"
                        >
                          <option value="2D">2D</option>
                          <option value="3D">3D</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          value={currentPrice}
                          onChange={(e) => updatePrice(task.id, e.target.value)}
                          className="edit-input price-input"
                          step="1000"
                        />
                      </td>
                      <td className="center">
                        <button
                          onClick={() => {
                            setEditedOverrides(prev => {
                              const newOverrides = { ...prev };
                              delete newOverrides[task.id];
                              return newOverrides;
                            });
                          }}
                          className="reset-price-btn"
                          title="Reset price to calculated value"
                        >
                          <RefreshCw size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Overhead row */}
                {baseRates.overheadPercentage > 0 && (
                  <tr className="summary-row">
                    <td></td>
                    <td colSpan="3" className="summary-label">Administrative Overhead ({baseRates.overheadPercentage}%)</td>
                    <td className="summary-value">{formatCurrency(overhead)}</td>
                    <td></td>
                  </tr>
                )}

                {/* Total row */}
                <tr className="total-row">
                  <td></td>
                  <td colSpan="3" className="total-label">TOTAL AMOUNT</td>
                  <td className="total-value">{formatCurrency(grandTotal)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickEditModal;
