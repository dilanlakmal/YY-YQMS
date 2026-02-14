import React, { useMemo, memo } from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

// =============================================================================
// STYLES
// =============================================================================
const colors = {
  primary: "#4338ca",
  text: "#1f2937",
  gray: "#9ca3af",
  border: "#e5e7eb",
  bgGreen: "#f0fdf4",
  textGreen: "#16a34a",
  bgRed: "#fef2f2",
  textRed: "#dc2626",
  bgGray: "#f9fafb",
  headerBg: "#f3f4f6",
  subHeaderBg: "#f9fafb",
  colSpecBg: "#eff6ff",
  colABg: "#fffbeb",
  colCBg: "#faf5ff",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 40,
    paddingHorizontal: 20,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
    fontSize: 8,
  },
  headerContainer: {
    marginBottom: 10,
    width: "100%",
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  factoryName: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
  },
  orderBadge: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 2,
    fontSize: 8,
  },
  headerInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 5,
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
    paddingBottom: 4,
  },
  infoTextGroup: {
    flexDirection: "row",
    gap: 15,
  },
  infoLabel: {
    color: "#6b7280",
    textTransform: "uppercase",
    fontSize: 7,
  },
  infoValue: {
    color: colors.text,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  mainTitle: {
    fontSize: 12,
    color: "#312e81",
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  configRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 5,
    backgroundColor: "#f8fafc",
    padding: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  configText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.text,
    textTransform: "uppercase",
  },
  stageBadge: {
    color: "#ffffff",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    marginLeft: 6,
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
  },
  tableContainer: {
    width: "100%",
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderColor: colors.border,
    marginBottom: 5,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    minHeight: 18,
    alignItems: "stretch",
  },
  headerRow: {
    backgroundColor: colors.headerBg,
  },
  // FIXED: Increased width for Point column
  colPoint: {
    width: 160,
    borderRightWidth: 1,
    borderColor: colors.border,
    padding: 3,
    justifyContent: "center",
  },
  // FIXED: Increased tolerance column width
  colTol: {
    width: 40,
    borderRightWidth: 1,
    borderColor: colors.border,
    padding: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  colSizeGroup: {
    flexGrow: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    flexDirection: "column",
  },
  // FIXED: Increased font sizes throughout
  cellText: {
    fontSize: 7,
    textAlign: "center",
  },
  cellTextBold: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  // FIXED: Increased Measurement Point font size
  cellPointText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "left",
  },
  // FIXED: Sub-columns properly aligned in single row
  subColRow: {
    flexDirection: "row",
    flexGrow: 1,
    alignItems: "center",
  },
  subColCell: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    padding: 2,
    minHeight: 16,
  },
  lastSubCol: {
    borderRightWidth: 0,
  },
  // FIXED: Header cell for A#, C# - prevent text wrapping
  subColHeaderCell: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    alignItems: "center",
    padding: 1,
    minHeight: 16,
  },
  // FIXED: Inline text style for headers - no wrap
  headerCellText: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    whiteSpace: "nowrap",
  },
  pageNumber: {
    position: "absolute",
    fontSize: 8,
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: "center",
    color: "#9ca3af",
  },
  // Loading indicator style
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

// =============================================================================
// HELPER FUNCTIONS - FIXED FRACTION HANDLING
// =============================================================================

// FIXED: Comprehensive fraction map for proper display
const fractionMap = {
  // Unicode fractions to ASCII
  "¼": "1/4",
  "½": "1/2",
  "¾": "3/4",
  "⅛": "1/8",
  "⅜": "3/8",
  "⅝": "5/8",
  "⅞": "7/8",
  "⅓": "1/3",
  "⅔": "2/3",
  "⅕": "1/5",
  "⅖": "2/5",
  "⅗": "3/5",
  "⅘": "4/5",
  "⅙": "1/6",
  "⅚": "5/6",
  "⅐": "1/7",
  "⅑": "1/9",
  "⅒": "1/10",
};

