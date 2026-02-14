import {
  FincheckInspectionReports,
  QASectionsMeasurementSpecs,
  DtOrder,
  YorksysOrders,
  RoleManagment,
  UserMain,
  QASectionsProductLocation,
  FincheckUserPreferences,
  FincheckApprovalAssignees,
  FincheckInspectionDecision,
  FincheckNotificationGroup,
} from "../../MongoDB/dbConnectionController.js";

import { sendPushToUser } from "./FincheckNotificationController.js";

import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ============================================================
// Get Filtered Inspection Reports
// ============================================================

// Helper to escape regex characters
const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

export const getInspectionReports = async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      reportId,
      reportType,
      orderType,
      orderNo,
      productType,
      empId,
      subConFactory,
      custStyle,
      buyer,
      supplier,
      poLine,
      qaStatus,
      leaderDecision,
      season,
      page = 1,
      limit = 200,
    } = req.query;

    // --- Build Query ---
    let query = {
      status: { $ne: "cancelled" },
    };

    // --- Helper to parse comma list to array ---
    const parseList = (str) =>
      str
        ? str
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

    // ---------------------------------------------------------
    // 1. QA Status Filter
    // ---------------------------------------------------------
    const qaStatusList = parseList(qaStatus);
    if (qaStatusList.length > 0 && !qaStatusList.includes("All")) {
      const statusConditions = [];

      if (qaStatusList.includes("Pending")) {
        statusConditions.push("draft", "in_progress");
      }
      if (qaStatusList.includes("Completed")) {
        statusConditions.push("completed");
      }

      if (statusConditions.length > 0) {
        query.status = { $in: statusConditions };
      }
    }

    // ---------------------------------------------------------
    // 2. Leader Decision Filter (Complex Logic)
    // ---------------------------------------------------------
    const decisionList = parseList(leaderDecision);
    if (decisionList.length > 0 && !decisionList.includes("All")) {
      const decisionOrConditions = [];

      // A. "Approved", "Rework", "Rejected" -> Exist in Decision Collection
      const specificDecisions = decisionList.filter((d) =>
        ["Approved", "Rework", "Rejected"].includes(d),
      );

      if (specificDecisions.length > 0) {
        const matchingDecisions = await FincheckInspectionDecision.find({
          decisionStatus: { $in: specificDecisions },
        }).distinct("reportId");

        decisionOrConditions.push({ reportId: { $in: matchingDecisions } });
      }

      // B. "Pending" -> QA Completed BUT No Decision Document
      if (decisionList.includes("Pending")) {
        // Get ALL existing decision report IDs
        const allDecisionIds =
          await FincheckInspectionDecision.find().distinct("reportId");

        decisionOrConditions.push({
          status: "completed",
          reportId: { $nin: allDecisionIds },
        });
      }

      // C. "Pending QA" -> QA Status is NOT completed
      if (decisionList.includes("Pending QA")) {
        decisionOrConditions.push({
          status: { $ne: "completed" },
        });
      }

      // Apply to main Query using $and + $or to ensure strict filtering
      if (decisionOrConditions.length > 0) {
        query.$and = [...(query.$and || []), { $or: decisionOrConditions }];
      }
    }

    // ---------------------------------------------------------
    // 3. Season Filter
    // ---------------------------------------------------------
    const seasonList = parseList(season);
    if (seasonList.length > 0 && !seasonList.includes("All")) {
      // Find all Order Numbers that have matching seasons
      const matchingSeasonOrders = await YorksysOrders.find({
        season: { $in: seasonList.map((s) => new RegExp(`^${s}$`, "i")) },
      })
        .select("moNo")
        .lean();

      const matchingOrderNos = matchingSeasonOrders.map((o) => o.moNo);

      // Filter reports that contain these order numbers
      const seasonCondition = { orderNos: { $in: matchingOrderNos } };

      // Merge with existing query (handle $and/$or logic)
      if (query.$and) {
        query.$and.push(seasonCondition);
      } else if (query.$or) {
        query.$and = [{ $or: query.$or }, seasonCondition];
        delete query.$or;
      } else {
        // Check if orderNos filter already exists from PO Line filter
        if (query.orderNos && query.orderNos.$in) {
          // Intersect the arrays: existing orderNos AND season orderNos
          const existingOrders = query.orderNos.$in;
          const intersection = existingOrders.filter((no) =>
            matchingOrderNos.includes(no),
          );
          query.orderNos = { $in: intersection };
        } else {
          query.orderNos = { $in: matchingOrderNos };
        }
      }
    }

    // ---------------------------------------------------------
    // 4. --- PO Line Filter Logic ---
    // ---------------------------------------------------------

    if (poLine) {
      // Split by comma and trim
      const poList = poLine
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p);

      if (poList.length > 0) {
        //  Find Order Numbers (moNo) from YorksysOrders that match ANY of these PO Lines
        // Using $in with regex for partial match or exact match depending on requirement.
        // Assuming strict filtering based on selection, we use $in.

        // We create a regex array to allow case-insensitive exact matching
        const regexList = poList.map((p) => new RegExp(`^${p}$`, "i"));

        const matchingOrders = await YorksysOrders.find({
          "SKUData.POLine": { $in: regexList },
        })
          .select("moNo")
          .lean();

        const matchingOrderNos = matchingOrders.map((o) => o.moNo);

        // Report must contain at least one of these order numbers
        // We use $in on the orderNos array field in the report
        if (query.orderNos) {
          // If orderNos query already exists (e.g. from Order No filter), we need to use $and or intersect
          query.orderNos = { $in: matchingOrderNos };
        } else {
          query.orderNos = { $in: matchingOrderNos };
        }
      }
    }

    // 1. Date Range Filter
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query.inspectionDate = { $gte: start, $lte: end };
    }

    // 2. Report ID Filter (Exact Match)
    if (reportId) {
      query.reportId = parseInt(reportId);
    }

    // 3. Report Name/Type (Multi-Select Exact)
    const reportTypeList = parseList(reportType);
    if (reportTypeList.length > 0) {
      // If array has "All", ignore filter, else use $in
      if (!reportTypeList.includes("All")) {
        query.reportType = { $in: reportTypeList };
      }
    }

    // 4. Order Type (Single Select usually, but robust check)
    if (orderType && orderType !== "All") {
      query.orderType = orderType.toLowerCase();
    }

    // 5. Order No (Multi-Select REGEX)
    // Example: User selects "123" and "456". We want partial match for either.
    const orderNoList = parseList(orderNo);
    if (orderNoList.length > 0) {
      // Construct an array of regex conditions targeting the ARRAY 'orderNos'
      // We use escapeRegex to safely handle dashes like in "GPAR12270-1"
      const regexConditions = orderNoList.map((val) => ({
        orderNos: { $regex: escapeRegex(val), $options: "i" },
      }));

      // Use $and if existing query properties need to be preserved
      if (query.$or) {
        // If $or already exists (e.g. from another filter), wrap everything in $and
        query.$and = [...(query.$and || []), { $or: regexConditions }];
      } else {
        query.$or = regexConditions;
      }
    }

    // 6. Product Type (Multi-Select Exact)
    const productTypeList = parseList(productType);
    if (productTypeList.length > 0 && !productTypeList.includes("All")) {
      query.productType = { $in: productTypeList };
    }

    // 7. QA ID / Emp ID (Multi-Select Exact or Regex)
    // Usually Emp IDs are exact, but if you want partial:
    const empIdList = parseList(empId);
    if (empIdList.length > 0) {
      // Assuming Exact Match for ID is better for Multi-Select
      query.empId = { $in: empIdList };
      // OR if you want regex:
      // query.empId = { $in: empIdList.map(id => new RegExp(id, "i")) };
    }

    // 8. Sub-Con Factory (Multi-Select Exact)
    const factoryList = parseList(subConFactory);
    if (factoryList.length > 0 && !factoryList.includes("All")) {
      query["inspectionDetails.subConFactory"] = { $in: factoryList };
    }

    // 9. Cust Style (Multi-Select REGEX)
    const styleList = parseList(custStyle);
    if (styleList.length > 0) {
      const styleConditions = styleList.map((val) => ({
        "inspectionDetails.custStyle": { $regex: val, $options: "i" },
      }));

      // Handle merging with potential existing $or from OrderNo
      if (query.$or) {
        // If we have existing $or (from OrderNo), we cannot just overwrite query.$or
        // We must convert the structure to: $and: [ {$or: orders}, {$or: styles} ]

        // Move existing $or to $and
        const existingOr = query.$or;
        delete query.$or;

        query.$and = [
          ...(query.$and || []),
          { $or: existingOr },
          { $or: styleConditions },
        ];
      } else {
        // If $and exists, append to it, else create $or
        if (query.$and) {
          query.$and.push({ $or: styleConditions });
        } else {
          query.$or = styleConditions;
        }
      }
    }

    // 10. Buyer (Multi-Select Exact)
    const buyerList = parseList(buyer);
    if (buyerList.length > 0 && !buyerList.includes("All")) {
      query.buyer = { $in: buyerList };
    }

    // 11. Supplier (Multi-Select Exact)
    const supplierList = parseList(supplier);
    if (supplierList.length > 0 && !supplierList.includes("All")) {
      query["inspectionDetails.supplier"] = { $in: supplierList };
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get total count for pagination
    const totalCount = await FincheckInspectionReports.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    // --- 2. Fetch Reports ---
    // Execute Query with Pagination
    const reports = await FincheckInspectionReports.find(query)
      .sort({ inspectionDate: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate("productTypeId", "imageURL")
      .lean();

    // --- 3. Fetch Decision Status (Manual Join) ---

    // Get list of Report IDs from the current page results
    const reportIds = reports.map((r) => r.reportId);

    // Find decisions matching these IDs
    const decisions = await FincheckInspectionDecision.find({
      reportId: { $in: reportIds },
    })
      .select("reportId decisionStatus updatedAt")
      .lean();

    // Create a Map for fast lookup: { 12345: { status: "Approved", time: ... } }
    const decisionMap = {};
    decisions.forEach((d) => {
      decisionMap[d.reportId] = {
        status: d.decisionStatus,
        updatedAt: d.updatedAt,
      };
    });

    // --- Fetch PO Lines from YorksysOrders ---

    // A. Collect all unique Order Numbers from the fetched reports
    const allOrderNos = reports.reduce((acc, report) => {
      if (report.orderNos && Array.isArray(report.orderNos)) {
        acc.push(...report.orderNos);
      }
      return acc;
    }, []);

    // B. Fetch only the PO Lines for these orders
    const yorksysOrders = await YorksysOrders.find({
      moNo: { $in: allOrderNos },
    })
      .select("moNo SKUData.POLine season")
      .lean();

    // C. Create a Map: OrderNo -> Array of PO Lines
    const orderPOMap = {};
    yorksysOrders.forEach((yOrder) => {
      const poSet = new Set();
      if (yOrder.SKUData && Array.isArray(yOrder.SKUData)) {
        yOrder.SKUData.forEach((sku) => {
          if (sku.POLine) {
            poSet.add(sku.POLine.trim());
          }
        });
      }
      orderPOMap[yOrder.moNo] = Array.from(poSet);
    });

    // --- Fetch Seasons from YorksysOrders ---
    const orderSeasonMap = {};
    yorksysOrders.forEach((yOrder) => {
      if (yOrder.season) {
        orderSeasonMap[yOrder.moNo] = yOrder.season;
      }
    });

    // --- 4. Merge Data ---
    const mergedReports = reports.map((report) => {
      const decisionInfo = decisionMap[report.reportId];

      // Calculate Unique PO Lines for this specific report
      const reportPOs = new Set();
      if (report.orderNos) {
        report.orderNos.forEach((orderNo) => {
          if (orderPOMap[orderNo]) {
            orderPOMap[orderNo].forEach((po) => reportPOs.add(po));
          }
        });
      }
      // Convert to comma-separated string
      const poLineString = Array.from(reportPOs).sort().join(", ");

      // Calculate Season for this report (take first match)
      let reportSeason = "";
      if (report.orderNos) {
        for (const orderNo of report.orderNos) {
          if (orderSeasonMap[orderNo]) {
            reportSeason = orderSeasonMap[orderNo];
            break;
          }
        }
      }

      return {
        ...report,
        // Add the decision fields to the report object
        decisionStatus: decisionInfo ? decisionInfo.status : null,
        decisionUpdatedAt: decisionInfo ? decisionInfo.updatedAt : null,
        poLines: poLineString,
        season: reportSeason,
      };
    });

    return res.status(200).json({
      success: true,
      count: mergedReports.length,
      //count: reports.length,
      totalCount,
      totalPages,
      currentPage: pageNum,
      data: mergedReports,
      //data: reports
    });
  } catch (error) {
    console.error("Error fetching inspection reports:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ============================================================
// Get All Filter Options (for dropdowns)
// ============================================================
export const getFilterOptions = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let dateQuery = {};
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateQuery.inspectionDate = { $gte: start, $lte: end };
    }

    const baseQuery = { status: { $ne: "cancelled" }, ...dateQuery };

    const [reportTypes, productTypes, buyers, suppliers, factories] =
      await Promise.all([
        FincheckInspectionReports.distinct("reportType", baseQuery),
        FincheckInspectionReports.distinct("productType", baseQuery),
        FincheckInspectionReports.distinct("buyer", baseQuery),
        FincheckInspectionReports.distinct(
          "inspectionDetails.supplier",
          baseQuery,
        ),
        FincheckInspectionReports.distinct(
          "inspectionDetails.subConFactory",
          baseQuery,
        ),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        reportTypes: reportTypes.filter(Boolean).sort(),
        productTypes: productTypes.filter(Boolean).sort(),
        buyers: buyers.filter(Boolean).sort(),
        suppliers: suppliers.filter(Boolean).sort(),
        subConFactories: factories.filter(Boolean).sort(),
      },
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// Autocomplete for Order No
// ============================================================

export const autocompleteOrderNo = async (req, res) => {
  try {
    const { term } = req.query;

    if (!term || term.length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }

    const results = await FincheckInspectionReports.find({
      orderNosString: { $regex: term, $options: "i" },
      status: { $ne: "cancelled" },
    })
      .select("orderNosString orderNos")
      .limit(100)
      .lean();

    // Extract unique order numbers
    const orderSet = new Set();
    results.forEach((r) => {
      if (r.orderNos && Array.isArray(r.orderNos)) {
        r.orderNos.forEach((o) => {
          if (o.toLowerCase().includes(term.toLowerCase())) {
            orderSet.add(o);
          }
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: Array.from(orderSet).slice(0, 15),
    });
  } catch (error) {
    console.error("Error in order autocomplete:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// Autocomplete for Customer Style
// ============================================================
export const autocompleteCustStyle = async (req, res) => {
  try {
    const { term } = req.query;

    if (!term || term.length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }

    const results = await FincheckInspectionReports.find({
      "inspectionDetails.custStyle": { $regex: term, $options: "i" },
      status: { $ne: "cancelled" },
    })
      .select("inspectionDetails.custStyle")
      .limit(100)
      .lean();

    // Extract unique styles
    const styleSet = new Set();
    results.forEach((r) => {
      if (r.inspectionDetails?.custStyle) {
        styleSet.add(r.inspectionDetails.custStyle);
      }
    });

    return res.status(200).json({
      success: true,
      data: Array.from(styleSet).slice(0, 15),
    });
  } catch (error) {
    console.error("Error in style autocomplete:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// Autocomplete Season
// ============================================================
export const autocompleteSeason = async (req, res) => {
  try {
    const { term } = req.query;

    // Get all distinct seasons first
    const allSeasons = await YorksysOrders.distinct("season");

    // Filter and limit in JavaScript
    let filtered = allSeasons
      .filter((s) => s && s.trim() !== "") // Remove null/empty
      .sort();

    // Apply regex filter if term provided
    if (term && term.length >= 1) {
      const regex = new RegExp(term, "i");
      filtered = filtered.filter((s) => regex.test(s));
    }

    // Limit to 20 results
    const limited = filtered.slice(0, 20);

    return res.status(200).json({
      success: true,
      data: limited,
    });
  } catch (error) {
    console.error("Error in Season autocomplete:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// Autocomplete for PO Line
// ============================================================
export const autocompletePOLine = async (req, res) => {
  try {
    const { term } = req.query;

    if (!term || term.length < 2) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Search inside SKUData array for POLine field
    const results = await YorksysOrders.find({
      "SKUData.POLine": { $regex: term, $options: "i" },
    })
      .select("SKUData.POLine")
      .limit(100) // Limit documents to scan
      .lean();

    const poSet = new Set();

    results.forEach((order) => {
      if (order.SKUData && Array.isArray(order.SKUData)) {
        order.SKUData.forEach((sku) => {
          if (
            sku.POLine &&
            sku.POLine.toLowerCase().includes(term.toLowerCase())
          ) {
            poSet.add(sku.POLine);
          }
        });
      }
    });

    return res.status(200).json({
      success: true,
      data: Array.from(poSet).slice(0, 15), // Return top 15 matches
    });
  } catch (error) {
    console.error("Error in PO Line autocomplete:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// Get Flattened Defect Images for a Report
// ============================================================
export const getDefectImagesForReport = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId),
    })
      .select("defectData defectManualData")
      .lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    const allImages = [];

    // 1. Process Structured Defect Data
    if (report.defectData && Array.isArray(report.defectData)) {
      report.defectData.forEach((defect) => {
        const defectName = defect.defectName;
        const defectCode = defect.defectCode;

        if (defect.isNoLocation) {
          // A. No Location Mode (Images at root)
          if (defect.images && Array.isArray(defect.images)) {
            defect.images.forEach((img) => {
              allImages.push({
                imageId: img.imageId,
                url: img.imageURL,
                defectName: defectName,
                defectCode: defectCode,
                position: "General", // No specific position
                locationInfo: "No Location Config",
                type: "Defect",
              });
            });
          }
        } else {
          // B. Location Based Mode
          if (defect.locations && Array.isArray(defect.locations)) {
            defect.locations.forEach((loc) => {
              const locationInfo = `${loc.locationName} (${loc.view})`;

              if (loc.positions && Array.isArray(loc.positions)) {
                loc.positions.forEach((pos) => {
                  const positionType = pos.position || "Outside"; // Inside/Outside

                  // Required Image
                  if (pos.requiredImage) {
                    allImages.push({
                      imageId: pos.requiredImage.imageId,
                      url: pos.requiredImage.imageURL,
                      defectName: defectName,
                      defectCode: defectCode,
                      position: positionType,
                      locationInfo: locationInfo,
                      type: "Defect",
                    });
                  }

                  // Additional Images
                  if (
                    pos.additionalImages &&
                    Array.isArray(pos.additionalImages)
                  ) {
                    pos.additionalImages.forEach((img) => {
                      allImages.push({
                        imageId: img.imageId,
                        url: img.imageURL,
                        defectName: defectName,
                        defectCode: defectCode,
                        position: positionType,
                        locationInfo: locationInfo,
                        type: "Defect (Add.)",
                      });
                    });
                  }
                });
              }
            });
          }
        }
      });
    }

    // 2. Process Manual Defect Data (Optional, but good to have)
    if (report.defectManualData && Array.isArray(report.defectManualData)) {
      report.defectManualData.forEach((item) => {
        if (item.images && Array.isArray(item.images)) {
          item.images.forEach((img) => {
            allImages.push({
              imageId: img.imageId,
              url: img.imageURL,
              defectName: "Manual Entry",
              defectCode: "N/A",
              position: item.line || "Manual",
              locationInfo: item.remarks || "",
              type: "Manual",
            });
          });
        }
      });
    }

    return res.status(200).json({
      success: true,
      count: allImages.length,
      data: allImages,
    });
  } catch (error) {
    console.error("Error fetching defect images:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ============================================================
// Get Measurement Specifications Linked to a Report
// ============================================================

export const getReportMeasurementSpecs = async (req, res) => {
  try {
    const { reportId } = req.params;

    // 1. Fetch the Report
    // MODIFICATION: Added "measurementData" to .select() to access the colors used in inspection
    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId),
    }).select("orderNos measurementData");

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }

    const orderNos = report.orderNos;
    if (!orderNos || orderNos.length === 0) {
      return res.status(200).json({
        success: true,
        specs: { Before: null, After: null },
        sizeList: [],
        activeColors: [], // Return empty colors
      });
    }

    // --- NEW LOGIC START: Extract distinct colors from Report ---
    // Get all unique colorNames from the measurementData array
    const distinctReportColors = [
      ...new Set(
        report.measurementData
          .map((m) => m.colorName)
          .filter((c) => c && typeof c === "string"), // Remove null/undefined/empty
      ),
    ];
    // --- NEW LOGIC END ---

    // Use the first order number to find specs
    const primaryOrderNo = orderNos[0];

    // 2. Fetch DtOrder to get SizeList AND OrderColors for validation
    // MODIFICATION: Added "OrderColors" to .select()
    const dtOrder = await DtOrder.findOne({
      Order_No: { $regex: new RegExp(`^${primaryOrderNo}$`, "i") },
    })
      .select("SizeList OrderColors")
      .lean();

    const sizeList = dtOrder?.SizeList || [];

    // --- NEW LOGIC START: Filter Colors ---
    // 1. Extract valid colors from DtOrder
    const validOrderColors = dtOrder?.OrderColors?.map((oc) => oc.Color) || [];

    // 2. Create a Set for efficient, case-insensitive lookup
    // (We trim and lowercase to ensure "NAVY" matches "Navy")
    const validColorSet = new Set(
      validOrderColors.map((c) => (c ? c.trim().toLowerCase() : "")),
    );

    // 3. Filter the colors found in the Report
    // Only keep colors that actually exist in the DtOrder
    const activeColors = distinctReportColors.filter((reportColor) =>
      validColorSet.has(reportColor.trim().toLowerCase()),
    );
    // --- NEW LOGIC END ---

    // 3. Find the Specs in the Specs Collection
    const specsRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${primaryOrderNo}$`, "i") },
    }).lean();

    const result = {
      Before: { full: [], selected: [] },
      After: { full: [], selected: [] },
    };

    if (specsRecord) {
      // Process Before
      result.Before.full = specsRecord.AllBeforeWashSpecs || [];
      result.Before.selected =
        specsRecord.selectedBeforeWashSpecs &&
        specsRecord.selectedBeforeWashSpecs.length > 0
          ? specsRecord.selectedBeforeWashSpecs
          : specsRecord.AllBeforeWashSpecs || [];

      // Process After
      result.After.full = specsRecord.AllAfterWashSpecs || [];
      result.After.selected =
        specsRecord.selectedAfterWashSpecs &&
        specsRecord.selectedAfterWashSpecs.length > 0
          ? specsRecord.selectedAfterWashSpecs
          : specsRecord.AllAfterWashSpecs || [];
    } else {
      // Fallback: Check DtOrder (Legacy - usually only Before)
      const dtOrderFull = await DtOrder.findOne({
        Order_No: primaryOrderNo,
      }).lean();

      if (dtOrderFull && dtOrderFull.BeforeWashSpecs) {
        const legacySpecs = dtOrderFull.BeforeWashSpecs.map((s) => ({
          ...s,
          id: s._id ? s._id.toString() : s.id,
        }));
        result.Before.full = legacySpecs;
        result.Before.selected = legacySpecs;
      }
    }

    return res.status(200).json({
      success: true,
      specs: result,
      sizeList: sizeList,
      activeColors: activeColors, // Return the filtered list of valid colors found in this report
    });
  } catch (error) {
    console.error("Error fetching report measurement specs:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// GET: Report Measurement Value Distribution (Point Calc)
// ============================================================

export const getReportMeasurementPointCalc = async (req, res) => {
  try {
    const { reportId } = req.params;

    // 1. Fetch Report
    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId),
    }).lean();

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }

    if (!report.measurementData || report.measurementData.length === 0) {
      return res.status(200).json({
        success: true,
        data: { specs: [], sizeList: [], valueBuckets: [] },
      });
    }

    // 2. Fetch Specs & Size List
    const orderNo = report.orderNos?.[0];
    const dtOrder = await DtOrder.findOne({
      Order_No: { $regex: new RegExp(`^${orderNo}$`, "i") },
    })
      .select("SizeList")
      .lean();

    const sizeList = dtOrder?.SizeList || [];

    const specsRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${orderNo}$`, "i") },
    }).lean();

    // Combine Before and After specs
    const allSpecs = [
      ...(specsRecord?.AllBeforeWashSpecs || []),
      ...(specsRecord?.AllAfterWashSpecs || []),
      ...(specsRecord?.selectedBeforeWashSpecs || []),
      ...(specsRecord?.selectedAfterWashSpecs || []),
    ];

    // Build lookup maps
    const specIdToPointName = new Map();
    const pointNameToSpec = new Map();
    const criticalPointNames = new Set();

    // Order Tracking
    const uniqueOrderedNames = [];
    const seenNames = new Set();

    [
      ...(specsRecord?.selectedBeforeWashSpecs || []),
      ...(specsRecord?.selectedAfterWashSpecs || []),
    ].forEach((s) => {
      const name = (s.MeasurementPointEngName || s.name || "").trim();
      if (name) criticalPointNames.add(name);
    });

    allSpecs.forEach((s) => {
      const id = s.id || s._id?.toString();
      const name = (s.MeasurementPointEngName || s.name || "").trim();
      if (!name) return;

      specIdToPointName.set(id, name);

      if (!seenNames.has(name)) {
        seenNames.add(name);
        uniqueOrderedNames.push(name);

        pointNameToSpec.set(name, {
          name: name,
          TolMinus: s.TolMinus,
          TolPlus: s.TolPlus,
        });
      }
    });

    // 3. Define Buckets with DECIMAL values
    const generateLabel = (sixteenths) => {
      if (sixteenths === 0) return "0";
      const sign = sixteenths < 0 ? "-" : "";
      const absVal = Math.abs(sixteenths);
      if (absVal === 16) return `${sign}1`;
      const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
      const divisor = gcd(absVal, 16);
      return `${sign}${absVal / divisor}/${16 / divisor}`;
    };

    const buckets = [];
    // <-1 (Arbitrary decimal -1.1 for logic)
    buckets.push({ key: "lt-1", label: "<-1", order: -17, decimal: -1.1 });

    // -1 to 1 in 1/16 increments
    for (let i = -16; i <= 16; i++) {
      buckets.push({
        key: `v${i}`,
        label: generateLabel(i),
        order: i,
        decimal: i / 16,
      });
    }

    // >1 (Arbitrary decimal 1.1 for logic)
    buckets.push({ key: "gt1", label: ">1", order: 17, decimal: 1.1 });

    const getBucketKey = (decimal) => {
      if (decimal < -1 - 1 / 32) return "lt-1";
      if (decimal > 1 + 1 / 32) return "gt1";
      const rounded = Math.round(decimal * 16);
      return `v${Math.max(-16, Math.min(16, rounded))}`;
    };

    // 4. Aggregate Data
    const aggregatedData = {};
    const usedBucketKeys = new Set();

    const processSingleValue = (specId, valObj, size) => {
      if (!valObj || valObj.decimal === undefined) return;

      const pointName = specIdToPointName.get(specId);
      if (!pointName) return;

      const specInfo = pointNameToSpec.get(pointName);
      if (!specInfo) return;

      if (!aggregatedData[pointName]) aggregatedData[pointName] = {};
      if (!aggregatedData[pointName][size]) {
        aggregatedData[pointName][size] = {
          points: 0,
          pass: 0,
          fail: 0,
          negTol: 0,
          posTol: 0,
          buckets: {},
        };
      }

      const decimal = parseFloat(valObj.decimal);
      if (isNaN(decimal)) return;

      const tolMinus = parseFloat(specInfo.TolMinus?.decimal) || 0;
      const tolPlus = parseFloat(specInfo.TolPlus?.decimal) || 0;
      const lowerLimit = -Math.abs(tolMinus);
      const upperLimit = Math.abs(tolPlus);
      const epsilon = 0.0001;

      const entry = aggregatedData[pointName][size];
      entry.points += 1;

      if (decimal >= lowerLimit - epsilon && decimal <= upperLimit + epsilon) {
        entry.pass += 1;
      } else {
        entry.fail += 1;
        if (decimal < lowerLimit) entry.negTol += 1;
        if (decimal > upperLimit) entry.posTol += 1;
      }

      const bKey = getBucketKey(decimal);
      usedBucketKeys.add(bKey);
      entry.buckets[bKey] = (entry.buckets[bKey] || 0) + 1;
    };

    // Main Loop
    report.measurementData.forEach((m) => {
      if (m.size === "Manual_Entry") return;

      const validAllIndices = Array.isArray(m.allEnabledPcs)
        ? m.allEnabledPcs
        : [];
      const validCritIndices = Array.isArray(m.criticalEnabledPcs)
        ? m.criticalEnabledPcs
        : [];

      if (m.allMeasurements) {
        Object.entries(m.allMeasurements).forEach(([specId, pcsData]) => {
          validAllIndices.forEach((pcsIndex) => {
            const valObj = pcsData[pcsIndex];
            if (valObj) processSingleValue(specId, valObj, m.size);
          });
        });
      }

      if (m.criticalMeasurements) {
        Object.entries(m.criticalMeasurements).forEach(([specId, pcsData]) => {
          validCritIndices.forEach((pcsIndex) => {
            const valObj = pcsData[pcsIndex];
            if (valObj) processSingleValue(specId, valObj, m.size);
          });
        });
      }
    });

    // 5. Format Response
    const usedBuckets = buckets
      .filter((b) => usedBucketKeys.has(b.key))
      .sort((a, b) => a.order - b.order);

    const specsWithData = [];

    uniqueOrderedNames.forEach((pointName) => {
      const dataForPoint = aggregatedData[pointName];
      if (!dataForPoint) return;

      const specInfo = pointNameToSpec.get(pointName);

      // Calculate Limits
      const tMinus = parseFloat(specInfo.TolMinus?.decimal) || 0;
      const tPlus = parseFloat(specInfo.TolPlus?.decimal) || 0;

      const sizeData = {};
      const allSizeTotals = {
        points: 0,
        pass: 0,
        fail: 0,
        negTol: 0,
        posTol: 0,
        buckets: {},
      };
      let hasData = false;

      sizeList.forEach((size) => {
        const d = dataForPoint[size];
        if (d) {
          hasData = true;
          sizeData[size] = d;

          allSizeTotals.points += d.points;
          allSizeTotals.pass += d.pass;
          allSizeTotals.fail += d.fail;
          allSizeTotals.negTol += d.negTol;
          allSizeTotals.posTol += d.posTol;
          Object.entries(d.buckets).forEach(([k, v]) => {
            allSizeTotals.buckets[k] = (allSizeTotals.buckets[k] || 0) + v;
          });
        }
      });

      if (hasData) {
        specsWithData.push({
          measurementPointName: pointName,
          tolMinus: specInfo.TolMinus?.fraction || "-",
          tolPlus: specInfo.TolPlus?.fraction || "-",
          // ADDED DECIMAL LIMITS HERE
          tolMinusDecimal: -Math.abs(tMinus),
          tolPlusDecimal: Math.abs(tPlus),
          isCritical: criticalPointNames.has(pointName),
          sizeData,
          allSizeTotals,
        });
      }
    });

    const filteredSizeList = sizeList.filter((size) =>
      specsWithData.some((s) => s.sizeData[size]),
    );

    const grandTotals = { points: 0, pass: 0, fail: 0, negTol: 0, posTol: 0 };
    specsWithData.forEach((s) => {
      grandTotals.points += s.allSizeTotals.points;
      grandTotals.pass += s.allSizeTotals.pass;
      grandTotals.fail += s.allSizeTotals.fail;
      grandTotals.negTol += s.allSizeTotals.negTol;
      grandTotals.posTol += s.allSizeTotals.posTol;
    });
    grandTotals.passRate =
      grandTotals.points > 0
        ? ((grandTotals.pass / grandTotals.points) * 100).toFixed(1)
        : "0.0";

    return res.status(200).json({
      success: true,
      data: {
        specs: specsWithData,
        sizeList: filteredSizeList,
        valueBuckets: usedBuckets,
        grandTotals,
      },
    });
  } catch (error) {
    console.error("Error calculating report measurement distribution:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// Check User Permission for UI Visibility
// ============================================================

export const checkUserPermission = async (req, res) => {
  try {
    const { empId } = req.query;

    if (!empId) {
      return res.status(200).json({ isAdmin: false });
    }

    // Check if this Employee ID exists inside the 'users' array
    // of any document where the role is 'Admin' or 'Super Admin'
    const roleDoc = await RoleManagment.findOne({
      role: { $in: ["Admin", "Super Admin"] },
      "users.emp_id": empId,
    }).select("_id");

    return res.status(200).json({
      success: true,
      isAdmin: !!roleDoc, // Returns true if document found, false otherwise
    });
  } catch (error) {
    console.error("Permission check error:", error);
    return res.status(500).json({ success: false, isAdmin: false });
  }
};

// ============================================================
// Check Approval Authority (New Endpoint)
// ============================================================

export const checkApprovalPermission = async (req, res) => {
  try {
    // 1. Get empId AND reportId
    const { empId, reportId } = req.query;

    if (!empId) {
      return res.status(200).json({ success: true, isApprover: false });
    }

    // 2. Find the Assignee (The Leader)
    const assignee = await FincheckApprovalAssignees.findOne({
      empId: empId,
    }).select("allowedCustomers");

    // If user is not in the approval list at all, return false
    if (!assignee) {
      return res.status(200).json({
        success: true,
        isApprover: false,
      });
    }

    // 3. If a specific Report ID is provided, validate the Buyer
    if (reportId) {
      const report = await FincheckInspectionReports.findOne({
        reportId: parseInt(reportId),
      }).select("buyer");

      if (!report) {
        // Report doesn't exist? Fail safe.
        return res
          .status(404)
          .json({ success: false, message: "Report not found" });
      }

      // CHECK: Is the Report's Buyer in the Assignee's allowed list?
      const isBuyerAllowed = assignee.allowedCustomers.includes(report.buyer);

      if (!isBuyerAllowed) {
        return res.status(200).json({
          success: true,
          isApprover: false, // DENIED due to buyer mismatch
          message: "User not authorized for this buyer",
        });
      }
    }

    // 4. Success (User is assignee AND (if reportId provided) buyer is allowed)
    return res.status(200).json({
      success: true,
      isApprover: true,
      allowedCustomers: assignee.allowedCustomers || [],
    });
  } catch (error) {
    console.error("Approval permission check error:", error);
    return res.status(500).json({
      success: false,
      isApprover: false,
      error: error.message,
    });
  }
};

// Helper to convert image to base64
const imageToBase64 = async (imageUrl) => {
  try {
    // Check if it's a local file path
    if (imageUrl.startsWith("/uploads/") || imageUrl.startsWith("uploads/")) {
      const filePath = path.join(process.cwd(), "public", imageUrl);
      if (fs.existsSync(filePath)) {
        const fileBuffer = fs.readFileSync(filePath);
        const mimeType = imageUrl.endsWith(".png") ? "image/png" : "image/jpeg";
        return `data:${mimeType};base64,${fileBuffer.toString("base64")}`;
      }
    }

    // For external URLs
    if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 10000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });
      const mimeType = response.headers["content-type"] || "image/jpeg";
      const base64 = Buffer.from(response.data, "binary").toString("base64");
      return `data:${mimeType};base64,${base64}`;
    }

    return null;
  } catch (error) {
    console.error(`Failed to convert image: ${imageUrl}`, error.message);
    return null;
  }
};

// Get all report images as base64
export const getReportImagesAsBase64 = async (req, res) => {
  try {
    const { reportId } = req.params;

    // Fetch the report
    const report = await FincheckInspectionReports.findOne({ reportId });
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }

    const imagesResult = {
      defectImages: [],
      headerImages: {},
      photoImages: [],
      inspectorImage: null,
    };

    // Process Inspector Image (Server-Side)
    if (report.empId) {
      try {
        // Use UserMain as per your db connection code
        const inspector = await UserMain.findOne({
          emp_id: report.empId,
        }).select("face_photo");

        if (inspector && inspector.face_photo) {
          // Convert the external URL to Base64 immediately
          const base64 = await imageToBase64(inspector.face_photo);
          if (base64) {
            imagesResult.inspectorImage = base64;
          }
        }
      } catch (err) {
        console.error("Error processing inspector image:", err);
      }
    }

    // Process Defect Images
    if (report.defectData && Array.isArray(report.defectData)) {
      for (const defect of report.defectData) {
        // Process no-location images
        if (defect.images) {
          for (const img of defect.images) {
            if (img.imageURL) {
              const base64 = await imageToBase64(img.imageURL);
              imagesResult.defectImages.push({
                id: img.imageId || img._id,
                base64,
              });
            }
          }
        }
        // Process location-based images
        if (defect.locations) {
          for (const loc of defect.locations) {
            for (const pos of loc.positions || []) {
              if (pos.requiredImage?.imageURL) {
                const base64 = await imageToBase64(pos.requiredImage.imageURL);
                imagesResult.defectImages.push({
                  id: pos.requiredImage.imageId || pos._id,
                  base64,
                });
              }
              for (const addImg of pos.additionalImages || []) {
                if (addImg.imageURL) {
                  const base64 = await imageToBase64(addImg.imageURL);
                  imagesResult.defectImages.push({
                    id: addImg.imageId || addImg._id,
                    base64,
                  });
                }
              }
            }
          }
        }
      }
    }

    // Process Header (Checklist) Images
    if (report.headerData && Array.isArray(report.headerData)) {
      for (const section of report.headerData) {
        for (const img of section.images || []) {
          if (img.imageURL) {
            const key = `${section.headerId}_${img.id || img._id}`;
            const base64 = await imageToBase64(img.imageURL);
            imagesResult.headerImages[key] = base64;
          }
        }
      }
    }

    // Process Photo Documentation Images
    if (report.photoData && Array.isArray(report.photoData)) {
      for (const section of report.photoData) {
        for (const item of section.items || []) {
          for (const img of item.images || []) {
            if (img.imageURL) {
              const base64 = await imageToBase64(img.imageURL);
              imagesResult.photoImages.push({
                sectionId: section.sectionId,
                itemNo: item.itemNo,
                imageId: img.imageId || img._id,
                base64,
              });
            }
          }
        }
      }
    }

    res.json({
      success: true,
      data: imagesResult,
    });
  } catch (error) {
    console.error("Error fetching images:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch images",
      error: error.message,
    });
  }
};

// ============================================================
// GET Defect Heatmap Data (Product Location Map + Counts)
// ============================================================

export const getReportDefectHeatmap = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId),
    }).select("productTypeId defectData");

    if (!report || !report.productTypeId) {
      return res
        .status(404)
        .json({ success: false, message: "Data not found" });
    }

    const locationMap = await QASectionsProductLocation.findOne({
      productTypeId: report.productTypeId,
      isActive: true,
    }).lean();

    if (!locationMap) {
      return res
        .status(404)
        .json({ success: false, message: "No map configured." });
    }

    const counts = {
      Front: {},
      Back: {},
    };

    if (report.defectData && Array.isArray(report.defectData)) {
      report.defectData.forEach((defect) => {
        if (!defect.isNoLocation && defect.locations) {
          defect.locations.forEach((loc) => {
            const locNo = loc.locationNo;
            const viewKey =
              loc.view && loc.view.toLowerCase() === "back" ? "Back" : "Front";
            const qty = loc.qty || (loc.positions ? loc.positions.length : 1);
            const defectName = defect.defectName;

            // Initialize if not exists
            if (!counts[viewKey][locNo]) {
              counts[viewKey][locNo] = {
                total: 0,
                defects: {}, // Map for defect breakdown
              };
            }

            // Add to total
            counts[viewKey][locNo].total += qty;

            // Add to specific defect breakdown
            if (counts[viewKey][locNo].defects[defectName]) {
              counts[viewKey][locNo].defects[defectName] += qty;
            } else {
              counts[viewKey][locNo].defects[defectName] = qty;
            }
          });
        }
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        map: locationMap,
        counts: counts,
      },
    });
  } catch (error) {
    console.error("Error fetching defect heatmap:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ============================================================
// Get Defects Grouped by QC Inspector (Missing Defects)
// ============================================================

export const getDefectsByQCInspector = async (req, res) => {
  try {
    const { reportId } = req.params;

    // 1. Fetch the full report (Config + Defect Data)
    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId),
    })
      .select("inspectionConfig defectData")
      .lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    // Map to store Inspector Data by Emp ID
    const inspectorsMap = {};

    // Helper to initialize an inspector object
    const initInspector = (qcUser) => ({
      _id: qcUser.emp_id,
      qcDetails: {
        emp_id: qcUser.emp_id,
        eng_name: qcUser.eng_name,
        face_photo: qcUser.face_photo || null,
        job_title: qcUser.job_title || "", // Added Job Title
      },
      // Configs Map: Key = "Line|Table|Color" string to merge duplicates
      configsMap: {},
      totalDefects: 0,
      minorCount: 0,
      majorCount: 0,
      criticalCount: 0,
    });

    // Helper to generate a unique key for a configuration
    const getConfigKey = (line, table, color) => {
      // Normalize to handle nulls/undefined
      const l = line || "";
      const t = table || "";
      const c = color || "";
      return JSON.stringify({ l, t, c });
    };

    // 2. PASS 1: Scan Inspection Config to get ALL assigned QCs (even those with 0 defects)
    if (report.inspectionConfig?.configGroups) {
      report.inspectionConfig.configGroups.forEach((group) => {
        // Extract Config Details
        const line = group.lineName || group.line || "";
        const table = group.tableName || group.table || "";
        const color = group.colorName || group.color || "";
        const configKey = getConfigKey(line, table, color);

        if (group.assignments && Array.isArray(group.assignments)) {
          group.assignments.forEach((assign) => {
            // Check if valid QC User object exists
            if (assign.qcUser && assign.qcUser.emp_id) {
              const empId = assign.qcUser.emp_id;

              // Init if not exists
              if (!inspectorsMap[empId]) {
                inspectorsMap[empId] = initInspector(assign.qcUser);
              }

              // Ensure this config exists in their list (even if empty defects)
              if (!inspectorsMap[empId].configsMap[configKey]) {
                inspectorsMap[empId].configsMap[configKey] = {
                  line,
                  table,
                  color,
                  defects: [],
                };
              }
            }
          });
        }
      });
    }

    // 3. PASS 2: Scan Defect Data to map defects to QCs
    if (report.defectData && Array.isArray(report.defectData)) {
      report.defectData.forEach((defect) => {
        // We only care about location-based defects for QC tracking
        if (defect.locations && Array.isArray(defect.locations)) {
          defect.locations.forEach((loc) => {
            if (loc.positions && Array.isArray(loc.positions)) {
              loc.positions.forEach((pos) => {
                // Check if this specific defect position has a QC User tagged
                if (pos.qcUser && pos.qcUser.emp_id) {
                  const empId = pos.qcUser.emp_id;

                  // Edge Case: QC found in defect but NOT in config (Ad-hoc) -> Add them
                  if (!inspectorsMap[empId]) {
                    inspectorsMap[empId] = initInspector(pos.qcUser);
                  }

                  // Identify Config Context from Defect Snapshot
                  const line = defect.lineName || "";
                  const table = defect.tableName || "";
                  const color = defect.colorName || "";
                  const configKey = getConfigKey(line, table, color);

                  // Init config if missing
                  if (!inspectorsMap[empId].configsMap[configKey]) {
                    inspectorsMap[empId].configsMap[configKey] = {
                      line,
                      table,
                      color,
                      defects: [],
                    };
                  }

                  // Add Defect to List
                  // Aggregating by count: 1 position = 1 defect qty
                  inspectorsMap[empId].configsMap[configKey].defects.push({
                    name: defect.defectName,
                    status: pos.status,
                    qty: 1,
                  });

                  // Update Totals
                  inspectorsMap[empId].totalDefects += 1;
                  const status = pos.status?.toLowerCase();
                  if (status === "minor") inspectorsMap[empId].minorCount += 1;
                  else if (status === "major")
                    inspectorsMap[empId].majorCount += 1;
                  else if (status === "critical")
                    inspectorsMap[empId].criticalCount += 1;
                }
              });
            }
          });
        }
      });
    }

    // 4. Transform Map to Array & Consolidate Defect Lists
    const results = Object.values(inspectorsMap)
      .map((inspector) => {
        // Convert configsMap to array
        const configsArray = Object.values(inspector.configsMap).map(
          (config) => {
            // Consolidate defects list (Merge same Name + Status)
            const consolidatedDefectsMap = {};
            config.defects.forEach((d) => {
              const key = `${d.name}_${d.status}`;
              if (!consolidatedDefectsMap[key]) {
                consolidatedDefectsMap[key] = { ...d };
              } else {
                consolidatedDefectsMap[key].qty += d.qty;
              }
            });
            return {
              ...config,
              defects: Object.values(consolidatedDefectsMap),
            };
          },
        );

        return {
          ...inspector,
          configs: configsArray,
          // Remove temp map
        };
      })
      // Sort: High Defects first, then by Name
      .sort((a, b) => b.totalDefects - a.totalDefects);

    // Remove the temp `configsMap` from the final JSON
    const finalData = results.map(({ configsMap, ...rest }) => rest);

    return res.status(200).json({
      success: true,
      data: finalData,
    });
  } catch (error) {
    console.error("Error fetching defects by QC:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ============================================================
// User Preferences: Save Filter & Columns
// ============================================================
export const saveUserPreference = async (req, res) => {
  try {
    const { empId, type, data } = req.body; // type: 'filter' or 'columns'

    if (!empId)
      return res
        .status(400)
        .json({ success: false, message: "Emp ID required" });

    let userPref = await FincheckUserPreferences.findOne({ empId });

    if (!userPref) {
      userPref = new FincheckUserPreferences({ empId });
    }

    if (type === "columns") {
      // Data should be array of column IDs
      userPref.favoriteColumns = data;
    } else if (type === "filter") {
      const { name, filters } = data;

      // Check validation
      if (name.length > 25) {
        return res
          .status(400)
          .json({ success: false, message: "Name must be less than 25 chars" });
      }

      // Check for duplicate filters (comparing object structure)
      // We convert to string for a quick comparison of values
      const newFilterStr = JSON.stringify(filters);

      const duplicate = userPref.savedFilters.find(
        (f) => JSON.stringify(f.filters) === newFilterStr,
      );
      if (duplicate) {
        return res.status(400).json({
          success: false,
          message: `This exact filter configuration is already saved as "${duplicate.name}". Please select different filters.`,
        });
      }

      // Check for duplicate name
      const nameDuplicate = userPref.savedFilters.find(
        (f) => f.name.toLowerCase() === name.toLowerCase(),
      );
      if (nameDuplicate) {
        return res.status(400).json({
          success: false,
          message: "A filter with this name already exists.",
        });
      }

      userPref.savedFilters.push({ name, filters });
    }

    userPref.updatedAt = new Date();
    await userPref.save();

    return res.status(200).json({ success: true, data: userPref });
  } catch (error) {
    console.error("Error saving preferences:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// User Preferences: Get Preferences
// ============================================================
export const getUserPreferences = async (req, res) => {
  try {
    const { empId } = req.query;
    if (!empId)
      return res
        .status(400)
        .json({ success: false, message: "Emp ID required" });

    const userPref = await FincheckUserPreferences.findOne({ empId });

    return res.status(200).json({
      success: true,
      data: userPref || { favoriteColumns: [], savedFilters: [] },
    });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// User Preferences: Delete Filter
// ============================================================
export const deleteUserFilter = async (req, res) => {
  try {
    const { empId, filterId } = req.body;

    await FincheckUserPreferences.updateOne(
      { empId },
      { $pull: { savedFilters: { _id: filterId } } },
    );

    const updated = await FincheckUserPreferences.findOne({ empId });
    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// Submit Leader Decision (With Audio Support)
// ============================================================

// Define Storage Path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define Decision Audio Storage Path
const uploadDirDecision = path.join(
  __dirname,
  "../../../storage/PivotY/Fincheck/Decision",
);

// Ensure directory exists
if (!fs.existsSync(uploadDirDecision)) {
  fs.mkdirSync(uploadDirDecision, { recursive: true });
}

// ============================================================
// Get Existing Decision (To Pre-fill Modal)
// ============================================================

export const getLeaderDecision = async (req, res) => {
  try {
    const { reportId } = req.params;
    const parsedId = parseInt(reportId);

    // 1. Fetch Decision Data
    const decision = await FincheckInspectionDecision.findOne({
      reportId: parsedId,
    });

    // 2. Fetch Report Data (For Resubmission History & Emp Name)
    const report = await FincheckInspectionReports.findOne({
      reportId: parsedId,
    }).select("resubmissionHistory empId empName"); // Only select needed fields

    // Prepare response data
    const responseData = {
      decision: decision || null,
      resubmissionHistory: report ? report.resubmissionHistory : [],
      qaInfo: report ? { empId: report.empId, empName: report.empName } : null,
    };

    return res.status(200).json({
      success: true,
      exists: !!decision,
      data: responseData, // Send combined data
    });
  } catch (error) {
    console.error("Error fetching decision:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// Submit Leader Decision (With History & Audio)
// ============================================================

export const submitLeaderDecision = async (req, res) => {
  try {
    const {
      reportId,
      status,
      systemComment,
      additionalComment,
      leaderId,
      leaderName,
      reworkPO,
      reworkPOComment,
    } = req.body;

    if (!reportId) {
      return res
        .status(400)
        .json({ success: false, message: "Report ID missing." });
    }
    const parsedReportId = parseInt(reportId);

    // 1. Check if Report Exists
    const report = await FincheckInspectionReports.findOne({
      reportId: parsedReportId,
    });
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }

    // 2. Check for Existing Decision Document
    let decisionDoc = await FincheckInspectionDecision.findOne({
      reportId: parsedReportId,
    });

    // Determine Approval Number (Increment if exists, else 1)
    const nextApprovalNo = decisionDoc
      ? decisionDoc.approvalHistory.length + 1
      : 1;

    // 3. Handle Audio File Upload
    let audioUrl = "";
    let hasAudio = false;

    if (req.files && req.files.audioBlob) {
      const audioFile = req.files.audioBlob;
      const targetDir = uploadDirDecision;

      // Naming: Decision_ReportID_AppvNo_Timestamp.webm
      const fileName = `Decision_${parsedReportId}_AppvNo${nextApprovalNo}_${Date.now()}.webm`;
      const uploadPath = path.join(targetDir, fileName);

      await audioFile.mv(uploadPath);
      audioUrl = `/storage/PivotY/Fincheck/Decision/${fileName}`;
      hasAudio = true;
    }

    // 4. Create History Object
    const historyEntry = {
      approvalNo: nextApprovalNo,
      decisionStatus: status,
      approvalEmpId: leaderId,
      approvalEmpName: leaderName,
      additionalComment: additionalComment || "",
      hasAudio: hasAudio,
      audioUrl: audioUrl,
      approvalDate: new Date(),
    };

    // 5. Update or Create Document
    if (decisionDoc) {
      // UPDATE Existing
      decisionDoc.decisionStatus = status; // Update Top Level
      decisionDoc.approvalEmpId = leaderId;
      decisionDoc.approvalEmpName = leaderName;
      decisionDoc.systemGeneratedComment = systemComment;
      // Save Rework PO fields to top level
      decisionDoc.reworkPO = reworkPO || "";
      decisionDoc.reworkPOComment = reworkPOComment || "";
      decisionDoc.approvalHistory.push(historyEntry); // Add to history

      await decisionDoc.save();
    } else {
      // CREATE New
      decisionDoc = new FincheckInspectionDecision({
        reportId: parsedReportId,
        reportRef: report._id,
        approvalEmpId: leaderId,
        approvalEmpName: leaderName,
        decisionStatus: status,
        systemGeneratedComment: systemComment,
        reworkPO: reworkPO || "",
        reworkPOComment: reworkPOComment || "",
        approvalHistory: [historyEntry], // Initialize history
      });

      await decisionDoc.save();
    }

    /* -------------------------------------------
      TRIGGER PUSH NOTIFICATION
    ------------------------------------------- */

    // Common Data for Notifications
    const qaEmpId = report.empId;
    const dateObj = new Date(report.inspectionDate);
    const dateStr = dateObj.toLocaleDateString("en-US");
    const orderStr =
      report.orderNosString ||
      (report.orderNos ? report.orderNos.join(", ") : "N/A");
    const reportName = report.reportType || "Inspection";
    const targetUrl = `/fincheck-reports/view/${reportId}`;

    // --- SCENARIO A: Critical Rework PO Notification ---
    // Target: Members in FincheckNotificationGroup who have the report's buyer in their notifiedCustomers
    if (reworkPO === "Yes") {
      try {
        // Get the buyer/customer from the report
        const reportBuyer = report.buyer;

        if (!reportBuyer) {
          console.log(
            "No buyer found in report, skipping Rework PO notifications",
          );
        } else {
          // Find only group members who have this buyer in their notifiedCustomers array
          const groupMembers = await FincheckNotificationGroup.find({
            notifiedCustomers: { $in: [reportBuyer] },
          });

          if (groupMembers && groupMembers.length > 0) {
            // Build the notification body
            const line1 = `#${parsedReportId} [${reportName}]`;
            const line2 = `[${dateStr} - ${orderStr} - ${qaEmpId}] marked for Rework PO due to quality issue by ${leaderId} - ${leaderName}`;
            const line3 = reworkPOComment ? `Reason: ${reworkPOComment}` : "";

            const criticalBody = line3
              ? `${line1}\n${line2}\n${line3}`
              : `${line1}\n${line2}`;

            const criticalPayload = {
              title: `🚨 CRITICAL: REWORK PO OPEN CARTON REQUIRED !!!`,
              body: criticalBody,
              icon: "/assets/Home/Fincheck_Critical.png",
              url: targetUrl,
              tag: `rework-po-${parsedReportId}`,
              isCritical: true,
            };

            // Send only to members who are subscribed to this buyer
            for (const member of groupMembers) {
              try {
                await sendPushToUser(member.empId, criticalPayload);
              } catch (pushErr) {
                console.error(`Failed to send to ${member.empId}:`, pushErr);
              }
            }
          } else {
            console.log(
              `No notification group members found for buyer: ${reportBuyer}`,
            );
          }
        }
      } catch (err) {
        console.error("Error sending Rework PO notification:", err);
      }
    }

    // --- SCENARIO B: QA Feedback Notification (Rework or Rejected) ---
    // Target: QA User Only
    if (status === "Rework" || status === "Rejected") {
      try {
        // Build the notification body
        const line1 = `Report #${parsedReportId} [${reportName}]`;
        const line2 = `[${dateStr} - ${orderStr} - ${qaEmpId}] marked for ${status.toUpperCase()} by ${leaderId} - ${leaderName}`;
        const leaderComment = additionalComment || "";
        const line3 = leaderComment ? `Leader Comment: ${leaderComment}` : "";

        const qaBody = line3
          ? `${line1}\n${line2}\n${line3}`
          : `${line1}\n${line2}`;

        const qaPayload = {
          title: `Fincheck: Report ${status}`,
          body: qaBody,
          icon: "/assets/Home/Fincheck_Inspection.png",
          url: targetUrl,
          tag: `fincheck-${parsedReportId}`,
        };

        await sendPushToUser(qaEmpId, qaPayload);
      } catch (pushErr) {
        console.error(`Failed to send ${status} notification to QA:`, pushErr);
      }
    }

    // --- SCENARIO C: Approved Notification (Optional - Inform QA) ---
    if (status === "Approved") {
      try {
        const line1 = `Report #${parsedReportId} [${reportName}]`;
        const line2 = `[${dateStr} - ${orderStr}] has been APPROVED by ${leaderId} - ${leaderName}`;

        const approvedPayload = {
          title: `✅ Fincheck: Report Approved`,
          body: `${line1}\n${line2}`,
          icon: "/assets/Home/Fincheck_Inspection.png",
          url: targetUrl,
          tag: `fincheck-approved-${parsedReportId}`,
        };

        await sendPushToUser(qaEmpId, approvedPayload);
      } catch (pushErr) {
        console.error("Failed to send Approved notification:", pushErr);
      }
    }

    return res.status(200).json({
      success: true,
      message: "Decision saved successfully",
      data: decisionDoc,
    });
  } catch (error) {
    console.error("Error saving decision:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// Get Notifications for QA (User)
// ============================================================
export const getQANotifications = async (req, res) => {
  try {
    const { empId } = req.query;

    if (!empId) {
      return res
        .status(400)
        .json({ success: false, message: "QA ID is required." });
    }

    // 1. Find all reports created by this QA (empId)
    // We only need reportId to join with decisions
    const userReports = await FincheckInspectionReports.find({
      empId: empId,
      status: { $ne: "cancelled" }, // Optional: Exclude cancelled
    }).select("reportId orderNosString inspectionDate");

    const reportIds = userReports.map((r) => r.reportId);

    if (reportIds.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // 2. Find Decisions for these reports
    // We want all decisions where status exists (Approved, Rework, Rejected)
    const decisions = await FincheckInspectionDecision.find({
      reportId: { $in: reportIds },
    }).lean();

    // 3. Merge Data & Filter Logic
    // Logic:
    // - Show notification if a decision exists.
    // - If "Rework" or "Rejected", it's an ACTIVE notification until fixed.
    // - If "Approved", show it but maybe mark as read (frontend logic) or just show recent.
    // - IMPORTANT: Remove notification if QA resubmitted AFTER the decision.

    const notifications = [];

    for (const decision of decisions) {
      const report = userReports.find((r) => r.reportId === decision.reportId);
      if (!report) continue;

      // Get full report details to check resubmission time
      // Fetching again here to get resubmissionHistory array (optimized query would use aggregation, but this is fine for logic clarity)
      const fullReport = await FincheckInspectionReports.findOne({
        reportId: decision.reportId,
      }).select("resubmissionHistory");

      const lastDecisionTime = new Date(decision.updatedAt).getTime();
      let lastResubmissionTime = 0;

      if (fullReport && fullReport.resubmissionHistory?.length > 0) {
        const lastResub =
          fullReport.resubmissionHistory[
            fullReport.resubmissionHistory.length - 1
          ];
        lastResubmissionTime = new Date(lastResub.resubmissionDate).getTime();
      }

      // HIDE NOTIFICATION IF: User Resubmitted AFTER Leader Decision
      // This means the ball is in Leader's court again.
      if (lastResubmissionTime > lastDecisionTime) {
        continue;
      }

      notifications.push({
        _id: decision._id,
        reportId: decision.reportId,
        orderNo: report.orderNosString,
        inspectionDate: report.inspectionDate,
        status: decision.decisionStatus, // Approved, Rework, Rejected
        leaderName: decision.approvalEmpName,
        systemComment: decision.systemGeneratedComment,
        additionalComment:
          decision.approvalHistory?.length > 0
            ? decision.approvalHistory[decision.approvalHistory.length - 1]
                .additionalComment
            : decision.additionalComment,
        audioUrl:
          decision.approvalHistory?.length > 0
            ? decision.approvalHistory[decision.approvalHistory.length - 1]
                .audioUrl
            : decision.audioUrl,
        updatedAt: decision.updatedAt,
      });
    }

    // Sort by newest decision first
    notifications.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// Get Action Required Count for Home Page Badge
// ============================================================
export const getActionRequiredCount = async (req, res) => {
  try {
    const { empId } = req.query;

    if (!empId) {
      return res.status(200).json({ success: true, count: 0 });
    }

    // 1. Find all reports by this QA
    const userReports = await FincheckInspectionReports.find({
      empId: empId,
      status: { $ne: "cancelled" },
    }).select("reportId resubmissionHistory");

    const reportIds = userReports.map((r) => r.reportId);

    if (reportIds.length === 0) {
      return res.status(200).json({ success: true, count: 0 });
    }

    // 2. Find Decisions with Rework or Rejected ONLY
    const decisions = await FincheckInspectionDecision.find({
      reportId: { $in: reportIds },
      decisionStatus: { $in: ["Rework", "Rejected"] }, // Only action-required statuses
    }).lean();

    // 3. Count only those NOT resubmitted after decision
    let actionCount = 0;

    for (const decision of decisions) {
      const report = userReports.find((r) => r.reportId === decision.reportId);
      if (!report) continue;

      const lastDecisionTime = new Date(decision.updatedAt).getTime();
      let lastResubmissionTime = 0;

      if (report.resubmissionHistory?.length > 0) {
        const lastResub =
          report.resubmissionHistory[report.resubmissionHistory.length - 1];
        lastResubmissionTime = new Date(lastResub.resubmissionDate).getTime();
      }

      // Only count if NOT resubmitted after decision
      if (lastResubmissionTime <= lastDecisionTime) {
        actionCount++;
      }
    }

    return res.status(200).json({
      success: true,
      count: actionCount,
    });
  } catch (error) {
    console.error("Error fetching action count:", error);
    return res.status(200).json({ success: true, count: 0 });
  }
};

// ============================================================
// Get Order Qty Breakdown in Shipping Stage
// ============================================================

export const getShippingStageBreakdown = async (req, res) => {
  try {
    const { reportId } = req.params;

    // 1. Fetch Report to get Order Nos
    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId),
    }).select("orderNos");

    if (!report || !report.orderNos || report.orderNos.length === 0) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "No orders linked to report",
      });
    }

    // 2. Fetch all related DtOrders
    // We use $in to get all matching orders (e.g., PTCOC335, PTCOC335A)
    const orders = await DtOrder.find({
      Order_No: { $in: report.orderNos },
    })
      .select("OrderColorShip")
      .lean();

    if (!orders || orders.length === 0) {
      return res.status(200).json({
        success: true,
        data: null,
        message: "No order details found",
      });
    }

    // 3. Aggregate Data
    // Structure: { "ColorName": { "SeqNo": TotalQty } }
    const colorMap = {};
    const allSeqNos = new Set();

    orders.forEach((order) => {
      if (order.OrderColorShip && Array.isArray(order.OrderColorShip)) {
        order.OrderColorShip.forEach((colorItem) => {
          const colorName = colorItem.Color;
          if (!colorName) return;

          if (!colorMap[colorName]) {
            colorMap[colorName] = {};
          }

          if (colorItem.ShipSeqNo && Array.isArray(colorItem.ShipSeqNo)) {
            colorItem.ShipSeqNo.forEach((shipSeq) => {
              const seqNo = shipSeq.seqNo;
              allSeqNos.add(seqNo);

              // Calculate total qty for this sequence (Sum of all sizes)
              let seqQty = 0;
              if (shipSeq.sizes && Array.isArray(shipSeq.sizes)) {
                shipSeq.sizes.forEach((sizeObj) => {
                  // Iterate values in the object (e.g., {XS: 100})
                  Object.values(sizeObj).forEach((val) => {
                    seqQty += Number(val) || 0;
                  });
                });
              }

              // Add to existing count (handling multiple orders with same color/seq)
              colorMap[colorName][seqNo] =
                (colorMap[colorName][seqNo] || 0) + seqQty;
            });
          }
        });
      }
    });

    // 4. Transform for Frontend
    const sortedSeqNos = Array.from(allSeqNos).sort((a, b) => a - b);

    // Prepare Rows
    const rows = Object.keys(colorMap).map((color) => {
      const seqData = colorMap[color];
      let rowTotal = 0;

      const rowSeqValues = {};
      sortedSeqNos.forEach((seq) => {
        const val = seqData[seq] || 0;
        rowSeqValues[seq] = val;
        rowTotal += val;
      });

      return {
        color: color,
        seqValues: rowSeqValues,
        rowTotal: rowTotal,
      };
    });

    // Prepare Column Totals
    const columnTotals = {};
    let grandTotal = 0;

    sortedSeqNos.forEach((seq) => {
      let colSum = 0;
      rows.forEach((row) => {
        colSum += row.seqValues[seq];
      });
      columnTotals[seq] = colSum;
      grandTotal += colSum;
    });

    return res.status(200).json({
      success: true,
      data: {
        seqColumns: sortedSeqNos,
        rows: rows.sort((a, b) => a.color.localeCompare(b.color)),
        columnTotals,
        grandTotal,
      },
    });
  } catch (error) {
    console.error("Error fetching shipping stage breakdown:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// Get Report for Modification (Debug View)
// ============================================================
export const getReportForModification = async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: "Report ID is required.",
      });
    }

    // Using .lean() is critical here to return fields that might exist
    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId),
    })
      .select(
        "reportId inspectionDate orderNosString inspectionConfig measurementData empId empName",
      )
      .lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Error fetching report for modification:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ============================================================
// Copy Measurement Data from Source Group to Target Group
// ============================================================
export const copyMeasurementDataToGroup = async (req, res) => {
  try {
    const {
      reportId,
      sourceGroupId, // The ID (likely index or unique ID) of the source
      targetGroupId, // The Index of the target group in the array
      targetConfigId, // The Unique ID of the target group (for verification)
      selectedSizes,
    } = req.body;

    if (
      !reportId ||
      sourceGroupId === undefined ||
      targetGroupId === undefined ||
      !selectedSizes
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    // 1. Fetch Report (Not lean, so we can save)
    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId),
    });

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    }

    // 2. Get the Target Configuration Group using the Index
    const targetConfigGroup =
      report.inspectionConfig?.configGroups?.[targetGroupId];

    if (!targetConfigGroup) {
      return res.status(400).json({
        success: false,
        message: "Target config group not found at index.",
      });
    }

    // Safety Check: Ensure the ID matches what the frontend sent
    // We treat IDs as strings for comparison to be safe
    if (String(targetConfigGroup.id) !== String(targetConfigId)) {
      return res.status(400).json({
        success: false,
        message: "Config Group index mismatch. Please refresh the report.",
      });
    }

    // 3. Extract Target Scope Names & The Correct Unique ID
    const correctTargetId = targetConfigGroup.id; // <--- THIS IS THE FIX
    const targetLine = targetConfigGroup.line || "";
    const targetLineName = targetConfigGroup.lineName || "";
    const targetTable = targetConfigGroup.table || "";
    const targetTableName = targetConfigGroup.tableName || "";
    const targetColor = targetConfigGroup.color || "";
    const targetColorName = targetConfigGroup.colorName || "";

    // 4. Find Source Measurement Data
    // We filter by the source Group ID and the sizes selected by the user
    const sourceMeasurements = report.measurementData.filter(
      (m) =>
        String(m.groupId) === String(sourceGroupId) &&
        selectedSizes.includes(m.size),
    );

    if (sourceMeasurements.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No source measurement data found for selected sizes.",
      });
    }

    // 5. Create New Measurement Records
    const newRecords = sourceMeasurements.map((sourceItem) => {
      // Calculate Timestamp: Source Timestamp + 4 Hours
      const originalTime = new Date(sourceItem.timestamp).getTime();
      const newTime = new Date(originalTime + 4 * 60 * 60 * 1000);

      return {
        // --- FIXED: Use the Unique Config ID, not the array index ---
        groupId: correctTargetId,

        // Scope Names from Target Config
        line: targetLine,
        lineName: targetLineName,
        table: targetTable,
        tableName: targetTableName,
        color: targetColor,
        colorName: targetColorName,

        // Reset Decisions
        inspectorDecision: "pass",
        systemDecision: "pass",
        timestamp: newTime,

        // --- Keys to Copy Exactly ---
        size: sourceItem.size,
        kValue: sourceItem.kValue,
        stage: sourceItem.stage,
        displayMode: sourceItem.displayMode,

        // Deep copy nested objects
        allMeasurements: JSON.parse(
          JSON.stringify(sourceItem.allMeasurements || {}),
        ),
        criticalMeasurements: JSON.parse(
          JSON.stringify(sourceItem.criticalMeasurements || {}),
        ),

        allQty: sourceItem.allQty,
        criticalQty: sourceItem.criticalQty,
        allEnabledPcs: [...(sourceItem.allEnabledPcs || [])],
        criticalEnabledPcs: [...(sourceItem.criticalEnabledPcs || [])],

        remark: sourceItem.remark || "",
        manualData: sourceItem.manualData, // Copy existing manual data
      };
    });

    // 6. Append to Measurement Data Array
    report.measurementData.push(...newRecords);

    // 7. Save
    await report.save();

    return res.status(200).json({
      success: true,
      message: `Successfully copied ${newRecords.length} records to Group ID ${correctTargetId}.`,
      data: report, // Return updated report to refresh frontend
    });
  } catch (error) {
    console.error("Error copying measurement data:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};

// ============================================================
// Fix/Sync Group ID based on Name Matching
// ============================================================
export const fixMeasurementGroupId = async (req, res) => {
  try {
    const {
      reportId,
      correctConfigId, // The ID from the Config Group (Source of Truth)
      line,
      table,
      color,
    } = req.body;

    if (!reportId || !correctConfigId) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId),
    });

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    }

    let updatedCount = 0;

    // Iterate through measurement data
    // If names match the provided scope, update the groupId to the correctConfigId
    report.measurementData.forEach((item) => {
      const mLine = item.lineName || item.line || "";
      const mTable = item.tableName || item.table || "";
      const mColor = item.colorName || item.color || "";

      // Check strict name equality
      if (mLine === line && mTable === table && mColor === color) {
        // Only update if the ID is actually different
        if (String(item.groupId) !== String(correctConfigId)) {
          item.groupId = correctConfigId;
          updatedCount++;
        }
      }
    });

    if (updatedCount === 0) {
      return res.status(200).json({
        success: true,
        message:
          "No records needed fixing (IDs already matched or no name match found).",
        data: report,
      });
    }

    // Save changes
    await report.save();

    return res.status(200).json({
      success: true,
      message: `Successfully fixed IDs for ${updatedCount} records.`,
      data: report,
    });
  } catch (error) {
    console.error("Error fixing group IDs:", error);
    return res
      .status(500)
      .json({ success: false, message: "Server Error", error: error.message });
  }
};
