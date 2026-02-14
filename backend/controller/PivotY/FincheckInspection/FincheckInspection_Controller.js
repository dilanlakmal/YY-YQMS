import {
  DtOrder,
  YorksysOrders,
  QASectionsAqlBuyerConfig,
  SubconSewingFactory,
  QASectionsProductType,
  FincheckInspectionReports,
  UserMain,
} from "../../MongoDB/dbConnectionController.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ============================================================
// Helper: Extract base order number (common part)
// Handles patterns like: PTCOC335, PTCOC335A, PTCOC325-1, PTCOC325-2
// ============================================================
const extractBaseOrderNo = (orderNo) => {
  if (!orderNo) return "";

  // Remove trailing letters (A, B, C...) or numbers after hyphen (-1, -2...)
  // Pattern: Remove -N (dash followed by numbers) or trailing single letters
  let base = orderNo.trim();

  // First, try to remove -N pattern (e.g., PTCOC325-1 -> PTCOC325)
  base = base.replace(/-\d+$/, "");

  // Then, try to remove trailing single uppercase letter (e.g., PTCOC335A -> PTCOC335)
  // But only if the base has letters before it (avoid removing from "ABC123A" -> "ABC123")
  const trailingLetterMatch = base.match(/^(.+?)([A-Z])$/);
  if (trailingLetterMatch) {
    const potentialBase = trailingLetterMatch[1];
    // Check if the potential base ends with a digit (meaning the trailing letter is a suffix)
    if (/\d$/.test(potentialBase)) {
      base = potentialBase;
    }
  }

  return base;
};

// ============================================================
// Search Orders for Inspection (with Multi-order grouping)
// ============================================================
export const searchInspectionOrders = async (req, res) => {
  try {
    const { term, mode = "single" } = req.query;

    if (!term || term.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search term must be at least 2 characters.",
      });
    }

    const regexPattern = new RegExp(term, "i");

    const results = await DtOrder.find({
      Order_No: { $regex: regexPattern },
    })
      .select("Order_No CustStyle EngName Factory TotalQty")
      .limit(100)
      .lean();

    // For Multi mode, group by base order number
    if (mode === "multi") {
      const groupedOrders = {};

      results.forEach((order) => {
        const base = extractBaseOrderNo(order.Order_No);
        if (!groupedOrders[base]) {
          groupedOrders[base] = {
            baseOrderNo: base,
            orders: [],
            totalQty: 0,
            custStyle: order.CustStyle,
            engName: order.EngName,
            factory: order.Factory,
          };
        }
        groupedOrders[base].orders.push(order);
        groupedOrders[base].totalQty += order.TotalQty || 0;
      });

      // Filter groups that have more than one order OR exact match
      const groupedResults = Object.values(groupedOrders)
        .filter((group) => group.orders.length >= 1)
        .map((group) => ({
          ...group,
          orderCount: group.orders.length,
          orderNos: group.orders.map((o) => o.Order_No),
        }));

      return res.status(200).json({
        success: true,
        mode: "multi",
        data: groupedResults,
      });
    }

    return res.status(200).json({
      success: true,
      mode: "single",
      data: results,
    });
  } catch (error) {
    console.error("Error searching inspection orders:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while searching orders.",
      error: error.message,
    });
  }
};

// ============================================================
// Get Order Details for Single Order
// ============================================================
export const getInspectionOrderDetails = async (req, res) => {
  try {
    const { moNo } = req.params;

    if (!moNo) {
      return res.status(400).json({
        success: false,
        message: "MO Number is required.",
      });
    }

    const [dtOrder, yorksysOrder] = await Promise.all([
      DtOrder.findOne({ Order_No: moNo }).lean(),
      YorksysOrders.findOne({ moNo: moNo }).lean(),
    ]);

    if (!dtOrder) {
      return res.status(404).json({
        success: false,
        message: `Order ${moNo} not found in dt_orders.`,
      });
    }

    // Process dt_orders data
    const dtOrderData = {
      orderNo: dtOrder.Order_No,
      custStyle: dtOrder.CustStyle || "N/A",
      customer: dtOrder.EngName || "N/A",
      factory: dtOrder.Factory || "N/A",
      totalQty: dtOrder.TotalQty || 0,
      origin: dtOrder.Origin || "N/A",
      mode: dtOrder.Mode || "N/A",
      salesTeamName: dtOrder.SalesTeamName || "N/A",
      country: dtOrder.Country || "N/A",
      sizeList: dtOrder.SizeList || [],
    };

    // Process OrderColors for Color/Size breakdown
    const colorSizeData = [];
    const sizeSet = new Set();
    let grandTotal = 0;

    if (dtOrder.OrderColors && Array.isArray(dtOrder.OrderColors)) {
      dtOrder.OrderColors.forEach((colorObj) => {
        const colorRow = {
          color: colorObj.Color || "N/A",
          colorCode: colorObj.ColorCode || "",
          sizes: {},
          total: 0,
        };

        if (colorObj.OrderQty && Array.isArray(colorObj.OrderQty)) {
          colorObj.OrderQty.forEach((qtyObj) => {
            const sizeName = Object.keys(qtyObj)[0];
            const qty = qtyObj[sizeName] || 0;
            const cleanSize = sizeName.split(";")[0].trim();

            if (qty > 0) {
              sizeSet.add(cleanSize);
              colorRow.sizes[cleanSize] = qty;
              colorRow.total += qty;
            }
          });
        }

        if (colorRow.total > 0) {
          grandTotal += colorRow.total;
          colorSizeData.push(colorRow);
        }
      });
    }

    const sizeTotals = {};
    const sizeList = Array.from(sizeSet);

    sizeList.forEach((size) => {
      sizeTotals[size] = colorSizeData.reduce(
        (sum, row) => sum + (row.sizes[size] || 0),
        0,
      );
    });

    let yorksysData = null;
    if (yorksysOrder) {
      yorksysData = {
        skuDescription: yorksysOrder.skuDescription || "N/A",
        destination: yorksysOrder.destination || "N/A",
        season: yorksysOrder.season || "N/A",
        productType: yorksysOrder.productType || "N/A",
        fabricContent: yorksysOrder.FabricContent || [],
        skuData: yorksysOrder.SKUData || [],
        moSummary: yorksysOrder.MOSummary?.[0] || null,
      };
    }

    return res.status(200).json({
      success: true,
      data: {
        dtOrder: dtOrderData,
        colorSizeBreakdown: {
          sizeList: sizeList,
          colors: colorSizeData,
          sizeTotals: sizeTotals,
          grandTotal: grandTotal,
        },
        yorksysOrder: yorksysData,
      },
    });
  } catch (error) {
    console.error("Error fetching inspection order details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching order details.",
      error: error.message,
    });
  }
};

