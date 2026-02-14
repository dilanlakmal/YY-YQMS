import {
  FincheckAIChat,
  FincheckInspectionReports,
  QASectionsAqlBuyerConfig,
} from "../../MongoDB/dbConnectionController.js";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

// --- CONFIGURATION ---
const HARDCODED_KEY = "your-harcoded-key-xxx";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || HARDCODED_KEY; // ✅ Correct name
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY); // ✅ Correct name
const groq = GROQ_API_KEY ? new Groq({ apiKey: GROQ_API_KEY }) : null;

// Track which model is being used
let currentModel = "gemini";
let geminiRateLimitResetTime = null;

// ============================================================================
// SCHEMA CONTEXT - DETAILED FOR AI UNDERSTANDING
// ============================================================================
const SCHEMA_CONTEXT = `
You have access to a MongoDB collection 'FincheckInspectionReports' for Quality Assurance Inspection data.

MAIN FIELDS:
- reportId (Number): Unique report ID (e.g., 7582054152)
- inspectionDate (Date): When the inspection occurred
- inspectionType (String): "first" or "re" (re-inspection)
- buyer (String) - **IMPORTANT: Only use actual buyer names from the database. Common buyers include: Aritzia, Costco, ANF, Reitmans, MWW, Elite**
- orderNos (Array of Strings): PO/Order numbers
- orderNosString (String): Comma-separated order numbers
- orderType (String): "single", "multi", or "batch"
- productType (String): Type of garment
- reportType (String): Report template name
- empId (String): Inspector's employee ID
- empName (String): Inspector's name
- status (String): "draft", "in_progress", "completed", "cancelled"
- measurementMethod (String): "Before", "After", "N/A", "No"
- inspectionMethod (String): "Fixed" or "AQL" - THIS IS CRITICAL FOR AQL CALCULATIONS

INSPECTION DETAILS (nested in inspectionDetails):
- supplier (String): Factory/Supplier name
- factory (String): Factory name
- isSubCon (Boolean): If subcontracted
- subConFactory (String): Subcon factory name
- inspectedQty (Number): Total pieces inspected - CRITICAL FOR AQL
- aqlSampleSize (Number): AQL sample size
- cartonQty (Number): Number of cartons
- shippingStage (String): e.g., "D1", "D2", "D3"
- totalOrderQty (Number): Total order quantity
- custStyle (String): Customer style code
- customer (String): Customer name
- remarks (String): General remarks

AQL CONFIG (nested in inspectionDetails.aqlConfig):
- inspectionType (String): e.g., "General"
- level (String): e.g., "II"
- minorAQL (Number): Minor AQL level (e.g., 2.5, 4.0)
- majorAQL (Number): Major AQL level (e.g., 2.5, 1.5)
- criticalAQL (Number): Critical AQL level (e.g., 0, 0.65)
- inspectedQty (Number): Qty for AQL calculation
- batch (String): Batch range (e.g., "501 ~ 1200")
- sampleLetter (String): Sample letter code (e.g., "J")
- sampleSize (Number): Sample size from AQL table
- items (Array): Ac/Re values [{status: "Minor", ac: 10, re: 11}, ...]

DEFECT DATA (defectData array - CRITICAL):
Each defect object contains:
- groupId (Number): Configuration group ID
- defectId (ObjectId): Defect reference ID
- defectName (String): Name of the defect
- defectCode (String): Defect code number
- categoryName (String): Defect category
- status (String): "Minor", "Major", or "Critical" (for no-location mode)
- qty (Number): Quantity of this defect
- isNoLocation (Boolean): If defect was recorded without specific location
- locations (Array): Location details with positions
  - Each location has: uniqueId, locationId, locationNo, locationName, view, qty
  - positions array: [{pcsNo, status ("Minor"/"Major"/"Critical"), ...}]
- lineName, tableName, colorName: Context info
- qcUser: QC inspector who recorded it

MEASUREMENT DATA (measurementData array) - IMPORTANT:
Each measurement entry contains:
- groupId (Number): Configuration group ID
- stage (String): "Before" or "After" (Before Wash or After Wash/Buyer Spec)
- size (String): Size being measured (e.g., "S", "M", "L", "XL")
- kValue (String): K-value for wash shrinkage
- allMeasurements (Object): { specId: { pcsIndex: { decimal, fraction } } }
- criticalMeasurements (Object): Critical point measurements only
- allEnabledPcs (Array of Numbers): Valid piece indices to count
- criticalEnabledPcs (Array of Numbers): Valid critical piece indices
- inspectorDecision (String): "pass" or "fail"
- systemDecision (String): "pending", "pass", "fail"
- lineName, tableName, colorName: Context info

MEASUREMENT SPECS (from QASectionsMeasurementSpecs collection):
- MeasurementPointEngName: Name of measurement point (e.g., "Chest Width", "Body Length")  **IMPORTANT: Only use actual MeasurementPointEngName names using matching index**
- TolMinus: { decimal, fraction } - Negative tolerance
- TolPlus: { decimal, fraction } - Positive tolerance
- Size values contain: { decimal, fraction } - Spec value for each size


PRODUCTION STATUS (inspectionDetails.productionStatus):
- cutting, sewing, ironing, qc2FinishedChecking, folding, packing (all Numbers)

PACKING LIST (inspectionDetails.packingList):
- totalCartons, totalPcs, finishedCartons, finishedPcs (all Numbers)

TIMESTAMPS:
- createdAt, updatedAt (Date)

IMPORTANT RULES FOR QUERYING:
1. For order numbers: Use orderNos array or orderNosString
2. For buyer search: buyer field (use exact names from database)
3. For inspector: empId or empName
4. For date range: inspectionDate with $gte, $lte
5. For AQL reports: inspectionMethod === "AQL"
6. For Fixed reports: inspectionMethod === "Fixed"
7. **NEVER fabricate or assume buyer names - always query the database first**
8. When asked about "today", use current date comparison
9. When listing results, ALWAYS show actual data from database, not examples
10. For measurement analysis: Use FUNCTION: getMeasurementSummary(styleNo: "STYLE123")
`;

const AQL_CALCULATION_CONTEXT = `
AQL (Acceptable Quality Level) CALCULATION LOGIC:

1. DEFECT COUNTING:
   - For NO-LOCATION defects: status is on the defect itself, qty is the count
   - For LOCATION-BASED defects: status is on each position in locations[].positions[]
   - Count each position as 1 defect of its status type

2. AQL RESULT DETERMINATION:
   - Get Ac (Accept) and Re (Reject) values from aqlConfig.items
   - For each severity (Minor, Major, Critical):
     * If found_count <= Ac → PASS
     * If found_count >= Re → FAIL
   
3. FINAL RESULT:
   - If ANY severity FAILS → Overall FAIL
   - If ALL severities PASS → Overall PASS

4. FIXED METHOD REPORTS:
   - No AQL calculation applies
   - inspectionMethod === "Fixed"
   - Simply report defect counts without Ac/Re comparison

5. MEASUREMENT TOLERANCE LOGIC:
   - Get TolMinus and TolPlus from measurement specs
   - Measured value (decimal) should be within: -|TolMinus| to +|TolPlus|
   - If within range → PASS (green)
   - If outside range → FAIL (red)
   - Values are stored as fractions (e.g., "1/4", "-3/16") and decimals
`;

