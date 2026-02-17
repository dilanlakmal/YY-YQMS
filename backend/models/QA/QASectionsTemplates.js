import mongoose from "mongoose";

// Sub-schema for selected defect categories
const SelectedCategorySchema = new mongoose.Schema(
  {
    categoryId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Reference ID
    CategoryCode: { type: String, required: true },
    CategoryNameEng: { type: String, required: true },
    CategoryNameChinese: { type: String, default: "" },
  },
  { _id: false },
);

// New Sub-schema for selected photo sections
const SelectedPhotoSectionSchema = new mongoose.Schema(
  {
    PhotoSectionID: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "QASectionsPhotos",
    },
    SectionName: { type: String, required: true },
    SectionNameChinese: { type: String, default: "" },
  },
  { _id: false },
);

const qaSectionsTemplatesSchema = new mongoose.Schema(
  {
    no: { type: Number, required: true },
    ReportType: { type: String, required: true },
    ReportTypeChinese: { type: String, default: "" },

    // Primary Measurement (Tab 1)
    Measurement: {
      type: String,
      enum: ["No", "Before", "After"],
      default: "No",
    },
    // Secondary Measurement (Tab 2) ***
    MeasurementAdditional: {
      type: String,
      enum: ["No", "Before", "After"],
      default: "No",
    },

    Header: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },
    Photos: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },
    Line: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },
    Table: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },
    Colors: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },
    ShippingStage: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },
    InspectedQtyMethod: {
      type: String,
      enum: ["NA", "Fixed", "AQL"],
      default: "NA",
    },
    isCarton: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },
    isQCScan: {
      type: String,
      enum: ["Yes", "No"],
      default: "No",
    },
    InspectedQty: {
      type: Number,
      default: 0,
    },
    QualityPlan: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },
    Conclusion: {
      type: String,
      enum: ["Yes", "No"],
      default: "Yes",
    },

    // List of selected categories
    DefectCategoryList: [SelectedCategorySchema],

    // List of selected photo sections
    SelectedPhotoSectionList: [SelectedPhotoSectionSchema],
  },
  {
    collection: "qa_sections_templates",
    timestamps: true,
  },
);

export default (connection) =>
  connection.model("QASectionsTemplates", qaSectionsTemplatesSchema);