// ============================================================
// Get Multiple Order Details (for Multi/Batch mode)
// ============================================================
export const getMultipleOrderDetails = async (req, res) => {
  try {
    const { orderNos } = req.body;

    if (!orderNos || !Array.isArray(orderNos) || orderNos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order numbers array is required.",
      });
    }

    // Fetch all orders from both collections
    const [dtOrders, yorksysOrders] = await Promise.all([
      DtOrder.find({ Order_No: { $in: orderNos } }).lean(),
      YorksysOrders.find({ moNo: { $in: orderNos } }).lean(),
    ]);

    if (dtOrders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found in dt_orders.",
      });
    }

    // Create a map for yorksys orders
    const yorksysMap = {};
    yorksysOrders.forEach((order) => {
      yorksysMap[order.moNo] = order;
    });

    // Process combined data
    let combinedTotalQty = 0;
    const allCustStyles = new Set();
    const allCustomers = new Set();
    const allFactories = new Set();
    const allOrigins = new Set();
    const allModes = new Set();
    const allSalesTeams = new Set();
    const allCountries = new Set();

    // Yorksys combined data
    const allSkuDescriptions = new Set();
    const allDestinations = new Set();
    const allSeasons = new Set();
    const allProductTypes = new Set();
    const allFabricContents = [];

    // Per-order breakdowns
    const orderBreakdowns = [];

    dtOrders.forEach((dtOrder) => {
      const orderNo = dtOrder.Order_No;

      // Accumulate combined values
      combinedTotalQty += dtOrder.TotalQty || 0;
      if (dtOrder.CustStyle) allCustStyles.add(dtOrder.CustStyle);
      if (dtOrder.EngName) allCustomers.add(dtOrder.EngName);
      if (dtOrder.Factory) allFactories.add(dtOrder.Factory);
      if (dtOrder.Origin) allOrigins.add(dtOrder.Origin);
      if (dtOrder.Mode) allModes.add(dtOrder.Mode);
      if (dtOrder.SalesTeamName) allSalesTeams.add(dtOrder.SalesTeamName);
      if (dtOrder.Country) allCountries.add(dtOrder.Country);

      // Process Color/Size breakdown for this order
      const colorSizeData = [];
      const sizeSet = new Set();
      let grandTotal = 0;

      if (dtOrder.OrderColors && Array.isArray(dtOrder.OrderColors)) {
        dtOrder.OrderColors.forEach((colorObj) => {
          const colorRow = {
            color: colorObj.Color || "N/A",
            colorCode: colorObj.ColorCode || "",
            sizes: {},
            total: 0,
          };

          if (colorObj.OrderQty && Array.isArray(colorObj.OrderQty)) {
            colorObj.OrderQty.forEach((qtyObj) => {
              const sizeName = Object.keys(qtyObj)[0];
              const qty = qtyObj[sizeName] || 0;
              const cleanSize = sizeName.split(";")[0].trim();

              if (qty > 0) {
                sizeSet.add(cleanSize);
                colorRow.sizes[cleanSize] = qty;
                colorRow.total += qty;
              }
            });
          }

          if (colorRow.total > 0) {
            grandTotal += colorRow.total;
            colorSizeData.push(colorRow);
          }
        });
      }

      const sizeTotals = {};
      const sizeList = Array.from(sizeSet);
      sizeList.forEach((size) => {
        sizeTotals[size] = colorSizeData.reduce(
          (sum, row) => sum + (row.sizes[size] || 0),
          0,
        );
      });

      // Check yorksys data for this order
      const yorksysOrder = yorksysMap[orderNo];
      let yorksysData = null;

      if (yorksysOrder) {
        if (
          yorksysOrder.skuDescription &&
          yorksysOrder.skuDescription !== "N/A"
        ) {
          allSkuDescriptions.add(yorksysOrder.skuDescription);
        }
        if (yorksysOrder.destination && yorksysOrder.destination !== "N/A") {
          allDestinations.add(yorksysOrder.destination);
        }
        if (yorksysOrder.season && yorksysOrder.season !== "N/A") {
          allSeasons.add(yorksysOrder.season);
        }
        if (yorksysOrder.productType && yorksysOrder.productType !== "N/A") {
          allProductTypes.add(yorksysOrder.productType);
        }
        if (
          yorksysOrder.FabricContent &&
          yorksysOrder.FabricContent.length > 0
        ) {
          yorksysOrder.FabricContent.forEach((fc) => {
            const key = `${fc.fabricName}-${fc.percentageValue}`;
            if (
              !allFabricContents.find(
                (f) => `${f.fabricName}-${f.percentageValue}` === key,
              )
            ) {
              allFabricContents.push(fc);
            }
          });
        }

        yorksysData = {
          skuDescription: yorksysOrder.skuDescription || "N/A",
          destination: yorksysOrder.destination || "N/A",
          season: yorksysOrder.season || "N/A",
          productType: yorksysOrder.productType || "N/A",
          fabricContent: yorksysOrder.FabricContent || [],
          skuData: yorksysOrder.SKUData || [],
          moSummary: yorksysOrder.MOSummary?.[0] || null,
        };
      }

      orderBreakdowns.push({
        orderNo: orderNo,
        totalQty: dtOrder.TotalQty || 0,
        colorSizeBreakdown: {
          sizeList: sizeList,
          colors: colorSizeData,
          sizeTotals: sizeTotals,
          grandTotal: grandTotal,
        },
        yorksysOrder: yorksysData,
      });
    });

    // Helper to join set values
    const joinSet = (set) => {
      const arr = Array.from(set).filter((v) => v && v !== "N/A");
      return arr.length > 0 ? arr.join(", ") : "N/A";
    };

    // Combined order info
    const combinedDtOrder = {
      orderNo: orderNos.join(", "),
      orderNos: orderNos,
      custStyle: joinSet(allCustStyles),
      customer: joinSet(allCustomers),
      factory: joinSet(allFactories),
      totalQty: combinedTotalQty,
      origin: joinSet(allOrigins),
      mode: joinSet(allModes),
      salesTeamName: joinSet(allSalesTeams),
      country: joinSet(allCountries),
    };

    // Combined yorksys info
    const combinedYorksysOrder = {
      skuDescription: joinSet(allSkuDescriptions),
      destination: joinSet(allDestinations),
      season: joinSet(allSeasons),
      productType: joinSet(allProductTypes),
      fabricContent: allFabricContents,
    };

    return res.status(200).json({
      success: true,
      data: {
        dtOrder: combinedDtOrder,
        yorksysOrder: combinedYorksysOrder,
        orderBreakdowns: orderBreakdowns,
        foundOrders: dtOrders.map((o) => o.Order_No),
        missingOrders: orderNos.filter(
          (no) => !dtOrders.find((o) => o.Order_No === no),
        ),
      },
    });
  } catch (error) {
    console.error("Error fetching multiple order details:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching order details.",
      error: error.message,
    });
  }
};

// ============================================================
// Find related orders by base order number (for Multi mode)
// ============================================================
export const findRelatedOrders = async (req, res) => {
  try {
    const { baseOrderNo } = req.query;

    if (!baseOrderNo) {
      return res.status(400).json({
        success: false,
        message: "Base order number is required.",
      });
    }

    // Create regex to find all related orders
    // Pattern matches: baseOrderNo, baseOrderNoA, baseOrderNo-1, etc.
    const regexPattern = new RegExp(`^${baseOrderNo}([A-Z]|-\\d+)?$`, "i");

    const relatedOrders = await DtOrder.find({
      Order_No: { $regex: regexPattern },
    })
      .select("Order_No CustStyle EngName Factory TotalQty")
      .lean();

    return res.status(200).json({
      success: true,
      baseOrderNo: baseOrderNo,
      data: relatedOrders,
      totalOrders: relatedOrders.length,
      totalQty: relatedOrders.reduce((sum, o) => sum + (o.TotalQty || 0), 0),
    });
  } catch (error) {
    console.error("Error finding related orders:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while finding related orders.",
      error: error.message,
    });
  }
};

// ============================================================
// Get Distinct Colors for Selected Orders
// ============================================================
export const getOrderColors = async (req, res) => {
  try {
    const { orderNos } = req.body;

    if (!orderNos || !Array.isArray(orderNos) || orderNos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order numbers array is required.",
      });
    }

    // Fetch all orders
    const dtOrders = await DtOrder.find({ Order_No: { $in: orderNos } })
      .select("Order_No OrderColors")
      .lean();

    if (dtOrders.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No orders found.",
      });
    }

    // Extract distinct colors
    const colorMap = new Map();

    dtOrders.forEach((order) => {
      if (order.OrderColors && Array.isArray(order.OrderColors)) {
        order.OrderColors.forEach((colorObj) => {
          const colorName = colorObj.Color?.trim();
          if (colorName && !colorMap.has(colorName.toLowerCase())) {
            colorMap.set(colorName.toLowerCase(), {
              color: colorName,
              colorCode: colorObj.ColorCode || "",
              chnColor: colorObj.ChnColor || "",
              colorKey: colorObj.ColorKey || null,
            });
          }
        });
      }
    });

    const distinctColors = Array.from(colorMap.values()).sort((a, b) =>
      a.color.localeCompare(b.color),
    );

    return res.status(200).json({
      success: true,
      data: distinctColors,
      totalColors: distinctColors.length,
      ordersProcessed: dtOrders.length,
    });
  } catch (error) {
    console.error("Error fetching order colors:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching colors.",
      error: error.message,
    });
  }
};

// ============================================================
// Get AQL Config for Buyer
// ============================================================
export const getAqlConfigByBuyer = async (req, res) => {
  try {
    const { buyer } = req.query;

    if (!buyer) {
      return res.status(400).json({
        success: false,
        message: "Buyer is required.",
      });
    }

    const configs = await QASectionsAqlBuyerConfig.find({
      Buyer: buyer,
    }).lean();

    if (configs.length === 0) {
      return res.status(404).json({
        success: false,
        message: `No AQL configuration found for buyer: ${buyer}`,
      });
    }

    // Organize by status (Minor, Major, Critical)
    const organizedConfigs = {
      Minor: configs.find((c) => c.Status === "Minor") || null,
      Major: configs.find((c) => c.Status === "Major") || null,
      Critical: configs.find((c) => c.Status === "Critical") || null,
    };

    return res.status(200).json({
      success: true,
      data: configs,
      organized: organizedConfigs,
    });
  } catch (error) {
    console.error("Error fetching AQL config:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching AQL config.",
      error: error.message,
    });
  }
};

// ============================================================
// Get Sub-Con Factories for Dropdown
// ============================================================
export const getSubConFactories = async (req, res) => {
  try {
    const { search } = req.query;

    let query = {};
    if (search) {
      query = {
        $or: [
          { factory: { $regex: search, $options: "i" } },
          { factory_second_name: { $regex: search, $options: "i" } },
        ],
      };
    }

    const factories = await SubconSewingFactory.find(query)
      .select("_id no factory factory_second_name lineList")
      .sort({ no: 1 })
      .limit(50)
      .lean();

    return res.status(200).json({
      success: true,
      data: factories,
    });
  } catch (error) {
    console.error("Error fetching sub-con factories:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching sub-con factories.",
      error: error.message,
    });
  }
};

// ============================================================
// NEW: Get Product Type Info for Orders
// ============================================================
export const getOrderProductTypeInfo = async (req, res) => {
  try {
    const { orderNos } = req.body;

    if (!orderNos || !Array.isArray(orderNos) || orderNos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order numbers array is required.",
      });
    }

    // Fetch yorksys orders for the given order numbers
    const yorksysOrders = await YorksysOrders.find({ moNo: { $in: orderNos } })
      .select("moNo productType")
      .lean();

    if (yorksysOrders.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          productType: null,
          imageURL: null,
          hasProductType: false,
        },
      });
    }

    // Get product types from the orders
    const productTypes = yorksysOrders
      .map((order) => order.productType)
      .filter((pt) => pt && pt.trim() !== "" && pt !== "N/A");

    // If no product type found
    if (productTypes.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          productType: null,
          imageURL: null,
          hasProductType: false,
        },
      });
    }

    // Use the first product type
    const productTypeName = productTypes[0];

    // Find the matching product type in qa_sections_product_type
    const productTypeDoc = await QASectionsProductType.findOne({
      EnglishProductName: { $regex: new RegExp(`^${productTypeName}$`, "i") },
    }).lean();

    return res.status(200).json({
      success: true,
      data: {
        productType: productTypeName,
        imageURL: productTypeDoc?.imageURL || null,
        hasProductType: true,
        productTypeId: productTypeDoc?._id || null,
        productTypeDetails: productTypeDoc || null,
      },
    });
  } catch (error) {
    console.error("Error fetching order product type info:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching product type info.",
      error: error.message,
    });
  }
};

