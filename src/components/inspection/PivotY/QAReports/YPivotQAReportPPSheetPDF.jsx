import React from "react";
import { Text, View, Image, StyleSheet } from "@react-pdf/renderer";

// =============================================================================
// CONSTANTS & HELPERS
// =============================================================================
const colors = {
  primary: "#0d9488", // Teal-600 (Matching the React View)
  primaryLight: "#f0fdfa", // Teal-50
  gray: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    500: "#6B7280",
    700: "#374151",
    800: "#1F2937"
  },
  orange: {
    100: "#ffedd5",
    700: "#c2410c"
  },
  blue: {
    100: "#dbeafe",
    700: "#1d4ed8"
  },
  purple: {
    100: "#f3e8ff",
    700: "#7e22ce"
  }
};

const styles = StyleSheet.create({
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    backgroundColor: colors.primary,
    padding: "8 12",
    marginBottom: 0
  },
  sectionContent: {
    padding: 10,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderTopWidth: 0
  },

  // Header Cards
  headerGrid: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12
  },
  headerCard: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderRadius: 4,
    backgroundColor: "#FFFFFF"
  },
  headerLabel: {
    fontSize: 6,
    color: colors.gray[500],
    textTransform: "uppercase",
    marginBottom: 2
  },
  headerValue: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[800]
  },

  // Tables
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 12
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: colors.gray[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[300]
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    minHeight: 16,
    alignItems: "center"
  },
  tableCell: {
    padding: 6,
    fontSize: 7,
    borderRightWidth: 1,
    borderRightColor: colors.gray[200]
  },
  tableHeaderCell: {
    padding: 6,
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[700],
    textTransform: "uppercase",
    borderRightWidth: 1,
    borderRightColor: colors.gray[300]
  },

  // Subsections
  subTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[700],
    marginBottom: 6,
    marginTop: 6,
    textTransform: "uppercase"
  },

  // Badges
  badge: {
    padding: "2 6",
    borderRadius: 2,
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    alignSelf: "flex-start"
  },
  badgePass: { backgroundColor: "#dcfce7", color: "#15803d" },
  badgeFail: { backgroundColor: "#fee2e2", color: "#b91c1c" },
  badgeNA: { backgroundColor: colors.gray[200], color: colors.gray[500] },

  // List Items
  listItem: {
    fontSize: 7,
    marginBottom: 2,
    color: colors.gray[700],
    flexDirection: "row"
  },

  // Attendance
  attGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6
  },
  attBox: {
    width: "23%", // 4 columns roughly
    padding: 6,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 4,
    backgroundColor: "#FFFFFF",
    marginBottom: 6
  },

  // Images
  imageGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8
  },
  imageWrapper: {
    width: "31%",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 4,
    padding: 2,
    backgroundColor: "#FFFFFF"
  },
  image: {
    width: "100%",
    height: 100,
    objectFit: "contain"
  }
});

// Reuse mapping from React component
const materialLabels = [
  [
    { label: "PP / Size Set Samples", key: "ppSizeSet" },
    { label: "Approval Swatches", key: "approvalSwatches" }
  ],
  [
    { label: "Full Size Spec", key: "approvalFullSizeSpec" },
    { label: "Trim Card", key: "approvalTrimCard" }
  ],
  [
    { label: "Sample Comments", key: "sampleComments" },
    { label: "Print / Embroidery", key: "approvalPrintEmb" }
  ],
  [
    { label: "Hand Feel Standard", key: "handFeelStandard" },
    { label: "Fabric Inspection", key: "fabricInspectionResult" }
  ],
  [
    { label: "Washing Standard", key: "approvalWashingStandard" },
    { label: "Other", key: "other", type: "text" }
  ]
];

const renderStatusBadge = (value) => {
  if (value === "OK" || value === "Pass") {
    return (
      <View style={[styles.badge, styles.badgePass]}>
        <Text>{value}</Text>
      </View>
    );
  }
  if (value === "NO" || value === "Fail") {
    return (
      <View style={[styles.badge, styles.badgeFail]}>
        <Text>{value}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, styles.badgeNA]}>
      <Text>{value || "N/A"}</Text>
    </View>
  );
};

