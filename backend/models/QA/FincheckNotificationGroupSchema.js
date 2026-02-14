import mongoose from "mongoose";

const FincheckNotificationGroupSchema = new mongoose.Schema(
  {
    empId: { type: String, required: true, unique: true, trim: true },
    empName: { type: String, required: true },
    jobTitle: { type: String, default: "" },
    facePhoto: { type: String, default: null },
    notifiedCustomers: { type: [String], default: [] }
  },
  {
    timestamps: true,
    collection: "fincheck_notification_group"
  }
);

export default (connection) =>
  connection.model(
    "FincheckNotificationGroup",
    FincheckNotificationGroupSchema
  );