const SYSTEM_INSTRUCTION = `
You are the Fincheck Inspection AI Assistant - an expert in garment quality assurance, AQL standards, and inspection data analysis.

${SCHEMA_CONTEXT}

${AQL_CALCULATION_CONTEXT}

YOUR CAPABILITIES:
1. Query inspection reports by any field
2. Calculate AQL results for AQL-method inspections
3. Analyze defect patterns and trends
4. **Generate measurement summary tables by style**
5. Compare inspections across time periods
6. Provide quality insights and recommendations


CRITICAL RESPONSE RULES:
1. For GENERAL questions about QA/AQL concepts, answer directly with expertise.
2. For DATA-SPECIFIC questions, you MUST request data using the QUERY or FUNCTION prefix.
3. **NEVER make up or fabricate data** - ALWAYS query the database first
4. **NEVER use example buyer names** - only show actual buyers from query results
5. When you receive SYSTEM_DATA_RESULT with empty array [], clearly state "No reports found" instead of showing examples
6. If asked about "today", calculate today's date range correctly

QUERY FORMAT (for fetching data):
QUERY: {"reportId": 7582054152}
QUERY: {"buyer": "Aritzia", "status": "completed", "limit": 200}
QUERY: {"inspectionDate": {"$gte": "2026-01-01"}, "limit": 200}
QUERY: {"orderNos": "GPAR12345"}
QUERY: {"defectAnalysis": true, "reportId": 7582054152}
QUERY: {"aqlCalculation": true, "reportId": 7582054152}

For "today" queries, use:
QUERY: {"inspectionDate": {"$gte": "[TODAY_START]", "$lte": "[TODAY_END]"}, "limit": 100}

FUNCTION FORMAT (for special calculations and complex operations):
FUNCTION: calculateAQL(reportId: 7582054152)
FUNCTION: getDefectSummary(reportId: 7582054152)
FUNCTION: compareReports(reportIds: [123, 456])
FUNCTION: getMeasurementSummary(styleNo: "STYLE123")
FUNCTION: getMeasurementSummary(styleNo: "STYLE123", stage: "Before")
FUNCTION: getMeasurementSummary(styleNo: "STYLE123", reportType: "FRI")
FUNCTION: getInspectorStats(empId: "E001", dateRange: "last30days")

FORMATTING:
- Use **bold** for important values
- Use \`code\` for technical terms, codes, and IDs
- Use bullet points for lists
- Present data in clear, structured formats
- When showing defect summaries, always show: Defect Code, Name, Minor/Major/Critical counts
- When showing AQL results, clearly indicate PASS/FAIL with proper formatting

**MEASUREMENT TABLE FORMATTING:**
When showing measurement summaries, format as a markdown table:
| Measurement Point | Tol- | Tol+ | Size S | Size M | Size L | Status |
|------------------|------|------|--------|--------|--------|--------|
| Chest Width | -1/4 | 1/4 | 🟢 0 | 🟢 1/8 | 🔴 3/8 | 2P/1F |

Use 🟢 for PASS (within tolerance), 🔴 for FAIL (out of tolerance)
Show fraction values with status indicators
Include summary statistics at bottom

NEVER make up data. Always query first.
When you receive SYSTEM_DATA_RESULT, analyze it thoroughly and answer the user's question.

**IMPORTANT**: 
- If query returns empty results, say "No reports found for [criteria]"
- Do NOT provide example data or sample reports
- Do NOT mention buyers not in the actual query results
- Always show the actual reportId, buyer, and other fields from the database
`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get today's date range (start and end of day)
 */
const getTodayDateRange = () => {
  const now = new Date();
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0,
  );
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    23,
    59,
    59,
  );
  return { startOfDay, endOfDay };
};

/**
 * Get this week's date range
 */
const getThisWeekDateRange = () => {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return { startOfWeek, endOfWeek };
};

/**
 * Get last N days date range
 */
const getLastNDaysRange = (days) => {
  const now = new Date();
  const startDate = new Date(now);
  startDate.setDate(now.getDate() - days);
  startDate.setHours(0, 0, 0, 0);

  return { startDate, endDate: now };
};

/**
 * Calculate defect totals from defectData array
 */
const calculateDefectTotals = (defectData) => {
  const totals = { minor: 0, major: 0, critical: 0, total: 0 };
  const defectsList = {};

  if (!defectData || !Array.isArray(defectData))
    return { totals, defectsList: [] };

  defectData.forEach((defect) => {
    const defectKey = defect.defectId?.toString() || defect.defectName;

    if (!defectsList[defectKey]) {
      defectsList[defectKey] = {
        defectId: defect.defectId,
        defectName: defect.defectName,
        defectCode: defect.defectCode,
        categoryName: defect.categoryName,
        minor: 0,
        major: 0,
        critical: 0,
        total: 0,
      };
    }

    const entry = defectsList[defectKey];

    if (defect.isNoLocation) {
      // No-location mode: status is on defect itself
      const status = defect.status?.toLowerCase();
      const qty = defect.qty || 1;

      if (status === "minor") {
        entry.minor += qty;
        totals.minor += qty;
      } else if (status === "major") {
        entry.major += qty;
        totals.major += qty;
      } else if (status === "critical") {
        entry.critical += qty;
        totals.critical += qty;
      }
      entry.total += qty;
      totals.total += qty;
    } else {
      // Location-based: status is on each position
      if (defect.locations && Array.isArray(defect.locations)) {
        defect.locations.forEach((loc) => {
          if (loc.positions && Array.isArray(loc.positions)) {
            loc.positions.forEach((pos) => {
              const status = pos.status?.toLowerCase();
              if (status === "minor") {
                entry.minor += 1;
                totals.minor += 1;
              } else if (status === "major") {
                entry.major += 1;
                totals.major += 1;
              } else if (status === "critical") {
                entry.critical += 1;
                totals.critical += 1;
              }
              entry.total += 1;
              totals.total += 1;
            });
          }
        });
      }
    }
  });

  return {
    totals,
    defectsList: Object.values(defectsList).sort((a, b) => {
      const codeA = parseFloat(a.defectCode) || 0;
      const codeB = parseFloat(b.defectCode) || 0;
      return codeA - codeB;
    }),
  };
};

/**
 * ✅ FIXED: Fetch AQL Configuration from QASectionsAqlBuyerConfig
 */
const fetchAQLConfigForBuyer = async (buyer, inspectedQty) => {
  try {
    // Fetch all configs for this buyer (Minor, Major, Critical)
    const configs = await QASectionsAqlBuyerConfig.find({ Buyer: buyer });

    if (!configs || configs.length === 0) {
      return {
        error: true,
        message: `No AQL configuration found for buyer: ${buyer}`,
      };
    }

    // Find the matching sample data based on inspectedQty
    const minorConfig = configs.find((c) => c.Status === "Minor");
    const majorConfig = configs.find((c) => c.Status === "Major");
    const criticalConfig = configs.find((c) => c.Status === "Critical");

    // Helper to find matching batch
    const findMatchingSample = (config) => {
      if (!config || !config.SampleData) return null;
      return config.SampleData.find(
        (sample) => inspectedQty >= sample.Min && inspectedQty <= sample.Max,
      );
    };

    const minorSample = findMatchingSample(minorConfig);
    const majorSample = findMatchingSample(majorConfig);
    const criticalSample = findMatchingSample(criticalConfig);

    // Use the first available config for base info
    const baseConfig = minorConfig || majorConfig || criticalConfig;

    return {
      error: false,
      buyer,
      inspectedQty,
      inspectionType: baseConfig?.InspectionType || "General",
      level: baseConfig?.Level || "II",
      minorAQL: minorConfig?.AQLLevel || null,
      majorAQL: majorConfig?.AQLLevel || null,
      criticalAQL: criticalConfig?.AQLLevel || null,
      batch: minorSample?.BatchName || majorSample?.BatchName || "N/A",
      sampleLetter:
        minorSample?.SampleLetter || majorSample?.SampleLetter || "N/A",
      sampleSize: minorSample?.SampleSize || majorSample?.SampleSize || 0,
      minor: minorSample,
      major: majorSample,
      critical: criticalSample,
    };
  } catch (error) {
    console.error("Error fetching AQL config:", error);
    return {
      error: true,
      message: `Failed to fetch AQL config: ${error.message}`,
    };
  }
};

/**
 * ✅ FIXED: Calculate AQL result using QASectionsAqlBuyerConfig
 */
const calculateAQLResult = async (report) => {
  if (!report) return null;

  // Check if this is an AQL method report
  if (report.inspectionMethod !== "AQL") {
    return {
      isAQL: false,
      message:
        "This report uses Fixed Qty method, not AQL. AQL calculation is not applicable.",
      inspectionMethod: report.inspectionMethod,
    };
  }

  const { defectData, buyer, inspectionDetails } = report;
  const inspectedQty = inspectionDetails?.inspectedQty || 0;

  if (!buyer) {
    return {
      isAQL: true,
      error: true,
      message: "Buyer information is missing from this report.",
    };
  }

  if (!inspectedQty || inspectedQty <= 0) {
    return {
      isAQL: true,
      error: true,
      message: "Inspected quantity is missing or invalid.",
    };
  }

  // ✅ FIXED: Fetch AQL config from QASectionsAqlBuyerConfig
  const aqlConfig = await fetchAQLConfigForBuyer(buyer, inspectedQty);

  if (aqlConfig.error) {
    return {
      isAQL: true,
      error: true,
      message: aqlConfig.message,
    };
  }

  // Calculate defect totals
  const { totals, defectsList } = calculateDefectTotals(defectData);

  // Determine status for each severity
  const getStatus = (count, sample) => {
    if (!sample || sample.Ac === null || sample.Ac === undefined) {
      return { status: "N/A", reason: "No AQL config for this level" };
    }
    if (count <= sample.Ac) {
      return { status: "PASS", reason: `${count} ≤ ${sample.Ac} (Ac)` };
    } else {
      return { status: "FAIL", reason: `${count} ≥ ${sample.Re} (Re)` };
    }
  };

  const minorResult = getStatus(totals.minor, aqlConfig.minor);
  const majorResult = getStatus(totals.major, aqlConfig.major);
  const criticalResult = getStatus(totals.critical, aqlConfig.critical);

  const hasAnyFail =
    minorResult.status === "FAIL" ||
    majorResult.status === "FAIL" ||
    criticalResult.status === "FAIL";

  return {
    isAQL: true,
    reportId: report.reportId,
    buyer: report.buyer,
    inspectedQty,
    aqlConfig: {
      inspectionType: aqlConfig.inspectionType,
      level: aqlConfig.level,
      batch: aqlConfig.batch,
      sampleLetter: aqlConfig.sampleLetter,
      sampleSize: aqlConfig.sampleSize,
      minorAQL: aqlConfig.minorAQL,
      majorAQL: aqlConfig.majorAQL,
      criticalAQL: aqlConfig.criticalAQL,
    },
    defectTotals: totals,
    defectsList,
    results: {
      minor: {
        count: totals.minor,
        ac: aqlConfig.minor?.Ac || null,
        re: aqlConfig.minor?.Re || null,
        ...minorResult,
      },
      major: {
        count: totals.major,
        ac: aqlConfig.major?.Ac || null,
        re: aqlConfig.major?.Re || null,
        ...majorResult,
      },
      critical: {
        count: totals.critical,
        ac: aqlConfig.critical?.Ac || null,
        re: aqlConfig.critical?.Re || null,
        ...criticalResult,
      },
    },
    finalResult: hasAnyFail ? "FAIL" : "PASS",
    finalMessage: hasAnyFail
      ? "❌ INSPECTION FAILED - One or more severity levels exceeded acceptance criteria"
      : "✅ INSPECTION PASSED - All severity levels within acceptance criteria",
  };
};

