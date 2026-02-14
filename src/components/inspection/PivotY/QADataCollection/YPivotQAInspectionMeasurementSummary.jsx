import React, { useMemo } from "react";
import {
  Star,
  Layers,
  Lock,
  Target,
  CheckCircle2,
  XCircle,
  Info,
  List,
  TrendingUp,
  TrendingDown,
  Percent,
  Hash,
} from "lucide-react";

/**
 * Sort sizes based on a reference SizeList order
 * Sizes not in SizeList will be placed at the end, sorted alphabetically
 * @param {string[]} sizes - Array of size strings to sort
 * @param {string[]} sizeList - Reference order from DtOrder.SizeList
 * @returns {string[]} Sorted sizes array
 */

export const sortSizesByReference = (sizes, sizeList = []) => {
  if (!sizeList || sizeList.length === 0) {
    return [...sizes].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
  }

  // Create a map for quick index lookup
  const orderMap = new Map();
  sizeList.forEach((size, index) => {
    orderMap.set(size, index);
  });

  // HELPER: Remove (A), (B) suffix to match the reference list
  const cleanSize = (s) => {
    if (!s) return "";
    return s.replace(/\s*\([AB]\)$/i, "").trim();
  };

  return [...sizes].sort((a, b) => {
    // Clean the sizes before looking them up
    const realA = cleanSize(a);
    const realB = cleanSize(b);

    const indexA = orderMap.has(realA) ? orderMap.get(realA) : Infinity;
    const indexB = orderMap.has(realB) ? orderMap.get(realB) : Infinity;

    // If both are in the reference list, sort by their order
    if (indexA !== Infinity && indexB !== Infinity) {
      return indexA - indexB;
    }

    // If only one is in the list, it comes first
    if (indexA !== Infinity) return -1;
    if (indexB !== Infinity) return 1;

    // Both are not in the list, sort alphabetically
    return a.localeCompare(b, undefined, { numeric: true });
  });
};

// ============================================================================
// TOLERANCE UTILITIES
// ============================================================================

/**
 * Normalize decimal tolerance for CALCULATION: Always use absolute value
 */
const normalizeToleranceDecimal = (value) => {
  if (value === null || value === undefined) return 0;
  const num = parseFloat(value);
  if (isNaN(num)) return 0;
  return Math.abs(num);
};

/**
 * Normalize Tol- for DISPLAY: Always negative (unless 0 or empty)
 */
const normalizeTolMinusDisplay = (value) => {
  if (!value || value === "-" || value === "0" || value === 0) {
    return value === 0 ? "0" : value || "-";
  }

  const strVal = String(value).trim();
  if (strVal === "0") return "0";
  if (strVal.startsWith("-")) return strVal;
  return `-${strVal}`;
};

/**
 * Normalize Tol+ for DISPLAY: Always positive (unless 0 or empty)
 */
const normalizeTolPlusDisplay = (value) => {
  if (!value || value === "-" || value === "0" || value === 0) {
    return value === 0 ? "0" : value || "-";
  }

  const strVal = String(value).trim();
  if (strVal === "0") return "0";
  if (strVal.startsWith("-")) return strVal.substring(1);
  return strVal;
};

/**
 * Check if measured value is within tolerance
 * @param {Object} spec - The specification object containing TolPlus and TolMinus
 * @param {number} value - The measured decimal value (deviation from spec)
 * @returns {Object} { isWithin: boolean, isDefault: boolean }
 */
export const checkTolerance = (spec, value) => {
  // Empty/zero values are considered within tolerance by default
  if (value === 0 || value === "" || value === null || value === undefined) {
    return { isWithin: true, isDefault: true };
  }

  const reading = parseFloat(value);
  if (isNaN(reading)) {
    return { isWithin: true, isDefault: true };
  }

  // Get tolerance decimal values
  const tolMinusDecimal = parseFloat(spec.TolMinus?.decimal);
  const tolPlusDecimal = parseFloat(spec.TolPlus?.decimal);

  // If both tolerance values are not available, consider within tolerance
  if (isNaN(tolMinusDecimal) && isNaN(tolPlusDecimal)) {
    return { isWithin: true, isDefault: true };
  }

  // TolMinus represents lower bound - always use as negative (or 0)
  // TolPlus represents upper bound - always use as positive (or 0)
  const lowerLimit = isNaN(tolMinusDecimal) ? 0 : -Math.abs(tolMinusDecimal);
  const upperLimit = isNaN(tolPlusDecimal) ? 0 : Math.abs(tolPlusDecimal);

  // Check if reading is within range (with small epsilon for floating point)
  const epsilon = 0.0001;
  const isWithin =
    reading >= lowerLimit - epsilon && reading <= upperLimit + epsilon;

  return { isWithin, isDefault: false, upperLimit, lowerLimit };
};

