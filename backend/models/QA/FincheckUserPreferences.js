// models/QA/FincheckUserPreferences.js
import mongoose from "mongoose";

const FincheckUserPreferencesSchema = new mongoose.Schema({
  empId: { type: String, required: true, unique: true },
  favoriteColumns: { type: [String], default: [] }, // Array of Column IDs
  savedFilters: [
    {
      name: { type: String, maxlength: 25 },
      filters: { type: Object }, // Stores the filter object
      createdAt: { type: Date, default: Date.now }
    }
  ],
  updatedAt: { type: Date, default: Date.now }
});

export default (connection) =>
  connection.model("FincheckUserPreferences", FincheckUserPreferencesSchema);
