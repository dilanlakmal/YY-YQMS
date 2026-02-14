/**
 * Converts a string that may represent a whole number, a simple fraction, or a mixed fraction to a decimal.
 * @param {string | number} value - The input string or number.
 * @returns {{ raw: string | number, decimal: number | null }} An object with the original value and its decimal conversion.
 */
const fractionToDecimal = (value) => {
  const originalValue = value;

  if (value === null || value === undefined || String(value).trim() === "") {
    return { raw: originalValue, decimal: null };
  }

  // Normalize all possible fraction slashes and trim whitespace
  const strValue = String(value).trim().replace(/⁄/g, "/").replace(/\s+/g, " ");

  // Handle "0" as special case
  if (strValue === "0") {
    return { raw: "0", decimal: 0 };
  }

  let total = 0;

  try {
    // Check for mixed fraction (e.g., "23 3/8" or "-1 1/2")
    if (strValue.includes(" ") && strValue.includes("/")) {
      const parts = strValue.split(" ");
      const whole = parseFloat(parts[0]);
      const fractionParts = parts[1].split("/");
      const numerator = parseFloat(fractionParts[0]);
      const denominator = parseFloat(fractionParts[1]);

      if (
        isNaN(whole) ||
        isNaN(numerator) ||
        isNaN(denominator) ||
        denominator === 0
      ) {
        throw new Error("Invalid mixed fraction");
      }

      total = whole + (Math.sign(whole) || 1) * (numerator / denominator);
    }
    // Check for simple fraction (e.g., "1/2" or "-1/2")
    else if (strValue.includes("/")) {
      const fractionParts = strValue.split("/");
      const numerator = parseFloat(fractionParts[0]);
      const denominator = parseFloat(fractionParts[1]);

      if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
        throw new Error("Invalid simple fraction");
      }
      total = numerator / denominator;
    }
    // It's a regular number
    else {
      total = parseFloat(strValue);
    }

    const decimal = isNaN(total) ? null : parseFloat(total.toFixed(4));
    return { raw: strValue, decimal: decimal };
  } catch (e) {
    console.error(`Could not parse fraction: "${originalValue}"`, e);
    return { raw: originalValue, decimal: null };
  }
};

/**
 * Parses combined tolerance string (Tol+/-) into separate Tol- and Tol+ values.
 * Handles various formats:
 * - "±1/4" -> TolMinus: -1/4, TolPlus: +1/4
 * - "0 1/4" or "0\n1/4" -> TolMinus: 0, TolPlus: 1/4
 * - "-1/4 +1/2" -> TolMinus: -1/4, TolPlus: +1/2
 * - "-1/4~+1/4" -> TolMinus: -1/4, TolPlus: +1/4
 * - Single value like "0" or "1/4"
 * @param {string | number} tolValue - The tolerance cell value
 * @returns {{ tolMinus: object, tolPlus: object }}
 */
