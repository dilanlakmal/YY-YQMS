import {
  FincheckApprovalAssignees,
  QASectionsBuyer,
  RoleManagment,
} from "../../MongoDB/dbConnectionController.js";

// ============================================================
// Get All Assignees
// ============================================================
export const getApprovalAssignees = async (req, res) => {
  try {
    const assignees = await FincheckApprovalAssignees.find().sort({
      updatedAt: -1,
    });
    return res.status(200).json({ success: true, data: assignees });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// Add / Create New Assignee
// ============================================================
export const addApprovalAssignee = async (req, res) => {
  try {
    const { empId, empName, facePhoto, allowedCustomers } = req.body;

    if (!empId || !allowedCustomers) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    // Check if exists
    const existing = await FincheckApprovalAssignees.findOne({ empId });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "User already exists in approval list.",
      });
    }

    const newAssignee = new FincheckApprovalAssignees({
      empId,
      empName,
      facePhoto,
      allowedCustomers,
    });

    await newAssignee.save();
    return res.status(201).json({ success: true, data: newAssignee });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// Update Assignee
// ============================================================
export const updateApprovalAssignee = async (req, res) => {
  try {
    const { id } = req.params;
    const { allowedCustomers, facePhoto, empName } = req.body;

    const updated = await FincheckApprovalAssignees.findByIdAndUpdate(
      id,
      {
        allowedCustomers,
        ...(empName && { empName }),
        ...(facePhoto && { facePhoto }),
      },
      { new: true },
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Assignee not found" });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// Delete Assignee
// ============================================================
export const deleteApprovalAssignee = async (req, res) => {
  try {
    const { id } = req.params;
    await FincheckApprovalAssignees.findByIdAndDelete(id);
    return res
      .status(200)
      .json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// Get Buyers List (for Dropdown)
// ============================================================
export const getBuyersList = async (req, res) => {
  try {
    const buyers = await QASectionsBuyer.find({}).sort({ buyer: 1 }).lean();
    return res.status(200).json({ success: true, data: buyers });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