/**
 * Format spec fraction value for display
 * Converts "19-1/2" to "19 1/2" (replaces dash with space between whole number and fraction)
 */
const formatSpecFraction = (fractionStr) => {
  if (!fractionStr || fractionStr === "-") return fractionStr || "-";
  // Replace dash between whole number and fraction with space
  // e.g., "19-1/2" → "19 1/2"
  return String(fractionStr).replace(/(\d)-(\d)/g, "$1 $2");
};

// ============================================================================
// EXPORTED UTILITIES
// ============================================================================

/**
 * Filter specs by K value
 */
export const getFilteredSpecs = (specs, kValue) => {
  if (kValue) {
    return specs.filter((s) => s.kValue === kValue || s.kValue === "NA");
  }
  return specs;
};

/**
 * Group measurements by groupId (Session Context)
 */
export const groupMeasurementsByGroupId = (savedMeasurements) => {
  const groups = {};
  const noContext = [];

  savedMeasurements.forEach((m) => {
    if (m.groupId) {
      if (!groups[m.groupId]) {
        groups[m.groupId] = {
          id: m.groupId,
          line: m.line,
          table: m.table,
          color: m.color,
          lineName: m.lineName || m.line,
          tableName: m.tableName || m.table,
          colorName: m.colorName || m.color,
          qcUser: m.qcUser,
          measurements: [],
        };
      }
      groups[m.groupId].measurements.push(m);
    } else {
      noContext.push(m);
    }
  });

  return { groups: Object.values(groups), noContext };
};

/**
 * Build table structure for a group of measurements
 * @param {Array} measurements - Array of measurement objects
 * @param {Array} sizeList - Reference size order from DtOrder.SizeLis
 */

export const buildTableData = (measurements, sizeList = []) => {
  const validMeasurements = measurements.filter(
    (m) => m.size !== "Manual_Entry",
  );
  // Get unique sizes and sort by reference list
  const uniqueSizes = [...new Set(validMeasurements.map((m) => m.size))];
  const sortedSizes = sortSizesByReference(uniqueSizes, sizeList);

  // Build data in the correct order
  return sortedSizes
    .map((size) => {
      const m = measurements.find((meas) => meas.size === size);
      if (!m) return null;

      const columns = [];

      const allEnabledPcs = Array.from(m.allEnabledPcs || []);
      allEnabledPcs
        .sort((a, b) => a - b)
        .forEach((pcsIndex) => {
          columns.push({
            pcsIndex,
            pcsNumber: columns.length + 1,
            isAllMode: true,
            measurements: m.allMeasurements || {},
          });
        });

      const criticalEnabledPcs = Array.from(m.criticalEnabledPcs || []);
      criticalEnabledPcs
        .sort((a, b) => a - b)
        .forEach((pcsIndex) => {
          columns.push({
            pcsIndex,
            pcsNumber: columns.length + 1,
            isAllMode: false,
            measurements: m.criticalMeasurements || {},
          });
        });

      return {
        size: m.size,
        kValue: m.kValue,
        inspectorDecision: m.inspectorDecision,
        columns,
      };
    })
    .filter(Boolean); // Remove nulls
};

/**
 * Calculate summary stats for a group of measurements
 */
