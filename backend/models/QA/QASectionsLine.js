import mongoose from "mongoose";

const qaSectionsLineSchema = new mongoose.Schema(
  {
    LineNo: {
      type: String, // String as requested (e.g. "1", "2A", "30")
      required: true,
      unique: true,
      trim: true
    },
    ProductType: {
      type: String, // Only "KNIT" for now as per requirement
      required: true,
      default: "KNIT",
      enum: ["KNIT"]
    },
    Description: {
      type: String,
      default: "",
      trim: true
    },
    Type: {
      type: String,
      required: true,
      enum: ["Main", "Support", "Sample"],
      default: "Main"
    },
    Active: {
      type: Boolean,
      default: true
    }
  },
  {
    collection: "qa_sections_lines",
    timestamps: true
  }
);

export default (connection) =>
  connection.model("QASectionsLine", qaSectionsLineSchema);
