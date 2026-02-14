import React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";

// =============================================================================
// STYLES
// =============================================================================
const colors = {
  primary: "#0088CC",
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827"
  },
  green: {
    100: "#dcfce7",
    700: "#15803d"
  },
  orange: {
    100: "#ffedd5",
    700: "#c2410c"
  },
  red: {
    100: "#fee2e2",
    700: "#b91c1c"
  },
  indigo: {
    100: "#e0e7ff",
    700: "#4338ca"
  }
};

const styles = StyleSheet.create({
  // Section container
  section: {
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    backgroundColor: colors.primary,
    padding: "8 12"
  },
  sectionContent: {
    padding: 10,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderTopWidth: 0
  },

  // Table Styles
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 2,
    overflow: "hidden"
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.gray[100], // Light Gray Header like Web
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[300]
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    minHeight: 16 // Ensure row has height
  },
  tableFooter: {
    flexDirection: "row",
    backgroundColor: "#1e293b", // Slate-800 like Web Footer
    borderTopWidth: 1,
    borderTopColor: colors.gray[700]
  },

  // Cells
  cellConfig: {
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: colors.gray[200]
  },
  cellDefect: {
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: colors.gray[200]
  },
  cellLocation: {
    padding: 4,
    borderRightWidth: 1,
    borderRightColor: colors.gray[200]
  },

  // Count Cells (Fixed Width)
  cellCount: {
    width: 35,
    justifyContent: "center",
    alignItems: "center",
    borderRightWidth: 1,
    borderRightColor: colors.gray[200]
  },
  cellTotal: {
    width: 35,
    justifyContent: "center",
    alignItems: "center"
  },

  // Text Styles
  textHeader: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[600],
    textTransform: "uppercase"
  },
  textConfigTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[800]
  },
  textConfigSub: {
    fontSize: 6,
    color: colors.gray[600]
  },
  textDefectCode: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[700],
    backgroundColor: colors.gray[200],
    padding: "1 2",
    borderRadius: 2,
    marginRight: 4
  },
  textDefectName: {
    fontSize: 7,
    color: colors.gray[800]
  },
  textLocation: {
    fontSize: 7,
    color: colors.gray[800]
  },
  textCount: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold"
  },

  // Footer Text
  textFooterLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    textTransform: "uppercase",
    textAlign: "right",
    paddingRight: 8
  },
  textFooterCount: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: "2 6",
    borderRadius: 2
  }
});

// =============================================================================
// SUB-COMPONENT: Table Header
// =============================================================================
const TableHeader = () => (
  <View style={styles.tableHeader}>
    <View style={[styles.cellConfig, { width: "20%" }]}>
      <Text style={styles.textHeader}>Config</Text>
    </View>
    <View style={[styles.cellDefect, { width: "25%" }]}>
      <Text style={styles.textHeader}>Defect</Text>
    </View>
    <View style={[styles.cellLocation, { width: "25%" }]}>
      <Text style={styles.textHeader}>Location</Text>
    </View>

    {/* Counts */}
    <View style={[styles.cellCount, { backgroundColor: colors.green[100] }]}>
      <Text style={[styles.textHeader, { color: colors.green[700] }]}>
        Minor
      </Text>
    </View>
    <View style={[styles.cellCount, { backgroundColor: colors.orange[100] }]}>
      <Text style={[styles.textHeader, { color: colors.orange[700] }]}>
        Major
      </Text>
    </View>
    <View style={[styles.cellCount, { backgroundColor: colors.red[100] }]}>
      <Text style={[styles.textHeader, { color: colors.red[700] }]}>
        Critical
      </Text>
    </View>
    <View style={[styles.cellTotal, { backgroundColor: colors.indigo[100] }]}>
      <Text style={[styles.textHeader, { color: colors.indigo[700] }]}>
        Total
      </Text>
    </View>
  </View>
);