// ============================================================
// NEW: Get All Product Type Options for Dropdown
// ============================================================
export const getProductTypeOptions = async (req, res) => {
  try {
    const productTypes = await QASectionsProductType.find()
      .select(
        "_id no EnglishProductName KhmerProductName ChineseProductName imageURL",
      )
      .sort({ no: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: productTypes,
    });
  } catch (error) {
    console.error("Error fetching product type options:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while fetching product type options.",
      error: error.message,
    });
  }
};

// ============================================================
// NEW: Update Product Type for Order(s)
// ============================================================
export const updateOrderProductType = async (req, res) => {
  try {
    const { orderNos, productType } = req.body;

    if (!orderNos || !Array.isArray(orderNos) || orderNos.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order numbers array is required.",
      });
    }

    if (!productType) {
      return res.status(400).json({
        success: false,
        message: "Product type is required.",
      });
    }

    // Update all matching orders in yorksys_orders
    const result = await YorksysOrders.updateMany(
      { moNo: { $in: orderNos } },
      { $set: { productType: productType } },
    );

    // Get the product type image
    const productTypeDoc = await QASectionsProductType.findOne({
      EnglishProductName: { $regex: new RegExp(`^${productType}$`, "i") },
    }).lean();

    return res.status(200).json({
      success: true,
      message: `Product type updated for ${result.modifiedCount} order(s).`,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        productType: productType,
        imageURL: productTypeDoc?.imageURL || null,
      },
    });
  } catch (error) {
    console.error("Error updating order product type:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while updating product type.",
      error: error.message,
    });
  }
};

// Helper to safely parse numbers
const parseNullableInt = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
};

const parseIntWithDefault = (value, defaultVal = 0) => {
  if (value === undefined || value === null || value === "") return defaultVal;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultVal : parsed;
};

// MODIFIED: Returns a Number type
const generateReportId = () => {
  return Math.floor(1000000000 + Math.random() * 9000000000);
};

// Helper for safe float parsing
const parseFloatDefault = (val, def = 0) => {
  if (val === "" || val === undefined || val === null) return def;
  const num = parseFloat(val);
  return isNaN(num) ? def : num;
};

export const createInspectionReport = async (req, res) => {
  try {
    const {
      inspectionDate,
      inspectionType,
      orderNos,
      orderType,
      empId,
      empName,
      inspectionDetails,
    } = req.body;

    if (
      !inspectionDate ||
      !inspectionType ||
      !orderNos ||
      !empId ||
      !inspectionDetails
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    const sortedOrderNos = [...orderNos].sort();
    const orderNosString = sortedOrderNos.join(", ");

    // --- MODIFIED: AQL Logic to match new Schema ---
    let processedAqlConfig = {};
    if (inspectionDetails.method === "AQL" && inspectionDetails.aqlConfig) {
      const src = inspectionDetails.aqlConfig;
      processedAqlConfig = {
        inspectionType: src.inspectionType || "",
        level: src.level || "",
        // Save floats
        minorAQL: parseFloat(src.minorAQL) || 0,
        majorAQL: parseFloat(src.majorAQL) || 0,
        criticalAQL: parseFloat(src.criticalAQL) || 0,

        inspectedQty: parseIntWithDefault(src.inspectedQty, 0),
        batch: src.batch || "",
        sampleLetter: src.sampleLetter || "",
        sampleSize: parseIntWithDefault(src.sampleSize, 0),

        // Map Items
        items: Array.isArray(src.items)
          ? src.items.map((item) => ({
              status: item.status,
              ac: parseIntWithDefault(item.ac, 0),
              re: parseIntWithDefault(item.re, 0),
            }))
          : [],
      };
    }
    const processedProductionStatus =
      inspectionDetails.qualityPlanEnabled && inspectionDetails.productionStatus
        ? inspectionDetails.productionStatus
        : {};

    const processedPackingList =
      inspectionDetails.qualityPlanEnabled && inspectionDetails.packingList
        ? inspectionDetails.packingList
        : {};

    // PROCESS EMB/PRINT INFO
    // 1. Process EMB Info (Convert to Numbers)
    let processedEmbInfo = null;
    if (inspectionDetails.embInfo) {
      processedEmbInfo = {
        remarks: inspectionDetails.embInfo.remarks || "",
        speed: {
          value: parseFloatDefault(inspectionDetails.embInfo.speed?.value),
          enabled: inspectionDetails.embInfo.speed?.enabled ?? true,
        },
        stitch: {
          value: parseFloatDefault(inspectionDetails.embInfo.stitch?.value),
          enabled: inspectionDetails.embInfo.stitch?.enabled ?? true,
        },
        needleSize: {
          value: parseFloatDefault(inspectionDetails.embInfo.needleSize?.value),
          enabled: inspectionDetails.embInfo.needleSize?.enabled ?? true,
        },
      };
    }

    // 2. Process Print Info (Convert relevant fields to Numbers)
    let processedPrintInfo = null;
    if (inspectionDetails.printInfo) {
      processedPrintInfo = {
        remarks: inspectionDetails.printInfo.remarks || "",
        machineType: {
          value: inspectionDetails.printInfo.machineType?.value || "Auto", // String
          enabled: inspectionDetails.printInfo.machineType?.enabled ?? true,
        },
        speed: {
          value: parseFloatDefault(inspectionDetails.printInfo.speed?.value), // Number
          enabled: inspectionDetails.printInfo.speed?.enabled ?? true,
        },
        pressure: {
          value: parseFloatDefault(inspectionDetails.printInfo.pressure?.value), // Number
          enabled: inspectionDetails.printInfo.pressure?.enabled ?? true,
        },
      };
    }

    const updateData = {
      inspectionDate: new Date(inspectionDate),
      inspectionType,
      orderNos: sortedOrderNos,
      orderNosString,
      orderType,
      buyer: inspectionDetails.buyer,
      productType: inspectionDetails.productType,
      productTypeId: inspectionDetails.productTypeId,
      reportType: inspectionDetails.reportTypeName,
      reportTypeId: inspectionDetails.reportTypeId,
      empId,
      empName,
      measurementMethod: inspectionDetails.measurement || "N/A",
      inspectionMethod: inspectionDetails.method || "N/A",

      inspectionDetails: {
        supplier: inspectionDetails.supplier || "",
        isSubCon: inspectionDetails.isSubCon || false,
        subConFactory: inspectionDetails.subConFactory || "",
        subConFactoryId: inspectionDetails.subConFactoryId || null,
        factory: inspectionDetails.factory || "",
        shippingStage: inspectionDetails.shippingStage || "",
        remarks: inspectionDetails.remarks || "",
        custStyle: inspectionDetails.custStyle || "",
        customer: inspectionDetails.customer || "",
        buyerCode: inspectionDetails.buyerCode || "",

        inspectedQty: parseNullableInt(inspectionDetails.inspectedQty),
        cartonQty: parseNullableInt(inspectionDetails.cartonQty),

        aqlSampleSize: parseIntWithDefault(inspectionDetails.aqlSampleSize, 0),
        totalOrderQty: parseIntWithDefault(inspectionDetails.totalOrderQty, 0),

        aqlConfig: processedAqlConfig,
        productionStatus: processedProductionStatus,
        packingList: processedPackingList,
        qualityPlanEnabled: inspectionDetails.qualityPlanEnabled || false,
        embInfo: processedEmbInfo,
        printInfo: processedPrintInfo,
      },
    };

    const filter = {
      inspectionDate: new Date(inspectionDate),
      inspectionType: inspectionType,
      orderNos: sortedOrderNos,
      reportTypeId: inspectionDetails.reportTypeId,
      productTypeId: inspectionDetails.productTypeId,
      empId: empId,
    };

    const report = await FincheckInspectionReports.findOneAndUpdate(
      filter,
      {
        $set: updateData,
        $setOnInsert: {
          reportId: generateReportId(), // Generates Number
          status: "draft",
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    const isNew = report.createdAt.getTime() === report.updatedAt.getTime();
    const message = isNew
      ? "Inspection report created successfully."
      : "Existing report updated successfully.";

    return res.status(200).json({
      success: true,
      message: message,
      isNew: isNew,
      data: report,
    });
  } catch (error) {
    console.error("Error saving inspection report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error while saving report.",
      error: error.message,
    });
  }
};

// ============================================================
// Get Inspection Report by ID
// ============================================================

export const getInspectionReportById = async (req, res) => {
  try {
    const { reportId } = req.params;

    if (!reportId) {
      return res.status(400).json({
        success: false,
        message: "Report ID is required.",
      });
    }

    const report = await FincheckInspectionReports.findOne({ reportId }).lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found.",
      });
    }

    // DYNAMIC LOOKUP: Match empId in UserMain to get the photo
    let inspectorPhoto = null;
    if (report.empId) {
      const inspector = await UserMain.findOne(
        { emp_id: report.empId },
        "face_photo",
      ).lean();

      if (inspector && inspector.face_photo) {
        inspectorPhoto = inspector.face_photo;
      }
    }

    // Process measurement data - ensure stage is properly set for legacy data
    let processedMeasurementData = report.measurementData;
    if (report.measurementData && Array.isArray(report.measurementData)) {
      processedMeasurementData = report.measurementData.map((measurement) => {
        // If stage already exists, keep it as is
        if (measurement.stage) {
          return measurement;
        }

        // For legacy data without stage field:
        // - If kValue has a value (not empty string) → "Before" wash
        // - If kValue is empty string '' → "After" wash
        return {
          ...measurement,
          stage: measurement.kValue ? "Before" : "After",
        };
      });
    }

    // Attach the photo and processed measurement data to the response object
    const reportData = {
      ...report,
      measurementData: processedMeasurementData,
      inspectorPhoto: inspectorPhoto, // Frontend can access this now
    };

    return res.status(200).json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error("Error fetching report by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// export const getInspectionReportById = async (req, res) => {
//   try {
//     const { reportId } = req.params;

//     const report = await FincheckInspectionReports.findOne({ reportId }).lean();

//     if (!report) {
//       return res.status(404).json({
//         success: false,
//         message: "Report not found."
//       });
//     }

//     // DYNAMIC LOOKUP: Match empId in UserMain to get the photo
//     let inspectorPhoto = null;
//     if (report.empId) {
//       const inspector = await UserMain.findOne(
//         { emp_id: report.empId },
//         "face_photo"
//       ).lean();

//       if (inspector && inspector.face_photo) {
//         inspectorPhoto = inspector.face_photo;
//       }
//     }

//     // Attach the photo to the response object (not saved to DB)
//     const reportData = {
//       ...report,
//       inspectorPhoto: inspectorPhoto // Frontend can access this now
//     };

//     return res.status(200).json({
//       success: true,
//       data: reportData
//     });
//   } catch (error) {
//     console.error("Error fetching report by ID:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Internal server error.",
//       error: error.message
//     });
//   }
// };

// ============================================================
// Check Existing Report (Matches Unique Index Logic)
// ============================================================

export const checkExistingReport = async (req, res) => {
  try {
    const {
      inspectionDate,
      inspectionType,
      orderNos,
      empId,
      productTypeId,
      reportTypeId,
    } = req.body;

    // Validate required fields for uniqueness check
    if (
      !inspectionDate ||
      !inspectionType ||
      !orderNos ||
      !empId ||
      !productTypeId ||
      !reportTypeId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing parameters for existence check.",
      });
    }

    const sortedOrderNos = [...orderNos].sort();

    const existingReport = await FincheckInspectionReports.findOne({
      inspectionDate: new Date(inspectionDate),
      inspectionType: inspectionType,
      orderNos: sortedOrderNos,
      productTypeId: productTypeId,
      reportTypeId: reportTypeId,
      empId: empId,
    }).lean();

    return res.status(200).json({
      success: true,
      exists: !!existingReport,
      data: existingReport || null,
    });
  } catch (error) {
    console.error("Error checking existing report:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// ============================================================
// Upload Header Images (Multipart/FormData)
// ============================================================

// Define Storage Path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDirHeader = path.join(
  __dirname,
  "../../../storage/PivotY/Fincheck/HeaderData",
);

// Ensure directory exists
if (!fs.existsSync(uploadDirHeader)) {
  fs.mkdirSync(uploadDirHeader, { recursive: true });
}

export const uploadHeaderImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(200).json({ success: true, data: { paths: [] } });
    }

    const savedPaths = [];

    for (const file of req.files) {
      // Create a unique filename
      const uniqueName = `header_img_${Date.now()}_${Math.round(
        Math.random() * 1000,
      )}${path.extname(file.originalname)}`;

      const targetPath = path.join(uploadDirHeader, uniqueName);

      // Move file from temp to final folder
      fs.renameSync(file.path, targetPath);

      // Push relative path
      savedPaths.push(`/storage/PivotY/Fincheck/HeaderData/${uniqueName}`);
    }

    return res.status(200).json({
      success: true,
      data: {
        paths: savedPaths,
      },
    });
  } catch (error) {
    console.error("Header image upload error:", error);
    return res.status(500).json({ success: false, message: "Upload failed" });
  }
};

