import { DtOrder } from "../MongoDB/dbConnectionController.js";
import { getBuyerFromMoNumber } from "../../helpers/helperFunctions.js";

const processSpecs = (specArray, allSizes) => {
  if (!specArray || specArray.length === 0) {
    return {};
  }

  const groupedSpecs = {};

  specArray.forEach((spec) => {
    const groupKey = spec.kValue === "NA" ? "main" : spec.kValue;

    if (!groupedSpecs[groupKey]) {
      groupedSpecs[groupKey] = [];
    }

    // Create a map of size to value for quick lookups
    const valuesMap = new Map();
    if (spec.Specs && Array.isArray(spec.Specs)) {
      spec.Specs.forEach((s) => {
        if (s.size && s.decimal !== null && s.decimal !== undefined) {
          valuesMap.set(s.size, s.decimal);
        }
      });
    }

    // Use Chinese name if English name is empty
    const pointName =
      spec.MeasurementPointEngName && spec.MeasurementPointEngName.trim() !== ""
        ? spec.MeasurementPointEngName
        : spec.MeasurementPointChiName || "";

    groupedSpecs[groupKey].push({
      point: pointName,
      pointChi: spec.MeasurementPointChiName || "",
      pointEng: spec.MeasurementPointEngName || "",
      seq: spec.seq || spec.no || 0,
      values: allSizes.map((size) => {
        const value = valuesMap.get(size);
        return value !== undefined ? value : "N/A";
      }),
      tolerancePlus: spec.TolPlus ? spec.TolPlus.decimal : 0,
      toleranceMinus: spec.TolMinus ? spec.TolMinus.decimal : 0,
    });
  });

  return groupedSpecs;
};

export const getMatchingStyleNos = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== "string") {
      return res.status(200).json([]);
    }

    const escapedQuery = query.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const searchRegex = new RegExp(escapedQuery, "i");

    const results = await DtOrder.aggregate([
      { $match: { Order_No: searchRegex } },
      { $group: { _id: "$Order_No" } },
      { $sort: { _id: 1 } },
      { $limit: 15 },
      { $project: { _id: 0, styleNo: "$_id" } },
    ]);

    const styleNos = results.map((r) => r.styleNo);

    res.status(200).json(styleNos);
  } catch (error) {
    console.error("Error fetching matching style numbers:", error);
    res.status(500).json({
      message:
        "An internal server error occurred while fetching style numbers.",
      error: error.message,
    });
  }
};