const parseTolerance = (tolValue) => {
  const defaultResult = {
    tolMinus: { raw: "", decimal: null },
    tolPlus: { raw: "", decimal: null },
  };

  if (tolValue === null || tolValue === undefined) {
    return defaultResult;
  }

  let strValue = String(tolValue).trim();
  if (strValue === "") {
    return defaultResult;
  }

  // Normalize special characters and whitespace
  strValue = strValue.replace(/⁄/g, "/").replace(/\s+/g, " ");

  // Handle ± format (e.g., "±1/4" or "± 1/4")
  if (strValue.includes("±")) {
    const numPart = strValue.replace("±", "").trim();
    if (numPart === "0") {
      return {
        tolMinus: { raw: "0", decimal: 0 },
        tolPlus: { raw: "0", decimal: 0 },
      };
    }
    const parsed = fractionToDecimal(numPart);
    const dec = parsed.decimal;
    return {
      tolMinus: {
        raw: `-${numPart}`,
        decimal: dec !== null ? -Math.abs(dec) : null,
      },
      tolPlus: {
        raw: `+${numPart}`,
        decimal: dec !== null ? Math.abs(dec) : null,
      },
    };
  }

  // Try to find two values - split by newline, ~, or space patterns
  let parts = [];

  // Try newline first
  if (strValue.includes("\n")) {
    parts = strValue
      .split("\n")
      .map((p) => p.trim())
      .filter((p) => p);
  }
  // Try ~ separator
  else if (strValue.includes("~")) {
    parts = strValue
      .split("~")
      .map((p) => p.trim())
      .filter((p) => p);
  }
  // Try to detect two values separated by space (not mixed fraction)
  else {
    // Pattern: "0 1/4" or "-1/4 +1/2" or "-1/4 1/2"
    // Need to distinguish from mixed fraction "1 1/4"
    const tokens = strValue.split(" ");
    if (tokens.length === 2) {
      // Check if second token looks like a new value (contains / or is a number)
      const firstToken = tokens[0];
      const secondToken = tokens[1];

      // If first token is just a number and second is a fraction => two separate values
      // If first token has / => it's a fraction, second is another value
      if (
        (!firstToken.includes("/") && secondToken.includes("/")) ||
        (firstToken.includes("/") && !isNaN(parseFloat(secondToken))) ||
        (firstToken.includes("/") && secondToken.includes("/")) ||
        secondToken.startsWith("+") ||
        secondToken.startsWith("-")
      ) {
        parts = [firstToken, secondToken];
      } else if (
        !isNaN(parseFloat(firstToken)) &&
        !isNaN(parseFloat(secondToken)) &&
        !secondToken.includes("/")
      ) {
        // Two plain numbers like "0 0.5"
        parts = [firstToken, secondToken];
      }
    } else if (tokens.length === 3) {
      // Could be "0 1 1/4" meaning TolMinus=0, TolPlus=1 1/4 (mixed fraction)
      parts = [tokens[0], `${tokens[1]} ${tokens[2]}`];
    } else if (tokens.length === 4) {
      // Could be "-1 1/4 +1 1/2" meaning two mixed fractions
      parts = [`${tokens[0]} ${tokens[1]}`, `${tokens[2]} ${tokens[3]}`];
    }
  }

  if (parts.length >= 2) {
    let minusPart = parts[0].trim();
    let plusPart = parts[1].trim();

    // Sort: negative first
    if (plusPart.startsWith("-") && !minusPart.startsWith("-")) {
      [minusPart, plusPart] = [plusPart, minusPart];
    }

    // Handle "0" specially - keep as is
    if (minusPart === "0") {
      // Keep as "0"
    } else if (!minusPart.startsWith("-") && !minusPart.startsWith("+")) {
      // Add negative sign if not present
      minusPart = `-${minusPart}`;
    }

    // Clean plus part
    const plusPartClean = plusPart.startsWith("+")
      ? plusPart.substring(1).trim()
      : plusPart;

    return {
      tolMinus: fractionToDecimal(minusPart),
      tolPlus: fractionToDecimal(plusPartClean),
    };
  }

  // Single value case
  if (strValue === "0") {
    return {
      tolMinus: { raw: "0", decimal: 0 },
      tolPlus: { raw: "0", decimal: 0 },
    };
  }

  // If starts with -, it's minus tolerance only
  if (strValue.startsWith("-")) {
    return {
      tolMinus: fractionToDecimal(strValue),
      tolPlus: { raw: "", decimal: null },
    };
  }

  // If starts with +, it's plus tolerance only
  if (strValue.startsWith("+")) {
    return {
      tolMinus: { raw: "", decimal: null },
      tolPlus: fractionToDecimal(strValue.substring(1)),
    };
  }

  // Single unsigned value - treat as ± (applies to both)
  const parsed = fractionToDecimal(strValue);
  const dec = parsed.decimal;
  return {
    tolMinus: {
      raw: `-${strValue}`,
      decimal: dec !== null ? -Math.abs(dec) : null,
    },
    tolPlus: { raw: strValue, decimal: dec !== null ? Math.abs(dec) : null },
  };
};