/**
 * Get defect summary by group (configuration)
 */
const getDefectSummaryByGroup = (report) => {
  if (!report || !report.defectData) return null;

  const groupsMap = {};
  const { inspectionConfig, defectData } = report;

  // Pre-fill from config groups if available
  if (inspectionConfig?.configGroups) {
    inspectionConfig.configGroups.forEach((group, idx) => {
      const configKey = group.id ? String(group.id) : `conf_${idx}`;
      let label = "";
      if (group.lineName || group.line)
        label += `Line ${group.lineName || group.line}`;
      if (group.tableName || group.table)
        label +=
          (label ? " • " : "") + `Table ${group.tableName || group.table}`;
      if (group.colorName || group.color)
        label += (label ? " • " : "") + (group.colorName || group.color);

      groupsMap[configKey] = {
        configKey,
        configLabel: label || "General",
        lineName: group.lineName || group.line,
        tableName: group.tableName || group.table,
        colorName: group.colorName || group.color,
        defects: [],
        totals: { minor: 0, major: 0, critical: 0, total: 0 },
      };
    });
  }

  // Process defects
  defectData.forEach((defect) => {
    const configKey = defect.groupId ? String(defect.groupId) : "legacy";

    if (!groupsMap[configKey]) {
      let label = "";
      if (defect.lineName) label += `Line ${defect.lineName}`;
      if (defect.tableName)
        label += (label ? " • " : "") + `Table ${defect.tableName}`;
      if (defect.colorName) label += (label ? " • " : "") + defect.colorName;

      groupsMap[configKey] = {
        configKey,
        configLabel: label || "Unknown",
        lineName: defect.lineName,
        tableName: defect.tableName,
        colorName: defect.colorName,
        defects: [],
        totals: { minor: 0, major: 0, critical: 0, total: 0 },
      };
    }

    const group = groupsMap[configKey];
    let minor = 0,
      major = 0,
      critical = 0,
      total = 0;

    if (defect.isNoLocation) {
      const status = defect.status?.toLowerCase();
      const qty = defect.qty || 1;
      if (status === "minor") minor += qty;
      else if (status === "major") major += qty;
      else if (status === "critical") critical += qty;
      total += qty;
    } else if (defect.locations) {
      defect.locations.forEach((loc) => {
        if (loc.positions) {
          loc.positions.forEach((pos) => {
            const status = pos.status?.toLowerCase();
            if (status === "minor") minor += 1;
            else if (status === "major") major += 1;
            else if (status === "critical") critical += 1;
            total += 1;
          });
        }
      });
    }

    group.defects.push({
      defectCode: defect.defectCode,
      defectName: defect.defectName,
      minor,
      major,
      critical,
      total,
    });

    group.totals.minor += minor;
    group.totals.major += major;
    group.totals.critical += critical;
    group.totals.total += total;
  });

  return Object.values(groupsMap);
};

// ============================================================================
// MEASUREMENT SUMMARY HELPERS - NEW
// ============================================================================

/**
 * Check if a measured value is within tolerance
 */
const checkToleranceStatus = (measuredDecimal, tolMinus, tolPlus) => {
  if (
    measuredDecimal === null ||
    measuredDecimal === undefined ||
    isNaN(measuredDecimal)
  ) {
    return { status: "N/A", withinTolerance: null };
  }

  const tolMinusDecimal = parseFloat(tolMinus?.decimal) || 0;
  const tolPlusDecimal = parseFloat(tolPlus?.decimal) || 0;

  const lowerLimit = -Math.abs(tolMinusDecimal);
  const upperLimit = Math.abs(tolPlusDecimal);
  const epsilon = 0.0001;

  const isWithin =
    measuredDecimal >= lowerLimit - epsilon &&
    measuredDecimal <= upperLimit + epsilon;

  return {
    status: isWithin ? "PASS" : "FAIL",
    withinTolerance: isWithin,
    deviation: isWithin
      ? 0
      : measuredDecimal < lowerLimit
        ? measuredDecimal - lowerLimit
        : measuredDecimal - upperLimit,
  };
};

/**
 * Get measurement summary for a style with tolerance analysis
 */
