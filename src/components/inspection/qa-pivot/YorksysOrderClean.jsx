import { SSF } from "xlsx"; // SheetJS Standard Format for date handling

/**
 * NEW LOGIC: Determines the Buyer name based on the MO/PO number.
 * @param {string} moNo - The purchase order number.
 * @returns {string} The determined buyer's name.
 */
const getBuyerFromMoNumber = (moNo) => {
  if (!moNo) return "Other";
  const upperMoNo = moNo.toUpperCase(); // Use uppercase for case-insensitive matching

  // Check for the more specific "COM" first to correctly identify MWW
  if (upperMoNo.includes("COM")) return "MWW";

  // Then, check for the more general "CO" for Costco
  if (upperMoNo.includes("CO")) return "Costco";

  // The rest of the original rules
  if (upperMoNo.includes("AR")) return "Aritzia";
  if (upperMoNo.includes("RT")) return "Reitmans";
  if (upperMoNo.includes("AF")) return "ANF";
  if (upperMoNo.includes("NT")) return "STORI";

  // Default case if no other rules match
  return "Other";
};

// ============================================================
// 🆕 NEW FUNCTION: Extract Country Code from SKU
// ============================================================
/**
 * Extracts the country code from SKU number.
 * Example: "SJCC 02-01-46880-FA25(AG1996)-ARP2338-64389-62-CAN" -> "CAN"
 * @param {string} sku - The SKU number string
 * @returns {string} The country code
 */
const extractCountryFromSku = (sku) => {
  if (!sku) return "N/A";
  const parts = sku.split("-");
  // Get the last part after the last hyphen
  const country = parts[parts.length - 1]?.trim() || "N/A";
  return country;
};
// ============================================================

/**
 * Parses SKU description to extract fabric content and product name.
 * Example: "MEN'S 60% COTTON 40% COOLMAX LACOSTA KNITTED T-SHIRT"
 * Returns: {
 *   fabricContent: "COTTON: 60%, COOLMAX: 40%",
 *   product: "MEN'S LACOSTA KNITTED T-SHIRT"
 * }
 * @param {string} description - The SKU description string
 * @returns {Object} Object containing fabricContent and product
 */
const parseSkuDescription = (description) => {
  if (!description) return { fabricContent: "N/A", product: "N/A" };

  // STEP 1: Normalize the description by adding space after % if missing
  // This handles cases like "70%COTTON" -> "70% COTTON"
  let normalizedDescription = description.replace(/(\d+)%([A-Z])/g, "$1% $2");

  // Updated regex to capture optional prefix word before fabric keyword
  // Matches patterns like "70% COTTON" or "70% RECYCLE POLYESTER"
  // The fabric keywords list: COTTON, POLYESTER, SPANDEX, NYLON, VISCOSE, WOOL
  const percentagePattern =
    /(\d+)%\s+((?:[A-Z]+\s+)?(?:COTTON|POLYESTER|SPANDEX|NYLON|VISCOSE|WOOL))/gi;

  let fabricParts = [];
  let match;

  // Extract all fabric content (percentage + fabric type including multi-word names)
  while ((match = percentagePattern.exec(normalizedDescription)) !== null) {
    const percentage = match[1];
    const fabricType = match[2].trim();
    fabricParts.push(`${fabricType}: ${percentage}%`);
  }

  // Remove fabric content from description to get product name
  let product = normalizedDescription
    .replace(
      /\d+%\s+(?:[A-Z]+\s+)?(?:COTTON|POLYESTER|SPANDEX|NYLON|VISCOSE|WOOL)/gi,
      ""
    )
    .trim();

  // Clean up multiple spaces that may result from removal
  product = product.replace(/\s+/g, " ");

  const fabricContent = fabricParts.length > 0 ? fabricParts.join(", ") : "N/A";

  return {
    fabricContent,
    product: product || "N/A",
  };
};

/** HELPER 1: Formats a JavaScript Date object into 'M/D/YYYY'. */
const formatJSDate = (date) => {
  if (date instanceof Date && !isNaN(date.getTime())) {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  }
  return "";
};

/** HELPER 2: Converts an Excel serial number into a 'M/D/YYYY' date string. */
const convertExcelSerialDate = (serial) => {
  if (typeof serial === "number" && !isNaN(serial)) {
    return SSF.format("m/d/yyyy", serial);
  }
  return "";
};

/** HELPER 3: Converts an Excel serial number into a JavaScript Date object. */
const excelSerialToJSDate = (serial) => {
  return new Date((serial - 25569) * 86400 * 1000);
};

/**
 * Parses and cleans data, now also determining the buyer.
 * @param {Array<Object>} data - The raw JSON data from sheet_to_json.
 * @returns {Object} A structured object with all required data.
 */
