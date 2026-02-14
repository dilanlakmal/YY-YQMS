import React, { useMemo } from "react";
import { View, Text, Image, StyleSheet } from "@react-pdf/renderer";
import { PUBLIC_ASSET_URL } from "../../../../../config";

// --- Constants ---
const MARKER_SIZE = 14;
const IMAGE_CONTAINER_HEIGHT = 200; // Fixed height for the image area

const colors = {
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
    900: "#111827"
  },
  blue: { 50: "#eff6ff", 100: "#dbeafe", 700: "#1d4ed8" },
  red: { 50: "#fef2f2", 500: "#ef4444", 600: "#dc2626", 700: "#b91c1c" },
  orange: { 500: "#f97316", 600: "#ea580c" },
  yellow: { 100: "#fef9c3", 400: "#facc15" },
  green: { 100: "#dcfce7", 400: "#4ade80", 800: "#166534" },
  indigo: { 50: "#eef2ff", 500: "#6366f1", 700: "#4338ca" }
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 4,
    marginTop: 10
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
    alignItems: "center"
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6
  },
  title: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[700],
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  subtitle: {
    fontSize: 7,
    color: colors.gray[500]
  },
  badge: {
    backgroundColor: colors.indigo[50],
    borderWidth: 1,
    borderColor: colors.indigo[500],
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  badgeText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.indigo[700]
  },

  // Legend
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginBottom: 8
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  legendText: {
    fontSize: 6,
    color: colors.gray[500]
  },

  // Image Section
  imagesRow: {
    flexDirection: "row",
    gap: 12,
    justifyContent: "center",
    marginBottom: 12
  },
  viewContainer: {
    width: "48%",
    alignItems: "center"
  },
  viewTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[600],
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5
  },
  imageOuterWrapper: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 4,
    padding: 6,
    alignItems: "center",
    justifyContent: "center"
  },
  // This is the KEY: position container that matches exactly where the image is
  imagePositionContainer: {
    position: "relative",
    width: "100%",
    height: IMAGE_CONTAINER_HEIGHT
  },
  productImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain"
  },

  // Markers - positioned absolutely within imagePositionContainer
  markerWrapper: {
    position: "absolute",
    // Will be positioned with calculated top/left
    alignItems: "center",
    justifyContent: "center"
  },
  marker: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
    borderRadius: MARKER_SIZE / 2,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFFFFF"
  },
  markerText: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    textAlign: "center"
  },
  countBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 14,
    height: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 7,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.gray[300],
    paddingHorizontal: 2
  },
  countBadgeText: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[900],
    textAlign: "center"
  },

  // Info Text
  infoRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 4,
    marginBottom: 10
  },
  infoText: {
    fontSize: 6,
    color: colors.gray[400]
  },
  infoTextBold: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[500]
  },

  // Table
  tableContainer: {
    marginTop: 4
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4
  },
  tableTitle: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[600],
    textTransform: "uppercase"
  },
  table: {
    width: "100%",
    borderWidth: 1,
    borderColor: colors.gray[200],
    borderRadius: 3,
    overflow: "hidden"
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: colors.gray[100],
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[300]
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[200],
    minHeight: 20,
    alignItems: "center"
  },
  tableRowAlt: {
    backgroundColor: colors.gray[50]
  },
  cellHeader: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[700],
    textTransform: "uppercase",
    paddingVertical: 5,
    paddingHorizontal: 4
  },
  cellText: {
    fontSize: 7,
    color: colors.gray[800],
    paddingVertical: 4,
    paddingHorizontal: 4
  },

  // Column widths
  colNo: { width: "8%", textAlign: "center" },
  colView: { width: "12%" },
  colName: { width: "25%" },
  colDetails: {
    width: "45%",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 2,
    padding: 4
  },
  colQty: {
    width: "10%",
    textAlign: "center",
    alignItems: "center",
    justifyContent: "center"
  },

  // View Badge
  viewBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    borderWidth: 1
  },
  viewBadgeFront: {
    backgroundColor: colors.red[50],
    borderColor: colors.red[500]
  },
  viewBadgeBack: {
    backgroundColor: colors.blue[50],
    borderColor: colors.blue[700]
  },
  viewBadgeText: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold"
  },

  // Defect Detail Item
  detailItem: {
    flexDirection: "row",
    backgroundColor: colors.gray[100],
    borderRadius: 2,
    borderWidth: 1,
    borderColor: colors.gray[200],
    overflow: "hidden"
  },
  detailName: {
    fontSize: 6,
    color: colors.gray[600],
    paddingHorizontal: 4,
    paddingVertical: 2
  },
  detailQty: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: colors.gray[800],
    backgroundColor: colors.gray[200],
    paddingHorizontal: 3,
    paddingVertical: 2
  },

  // Qty Bubble
  qtyBubble: {
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center"
  },
  qtyBubbleText: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#FFFFFF",
    textAlign: "center"
  },

  // No Data
  noDataContainer: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center"
  },
  noDataText: {
    fontSize: 8,
    color: colors.gray[400]
  }
});

