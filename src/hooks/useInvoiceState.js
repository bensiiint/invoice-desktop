import { useState, useCallback, useMemo } from 'react';

// Debounce utility
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Generate quotation number - removed R01 revision by default
function generateQuotationNumber(date, sequential = "001") {
  const dateObj = new Date(date);
  const year = dateObj.getFullYear().toString().slice(-2);
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const day = dateObj.getDate().toString().padStart(2, "0");
  return `KMTE-${year}${month}${day}-${sequential}`;
}

export function useInvoiceState() {
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
  const [quotationDetails, setQuotationDetails] = useState(() => {
    const today = new Date().toISOString().split("T")[0];
    const quotationNo = generateQuotationNumber(today);
    return {
      quotationNo,
      referenceNo: "", // Default blank reference number
      date: today,
      invoiceNo: "", // For billing statement
      jobOrderNo: "", // For billing statement
    };
  });

  // Tasks State - Updated for hierarchical structure
  const [tasks, setTasks] = useState([]);

  // Base Rates State
  const [baseRates, setBaseRates] = useState({
    timeChargeRate: 2700,
    otHoursMultiplier: 1.3,
    overtimeRate: 3300,
    softwareRate: 500,
    overheadPercentage: 20,
  });

  // File state
  const [currentFilePath, setCurrentFilePath] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Selected main task for adding sub-tasks
  const [selectedMainTaskId, setSelectedMainTaskId] = useState(null);

  // Signatures State
  const [signatures, setSignatures] = useState({
    quotation: {
      preparedBy: {
        name: "MR. MICHAEL PEÑANO",
        title: "Engineering Manager"
      },
      approvedBy: {
        name: "MR. YUICHIRO MAENO",
        title: "President"
      },
      receivedBy: {
        label: "(Signature Over Printed Name)"
      }
    },
    billing: {
      preparedBy: {
        name: "MS. PAULYN MURRILL BEJER",
        title: "Accounting Staff"
      },
      approvedBy: {
        name: "MR. MICHAEL PEÑANO",
        title: "Engineering Manager"
      },
      finalApprover: {
        name: "MR. YUICHIRO MAENO",
        title: "President"
      }
    }
  });

  // Debounced quotation number update
  const debouncedQuotationUpdate = useMemo(
    () => debounce((date) => {
      const newQuotationNo = generateQuotationNumber(date);
      setQuotationDetails(prev => ({
        ...prev,
        quotationNo: newQuotationNo,
      }));
    }, 300),
    []
  );

  // Optimized update functions
  const updateCompanyInfo = useCallback((updates) => {
    setCompanyInfo(updates);
    setHasUnsavedChanges(true);
  }, []);

  const updateClientInfo = useCallback((updates) => {
    setClientInfo(updates);
    setHasUnsavedChanges(true);
  }, []);

  const updateQuotationDetails = useCallback((updates) => {
    setQuotationDetails(prev => {
      const newDetails = { ...prev, ...updates };
      if (updates.date && updates.date !== prev.date) {
        debouncedQuotationUpdate(updates.date);
      }
      return newDetails;
    });
    setHasUnsavedChanges(true);
  }, [debouncedQuotationUpdate]);

  const addTask = useCallback(() => {
    const newTask = {
      id: Date.now(),
      description: "",
      referenceNumber: "",
      hours: 0,
      minutes: 0,
      overtimeHours: 0,
      softwareUnits: 0,
      type: "3D",
      unitType: "JD",
      isMainTask: true,
      parentId: null,
    };
    setTasks(prev => [...prev, newTask]);
    setHasUnsavedChanges(true);
  }, []);

  const addSubTask = useCallback((mainTaskId) => {
    if (!mainTaskId) {
      alert('Please select a main task first to add a sub-task.');
      return;
    }
    
    const newSubTask = {
      id: Date.now(),
      description: "",
      referenceNumber: "",
      hours: 0,
      minutes: 0,
      overtimeHours: 0,
      softwareUnits: 0,
      type: "3D",
      unitType: "JD",
      isMainTask: false,
      parentId: mainTaskId,
    };
    
    // Find the position to insert the sub-task (right after its parent or other sub-tasks)
    const parentIndex = tasks.findIndex(task => task.id === mainTaskId);
    if (parentIndex === -1) return;
    
    // Find the last sub-task of this parent, or insert right after parent
    let insertIndex = parentIndex + 1;
    for (let i = parentIndex + 1; i < tasks.length; i++) {
      if (tasks[i].parentId === mainTaskId) {
        insertIndex = i + 1;
      } else {
        break;
      }
    }
    
    setTasks(prev => {
      const newTasks = [...prev];
      newTasks.splice(insertIndex, 0, newSubTask);
      return newTasks;
    });
    setHasUnsavedChanges(true);
  }, [tasks]);

  const removeTask = useCallback((id) => {
    setTasks(prev => {
      const taskToRemove = prev.find(task => task.id === id);
      
      // If removing a main task, also remove all its sub-tasks
      if (taskToRemove?.isMainTask) {
        return prev.filter(task => task.id !== id && task.parentId !== id);
      }
      
      // If removing a sub-task, just remove the sub-task
      return prev.filter(task => task.id !== id);
    });
    setHasUnsavedChanges(true);
  }, []);

  const updateTask = useCallback((id, field, value) => {
    setTasks(prev => 
      prev.map(task => {
        if (task.id !== id) return task;
        
        const updatedTask = { ...task, [field]: value };
        
        return updatedTask;
      })
    );
    setHasUnsavedChanges(true);
  }, []);

  const updateBaseRate = useCallback((field, value) => {
    setBaseRates(prev => {
      const newRates = { ...prev, [field]: value };

      // Auto-update overtime rate when multiplier or time charge rate changes
      if (field === "otHoursMultiplier") {
        newRates.overtimeRate = Math.round(newRates.timeChargeRate * value);
      } else if (field === "timeChargeRate") {
        newRates.overtimeRate = Math.round(value * newRates.otHoursMultiplier);
      }

      return newRates;
    });

    setHasUnsavedChanges(true);
  }, []);

  const updateSignatures = useCallback((type, field, value) => {
    setSignatures(prev => ({
      ...prev,
      [type]: {
        ...prev[type],
        [field]: value
      }
    }));
    setHasUnsavedChanges(true);
  }, []);

  // Reset to new invoice
  const resetToNew = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    const newQuotationNo = generateQuotationNumber(today);

    setCompanyInfo({
      name: "",
      address: "",
      city: "",
      location: "",
      phone: "",
    });

    setClientInfo({
      company: "",
      contact: "",
      address: "",
      phone: "",
    });

    setQuotationDetails({
      quotationNo: newQuotationNo,
      referenceNo: "",
      date: today,
      invoiceNo: "", // For billing statement
      jobOrderNo: "", // For billing statement
    });

    setTasks([
      {
        id: Date.now(),
        description: "",
        referenceNumber: "",
        hours: 0,
        minutes: 0,
        overtimeHours: 0,
        softwareUnits: 0,
        type: "3D",
        unitType: "JD",
        isMainTask: true,
        parentId: null,
      },
    ]);

    setSelectedMainTaskId(null);

    setBaseRates({
      timeChargeRate: 2700,
      otHoursMultiplier: 1.3,
      overtimeRate: 3300,
      softwareRate: 500,
      overheadPercentage: 20,
    });

    setSignatures({
      quotation: {
        preparedBy: {
          name: "MR. MICHAEL PEÑANO",
          title: "Engineering Manager"
        },
        approvedBy: {
          name: "MR. YUICHIRO MAENO",
          title: "President"
        },
        receivedBy: {
          label: "(Signature Over Printed Name)"
        }
      },
      billing: {
        preparedBy: {
          name: "MS. PAULYN MURRILL BEJER",
          title: "Accounting Staff"
        },
        approvedBy: {
          name: "MR. MICHAEL PEÑANO",
          title: "Engineering Manager"
        },
        finalApprover: {
          name: "MR. YUICHIRO MAENO",
          title: "President"
        }
      }
    });

    setCurrentFilePath(null);
    setHasUnsavedChanges(false);
  }, []);

  // Load data from file
  const loadData = useCallback((data, fileName) => {
    setCompanyInfo(data.companyInfo || {
      name: "",
      address: "",
      city: "",
      location: "",
      phone: "",
    });

    setClientInfo(data.clientInfo || {
      company: "",
      contact: "",
      address: "",
      phone: "",
    });

    setQuotationDetails(data.quotationDetails || {
      quotationNo: "",
      referenceNo: "",
      date: new Date().toISOString().split("T")[0],
      invoiceNo: "", // For billing statement
      jobOrderNo: "", // For billing statement
    });

    setTasks(data.tasks || [
      {
        id: Date.now(),
        description: "",
        referenceNumber: "",
        hours: 0,
        minutes: 0,
        overtimeHours: 0,
        softwareUnits: 0,
        type: "3D",
        unitType: "JD",
        isMainTask: true,
        parentId: null,
      },
    ]);

    setSelectedMainTaskId(null);

    setBaseRates(data.baseRates || {
      timeChargeRate: 2700,
      otHoursMultiplier: 1.3,
      overtimeRate: 3300,
      softwareRate: 500,
      overheadPercentage: 20,
    });

    setSignatures(data.signatures || {
      quotation: {
        preparedBy: {
          name: "MR. MICHAEL PEÑANO",
          title: "Engineering Manager"
        },
        approvedBy: {
          name: "MR. YUICHIRO MAENO",
          title: "President"
        },
        receivedBy: {
          label: "(Signature Over Printed Name)"
        }
      },
      billing: {
        preparedBy: {
          name: "MS. PAULYN MURRILL BEJER",
          title: "Accounting Staff"
        },
        approvedBy: {
          name: "MR. MICHAEL PEÑANO",
          title: "Engineering Manager"
        },
        finalApprover: {
          name: "MR. YUICHIRO MAENO",
          title: "President"
        }
      }
    });

    setCurrentFilePath(fileName);
    setHasUnsavedChanges(false);
  }, []);

  // Get save data
  const getSaveData = useCallback(() => {
    return {
      companyInfo,
      clientInfo,
      quotationDetails,
      tasks,
      baseRates,
      signatures,
      savedAt: new Date().toISOString(),
    };
  }, [companyInfo, clientInfo, quotationDetails, tasks, baseRates, signatures]);

  return {
    // State
    companyInfo,
    clientInfo,
    quotationDetails,
    tasks,
    baseRates,
    signatures,
    currentFilePath,
    hasUnsavedChanges,
    selectedMainTaskId,
    
    // Actions
    updateCompanyInfo,
    updateClientInfo,
    updateQuotationDetails,
    addTask,
    addSubTask,
    removeTask,
    updateTask,
    updateBaseRate,
    updateSignatures,
    setSelectedMainTaskId,
    resetToNew,
    loadData,
    getSaveData,
    
    // File state setters
    setCurrentFilePath,
    setHasUnsavedChanges,
  };
}
