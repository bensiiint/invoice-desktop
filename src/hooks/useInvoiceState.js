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

// Generate quotation number
function generateQuotationNumber(date, sequential = "001", revision = "R01") {
  const dateObj = new Date(date);
  const year = dateObj.getFullYear().toString().slice(-2);
  const month = (dateObj.getMonth() + 1).toString().padStart(2, "0");
  const day = dateObj.getDate().toString().padStart(2, "0");
  return `KMTE-${year}${month}${day}-${sequential}-${revision}`;
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
      referenceNo: "24-003-016",
      date: today,
    };
  });

  // Tasks State
  const [tasks, setTasks] = useState([
    {
      id: 1,
      description: "受入れデータ機械配管図面仕様の検討・修正",
      referenceNumber: "",
      hours: 5,
      minutes: 0,
      overtimeHours: 3,
      softwareUnits: 43,
      type: "3D",
      unitType: "JD",
    },
    {
      id: 2,
      description: "Administrative Overhead",
      referenceNumber: "",
      hours: 0,
      minutes: 0,
      overtimeHours: 0,
      softwareUnits: 0,
      type: "3D",
      unitType: "LS",
    },
  ]);

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
    };
    setTasks(prev => [...prev, newTask]);
    setHasUnsavedChanges(true);
  }, []);

  const removeTask = useCallback((id) => {
    setTasks(prev => prev.filter(task => task.id !== id));
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
      },
    ]);

    setBaseRates({
      timeChargeRate: 0,
      otHoursMultiplier: 1.3,
      overtimeRate: 0,
      softwareRate: 0,
      overheadPercentage: 20,
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
      },
    ]);

    setBaseRates(data.baseRates || {
      timeChargeRate: 0,
      otHoursMultiplier: 1.3,
      overtimeRate: 0,
      softwareRate: 0,
      overheadPercentage: 20,
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
      savedAt: new Date().toISOString(),
    };
  }, [companyInfo, clientInfo, quotationDetails, tasks, baseRates]);

  return {
    // State
    companyInfo,
    clientInfo,
    quotationDetails,
    tasks,
    baseRates,
    currentFilePath,
    hasUnsavedChanges,
    
    // Actions
    updateCompanyInfo,
    updateClientInfo,
    updateQuotationDetails,
    addTask,
    removeTask,
    updateTask,
    updateBaseRate,
    resetToNew,
    loadData,
    getSaveData,
    
    // File state setters
    setCurrentFilePath,
    setHasUnsavedChanges,
  };
}
