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
  Eye,
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
      hoursPerDay: 40,
      overtimeHours: 3,
      softwareUnits: 43,
      overheadUnits: 8,
      unitType: "JD",
    },
    {
      id: 2,
      description: "Administrative Overhead",
      referenceNumber: "",
      days: 0,
      hoursPerDay: 0,
      overtimeHours: 0,
      softwareUnits: 0,
      overheadUnits: 0,
      unitType: "LS",
    },
  ]);

  // Base Rates State - Value Basis
  const [baseRates, setBaseRates] = useState({
    timeChargeRate: 2700,
    overtimeRate: 3300,
    softwareRate: 500,
    overheadRate: 2700,
  });

  const [currentView, setCurrentView] = useState("input");
  const [currentFilePath, setCurrentFilePath] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track changes
  useEffect(() => {
    setHasUnsavedChanges(true);
  }, [tasks, companyInfo, clientInfo, quotationDetails, baseRates]);

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
        hoursPerDay: 8,
        overtimeHours: 0,
        softwareUnits: 0,
        overheadUnits: 0,
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
    setCurrentView("input");
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
    setCurrentView("quotation");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // Add new task
  const addTask = () => {
    const newTask = {
      id: Date.now(),
      description: "",
      referenceNumber: "",
      days: 0,
      hoursPerDay: 8,
      overtimeHours: 0,
      softwareUnits: 0,
      overheadUnits: 0,
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

  // Calculate individual task total
  const calculateTaskTotal = (task) => {
    const basicLabor = task.days * task.hoursPerDay * baseRates.timeChargeRate;
    const overtime = task.overtimeHours * baseRates.overtimeRate;
    const software = (task.softwareUnits || 0) * baseRates.softwareRate;
    const overhead = (task.overheadUnits || 0) * baseRates.overheadRate;
    return basicLabor + overtime + software + overhead;
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
              className={`switcher-button ${
                currentView === "input" ? "active" : ""
              }`}
              onClick={() => setCurrentView("input")}
            >
              <Calculator className="switcher-icon" />
              <span>Calculate</span>
            </button>
            <button
              className={`switcher-button ${
                currentView === "quotation" ? "active" : ""
              }`}
              onClick={() => setCurrentView("quotation")}
            >
              <Eye className="switcher-icon" />
              <span>Preview</span>
            </button>
          </div>
        </div>
      </nav>

      <div className="app-body">
        {currentView === "input" ? (
          // Single Page Vertical Layout
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
                          <th>Hrs/Day</th>
                          <th>Rate</th>
                          <th>OT Hrs</th>
                          <th>OT Rate</th>
                          <th>Software</th>
                          <th>Overhead</th>
                          <th>Total</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* Value Basis Row */}
                        <tr className="value-basis-row">
                          <td className="description-cell">
                            <strong>Value Basis</strong>
                          </td>
                          <td>-</td>
                          <td>-</td>
                          <td>
                            <input
                              type="number"
                              value={baseRates.timeChargeRate}
                              onChange={(e) =>
                                setBaseRates({
                                  ...baseRates,
                                  timeChargeRate:
                                    parseFloat(e.target.value) || 0,
                                })
                              }
                              className="table-input number-input rate-input"
                              min="0"
                            />
                          </td>
                          <td>-</td>
                          <td>
                            <input
                              type="number"
                              value={baseRates.overtimeRate}
                              onChange={(e) =>
                                setBaseRates({
                                  ...baseRates,
                                  overtimeRate: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="table-input number-input rate-input"
                              min="0"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={baseRates.softwareRate}
                              onChange={(e) =>
                                setBaseRates({
                                  ...baseRates,
                                  softwareRate: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="table-input number-input rate-input"
                              min="0"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              value={baseRates.overheadRate}
                              onChange={(e) =>
                                setBaseRates({
                                  ...baseRates,
                                  overheadRate: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="table-input number-input rate-input"
                              min="0"
                            />
                          </td>
                          <td className="total-cell">
                            <strong>Base Rates</strong>
                          </td>
                          <td></td>
                        </tr>

                        {/* Task Rows */}
                        {tasks.map((task) => (
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
                                value={task.hoursPerDay}
                                onChange={(e) =>
                                  updateTask(
                                    task.id,
                                    "hoursPerDay",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="table-input number-input"
                                min="0"
                              />
                            </td>
                            <td className="calculated-cell">
                              {formatCurrency(
                                task.days *
                                  task.hoursPerDay *
                                  baseRates.timeChargeRate
                              )}
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
                            <td className="calculated-cell">
                              {formatCurrency(
                                task.overtimeHours * baseRates.overtimeRate
                              )}
                            </td>
                            <td>
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
                                className="table-input number-input"
                                min="0"
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                value={task.overheadUnits || 0}
                                onChange={(e) =>
                                  updateTask(
                                    task.id,
                                    "overheadUnits",
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                className="table-input number-input"
                                min="0"
                              />
                            </td>
                            <td className="total-cell">
                              {formatCurrency(calculateTaskTotal(task))}
                            </td>
                            <td className="action-cell">
                              <button
                                onClick={() => removeTask(task.id)}
                                className="remove-task-button"
                              >
                                <Trash2 className="remove-icon" />
                              </button>
                            </td>
                          </tr>
                        ))}
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
        ) : (
          // Quotation Preview
          <div className="quotation-preview">
            <div className="quotation-paper">
              {/* Header */}
              <div className="quotation-header">
                <div className="company-brand">
                  <div className="company-logo">
                    <Building2 className="logo" />
                  </div>
                  <div className="company-info">
                    <h1>{companyInfo.name}</h1>
                    <h2>Quotation</h2>
                  </div>
                </div>
                <div className="quote-details">
                  <div>
                    <strong>QUOTATION NO.:</strong>{" "}
                    {quotationDetails.quotationNo}
                  </div>
                  <div>
                    <strong>REFERENCE NO.:</strong>{" "}
                    {quotationDetails.referenceNo}
                  </div>
                  <div>
                    <strong>DATE:</strong> {quotationDetails.date}
                  </div>
                </div>
              </div>

              {/* Parties */}
              <div className="quotation-parties">
                <div className="party">
                  <h3>Quotation to:</h3>
                  <div className="party-info">
                    <div className="party-name">{clientInfo.company}</div>
                    <div>{clientInfo.contact}</div>
                    <div>{clientInfo.address}</div>
                    <div>{clientInfo.phone}</div>
                  </div>
                </div>
                <div className="party">
                  <h3>From:</h3>
                  <div className="party-info">
                    <div className="party-name">{companyInfo.name}</div>
                    <div>{companyInfo.address}</div>
                    <div>{companyInfo.city}</div>
                    <div>{companyInfo.location}</div>
                    <div>{companyInfo.phone}</div>
                  </div>
                </div>
              </div>

              {/* Items */}
              <table className="items-table">
                <thead>
                  <tr>
                    <th>No.</th>
                    <th>Reference</th>
                    <th>Description</th>
                    <th>Unit</th>
                    <th>Type</th>
                    <th>Price</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task, index) => (
                    <tr key={task.id}>
                      <td>{index + 1}</td>
                      <td>{task.referenceNumber}</td>
                      <td>{task.description}</td>
                      <td>{task.days > 0 ? task.days : 1}</td>
                      <td>{task.unitType}</td>
                      <td className="price">
                        {formatCurrency(calculateTaskTotal(task))}
                      </td>
                    </tr>
                  ))}
                  <tr className="total-row">
                    <td colSpan="5">
                      <strong>Total Amount</strong>
                    </td>
                    <td className="price total">
                      <strong>{formatCurrency(calculateGrandTotal())}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Terms */}
              <div className="terms">
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
              <div className="signatures">
                <div className="signature">
                  <div className="sig-title">Prepared by:</div>
                  <div className="sig-line"></div>
                  <div className="sig-name">MR. MICHAEL PENAÑO</div>
                  <div className="sig-role">Engineering Manager</div>
                </div>
                <div className="signature">
                  <div className="sig-title">Received by:</div>
                  <div className="sig-line"></div>
                  <div className="sig-name">(Signature Over Printed Name)</div>
                </div>
                <div className="signature">
                  <div className="sig-title">Approved by:</div>
                  <div className="sig-line"></div>
                  <div className="sig-name">MR. YUICHIRO MAENO</div>
                  <div className="sig-role">President</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
