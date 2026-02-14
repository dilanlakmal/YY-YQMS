import mongoose from "mongoose";

// Sub-schema for buyer-specific defect statuses
const statusByBuyerSchema = new mongoose.Schema({
  buyerName: { type: String, required: true },
  defectStatus: { type: [String], default: [] }, // e.g., ["Minor", "Major"]
  commonStatus: {
    type: String,
    enum: ["Critical", "Major", "Minor", ""],
    default: ""
  }
});

// Sub-schema for defect decisions
const decisionSchema = new mongoose.Schema({
  decisionEng: { type: String, required: true },
  decisionKhmer: { type: String, default: "" },
  status: { type: String, required: true }
});

// Main schema for the defect list
const qaSectionsDefectListSchema = new mongoose.Schema(
  {
    MainCategoryCode: { type: Number, required: true },
    code: { type: String, required: true },
    english: { type: String, required: true },
    khmer: { type: String, default: "" },
    chinese: { type: String, default: "" },
    defectLetter: { type: String, required: true },
    CategoryNameEng: { type: String, required: true },
    CategoryNameKhmer: { type: String, default: "" },
    CategoryNameChinese: { type: String, default: "" },
    CategoryCode: { type: String, required: true },
    isCommon: { type: String, required: true, enum: ["Yes", "No"] },
    remarks: { type: String, default: "" },
    statusByBuyer: { type: [statusByBuyerSchema], default: [] },
    decisions: { type: [decisionSchema], default: [] }
  },
  {
    collection: "qa_sections_defect_list",
    timestamps: true
  }
);

// Create a compound unique index to prevent duplicate codes
qaSectionsDefectListSchema.index({ code: 1 }, { unique: true });

export default (connection) =>
  connection.model("QASectionsDefectList", qaSectionsDefectListSchema);