const getMeasurementSummaryForStyle = async (
  styleNo,
  reportType = null,
  stage = "All",
) => {
  try {
    if (!styleNo) {
      return { error: true, message: "Style number is required" };
    }

    // 1. Fetch DtOrder for SizeList
    const dtOrder = await DtOrder.findOne({
      Order_No: { $regex: new RegExp(`^${styleNo}$`, "i") },
    })
      .select("SizeList OrderColors")
      .lean();

    const sizeList = dtOrder?.SizeList || [];

    if (sizeList.length === 0) {
      return {
        error: true,
        message: `No size list found for style: ${styleNo}`,
      };
    }

    // 2. Fetch Measurement Specs
    const specsRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${styleNo}$`, "i") },
    }).lean();

    if (!specsRecord) {
      return {
        error: true,
        message: `No measurement specs found for style: ${styleNo}`,
      };
    }

    // Get all specs based on stage
    let allSpecs = [];
    if (stage === "All" || stage === "Before") {
      allSpecs = [...allSpecs, ...(specsRecord.AllBeforeWashSpecs || [])];
    }
    if (stage === "All" || stage === "After") {
      allSpecs = [...allSpecs, ...(specsRecord.AllAfterWashSpecs || [])];
    }

    // Get critical specs
    const criticalPointNames = new Set();
    const beforeCritSpecs = specsRecord.selectedBeforeWashSpecs || [];
    const afterCritSpecs = specsRecord.selectedAfterWashSpecs || [];
    [...beforeCritSpecs, ...afterCritSpecs].forEach((s) => {
      const name = (s.MeasurementPointEngName || s.name || "").trim();
      if (name) criticalPointNames.add(name);
    });

    // Build spec lookup maps
    const specIdToInfo = new Map();
    const pointNameToSpec = new Map();
    const allPointNames = new Set();

    allSpecs.forEach((s) => {
      const id = s.id || s._id?.toString();
      const name = (s.MeasurementPointEngName || s.name || "").trim();
      if (!name) return;

      specIdToInfo.set(id, {
        id,
        name,
        TolMinus: s.TolMinus,
        TolPlus: s.TolPlus,
        sizeSpecs: {}, // Will store spec values per size
      });

      allPointNames.add(name);

      if (!pointNameToSpec.has(name)) {
        pointNameToSpec.set(name, {
          name,
          TolMinus: s.TolMinus,
          TolPlus: s.TolPlus,
          isCritical: criticalPointNames.has(name),
        });
      }

      // Extract size-specific spec values
      sizeList.forEach((size) => {
        if (s[size]) {
          specIdToInfo.get(id).sizeSpecs[size] = s[size];
        }
      });
    });

    // 3. Query Reports
    const query = {
      orderNos: styleNo,
      status: { $ne: "cancelled" },
    };

    if (reportType && reportType !== "All") {
      query.reportType = reportType;
    }

    const reports = await FincheckInspectionReports.find(query)
      .select("reportId reportType inspectionDate measurementData")
      .sort({ inspectionDate: -1 })
      .lean();

    if (reports.length === 0) {
      return {
        error: false,
        styleNo,
        sizeList,
        message: `No inspection reports found for style: ${styleNo}`,
        measurementPoints: [],
        totalReports: 0,
      };
    }

    // 4. Aggregate Measurements
    const aggregatedData = {};

    reports.forEach((report) => {
      if (!report.measurementData || !Array.isArray(report.measurementData))
        return;

      report.measurementData.forEach((m) => {
        if (m.size === "Manual_Entry") return;

        const measurementStage = m.stage || "Before";
        if (stage !== "All" && measurementStage !== stage) return;

        const size = m.size;
        const validAllIndices = Array.isArray(m.allEnabledPcs)
          ? m.allEnabledPcs
          : [];
        const validCritIndices = Array.isArray(m.criticalEnabledPcs)
          ? m.criticalEnabledPcs
          : [];

        // Process allMeasurements
        const processMeasurements = (measurements, validIndices) => {
          if (!measurements || typeof measurements !== "object") return;

          Object.entries(measurements).forEach(([specId, pcsData]) => {
            const specInfo = specIdToInfo.get(specId);
            if (!specInfo) return;

            const pointName = specInfo.name;
            const specData = pointNameToSpec.get(pointName);
            if (!specData) return;

            if (!aggregatedData[pointName]) {
              aggregatedData[pointName] = {
                name: pointName,
                tolMinus: specData.TolMinus?.fraction || "-",
                tolMinusDecimal: parseFloat(specData.TolMinus?.decimal) || 0,
                tolPlus: specData.TolPlus?.fraction || "-",
                tolPlusDecimal: parseFloat(specData.TolPlus?.decimal) || 0,
                isCritical: specData.isCritical,
                sizeData: {},
              };
            }

            if (!aggregatedData[pointName].sizeData[size]) {
              aggregatedData[pointName].sizeData[size] = {
                measurements: [],
                pass: 0,
                fail: 0,
                total: 0,
              };
            }

            validIndices.forEach((pcsIndex) => {
              const valObj = pcsData[pcsIndex];
              if (!valObj || valObj.decimal === undefined) return;

              const decimal = parseFloat(valObj.decimal);
              const fraction = valObj.fraction || String(decimal);
              const tolCheck = checkToleranceStatus(
                decimal,
                specData.TolMinus,
                specData.TolPlus,
              );

              aggregatedData[pointName].sizeData[size].measurements.push({
                decimal,
                fraction,
                status: tolCheck.status,
                withinTolerance: tolCheck.withinTolerance,
                reportId: report.reportId,
              });

              aggregatedData[pointName].sizeData[size].total += 1;
              if (tolCheck.withinTolerance === true) {
                aggregatedData[pointName].sizeData[size].pass += 1;
              } else if (tolCheck.withinTolerance === false) {
                aggregatedData[pointName].sizeData[size].fail += 1;
              }
            });
          });
        };

        processMeasurements(m.allMeasurements, validAllIndices);
        processMeasurements(m.criticalMeasurements, validCritIndices);
      });
    });

    // 5. Format response for AI
    const measurementPoints = [];
    let totalPass = 0;
    let totalFail = 0;
    let totalMeasurements = 0;

    Object.values(aggregatedData).forEach((point) => {
      const sizeResults = {};
      let pointPass = 0;
      let pointFail = 0;
      let pointTotal = 0;

      sizeList.forEach((size) => {
        const data = point.sizeData[size];
        if (data && data.total > 0) {
          // Get the most recent/representative value
          const lastMeasurement =
            data.measurements[data.measurements.length - 1];

          // Calculate average if multiple measurements
          const avgDecimal =
            data.measurements.reduce((sum, m) => sum + m.decimal, 0) /
            data.measurements.length;
          const avgTolCheck = checkToleranceStatus(
            avgDecimal,
            { decimal: point.tolMinusDecimal },
            { decimal: point.tolPlusDecimal },
          );

          sizeResults[size] = {
            value: lastMeasurement.fraction,
            decimal: lastMeasurement.decimal,
            status: lastMeasurement.status,
            statusIcon: lastMeasurement.withinTolerance ? "🟢" : "🔴",
            pass: data.pass,
            fail: data.fail,
            total: data.total,
            passRate: ((data.pass / data.total) * 100).toFixed(0) + "%",
            allValues: data.measurements.map((m) => ({
              value: m.fraction,
              status: m.status,
            })),
          };

          pointPass += data.pass;
          pointFail += data.fail;
          pointTotal += data.total;
        } else {
          sizeResults[size] = { value: "-", status: "N/A", statusIcon: "⚪" };
        }
      });

      measurementPoints.push({
        name: point.name,
        isCritical: point.isCritical,
        criticalIndicator: point.isCritical ? "⭐" : "",
        tolMinus: point.tolMinus,
        tolPlus: point.tolPlus,
        sizeResults,
        summary: {
          pass: pointPass,
          fail: pointFail,
          total: pointTotal,
          passRate:
            pointTotal > 0
              ? ((pointPass / pointTotal) * 100).toFixed(1) + "%"
              : "N/A",
        },
      });

      totalPass += pointPass;
      totalFail += pointFail;
      totalMeasurements += pointTotal;
    });

    // Sort: Critical first, then alphabetically
    measurementPoints.sort((a, b) => {
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;
      return a.name.localeCompare(b.name);
    });

    // 6. Build formatted table for AI response
    const tableHeader = `| ${point.isCritical ? "⭐ " : ""}Measurement Point | Tol- | Tol+ | ${sizeList.join(" | ")} | Pass Rate |`;
    const tableDivider = `|${"-".repeat(20)}|------|------|${sizeList.map(() => "------").join("|")}|----------|`;

    const formattedTable = {
      header: ["Measurement Point", "Tol-", "Tol+", ...sizeList, "Pass Rate"],
      rows: measurementPoints.map((point) => ({
        name: (point.isCritical ? "⭐ " : "") + point.name,
        tolMinus: point.tolMinus,
        tolPlus: point.tolPlus,
        sizes: sizeList.map((size) => {
          const data = point.sizeResults[size];
          return {
            display:
              data.value !== "-" ? `${data.statusIcon} ${data.value}` : "-",
            value: data.value,
            status: data.status,
          };
        }),
        passRate: point.summary.passRate,
      })),
    };

    return {
      error: false,
      styleNo,
      sizeList,
      stage:
        stage === "All"
          ? "All Stages"
          : stage === "Before"
            ? "Before Wash"
            : "After Wash/Buyer Spec",
      totalReports: reports.length,
      reportTypes: [...new Set(reports.map((r) => r.reportType))],
      measurementPoints,
      formattedTable,
      grandSummary: {
        totalMeasurements,
        totalPass,
        totalFail,
        overallPassRate:
          totalMeasurements > 0
            ? ((totalPass / totalMeasurements) * 100).toFixed(1) + "%"
            : "N/A",
        status:
          totalFail === 0
            ? "✅ ALL PASS"
            : totalPass === 0
              ? "❌ ALL FAIL"
              : "⚠️ MIXED",
      },
      // Markdown formatted summary for AI to display
      markdownSummary: generateMeasurementMarkdown(
        styleNo,
        sizeList,
        measurementPoints,
        stage,
        reports.length,
        totalPass,
        totalFail,
        totalMeasurements,
      ),
    };
  } catch (error) {
    console.error("Error in getMeasurementSummaryForStyle:", error);
    return {
      error: true,
      message: `Error fetching measurement data: ${error.message}`,
    };
  }
};

/**
 * Generate markdown table for measurement summary
 */
const generateMeasurementMarkdown = (
  styleNo,
  sizeList,
  measurementPoints,
  stage,
  totalReports,
  totalPass,
  totalFail,
  totalMeasurements,
) => {
  let markdown = `## 📏 Measurement Summary for Style: ${styleNo}\n\n`;
  markdown += `**Stage:** ${stage === "All" ? "All Stages" : stage}\n`;
  markdown += `**Reports Analyzed:** ${totalReports}\n\n`;

  // Table header
  markdown += `| Measurement Point | Tol- | Tol+ |`;
  sizeList.forEach((size) => {
    markdown += ` ${size} |`;
  });
  markdown += ` Status |\n`;

  // Table divider
  markdown += `|:-----------------|:----:|:----:|`;
  sizeList.forEach(() => {
    markdown += `:------:|`;
  });
  markdown += `:------:|\n`;

  // Table rows
  measurementPoints.forEach((point) => {
    const criticalMarker = point.isCritical ? "⭐ " : "";
    markdown += `| ${criticalMarker}${point.name} | ${point.tolMinus} | ${point.tolPlus} |`;

    sizeList.forEach((size) => {
      const data = point.sizeResults[size];
      if (data && data.value !== "-") {
        markdown += ` ${data.statusIcon} ${data.value} |`;
      } else {
        markdown += ` - |`;
      }
    });

    markdown += ` ${point.summary.passRate} |\n`;
  });

  // Summary
  markdown += `\n### Summary\n`;
  markdown += `- **Total Measurements:** ${totalMeasurements}\n`;
  markdown += `- **Pass:** ${totalPass} 🟢\n`;
  markdown += `- **Fail:** ${totalFail} 🔴\n`;
  markdown += `- **Overall Pass Rate:** ${totalMeasurements > 0 ? ((totalPass / totalMeasurements) * 100).toFixed(1) + "%" : "N/A"}\n`;

  if (totalFail > 0) {
    markdown += `\n⚠️ **Attention Required:** ${totalFail} measurements are out of tolerance.\n`;
  } else if (totalMeasurements > 0) {
    markdown += `\n✅ **All measurements are within tolerance.**\n`;
  }

  // Legend
  markdown += `\n**Legend:** 🟢 = Within Tolerance | 🔴 = Out of Tolerance | ⭐ = Critical Measurement Point\n`;

  return markdown;
};

/**
 * Get detailed measurement data for a specific report
 */
const getMeasurementDetailsForReport = async (reportId) => {
  try {
    const report = await FincheckInspectionReports.findOne({
      reportId: parseInt(reportId),
    })
      .select(
        "reportId orderNos measurementData inspectionDate reportType buyer empName",
      )
      .lean();

    if (!report) {
      return { error: true, message: `Report ${reportId} not found` };
    }

    if (!report.measurementData || report.measurementData.length === 0) {
      return {
        error: false,
        reportId: report.reportId,
        message: "No measurement data recorded for this report",
        hasMeasurements: false,
      };
    }

    const styleNo = report.orderNos?.[0];
    if (!styleNo) {
      return { error: true, message: "No style number found in report" };
    }

    // Get specs
    const specsRecord = await QASectionsMeasurementSpecs.findOne({
      Order_No: { $regex: new RegExp(`^${styleNo}$`, "i") },
    }).lean();

    const specIdToInfo = new Map();
    const allSpecs = [
      ...(specsRecord?.AllBeforeWashSpecs || []),
      ...(specsRecord?.AllAfterWashSpecs || []),
    ];

    allSpecs.forEach((s) => {
      const id = s.id || s._id?.toString();
      const name = (s.MeasurementPointEngName || s.name || "").trim();
      if (name) {
        specIdToInfo.set(id, {
          name,
          TolMinus: s.TolMinus,
          TolPlus: s.TolPlus,
        });
      }
    });

    // Process measurements
    const measurementGroups = [];

    report.measurementData.forEach((m) => {
      if (m.size === "Manual_Entry") return;

      const groupData = {
        stage: m.stage || "Before",
        stageLabel:
          m.stage === "After" ? "After Wash/Buyer Spec" : "Before Wash",
        size: m.size,
        line: m.lineName || m.line || "-",
        table: m.tableName || m.table || "-",
        color: m.colorName || m.color || "-",
        kValue: m.kValue || "-",
        inspectorDecision: m.inspectorDecision || "pending",
        measurements: [],
      };

      const validAllIndices = Array.isArray(m.allEnabledPcs)
        ? m.allEnabledPcs
        : [];

      if (m.allMeasurements && typeof m.allMeasurements === "object") {
        Object.entries(m.allMeasurements).forEach(([specId, pcsData]) => {
          const specInfo = specIdToInfo.get(specId);
          if (!specInfo) return;

          validAllIndices.forEach((pcsIndex) => {
            const valObj = pcsData[pcsIndex];
            if (!valObj || valObj.decimal === undefined) return;

            const decimal = parseFloat(valObj.decimal);
            const fraction = valObj.fraction || String(decimal);
            const tolCheck = checkToleranceStatus(
              decimal,
              specInfo.TolMinus,
              specInfo.TolPlus,
            );

            groupData.measurements.push({
              pointName: specInfo.name,
              pcsNo: pcsIndex + 1,
              value: fraction,
              decimal,
              tolMinus: specInfo.TolMinus?.fraction || "-",
              tolPlus: specInfo.TolPlus?.fraction || "-",
              status: tolCheck.status,
              statusIcon: tolCheck.withinTolerance ? "🟢" : "🔴",
            });
          });
        });
      }

      if (groupData.measurements.length > 0) {
        measurementGroups.push(groupData);
      }
    });

    return {
      error: false,
      reportId: report.reportId,
      styleNo,
      inspectionDate: report.inspectionDate,
      reportType: report.reportType,
      buyer: report.buyer,
      inspector: report.empName,
      hasMeasurements: true,
      measurementGroups,
      totalMeasurements: measurementGroups.reduce(
        (sum, g) => sum + g.measurements.length,
        0,
      ),
    };
  } catch (error) {
    console.error("Error in getMeasurementDetailsForReport:", error);
    return { error: true, message: `Error: ${error.message}` };
  }
};

/**
 * Get measurement summary
 */
// const getMeasurementSummary = (report) => {
//   if (
//     !report ||
//     !report.measurementData ||
//     report.measurementData.length === 0
//   ) {
//     return { available: false };
//   }

//   const data = report.measurementData;
//   const byStage = { Before: [], After: [] };

//   data.forEach((m) => {
//     const stage = m.stage || "Before";
//     byStage[stage].push({
//       size: m.size,
//       decision: m.inspectorDecision,
//       systemDecision: m.systemDecision,
//       line: m.lineName,
//       table: m.tableName,
//       color: m.colorName,
//     });
//   });

//   const totalMeasurements = data.length;
//   const passCount = data.filter((m) => m.inspectorDecision === "pass").length;
//   const failCount = data.filter((m) => m.inspectorDecision === "fail").length;

//   return {
//     available: true,
//     method: report.measurementMethod,
//     totalMeasurements,
//     passCount,
//     failCount,
//     passRate:
//       totalMeasurements > 0
//         ? ((passCount / totalMeasurements) * 100).toFixed(1)
//         : 0,
//     byStage,
//   };
// };

/**
 * Build a smart query from AI request
 */
const buildSmartQuery = (queryParams) => {
  const query = {};
  const options = { limit: 200, sort: { inspectionDate: -1 } };

  Object.keys(queryParams).forEach((key) => {
    const value = queryParams[key];

    switch (key) {
      case "limit":
        options.limit = Math.min(parseInt(value) || 5, 20);
        break;
      case "sort":
        options.sort = value;
        break;
      case "reportId":
        query.reportId = parseInt(value);
        break;
      case "buyer":
        // Exact match or regex for partial match
        if (typeof value === "string") {
          query.buyer = { $regex: new RegExp(`^${value}$`, "i") }; // Case-insensitive exact match
        }
        break;
      case "orderNo":
      case "orderNos":
        query.orderNos = { $in: Array.isArray(value) ? value : [value] };
        break;
      case "empId":
        query.empId = value;
        break;
      case "empName":
        query.empName = { $regex: value, $options: "i" };
        break;
      case "status":
        query.status = value;
        break;
      case "inspectionMethod":
        query.inspectionMethod = value;
        break;
      case "inspectionType":
        query.inspectionType = value;
        break;
      case "productType":
        query.productType = { $regex: value, $options: "i" };
        break;
      case "factory":
        query["inspectionDetails.factory"] = { $regex: value, $options: "i" };
        break;
      case "supplier":
        query["inspectionDetails.supplier"] = { $regex: value, $options: "i" };
        break;
      case "custStyle":
        query["inspectionDetails.custStyle"] = { $regex: value, $options: "i" };
        break;

      // Enhanced Date Handling
      case "today":
        if (value === true) {
          const { startOfDay, endOfDay } = getTodayDateRange();
          query.inspectionDate = { $gte: startOfDay, $lte: endOfDay };
        }
        break;
      case "thisWeek":
        if (value === true) {
          const { startOfWeek, endOfWeek } = getThisWeekDateRange();
          query.inspectionDate = { $gte: startOfWeek, $lte: endOfWeek };
        }
        break;
      case "last7days":
        if (value === true) {
          const { startDate, endDate } = getLastNDaysRange(7);
          query.inspectionDate = { $gte: startDate, $lte: endDate };
        }
        break;
      case "last30days":
        if (value === true) {
          const { startDate, endDate } = getLastNDaysRange(30);
          query.inspectionDate = { $gte: startDate, $lte: endDate };
        }
        break;

      case "inspectionDate":
        if (typeof value === "object") {
          query.inspectionDate = {};
          if (value.$gte) query.inspectionDate.$gte = new Date(value.$gte);
          if (value.$lte) query.inspectionDate.$lte = new Date(value.$lte);
        } else {
          query.inspectionDate = new Date(value);
        }
        break;
      case "dateFrom":
        query.inspectionDate = query.inspectionDate || {};
        query.inspectionDate.$gte = new Date(value);
        break;
      case "dateTo":
        query.inspectionDate = query.inspectionDate || {};
        query.inspectionDate.$lte = new Date(value);
        break;

      // Skip special flags
      case "defectAnalysis":
      case "aqlCalculation":
      case "measurementSummary":
      case "fullDetails":
        break;
      default:
        // Generic field match
        query[key] = value;
    }
  });

  return { query, options };
};

/**
 * Execute query and enrich with calculations
 */
const executeEnrichedQuery = async (queryParams) => {
  const { query, options } = buildSmartQuery(queryParams);

  // Determine what fields to select based on request
  let select =
    "reportId inspectionDate buyer orderNos orderNosString inspectionType status empId empName inspectionMethod measurementMethod productType reportType inspectionDetails defectData";

  if (queryParams.measurementSummary || queryParams.fullDetails) {
    select += " measurementData";
  }

  if (queryParams.fullDetails) {
    select += " inspectionConfig headerData photoData ppSheetData";
  }

  const reports = await FincheckInspectionReports.find(query)
    .select(select)
    .sort(options.sort)
    .limit(options.limit)
    .lean();

  // Enrich each report
  const enrichedReports = reports.map((report) => {
    const enriched = {
      ...report,
      // Clean up for AI
      inspectionDetails: {
        factory: report.inspectionDetails?.factory,
        supplier: report.inspectionDetails?.supplier,
        subConFactory: report.inspectionDetails?.subConFactory,
        inspectedQty: report.inspectionDetails?.inspectedQty,
        totalOrderQty: report.inspectionDetails?.totalOrderQty,
        cartonQty: report.inspectionDetails?.cartonQty,
        shippingStage: report.inspectionDetails?.shippingStage,
        custStyle: report.inspectionDetails?.custStyle,
        customer: report.inspectionDetails?.customer,
        aqlConfig: report.inspectionDetails?.aqlConfig,
        productionStatus: report.inspectionDetails?.productionStatus,
        packingList: report.inspectionDetails?.packingList,
        remarks: report.inspectionDetails?.remarks,
      },
    };

    // Calculate defect totals
    if (report.defectData && report.defectData.length > 0) {
      const { totals, defectsList } = calculateDefectTotals(report.defectData);
      enriched.defectSummary = {
        totals,
        defectsList,
        totalUniqueDefects: defectsList.length,
        totalDefectCount: totals.total,
      };
    } else {
      enriched.defectSummary = {
        totals: { minor: 0, major: 0, critical: 0, total: 0 },
        defectsList: [],
        totalUniqueDefects: 0,
        totalDefectCount: 0,
      };
    }

    // AQL calculation if requested or if AQL method
    if (queryParams.aqlCalculation || report.inspectionMethod === "AQL") {
      enriched.aqlResult = calculateAQLResult(report);
    }

    // Defect by group if requested
    if (queryParams.defectAnalysis) {
      enriched.defectsByGroup = getDefectSummaryByGroup(report);
    }

    // Measurement summary (basic)
    if (report.measurementData && report.measurementData.length > 0) {
      const totalMeasurements = report.measurementData.filter(
        (m) => m.size !== "Manual_Entry",
      ).length;
      const passCount = report.measurementData.filter(
        (m) => m.inspectorDecision === "pass",
      ).length;
      const failCount = report.measurementData.filter(
        (m) => m.inspectorDecision === "fail",
      ).length;

      enriched.measurementSummary = {
        hasMeasurements: true,
        totalMeasurements,
        passCount,
        failCount,
        passRate:
          totalMeasurements > 0
            ? ((passCount / totalMeasurements) * 100).toFixed(1) + "%"
            : "N/A",
      };
    } else {
      enriched.measurementSummary = { hasMeasurements: false };
    }

    // Remove raw arrays to reduce token size unless full details requested
    if (!queryParams.fullDetails) {
      delete enriched.defectData;
      delete enriched.measurementData;
    }

    return enriched;
  });

  return enrichedReports;
};

/**
 * Execute a function request
 */
const executeFunction = async (funcName, params) => {
  switch (funcName) {
    case "calculateAQL": {
      const report = await FincheckInspectionReports.findOne({
        reportId: parseInt(params.reportId),
      })
        .select("reportId inspectionMethod defectData inspectionDetails")
        .lean();

      if (!report) {
        return { error: `Report ${params.reportId} not found` };
      }
      return calculateAQLResult(report);
    }

    case "getDefectSummary": {
      const report = await FincheckInspectionReports.findOne({
        reportId: parseInt(params.reportId),
      })
        .select("reportId defectData inspectionConfig")
        .lean();

      if (!report) {
        return { error: `Report ${params.reportId} not found` };
      }
      return {
        reportId: report.reportId,
        summary: getDefectSummaryByGroup(report),
      };
    }

    case "getMeasurementSummary": {
      const styleNo = params.styleNo || params.style || params.orderNo;
      const reportType = params.reportType || null;
      const stage = params.stage || "All";
      return await getMeasurementSummaryForStyle(styleNo, reportType, stage);
    }

    case "getMeasurementDetails": {
      return await getMeasurementDetailsForReport(params.reportId);
    }

    case "compareReports": {
      const reportIds = params.reportIds;
      const reports = await FincheckInspectionReports.find({
        reportId: { $in: reportIds.map((id) => parseInt(id)) },
      })
        .select(
          "reportId inspectionDate buyer inspectionMethod defectData inspectionDetails",
        )
        .lean();

      return reports.map((r) => ({
        reportId: r.reportId,
        inspectionDate: r.inspectionDate,
        buyer: r.buyer,
        inspectionMethod: r.inspectionMethod,
        defectSummary: calculateDefectTotals(r.defectData),
        aqlResult: r.inspectionMethod === "AQL" ? calculateAQLResult(r) : null,
      }));
    }

    case "getInspectorStats": {
      const dateFilter = {};
      if (params.dateRange === "last30days") {
        dateFilter.$gte = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      } else if (params.dateRange === "last7days") {
        dateFilter.$gte = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      }

      const query = { empId: params.empId };
      if (Object.keys(dateFilter).length > 0) {
        query.inspectionDate = dateFilter;
      }

      const reports = await FincheckInspectionReports.find(query)
        .select("reportId inspectionDate status inspectionMethod defectData")
        .lean();

      let totalDefects = 0;
      let totalMinor = 0;
      let totalMajor = 0;
      let totalCritical = 0;

      reports.forEach((r) => {
        const { totals } = calculateDefectTotals(r.defectData);
        totalDefects += totals.total;
        totalMinor += totals.minor;
        totalMajor += totals.major;
        totalCritical += totals.critical;
      });

      return {
        empId: params.empId,
        totalReports: reports.length,
        statusBreakdown: {
          completed: reports.filter((r) => r.status === "completed").length,
          draft: reports.filter((r) => r.status === "draft").length,
          in_progress: reports.filter((r) => r.status === "in_progress").length,
        },
        totalDefectsFound: totalDefects,
        defectBreakdown: {
          minor: totalMinor,
          major: totalMajor,
          critical: totalCritical,
        },
      };
    }

    default:
      return { error: `Unknown function: ${funcName}` };
  }
};

/**
 * Parse AI response for QUERY or FUNCTION requests
 */
const parseAIRequest = (responseText) => {
  const trimmed = responseText.trim();

  // Check for QUERY
  if (trimmed.startsWith("QUERY:")) {
    try {
      const jsonStr = trimmed.replace("QUERY:", "").trim();
      // Handle potential markdown code blocks
      const cleanJson = jsonStr
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      return { type: "QUERY", params: JSON.parse(cleanJson) };
    } catch (e) {
      console.error("Failed to parse QUERY:", e);
      return null;
    }
  }

  // Check for FUNCTION
  if (trimmed.startsWith("FUNCTION:")) {
    try {
      const funcStr = trimmed.replace("FUNCTION:", "").trim();
      // Parse function name and params: functionName(param: value, ...)
      const match = funcStr.match(/(\w+)\((.*)\)/);
      if (match) {
        const funcName = match[1];
        const paramsStr = match[2];
        const params = {};

        // Parse key: value pairs
        paramsStr.split(",").forEach((pair) => {
          const colonIndex = pair.indexOf(":");
          if (colonIndex > -1) {
            const key = pair.substring(0, colonIndex).trim();
            const val = pair.substring(colonIndex + 1).trim();
            try {
              params[key] = JSON.parse(val);
            } catch {
              params[key] = val.replace(/['"]/g, "");
            }
          }
        });

        // paramsStr.split(",").forEach((pair) => {
        //   const [key, val] = pair.split(":").map((s) => s.trim());
        //   if (key && val) {
        //     // Try to parse as JSON, fallback to string
        //     try {
        //       params[key] = JSON.parse(val);
        //     } catch {
        //       params[key] = val.replace(/['"]/g, "");
        //     }
        //   }
        // });

        return { type: "FUNCTION", name: funcName, params };
      }
    } catch (e) {
      console.error("Failed to parse FUNCTION:", e);
      return null;
    }
  }

  return null;
};

/**
 * Check if error is a rate limit error
 */
const isRateLimitError = (error) => {
  const errorMessage = error?.message?.toLowerCase() || "";
  const errorStatus = error?.status || error?.response?.status;

  return (
    errorStatus === 429 ||
    errorMessage.includes("429") ||
    errorMessage.includes("rate_limit") ||
    errorMessage.includes("rate limit") ||
    errorMessage.includes("quota") ||
    errorMessage.includes("resource_exhausted") ||
    errorMessage.includes("too many requests")
  );
};

/**
 * Call Groq API
 */
const callGroqAPI = async (messages, systemInstruction) => {
  if (!groq) {
    throw new Error("Groq API key not configured");
  }

  console.log("🤖 Using Groq API (openai/gpt-oss-120b)");

  // Convert messages to Groq format
  const groqMessages = [
    {
      role: "system",
      content: systemInstruction,
    },
    ...messages.map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    })),
  ];

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b", // Your specified model
    messages: groqMessages,
    temperature: 0.7,
    max_tokens: 4096,
    top_p: 0.9,
  });

  return completion.choices[0]?.message?.content || "";
};