const YPivotQAReportPPSheetPDF = ({ ppSheetData }) => {
  if (!ppSheetData) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>PP SHEET / PILOT MEETING REPORT</Text>
      <View style={styles.sectionContent}>
        {/* 1. Header Info */}
        <View style={styles.headerGrid}>
          <View
            style={[
              styles.headerCard,
              {
                borderColor: colors.blue[700],
                backgroundColor: colors.blue[100]
              }
            ]}
          >
            <Text style={[styles.headerLabel, { color: colors.blue[700] }]}>
              Pilot Style
            </Text>
            <Text style={styles.headerValue}>{ppSheetData.style || "-"}</Text>
          </View>
          <View
            style={[
              styles.headerCard,
              {
                borderColor: colors.purple[700],
                backgroundColor: colors.purple[100]
              }
            ]}
          >
            <Text style={[styles.headerLabel, { color: colors.purple[700] }]}>
              Pilot Qty
            </Text>
            <Text style={styles.headerValue}>{ppSheetData.qty || "-"}</Text>
          </View>
          <View style={[styles.headerCard, { borderColor: colors.gray[300] }]}>
            <Text style={styles.headerLabel}>Meeting Date</Text>
            <Text style={styles.headerValue}>{ppSheetData.date || "-"}</Text>
          </View>
        </View>

        {/* 2. Material Availability */}
        <Text style={styles.subTitle}>Material Availability</Text>
        <View style={styles.table}>
          {materialLabels.map((row, idx) => (
            <View
              key={idx}
              style={[
                styles.tableRow,
                { backgroundColor: idx % 2 === 0 ? "#FFFFFF" : colors.gray[50] }
              ]}
            >
              <View
                style={[
                  styles.tableCell,
                  { width: "25%", borderRightWidth: 1 }
                ]}
              >
                <Text style={{ fontFamily: "Helvetica-Bold" }}>
                  {row[0].label}
                </Text>
              </View>
              <View
                style={[
                  styles.tableCell,
                  { width: "25%", borderRightWidth: 1 }
                ]}
              >
                {renderStatusBadge(ppSheetData.materials?.[row[0].key])}
              </View>
              <View
                style={[
                  styles.tableCell,
                  { width: "25%", borderRightWidth: 1 }
                ]}
              >
                <Text style={{ fontFamily: "Helvetica-Bold" }}>
                  {row[1].label}
                </Text>
              </View>
              <View
                style={[
                  styles.tableCell,
                  { width: "25%", borderRightWidth: 0 }
                ]}
              >
                {renderStatusBadge(ppSheetData.materials?.[row[1].key])}
              </View>
            </View>
          ))}
        </View>

        {/* 3. Risk Analysis */}
        <Text style={[styles.subTitle, { color: colors.orange[700] }]}>
          Risk Analysis
        </Text>
        <View style={[styles.table, { borderColor: colors.orange[700] }]}>
          <View
            style={[
              styles.tableHeader,
              { backgroundColor: colors.orange[100] }
            ]}
          >
            <View style={[styles.tableHeaderCell, { width: "10%" }]}>
              <Text style={{ textAlign: "center" }}>#</Text>
            </View>
            <View style={[styles.tableHeaderCell, { width: "45%" }]}>
              <Text>Potential Risk</Text>
            </View>
            <View
              style={[
                styles.tableHeaderCell,
                { width: "45%", borderRightWidth: 0 }
              ]}
            >
              <Text>Action / Countermeasure</Text>
            </View>
          </View>
          {ppSheetData.riskAnalysis && ppSheetData.riskAnalysis.length > 0 ? (
            ppSheetData.riskAnalysis.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.tableRow,
                  {
                    backgroundColor: idx % 2 === 0 ? "#FFFFFF" : colors.gray[50]
                  }
                ]}
              >
                <View
                  style={[
                    styles.tableCell,
                    { width: "10%", textAlign: "center" }
                  ]}
                >
                  <Text>{idx + 1}</Text>
                </View>
                <View style={[styles.tableCell, { width: "45%" }]}>
                  <Text>{item.risk || "-"}</Text>
                </View>
                <View
                  style={[
                    styles.tableCell,
                    { width: "45%", borderRightWidth: 0 }
                  ]}
                >
                  <Text>{item.action || "-"}</Text>
                </View>
              </View>
            ))
          ) : (
            <View
              style={[
                styles.tableRow,
                { justifyContent: "center", padding: 8 }
              ]}
            >
              <Text
                style={{
                  fontSize: 7,
                  fontStyle: "italic",
                  color: colors.gray[500]
                }}
              >
                No risk analysis recorded.
              </Text>
            </View>
          )}
        </View>

        {/* 4. Operations & Comments (Grid Layout) */}
        <View style={{ flexDirection: "row", gap: 10 }}>
          {/* Critical Ops */}
          <View style={{ flex: 1 }}>
            <Text style={[styles.subTitle, { color: colors.purple[700] }]}>
              Critical Operations
            </Text>
            <View
              style={[
                styles.table,
                { borderColor: colors.purple[700], marginBottom: 0 }
              ]}
            >
              <View style={{ padding: 6 }}>
                {ppSheetData.criticalOperations?.length > 0 ? (
                  ppSheetData.criticalOperations.map((op, i) => (
                    <Text key={i} style={styles.listItem}>
                      • {op}
                    </Text>
                  ))
                ) : (
                  <Text
                    style={{
                      fontSize: 7,
                      fontStyle: "italic",
                      color: colors.gray[500]
                    }}
                  >
                    None
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Other Comments */}
          <View style={{ flex: 1 }}>
            <Text style={[styles.subTitle, { color: colors.blue[700] }]}>
              Other Comments
            </Text>
            <View
              style={[
                styles.table,
                { borderColor: colors.blue[700], marginBottom: 0 }
              ]}
            >
              <View style={{ padding: 6 }}>
                {ppSheetData.otherComments?.length > 0 ? (
                  ppSheetData.otherComments.map((cm, i) => (
                    <Text key={i} style={styles.listItem}>
                      • {cm}
                    </Text>
                  ))
                ) : (
                  <Text
                    style={{
                      fontSize: 7,
                      fontStyle: "italic",
                      color: colors.gray[500]
                    }}
                  >
                    None
                  </Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* 5. Attendance */}
        <Text style={styles.subTitle}>Meeting Attendance</Text>
        <View style={styles.attGrid}>
          {Object.entries(ppSheetData.attendance || {}).map(([role, users]) => (
            <View key={role} style={styles.attBox}>
              <Text
                style={{
                  fontSize: 5,
                  fontFamily: "Helvetica-Bold",
                  textTransform: "uppercase",
                  marginBottom: 2,
                  color: colors.primary
                }}
              >
                {role}
              </Text>
              {users && users.length > 0 ? (
                users.map((u) => (
                  <Text
                    key={u.emp_id}
                    style={{ fontSize: 6, color: colors.gray[800] }}
                  >
                    {u.eng_name || u.emp_id}
                  </Text>
                ))
              ) : (
                <Text
                  style={{
                    fontSize: 6,
                    fontStyle: "italic",
                    color: colors.gray[400]
                  }}
                >
                  -
                </Text>
              )}
            </View>
          ))}
        </View>

        {/* 6. Attached Images */}
        {ppSheetData.images && ppSheetData.images.length > 0 && (
          <View wrap={false} style={{ marginTop: 8 }}>
            <Text
              style={[
                styles.subTitle,
                {
                  borderTopWidth: 1,
                  borderTopColor: colors.gray[200],
                  paddingTop: 8
                }
              ]}
            >
              Attached Documents / Images
            </Text>
            <View style={styles.imageGrid}>
              {ppSheetData.images.map((img, i) => (
                <View key={i} style={styles.imageWrapper}>
                  {img.base64 ? (
                    <Image style={styles.image} src={img.base64} />
                  ) : (
                    <View
                      style={[
                        styles.image,
                        {
                          backgroundColor: colors.gray[200],
                          justifyContent: "center",
                          alignItems: "center"
                        }
                      ]}
                    >
                      <Text style={{ fontSize: 6 }}>No Image</Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

export default YPivotQAReportPPSheetPDF;
