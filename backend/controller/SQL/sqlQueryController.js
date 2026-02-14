import sql from "mssql"; // Import mssql for SQL Server connection
import cron from "node-cron"; // Import node-cron for scheduling
import { DtOrder } from "../MongoDB/dbConnectionController.js";

/* ------------------------------
   YM DataStore SQL Configuration
------------------------------ */

// SQL Server Configuration for YMDataStore
const sqlConfig = {
  user: "ymdata",
  password: "Kzw15947",
  server: "192.167.1.13",
  port: 1433,
  database: "YMDataStore",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
  requestTimeout: 300000,
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Create connection pool
const poolYMDataStore = new sql.ConnectionPool(sqlConfig);

// SQL connection status tracker
const sqlConnectionStatus = {
  YMDataStore: false,
};

// Function to connect to pool
async function connectPool(pool, poolName) {
  try {
    if (pool.connected || pool.connecting) {
      try {
        await pool.close();
      } catch (closeErr) {
        console.warn(
          `Warning closing existing ${poolName} connection:`,
          closeErr.message,
        );
      }
    }

    await pool.connect();
    console.log(
      `✅ Successfully connected to ${poolName} pool at ${pool.config.server}`,
    );
    sqlConnectionStatus[poolName] = true;

    pool.on("error", (err) => {
      console.error(`SQL Pool Error for ${poolName}:`, err);
      sqlConnectionStatus[poolName] = false;
    });
  } catch (err) {
    console.error(`❌ FAILED to connect to ${poolName} pool:`, err.message);
    sqlConnectionStatus[poolName] = false;
    throw new Error(`Failed to connect to ${poolName}`);
  }
}

// Function to ensure pool connection with retries
async function ensurePoolConnected(pool, poolName, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (pool.connected && sqlConnectionStatus[poolName]) {
        return;
      }

      console.log(
        `Attempt ${attempt}/${maxRetries}: Reconnecting to ${poolName}...`,
      );

      if (pool.connected || pool.connecting) {
        try {
          await pool.close();
        } catch (closeErr) {
          console.warn(
            `Warning during close for ${poolName}:`,
            closeErr.message,
          );
        }
      }

      if (attempt > 1) {
        await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
      }

      await connectPool(pool, poolName);
      return;
    } catch (reconnectErr) {
      console.error(
        `Attempt ${attempt}/${maxRetries} failed for ${poolName}:`,
        reconnectErr.message,
      );

      if (attempt === maxRetries) {
        sqlConnectionStatus[poolName] = false;
        throw new Error(
          `Failed to reconnect to ${poolName} after ${maxRetries} attempts: ${reconnectErr.message}`,
        );
      }
    }
  }
}

/* ------------------------------
   Initialize Pool and Server Start
------------------------------ */

async function initializeServer() {
  console.log("--- Initializing Server ---");

  try {
    await connectPool(poolYMDataStore, "YMDataStore");

    await syncDTOrdersData();
  } catch (err) {
    console.warn(
      `YMDataStore connection failed: ${err.message}. DT Orders service will be unavailable.`,
    );
  }
}

// Start the server initialization
initializeServer().catch((err) => {
  console.error("A critical error occurred during server initialization:", err);
});

/* ------------------------------
   Helper function to split array into chunks
------------------------------ */
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/* ------------------------------
   DT Orders Data Migration Function
------------------------------ */