/**
 * Send follow-up message to Groq
 */
const sendGroqFollowUp = async (allMessages, followUpPrompt) => {
  const messagesWithFollowUp = [
    ...allMessages.map((msg) => ({
      role: msg.role === "user" ? "user" : "assistant",
      content: msg.content,
    })),
    {
      role: "user",
      content: followUpPrompt,
    },
  ];

  const groqMessages = [
    {
      role: "system",
      content: SYSTEM_INSTRUCTION,
    },
    ...messagesWithFollowUp,
  ];

  const completion = await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",
    messages: groqMessages,
    temperature: 0.7,
    max_tokens: 4096,
    top_p: 0.9,
  });

  return completion.choices[0]?.message?.content || "";
};

/**
 * Generate title using Groq
 */
const generateTitleWithGroq = async (message) => {
  try {
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "user",
          content: `Based on this question: "${message.substring(0, 100)}", generate a very short title (max 35 chars) for this conversation. Just respond with the title, nothing else.`,
        },
      ],
      temperature: 0.7,
      max_tokens: 50,
    });
    return (
      completion.choices[0]?.message?.content?.trim().replace(/"/g, "") ||
      message.substring(0, 35) + "..."
    );
  } catch {
    return message.substring(0, 35) + "...";
  }
};

// ============================================================================
// API ENDPOINTS
// ============================================================================

