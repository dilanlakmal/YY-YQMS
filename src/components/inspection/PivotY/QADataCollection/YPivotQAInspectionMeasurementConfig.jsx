import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import {
  Ruler,
  Loader2,
  Maximize2,
  Settings,
  CheckCircle2,
  Lock,
  Unlock,
  AlertTriangle,
  Play,
  CheckCircle,
  FilePenLine
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

// Import Sub-Components
import YPivotQATemplatesSpecsConfigModal from "../QATemplates/YPivotQATemplatesSpecsConfigModal";
import YPivotQATemplatesMeasurementGridModal from "../QATemplates/YPivotQATemplatesMeasurementGridModal";
import YPivotQATemplatesMeasurementResultsTab from "../QATemplates/YPivotQATemplatesMeasurementResultsTab";
import YPivotQAInspectionMeasurementSummary from "./YPivotQAInspectionMeasurementSummary";
import YPivotQAInspectionMeasurementManual from "./YPivotQAInspectionMeasurementManual";

const YPivotQAInspectionMeasurementConfig = ({
  selectedOrders,
  orderData,
  reportData,
  onUpdateMeasurementData,
  activeGroup,
  displayLabel
}) => {
  const activeMoNo =
    selectedOrders && selectedOrders.length > 0 ? selectedOrders[0] : null;
  const activeReportTemplate = reportData?.selectedTemplate;

  // This comes from the Parent Wrapper (It overrides selectedTemplate.Measurement for the specific tab)
  const measConfig = activeReportTemplate?.Measurement || "No";

  // This contains the specific config for THIS stage (unpacked by parent)
  const savedState = reportData?.measurementData || {};

  const [internalTab, setInternalTab] = useState("specs");
  const [loading, setLoading] = useState(false);
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  // --- STATE VARIABLES ---
  const [fullSpecsList, setFullSpecsList] = useState([]);
  const [selectedSpecsList, setSelectedSpecsList] = useState([]);
  const [sourceType, setSourceType] = useState("");
  const [isConfigured, setIsConfigured] = useState(false);
  const [savedMeasurements, setSavedMeasurements] = useState([]);
  const [orderSizes, setOrderSizes] = useState([]);
  const [kValuesList, setKValuesList] = useState([]);

  // Initialize from savedState if available
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedKValue, setSelectedKValue] = useState("");

  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [editingMeasurementIndex, setEditingMeasurementIndex] = useState(null);
  const [editingMeasurementData, setEditingMeasurementData] = useState(null);

  // Ref to prevent infinite update loops
  const isFetching = useRef(false);
  const lastSavedStateRef = useRef(null);

  // --- 1. CRITICAL SYNC STATE FROM PROPS ---
  // Use a single dependency on the stringified savedState to detect changes
  useEffect(() => {
    // Create a stable comparison key to prevent unnecessary updates
    const stateKey = JSON.stringify({
      fullSpecsCount: savedState.fullSpecsList?.length || 0,
      selectedSpecsCount: savedState.selectedSpecsList?.length || 0,
      sourceType: savedState.sourceType,
      isConfigured: savedState.isConfigured,
      measurementsCount: savedState.savedMeasurements?.length || 0,
      sizesCount: savedState.orderSizes?.length || 0,
      kValuesCount: savedState.kValuesList?.length || 0,
      lastKValue: savedState.lastSelectedKValue
    });

    // Skip if nothing changed
    if (lastSavedStateRef.current === stateKey) {
      return;
    }
    lastSavedStateRef.current = stateKey;

    console.log(`[MeasConfig ${measConfig}] Syncing state from props`, {
      specs: savedState.fullSpecsList?.length,
      kValues: savedState.kValuesList,
      lastK: savedState.lastSelectedKValue
    });

    setFullSpecsList(savedState.fullSpecsList || []);
    setSelectedSpecsList(savedState.selectedSpecsList || []);
    setSourceType(savedState.sourceType || "");
    setIsConfigured(savedState.isConfigured || false);
    setSavedMeasurements(savedState.savedMeasurements || []);
    setOrderSizes(savedState.orderSizes || []);
    setKValuesList(savedState.kValuesList || []);

    // Restore selected K Value from saved state
    if (savedState.lastSelectedKValue) {
      setSelectedKValue(savedState.lastSelectedKValue);
    } else if (savedState.kValuesList?.length > 0 && !selectedKValue) {
      // Auto-select first K value if none selected
      setSelectedKValue(savedState.kValuesList[0]);
    }
  }, [savedState, measConfig]);

  // --- MANUAL DATA LOGIC ---
  const currentManualData = useMemo(() => {
    const allManualData = reportData?.measurementData?.manualDataByGroup || {};
    const groupId = activeGroup?.id || "general";
    return (
      allManualData[groupId] || { remarks: "", status: "Pass", images: [] }
    );
  }, [reportData?.measurementData?.manualDataByGroup, activeGroup]);

  const handleManualDataUpdate = (newManualData) => {
    if (onUpdateMeasurementData) {
      const groupId = activeGroup?.id || "general";
      const existingManualDataMap =
        reportData?.measurementData?.manualDataByGroup || {};
      onUpdateMeasurementData({
        manualDataByGroup: {
          ...existingManualDataMap,
          [groupId]: newManualData
        }
      });
    }
  };

  // Enhanced updateParent to persist selection state
  const updateParent = (updates, options = {}) => {
    if (onUpdateMeasurementData) {
      const enhancedUpdates = {
        ...updates
      };

      // Always persist current selection state unless explicitly told not to
      if (!options.skipSelectionPersist) {
        enhancedUpdates.lastSelectedKValue = selectedKValue;
        enhancedUpdates.lastSelectedSize = selectedSize;
      }

      onUpdateMeasurementData(enhancedUpdates);
    }
  };

  // --- 2. FETCH SPECS ON MOUNT OR STAGE CHANGE ---
  useEffect(() => {
    if (!activeMoNo || !activeReportTemplate || measConfig === "No") {
      setInitialLoadDone(true);
      return;
    }

    // Only fetch if we don't have specs for this stage yet
    if (savedState.fullSpecsList && savedState.fullSpecsList.length > 0) {
      setInitialLoadDone(true);
      return;
    }

    const initData = async () => {
      if (isFetching.current) return;
      isFetching.current = true;

      const sizes = extractSizesFromOrderData();
      setOrderSizes(sizes);

      // Pass the specific stage (Before or After) to the fetcher
      await fetchMeasurementSpecs(measConfig, activeMoNo, sizes);

      isFetching.current = false;
    };

    initData();
  }, [activeMoNo, measConfig]);

  // Only clear size when group changes, NOT kValue
  useEffect(() => {
    setSelectedSize("");
    // Don't clear kValue here - it should persist across group changes
  }, [activeGroup?.id]);

  const extractSizesFromOrderData = () => {
    if (!orderData) return [];
    const allSizes = new Set();
    // Logic to extract sizes...
    if (orderData.orderBreakdowns && Array.isArray(orderData.orderBreakdowns)) {
      orderData.orderBreakdowns.forEach((breakdown) => {
        if (breakdown.colorSizeBreakdown?.sizeList) {
          breakdown.colorSizeBreakdown.sizeList.forEach((s) => allSizes.add(s));
        }
      });
    } else if (orderData.colorSizeBreakdown?.sizeList) {
      orderData.colorSizeBreakdown.sizeList.forEach((s) => allSizes.add(s));
    } else if (orderData.dtOrder?.sizeList) {
      orderData.dtOrder.sizeList.forEach((s) => allSizes.add(s));
    }
    return Array.from(allSizes);
  };

  const fetchMeasurementSpecs = async (type, moNo, currentSizes) => {
    setLoading(true);
    // Dynamic Endpoint based on type (Before vs After)
    const endpoint =
      type === "Before"
        ? `/api/qa-sections/measurement-specs/${moNo}`
        : `/api/qa-sections/measurement-specs-aw/${moNo}`;

    try {
      const res = await axios.get(`${API_BASE_URL}${endpoint}`);
      const { source, data } = res.data;
      const newSourceType = source;
      const newIsConfigured = source === "qa_sections";
      let all = [];
      let selected = [];
      let newKValues = [];

      // Logic to parse response based on Type
      if (type === "Before") {
        all = data.AllBeforeWashSpecs || [];
        selected = data.selectedBeforeWashSpecs || [];
        const kSet = new Set(
          all.map((s) => s.kValue).filter((k) => k && k !== "NA")
        );
        newKValues = Array.from(kSet).sort();
      } else {
        // After Wash Logic
        all = data.AllAfterWashSpecs || [];
        selected = data.selectedAfterWashSpecs || [];
        newKValues = []; // No K Values for After Wash
      }

      const finalList =
        source === "qa_sections" && selected.length > 0 ? selected : all;

      // Update Local State
      setSourceType(newSourceType);
      setIsConfigured(newIsConfigured);
      setFullSpecsList(all);
      setSelectedSpecsList(finalList);
      setKValuesList(newKValues);

      // Auto-select first K value if available and none selected
      if (newKValues.length > 0 && !selectedKValue) {
        setSelectedKValue(newKValues[0]);
      }

      // Save to Parent (so it persists when switching tabs)
      updateParent(
        {
          sourceType: newSourceType,
          isConfigured: newIsConfigured,
          fullSpecsList: all,
          selectedSpecsList: finalList,
          kValuesList: newKValues,
          orderSizes: currentSizes,
          // Also persist the auto-selected K value
          lastSelectedKValue:
            newKValues.length > 0 ? selectedKValue || newKValues[0] : ""
        },
        { skipSelectionPersist: true }
      );
    } catch (error) {
      console.error(`Error fetching specs for ${type}:`, error);
    } finally {
      setLoading(false);
      setInitialLoadDone(true);
    }
  };

  // --- FILTERING LOGIC ---
  const filteredFullSpecsList = useMemo(() => {
    if (measConfig === "Before" && selectedKValue) {
      return fullSpecsList.filter(
        (s) => s.kValue === selectedKValue || s.kValue === "NA"
      );
    }
    return fullSpecsList;
  }, [fullSpecsList, selectedKValue, measConfig]);

  const filteredSelectedSpecsList = useMemo(() => {
    if (measConfig === "Before" && selectedKValue) {
      return selectedSpecsList.filter(
        (s) => s.kValue === selectedKValue || s.kValue === "NA"
      );
    }
    return selectedSpecsList;
  }, [selectedSpecsList, selectedKValue, measConfig]);

  // --- SAVE CONFIG HANDLER ---
  const handleSaveConfig = async (selectedIds) => {
    const filtered = fullSpecsList.filter((s) => selectedIds.includes(s.id));
    setSelectedSpecsList(filtered);
    setIsConfigured(true);
    setSourceType("qa_sections");

    // Save to Parent State
    updateParent({
      selectedSpecsList: filtered,
      isConfigured: true,
      sourceType: "qa_sections"
    });

    // Save to DB
    const endpoint =
      measConfig === "Before"
        ? `/api/qa-sections/measurement-specs/save`
        : `/api/qa-sections/measurement-specs-aw/save`;

    const payload = {
      moNo: activeMoNo,
      allSpecs: fullSpecsList,
      selectedSpecs: filtered,
      isSaveAll: false
    };
    try {
      await axios.post(`${API_BASE_URL}${endpoint}`, payload);
    } catch (e) {
      console.error("Failed to save config", e);
      alert("Failed to save configuration to server.");
    }
  };

  // Persist K value after saving measurement
  const handleSaveMeasurement = (data) => {
    const enhancedData = {
      ...data,
      groupId: activeGroup?.id,
      line: activeGroup?.line,
      table: activeGroup?.table,
      color: activeGroup?.color,
      lineName: activeGroup?.lineName,
      tableName: activeGroup?.tableName,
      colorName: activeGroup?.colorName,
      qcUser: activeGroup?.activeQC,
      stage: measConfig, // Save stage from current config
      kValue: measConfig === "Before" ? selectedKValue : "" // Always save kValue for Before
    };

    let updatedMeasurements;
    if (editingMeasurementIndex !== null) {
      updatedMeasurements = [...savedMeasurements];
      updatedMeasurements[editingMeasurementIndex] = enhancedData;
      setEditingMeasurementIndex(null);
      setEditingMeasurementData(null);
    } else {
      updatedMeasurements = [...savedMeasurements, enhancedData];
    }
    setSavedMeasurements(updatedMeasurements);

    // Update parent with measurement AND persist K value
    updateParent({
      savedMeasurements: updatedMeasurements,
      lastSelectedKValue: selectedKValue, // Persist K value
      triggerAutoSave: true
    });

    if (editingMeasurementIndex === null) {
      setSelectedSize(""); // Clear size but keep K value
    }
  };

  const handleEditMeasurement = (measurement, index) => {
    setEditingMeasurementIndex(index);
    setEditingMeasurementData(measurement);
    setSelectedSize(measurement.size);
    setSelectedKValue(measurement.kValue || "");
    setIsGridOpen(true);
  };

  const handleDeleteMeasurement = (index) => {
    if (!window.confirm("Delete this measurement?")) return;
    const updatedMeasurements = [...savedMeasurements];
    updatedMeasurements.splice(index, 1);
    setSavedMeasurements(updatedMeasurements);
    updateParent({ savedMeasurements: updatedMeasurements });
  };

  const handleStartMeasuring = () => {
    setEditingMeasurementIndex(null);
    setEditingMeasurementData(null);
    setIsGridOpen(true);
  };

  // Handle K value change with parent persist
  const handleKValueChange = (newKValue) => {
    setSelectedKValue(newKValue);
    setSelectedSize(""); // Clear size when K changes

    // Persist to parent immediately
    updateParent({
      lastSelectedKValue: newKValue
    });
  };

  const getSizeStatus = useMemo(() => {
    const statusMap = {};
    if (!activeGroup) return statusMap;

    const contextMeasurements = savedMeasurements.filter(
      (m) => m.groupId === activeGroup.id
    );

    contextMeasurements.forEach((m) => {
      const key = measConfig === "Before" ? `${m.size}_${m.kValue}` : m.size;
      const allCount =
        m.allEnabledPcs instanceof Set
          ? m.allEnabledPcs.size
          : m.allEnabledPcs?.length || 0;
      const criticalCount =
        m.criticalEnabledPcs instanceof Set
          ? m.criticalEnabledPcs.size
          : m.criticalEnabledPcs?.length || 0;
      const isComplete = allCount > 0 || criticalCount > 0;

      statusMap[key] = {
        isComplete,
        inspectorDecision: m.inspectorDecision,
        systemDecision: m.systemDecision
      };
    });
    return statusMap;
  }, [savedMeasurements, activeGroup, measConfig]);

  const isSizeLocked = (size) => {
    if (!activeGroup) return false;
    const key =
      measConfig === "Before" && selectedKValue
        ? `${size}_${selectedKValue}`
        : size;
    return getSizeStatus[key]?.isComplete;
  };

  const canSelectSizeAndK = isConfigured || sourceType === "qa_sections";
  const needsKValue = measConfig === "Before" && kValuesList.length > 0;
  const canStartMeasuring =
    selectedSize &&
    (!needsKValue || selectedKValue) &&
    !isSizeLocked(selectedSize);

  if (!activeMoNo)
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow">
        No Order Selected
      </div>
    );
  if (measConfig === "No")
    return (
      <div className="p-8 text-center bg-white rounded-xl shadow">
        Measurement Not Required
      </div>
    );
  if (loading && !initialLoadDone)
    return (
      <div className="p-12 text-center">
        <Loader2 className="animate-spin inline w-8 h-8" />
      </div>
    );

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Ruler className="w-5 h-5 text-indigo-500" />
            {/* Display correct label (Before or After) */}
            Measurement: {displayLabel || `${measConfig} Wash`}
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Order:{" "}
            <span className="font-mono text-indigo-600 dark:text-indigo-400">
              {activeMoNo}
            </span>{" "}
            • {selectedSpecsList.length} Critical Points
            {/* Show current K value in header for debugging */}
            {measConfig === "Before" && selectedKValue && (
              <span className="ml-2 text-purple-600">
                • K: {selectedKValue}
              </span>
            )}
          </p>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
          <button
            onClick={() => setInternalTab("manual")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              internalTab === "manual"
                ? "bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-indigo-300"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <FilePenLine className="w-3.5 h-3.5" /> Manual
          </button>
          <button
            onClick={() => setInternalTab("specs")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              internalTab === "specs"
                ? "bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-indigo-300"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Setup & Measure
          </button>
          <button
            onClick={() => setInternalTab("results")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
              internalTab === "results"
                ? "bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-indigo-300"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Results{" "}
            {savedMeasurements.length > 0 && (
              <span className="bg-indigo-500 text-white text-[9px] px-1.5 rounded-full">
                {savedMeasurements.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setInternalTab("summary")}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
              internalTab === "summary"
                ? "bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-indigo-300"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            Summary
          </button>
        </div>
      </div>

      {activeGroup ? (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-3 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-4 h-4 text-green-600 dark:text-green-400 fill-current" />
            <div className="text-sm font-bold text-green-800 dark:text-green-300 flex flex-wrap gap-1">
              <span className="mr-1">Active:</span>
              {activeGroup.lineName && (
                <span className="bg-white/50 px-1.5 rounded border border-green-200">
                  Line {activeGroup.lineName}
                </span>
              )}
              {activeGroup.tableName && (
                <span className="bg-white/50 px-1.5 rounded border border-green-200">
                  Table {activeGroup.tableName}
                </span>
              )}
              {activeGroup.colorName && (
                <span className="bg-white/50 px-1.5 rounded border border-green-200">
                  Color {activeGroup.colorName}
                </span>
              )}
            </div>
          </div>
          {activeGroup.activeQC && (
            <div className="text-xs text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-800 px-2 py-1 rounded">
              QC: {activeGroup.activeQC.eng_name}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
          <div>
            <p className="font-bold text-amber-700 dark:text-amber-400">
              No Active Inspection Context
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-500">
              Please go back to the <strong>Info</strong> tab and click "Start"
              on a specific card.
            </p>
          </div>
        </div>
      )}

      {internalTab === "manual" && (
        <YPivotQAInspectionMeasurementManual
          data={currentManualData}
          onUpdate={handleManualDataUpdate}
        />
      )}

      {internalTab === "specs" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 space-y-4">
            <div
              className={`bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 ${
                !activeGroup ? "opacity-50 pointer-events-none grayscale" : ""
              }`}
            >
              <div className="flex justify-between items-center mb-4">
                <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300">
                  Setup
                </h4>
                <button
                  onClick={() => setIsConfigModalOpen(true)}
                  className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded-lg hover:bg-indigo-100 transition-colors font-medium flex items-center gap-1"
                >
                  <Settings className="w-3 h-3" /> Configure
                </button>
              </div>

              <div className="space-y-4">
                {/* K Value Selection - Only if K Values Exist (fetched by type="Before") */}
                {measConfig === "Before" && kValuesList.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-2">
                      K Value{" "}
                      {canSelectSizeAndK ? (
                        <Unlock className="w-3 h-3 text-green-500" />
                      ) : (
                        <Lock className="w-3 h-3 text-gray-400" />
                      )}
                      {/* Show current selection status */}
                      {selectedKValue && (
                        <span className="text-purple-500 text-[10px] font-normal">
                          (Selected: {selectedKValue})
                        </span>
                      )}
                    </label>
                    <select
                      value={selectedKValue}
                      onChange={(e) => handleKValueChange(e.target.value)}
                      disabled={!canSelectSizeAndK}
                      className="w-full p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm"
                    >
                      <option value="">-- Select K --</option>
                      {kValuesList.map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1.5 flex items-center gap-2">
                    Size{" "}
                    {canSelectSizeAndK ? (
                      <Unlock className="w-3 h-3 text-green-500" />
                    ) : (
                      <Lock className="w-3 h-3 text-gray-400" />
                    )}
                  </label>
                  <div className="space-y-2">
                    {orderSizes.map((s) => {
                      const key =
                        measConfig === "Before" && selectedKValue
                          ? `${s}_${selectedKValue}`
                          : s;
                      const status = getSizeStatus[key];
                      const isDisabled =
                        !canSelectSizeAndK ||
                        (needsKValue && !selectedKValue) ||
                        status?.isComplete;

                      return (
                        <button
                          key={s}
                          onClick={() => !isDisabled && setSelectedSize(s)}
                          disabled={isDisabled}
                          className={`w-full p-3 rounded-xl border-2 transition-all flex items-center justify-between ${
                            selectedSize === s
                              ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                              : status?.isComplete
                              ? "border-green-300 bg-green-50 dark:bg-green-900/20"
                              : "border-gray-200 dark:border-gray-700"
                          } ${
                            isDisabled
                              ? "opacity-60 cursor-not-allowed"
                              : "hover:border-indigo-300 cursor-pointer"
                          }`}
                        >
                          <span className="font-bold text-gray-800 dark:text-gray-200">
                            {s}
                          </span>
                          {status?.isComplete && (
                            <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded font-bold">
                              DONE
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <button
                  onClick={handleStartMeasuring}
                  disabled={!canStartMeasuring || !canSelectSizeAndK}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-2"
                >
                  <Maximize2 className="w-4 h-4" /> Start Measuring
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 h-full max-h-[500px] flex flex-col">
              <h4 className="font-bold text-sm text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Critical Points Preview ({filteredSelectedSpecsList.length})
              </h4>
              <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                {filteredSelectedSpecsList.map((spec, idx) => (
                  <div
                    key={spec.id || idx}
                    className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700"
                  >
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                      {spec.MeasurementPointEngName}
                    </p>
                    {spec.kValue && spec.kValue !== "NA" && (
                      <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded border border-purple-100">
                        K: {spec.kValue}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {internalTab === "results" && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <YPivotQATemplatesMeasurementResultsTab
            savedMeasurements={savedMeasurements}
            specsData={fullSpecsList}
            selectedSpecsList={selectedSpecsList}
            onEditMeasurement={handleEditMeasurement}
            onDeleteMeasurement={handleDeleteMeasurement}
            activeGroup={activeGroup}
          />
        </div>
      )}

      {internalTab === "summary" && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <YPivotQAInspectionMeasurementSummary
            savedMeasurements={savedMeasurements}
            specsData={fullSpecsList}
            selectedSpecsList={selectedSpecsList}
            activeGroup={activeGroup}
          />
        </div>
      )}

      <YPivotQATemplatesSpecsConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        specsData={fullSpecsList}
        selectedSpecsIds={selectedSpecsList.map((s) => s.id)}
        measType={measConfig}
        onSaveConfig={handleSaveConfig}
      />

      <YPivotQATemplatesMeasurementGridModal
        isOpen={isGridOpen}
        onClose={() => {
          setIsGridOpen(false);
          setEditingMeasurementIndex(null);
          setEditingMeasurementData(null);
        }}
        specsData={filteredFullSpecsList}
        selectedSpecsList={filteredSelectedSpecsList}
        selectedSize={selectedSize}
        selectedKValue={selectedKValue}
        measType={measConfig}
        onSave={handleSaveMeasurement}
        editingData={editingMeasurementData}
        isEditing={editingMeasurementIndex !== null}
      />
    </div>
  );
};

export default YPivotQAInspectionMeasurementConfig;
