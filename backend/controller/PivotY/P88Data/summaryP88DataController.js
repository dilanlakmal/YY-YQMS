import mongoose from "mongoose";

// Import your P88 model - adjust the path as needed
import { p88LegacyData } from "../../MongoDB/dbConnectionController.js";

// Helper function to escape regex special characters
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

// Get all P88 inspection data with optional filtering and pagination
export const getAllInspections = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 200,
      inspector,
      approvalStatus,
      reportType,
      supplier,
      project,
      inspectionResult,
      style,
      poNumbers,
      sortBy = "scheduledInspectionDate",
      sortOrder = "desc"
    } = req.query;

    // Build filter object
    const filter = {};

    if (inspector) {
      filter.inspector = { $regex: escapeRegExp(inspector), $options: "i" };
    }

    if (approvalStatus) {
      filter.approvalStatus = {
        $regex: escapeRegExp(approvalStatus),
        $options: "i"
      };
    }

    if (reportType) {
      filter.reportType = { $regex: escapeRegExp(reportType), $options: "i" };
    }

    if (supplier) {
      filter.supplier = { $regex: escapeRegExp(supplier), $options: "i" };
    }

    if (project) {
      filter.project = { $regex: escapeRegExp(project), $options: "i" };
    }

    // Use $and for complex queries to handle both string and array fields safely
    const complexFilters = [];

    if (style) {
      const escapedStyle = escapeRegExp(style);
      complexFilters.push({
        $or: [
          { style: { $regex: escapedStyle, $options: "i" } },
          { style: { $elemMatch: { $regex: escapedStyle, $options: "i" } } }
        ]
      });
    }

    if (inspectionResult) {
      filter.inspectionResult = inspectionResult;
    }

    if (poNumbers) {
      const escapedPo = escapeRegExp(poNumbers);
      complexFilters.push({
        $or: [
          { poNumbers: { $regex: escapedPo, $options: "i" } },
          { poNumbers: { $elemMatch: { $regex: escapedPo, $options: "i" } } }
        ]
      });
    }

    if (complexFilters.length > 0) {
      filter.$and = complexFilters;
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query
    const [inspections, totalCount] = await Promise.all([
      p88LegacyData
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      p88LegacyData.countDocuments(filter)
    ]);

    // Calculate summary statistics
    const stats = await p88LegacyData.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          passed: {
            $sum: {
              $cond: [{ $eq: ["$approvalStatus", "Accepted"] }, 1, 0]
            }
          },
          failed: {
            $sum: {
              $cond: [{ $eq: ["$approvalStatus", "Reworked"] }, 1, 0]
            }
          },
          pending: {
            $sum: {
              $cond: [{ $eq: ["$approvalStatus", "Pending Approval"] }, 1, 0]
            }
          },
          hold: {
            $sum: {
              $cond: [{ $eq: ["$inspectionResult", "Not Complete"] }, 1, 0]
            }
          }
        }
      }
    ]);

    const summary = stats[0] || {
      total: 0,
      passed: 0,
      failed: 0,
      pending: 0,
      hold: 0
    };

    res.status(200).json({
      success: true,
      results: inspections,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
        hasNext: skip + inspections.length < totalCount,
        hasPrev: parseInt(page) > 1
      },
      summary,
      message: `Retrieved ${inspections.length} inspection records`
    });
  } catch (error) {
    console.error("Error fetching P88 inspection data:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch inspection data",
      error: error.message
    });
  }
};

// Get single inspection by ID
export const getInspectionById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inspection ID format"
      });
    }

    const inspection = await p88LegacyData.findById(id).lean();

    if (!inspection) {
      return res.status(404).json({
        success: false,
        message: "Inspection not found"
      });
    }

    res.status(200).json({
      success: true,
      data: inspection,
      message: "Inspection retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching inspection by ID:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch inspection",
      error: error.message
    });
  }
};

