import {
  FincheckInspectionReports,
  UserMain,
  QASectionsProductLocation,
  QASectionsMeasurementSpecs,
  DtOrder,
} from "../../MongoDB/dbConnectionController.js";

// ============================================================
// GET: QA Analytics Summary (Logic Fixed for Nested Defects)
// ============================================================
export const getQAAnalyticsSummary = async (req, res) => {
  try {
    const { empId, topN } = req.query;
    const limitDefects = parseInt(topN) || 5;

    if (!empId) {
      return res
        .status(400)
        .json({ success: false, message: "QA Employee ID is required" });
    }

    // 1. Fetch User Profile
    const userProfile = await UserMain.findOne({ emp_id: empId }).select(
      "emp_id eng_name face_photo job_title",
    );

    if (!userProfile) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // 2. Fetch Reports (Raw Data)
    // We fetch only necessary fields to keep it fast
    const reports = await FincheckInspectionReports.find({
      empId: empId,
      status: { $ne: "cancelled" },
    })
      .select(
        "reportType orderNos inspectionMethod inspectionDetails inspectionConfig defectData",
      )
      .lean();

    // 3. Initialize Accumulators
    const overall = {
      totalReports: reports.length,
      allOrders: new Set(),
      totalSampleSize: 0,
      totalDefects: 0,
      minor: 0,
      major: 0,
      critical: 0,
    };

    // Map: ReportType -> Data Object
    const reportTypeMap = {};

    // 4. Iterate and Process (The "Flattening" Logic)
    reports.forEach((report) => {
      // A. Track Styles
      if (report.orderNos && Array.isArray(report.orderNos)) {
        report.orderNos.forEach((o) => overall.allOrders.add(o));
      }

      // B. Calculate Sample Size
      let sampleSize = 0;
      if (report.inspectionMethod === "AQL") {
        sampleSize = report.inspectionDetails?.aqlSampleSize || 0;
      } else {
        sampleSize = report.inspectionConfig?.sampleSize || 0;
      }
      overall.totalSampleSize += sampleSize;

      // C. Initialize Report Type Group
      const rType = report.reportType || "Unknown";
      if (!reportTypeMap[rType]) {
        reportTypeMap[rType] = {
          reportType: rType,
          reportCount: 0,
          uniqueStyles: new Set(),
          sampleSize: 0,
          totalDefects: 0,
          minor: 0,
          major: 0,
          critical: 0,
          defectsMap: {}, // To count specific defect names
        };
      }
      const group = reportTypeMap[rType];
      group.reportCount += 1;
      group.sampleSize += sampleSize;

      // Track Unique Styles per Group
      if (report.orderNos && Array.isArray(report.orderNos)) {
        report.orderNos.forEach((o) => group.uniqueStyles.add(o));
      }

      // D. Process Defects (Crucial Logic Adjustment)
      if (report.defectData && Array.isArray(report.defectData)) {
        report.defectData.forEach((defect) => {
          const name = defect.defectName;

          if (defect.isNoLocation) {
            // --- SCENARIO 1: No Location (Qty is at root) ---
            const qty = defect.qty || 0;
            const status = defect.status; // "Minor", "Major", "Critical"

            // Update Counts
            overall.totalDefects += qty;
            group.totalDefects += qty;

            if (status === "Minor") {
              overall.minor += qty;
              group.minor += qty;
            } else if (status === "Major") {
              overall.major += qty;
              group.major += qty;
            } else if (status === "Critical") {
              overall.critical += qty;
              group.critical += qty;
            }

            // Update Defect Name Map
            if (!group.defectsMap[name]) group.defectsMap[name] = 0;
            group.defectsMap[name] += qty;
          } else {
            // --- SCENARIO 2: Location Based (Count Positions) ---
            if (defect.locations && Array.isArray(defect.locations)) {
              defect.locations.forEach((loc) => {
                if (loc.positions && Array.isArray(loc.positions)) {
                  loc.positions.forEach((pos) => {
                    // 1 Position = 1 Defect Qty
                    const qty = 1;
                    const status = pos.status; // "Minor", "Major", "Critical"

                    // Update Counts
                    overall.totalDefects += qty;
                    group.totalDefects += qty;

                    if (status === "Minor") {
                      overall.minor += qty;
                      group.minor += qty;
                    } else if (status === "Major") {
                      overall.major += qty;
                      group.major += qty;
                    } else if (status === "Critical") {
                      overall.critical += qty;
                      group.critical += qty;
                    }

                    // Update Defect Name Map
                    if (!group.defectsMap[name]) group.defectsMap[name] = 0;
                    group.defectsMap[name] += qty;
                  });
                }
              });
            }
          }
        });
      }
    });

    // 5. Final Formatting for Frontend
    const tableRows = Object.values(reportTypeMap).map((group) => {
      // Sort defects by qty desc and slice top N
      const topDefects = Object.entries(group.defectsMap)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, limitDefects); // <--- Top N applied here

      // Remove the map to clean up response
      const { defectsMap, uniqueStyles, ...rest } = group;
      return { ...rest, totalStyles: uniqueStyles.size, topDefects };
    });

    // Sort report types alphabetically or by count if preferred
    tableRows.sort((a, b) => a.reportType.localeCompare(b.reportType));

    return res.status(200).json({
      success: true,
      data: {
        profile: userProfile,
        stats: {
          totalReports: overall.totalReports,
          totalStyles: overall.allOrders.size,
          totalSample: overall.totalSampleSize,
          totalDefects: overall.totalDefects,
          minor: overall.minor,
          major: overall.major,
          critical: overall.critical,
          defectRate:
            overall.totalSampleSize > 0
              ? (
                  (overall.totalDefects / overall.totalSampleSize) *
                  100
                ).toFixed(2)
              : "0.00",
        },
        reportBreakdown: tableRows,
        tableRows: tableRows,
      },
    });
  } catch (error) {
    console.error("Error fetching QA analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ============================================================
// GET: QA Style Breakdown (Pivot Table)
// ============================================================

export const getQAStyleAnalytics = async (req, res) => {
  try {
    const { empId, reportType } = req.query;

    if (!empId) {
      return res
        .status(400)
        .json({ success: false, message: "QA ID required" });
    }

    // 1. Fetch ALL reports for this QA (to calculate available types + filtered data)
    const allReports = await FincheckInspectionReports.find({
      empId: empId,
      status: { $ne: "cancelled" },
    })
      .select(
        "orderNos reportType inspectionMethod inspectionDetails inspectionConfig defectData",
      )
      .lean();

    // 2. Extract Available Report Types (For the Toggle Buttons)
    const availableTypes = [
      ...new Set(allReports.map((r) => r.reportType)),
    ].sort();

    // 3. Filter Reports based on selected Toggle (if not 'All')
    const filteredReports =
      !reportType || reportType === "All"
        ? allReports
        : allReports.filter((r) => r.reportType === reportType);

    // 4. Data Structures for Pivoting
    const styleMap = {}; // Key: Style Name (OrderNo)

    // 5. Process Filtered Reports
    filteredReports.forEach((report) => {
      // Calculate Sample Size
      let sampleSize = 0;
      if (report.inspectionMethod === "AQL") {
        sampleSize = report.inspectionDetails?.aqlSampleSize || 0;
      } else {
        sampleSize = report.inspectionConfig?.sampleSize || 0;
      }

      // Extract Defects for this report
      const reportDefects = [];
      if (report.defectData && Array.isArray(report.defectData)) {
        report.defectData.forEach((defect) => {
          const defName = defect.defectName;
          // Flatten Qty logic
          let qty = 0;
          if (defect.isNoLocation) {
            qty = defect.qty || 0;
          } else if (defect.locations) {
            defect.locations.forEach((loc) => {
              if (loc.positions) qty += loc.positions.length;
            });
          }

          if (qty > 0) {
            reportDefects.push({ name: defName, qty });
          }
        });
      }

      const totalReportDefects = reportDefects.reduce(
        (sum, d) => sum + d.qty,
        0,
      );

      // Distribute Stats to Styles
      if (report.orderNos && Array.isArray(report.orderNos)) {
        report.orderNos.forEach((style) => {
          if (!styleMap[style]) {
            styleMap[style] = {
              style: style,
              totalReports: 0,
              totalSample: 0,
              totalDefects: 0,
              defectsMap: {}, // Intermediate map to aggregate counts
            };
          }

          const entry = styleMap[style];
          entry.totalReports += 1;
          entry.totalSample += sampleSize;
          entry.totalDefects += totalReportDefects;

          // Aggregate specific defects
          reportDefects.forEach((d) => {
            if (!entry.defectsMap[d.name]) {
              entry.defectsMap[d.name] = 0;
            }
            entry.defectsMap[d.name] += d.qty;
          });
        });
      }
    });

    // 6. Format Rows
    const rows = Object.values(styleMap).map((item) => {
      // Calculate Rate
      const rate =
        item.totalSample > 0
          ? ((item.totalDefects / item.totalSample) * 100).toFixed(2)
          : "0.00";

      // Convert Defects Map to Sorted Array (Highest Qty First)
      const defectList = Object.entries(item.defectsMap)
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty);

      // Clean up the map from output
      const { defectsMap, ...rest } = item;

      return {
        ...rest,
        defectRate: rate,
        defectDetails: defectList, // Array of {name, qty}
      };
    });

    // Sort rows by Style Name
    rows.sort((a, b) => a.style.localeCompare(b.style));

    return res.status(200).json({
      success: true,
      data: {
        reportTypes: availableTypes, // Send list for buttons
        rows: rows,
      },
    });
  } catch (error) {
    console.error("Error fetching style analytics:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// GET: QA Trend Analytics (Chart Data)
// ============================================================
export const getQATrendAnalytics = async (req, res) => {
  try {
    const { empId, startDate, endDate } = req.query;

    if (!empId) {
      return res
        .status(400)
        .json({ success: false, message: "QA ID required" });
    }

    // Date Logic
    let matchStage = {
      empId: empId,
      status: { $ne: "cancelled" },
    };

    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchStage.inspectionDate = { $gte: start, $lte: end };
    }

    const pipeline = [
      { $match: matchStage },
      // 1. Normalize Defects (Same logic as Summary to ensure accuracy)
      {
        $addFields: {
          normalizedDefects: {
            $concatArrays: [
              // Location-Based
              {
                $reduce: {
                  input: {
                    $filter: {
                      input: { $ifNull: ["$defectData", []] },
                      as: "d",
                      cond: { $ne: ["$$d.isNoLocation", true] },
                    },
                  },
                  initialValue: [],
                  in: {
                    $concatArrays: [
                      "$$value",
                      {
                        $reduce: {
                          input: { $ifNull: ["$$this.locations", []] },
                          initialValue: [],
                          in: {
                            $concatArrays: [
                              "$$value",
                              {
                                $map: {
                                  input: { $ifNull: ["$$this.positions", []] },
                                  as: "pos",
                                  in: { qty: 1 }, // 1 Position = 1 Defect
                                },
                              },
                            ],
                          },
                        },
                      },
                    ],
                  },
                },
              },
              // No-Location
              {
                $map: {
                  input: {
                    $filter: {
                      input: { $ifNull: ["$defectData", []] },
                      as: "d",
                      cond: { $eq: ["$$d.isNoLocation", true] },
                    },
                  },
                  as: "noLoc",
                  in: { qty: { $ifNull: ["$$noLoc.qty", 1] } },
                },
              },
            ],
          },
          // Normalize Sample Size
          calculatedSampleSize: {
            $cond: [
              { $eq: ["$inspectionMethod", "AQL"] },
              { $ifNull: ["$inspectionDetails.aqlSampleSize", 0] },
              { $ifNull: ["$inspectionConfig.sampleSize", 0] },
            ],
          },
          // Format Date for Grouping
          dateKey: {
            $dateToString: { format: "%Y-%m-%d", date: "$inspectionDate" },
          },
        },
      },
      // 2. Unwind Defects to Sum
      {
        $unwind: {
          path: "$normalizedDefects",
          preserveNullAndEmptyArrays: true,
        },
      },
      // 3. Group By Date
      {
        $group: {
          _id: "$dateKey",
          // Use Set to count unique reports (because of unwind)
          uniqueReports: { $addToSet: "$_id" },
          // Re-calculate sample size sum (handle unwind duplication by pushing then reducing, or simple math)
          docs: {
            $addToSet: {
              id: "$_id",
              sample: "$calculatedSampleSize",
            },
          },
          totalDefects: { $sum: { $ifNull: ["$normalizedDefects.qty", 0] } },
        },
      },
      // 4. Final Projection
      {
        $project: {
          date: "$_id",
          reportCount: { $size: "$uniqueReports" },
          totalDefects: 1,
          totalSample: { $sum: "$docs.sample" },
        },
      },
      { $sort: { date: 1 } }, // Sort Ascending
    ];

    const data = await FincheckInspectionReports.aggregate(pipeline);

    return res.status(200).json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error("Error fetching trend analytics:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// GET: Style Summary Analytics (Detailed)
// ============================================================

export const getStyleSummaryAnalytics = async (req, res) => {
  try {
    const { styleNo } = req.query;

    const query = { status: { $ne: "cancelled" } };
    if (styleNo) {
      query.orderNos = styleNo;
    }

    const reports = await FincheckInspectionReports.find(query)
      .select(
        "orderNos reportType inspectionMethod inspectionDetails inspectionConfig defectData productType productTypeId buyer",
      )
      .populate("productTypeId", "imageURL")
      .lean();

    const styleMap = {};

    reports.forEach((report) => {
      // Calculate Sample Size
      let sampleSize = 0;
      if (report.inspectionMethod === "AQL") {
        sampleSize = report.inspectionDetails?.aqlSampleSize || 0;
      } else {
        sampleSize = report.inspectionConfig?.sampleSize || 0;
      }

      // Process Defects
      let reportTotalDefects = 0;
      let reportMinor = 0;
      let reportMajor = 0;
      let reportCritical = 0;
      const defectBreakdown = {};

      if (report.defectData && Array.isArray(report.defectData)) {
        report.defectData.forEach((defect) => {
          const name = defect.defectName;
          const code = defect.defectCode || "";
          const fullName = code ? `[${code}] ${name}` : name;

          const processQty = (qty, status) => {
            reportTotalDefects += qty;
            if (status === "Minor") reportMinor += qty;
            if (status === "Major") reportMajor += qty;
            if (status === "Critical") reportCritical += qty;

            if (!defectBreakdown[fullName]) {
              defectBreakdown[fullName] = {
                qty: 0,
                minor: 0,
                major: 0,
                critical: 0,
              };
            }
            defectBreakdown[fullName].qty += qty;
            if (status === "Minor") defectBreakdown[fullName].minor += qty;
            if (status === "Major") defectBreakdown[fullName].major += qty;
            if (status === "Critical")
              defectBreakdown[fullName].critical += qty;
          };

          if (defect.isNoLocation) {
            processQty(defect.qty || 0, defect.status);
          } else if (defect.locations) {
            defect.locations.forEach((loc) => {
              if (loc.positions) {
                loc.positions.forEach((pos) => {
                  processQty(1, pos.status);
                });
              }
            });
          }
        });
      }

      // Distribute to Styles
      if (report.orderNos && Array.isArray(report.orderNos)) {
        report.orderNos.forEach((orderNo) => {
          if (styleNo && orderNo !== styleNo) return;

          if (!styleMap[orderNo]) {
            styleMap[orderNo] = {
              style: orderNo,
              custStyle: report.inspectionDetails?.custStyle || "N/A",
              buyer: report.buyer || "N/A",
              orderQty: report.inspectionDetails?.totalOrderQty || 0,
              productType: report.productType || "N/A",
              productImage: report.productTypeId?.imageURL || null,

              totalReports: 0,
              totalSample: 0,
              totalDefects: 0,
              minor: 0,
              major: 0,
              critical: 0,

              reportsByType: {},
              defectsList: {},
            };
          }

          const entry = styleMap[orderNo];

          if (report.inspectionDetails?.custStyle)
            entry.custStyle = report.inspectionDetails.custStyle;
          if (report.buyer) entry.buyer = report.buyer;
          if (report.inspectionDetails?.totalOrderQty)
            entry.orderQty = report.inspectionDetails.totalOrderQty;
          if (report.productType) entry.productType = report.productType;
          if (report.productTypeId?.imageURL)
            entry.productImage = report.productTypeId.imageURL;

          entry.totalReports += 1;
          entry.totalSample += sampleSize;
          entry.totalDefects += reportTotalDefects;
          entry.minor += reportMinor;
          entry.major += reportMajor;
          entry.critical += reportCritical;

          const rType = report.reportType || "Unknown";
          if (!entry.reportsByType[rType]) {
            entry.reportsByType[rType] = {
              type: rType,
              count: 0,
              sample: 0,
              defects: 0,
              minor: 0,
              major: 0,
              critical: 0,
              defectsMap: {},
            };
          }
          const typeEntry = entry.reportsByType[rType];
          typeEntry.count += 1;
          typeEntry.sample += sampleSize;
          typeEntry.defects += reportTotalDefects;
          typeEntry.minor += reportMinor;
          typeEntry.major += reportMajor;
          typeEntry.critical += reportCritical;

          Object.entries(defectBreakdown).forEach(([key, val]) => {
            // Global List
            if (!entry.defectsList[key]) {
              entry.defectsList[key] = {
                name: key,
                qty: 0,
                minor: 0,
                major: 0,
                critical: 0,
              };
            }
            entry.defectsList[key].qty += val.qty;
            entry.defectsList[key].minor += val.minor;
            entry.defectsList[key].major += val.major;
            entry.defectsList[key].critical += val.critical;

            // Report Type List (Updated to track breakdown)
            if (!typeEntry.defectsMap[key]) {
              typeEntry.defectsMap[key] = {
                name: key,
                qty: 0,
                minor: 0,
                major: 0,
                critical: 0,
              };
            }
            typeEntry.defectsMap[key].qty += val.qty;
            typeEntry.defectsMap[key].minor += val.minor;
            typeEntry.defectsMap[key].major += val.major;
            typeEntry.defectsMap[key].critical += val.critical;
          });
        });
      }
    });

    if (styleNo) {
      const data = styleMap[styleNo];
      if (!data)
        return res
          .status(404)
          .json({ success: false, message: "Style not found" });

      // Transform reportsByType map to array AND sort defects
      data.reportsByType = Object.values(data.reportsByType).map((typeData) => {
        const topDefects = Object.values(typeData.defectsMap) // Use values now, as it's an object
          .sort((a, b) => b.qty - a.qty);

        const { defectsMap, ...rest } = typeData;
        return { ...rest, topDefects };
      });

      data.defectsList = Object.values(data.defectsList).sort(
        (a, b) => b.qty - a.qty,
      );

      data.defectRate =
        data.totalSample > 0
          ? ((data.totalDefects / data.totalSample) * 100).toFixed(2)
          : "0.00";

      return res.status(200).json({ success: true, data });
    } else {
      const list = Object.values(styleMap)
        .map((s) => ({
          style: s.style,
          custStyle: s.custStyle,
          buyer: s.buyer,
        }))
        .sort((a, b) => a.style.localeCompare(b.style));

      return res.status(200).json({ success: true, data: list });
    }
  } catch (error) {
    console.error("Error fetching style summary:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// GET: Style Trend Analytics (Last 7 Days Logic)
// ============================================================

export const getStyleTrendAnalytics = async (req, res) => {
  try {
    const { styleNo, startDate, endDate } = req.query;

    if (!styleNo) {
      return res
        .status(400)
        .json({ success: false, message: "Style No required" });
    }

    // 1. Determine Date Range
    let start, end;

    if (startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else {
      const lastReport = await FincheckInspectionReports.findOne({
        orderNos: styleNo,
        status: { $ne: "cancelled" },
      })
        .sort({ inspectionDate: -1 })
        .select("inspectionDate");

      if (!lastReport) {
        return res.status(200).json({ success: true, data: [] });
      }

      end = new Date(lastReport.inspectionDate);
      end.setHours(23, 59, 59, 999);

      start = new Date(end);
      start.setDate(start.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    }

    // 2. Aggregation Pipeline (Optimized: No Unwind)
    const pipeline = [
      {
        $match: {
          orderNos: styleNo,
          status: { $ne: "cancelled" },
          inspectionDate: { $gte: start, $lte: end },
        },
      },
      {
        $addFields: {
          // 1. Format Date
          dateKey: {
            $dateToString: { format: "%Y-%m-%d", date: "$inspectionDate" },
          },

          // 2. Calculate Sample Size for this specific report
          reportSampleSize: {
            $cond: [
              { $eq: ["$inspectionMethod", "AQL"] },
              { $ifNull: ["$inspectionDetails.aqlSampleSize", 0] },
              { $ifNull: ["$inspectionConfig.sampleSize", 0] },
            ],
          },

          // 3. Construct Flat Defect Array for this report (Internal use)
          _tempDefects: {
            $concatArrays: [
              // Location Defects
              {
                $reduce: {
                  input: {
                    $filter: {
                      input: { $ifNull: ["$defectData", []] },
                      as: "d",
                      cond: { $ne: ["$$d.isNoLocation", true] },
                    },
                  },
                  initialValue: [],
                  in: {
                    $concatArrays: [
                      "$$value",
                      {
                        $reduce: {
                          input: { $ifNull: ["$$this.locations", []] },
                          initialValue: [],
                          in: {
                            $concatArrays: [
                              "$$value",
                              {
                                $map: {
                                  input: { $ifNull: ["$$this.positions", []] },
                                  as: "pos",
                                  in: 1, // Just count 1 for each position
                                },
                              },
                            ],
                          },
                        },
                      },
                    ],
                  },
                },
              },
              // No-Location Defects
              {
                $map: {
                  input: {
                    $filter: {
                      input: { $ifNull: ["$defectData", []] },
                      as: "d",
                      cond: { $eq: ["$$d.isNoLocation", true] },
                    },
                  },
                  as: "noLoc",
                  in: { $ifNull: ["$$noLoc.qty", 1] },
                },
              },
            ],
          },
        },
      },
      // 4. Calculate Total Defects PER REPORT (Sum the array)
      {
        $addFields: {
          reportDefectTotal: { $sum: "$_tempDefects" },
        },
      },
      // 5. Group By Date (Summing up report-level totals)
      {
        $group: {
          _id: "$dateKey",
          reportCount: { $sum: 1 }, // Simple count of documents
          totalDefects: { $sum: "$reportDefectTotal" },
          totalSample: { $sum: "$reportSampleSize" },
        },
      },
      // 6. Project Final Shape
      {
        $project: {
          date: "$_id",
          reportCount: 1,
          totalDefects: 1,
          totalSample: 1,
        },
      },
      { $sort: { date: 1 } },
    ];

    const data = await FincheckInspectionReports.aggregate(pipeline);

    // Filter out Sundays
    const filteredData = data.filter((d) => {
      const day = new Date(d.date).getDay();
      return day !== 0;
    });

    return res.status(200).json({
      success: true,
      data: filteredData,
      range: {
        start: start.toISOString().split("T")[0],
        end: end.toISOString().split("T")[0],
      },
    });
  } catch (error) {
    console.error("Error fetching style trend:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// GET: Style Summary Defect Location Map
// ============================================================
export const getStyleSummaryDefectMap = async (req, res) => {
  try {
    const { styleNo } = req.query;

    if (!styleNo) {
      return res
        .status(400)
        .json({ success: false, message: "Style No required" });
    }

    // 1. Fetch Reports for this Style
    // We need defectData and productTypeId to get the correct map image
    const reports = await FincheckInspectionReports.find({
      orderNos: styleNo,
      status: { $ne: "cancelled" },
    })
      .select("defectData productTypeId")
      .lean();

    if (reports.length === 0) {
      return res.status(200).json({ success: true, data: null });
    }

    // 2. Determine Product Type (Use the most frequent one if mixed, or just the first valid one)
    const productTypeId = reports.find((r) => r.productTypeId)?.productTypeId;

    if (!productTypeId) {
      return res
        .status(200)
        .json({ success: true, data: null, message: "No product type found" });
    }

    // 3. Fetch Location Map Configuration
    const locationMap = await QASectionsProductLocation.findOne({
      productTypeId: productTypeId,
      isActive: true,
    }).lean();

    if (!locationMap) {
      return res
        .status(200)
        .json({ success: true, data: null, message: "No map config found" });
    }

    // 4. Aggregate Counts
    const counts = {
      Front: {},
      Back: {},
    };

    reports.forEach((report) => {
      if (report.defectData && Array.isArray(report.defectData)) {
        report.defectData.forEach((defect) => {
          if (!defect.isNoLocation && defect.locations) {
            defect.locations.forEach((loc) => {
              const locNo = loc.locationNo;
              const viewKey =
                loc.view && loc.view.toLowerCase() === "back"
                  ? "Back"
                  : "Front";

              // Calculate qty for this location instance
              // If positions array exists, sum them. Else use loc.qty
              let qty = 0;
              if (loc.positions && loc.positions.length > 0) {
                qty = loc.positions.length;
              } else {
                qty = loc.qty || 0;
              }

              const defectName = defect.defectName;

              // Initialize if not exists
              if (!counts[viewKey][locNo]) {
                counts[viewKey][locNo] = {
                  total: 0,
                  defects: {},
                };
              }

              // Add to totals
              counts[viewKey][locNo].total += qty;

              // Add to breakdown
              if (counts[viewKey][locNo].defects[defectName]) {
                counts[viewKey][locNo].defects[defectName] += qty;
              } else {
                counts[viewKey][locNo].defects[defectName] = qty;
              }
            });
          }
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        map: locationMap,
        counts: counts,
      },
    });
  } catch (error) {
    console.error("Error fetching style location map:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// GET: Style Measurement Analytics (Paginated & Aggregated)
// ============================================================

export const getStyleMeasurementAnalytics = async (req, res) => {
  try {
    const { styleNo, reportType, page = 1, limit = 5 } = req.query;

    if (!styleNo) {
      return res
        .status(400)
        .json({ success: false, message: "Style No required" });
    }

    // 1. Fetch Specs & Size List
    const dtOrder = await DtOrder.findOne({
      Order_No: { $regex: new RegExp(`^${styleNo}$`, "i") },
    })
      .select("SizeList OrderColors")
      .lean();

    const sizeList = dtOrder?.SizeList || [];

    const specsRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${styleNo}$`, "i") },
    }).lean();

    const specsData = {
      Before: { full: [], selected: [] },
      After: { full: [], selected: [] },
    };

    if (specsRecord) {
      specsData.Before.full = specsRecord.AllBeforeWashSpecs || [];
      // Populate selected (Critical) specs
      specsData.Before.selected = specsRecord.selectedBeforeWashSpecs || [];

      specsData.After.full = specsRecord.AllAfterWashSpecs || [];
      specsData.After.selected = specsRecord.selectedAfterWashSpecs || [];
    } else if (dtOrder && dtOrder.BeforeWashSpecs) {
      const legacySpecs = dtOrder.BeforeWashSpecs.map((s) => ({
        ...s,
        id: s._id ? s._id.toString() : s.id,
      }));
      specsData.Before.full = legacySpecs;
      specsData.Before.selected = legacySpecs; // Legacy often treated all as critical
    }

    // 2. Query
    const query = {
      orderNos: styleNo,
      status: { $ne: "cancelled" },
    };

    if (reportType && reportType !== "All") {
      query.reportType = reportType;
    }

    const availableTypes = await FincheckInspectionReports.distinct(
      "reportType",
      {
        orderNos: styleNo,
        status: { $ne: "cancelled" },
      },
    );

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reports = await FincheckInspectionReports.find(query)
      .sort({ inspectionDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select(
        "reportId reportType inspectionDate empId empName measurementData inspectionConfig",
      )
      .lean();

    const totalReports = await FincheckInspectionReports.countDocuments(query);

    // 3. Process Reports
    const processedReports = await Promise.all(
      reports.map(async (report) => {
        let qaName = report.empName;
        let qaFacePhoto = null; // Init

        // Fetch QA Details including Face Photo
        if (report.empId) {
          const user = await UserMain.findOne({ emp_id: report.empId }).select(
            "eng_name face_photo",
          );
          if (user) {
            if (!qaName) qaName = user.eng_name;
            qaFacePhoto = user.face_photo;
          }
        }

        const groupedMeasurements = {};
        const hasMeasurementData =
          report.measurementData && report.measurementData.length > 0;

        if (hasMeasurementData) {
          report.measurementData.forEach((m) => {
            const line = m.lineName || m.line || "";
            const table = m.tableName || m.table || "";
            const color = m.colorName || m.color || "";
            const stage = m.stage || "Before";

            // 1. EXTRACT K-VALUE (Default to empty string if missing)
            const kVal = m.kValue || "";

            // 2. MODIFY KEY TO INCLUDE K-VALUE
            const key = `${line}||${table}||${color}||${stage}||${kVal}`;

            //const key = `${line}||${table}||${color}||${stage}`;

            if (!groupedMeasurements[key]) {
              groupedMeasurements[key] = {
                config: { line, table, color },
                stage: stage,
                kValue: kVal,
                stageLabel:
                  stage === "Before"
                    ? "Before Wash Measurement"
                    : "Buyer Spec Measurement",
                measurements: [],
                manualMeasurements: [],
              };
            }
            // --- Check for Manual Entry and separate it ---
            if (m.size === "Manual_Entry") {
              // Push to manual array so frontend can iterate images easily
              groupedMeasurements[key].manualMeasurements.push(m);
            } else {
              // Push to standard array for the Table
              groupedMeasurements[key].measurements.push(m);
            }
            //groupedMeasurements[key].measurements.push(m);
          });
        }

        return {
          _id: report._id,
          reportId: report.reportId,
          reportType: report.reportType,
          inspectionDate: report.inspectionDate,
          qaId: report.empId,
          qaName: qaName,
          qaFacePhoto: qaFacePhoto, // Return Photo
          hasMeasurementData: hasMeasurementData,
          measurementGroups: Object.values(groupedMeasurements),
        };
      }),
    );

    return res.status(200).json({
      success: true,
      data: {
        specs: specsData,
        sizeList: sizeList,
        reportTypes: availableTypes.sort(),
        reports: processedReports,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(totalReports / parseInt(limit)),
          totalRecords: totalReports,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching style measurement analytics:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// GET: Style Measurement Final Conclusion (Aggregated across all reports)
// ============================================================

export const getStyleMeasurementConclusion = async (req, res) => {
  try {
    const { styleNo, reportType, stage } = req.query;

    if (!styleNo) {
      return res
        .status(400)
        .json({ success: false, message: "Style No required" });
    }

    // 1. Fetch Specs & Size List
    const dtOrder = await DtOrder.findOne({
      Order_No: { $regex: new RegExp(`^${styleNo}$`, "i") },
    })
      .select("SizeList")
      .lean();

    const sizeList = dtOrder?.SizeList || [];

    const specsRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${styleNo}$`, "i") },
    }).lean();

    // Critical Point variable declarations
    const criticalPointNames = new Set();

    // Get specs
    const beforeSpecs = specsRecord?.AllBeforeWashSpecs || [];
    const afterSpecs = specsRecord?.AllAfterWashSpecs || [];

    // Get SELECTED/CRITICAL specs only
    const beforeCritSpecs = specsRecord?.selectedBeforeWashSpecs || [];
    const afterCritSpecs = specsRecord?.selectedAfterWashSpecs || [];

    // Mark critical measurement points from SELECTED specs only
    [...beforeCritSpecs, ...afterCritSpecs].forEach((s) => {
      const name = (s.MeasurementPointEngName || s.name || "").trim();
      if (name) {
        criticalPointNames.add(name);
      }
    });

    // 2. Build lookup maps
    // Map spec ID to measurement point name
    const specIdToPointName = new Map();
    // Map measurement point name to spec details (for Tol-, Tol+)
    const pointNameToSpec = new Map();
    // Track all unique measurement point names
    const allPointNames = new Set();

    [...beforeSpecs, ...afterSpecs].forEach((s) => {
      const id = s.id || s._id?.toString();
      const name = (s.MeasurementPointEngName || s.name || "").trim();

      if (!name) return;

      specIdToPointName.set(id, name);
      allPointNames.add(name);

      // Store first occurrence for tolerance values
      if (!pointNameToSpec.has(name)) {
        pointNameToSpec.set(name, {
          name: name,
          TolMinus: s.TolMinus,
          TolPlus: s.TolPlus,
        });
      }
    });

    // 3. Query Reports
    const query = {
      orderNos: styleNo,
      status: { $ne: "cancelled" },
    };

    if (reportType && reportType !== "All") {
      query.reportType = reportType;
    }

    // Get available report types
    const availableTypes = await FincheckInspectionReports.distinct(
      "reportType",
      {
        orderNos: styleNo,
        status: { $ne: "cancelled" },
      },
    );

    const reports = await FincheckInspectionReports.find(query)
      .select("measurementData reportType")
      .lean();

    // 4. Aggregate measurements
    const aggregatedData = {};

    // Helper function to check tolerance
    const checkToleranceAndCategorize = (decimal, tolMinus, tolPlus) => {
      if (isNaN(decimal)) {
        return { counted: false };
      }

      const tolMinusDecimal = parseFloat(tolMinus?.decimal);
      const tolPlusDecimal = parseFloat(tolPlus?.decimal);

      // If no tolerances defined, consider it as pass
      if (isNaN(tolMinusDecimal) && isNaN(tolPlusDecimal)) {
        return {
          counted: true,
          isPass: true,
          isNegTol: false,
          isPosTol: false,
        };
      }

      const lowerLimit = isNaN(tolMinusDecimal)
        ? 0
        : -Math.abs(tolMinusDecimal);
      const upperLimit = isNaN(tolPlusDecimal) ? 0 : Math.abs(tolPlusDecimal);
      const epsilon = 0.0001;

      const isWithin =
        decimal >= lowerLimit - epsilon && decimal <= upperLimit + epsilon;

      if (isWithin) {
        return {
          counted: true,
          isPass: true,
          isNegTol: false,
          isPosTol: false,
        };
      } else {
        const isNegTol = decimal < lowerLimit;
        const isPosTol = decimal > upperLimit;
        return { counted: true, isPass: false, isNegTol, isPosTol };
      }
    };

    // --- REFACTORED PROCESSOR: Uses validIndices array ---
    const processMeasurementEntry = (
      specId,
      pcsData, // The object containing { "0": val, "1": val }
      validIndices, // The array [0, 1, 2] from allEnabledPcs
      size,
      stageFilter,
      measurementStage,
    ) => {
      if (!pcsData || typeof pcsData !== "object") return;

      // Apply stage filter
      if (stageFilter !== "All" && measurementStage !== stageFilter) return;

      const measurementPointName = specIdToPointName.get(specId);
      if (!measurementPointName) return;

      const specInfo = pointNameToSpec.get(measurementPointName);
      if (!specInfo) return;

      // Initialize aggregated data structure
      if (!aggregatedData[measurementPointName]) {
        aggregatedData[measurementPointName] = {};
      }
      if (!aggregatedData[measurementPointName][size]) {
        aggregatedData[measurementPointName][size] = {
          points: 0,
          pass: 0,
          fail: 0,
          negTol: 0,
          posTol: 0,
        };
      }

      // --- ITERATE ONLY VALID INDICES ---
      validIndices.forEach((pcsIndex) => {
        const valObj = pcsData[pcsIndex];

        if (!valObj || valObj.decimal === undefined) return;

        const decimal = parseFloat(valObj.decimal);

        const result = checkToleranceAndCategorize(
          decimal,
          specInfo.TolMinus,
          specInfo.TolPlus,
        );

        if (result.counted) {
          aggregatedData[measurementPointName][size].points += 1;

          if (result.isPass) {
            aggregatedData[measurementPointName][size].pass += 1;
          } else {
            aggregatedData[measurementPointName][size].fail += 1;
            if (result.isNegTol) {
              aggregatedData[measurementPointName][size].negTol += 1;
            }
            if (result.isPosTol) {
              aggregatedData[measurementPointName][size].posTol += 1;
            }
          }
        }
      });
    };

    const stageFilter = stage || "All";

    // --- MAIN REPORT LOOP ---
    reports.forEach((report) => {
      if (!report.measurementData || !Array.isArray(report.measurementData))
        return;

      report.measurementData.forEach((m) => {
        if (m.size === "Manual_Entry") return;

        const size = m.size;
        const measurementStage = m.stage || "Before";

        // 1. Extract Valid Indices Arrays
        // Fallback to empty array if undefined
        const validAllIndices = Array.isArray(m.allEnabledPcs)
          ? m.allEnabledPcs
          : [];
        const validCritIndices = Array.isArray(m.criticalEnabledPcs)
          ? m.criticalEnabledPcs
          : [];

        // 2. Process allMeasurements using validAllIndices
        if (m.allMeasurements && typeof m.allMeasurements === "object") {
          Object.entries(m.allMeasurements).forEach(([specId, pcsData]) => {
            processMeasurementEntry(
              specId,
              pcsData,
              validAllIndices, // Pass the filter array
              size,
              stageFilter,
              measurementStage,
            );
          });
        }

        // 3. Process criticalMeasurements using validCritIndices
        if (
          m.criticalMeasurements &&
          typeof m.criticalMeasurements === "object"
        ) {
          Object.entries(m.criticalMeasurements).forEach(
            ([specId, pcsData]) => {
              processMeasurementEntry(
                specId,
                pcsData,
                validCritIndices, // Pass the filter array
                size,
                stageFilter,
                measurementStage,
              );
            },
          );
        }
      });
    });

    // 5. Format response - iterate by unique measurement point names
    const specsWithData = [];

    allPointNames.forEach((pointName) => {
      const specInfo = pointNameToSpec.get(pointName);
      if (!specInfo) return;

      const sizeData = {};
      let hasMeasurements = false;

      sizeList.forEach((size) => {
        const data = aggregatedData[pointName]?.[size] || {
          points: 0,
          pass: 0,
          fail: 0,
          negTol: 0,
          posTol: 0,
        };
        sizeData[size] = data;
        if (data.points > 0) hasMeasurements = true;
      });

      if (hasMeasurements) {
        specsWithData.push({
          id: pointName,
          measurementPointName: pointName,
          tolMinus: specInfo.TolMinus?.fraction || "-",
          tolPlus: specInfo.TolPlus?.fraction || "-",
          tolMinusDecimal: specInfo.TolMinus?.decimal || 0,
          sizeData,
          hasMeasurements,
          isCritical: criticalPointNames.has(pointName),
        });
      }
    });

    // Sort specs alphabetically by measurement point name
    specsWithData.sort((a, b) =>
      a.measurementPointName.localeCompare(b.measurementPointName),
    );

    // 6. Calculate totals per size
    const sizeTotals = {};
    sizeList.forEach((size) => {
      sizeTotals[size] = {
        points: 0,
        pass: 0,
        fail: 0,
        negTol: 0,
        posTol: 0,
      };

      specsWithData.forEach((spec) => {
        const data = spec.sizeData[size];
        if (data) {
          sizeTotals[size].points += data.points;
          sizeTotals[size].pass += data.pass;
          sizeTotals[size].fail += data.fail;
          sizeTotals[size].negTol += data.negTol;
          sizeTotals[size].posTol += data.posTol;
        }
      });
    });

    // 7. Calculate grand totals
    const grandTotals = {
      points: 0,
      pass: 0,
      fail: 0,
      negTol: 0,
      posTol: 0,
    };

    Object.values(sizeTotals).forEach((totals) => {
      grandTotals.points += totals.points;
      grandTotals.pass += totals.pass;
      grandTotals.fail += totals.fail;
      grandTotals.negTol += totals.negTol;
      grandTotals.posTol += totals.posTol;
    });

    grandTotals.passRate =
      grandTotals.points > 0
        ? ((grandTotals.pass / grandTotals.points) * 100).toFixed(1)
        : "0.0";

    return res.status(200).json({
      success: true,
      data: {
        specs: specsWithData,
        sizeList,
        sizeTotals,
        grandTotals,
        reportTypes: availableTypes.sort(),
        totalReports: reports.length,
        stageFilter,
      },
    });
  } catch (error) {
    console.error("Error fetching measurement conclusion:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// GET: Style Measurement Point Calculation (Value Distribution)
// ============================================================

export const getStyleMeasurementPointCalc = async (req, res) => {
  try {
    const { styleNo, reportType, stage } = req.query;

    if (!styleNo) {
      return res
        .status(400)
        .json({ success: false, message: "Style No required" });
    }

    // 1. Fetch Specs & Size List
    const dtOrder = await DtOrder.findOne({
      Order_No: { $regex: new RegExp(`^${styleNo}$`, "i") },
    })
      .select("SizeList")
      .lean();

    const sizeList = dtOrder?.SizeList || [];

    const specsRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${styleNo}$`, "i") },
    }).lean();

    // Get critical specs
    const beforeCritSpecs = specsRecord?.selectedBeforeWashSpecs || [];
    const afterCritSpecs = specsRecord?.selectedAfterWashSpecs || [];
    const criticalPointNames = new Set();

    [...beforeCritSpecs, ...afterCritSpecs].forEach((s) => {
      const name = (s.MeasurementPointEngName || s.name || "").trim();
      if (name) criticalPointNames.add(name);
    });

    // Get all specs
    const beforeSpecs = specsRecord?.AllBeforeWashSpecs || [];
    const afterSpecs = specsRecord?.AllAfterWashSpecs || [];

    // Build lookup maps
    const specIdToPointName = new Map();
    const pointNameToSpec = new Map();
    const allPointNames = new Set();

    [...beforeSpecs, ...afterSpecs].forEach((s) => {
      const id = s.id || s._id?.toString();
      const name = (s.MeasurementPointEngName || s.name || "").trim();

      if (!name) return;

      specIdToPointName.set(id, name);
      allPointNames.add(name);

      if (!pointNameToSpec.has(name)) {
        pointNameToSpec.set(name, {
          name: name,
          TolMinus: s.TolMinus,
          TolPlus: s.TolPlus,
        });
      }
    });

    // 2. Query Reports
    const query = {
      orderNos: styleNo,
      status: { $ne: "cancelled" },
    };

    if (reportType && reportType !== "All") {
      query.reportType = reportType;
    }

    const availableTypes = await FincheckInspectionReports.distinct(
      "reportType",
      {
        orderNos: styleNo,
        status: { $ne: "cancelled" },
      },
    );

    const reports = await FincheckInspectionReports.find(query)
      .select("measurementData reportType")
      .lean();

    // 3. Define measurement value buckets (1/16 increments from -1 to 1)
    const generateLabel = (sixteenths) => {
      if (sixteenths === 0) return "0";
      const sign = sixteenths < 0 ? "-" : "";
      const absVal = Math.abs(sixteenths);
      if (absVal === 16) return `${sign}1`;
      const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
      const divisor = gcd(absVal, 16);
      return `${sign}${absVal / divisor}/${16 / divisor}`;
    };

    const generateValueBuckets = () => {
      const buckets = [];
      // <-1
      buckets.push({
        key: "lt-1",
        label: "<-1",
        decimalMin: -Infinity,
        decimalMax: -1 - 1 / 32,
        order: -17,
      });
      // -1 to 1 in 1/16 increments
      for (let i = -16; i <= 16; i++) {
        const decimal = i / 16;
        const label = generateLabel(i);
        buckets.push({
          key: `v${i}`,
          label,
          decimal,
          decimalMin: decimal - 1 / 32,
          decimalMax: decimal + 1 / 32,
          order: i,
        });
      }
      // >1
      buckets.push({
        key: "gt1",
        label: ">1",
        decimalMin: 1 + 1 / 32,
        decimalMax: Infinity,
        order: 17,
      });
      return buckets;
    };

    const allBuckets = generateValueBuckets();

    const getBucketKey = (decimal) => {
      if (decimal < -1 - 1 / 32) return "lt-1";
      if (decimal > 1 + 1 / 32) return "gt1";
      const rounded = Math.round(decimal * 16);
      const clamped = Math.max(-16, Math.min(16, rounded));
      return `v${clamped}`;
    };

    // 4. Aggregate data
    const aggregatedData = {};
    const usedBucketKeys = new Set();
    const stageFilter = stage || "All";

    // --- HELPER: Process a single reading object ---
    const processSingleReading = (specId, valObj, size) => {
      if (!valObj || valObj.decimal === undefined) return;

      const pointName = specIdToPointName.get(specId);
      if (!pointName) return;

      const specInfo = pointNameToSpec.get(pointName);
      if (!specInfo) return;

      // Initialize Aggregation Structure
      if (!aggregatedData[pointName]) {
        aggregatedData[pointName] = {};
      }
      if (!aggregatedData[pointName][size]) {
        aggregatedData[pointName][size] = {
          points: 0,
          pass: 0,
          fail: 0,
          buckets: {},
        };
      }

      const decimal = parseFloat(valObj.decimal);
      if (isNaN(decimal)) return;

      const tolMinus = parseFloat(specInfo.TolMinus?.decimal) || 0;
      const tolPlus = parseFloat(specInfo.TolPlus?.decimal) || 0;
      const lowerLimit = -Math.abs(tolMinus);
      const upperLimit = Math.abs(tolPlus);

      aggregatedData[pointName][size].points += 1;

      // Check tolerance
      const epsilon = 0.0001;
      const isWithin =
        decimal >= lowerLimit - epsilon && decimal <= upperLimit + epsilon;

      if (isWithin) {
        aggregatedData[pointName][size].pass += 1;
      } else {
        aggregatedData[pointName][size].fail += 1;
      }

      // Add to bucket
      const bucketKey = getBucketKey(decimal);
      usedBucketKeys.add(bucketKey);

      if (!aggregatedData[pointName][size].buckets[bucketKey]) {
        aggregatedData[pointName][size].buckets[bucketKey] = 0;
      }
      aggregatedData[pointName][size].buckets[bucketKey] += 1;
    };

    // --- MAIN REPORT LOOP ---
    reports.forEach((report) => {
      if (!report.measurementData || !Array.isArray(report.measurementData))
        return;

      report.measurementData.forEach((m) => {
        if (m.size === "Manual_Entry") return;

        const size = m.size;
        const measurementStage = m.stage || "Before";

        // Filter Stage
        if (stageFilter !== "All" && measurementStage !== stageFilter) return;

        // 1. Get the lists of enabled indices
        const validAllIndices = Array.isArray(m.allEnabledPcs)
          ? m.allEnabledPcs
          : [];
        const validCritIndices = Array.isArray(m.criticalEnabledPcs)
          ? m.criticalEnabledPcs
          : [];

        // 2. Process All Measurements (Only valid indices)
        if (m.allMeasurements && typeof m.allMeasurements === "object") {
          Object.entries(m.allMeasurements).forEach(([specId, pcsData]) => {
            // pcsData is { "0": {...}, "1": {...} }
            validAllIndices.forEach((pcsIndex) => {
              const valObj = pcsData[pcsIndex];
              if (valObj) {
                processSingleReading(specId, valObj, size);
              }
            });
          });
        }

        // 3. Process Critical Measurements (Only valid indices)
        if (
          m.criticalMeasurements &&
          typeof m.criticalMeasurements === "object"
        ) {
          Object.entries(m.criticalMeasurements).forEach(
            ([specId, pcsData]) => {
              validCritIndices.forEach((pcsIndex) => {
                const valObj = pcsData[pcsIndex];
                if (valObj) {
                  processSingleReading(specId, valObj, size);
                }
              });
            },
          );
        }
      });
    });

    // 5. Build used buckets list (sorted by order)
    const usedBuckets = allBuckets
      .filter((b) => usedBucketKeys.has(b.key))
      .sort((a, b) => a.order - b.order);

    // 6. Format response
    const specsWithData = [];

    allPointNames.forEach((pointName) => {
      const specInfo = pointNameToSpec.get(pointName);
      if (!specInfo) return;

      const sizeData = {};
      const allSizeTotals = {
        points: 0,
        pass: 0,
        fail: 0,
        buckets: {},
      };
      let hasMeasurements = false;

      sizeList.forEach((size) => {
        const data = aggregatedData[pointName]?.[size] || {
          points: 0,
          pass: 0,
          fail: 0,
          buckets: {},
        };
        sizeData[size] = data;

        if (data.points > 0) hasMeasurements = true;

        // Aggregate to all sizes
        allSizeTotals.points += data.points;
        allSizeTotals.pass += data.pass;
        allSizeTotals.fail += data.fail;

        Object.entries(data.buckets).forEach(([bucketKey, count]) => {
          if (!allSizeTotals.buckets[bucketKey]) {
            allSizeTotals.buckets[bucketKey] = 0;
          }
          allSizeTotals.buckets[bucketKey] += count;
        });
      });

      if (hasMeasurements) {
        const tolMinusDecimal = parseFloat(specInfo.TolMinus?.decimal) || 0;
        const tolPlusDecimal = parseFloat(specInfo.TolPlus?.decimal) || 0;

        specsWithData.push({
          id: pointName,
          measurementPointName: pointName,
          tolMinus: specInfo.TolMinus?.fraction || "-",
          tolPlus: specInfo.TolPlus?.fraction || "-",
          tolMinusDecimal: -Math.abs(tolMinusDecimal),
          tolPlusDecimal: Math.abs(tolPlusDecimal),
          sizeData,
          allSizeTotals,
          hasMeasurements,
          isCritical: criticalPointNames.has(pointName),
        });
      }
    });

    specsWithData.sort((a, b) =>
      a.measurementPointName.localeCompare(b.measurementPointName),
    );

    // 7. Filter size list to only include sizes with data
    const filteredSizeList = sizeList.filter((size) => {
      return specsWithData.some((spec) => spec.sizeData[size]?.points > 0);
    });

    // 8. Calculate totals
    const sizeTotals = {};
    sizeTotals["__ALL__"] = { points: 0, pass: 0, fail: 0, buckets: {} };

    filteredSizeList.forEach((size) => {
      sizeTotals[size] = { points: 0, pass: 0, fail: 0, buckets: {} };

      specsWithData.forEach((spec) => {
        const data = spec.sizeData[size];
        if (data) {
          sizeTotals[size].points += data.points;
          sizeTotals[size].pass += data.pass;
          sizeTotals[size].fail += data.fail;

          Object.entries(data.buckets).forEach(([bucketKey, count]) => {
            if (!sizeTotals[size].buckets[bucketKey]) {
              sizeTotals[size].buckets[bucketKey] = 0;
            }
            sizeTotals[size].buckets[bucketKey] += count;
          });
        }
      });

      // Add to ALL
      sizeTotals["__ALL__"].points += sizeTotals[size].points;
      sizeTotals["__ALL__"].pass += sizeTotals[size].pass;
      sizeTotals["__ALL__"].fail += sizeTotals[size].fail;

      Object.entries(sizeTotals[size].buckets).forEach(([bucketKey, count]) => {
        if (!sizeTotals["__ALL__"].buckets[bucketKey]) {
          sizeTotals["__ALL__"].buckets[bucketKey] = 0;
        }
        sizeTotals["__ALL__"].buckets[bucketKey] += count;
      });
    });

    const grandTotals = { ...sizeTotals["__ALL__"] };
    grandTotals.passRate =
      grandTotals.points > 0
        ? ((grandTotals.pass / grandTotals.points) * 100).toFixed(1)
        : "0.0";

    return res.status(200).json({
      success: true,
      data: {
        specs: specsWithData,
        sizeList: filteredSizeList,
        sizeTotals,
        grandTotals,
        valueBuckets: usedBuckets,
        reportTypes: availableTypes.sort(),
        totalReports: reports.length,
        stageFilter,
      },
    });
  } catch (error) {
    console.error("Error fetching measurement point calc:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// GET: Buyer Analytics (Summary & Trend)
// ============================================================
export const getBuyerSummaryAnalytics = async (req, res) => {
  try {
    const { startDate, endDate, buyers, reportTypes } = req.query;

    const matchStage = { status: { $ne: "cancelled" } };

    // 1. Date Filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchStage.inspectionDate = { $gte: start, $lte: end };
    }

    // 2. Buyer Filter
    if (buyers && buyers !== "All") {
      const buyerList = buyers.split(",");
      if (buyerList.length > 0) matchStage.buyer = { $in: buyerList };
    }

    // 3. Report Type Filter (NEW)
    if (reportTypes && reportTypes !== "All") {
      const rtList = reportTypes.split(",");
      if (rtList.length > 0) matchStage.reportType = { $in: rtList };
    }

    const pipeline = [
      { $match: matchStage },
      {
        $addFields: {
          dateKey: {
            $dateToString: { format: "%Y-%m-%d", date: "$inspectionDate" },
          },
          reportSampleSize: {
            $cond: [
              { $eq: ["$inspectionMethod", "AQL"] },
              { $ifNull: ["$inspectionDetails.aqlSampleSize", 0] },
              { $ifNull: ["$inspectionConfig.sampleSize", 0] },
            ],
          },
          // Standardized Defect Flattening (Same as previous logic)
          _tempDefects: {
            $concatArrays: [
              {
                $reduce: {
                  input: {
                    $filter: {
                      input: { $ifNull: ["$defectData", []] },
                      as: "d",
                      cond: { $ne: ["$$d.isNoLocation", true] },
                    },
                  },
                  initialValue: [],
                  in: {
                    $concatArrays: [
                      "$$value",
                      {
                        $reduce: {
                          input: { $ifNull: ["$$this.locations", []] },
                          initialValue: [],
                          in: {
                            $concatArrays: [
                              "$$value",
                              {
                                $map: {
                                  input: { $ifNull: ["$$this.positions", []] },
                                  as: "pos",
                                  in: 1,
                                },
                              },
                            ],
                          },
                        },
                      },
                    ],
                  },
                },
              },
              {
                $map: {
                  input: {
                    $filter: {
                      input: { $ifNull: ["$defectData", []] },
                      as: "d",
                      cond: { $eq: ["$$d.isNoLocation", true] },
                    },
                  },
                  as: "noLoc",
                  in: { $ifNull: ["$$noLoc.qty", 1] },
                },
              },
            ],
          },
        },
      },
      {
        $addFields: { reportDefectTotal: { $sum: "$_tempDefects" } },
      },
      // Grouping
      {
        $group: {
          _id: { buyer: "$buyer", reportType: "$reportType", date: "$dateKey" },
          dailySample: { $sum: "$reportSampleSize" },
          dailyDefects: { $sum: "$reportDefectTotal" },
          reportCount: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.buyer",
          reportTypes: {
            $push: {
              type: "$_id.reportType",
              date: "$_id.date",
              sample: "$dailySample",
              defects: "$dailyDefects",
              count: "$reportCount",
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ];

    const data = await FincheckInspectionReports.aggregate(pipeline);

    // Fetch Filters Data
    const distinctBuyers = await FincheckInspectionReports.distinct("buyer", {
      status: { $ne: "cancelled" },
    });
    const distinctReportTypes = await FincheckInspectionReports.distinct(
      "reportType",
      { status: { $ne: "cancelled" } },
    );

    return res.status(200).json({
      success: true,
      data: {
        analytics: data,
        availableBuyers: distinctBuyers.sort(),
        availableReportTypes: distinctReportTypes.sort(),
      },
    });
  } catch (error) {
    console.error("Error fetching buyer analytics:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// GET: Buyer Cell Detail (Drill Down Modal)
// ============================================================

export const getBuyerCellDetails = async (req, res) => {
  try {
    const { buyer, reportType, date } = req.query;

    if (!buyer || !reportType || !date) {
      return res
        .status(400)
        .json({ success: false, message: "Missing params" });
    }

    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const matchStage = {
      buyer: buyer,
      reportType: reportType,
      inspectionDate: { $gte: start, $lte: end },
      status: { $ne: "cancelled" },
    };

    // ========================================
    // STEP 1: Calculate Total Sample Size
    // ========================================
    const samplePipeline = [
      { $match: matchStage },
      {
        $addFields: {
          reportSampleSize: {
            $cond: [
              { $eq: ["$inspectionMethod", "AQL"] },
              { $ifNull: ["$inspectionDetails.aqlSampleSize", 0] },
              { $ifNull: ["$inspectionConfig.sampleSize", 0] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalSample: { $sum: "$reportSampleSize" },
        },
      },
    ];

    const sampleResult =
      await FincheckInspectionReports.aggregate(samplePipeline);
    const totalSample =
      sampleResult.length > 0 ? sampleResult[0].totalSample : 0;

    // ========================================
    // STEP 2: Get Defects with Proper Breakdown
    // ========================================
    const defectPipeline = [
      { $match: matchStage },

      // Unwind defectData to process each defect item
      {
        $unwind: {
          path: "$defectData",
          preserveNullAndEmptyArrays: false,
        },
      },

      // Extract defect info at the correct level
      {
        $project: {
          defectName: "$defectData.defectName",
          defectCode: "$defectData.defectCode",
          isNoLocation: { $ifNull: ["$defectData.isNoLocation", false] },
          noLocationStatus: "$defectData.status",
          noLocationQty: { $ifNull: ["$defectData.qty", 1] },
          locations: { $ifNull: ["$defectData.locations", []] },
        },
      },

      // Use $facet to handle both location-based and no-location defects
      {
        $facet: {
          // -------- A. Location-Based Defects --------
          locationBased: [
            { $match: { isNoLocation: { $ne: true } } },
            // Check if locations array is not empty
            { $match: { "locations.0": { $exists: true } } },
            {
              $unwind: {
                path: "$locations",
                preserveNullAndEmptyArrays: false,
              },
            },
            // Check if positions array exists and is not empty
            { $match: { "locations.positions.0": { $exists: true } } },
            {
              $unwind: {
                path: "$locations.positions",
                preserveNullAndEmptyArrays: false,
              },
            },
            {
              $project: {
                defectName: 1,
                defectCode: 1,
                status: "$locations.positions.status",
                qty: { $literal: 1 },
              },
            },
          ],

          // -------- B. No-Location Defects --------
          noLocation: [
            { $match: { isNoLocation: true } },
            {
              $project: {
                defectName: 1,
                defectCode: 1,
                status: "$noLocationStatus",
                qty: "$noLocationQty",
              },
            },
          ],
        },
      },

      // Combine both arrays
      {
        $project: {
          combined: { $concatArrays: ["$locationBased", "$noLocation"] },
        },
      },

      // Unwind the combined array
      { $unwind: { path: "$combined", preserveNullAndEmptyArrays: false } },

      // Group by defect name/code with status breakdown
      {
        $group: {
          _id: {
            name: "$combined.defectName",
            code: "$combined.defectCode",
          },
          totalQty: { $sum: "$combined.qty" },
          minor: {
            $sum: {
              $cond: [
                { $eq: ["$combined.status", "Minor"] },
                "$combined.qty",
                0,
              ],
            },
          },
          major: {
            $sum: {
              $cond: [
                { $eq: ["$combined.status", "Major"] },
                "$combined.qty",
                0,
              ],
            },
          },
          critical: {
            $sum: {
              $cond: [
                { $eq: ["$combined.status", "Critical"] },
                "$combined.qty",
                0,
              ],
            },
          },
        },
      },

      // Final formatting
      {
        $project: {
          _id: 0,
          name: "$_id.name",
          code: "$_id.code",
          totalQty: 1,
          minor: 1,
          major: 1,
          critical: 1,
        },
      },

      // Sort by highest quantity
      { $sort: { totalQty: -1 } },
    ];

    const defectResults =
      await FincheckInspectionReports.aggregate(defectPipeline);

    // Calculate total defects
    const totalDefects = defectResults.reduce(
      (sum, item) => sum + item.totalQty,
      0,
    );

    return res.status(200).json({
      success: true,
      data: {
        totalSample,
        totalDefects,
        defectRate:
          totalSample > 0
            ? ((totalDefects / totalSample) * 100).toFixed(2)
            : "0.00",
        defects: defectResults,
      },
    });
  } catch (error) {
    console.error("Error fetching cell details:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