// ============================================================
// Update Header Data
// ============================================================
export const updateHeaderData = async (req, res) => {
  try {
    const { reportId, headerData } = req.body;

    if (!reportId || !headerData || !Array.isArray(headerData)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payload." });
    }

    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId),
    });
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    }

    const processedHeaderData = headerData.map((section) => {
      const processedImages = (section.images || [])
        .map((img, idx) => {
          let finalUrl = img.imageURL;

          // Case 1: New Base64 (Legacy fallback)
          if (img.imgSrc && img.imgSrc.startsWith("data:image")) {
            const savedPath = saveBase64Image(
              img.imgSrc,
              reportId,
              section.headerId,
              idx,
            );
            if (savedPath) finalUrl = savedPath;
          }
          // Case 2: Already a server path (from uploadHeaderImages)
          // We don't need to do anything, finalUrl is already set correctly by frontend

          return {
            imageId:
              img.id ||
              img.imageId ||
              `${section.headerId}_${idx}_${Date.now()}`,
            imageURL: finalUrl,
          };
        })
        .filter((img) => img.imageURL); // Filter out failed saves

      return {
        headerId: section.headerId,
        name: section.name,
        selectedOption: section.selectedOption,
        remarks: section.remarks,
        images: processedImages,
      };
    });

    report.headerData = processedHeaderData;
    await report.save();

    return res.status(200).json({
      success: true,
      message: "Header data saved successfully.",
      data: report.headerData,
    });
  } catch (error) {
    console.error("Error updating header data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// ============================================================
// Update Photo Data (Images, Remarks)
// ============================================================

// Define Photo Storage Path
const uploadDirPhoto = path.join(
  __dirname,
  "../../../storage/PivotY/Fincheck/PhotoData",
);

// Ensure directory exists
if (!fs.existsSync(uploadDirPhoto)) {
  fs.mkdirSync(uploadDirPhoto, { recursive: true });
}

// Helper: Save Photo Base64 Image to Disk
const savePhotoBase64Image = (
  base64String,
  reportId,
  sectionId,
  itemNo,
  index,
) => {
  try {
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;

    const type = matches[1];
    const data = Buffer.from(matches[2], "base64");
    const ext = type.split("/")[1] || "jpg";

    // Create unique filename
    const filename = `photo_${reportId}_${sectionId}_${itemNo}_${index}_${Date.now()}.${ext}`;
    const filepath = path.join(uploadDirPhoto, filename);

    fs.writeFileSync(filepath, data);

    // Return relative URL
    return `/storage/PivotY/Fincheck/PhotoData/${filename}`;
  } catch (error) {
    console.error("Error saving photo base64 image:", error);
    return null;
  }
};

// ============================================================
// MODIFIED: Upload Photo Batch (Multipart Support)
// ============================================================

export const uploadPhotoBatch = async (req, res) => {
  try {
    const { reportId, sectionId, sectionName, itemNo, itemName, remarks } =
      req.body;

    if (!reportId || !sectionId || itemNo === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId),
    });
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    }

    // 1. Parse Metadata Blueprint
    let imageMetadata = [];
    if (req.body.imageMetadata) {
      try {
        imageMetadata = JSON.parse(req.body.imageMetadata);
      } catch (e) {
        console.error("Error parsing metadata", e);
      }
    }

    // 2. Reconstruct the Image Array
    const savedImages = [];
    let fileIndex = 0; // Tracks which file from req.files we are using

    // We iterate the metadata because it represents the desired final order
    for (let i = 0; i < imageMetadata.length; i++) {
      const meta = imageMetadata[i];

      // A. It is a NEW/EDITED File
      if (meta.type === "file") {
        if (req.files && req.files[fileIndex]) {
          const file = req.files[fileIndex];
          fileIndex++;

          const ext = path.extname(file.originalname) || ".jpg";
          // Timestamp ensures browser cache busting
          const filename = `photo_${reportId}_${sectionId}_${itemNo}_${i}_${Date.now()}${ext}`;
          const targetPath = path.join(uploadDirPhoto, filename);

          fs.writeFileSync(targetPath, fs.readFileSync(file.path));
          fs.unlinkSync(file.path);

          savedImages.push({
            imageId: meta.id || `${sectionId}_${itemNo}_${i}_${Date.now()}`,
            imageURL: `/storage/PivotY/Fincheck/PhotoData/${filename}`,
            uploadedAt: new Date(),
          });
        }
      }
      // B. It is an EXISTING URL (Unchanged)
      else if (meta.type === "url") {
        // Ensure we only store the relative path
        let cleanUrl = meta.imageURL;
        if (cleanUrl.includes("/storage/")) {
          cleanUrl = cleanUrl.substring(cleanUrl.indexOf("/storage/"));
        }

        savedImages.push({
          imageId: meta.id,
          imageURL: cleanUrl,
          uploadedAt: new Date(),
        });
      }
    }

    // 3. Update Database
    if (!report.photoData) report.photoData = [];

    let sectionIndex = report.photoData.findIndex(
      (sec) =>
        sec.sectionId && sec.sectionId.toString() === sectionId.toString(),
    );

    if (sectionIndex === -1) {
      report.photoData.push({
        sectionId: sectionId,
        sectionName: sectionName || "Unknown Section",
        items: [],
      });
      sectionIndex = report.photoData.length - 1;
    }

    const section = report.photoData[sectionIndex];
    let itemIndex = section.items.findIndex(
      (item) => item.itemNo === parseInt(itemNo),
    );

    if (itemIndex === -1) {
      section.items.push({
        itemNo: parseInt(itemNo),
        itemName: itemName || `Item ${itemNo}`,
        remarks: remarks || "",
        images: savedImages,
      });
    } else {
      // ✅ Delete old files that are no longer in savedImages
      // Use this if you want to clean up disk space (prevents "Saved Twice" file clutter)
      const oldImages = section.items[itemIndex].images;
      oldImages.forEach((old) => {
        const isKept = savedImages.find(
          (newImg) => newImg.imageURL === old.imageURL,
        );
        if (!isKept && old.imageURL) {
          try {
            const filePath = path.join(__dirname, "../../..", old.imageURL);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch (e) {
            /* ignore */
          }
        }
      });

      // ✅ Completely replace the array with the new reconstructed list
      section.items[itemIndex].images = savedImages;
      if (remarks !== undefined) {
        section.items[itemIndex].remarks = remarks;
      }
    }

    report.markModified("photoData");
    await report.save();

    return res.status(200).json({
      success: true,
      message: `${savedImages.length} image(s) synced successfully.`,
      data: { sectionId, itemNo, savedImages },
    });
  } catch (error) {
    console.error("Error uploading photo batch:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while saving images.",
      error: error.message,
    });
  }
};

