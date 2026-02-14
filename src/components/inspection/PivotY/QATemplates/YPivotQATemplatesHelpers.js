/**
 * Convert decimal to fraction string for display
 * @param {number} value - The decimal value to convert
 * @returns {string} - The fraction string representation
 */
export const decimalToFraction = (value) => {
  if (value === null || value === undefined || isNaN(value)) return "0";
  if (value === 0) return "0";

  const sign = value < 0 ? "-" : "+";
  const absValue = Math.abs(value);
  const whole = Math.floor(absValue);
  const decimal = absValue - whole;

  if (decimal < 0.001) return `${sign}${whole || 0}`;

  // Common fractions mapping (1/16th increments)
  const fractions = [
    { fraction: "1/16", value: 1 / 16 },
    { fraction: "1/8", value: 1 / 8 },
    { fraction: "3/16", value: 3 / 16 },
    { fraction: "1/4", value: 1 / 4 },
    { fraction: "5/16", value: 5 / 16 },
    { fraction: "3/8", value: 3 / 8 },
    { fraction: "7/16", value: 7 / 16 },
    { fraction: "1/2", value: 1 / 2 },
    { fraction: "9/16", value: 9 / 16 },
    { fraction: "5/8", value: 5 / 8 },
    { fraction: "11/16", value: 11 / 16 },
    { fraction: "3/4", value: 3 / 4 },
    { fraction: "13/16", value: 13 / 16 },
    { fraction: "7/8", value: 7 / 8 },
    { fraction: "15/16", value: 15 / 16 },
    { fraction: "1", value: 1 }
  ];

  const matchedFraction = fractions.find(
    (f) => Math.abs(f.value - decimal) < 0.01
  )?.fraction;

  if (!matchedFraction) return `${sign}${absValue.toFixed(3)}`;

  if (matchedFraction === "1") {
    return `${sign}${whole + 1}`;
  }

  const [numerator, denominator] = matchedFraction.split("/").map(Number);
  return whole > 0
    ? `${sign}${whole} ${numerator}/${denominator}`
    : `${sign}${numerator}/${denominator}`;
};

/**
 * Convert fraction string to decimal
 * @param {string} fractionStr - The fraction string to convert
 * @returns {number} - The decimal value
 */
export const fractionStringToDecimal = (fractionStr) => {
  if (!fractionStr || fractionStr === "0" || fractionStr === "-0") return 0;

  let str = String(fractionStr).trim();
  let sign = 1;

  // Handle sign
  if (str.startsWith("-")) {
    sign = -1;
    str = str.substring(1).trim();
  } else if (str.startsWith("+")) {
    sign = 1;
    str = str.substring(1).trim();
  }

  // Normalize fraction slash
  str = str.replace(/⁄/g, "/").replace(/\s+/g, " ");

  // Check for mixed fraction (e.g., "1 1/2")
  if (str.includes(" ") && str.includes("/")) {
    const parts = str.split(" ");
    const whole = parseFloat(parts[0]) || 0;
    const fracParts = parts[1].split("/");
    const num = parseFloat(fracParts[0]) || 0;
    const denom = parseFloat(fracParts[1]) || 1;
    return sign * (whole + num / denom);
  }

  // Simple fraction (e.g., "1/2")
  if (str.includes("/")) {
    const fracParts = str.split("/");
    const num = parseFloat(fracParts[0]) || 0;
    const denom = parseFloat(fracParts[1]) || 1;
    return sign * (num / denom);
  }

  // Plain number
  return sign * (parseFloat(str) || 0);
};

/**
 * Format tolerance value for display (fix -0 issue, use decimal values)
 * @param {object} tolObj - The tolerance object with fraction and decimal properties
 * @param {boolean} isNegative - Whether this is a negative tolerance
 * @returns {string} - The formatted tolerance display string
 */
