import React from "react";
import { Text, View, StyleSheet, Page } from "@react-pdf/renderer";

// =============================================================================
// STYLES
// =============================================================================
const colors = {
  primary: "#0891b2", // Cyan-600
  primaryDark: "#0e7490",
  success: "#15803d",
  successBg: "#dcfce7",
  successLight: "#f0fdf4",
  danger: "#b91c1c",
  dangerBg: "#fee2e2",
  dangerLight: "#fef2f2",
  warning: "#c2410c",
  warningBg: "#ffedd5",
  warningLight: "#fff7ed",
  purple: "#7c3aed",
  purpleBg: "#f3e8ff",
  purpleLight: "#faf5ff",
  indigo: "#4f46e5",
  indigoBg: "#e0e7ff",
  indigoLight: "#eef2ff",
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
  },
  critical: {
    bg: "#dbeafe",
    bgDark: "#bfdbfe",
  },
};

const styles = StyleSheet.create({
  // Page
  page: {
    padding: 20,
    paddingTop: 25,
    paddingBottom: 40,
    fontSize: 7,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
  },

  // Section Container
  section: {
    marginBottom: 12,
  },

  // Section Header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
  },
  headerStats: {
    flexDirection: "row",
    gap: 12,
  },
  headerStatItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  headerStatLabel: {
    fontSize: 7,
    color: "rgba(255,255,255,0.8)",
  },
  headerStatValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
  },

  // Page Header (for continuation pages)
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.gray[100],
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  pageHeaderTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[700],
  },
  pageHeaderSize: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
    backgroundColor: colors.primaryDark + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    marginLeft: 8,
  },
  pointRangeBadge: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[600],
    backgroundColor: colors.gray[200],
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },

  // Stats Cards
  statsContainer: {
    flexDirection: "row",
    gap: 8,
    padding: 10,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderTopWidth: 0,
    marginBottom: 8,
  },
  statCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 4,
  },
  statIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  statIconText: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  statContent: {},
  statLabel: {
    fontSize: 5,
    color: colors.gray[500],
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
    marginBottom: 1,
  },
  statValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },

  // Table
  tableContainer: {
    borderWidth: 1,
    borderColor: colors.gray[300],
    marginBottom: 8,
  },

  // Table Header
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: colors.gray[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[300],
    minHeight: 18,
  },
  subHeaderRow: {
    flexDirection: "row",
    backgroundColor: colors.gray[50],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[300],
    minHeight: 16,
  },

  // Table Data Row
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    minHeight: 14,
  },

  // Column Styles
  colPoint: {
    width: 100,
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: colors.gray[300],
    justifyContent: "center",
  },
  colTol: {
    width: 28,
    padding: 2,
    borderRightWidth: 1,
    borderRightColor: colors.gray[300],
    justifyContent: "center",
    alignItems: "center",
  },
  colData: {
    width: 22,
    padding: 1,
    borderRightWidth: 1,
    borderRightColor: colors.gray[200],
    justifyContent: "center",
    alignItems: "center",
  },
  colSizeHeader: {
    flex: 1,
    padding: 3,
    borderRightWidth: 1,
    borderRightColor: colors.gray[300],
    justifyContent: "center",
    alignItems: "center",
  },

  // Text Styles
  textPoint: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[700],
    flexWrap: "wrap",
    lineHeight: 1.3,
  },
  textTolMinus: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: colors.danger,
  },
  textTolPlus: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: colors.success,
  },
  textHeader: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[700],
    textAlign: "center",
  },
  textSubHeader: {
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },
  textData: {
    fontSize: 5,
    textAlign: "center",
  },
  textDataBold: {
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
  },

  // Footer
  footer: {
    position: "absolute",
    bottom: 15,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.gray[200],
  },
  footerText: {
    fontSize: 6,
    color: colors.gray[400],
  },
  footerPage: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.primary,
  },
});