// Delete Photo from Item
export const deletePhotoFromItem = async (req, res) => {
  try {
    const { reportId, sectionId, itemNo, imageId } = req.body;

    if (!reportId || !sectionId || itemNo === undefined || !imageId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId),
    });

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    }

    const section = report.photoData?.find(
      (sec) => sec.sectionId?.toString() === sectionId.toString(),
    );

    if (!section) {
      return res
        .status(404)
        .json({ success: false, message: "Section not found." });
    }

    const item = section.items?.find((i) => i.itemNo === parseInt(itemNo));

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found." });
    }

    const imageIndex = item.images.findIndex((img) => img.imageId === imageId);

    if (imageIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Image not found." });
    }

    const removedImage = item.images[imageIndex];
    item.images.splice(imageIndex, 1);

    // Delete file from disk (async, don't wait)
    if (removedImage.imageURL) {
      const filePath = path.join(__dirname, "../../..", removedImage.imageURL);
      fs.unlink(filePath, (err) => {
        if (err) console.log("Could not delete file:", err.message);
      });
    }

    report.markModified("photoData");
    await report.save();

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting photo:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// ============================================================
// NEW: Update Photo Item Remark Only
// ============================================================
export const updatePhotoItemRemark = async (req, res) => {
  try {
    const { reportId, sectionId, sectionName, itemNo, itemName, remarks } =
      req.body;

    if (!reportId || !sectionId || itemNo === undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId),
    });

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    }

    if (!report.photoData) report.photoData = [];

    let section = report.photoData.find(
      (sec) => sec.sectionId?.toString() === sectionId.toString(),
    );

    if (!section) {
      report.photoData.push({
        sectionId,
        sectionName: sectionName || "Unknown",
        items: [
          {
            itemNo: parseInt(itemNo),
            itemName: itemName || `Item ${itemNo}`,
            remarks: remarks || "",
            images: [],
          },
        ],
      });
    } else {
      let item = section.items.find((i) => i.itemNo === parseInt(itemNo));
      if (!item) {
        section.items.push({
          itemNo: parseInt(itemNo),
          itemName: itemName || `Item ${itemNo}`,
          remarks: remarks || "",
          images: [],
        });
      } else {
        item.remarks = remarks || "";
      }
    }

    report.markModified("photoData");
    await report.save();

    return res.status(200).json({ success: true, message: "Remark updated." });
  } catch (error) {
    console.error("Error updating remark:", error);
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

// Manual controller for updating photo data with blob URL safeguard
export const updatePhotoData = async (req, res) => {
  try {
    const { reportId, photoData } = req.body;

    if (!reportId || !photoData || !Array.isArray(photoData)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payload." });
    }

    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId),
    });

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    }

    // --- HELPER: Find existing URL in the current DB document ---
    // This recovers the valid /storage/... path if the frontend sent a blob: URL
    const findExistingValidUrl = (imgId) => {
      if (!report.photoData) return null;

      for (const section of report.photoData) {
        if (section.items) {
          for (const item of section.items) {
            if (item.images) {
              const found = item.images.find((img) => img.imageId === imgId);
              // Only return if it's a valid relative path, not a blob
              if (
                found &&
                found.imageURL &&
                !found.imageURL.startsWith("blob:")
              ) {
                return found.imageURL;
              }
            }
          }
        }
      }
      return null;
    };

    // Process nested structure: Sections -> Items -> Images
    const processedPhotoData = photoData.map((section) => {
      const processedItems = (section.items || []).map((item) => {
        const processedImages = (item.images || [])
          .map((img, idx) => {
            let finalUrl = img.imageURL;
            const imgId =
              img.id ||
              img.imageId ||
              `${section.sectionId}_${item.itemNo}_${idx}_${Date.now()}`;

            // 1. Handle New Base64 (Data URI) - Legacy/Offline support
            if (img.imgSrc && img.imgSrc.startsWith("data:image")) {
              const savedPath = savePhotoBase64Image(
                img.imgSrc,
                reportId,
                section.sectionId,
                item.itemNo,
                idx,
              );
              if (savedPath) finalUrl = savedPath;
            }

            // 2. ✅ BLOB URL SAFEGUARD (The Fix)
            // If the URL is a local blob (e.g., blob:https://...), it means
            // the frontend state hasn't updated yet. DO NOT SAVE THIS.
            // Instead, look for the file we already uploaded in the DB.
            else if (finalUrl && finalUrl.startsWith("blob:")) {
              const recoveredUrl = findExistingValidUrl(imgId);

              if (recoveredUrl) {
                finalUrl = recoveredUrl; // Use the valid /storage/ path
              } else {
                // If we can't find it in DB and it's a blob, it means
                // the upload failed or is still in progress.
                // We skip saving this image to prevent broken links.
                console.warn(
                  `Skipping image with blob URL (upload pending/failed): ${imgId}`,
                );
                return null;
              }
            }

            // 3. Ensure we have a valid URL before returning
            if (!finalUrl) return null;

            return {
              imageId: imgId,
              imageURL: finalUrl,
              uploadedAt: new Date(), // Refreshed timestamp
            };
          })
          .filter((img) => img !== null); // Remove invalid/dropped images

        return {
          itemNo: item.itemNo,
          itemName: item.itemName,
          remarks: item.remarks,
          images: processedImages,
        };
      });

      return {
        sectionId: section.sectionId,
        sectionName: section.sectionName,
        items: processedItems,
      };
    });

    report.photoData = processedPhotoData;
    await report.save();

    return res.status(200).json({
      success: true,
      message: "Photo data saved successfully.",
      data: report.photoData,
    });
  } catch (error) {
    console.error("Error updating photo data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// ============================================================
// Update Inspection Configuration (Info Tab)
// ============================================================
export const updateInspectionConfig = async (req, res) => {
  try {
    const { reportId, configData } = req.body;

    if (!reportId || !configData) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payload." });
    }

    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId),
    });

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    }

    // Construct the object based on schema
    const newConfigItem = {
      reportName: configData.reportName,
      inspectionMethod: configData.inspectionMethod,
      sampleSize: configData.sampleSize,
      configGroups: configData.configGroups, // The updated list
      updatedAt: new Date(),
    };

    // 1. Assign the new object
    report.inspectionConfig = newConfigItem;

    // 2. Force Mongoose to acknowledge the change
    // This ensures deletions in the Mixed array are persisted
    report.markModified("inspectionConfig");

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Inspection configuration saved successfully.",
      data: report.inspectionConfig,
    });
  } catch (error) {
    console.error("Error updating inspection config:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// ============================================================
// NEW: Clear Inspection Configuration (Remove All Groups)
// ============================================================
export const clearInspectionConfig = async (req, res) => {
  try {
    const { reportId } = req.body;

    if (!reportId) {
      return res
        .status(400)
        .json({ success: false, message: "Report ID required." });
    }

    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId),
    });

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    }

    // Reset configGroups to empty array and sampleSize to 0
    if (report.inspectionConfig) {
      report.inspectionConfig.configGroups = [];
      report.inspectionConfig.sampleSize = 0;
      report.inspectionConfig.updatedAt = new Date();

      report.markModified("inspectionConfig");
      await report.save();
    }

    return res.status(200).json({
      success: true,
      message: "All configuration groups removed successfully.",
      data: [],
    });
  } catch (error) {
    console.error("Error clearing inspection config:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// ============================================================
// Update Measurement Data
// ============================================================

// Define Path
const uploadDirMeasManual = path.join(
  __dirname,
  "../../../storage/PivotY/Fincheck/MeasurementManual",
);

if (!fs.existsSync(uploadDirMeasManual)) {
  fs.mkdirSync(uploadDirMeasManual, { recursive: true });
}

// Helper Function
const saveMeasManualBase64Image = (base64String, reportId, groupId, index) => {
  try {
    const matches = base64String.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) return null;

    const type = matches[1];
    const data = Buffer.from(matches[2], "base64");
    const ext = type.split("/")[1] || "jpg";

    const filename = `meas_man_${reportId}_${groupId}_${index}_${Date.now()}.${ext}`;
    const filepath = path.join(uploadDirMeasManual, filename);

    fs.writeFileSync(filepath, data);
    return `/storage/PivotY/Fincheck/MeasurementManual/${filename}`;
  } catch (error) {
    console.error("Error saving Measurement Manual image:", error);
    return null;
  }
};

export const updateMeasurementData = async (req, res) => {
  try {
    const { reportId, measurementData } = req.body;

    if (!reportId || !measurementData || !Array.isArray(measurementData)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payload." });
    }

    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId),
    });

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    }

    // Process the incoming array
    const processedMeasurementData = measurementData.map((item) => {
      let processedManualData = null;

      if (item.manualData) {
        // Handle Images in Manual Data
        const processedImages = (item.manualData.images || [])
          .map((img, idx) => {
            let finalUrl = img.imageURL;

            // Check if Base64 (New Image)
            if (img.imgSrc && img.imgSrc.startsWith("data:image")) {
              const savedPath = saveMeasManualBase64Image(
                img.imgSrc,
                reportId,
                item.groupId,
                idx,
              );
              if (savedPath) finalUrl = savedPath;
            }

            return {
              imageId:
                img.id ||
                img.imageId ||
                `mm_${item.groupId}_${idx}_${Date.now()}`,
              imageURL: finalUrl,
              remark: img.remark || "",
            };
          })
          .filter((img) => img.imageURL);

        processedManualData = {
          remarks: item.manualData.remarks || "",
          status: item.manualData.status || "Pass",
          images: processedImages,
        };
      }

      // Ensure stage is always saved
      return {
        groupId: item.groupId,
        stage: item.stage || "Before", // Default to Before if not specified
        line: item.line || "",
        table: item.table || "",
        color: item.color || "",
        lineName: item.lineName || "",
        tableName: item.tableName || "",
        colorName: item.colorName || "",
        qcUser: item.qcUser || null,
        size: item.size,
        kValue: item.kValue || "", // Preserve kValue
        displayMode: item.displayMode || "all",
        allMeasurements: item.allMeasurements || {},
        criticalMeasurements: item.criticalMeasurements || {},
        allQty: item.allQty || 1,
        criticalQty: item.criticalQty || 2,
        allEnabledPcs: item.allEnabledPcs || [],
        criticalEnabledPcs: item.criticalEnabledPcs || [],
        inspectorDecision: item.inspectorDecision || "pass",
        systemDecision: item.systemDecision || "pending",
        remark: item.remark || "",
        manualData: processedManualData,
        timestamp: item.timestamp || new Date(),
      };
    });

    // Merge with existing data instead of replacing completely
    // This preserves data from other stages that weren't in this save request
    const existingMeasurements = report.measurementData || [];

    // Get unique identifiers for new data
    const newDataKeys = new Set(
      processedMeasurementData.map(
        (m) => `${m.groupId}_${m.stage}_${m.size}_${m.kValue}`,
      ),
    );

    // Keep existing measurements that are NOT being updated
    const preservedMeasurements = existingMeasurements.filter((m) => {
      const key = `${m.groupId}_${m.stage}_${m.size}_${m.kValue}`;
      return !newDataKeys.has(key);
    });

    // Merge preserved with new
    report.measurementData = [
      ...preservedMeasurements,
      ...processedMeasurementData,
    ];

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Measurement data saved successfully.",
      data: report.measurementData,
    });
  } catch (error) {
    console.error("Error updating measurement data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// ============================================================
// Update Defect Data
// ============================================================

// Define Defect Storage Path
const uploadDirDefect = path.join(
  __dirname,
  "../../../storage/PivotY/Fincheck/DefectData",
);

// Define Manual Defect Storage Path
const uploadDirDefectManual = path.join(
  __dirname,
  "../../../storage/PivotY/Fincheck/DefectManualData",
);

// Ensure directories exist
if (!fs.existsSync(uploadDirDefect)) {
  fs.mkdirSync(uploadDirDefect, { recursive: true });
}

if (!fs.existsSync(uploadDirDefectManual)) {
  fs.mkdirSync(uploadDirDefectManual, { recursive: true });
}

// Defect Image Upload Endpoint
export const uploadDefectImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(200).json({ success: true, data: { paths: [] } });
    }

    const savedPaths = [];

    // Process uploaded files
    for (const file of req.files) {
      // Define final destination (Ensure uploadDirDefect is defined/created at top of file)
      const targetDir = uploadDirDefect;
      const uniqueName = `def_img_${Date.now()}_${Math.round(
        Math.random() * 1000,
      )}${path.extname(file.originalname)}`;
      const targetPath = path.join(targetDir, uniqueName);

      // Move file from temp to final folder
      fs.renameSync(file.path, targetPath);

      // Push the relative path that the frontend needs
      savedPaths.push(`/storage/PivotY/Fincheck/DefectData/${uniqueName}`);
    }

    return res.status(200).json({
      success: true,
      data: {
        paths: savedPaths,
      },
    });
  } catch (error) {
    console.error("Defect image upload error:", error);
    return res.status(500).json({ success: false, message: "Upload failed" });
  }
};

