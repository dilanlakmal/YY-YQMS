import mongoose from "mongoose";

// --- Sub-schema for individual QCs ---
const qcItemSchema = new mongoose.Schema({
  qcIndex: { type: Number, required: true },
  qcID: { type: String, required: true },
  qcName: { type: String, required: true }
});

const subconSewingFactorySchema = new mongoose.Schema(
  {
    no: { type: Number, required: true },
    factory: { type: String, required: true, unique: true },
    factory_second_name: { type: String, default: "" },
    lineList: { type: [String], required: true },
    qcList: { type: [qcItemSchema], default: [] }
  },
  {
    collection: "subcon_sewing_factory",
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

export default (connection) =>
  connection.model("SubconSewingFactory", subconSewingFactorySchema);
