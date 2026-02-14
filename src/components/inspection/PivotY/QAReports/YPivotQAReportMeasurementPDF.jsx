import React from "react";
import { Text, View, StyleSheet, Page } from "@react-pdf/renderer";

// =============================================================================
// STYLES
// =============================================================================
const colors = {
  primary: "#0088CC",
  primaryLight: "#e0f2fe",
  success: "#15803d", // Green-700
  successBg: "#dcfce7", // Green-100
  danger: "#b91c1c", // Red-700
  dangerBg: "#fee2e2", // Red-100
  warning: "#b45309", // Amber-700
  specBg: "#eff6ff", // Blue-50
  specText: "#2563eb", // Blue-600
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
};

const styles = StyleSheet.create({
  // --- LAYOUT ---
  section: { marginBottom: 16 },
  sectionContent: {
    padding: 10,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
  },

  // --- HEADERS ---
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    backgroundColor: colors.primary,
    padding: "8 12",
  },
  stageHeader: {
    padding: "6 10",
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 3,
  },
  textStage: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[300],
  },
  textGroup: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[800],
  },

  // --- CONFIG CONTINUATION HEADER (NEW) ---
  configContinuationHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 6,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#f1f5f9", // Slate-100
    borderWidth: 1,
    borderColor: colors.gray[300],
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  configContinuationText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[800],
  },
  pointRangeText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[600],
    marginLeft: "auto",
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },

  // --- STATS CARDS ---
  statsRow: {
    flexDirection: "row",
    gap: 5,
    marginBottom: 10,
  },
  statCard: {
    flex: 1,
    padding: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray[200],
    alignItems: "center",
  },
  statLabel: {
    fontSize: 5,
    color: colors.gray[500],
    textTransform: "uppercase",
    marginBottom: 2,
  },
  statValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[800],
  },

  // --- LEGEND ---
  legendRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
    padding: 6,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 4,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 6,
    color: colors.gray[600],
  },

  // --- MAIN RESULT BANNER ---
  resultBanner: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    padding: 8,
    borderWidth: 1,
    borderRadius: 4,
  },
  resultItem: { alignItems: "center" },
  resultLabel: { fontSize: 7, color: colors.gray[500], marginBottom: 2 },
  resultValue: { fontSize: 11, fontFamily: "Helvetica-Bold" },

  // --- TABLE (Detailed) ---
  tableContainer: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    minHeight: 14,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: colors.gray[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[300],
  },

  // --- SUMMARY TABLE (NEW STYLES) ---
  sumTable: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray[300],
  },
  sumHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#334155", // Dark Slate
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[300],
  },
  sumHeaderCell: {
    padding: 5,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.2)",
  },
  sumRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    minHeight: 16,
  },
  sumCell: {
    padding: 4,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: colors.gray[200],
  },
  sumTextHeader: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    textTransform: "uppercase",
  },
  sumText: { fontSize: 7, fontFamily: "Helvetica-Bold" },

  // Cell Commons
  cellCenter: { justifyContent: "center", alignItems: "center" },

  // Specific Columns
  colPoint: {
    width: 110,
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: colors.gray[300],
    justifyContent: "center",
  },
  colTol: {
    width: 22,
    padding: 1,
    borderRightWidth: 1,
    borderRightColor: colors.gray[300],
    justifyContent: "center",
    alignItems: "center",
  },

  // Size Wrapper
  sizeWrapper: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: colors.gray[300],
  },
  sizeTitleBox: {
    padding: 3,
    backgroundColor: "#e0e7ff", // Indigo 50
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[300],
  },

  // Sub Columns (Spec, Pcs)
  subColContainer: { flexDirection: "row", height: "100%" },
  subColSpec: {
    backgroundColor: "#eff6ff", // Blue 50
    borderRightWidth: 1,
    borderRightColor: colors.gray[200],
    justifyContent: "center",
    alignItems: "center",
  },
  subColPcs: {
    borderRightWidth: 1,
    borderRightColor: colors.gray[200],
    justifyContent: "center",
    alignItems: "center",
  },

  // Text Styles
  textPoint: {
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[700],
    flexWrap: "wrap", // ADD THIS - enables text wrapping
    lineHeight: 1.3, // ADD THIS - better line spacing for wrapped text
  },
  textTol: { fontSize: 5, color: colors.gray[500] },
  textTolMinus: {
    fontSize: 5,
    color: colors.danger,
    fontFamily: "Helvetica-Bold",
  },
  textTolPlus: {
    fontSize: 5,
    color: colors.success,
    fontFamily: "Helvetica-Bold",
  },
  textSizeTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[800],
    textAlign: "center",
  },
  textSubHeader: {
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[600],
  },
  textData: { fontSize: 6, fontFamily: "Helvetica" },
  textDataBold: { fontSize: 6, fontFamily: "Helvetica-Bold" },
});

// =============================================================================
// HELPER: UTILITIES
// =============================================================================