// Helper: Process single image object from frontend
const processImageObject = (imgObj, filenamePrefix, index) => {
  if (!imgObj) return null;

  // Get the URL - check multiple possible sources
  const finalUrl = imgObj.imageURL || imgObj.imgSrc;

  // Validation: Skip blob URLs or missing URLs
  if (
    !finalUrl ||
    finalUrl.startsWith("blob:") ||
    finalUrl.startsWith("data:")
  ) {
    console.warn(`[processImageObject] Invalid/missing URL for image:`, {
      id: imgObj.id || imgObj.imageId,
      hasImageURL: !!imgObj.imageURL,
      hasImgSrc: !!imgObj.imgSrc,
      prefix: filenamePrefix,
    });
    return null;
  }

  return {
    imageId:
      imgObj.id || imgObj.imageId || `${filenamePrefix}_${index}_${Date.now()}`,
    imageURL: finalUrl,
    uploadedAt: imgObj.uploadedAt || new Date(),
  };
};

// Helper: Process Position for Location-based defects
const processDefectPosition = (
  position,
  reportId,
  defectCode,
  locationId,
  posIndex,
) => {
  const filenameBase = `def_pos_${reportId}_${defectCode}_${locationId}_pcs${position.pcsNo}`;
  // 1. Process required image
  let processedRequiredImage = null;
  if (position.requiredImage) {
    processedRequiredImage = processImageObject(
      position.requiredImage,
      `${filenameBase}_req`,
      0,
    );
  }

  // 2. Process additional images (up to 5)
  const processedAdditionalImages = [];
  if (Array.isArray(position.additionalImages)) {
    position.additionalImages.slice(0, 5).forEach((img, imgIdx) => {
      const processed = processImageObject(img, `${filenameBase}_add`, imgIdx);
      if (processed) {
        processedAdditionalImages.push(processed);
      }
    });
  }

  return {
    pcsNo: position.pcsNo,
    status: position.status || "Major",
    requiredImage: processedRequiredImage,
    additionalRemark: (position.additionalRemark || "").slice(0, 250),
    additionalImages: processedAdditionalImages,
    position: position.position || "Outside",
    comment: position.comment || "",
    qcUser: position.qcUser || null,
  };
};

// Helper: Process Location
const processDefectLocation = (location, reportId, defectCode) => {
  // Map over the positions array
  const processedPositions = (location.positions || []).map((pos, posIdx) =>
    processDefectPosition(
      pos,
      reportId,
      defectCode,
      location.locationId,
      posIdx,
    ),
  );

  return {
    uniqueId: location.uniqueId,
    locationId: location.locationId,
    locationNo: location.locationNo,
    locationName: location.locationName,
    view: location.view,
    qty: location.qty || processedPositions.length || 1,
    positions: processedPositions, // <--- The positions contain the images
  };
};

// ============================================================
// Update Defect Data
// ============================================================

export const updateDefectData = async (req, res) => {
  try {
    const { reportId, defectData, defectManualData } = req.body;

    if (!reportId) {
      return res
        .status(400)
        .json({ success: false, message: "Report ID required." });
    }

    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId),
    });

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    }

    // --- A. Process Standard Defects ---
    if (Array.isArray(defectData)) {
      const processedDefectData = defectData.map((defect) => {
        const defectCode = defect.defectCode || "unknown";

        // CASE 1: NO-LOCATION MODE (Images at Root)
        if (defect.isNoLocation) {
          const processedImages = [];

          if (Array.isArray(defect.images)) {
            defect.images.forEach((img, imgIdx) => {
              const processed = processImageObject(
                img,
                `def_noloc_${reportId}_${defectCode}`,
                imgIdx,
              );
              if (processed) {
                processedImages.push(processed);
              }
            });
          }

          return {
            groupId: defect.groupId,
            defectId: defect.defectId,
            defectName: defect.defectName,
            defectCode: defectCode,
            categoryName: defect.categoryName || "",
            status: defect.status || "Major",
            qty: defect.qty || 1,
            determinedBuyer: defect.determinedBuyer || "Unknown",
            additionalRemark: (defect.additionalRemark || "").slice(0, 250),
            isNoLocation: true,
            locations: [],
            images: processedImages,
            lineName: defect.lineName || "",
            tableName: defect.tableName || "",
            colorName: defect.colorName || "",
            qcUser: defect.qcUser || null,
            timestamp: defect.timestamp || new Date(),
          };
        }

        // CASE 2: LOCATION-BASED MODE (Images inside Positions)
        else {
          const processedLocations = (defect.locations || []).map((loc) =>
            processDefectLocation(loc, reportId, defectCode),
          );

          // Calculate total qty from positions
          const totalQty = processedLocations.reduce(
            (sum, loc) => sum + (loc.positions?.length || loc.qty || 0),
            0,
          );

          return {
            groupId: defect.groupId,
            defectId: defect.defectId,
            defectName: defect.defectName,
            defectCode: defectCode,
            categoryName: defect.categoryName || "",
            status: null,
            qty: totalQty || defect.qty || 1,
            determinedBuyer: defect.determinedBuyer || "Unknown",
            additionalRemark: (defect.additionalRemark || "").slice(0, 250),
            isNoLocation: false,
            locations: processedLocations,
            images: [],
            lineName: defect.lineName || "",
            tableName: defect.tableName || "",
            colorName: defect.colorName || "",
            qcUser: defect.qcUser || null,
            timestamp: defect.timestamp || new Date(),
          };
        }
      });

      report.defectData = processedDefectData;
    }

    // --- B. Process Manual Defect Data ---
    if (Array.isArray(defectManualData)) {
      const processedManualData = defectManualData.map((manualItem) => {
        const groupId = manualItem.groupId || 0;
        const processedImages = [];

        if (Array.isArray(manualItem.images)) {
          manualItem.images.forEach((img, idx) => {
            const processed = processImageObject(
              img,
              `def_man_${reportId}_${groupId}`,
              idx,
            );
            if (processed) {
              processedImages.push({
                ...processed,
                remark: (img.remark || "").slice(0, 100),
              });
            }
          });
        }

        return {
          groupId: groupId,
          remarks: manualItem.remarks || "",
          images: processedImages,
          line: manualItem.line || "",
          table: manualItem.table || "",
          color: manualItem.color || "",
          qcUser: manualItem.qcUser || null,
        };
      });

      report.defectManualData = processedManualData;
    }

    await report.save();

    return res.status(200).json({
      success: true,
      message: "Defect data saved successfully.",
      data: {
        defectData: report.defectData,
        defectManualData: report.defectManualData,
      },
    });
  } catch (error) {
    console.error("Error updating defect data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal Error",
      error: error.message,
    });
  }
};