// FIXED: Robust text cleaner to prevent "1D2" or "d6" issues
const cleanText = (str) => {
  if (str === null || str === undefined) return "";
  let s = String(str);

  // Replace all known unicode fractions
  Object.keys(fractionMap).forEach((key) => {
    s = s.split(key).join(fractionMap[key]);
  });

  // Handle common encoding corruption patterns
  // Pattern: "1D4" should be "1/4", "1D2" should be "1/2"
  s = s.replace(/(\d)\s*[Dd]\s*(\d)/g, "$1/$2");

  // Pattern: "d6" should be "/6"
  s = s.replace(/^[Dd](\d)/g, "/$1");
  s = s.replace(/\s[Dd](\d)/g, " /$1");

  // Symbols replacement
  s = s.replace(/≤/g, "<=");
  s = s.replace(/≥/g, ">=");
  s = s.replace(/≠/g, "!=");
  s = s.replace(/±/g, "+/-");

  // Clean up multiple spaces
  s = s.replace(/\s+/g, " ");

  // Clean up dashes with spaces
  s = s.replace(/\s*-\s*/g, "-");

  // Replace unicode fraction slashes with regular slash
  s = s.replace(/\u2044/g, "/"); // Fraction slash (⁄)
  s = s.replace(/\u2215/g, "/"); // Division slash (∕)
  s = s.replace(/\u29F8/g, "/"); // Big solidus
  s = s.replace(/⁄/g, "/"); // Direct fraction slash

  // Remove any remaining non-printable characters
  s = s.replace(/[^\x20-\x7E\u00A0]/g, "");

  return s.trim();
};

// FIXED: Format spec fractions properly
const formatSpecFraction = (fractionStr) => {
  if (!fractionStr) return "-";
  let result = cleanText(fractionStr);

  // Add space between whole number and fraction: "1-1/2" -> "1 1/2"
  result = result.replace(/(\d)-(\d+\/\d+)/g, "$1 $2");

  // Replace regular spaces with non-breaking spaces to prevent line breaks
  result = result.replace(/ /g, "\u00A0");

  return result || "-";
};

// FIXED: Format tolerance display
const formatTolerance = (tolValue) => {
  if (!tolValue) return "-";

  const fraction = tolValue.fraction || tolValue;
  if (!fraction || fraction === "0" || fraction === 0) return "-";

  return cleanText(String(fraction));
};

const checkTolerance = (spec, value) => {
  if (value === 0 || value === "" || value === null || value === undefined) {
    return { isWithin: true, isDefault: true };
  }

  const reading = parseFloat(value);
  if (isNaN(reading)) return { isWithin: true, isDefault: true };

  const tolMinusDecimal = parseFloat(spec.TolMinus?.decimal);
  const tolPlusDecimal = parseFloat(spec.TolPlus?.decimal);

  if (isNaN(tolMinusDecimal) && isNaN(tolPlusDecimal)) {
    return { isWithin: true, isDefault: true };
  }

  const lowerLimit = isNaN(tolMinusDecimal) ? 0 : -Math.abs(tolMinusDecimal);
  const upperLimit = isNaN(tolPlusDecimal) ? 0 : Math.abs(tolPlusDecimal);
  const epsilon = 0.0001;
  const isWithin =
    reading >= lowerLimit - epsilon && reading <= upperLimit + epsilon;

  return { isWithin, isDefault: false };
};

