import {
  QASectionsMeasurementSpecs,
  DtOrder,
} from "../../MongoDB/dbConnectionController.js";
import mongoose from "mongoose";

// =========================================================================
// HELPER: SANITIZERS & DECIMAL CALCULATORS
// =========================================================================

const sanitizeToleranceValue = (inputValue) => {
  let str = "";
  if (inputValue && typeof inputValue === "object") {
    str = inputValue.fraction || inputValue.raw || inputValue.value || "";
  } else {
    str = String(inputValue || "");
  }

  str = str.replace(/\u2044/g, "/").replace(/\\/g, "/");
  const cleanStr = str.replace(/\s+/g, "");

  let decimal = 0;

  if (!cleanStr) {
    return { fraction: "", decimal: 0 };
  }

  try {
    if (cleanStr.includes("/")) {
      const parts = cleanStr.split("/");
      if (parts.length === 2) {
        const numerator = parseFloat(parts[0]);
        const denominator = parseFloat(parts[1]);

        if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
          decimal = numerator / denominator;
        }
      }
    } else {
      decimal = parseFloat(cleanStr);
    }
  } catch (err) {
    console.warn(`Failed to parse decimal for tolerance value: ${str}`);
    decimal = 0;
  }

  if (isNaN(decimal)) decimal = 0;

  return {
    fraction: cleanStr,
    decimal: decimal,
  };
};

const sanitizeSpecValue = (inputValue) => {
  let str = "";
  if (inputValue && typeof inputValue === "object") {
    str = inputValue.fraction || inputValue.raw || inputValue.value || "";
  } else {
    str = String(inputValue || "");
  }

  str = str.replace(/\u2044/g, "/").replace(/\\/g, "/");
  const cleanStr = str.trim();

  let decimal = 0;

  if (!cleanStr) {
    return { fraction: "", decimal: 0 };
  }

  try {
    const mixedMatch = cleanStr.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);
    if (mixedMatch) {
      const whole = parseFloat(mixedMatch[1]);
      const numerator = parseFloat(mixedMatch[2]);
      const denominator = parseFloat(mixedMatch[3]);

      if (
        !isNaN(whole) &&
        !isNaN(numerator) &&
        !isNaN(denominator) &&
        denominator !== 0
      ) {
        const fractionPart = numerator / denominator;
        decimal = whole >= 0 ? whole + fractionPart : whole - fractionPart;
      }
    } else if (cleanStr.includes("/")) {
      const parts = cleanStr.split("/");
      if (parts.length === 2) {
        const numerator = parseFloat(parts[0]);
        const denominator = parseFloat(parts[1]);

        if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
          decimal = numerator / denominator;
        }
      }
    } else {
      decimal = parseFloat(cleanStr);
    }
  } catch (err) {
    console.warn(`Failed to parse decimal for spec value: ${str}`);
    decimal = 0;
  }

  if (isNaN(decimal)) decimal = 0;

  return {
    fraction: cleanStr,
    decimal: decimal,
  };
};

const fixToleranceFraction = (tolObj) => {
  if (!tolObj) {
    return { wasFixed: false, result: { fraction: "", decimal: 0 } };
  }

  let wasFixed = false;
  let fraction = "";

  if (typeof tolObj === "object") {
    fraction = tolObj.fraction || "";
  } else {
    fraction = String(tolObj || "");
  }

  let decimal = tolObj?.decimal;
  const originalFraction = fraction;
  const originalDecimal = decimal;

  fraction = fraction.replace(/\u2044/g, "/").replace(/\\/g, "/");

  const negBadPattern = /^-\s+(\d+\/\d+)$/;
  const negBadMatch = fraction.match(negBadPattern);
  if (negBadMatch) {
    fraction = "-" + negBadMatch[1];
  }

  const posBadPattern = /^\+\s+(\d+\/\d+)$/;
  const posBadMatch = fraction.match(posBadPattern);
  if (posBadMatch) {
    fraction = "+" + posBadMatch[1];
  }

  const negDecPattern = /^-\s+([\d.]+)$/;
  const negDecMatch = fraction.match(negDecPattern);
  if (negDecMatch) {
    fraction = "-" + negDecMatch[1];
  }

  const posDecPattern = /^\+\s+([\d.]+)$/;
  const posDecMatch = fraction.match(posDecPattern);
  if (posDecMatch) {
    fraction = "+" + posDecMatch[1];
  }

  if (fraction !== originalFraction) {
    wasFixed = true;
  }

  const needsDecimalCalc =
    decimal === null ||
    decimal === undefined ||
    (typeof decimal === "number" && isNaN(decimal));

  if (needsDecimalCalc && fraction) {
    const cleanStr = fraction.replace(/\s+/g, "");

    if (cleanStr.includes("/")) {
      const parts = cleanStr.split("/");
      if (parts.length === 2) {
        const numerator = parseFloat(parts[0]);
        const denominator = parseFloat(parts[1]);
        if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
          decimal = numerator / denominator;
          wasFixed = true;
        }
      }
    } else {
      const parsed = parseFloat(cleanStr);
      if (!isNaN(parsed)) {
        decimal = parsed;
        wasFixed = true;
      }
    }
  }

  if (decimal === null || decimal === undefined || isNaN(decimal)) {
    if (originalDecimal !== 0) {
      wasFixed = true;
    }
    decimal = 0;
  }

  return {
    wasFixed,
    result: {
      fraction: fraction,
      decimal: decimal,
    },
  };
};

