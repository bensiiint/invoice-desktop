import React, { memo, useMemo, useCallback, useState, useEffect } from 'react';
import { Calculator, Plus, Trash2, Edit3 } from 'lucide-react';

// Memoized sub-components for better performance
const ValueBasisRow = memo(({ baseRates, onUpdate }) => {
  const handleUpdate = useCallback((field, value) => {
    onUpdate(field, parseFloat(value) || 0);
  }, [onUpdate]);

  return (
    <tr className="value-basis-row">
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>-</td>
      <td>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <label style={{ fontSize: '10px', fontWeight: '600', minWidth: '20px' }}>2D:</label>
            <input
              type="number"
              value={baseRates.timeChargeRate2D}
              onChange={(e) => handleUpdate('timeChargeRate2D', e.target.value)}
              className="table-input"
              style={{ width: '50px', fontSize: '11px', padding: '2px 4px' }}
              min="0"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <label style={{ fontSize: '10px', fontWeight: '600', minWidth: '20px' }}>3D:</label>
            <input
              type="number"
              value={baseRates.timeChargeRate3D}
              onChange={(e) => handleUpdate('timeChargeRate3D', e.target.value)}
              className="table-input"
              style={{ width: '50px', fontSize: '11px', padding: '2px 4px' }}
              min="0"
            />
          </div>
        </div>
      </td>
      <td>
        <input
          type="number"
          value={baseRates.otHoursMultiplier}
          onChange={(e) => handleUpdate('otHoursMultiplier', e.target.value)}
          className="table-input"
          style={{ width: '60px', fontSize: '11px', padding: '2px 4px' }}
          min="0"
          step="0.1"
        />
      </td>
      <td>
        <input
          type="number"
          value={baseRates.overtimeRate}
          onChange={(e) => handleUpdate('overtimeRate', e.target.value)}
          className="table-input"
          style={{ width: '70px', fontSize: '11px', padding: '2px 4px' }}
          min="0"
        />
      </td>
      <td>
        <input
          type="number"
          value={baseRates.softwareRate}
          onChange={(e) => handleUpdate('softwareRate', e.target.value)}
          className="table-input"
          style={{ width: '80px', fontSize: '11px', padding: '2px 4px' }}
          min="0"
        />
      </td>
      <td>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
          <input
            type="number"
            value={baseRates.overheadPercentage}
            onChange={(e) => handleUpdate('overheadPercentage', e.target.value)}
            className="table-input"
            style={{ width: '50px', fontSize: '11px', padding: '2px 4px' }}
            min="0"
            max="100"
            step="1"
          />
          <span style={{ fontSize: '12px', fontWeight: '600' }}>%</span>
        </div>
      </td>
      <td>-</td>
      <td><strong>Base Rates</strong></td>
      <td>-</td>
    </tr>
  );
});