export const cleanYorksysOrderData = (data) => {
  if (!data || data.length === 0) {
    throw new Error("The Excel file is empty or has no data rows.");
  }

  const summaryRow = data[0];
  if (!summaryRow) {
    throw new Error(
      "Could not read the first data row for summary information."
    );
  }

  // --- Extract MO No and determine Buyer right away ---
  const moNo = summaryRow["PO #"] || "N/A";
  const buyer = getBuyerFromMoNumber(moNo);

  // Parse SKU Description into Fabric Content and Product
  const skuDescription = summaryRow["SKU DESCRIPTION"] || "N/A";
  const { fabricContent, product } = parseSkuDescription(skuDescription);

  // ============================================================
  // 🆕 MODIFIED: Add country extraction to skuDetails
  // ============================================================
  const skuDetails = data
    .map((row) => {
      const rawColor = row["COLOR"] || "";
      const color = rawColor.includes("[")
        ? rawColor.split("[")[0].trim()
        : rawColor.trim();
      const poLine = row["PO LINE ATTRIBUTE # 1"];
      const sku = row["SKU #"] || "";
      const country = extractCountryFromSku(sku); // 🆕 Extract country from SKU

      return {
        sku: sku,
        etd: formatJSDate(row["ETD"]),
        eta: convertExcelSerialDate(row["ETA"]),
        poLine: poLine === "TBA" ? "" : poLine || "",
        color: color,
        qty: Number(row["QUANTITY"]) || 0,
        country: country, // 🆕 Add country field
      };
    })
    .filter((detail) => detail.sku);
  // ============================================================

  // --- Aggregate data for the comprehensive PO Summary ---
  const orderSummary = {
    uniqueSkus: new Set(),
    etdDates: [],
    etaDates: [],
    uniqueColors: new Set(),
    uniquePoLines: new Set(),
    totalQty: 0,
  };

  for (const row of data) {
    if (!row["SKU #"]) continue;
    orderSummary.uniqueSkus.add(row["SKU #"]);
    orderSummary.totalQty += Number(row["QUANTITY"]) || 0;

    const rawColor = row["COLOR"] || "";
    const color = rawColor.includes("[")
      ? rawColor.split("[")[0].trim()
      : rawColor.trim();
    if (color) orderSummary.uniqueColors.add(color);

    const poLine = row["PO LINE ATTRIBUTE # 1"];
    if (poLine && poLine !== "TBA") orderSummary.uniquePoLines.add(poLine);

    if (row["ETD"] instanceof Date) orderSummary.etdDates.push(row["ETD"]);
    if (typeof row["ETA"] === "number")
      orderSummary.etaDates.push(excelSerialToJSDate(row["ETA"]));
  }

  // --- Process the aggregated data into final display strings ---
  const getPeriodString = (dates) => {
    if (dates.length === 0) return "N/A";
    dates.sort((a, b) => a - b);
    const startDate = formatJSDate(dates[0]);
    const endDate = formatJSDate(dates[dates.length - 1]);
    return startDate === endDate ? startDate : `${startDate} - ${endDate}`;
  };

  const getUniqueDateString = (dates) => {
    if (dates.length === 0) return "N/A";
    const uniqueFormattedDates = new Set(dates.map(formatJSDate));
    return Array.from(uniqueFormattedDates).join(", ");
  };

  const poSummary = [
    {
      poNo: moNo,
      totalSkus: orderSummary.uniqueSkus.size,
      uniqueEtds: getUniqueDateString(orderSummary.etdDates),
      etdPeriod: getPeriodString(orderSummary.etdDates),
      uniqueEtas: getUniqueDateString(orderSummary.etaDates),
      etaPeriod: getPeriodString(orderSummary.etaDates),
      totalColors: orderSummary.uniqueColors.size,
      totalPoLines: orderSummary.uniquePoLines.size,
      totalQty: orderSummary.totalQty,
    },
  ];

  // ============================================================
  // 🆕 NEW: Aggregate Order Qty by Country
  // ============================================================
  const countryMap = new Map();

  skuDetails.forEach((detail) => {
    const { country, color, qty } = detail;

    if (!countryMap.has(country)) {
      countryMap.set(country, {
        countryId: country,
        totalQty: 0,
        colorQtyMap: new Map(), // Map to store color -> qty
      });
    }

    const countryData = countryMap.get(country);
    countryData.totalQty += qty;

    // Aggregate qty by color
    if (countryData.colorQtyMap.has(color)) {
      countryData.colorQtyMap.set(
        color,
        countryData.colorQtyMap.get(color) + qty
      );
    } else {
      countryData.colorQtyMap.set(color, qty);
    }
  });

  // Convert Map to Array and format color quantities
  const orderQtyByCountry = Array.from(countryMap.values()).map((country) => {
    // Format color quantities as "Color: Qty, Color: Qty"
    const qtyByColor = Array.from(country.colorQtyMap.entries())
      .map(([color, qty]) => `${color}: ${qty.toLocaleString()}`)
      .join(", ");

    return {
      countryId: country.countryId,
      totalQty: country.totalQty,
      qtyByColor: qtyByColor || "N/A",
    };
  });
  // ============================================================

  return {
    buyer: buyer,
    factory: summaryRow["SUPPLIER/COMPANY"] || "N/A",
    moNo: moNo,
    season: summaryRow["SEASON"] || "N/A",
    style: summaryRow["STYLE"] || "N/A",
    skuDescription: skuDescription,
    fabricContent: fabricContent,
    product: product,
    destination: summaryRow["DESTINATION"] || "N/A",
    shipMode: summaryRow["SHIP MODE"] || "N/A",
    currency: summaryRow["CURRENCY"] || "N/A",
    skuDetails,
    poSummary,
    orderQtyByCountry, // 🆕 NEW: Add country aggregation data
  };
};
