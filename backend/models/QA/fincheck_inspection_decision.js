import mongoose from "mongoose";

// Sub-schema for individual history entries
const DecisionHistoryItemSchema = new mongoose.Schema(
  {
    approvalNo: { type: Number, required: true }, // 1, 2, 3...

    decisionStatus: {
      type: String,
      enum: ["Approved", "Rework", "Rejected"],
      required: true,
    },

    approvalEmpId: { type: String, required: true },
    approvalEmpName: { type: String, required: true },

    additionalComment: { type: String, default: "" },

    // Audio specific to this approval instance
    hasAudio: { type: Boolean, default: false },
    audioUrl: { type: String, default: "" },

    approvalDate: { type: Date, default: Date.now },
  },
  { _id: false },
);

const FincheckInspectionDecisionSchema = new mongoose.Schema(
  {
    reportId: {
      type: Number,
      required: true,
      unique: true, // Ensure one document per report
      index: true,
    },
    reportRef: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FincheckInspectionReports",
    },

    // --- LATEST DECISION INFO (Top Level) ---
    // These fields get updated every time a new decision is made
    approvalEmpId: { type: String, required: true },
    approvalEmpName: { type: String, required: true },

    decisionStatus: {
      type: String,
      enum: ["Approved", "Rework", "Rejected"],
      required: true,
    },

    // --- NEW FIELDS: Rework PO ---
    reworkPO: { type: String, default: "" }, // "Yes" or ""
    reworkPOComment: { type: String, default: "" },

    systemGeneratedComment: { type: String, default: "" }, // Current system message

    // --- HISTORY TRACKING ---
    approvalHistory: [DecisionHistoryItemSchema],
  },
  {
    timestamps: true, // Handles createdAt and updatedAt (Top Level)
    collection: "fincheck_inspection_decision",
  },
);

export default (connection) =>
  connection.model(
    "FincheckInspectionDecision",
    FincheckInspectionDecisionSchema,
  );