export const calculateGroupStats = (
  measurements,
  specsData,
  selectedSpecsList,
) => {
  let totalPoints = 0;
  let passPoints = 0;
  let failPoints = 0;
  let totalPcs = 0;
  let passPcs = 0;
  let failPcs = 0;

  measurements.forEach((m) => {
    const allEnabledPcs = Array.from(m.allEnabledPcs || []);
    allEnabledPcs.forEach((pcsIndex) => {
      totalPcs++;
      let pcsHasFail = false;

      const filteredAllSpecs = getFilteredSpecs(specsData, m.kValue);
      filteredAllSpecs.forEach((spec) => {
        totalPoints++;
        const val = m.allMeasurements?.[spec.id]?.[pcsIndex];
        const value = val?.decimal || 0;

        if (value === 0) {
          passPoints++;
        } else {
          const toleranceResult = checkTolerance(spec, value);
          if (toleranceResult.isWithin || toleranceResult.isDefault) {
            passPoints++;
          } else {
            failPoints++;
            pcsHasFail = true;
          }
        }
      });

      if (pcsHasFail) failPcs++;
      else passPcs++;
    });

    const criticalEnabledPcs = Array.from(m.criticalEnabledPcs || []);
    criticalEnabledPcs.forEach((pcsIndex) => {
      totalPcs++;
      let pcsHasFail = false;

      const filteredCriticalSpecs = getFilteredSpecs(
        selectedSpecsList,
        m.kValue,
      );
      filteredCriticalSpecs.forEach((spec) => {
        totalPoints++;
        const val = m.criticalMeasurements?.[spec.id]?.[pcsIndex];
        const value = val?.decimal || 0;

        if (value === 0) {
          passPoints++;
        } else {
          const toleranceResult = checkTolerance(spec, value);
          if (toleranceResult.isWithin || toleranceResult.isDefault) {
            passPoints++;
          } else {
            failPoints++;
            pcsHasFail = true;
          }
        }
      });

      if (pcsHasFail) failPcs++;
      else passPcs++;
    });
  });

  return {
    totalPoints,
    passPoints,
    failPoints,
    totalPcs,
    passPcs,
    failPcs,
    pointPassRate:
      totalPoints > 0 ? ((passPoints / totalPoints) * 100).toFixed(1) : "0.0",
    pcsPassRate: totalPcs > 0 ? ((passPcs / totalPcs) * 100).toFixed(1) : "0.0",
  };
};

/**
 * Calculate overall measurement result (PASS/FAIL)
 */
export const calculateOverallMeasurementResult = (savedMeasurements) => {
  if (!savedMeasurements || savedMeasurements.length === 0) {
    return { result: "PASS", hasData: false };
  }

  const hasFail = savedMeasurements.some((m) => m.inspectorDecision === "fail");

  return { result: hasFail ? "FAIL" : "PASS", hasData: true };
};

/**
 * Get config result (PASS if all sizes pass, FAIL if any fail)
 */
export const getConfigResult = (measurements) => {
  if (!measurements || measurements.length === 0) return "PASS";
  const hasFail = measurements.some((m) => m.inspectorDecision === "fail");
  return hasFail ? "FAIL" : "PASS";
};

// ============================================================================
// EXPORTED COMPONENTS
// ============================================================================

/**
 * Stats Cards Component (6 cards)
 */
