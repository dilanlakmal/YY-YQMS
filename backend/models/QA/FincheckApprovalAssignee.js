import mongoose from "mongoose";

const FincheckApprovalAssigneeSchema = new mongoose.Schema(
  {
    empId: { type: String, required: true, unique: true, trim: true },
    empName: { type: String, required: true },
    facePhoto: { type: String, default: null },

    // Array of Buyer Strings
    allowedCustomers: [
      {
        type: String,
        trim: true
      }
    ]
  },
  {
    timestamps: true,
    collection: "fincheck_approval_assignees"
  }
);

export default (connection) =>
  connection.model("FincheckApprovalAssignee", FincheckApprovalAssigneeSchema);