async function syncDTOrdersData() {
  try {
    console.log("🔄 Starting DT Orders data migration...");

    if (!sqlConnectionStatus.YMDataStore) {
      console.warn(
        "⚠️ YMDataStore is not connected. Attempting to reconnect...",
      );
      await ensurePoolConnected(poolYMDataStore, "YMDataStore");
    }

    if (!poolYMDataStore.connected) {
      throw new Error(
        "YMDataStore pool is not connected after reconnection attempt",
      );
    }

    const request = poolYMDataStore.request();

    // 1. Fetch Order Headers from YMDataStore (EXCLUDING Factory = 'YM' records)
    const orderHeaderQuery = `
      SELECT 
        h.[SC_Heading], h.[Factory], h.[SalesTeamName], h.[Cust_Code], h.[ShortName],
        h.[EngName], h.[Order_No], h.[Ccy], h.[Style], h.[CustStyle],
        h.[Size_Seq10], h.[Size_Seq20], h.[Size_Seq30], h.[Size_Seq40], h.[Size_Seq50],
        h.[Size_Seq60], h.[Size_Seq70], h.[Size_Seq80], h.[Size_Seq90], h.[Size_Seq100],
        h.[Size_Seq110], h.[Size_Seq120], h.[Size_Seq130], h.[Size_Seq140], h.[Size_Seq150],
        h.[Size_Seq160], h.[Size_Seq170], h.[Size_Seq180], h.[Size_Seq190], h.[Size_Seq200],
        h.[Size_Seq210], h.[Size_Seq220], h.[Size_Seq230], h.[Size_Seq240], h.[Size_Seq250],
        h.[Size_Seq260], h.[Size_Seq270], h.[Size_Seq280], h.[Size_Seq290], h.[Size_Seq300],
        h.[Size_Seq310], h.[Size_Seq320], h.[Size_Seq330], h.[Size_Seq340], h.[Size_Seq350],
        h.[Size_Seq360], h.[Size_Seq370], h.[Size_Seq380], h.[Size_Seq390], h.[Size_Seq400],
        h.[OrderQuantity], h.[Det_ID]
      FROM [YMDataStore].[DT_ALL].[zCustOrd_SzHdr] h
      WHERE h.[Order_No] IS NOT NULL 
        AND (h.[Factory] IS NULL OR h.[Factory] = 'YY')
      ORDER BY h.[Order_No]
    `;

    const orderHeaderResult = await request.query(orderHeaderQuery);

    if (orderHeaderResult.recordset.length === 0) {
      return {
        success: true,
        message: "No order headers found (after excluding YM factory)",
      };
    }

    // Get list of valid Order_No values (excluding YM factory orders)
    const validOrderNos = orderHeaderResult.recordset.map(
      (header) => header.Order_No,
    );

    // **FIX: Split Order_No list into chunks to avoid parameter limit**
    const BATCH_SIZE = 2000; // Keep under 2100 parameter limit
    const orderNoChunks = chunkArray(validOrderNos, BATCH_SIZE);

    // 2. Fetch Order Colors from YMDataStore in batches

    let allOrderColorsResults = [];

    for (let batchIndex = 0; batchIndex < orderNoChunks.length; batchIndex++) {
      const orderNoBatch = orderNoChunks[batchIndex];

      const orderNoPlaceholders = orderNoBatch
        .map((_, index) => `@orderNo${index}`)
        .join(",");

      const orderColorsQuery = `
        SELECT 
          [Order_No], [ColorCode], [Color], [ChnColor], [Color_Seq],
          [Mode], [Country], [Origin], [CustPORef],
          [Size_Seq10], [Size_Seq20], [Size_Seq30], [Size_Seq40], [Size_Seq50], [Size_Seq60],
          [Size_Seq70], [Size_Seq80], [Size_Seq90], [Size_Seq100], [Size_Seq110], [Size_Seq120],
          [Size_Seq130], [Size_Seq140], [Size_Seq150], [Size_Seq160], [Size_Seq170], [Size_Seq180],
          [Size_Seq190], [Size_Seq200], [Size_Seq210], [Size_Seq220], [Size_Seq230], [Size_Seq240],
          [Size_Seq250], [Size_Seq260], [Size_Seq270], [Size_Seq280], [Size_Seq290], [Size_Seq300],
          [Size_Seq310], [Size_Seq320], [Size_Seq330], [Size_Seq340], [Size_Seq350], [Size_Seq360],
          [Size_Seq370], [Size_Seq380], [Size_Seq390], [Size_Seq400]
        FROM [YMDataStore].[DT_ALL].[zBuyerPOColQty_BySz]
        WHERE [Order_No] IS NOT NULL
          AND [Order_No] IN (${orderNoPlaceholders})
        ORDER BY [Order_No], [ColorCode]
      `;

      // Add parameters for each Order_No in this batch
      const colorRequest = poolYMDataStore.request();
      orderNoBatch.forEach((orderNo, index) => {
        colorRequest.input(`orderNo${index}`, sql.NVarChar, orderNo);
      });

      const batchResult = await colorRequest.query(orderColorsQuery);
      allOrderColorsResults = allOrderColorsResults.concat(
        batchResult.recordset,
      );
    }

    // Create size mapping from database for each order
    const orderSizeMapping = new Map();

    orderHeaderResult.recordset.forEach((header) => {
      const orderNo = header.Order_No;
      const sizeMapping = {};

      const sizeColumns = [
        "10",
        "20",
        "30",
        "40",
        "50",
        "60",
        "70",
        "80",
        "90",
        "100",
        "110",
        "120",
        "130",
        "140",
        "150",
        "160",
        "170",
        "180",
        "190",
        "200",
        "210",
        "220",
        "230",
        "240",
        "250",
        "260",
        "270",
        "280",
        "290",
        "300",
        "310",
        "320",
        "330",
        "340",
        "350",
        "360",
        "370",
        "380",
        "390",
        "400",
      ];

      sizeColumns.forEach((seq) => {
        const sizeValue = header[`Size_Seq${seq}`];
        if (sizeValue && sizeValue !== null && sizeValue !== "") {
          sizeMapping[seq] = sizeValue.toString();
        }
      });

      orderSizeMapping.set(orderNo, sizeMapping);
    });

    // Helper Functions
    function extractSizeDataAsObject(record, prefix = "Size_Seq", orderNo) {
      const sizeMapping = orderSizeMapping.get(orderNo) || {};
      const sizeObject = {};

      const allSizeColumns = [
        "10",
        "20",
        "30",
        "40",
        "50",
        "60",
        "70",
        "80",
        "90",
        "100",
        "110",
        "120",
        "130",
        "140",
        "150",
        "160",
        "170",
        "180",
        "190",
        "200",
        "210",
        "220",
        "230",
        "240",
        "250",
        "260",
        "270",
        "280",
        "290",
        "300",
        "310",
        "320",
        "330",
        "340",
        "350",
        "360",
        "370",
        "380",
        "390",
        "400",
      ];

      allSizeColumns.forEach((seq) => {
        const columnName = `${prefix}${seq}`;
        const quantity = record[columnName];

        // Only include non-null, non-zero quantities
        if (
          quantity !== null &&
          quantity !== undefined &&
          Number(quantity) > 0
        ) {
          const sizeName = sizeMapping[seq] || `Size${seq}`;
          sizeObject[sizeName] = Number(quantity);
        }
      });

      return sizeObject;
    }

    function convertSizeObjectToArray(sizeObject, orderNo) {
      const sizeMapping = orderSizeMapping.get(orderNo) || {};

      const sizeToSeqMapping = {};
      Object.entries(sizeMapping).forEach(([seq, sizeName]) => {
        sizeToSeqMapping[sizeName] = parseInt(seq);
      });

      return Object.entries(sizeObject)
        .filter(([sizeName, qty]) => qty > 0) // Filter out zero quantities
        .sort(([sizeNameA], [sizeNameB]) => {
          const seqA = sizeToSeqMapping[sizeNameA] || 999;
          const seqB = sizeToSeqMapping[sizeNameB] || 999;
          return seqA - seqB;
        })
        .map(([sizeName, qty]) => {
          const obj = {};
          obj[sizeName] = qty;
          return obj;
        });
    }

    function convertEmptyToNull(value) {
      if (!value || value === null || value === undefined || value === "") {
        return null;
      }
      const str = value.toString().trim();
      return str === "" ? null : str;
    }

    // Process Data
    const orderMap = new Map();

    // 1. Process Order Headers
    orderHeaderResult.recordset.forEach((header) => {
      const orderNo = header.Order_No;
      if (!orderMap.has(orderNo)) {
        const sizeData = extractSizeDataAsObject(header, "Size_Seq", orderNo);

        orderMap.set(orderNo, {
          SC_Heading: convertEmptyToNull(header.SC_Heading),
          Factory: convertEmptyToNull(header.Factory),
          SalesTeamName: convertEmptyToNull(header.SalesTeamName),
          Cust_Code: convertEmptyToNull(header.Cust_Code),
          ShortName: convertEmptyToNull(header.ShortName),
          EngName: convertEmptyToNull(header.EngName),
          Order_No: header.Order_No,
          Ccy: convertEmptyToNull(header.Ccy),
          Style: convertEmptyToNull(header.Style),
          CustStyle: convertEmptyToNull(header.CustStyle),
          TotalQty: Number(header.OrderQuantity) || 0,
          NoOfSize: Object.keys(sizeData).length,
          OrderColors: [],
          OrderColorShip: [], // Empty array as requested
          SizeSpec: [], // Empty array as requested
          // Initialize shipping fields that will be populated from color data
          Mode: null,
          Country: null,
          Origin: null,
          CustPORef: null,
        });
      }
    });

    // 2. Process Order Colors and extract shipping data
    const colorSummaryMap = new Map();

    allOrderColorsResults.forEach((record) => {
      const orderNo = record.Order_No;
      const colorCode = record.ColorCode;

      if (orderMap.has(orderNo)) {
        const order = orderMap.get(orderNo);

        // Extract shipping data and set to order (take first non-null values)
        if (!order.Mode && record.Mode) {
          order.Mode = convertEmptyToNull(record.Mode);
        }
        if (!order.Country && record.Country) {
          order.Country = convertEmptyToNull(record.Country);
        }
        if (!order.Origin && record.Origin) {
          order.Origin = convertEmptyToNull(record.Origin);
        }
        if (!order.CustPORef && record.CustPORef) {
          order.CustPORef = convertEmptyToNull(record.CustPORef);
        }

        // Sum quantities for OrderColors
        const colorKey = `${orderNo}_${colorCode}`;
        if (!colorSummaryMap.has(colorKey)) {
          colorSummaryMap.set(colorKey, {
            ColorCode: record.ColorCode,
            Color: record.Color,
            ChnColor: record.ChnColor,
            ColorKey: Number(record.Color_Seq) || 0,
            sizeTotals: {},
          });
        }

        const colorSummary = colorSummaryMap.get(colorKey);
        const sizes = extractSizeDataAsObject(record, "Size_Seq", orderNo);

        // Sum up quantities for each size
        Object.entries(sizes).forEach(([sizeName, qty]) => {
          if (!colorSummary.sizeTotals[sizeName]) {
            colorSummary.sizeTotals[sizeName] = 0;
          }
          colorSummary.sizeTotals[sizeName] += qty;
        });
      }
    });

    // Convert color summaries to the desired format
    const colorMap = new Map();
    for (const [colorKey, colorSummary] of colorSummaryMap) {
      const orderNo = colorKey.split("_")[0];
      const orderQtyArray = convertSizeObjectToArray(
        colorSummary.sizeTotals,
        orderNo,
      );

      if (orderQtyArray.length > 0) {
        // Only add colors with actual quantities
        colorMap.set(colorKey, {
          ColorCode: colorSummary.ColorCode,
          Color: colorSummary.Color,
          ChnColor: colorSummary.ChnColor,
          ColorKey: colorSummary.ColorKey,
          OrderQty: orderQtyArray,
        });
      }
    }

    // Add colors to orders
    for (const [orderNo, order] of orderMap) {
      // Add OrderColors only
      for (const [colorKey, colorData] of colorMap) {
        if (colorKey.startsWith(orderNo + "_")) {
          order.OrderColors.push(colorData);
        }
      }

      // Create SizeList from all unique sizes across all colors
      const allSizes = new Set();
      order.OrderColors.forEach((color) => {
        color.OrderQty.forEach((sizeObj) => {
          Object.keys(sizeObj).forEach((sizeName) => {
            allSizes.add(sizeName);
          });
        });
      });

      // Sort sizes based on sequence order
      const sizeMapping = orderSizeMapping.get(orderNo) || {};
      const sizeToSeqMapping = {};
      Object.entries(sizeMapping).forEach(([seq, sizeName]) => {
        sizeToSeqMapping[sizeName] = parseInt(seq);
      });

      order.SizeList = Array.from(allSizes).sort((a, b) => {
        const seqA = sizeToSeqMapping[a] || 999;
        const seqB = sizeToSeqMapping[b] || 999;
        return seqA - seqB;
      });

      // Update NoOfSize to reflect actual number of sizes with quantities
      order.NoOfSize = order.SizeList.length;
    }

    // 4. Save to MongoDB
    console.log("💾 Saving to MongoDB...");
    const finalDocs = Array.from(orderMap.values());

    // Debug: Log a sample document to verify shipping fields

    if (finalDocs.length === 0) {
      return {
        success: true,
        message: "No documents to save (after excluding YM factory)",
      };
    }

    const bulkOps = finalDocs.map((doc) => ({
      updateOne: {
        filter: { Order_No: doc.Order_No },
        update: { $set: doc },
        upsert: true,
      },
    }));

    try {
      const result = await DtOrder.bulkWrite(bulkOps);

      return {
        success: true,
        totalOrders: finalDocs.length,
        modified: result.modifiedCount,
        upserted: result.upsertedCount,
        note: "YM factory records excluded, shipping fields included, processed in batches",
      };
    } catch (bulkError) {
      console.error("❌ Bulk operation failed:", bulkError);
      throw bulkError;
    }
  } catch (error) {
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  }
}

// Add API endpoint for manual sync
// api/sync-dt-orders
export const syncDtOrders = async (req, res) => {
  try {
    const result = await syncDTOrdersData();
    res.json({
      success: true,
      message:
        "DT Orders data sync completed successfully (excluding YM factory, including shipping fields)",
      data: result,
    });
  } catch (error) {
    console.error("DT Orders sync API error:", error);
    res.status(500).json({
      success: false,
      message: "DT Orders data sync failed",
      error: error.message,
    });
  }
};

// Schedule to run every 3 hours
cron.schedule("0 */3 * * *", async () => {
  console.log(
    "⏰ Running scheduled DT Orders sync (excluding YM factory, including shipping fields)...",
  );
  await syncDTOrdersData()
    .then((result) => {
      console.log("✅ Scheduled DT Orders Data Sync completed", result);
    })
    .catch((err) => {
      console.error("❌ Scheduled DT Orders Data Sync failed", err);
    });
});

// Function to close SQL pool
export async function closeSQLPools() {
  try {
    await poolYMDataStore.close();
    console.log("YMDataStore SQL connection pool closed.");
  } catch (err) {
    console.error("Error closing YMDataStore SQL connection pool:", err);
    throw err;
  }
}
