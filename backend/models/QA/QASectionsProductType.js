import mongoose from "mongoose";

const qaSectionsProductTypeSchema = new mongoose.Schema(
  {
    no: { type: Number, required: true, unique: true },
    EnglishProductName: { type: String, required: true, unique: true },
    KhmerProductName: { type: String, default: "" },
    ChineseProductName: { type: String, default: "" },
    imageURL: { type: String, default: "" }
  },
  {
    collection: "qa_sections_product_type",
    timestamps: true
  }
);

export default (connection) =>
  connection.model("QASectionsProductType", qaSectionsProductTypeSchema);
