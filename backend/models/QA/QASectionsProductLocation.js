import mongoose from "mongoose";

// Sub-schema for individual location markers
const locationMarkerSchema = new mongoose.Schema({
  LocationNo: { type: Number, required: true },
  LocationName: { type: String, required: true },
  LocationNameChinese: { type: String, default: "" },
  x: { type: Number, required: true }, // X coordinate percentage
  y: { type: Number, required: true }, // Y coordinate percentage
});

// Sub-schema for Front/Back view
const viewSchema = new mongoose.Schema({
  imagePath: { type: String, required: true },
  locations: {
    type: [locationMarkerSchema],
    default: [],
  },
});

// Main schema for Product Location Management
const qaSectionsProductLocationSchema = new mongoose.Schema(
  {
    productTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QASectionsProductType",
      required: true,
    },
    productTypeName: { type: String, required: true },
    style: {
      type: String,
      required: true,
      default: "Common",
    },
    frontView: {
      type: viewSchema,
      required: true,
    },
    backView: {
      type: viewSchema,
      required: true,
    },
    isActive: { type: Boolean, default: true },
  },
  {
    collection: "qa_sections_product_location",
    timestamps: true,
  },
);

export default (connection) =>
  connection.model(
    "QASectionsProductLocation",
    qaSectionsProductLocationSchema,
  );