export const getMeasurementDataByStyle = async (req, res) => {
  try {
    const { styleNo } = req.params;

    if (!styleNo) {
      return res.status(400).json({ message: "Style No is required." });
    }

    const order = await DtOrder.findOne({ Order_No: styleNo }).lean();

    if (!order) {
      return res
        .status(404)
        .json({ message: `No order found for Style No: ${styleNo}` });
    }

    // Get sizes from SizeSpec only (in correct order)
    const getSizesFromSizeSpec = (sizeSpecs) => {
      const sizeOrder = [];
      const sizeOrderSet = new Set();

      if (sizeSpecs && Array.isArray(sizeSpecs) && sizeSpecs.length > 0) {
        const firstSizeSpec = sizeSpecs[0];
        if (firstSizeSpec.Specs && Array.isArray(firstSizeSpec.Specs)) {
          firstSizeSpec.Specs.forEach((spec) => {
            Object.keys(spec).forEach((size) => {
              if (
                size &&
                size.trim() !== "" &&
                !sizeOrderSet.has(size.trim())
              ) {
                sizeOrder.push(size.trim());
                sizeOrderSet.add(size.trim());
              }
            });
          });
        }
      }

      return sizeOrder;
    };

    const allSizes = getSizesFromSizeSpec(order.SizeSpec);

    if (allSizes.length === 0) {
      return res.status(404).json({
        message: `No size specifications found for Style No: ${styleNo}`,
      });
    }

    const beforeWashData = processSpecs(order.BeforeWashSpecs, allSizes);
    const afterWashData = processSpecs(order.AfterWashSpecs, allSizes);

    const responseData = {
      styleNo: order.Order_No,
      customer: getBuyerFromMoNumber(styleNo),
      custStyle: order.CustStyle || "",
      totalQty: order.TotalQty || "",
      sizes: allSizes,
      measurements: {
        beforeWash: beforeWashData,
        afterWash: afterWashData,
      },
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching measurement data:", error);
    res.status(500).json({
      message:
        "An internal server error occurred while fetching measurement data.",
      error: error.message,
    });
  }
};

export const getMeasurementDataByStyleV2 = async (req, res) => {
  try {
    const { styleNo } = req.params;
    const { washType } = req.query;

    if (!styleNo) {
      return res.status(400).json({ message: "Style No is required." });
    }
    if (!washType || !["beforeWash", "afterWash"].includes(washType)) {
      return res.status(400).json({
        message: "Valid washType (beforeWash or afterWash) is required.",
      });
    }

    const order = await DtOrder.findOne({ Order_No: styleNo }).lean();
    if (!order) {
      return res
        .status(404)
        .json({ message: `No order found for Style No: ${styleNo}` });
    }

    // Get sizes from SizeSpec (fallback method)
    const getSizesFromSizeSpec = (sizeSpecs) => {
      const sizeOrder = [];
      const sizeOrderSet = new Set();

      if (sizeSpecs && Array.isArray(sizeSpecs) && sizeSpecs.length > 0) {
        const firstSizeSpec = sizeSpecs[0];
        if (firstSizeSpec.Specs && Array.isArray(firstSizeSpec.Specs)) {
          firstSizeSpec.Specs.forEach((spec) => {
            Object.keys(spec).forEach((size) => {
              if (
                size &&
                size.trim() !== "" &&
                !sizeOrderSet.has(size.trim())
              ) {
                sizeOrder.push(size.trim());
                sizeOrderSet.add(size.trim());
              }
            });
          });
        }
      }

      return sizeOrder;
    };

    // Get sizes from BeforeWashSpecs or AfterWashSpecs
    const getSizesFromWashSpecs = (washSpecs) => {
      const sizeOrder = [];
      const sizeOrderSet = new Set();

      if (washSpecs && Array.isArray(washSpecs) && washSpecs.length > 0) {
        const firstSpecWithSizes = washSpecs.find(
          (spec) =>
            spec.Specs && Array.isArray(spec.Specs) && spec.Specs.length > 0,
        );

        if (firstSpecWithSizes) {
          firstSpecWithSizes.Specs.forEach((spec) => {
            if (
              spec.size &&
              spec.size.trim() !== "" &&
              !sizeOrderSet.has(spec.size.trim())
            ) {
              sizeOrder.push(spec.size.trim());
              sizeOrderSet.add(spec.size.trim());
            }
          });
        }
      }

      return sizeOrder;
    };

    let allSizes = [];

    if (washType === "beforeWash") {
      allSizes = getSizesFromWashSpecs(order.BeforeWashSpecs);
      if (allSizes.length === 0) {
        allSizes = getSizesFromSizeSpec(order.SizeSpec);
      }
    } else if (washType === "afterWash") {
      allSizes = getSizesFromWashSpecs(order.AfterWashSpecs);
      if (allSizes.length === 0) {
        allSizes = getSizesFromSizeSpec(order.SizeSpec);
      }
    }

    if (allSizes.length === 0) {
      return res.status(404).json({
        message: `No size specifications found for Style No: ${styleNo}`,
      });
    }

    let measurementData = {};
    if (washType === "beforeWash") {
      measurementData = {
        beforeWash: processSpecs(order.BeforeWashSpecs, allSizes),
      };
    } else if (washType === "afterWash") {
      if (order.AfterWashSpecs && order.AfterWashSpecs.length > 0) {
        measurementData = {
          afterWash: processSpecs(order.AfterWashSpecs, allSizes),
        };
      } else {
        measurementData = {
          afterWash: processSizeSpecs(order.SizeSpec, allSizes),
        };
      }
    }

    const responseData = {
      styleNo: order.Order_No,
      customer: getBuyerFromMoNumber(styleNo),
      custStyle: order.CustStyle || "",
      totalQty: order.TotalQty || "",
      sizes: allSizes,
      measurements: measurementData,
    };

    res.status(200).json(responseData);
  } catch (error) {
    console.error("Error fetching measurement data:", error);
    res.status(500).json({
      message:
        "An internal server error occurred while fetching measurement data.",
      error: error.message,
    });
  }
};

// Process SizeSpec data (fallback for AfterWash when no AfterWashSpecs exist)
const processSizeSpecs = (sizeSpecArray, allSizes) => {
  if (!sizeSpecArray || sizeSpecArray.length === 0) {
    return {};
  }

  const groupedSpecs = {};

  sizeSpecArray.forEach((sizeSpec) => {
    const groupKey = "main";

    if (!groupedSpecs[groupKey]) {
      groupedSpecs[groupKey] = [];
    }

    const valuesMap = new Map();
    if (sizeSpec.Specs && Array.isArray(sizeSpec.Specs)) {
      sizeSpec.Specs.forEach((spec) => {
        Object.keys(spec).forEach((size) => {
          if (
            spec[size] &&
            spec[size].decimal !== null &&
            spec[size].decimal !== undefined
          ) {
            valuesMap.set(size, spec[size].decimal);
          }
        });
      });
    }

    // Use Chinese name if English name is empty
    const pointName =
      sizeSpec.EnglishRemark && sizeSpec.EnglishRemark.trim() !== ""
        ? sizeSpec.EnglishRemark
        : sizeSpec.ChineseName || `Point ${sizeSpec.Seq}`;

    groupedSpecs[groupKey].push({
      point: pointName,
      pointChi: sizeSpec.ChineseName || "",
      pointEng: sizeSpec.EnglishRemark || "",
      seq: sizeSpec.Seq || 0,
      values: allSizes.map((size) => {
        const value = valuesMap.get(size);
        return value !== undefined ? value : "N/A";
      }),
      tolerancePlus: sizeSpec.TolerancePlus
        ? sizeSpec.TolerancePlus.decimal
        : 0,
      toleranceMinus: sizeSpec.ToleranceMinus
        ? sizeSpec.ToleranceMinus.decimal
        : 0,
    });
  });

  return groupedSpecs;
};