const TaskRow = memo(({ task, subtotals, onUpdate, onRemove, formatCurrency, isSelected, onMainTaskSelect, rowNumber, isEditing, onEditToggle, onEditValueUpdate }) => {
  const handleUpdate = useCallback((field, value) => {
    onUpdate(task.id, field, value);
  }, [task.id, onUpdate]);

  const handleRemove = useCallback(() => {
    onRemove(task.id);
  }, [task.id, onRemove]);

  const handleEditToggle = useCallback(() => {
    onEditToggle(task.id);
  }, [task.id, onEditToggle]);

  const handleEditValueChange = useCallback((field, value) => {
    onEditValueUpdate(task.id, field, parseFloat(value) || 0, true); // Add flag to indicate user interaction
  }, [task.id, onEditValueUpdate]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleEditToggle();
    }
  }, [handleEditToggle]);
  
  const handleMainTaskClick = useCallback(() => {
    if (task.isMainTask && onMainTaskSelect) {
      onMainTaskSelect(task.id);
    }
  }, [task.isMainTask, task.id, onMainTaskSelect]);

  return (
    <tr 
      className={`
        ${task.isMainTask ? 'main-task-row' : 'sub-task-row'}
        ${isSelected ? 'selected-main-task' : ''}
      `}
      onClick={handleMainTaskClick}
      style={{ cursor: task.isMainTask ? 'pointer' : 'default' }}
    >
      <td className="row-number-cell">
        <span className="row-number">{rowNumber}</span>
      </td>
      <td className="reference-cell">
        <input
          type="text"
          value={task.referenceNumber || ''}
          onChange={(e) => handleUpdate('referenceNumber', e.target.value)}
          className="table-input reference-input"
          placeholder="Ref No"
        />
      </td>
      <td className="description-cell">
        <div className={`description-container ${!task.isMainTask ? 'sub-task-description' : ''}`}>
          {!task.isMainTask && <span className="sub-task-indicator">↳</span>}
          <input
            type="text"
            value={task.description}
            onChange={(e) => handleUpdate('description', e.target.value)}
            className={`table-input description-input ${!task.isMainTask ? 'sub-task-input' : ''}`}
            placeholder={task.isMainTask ? "Assembly Name" : "Part's name"}
          />
        </div>
      </td>
      <td>
        <input
          type="number"
          value={task.hours || 0}
          onChange={(e) => handleUpdate('hours', parseFloat(e.target.value) || 0)}
          className="table-input number-input"
          min="0"
          step="0.5"
        />
      </td>
      <td>
        <input
          type="number"
          value={task.minutes || 0}
          onChange={(e) => handleUpdate('minutes', parseFloat(e.target.value) || 0)}
          className="table-input number-input"
          min="0"
          max="59"
          step="1"
        />
      </td>
      <td className="calculated-cell time-charge-bg">
        {isEditing ? (
          <input
            type="number"
            value={subtotals.basicLabor}
            onChange={(e) => handleEditValueChange('basicLabor', e.target.value)}
            onKeyDown={handleKeyDown}
            className="table-input number-input edit-calculated-input"
            min="0"
            step="0.01"
          />
        ) : (
          formatCurrency(subtotals.basicLabor)
        )}
      </td>
      <td>
        <input
          type="number"
          value={task.overtimeHours}
          onChange={(e) => handleUpdate('overtimeHours', parseFloat(e.target.value) || 0)}
          className="table-input number-input"
          min="0"
          step="0.5"
        />
      </td>
      <td className="calculated-cell overtime-bg">
        {isEditing ? (
          <input
            type="number"
            value={subtotals.overtime}
            onChange={(e) => handleEditValueChange('overtime', e.target.value)}
            onKeyDown={handleKeyDown}
            className="table-input number-input edit-calculated-input"
            min="0"
            step="0.01"
          />
        ) : (
          formatCurrency(subtotals.overtime)
        )}
      </td>
      <td className="software-cell">
        <div className="software-input-container">
          <input
            type="number"
            value={task.softwareUnits || 0}
            onChange={(e) => handleUpdate('softwareUnits', parseFloat(e.target.value) || 0)}
            className="table-input number-input software-units-input"
            min="0"
          />
          {isEditing ? (
            <input
              type="number"
              value={subtotals.software}
              onChange={(e) => handleEditValueChange('software', e.target.value)}
              onKeyDown={handleKeyDown}
              className="table-input number-input edit-calculated-input software-edit-input"
              min="0"
              step="0.01"
            />
          ) : (
            <span className="software-total">
              {formatCurrency(subtotals.software)}
            </span>
          )}
        </div>
      </td>
      <td className="calculated-cell overhead-bg">
        {isEditing ? (
          <input
            type="number"
            value={subtotals.overhead}
            onChange={(e) => handleEditValueChange('overhead', e.target.value)}
            onKeyDown={handleKeyDown}
            className="table-input number-input edit-calculated-input"
            min="0"
            step="0.01"
          />
        ) : (
          formatCurrency(subtotals.overhead)
        )}
      </td>
      <td className="type-cell">
        {(task.type === '2D' || task.type === '3D' || task.type === undefined || task.type === null) ? (
          // Show dropdown for standard types
          <select
            value={task.type || '3D'}
            onChange={(e) => {
              if (e.target.value === 'Others') {
                handleUpdate('type', 'Custom');
              } else {
                handleUpdate('type', e.target.value);
              }
            }}
            className="table-input type-select"
          >
            <option value="2D">2D</option>
            <option value="3D">3D</option>
            <option value="Others">Others...</option>
          </select>
        ) : (
          // Show input for custom type with option to go back to dropdown
          <div className="custom-type-container">
            <input
              type="text"
              value={task.type === 'Custom' ? '' : task.type}
              onChange={(e) => handleUpdate('type', e.target.value)}
              className="table-input custom-type-input"
              placeholder="Specify type"
              autoFocus
            />
            <button
              type="button"
              onClick={() => handleUpdate('type', '3D')}
              className="reset-type-button"
              title="Back to dropdown"
            >
              ↺
            </button>
          </div>
        )}
      </td>
      <td className="total-cell">
        {isEditing ? (
          <input
            type="number"
            value={subtotals.total}
            onChange={(e) => handleEditValueChange('total', e.target.value)}
            onKeyDown={handleKeyDown}
            className="table-input number-input edit-calculated-input"
            min="0"
            step="0.01"
          />
        ) : (
          formatCurrency(subtotals.total)
        )}
      </td>
      <td className="action-cell">
        <div className="action-buttons-container">
          <button
            onClick={handleEditToggle}
            className={`edit-task-button ${isEditing ? 'editing' : ''}`}
            title={isEditing ? "Save changes" : "Edit values"}
          >
            <Edit3 className="edit-icon" />
          </button>
          <button
            onClick={handleRemove}
            className="remove-task-button"
            title="Remove task"
          >
            <Trash2 className="remove-icon" />
          </button>
        </div>
      </td>
    </tr>
  );
});