// =============================================================================
// SUB-COMPONENT: Table Rows (Grouped)
// =============================================================================
const TableRows = ({ groups }) => {
  return (
    <>
      {groups.map((group, gIdx) => {
        // Calculate rows spanned by this group
        // But in React-PDF, rowSpan is tricky. We'll render Config cell only on first row of group.

        let configRendered = false;

        return group.defects.map((defect, dIdx) => {
          let defectRendered = false;

          return defect.locations.map((loc, lIdx) => {
            const isFirstGroupRow = !configRendered;
            const isFirstDefectRow = !defectRendered;

            // Mark as rendered
            configRendered = true;
            defectRendered = true;

            const isEven = gIdx % 2 === 0; // Alternating background by group mainly

            return (
              <View
                key={`${group.configKey}-${defect.defectId}-${lIdx}`}
                style={[
                  styles.tableRow,
                  { backgroundColor: isEven ? "#FFFFFF" : "#f8fafc" }
                ]}
              >
                {/* 1. CONFIG COLUMN (Simulate RowSpan by empty cells) */}
                <View style={[styles.cellConfig, { width: "20%" }]}>
                  {isFirstGroupRow && (
                    <>
                      {group.lineName && (
                        <Text style={styles.textConfigTitle}>
                          Line {group.lineName}
                        </Text>
                      )}
                      {group.tableName && (
                        <Text style={styles.textConfigTitle}>
                          Table {group.tableName}
                        </Text>
                      )}
                      {group.colorName && (
                        <Text style={styles.textConfigTitle}>
                          {group.colorName}
                        </Text>
                      )}
                    </>
                  )}
                </View>

                {/* 2. DEFECT COLUMN (Simulate RowSpan) */}
                <View style={[styles.cellDefect, { width: "25%" }]}>
                  {isFirstDefectRow && (
                    <View
                      style={{ flexDirection: "row", alignItems: "center" }}
                    >
                      <Text style={styles.textDefectCode}>
                        {defect.defectCode}
                      </Text>
                      <Text style={[styles.textDefectName, { width: "80%" }]}>
                        {defect.defectName}
                      </Text>
                    </View>
                  )}
                </View>

                {/* 3. LOCATION COLUMN (Always Render) */}
                <View style={[styles.cellLocation, { width: "25%" }]}>
                  <Text style={styles.textLocation}>{loc.display}</Text>
                  {loc.qcId && (
                    <Text style={{ fontSize: 6, color: colors.gray[600] }}>
                      (QC: {loc.qcId})
                    </Text>
                  )}
                </View>

                {/* 4. COUNTS (Only on first defect row for summary logic, or distributed?) 
                   In web: "isFirstDefectRow" renders the totals. 
                */}
                <View style={styles.cellCount}>
                  {isFirstDefectRow &&
                    (defect.minorTotal > 0 ? (
                      <Text
                        style={[styles.textCount, { color: colors.green[700] }]}
                      >
                        {defect.minorTotal}
                      </Text>
                    ) : (
                      <Text style={{ fontSize: 6, color: colors.gray[300] }}>
                        -
                      </Text>
                    ))}
                </View>

                <View style={styles.cellCount}>
                  {isFirstDefectRow &&
                    (defect.majorTotal > 0 ? (
                      <Text
                        style={[
                          styles.textCount,
                          { color: colors.orange[700] }
                        ]}
                      >
                        {defect.majorTotal}
                      </Text>
                    ) : (
                      <Text style={{ fontSize: 6, color: colors.gray[300] }}>
                        -
                      </Text>
                    ))}
                </View>

                <View style={styles.cellCount}>
                  {isFirstDefectRow &&
                    (defect.criticalTotal > 0 ? (
                      <Text
                        style={[styles.textCount, { color: colors.red[700] }]}
                      >
                        {defect.criticalTotal}
                      </Text>
                    ) : (
                      <Text style={{ fontSize: 6, color: colors.gray[300] }}>
                        -
                      </Text>
                    ))}
                </View>

                <View style={styles.cellTotal}>
                  {isFirstDefectRow && (
                    <Text
                      style={[styles.textCount, { color: colors.indigo[700] }]}
                    >
                      {defect.grandTotal}
                    </Text>
                  )}
                </View>
              </View>
            );
          });
        });
      })}
    </>
  );
};

// =============================================================================
// SUB-COMPONENT: Table Footer (Grand Totals)
// =============================================================================
const TableFooter = ({ totals }) => (
  <View style={styles.tableFooter}>
    {/* Label spanning Config + Defect + Location (approx 70%) */}
    <View style={{ width: "70%", padding: 6, justifyContent: "center" }}>
      <Text style={styles.textFooterLabel}>GRAND TOTAL</Text>
    </View>

    {/* Totals */}
    <View style={[styles.cellCount, { borderRightColor: colors.gray[600] }]}>
      {totals.minor > 0 && (
        <Text style={styles.textFooterCount}>{totals.minor}</Text>
      )}
    </View>
    <View style={[styles.cellCount, { borderRightColor: colors.gray[600] }]}>
      {totals.major > 0 && (
        <Text
          style={[
            styles.textFooterCount,
            { backgroundColor: colors.orange[700] }
          ]}
        >
          {totals.major}
        </Text>
      )}
    </View>
    <View style={[styles.cellCount, { borderRightColor: colors.gray[600] }]}>
      {totals.critical > 0 && (
        <Text
          style={[styles.textFooterCount, { backgroundColor: colors.red[700] }]}
        >
          {totals.critical}
        </Text>
      )}
    </View>
    <View style={styles.cellTotal}>
      <Text
        style={[
          styles.textFooterCount,
          { color: colors.indigo[700], backgroundColor: "#FFFFFF" }
        ]}
      >
        {totals.total}
      </Text>
    </View>
  </View>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const DefectSectionPDF = ({ summaryData }) => {
  if (!summaryData?.groups || summaryData.groups.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { backgroundColor: "#7C3AED" }]}>
        DEFECT SUMMARY ({summaryData.totals?.total || 0} Total)
      </Text>

      <View style={styles.sectionContent}>
        <View style={styles.table}>
          <TableHeader />
          <TableRows groups={summaryData.groups} />
          <TableFooter totals={summaryData.totals} />
        </View>
      </View>
    </View>
  );
};

export default DefectSectionPDF;