// =========================================================================
// BEFORE WASH FUNCTIONS
// =========================================================================

export const getQASectionsMeasurementSpecs = async (req, res) => {
  const { moNo } = req.params;
  const cleanMoNo = moNo.trim();

  try {
    // 1. Check if record exists in QA Collection
    const existingRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") },
    });

    if (
      existingRecord &&
      existingRecord.AllBeforeWashSpecs &&
      existingRecord.AllBeforeWashSpecs.length > 0
    ) {
      return res.status(200).json({
        source: "qa_sections",
        data: {
          Order_No: existingRecord.Order_No,
          AllBeforeWashSpecs: existingRecord.AllBeforeWashSpecs,
          selectedBeforeWashSpecs: existingRecord.selectedBeforeWashSpecs || [],
          isSaveAllBeforeWashSpecs:
            existingRecord.isSaveAllBeforeWashSpecs || "No",
        },
      });
    }

    // 2. If not, fetch from Master Data (DtOrder)
    const dtOrderData = await DtOrder.findOne(
      { Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") } },
      { BeforeWashSpecs: 1, Order_No: 1, _id: 0 },
    ).lean();

    if (!dtOrderData) {
      return res.status(404).json({
        message: `Order No '${cleanMoNo}' not found in the database.`,
      });
    }

    if (
      !dtOrderData.BeforeWashSpecs ||
      dtOrderData.BeforeWashSpecs.length === 0
    ) {
      return res.status(404).json({
        message: "No 'Before Wash Specs' found in Master Data.",
      });
    }

    // 3. Process Data - Include 'seq'
    const processedSpecs = dtOrderData.BeforeWashSpecs.map((spec) => ({
      ...spec,
      id: new mongoose.Types.ObjectId().toString(), // Generate UI ID
      seq: spec.seq, // Explicitly ensure seq is copied
      TolMinus: sanitizeToleranceValue(spec.TolMinus),
      TolPlus: sanitizeToleranceValue(spec.TolPlus),
    }));

    return res.status(200).json({
      source: "dt_orders",
      data: {
        Order_No: dtOrderData.Order_No,
        AllBeforeWashSpecs: processedSpecs,
        selectedBeforeWashSpecs: [],
        isSaveAllBeforeWashSpecs: "No",
      },
    });
  } catch (error) {
    console.error("Error fetching Before Wash specs:", error);
    res.status(500).json({ error: error.message });
  }
};

export const saveQASectionsMeasurementSpecs = async (req, res) => {
  const { moNo, allSpecs, selectedSpecs, isSaveAll } = req.body;

  if (!moNo) {
    return res.status(400).json({ message: "MO Number is required." });
  }

  try {
    // Clean ONLY tolerance values, preserve 'seq' and 'Specs'
    const cleanedAllSpecs = allSpecs.map((spec) => ({
      ...spec,
      seq: spec.seq, // Ensure seq is saved
      TolMinus: sanitizeToleranceValue(spec.TolMinus),
      TolPlus: sanitizeToleranceValue(spec.TolPlus),
    }));

    const cleanedSelectedSpecs = selectedSpecs.map((spec) => ({
      ...spec,
      seq: spec.seq, // Ensure seq is saved
      TolMinus: sanitizeToleranceValue(spec.TolMinus),
      TolPlus: sanitizeToleranceValue(spec.TolPlus),
    }));

    const result = await QASectionsMeasurementSpecs.findOneAndUpdate(
      { Order_No: { $regex: new RegExp(`^${moNo.trim()}$`, "i") } },
      {
        $set: {
          Order_No: moNo.trim(),
          AllBeforeWashSpecs: cleanedAllSpecs,
          selectedBeforeWashSpecs: cleanedSelectedSpecs,
          isSaveAllBeforeWashSpecs: isSaveAll ? "Yes" : "No",
        },
        $currentDate: { updatedAt: true },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      message: "Before Wash specs saved successfully.",
      data: result,
      updatedAt: result.updatedAt,
    });
  } catch (error) {
    console.error("Error saving Before Wash specs:", error);
    res.status(500).json({ error: error.message });
  }
};