// Get inspections by group number
export const getInspectionsByGroup = async (req, res) => {
  try {
    const { groupNumber } = req.params;

    const inspections = await p88LegacyData.find({ groupNumber }).lean();

    if (!inspections.length) {
      return res.status(404).json({
        success: false,
        message: "No inspections found for this group number"
      });
    }

    res.status(200).json({
      success: true,
      data: inspections,
      count: inspections.length,
      message: `Retrieved ${inspections.length} inspections for group ${groupNumber}`
    });
  } catch (error) {
    console.error("Error fetching inspections by group:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch inspections by group",
      error: error.message
    });
  }
};

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const stats = await p88LegacyData.aggregate([
      {
        $group: {
          _id: null,
          totalInspections: { $sum: 1 },
          totalQtyInspected: { $sum: "$qtyInspected" },
          totalQtyToInspect: { $sum: "$qtyToInspect" },
          avgDefectRate: { $avg: "$defectRate" },
          passedInspections: {
            $sum: {
              $cond: [{ $eq: ["$inspectionResult", "Pass"] }, 1, 0]
            }
          },
          failedInspections: {
            $sum: {
              $cond: [{ $eq: ["$inspectionResult", "Fail"] }, 1, 0]
            }
          },
          pendingInspections: {
            $sum: {
              $cond: [{ $eq: ["$inspectionResult", "Pending"] }, 1, 0]
            }
          }
        }
      }
    ]);

    // Get top suppliers
    const topSuppliers = await p88LegacyData.aggregate([
      { $match: { supplier: { $ne: null, $ne: "" } } },
      { $group: { _id: "$supplier", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get top inspectors
    const topInspectors = await p88LegacyData.aggregate([
      { $match: { inspector: { $ne: null, $ne: "" } } },
      { $group: { _id: "$inspector", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Get recent inspections
    const recentInspections = await p88LegacyData
      .find()
      .sort({ submittedInspectionDate: -1 })
      .limit(10)
      .select(
        "groupNumber inspector inspectionResult submittedInspectionDate supplier"
      )
      .lean();

    const dashboardData = {
      overview: stats[0] || {
        totalInspections: 0,
        totalQtyInspected: 0,
        totalQtyToInspect: 0,
        avgDefectRate: 0,
        passedInspections: 0,
        failedInspections: 0,
        pendingInspections: 0
      },
      topSuppliers,
      topInspectors,
      recentInspections
    };

    res.status(200).json({
      success: true,
      data: dashboardData,
      message: "Dashboard statistics retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics",
      error: error.message
    });
  }
};

// Search inspections
export const searchInspections = async (req, res) => {
  try {
    const { query, field = "all" } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required"
      });
    }

    const escapedQuery = escapeRegExp(query);
    let searchFilter = {};

    if (field === "all") {
      searchFilter = {
        $or: [
          { groupNumber: { $regex: escapedQuery, $options: "i" } },
          { inspector: { $regex: escapedQuery, $options: "i" } },
          { supplier: { $regex: escapedQuery, $options: "i" } },
          { project: { $regex: escapedQuery, $options: "i" } },
          // FIXED: Handle poNumbers as array in search
          { poNumbers: { $regex: escapedQuery, $options: "i" } },
          {
            poNumbers: { $elemMatch: { $regex: escapedQuery, $options: "i" } }
          },
          { style: { $regex: escapedQuery, $options: "i" } },
          { style: { $elemMatch: { $regex: escapedQuery, $options: "i" } } }
        ]
      };
    } else if (field === "poNumbers") {
      // FIXED: Handle poNumbers field specifically
      searchFilter.$or = [
        { poNumbers: { $regex: escapedQuery, $options: "i" } },
        { poNumbers: { $elemMatch: { $regex: escapedQuery, $options: "i" } } }
      ];
    } else {
      searchFilter[field] = { $regex: escapedQuery, $options: "i" };
    }

    const inspections = await p88LegacyData
      .find(searchFilter)
      .sort({ submittedInspectionDate: -1 })
      .limit(50)
      .lean();

    res.status(200).json({
      success: true,
      results: inspections,
      count: inspections.length,
      message: `Found ${inspections.length} matching inspections`
    });
  } catch (error) {
    console.error("Error searching inspections:", error);
    res.status(500).json({
      success: false,
      message: "Failed to search inspections",
      error: error.message
    });
  }
};

// Get distinct values for filter dropdowns
export const getFilterOptions = async (req, res) => {
  try {
    const [inspectors, suppliers, projects, reportTypes, styles] =
      await Promise.all([
        p88LegacyData.distinct("inspector").exec(),
        p88LegacyData.distinct("supplier").exec(),
        p88LegacyData.distinct("project").exec(),
        p88LegacyData.distinct("reportType").exec(),
        p88LegacyData.distinct("style").exec()
      ]);

    // FIXED: Handle poNumbers array field using aggregation
    const poNumbersAggregation = await p88LegacyData.aggregate([
      { $unwind: "$poNumbers" },
      { $group: { _id: "$poNumbers" } },
      { $sort: { _id: 1 } }
    ]);

    const poNumbers = poNumbersAggregation
      .map((item) => item._id)
      .filter((item) => item);

    // Helper to filter out null/empty values and sort alphabetically
    const cleanAndSort = (arr) => arr.filter((item) => item).sort();

    res.status(200).json({
      success: true,
      data: {
        inspector: cleanAndSort(inspectors),
        supplier: cleanAndSort(suppliers),
        project: cleanAndSort(projects),
        reportType: cleanAndSort(reportTypes),
        poNumbers: cleanAndSort(poNumbers),
        style: cleanAndSort(styles)
      },
      message: "Filter options retrieved successfully"
    });
  } catch (error) {
    console.error("Error fetching filter options:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch filter options",
      error: error.message
    });
  }
};
