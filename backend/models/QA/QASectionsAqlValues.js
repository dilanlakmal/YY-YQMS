import mongoose from "mongoose";

// Sub-schema for the AQLData array items
const aqlDataSchema = new mongoose.Schema({
  AQLLevel: { type: Number, required: true }, // e.g., 0.01, 1.5, 10
  Ac: { type: Number, required: true }, // Acceptance Number
  Re: { type: Number, required: true } // Rejection Number
});

const qaSectionsAqlValuesSchema = new mongoose.Schema(
  {
    SampleLetter: { type: String, required: true, unique: true }, // e.g., "A", "B", "R"
    SampleSize: { type: Number, required: true },
    AQLData: [aqlDataSchema]
  },
  {
    collection: "qa_sections_aql_values",
    timestamps: true
  }
);

export default (connection) =>
  connection.model("QASectionsAqlValues", qaSectionsAqlValuesSchema);