// =========================================================================
// AFTER WASH FUNCTIONS
// =========================================================================

export const getQASectionsMeasurementSpecsAW = async (req, res) => {
  const { moNo } = req.params;
  const cleanMoNo = moNo.trim();

  try {
    // 1. Check if record exists in QA Collection
    const existingRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") },
    });

    if (
      existingRecord &&
      existingRecord.AllAfterWashSpecs &&
      existingRecord.AllAfterWashSpecs.length > 0
    ) {
      return res.status(200).json({
        source: "qa_sections",
        data: {
          Order_No: existingRecord.Order_No,
          AllAfterWashSpecs: existingRecord.AllAfterWashSpecs,
          selectedAfterWashSpecs: existingRecord.selectedAfterWashSpecs || [],
        },
      });
    }

    // 2. Fetch from Master Data (DtOrder) - SPECIFICALLY AfterWashSpecs
    // NO FALLBACK TO SizeSpec anymore
    const dtOrderData = await DtOrder.findOne(
      { Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") } },
      { AfterWashSpecs: 1, Order_No: 1, _id: 0 },
    ).lean();

    if (!dtOrderData) {
      return res.status(404).json({
        message: `Order No '${cleanMoNo}' not found.`,
      });
    }

    if (
      !dtOrderData.AfterWashSpecs ||
      dtOrderData.AfterWashSpecs.length === 0
    ) {
      return res.status(404).json({
        message: "No 'After Wash Specs' found in Master Data.",
      });
    }

    // 3. Process Data - Include 'seq'
    const processedSpecs = dtOrderData.AfterWashSpecs.map((spec) => ({
      ...spec,
      id: new mongoose.Types.ObjectId().toString(), // Generate UI ID
      seq: spec.seq, // Explicitly ensure seq is copied
      TolMinus: sanitizeToleranceValue(spec.TolMinus),
      TolPlus: sanitizeToleranceValue(spec.TolPlus),
      // Clean specs values just in case
      Specs:
        spec.Specs && Array.isArray(spec.Specs)
          ? spec.Specs.map((s) => ({
              ...s,
              ...sanitizeSpecValue({ fraction: s.fraction }),
            }))
          : [],
    }));

    return res.status(200).json({
      source: "dt_orders",
      data: {
        Order_No: dtOrderData.Order_No,
        AllAfterWashSpecs: processedSpecs,
        selectedAfterWashSpecs: [],
      },
    });
  } catch (error) {
    console.error("Error fetching AW measurement specs:", error);
    res.status(500).json({ error: error.message });
  }
};

export const saveQASectionsMeasurementSpecsAW = async (req, res) => {
  const { moNo, allSpecs, selectedSpecs } = req.body;

  if (!moNo) {
    return res.status(400).json({ message: "MO Number is required." });
  }

  try {
    // Clean tolerance values and Specs values, preserve 'seq'
    const cleanedAllSpecs = allSpecs.map((spec) => {
      const cleanSpecsValues = spec.Specs.map((s) => ({
        ...s,
        ...sanitizeSpecValue({ fraction: s.fraction }),
      }));

      return {
        ...spec,
        seq: spec.seq, // Ensure seq is saved
        kValue: "NA",
        TolMinus: sanitizeToleranceValue(spec.TolMinus),
        TolPlus: sanitizeToleranceValue(spec.TolPlus),
        Specs: cleanSpecsValues,
      };
    });

    const cleanedSelectedSpecs = selectedSpecs.map((spec) => {
      const cleanSpecsValues = spec.Specs.map((s) => ({
        ...s,
        ...sanitizeSpecValue({ fraction: s.fraction }),
      }));

      return {
        ...spec,
        seq: spec.seq, // Ensure seq is saved
        kValue: "NA",
        TolMinus: sanitizeToleranceValue(spec.TolMinus),
        TolPlus: sanitizeToleranceValue(spec.TolPlus),
        Specs: cleanSpecsValues,
      };
    });

    const result = await QASectionsMeasurementSpecs.findOneAndUpdate(
      { Order_No: { $regex: new RegExp(`^${moNo.trim()}$`, "i") } },
      {
        $set: {
          Order_No: moNo.trim(),
          AllAfterWashSpecs: cleanedAllSpecs,
          selectedAfterWashSpecs: cleanedSelectedSpecs,
        },
        $currentDate: { updatedAt: true },
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      message: "After Wash specs saved successfully.",
      data: result,
      updatedAt: result.updatedAt,
    });
  } catch (error) {
    console.error("Error saving AW measurement specs:", error);
    res.status(500).json({ error: error.message });
  }
};

