import mongoose from "mongoose";

// Sub-schema for individual options
const optionItemSchema = new mongoose.Schema(
  {
    OptionNo: { type: Number, required: true },
    Name: { type: String, required: true },
    NameChinese: { type: String, required: true },
  },
  { _id: false },
);

// Main schema
const qaSectionsHomeSchema = new mongoose.Schema(
  {
    DisplayOrderNo: { type: Number, required: true, unique: true },
    MainTitle: { type: String, required: true },
    MainTitleChinese: { type: String, required: true },
    Options: [optionItemSchema],
  },
  {
    collection: "qa_sections_home",
    timestamps: true, // Automatically adds createdAt and updatedAt
  },
);

export default (connection) =>
  connection.model("QASectionsHome", qaSectionsHomeSchema);