// Main TasksTable component
const TasksTable = memo(({
  tasks,
  baseRates,
  selectedMainTaskId,
  onTaskUpdate,
  onTaskAdd,
  onSubTaskAdd,
  onTaskRemove,
  onMainTaskSelect,
  onBaseRateUpdate,
  onManualOverridesChange,
}) => {
  // State for edit mode management
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editedValues, setEditedValues] = useState({});
  // Track which fields were actually modified by user during editing
  const [modifiedFields, setModifiedFields] = useState({});
  // State for manual overrides that persist after editing
  const [manualOverrides, setManualOverrides] = useState({});
  // Memoize calculations to prevent recalculation on every render
  const { taskTotals, grandTotal, mainTaskCount } = useMemo(() => {
    const mainTasks = tasks.filter(task => task.isMainTask);
    const mainTaskCount = mainTasks.length;
    
    const totals = tasks.map((task) => {
      // Calculate total hours from hours and minutes
      const totalHours = (task.hours || 0) + (task.minutes || 0) / 60;
      // Get the appropriate time charge rate based on task type
      const timeChargeRate = task.type === '2D' ? baseRates.timeChargeRate2D : baseRates.timeChargeRate3D;
      const basicLabor = totalHours * timeChargeRate;
      const overtime = task.overtimeHours * baseRates.overtimeRate;
      const software = (task.softwareUnits || 0) * baseRates.softwareRate;
      
      let aggregatedBasicLabor = basicLabor;
      let aggregatedOvertime = overtime;
      let aggregatedSoftware = software;
      
      // If this is a main task, aggregate sub-task totals
      if (task.isMainTask) {
        const subTasks = tasks.filter(t => t.parentId === task.id);
        subTasks.forEach(subTask => {
          const subTotalHours = (subTask.hours || 0) + (subTask.minutes || 0) / 60;
          const subTimeChargeRate = subTask.type === '2D' ? baseRates.timeChargeRate2D : baseRates.timeChargeRate3D;
          aggregatedBasicLabor += subTotalHours * subTimeChargeRate;
          aggregatedOvertime += subTask.overtimeHours * baseRates.overtimeRate;
          aggregatedSoftware += (subTask.softwareUnits || 0) * baseRates.softwareRate;
        });
      }
      
      const subtotal = aggregatedBasicLabor + aggregatedOvertime + aggregatedSoftware;
      const overhead = subtotal * (baseRates.overheadPercentage / 100);
      
      // Calculate base values
      let finalBasicLabor = task.isMainTask ? aggregatedBasicLabor : basicLabor;
      let finalOvertime = task.isMainTask ? aggregatedOvertime : overtime;
      let finalSoftware = task.isMainTask ? aggregatedSoftware : software;
      let finalOverhead = task.isMainTask ? overhead : (basicLabor + overtime + software) * (baseRates.overheadPercentage / 100);
      let finalTotal = task.isMainTask ? 
        (aggregatedBasicLabor + aggregatedOvertime + aggregatedSoftware + overhead) :
        (basicLabor + overtime + software + (basicLabor + overtime + software) * (baseRates.overheadPercentage / 100));
      
      // Apply manual overrides if they exist
      const override = manualOverrides[task.id];
      if (override) {
        // Apply individual field overrides
        finalBasicLabor = override.basicLabor !== undefined ? override.basicLabor : finalBasicLabor;
        finalOvertime = override.overtime !== undefined ? override.overtime : finalOvertime;
        finalSoftware = override.software !== undefined ? override.software : finalSoftware;
        
        // If overhead was manually set, use it; otherwise recalculate if other fields changed
        if (override.overhead !== undefined) {
          finalOverhead = override.overhead;
        } else if (override.basicLabor !== undefined || override.overtime !== undefined || override.software !== undefined) {
          // Recalculate overhead based on new subtotal
          const newSubtotal = finalBasicLabor + finalOvertime + finalSoftware;
          finalOverhead = newSubtotal * (baseRates.overheadPercentage / 100);
        }
        
        // If total was manually set, use it; otherwise recalculate
        if (override.total !== undefined) {
          finalTotal = override.total;
        } else {
          // Recalculate total from all components
          finalTotal = finalBasicLabor + finalOvertime + finalSoftware + finalOverhead;
        }
      }
      
      return {
        taskId: task.id,
        basicLabor: finalBasicLabor,
        overtime: finalOvertime,
        software: finalSoftware,
        overhead: finalOverhead,
        total: finalTotal,
      };
    });

    // Only count main tasks for grand total (sub-tasks are already included in main task totals)
    const grand = totals
      .filter((_, index) => tasks[index].isMainTask)
      .reduce((sum, task) => sum + task.total, 0);
    
    return { taskTotals: totals, grandTotal: grand, mainTaskCount };
  }, [tasks, baseRates, manualOverrides]);

  // Edit mode handlers
  const handleEditToggle = useCallback((taskId) => {
    if (editingTaskId === taskId) {
      // Save changes when exiting edit mode - only save fields that were actually modified by user
      const fieldsToSave = modifiedFields[taskId];
      if (fieldsToSave && Object.keys(fieldsToSave).length > 0) {
        const valuesToSave = {};
        Object.keys(fieldsToSave).forEach(field => {
          valuesToSave[field] = editedValues[taskId][field];
        });
        
        setManualOverrides(prev => ({
          ...prev,
          [taskId]: {
            ...prev[taskId],
            ...valuesToSave
          }
        }));
      }
      
      setEditingTaskId(null);
      setEditedValues({});
      setModifiedFields({});
    } else {
      // Enter edit mode and initialize with current values
      setEditingTaskId(taskId);
      const taskSubtotals = taskTotals.find(t => t.taskId === taskId);
      if (taskSubtotals) {
        setEditedValues({
          [taskId]: {
            basicLabor: taskSubtotals.basicLabor,
            overtime: taskSubtotals.overtime,
            software: taskSubtotals.software,
            overhead: taskSubtotals.overhead,
            total: taskSubtotals.total,
          }
        });
      }
    }
  }, [editingTaskId, taskTotals, editedValues, modifiedFields]);

  const handleEditValueUpdate = useCallback((taskId, field, value, userModified = false) => {
    setEditedValues(prev => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        [field]: value
      }
    }));
    
    // Track which fields were actually modified by user interaction
    if (userModified) {
      setModifiedFields(prev => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          [field]: true
        }
      }));

      // Save the override immediately when user modifies a value
      setManualOverrides(prev => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          [field]: parseFloat(value) || 0
        }
      }));
    }
  }, []);

  // Memoize formatCurrency function
  const formatCurrency = useCallback((amount) => {
    return `¥${amount.toLocaleString()}`;
  }, []);

  const getTaskSubtotals = useCallback(
    (taskId) => {
      const calculatedTotals = taskTotals.find((t) => t.taskId === taskId) || {
        basicLabor: 0,
        overtime: 0,
        software: 0,
        overhead: 0,
        total: 0,
      };
      
      // Return edited values if task is being edited, otherwise return calculated values (which already include manual overrides)
      if (editingTaskId === taskId && editedValues[taskId]) {
        return {
          ...calculatedTotals,
          ...editedValues[taskId]
        };
      }
      
      return calculatedTotals;
    },
    [taskTotals, editingTaskId, editedValues]
  );

  // Clean up manual overrides and modified fields when tasks are removed
  const taskIds = useMemo(() => new Set(tasks.map(task => task.id)), [tasks]);
  
  useEffect(() => {
    setManualOverrides(prev => {
      const filtered = {};
      Object.keys(prev).forEach(taskId => {
        if (taskIds.has(taskId)) {
          filtered[taskId] = prev[taskId];
        }
      });
      return filtered;
    });
    
    setModifiedFields(prev => {
      const filtered = {};
      Object.keys(prev).forEach(taskId => {
        if (taskIds.has(taskId)) {
          filtered[taskId] = prev[taskId];
        }
      });
      return filtered;
    });
  }, [taskIds]);

  // Notify parent component when manual overrides change
  useEffect(() => {
    if (onManualOverridesChange) {
      onManualOverridesChange(manualOverrides);
    }
  }, [manualOverrides, onManualOverridesChange]);

  return (
    <div className="computation-section">
      <div className="computation-header">
        <div className="section-header" style={{ height: '32px' }}>
          <div className="section-icon computation">
            <Calculator size={20} color="#f59e0b" />
          </div>
          <h2 className="section-title">Computation Table</h2>
        </div>
        
        <div className="computation-buttons">
          <button 
            className="add-button primary" 
            onClick={onTaskAdd}
            disabled={mainTaskCount >= 27}
            title={mainTaskCount >= 27 ? "Maximum 27 assembly tasks reached" : "Add assembly task"}
          >
            <Plus className="add-icon" size={16} />
            Add Assembly
          </button>
          <button 
            className="add-button secondary" 
            onClick={() => onSubTaskAdd(selectedMainTaskId)}
            disabled={!selectedMainTaskId}
            title={!selectedMainTaskId ? "Select a main task first" : "Add sub-task"}
          >
            <Plus className="add-icon" size={16} />
            Add Parts
          </button>
        </div>
      </div>

      <div className="tasks-table-container">
        {/* Table Header */}
        <div className="tasks-table-header">
          <table className="tasks-table">
            <thead>
              <tr>
                <th>NO.</th>
                <th>REF NO</th>
                <th>DESCRIPTION</th>
                <th>HOURS</th>
                <th>MINUTES</th>
                <th>TIME CHARGE</th>
                <th>OT RATE</th>
                <th>OVERTIME</th>
                <th>SOFTWARE</th>
                <th>OH</th>
                <th>TYPE</th>
                <th>TOTAL</th>
                <th>ACTION</th>
              </tr>
            </thead>
          </table>
        </div>

        {/* Table Body */}
        <div className="tasks-table-body">
          <table className="tasks-table">
            <tbody>
              <ValueBasisRow baseRates={baseRates} onUpdate={onBaseRateUpdate} />
              
              {tasks.map((task, index) => {
                // Calculate hierarchical row numbers
                let rowNumber;
                if (task.isMainTask) {
                  // Count previous main tasks to get assembly number
                  const mainTasksBefore = tasks.slice(0, index).filter(t => t.isMainTask).length;
                  rowNumber = mainTasksBefore + 1;
                } else {
                  // For sub-tasks, count previous sub-tasks under the same parent
                  const subTasksBefore = tasks.slice(0, index).filter(t => t.parentId === task.parentId).length;
                  rowNumber = subTasksBefore + 1;
                }
                
                return (
                  <TaskRow
                    key={task.id}
                    task={task}
                    subtotals={getTaskSubtotals(task.id)}
                    onUpdate={onTaskUpdate}
                    onRemove={onTaskRemove}
                    formatCurrency={formatCurrency}
                    isSelected={task.isMainTask && task.id === selectedMainTaskId}
                    onMainTaskSelect={onMainTaskSelect}
                    rowNumber={rowNumber}
                    isEditing={editingTaskId === task.id}
                    onEditToggle={handleEditToggle}
                    onEditValueUpdate={handleEditValueUpdate}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grand Total Section */}
      <div className="grand-total-section">
        <div className="grand-total-label">Grand Total:</div>
        <div className="grand-total-value">¥{grandTotal.toLocaleString()}</div>
      </div>
    </div>
  );
});

// Set display names for React DevTools
ValueBasisRow.displayName = 'ValueBasisRow';
TaskRow.displayName = 'TaskRow';
TasksTable.displayName = 'TasksTable';

export default TasksTable;