export const formatToleranceDisplay = (tolObj, isNegative = false) => {
  if (!tolObj) return "0";

  const decimal = tolObj.decimal;

  // Handle null, undefined, -0, or 0
  if (
    decimal === null ||
    decimal === undefined ||
    decimal === 0 ||
    Object.is(decimal, -0)
  ) {
    return "0";
  }

  // Use absolute value for display
  const absDecimal = Math.abs(decimal);

  // Common fractions mapping
  const fractions = [
    { fraction: "1/16", value: 1 / 16 },
    { fraction: "1/8", value: 1 / 8 },
    { fraction: "3/16", value: 3 / 16 },
    { fraction: "1/4", value: 1 / 4 },
    { fraction: "5/16", value: 5 / 16 },
    { fraction: "3/8", value: 3 / 8 },
    { fraction: "7/16", value: 7 / 16 },
    { fraction: "1/2", value: 1 / 2 },
    { fraction: "9/16", value: 9 / 16 },
    { fraction: "5/8", value: 5 / 8 },
    { fraction: "11/16", value: 11 / 16 },
    { fraction: "3/4", value: 3 / 4 },
    { fraction: "13/16", value: 13 / 16 },
    { fraction: "7/8", value: 7 / 8 },
    { fraction: "15/16", value: 15 / 16 },
    { fraction: "1", value: 1 }
  ];

  const whole = Math.floor(absDecimal);
  const decimalPart = absDecimal - whole;

  // If no decimal part
  if (decimalPart < 0.001) {
    return whole.toString();
  }

  const matchedFraction = fractions.find(
    (f) => Math.abs(f.value - decimalPart) < 0.01
  )?.fraction;

  if (!matchedFraction) {
    return absDecimal.toFixed(3);
  }

  if (matchedFraction === "1") {
    return (whole + 1).toString();
  }

  return whole > 0 ? `${whole} ${matchedFraction}` : matchedFraction;
};

/**
 * Check if a measurement value is within tolerance
 * @param {object} spec - The spec object containing tolerance and spec values
 * @param {number} value - The measured decimal value
 * @param {string} selectedSize - The selected size to find the spec value
 * @returns {object} - Object containing tolerance check results
 */
export const checkTolerance = (spec, value, selectedSize) => {
  // Default 0 values are considered "pass" but marked as default
  if (value === 0 || value === null || value === undefined) {
    return {
      isWithin: true,
      isDefault: true,
      isPositiveOut: false,
      isNegativeOut: false,
      deviation: 0
    };
  }

  // Get the base spec value for the selected size
  const baseValObj = spec.Specs?.find((s) => s.size === selectedSize);
  const baseVal = baseValObj?.decimal || 0;

  // Get tolerance values (use absolute values)
  const tolMinus = Math.abs(spec.TolMinus?.decimal || 0);
  const tolPlus = Math.abs(spec.TolPlus?.decimal || 0);

  // Calculate acceptable range
  // User input is a DEVIATION from spec, so:
  // - Positive deviation means measurement is LARGER than spec
  // - Negative deviation means measurement is SMALLER than spec

  // The measured value should be: baseVal + value (where value is the deviation)
  // It should be within: baseVal - tolMinus to baseVal + tolPlus

  // Simplified: the deviation (value) should be between -tolMinus and +tolPlus
  const min = -tolMinus;
  const max = tolPlus;

  const isWithin = value >= min - 0.0001 && value <= max + 0.0001;
  const isPositiveOut = !isWithin && value > max;
  const isNegativeOut = !isWithin && value < min;

  return {
    isWithin,
    isDefault: false,
    isPositiveOut,
    isNegativeOut,
    deviation: value,
    min,
    max
  };
};

/**
 * Calculate measurement statistics for results display
 * @param {object} measurementData - The saved measurement data object
 * @param {array} specsData - Array of spec objects
 * @param {string} selectedSize - The selected size
 * @returns {object} - Object containing all calculated statistics
 */