// ============================================================
// Update PP Sheet Data
// ============================================================

// Define PP Sheet Storage Path
const uploadDirPPSheet = path.join(
  __dirname,
  "../../../storage/PivotY/Fincheck/PPSheetData",
);

// Ensure directory exists
if (!fs.existsSync(uploadDirPPSheet)) {
  fs.mkdirSync(uploadDirPPSheet, { recursive: true });
}

// ============================================================
// NEW: Upload PP Sheet Images (Multipart/FormData)
// ============================================================
export const uploadPPSheetImages = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(200).json({ success: true, data: { paths: [] } });
    }

    const savedPaths = [];

    for (const file of req.files) {
      // Unique filename
      const uniqueName = `pp_img_${Date.now()}_${Math.round(
        Math.random() * 1000,
      )}${path.extname(file.originalname)}`;

      const targetPath = path.join(uploadDirPPSheet, uniqueName);

      // Move file
      fs.renameSync(file.path, targetPath);

      // Push relative path
      savedPaths.push(`/storage/PivotY/Fincheck/PPSheetData/${uniqueName}`);
    }

    return res.status(200).json({ success: true, data: { paths: savedPaths } });
  } catch (error) {
    console.error("PP Sheet image upload error:", error);
    return res.status(500).json({ success: false, message: "Upload failed" });
  }
};

// ============================================================
// MODIFIED: Update PP Sheet Data (No Base64)
// ============================================================
export const updatePPSheetData = async (req, res) => {
  try {
    const { reportId, ppSheetData } = req.body;

    if (!reportId || !ppSheetData) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payload." });
    }

    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId),
    });

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    }

    // Process Images - We only save valid server paths now
    const processedImages = (ppSheetData.images || [])
      .map((img, idx) => {
        // Frontend must have uploaded it and sent back the path in imageURL
        if (!img.imageURL) return null;

        return {
          imageId: img.id || `pp_${idx}_${Date.now()}`,
          imageURL: img.imageURL,
        };
      })
      .filter((img) => img !== null); // Remove failed saves

    // Construct the final object
    const finalData = {
      ...ppSheetData,
      images: processedImages,
      timestamp: new Date(),
    };

    report.ppSheetData = finalData;
    await report.save();

    return res.status(200).json({
      success: true,
      message: "PP Sheet data saved successfully.",
      data: report.ppSheetData,
    });
  } catch (error) {
    console.error("Error updating PP Sheet data:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error.",
      error: error.message,
    });
  }
};

// ============================================================
// HELPER: Array Sanitizer (Fixes the CastError)
// ============================================================
const sanitizeNumberArray = (arr) => {
  if (!Array.isArray(arr)) return [];
  return arr
    .map((item) => {
      // Handle edge case where frontend sends stringified array like "[1,2]"
      if (typeof item === "string" && item.startsWith("[")) return null;
      const num = Number(item);
      return isNaN(num) ? null : num;
    })
    .filter((n) => n !== null); // Remove invalid entries
};

// ============================================================
// SUBMIT FULL REPORT (OPTIMIZED Version)
// Only processes sections that have unsaved changes
// ============================================================

