import { useState, useEffect, useRef } from "react";
import { useAuth } from "../../../authentication/AuthContext";
import SearchableSelect from "./SearchableSelect";

const PrintP88Report = () => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [status, setStatus] = useState({ message: "", type: "" });
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadInfo, setDownloadInfo] = useState(null);
  const [selectedPath, setSelectedPath] = useState("");
  const [spaceInfo, setSpaceInfo] = useState(null);
  const [pathValidation, setPathValidation] = useState(null);
  const [downloadMode, setDownloadMode] = useState("range");
  const [startRange, setStartRange] = useState(1);
  const [endRange, setEndRange] = useState(100);
  const [progress, setProgress] = useState(null);
  const [includeDownloaded, setIncludeDownloaded] = useState(false);
  const [recordStats, setRecordStats] = useState(null);

  // New state for date range and factory
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [factoryName, setFactoryName] = useState("");
  const [factories, setFactories] = useState([]);
  const [dateFilteredStats, setDateFilteredStats] = useState(null);
  const [language, setLanguage] = useState("english");
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [currentJobId, setCurrentJobId] = useState(null);
  const abortControllerRef = useRef(null);
  const [poNumber, setPONumber] = useState("");
  const [styleNumber, setStyleNumber] = useState("");
  const [poNumbers, setPONumbers] = useState([]);
  const [styles, setStyles] = useState([]);
  const [downloadResults, setDownloadResults] = useState(null);
  const [showResults, setShowResults] = useState(false);

  // Helper to format seconds into MM:SS
  const formatTime = (seconds) => {
    if (seconds <= 0) return "Finishing...";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Effect to handle the countdown
  useEffect(() => {
    let interval;
    if (loading && timeRemaining !== null) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
        setTimeRemaining((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      setTimerInterval(interval);
    } else {
      clearInterval(timerInterval);
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  // Update useEffect to not require date range
  useEffect(() => {
    fetchCrossFilteredOptions();
    getRecordStats();
  }, [
    includeDownloaded,
    startDate,
    endDate,
    factoryName,
    poNumber,
    styleNumber
  ]);

  useEffect(() => {
    // Remove date requirement - fetch stats whenever any filter changes
    getDateFilteredStats();
  }, [
    startDate,
    endDate,
    factoryName,
    poNumber,
    styleNumber,
    includeDownloaded
  ]);

  // SINGLE fetchCrossFilteredOptions function - works without date requirement
  const fetchCrossFilteredOptions = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

      const params = new URLSearchParams({
        startDate: startDate || "",
        endDate: endDate || "",
        factoryName: factoryName || "",
        poNumber: poNumber || "",
        styleNumber: styleNumber || ""
      });

      const url = `${apiBaseUrl}/api/scraping/cross-filtered-options?${params}`;

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();

        // Only update if the data has actually changed to prevent infinite loops
        setFactories((prev) => {
          const newFactories = data.factories || [];
          if (JSON.stringify(prev) !== JSON.stringify(newFactories)) {
            return newFactories;
          }
          return prev;
        });

        setPONumbers((prev) => {
          const newPONumbers = data.poNumbers || [];
          if (JSON.stringify(prev) !== JSON.stringify(newPONumbers)) {
            return newPONumbers;
          }
          return prev;
        });

        setStyles((prev) => {
          const newStyles = data.styles || [];
          if (JSON.stringify(prev) !== JSON.stringify(newStyles)) {
            return newStyles;
          }
          return prev;
        });
      } else {
        const errorText = await response.text();
        console.error(
          `❌ Failed to fetch filtered options: ${response.status} ${response.statusText}`
        );
        console.error("Error response:", errorText);
      }
    } catch (error) {
      console.error("❌ Error fetching filtered options:", error);
    }
  };

  // SINGLE getDateFilteredStats function - works without date requirement
  const getDateFilteredStats = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const params = new URLSearchParams({
        startDate: startDate || "",
        endDate: endDate || "",
        factoryName: factoryName || "",
        poNumber: poNumber || "",
        styleNumber: styleNumber || "",
        includeDownloaded: includeDownloaded.toString()
      });

      const response = await fetch(
        `${apiBaseUrl}/api/scraping/date-filtered-stats?${params}`
      );
      if (response.ok) {
        const data = await response.json();
        setDateFilteredStats(data);
        if (data.totalRecords > 0) {
          setStartRange(1);
          setEndRange(data.totalRecords);
          checkAvailableSpace(selectedPath, {
            start: 1,
            end: data.totalRecords
          });
        }
        setStatus({ message: "", type: "" });
      } else {
        console.error(
          `Failed to fetch date filtered stats: ${response.status} ${response.statusText}`
        );
        setStatus({
          message: `Failed to fetch stats: ${response.status} ${response.statusText}`,
          type: "error"
        });
      }
    } catch (error) {
      console.error("Error getting date filtered stats:", error);
      setStatus({
        message: `Error getting stats: ${error.message}`,
        type: "error"
      });
    }
  };

  const checkAvailableSpace = async (path = "", rangeOverrides = null) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const endpoint = "check-bulk-space";

      const body = {
        downloadPath: path,
        startRange:
          downloadMode === "range" ? rangeOverrides?.start ?? startRange : null,
        endRange:
          downloadMode === "range" ? rangeOverrides?.end ?? endRange : null,
        downloadAll: downloadMode === "all",
        includeDownloaded: includeDownloaded,
        startDate: startDate || null,
        endDate: endDate || null,
        factoryName: factoryName || null,
        poNumber: poNumber || null,
        styleNumber: styleNumber || null
      };

      const response = await fetch(`${apiBaseUrl}/api/scraping/${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        setSpaceInfo(data);
        return data;
      }
    } catch (error) {
      console.error("Error checking space:", error);
    }
    return null;
  };

  const getRecordStats = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const response = await fetch(
        `${apiBaseUrl}/api/scraping/record-count?includeDownloaded=${includeDownloaded}`
      );

      if (response.ok) {
        const data = await response.json();
        setRecordStats(data);
      } else {
        console.error(
          `Failed to fetch record stats: ${response.status} ${response.statusText}`
        );
        setStatus({
          message: `Failed to load record stats: ${response.status} ${response.statusText}`,
          type: "error"
        });
      }
    } catch (error) {
      console.error("Error getting record stats:", error);
      setStatus({
        message: `Error loading record stats: ${error.message}`,
        type: "error"
      });
    }
  };

  const handlePrintReport = async () => {
    // Remove date range validation since all filters are optional
    setLoading(true);
    setStatus({ message: "", type: "" });
    setProgress(null);

    try {
      setShowDownloadDialog(true);
      await checkAvailableSpace();
    } catch (error) {
      console.error("Error:", error);
      setStatus({ message: error.message, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleCancelDownload = async () => {
    if (!currentJobId) {
      return;
    }

    setIsCancelling(true);
    setStatus({
      message: "Cancelling download and preparing partial results...",
      type: "warning"
    });

    try {
      // Abort the current fetch request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");
      const response = await fetch(
        `${apiBaseUrl}/api/scraping/cancel-bulk-download`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ jobId: currentJobId })
        }
      );

      if (response.ok) {
        // Check if we got a ZIP file (partial results) or JSON response
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          setStatus({
            message: data.message || "Download cancelled",
            type: "info"
          });
        } else {
          // We got a ZIP file with partial results
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.setAttribute(
            "download",
            `P88_Reports_Partial_${new Date().toISOString().split("T")[0]}.zip`
          );
          document.body.appendChild(link);
          link.click();
          link.parentNode.removeChild(link);
          window.URL.revokeObjectURL(url);
          setStatus({
            message:
              "Download cancelled. Partial results downloaded successfully!",
            type: "success"
          });
        }
      } else {
        const errorText = await response.text();
        console.error("Cancel response error:", errorText);
        setStatus({
          message: "Failed to cancel download properly",
          type: "error"
        });
      }
    } catch (error) {
      console.error("Cancel Error:", error);
      setStatus({ message: `Cancel failed: ${error.message}`, type: "error" });
    } finally {
      setIsCancelling(false);
      setLoading(false);
      setTimeRemaining(null);
      setCurrentJobId(null);
      abortControllerRef.current = null;
    }
  };

  const handleConfirmDownload = async () => {
    setLoading(true);
    setStatus({ message: "Initializing background job...", type: "warning" });

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken");

    if (!token || token === "undefined") {
      setLoading(false);
      setStatus({
        message:
          "Authentication error: Please log out and log back in to refresh your session.",
        type: "error"
      });
      console.error(
        "Auth Token missing from localStorage. Available keys:",
        Object.keys(localStorage)
      );
      return;
    }

    const jobId = `job_${Date.now()}`;
    setCurrentJobId(jobId);

    // FIX: Define the filters object explicitly from state
    const filters = {
      startDate,
      endDate,
      factoryName,
      poNumber,
      styleNumber,
      startRange,
      endRange,
      downloadMode,
      downloadAll: downloadMode === "all",
      includeDownloaded,
      language
    };

    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const token =
        localStorage.getItem("authToken") || localStorage.getItem("token");

      // 1. START THE JOB
      const response = await fetch(
        `${apiBaseUrl}/api/scraping/download-bulk-reports-cancellable`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ ...filters, jobId, userId: user?.emp_id })
        }
      );

      if (!response.ok) throw new Error("Could not start download job");

      // 2. POLL FOR STATUS
      const pollInterval = setInterval(async () => {
        try {
          const statusRes = await fetch(
            `${apiBaseUrl}/api/scraping/job-status/${jobId}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );

          if (!statusRes.ok) return;

          const data = await statusRes.json();

          if (data.jobInfo.status === "running") {
            const prog = data.jobInfo.progress;
            if (prog && prog.total > 0) {
              setStatus({
                message: `Processing: ${prog.processed} / ${
                  prog.total
                } reports... (${prog.success} success, ${
                  prog.failed || 0
                } failed)`,
                type: "warning"
              });
            }
          } else if (data.jobInfo.status === "completed") {
            clearInterval(pollInterval);
            setStatus({
              message: "ZIP ready! Starting download...",
              type: "success"
            });

            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";

            // ✅ No token needed in the URL now
            const downloadUrl = `${apiBaseUrl}/api/scraping/job-download/${jobId}`;

            const link = document.createElement("a");
            link.href = downloadUrl;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            fetchDownloadResults(jobId);
            setLoading(false);
          } else if (data.jobInfo.status === "failed") {
            clearInterval(pollInterval);
            setLoading(false);
            setStatus({
              message: `Job Failed: ${data.jobInfo.error || "Unknown Error"}`,
              type: "error"
            });
          }
        } catch (err) {
          console.error("Polling error", err);
        }
      }, 3000);
    } catch (error) {
      setStatus({ message: error.message, type: "error" });
      setLoading(false);
    }
  };

  const fetchDownloadResults = async (jobId) => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const response = await fetch(
        `${apiBaseUrl}/api/scraping/download-results/${jobId}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.results) {
          setDownloadResults(data.results);
          setShowResults(true);
        }
      }
    } catch (error) {
      console.error("Error fetching download results:", error);
    }
  };

  const handleModeChange = async (mode) => {
    setDownloadMode(mode);
    await checkAvailableSpace(selectedPath);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
      {user && (
        <div className="max-w-7xl mx-auto mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm">
          <strong>Current User:</strong> {user.eng_name} ({user.emp_id})
        </div>
      )}
      <div className="max-w-7xl mx-auto">
        {/* Header Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-6">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-full p-2">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  P88 Report Downloader
                </h1>
                <p className="text-blue-100 text-sm">
                  Download inspection reports with flexible filtering
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Filter Criteria */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>Filter Criteria (All Optional)</span>
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                {/* Start Date */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    📅 Start Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* End Date */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    📅 End Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Searchable Supplier */}
                <SearchableSelect
                  value={factoryName}
                  onChange={(newValue) => {
                    setFactoryName(newValue);
                  }}
                  placeholder="Type to search suppliers..."
                  searchEndpoint="search-suppliers"
                  label="🏭 Supplier (Optional)"
                  apiBaseUrl={import.meta.env.VITE_API_BASE_URL || ""}
                  availableOptions={factories}
                />

                {/* Searchable PO Number */}
                <SearchableSelect
                  value={poNumber}
                  onChange={(newValue) => {
                    setPONumber(newValue);
                  }}
                  placeholder="Type to search PO numbers..."
                  searchEndpoint="search-po-numbers"
                  label={`📋 PO Number (${poNumbers.length})`}
                  apiBaseUrl={import.meta.env.VITE_API_BASE_URL || ""}
                  availableOptions={poNumbers}
                />

                {/* Searchable Style */}
                <SearchableSelect
                  value={styleNumber}
                  onChange={(newValue) => {
                    setStyleNumber(newValue);
                  }}
                  placeholder="Type to search styles..."
                  searchEndpoint="search-styles"
                  label={`👔 Style (${styles.length})`}
                  apiBaseUrl={import.meta.env.VITE_API_BASE_URL || ""}
                  availableOptions={styles}
                />

                {/* Language Selection */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    🌐 Report Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="english">🇺🇸 English</option>
                    <option value="chinese">🇨🇳 中文 (Chinese)</option>
                  </select>
                </div>
              </div>

              {/* Clear All Filters Button */}
              <div className="flex justify-end">
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setFactoryName("");
                    setPONumber("");
                    setStyleNumber("");
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  🗑️ Clear All Filters
                </button>
              </div>

              {/* Date Range Validation */}
              {startDate &&
                endDate &&
                new Date(startDate) > new Date(endDate) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-red-700">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="font-medium">
                        Invalid date range: Start date must be before end date
                      </span>
                    </div>
                  </div>
                )}
            </div>

            {/* Show stats even without filters */}
            {dateFilteredStats && (
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                  <svg
                    className="w-5 h-5 text-gray-600 dark:text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span>
                    {startDate ||
                    endDate ||
                    factoryName ||
                    poNumber ||
                    styleNumber
                      ? "Filtered Records"
                      : "All Records"}
                  </span>
                  {(startDate ||
                    endDate ||
                    factoryName ||
                    poNumber ||
                    styleNumber) && (
                    <span className="text-blue-600 text-sm">
                      (
                      {[
                        startDate && endDate
                          ? `${startDate} to ${endDate}`
                          : null,
                        factoryName ? `Supplier: ${factoryName}` : null,
                        poNumber ? `PO: ${poNumber}` : null,
                        styleNumber ? `Style: ${styleNumber}` : null
                      ]
                        .filter(Boolean)
                        .join(", ")}
                      )
                    </span>
                  )}
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    {
                      label: "Total Records",
                      value: dateFilteredStats.totalRecords,
                      color: "blue"
                    },
                    {
                      label: "Downloaded",
                      value: dateFilteredStats.downloadedRecords,
                      color: "green"
                    },
                    {
                      label: "Pending",
                      value: dateFilteredStats.pendingRecords,
                      color: "orange"
                    }
                  ].map((stat) => (
                    <div key={stat.label} className="text-center">
                      <div
                        className={`text-2xl font-bold text-${stat.color}-600 dark:text-${stat.color}-400`}
                      >
                        {stat.value}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show download options even if no specific filters are applied */}
            {dateFilteredStats && dateFilteredStats.totalRecords > 0 && (
              <>
                {/* Download Mode Selection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
                      />
                    </svg>
                    <span>Download Mode</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      {
                        value: "range",
                        icon: "📊",
                        title: "Range of Reports",
                        desc: "Download specific range from filtered results"
                      },
                      {
                        value: "all",
                        icon: "📁",
                        title: "All Filtered Reports",
                        desc: "Download all reports matching criteria"
                      }
                    ].map((mode) => (
                      <label
                        key={mode.value}
                        className={`relative cursor-pointer rounded-xl border-2 p-4 transition-all duration-200 hover:shadow-md ${
                          downloadMode === mode.value
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-md"
                            : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600"
                        }`}
                      >
                        <input
                          type="radio"
                          value={mode.value}
                          checked={downloadMode === mode.value}
                          onChange={(e) => handleModeChange(e.target.value)}
                          className="sr-only"
                        />
                        <div className="text-center">
                          <div className="text-2xl mb-2">{mode.icon}</div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {mode.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {mode.desc}
                          </div>
                        </div>
                        {downloadMode === mode.value && (
                          <div className="absolute top-2 right-2">
                            <div className="bg-blue-500 rounded-full p-1">
                              <svg
                                className="w-3 h-3 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Include Downloaded Option */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeDownloaded}
                      onChange={(e) => {
                        setIncludeDownloaded(e.target.checked);
                        checkAvailableSpace(selectedPath);
                      }}
                      className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        Include already downloaded reports
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Re-download reports that have been previously downloaded
                      </div>
                    </div>
                  </label>
                </div>

                {/* Range Selection */}
                {downloadMode === "range" && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                      <svg
                        className="w-5 h-5 text-blue-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                        />
                      </svg>
                      <span>
                        Select Range (from {dateFilteredStats.totalRecords}{" "}
                        filtered records)
                      </span>
                    </h4>
                    <div className="flex items-center space-x-4">
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          From
                        </label>
                        <input
                          type="number"
                          value={startRange}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setStartRange(val);
                            checkAvailableSpace(selectedPath, { start: val });
                          }}
                          min="1"
                          max={dateFilteredStats.totalRecords}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Start"
                        />
                      </div>
                      <div className="flex-shrink-0 pt-8">
                        <svg
                          className="w-5 h-5 text-gray-400 dark:text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          To
                        </label>
                        <input
                          type="number"
                          value={endRange}
                          onChange={(e) => {
                            let val = parseInt(e.target.value) || 1;
                            if (val > dateFilteredStats.totalRecords) {
                              val = dateFilteredStats.totalRecords;
                            }
                            setEndRange(val);
                            checkAvailableSpace(selectedPath, { end: val });
                          }}
                          min="1"
                          max={dateFilteredStats.totalRecords}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="End"
                        />
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {Math.max(
                          0,
                          Math.min(endRange, dateFilteredStats.totalRecords) -
                            startRange +
                            1
                        )}{" "}
                        reports selected
                      </span>
                    </div>
                  </div>
                )}

                {/* Loading Progress */}
                {loading && timeRemaining !== null && (
                  <div className="mb-6 bg-blue-600 rounded-xl p-6 text-white shadow-lg animate-pulse">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span className="font-bold text-lg">
                          Processing Bulk Download
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs uppercase opacity-80">
                          Estimated Time Remaining
                        </div>
                        <div className="text-2xl font-mono font-bold">
                          {formatTime(timeRemaining)}
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-blue-400/30 rounded-full h-2">
                      <div
                        className="bg-white h-2 rounded-full transition-all duration-1000"
                        style={{
                          width: `${Math.min(
                            100,
                            (elapsedTime / (elapsedTime + timeRemaining)) * 100
                          )}%`
                        }}
                      ></div>
                    </div>
                    <div className="mt-2 text-xs text-center italic opacity-90">
                      Please do not close this tab. Generating{" "}
                      {spaceInfo?.recordCount} high-quality PDF reports...
                    </div>
                    {!isCancelling && (
                      <div className="mt-4 flex justify-center">
                        <button
                          onClick={handleCancelDownload}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                          <span>Cancel & Download Partial</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Download Button */}
                <button
                  onClick={handlePrintReport}
                  disabled={loading}
                  className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-200 transform ${
                    loading
                      ? "bg-gray-400 dark:bg-gray-600 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-3">
                      <span>Remaining: {formatTime(timeRemaining)}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center space-x-2">
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <span>
                        {downloadMode === "range"
                          ? `Download Reports ${startRange}-${endRange}`
                          : "Download All Filtered Reports"}
                      </span>
                    </div>
                  )}
                </button>
              </>
            )}

            {/* No Records Message */}
            {dateFilteredStats && dateFilteredStats.totalRecords === 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <div className="text-yellow-600 mb-2">
                  <svg
                    className="w-12 h-12 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No Records Found
                </h3>
                <p className="text-gray-600 mb-4">
                  No inspection reports match your current filter criteria. Try
                  adjusting your filters or clearing them to see all available
                  reports.
                </p>
                <button
                  onClick={() => {
                    setStartDate("");
                    setEndDate("");
                    setFactoryName("");
                    setPONumber("");
                    setStyleNumber("");
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Status Messages */}
        {status.message && (
          <div
            className={`mb-6 rounded-xl border-l-4 p-6 shadow-lg ${
              status.type === "success"
                ? "bg-green-50 border-green-400 text-green-800 dark:bg-green-900/30 dark:border-green-600 dark:text-green-200"
                : status.type === "warning"
                ? "bg-yellow-50 border-yellow-400 text-yellow-800 dark:bg-yellow-900/30 dark:border-yellow-600 dark:text-yellow-200"
                : "bg-red-50 border-red-400 text-red-800 dark:bg-red-900/30 dark:border-red-600 dark:text-red-200"
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {status.type === "success" && (
                  <svg
                    className="w-6 h-6 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                {status.type === "warning" && (
                  <svg
                    className="w-6 h-6 text-yellow-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                )}
                {status.type === "error" && (
                  <svg
                    className="w-6 h-6 text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{status.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Download Dialog Modal */}
        {showDownloadDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 rounded-t-2xl">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span>Download Configuration</span>
                </h3>
              </div>

              <div className="p-6 space-y-6">
                {/* Download Summary */}
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                    <span>Download Summary</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">
                        Date Range:
                      </span>
                      <div className="text-blue-600 font-medium">
                        {startDate && endDate
                          ? `${startDate} to ${endDate}`
                          : "All Dates"}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Supplier:
                      </span>
                      <div className="text-blue-600 font-medium">
                        {factoryName || "All Suppliers"}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        PO Number:
                      </span>
                      <div className="text-blue-600 font-medium">
                        {poNumber || "All PO Numbers"}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Style:</span>
                      <div className="text-blue-600 font-medium">
                        {styleNumber || "All Styles"}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">
                        Language:
                      </span>
                      <div className="text-blue-600 font-medium">
                        {language === "chinese"
                          ? "🇨🇳 中文 (Chinese)"
                          : "🇺🇸 English"}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-700">Mode:</span>
                      <div className="text-blue-600 font-medium">
                        {downloadMode === "range"
                          ? `Range (${startRange}-${endRange})`
                          : "All Filtered Reports"}
                      </div>
                    </div>
                    {spaceInfo?.recordCount && (
                      <div className="col-span-2">
                        <span className="font-medium text-gray-700">
                          Reports to Download:
                        </span>
                        <div className="text-blue-600 font-medium">
                          {spaceInfo.recordCount}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Storage Information */}
                {spaceInfo && (
                  <div
                    className={`rounded-xl p-4 border ${
                      spaceInfo.hasEnoughSpace
                        ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
                        : "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800"
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        {spaceInfo.hasEnoughSpace ? (
                          <svg
                            className="w-6 h-6 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                        ) : (
                          <svg
                            className="w-6 h-6 text-yellow-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                            />
                          </svg>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                          Storage Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              Available Space:
                            </span>
                            <div className="text-gray-900 dark:text-white">
                              {spaceInfo.availableSpace}
                            </div>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              Estimated Download:
                            </span>
                            <div className="text-gray-900 dark:text-white">
                              {spaceInfo.estimatedDownloadSize}
                            </div>
                          </div>
                        </div>
                        <div
                          className={`text-sm mt-3 p-2 rounded ${
                            spaceInfo.hasEnoughSpace
                              ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300"
                          }`}
                        >
                          {spaceInfo.recommendation}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex space-x-4 pt-4">
                  <button
                    onClick={() => {
                      setShowDownloadDialog(false);
                      setSelectedPath("");
                      setSpaceInfo(null);
                      setPathValidation(null);
                    }}
                    className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium text-gray-700 dark:text-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmDownload}
                    disabled={
                      loading || (pathValidation && !pathValidation.isValid)
                    }
                    className={`flex-1 py-3 px-4 rounded-lg transition-all duration-200 font-medium ${
                      loading || (pathValidation && !pathValidation.isValid)
                        ? "bg-gray-400 cursor-not-allowed text-white"
                        : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl"
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Downloading...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <span>Start Download</span>
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Download Results Modal */}
        {showResults && downloadResults && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full shadow-2xl">
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 rounded-t-2xl">
                <h3 className="text-xl font-bold text-white flex items-center space-x-2">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <span>Download Results</span>
                </h3>
              </div>

              <div className="p-6 space-y-6">
                {/* Results Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {downloadResults.total || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Total Processed
                    </div>
                  </div>

                  <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {downloadResults.successful || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Successful
                    </div>
                  </div>

                  <div className="text-center p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {downloadResults.failed || 0}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Failed
                    </div>
                  </div>
                </div>

                {/* Success Rate */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Success Rate
                    </span>
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {downloadResults.total > 0
                        ? Math.round(
                            (downloadResults.successful /
                              downloadResults.total) *
                              100
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${
                          downloadResults.total > 0
                            ? (downloadResults.successful /
                                downloadResults.total) *
                              100
                            : 0
                        }%`
                      }}
                    ></div>
                  </div>
                </div>

                {/* Additional Details */}
                {downloadResults.duration && (
                  <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    <span>Completed in {downloadResults.duration}</span>
                  </div>
                )}

                {/* Failed Reports List (if any) */}
                {downloadResults.failed > 0 &&
                  downloadResults.failedReports && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                        Failed Reports ({downloadResults.failed})
                      </h4>
                      <div className="max-h-32 overflow-y-auto text-sm text-red-700 dark:text-red-300">
                        {downloadResults.failedReports
                          .slice(0, 5)
                          .map((report, index) => (
                            <div key={index} className="mb-1">
                              • {report.inspectionNumber || report.id} -{" "}
                              {report.error || "Unknown error"}
                            </div>
                          ))}
                        {downloadResults.failedReports.length > 5 && (
                          <div className="text-xs text-red-600 dark:text-red-400 mt-2">
                            ... and {downloadResults.failedReports.length - 5}{" "}
                            more
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Close Button */}
                <div className="flex justify-center pt-4">
                  <button
                    onClick={() => {
                      setShowResults(false);
                      setDownloadResults(null);
                    }}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintP88Report;