// =============================================================================
// SUB-COMPONENT: Table Render - FIXED PCS HEADER ROW
// =============================================================================
const MeasurementTableChunk = memo(
  ({ config, stage, sizeChunk, rowChunk, measurements, criticalSpecIds }) => {
    // FIXED: Calculate max columns for consistent layout
    const columnInfo = useMemo(() => {
      return sizeChunk.map((size) => {
        const m = measurements.find((meas) => meas.size === size);
        const allCount = m?.allEnabledPcs?.length || 0;
        const critCount = m?.criticalEnabledPcs?.length || 0;
        return {
          size,
          allCount,
          critCount,
          totalCols: 1 + allCount + critCount,
        };
      });
    }, [sizeChunk, measurements]);

    return (
      <View wrap={false} style={{ marginBottom: 10 }}>
        {/* 1. Header: Size Names */}
        <View style={[styles.row, styles.headerRow, { minHeight: 14 }]}>
          <View style={[styles.colPoint, { backgroundColor: "#f3f4f6" }]}>
            <Text style={[styles.cellTextBold, { fontSize: 8 }]}>
              Measurement Point
            </Text>
          </View>
          <View style={styles.colTol}>
            <Text
              style={[
                styles.cellTextBold,
                { color: colors.textRed, fontSize: 7 },
              ]}
            >
              Tol -
            </Text>
          </View>
          <View style={styles.colTol}>
            <Text
              style={[
                styles.cellTextBold,
                { color: colors.textGreen, fontSize: 7 },
              ]}
            >
              Tol +
            </Text>
          </View>

          {sizeChunk.map((size, i) => (
            <View key={i} style={styles.colSizeGroup}>
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "#e0e7ff",
                  borderBottomWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={[
                    styles.cellTextBold,
                    { color: colors.primary, fontSize: 8 },
                  ]}
                >
                  {cleanText(size)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* 2. FIXED: Sub-Header in SINGLE ROW - Spec | A#1 | A#2 | C#1 */}
        <View
          style={[styles.row, { minHeight: 14, backgroundColor: "#f9fafb" }]}
        >
          <View style={styles.colPoint} />
          <View style={styles.colTol} />
          <View style={styles.colTol} />

          {columnInfo.map((info, i) => {
            const m = measurements.find((meas) => meas.size === info.size);
            const allPcs = m?.allEnabledPcs || [];
            const critPcs = m?.criticalEnabledPcs || [];

            return (
              <View
                key={i}
                style={[styles.colSizeGroup, { flexDirection: "row" }]}
              >
                {/* Spec Header */}
                <View
                  style={[
                    styles.subColHeaderCell,
                    { backgroundColor: colors.colSpecBg },
                  ]}
                >
                  <Text style={[styles.headerCellText, { color: "#2563eb" }]}>
                    Spec
                  </Text>
                </View>

                {/* FIXED: A Headers - All in single row */}
                {allPcs.map((pcsIdx, idx) => (
                  <View
                    key={`a-header-${idx}`}
                    style={[
                      styles.subColHeaderCell,
                      { backgroundColor: colors.colABg },
                    ]}
                  >
                    <Text style={[styles.headerCellText, { color: "#d97706" }]}>
                      {`A#${idx + 1}`}
                    </Text>
                  </View>
                ))}

                {/* FIXED: C Headers - All in single row */}
                {critPcs.map((pcsIdx, idx) => (
                  <View
                    key={`c-header-${idx}`}
                    style={[
                      styles.subColHeaderCell,
                      { backgroundColor: colors.colCBg },
                      idx === critPcs.length - 1 && styles.lastSubCol,
                    ]}
                  >
                    <Text style={[styles.headerCellText, { color: "#9333ea" }]}>
                      {`C#${idx + 1}`}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>

        {/* 3. Data Rows */}
        {rowChunk.map((spec, rIdx) => {
          const isCritical = criticalSpecIds.has(spec.id);
          const rowBg = isCritical
            ? "#eff6ff"
            : rIdx % 2 === 0
              ? "#ffffff"
              : "#f9fafb";

          return (
            <View
              key={spec.id}
              style={[styles.row, { backgroundColor: rowBg }]}
            >
              {/* Point Name - FIXED: Increased font size */}
              <View
                style={[
                  styles.colPoint,
                  { backgroundColor: isCritical ? "#dbeafe" : "transparent" },
                ]}
              >
                <Text style={styles.cellPointText}>
                  {isCritical && (
                    <Text style={{ color: colors.primary }}>* </Text>
                  )}
                  {cleanText(spec.MeasurementPointEngName)}
                </Text>
              </View>

              {/* FIXED: Tolerances with proper fraction display */}
              <View style={[styles.colTol, { backgroundColor: "#fef2f2" }]}>
                <Text style={[styles.cellTextBold, { color: colors.textRed }]}>
                  {formatTolerance(spec.TolMinus)}
                </Text>
              </View>
              <View style={[styles.colTol, { backgroundColor: "#f0fdf4" }]}>
                <Text
                  style={[styles.cellTextBold, { color: colors.textGreen }]}
                >
                  {formatTolerance(spec.TolPlus)}
                </Text>
              </View>

              {/* Values per Size */}
              {sizeChunk.map((size, sIdx) => {
                const m = measurements.find((meas) => meas.size === size);
                const sizeSpec = spec.Specs?.find((s) => s.size === size);

                // FIXED: Proper spec value display
                const specValDisplay = sizeSpec
                  ? formatSpecFraction(sizeSpec.fraction)
                  : "-";

                const allPcs = m?.allEnabledPcs || [];
                const critPcs = m?.criticalEnabledPcs || [];

                return (
                  <View
                    key={sIdx}
                    style={[styles.colSizeGroup, { flexDirection: "row" }]}
                  >
                    {/* Spec Value - FIXED */}
                    <View
                      style={[
                        styles.subColCell,
                        { backgroundColor: colors.colSpecBg },
                      ]}
                    >
                      <Text style={[styles.cellTextBold, { color: "#2563eb" }]}>
                        {specValDisplay}
                      </Text>
                    </View>

                    {/* A Readings */}
                    {allPcs.map((pcsIndex, idx) => {
                      const valObj = m?.allMeasurements?.[spec.id]?.[pcsIndex];
                      const decimal = valObj?.decimal || 0;
                      const fraction = valObj?.fraction || "-";
                      const check = checkTolerance(spec, decimal);

                      let textColor = colors.textRed;
                      let bgColor = colors.bgRed;

                      if (decimal === 0 || check.isWithin || check.isDefault) {
                        textColor = colors.textGreen;
                        bgColor = colors.bgGreen;
                      }

                      return (
                        <View
                          key={`val-a-${idx}`}
                          style={[
                            styles.subColCell,
                            { backgroundColor: bgColor },
                          ]}
                        >
                          <Text
                            style={[
                              styles.cellText,
                              {
                                color: textColor,
                                fontFamily: "Helvetica-Bold",
                              },
                            ]}
                          >
                            {cleanText(fraction)}
                          </Text>
                        </View>
                      );
                    })}

                    {/* C Readings */}
                    {critPcs.map((pcsIndex, idx) => {
                      const valObj =
                        m?.criticalMeasurements?.[spec.id]?.[pcsIndex];
                      const decimal = valObj?.decimal || 0;
                      const fraction = valObj?.fraction || "-";
                      const check = checkTolerance(spec, decimal);

                      let textColor = colors.textRed;
                      let bgColor = colors.bgRed;

                      if (fraction === "-") {
                        textColor = colors.gray;
                        bgColor = colors.bgGray;
                      } else if (
                        decimal === 0 ||
                        check.isWithin ||
                        check.isDefault
                      ) {
                        textColor = colors.textGreen;
                        bgColor = colors.bgGreen;
                      }

                      return (
                        <View
                          key={`val-c-${idx}`}
                          style={[
                            styles.subColCell,
                            { backgroundColor: bgColor },
                            idx === critPcs.length - 1 && styles.lastSubCol,
                          ]}
                        >
                          <Text
                            style={[
                              styles.cellText,
                              {
                                color: textColor,
                                fontFamily: "Helvetica-Bold",
                              },
                            ]}
                          >
                            {cleanText(fraction)}
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
  },
);

MeasurementTableChunk.displayName = "MeasurementTableChunk";

// =============================================================================
// PAGE COMPONENT - Memoized for performance
// =============================================================================
const ReportPage = memo(({ pageData, rIdx, pIdx, styleNo }) => {
  const { report, group, sizeChunk, rowChunk, measurements, criticalSpecIds } =
    pageData;

  return (
    <Page size="A4" orientation="landscape" style={styles.page}>
      {/* HEADER */}
      <View fixed style={styles.headerContainer}>
        <View style={styles.headerTopRow}>
          <Text style={styles.factoryName}>
            {cleanText(
              report.inspectionDetails?.factory ||
                "Yorkmars (Cambodia) Garment MFG Co., LTD",
            )}
          </Text>
          <View style={styles.orderBadge}>
            <Text>
              Order: {cleanText(report.orderNosString || styleNo || "")}
            </Text>
          </View>
        </View>

        <View style={styles.headerInfoRow}>
          <View style={styles.infoTextGroup}>
            <Text style={styles.infoLabel}>
              REPORT:{" "}
              <Text style={styles.infoValue}>
                {cleanText(report.reportType)}
              </Text>
            </Text>
            <Text style={styles.infoLabel}>
              DATE:{" "}
              <Text style={styles.infoValue}>
                {report.inspectionDate
                  ? new Date(report.inspectionDate).toLocaleDateString()
                  : "-"}
              </Text>
            </Text>
            <Text style={styles.infoLabel}>
              TYPE:{" "}
              <Text style={styles.infoValue}>
                {report.inspectionType === "first" ? "First" : "Re-Inspection"}
              </Text>
            </Text>
            <Text style={styles.infoLabel}>
              QA ID:{" "}
              <Text style={styles.infoValue}>{cleanText(report.qaId)}</Text>
            </Text>
          </View>
          <Text style={styles.mainTitle}>FINCHECK INSPECTION</Text>
        </View>
      </View>

      {/* CONFIG HEADER */}
      <View style={styles.configRow}>
        {/* Line */}
        {group.config.line && (
          <Text style={styles.configText}>
            Line: {cleanText(group.config.line)}
          </Text>
        )}

        {/* Table (if exists) */}
        {group.config.table && (
          <Text style={styles.configText}>
            {group.config.line ? " / " : ""}Table:{" "}
            {cleanText(group.config.table)}
          </Text>
        )}

        {/* Color */}
        {group.config.color && (
          <Text style={styles.configText}>
            {group.config.line || group.config.table ? " / " : ""}
            {cleanText(group.config.color)}
          </Text>
        )}

        {/* K Value */}
        {group.stage === "Before" && group.kValue && (
          <Text
            style={[
              styles.configText,
              { color: colors.primary, marginLeft: 5 },
            ]}
          >
            (K: {cleanText(group.kValue)})
          </Text>
        )}

        {/* Point Range */}
        <Text style={[styles.configText, { marginLeft: 8, color: "#6b7280" }]}>
          Points: {pageData.startPoint}-{pageData.endPoint} (Total:{" "}
          {pageData.totalPoints})
        </Text>

        {/* Stage Badge */}
        <Text
          style={[
            styles.stageBadge,
            {
              backgroundColor: group.stage === "Before" ? "#a855f7" : "#14b8a6",
            },
          ]}
        >
          {group.stage === "Before"
            ? "Before Wash Measurement"
            : "Buyer Spec Measurement"}
        </Text>
      </View>

      {/* TABLE CONTENT */}
      <MeasurementTableChunk
        config={group.config}
        stage={group.stage}
        sizeChunk={sizeChunk}
        rowChunk={rowChunk}
        measurements={measurements}
        criticalSpecIds={criticalSpecIds}
      />

      {/* FOOTER */}
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
        fixed
      />
    </Page>
  );
});

ReportPage.displayName = "ReportPage";

// =============================================================================
// MAIN DOCUMENT - With optimizations for large reports
// =============================================================================
const MeasurementReportPDF = ({ reports, specs, sizeList, styleNo }) => {
  // FIXED: Memoize all page calculations to prevent recalculation
  const allPages = useMemo(() => {
    const pages = [];

    if (!reports || !Array.isArray(reports)) {
      return pages;
    }

    reports.forEach((report, rIdx) => {
      try {
        if (!report?.hasMeasurementData) return;

        // Filter Manual Entries safely
        const cleanGroups = (report.measurementGroups || [])
          .map((group) => ({
            ...group,
            measurements: (group.measurements || []).filter(
              (m) => m?.size !== "Manual_Entry",
            ),
          }))
          .filter((g) => g.measurements && g.measurements.length > 0);

        cleanGroups.forEach((group) => {
          try {
            // 1. FILTER SPECS BY K-VALUE
            const rawFullSpecs =
              group.stage === "Before"
                ? specs?.Before?.full
                : specs?.After?.full;
            const rawCritSpecs =
              group.stage === "Before"
                ? specs?.Before?.selected
                : specs?.After?.selected;

            let fullSpecs = rawFullSpecs || [];
            let critSpecs = rawCritSpecs || [];

            if (group.stage === "Before") {
              if (group.kValue) {
                fullSpecs = fullSpecs.filter((s) => s?.kValue === group.kValue);
                critSpecs = critSpecs.filter((s) => s?.kValue === group.kValue);
              } else {
                fullSpecs = fullSpecs.filter((s) => !s?.kValue);
                critSpecs = critSpecs.filter((s) => !s?.kValue);
              }
            }

            if (fullSpecs.length === 0) return;

            const criticalSpecIds = new Set(
              critSpecs.map((s) => s?.id).filter(Boolean),
            );

            // 2. SORT MEASUREMENTS BY SIZE LIST
            const sortedMeasurements = [...group.measurements].sort((a, b) => {
              const idxA = sizeList?.indexOf(a?.size) ?? -1;
              const idxB = sizeList?.indexOf(b?.size) ?? -1;
              if (idxA !== -1 && idxB !== -1) return idxA - idxB;
              return (a?.size || "").localeCompare(b?.size || "", undefined, {
                numeric: true,
              });
            });

            const sortedSizes = sortedMeasurements
              .map((m) => m?.size)
              .filter(Boolean);

            if (sortedSizes.length === 0) return;

            // 3. CHUNK BY SIZE (Max 3 sizes per table)
            const MAX_SIZES_PER_TABLE = 3;
            const sizeChunks = [];
            for (let i = 0; i < sortedSizes.length; i += MAX_SIZES_PER_TABLE) {
              sizeChunks.push(sortedSizes.slice(i, i + MAX_SIZES_PER_TABLE));
            }

            // 4. CHUNK BY ROWS (Max 18 rows per page for better fit)
            const MAX_ROWS_PER_PAGE = 18;

            sizeChunks.forEach((sizeChunk, scIdx) => {
              const rowChunks = [];
              for (let i = 0; i < fullSpecs.length; i += MAX_ROWS_PER_PAGE) {
                rowChunks.push(fullSpecs.slice(i, i + MAX_ROWS_PER_PAGE));
              }

              rowChunks.forEach((rowChunk, rcIdx) => {
                // Calculate point range
                const startPoint = rcIdx * MAX_ROWS_PER_PAGE + 1;
                const endPoint = Math.min(
                  (rcIdx + 1) * MAX_ROWS_PER_PAGE,
                  fullSpecs.length,
                );
                const totalPoints = fullSpecs.length;
                pages.push({
                  report,
                  group,
                  sizeChunk,
                  rowChunk,
                  criticalSpecIds,
                  measurements: sortedMeasurements,
                  pageKey: `r${rIdx}-g${group.config?.line || "def"}-sc${scIdx}-rc${rcIdx}`,
                  rIdx,
                  pIdx: pages.length,
                  startPoint,
                  endPoint,
                  totalPoints,
                });
              });
            });
          } catch (groupError) {
            console.error("Error processing group:", groupError);
          }
        });
      } catch (reportError) {
        console.error("Error processing report:", reportError);
      }
    });

    return pages;
  }, [reports, specs, sizeList]);

  // FIXED: Handle empty or error states
  if (!allPages || allPages.length === 0) {
    return (
      <Document>
        <Page size="A4" orientation="landscape" style={styles.page}>
          <View style={styles.loadingContainer}>
            <Text style={{ fontSize: 14, color: colors.gray }}>
              No measurement data available
            </Text>
          </View>
        </Page>
      </Document>
    );
  }

  return (
    <Document
      title={`Measurement Report - ${styleNo || "Report"}`}
      author="FinCheck"
      subject="Inspection Measurement Report"
    >
      {allPages.map((pageData) => (
        <ReportPage
          key={pageData.pageKey}
          pageData={pageData}
          rIdx={pageData.rIdx}
          pIdx={pageData.pIdx}
          styleNo={styleNo}
        />
      ))}
    </Document>
  );
};

export default memo(MeasurementReportPDF);
