import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  FileText,
  Calculator,
  Building2,
  User,
  Calendar,
  DollarSign,
  Save,
  FolderOpen,
  Download,
} from "lucide-react";
import "./App.css";

const { ipcRenderer } = window.require ? window.require("electron") : {};
const fs = window.require ? window.require("fs") : {};
const path = window.require ? window.require("path") : {};

function App() {
  // Company Information State
  const [companyInfo, setCompanyInfo] = useState({
    name: "KUSAKABE & MAENO TECH., INC",
    address: "Unit 2-B Building B, Vital Industrial Properties Inc.",
    city: "First Cavite Industrial Estates, P-CIB PEZA Zone",
    location: "Dasmariñas City, Cavite Philippines",
    phone: "TEL: +63-46-414-4009",
  });

  // Client Information State
  const [clientInfo, setClientInfo] = useState({
    company: "NEXTENGINEERING Co, Ltd.",
    contact: "MR. Masahiro Hasegawa",
    address: "7-7, Hashimoto-machi, Nagasaki City, Nagasaki, 852-8114, Japan",
    phone: "TEL: +81-95-801-9012 / FAX: +81-95-801-9013",
  });

  // Quotation Details State
  const [quotationDetails, setQuotationDetails] = useState({
    quotationNo: "KMTE-266515-001-R01",
    referenceNo: "24-003-016",
    date: new Date().toISOString().split("T")[0],
  });

  // Tasks State - Engineering work items
  const [tasks, setTasks] = useState([
    {
      id: 1,
      description: "受入れデータ機械配管図面仕様の検討・修正",
      referenceNumber: "",
      days: 5,
      totalHours: 40,
      overtimeHours: 3,
      softwareUnits: 43,
      unitType: "JD",
    },
    {
      id: 2,
      description: "Administrative Overhead",
      referenceNumber: "",
      days: 0,
      totalHours: 0,
      overtimeHours: 0,
      softwareUnits: 0,
      unitType: "LS",
    },
  ]);

  // Base Rates State - Value Basis (now includes editable fields)
  const [baseRates, setBaseRates] = useState({
    hoursPerDay: 8, // Standard hours per day
    timeChargeRate: 2700, // per hour
    otHoursMultiplier: 1.3, // OT Hours multiplier - editable
    overtimeRate: 3300, // per hour - can be calculated or edited independently
    softwareRate: 500, // per unit
    overheadPercentage: 20, // Overhead percentage - now editable
  });
  const [currentFilePath, setCurrentFilePath] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [tasks, companyInfo, clientInfo, quotationDetails, baseRates]);

  // Auto-calculate overtime rate when OT hours multiplier changes
  useEffect(() => {
    const calculatedOvertimeRate =
      baseRates.timeChargeRate * baseRates.otHoursMultiplier;
    // Only update if the calculated rate is different and we're not in the middle of editing
    if (Math.abs(calculatedOvertimeRate - baseRates.overtimeRate) > 0.01) {
      setBaseRates((prev) => ({
        ...prev,
        overtimeRate: Math.round(calculatedOvertimeRate),
      }));
    }
  }, [baseRates.timeChargeRate, baseRates.otHoursMultiplier]);

  // Listen for menu events
  useEffect(() => {
    if (ipcRenderer) {
      ipcRenderer.on("menu-new-invoice", newInvoice);
      ipcRenderer.on("menu-save-invoice", saveInvoice);
      ipcRenderer.on("menu-load-invoice", loadInvoice);
      ipcRenderer.on("menu-export-pdf", exportPDF);

      return () => {
        ipcRenderer.removeAllListeners("menu-new-invoice");
        ipcRenderer.removeAllListeners("menu-save-invoice");
        ipcRenderer.removeAllListeners("menu-load-invoice");
        ipcRenderer.removeAllListeners("menu-export-pdf");
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // New Invoice
  const newInvoice = () => {
    if (
      hasUnsavedChanges &&
      !window.confirm(
        "You have unsaved changes. Are you sure you want to create a new invoice?"
      )
    ) {
      return;
    }

    setTasks([
      {
        id: Date.now(),
        description: "",
        referenceNumber: "",
        days: 0,
        totalHours: 0,
        overtimeHours: 0,
        softwareUnits: 0,
        unitType: "JD",
      },
    ]);

    setQuotationDetails({
      ...quotationDetails,
      quotationNo: `KMTE-${Date.now()}-001-R01`,
      date: new Date().toISOString().split("T")[0],
    });

    setCurrentFilePath(null);
    setHasUnsavedChanges(false);
  };

  // Save Invoice
  const saveInvoice = async () => {
    if (!ipcRenderer) {
      const data = {
        companyInfo,
        clientInfo,
        quotationDetails,
        tasks,
        baseRates,
      };
      localStorage.setItem("invoiceData", JSON.stringify(data));
      alert("Invoice saved to browser storage!");
      setHasUnsavedChanges(false);
      return;
    }

    try {
      let filePath = currentFilePath;

      if (!filePath) {
        const result = await ipcRenderer.invoke("save-file-dialog");
        if (result.canceled) return;
        filePath = result.filePath;
      }

      const data = {
        companyInfo,
        clientInfo,
        quotationDetails,
        tasks,
        baseRates,
        savedAt: new Date().toISOString(),
      };

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
      setCurrentFilePath(filePath);
      setHasUnsavedChanges(false);

      const fileName = path.basename(filePath);
      alert(`Invoice saved successfully as ${fileName}!`);
    } catch (error) {
      alert("Error saving file: " + error.message);
    }
  };

  // Load Invoice
  const loadInvoice = async () => {
    if (
      hasUnsavedChanges &&
      !window.confirm(
        "You have unsaved changes. Are you sure you want to load another invoice?"
      )
    ) {
      return;
    }

    if (!ipcRenderer) {
      const savedData = localStorage.getItem("invoiceData");
      if (savedData) {
        const data = JSON.parse(savedData);
        setCompanyInfo(data.companyInfo || companyInfo);
        setClientInfo(data.clientInfo || clientInfo);
        setQuotationDetails(data.quotationDetails || quotationDetails);
        setTasks(data.tasks || tasks);
        setBaseRates(data.baseRates || baseRates);
        setHasUnsavedChanges(false);
        alert("Invoice loaded from browser storage!");
      } else {
        alert("No saved invoice found in browser storage!");
      }
      return;
    }

    try {
      const result = await ipcRenderer.invoke("open-file-dialog");
      if (result.canceled) return;

      const filePath = result.filePaths[0];
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

      setCompanyInfo(data.companyInfo || companyInfo);
      setClientInfo(data.clientInfo || clientInfo);
      setQuotationDetails(data.quotationDetails || quotationDetails);
      setTasks(data.tasks || tasks);
      setBaseRates(data.baseRates || baseRates);
      setCurrentFilePath(filePath);
      setHasUnsavedChanges(false);

      const fileName = path.basename(filePath);
      alert(`Invoice loaded successfully from ${fileName}!`);
    } catch (error) {
      alert("Error loading file: " + error.message);
    }
  };

  // Export PDF
  const exportPDF = () => {
    window.print();
  };

  // Add new task
  const addTask = () => {
    const newTask = {
      id: Date.now(),
      description: "",
      referenceNumber: "",
      days: 0,
      totalHours: 0,
      overtimeHours: 0,
      softwareUnits: 0,
      unitType: "JD",
    };
    setTasks([...tasks, newTask]);
  };

  // Remove task
  const removeTask = (id) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  // Update task
  const updateTask = (id, field, value) => {
    setTasks(
      tasks.map((task) => (task.id === id ? { ...task, [field]: value } : task))
    );
  };

  // Update base rates with special handling
  const updateBaseRate = (field, value) => {
    setBaseRates((prev) => {
      const newRates = { ...prev, [field]: value };

      // If OT Hours multiplier is changed, auto-update overtime rate
      if (field === "otHoursMultiplier") {
        newRates.overtimeRate = Math.round(newRates.timeChargeRate * value);
      }
      // If time charge rate is changed, auto-update overtime rate
      else if (field === "timeChargeRate") {
        newRates.overtimeRate = Math.round(value * newRates.otHoursMultiplier);
      }
      // If overtime rate is changed directly, don't affect OT Hours multiplier
      // (no special handling needed - just update the value)

      return newRates;
    });
  };

  // Calculate individual task total
  const calculateTaskTotal = (task) => {
    const basicLabor = task.totalHours * baseRates.timeChargeRate;
    const overtime = task.overtimeHours * baseRates.overtimeRate;
    const software = (task.softwareUnits || 0) * baseRates.softwareRate;
    const subtotal = basicLabor + overtime + software;
    const overhead = subtotal * (baseRates.overheadPercentage / 100);
    return basicLabor + overtime + software + overhead;
  };

  // Calculate subtotals for display
  const calculateSubtotals = (task) => {
    const basicLabor = task.totalHours * baseRates.timeChargeRate;
    const overtime = task.overtimeHours * baseRates.overtimeRate;
    const software = (task.softwareUnits || 0) * baseRates.softwareRate;
    const subtotal = basicLabor + overtime + software;
    const overhead = subtotal * (baseRates.overheadPercentage / 100);
    return { basicLabor, overtime, software, overhead, subtotal };
  };

  // Calculate grand total
  const calculateGrandTotal = () => {
    return tasks.reduce((total, task) => total + calculateTaskTotal(task), 0);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `¥${amount.toLocaleString()}`;
  };

  return (
    <div className="app">
      {/* Top Navigation */}
      <nav className="top-nav">
        <div className="nav-brand">
          <Building2 className="brand-icon" />
          <div className="brand-text">
            <h1>Engineering Invoice</h1>
            {currentFilePath && (
              <span className="file-status">
                {path.basename(currentFilePath)}{" "}
                {hasUnsavedChanges && "• Edited"}
              </span>
            )}
          </div>
        </div>

        <div className="nav-actions">
          <button className="action-button secondary" onClick={newInvoice}>
            <FileText className="action-icon" />
            <span>New</span>
          </button>
          <button className="action-button primary" onClick={saveInvoice}>
            <Save className="action-icon" />
            <span>Save</span>
          </button>
          <button className="action-button secondary" onClick={loadInvoice}>
            <FolderOpen className="action-icon" />
            <span>Load</span>
          </button>
          <button className="action-button secondary" onClick={exportPDF}>
            <Download className="action-icon" />
            <span>Export</span>
          </button>

          <div className="view-switcher">
            <button
              className={`switcher-button active`}
              disabled
            >
              <Calculator className="switcher-icon" />
              <span>Calculate</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="app-body">
        {/* Single Page Vertical Layout */}
        <main className="vertical-layout-content">
          <div className="content-wrapper">
              {/* Quotation Details - Moved to Top */}
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
                        onChange={(e) =>
                          setQuotationDetails({
                            ...quotationDetails,
                            quotationNo: e.target.value,
                          })
                        }
                        className="form-input"
                      />
                    </div>
                    <div className="input-group">
                      <label>Reference Number</label>
                      <input
                        type="text"
                        value={quotationDetails.referenceNo}
                        onChange={(e) =>
                          setQuotationDetails({
                            ...quotationDetails,
                            referenceNo: e.target.value,
                          })
                        }
                        className="form-input"
                      />
                    </div>
                    <div className="input-group">
                      <label>Date</label>
                      <input
                        type="date"
                        value={quotationDetails.date}
                        onChange={(e) =>
                          setQuotationDetails({
                            ...quotationDetails,
                            date: e.target.value,
                          })
                        }
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Company & Client Info Row */}
              <div className="info-row">
                {/* Company Info */}
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
                        onChange={(e) =>
                          setCompanyInfo({
                            ...companyInfo,
                            name: e.target.value,
                          })
                        }
                        className="form-input"
                      />
                    </div>
                    <div className="input-group">
                      <label>Full Address</label>
                      <textarea
                        value={`${companyInfo.address}\n${companyInfo.city}\n${companyInfo.location}`}
                        onChange={(e) => {
                          const lines = e.target.value.split("\n");
                          setCompanyInfo({
                            ...companyInfo,
                            address: lines[0] || "",
                            city: lines[1] || "",
                            location: lines[2] || "",
                          });
                        }}
                        className="form-textarea"
                        rows="3"
                      />
                    </div>
                    <div className="input-group">
                      <label>Phone</label>
                      <input
                        type="text"
                        value={companyInfo.phone}
                        onChange={(e) =>
                          setCompanyInfo({
                            ...companyInfo,
                            phone: e.target.value,
                          })
                        }
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>

                {/* Client Info */}
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
                        onChange={(e) =>
                          setClientInfo({
                            ...clientInfo,
                            company: e.target.value,
                          })
                        }
                        className="form-input"
                      />
                    </div>
                    <div className="input-group">
                      <label>Contact Person</label>
                      <input
                        type="text"
                        value={clientInfo.contact}
                        onChange={(e) =>
                          setClientInfo({
                            ...clientInfo,
                            contact: e.target.value,
                          })
                        }
                        className="form-input"
                      />
                    </div>
                    <div className="input-group">
                      <label>Client Address</label>
                      <textarea
                        value={clientInfo.address}
                        onChange={(e) =>
                          setClientInfo({
                            ...clientInfo,
                            address: e.target.value,
                          })
                        }
                        className="form-textarea"
                        rows="2"
                      />
                    </div>
                    <div className="input-group">
                      <label>Client Phone</label>
                      <input
                        type="text"
                        value={clientInfo.phone}
                        onChange={(e) =>
                          setClientInfo({
                            ...clientInfo,
                            phone: e.target.value,
                          })
                        }
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Tasks Section */}
              <div className="section-card tasks-card">
                <div className="card-header">
                  <DollarSign className="card-icon tasks" />
                  <h2>Engineering Tasks</h2>
                  <button className="add-button" onClick={addTask}>
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
                          <th>Days</th>
                          <th>Hr</th>
                          <th>Time Charge</th>
                          <th>OT Hrs</th>
                          <th>Overtime</th>
                          <th>Software</th>
                          <th>OH</th>
                          <th>Total</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Value Basis Row - Now fully editable */}
                        <tr className="value-basis-row">
                          <td className="description-cell">
                            <strong>Value Basis</strong>
                          </td>
                          <td className="basis-value-cell">-</td>
                          <td className="basis-value-cell">
                            <input
                              type="number"
                              value={baseRates.hoursPerDay}
                              onChange={(e) =>
                                updateBaseRate(
                                  "hoursPerDay",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="table-input number-input rate-input"
                              min="0"
                              step="0.5"
                            />
                          </td>
                          <td className="basis-rate-cell">
                            <input
                              type="number"
                              value={baseRates.timeChargeRate}
                              onChange={(e) =>
                                updateBaseRate(
                                  "timeChargeRate",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="table-input number-input rate-input"
                              min="0"
                            />
                          </td>
                          <td className="basis-rate-cell">
                            <input
                              type="number"
                              value={baseRates.otHoursMultiplier}
                              onChange={(e) =>
                                updateBaseRate(
                                  "otHoursMultiplier",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="table-input number-input rate-input"
                              min="0"
                              step="0.1"
                            />
                          </td>
                          <td className="basis-rate-cell">
                            <input
                              type="number"
                              value={baseRates.overtimeRate}
                              onChange={(e) =>
                                updateBaseRate(
                                  "overtimeRate",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="table-input number-input rate-input"
                              min="0"
                            />
                          </td>
                          <td className="basis-rate-cell">
                            <input
                              type="number"
                              value={baseRates.softwareRate}
                              onChange={(e) =>
                                updateBaseRate(
                                  "softwareRate",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="table-input number-input rate-input"
                              min="0"
                            />
                          </td>
                          <td className="basis-rate-cell">
                            <div className="overhead-input-container">
                              <input
                                type="number"
                                value={baseRates.overheadPercentage}
                                onChange={(e) =>
                                  updateBaseRate(
                                    "overheadPercentage",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="table-input number-input rate-input overhead-percentage-input"
                                min="0"
                                max="100"
                                step="1"
                              />
                              <span className="percentage-symbol">%</span>
                            </div>
                          </td>
                          <td className="total-cell basis-total">
                            <strong>Base Rates</strong>
                          </td>
                          <td></td>
                        </tr>

                        {/* Task Rows */}
                        {tasks.map((task) => {
                          const subtotals = calculateSubtotals(task);
                          return (
                            <tr key={task.id}>
                              <td className="description-cell">
                                <input
                                  type="text"
                                  value={task.description}
                                  onChange={(e) =>
                                    updateTask(
                                      task.id,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  className="table-input description-input"
                                  placeholder="Task description"
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  value={task.days}
                                  onChange={(e) =>
                                    updateTask(
                                      task.id,
                                      "days",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="table-input number-input"
                                  min="0"
                                  step="0.5"
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  value={task.totalHours}
                                  onChange={(e) =>
                                    updateTask(
                                      task.id,
                                      "totalHours",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="table-input number-input"
                                  min="0"
                                  step="0.5"
                                />
                              </td>
                              <td className="calculated-cell time-charge-bg">
                                {formatCurrency(subtotals.basicLabor)}
                              </td>
                              <td>
                                <input
                                  type="number"
                                  value={task.overtimeHours}
                                  onChange={(e) =>
                                    updateTask(
                                      task.id,
                                      "overtimeHours",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
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
                                    onChange={(e) =>
                                      updateTask(
                                        task.id,
                                        "softwareUnits",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
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
                              <td className="total-cell">
                                {formatCurrency(calculateTaskTotal(task))}
                              </td>
                              <td className="action-cell">
                                <button
                                  onClick={() => removeTask(task.id)}
                                  className="remove-task-button"
                                  title="Remove task"
                                >
                                  <Trash2 className="remove-icon" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot>
                        <tr className="grand-total-row">
                          <td colSpan="8" className="grand-total-label-cell">
                            <strong>Grand Total</strong>
                          </td>
                          <td className="grand-total-value-cell">
                            <strong>
                              {formatCurrency(calculateGrandTotal())}
                            </strong>
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              </div>
              </div>
              </main>
                
          {/* Hidden Print Layout - Only visible when printing */}
          <div className="print-only-layout">
            <div className="quotation-paper-exact">
              {/* Logo and Header */}
              <div className="header-section">
                <div className="logo-section">
                  <div className="company-logo-circle">
                    <img
                      src="/KmtiLogo.png"
                      alt="Company Logo"
                      className="logo-image"
                    />
                  </div>
                </div>
                <div className="header-text">
                  <div className="company-name-header">
                    KUSAKABE & MAENO TECH., INC
                  </div>
                  <div className="quotation-title">Quotation</div>
                </div>
                <div className="quotation-details-box">
                  <div className="details-container">
                    <div className="detail-line">
                      <span className="detail-label">Quotation. NO.:</span>
                      <span className="detail-value">
                        {quotationDetails.quotationNo}
                      </span>
                    </div>
                    <div className="detail-line">
                      <span className="detail-label">REFERENCE NO.:</span>
                      <span className="detail-value">
                        {quotationDetails.referenceNo}
                      </span>
                    </div>
                    <div className="detail-line">
                      <span className="detail-label">DATE:</span>
                      <span className="detail-value">
                        {quotationDetails.date}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="contact-section">
                <div className="quotation-to">
                  <div className="contact-header">Quotation to</div>
                  <div className="contact-details">
                    <div className="company-name">{clientInfo.company}</div>
                    <div className="contact-person">{clientInfo.contact}</div>
                    <div className="address-line">{clientInfo.address}</div>
                    <div className="phone-line">{clientInfo.phone}</div>
                  </div>
                </div>
                <div className="company-from">
                  <div className="contact-header">{companyInfo.name}</div>
                  <div className="from-details">
                    <div className="from-address">{companyInfo.address}</div>
                    <div className="from-address">{companyInfo.city}</div>
                    <div className="from-address">{companyInfo.location}</div>
                    <div className="from-phone">{companyInfo.phone}</div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="quotation-table-exact">
                <thead>
                  <tr className="table-header">
                    <th className="col-no">No.</th>
                    <th className="col-reference" colSpan="3">
                      REFERENCE NUMBER
                    </th>
                    <th className="col-description">DESCRIPTION</th>
                    <th className="col-unit">
                      Unit
                      <br />
                      (Page)
                    </th>
                    <th className="col-type">Type</th>
                    <th className="col-price" colSpan="2">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, index) => (
                    <tr key={task.id} className="item-row">
                      <td className="col-no">{index + 1}</td>
                      <td className="col-reference" colSpan="3">
                        {task.referenceNumber || "　"}
                      </td>
                      <td className="col-description">{task.description}</td>
                      <td className="col-unit">
                        {task.days > 0 ? task.days : "　"}
                      </td>
                      <td className="col-type">{task.unitType}</td>
                      <td className="col-price" colSpan="2">
                        {formatCurrency(calculateTaskTotal(task))}
                      </td>
                    </tr>
                  ))}
                  {/* Empty rows to match template */}
                  {Array.from(
                    { length: Math.max(0, 8 - tasks.length) },
                    (_, i) => (
                      <tr key={`empty-${i}`} className="item-row">
                        <td className="col-no">　</td>
                        <td className="col-reference" colSpan="3">
                          　
                        </td>
                        <td className="col-description">　</td>
                        <td className="col-unit">　</td>
                        <td className="col-type">　</td>
                        <td className="col-price" colSpan="2">
                          　
                        </td>
                      </tr>
                    )
                  )}
                  <tr className="total-amount-row">
                    <td colSpan="7" className="total-label">
                      Total Amount
                    </td>
                    <td colSpan="2" className="total-value">
                      {formatCurrency(calculateGrandTotal())}
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Terms */}
              <div className="terms-section">
                <p>
                  Upon receipt of this quotation sheet, kindly send us one copy
                  with your signature.
                </p>
                <p>
                  The price will be changed without prior notice due to frequent
                  changes of conversion rate.
                </p>
              </div>

              {/* Signatures */}
              <div className="signatures-section">
                <div className="signature-row">
                  <div className="sig-group">
                    <div className="sig-title">Prepared by:</div>
                    <div className="sig-space"></div>
                    <div className="sig-name">MR. MICHAEL PENAÑO</div>
                    <div className="sig-role">Engineering Manager</div>
                  </div>
                  <div className="sig-spacer"></div>
                  <div className="sig-group">
                    <div className="sig-title">Approved by:</div>
                    <div className="sig-space"></div>
                    <div className="sig-name">MR. YUICHIRO MAENO</div>
                    <div className="sig-role">President</div>
                  </div>
                  <div className="sig-group">
                    <div className="sig-title">Received by:</div>
                    <div className="sig-space"></div>
                    <div className="sig-name">
                      (Signature Over Printed Name)
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="footer-section">
                <div className="footer-left">cc: admin/acctg/Engineering</div>
                <div className="footer-right">
                  Admin Quotation Template v2.0-2016
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
}

export default App;