// =============================================================================
// CONSTANTS
// =============================================================================
const ROWS_FIRST_PAGE = 20;
const ROWS_CONTINUATION_PAGE = 35;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const cleanText = (str) => {
  if (str === null || str === undefined) return "";
  let s = String(str);

  // HTML entities
  s = s.replace(/&lt;/gi, "<");
  s = s.replace(/&gt;/gi, ">");
  s = s.replace(/&amp;/gi, "&");
  s = s.replace(/&nbsp;/gi, " ");

  // Unicode symbols
  s = s.replace(/≤/g, "<=");
  s = s.replace(/≥/g, ">=");
  s = s.replace(/±/g, "+/-");

  // Fractions
  s = s
    .replace(/¼/g, " 1/4")
    .replace(/½/g, " 1/2")
    .replace(/¾/g, " 3/4")
    .replace(/⅛/g, " 1/8")
    .replace(/⅜/g, " 3/8")
    .replace(/⅝/g, " 5/8")
    .replace(/⅞/g, " 7/8");

  s = s.replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "");
  s = s.replace(/\s+/g, " ").trim();

  return s;
};

const formatTolMinus = (tolValue) => {
  if (!tolValue || tolValue === "-" || tolValue === "0" || tolValue === 0)
    return tolValue || "-";
  let strVal = String(tolValue).trim();
  if (strVal.startsWith("-")) return cleanText(strVal);
  return cleanText(`-${strVal}`);
};

const formatTolPlus = (tolValue) => {
  if (!tolValue || tolValue === "-") return "-";
  let strVal = String(tolValue).trim();
  strVal = strVal.replace(/^[+-]\s*/, "");
  return cleanText(strVal) || "-";
};

const isOutOfTolerance = (spec, bucket) => {
  if (spec.tolMinusDecimal === undefined || spec.tolPlusDecimal === undefined)
    return false;

  const val = bucket.decimal;
  const min = spec.tolMinusDecimal;
  const max = spec.tolPlusDecimal;
  const epsilon = 0.0001;

  return val < min - epsilon || val > max + epsilon;
};

const chunkArray = (arr, size) => {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

// Stats Cards Component
const StatsCards = ({ grandTotals }) => {
  const getPassRateColor = (rate) => {
    const r = parseFloat(rate);
    if (r >= 95) return colors.success;
    if (r >= 80) return colors.warning;
    return colors.danger;
  };

  return (
    <View style={styles.statsContainer} wrap={false}>
      {/* Total Points */}
      <View style={styles.statCard}>
        <View style={[styles.statIcon, { backgroundColor: colors.gray[100] }]}>
          <Text style={[styles.statIconText, { color: colors.gray[600] }]}>
            Σ
          </Text>
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statLabel}>Total Points</Text>
          <Text style={[styles.statValue, { color: colors.gray[800] }]}>
            {grandTotals.points}
          </Text>
        </View>
      </View>

      {/* Pass */}
      <View style={styles.statCard}>
        <View
          style={[styles.statIcon, { backgroundColor: colors.successLight }]}
        >
          <Text style={[styles.statIconText, { color: colors.success }]}>
            ✓
          </Text>
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statLabel}>Pass</Text>
          <Text style={[styles.statValue, { color: colors.success }]}>
            {grandTotals.pass}
          </Text>
        </View>
      </View>

      {/* Fail */}
      <View style={styles.statCard}>
        <View
          style={[styles.statIcon, { backgroundColor: colors.dangerLight }]}
        >
          <Text style={[styles.statIconText, { color: colors.danger }]}>✗</Text>
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statLabel}>Fail</Text>
          <Text style={[styles.statValue, { color: colors.danger }]}>
            {grandTotals.fail}
          </Text>
        </View>
      </View>

      {/* Pass Rate */}
      <View style={styles.statCard}>
        <View
          style={[styles.statIcon, { backgroundColor: colors.indigoLight }]}
        >
          <Text style={[styles.statIconText, { color: colors.indigo }]}>%</Text>
        </View>
        <View style={styles.statContent}>
          <Text style={styles.statLabel}>Pass Rate</Text>
          <Text
            style={[
              styles.statValue,
              { color: getPassRateColor(grandTotals.passRate) },
            ]}
          >
            {grandTotals.passRate}%
          </Text>
        </View>
      </View>
    </View>
  );
};

