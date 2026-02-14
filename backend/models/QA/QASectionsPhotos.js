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
const qaSectionsPhotosSchema = new mongoose.Schema(
  {
    sectionName: { type: String, required: true, unique: true },
    itemList: [itemListSchema]
  },
  {
    collection: "qa_sections_photos",
    timestamps: true
  }
);

export default (connection) =>
  connection.model("QASectionsPhotos", qaSectionsPhotosSchema);