export const MeasurementStatsCards = ({ stats, compact = false }) => {
  const cards = [
    {
      label: "Total Points",
      value: stats.totalPoints,
      color: "blue",
      icon: Hash,
    },
    {
      label: "Fail Points",
      value: stats.failPoints,
      color: "red",
      icon: XCircle,
    },
    {
      label: "Point Pass Rate",
      value: `${stats.pointPassRate}%`,
      color: "green",
      icon: Percent,
    },
    {
      label: "Total Pcs",
      value: stats.totalPcs,
      color: "indigo",
      icon: Target,
    },
    {
      label: "Fail Pcs",
      value: stats.failPcs,
      color: "orange",
      icon: TrendingDown,
    },
    {
      label: "Pcs Pass Rate",
      value: `${stats.pcsPassRate}%`,
      color: "emerald",
      icon: TrendingUp,
    },
  ];

  const colorClasses = {
    blue: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300",
    red: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300",
    green:
      "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300",
    indigo:
      "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300",
    orange:
      "bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300",
    emerald:
      "bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300",
  };

  return (
    <div
      className={`grid ${
        compact
          ? "grid-cols-3 sm:grid-cols-6 gap-1.5"
          : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2"
      }`}
    >
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`${colorClasses[card.color]} ${
              compact ? "p-2" : "p-2.5"
            } rounded-lg border`}
          >
            <div className="flex items-center gap-1 mb-0.5">
              <Icon className={`${compact ? "w-3 h-3" : "w-3.5 h-3.5"}`} />
              <span
                className={`${
                  compact ? "text-[8px]" : "text-[9px]"
                } font-medium opacity-80`}
              >
                {card.label}
              </span>
            </div>
            <div className={`${compact ? "text-sm" : "text-base"} font-bold`}>
              {card.value}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/**
 * Legend Component
 */
export const MeasurementLegend = ({ compact = false }) => (
  <div
    className={`flex flex-wrap items-center gap-2 sm:gap-3 ${
      compact ? "p-2" : "p-2.5"
    } bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700`}
  >
    <span
      className={`${
        compact ? "text-[9px]" : "text-[10px]"
      } font-bold text-gray-600 dark:text-gray-400`}
    >
      Legend:
    </span>
    <div className="flex items-center gap-1">
      <span
        className={`${
          compact ? "w-4 h-4 text-[7px]" : "w-5 h-5 text-[8px]"
        } bg-purple-500 text-white font-bold rounded flex items-center justify-center`}
      >
        A
      </span>
      <span
        className={`${compact ? "text-[9px]" : "text-[10px]"} text-gray-600`}
      >
        All
      </span>
    </div>
    <div className="flex items-center gap-1">
      <span
        className={`${
          compact ? "w-4 h-4 text-[7px]" : "w-5 h-5 text-[8px]"
        } bg-amber-500 text-white font-bold rounded flex items-center justify-center`}
      >
        C
      </span>
      <span
        className={`${compact ? "text-[9px]" : "text-[10px]"} text-gray-600`}
      >
        Critical
      </span>
    </div>
    <div className="flex items-center gap-1">
      <Star
        className={`${
          compact ? "w-3 h-3" : "w-3.5 h-3.5"
        } text-blue-500 fill-current`}
      />
      <span
        className={`${compact ? "text-[9px]" : "text-[10px]"} text-gray-600`}
      >
        Critical Pt
      </span>
    </div>
    <div className="flex items-center gap-1">
      <div
        className={`${
          compact ? "w-3 h-3" : "w-4 h-4"
        } bg-green-100 border border-green-300 rounded`}
      ></div>
      <span
        className={`${compact ? "text-[9px]" : "text-[10px]"} text-gray-600`}
      >
        Within Tol
      </span>
    </div>
    <div className="flex items-center gap-1">
      <div
        className={`${
          compact ? "w-3 h-3" : "w-4 h-4"
        } bg-red-100 border border-red-300 rounded`}
      ></div>
      <span
        className={`${compact ? "text-[9px]" : "text-[10px]"} text-gray-600`}
      >
        Out of Tol
      </span>
    </div>
  </div>
);

/**
 * Measurement Summary Table Component
 */

export const MeasurementSummaryTable = ({
  measurements,
  specsData,
  selectedSpecsList,
  sizeList = [],
  compact = false,
}) => {
  const tableData = buildTableData(measurements, sizeList);

  const isCriticalSpec = useMemo(() => {
    const criticalIds = new Set((selectedSpecsList || []).map((s) => s.id));
    return (specId) => criticalIds.has(specId);
  }, [selectedSpecsList]);

  if (
    tableData.length === 0 ||
    tableData.every((t) => t.columns.length === 0)
  ) {
    return (
      <div className="text-center py-6 text-gray-400 text-xs italic">
        <Info className="w-6 h-6 mx-auto mb-2 text-gray-300" />
        No measurements recorded
      </div>
    );
  }

  const kValuesInMeasurements = new Set(
    measurements.map((m) => m.kValue).filter(Boolean),
  );

  let displaySpecs = specsData;
  if (kValuesInMeasurements.size > 0) {
    displaySpecs = specsData.filter(
      (s) => kValuesInMeasurements.has(s.kValue) || s.kValue === "NA",
    );
  }

  return (
    <div className="overflow-x-auto">
      <table
        className={`w-full border-collapse border border-gray-300 dark:border-gray-600 ${
          compact ? "text-[10px]" : "text-xs"
        }`}
      >
        <thead>
          {/* --- HEADER ROW 1 --- */}
          <tr className="bg-gray-100 dark:bg-gray-800">
            {/* 1. Point Name Header */}
            <th
              rowSpan={2}
              className={`border border-gray-300 dark:border-gray-600 ${
                compact ? "p-1.5" : "p-2"
              } text-left font-bold text-gray-700 dark:text-gray-300 sticky left-0 bg-gray-100 dark:bg-gray-800 z-20 min-w-[120px]`}
            >
              <div className="flex items-center gap-1">
                <List
                  className={`${
                    compact ? "w-3 h-3" : "w-3.5 h-3.5"
                  } text-gray-500`}
                />
                <span>Point</span>
              </div>
            </th>

            {/* 2. Tolerance Headers */}
            <th
              rowSpan={2}
              className={`border border-gray-300 dark:border-gray-600 ${
                compact ? "p-1" : "p-1.5"
              } text-center bg-red-50 dark:bg-red-900/20 w-[50px]`}
            >
              <span className="text-red-600 dark:text-red-400 font-bold">
                TOL (-)
              </span>
            </th>
            <th
              rowSpan={2}
              className={`border border-gray-300 dark:border-gray-600 ${
                compact ? "p-1" : "p-1.5"
              } text-center bg-green-50 dark:bg-green-900/20 w-[50px]`}
            >
              <span className="text-green-600 dark:text-green-400 font-bold">
                TOL (+)
              </span>
            </th>

            {/* 3. Size Headers */}
            {tableData.map(
              (sizeData, sIdx) =>
                sizeData.columns.length > 0 && (
                  <th
                    key={sIdx}
                    colSpan={sizeData.columns.length + 1}
                    className={`border border-gray-300 dark:border-gray-600 ${
                      compact ? "p-1" : "p-1.5"
                    } text-center bg-indigo-100 dark:bg-indigo-900/40`}
                  >
                    <div
                      className={`font-bold text-gray-800 dark:text-gray-200 ${
                        compact ? "text-xs" : "text-sm"
                      }`}
                    >
                      {sizeData.size}
                    </div>
                    {sizeData.kValue && (
                      <div className="text-[8px] text-indigo-600 dark:text-indigo-400 font-medium">
                        K: {sizeData.kValue}
                      </div>
                    )}
                  </th>
                ),
            )}
          </tr>

          {/* --- HEADER ROW 2 --- */}
          <tr className="bg-gray-50 dark:bg-gray-700">
            {tableData.map((sizeData, sIdx) => (
              <React.Fragment key={sIdx}>
                {/* 1. Spec Sub-Header */}
                {sizeData.columns.length > 0 && (
                  <th
                    className={`border border-gray-300 dark:border-gray-600 ${
                      compact ? "p-1" : "p-1.5"
                    } text-center bg-blue-50 dark:bg-blue-900/20`}
                  >
                    <span
                      className={`font-bold text-blue-600 dark:text-blue-400 ${
                        compact ? "text-[9px]" : "text-[10px]"
                      }`}
                    >
                      Spec
                    </span>
                  </th>
                )}

                {/* 2. Reading Headers (#1, #2...) */}
                {sizeData.columns.map((col, cIdx) => (
                  <th
                    key={`${sIdx}-${cIdx}`}
                    className={`border border-gray-300 dark:border-gray-600 ${
                      compact ? "p-1" : "p-1.5"
                    } text-center min-w-[40px] ${
                      col.isAllMode
                        ? "bg-purple-100 dark:bg-purple-900/40"
                        : "bg-amber-100 dark:bg-amber-900/40"
                    }`}
                  >
                    <div
                      className={`${
                        compact ? "text-[9px]" : "text-[10px]"
                      } font-bold`}
                    >
                      #{col.pcsNumber}
                    </div>
                    <div
                      className={`text-[7px] font-bold px-1 py-0.5 rounded inline-block ${
                        col.isAllMode
                          ? "bg-purple-500 text-white"
                          : "bg-amber-500 text-white"
                      }`}
                    >
                      {col.isAllMode ? "A" : "C"}
                    </div>
                  </th>
                ))}
              </React.Fragment>
            ))}
          </tr>
        </thead>
        <tbody>
          {displaySpecs.map((spec, specIdx) => {
            const isCritical = isCriticalSpec(spec.id);

            // Extract and normalize Tolerances for display (keep as fractions)
            const rawTolMinus = spec.TolMinus?.fraction || "-";
            const rawTolPlus = spec.TolPlus?.fraction || "-";
            const displayTolMinus = normalizeTolMinusDisplay(rawTolMinus);
            const displayTolPlus = normalizeTolPlusDisplay(rawTolPlus);

            return (
              <tr
                key={spec.id}
                className={`${
                  isCritical
                    ? "bg-blue-50 dark:bg-blue-900/20"
                    : specIdx % 2 === 0
                      ? "bg-white dark:bg-gray-900"
                      : "bg-gray-50 dark:bg-gray-800/50"
                }`}
              >
                {/* 1. Point Name Cell */}
                <td
                  className={`border border-gray-300 dark:border-gray-600 ${
                    compact ? "p-1" : "p-1.5"
                  } sticky left-0 z-10 ${
                    isCritical
                      ? "bg-blue-50 dark:bg-blue-900/30"
                      : specIdx % 2 === 0
                        ? "bg-white dark:bg-gray-900"
                        : "bg-gray-50 dark:bg-gray-800/50"
                  }`}
                >
                  <div className="flex items-start gap-1">
                    {isCritical && (
                      <Star className="w-2.5 h-2.5 text-blue-500 fill-current flex-shrink-0 mt-0.5" />
                    )}
                    <span
                      className={`${
                        compact ? "text-[9px]" : "text-[10px]"
                      } font-medium text-gray-700 dark:text-gray-300 leading-tight`}
                      style={{ wordBreak: "break-word" }}
                    >
                      {spec.MeasurementPointEngName}
                    </span>
                  </div>
                </td>

                {/* 2. Tol- Cell (Always negative display - keep fraction) */}
                <td
                  className={`border border-gray-300 dark:border-gray-600 ${
                    compact ? "p-1" : "p-1.5"
                  } text-center bg-red-50/50 dark:bg-red-900/10`}
                >
                  <span className="text-red-600 dark:text-red-400 font-bold text-[10px]">
                    {displayTolMinus}
                  </span>
                </td>

                {/* 3. Tol+ Cell (Always positive display - keep fraction) */}
                <td
                  className={`border border-gray-300 dark:border-gray-600 ${
                    compact ? "p-1" : "p-1.5"
                  } text-center bg-green-50/50 dark:bg-green-900/10`}
                >
                  <span className="text-green-600 dark:text-green-400 font-bold text-[10px]">
                    {displayTolPlus}
                  </span>
                </td>

                {/* 4. Size Data Loop */}
                {tableData.map((sizeData, sIdx) => {
                  // Find Spec Value for this specific size and format it
                  const matchingSpec = spec.Specs?.find(
                    (s) => s.size === sizeData.size,
                  );
                  // Use decimal and convert, or format fraction with space instead of dash
                  const specValue = matchingSpec
                    ? formatSpecFraction(matchingSpec.fraction)
                    : "-";

                  return (
                    <React.Fragment key={sIdx}>
                      {/* 4a. Spec Value Cell */}
                      {sizeData.columns.length > 0 && (
                        <td
                          className={`border border-gray-300 dark:border-gray-600 ${
                            compact ? "p-1" : "p-1.5"
                          } text-center bg-blue-50/50 dark:bg-blue-900/10`}
                        >
                          <span className="text-blue-600 dark:text-blue-400 font-bold text-[10px]">
                            {specValue}
                          </span>
                        </td>
                      )}

                      {/* 4b. Reading Cells */}
                      {sizeData.columns.map((col, cIdx) => {
                        if (!col.isAllMode && !isCritical) {
                          return (
                            <td
                              key={`${sIdx}-${cIdx}`}
                              className="border border-gray-300 dark:border-gray-600 p-1 text-center bg-gray-200 dark:bg-gray-700"
                            >
                              <span className="text-[8px] text-gray-400">
                                —
                              </span>
                            </td>
                          );
                        }

                        const measurement =
                          col.measurements?.[spec.id]?.[col.pcsIndex];
                        // Use decimal for comparison
                        const decimalValue = measurement?.decimal || 0;
                        // Use fraction for display
                        const displayValue = measurement?.fraction || "0";

                        // Use the checkTolerance function with decimal value
                        const toleranceResult = checkTolerance(
                          spec,
                          decimalValue,
                        );

                        let bgColor, textColor;
                        // Within tolerance = light green, Out of tolerance = light red
                        if (
                          decimalValue === 0 ||
                          toleranceResult.isDefault ||
                          toleranceResult.isWithin
                        ) {
                          bgColor = "bg-green-100 dark:bg-green-900/50";
                          textColor = "text-green-700 dark:text-green-300";
                        } else {
                          bgColor = "bg-red-100 dark:bg-red-900/50";
                          textColor = "text-red-700 dark:text-red-300";
                        }

                        return (
                          <td
                            key={`${sIdx}-${cIdx}`}
                            className={`border border-gray-300 dark:border-gray-600 p-0.5 text-center ${bgColor}`}
                          >
                            <span
                              className={`${
                                compact ? "text-[9px]" : "text-[10px]"
                              } font-mono font-bold ${textColor}`}
                            >
                              {displayValue}
                            </span>
                          </td>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Overall Measurement Summary Table
 */
export const OverallMeasurementSummaryTable = ({
  groupedMeasurements,
  sizeList = [],
}) => {
  if (
    !groupedMeasurements?.groups?.length &&
    !groupedMeasurements?.noContext?.length
  ) {
    return null;
  }

  const allGroups = [
    ...groupedMeasurements.groups,
    ...(groupedMeasurements.noContext.length > 0
      ? [
          {
            id: "noContext",
            lineName: "",
            tableName: "",
            colorName: "General",
            measurements: groupedMeasurements.noContext,
          },
        ]
      : []),
  ];

  // Collect all unique sizes across all measurements
  const allSizes = new Set();
  allGroups.forEach((group) => {
    group.measurements.forEach((m) => {
      if (m.size) allSizes.add(m.size);
    });
  });

  const sortedSizes = sortSizesByReference(Array.from(allSizes), sizeList);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse border border-gray-300 dark:border-gray-600 text-xs">
        <thead>
          <tr className="bg-gradient-to-r from-gray-700 to-gray-800 text-white">
            <th className="border border-gray-600 px-3 py-2 text-left font-bold min-w-[140px]">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Configuration
              </div>
            </th>
            {sortedSizes.map((size) => (
              <th
                key={size}
                className="border border-gray-600 px-2 py-2 text-center font-bold min-w-[60px]"
              >
                {size}
              </th>
            ))}
            <th className="border border-gray-600 px-3 py-2 text-center font-bold min-w-[80px] bg-indigo-700">
              Result
            </th>
          </tr>
        </thead>
        <tbody>
          {allGroups.map((group, gIdx) => {
            const configLabel =
              [
                group.lineName ? `Line ${group.lineName}` : null,
                group.tableName ? `Table ${group.tableName}` : null,
                group.colorName || null,
              ]
                .filter(Boolean)
                .join(" / ") || "General";

            const configResult = getConfigResult(group.measurements);

            return (
              <tr
                key={group.id || gIdx}
                className={
                  gIdx % 2 === 0
                    ? "bg-white dark:bg-gray-800"
                    : "bg-gray-50 dark:bg-gray-800/50"
                }
              >
                <td className="border border-gray-300 dark:border-gray-600 px-3 py-2 font-medium text-gray-800 dark:text-gray-200">
                  {configLabel}
                </td>
                {sortedSizes.map((size) => {
                  const sizeMeasurement = group.measurements.find(
                    (m) => m.size === size,
                  );
                  if (!sizeMeasurement) {
                    return (
                      <td
                        key={size}
                        className="border border-gray-300 dark:border-gray-600 px-2 py-2 text-center bg-gray-100 dark:bg-gray-700"
                      >
                        <span className="text-gray-400">—</span>
                      </td>
                    );
                  }

                  const isPass = sizeMeasurement.inspectorDecision === "pass";
                  return (
                    <td
                      key={size}
                      className={`border border-gray-300 dark:border-gray-600 px-2 py-2 text-center ${
                        isPass
                          ? "bg-green-100 dark:bg-green-900/40"
                          : "bg-red-100 dark:bg-red-900/40"
                      }`}
                    >
                      <span
                        className={`font-bold text-[10px] ${
                          isPass ? "text-green-700" : "text-red-700"
                        }`}
                      >
                        {isPass ? "PASS" : "FAIL"}
                      </span>
                    </td>
                  );
                })}
                <td
                  className={`border border-gray-300 dark:border-gray-600 px-3 py-2 text-center font-bold ${
                    configResult === "PASS"
                      ? "bg-green-200 dark:bg-green-800/50 text-green-800 dark:text-green-300"
                      : "bg-red-200 dark:bg-red-800/50 text-red-800 dark:text-red-300"
                  }`}
                >
                  {configResult}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const YPivotQAInspectionMeasurementSummary = ({
  savedMeasurements,
  specsData,
  selectedSpecsList,
  activeGroup,
  sizeList = [],
}) => {
  const groupedMeasurements = useMemo(
    () => groupMeasurementsByGroupId(savedMeasurements),
    [savedMeasurements],
  );

  if (!savedMeasurements || savedMeasurements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Target className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
        <h3 className="text-base font-bold text-gray-600 dark:text-gray-400 mb-1">
          No Measurements Yet
        </h3>
        <p className="text-xs text-gray-500 text-center max-w-md">
          Complete measurement entries from Setup & Measure tab.
        </p>
      </div>
    );
  }

  const renderGroupSection = (group, isActive) => {
    const headerParts = [
      group.lineName ? `Line ${group.lineName}` : null,
      group.tableName ? `Table ${group.tableName}` : null,
      group.colorName ? `Color ${group.colorName}` : null,
    ].filter(Boolean);
    const headerLabel =
      headerParts.length > 0 ? headerParts.join(" / ") : "Inspection Session";
    const stats = calculateGroupStats(
      group.measurements,
      specsData,
      selectedSpecsList,
    );

    return (
      <div key={group.id} className="space-y-3">
        <div
          className={`flex items-center gap-2 pb-2 border-b-2 ${
            isActive
              ? "border-green-500"
              : "border-gray-200 dark:border-gray-700"
          }`}
        >
          <div
            className={`p-1.5 rounded-lg ${
              isActive
                ? "bg-green-100 text-green-600"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex-1">
            <h4
              className={`text-xs font-bold ${
                isActive ? "text-green-700" : "text-gray-600"
              }`}
            >
              {headerLabel}
            </h4>
            {group.qcUser && (
              <p className="text-[10px] text-gray-500">
                QC: {group.qcUser.eng_name}
              </p>
            )}
          </div>
          {isActive ? (
            <span className="text-[9px] bg-green-500 text-white px-1.5 py-0.5 rounded font-bold">
              Active
            </span>
          ) : (
            <span className="text-[9px] bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
              <Lock className="w-2.5 h-2.5" /> Locked
            </span>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-2">
            <h3 className="text-white font-bold text-sm flex items-center gap-1.5">
              <Target className="w-4 h-4" /> Measurement Summary
            </h3>
          </div>
          <div className="p-3 space-y-3">
            <MeasurementStatsCards stats={stats} compact />
            <MeasurementLegend compact />
            <MeasurementSummaryTable
              measurements={group.measurements}
              specsData={specsData}
              selectedSpecsList={selectedSpecsList}
              sizeList={sizeList}
              compact
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-3 space-y-4">
      {groupedMeasurements.groups.map((group) =>
        renderGroupSection(group, activeGroup && activeGroup.id === group.id),
      )}
      {groupedMeasurements.noContext.length > 0 &&
        renderGroupSection(
          { id: "noContext", measurements: groupedMeasurements.noContext },
          false,
        )}
    </div>
  );
};

export default YPivotQAInspectionMeasurementSummary;
