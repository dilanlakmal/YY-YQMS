import mongoose from "mongoose";

// Schema for Humidity Fiber Names
const humidityFiberNameSchema = new mongoose.Schema(
  {
    fiberName: { type: String, required: true, unique: true },
    fiberNameKhmer: { type: String, default: "" },
    fiberNameChi: { type: String, default: "" }
  },
  {
    collection: "humidity_fiber_name",
    timestamps: true // Automatically adds createdAt and updatedAt
  }
);

export default (connection) =>
  connection.model("HumidityFiberName", humidityFiberNameSchema);
