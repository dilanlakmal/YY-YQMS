import mongoose from "mongoose";

const createFincheckInspectionReportsModel = (connection) => {
  // 1. Sub-Schemas
  const AQLConfigItemSchema = new mongoose.Schema(
    {
      status: { type: String, enum: ["Minor", "Major", "Critical"] },
      // Ac/Re are whole numbers
      ac: { type: Number, default: 0 },
      re: { type: Number, default: 0 },
    },
    { _id: false },
  );

  const ProductionStatusSchema = new mongoose.Schema(
    {
      cutting: { type: Number, default: 0 },
      sewing: { type: Number, default: 0 },
      ironing: { type: Number, default: 0 },
      qc2FinishedChecking: { type: Number, default: 0 },
      folding: { type: Number, default: 0 },
      packing: { type: Number, default: 0 },
    },
    { _id: false },
  );

  const PackingListSchema = new mongoose.Schema(
    {
      totalCartons: { type: Number, default: 0 },
      totalPcs: { type: Number, default: 0 },
      finishedCartons: { type: Number, default: 0 },
      finishedPcs: { type: Number, default: 0 },
    },
    { _id: false },
  );

  // --- EMB Info Schemas ---
  const EMBNumericItemSchema = new mongoose.Schema(
    {
      value: { type: Number, default: 0 },
      enabled: { type: Boolean, default: true },
    },
    { _id: false },
  );

  const EMBInfoSchema = new mongoose.Schema(
    {
      speed: {
        type: EMBNumericItemSchema,
        default: () => ({ value: 0, enabled: true }),
      },
      stitch: {
        type: EMBNumericItemSchema,
        default: () => ({ value: 0, enabled: true }),
      },
      needleSize: {
        type: EMBNumericItemSchema,
        default: () => ({ value: 0, enabled: true }),
      },
      remarks: { type: String, default: "" },
    },
    { _id: false },
  );

  // --- Print Info Schemas ---
  // 1. For Machine Type (Auto/Manual) - String
  const PrintStringItemSchema = new mongoose.Schema(
    {
      value: { type: String, default: "Auto" },
      enabled: { type: Boolean, default: true },
    },
    { _id: false },
  );

  // 2. For Speed/Pressure - Number
  const PrintNumericItemSchema = new mongoose.Schema(
    {
      value: { type: Number, default: 0 },
      enabled: { type: Boolean, default: true },
    },
    { _id: false },
  );

  const PrintInfoSchema = new mongoose.Schema(
    {
      machineType: {
        type: PrintStringItemSchema,
        default: () => ({ value: "Auto", enabled: true }),
      },
      speed: {
        type: PrintNumericItemSchema,
        default: () => ({ value: 0, enabled: true }),
      },
      pressure: {
        type: PrintNumericItemSchema,
        default: () => ({ value: 0, enabled: true }),
      },
      remarks: { type: String, default: "" },
    },
    { _id: false },
  );

  // 2. Inspection Details Schema (Specifics)
  const InspectionDetailsSchema = new mongoose.Schema(
    {
      supplier: { type: String, default: "" },
      isSubCon: { type: Boolean, default: false },
      subConFactory: { type: String, default: "" },
      subConFactoryId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "SubconSewingFactory",
      },
      factory: { type: String, default: "" },

      inspectedQty: { type: Number, default: null },
      aqlSampleSize: { type: Number, default: 0 },
      cartonQty: { type: Number, default: null },
      shippingStage: { type: String, default: "" },
      remarks: { type: String, default: "" },

      totalOrderQty: { type: Number, default: 0 },
      custStyle: { type: String, default: "" },
      customer: { type: String, default: "" },

      // --- MODIFIED AQL CONFIG STRUCTURE ---
      aqlConfig: {
        inspectionType: { type: String, default: "" }, // e.g., "General"
        level: { type: String, default: "" }, // e.g., "II"

        // Specific Float Fields for AQL Levels
        minorAQL: { type: Number, default: 0 },
        majorAQL: { type: Number, default: 0 },
        criticalAQL: { type: Number, default: 0 },

        inspectedQty: { type: Number, default: 0 }, // e.g., 500
        batch: { type: String, default: "" }, // e.g., "501 ~ 1200"
        sampleLetter: { type: String, default: "" }, // e.g., "J"
        sampleSize: { type: Number, default: 0 }, // e.g., 80

        // Array for Ac/Re values
        items: [AQLConfigItemSchema],
      },

      productionStatus: { type: ProductionStatusSchema, default: () => ({}) },
      packingList: { type: PackingListSchema, default: () => ({}) },
      qualityPlanEnabled: { type: Boolean, default: false },
      embInfo: { type: EMBInfoSchema, default: null },
      printInfo: { type: PrintInfoSchema, default: null },
    },
    { _id: false },
  );

  // --- NEW: Header Data Schemas ---
  const HeaderImageSchema = new mongoose.Schema(
    {
      imageId: { type: String, required: true }, // Frontend ID for tracking
      imageURL: { type: String, required: true }, // Path: /storage/...
      uploadedAt: { type: Date, default: Date.now },
    },
    { _id: false },
  );

  const HeaderDataItemSchema = new mongoose.Schema(
    {
      headerId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Ref to QASectionsHome
      name: { type: String, required: true }, // Section Name
      selectedOption: { type: String, default: "" },
      remarks: { type: String, default: "" },
      images: [HeaderImageSchema],
    },
    { _id: false },
  );

  // --- Photo Data Schemas ---
  const PhotoImageSchema = new mongoose.Schema(
    {
      imageId: { type: String, required: true }, // Frontend ID or generated
      imageURL: { type: String, required: true }, // /storage/...
      uploadedAt: { type: Date, default: Date.now },
    },
    { _id: false },
  );

  const PhotoItemSchema = new mongoose.Schema(
    {
      itemNo: { type: Number, required: true },
      itemName: { type: String, required: true },
      remarks: { type: String, default: "" },
      images: [PhotoImageSchema],
    },
    { _id: false },
  );

  const PhotoSectionDataSchema = new mongoose.Schema(
    {
      sectionId: { type: mongoose.Schema.Types.ObjectId, required: true },
      sectionName: { type: String, required: true },
      items: [PhotoItemSchema],
    },
    { _id: false },
  );

  // Define the innermost assignment schema (Enforces Number on Qty)
  const InspectionAssignmentSchema = new mongoose.Schema(
    {
      // We explicitly define qty to force it to be a Number
      qty: { type: Number, default: 0 },
    },
    { _id: false, strict: false },
  );

  // Define the Group schema containing assignments
  const InspectionConfigGroupSchema = new mongoose.Schema(
    {
      assignments: [InspectionAssignmentSchema],
    },
    { _id: false, strict: false },
  );

  // --- Inspection Config Schema ---
  const InspectionConfigItemSchema = new mongoose.Schema(
    {
      reportName: { type: String, required: true },
      inspectionMethod: { type: String, default: "Fixed" }, // "AQL" or "Fixed"
      sampleSize: { type: Number, default: 0 }, // Total Calculated Qty
      // Stores the array of groups (Line, Table, Color, Assignments) dynamically
      configGroups: { type: [InspectionConfigGroupSchema], default: [] },
      //configGroups: { type: mongoose.Schema.Types.Mixed, default: [] },
      updatedAt: { type: Date, default: Date.now },
    },
    { _id: false },
  );

  // Define Sub-Schemas for Manual Data
  const MeasurementManualImageSchema = new mongoose.Schema(
    {
      imageId: { type: String, required: true },
      imageURL: { type: String, required: true },
      remark: { type: String, default: "" }, // Per-image remark (100 chars)
      uploadedAt: { type: Date, default: Date.now },
    },
    { _id: false },
  );

  const MeasurementManualDataSchema = new mongoose.Schema(
    {
      remarks: { type: String, default: "" }, // General remarks
      status: { type: String, default: "Pass" }, // Pass/Fail
      images: { type: [MeasurementManualImageSchema], default: [] },
    },
    { _id: false },
  );

  // --- Measurement Data Schema ---
  const MeasurementDataItemSchema = new mongoose.Schema(
    {
      // Context / Config Link
      groupId: { type: Number, required: true }, // Matches the ID from InspectionConfig

      // Distinguishes between Tab 1 and Tab 2 ***
      stage: { type: String, enum: ["Before", "After"], default: "Before" },

      // Scopes
      line: { type: String, default: "" },
      table: { type: String, default: "" },
      color: { type: String, default: "" },

      // Visual Helpers (Snapshot names in case config changes)
      lineName: { type: String, default: "" },
      tableName: { type: String, default: "" },
      colorName: { type: String, default: "" },
      qcUser: { type: mongoose.Schema.Types.Mixed, default: null }, // Stores QC Object

      // Measurement Context
      size: { type: String, required: true },
      kValue: { type: String, default: "" }, // For Before Wash
      displayMode: { type: String, default: "all" }, // "all" or "selected"

      // --- Heavy Data (Using Mixed for flexibility) ---
      // Structure: { [specId]: { [pcsIndex]: { decimal: 0, fraction: "0" } } }
      allMeasurements: { type: mongoose.Schema.Types.Mixed, default: {} },
      criticalMeasurements: { type: mongoose.Schema.Types.Mixed, default: {} },

      // Qty & Enabled Pieces (Stored as Arrays in DB, converted to Sets in Frontend)
      allQty: { type: Number, default: 1 },
      criticalQty: { type: Number, default: 2 },
      allEnabledPcs: { type: [Number], default: [] },
      criticalEnabledPcs: { type: [Number], default: [] },

      // Decisions & Metadata
      inspectorDecision: { type: String, default: "pass" },
      systemDecision: { type: String, default: "pending" },
      remark: { type: String, default: "" },
      manualData: { type: MeasurementManualDataSchema, default: null },
      timestamp: { type: Date, default: Date.now },
    },
    { _id: false },
  );

  // ===========================
  // DEFECT DATA SCHEMAS
  // ===========================

  // NEW: Image schema for position-level images
  const DefectPositionImageSchema = new mongoose.Schema(
    {
      imageId: { type: String, required: true },
      imageURL: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
    },
    { _id: false },
  );

  // UPDATED: Position details for a specific piece inside a Location
  const DefectLocationPositionSchema = new mongoose.Schema(
    {
      pcsNo: { type: Number, required: true },
      status: {
        type: String,
        enum: ["Minor", "Major", "Critical"],
        default: "Major",
      },

      // NEW: Required image for this piece (mandatory for validation)
      requiredImage: { type: DefectPositionImageSchema, default: null },

      // NEW: Additional remark for this specific piece (max 250 chars from frontend)
      additionalRemark: { type: String, default: "" },

      // NEW: Additional images for this piece (up to 5)
      additionalImages: {
        type: [DefectPositionImageSchema],
        default: [],
        validate: [
          (val) => val.length <= 5,
          "Maximum 5 additional images allowed",
        ],
      },

      // Legacy fields (kept for backward compatibility)
      position: { type: String, default: "Outside" },
      comment: { type: String, default: "" },
      qcUser: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    { _id: false },
  );

  // UPDATED: Main Defect Location Schema (removed location-level images)
  const DefectLocationSchema = new mongoose.Schema(
    {
      uniqueId: { type: String, required: true },
      locationId: { type: String, required: true },
      locationNo: { type: Number, required: true },
      locationName: { type: String, required: true },
      view: { type: String, required: true }, // "Front" or "Back"
      qty: { type: Number, default: 1 },
      positions: { type: [DefectLocationPositionSchema], default: [] },
      // NOTE: Removed 'images' array - images are now stored in positions
    },
    { _id: false },
  );

  // Image at Defect Level (for No-Location mode)
  const DefectImageSchema = new mongoose.Schema(
    {
      imageId: { type: String, required: true },
      imageURL: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
    },
    { _id: false },
  );

  // UPDATED: Individual Defect Item Schema
  const DefectItemSchema = new mongoose.Schema(
    {
      // Context
      groupId: { type: Number, required: true },

      // Defect Details
      defectId: { type: mongoose.Schema.Types.ObjectId, required: true },
      defectName: { type: String, required: true },
      defectCode: { type: String, required: true },
      categoryName: { type: String, default: "" },

      // Status & Quantity
      // For No-Location: status is set directly on the defect
      // For Location-based: status is null here, stored in each position
      status: {
        type: String,
        enum: ["Minor", "Major", "Critical", null],
        default: null,
      },
      qty: { type: Number, required: true, default: 1 },

      // Metadata
      determinedBuyer: { type: String, default: "Unknown" },
      additionalRemark: { type: String, default: "" },

      // Location Data
      isNoLocation: { type: Boolean, default: false },
      locations: { type: [DefectLocationSchema], default: [] },

      // Images for No-Location mode (contains requiredImage)
      images: { type: [DefectImageSchema], default: [] },

      // Snapshot Data
      lineName: { type: String, default: "" },
      tableName: { type: String, default: "" },
      colorName: { type: String, default: "" },
      qcUser: { type: mongoose.Schema.Types.Mixed, default: null },

      timestamp: { type: Date, default: Date.now },
    },
    { _id: false },
  );

  // --- Defect Manual Data Sub-Schemas (NEW) ---
  const DefectManualImageSchema = new mongoose.Schema(
    {
      imageId: { type: String, required: true },
      imageURL: { type: String, required: true },
      remark: { type: String, default: "" },
      uploadedAt: { type: Date, default: Date.now },
    },
    { _id: false },
  );

  const DefectManualItemSchema = new mongoose.Schema(
    {
      groupId: { type: Number, required: true }, // Links to active session
      remarks: { type: String, default: "" },
      images: { type: [DefectManualImageSchema], default: [] },

      // Optional Context
      line: { type: String, default: "" },
      table: { type: String, default: "" },
      color: { type: String, default: "" },
      qcUser: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    { _id: false },
  );

  // --- PP Sheet Data Schemas ---

  // Attendance User Schema
  const PPSheetUserSchema = new mongoose.Schema(
    {
      emp_id: { type: String, required: true },
      eng_name: { type: String, required: true },
      face_photo: { type: String, default: null }, // Optional display
    },
    { _id: false },
  );

  // Image Schema
  const PPSheetImageSchema = new mongoose.Schema(
    {
      imageId: { type: String, required: true },
      imageURL: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now },
    },
    { _id: false },
  );

  // Main PP Sheet Schema
  const PPSheetDataSchema = new mongoose.Schema(
    {
      style: { type: String, default: "" },
      qty: { type: String, default: "" },
      date: { type: String, default: "" }, // Store as YYYY-MM-DD string

      // Materials Checklist
      materials: {
        ppSizeSet: { type: String, default: "OK" },
        approvalFullSizeSpec: { type: String, default: "OK" },
        sampleComments: { type: String, default: "OK" },
        handFeelStandard: { type: String, default: "OK" },
        approvalWashingStandard: { type: String, default: "OK" },
        approvalSwatches: { type: String, default: "OK" },
        approvalTrimCard: { type: String, default: "OK" },
        approvalPrintEmb: { type: String, default: "OK" },
        fabricInspectionResult: { type: String, default: "Pass" },
        other: { type: String, default: "" },
      },

      // Dynamic Lists
      riskAnalysis: [
        {
          risk: { type: String, default: "" },
          action: { type: String, default: "" },
        },
      ],
      criticalOperations: [{ type: String }],
      otherComments: [{ type: String }],

      // Attendance
      attendance: {
        merchandiser: [PPSheetUserSchema],
        technical: [PPSheetUserSchema],
        cutting: [PPSheetUserSchema],
        qaqc: [PPSheetUserSchema],
        sewing: [PPSheetUserSchema],
        mechanic: [PPSheetUserSchema],
        ironing: [PPSheetUserSchema],
        packing: [PPSheetUserSchema],
      },

      // Images
      images: { type: [PPSheetImageSchema], default: [] },

      timestamp: { type: Date, default: Date.now },
    },
    { _id: false },
  );

  // --- Resubmission History Sub-Schema ---
  const ResubmissionHistorySchema = new mongoose.Schema(
    {
      resubmissionNo: { type: Number, required: true },
      resubmissionDate: { type: Date, default: Date.now },
    },
    { _id: false },
  );

  // Main Report Schema
  const FincheckInspectionReportsSchema = new mongoose.Schema(
    {
      inspectionDate: { type: Date, required: true },
      inspectionType: { type: String, enum: ["first", "re"], required: true },
      orderNos: { type: [String], required: true },
      orderNosString: { type: String, required: true },
      orderType: {
        type: String,
        enum: ["single", "multi", "batch"],
        default: "single",
      },
      buyer: { type: String, required: true },
      productType: { type: String, required: true },
      productTypeId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "QASectionsProductType",
      },
      reportType: { type: String, required: true },
      reportTypeId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "QASectionsTemplates",
      },
      empId: { type: String, required: true },
      empName: { type: String },
      measurementMethod: {
        type: String,
        enum: ["Before", "After", "N/A", "No"],
        default: "N/A",
      },
      inspectionMethod: {
        type: String,
        enum: ["Fixed", "AQL", "N/A", "No"],
        default: "AQL",
      },

      // --- Report ID is a Number ---
      reportId: {
        type: Number,
        unique: true,
        index: true,
      },
      status: {
        type: String,
        enum: ["draft", "in_progress", "completed", "cancelled"],
        default: "draft",
      },
      resubmissionHistory: { type: [ResubmissionHistorySchema], default: [] },
      inspectionDetails: InspectionDetailsSchema,
      // --- Header Data Array ---
      headerData: { type: [HeaderDataItemSchema], default: [] },
      // --- Photo Data Array ---
      photoData: { type: [PhotoSectionDataSchema], default: [] },
      // --- Inspection Configuration Data ---
      inspectionConfig: { type: InspectionConfigItemSchema, default: null },
      // --- Measurement Data Array ---
      measurementData: { type: [MeasurementDataItemSchema], default: [] },
      // --- Defect Data Array ---
      defectData: { type: [DefectItemSchema], default: [] },
      // --- Defect Manual Data Array ---
      defectManualData: { type: [DefectManualItemSchema], default: [] },
      // --- PP Sheet Data---
      ppSheetData: { type: PPSheetDataSchema, default: null },
    },
    {
      timestamps: true,
      collection: "fincheck_inspection_reports",
    },
  );

  FincheckInspectionReportsSchema.index(
    {
      inspectionDate: 1,
      inspectionType: 1,
      orderNos: 1,
      productTypeId: 1,
      reportTypeId: 1,
      empId: 1,
    },
    { unique: true },
  );

  return connection.model(
    "FincheckInspectionReports",
    FincheckInspectionReportsSchema,
  );
};

export default createFincheckInspectionReportsModel;
