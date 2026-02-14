import mongoose from "mongoose";

// Sub-schema for the BatchSize array items
const batchSizeSchema = new mongoose.Schema({
  BatchName: { type: String, required: true },
  Min: { type: Number, required: true },
  Max: { type: Number, required: true },
  SampleLetter: { type: String, required: true }
});

const qaSectionsAqlSampleLettersSchema = new mongoose.Schema(
  {
    InspectionType: {
      type: String,
      required: true,
      enum: ["Special", "General"] // Optional: limits values to these two
    },
    Level: { type: String, required: true }, // e.g., "S-1", "I", "II"
    BatchSize: [batchSizeSchema]
  },
  {
    collection: "qa_sections_aql_sampleLetters",
    timestamps: true
  }
);

export default (connection) =>
  connection.model(
    "QASectionsAqlSampleLetters",
    qaSectionsAqlSampleLettersSchema
  );