const cleanText = (str) => {
  if (str === null || str === undefined) return "";
  let s = String(str);

  // === HTML ENTITIES (handle first before other replacements) ===
  s = s.replace(/&lt;/gi, "<");
  s = s.replace(/&gt;/gi, ">");
  s = s.replace(/&amp;/gi, "&");
  s = s.replace(/&nbsp;/gi, " ");
  s = s.replace(/&quot;/gi, '"');
  s = s.replace(/&apos;/gi, "'");
  s = s.replace(/&#39;/gi, "'");
  s = s.replace(/&#x27;/gi, "'");
  s = s.replace(/&ndash;/gi, "-");
  s = s.replace(/&mdash;/gi, "-");
  s = s.replace(/&copy;/gi, "(c)");
  s = s.replace(/&reg;/gi, "(R)");
  s = s.replace(/&trade;/gi, "(TM)");
  s = s.replace(/&deg;/gi, " deg");
  s = s.replace(/&#\d+;/g, ""); // Remove any remaining numeric HTML entities

  // === UNICODE MATH SYMBOLS ===
  s = s.replace(/≤/g, "<=");
  s = s.replace(/≥/g, ">=");
  s = s.replace(/≠/g, "!=");
  s = s.replace(/±/g, "+/-");
  s = s.replace(/×/g, "x");
  s = s.replace(/÷/g, "/");
  s = s.replace(/−/g, "-"); // Unicode minus sign
  s = s.replace(/–/g, "-"); // En dash
  s = s.replace(/—/g, "-"); // Em dash
  s = s.replace(/′/g, "'"); // Prime
  s = s.replace(/″/g, '"'); // Double prime
  s = s.replace(/°/g, " deg"); // Degree symbol
  s = s.replace(/µ/g, "u"); // Micro sign
  s = s.replace(/·/g, "."); // Middle dot
  s = s.replace(/…/g, "..."); // Ellipsis
  s = s.replace(/™/g, "(TM)");
  s = s.replace(/®/g, "(R)");
  s = s.replace(/©/g, "(c)");

  // === LESS THAN / GREATER THAN VARIATIONS ===
  s = s.replace(/＜/g, "<"); // Fullwidth less-than
  s = s.replace(/＞/g, ">"); // Fullwidth greater-than
  s = s.replace(/‹/g, "<"); // Single left angle quote
  s = s.replace(/›/g, ">"); // Single right angle quote
  s = s.replace(/«/g, "<<"); // Left double angle quote
  s = s.replace(/»/g, ">>"); // Right double angle quote

  // === UNICODE FRACTIONS ===
  s = s
    .replace(/¼/g, " 1/4")
    .replace(/½/g, " 1/2")
    .replace(/¾/g, " 3/4")
    .replace(/⅛/g, " 1/8")
    .replace(/⅜/g, " 3/8")
    .replace(/⅝/g, " 5/8")
    .replace(/⅞/g, " 7/8")
    .replace(/⅙/g, " 1/6")
    .replace(/⅚/g, " 5/6")
    .replace(/⅓/g, " 1/3")
    .replace(/⅔/g, " 2/3");

  // Replace fraction slash characters
  s = s.replace(/[\u2044\u2215]/g, "/");

  // Replace fancy quotes
  s = s.replace(/[""„]/g, '"').replace(/[''‚]/g, "'");

  // FIX: Convert mixed number hyphen to space
  // Pattern: digit followed by hyphen followed by fraction (numerator/denominator)
  s = s.replace(/(\d)-(\d+\/\d+)/g, "$1 $2");

  // Remove any remaining problematic unicode characters (non-printable, control chars)
  // Keep basic ASCII printable (0x20-0x7E) and common extended chars
  s = s.replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "");

  // Clean up multiple spaces
  s = s.replace(/\s+/g, " ").trim();

  return s;
};

// =============================================================================
// TOLERANCE DISPLAY NORMALIZATION
// =============================================================================

/**
 * Normalize Tol- for DISPLAY: Always show as negative value
 * - If value is "-1/2" → display "-1/2"
 * - If value is "1/2" → display "-1/2"
 * - If value is "+1/2" → display "-1/2"
 * - If value is "0" → display "0"
 */
const normalizeTolMinusDisplay = (value) => {
  // 1. Clean unicode fractions first! (e.g., converts '⅛' to '1/8')
  let strVal = cleanText(value);

  if (!strVal || strVal === "-") {
    return "-";
  }

  // 2. Handle zero cases
  if (strVal === "0" || strVal === "-0" || strVal === "+0") {
    return "0";
  }

  // 3. Remove any existing sign (+ or -) so we don't get double signs (e.g. --1/4)
  strVal = strVal.replace(/^[+-]\s*/, "").trim();

  // If empty after removing sign, return dash
  if (!strVal) {
    return "-";
  }

  // 4. Force Negative sign logic
  return `-${strVal}`;
};

/**
 * Normalize Tol+ for DISPLAY: Always show as positive value
 * Handles mixed numbers with hyphen separator
 */
const normalizeTolPlusDisplay = (value) => {
  // 1. Clean unicode fractions and formatting first using the helper
  let strVal = cleanText(value);

  if (!strVal || strVal === "-") {
    return "-";
  }

  // 2. Handle zero cases
  if (strVal === "0" || strVal === "-0" || strVal === "+0") {
    return "0";
  }

  // 3. Remove any existing signs (+ or -)
  strVal = strVal.replace(/^[+-]\s*/, "").trim();

  if (!strVal) return "-";

  // 4. Return without sign (positive)
  return strVal;
};

/**
 * Normalize decimal tolerance for CALCULATION: Always use absolute value
 */
const normalizeToleranceDecimal = (value) => {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  // If it's already a number, use it directly
  const num = typeof value === "number" ? value : parseFloat(value);

  if (isNaN(num)) {
    return 0;
  }

  return Math.abs(num);
};

// =============================================================================
// HELPER: OTHER UTILITIES
// =============================================================================

const getUniqueRows = (allSpecs) => {
  if (!allSpecs) return [];
  const seen = new Set();
  const unique = [];
  allSpecs.forEach((spec) => {
    const name = (spec.MeasurementPointEngName || "").trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      unique.push(spec);
    }
  });
  return unique;
};

const getSpecDetailsForSize = (rowName, size, allSpecs) => {
  const matchedSpecEntry = allSpecs.find(
    (s) =>
      (s.MeasurementPointEngName || "").trim() === rowName &&
      s.Specs?.some((sz) => sz.size === size),
  );
  if (!matchedSpecEntry)
    return {
      decimal: null,
      fraction: "-",
      tolPlus: "-",
      tolMinus: "-",
      tolPlusDec: 0,
      tolMinusDec: 0,
    };

  const targetObj = matchedSpecEntry.Specs.find((s) => s.size === size);
  const tolPlus = matchedSpecEntry.TolPlus?.fraction || "-";
  const tolMinus = matchedSpecEntry.TolMinus?.fraction || "-";
  const tolPlusDec = matchedSpecEntry.TolPlus?.decimal;
  const tolMinusDec = matchedSpecEntry.TolMinus?.decimal;

  return {
    decimal: targetObj?.decimal,
    fraction: targetObj?.fraction || "-",
    tolPlus,
    tolMinus,
    tolPlusDec,
    tolMinusDec,
  };
};

/**
 * Check if measured value (deviation) is within tolerance range
 * The measured value is a deviation from spec, so we compare directly against [-|TolMinus|, +|TolPlus|]
 *
 * @param {number|string} measuredValue - The measured deviation value (decimal)
 * @param {number|string} tolPlusVal - Tolerance plus (decimal)
 * @param {number|string} tolMinusVal - Tolerance minus (decimal)
 */
const checkTolerance = (measuredValue, tolPlusVal, tolMinusVal) => {
  // Empty/zero/null values are considered within tolerance
  if (
    measuredValue === 0 ||
    measuredValue === "" ||
    measuredValue === null ||
    measuredValue === undefined
  ) {
    return { isWithin: true, status: "Empty" };
  }

  const reading =
    typeof measuredValue === "number"
      ? measuredValue
      : parseFloat(measuredValue);

  // If we can't parse reading, consider it valid (default pass)
  if (isNaN(reading)) {
    return { isWithin: true, status: "Invalid" };
  }

  // Use absolute values for tolerance calculation
  const tPlus = normalizeToleranceDecimal(tolPlusVal);
  const tMinus = normalizeToleranceDecimal(tolMinusVal);

  // The measured value is a deviation from spec
  // Range: [-|TolMinus|, +|TolPlus|]
  const lowerLimit = -tMinus;
  const upperLimit = tPlus;

  // Check if reading is within range
  const epsilon = 0.0001;
  const isWithin =
    reading >= lowerLimit - epsilon && reading <= upperLimit + epsilon;

  return {
    isWithin,
    lowerLimit,
    upperLimit,
    reading,
    tPlus,
    tMinus,
  };
};

const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

/**
 * Sort sizes based on a reference SizeList order
 * Sizes not in SizeList will be placed at the end, sorted alphabetically
 * @param {string[]} sizes - Array of size strings to sort
 * @param {string[]} sizeList - Reference order from DtOrder.SizeList
 * @returns {string[]} Sorted sizes array
 */
const sortSizesByReference = (sizes, sizeList = []) => {
  if (!sizeList || sizeList.length === 0) {
    // Fallback to natural sort if no reference list
    return [...sizes].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true }),
    );
  }

  // Create a map for quick index lookup
  const orderMap = new Map();
  sizeList.forEach((size, index) => {
    orderMap.set(size, index);
  });

  return [...sizes].sort((a, b) => {
    const indexA = orderMap.has(a) ? orderMap.get(a) : Infinity;
    const indexB = orderMap.has(b) ? orderMap.get(b) : Infinity;

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

// =============================================================================
// HELPER: Config Summary Logic
// =============================================================================
const getConfigResult = (measurements) => {
  if (!measurements || measurements.length === 0) return "PASS";
  const hasFail = measurements.some((m) => m.inspectorDecision === "fail");
  return hasFail ? "FAIL" : "PASS";
};

// =============================================================================
// COMPONENT: Config Summary Table
// =============================================================================
const ConfigSummaryTable = ({ groupedData, sizeList = [] }) => {
  if (!groupedData?.groups?.length && !groupedData?.noContext?.length) {
    return null;
  }

  // Combine groups
  const allGroups = [
    ...groupedData.groups,
    ...(groupedData.noContext.length > 0
      ? [
          {
            id: "noContext",
            lineName: "",
            tableName: "",
            colorName: "General",
            measurements: groupedData.noContext,
          },
        ]
      : []),
  ];

  // Get all unique sizes
  const allSizes = new Set();
  allGroups.forEach((group) => {
    group.measurements.forEach((m) => {
      if (m.size) allSizes.add(m.size);
    });
  });
  // Use sortSizesByReference instead of alphabetical sort
  const sortedSizes = sortSizesByReference(Array.from(allSizes), sizeList);

  return (
    <View style={styles.sumTable} wrap={false}>
      {/* Header */}
      <View style={styles.sumHeaderRow}>
        <View
          style={[
            styles.sumHeaderCell,
            { flex: 2, alignItems: "flex-start", paddingLeft: 8 },
          ]}
        >
          <Text style={styles.sumTextHeader}>Configuration</Text>
        </View>
        {sortedSizes.map((size) => (
          <View key={size} style={[styles.sumHeaderCell, { flex: 1 }]}>
            <Text style={styles.sumTextHeader}>{size}</Text>
          </View>
        ))}
        <View
          style={[
            styles.sumHeaderCell,
            { flex: 1, backgroundColor: "#4338ca" },
          ]}
        >
          <Text style={styles.sumTextHeader}>Result</Text>
        </View>
      </View>

      {/* Rows */}
      {allGroups.map((group, idx) => {
        const configLabel =
          [
            group.lineName ? `Line ${group.lineName}` : null,
            group.tableName ? `Table ${group.tableName}` : null,
            group.colorName || null,
          ]
            .filter(Boolean)
            .join(" / ") || "General";

        const overallResult = getConfigResult(group.measurements);

        return (
          <View
            key={idx}
            style={[
              styles.sumRow,
              { backgroundColor: idx % 2 === 0 ? "#FFFFFF" : "#f8fafc" },
            ]}
          >
            {/* Config Name */}
            <View
              style={[
                styles.sumCell,
                { flex: 2, alignItems: "flex-start", paddingLeft: 8 },
              ]}
            >
              <Text style={[styles.sumText, { color: colors.gray[800] }]}>
                {cleanText(configLabel)}
              </Text>
            </View>

            {/* Size Columns */}
            {sortedSizes.map((size) => {
              const m = group.measurements.find((m) => m.size === size);
              let content = "-";
              let bg = {};
              let color = colors.gray[400];

              if (m) {
                const isPass = m.inspectorDecision === "pass";
                content = isPass ? "PASS" : "FAIL";
                bg = isPass
                  ? { backgroundColor: colors.successBg }
                  : { backgroundColor: colors.dangerBg };
                color = isPass ? colors.success : colors.danger;
              }

              return (
                <View key={size} style={[styles.sumCell, bg, { flex: 1 }]}>
                  <Text style={[styles.sumText, { color }]}>{content}</Text>
                </View>
              );
            })}

            {/* Overall Result */}
            <View
              style={[
                styles.sumCell,
                {
                  flex: 1,
                  backgroundColor:
                    overallResult === "PASS"
                      ? colors.successBg
                      : colors.dangerBg,
                },
              ]}
            >
              <Text
                style={[
                  styles.sumText,
                  {
                    color:
                      overallResult === "PASS" ? colors.success : colors.danger,
                  },
                ]}
              >
                {overallResult}
              </Text>
            </View>
          </View>
        );
      })}
    </View>
  );
};

const MeasurementLegend = () => (
  <View style={styles.legendRow} wrap={false}>
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: colors.success }]} />
      <Text style={styles.legendText}>Pass (Within Tol)</Text>
    </View>
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
      <Text style={styles.legendText}>Fail (Out of Tol)</Text>
    </View>
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: "#a855f7" }]} />
      <Text style={styles.legendText}>A = All Points</Text>
    </View>
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: "#f59e0b" }]} />
      <Text style={styles.legendText}>C = Critical Pcs</Text>
    </View>
  </View>
);

