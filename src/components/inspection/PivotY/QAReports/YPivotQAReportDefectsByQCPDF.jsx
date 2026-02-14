import React from "react";
import { Text, View, StyleSheet } from "@react-pdf/renderer";

// =============================================================================
// STYLES
// =============================================================================
const colors = {
  primary: "#e11d48", // Rose-600
  primaryLight: "#ffe4e6",
  success: "#15803d",
  successBg: "#dcfce7",
  successLight: "#f0fdf4",
  danger: "#b91c1c",
  dangerBg: "#fee2e2",
  dangerLight: "#fef2f2",
  warning: "#c2410c",
  warningBg: "#ffedd5",
  warningLight: "#fff7ed",
  indigo: "#4f46e5",
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
};

const styles = StyleSheet.create({
  // Section
  section: {
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
  },
  sectionContent: {
    padding: 12,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderTopWidth: 0,
  },

  // Cards Grid
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  // QC Card
  card: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 8,
  },

  // Card Header
  cardHeader: {
    padding: 8,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
  },
  cardHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },

  // QC Info
  qcInfo: {
    flex: 1,
  },
  qcName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[800],
    marginBottom: 2,
  },
  qcIdRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  qcIdLabel: {
    fontSize: 5,
    color: colors.gray[400],
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  qcIdValue: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.indigo,
  },
  qcTitle: {
    fontSize: 5,
    color: colors.gray[500],
    backgroundColor: colors.gray[100],
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    marginTop: 2,
  },

  // Rate Badge
  rateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 40,
  },
  rateBadgePass: {
    backgroundColor: colors.successLight,
    borderColor: colors.successBg,
  },
  rateBadgeFail: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.dangerBg,
  },
  rateValue: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
  },
  rateLabel: {
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    opacity: 0.8,
  },

  // Stats Row
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statsLeft: {
    flexDirection: "row",
    gap: 12,
    paddingRight: 8,
    borderRightWidth: 1,
    borderRightColor: colors.gray[100],
  },
  statItem: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 5,
    color: colors.gray[400],
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  statValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[800],
  },

  // Breakdown Badges
  breakdownRow: {
    flexDirection: "row",
    gap: 4,
    flex: 1,
    justifyContent: "flex-end",
  },
  breakdownBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    alignItems: "center",
    borderWidth: 1,
  },
  breakdownLabel: {
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
  },
  breakdownValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
  },
  perfectBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.successLight,
    borderColor: colors.successBg,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
  },
  perfectText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.success,
  },

  // Card Body (Configs & Defects)
  cardBody: {
    padding: 8,
    backgroundColor: colors.gray[50],
  },

  // Config Group
  configGroup: {
    marginBottom: 6,
  },
  configHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    marginBottom: 4,
  },
  configLabel: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[500],
    textTransform: "uppercase",
  },

  // Defect Item
  defectItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray[200],
    marginBottom: 3,
  },
  defectName: {
    fontSize: 6,
    color: colors.gray[700],
    flex: 1,
    marginRight: 4,
  },
  defectRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statusBadge: {
    fontSize: 5,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 2,
    borderWidth: 1,
  },
  statusMinor: {
    backgroundColor: colors.successLight,
    borderColor: colors.successBg,
    color: colors.success,
  },
  statusMajor: {
    backgroundColor: colors.warningLight,
    borderColor: colors.warningBg,
    color: colors.warning,
  },
  statusCritical: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.dangerBg,
    color: colors.danger,
  },
  qtyBadge: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    backgroundColor: colors.gray[100],
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    color: colors.gray[800],
    minWidth: 18,
    textAlign: "center",
  },

  // No Defects Placeholder
  noDefects: {
    padding: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderStyle: "dashed",
  },
  noDefectsText: {
    fontSize: 6,
    color: colors.gray[400],
    fontStyle: "italic",
    textAlign: "center",
  },
});

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

const cleanText = (str) => {
  if (str === null || str === undefined) return "";
  let s = String(str);
  s = s.replace(/&lt;/gi, "<");
  s = s.replace(/&gt;/gi, ">");
  s = s.replace(/&amp;/gi, "&");
  s = s.replace(/[^\x20-\x7E\u00A0-\u00FF]/g, "");
  s = s.replace(/\s+/g, " ").trim();
  return s;
};

const getConfigLabel = (config) => {
  const parts = [];
  if (config.line) parts.push(`Line ${config.line}`);
  if (config.table) parts.push(`Table ${config.table}`);
  if (config.color) parts.push(config.color);
  return parts.length > 0 ? parts.join(" • ") : "General Config";
};

const getRateBadgeStyle = (inspector) => {
  const { totalDefects, minorCount, majorCount, criticalCount } = inspector;

  // Perfect Score (0 Defects) or only 1 Minor -> Pass style
  if (totalDefects === 0) return true;
  if (
    totalDefects === 1 &&
    minorCount === 1 &&
    majorCount === 0 &&
    criticalCount === 0
  ) {
    return true;
  }
  return false;
};

const getStatusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case "minor":
      return styles.statusMinor;
    case "major":
      return styles.statusMajor;
    case "critical":
      return styles.statusCritical;
    default:
      return {
        backgroundColor: colors.gray[100],
        borderColor: colors.gray[200],
        color: colors.gray[600],
      };
  }
};

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

