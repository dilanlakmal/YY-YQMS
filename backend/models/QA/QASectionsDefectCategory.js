import mongoose from "mongoose";

// Main schema for the defect categories
const qaSectionsDefectCategorySchema = new mongoose.Schema(
  {
    no: { type: Number, required: true, unique: true },
    CategoryCode: { type: String, required: true },
    CategoryNameEng: { type: String, required: true },
    CategoryNameKhmer: { type: String, default: "" },
    CategoryNameChinese: { type: String, default: "" }
  },
  {
    collection: "qa_sections_defect_category",
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

export default (connection) =>
  connection.model("QASectionsDefectCategory", qaSectionsDefectCategorySchema);
