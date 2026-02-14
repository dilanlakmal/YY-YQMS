import mongoose from "mongoose";

const qaSectionsBuyerSchema = new mongoose.Schema(
  {
    buyer: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    buyerFullName: {
      type: String,
      default: "",
      trim: true
    },
    additionalInfo: {
      type: String,
      default: "",
      maxLength: 250
    }
  },
  {
    collection: "qa_sections_buyers",
    timestamps: true
  }
);

export default (connection) =>
  connection.model("QASectionsBuyer", qaSectionsBuyerSchema);
