import mongoose from "mongoose";

// Sub-schema for the calculated sample data
const sampleDataSchema = new mongoose.Schema({
  BatchName: { type: String, required: true },
  Min: { type: Number, required: true },
  Max: { type: Number, required: true },
  SampleLetter: { type: String, required: true },
  SampleSize: { type: Number, required: true },
  Ac: { type: Number, required: true },
  Re: { type: Number, required: true }
});

const qaSectionsAqlBuyerConfigSchema = new mongoose.Schema(
  {
    Buyer: { type: String, required: true }, // Reference to Buyer Name
    InspectionType: {
      type: String,
      required: true,
      enum: ["General", "Special"]
    },
    Level: { type: String, required: true }, // e.g., "I", "II", "S-1"
    Status: {
      type: String,
      required: true,
      enum: ["Minor", "Major", "Critical"]
    },
    AQLLevel: { type: Number, required: true }, // The selected AQL (e.g., 2.5)
    SampleData: [sampleDataSchema] // The calculated array based on inputs
  },
  {
    collection: "qa_sections_aql_buyer_config",
    timestamps: true
  }
);

// Compound index to ensure unique configuration per status for a buyer context
qaSectionsAqlBuyerConfigSchema.index(
  { Buyer: 1, InspectionType: 1, Level: 1, Status: 1 },
  { unique: true }
);

export default (connection) =>
  connection.model("QASectionsAqlBuyerConfig", qaSectionsAqlBuyerConfigSchema);