// =============================================================================
// COMPONENT: Config Page Header (for continuation pages)
// =============================================================================
const ConfigPageHeader = ({
  configLabel,
  groupKValue,
  qcUser,
  startPoint,
  endPoint,
  totalPoints,
  isFirstPage,
  stageName,
  sizeChunkLabel, // NEW
  isNewSizeChunk, // NEW
}) => (
  <View style={styles.configContinuationHeader} wrap={false}>
    {/* Stage indicator badge */}
    {!isFirstPage && stageName && (
      <View
        style={{
          backgroundColor: stageName === "Before" ? "#8b5cf6" : "#14b8a6",
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 3,
          marginRight: 8,
        }}
      >
        <Text
          style={{
            fontSize: 6,
            color: "#FFFFFF",
            fontFamily: "Helvetica-Bold",
          }}
        >
          {stageName === "Before" ? "BEFORE" : "AFTER"}
        </Text>
      </View>
    )}

    {/* NEW: Size chunk indicator for new size chunks */}
    {isNewSizeChunk && sizeChunkLabel && (
      <View
        style={{
          backgroundColor: "#e0e7ff",
          paddingHorizontal: 6,
          paddingVertical: 2,
          borderRadius: 3,
          marginRight: 8,
        }}
      >
        <Text
          style={{
            fontSize: 6,
            color: colors.primary,
            fontFamily: "Helvetica-Bold",
          }}
        >
          [{sizeChunkLabel}]
        </Text>
      </View>
    )}

    {/* Config Label */}
    <Text style={styles.configContinuationText}>{cleanText(configLabel)}</Text>

    {/* K-Value */}
    {groupKValue && (
      <Text
        style={{
          fontSize: 9,
          color: colors.primary,
          marginLeft: 6,
          fontFamily: "Helvetica-Bold",
        }}
      >
        (K: {groupKValue})
      </Text>
    )}

    {/* QC User */}
    {qcUser && (
      <Text
        style={{
          fontSize: 8,
          color: colors.gray[500],
          marginLeft: 8,
        }}
      >
        (QC: {cleanText(qcUser.eng_name)})
      </Text>
    )}

    {/* Size info for continuation pages (non-new size chunks) */}
    {!isNewSizeChunk && sizeChunkLabel && (
      <Text
        style={{
          fontSize: 7,
          color: colors.primary,
          marginLeft: 8,
          fontFamily: "Helvetica-Bold",
        }}
      >
        [{sizeChunkLabel}]
      </Text>
    )}

    {/* Point Range - Right aligned */}
    <Text style={styles.pointRangeText}>
      Points: {startPoint}-{endPoint} (Total: {totalPoints})
    </Text>
  </View>
);