// QC Card Component
const QCCard = ({ inspector, inspectedQty = 20 }) => {
  const defectRate = ((inspector.totalDefects / inspectedQty) * 100).toFixed(0);
  const isPass = getRateBadgeStyle(inspector);

  return (
    <View style={styles.card} wrap={false}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        {/* Top Row: QC Info + Rate Badge */}
        <View style={styles.cardHeaderTop}>
          {/* QC Info */}
          <View style={styles.qcInfo}>
            <Text style={styles.qcName}>
              {cleanText(inspector.qcDetails?.eng_name || "Unknown")}
            </Text>
            <View style={styles.qcIdRow}>
              <Text style={styles.qcIdLabel}>ID</Text>
              <Text style={styles.qcIdValue}>{inspector._id}</Text>
            </View>
            {inspector.qcDetails?.job_title && (
              <Text style={styles.qcTitle}>
                {cleanText(inspector.qcDetails.job_title)}
              </Text>
            )}
          </View>

          {/* Rate Badge */}
          <View
            style={[
              styles.rateBadge,
              isPass ? styles.rateBadgePass : styles.rateBadgeFail,
            ]}
          >
            <Text
              style={[
                styles.rateValue,
                { color: isPass ? colors.success : colors.danger },
              ]}
            >
              {defectRate}%
            </Text>
            <Text
              style={[
                styles.rateLabel,
                { color: isPass ? colors.success : colors.danger },
              ]}
            >
              Rate
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          {/* Left: Inspected & Defects */}
          <View style={styles.statsLeft}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Inspected</Text>
              <Text style={styles.statValue}>{inspectedQty}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Defects</Text>
              <Text style={styles.statValue}>{inspector.totalDefects}</Text>
            </View>
          </View>

          {/* Right: Breakdown Badges */}
          <View style={styles.breakdownRow}>
            {inspector.totalDefects === 0 ? (
              <View style={styles.perfectBadge}>
                <Text style={styles.perfectText}>✓ Perfect</Text>
              </View>
            ) : (
              <>
                {inspector.minorCount > 0 && (
                  <View
                    style={[
                      styles.breakdownBadge,
                      {
                        backgroundColor: colors.successLight,
                        borderColor: colors.successBg,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.breakdownLabel, { color: colors.success }]}
                    >
                      Min
                    </Text>
                    <Text
                      style={[styles.breakdownValue, { color: colors.success }]}
                    >
                      {inspector.minorCount}
                    </Text>
                  </View>
                )}
                {inspector.majorCount > 0 && (
                  <View
                    style={[
                      styles.breakdownBadge,
                      {
                        backgroundColor: colors.warningLight,
                        borderColor: colors.warningBg,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.breakdownLabel, { color: colors.warning }]}
                    >
                      Maj
                    </Text>
                    <Text
                      style={[styles.breakdownValue, { color: colors.warning }]}
                    >
                      {inspector.majorCount}
                    </Text>
                  </View>
                )}
                {inspector.criticalCount > 0 && (
                  <View
                    style={[
                      styles.breakdownBadge,
                      {
                        backgroundColor: colors.dangerLight,
                        borderColor: colors.dangerBg,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.breakdownLabel, { color: colors.danger }]}
                    >
                      Crit
                    </Text>
                    <Text
                      style={[styles.breakdownValue, { color: colors.danger }]}
                    >
                      {inspector.criticalCount}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </View>

      {/* Card Body - Configs & Defects */}
      <View style={styles.cardBody}>
        {inspector.configs &&
          inspector.configs.map((config, configIdx) => (
            <View key={configIdx} style={styles.configGroup}>
              {/* Config Header */}
              <View style={styles.configHeader}>
                <Text style={styles.configLabel}>{getConfigLabel(config)}</Text>
              </View>

              {/* Defect Items */}
              {config.defects && config.defects.length > 0 ? (
                config.defects.map((defect, defectIdx) => (
                  <View key={defectIdx} style={styles.defectItem}>
                    <Text style={styles.defectName} numberOfLines={1}>
                      {cleanText(defect.name)}
                    </Text>
                    <View style={styles.defectRight}>
                      <Text
                        style={[
                          styles.statusBadge,
                          getStatusStyle(defect.status),
                        ]}
                      >
                        {defect.status || "N/A"}
                      </Text>
                      <Text style={styles.qtyBadge}>{defect.qty}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.noDefects}>
                  <Text style={styles.noDefectsText}>No defects recorded</Text>
                </View>
              )}
            </View>
          ))}
      </View>
    </View>
  );
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const DefectsByQCPDF = ({ qcDefectsData, inspectedQty = 20 }) => {
  // Return null if no data
  if (!qcDefectsData || qcDefectsData.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Missing Defects by QC Inspector</Text>
      </View>

      {/* Content */}
      <View style={styles.sectionContent}>
        <View style={styles.cardsGrid}>
          {qcDefectsData.map((inspector, idx) => (
            <QCCard
              key={inspector._id || idx}
              inspector={inspector}
              inspectedQty={inspectedQty}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

export default DefectsByQCPDF;
