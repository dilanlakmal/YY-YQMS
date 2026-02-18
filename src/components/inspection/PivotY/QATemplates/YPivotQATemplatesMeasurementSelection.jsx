import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Search,
  ClipboardList,
  Ruler,
  Loader2,
  Maximize2,
  AlertCircle,
  Settings,
  BarChart3,
  CheckCircle2,
  Lock,
  Unlock,
  CheckCircle,
  Play,
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

// Import Sub-Components
import YPivotQATemplatesSpecsConfigModal from "./YPivotQATemplatesSpecsConfigModal";
import YPivotQATemplatesMeasurementGridModal from "./YPivotQATemplatesMeasurementGridModal";
import YPivotQATemplatesMeasurementResultsTab from "./YPivotQATemplatesMeasurementResultsTab";

// ==========================================================================
// MAIN COMPONENT
// ==========================================================================
const YPivotQATemplatesMeasurementSelection = () => {
  // --- Navigation State ---
  const [activeTab, setActiveTab] = useState("orders");

  // --- Order Selection State ---
  const [ordersResults, setOrdersResults] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- Report Type State ---
  const [reportTypes, setReportTypes] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);

  // --- Specs Configuration State ---
  const [measConfig, setMeasConfig] = useState("No"); // "No", "Before", "After"
  const [fullSpecsList, setFullSpecsList] = useState([]);
  const [selectedSpecsList, setSelectedSpecsList] = useState([]);
  const [sourceType, setSourceType] = useState(""); // "qa_sections" or "dt_orders"
  const [isConfigured, setIsConfigured] = useState(false); // Whether specs exist in qa_sections

  // --- Measurement Selection State ---
  const [selectedSize, setSelectedSize] = useState("");
  const [orderSizes, setOrderSizes] = useState([]);
  const [selectedKValue, setSelectedKValue] = useState("");
  const [kValuesList, setKValuesList] = useState([]);

  // --- Modal State ---
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isGridOpen, setIsGridOpen] = useState(false);

  // --- Saved Measurements State ---
  const [savedMeasurements, setSavedMeasurements] = useState([]);
  const [editingMeasurementIndex, setEditingMeasurementIndex] = useState(null);
  const [editingMeasurementData, setEditingMeasurementData] = useState(null);

  // ==========================================================================
  // FILTERED SPECS BASED ON K VALUE
  // ==========================================================================
  const filteredFullSpecsList = useMemo(() => {
    if (measConfig === "Before" && selectedKValue) {
      return fullSpecsList.filter(
        (s) => s.kValue === selectedKValue || s.kValue === "NA",
      );
    }
    return fullSpecsList;
  }, [fullSpecsList, selectedKValue, measConfig]);

  const filteredSelectedSpecsList = useMemo(() => {
    if (measConfig === "Before" && selectedKValue) {
      return selectedSpecsList.filter(
        (s) => s.kValue === selectedKValue || s.kValue === "NA",
      );
    }
    return selectedSpecsList;
  }, [selectedSpecsList, selectedKValue, measConfig]);

  // ==========================================================================
  // CHECK SIZE COMPLETION STATUS
  // ==========================================================================
  const getSizeStatus = useMemo(() => {
    const statusMap = {};

    savedMeasurements.forEach((m) => {
      const key = measConfig === "Before" ? `${m.size}_${m.kValue}` : m.size;
      const hasAll = m.allEnabledPcs && m.allEnabledPcs.length > 0;
      const hasCritical =
        m.criticalEnabledPcs && m.criticalEnabledPcs.length > 0;

      statusMap[key] = {
        hasAll,
        hasCritical,
        isComplete: hasAll || hasCritical,
        inspectorDecision: m.inspectorDecision,
        systemDecision: m.systemDecision,
      };
    });

    return statusMap;
  }, [savedMeasurements, measConfig]);

  // Check if size is locked (completed)
  const isSizeLocked = (size) => {
    const key =
      measConfig === "Before" && selectedKValue
        ? `${size}_${selectedKValue}`
        : size;
    const status = getSizeStatus[key];
    return status?.isComplete;
  };

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  // Fetch Report Types on Mount
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/api/qa-sections-templates`)
      .then((res) => {
        if (res.data.success) setReportTypes(res.data.data);
      })
      .catch((err) => console.error(err));
  }, []);

  // Debounced Order Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm.length >= 3) {
        setLoading(true);
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/search-mono?term=${searchTerm}`,
          );
          setOrdersResults(res.data);
        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      } else {
        setOrdersResults([]);
      }
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleSelectOrder = async (moNo) => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/order-details/${moNo}`);
      setSelectedOrder({ ...res.data, moNo });

      // Extract all sizes from order
      const allSizes = new Set();
      if (res.data.colorSizeMap) {
        Object.values(res.data.colorSizeMap).forEach((c) => {
          if (c.sizes) c.sizes.forEach((s) => allSizes.add(s));
        });
      }
      setOrderSizes(Array.from(allSizes));

      // Reset selections
      setSelectedReport(null);
      setSelectedSize("");
      setSelectedKValue("");
      setFullSpecsList([]);
      setSelectedSpecsList([]);
      setSavedMeasurements([]);
      setIsConfigured(false);

      setActiveTab("type");
    } catch (error) {
      alert("Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReport = (report) => {
    setSelectedReport(report);
    setMeasConfig(report.Measurement);

    if (report.Measurement === "No") {
      return alert("No measurements required for this report type.");
    }

    fetchMeasurementSpecs(report.Measurement);
    setActiveTab("specs");
  };

  const fetchMeasurementSpecs = async (type) => {
    setLoading(true);
    const endpoint =
      type === "Before"
        ? `/api/qa-sections/measurement-specs/${selectedOrder.moNo}`
        : `/api/qa-sections/measurement-specs-aw/${selectedOrder.moNo}`;

    try {
      const res = await axios.get(`${API_BASE_URL}${endpoint}`);
      const { source, data } = res.data;

      console.log("Fetched measurement specs:");
      console.log("- Source:", source);
      console.log("- Data keys:", Object.keys(data));

      setSourceType(source);
      setIsConfigured(source === "qa_sections");

      let all = [];
      let selected = [];

      if (type === "Before") {
        all = data.AllBeforeWashSpecs || [];
        selected = data.selectedBeforeWashSpecs || [];

        console.log("Before Wash Specs:");
        console.log("- All specs count:", all.length);
        console.log("- Selected specs count:", selected.length);

        // Extract K values
        const kSet = new Set(
          all.map((s) => s.kValue).filter((k) => k && k !== "NA"),
        );
        setKValuesList(Array.from(kSet).sort());
      } else {
        all = data.AllAfterWashSpecs || [];
        selected = data.selectedAfterWashSpecs || [];
        setKValuesList([]); // No K values for After Wash

        console.log("After Wash Specs:");
        console.log("- All specs count:", all.length);
        console.log("- Selected specs count:", selected.length);
      }

      setFullSpecsList(all);

      // Use selected specs if from qa_sections, otherwise use all
      if (source === "qa_sections" && selected.length > 0) {
        setSelectedSpecsList(selected);
        console.log("Using saved selected specs:", selected.length);
      } else {
        setSelectedSpecsList(all);
        console.log("Using all specs (no saved selection):", all.length);
      }
    } catch (error) {
      console.error("Error fetching specs:", error);
      alert(
        error.response?.data?.message || "Failed to fetch measurement specs.",
      );
      setFullSpecsList([]);
      setSelectedSpecsList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (selectedIds) => {
    const filtered = fullSpecsList.filter((s) => selectedIds.includes(s.id));

    console.log("handleSaveConfig:");
    console.log("- Selected IDs count:", selectedIds.length);
    console.log("- Filtered specs count:", filtered.length);

    setSelectedSpecsList(filtered);
    setIsConfigured(true);

    // Determine endpoint based on measurement type
    const endpoint =
      measConfig === "Before"
        ? `/api/qa-sections/measurement-specs/save`
        : `/api/qa-sections/measurement-specs-aw/save`;

    const payload = {
      moNo: selectedOrder.moNo,
      allSpecs: fullSpecsList,
      selectedSpecs: filtered,
      isSaveAll: false,
    };

    try {
      const response = await axios.post(`${API_BASE_URL}${endpoint}`, payload);
      console.log("Save response:", response.data);
      setSourceType("qa_sections");
    } catch (e) {
      console.error("Failed to save config", e);
      alert("Failed to save configuration to server.");
    }
  };

  const handleSaveMeasurement = (data) => {
    const enhancedData = {
      ...data,
      orderNo: selectedOrder?.moNo,
      reportType: selectedReport?.ReportType,
    };

    if (editingMeasurementIndex !== null) {
      // Update existing measurement
      const updated = [...savedMeasurements];
      updated[editingMeasurementIndex] = enhancedData;
      setSavedMeasurements(updated);
      setEditingMeasurementIndex(null);
      setEditingMeasurementData(null);
    } else {
      // Add new measurement
      setSavedMeasurements([...savedMeasurements, enhancedData]);
      // Reset size selection for next measurement
      setSelectedSize("");
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
    if (
      !window.confirm(
        "Are you sure you want to delete this measurement? This will remove both All and Critical data for this size.",
      )
    ) {
      return;
    }
    const updatedMeasurements = [...savedMeasurements];
    updatedMeasurements.splice(index, 1);
    setSavedMeasurements(updatedMeasurements);
  };

  const handleStartMeasuring = () => {
    setEditingMeasurementIndex(null);
    setEditingMeasurementData(null);
    setIsGridOpen(true);
  };

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const canSelectSizeAndK = isConfigured || sourceType === "qa_sections";
  const needsKValue = measConfig === "Before" && kValuesList.length > 0;
  const canStartMeasuring =
    selectedSize &&
    (!needsKValue || selectedKValue) &&
    !isSizeLocked(selectedSize);

  // ==========================================================================
  // RENDER FUNCTIONS
  // ==========================================================================

  const renderOrderTab = () => (
    <div className="max-w-xl mx-auto mt-4 sm:mt-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
        <Search className="w-5 h-5 text-indigo-500" /> Search Order
      </h3>
      <input
        type="text"
        placeholder="Type MO Number (e.g. 12345)..."
        className="w-full p-3 sm:p-4 border rounded-xl bg-gray-50 dark:bg-gray-900 border-gray-300 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 text-sm sm:text-base"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
      {loading && (
        <div className="mt-4 flex justify-center">
          <Loader2 className="animate-spin text-indigo-500 w-6 h-6" />
        </div>
      )}
      <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
        {ordersResults.map((mo) => (
          <button
            key={mo}
            onClick={() => handleSelectOrder(mo)}
            className="w-full text-left p-3 sm:p-4 hover:bg-indigo-50 dark:hover:bg-gray-700 rounded-xl border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800 transition-all font-bold text-gray-700 dark:text-gray-300"
          >
            {mo}
          </button>
        ))}
        {searchTerm.length >= 3 && ordersResults.length === 0 && !loading && (
          <p className="text-center text-gray-500 py-4">No orders found</p>
        )}
      </div>
    </div>
  );

  const renderTypeTab = () => (
    <div className="max-w-4xl mx-auto mt-4 sm:mt-8 p-4 sm:p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-6">
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">
            Select Report Type
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Order: {selectedOrder?.moNo}
          </p>
        </div>
        <button
          onClick={() => setActiveTab("orders")}
          className="text-indigo-500 hover:underline text-sm self-start sm:self-auto"
        >
          Change Order
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {reportTypes.map((report) => (
          <button
            key={report._id}
            onClick={() => handleSelectReport(report)}
            className={`p-4 border-2 rounded-xl text-left transition-all hover:shadow-md ${
              selectedReport?._id === report._id
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                : "border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700"
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <ClipboardList className="text-gray-400 w-5 h-5" />
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  report.Measurement === "No"
                    ? "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    : report.Measurement === "Before"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      : "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                }`}
              >
                {report.Measurement === "No"
                  ? "No Meas."
                  : `${report.Measurement} Wash`}
              </span>
            </div>
            <h4 className="font-bold text-gray-800 dark:text-white text-sm sm:text-base">
              {report.ReportType}
            </h4>
          </button>
        ))}
      </div>
    </div>
  );

  const renderSpecsTab = () => {
    return (
      <div className="max-w-5xl mx-auto mt-4 sm:mt-8 space-y-4 sm:space-y-6 px-4 sm:px-0">
        {/* Header Card */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                <Ruler className="w-5 h-5 text-indigo-500" />
                Measurement Setup
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Order: {selectedOrder?.moNo} • {measConfig} Wash •{" "}
                {filteredSelectedSpecsList.length} Critical Points
                {selectedKValue && ` • K: ${selectedKValue}`}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setIsConfigModalOpen(true)}
                className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-xl hover:bg-indigo-200 dark:hover:bg-indigo-900/50 flex items-center gap-2 text-sm font-bold transition-colors"
              >
                <Settings className="w-4 h-4" /> Configure Points
              </button>
              <button
                onClick={() => setActiveTab("type")}
                className="px-4 py-2 text-sm text-gray-500 hover:text-indigo-500 transition-colors"
              >
                Back
              </button>
            </div>
          </div>

          {/* Configuration Status */}
          {!isConfigured && sourceType === "dt_orders" && (
            <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                  Configuration Required
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-0.5">
                  Please configure measurement points before selecting size and
                  K value.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Selection Card */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* K Value Selection (Only for Before Wash) - MOVED FIRST */}
            {measConfig === "Before" && kValuesList.length > 0 && (
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                  Select K Value
                  {!canSelectSizeAndK && (
                    <Lock className="w-3 h-3 text-gray-400" />
                  )}
                  {canSelectSizeAndK && (
                    <Unlock className="w-3 h-3 text-green-500" />
                  )}
                </label>
                <select
                  value={selectedKValue}
                  onChange={(e) => {
                    setSelectedKValue(e.target.value);
                    setSelectedSize(""); // Reset size when K changes
                  }}
                  disabled={!canSelectSizeAndK}
                  className={`w-full p-3 sm:p-4 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${
                    !canSelectSizeAndK ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  <option value="">-- Choose K Value --</option>
                  {kValuesList.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Size Selection with Status */}
            <div
              className={
                measConfig !== "Before" || kValuesList.length === 0
                  ? "md:col-span-2"
                  : ""
              }
            >
              <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                Select Size
                {!canSelectSizeAndK && (
                  <Lock className="w-3 h-3 text-gray-400" />
                )}
                {canSelectSizeAndK && (
                  <Unlock className="w-3 h-3 text-green-500" />
                )}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {orderSizes.map((s) => {
                  const key =
                    measConfig === "Before" && selectedKValue
                      ? `${s}_${selectedKValue}`
                      : s;
                  const status = getSizeStatus[key];
                  const isComplete = status?.isComplete;
                  const isLocked = isComplete;
                  const isDisabled =
                    !canSelectSizeAndK ||
                    (needsKValue && !selectedKValue) ||
                    isLocked;

                  return (
                    <button
                      key={s}
                      onClick={() => !isDisabled && setSelectedSize(s)}
                      disabled={isDisabled}
                      className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center justify-center gap-1 ${
                        selectedSize === s
                          ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30"
                          : isLocked
                            ? "border-gray-300 bg-gray-100 dark:bg-gray-700"
                            : isComplete
                              ? "border-green-300 bg-green-50 dark:bg-green-900/20"
                              : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                      } ${
                        isDisabled
                          ? "opacity-60 cursor-not-allowed"
                          : "hover:border-indigo-300 cursor-pointer"
                      }`}
                    >
                      <span
                        className={`font-bold text-sm ${
                          isLocked
                            ? "text-gray-500"
                            : "text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {s}
                      </span>
                      {isLocked && (
                        <div className="flex items-center gap-1">
                          <Lock className="w-3 h-3 text-gray-400" />
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                              status.inspectorDecision === "pass"
                                ? "bg-green-500 text-white"
                                : "bg-red-500 text-white"
                            }`}
                          >
                            {(status.inspectorDecision || "Done").toUpperCase()}
                          </span>
                        </div>
                      )}
                      {!isLocked && selectedSize === s && (
                        <Play className="w-4 h-4 text-indigo-500 fill-current" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Start Measuring Button */}
          <button
            onClick={handleStartMeasuring}
            disabled={!canStartMeasuring || !canSelectSizeAndK}
            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
          >
            <Maximize2 className="w-5 h-5" /> Start Measuring
          </button>

          {/* Validation Messages */}
          {!canSelectSizeAndK && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-3 text-center">
              ⚠️ Please configure measurement points first
            </p>
          )}
          {canSelectSizeAndK && needsKValue && !selectedKValue && (
            <p className="text-xs text-gray-500 mt-3 text-center">
              Select a K value first, then select a size
            </p>
          )}
          {canSelectSizeAndK &&
            (!needsKValue || selectedKValue) &&
            !selectedSize && (
              <p className="text-xs text-gray-500 mt-3 text-center">
                Select a size to continue
              </p>
            )}
          {canSelectSizeAndK && selectedSize && isSizeLocked(selectedSize) && (
            <p className="text-xs text-green-600 dark:text-green-400 mt-3 text-center flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3" />
              This size is already measured and locked
            </p>
          )}
        </div>

        {/* Specs Preview */}
        {filteredSelectedSpecsList.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              Critical Points Preview ({filteredSelectedSpecsList.length})
            </h4>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {filteredSelectedSpecsList.slice(0, 10).map((spec, idx) => (
                <div
                  key={spec.id || idx}
                  className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-800 dark:text-gray-200 break-words whitespace-normal">
                      {spec.MeasurementPointEngName}
                    </p>
                    {spec.MeasurementPointChiName && (
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 break-words whitespace-normal mt-0.5">
                        {spec.MeasurementPointChiName}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    {spec.kValue && spec.kValue !== "NA" && (
                      <span className="text-[10px] bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded border border-purple-100 dark:border-purple-800">
                        K: {spec.kValue}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {filteredSelectedSpecsList.length > 10 && (
                <p className="text-xs text-gray-500 text-center py-2">
                  +{filteredSelectedSpecsList.length - 10} more points...
                </p>
              )}
            </div>
          </div>
        )}

        {/* All Specs Info */}
        <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Total Specs (All Points):
            </span>
            <span className="font-bold text-gray-800 dark:text-gray-200">
              {filteredFullSpecsList.length}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-gray-600 dark:text-gray-400">
              Critical Points:
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {filteredSelectedSpecsList.length}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // ==========================================================================
  // RENDER MEASUREMENTS TAB
  // ==========================================================================
  const renderMeasurementsTab = () => {
    return (
      <div className="max-w-6xl mx-auto mt-4 px-4">
        <YPivotQATemplatesMeasurementResultsTab
          savedMeasurements={savedMeasurements}
          specsData={fullSpecsList}
          selectedSpecsList={selectedSpecsList}
          onEditMeasurement={handleEditMeasurement}
          onDeleteMeasurement={handleDeleteMeasurement}
          activeGroup={null} // No activeGroup in standalone mode - all editable
        />
      </div>
    );
  };

  // ==========================================================================
  // MAIN RENDER
  // ==========================================================================

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-20 animate-fadeIn">
      {/* Navigation Tabs */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-center p-2 gap-1 sm:gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab("orders")}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "orders"
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">1.</span> Orders
          </button>
          <button
            disabled={!selectedOrder}
            onClick={() => setActiveTab("type")}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "type"
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">2.</span> Type
          </button>
          <button
            disabled={!selectedReport || measConfig === "No"}
            onClick={() => setActiveTab("specs")}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "specs"
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
            }`}
          >
            <Ruler className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">3.</span> Specs
          </button>
          <button
            disabled={savedMeasurements.length === 0}
            onClick={() => setActiveTab("measurements")}
            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === "measurements"
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">4.</span> Results
            {savedMeasurements.length > 0 && (
              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">
                {savedMeasurements.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/20 dark:bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-xl flex items-center gap-3">
            <Loader2 className="animate-spin text-indigo-500 w-6 h-6" />
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              Loading...
            </span>
          </div>
        </div>
      )}

      {/* Tab Content */}
      <div className="pb-4">
        {activeTab === "orders" && renderOrderTab()}
        {activeTab === "type" && renderTypeTab()}
        {activeTab === "specs" && renderSpecsTab()}
        {activeTab === "measurements" && renderMeasurementsTab()}
      </div>

      {/* Modals */}
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

      {/* Global Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .safe-area-top {
          padding-top: env(safe-area-inset-top);
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>
  );
};

export default YPivotQATemplatesMeasurementSelection;
