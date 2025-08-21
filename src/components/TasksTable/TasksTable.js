import React, { memo, useMemo, useCallback } from 'react';
import { DollarSign, Plus, Trash2 } from 'lucide-react';

// Memoized sub-components for better performance
const ValueBasisRow = memo(({ baseRates, onUpdate }) => {
  const handleUpdate = useCallback((field, value) => {
    onUpdate(field, parseFloat(value) || 0);
  }, [onUpdate]);

  return (
    <tr className="value-basis-row">
      <td className="description-cell">
        <strong>Value Basis</strong>
      </td>
      <td className="basis-value-cell">-</td>
      <td className="basis-value-cell">-</td>
      <td className="basis-value-cell">-</td>
      <td className="basis-rate-cell">
        <input
          type="number"
          value={baseRates.timeChargeRate}
          onChange={(e) => handleUpdate('timeChargeRate', e.target.value)}
          className="table-input number-input rate-input"
          min="0"
        />
      </td>
      <td className="basis-rate-cell">
        <input
          type="number"
          value={baseRates.otHoursMultiplier}
          onChange={(e) => handleUpdate('otHoursMultiplier', e.target.value)}
          className="table-input number-input rate-input"
          min="0"
          step="0.1"
        />
      </td>
      <td className="basis-rate-cell">
        <input
          type="number"
          value={baseRates.overtimeRate}
          onChange={(e) => handleUpdate('overtimeRate', e.target.value)}
          className="table-input number-input rate-input"
          min="0"
        />
      </td>
      <td className="basis-rate-cell">
        <input
          type="number"
          value={baseRates.softwareRate}
          onChange={(e) => handleUpdate('softwareRate', e.target.value)}
          className="table-input number-input rate-input"
          min="0"
        />
      </td>
      <td className="basis-rate-cell">
        <div className="overhead-input-container">
          <input
            type="number"
            value={baseRates.overheadPercentage}
            onChange={(e) => handleUpdate('overheadPercentage', e.target.value)}
            className="table-input number-input rate-input overhead-percentage-input"
            min="0"
            max="100"
            step="1"
          />
          <span className="percentage-symbol">%</span>
        </div>
      </td>
      <td className="basis-value-cell">-</td>
      <td className="total-cell basis-total">
        <strong>Base Rates</strong>
      </td>
      <td></td>
    </tr>
  );
});

const TaskRow = memo(({ task, subtotals, onUpdate, onRemove, formatCurrency }) => {
  const handleUpdate = useCallback((field, value) => {
    onUpdate(task.id, field, value);
  }, [task.id, onUpdate]);

  const handleRemove = useCallback(() => {
    onRemove(task.id);
  }, [task.id, onRemove]);

  return (
    <tr>
      <td className="description-cell">
        <input
          type="text"
          value={task.description}
          onChange={(e) => handleUpdate('description', e.target.value)}
          className="table-input description-input"
          placeholder="Task description"
        />
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
        {formatCurrency(subtotals.basicLabor)}
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
        {formatCurrency(subtotals.overtime)}
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
          <span className="software-total">
            {formatCurrency(subtotals.software)}
          </span>
        </div>
      </td>
      <td className="calculated-cell overhead-bg">
        {formatCurrency(subtotals.overhead)}
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
      <td className="total-cell">{formatCurrency(subtotals.total)}</td>
      <td className="action-cell">
        <button
          onClick={handleRemove}
          className="remove-task-button"
          title="Remove task"
        >
          <Trash2 className="remove-icon" />
        </button>
      </td>
    </tr>
  );
});

// Main TasksTable component
const TasksTable = memo(({
  tasks,
  baseRates,
  onTaskUpdate,
  onTaskAdd,
  onTaskRemove,
  onBaseRateUpdate,
}) => {
  // Memoize calculations to prevent recalculation on every render
  const { taskTotals, grandTotal } = useMemo(() => {
    const totals = tasks.map((task) => {
      // Calculate total hours from hours and minutes
      const totalHours = (task.hours || 0) + (task.minutes || 0) / 60;
      const basicLabor = totalHours * baseRates.timeChargeRate;
      const overtime = task.overtimeHours * baseRates.overtimeRate;
      const software = (task.softwareUnits || 0) * baseRates.softwareRate;
      const subtotal = basicLabor + overtime + software;
      const overhead = subtotal * (baseRates.overheadPercentage / 100);
      return {
        taskId: task.id,
        basicLabor,
        overtime,
        software,
        overhead,
        total: basicLabor + overtime + software + overhead,
      };
    });

    const grand = totals.reduce((sum, task) => sum + task.total, 0);
    return { taskTotals: totals, grandTotal: grand };
  }, [tasks, baseRates]);

  // Memoize formatCurrency function
  const formatCurrency = useCallback((amount) => {
    return `¥${amount.toLocaleString()}`;
  }, []);

  // Memoize subtotals lookup
  const getTaskSubtotals = useCallback(
    (taskId) => {
      return (
        taskTotals.find((t) => t.taskId === taskId) || {
          basicLabor: 0,
          overtime: 0,
          software: 0,
          overhead: 0,
          total: 0,
        }
      );
    },
    [taskTotals]
  );

  return (
    <div className="section-card tasks-card">
      <div className="card-header">
        <DollarSign className="card-icon tasks" />
        <h2>Engineering Tasks</h2>
        <button className="add-button" onClick={onTaskAdd}>
          <Plus className="add-icon" />
          Add Task
        </button>
      </div>

      <div className="card-content">
        <div className="tasks-table-container">
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Description</th>
                <th>Ref No</th>
                <th>Hours</th>
                <th>Minutes</th>
                <th>Time Charge</th>
                <th>OT Hrs</th>
                <th>Overtime</th>
                <th>Software</th>
                <th>OH</th>
                <th>Type</th>
                <th>Total</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <ValueBasisRow baseRates={baseRates} onUpdate={onBaseRateUpdate} />

              {tasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  subtotals={getTaskSubtotals(task.id)}
                  onUpdate={onTaskUpdate}
                  onRemove={onTaskRemove}
                  formatCurrency={formatCurrency}
                />
              ))}
            </tbody>
            <tfoot>
              <tr className="grand-total-row">
                <td colSpan="10" className="grand-total-label-cell">
                  <strong>Grand Total</strong>
                </td>
                <td className="grand-total-value-cell">
                  <strong>{formatCurrency(grandTotal)}</strong>
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
});

// Set display names for React DevTools
ValueBasisRow.displayName = 'ValueBasisRow';
TaskRow.displayName = 'TaskRow';
TasksTable.displayName = 'TasksTable';

export default TasksTable;