// --- Helper: URL Construction ---
const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("data:") || path.startsWith("http")) return path;

  const baseUrl = PUBLIC_ASSET_URL.endsWith("/")
    ? PUBLIC_ASSET_URL.slice(0, -1)
    : PUBLIC_ASSET_URL;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

// --- Helper: Marker Color Based on Quantity ---
const getMarkerStyles = (qty) => {
  if (qty === 0) {
    return {
      bg: colors.green[100],
      border: colors.green[400],
      text: colors.green[800]
    };
  }
  if (qty === 1) {
    return {
      bg: colors.yellow[100],
      border: colors.yellow[400],
      text: "#854d0e" // yellow-800
    };
  }
  if (qty <= 2) {
    return {
      bg: colors.orange[500],
      border: colors.orange[600],
      text: "#FFFFFF"
    };
  }
  return {
    bg: colors.red[600],
    border: colors.red[700],
    text: "#FFFFFF"
  };
};

// --- Helper: Qty Bubble Color ---
const getQtyBubbleColor = (qty) => {
  if (qty === 1) return colors.yellow[400];
  if (qty <= 2) return colors.orange[500];
  return colors.red[600];
};

// --- Sub-Component: Single Marker ---
const LocationMarker = ({ location, count }) => {
  const styleConfig = getMarkerStyles(count);

  // Calculate position
  // The key fix: position the CENTER of the marker at the x,y percentage
  // We calculate the top/left such that the center of the marker is at x%, y%
  const markerHalf = MARKER_SIZE / 2;

  return (
    <View
      style={[
        styles.markerWrapper,
        {
          // Position the top-left of the wrapper, then offset by half marker size
          top: `${location.y}%`,
          left: `${location.x}%`,
          marginTop: -markerHalf,
          marginLeft: -markerHalf
        }
      ]}
    >
      <View
        style={[
          styles.marker,
          {
            backgroundColor: styleConfig.bg,
            borderColor: styleConfig.border
          }
        ]}
      >
        <Text style={[styles.markerText, { color: styleConfig.text }]}>
          {location.LocationNo}
        </Text>
      </View>

      {/* Count Badge */}
      {count > 0 && (
        <View style={styles.countBadge}>
          <Text style={styles.countBadgeText}>{count}</Text>
        </View>
      )}
    </View>
  );
};

// --- Sub-Component: View Container ---
const ViewContainer = ({ title, viewData, viewCounts }) => {
  if (!viewData || !viewData.imagePath) {
    return (
      <View style={styles.viewContainer}>
        <Text style={styles.viewTitle}>{title}</Text>
        <View style={styles.imageOuterWrapper}>
          <View style={styles.noDataContainer}>
            <Text style={styles.noDataText}>No image available</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.viewContainer}>
      <Text style={styles.viewTitle}>{title}</Text>
      <View style={styles.imageOuterWrapper}>
        {/* This container is the reference for positioning */}
        <View style={styles.imagePositionContainer}>
          {/* Image fills this container */}
          <Image
            src={getImageUrl(viewData.imagePath)}
            style={styles.productImage}
          />

          {/* Markers are positioned relative to this same container */}
          {viewData.locations &&
            viewData.locations.map((loc) => {
              const locData = viewCounts[loc.LocationNo];
              const count = locData ? locData.total : 0;

              return (
                <LocationMarker
                  key={loc.LocationNo || loc._id}
                  location={loc}
                  count={count}
                />
              );
            })}
        </View>
      </View>
    </View>
  );
};

// --- Sub-Component: Defect Detail Badge ---
const DefectDetailBadge = ({ name, qty }) => (
  <View style={styles.detailItem}>
    <Text style={styles.detailName}>{name}</Text>
    <Text style={styles.detailQty}>{qty}</Text>
  </View>
);