// =============================================================================
// COMPONENT: Measurement Table Chunk (Modified to accept rowChunk)
// =============================================================================
const MeasurementTableChunk = ({
  sizeChunk,
  measurements,
  rowChunk, // Changed from uniqueRows to rowChunk - only renders subset of rows
  allSpecs,
  criticalSpecIds = new Set(),
  startPoint, // NEW: starting point number for display
}) => {
  if (!sizeChunk.length || !rowChunk.length) return null;

  const sizeColumnConfigs = sizeChunk.map((size) => {
    const m = measurements.find((meas) => meas.size === size);
    const allPcs = Array.from(m?.allEnabledPcs || []).sort((a, b) => a - b);
    const critPcs = Array.from(m?.criticalEnabledPcs || []).sort(
      (a, b) => a - b,
    );
    const columns = [];

    // Add All columns with A prefix (A#1, A#2, A#3...)
    allPcs.forEach((pIdx, aIdx) =>
      columns.push({
        type: "all",
        idx: pIdx,
        label: `A#${aIdx + 1}`,
      }),
    );

    // Add Critical columns with C prefix (C#1, C#2, C#3...)
    critPcs.forEach((pIdx, cIdx) =>
      columns.push({
        type: "crit",
        idx: pIdx,
        label: `C#${cIdx + 1}`,
      }),
    );

    if (columns.length === 0) columns.push({ type: "empty", label: "-" });

    return { size, measurement: m, cols: columns };
  });

  return (
    <View style={styles.tableContainer} wrap={false}>
      {/* Header Row */}
      <View style={styles.tableHeaderRow}>
        <View style={styles.colPoint}>
          <Text style={styles.textPoint}>Measurement Point</Text>
        </View>
        <View style={styles.colTol}>
          <Text style={styles.textTolMinus}>Tol -</Text>
        </View>
        <View style={styles.colTol}>
          <Text style={styles.textTolPlus}>Tol +</Text>
        </View>
        {sizeColumnConfigs.map((config, idx) => (
          <View key={idx} style={styles.sizeWrapper}>
            <View style={styles.sizeTitleBox}>
              <Text style={styles.textSizeTitle}>{config.size}</Text>
              {config.measurement?.kValue && (
                <Text
                  style={{
                    fontSize: 5,
                    textAlign: "center",
                    color: colors.primary,
                  }}
                >
                  K: {config.measurement.kValue}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Sub Header Row (Spec, #1, #2, etc.) */}
      <View
        style={[
          styles.tableRow,
          { backgroundColor: colors.gray[50], minHeight: 12 },
        ]}
      >
        <View style={styles.colPoint} />
        <View style={styles.colTol} />
        <View style={styles.colTol} />
        {sizeColumnConfigs.map((config, idx) => {
          const colWidthPct = 100 / (1 + config.cols.length);
          return (
            <View
              key={idx}
              style={[styles.sizeWrapper, styles.subColContainer]}
            >
              <View style={[styles.subColSpec, { width: `${colWidthPct}%` }]}>
                <Text style={[styles.textSubHeader, { color: colors.primary }]}>
                  Spec
                </Text>
              </View>
              {config.cols.map((col, cIdx) => (
                <View
                  key={cIdx}
                  style={[
                    styles.subColPcs,
                    {
                      width: `${colWidthPct}%`,
                      backgroundColor:
                        col.type === "all"
                          ? "#f3e8ff"
                          : col.type === "crit"
                            ? "#ffedd5"
                            : "transparent",
                    },
                  ]}
                >
                  <Text style={styles.textSubHeader}>{col.label}</Text>
                </View>
              ))}
            </View>
          );
        })}
      </View>

      {/* Data Rows - Now using rowChunk instead of uniqueRows */}
      {rowChunk.map((rowSpec, rIdx) => {
        // Check if this spec is critical
        const isCritical = criticalSpecIds.has(rowSpec.id);

        // Get tolerance values for display (use first size chunk for display)
        const firstSizeDetails = getSpecDetailsForSize(
          rowSpec.MeasurementPointEngName,
          sizeChunk[0],
          allSpecs,
        );

        // Normalize tolerance display values
        const displayTolMinus = normalizeTolMinusDisplay(
          firstSizeDetails.tolMinus,
        );
        const displayTolPlus = normalizeTolPlusDisplay(
          firstSizeDetails.tolPlus,
        );

        // Row background color - critical rows get light blue
        const rowBgColor = isCritical
          ? "#dbeafe" // Blue-100 for critical
          : rIdx % 2 === 0
            ? "#FFFFFF"
            : "#F9FAFB";

        // Point cell background - critical gets slightly different shade
        const pointCellBg = isCritical ? "#bfdbfe" : rowBgColor; // Blue-200 for critical point cell

        // Calculate the actual point number (for display if needed)
        const pointNumber = startPoint ? startPoint + rIdx : rIdx + 1;

        return (
          <View
            key={rIdx}
            style={[styles.tableRow, { backgroundColor: rowBgColor }]}
          >
            {/* Point Name - with critical indicator and point number */}
            <View style={[styles.colPoint, { backgroundColor: pointCellBg }]}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  flexWrap: "wrap",
                }}
              >
                {/* Point Number */}
                <Text
                  style={{
                    fontSize: 4,
                    color: colors.gray[400],
                    marginRight: 2,
                    minWidth: 8,
                  }}
                >
                  {pointNumber}.
                </Text>
                {isCritical && (
                  <Text
                    style={{
                      fontSize: 5,
                      color: "#2563eb",
                      marginRight: 1,
                    }}
                  >
                    [C]
                  </Text>
                )}
                <Text style={[styles.textPoint, { flex: 1 }]}>
                  {cleanText(rowSpec.MeasurementPointEngName)}
                </Text>
              </View>
            </View>

            {/* Tol - (Always show as negative) */}
            <View style={styles.colTol}>
              <Text style={styles.textTolMinus}>{displayTolMinus}</Text>
            </View>

            {/* Tol + (Always show as positive) */}
            <View style={styles.colTol}>
              <Text style={styles.textTolPlus}>{displayTolPlus}</Text>
            </View>

            {/* Size Data Columns */}
            {sizeColumnConfigs.map((config, sIdx) => {
              const colWidthPct = 100 / (1 + config.cols.length);

              // Get spec details for this size
              const details = getSpecDetailsForSize(
                (rowSpec.MeasurementPointEngName || "").trim(),
                config.size,
                allSpecs,
              );

              // Find the matched spec entry for tolerance decimals
              const matchedSpecEntry = allSpecs.find(
                (s) =>
                  (s.MeasurementPointEngName || "").trim() ===
                    (rowSpec.MeasurementPointEngName || "").trim() &&
                  s.Specs?.some((sz) => sz.size === config.size),
              );

              const tolPlusDec = matchedSpecEntry?.TolPlus?.decimal;
              const tolMinusDec = matchedSpecEntry?.TolMinus?.decimal;

              return (
                <View
                  key={sIdx}
                  style={[styles.sizeWrapper, styles.subColContainer]}
                >
                  {/* Spec Value Cell */}
                  <View
                    style={[styles.subColSpec, { width: `${colWidthPct}%` }]}
                  >
                    <Text
                      style={[styles.textDataBold, { color: colors.primary }]}
                    >
                      {cleanText(details.fraction)}
                    </Text>
                  </View>

                  {/* Measurement Reading Cells */}
                  {config.cols.map((col, cIdx) => {
                    let displayVal = "-";
                    let bgStyle = {};
                    let textStyle = { color: colors.gray[300] };

                    if (col.type !== "empty" && config.measurement) {
                      const dataSource =
                        col.type === "all"
                          ? config.measurement.allMeasurements
                          : config.measurement.criticalMeasurements;

                      const effectiveSpecId = matchedSpecEntry
                        ? matchedSpecEntry.id
                        : rowSpec.id;

                      const reading = dataSource?.[effectiveSpecId]?.[col.idx];

                      if (reading && reading.decimal !== undefined) {
                        displayVal = cleanText(reading.fraction);

                        // FIX: Check tolerance using deviation comparison (no target needed)
                        const check = checkTolerance(
                          reading.decimal,
                          tolPlusDec,
                          tolMinusDec,
                        );

                        if (check.isWithin) {
                          // Within tolerance - Light Green
                          bgStyle = { backgroundColor: colors.successBg };
                          textStyle = { color: colors.success };
                        } else {
                          // Out of tolerance - Light Red
                          bgStyle = { backgroundColor: colors.dangerBg };
                          textStyle = {
                            color: colors.danger,
                            fontFamily: "Helvetica-Bold",
                          };
                        }
                      }
                    }

                    return (
                      <View
                        key={cIdx}
                        style={[
                          styles.subColPcs,
                          bgStyle,
                          { width: `${colWidthPct}%` },
                        ]}
                      >
                        <Text style={[styles.textData, textStyle]}>
                          {displayVal}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>
        );
      })}
    </View>
  );
};

// =============================================================================
// COMPONENT: Stats Cards
// =============================================================================
const calculateGroupStats = (measurements, allSpecs) => {
  let totalPoints = 0,
    passPoints = 0,
    failPoints = 0,
    totalPcs = 0,
    passPcs = 0,
    failPcs = 0;

  measurements.forEach((m) => {
    const allPcs = Array.from(m.allEnabledPcs || []);
    const critPcs = Array.from(m.criticalEnabledPcs || []);
    const pcsIndices = [...allPcs, ...critPcs];

    const applicableSpecs = allSpecs.filter((s) =>
      s.Specs?.some((sz) => sz.size === m.size),
    );

    pcsIndices.forEach((pcsIndex) => {
      totalPcs++;
      let pcsHasFail = false;

      applicableSpecs.forEach((spec) => {
        let valObj = null;
        if (allPcs.includes(pcsIndex))
          valObj = m.allMeasurements?.[spec.id]?.[pcsIndex];
        else if (critPcs.includes(pcsIndex))
          valObj = m.criticalMeasurements?.[spec.id]?.[pcsIndex];

        if (valObj && valObj.decimal !== undefined) {
          totalPoints++;
          const tolPlus = spec.TolPlus?.decimal;
          const tolMinus = spec.TolMinus?.decimal;

          // Check tolerance using deviation comparison (no target needed)
          const check = checkTolerance(valObj.decimal, tolPlus, tolMinus);

          if (check.isWithin) passPoints++;
          else {
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

const MeasurementStatsCards = ({ stats }) => (
  <View style={styles.statsRow} wrap={false}>
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>Total Pts</Text>
      <Text style={[styles.statValue, { color: colors.primary }]}>
        {stats.totalPoints}
      </Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>Fail Pts</Text>
      <Text style={[styles.statValue, { color: colors.danger }]}>
        {stats.failPoints}
      </Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>Pt Pass %</Text>
      <Text style={[styles.statValue, { color: colors.success }]}>
        {stats.pointPassRate}%
      </Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>Total Pcs</Text>
      <Text style={[styles.statValue, { color: "#6366f1" }]}>
        {stats.totalPcs}
      </Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>Fail Pcs</Text>
      <Text style={[styles.statValue, { color: colors.warning }]}>
        {stats.failPcs}
      </Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>Pcs Pass %</Text>
      <Text style={[styles.statValue, { color: "#10b981" }]}>
        {stats.pcsPassRate}%
      </Text>
    </View>
  </View>
);

// =============================================================================
// PAGINATION CONSTANTS
// =============================================================================
const ROWS_FIRST_PAGE = 20; // First page has summary table + stats, so fewer rows
const ROWS_CONTINUATION_PAGE = 30; // Continuation pages can have more rows
const SIZES_PER_TABLE = 2; // Max 2 sizes per table for readability

// =============================================================================
// MAIN EXPORT
// =============================================================================
const MeasurementSectionPDF = ({
  measurementStageData,
  measurementResult,
  sizeList = [],
  // NEW: Props from parent for page generation
  reportData,
  orderNo,
  HeaderComponent,
  FooterComponent,
  pageStyle,
}) => {
  if (!measurementStageData || measurementStageData.length === 0) return null;

  // ==========================================================================
  // PRE-CALCULATE ALL PAGES UPFRONT
  // ==========================================================================
  const allPages = [];

  measurementStageData.forEach((stageData, sIdx) => {
    const rawSpecs = stageData.specs?.full || [];

    // Add stage header page (with summary table)
    // This will be the first page for each stage
    let stageHeaderAdded = false;

    stageData.groupedData?.groups?.forEach((group, gIdx) => {
      const configLabel =
        [
          group.lineName ? `Line ${group.lineName}` : null,
          group.tableName ? `Table ${group.tableName}` : null,
          group.colorName ? group.colorName.toUpperCase() : null,
        ]
          .filter(Boolean)
          .join(" / ") || "General Configuration";

      const measurements = group.measurements || [];
      const groupKValue =
        measurements.length > 0 ? measurements[0].kValue : null;

      let activeSpecs = rawSpecs;
      if (stageData.stage === "Before") {
        if (groupKValue) {
          activeSpecs = rawSpecs.filter((s) => s.kValue === groupKValue);
        } else {
          const noKSpecs = rawSpecs.filter((s) => !s.kValue);
          if (noKSpecs.length > 0) activeSpecs = noKSpecs;
        }
      }
      if (activeSpecs.length === 0) activeSpecs = rawSpecs;

      const uniqueSizes = [...new Set(measurements.map((m) => m.size))];
      const sortedUniqueSizes = sortSizesByReference(uniqueSizes, sizeList);

      const stats = calculateGroupStats(measurements, activeSpecs);
      const uniqueRows = getUniqueRows(activeSpecs);
      const totalPoints = uniqueRows.length;

      const criticalSpecIds = new Set(
        (stageData.specs?.selected || []).map((s) => s.id),
      );

      // Chunk sizes (max 2 per table)
      const sizeChunks = chunkArray(sortedUniqueSizes, SIZES_PER_TABLE);

      // For each size chunk, create row chunks
      sizeChunks.forEach((sizeChunk, sizeChunkIdx) => {
        let rowOffset = 0;
        let pageInSizeChunk = 0;

        while (rowOffset < uniqueRows.length) {
          const isFirstPageOfConfig =
            sizeChunkIdx === 0 && pageInSizeChunk === 0;
          const maxRows = isFirstPageOfConfig
            ? ROWS_FIRST_PAGE
            : ROWS_CONTINUATION_PAGE;

          const rowChunk = uniqueRows.slice(rowOffset, rowOffset + maxRows);

          if (rowChunk.length > 0) {
            allPages.push({
              type: "measurement",
              stageData,
              stageIdx: sIdx,
              groupIdx: gIdx,
              group,
              configLabel,
              groupKValue,
              measurements,
              activeSpecs,
              stats,
              criticalSpecIds,
              sizeChunk,
              sizeChunkIdx,
              rowChunk,
              isFirstPageOfConfig,
              isFirstPageOfSizeChunk: pageInSizeChunk === 0,
              isNewSizeChunk: pageInSizeChunk === 0 && sizeChunkIdx > 0,
              startPoint: rowOffset + 1,
              endPoint: rowOffset + rowChunk.length,
              totalPoints,
              hasMultipleSizeChunks: sizeChunks.length > 1,
              // Include stage header info only for first page of first group
              includeStageHeader: !stageHeaderAdded && isFirstPageOfConfig,
              includeSummaryTable: !stageHeaderAdded && isFirstPageOfConfig,
              groupedData: stageData.groupedData,
            });

            if (!stageHeaderAdded && isFirstPageOfConfig) {
              stageHeaderAdded = true;
            }
          }

          rowOffset += maxRows;
          pageInSizeChunk++;
        }
      });
    });
  });

  // ==========================================================================
  // RENDER PAGES
  // ==========================================================================

  // If no HeaderComponent provided, render as Views (legacy mode)
  if (!HeaderComponent) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MEASUREMENT SUMMARY</Text>
        <View style={{ padding: 10 }}>
          <MeasurementLegend />
          {allPages.map((pageData, pageIdx) => (
            <View
              key={pageIdx}
              break={pageIdx > 0}
              wrap={false}
              style={{ marginBottom: 10 }}
            >
              <RenderMeasurementPageContent pageData={pageData} />
            </View>
          ))}
        </View>
      </View>
    );
  }

  // Render as separate Pages with Header/Footer
  return (
    <>
      {allPages.map((pageData, pageIdx) => (
        <Page key={pageIdx} size="A4" style={pageStyle}>
          <HeaderComponent reportData={reportData} orderNo={orderNo} />
          <FooterComponent />

          {/* Section title only on first page */}
          {pageIdx === 0 && (
            <View wrap={false} style={{ marginBottom: 8 }}>
              <Text style={styles.sectionTitle}>MEASUREMENT SUMMARY</Text>
              <View style={{ padding: 10, backgroundColor: colors.gray[50] }}>
                <MeasurementLegend />
              </View>
            </View>
          )}

          <View style={{ paddingHorizontal: 10 }}>
            <RenderMeasurementPageContent pageData={pageData} />
          </View>
        </Page>
      ))}
    </>
  );
};

// =============================================================================
// HELPER: Render Single Page Content
// =============================================================================
const RenderMeasurementPageContent = ({ pageData }) => {
  const {
    stageData,
    group,
    configLabel,
    groupKValue,
    measurements,
    activeSpecs,
    stats,
    criticalSpecIds,
    sizeChunk,
    rowChunk,
    isFirstPageOfConfig,
    startPoint,
    endPoint,
    totalPoints,
    hasMultipleSizeChunks,
    includeStageHeader,
    includeSummaryTable,
    groupedData,
    isNewSizeChunk,
  } = pageData;

  return (
    <View wrap={false}>
      {/* Stage Header (only on first page of stage) */}
      {includeStageHeader && (
        <View
          style={[
            styles.stageHeader,
            {
              backgroundColor:
                stageData.stage === "Before" ? "#8b5cf6" : "#14b8a6",
            },
          ]}
        >
          <Text style={styles.textStage}>{stageData.label}</Text>
        </View>
      )}

      {/* Summary Table (only on first page) */}
      {includeSummaryTable && groupedData && (
        <ConfigSummaryTable groupedData={groupedData} sizeList={[]} />
      )}

      {/* Config Header */}
      {isFirstPageOfConfig ? (
        <>
          <View style={styles.groupHeader}>
            <Text style={styles.textGroup}>{cleanText(configLabel)}</Text>
            {groupKValue && (
              <Text
                style={{
                  fontSize: 9,
                  color: colors.primary,
                  marginLeft: 6,
                  fontFamily: "Helvetica-Bold",
                }}
              >
                (K: {groupKValue})
              </Text>
            )}
            {group.qcUser && (
              <Text
                style={{
                  fontSize: 8,
                  color: colors.gray[500],
                  marginLeft: 8,
                }}
              >
                (QC: {cleanText(group.qcUser.eng_name)})
              </Text>
            )}
            {hasMultipleSizeChunks && (
              <Text
                style={{
                  fontSize: 7,
                  color: colors.primary,
                  marginLeft: 8,
                  fontFamily: "Helvetica-Bold",
                  backgroundColor: "#e0e7ff",
                  paddingHorizontal: 4,
                  paddingVertical: 1,
                  borderRadius: 2,
                }}
              >
                [{sizeChunk.join(", ")}]
              </Text>
            )}
            <Text
              style={{
                fontSize: 7,
                color: colors.gray[600],
                marginLeft: "auto",
                fontFamily: "Helvetica-Bold",
                backgroundColor: "#e2e8f0",
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: 3,
              }}
            >
              Points: {startPoint}-{endPoint} (Total: {totalPoints})
            </Text>
          </View>
          <MeasurementStatsCards stats={stats} />
        </>
      ) : (
        <ConfigPageHeader
          configLabel={configLabel}
          groupKValue={groupKValue}
          qcUser={group.qcUser}
          startPoint={startPoint}
          endPoint={endPoint}
          totalPoints={totalPoints}
          isFirstPage={false}
          stageName={stageData.stage}
          sizeChunkLabel={hasMultipleSizeChunks ? sizeChunk.join(", ") : null}
          isNewSizeChunk={isNewSizeChunk}
        />
      )}

      {/* Measurement Table */}
      <MeasurementTableChunk
        sizeChunk={sizeChunk}
        measurements={measurements}
        rowChunk={rowChunk}
        allSpecs={activeSpecs}
        criticalSpecIds={criticalSpecIds}
        startPoint={startPoint}
      />
    </View>
  );
};

export default MeasurementSectionPDF;
