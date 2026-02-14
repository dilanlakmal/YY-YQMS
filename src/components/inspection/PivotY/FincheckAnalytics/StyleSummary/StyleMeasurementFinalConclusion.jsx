import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Loader2,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Inbox,
  TrendingUp,
} from "lucide-react";
import { API_BASE_URL } from "../../../../../../config";

const StyleMeasurementFinalConclusion = ({ styleNo }) => {
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [data, setData] = useState(null);
  const [selectedReportType, setSelectedReportType] = useState("All");
  const [selectedStage, setSelectedStage] = useState("All");

  // Store report types and size list separately so they persist across filter changes
  const [availableReportTypes, setAvailableReportTypes] = useState([]);
  const [availableSizeList, setAvailableSizeList] = useState([]);

  // Reset when styleNo changes
  useEffect(() => {
    if (styleNo) {
      setSelectedReportType("All");
      setSelectedStage("All");
      setInitialLoaded(false);
      setData(null);
      setAvailableReportTypes([]);
      setAvailableSizeList([]);
    }
  }, [styleNo]);

  useEffect(() => {
    if (!styleNo) return;
    fetchData();
  }, [styleNo, selectedReportType, selectedStage]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-analytics/style-measurement-conclusion`,
        {
          params: {
            styleNo,
            reportType: selectedReportType,
            stage: selectedStage,
          },
        },
      );
      if (res.data.success) {
        setData(res.data.data);

        // On first load, capture the report types and size list
        if (!initialLoaded) {
          setAvailableReportTypes(res.data.data.reportTypes || []);
          setAvailableSizeList(res.data.data.sizeList || []);
          setInitialLoaded(true);
        }
      }
    } catch (err) {
      console.error("Failed to load measurement conclusion:", err);
      if (!initialLoaded) {
        setInitialLoaded(true);
      }
    } finally {
      setLoading(false);
    }
  };

  // Helper function to format Tol- value (always negative except 0)
  const formatTolMinus = (tolValue) => {
    if (!tolValue || tolValue === "-" || tolValue === "0" || tolValue === 0) {
      return tolValue;
    }

    let strVal = String(tolValue).trim();

    // If already negative, return as is
    if (strVal.startsWith("-")) {
      return strVal;
    }

    // If it's a positive number or fraction, make it negative
    // Check if it's a number
    const numVal = parseFloat(strVal.replace(/[^\d.-]/g, ""));
    if (!isNaN(numVal) && numVal !== 0) {
      // Add negative sign
      return `-${strVal}`;
    }

    // For fractions like "1/4", make it "-1/4"
    if (strVal.includes("/")) {
      return `-${strVal}`;
    }

    return strVal;
  };

  // Frontend deduplication and processing
  const processedSpecs = useMemo(() => {
    if (!data?.specs || data.specs.length === 0) return [];

    // Deduplicate specs by measurement point name
    const specsByName = new Map();

    data.specs.forEach((spec) => {
      const name = (spec.measurementPointName || "").trim();
      if (!name) return;

      if (!specsByName.has(name)) {
        specsByName.set(name, {
          id: spec.id,
          measurementPointName: name,
          tolMinus: spec.tolMinus,
          tolPlus: spec.tolPlus,
          isCritical: spec.isCritical || false,
          sizeData: {},
          allSizeTotals: { points: 0, pass: 0, fail: 0, negTol: 0, posTol: 0 },
          hasMeasurements: false,
        });
      }

      const existing = specsByName.get(name);

      // Update critical status if any spec with this name is critical
      if (spec.isCritical) {
        existing.isCritical = true;
      }

      // Merge sizeData for all sizes
      Object.keys(spec.sizeData || {}).forEach((size) => {
        const newData = spec.sizeData[size];

        if (!existing.sizeData[size]) {
          existing.sizeData[size] = {
            points: 0,
            pass: 0,
            fail: 0,
            negTol: 0,
            posTol: 0,
          };
        }

        existing.sizeData[size].points += newData.points || 0;
        existing.sizeData[size].pass += newData.pass || 0;
        existing.sizeData[size].fail += newData.fail || 0;
        existing.sizeData[size].negTol += newData.negTol || 0;
        existing.sizeData[size].posTol += newData.posTol || 0;

        // Update "All" totals
        existing.allSizeTotals.points += newData.points || 0;
        existing.allSizeTotals.pass += newData.pass || 0;
        existing.allSizeTotals.fail += newData.fail || 0;
        existing.allSizeTotals.negTol += newData.negTol || 0;
        existing.allSizeTotals.posTol += newData.posTol || 0;

        if (existing.sizeData[size].points > 0) {
          existing.hasMeasurements = true;
        }
      });
    });

    return Array.from(specsByName.values())
      .filter((s) => s.hasMeasurements)
      .sort((a, b) =>
        a.measurementPointName.localeCompare(b.measurementPointName),
      );
  }, [data?.specs]);

  // Filter size list to only include sizes with at least 1 point
  const filteredSizeList = useMemo(() => {
    const sizeList =
      availableSizeList.length > 0 ? availableSizeList : data?.sizeList || [];

    return sizeList.filter((size) => {
      // Check if any spec has points for this size
      return processedSpecs.some((spec) => spec.sizeData[size]?.points > 0);
    });
  }, [processedSpecs, availableSizeList, data?.sizeList]);

  // Recalculate size totals based on processed specs
  const recalculatedSizeTotals = useMemo(() => {
    const totals = {};

    // "All" column totals
    totals["__ALL__"] = { points: 0, pass: 0, fail: 0, negTol: 0, posTol: 0 };

    filteredSizeList.forEach((size) => {
      totals[size] = { points: 0, pass: 0, fail: 0, negTol: 0, posTol: 0 };

      processedSpecs.forEach((spec) => {
        const sizeData = spec.sizeData[size];
        if (sizeData) {
          totals[size].points += sizeData.points;
          totals[size].pass += sizeData.pass;
          totals[size].fail += sizeData.fail;
          totals[size].negTol += sizeData.negTol;
          totals[size].posTol += sizeData.posTol;
        }
      });

      // Add to "All" totals
      totals["__ALL__"].points += totals[size].points;
      totals["__ALL__"].pass += totals[size].pass;
      totals["__ALL__"].fail += totals[size].fail;
      totals["__ALL__"].negTol += totals[size].negTol;
      totals["__ALL__"].posTol += totals[size].posTol;
    });

    return totals;
  }, [processedSpecs, filteredSizeList]);

  // Recalculate grand totals
  const recalculatedGrandTotals = useMemo(() => {
    const totals = recalculatedSizeTotals["__ALL__"] || {
      points: 0,
      pass: 0,
      fail: 0,
      negTol: 0,
      posTol: 0,
    };

    return {
      ...totals,
      passRate:
        totals.points > 0
          ? ((totals.pass / totals.points) * 100).toFixed(1)
          : "0.0",
    };
  }, [recalculatedSizeTotals]);

  // Calculate pass rate color
  const getPassRateColor = (passRate) => {
    const rate = parseFloat(passRate);
    if (rate >= 95) return "text-green-600";
    if (rate >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  if (!styleNo) {
    return null;
  }

  // Initial loading state (before any data is loaded)
  if (!initialLoaded && loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          <span className="ml-3 text-gray-500">
            Analyzing measurement data...
          </span>
        </div>
      </div>
    );
  }

  // Use available data or defaults
  const reportTypes =
    availableReportTypes.length > 0
      ? availableReportTypes
      : data?.reportTypes || [];
  const sizeList = filteredSizeList;
  const specs = processedSpecs;
  const sizeTotals = recalculatedSizeTotals;
  const grandTotals = recalculatedGrandTotals;
  const totalReports = data?.totalReports || 0;

  // Check if we have any measurement capability at all
  const hasNoMeasurementCapability =
    initialLoaded &&
    availableSizeList.length === 0 &&
    availableReportTypes.length === 0;

  if (hasNoMeasurementCapability) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <BarChart3 className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-lg font-medium">No measurement data available</p>
          <p className="text-sm">
            Measurement conclusion will appear after reports are submitted
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header Section - Always Visible */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Title & Stats */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
              <BarChart3 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Measurement Final Conclusion
              </h3>
              <p className="text-sm text-gray-500">
                {totalReports > 0
                  ? `Aggregated from ${totalReports} report${totalReports !== 1 ? "s" : ""} • ${specs.length} measurement point${specs.length !== 1 ? "s" : ""}`
                  : "No reports match current filters"}
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="flex flex-wrap gap-3">
            {/* Total Points */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
              <div className="w-8 h-8 flex items-center justify-center bg-gray-100 dark:bg-gray-600 rounded-lg">
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                  Σ
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Points</p>
                <p className="text-sm font-bold text-gray-800 dark:text-white">
                  {grandTotals.points.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Pass Count */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
              <div className="w-8 h-8 flex items-center justify-center bg-green-100 dark:bg-green-900/30 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Pass</p>
                <p className="text-sm font-bold text-green-600">
                  {grandTotals.pass.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Pass Rate */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
              <div className="w-8 h-8 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Pass Rate</p>
                <p
                  className={`text-sm font-bold ${getPassRateColor(grandTotals.passRate)}`}
                >
                  {grandTotals.passRate}%
                </p>
              </div>
            </div>

            {/* Fail Count */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm">
              <div className="w-8 h-8 flex items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-lg">
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Fail</p>
                <p className="text-sm font-bold text-red-600">
                  {grandTotals.fail.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Buttons - Always Visible */}
        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          {/* Report Type Filter */}
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-500 mb-2">
              Filter by Report Type:
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedReportType("All")}
                disabled={loading}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all disabled:opacity-50 ${
                  selectedReportType === "All"
                    ? "bg-indigo-600 text-white shadow-md"
                    : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                }`}
              >
                All Types
              </button>
              {reportTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedReportType(type)}
                  disabled={loading}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all disabled:opacity-50 ${
                    selectedReportType === type
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Stage Filter */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">
              Filter by Stage:
            </p>
            <div className="flex gap-2">
              {["All", "Before", "After"].map((stageOption) => (
                <button
                  key={stageOption}
                  onClick={() => setSelectedStage(stageOption)}
                  disabled={loading}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all disabled:opacity-50 ${
                    selectedStage === stageOption
                      ? stageOption === "Before"
                        ? "bg-purple-600 text-white shadow-md"
                        : stageOption === "After"
                          ? "bg-teal-600 text-white shadow-md"
                          : "bg-indigo-600 text-white shadow-md"
                      : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600"
                  }`}
                >
                  {stageOption === "All"
                    ? "All Stages"
                    : stageOption === "Before"
                      ? "Before Wash"
                      : "After Wash"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Loading indicator for filter changes */}
        {loading && initialLoaded && (
          <div className="mt-3 flex items-center gap-2 text-sm text-indigo-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Updating results...</span>
          </div>
        )}
      </div>

      {/* Table Section - Conditional Content */}
      {specs.length === 0 ? (
        // Empty State for current filter - but filters remain accessible
        <div className="flex flex-col items-center justify-center py-16 text-gray-400">
          <Inbox className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
            No measurement data for selected filters
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Try selecting different Report Type or Stage filters above
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
            <AlertTriangle className="w-4 h-4" />
            <span>
              Current filters: {selectedReportType} /{" "}
              {selectedStage === "All"
                ? "All Stages"
                : selectedStage === "Before"
                  ? "Before Wash"
                  : "After Wash"}
            </span>
          </div>
        </div>
      ) : (
        // Table with data
        <div className="overflow-x-auto">
          <table className="text-xs border-collapse">
            <thead>
              {/* Size Row */}
              <tr className="bg-gray-100 dark:bg-gray-700">
                <th className="sticky left-0 z-20 bg-gray-100 dark:bg-gray-700 px-3 py-3 text-left font-bold text-gray-700 dark:text-gray-300 w-[250px] min-w-[250px] max-w-[250px] border-b border-r border-gray-200 dark:border-gray-600">
                  Measurement Point
                </th>
                <th className="px-2 py-3 text-center font-bold text-red-600 w-[50px] min-w-[50px] border-b border-gray-200 dark:border-gray-600 bg-red-50 dark:bg-red-900/20">
                  Tol -
                </th>
                <th className="px-2 py-3 text-center font-bold text-green-600 w-[50px] min-w-[50px] border-b border-gray-200 dark:border-gray-600 bg-green-50 dark:bg-green-900/20">
                  Tol +
                </th>
                {/* All Sizes Column */}
                <th
                  colSpan={5}
                  className="px-2 py-3 text-center font-bold text-purple-700 dark:text-purple-400 border-l-2 border-b border-purple-300 dark:border-purple-700 bg-purple-100 dark:bg-purple-900/30 w-[225px] min-w-[225px]"
                >
                  All Sizes
                </th>
                {/* Individual Size Columns */}
                {sizeList.map((size) => (
                  <th
                    key={size}
                    colSpan={5}
                    className="px-2 py-3 text-center font-bold text-indigo-700 dark:text-indigo-400 border-l-2 border-b border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 w-[225px] min-w-[225px]"
                  >
                    {size}
                  </th>
                ))}
              </tr>

              {/* Sub-header Row */}
              <tr className="bg-gray-50 dark:bg-gray-750">
                <th className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-750 border-b border-r border-gray-200 dark:border-gray-600 w-[200px] min-w-[200px] max-w-[200px]"></th>
                <th className="border-b border-gray-200 dark:border-gray-600 w-[50px] min-w-[50px]"></th>
                <th className="border-b border-gray-200 dark:border-gray-600 w-[50px] min-w-[50px]"></th>

                {/* All Sizes Sub-headers */}
                <th className="px-1 py-2 text-center font-semibold text-gray-600 dark:text-gray-400 border-l-2 border-b border-purple-300 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 w-[45px] min-w-[45px]">
                  Points
                </th>
                <th className="px-1 py-2 text-center font-semibold text-green-700 dark:text-green-400 border-b border-gray-200 dark:border-gray-600 bg-green-100 dark:bg-green-900/30 w-[45px] min-w-[45px]">
                  Pass
                </th>
                <th className="px-1 py-2 text-center font-semibold text-red-700 dark:text-red-400 border-b border-gray-200 dark:border-gray-600 bg-red-100 dark:bg-red-900/30 w-[45px] min-w-[45px]">
                  Fail
                </th>
                <th className="px-1 py-2 text-center font-semibold text-orange-700 dark:text-orange-400 border-b border-gray-200 dark:border-gray-600 bg-orange-100 dark:bg-orange-900/30 w-[45px] min-w-[45px]">
                  Neg.Tol
                </th>
                <th className="px-1 py-2 text-center font-semibold text-red-700 dark:text-red-400 border-b border-gray-200 dark:border-gray-600 bg-red-100 dark:bg-red-900/30 w-[45px] min-w-[45px]">
                  Pos.Tol
                </th>

                {/* Individual Size Sub-headers */}
                {sizeList.map((size) => (
                  <React.Fragment key={`sub-${size}`}>
                    <th className="px-1 py-2 text-center font-semibold text-gray-600 dark:text-gray-400 border-l-2 border-b border-indigo-200 dark:border-indigo-800 bg-gray-100 dark:bg-gray-700 w-[45px] min-w-[45px]">
                      Points
                    </th>
                    <th className="px-1 py-2 text-center font-semibold text-green-700 dark:text-green-400 border-b border-gray-200 dark:border-gray-600 bg-green-100 dark:bg-green-900/30 w-[45px] min-w-[45px]">
                      Pass
                    </th>
                    <th className="px-1 py-2 text-center font-semibold text-red-700 dark:text-red-400 border-b border-gray-200 dark:border-gray-600 bg-red-100 dark:bg-red-900/30 w-[45px] min-w-[45px]">
                      Fail
                    </th>
                    <th className="px-1 py-2 text-center font-semibold text-orange-700 dark:text-orange-400 border-b border-gray-200 dark:border-gray-600 bg-orange-100 dark:bg-orange-900/30 w-[45px] min-w-[45px]">
                      Neg.Tol
                    </th>
                    <th className="px-1 py-2 text-center font-semibold text-red-700 dark:text-red-400 border-b border-gray-200 dark:border-gray-600 bg-red-100 dark:bg-red-900/30 w-[45px] min-w-[45px]">
                      Pos.Tol
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {specs.map((spec, idx) => {
                // Determine row background based on critical status and alternating
                const isCritical = spec.isCritical;
                const baseRowBg = isCritical
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : idx % 2 === 0
                    ? "bg-white dark:bg-gray-800"
                    : "bg-gray-50/50 dark:bg-gray-800/50";

                return (
                  <tr
                    key={spec.id}
                    className={`${baseRowBg} hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors`}
                  >
                    {/* Measurement Point */}
                    <td
                      className={`sticky left-0 z-10 px-3 py-2.5 font-medium text-gray-800 dark:text-gray-200 w-[200px] min-w-[200px] max-w-[200px] border-r border-gray-100 dark:border-gray-700 ${
                        isCritical
                          ? "bg-blue-100 dark:bg-blue-900/30"
                          : "bg-inherit"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        {isCritical && (
                          <span className="text-blue-600 dark:text-blue-400 font-bold">
                            ★
                          </span>
                        )}
                        <span className="line-clamp-2">
                          {spec.measurementPointName}
                        </span>
                      </div>
                    </td>

                    {/* Tol - (Always show as negative) */}
                    <td className="px-2 py-2.5 text-center font-bold text-red-600 bg-red-50/50 dark:bg-red-900/10 w-[50px] min-w-[50px]">
                      {formatTolMinus(spec.tolMinus)}
                    </td>

                    {/* Tol + */}
                    <td className="px-2 py-2.5 text-center font-bold text-green-600 bg-green-50/50 dark:bg-green-900/10 w-[50px] min-w-[50px]">
                      {spec.tolPlus}
                    </td>

                    {/* All Sizes Data */}
                    <td className="px-1 py-2.5 text-center text-gray-700 dark:text-gray-300 font-medium border-l-2 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/20 w-[45px] min-w-[45px]">
                      {spec.allSizeTotals.points || "-"}
                    </td>
                    <td className="px-1 py-2.5 text-center font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 w-[45px] min-w-[45px]">
                      {spec.allSizeTotals.pass || "-"}
                    </td>
                    <td className="px-1 py-2.5 text-center font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 w-[45px] min-w-[45px]">
                      {spec.allSizeTotals.fail || "-"}
                    </td>
                    <td className="px-1 py-2.5 text-center font-bold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 w-[45px] min-w-[45px]">
                      {spec.allSizeTotals.negTol || "-"}
                    </td>
                    <td className="px-1 py-2.5 text-center font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 w-[45px] min-w-[45px]">
                      {spec.allSizeTotals.posTol || "-"}
                    </td>

                    {/* Individual Size Data */}
                    {sizeList.map((size) => {
                      const sizeData = spec.sizeData[size] || {
                        points: 0,
                        pass: 0,
                        fail: 0,
                        negTol: 0,
                        posTol: 0,
                      };

                      return (
                        <React.Fragment key={`${spec.id}-${size}`}>
                          <td className="px-1 py-2.5 text-center text-gray-700 dark:text-gray-300 font-medium border-l-2 border-indigo-100 dark:border-indigo-900 bg-gray-50/50 dark:bg-gray-700/30 w-[45px] min-w-[45px]">
                            {sizeData.points || "-"}
                          </td>
                          <td className="px-1 py-2.5 text-center font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 w-[45px] min-w-[45px]">
                            {sizeData.pass || "-"}
                          </td>
                          <td className="px-1 py-2.5 text-center font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 w-[45px] min-w-[45px]">
                            {sizeData.fail || "-"}
                          </td>
                          <td className="px-1 py-2.5 text-center font-bold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 w-[45px] min-w-[45px]">
                            {sizeData.negTol || "-"}
                          </td>
                          <td className="px-1 py-2.5 text-center font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 w-[45px] min-w-[45px]">
                            {sizeData.posTol || "-"}
                          </td>
                        </React.Fragment>
                      );
                    })}
                  </tr>
                );
              })}

              {/* Totals Row */}
              <tr className="bg-indigo-100 dark:bg-indigo-900/30 font-bold border-t-2 border-indigo-300 dark:border-indigo-700">
                <td className="sticky left-0 z-10 px-3 py-3 text-indigo-800 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30 w-[200px] min-w-[200px] max-w-[200px] border-r border-indigo-200 dark:border-indigo-700">
                  TOTAL ({specs.length} Points)
                </td>
                <td className="px-2 py-3 text-center text-red-700 w-[50px] min-w-[50px]">
                  -
                </td>
                <td className="px-2 py-3 text-center text-green-700 w-[50px] min-w-[50px]">
                  -
                </td>

                {/* All Sizes Totals */}
                <td className="px-1 py-3 text-center text-gray-800 dark:text-gray-200 border-l-2 border-purple-300 dark:border-purple-700 bg-purple-100 dark:bg-purple-900/40 w-[45px] min-w-[45px]">
                  {sizeTotals["__ALL__"]?.points || "-"}
                </td>
                <td className="px-1 py-3 text-center text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 w-[45px] min-w-[45px]">
                  {sizeTotals["__ALL__"]?.pass || "-"}
                </td>
                <td className="px-1 py-3 text-center text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/40 w-[45px] min-w-[45px]">
                  {sizeTotals["__ALL__"]?.fail || "-"}
                </td>
                <td className="px-1 py-3 text-center text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40 w-[45px] min-w-[45px]">
                  {sizeTotals["__ALL__"]?.negTol || "-"}
                </td>
                <td className="px-1 py-3 text-center text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/40 w-[45px] min-w-[45px]">
                  {sizeTotals["__ALL__"]?.posTol || "-"}
                </td>

                {/* Individual Size Totals */}
                {sizeList.map((size) => {
                  const totals = sizeTotals[size] || {
                    points: 0,
                    pass: 0,
                    fail: 0,
                    negTol: 0,
                    posTol: 0,
                  };

                  return (
                    <React.Fragment key={`total-${size}`}>
                      <td className="px-1 py-3 text-center text-gray-800 dark:text-gray-200 border-l-2 border-indigo-200 dark:border-indigo-800 bg-gray-100 dark:bg-gray-700 w-[45px] min-w-[45px]">
                        {totals.points || "-"}
                      </td>
                      <td className="px-1 py-3 text-center text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/40 w-[45px] min-w-[45px]">
                        {totals.pass || "-"}
                      </td>
                      <td className="px-1 py-3 text-center text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/40 w-[45px] min-w-[45px]">
                        {totals.fail || "-"}
                      </td>
                      <td className="px-1 py-3 text-center text-orange-700 dark:text-orange-400 bg-orange-100 dark:bg-orange-900/40 w-[45px] min-w-[45px]">
                        {totals.negTol || "-"}
                      </td>
                      <td className="px-1 py-3 text-center text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/40 w-[45px] min-w-[45px]">
                        {totals.posTol || "-"}
                      </td>
                    </React.Fragment>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Footer Legend - Always Visible when we have size list */}
      {sizeList.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-750 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
            <span className="font-medium text-gray-700 dark:text-gray-300">
              Legend:
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-blue-100 border border-blue-200 flex items-center justify-center">
                <span className="text-blue-600 text-[8px] font-bold">★</span>
              </div>
              <span>Critical Point</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-green-100 border border-green-200"></div>
              <span>Pass (Within Tolerance)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-red-100 border border-red-200"></div>
              <span>Fail / Pos.Tol (Above Upper Limit)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded bg-orange-100 border border-orange-200"></div>
              <span>Neg.Tol (Below Lower Limit)</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StyleMeasurementFinalConclusion;