/**
 * Parses and cleans the raw data from a washing spec Excel sheet (P-type format).
 * New structure:
 * - Row 1: Style header (merged) e.g., "GPLY0039-Y 洗前尺寸表"
 * - Row 2: Size headers (merged 4 cols each) + Column headers for A, B, C
 * - Row 3: Sub-headers (A/W, B/W labels)
 * - Row 4+: Data rows with Seq, Measurement Point, Tol, and size values
 * @param {Array} data - Raw sheet data from xlsx
 * @param {string} sheetName - Name of the sheet (e.g., P1, P2, PA)
 * @returns {Object} Cleaned and structured spec data
 */
export const cleanWashingSpecData = (data, sheetName) => {
  if (!data || data.length < 4) {
    throw new Error(
      `Sheet "${sheetName}" has insufficient data or is in the wrong format.`,
    );
  }

  // Row 0 (Excel Row 1): Style header
  const styleRow = data[0];
  let styleNo = "";
  if (styleRow && styleRow[0]) {
    const styleStr = String(styleRow[0]).trim();
    // Extract Style No by splitting on space (e.g., "GPLY0039-Y 洗前尺寸表" -> "GPLY0039-Y")
    const styleParts = styleStr.split(/\s+/);
    styleNo = styleParts[0] || "";
  }

  // Row 1 (Excel Row 2): Size headers start from column index 3
  // Row 2 (Excel Row 3): Sub-headers (A/W, B/W for each size)
  const sizeHeaderRow = data[1];
  const subHeaderRow = data[2];

  // Parse size headers - each size spans 4 columns (A/W, B/W, empty, empty)
  const headers = [];
  const columnIndexMap = {};

  let col = 3; // Sizes start from column D (index 3)
  while (col < sizeHeaderRow.length) {
    const sizeCell = sizeHeaderRow[col];
    if (
      sizeCell !== null &&
      sizeCell !== undefined &&
      String(sizeCell).trim() !== ""
    ) {
      const sizeName = String(sizeCell).trim();
      headers.push({
        size: sizeName,
        columns: [
          {
            name: "After Washing",
            original: subHeaderRow[col]
              ? String(subHeaderRow[col]).trim()
              : "A/W",
          },
          {
            name: "Before Washing",
            original: subHeaderRow[col + 1]
              ? String(subHeaderRow[col + 1]).trim()
              : "B/W",
          },
        ],
      });
      columnIndexMap[sizeName] = {
        awIndex: col,
        bwIndex: col + 1,
      };
      col += 4; // Move to next size (skip 4 columns)
    } else {
      col++; // Handle empty cells within the header row
    }
  }

  if (headers.length === 0) {
    throw new Error(`No size headers found in sheet "${sheetName}".`);
  }

  // Parse data rows (starting from index 3, which is Excel Row 4)
  const dataRows = data.slice(3);
  const cleanedRows = [];

  dataRows.forEach((row) => {
    if (!row || row.length === 0) return;

    // Column A (index 0): Seq number - must be present and numeric
    const seqValue = row[0];
    if (
      seqValue === null ||
      seqValue === undefined ||
      String(seqValue).trim() === ""
    ) {
      return; // Skip rows without seq number
    }

    const seq = parseInt(String(seqValue).trim(), 10);
    if (isNaN(seq)) {
      return; // Skip if not a valid number
    }

    // Column B (index 1): Measurement Point Chinese
    const measurementPointChi = row[1] ? String(row[1]).trim() : "";

    // Column C (index 2): Tolerance (Tol+/-)
    const { tolMinus, tolPlus } = parseTolerance(row[2]);

    const rowData = {
      seq: seq,
      "Measurement Point - Eng": "", // Empty as per requirement
      "Measurement Point - Chi": measurementPointChi,
      "Tol Minus": tolMinus,
      "Tol Plus": tolPlus,
      specs: {},
    };

    // Parse size specs
    headers.forEach((header) => {
      const indices = columnIndexMap[header.size];
      const awValue = row[indices.awIndex];
      const bwValue = row[indices.bwIndex];

      rowData.specs[header.size] = {
        "After Washing": fractionToDecimal(awValue),
        "Before Washing": fractionToDecimal(bwValue),
      };
    });

    cleanedRows.push(rowData);
  });

  return {
    sheetName,
    styleNo,
    headers,
    rows: cleanedRows,
  };
};

export { fractionToDecimal, parseTolerance };