// Table Header Component
const TableHeader = ({ sizeLabel, valueBuckets, isAllSizes }) => {
  const headerBg = isAllSizes ? colors.purpleBg : colors.indigoLight;
  const headerColor = isAllSizes ? colors.purple : colors.indigo;

  return (
    <>
      {/* Main Header Row */}
      <View style={styles.tableHeaderRow}>
        <View style={[styles.colPoint, { backgroundColor: colors.gray[100] }]}>
          <Text style={styles.textHeader}>Measurement Point</Text>
        </View>
        <View style={[styles.colTol, { backgroundColor: colors.dangerLight }]}>
          <Text style={styles.textTolMinus}>Tol -</Text>
        </View>
        <View style={[styles.colTol, { backgroundColor: colors.successLight }]}>
          <Text style={styles.textTolPlus}>Tol +</Text>
        </View>
        <View style={[styles.colSizeHeader, { backgroundColor: headerBg }]}>
          <Text
            style={[styles.textHeader, { color: headerColor, fontSize: 7 }]}
          >
            {sizeLabel}
          </Text>
        </View>
      </View>

      {/* Sub-Header Row */}
      <View style={styles.subHeaderRow}>
        <View style={styles.colPoint} />
        <View style={styles.colTol} />
        <View style={styles.colTol} />

        {/* Sub-columns container */}
        <View style={{ flex: 1, flexDirection: "row" }}>
          {/* Pts */}
          <View style={[styles.colData, { backgroundColor: colors.gray[100] }]}>
            <Text style={[styles.textSubHeader, { color: colors.gray[600] }]}>
              Pts
            </Text>
          </View>
          {/* Pass */}
          <View
            style={[styles.colData, { backgroundColor: colors.successLight }]}
          >
            <Text style={[styles.textSubHeader, { color: colors.success }]}>
              Pass
            </Text>
          </View>
          {/* Fail */}
          <View
            style={[styles.colData, { backgroundColor: colors.dangerLight }]}
          >
            <Text style={[styles.textSubHeader, { color: colors.danger }]}>
              Fail
            </Text>
          </View>
          {/* Neg.Tol */}
          <View
            style={[styles.colData, { backgroundColor: colors.warningLight }]}
          >
            <Text
              style={[
                styles.textSubHeader,
                { color: colors.warning, fontSize: 4 },
              ]}
            >
              Neg.Tol
            </Text>
          </View>
          {/* Pos.Tol */}
          <View
            style={[styles.colData, { backgroundColor: colors.dangerLight }]}
          >
            <Text
              style={[
                styles.textSubHeader,
                { color: colors.danger, fontSize: 4 },
              ]}
            >
              Pos.Tol
            </Text>
          </View>
          {/* Buckets */}
          {valueBuckets.map((bucket) => (
            <View
              key={bucket.key}
              style={[styles.colData, { backgroundColor: "#FFFFFF" }]}
            >
              <Text
                style={[
                  styles.textSubHeader,
                  { color: colors.gray[500], fontSize: 4 },
                ]}
              >
                {bucket.label}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </>
  );
};

// Table Row Component
const TableRow = ({ spec, sizeData, valueBuckets, rowIndex }) => {
  const isCritical = spec.isCritical;
  const rowBg = isCritical
    ? colors.critical.bg
    : rowIndex % 2 === 0
      ? "#FFFFFF"
      : colors.gray[50];
  const pointCellBg = isCritical ? colors.critical.bgDark : rowBg;

  return (
    <View style={[styles.tableRow, { backgroundColor: rowBg }]}>
      {/* Point Name */}
      <View style={[styles.colPoint, { backgroundColor: pointCellBg }]}>
        <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
          {isCritical && (
            <Text style={{ fontSize: 5, color: colors.indigo, marginRight: 2 }}>
              [C]
            </Text>
          )}
          <Text style={[styles.textPoint, { flex: 1 }]}>
            {cleanText(spec.measurementPointName)}
          </Text>
        </View>
      </View>

      {/* Tol - */}
      <View
        style={[styles.colTol, { backgroundColor: colors.dangerLight + "80" }]}
      >
        <Text style={styles.textTolMinus}>{formatTolMinus(spec.tolMinus)}</Text>
      </View>

      {/* Tol + */}
      <View
        style={[styles.colTol, { backgroundColor: colors.successLight + "80" }]}
      >
        <Text style={styles.textTolPlus}>{formatTolPlus(spec.tolPlus)}</Text>
      </View>

      {/* Data Columns */}
      <View style={{ flex: 1, flexDirection: "row" }}>
        {/* Pts */}
        <View
          style={[styles.colData, { backgroundColor: colors.purpleBg + "60" }]}
        >
          <Text style={[styles.textDataBold, { color: colors.gray[700] }]}>
            {sizeData.points || "-"}
          </Text>
        </View>

        {/* Pass */}
        <View
          style={[styles.colData, { backgroundColor: colors.successLight }]}
        >
          <Text style={[styles.textDataBold, { color: colors.success }]}>
            {sizeData.pass || "-"}
          </Text>
        </View>

        {/* Fail */}
        <View style={[styles.colData, { backgroundColor: colors.dangerLight }]}>
          <Text style={[styles.textDataBold, { color: colors.danger }]}>
            {sizeData.fail || "-"}
          </Text>
        </View>

        {/* Neg.Tol */}
        <View
          style={[styles.colData, { backgroundColor: colors.warningLight }]}
        >
          <Text style={[styles.textDataBold, { color: colors.warning }]}>
            {sizeData.negTol || "-"}
          </Text>
        </View>

        {/* Pos.Tol */}
        <View style={[styles.colData, { backgroundColor: colors.dangerLight }]}>
          <Text style={[styles.textDataBold, { color: colors.danger }]}>
            {sizeData.posTol || "-"}
          </Text>
        </View>

        {/* Bucket Columns */}
        {valueBuckets.map((bucket) => {
          const count = sizeData.buckets?.[bucket.key] || 0;
          const outOfTol = isOutOfTolerance(spec, bucket);

          let cellBg = "#FFFFFF";
          let textColor = colors.gray[300];
          let fontFamily = "Helvetica";

          if (count > 0) {
            if (outOfTol) {
              cellBg = colors.dangerBg;
              textColor = colors.danger;
              fontFamily = "Helvetica-Bold";
            } else {
              cellBg = colors.successBg;
              textColor = colors.success;
              fontFamily = "Helvetica-Bold";
            }
          }

          return (
            <View
              key={bucket.key}
              style={[styles.colData, { backgroundColor: cellBg }]}
            >
              <Text style={[styles.textData, { color: textColor, fontFamily }]}>
                {count || "-"}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const MeasurementValueDistributionPDF = ({
  distributionData,
  reportData,
  orderNo,
  HeaderComponent,
  FooterComponent,
  pageStyle,
}) => {
  // Return null if no data
  if (
    !distributionData ||
    !distributionData.specs ||
    distributionData.specs.length === 0
  ) {
    return null;
  }

  const { specs, sizeList, valueBuckets, grandTotals } = distributionData;
  const totalPoints = specs.length;

  // ==========================================================================
  // PRE-CALCULATE ALL PAGES
  // ==========================================================================
  const allPages = [];

  // Create size list with "All Sizes" first
  const allSizesList = ["AllSizes", ...sizeList];

  allSizesList.forEach((size, sizeIdx) => {
    const isAllSizes = size === "AllSizes";
    const sizeLabel = isAllSizes ? "All Sizes" : size;

    let rowOffset = 0;
    let pageInSize = 0;

    while (rowOffset < specs.length) {
      // First page of first size gets stats cards, so fewer rows
      const isFirstPageOverall = sizeIdx === 0 && pageInSize === 0;
      const maxRows = isFirstPageOverall
        ? ROWS_FIRST_PAGE
        : ROWS_CONTINUATION_PAGE;

      const rowChunk = specs.slice(rowOffset, rowOffset + maxRows);

      if (rowChunk.length > 0) {
        allPages.push({
          sizeKey: size,
          sizeLabel,
          isAllSizes,
          isFirstPageOverall,
          isFirstPageOfSize: pageInSize === 0,
          rowChunk,
          startPoint: rowOffset + 1,
          endPoint: rowOffset + rowChunk.length,
          totalPoints,
          pageIndex: allPages.length,
          sizeIndex: sizeIdx,
        });
      }

      rowOffset += maxRows;
      pageInSize++;
    }
  });

  // ==========================================================================
  // RENDER
  // ==========================================================================

  // If no HeaderComponent, return as View-based layout (legacy)
  if (!HeaderComponent) {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            Measurement Value Distribution
          </Text>
        </View>
        <StatsCards grandTotals={grandTotals} />
        <Text
          style={{
            fontSize: 8,
            color: colors.gray[400],
            textAlign: "center",
            padding: 10,
          }}
        >
          PDF generation requires page-based rendering
        </Text>
      </View>
    );
  }

  // Render as separate pages
  const totalPagesCount = allPages.length;

  return (
    <>
      {allPages.map((pageData, pageIdx) => (
        <Page key={pageIdx} size="A4" style={pageStyle || styles.page}>
          {HeaderComponent && (
            <HeaderComponent reportData={reportData} orderNo={orderNo} />
          )}
          {FooterComponent && <FooterComponent />}

          {/* First page: Section header + Stats */}
          {pageData.isFirstPageOverall && (
            <>
              <View style={styles.sectionHeader} wrap={false}>
                <Text style={styles.sectionTitle}>
                  Measurement Value Distribution
                </Text>
                <View style={styles.headerStats}>
                  <View style={styles.headerStatItem}>
                    <Text style={styles.headerStatLabel}>Points:</Text>
                    <Text style={styles.headerStatValue}>
                      {grandTotals.points}
                    </Text>
                  </View>
                  <View style={styles.headerStatItem}>
                    <Text style={styles.headerStatLabel}>Rate:</Text>
                    <Text
                      style={[
                        styles.headerStatValue,
                        {
                          backgroundColor:
                            parseFloat(grandTotals.passRate) >= 95
                              ? "rgba(34,197,94,0.3)"
                              : "rgba(239,68,68,0.3)",
                        },
                      ]}
                    >
                      {grandTotals.passRate}%
                    </Text>
                  </View>
                </View>
              </View>
              <StatsCards grandTotals={grandTotals} />
            </>
          )}

          {/* Continuation pages: Page header with size and point range */}
          {!pageData.isFirstPageOverall && (
            <View style={styles.pageHeader} wrap={false}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.pageHeaderTitle}>
                  Measurement Value Distribution
                </Text>
                <Text style={styles.pageHeaderSize}>{pageData.sizeLabel}</Text>
              </View>
              <Text style={styles.pointRangeBadge}>
                Points: {pageData.startPoint}-{pageData.endPoint} (Total:{" "}
                {pageData.totalPoints})
              </Text>
            </View>
          )}

          {/* Size indicator for first page */}
          {pageData.isFirstPageOverall && (
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 6,
              }}
              wrap={false}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text
                  style={{
                    fontSize: 8,
                    fontFamily: "Helvetica-Bold",
                    color: colors.gray[700],
                  }}
                >
                  Size:
                </Text>
                <Text style={styles.pageHeaderSize}>{pageData.sizeLabel}</Text>
              </View>
              <Text style={styles.pointRangeBadge}>
                Points: {pageData.startPoint}-{pageData.endPoint} (Total:{" "}
                {pageData.totalPoints})
              </Text>
            </View>
          )}

          {/* Table */}
          <View style={styles.tableContainer} wrap={false}>
            <TableHeader
              sizeLabel={pageData.sizeLabel}
              valueBuckets={valueBuckets}
              isAllSizes={pageData.isAllSizes}
            />

            {pageData.rowChunk.map((spec, rowIdx) => {
              // Get size-specific data
              const sizeData = pageData.isAllSizes
                ? spec.allSizeTotals
                : spec.sizeData[pageData.sizeKey] || {};

              return (
                <TableRow
                  key={spec.measurementPointName}
                  spec={spec}
                  sizeData={sizeData}
                  valueBuckets={valueBuckets}
                  rowIndex={rowIdx}
                />
              );
            })}
          </View>
        </Page>
      ))}
    </>
  );
};

export default MeasurementValueDistributionPDF;