export const calculateMeasurementStats = (
  measurementData,
  specsData,
  selectedSize
) => {
  const { measurements, qty, selectedPcs } = measurementData;

  let totalPoints = 0;
  let totalPassPoints = 0;
  let totalFailPoints = 0;
  let totalPositiveTolPoints = 0;
  let totalNegativeTolPoints = 0;

  const pcsResults = {};

  // Determine active pcs indices
  const activePcs =
    selectedPcs === "ALL"
      ? Array.from({ length: qty }, (_, i) => i)
      : Array.isArray(selectedPcs)
      ? selectedPcs
      : [];

  // Initialize pcs results
  activePcs.forEach((pcsIndex) => {
    pcsResults[pcsIndex] = { pass: 0, fail: 0, total: 0 };
  });

  // Filter specs based on K value if applicable
  let filteredSpecs = specsData;
  if (measurementData.kValue && measurementData.measType === "Before") {
    filteredSpecs = specsData.filter(
      (s) => s.kValue === measurementData.kValue || s.kValue === "NA"
    );
  }

  // Calculate stats for each spec and each pcs
  filteredSpecs.forEach((spec) => {
    const specId = spec.id;

    activePcs.forEach((pcsIndex) => {
      const measurement = measurements?.[specId]?.[pcsIndex];

      if (measurement !== undefined) {
        totalPoints++;
        pcsResults[pcsIndex].total++;

        const toleranceResult = checkTolerance(
          spec,
          measurement.decimal,
          selectedSize
        );

        if (toleranceResult.isDefault) {
          // Default 0 values are considered pass
          totalPassPoints++;
          pcsResults[pcsIndex].pass++;
        } else if (toleranceResult.isWithin) {
          totalPassPoints++;
          pcsResults[pcsIndex].pass++;
        } else {
          totalFailPoints++;
          pcsResults[pcsIndex].fail++;

          if (toleranceResult.isPositiveOut) {
            totalPositiveTolPoints++;
          } else if (toleranceResult.isNegativeOut) {
            totalNegativeTolPoints++;
          }
        }
      }
    });
  });

  // Calculate OK/Fail pcs
  let totalOkPcs = 0;
  let totalFailPcs = 0;

  Object.values(pcsResults).forEach((pcs) => {
    if (pcs.total > 0) {
      if (pcs.fail === 0) {
        totalOkPcs++;
      } else {
        totalFailPcs++;
      }
    }
  });

  return {
    totalPoints,
    totalPassPoints,
    totalFailPoints,
    totalPositiveTolPoints,
    totalNegativeTolPoints,
    pcsCount: activePcs.length,
    totalOkPcs,
    totalFailPcs,
    pcsResults
  };
};

/**
 * Format a measurement value for display
 * @param {object} measurement - Object with decimal and fraction properties
 * @returns {string} - Formatted display string
 */
export const formatMeasurementDisplay = (measurement) => {
  if (!measurement) return "0";
  if (measurement.fraction) return measurement.fraction;
  if (measurement.decimal !== undefined) {
    return decimalToFraction(measurement.decimal);
  }
  return "0";
};

/**
 * Get color class based on tolerance result
 * @param {object} toleranceResult - The result from checkTolerance function
 * @param {boolean} isActive - Whether the cell is active/editable
 * @returns {object} - Object with bgClass and textClass
 */
export const getToleranceColorClasses = (toleranceResult, isActive = true) => {
  if (!isActive) {
    return {
      bgClass: "bg-gray-100 dark:bg-gray-800",
      textClass: "text-gray-400"
    };
  }

  if (toleranceResult.isDefault) {
    return {
      bgClass: "bg-gray-50 dark:bg-gray-700",
      textClass: "text-gray-600 dark:text-gray-400"
    };
  }

  if (toleranceResult.isWithin) {
    return {
      bgClass: "bg-green-100 dark:bg-green-900/40",
      textClass: "text-green-700 dark:text-green-300"
    };
  }

  return {
    bgClass: "bg-red-100 dark:bg-red-900/40",
    textClass: "text-red-700 dark:text-red-300"
  };
};