export const submitFullInspectionReport = async (req, res) => {
  try {
    const {
      reportId,
      inspectionDetails,
      headerData,
      photoData,
      inspectionConfig,
      measurementData,
      defectData,
      defectManualData,
      ppSheetData,
      // Frontend specifies which sections have unsaved changes
      sectionsToUpdate = null,
    } = req.body;

    if (!reportId) {
      return res
        .status(400)
        .json({ success: false, message: "Report ID is required." });
    }

    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId),
    });

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found." });
    }

    // Capture the status BEFORE applying current changes
    const wasAlreadyCompleted = report.status === "completed";

    // ============================================================
    // HELPER: Determine if section should be processed
    // ============================================================
    const shouldProcessSection = (sectionName, data) => {
      // If data is undefined/null/empty, skip
      if (data === undefined || data === null) return false;

      // If sectionsToUpdate is null, process ALL provided sections (backward compatible)
      if (sectionsToUpdate === null) return true;

      // If sectionsToUpdate is specified, only process those sections
      return (
        Array.isArray(sectionsToUpdate) &&
        sectionsToUpdate.includes(sectionName)
      );
    };

    // Track what was actually updated
    let hasChanges = false;
    const updatedSections = [];
    const skippedSections = [];

    // ============================================================
    // SECTION 1: Inspection Details
    // ============================================================
    if (shouldProcessSection("inspectionDetails", inspectionDetails)) {
      let processedAqlConfig = report.inspectionDetails?.aqlConfig || {};

      if (inspectionDetails.method === "AQL" && inspectionDetails.aqlConfig) {
        const src = inspectionDetails.aqlConfig;
        processedAqlConfig = {
          inspectionType: src.inspectionType || "",
          level: src.level || "",
          minorAQL: parseFloat(src.minorAQL) || 0,
          majorAQL: parseFloat(src.majorAQL) || 0,
          criticalAQL: parseFloat(src.criticalAQL) || 0,
          inspectedQty: parseIntWithDefault(src.inspectedQty, 0),
          batch: src.batch || "",
          sampleLetter: src.sampleLetter || "",
          sampleSize: parseIntWithDefault(src.sampleSize, 0),
          items: Array.isArray(src.items) ? src.items : [],
        };
      }

      // PROCESS EMB (Same logic as create)
      let processedEmbInfo = report.inspectionDetails.embInfo; // Default to existing
      if (inspectionDetails.embInfo !== undefined) {
        if (inspectionDetails.embInfo === null) {
          processedEmbInfo = null;
        } else {
          processedEmbInfo = {
            remarks: inspectionDetails.embInfo.remarks || "",
            speed: {
              value: parseFloatDefault(inspectionDetails.embInfo.speed?.value),
              enabled: inspectionDetails.embInfo.speed?.enabled ?? true,
            },
            stitch: {
              value: parseFloatDefault(inspectionDetails.embInfo.stitch?.value),
              enabled: inspectionDetails.embInfo.stitch?.enabled ?? true,
            },
            needleSize: {
              value: parseFloatDefault(
                inspectionDetails.embInfo.needleSize?.value,
              ),
              enabled: inspectionDetails.embInfo.needleSize?.enabled ?? true,
            },
          };
        }
      }

      // PROCESS PRINT (Same logic as create)
      let processedPrintInfo = report.inspectionDetails.printInfo; // Default to existing
      if (inspectionDetails.printInfo !== undefined) {
        if (inspectionDetails.printInfo === null) {
          processedPrintInfo = null;
        } else {
          processedPrintInfo = {
            remarks: inspectionDetails.printInfo.remarks || "",
            machineType: {
              value: inspectionDetails.printInfo.machineType?.value || "Auto",
              enabled: inspectionDetails.printInfo.machineType?.enabled ?? true,
            },
            speed: {
              value: parseFloatDefault(
                inspectionDetails.printInfo.speed?.value,
              ),
              enabled: inspectionDetails.printInfo.speed?.enabled ?? true,
            },
            pressure: {
              value: parseFloatDefault(
                inspectionDetails.printInfo.pressure?.value,
              ),
              enabled: inspectionDetails.printInfo.pressure?.enabled ?? true,
            },
          };
        }
      }

      report.inspectionDetails = {
        ...report.inspectionDetails,
        ...inspectionDetails,
        inspectedQty:
          inspectionDetails.inspectedQty !== undefined
            ? parseNullableInt(inspectionDetails.inspectedQty)
            : report.inspectionDetails?.inspectedQty,
        cartonQty:
          inspectionDetails.cartonQty !== undefined
            ? parseNullableInt(inspectionDetails.cartonQty)
            : report.inspectionDetails?.cartonQty,
        aqlConfig: processedAqlConfig,
        embInfo: processedEmbInfo,
        printInfo: processedPrintInfo,
      };

      if (inspectionDetails.measurement)
        report.measurementMethod = inspectionDetails.measurement;
      if (inspectionDetails.method)
        report.inspectionMethod = inspectionDetails.method;

      hasChanges = true;
      updatedSections.push("inspectionDetails");
    } else {
      skippedSections.push("inspectionDetails");
    }

    // ============================================================
    // SECTION 2: Header Data
    // ============================================================
    if (shouldProcessSection("headerData", headerData)) {
      const processedHeaderData = headerData.map((section) => {
        const processedImages = (section.images || [])
          .map((img, idx) => {
            let finalUrl = img.imageURL;

            // ONLY save to disk if new base64 data exists
            if (img.imgSrc && img.imgSrc.startsWith("data:image")) {
              const savedPath = saveBase64Image(
                img.imgSrc,
                reportId,
                section.headerId,
                idx,
              );
              if (savedPath) finalUrl = savedPath;
            }

            if (!finalUrl) return null;

            return {
              imageId:
                img.id ||
                img.imageId ||
                `${section.headerId}_${idx}_${Date.now()}`,
              imageURL: finalUrl,
            };
          })
          .filter(Boolean);

        return {
          headerId: section.headerId,
          name: section.name,
          selectedOption: section.selectedOption,
          remarks: section.remarks,
          images: processedImages,
        };
      });

      report.headerData = processedHeaderData;
      hasChanges = true;
      updatedSections.push("headerData");
    } else {
      skippedSections.push("headerData");
    }

    // ============================================================
    // SECTION 3: Photo Data
    // ============================================================
    if (shouldProcessSection("photoData", photoData)) {
      const processedPhotoData = photoData.map((section) => {
        const processedItems = (section.items || []).map((item) => {
          const processedImages = (item.images || [])
            .map((img, idx) => {
              let finalUrl = img.imageURL;

              if (img.imgSrc && img.imgSrc.startsWith("data:image")) {
                const savedPath = savePhotoBase64Image(
                  img.imgSrc,
                  reportId,
                  section.sectionId,
                  item.itemNo,
                  idx,
                );
                if (savedPath) finalUrl = savedPath;
              }

              if (!finalUrl) return null;

              return {
                imageId:
                  img.id ||
                  `${section.sectionId}_${item.itemNo}_${idx}_${Date.now()}`,
                imageURL: finalUrl,
              };
            })
            .filter(Boolean);

          return {
            itemNo: item.itemNo,
            itemName: item.itemName,
            remarks: item.remarks,
            images: processedImages,
          };
        });

        return {
          sectionId: section.sectionId,
          sectionName: section.sectionName,
          items: processedItems,
        };
      });

      report.photoData = processedPhotoData;
      hasChanges = true;
      updatedSections.push("photoData");
    } else {
      skippedSections.push("photoData");
    }

    // ============================================================
    // SECTION 4: Inspection Config
    // ============================================================
    if (shouldProcessSection("inspectionConfig", inspectionConfig)) {
      if (inspectionConfig.configGroups) {
        report.inspectionConfig = {
          reportName:
            inspectionConfig.reportName || report.inspectionConfig?.reportName,
          inspectionMethod:
            inspectionConfig.inspectionMethod ||
            report.inspectionConfig?.inspectionMethod,
          sampleSize: inspectionConfig.sampleSize || 0,
          configGroups: inspectionConfig.configGroups,
          updatedAt: new Date(),
        };
        report.markModified("inspectionConfig");
        hasChanges = true;
        updatedSections.push("inspectionConfig");
      }
    } else {
      skippedSections.push("inspectionConfig");
    }

    // ============================================================
    // SECTION 5: Measurement Data
    // ============================================================
    if (shouldProcessSection("measurementData", measurementData)) {
      const processedMeasurementData = measurementData.map((item) => {
        let processedManualData = null;

        if (item.manualData) {
          const processedImages = (item.manualData.images || [])
            .map((img, idx) => {
              let finalUrl = img.imageURL;
              if (img.imgSrc && img.imgSrc.startsWith("data:image")) {
                const savedPath = saveMeasManualBase64Image(
                  img.imgSrc,
                  reportId,
                  item.groupId,
                  idx,
                );
                if (savedPath) finalUrl = savedPath;
              }
              if (!finalUrl) return null;
              return {
                imageId:
                  img.id ||
                  img.imageId ||
                  `mm_${item.groupId}_${idx}_${Date.now()}`,
                imageURL: finalUrl,
                remark: img.remark || "",
              };
            })
            .filter(Boolean);

          processedManualData = {
            remarks: item.manualData.remarks || "",
            status: item.manualData.status || "Pass",
            images: processedImages,
          };
        }

        const cleanAllEnabled = sanitizeNumberArray(item.allEnabledPcs);
        const cleanCriticalEnabled = sanitizeNumberArray(
          item.criticalEnabledPcs,
        );

        return {
          ...item,
          allEnabledPcs: cleanAllEnabled,
          criticalEnabledPcs: cleanCriticalEnabled,
          manualData: processedManualData,
        };
      });

      report.measurementData = processedMeasurementData;
      hasChanges = true;
      updatedSections.push("measurementData");
    } else {
      skippedSections.push("measurementData");
    }

    // ============================================================
    // SECTION 6A: Defect Data
    // ============================================================
    if (shouldProcessSection("defectData", defectData)) {
      const processedDefectData = defectData.map((defect) => {
        const defectCode = defect.defectCode || "unknown";

        if (defect.isNoLocation) {
          const processedImages = (defect.images || [])
            .map((img, imgIdx) =>
              // FIX: Removed uploadDirDefect argument to match processImageObject definition
              processImageObject(
                img,
                `def_noloc_${reportId}_${defectCode}`,
                imgIdx,
              ),
            )
            .filter(Boolean);

          return { ...defect, locations: [], images: processedImages };
        } else {
          const processedLocations = (defect.locations || []).map((loc) =>
            processDefectLocation(loc, reportId, defectCode),
          );

          const totalQty = processedLocations.reduce(
            (sum, loc) => sum + (loc.positions?.length || loc.qty || 0),
            0,
          );

          return {
            ...defect,
            qty: totalQty || defect.qty || 1,
            locations: processedLocations,
            images: [],
          };
        }
      });

      report.defectData = processedDefectData;
      hasChanges = true;
      updatedSections.push("defectData");
    } else {
      skippedSections.push("defectData");
    }

    // ============================================================
    // SECTION 6B: Defect Manual Data
    // ============================================================
    if (shouldProcessSection("defectManualData", defectManualData)) {
      const processedManualData = defectManualData.map((manualItem) => {
        const groupId = manualItem.groupId || 0;
        const processedImages = (manualItem.images || [])
          .map((img, idx) => {
            // Removed uploadDirDefectManual argument
            const processed = processImageObject(
              img,
              `def_man_${reportId}_${groupId}`,
              idx,
            );
            if (processed) processed.remark = (img.remark || "").slice(0, 100);
            return processed;
          })
          .filter(Boolean);

        return { ...manualItem, images: processedImages };
      });

      report.defectManualData = processedManualData;
      hasChanges = true;
      updatedSections.push("defectManualData");
    } else {
      skippedSections.push("defectManualData");
    }

    // ============================================================
    // SECTION 6C: PP Sheet Data
    // ============================================================
    if (shouldProcessSection("ppSheetData", ppSheetData)) {
      const processedImages = (ppSheetData.images || [])
        .map((img, idx) => {
          let finalUrl = img.imageURL;
          if (img.imgSrc && img.imgSrc.startsWith("data:image")) {
            const savedPath = savePPSheetBase64Image(img.imgSrc, reportId, idx);
            if (savedPath) finalUrl = savedPath;
          }
          if (!finalUrl) return null;
          return {
            imageId: img.id || `pp_${idx}_${Date.now()}`,
            imageURL: finalUrl,
          };
        })
        .filter(Boolean);

      report.ppSheetData = {
        ...ppSheetData,
        images: processedImages,
        timestamp: new Date(),
      };

      hasChanges = true;
      updatedSections.push("ppSheetData");
    } else {
      skippedSections.push("ppSheetData");
    }

    // ============================================================
    // FINALIZATION
    // ============================================================

    //const wasAlreadyCompleted = report.status === "completed";
    report.status = "completed";

    if (hasChanges) {
      // HANDLE RESUBMISSION HISTORY <<<
      if (wasAlreadyCompleted) {
        // Calculate the next number (Length + 1)
        const currentCount = report.resubmissionHistory
          ? report.resubmissionHistory.length
          : 0;
        const nextNo = currentCount + 1;

        // Push new entry
        report.resubmissionHistory.push({
          resubmissionNo: nextNo,
          resubmissionDate: new Date(),
        });
      }

      // Save the document with all changes
      await report.save();

      return res.status(200).json({
        success: true,
        message: wasAlreadyCompleted
          ? `Resubmission #${
              report.resubmissionHistory.length
            } Successful! Updated: ${updatedSections.join(", ")}`
          : `Report submitted successfully! Updated: ${updatedSections.join(
              ", ",
            )}`,
        hasChanges: true,
        isResubmission: wasAlreadyCompleted,
        updatedSections: updatedSections,
        skippedSections: skippedSections,
        data: {
          reportId: report.reportId,
          status: report.status,
          updatedAt: report.updatedAt,
          resubmissionHistory: report.resubmissionHistory,
        },
      });
    } else {
      // No section changes - just update status if needed
      if (!wasAlreadyCompleted) {
        await FincheckInspectionReports.updateOne(
          { reportId: parseInt(reportId) },
          { $set: { status: "completed" } },
        );
      }

      return res.status(200).json({
        success: true,
        message: wasAlreadyCompleted
          ? "Report already completed. No changes needed."
          : "Report finalized successfully. All sections were already saved.",
        hasChanges: false,
        updatedSections: [],
        skippedSections: skippedSections,
        data: {
          reportId: report.reportId,
          status: "completed",
        },
      });
    }
  } catch (error) {
    console.error("Error submitting full report:", error);
    return res.status(500).json({
      success: false,
      message: "Submission failed due to server error.",
      error: error.message,
    });
  }
};

// ============================================================
// Search Previous Reports (for QR Tab)
// ============================================================
export const searchPreviousReports = async (req, res) => {
  try {
    const { startDate, endDate, orderNo, reportType, empId } = req.query;

    let query = {
      // Default: exclude draft/cancelled if needed, or show all
      status: { $ne: "cancelled" },
    };

    // 1. Date Filter (Default to today logic handled in frontend, but backend enforces range)
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      query.inspectionDate = { $gte: start, $lte: end };
    }

    // 2. Emp ID Filter
    if (empId) {
      query.empId = empId;
    }

    // 3. Report Type Filter
    if (reportType && reportType !== "All") {
      query.reportType = reportType;
    }

    // 4. Order No Filter (Search inside array or string)
    if (orderNo) {
      query.$or = [
        { orderNosString: { $regex: orderNo, $options: "i" } },
        { orderNos: { $in: [new RegExp(orderNo, "i")] } },
      ];
    }

    // Fetch Results
    // We select specific fields for the table + QR generation
    const reports = await FincheckInspectionReports.find(query)
      .select({
        reportId: 1,
        inspectionDate: 1,
        empId: 1,
        reportType: 1,
        orderNosString: 1,
        orderNos: 1,
        inspectionType: 1,
      })
      .sort({ inspectionDate: -1, createdAt: -1 }) // Newest first
      .lean();

    return res.status(200).json({
      success: true,
      data: reports,
    });
  } catch (error) {
    console.error("Error searching previous reports:", error);
    return res.status(500).json({
      success: false,
      message: "Server Error",
      error: error.message,
    });
  }
};