// =========================================================================
// FIX TOLERANCE VALUES - BULK UPDATE
// =========================================================================

export const fixAllToleranceValues = async (req, res) => {
  try {
    const allDocs = await QASectionsMeasurementSpecs.find({});

    let totalDocumentsChecked = allDocs.length;
    let totalDocumentsUpdated = 0;
    let totalTolerancesFixed = 0;
    const fixDetails = [];

    for (const doc of allDocs) {
      let docModified = false;
      let docFixCount = 0;

      const arrayFields = [
        "AllBeforeWashSpecs",
        "selectedBeforeWashSpecs",
        "AllAfterWashSpecs",
        "selectedAfterWashSpecs",
      ];

      for (const fieldName of arrayFields) {
        const arr = doc[fieldName];
        if (!Array.isArray(arr) || arr.length === 0) continue;

        for (let i = 0; i < arr.length; i++) {
          const item = arr[i];

          // Fix TolMinus
          if (item.TolMinus) {
            const fixedMinus = fixToleranceFraction(item.TolMinus);
            if (fixedMinus.wasFixed) {
              arr[i].TolMinus = fixedMinus.result;
              docModified = true;
              docFixCount++;
              totalTolerancesFixed++;
            }
          }

          // Fix TolPlus
          if (item.TolPlus) {
            const fixedPlus = fixToleranceFraction(item.TolPlus);
            if (fixedPlus.wasFixed) {
              arr[i].TolPlus = fixedPlus.result;
              docModified = true;
              docFixCount++;
              totalTolerancesFixed++;
            }
          }
        }

        if (docModified) {
          doc.markModified(fieldName);
        }
      }

      if (docModified) {
        await doc.save();
        totalDocumentsUpdated++;
        fixDetails.push({
          Order_No: doc.Order_No,
          fixesApplied: docFixCount,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Tolerance fix completed successfully.`,
      summary: {
        totalDocumentsChecked,
        totalDocumentsUpdated,
        totalTolerancesFixed,
      },
      details: fixDetails,
    });
  } catch (error) {
    console.error("Error fixing tolerance values:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const fixTolerancesByOrder = async (req, res) => {
  const { moNo } = req.params;

  if (!moNo) {
    return res.status(400).json({ message: "MO Number is required." });
  }

  try {
    const doc = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${moNo.trim()}$`, "i") },
    });

    if (!doc) {
      return res.status(404).json({
        message: `No record found for Order No: ${moNo}`,
      });
    }

    let docModified = false;
    let totalFixed = 0;

    const arrayFields = [
      "AllBeforeWashSpecs",
      "selectedBeforeWashSpecs",
      "AllAfterWashSpecs",
      "selectedAfterWashSpecs",
    ];

    for (const fieldName of arrayFields) {
      const arr = doc[fieldName];
      if (!Array.isArray(arr) || arr.length === 0) continue;

      for (let i = 0; i < arr.length; i++) {
        const item = arr[i];

        if (item.TolMinus) {
          const fixedMinus = fixToleranceFraction(item.TolMinus);
          if (fixedMinus.wasFixed) {
            arr[i].TolMinus = fixedMinus.result;
            docModified = true;
            totalFixed++;
          }
        }

        if (item.TolPlus) {
          const fixedPlus = fixToleranceFraction(item.TolPlus);
          if (fixedPlus.wasFixed) {
            arr[i].TolPlus = fixedPlus.result;
            docModified = true;
            totalFixed++;
          }
        }
      }

      if (docModified) {
        doc.markModified(fieldName);
      }
    }

    if (docModified) {
      await doc.save();
    }

    res.status(200).json({
      success: true,
      message: docModified
        ? `Fixed ${totalFixed} tolerance values for ${moNo}`
        : `No fixes needed for ${moNo}`,
      Order_No: doc.Order_No,
      tolerancesFixed: totalFixed,
    });
  } catch (error) {
    console.error("Error fixing tolerances for order:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

export const previewToleranceIssues = async (req, res) => {
  try {
    const allDocs = await QASectionsMeasurementSpecs.find({});

    const issues = [];

    for (const doc of allDocs) {
      const orderIssues = {
        Order_No: doc.Order_No,
        problems: [],
      };

      const arrayFields = [
        "AllBeforeWashSpecs",
        "selectedBeforeWashSpecs",
        "AllAfterWashSpecs",
        "selectedAfterWashSpecs",
      ];

      for (const fieldName of arrayFields) {
        const arr = doc[fieldName];
        if (!Array.isArray(arr) || arr.length === 0) continue;

        for (const item of arr) {
          if (item.TolMinus) {
            const fixed = fixToleranceFraction(item.TolMinus);
            if (fixed.wasFixed) {
              orderIssues.problems.push({
                field: fieldName,
                point: item.MeasurementPointEngName,
                type: "TolMinus",
                original: item.TolMinus,
                corrected: fixed.result,
              });
            }
          }

          if (item.TolPlus) {
            const fixed = fixToleranceFraction(item.TolPlus);
            if (fixed.wasFixed) {
              orderIssues.problems.push({
                field: fieldName,
                point: item.MeasurementPointEngName,
                type: "TolPlus",
                original: item.TolPlus,
                corrected: fixed.result,
              });
            }
          }
        }
      }

      if (orderIssues.problems.length > 0) {
        issues.push(orderIssues);
      }
    }

    res.status(200).json({
      success: true,
      totalDocumentsWithIssues: issues.length,
      totalProblems: issues.reduce((acc, i) => acc + i.problems.length, 0),
      issues,
    });
  } catch (error) {
    console.error("Error previewing tolerance issues:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// =========================================================================
// SYNC FUNCTION: APPLY BW SELECTION TO AW
// =========================================================================

export const syncBWSelectionToAW = async (req, res) => {
  const { moNo, selectedPointNames } = req.body; // Expecting array of point names (Eng or Chi)

  if (!moNo) {
    return res.status(400).json({ message: "MO Number is required." });
  }

  try {
    const cleanMoNo = moNo.trim();

    // 1. Find existing record
    let qaDoc = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") },
    });

    let allAWSpecs = [];

    // 2. Determine Source for AllAfterWashSpecs
    if (
      qaDoc &&
      qaDoc.AllAfterWashSpecs &&
      qaDoc.AllAfterWashSpecs.length > 0
    ) {
      allAWSpecs = qaDoc.AllAfterWashSpecs;
    } else {
      // Fetch from Master Data (DtOrder) if not exists in QA collection
      const dtOrderData = await DtOrder.findOne(
        { Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") } },
        { AfterWashSpecs: 1, Order_No: 1, _id: 0 },
      ).lean();

      if (!dtOrderData || !dtOrderData.AfterWashSpecs) {
        return res.status(404).json({
          message:
            "No After Wash Specs found in Master Data to apply selection to.",
        });
      }

      // Transform/Sanitize DtOrder Data (Reusing logic from getQASectionsMeasurementSpecsAW)
      allAWSpecs = dtOrderData.AfterWashSpecs.map((spec) => ({
        ...spec,
        id: new mongoose.Types.ObjectId().toString(),
        seq: spec.seq,
        kValue: "NA",
        TolMinus: sanitizeToleranceValue(spec.TolMinus),
        TolPlus: sanitizeToleranceValue(spec.TolPlus),
        Specs:
          spec.Specs && Array.isArray(spec.Specs)
            ? spec.Specs.map((s) => ({
                ...s,
                ...sanitizeSpecValue({ fraction: s.fraction }),
              }))
            : [],
      }));
    }

    // 3. Filter AW Specs based on BW Selection Names
    // Matches Eng name first, fallback to Chi name
    const selectedAWSpecs = allAWSpecs.filter((spec) => {
      const displayName =
        spec.MeasurementPointEngName || spec.MeasurementPointChiName;
      return selectedPointNames.includes(displayName);
    });

    // 4. Save Updates
    const result = await QASectionsMeasurementSpecs.findOneAndUpdate(
      { Order_No: { $regex: new RegExp(`^${cleanMoNo}$`, "i") } },
      {
        $set: {
          Order_No: cleanMoNo,
          AllAfterWashSpecs: allAWSpecs, // Ensure we save the full list if we fetched from DtOrder
          selectedAfterWashSpecs: selectedAWSpecs,
        },
        $currentDate: { updatedAt: true },
      },
      { new: true, upsert: true },
    );

    res.status(200).json({
      message: `Successfully applied selection to After Wash Specs. (${selectedAWSpecs.length} points matched)`,
      data: result,
    });
  } catch (error) {
    console.error("Error syncing BW to AW:", error);
    res.status(500).json({ error: error.message });
  }
};
