import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  Search,
  Save,
  CheckSquare,
  Square,
  Loader,
  AlertTriangle,
  Eye,
  CheckCircle,
  Layers,
  X,
  Wrench,
  RefreshCw,
  Ruler,
} from "lucide-react";
import axios from "axios";
import { debounce } from "lodash";
import { API_BASE_URL } from "../../../../../config";

const MeasurementSpecsShared = ({
  title,
  subtitle,
  apiEndpoints,
  dataKeys,
  colorTheme = "indigo", // "indigo" or "purple"
  enableApplyToAW = false,
}) => {
  const [moNoSearch, setMoNoSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // --- Autocomplete State ---
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchContainerRef = useRef(null);

  // Data State
  const [allSpecs, setAllSpecs] = useState([]);
  const [selectedPointNames, setSelectedPointNames] = useState([]);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Fix Tolerance State
  const [isFixing, setIsFixing] = useState(false);
  const [showFixModal, setShowFixModal] = useState(false);
  const [previewIssues, setPreviewIssues] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Sync State to AW
  const [isApplyingAW, setIsApplyingAW] = useState(false);

  // --- Dynamic Styles based on Theme ---
  const themeClasses = {
    text:
      colorTheme === "purple"
        ? "text-purple-600 dark:text-purple-400"
        : "text-indigo-600 dark:text-indigo-400",
    bg:
      colorTheme === "purple"
        ? "bg-purple-600 hover:bg-purple-700"
        : "bg-indigo-600 hover:bg-indigo-700",
    bgLight:
      colorTheme === "purple"
        ? "bg-purple-50 dark:bg-purple-900/30"
        : "bg-indigo-50 dark:bg-indigo-900/30",
    border: colorTheme === "purple" ? "border-purple-500" : "border-indigo-500",
    ring:
      colorTheme === "purple"
        ? "focus:ring-purple-500"
        : "focus:ring-indigo-500",
    hoverText:
      colorTheme === "purple"
        ? "hover:text-purple-600"
        : "hover:text-indigo-600",
    hoverBorder:
      colorTheme === "purple"
        ? "hover:border-purple-500"
        : "hover:border-indigo-500",
  };

  // --- Autocomplete Logic ---
  const fetchMoSuggestions = useCallback(
    debounce(async (term) => {
      if (!term || term.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/search-mono?term=${term}`,
        );
        setSuggestions(response.data || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    }, 300),
    [],
  );

  useEffect(() => {
    if (moNoSearch && showSuggestions) {
      fetchMoSuggestions(moNoSearch);
    }
  }, [moNoSearch, fetchMoSuggestions, showSuggestions]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSuggestionClick = (mo) => {
    setMoNoSearch(mo);
    setShowSuggestions(false);
    handleSearch(null, mo);
  };

  const handleInputChange = (e) => {
    setMoNoSearch(e.target.value);
    setShowSuggestions(true);
  };

  const clearSearch = () => {
    setMoNoSearch("");
    setSuggestions([]);
    setAllSpecs([]);
    setSelectedPointNames([]);
    setError("");
    setSuccessMsg("");
  };

  // --- Main Data Fetch Logic ---
  const handleSearch = async (e, overrideMo = null) => {
    if (e) e.preventDefault();

    const term = overrideMo || moNoSearch;
    if (!term.trim()) return;

    setLoading(true);
    setError("");
    setSuccessMsg("");
    setAllSpecs([]);
    setSelectedPointNames([]);
    setIsPreviewMode(false);
    setShowSuggestions(false);

    try {
      const response = await axios.get(
        `${API_BASE_URL}${apiEndpoints.get}/${term.trim()}`,
      );

      const data = response.data.data;
      // Dynamic Access based on props
      const specsList = data[dataKeys.allSpecs] || [];
      setAllSpecs(specsList);

      if (
        response.data.source === "qa_sections" &&
        data[dataKeys.selectedSpecs]
      ) {
        const savedNames = [
          ...new Set(
            data[dataKeys.selectedSpecs].map(
              (s) => s.MeasurementPointEngName || s.MeasurementPointChiName,
            ),
          ),
        ];
        setSelectedPointNames(savedNames);
      }
    } catch (err) {
      console.error(err);
      const errMsg =
        err.response?.data?.message || "Failed to fetch measurement specs.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // --- Distinct Points Logic (Sorted by SEQ + Fallback Name) ---
  const distinctPoints = useMemo(() => {
    const uniqueMap = new Map();
    // 1. Sort by seq
    const sortedSpecs = [...allSpecs].sort(
      (a, b) => (a.seq || 0) - (b.seq || 0),
    );

    sortedSpecs.forEach((spec) => {
      // 2. Fallback Logic: English -> Chinese
      const displayName =
        spec.MeasurementPointEngName || spec.MeasurementPointChiName;

      if (displayName && !uniqueMap.has(displayName)) {
        uniqueMap.set(displayName, spec);
      }
    });
    return Array.from(uniqueMap.values());
  }, [allSpecs]);

  // --- Selection Handlers ---
  const togglePointSelection = (pointName) => {
    setSelectedPointNames((prev) =>
      prev.includes(pointName)
        ? prev.filter((n) => n !== pointName)
        : [...prev, pointName],
    );
  };

  const handleSelectAll = () => {
    if (selectedPointNames.length === distinctPoints.length) {
      setSelectedPointNames([]);
    } else {
      setSelectedPointNames(
        distinctPoints.map(
          (p) => p.MeasurementPointEngName || p.MeasurementPointChiName,
        ),
      );
    }
  };

  // --- Save Handler ---
  const handleSave = async () => {
    setIsSaving(true);
    setSuccessMsg("");
    setError("");

    try {
      // Filter based on fallback name
      const selectedSpecsObjects = allSpecs.filter((spec) =>
        selectedPointNames.includes(
          spec.MeasurementPointEngName || spec.MeasurementPointChiName,
        ),
      );

      const payload = {
        moNo: moNoSearch.trim(),
        allSpecs: allSpecs,
        selectedSpecs: selectedSpecsObjects,
        isSaveAll: selectedPointNames.length === distinctPoints.length,
      };

      const response = await axios.post(
        `${API_BASE_URL}${apiEndpoints.save}`,
        payload,
      );

      setSuccessMsg(
        `Configuration saved successfully! (Updated: ${new Date(
          response.data.updatedAt,
        ).toLocaleTimeString()})`,
      );
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to save.");
    } finally {
      setIsSaving(false);
    }
  };

  // --- Sync Handler ---
  const handleApplyToAW = async () => {
    if (!moNoSearch || selectedPointNames.length === 0) return;

    setIsApplyingAW(true);
    setError("");
    setSuccessMsg("");

    try {
      const payload = {
        moNo: moNoSearch.trim(),
        selectedPointNames: selectedPointNames, // Send the list of names
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections/measurement-specs/apply-to-aw`,
        payload,
      );

      setSuccessMsg(response.data.message);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.error || "Failed to apply selection to After Wash.",
      );
    } finally {
      setIsApplyingAW(false);
    }
  };

  // --- Fix Tolerance Functions (Shared Endpoints) ---
  const handlePreviewIssues = async () => {
    setIsLoadingPreview(true);
    setShowFixModal(true);
    setPreviewIssues(null);

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections/measurement-specs/preview-tolerance-issues`,
      );

      if (response.data) {
        setPreviewIssues(response.data);
      } else {
        setPreviewIssues({
          totalDocumentsWithIssues: 0,
          totalProblems: 0,
          issues: [],
        });
      }
    } catch (err) {
      console.error("Error previewing issues:", err);
      if (err.response?.status === 404) {
        setPreviewIssues({
          totalDocumentsWithIssues: 0,
          totalProblems: 0,
          issues: [],
        });
      } else {
        setPreviewIssues({
          error:
            err.response?.data?.message ||
            err.message ||
            "Failed to load preview",
          totalDocumentsWithIssues: 0,
          totalProblems: 0,
          issues: [],
        });
      }
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleFixAllTolerances = async () => {
    setIsFixing(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections/measurement-specs/fix-tolerances`,
      );

      const fixedCount = response.data?.summary?.totalTolerancesFixed || 0;
      const docsUpdated = response.data?.summary?.totalDocumentsUpdated || 0;

      if (fixedCount > 0) {
        setSuccessMsg(
          `✅ Fixed ${fixedCount} tolerance values across ${docsUpdated} documents!`,
        );
      } else {
        setSuccessMsg(
          `✅ Checked all documents. No tolerance issues found or all issues already fixed.`,
        );
      }

      setShowFixModal(false);
      setPreviewIssues(null);
      if (moNoSearch) {
        handleSearch(null, moNoSearch);
      }
      setTimeout(() => setSuccessMsg(""), 5000);
    } catch (err) {
      console.error("Fix all error:", err);
      setError(err.response?.data?.error || "Failed to fix tolerances.");
    } finally {
      setIsFixing(false);
    }
  };

  const handleFixCurrentOrder = async () => {
    if (!moNoSearch.trim()) {
      setError("Please search for an order first.");
      return;
    }

    setIsFixing(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections/measurement-specs/fix-tolerances/${moNoSearch.trim()}`,
      );

      setSuccessMsg(
        response.data?.message || "Tolerance values checked and fixed!",
      );
      setShowFixModal(false);
      setPreviewIssues(null);
      handleSearch(null, moNoSearch);
      setTimeout(() => setSuccessMsg(""), 4000);
    } catch (err) {
      console.error("Fix order error:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "Failed to fix tolerances.",
      );
    } finally {
      setIsFixing(false);
    }
  };

  // --- Group Data for Preview ---
  const previewDataByKValue = useMemo(() => {
    if (!isPreviewMode) return {};

    const selectedItems = allSpecs.filter((spec) =>
      selectedPointNames.includes(
        spec.MeasurementPointEngName || spec.MeasurementPointChiName,
      ),
    );

    const grouped = {};
    selectedItems.forEach((item) => {
      const k = item.kValue || "NA";
      if (!grouped[k]) grouped[k] = [];
      grouped[k].push(item);
    });

    const sortedKeys = Object.keys(grouped).sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
    );

    const result = {};
    sortedKeys.forEach((key) => (result[key] = grouped[key]));
    return result;
  }, [isPreviewMode, allSpecs, selectedPointNames]);

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-colors duration-300 min-h-[600px]">
      {/* --- Header --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 pb-6">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${themeClasses.bgLight}`}>
            <Ruler className={`w-6 h-6 ${themeClasses.text}`} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              {title}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-80" ref={searchContainerRef}>
            <form onSubmit={(e) => handleSearch(e)} className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search MO No..."
                  value={moNoSearch}
                  onChange={handleInputChange}
                  onFocus={() => setShowSuggestions(true)}
                  className={`w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-gray-100 focus:ring-2 ${themeClasses.ring} outline-none transition-colors`}
                  autoComplete="off"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                {moNoSearch && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={loading || !moNoSearch}
                className={`px-4 py-2.5 ${themeClasses.bg} text-white font-semibold rounded-lg transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loading ? <Loader className="w-5 h-5 animate-spin" /> : "Go"}
              </button>
            </form>
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto scrollbar-thin">
                {suggestions.map((mo, index) => (
                  <li
                    key={index}
                    onClick={() => handleSuggestionClick(mo)}
                    className={`px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:${themeClasses.bgLight} cursor-pointer transition-colors border-b border-gray-100 dark:border-gray-600/50 last:border-0`}
                  >
                    {mo}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <button
            onClick={handlePreviewIssues}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors shadow-md flex items-center gap-2"
            title="Fix Tolerance Values"
          >
            <Wrench className="w-4 h-4" />
            <span className="hidden sm:inline">Fix TOL</span>
          </button>
        </div>
      </div>

      {/* --- Messages --- */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-700 dark:text-red-300 animate-fadeIn">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}
      {successMsg && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3 text-green-700 dark:text-green-300 animate-fadeIn">
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* --- Fix Tolerance Modal --- */}
      {showFixModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-amber-50 dark:bg-amber-900/20">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <Wrench className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                    Fix Tolerance Values
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Preview and fix tolerance formatting issues
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowFixModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[50vh]">
              {isLoadingPreview ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader className="w-8 h-8 animate-spin text-amber-500 mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Scanning for tolerance issues...
                  </p>
                </div>
              ) : !previewIssues ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <p className="text-gray-500 dark:text-gray-400">
                    Loading preview data...
                  </p>
                </div>
              ) : previewIssues.error ? (
                <div className="space-y-4">
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                    <p className="text-amber-600 dark:text-amber-400 text-sm">
                      Note: Preview might be incomplete, but you can still run
                      the fix operation.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {previewIssues.totalDocumentsWithIssues || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Documents with issues
                      </p>
                    </div>
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {previewIssues.totalProblems || 0}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total problems found
                      </p>
                    </div>
                  </div>
                  {previewIssues.issues && previewIssues.issues.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Issues by Order (showing first 10):
                      </p>
                      <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                        {previewIssues.issues.slice(0, 10).map((issue, idx) => (
                          <div
                            key={idx}
                            className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                          >
                            <p className="font-medium text-gray-800 dark:text-gray-200">
                              {issue.Order_No}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {issue.problems?.length || 0} issue(s) found
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                      <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                        No tolerance issues found!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap gap-3 justify-end bg-gray-50 dark:bg-gray-800/50">
              {moNoSearch && (
                <button
                  onClick={handleFixCurrentOrder}
                  disabled={isFixing}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isFixing ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Fix Current Order ({moNoSearch})
                </button>
              )}
              <button
                onClick={handleFixAllTolerances}
                disabled={isFixing}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isFixing ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Wrench className="w-4 h-4" />
                )}
                Fix All Documents
              </button>
              <button
                onClick={() => {
                  setShowFixModal(false);
                  setPreviewIssues(null);
                }}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-semibold rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Content Area --- */}
      {allSpecs.length > 0 && (
        <div className="space-y-6 animate-fadeIn">
          {!isPreviewMode && (
            <>
              <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                  Available Points ({distinctPoints.length})
                </span>
                <div className="flex items-center gap-4">
                  <span className={`text-sm ${themeClasses.text} font-medium`}>
                    {selectedPointNames.length} Selected
                  </span>
                  <button
                    onClick={handleSelectAll}
                    className={`flex items-center gap-1.5 text-sm font-bold text-gray-600 dark:text-gray-300 ${themeClasses.hoverText} transition-colors`}
                  >
                    {selectedPointNames.length === distinctPoints.length ? (
                      <>
                        <CheckSquare className="w-4 h-4" /> Deselect All
                      </>
                    ) : (
                      <>
                        <Square className="w-4 h-4" /> Select All
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {distinctPoints.map((point, idx) => {
                  const displayName =
                    point.MeasurementPointEngName ||
                    point.MeasurementPointChiName;
                  const isSelected = selectedPointNames.includes(displayName);
                  return (
                    <div
                      key={idx}
                      onClick={() => togglePointSelection(displayName)}
                      className={`
                        flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all duration-200 group
                        ${
                          isSelected
                            ? `${themeClasses.bgLight} ${themeClasses.border} shadow-sm`
                            : `bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 ${themeClasses.hoverBorder}`
                        }
                      `}
                    >
                      <div className="flex-1 pr-2">
                        <p
                          className={`text-sm font-semibold ${
                            isSelected
                              ? themeClasses.text
                              : "text-gray-700 dark:text-gray-200"
                          }`}
                        >
                          {displayName}
                        </p>
                        {/* Only show Chinese if English exists and is used as primary, otherwise displayName IS Chinese */}
                        {point.MeasurementPointEngName &&
                          point.MeasurementPointChiName && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-chinese">
                              {point.MeasurementPointChiName}
                            </p>
                          )}
                      </div>
                      {isSelected ? (
                        <CheckSquare
                          className={`w-5 h-5 ${themeClasses.text} flex-shrink-0`}
                        />
                      ) : (
                        <Square className="w-5 h-5 text-gray-300 dark:text-gray-500 group-hover:text-gray-400 flex-shrink-0 transition-colors" />
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {isPreviewMode && (
            <div className="space-y-8 animate-fadeIn">
              {Object.entries(previewDataByKValue).map(([kValue, rows]) => (
                <div
                  key={kValue}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm"
                >
                  <div
                    className={`px-4 py-3 ${themeClasses.bgLight} border-b border-gray-100 dark:border-gray-600 flex items-center gap-2`}
                  >
                    <Layers className={`w-4 h-4 ${themeClasses.text}`} />
                    <h3 className="font-bold text-gray-800 dark:text-gray-100">
                      Sheet: {kValue}
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-4 py-3 border-r border-gray-100 dark:border-gray-700">
                            Point
                          </th>
                          <th className="px-4 py-3 text-center border-r border-gray-100 dark:border-gray-700">
                            Tol (-)
                          </th>
                          <th className="px-4 py-3 text-center border-r border-gray-100 dark:border-gray-700">
                            Tol (+)
                          </th>
                          {rows[0]?.Specs.map((spec) => (
                            <th
                              key={spec.size}
                              className="px-4 py-3 text-center min-w-[60px] bg-gray-100/50 dark:bg-gray-700/50 border-r border-gray-200 dark:border-gray-700"
                            >
                              {spec.size}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, rIdx) => (
                          <tr
                            key={rIdx}
                            className={`bg-white dark:bg-gray-800 border-b dark:border-gray-700 hover:${themeClasses.bgLight} transition-colors`}
                          >
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100 border-r border-gray-100 dark:border-gray-700">
                              {row.MeasurementPointEngName ||
                                row.MeasurementPointChiName}
                            </td>
                            <td className="px-4 py-3 text-center text-red-600 dark:text-red-400 font-bold border-r border-gray-100 dark:border-gray-700">
                              {row.TolMinus?.fraction || "-"}
                            </td>
                            <td className="px-4 py-3 text-center text-green-600 dark:text-green-400 font-bold border-r border-gray-100 dark:border-gray-700">
                              {row.TolPlus?.fraction || "+"}
                            </td>
                            {row.Specs.map((spec, sIdx) => (
                              <td
                                key={sIdx}
                                className="px-4 py-3 text-center text-gray-700 dark:text-gray-300 border-r border-gray-100 dark:border-gray-700"
                              >
                                {spec.fraction}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row justify-end items-center gap-3 sticky bottom-0 bg-white dark:bg-gray-800 py-4 z-10">
            <button
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              disabled={selectedPointNames.length === 0}
              className={`w-full sm:w-auto px-5 py-2.5 ${themeClasses.text} ${themeClasses.bgLight} hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2`}
            >
              <Eye className="w-4 h-4" />
              {isPreviewMode
                ? "Back to Selection"
                : `Preview Selected (${selectedPointNames.length})`}
            </button>
            {/* --- NEW BUTTON: APPLY AW --- */}
            {enableApplyToAW && (
              <button
                onClick={handleApplyToAW}
                disabled={
                  selectedPointNames.length === 0 || isApplyingAW || isSaving
                }
                className="w-full sm:w-auto px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform active:scale-95"
              >
                {isApplyingAW ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                APPLY AW
              </button>
            )}

            <button
              onClick={handleSave}
              disabled={selectedPointNames.length === 0 || isSaving}
              className="w-full sm:w-auto px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              {isSaving ? (
                <Loader className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Configuration
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeasurementSpecsShared;
