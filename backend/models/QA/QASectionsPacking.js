import mongoose from "mongoose";

// Sub-schema for individual items
const itemListSchema = new mongoose.Schema(
  {
    no: { type: Number, required: true },
    itemName: { type: String, required: true },
    maxCount: { type: Number, required: true, default: 10, min: 1 }
  },
  { _id: false }
);

// Main schema
const qaSectionsPackingSchema = new mongoose.Schema(
  {
    sectionNo: { type: Number, required: true, unique: true },
    sectionName: { type: String, required: true },
    itemList: [itemListSchema]
  },
  {
    collection: "qa_sections_packing",
    timestamps: true
  }
);

export default (connection) =>
  connection.model("QASectionsPacking", qaSectionsPackingSchema);
