import {
  FincheckNotificationGroup,
  QASectionsBuyer
} from "../../MongoDB/dbConnectionController.js";

// ============================================================
// Get All Group Members
// ============================================================
export const getNotificationGroup = async (req, res) => {
  try {
    const members = await FincheckNotificationGroup.find().sort({
      createdAt: -1
    });
    return res.status(200).json({ success: true, data: members });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// Add Members (Supports Bulk Add with Buyer Selection)
// ============================================================
export const addNotificationMembers = async (req, res) => {
  try {
    const { members, notifiedCustomers } = req.body;
    // members: Array of { empId, empName, jobTitle, facePhoto }
    // notifiedCustomers: Array of buyer names (shared across all members being added)

    if (!members || !Array.isArray(members) || members.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No members provided" });
    }

    if (!notifiedCustomers || notifiedCustomers.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Please select at least one buyer" });
    }

    const results = {
      added: 0,
      updated: 0,
      failed: 0,
      errors: []
    };

    for (const member of members) {
      try {
        // Check if already exists
        const exists = await FincheckNotificationGroup.findOne({
          empId: member.empId
        });

        if (exists) {
          // Update existing member with new buyers (merge)
          const mergedBuyers = [
            ...new Set([...exists.notifiedCustomers, ...notifiedCustomers])
          ];
          exists.notifiedCustomers = mergedBuyers;
          exists.empName = member.empName || exists.empName;
          exists.jobTitle = member.jobTitle || exists.jobTitle;
          exists.facePhoto = member.facePhoto || exists.facePhoto;
          await exists.save();
          results.updated++;
        } else {
          // Create new
          await new FincheckNotificationGroup({
            empId: member.empId,
            empName: member.empName,
            jobTitle: member.jobTitle || "",
            facePhoto: member.facePhoto || null,
            notifiedCustomers: notifiedCustomers
          }).save();
          results.added++;
        }
      } catch (err) {
        results.failed++;
        results.errors.push(`Failed ${member.empId}: ${err.message}`);
      }
    }

    return res.status(200).json({ success: true, data: results });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// Update Member (Edit Buyers)
// ============================================================
export const updateNotificationMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { notifiedCustomers, empName, jobTitle, facePhoto } = req.body;

    if (!notifiedCustomers || notifiedCustomers.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Please select at least one buyer" });
    }

    const updated = await FincheckNotificationGroup.findByIdAndUpdate(
      id,
      {
        notifiedCustomers,
        ...(empName && { empName }),
        ...(jobTitle && { jobTitle }),
        ...(facePhoto && { facePhoto })
      },
      { new: true }
    );

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Member not found" });
    }

    return res.status(200).json({ success: true, data: updated });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// Remove Member
// ============================================================
export const removeNotificationMember = async (req, res) => {
  try {
    const { id } = req.params;
    await FincheckNotificationGroup.findByIdAndDelete(id);
    return res
      .status(200)
      .json({ success: true, message: "Member removed successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================
// Get Buyers List (for Dropdown)
// ============================================================
export const getNotificationBuyersList = async (req, res) => {
  try {
    const buyers = await QASectionsBuyer.find({}).sort({ buyer: 1 }).lean();
    return res.status(200).json({ success: true, data: buyers });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
};