// --- Sub-Component: Table Row ---
const TableRow = ({ row, isEven }) => (
  <View style={[styles.tableRow, isEven && styles.tableRowAlt]}>
    {/* Location No */}
    <Text
      style={[
        styles.cellText,
        styles.colNo,
        { color: colors.indigo[500], fontFamily: "Helvetica-Bold" }
      ]}
    >
      {row.no}
    </Text>

    {/* View */}
    <View style={[styles.colView, { paddingHorizontal: 4 }]}>
      <View
        style={[
          styles.viewBadge,
          row.view === "Front" ? styles.viewBadgeFront : styles.viewBadgeBack
        ]}
      >
        <Text
          style={[
            styles.viewBadgeText,
            { color: row.view === "Front" ? colors.red[700] : colors.blue[700] }
          ]}
        >
          {row.view}
        </Text>
      </View>
    </View>

    {/* Location Name */}
    <Text
      style={[
        styles.cellText,
        styles.colName,
        { fontFamily: "Helvetica-Bold" }
      ]}
    >
      {row.name}
    </Text>

    {/* Defect Details */}
    <View style={styles.colDetails}>
      {row.defects.map((d, idx) => (
        <DefectDetailBadge key={idx} name={d.name} qty={d.qty} />
      ))}
    </View>

    {/* Total Qty */}
    <View style={styles.colQty}>
      <View
        style={[
          styles.qtyBubble,
          { backgroundColor: getQtyBubbleColor(row.qty) }
        ]}
      >
        <Text style={styles.qtyBubbleText}>{row.qty}</Text>
      </View>
    </View>
  </View>
);

// --- Main Component ---
const DefectLocationSummaryPDF = ({ mapData, counts }) => {
  if (!mapData || !counts) {
    return null;
  }

  // Prepare Table Data
  const tableData = useMemo(() => {
    const rows = [];

    const processLocations = (locations, viewName, viewCounts) => {
      if (!locations) return;

      locations.forEach((loc) => {
        const data = viewCounts?.[loc.LocationNo];
        if (data && data.total > 0) {
          const defectDetails = Object.entries(data.defects || {}).map(
            ([name, qty]) => ({ name, qty })
          );

          rows.push({
            id: `${viewName[0]}-${loc.LocationNo}`,
            view: viewName,
            no: loc.LocationNo,
            name: loc.LocationName,
            qty: data.total,
            defects: defectDetails
          });
        }
      });
    };

    processLocations(mapData.frontView?.locations, "Front", counts.Front);
    processLocations(mapData.backView?.locations, "Back", counts.Back);

    return rows.sort((a, b) => b.qty - a.qty);
  }, [mapData, counts]);

  // Calculate Total Defects
  const getTotal = (obj) =>
    Object.values(obj || {}).reduce((acc, c) => acc + (c.total || 0), 0);
  const totalMapped = getTotal(counts.Front) + getTotal(counts.Back);

  return (
    <View style={styles.container} break>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Defect Location Map</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{totalMapped} defects mapped</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              {
                backgroundColor: colors.green[100],
                borderWidth: 1,
                borderColor: colors.green[400]
              }
            ]}
          />
          <Text style={styles.legendText}>0</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[
              styles.legendDot,
              {
                backgroundColor: colors.yellow[100],
                borderWidth: 1,
                borderColor: colors.yellow[400]
              }
            ]}
          />
          <Text style={styles.legendText}>1</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: colors.orange[500] }]}
          />
          <Text style={styles.legendText}>2-3</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: colors.red[600] }]}
          />
          <Text style={styles.legendText}>&gt;3</Text>
        </View>
      </View>

      {/* Images */}
      <View style={styles.imagesRow}>
        <ViewContainer
          title="Front View"
          viewData={mapData.frontView}
          viewCounts={counts.Front || {}}
        />
        <ViewContainer
          title="Back View"
          viewData={mapData.backView}
          viewCounts={counts.Back || {}}
        />
      </View>

      {/* Info Text */}
      <View style={styles.infoRow}>
        <Text style={styles.infoText}>Markers show</Text>
        <Text style={styles.infoTextBold}>Location No</Text>
        <Text style={styles.infoText}>• Badge shows</Text>
        <Text style={styles.infoTextBold}>Defect Qty</Text>
      </View>

      {/* Table */}
      {tableData.length > 0 && (
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableTitle}>Location Breakdown</Text>
            <Text style={[styles.legendText, { marginLeft: "auto" }]}>
              Sorted by Qty (High → Low)
            </Text>
          </View>

          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.cellHeader, styles.colNo]}>#</Text>
              <Text style={[styles.cellHeader, styles.colView]}>View</Text>
              <Text style={[styles.cellHeader, styles.colName]}>
                Location Name
              </Text>
              <Text style={[styles.cellHeader, styles.colDetails]}>
                Defect Details
              </Text>
              <Text style={[styles.cellHeader, styles.colQty]}>Total</Text>
            </View>

            {/* Table Rows */}
            {tableData.map((row, i) => (
              <TableRow key={row.id || i} row={row} isEven={i % 2 === 0} />
            ))}
          </View>
        </View>
      )}

      {/* No Data State */}
      {tableData.length === 0 && (
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>
            No defects recorded at mapped locations
          </Text>
        </View>
      )}
    </View>
  );
};

export default DefectLocationSummaryPDF;