// --- 1. Create Chat ---
export const createChat = async (req, res) => {
  try {
    const { empId, initialMessage } = req.body;
    const newChat = new FincheckAIChat({
      empId,
      title: initialMessage
        ? initialMessage.substring(0, 40) +
          (initialMessage.length > 40 ? "..." : "")
        : "New Conversation",
      messages: [],
    });
    await newChat.save();
    return res.status(200).json({ success: true, data: newChat });
  } catch (error) {
    console.error("Create Chat Error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- 2. Get User's Chats ---
export const getUserChats = async (req, res) => {
  try {
    const { empId } = req.query;
    const chats = await FincheckAIChat.find({ empId, isDeleted: false })
      .select("title updatedAt createdAt")
      .sort({ updatedAt: -1 });
    return res.status(200).json({ success: true, data: chats });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- 3. Get Chat By ID ---
export const getChatById = async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await FincheckAIChat.findById(chatId);
    if (!chat) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });
    }
    return res.status(200).json({ success: true, data: chat });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- 4. Send Message (Main AI Logic) ---
export const sendMessage = async (req, res) => {
  try {
    const { chatId, message } = req.body;

    // Check if at least one API key is configured
    if (!GEMINI_API_KEY && !GROQ_API_KEY) {
      return res
        .status(500)
        .json({ success: false, error: "No API Key configured" });
    }

    const chat = await FincheckAIChat.findById(chatId);
    if (!chat) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });
    }

    // 1. Add User Message
    chat.messages.push({ role: "user", content: message });

    // 2. Preprocess message for date keywords
    let enhancedMessage = message;
    const lowerMsg = message.toLowerCase();

    if (lowerMsg.includes("today") && !lowerMsg.includes("yesterday")) {
      enhancedMessage += `\n\n[SYSTEM HINT: For "today", use this query: {"today": true}]`;
    } else if (lowerMsg.includes("this week")) {
      enhancedMessage += `\n\n[SYSTEM HINT: For "this week", use this query: {"thisWeek": true}]`;
    } else if (
      lowerMsg.includes("last 7 days") ||
      lowerMsg.includes("past week")
    ) {
      enhancedMessage += `\n\n[SYSTEM HINT: Use this query: {"last7days": true}]`;
    } else if (
      lowerMsg.includes("last month") ||
      lowerMsg.includes("last 30 days")
    ) {
      enhancedMessage += `\n\n[SYSTEM HINT: Use this query: {"last30days": true}]`;
    }

    // Measurement-specific hints
    if (
      lowerMsg.includes("measurement") &&
      (lowerMsg.includes("style") || lowerMsg.includes("order"))
    ) {
      const styleMatch = message.match(
        /(?:style|order)\s*[:#]?\s*([A-Z0-9-]+)/i,
      );
      if (styleMatch) {
        enhancedMessage += `\n\n[HINT: For measurement summary, use FUNCTION: getMeasurementSummary(styleNo: "${styleMatch[1]}")]`;
      }
    }

    // 3. Determine which model to use
    let useGroq = false;

    // Check if Gemini is in rate limit cooldown
    if (geminiRateLimitResetTime && Date.now() < geminiRateLimitResetTime) {
      console.log("⚠️ Gemini still in rate limit cooldown, using Groq");
      useGroq = true;
      currentModel = "groq";
    }

    let responseText = "";
    let chatSession = null;
    let usedModel = "gemini";

    // 4. First Call to AI
    if (!useGroq) {
      // TRY GEMINI FIRST
      try {
        console.log("🔷 Attempting Gemini API (gemini-3-flash-preview)...");

        // Prepare History for Gemini
        const history = chat.messages.slice(0, -1).map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        }));

        // Initialize Gemini Model
        const model = genAI.getGenerativeModel({
          model: "gemini-3-flash-preview",
          systemInstruction: SYSTEM_INSTRUCTION,
          generationConfig: {
            temperature: 0.7,
            topP: 0.9,
            topK: 40,
            maxOutputTokens: 4096,
          },
        });

        chatSession = model.startChat({ history });

        // Send message to Gemini
        const result = await chatSession.sendMessage(enhancedMessage);
        responseText = result.response.text();
        usedModel = "gemini";
        currentModel = "gemini";
        geminiRateLimitResetTime = null; // Reset on success

        console.log("✅ Gemini API responded successfully");
      } catch (geminiError) {
        console.error("❌ Gemini Error:", geminiError.message);

        // Check if rate limit error
        if (isRateLimitError(geminiError)) {
          console.log("🔄 Gemini rate limit hit! Switching to Groq...");
          useGroq = true;
          currentModel = "groq";
          // Set cooldown for 60 minutes
          geminiRateLimitResetTime = Date.now() + 60 * 60 * 1000;
        } else {
          // Non-rate-limit error, try Groq as backup
          console.log(
            "⚠️ Gemini failed with non-rate-limit error, trying Groq...",
          );
          useGroq = true;
        }
      }
    }

    // USE GROQ (either as fallback or primary if Gemini is rate limited)
    if (useGroq) {
      if (!groq) {
        return res.status(500).json({
          success: false,
          error: "Gemini API unavailable and Groq API key not configured",
        });
      }

      try {
        console.log("🟢 Using Groq API...");

        // Prepare messages for Groq (include enhanced message)
        const messagesForGroq = [
          ...chat.messages.slice(0, -1), // Previous messages
          { role: "user", content: enhancedMessage }, // Current message with hints
        ];

        responseText = await callGroqAPI(messagesForGroq, SYSTEM_INSTRUCTION);
        usedModel = "groq";

        console.log("✅ Groq API responded successfully");
      } catch (groqError) {
        console.error("❌ Groq Error:", groqError.message);
        return res.status(500).json({
          success: false,
          error: "Both AI services failed. Please try again later.",
          details:
            process.env.NODE_ENV === "development"
              ? groqError.message
              : undefined,
        });
      }
    }

    // 5. Check if AI wants data
    const aiRequest = parseAIRequest(responseText);

    if (aiRequest) {
      try {
        let dataResult;

        if (aiRequest.type === "QUERY") {
          console.log("📊 AI Requested QUERY:", aiRequest.params);
          dataResult = await executeEnrichedQuery(aiRequest.params);
        } else if (aiRequest.type === "FUNCTION") {
          console.log(
            `📊 AI Requested FUNCTION: ${aiRequest.name}`,
            aiRequest.params,
          );
          dataResult = await executeFunction(aiRequest.name, aiRequest.params);
        }

        //const dataString = JSON.stringify(dataResult, null, 2);

        // For measurement summary, use the markdown summary if available
        let dataString;
        if (
          aiRequest.type === "FUNCTION" &&
          aiRequest.name === "getMeasurementSummary" &&
          dataResult.markdownSummary
        ) {
          dataString = dataResult.markdownSummary;
        } else {
          dataString = JSON.stringify(dataResult, null, 2);
        }

        // Feed data back to AI
        const followUpPrompt = `
SYSTEM_DATA_RESULT:
${aiRequest.type === "FUNCTION" && aiRequest.name === "getMeasurementSummary" ? dataString : `\`\`\`json\n${dataString}\n\`\`\``}

**IMPORTANT INSTRUCTIONS:**
1. Analyze ONLY the data provided above
2. If the array is empty [], clearly state "No reports found matching your criteria"
3. DO NOT provide example or sample data
4. Show actual reportId, buyer, orderNos from the results
5. Format the response clearly with proper structure
6. For measurement tables, use the markdown format with emojis

Now provide a comprehensive, well-formatted answer to the user's original question: "${message}"

${aiRequest.type === "QUERY" && dataResult.length === 0 ? "\n⚠️ The query returned NO RESULTS. Inform the user clearly." : ""}
`;

        // Send follow-up based on which model we're using
        if (usedModel === "gemini" && chatSession) {
          const followUpResult = await chatSession.sendMessage(followUpPrompt);
          responseText = followUpResult.response.text();
        } else {
          // Use Groq for follow-up
          responseText = await sendGroqFollowUp(chat.messages, followUpPrompt);
        }
      } catch (dbError) {
        console.error("Data Fetch Error:", dbError);
        responseText = `I encountered an error while fetching data: ${dbError.message}. Please try rephrasing your question or provide more specific criteria.`;
      }
    }

    // 6. Save AI Response with metadata
    chat.messages.push({
      role: "model",
      content: responseText,
      metadata: {
        modelUsed: usedModel, // Track which model was used
        dataFetched: !!aiRequest,
        queryExecuted: aiRequest?.params || null,
        functionCalled: aiRequest?.type === "FUNCTION" ? aiRequest.name : null,
      },
    });

    // 7. Update Chat Title if new
    if (chat.messages.length <= 4 && chat.title === "New Conversation") {
      if (usedModel === "gemini" && chatSession) {
        const titlePrompt = `Based on this question: "${message.substring(0, 100)}", generate a very short title (max 35 chars) for this conversation. Just respond with the title, nothing else.`;
        try {
          const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
          });
          const titleResult = await model.generateContent(titlePrompt);
          const newTitle = titleResult.response.text().trim().replace(/"/g, "");
          chat.title = newTitle.substring(0, 40);
        } catch {
          chat.title = message.substring(0, 35) + "...";
        }
      } else {
        // Use Groq for title generation
        chat.title = await generateTitleWithGroq(message);
      }
    }

    chat.updatedAt = new Date();
    await chat.save();

    // Log which model was used (for debugging)
    console.log(`📤 Response sent using: ${usedModel.toUpperCase()}`);

    return res.status(200).json({ success: true, data: chat });
  } catch (error) {
    console.error("AI Error:", error);
    return res.status(500).json({
      success: false,
      error: "AI Service temporarily unavailable. Please try again.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// --- 5. Rename Chat ---
export const renameChat = async (req, res) => {
  try {
    const { chatId, newTitle } = req.body;
    await FincheckAIChat.findByIdAndUpdate(chatId, {
      title: newTitle,
      updatedAt: new Date(),
    });
    return res
      .status(200)
      .json({ success: true, message: "Chat renamed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- 6. Delete Chat ---
export const deleteChat = async (req, res) => {
  try {
    const { chatId } = req.body;
    await FincheckAIChat.findByIdAndUpdate(chatId, {
      isDeleted: true,
      updatedAt: new Date(),
    });
    return res
      .status(200)
      .json({ success: true, message: "Chat deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- 7. Clear Chat History (Keep chat, remove messages) ---
export const clearChatHistory = async (req, res) => {
  try {
    const { chatId } = req.body;
    await FincheckAIChat.findByIdAndUpdate(chatId, {
      messages: [],
      updatedAt: new Date(),
    });
    return res
      .status(200)
      .json({ success: true, message: "Chat history cleared" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- 8. Get Quick Stats (For AI Context) ---
export const getQuickStats = async (req, res) => {
  try {
    const { empId } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalReports, todayReports, pendingReports] = await Promise.all([
      FincheckInspectionReports.countDocuments(empId ? { empId } : {}),
      FincheckInspectionReports.countDocuments({
        ...(empId ? { empId } : {}),
        inspectionDate: { $gte: today },
      }),
      FincheckInspectionReports.countDocuments({
        ...(empId ? { empId } : {}),
        status: { $in: ["draft", "in_progress"] },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalReports,
        todayReports,
        pendingReports,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

export default {
  createChat,
  getUserChats,
  getChatById,
  sendMessage,
  renameChat,
  deleteChat,
  clearChatHistory,
  getQuickStats,
};

// --- Add Feedback to Message ---
export const addMessageFeedback = async (req, res) => {
  try {
    const { chatId, messageId, rating, comment } = req.body;

    const chat = await FincheckAIChat.findById(chatId);
    if (!chat) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });
    }

    const message = chat.messages.id(messageId);
    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    }

    message.feedback = {
      rating, // 'up' or 'down'
      comment,
      feedbackAt: new Date(),
    };

    await chat.save();

    return res.status(200).json({
      success: true,
      message: "Feedback recorded",
      data: { messageId, rating },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- Toggle Pin Chat ---
export const togglePinChat = async (req, res) => {
  try {
    const { chatId } = req.body;

    const chat = await FincheckAIChat.findById(chatId);
    if (!chat) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });
    }

    chat.isPinned = !chat.isPinned;
    await chat.save();

    return res.status(200).json({
      success: true,
      message: chat.isPinned ? "Chat pinned" : "Chat unpinned",
      data: { isPinned: chat.isPinned },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- Archive Chat ---
export const archiveChat = async (req, res) => {
  try {
    const { chatId } = req.body;

    await FincheckAIChat.findByIdAndUpdate(chatId, {
      isArchived: true,
      updatedAt: new Date(),
    });

    return res.status(200).json({ success: true, message: "Chat archived" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- Search Chats ---
export const searchChats = async (req, res) => {
  try {
    const { empId, query } = req.query;

    if (!query || query.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Search query must be at least 2 characters",
      });
    }

    const chats = await FincheckAIChat.find({
      empId,
      isDeleted: false,
      $or: [
        { title: { $regex: query, $options: "i" } },
        { tags: { $regex: query, $options: "i" } },
      ],
    })
      .select("title updatedAt isPinned tags stats")
      .sort({ isPinned: -1, lastActivityAt: -1 })
      .limit(20);

    return res.status(200).json({ success: true, data: chats });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- Get User AI Stats ---
export const getUserAIStats = async (req, res) => {
  try {
    const { empId } = req.query;

    const stats = await FincheckAIChat.aggregate([
      { $match: { empId, isDeleted: false } },
      {
        $group: {
          _id: null,
          totalChats: { $sum: 1 },
          totalMessages: { $sum: "$stats.messageCount" },
          totalQueries: { $sum: "$stats.queriesExecuted" },
          totalPositiveRatings: { $sum: "$stats.positiveRatings" },
          totalNegativeRatings: { $sum: "$stats.negativeRatings" },
          pinnedChats: {
            $sum: { $cond: [{ $eq: ["$isPinned", true] }, 1, 0] },
          },
        },
      },
    ]);

    const result = stats[0] || {
      totalChats: 0,
      totalMessages: 0,
      totalQueries: 0,
      totalPositiveRatings: 0,
      totalNegativeRatings: 0,
      pinnedChats: 0,
    };

    // Calculate satisfaction rate
    const totalRatings =
      result.totalPositiveRatings + result.totalNegativeRatings;
    result.satisfactionRate =
      totalRatings > 0
        ? ((result.totalPositiveRatings / totalRatings) * 100).toFixed(1)
        : null;

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- Add Tags to Chat ---
export const addChatTags = async (req, res) => {
  try {
    const { chatId, tags } = req.body;

    const chat = await FincheckAIChat.findById(chatId);
    if (!chat) {
      return res
        .status(404)
        .json({ success: false, message: "Chat not found" });
    }

    // Add unique tags
    const existingTags = new Set(chat.tags);
    tags.forEach((tag) => existingTags.add(tag.toLowerCase()));
    chat.tags = Array.from(existingTags);

    await chat.save();

    return res.status(200).json({
      success: true,
      message: "Tags added",
      data: { tags: chat.tags },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- Get Pinned Chats ---
export const getPinnedChats = async (req, res) => {
  try {
    const { empId } = req.query;

    const chats = await FincheckAIChat.find({
      empId,
      isPinned: true,
      isDeleted: false,
    })
      .select("title updatedAt tags stats")
      .sort({ lastActivityAt: -1 });

    return res.status(200).json({ success: true, data: chats });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// --- Get AI Status ---
export const getAIStatus = async (req, res) => {
  try {
    const cooldownMinutesRemaining = geminiRateLimitResetTime
      ? Math.max(
          0,
          Math.ceil((geminiRateLimitResetTime - Date.now()) / 1000 / 60),
        )
      : 0;

    return res.status(200).json({
      success: true,
      data: {
        currentModel,
        geminiAvailable:
          !geminiRateLimitResetTime || Date.now() >= geminiRateLimitResetTime,
        groqAvailable: !!GROQ_API_KEY,
        geminiCooldownMinutes: cooldownMinutesRemaining,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
