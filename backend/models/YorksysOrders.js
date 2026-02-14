import mongoose from "mongoose";

// Sub-schema for Fabric Content (Reused for Rib Content)
const fabricContentSchema = new mongoose.Schema(
  {
    fabricName: { type: String, required: true },
    percentageValue: { type: Number, required: true, min: 0, max: 100 },
  },
  { _id: false },
);

// Sub-schema for MO Summary
const moSummarySchema = new mongoose.Schema(
  {
    TotalSku: { type: Number, required: true, default: 0 },
    AllETD: [{ type: String }], // Array of date strings
    AllETA: [{ type: String }], // Array of date strings
    ETDPeriod: { type: String, default: "N/A" },
    ETAPeriod: { type: String, default: "N/A" },
    TotalColors: { type: Number, required: true, default: 0 },
    TotalPos: { type: Number, required: true, default: 0 },
    TotalQty: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

// Sub-schema for SKU Data
const skuDataSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true },
    ETD: { type: String, default: "" },
    ETA: { type: String, default: "" },
    POLine: { type: String, default: "" },
    Color: { type: String, default: "" },
    Qty: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

// Sub-schema for Color Quantity breakdown
const colorQtySchema = new mongoose.Schema(
  {
    ColorName: { type: String, required: true },
    Qty: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

// Sub-schema for Order Qty by Country
const orderQtyByCountrySchema = new mongoose.Schema(
  {
    CountryID: { type: String, required: true },
    TotalQty: { type: Number, required: true, default: 0 },
    ColorQty: [colorQtySchema],
  },
  { _id: false },
);

// --- MAIN SCHEMA ---
const yorksysOrdersSchema = new mongoose.Schema(
  {
    // Top-level header data
    buyer: { type: String, required: true },
    factory: { type: String, required: true },
    moNo: { type: String, required: true },
    season: { type: String, default: "N/A" },
    style: { type: String, default: "N/A" },
    product: { type: String, default: "N/A" },
    destination: { type: String, default: "N/A" },
    shipMode: { type: String, default: "N/A" },
    currency: { type: String, default: "N/A" },
    skuDescription: { type: String, default: "N/A" },
    productType: { type: String },

    // Fabric Content array
    FabricContent: [fabricContentSchema],

    // Rib Content array
    RibContent: [fabricContentSchema],

    // MO Summary array (typically one object)
    MOSummary: [moSummarySchema],

    // SKU Data array
    SKUData: [skuDataSchema],

    // Order Qty by Country array
    OrderQtyByCountry: [orderQtyByCountrySchema],
  },
  {
    collection: "yorksys_orders",
    timestamps: true,
  },
);

// Compound unique index to prevent duplicate orders
yorksysOrdersSchema.index(
  {
    moNo: 1,
    factory: 1,
  },
  { unique: true, message: "This MO Number already exists for this factory." },
);

export default (connection) =>
  connection.model("YorksysOrders", yorksysOrdersSchema);
