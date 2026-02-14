import mongoose from "mongoose";

const qaSectionsTableSchema = new mongoose.Schema(
  {
    TableNo: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    ProductType: {
      type: String,
      required: true,
      default: "KNIT",
      enum: ["KNIT", "BRA", "KNIT+BRA"]
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
    collection: "qa_sections_tables",
    timestamps: true
  }
);

export default (connection) =>
  connection.model("QASectionsTable", qaSectionsTableSchema);
