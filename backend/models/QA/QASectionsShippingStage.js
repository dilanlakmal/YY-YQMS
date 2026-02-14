import mongoose from "mongoose";

// Main schema for the shipping stages
const qaSectionsShippingStageSchema = new mongoose.Schema(
  {
    no: { type: Number, required: true, unique: true },
    ShippingStage: { type: String, required: true },
    Remarks: { type: String, default: "" }
  },
  {
    collection: "qa_sections_shipping_stage",
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

export default (connection) =>
  connection.model("QASectionsShippingStage", qaSectionsShippingStageSchema);
