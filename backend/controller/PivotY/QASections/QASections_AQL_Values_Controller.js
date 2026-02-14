import { QASectionsAqlValues } from "../../MongoDB/dbConnectionController.js";

// Get all AQL Values
export const getAQLValues = async (req, res) => {
  try {
    const data = await QASectionsAqlValues.find().sort({ createdAt: -1 });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new AQL Value entry
export const createAQLValue = async (req, res) => {
  const newData = new QASectionsAqlValues(req.body);
  try {
    await newData.save();
    res.status(201).json(newData);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

// Update existing AQL Value by ID
export const updateAQLValue = async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  try {
    const updatedData = await QASectionsAqlValues.findByIdAndUpdate(id, data, {
      new: true
    });
    if (!updatedData) {
      return res.status(404).json({ message: "AQL Value entry not found" });
    }
    res.status(200).json(updatedData);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

// Delete AQL Value by ID
export const deleteAQLValue = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedData = await QASectionsAqlValues.findByIdAndDelete(id);
    if (!deletedData) {
      return res.status(404).json({ message: "AQL Value entry not found" });
    }
    res.status(200).json({ message: "AQL Value entry deleted successfully" });
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

// ---------------------------------------------------------
// NEW: Bulk Update AQL Values
// ---------------------------------------------------------
export const bulkUpdateAQLValues = async (req, res) => {
  try {
    const { updates } = req.body;

    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        message: "Invalid request. 'updates' array is required."
      });
    }

    // Validate that all entries have an _id
    const invalidEntries = updates.filter((item) => !item._id);
    if (invalidEntries.length > 0) {
      return res.status(400).json({
        message: "All update entries must have an '_id' field."
      });
    }

    // Perform bulk update using bulkWrite
    const bulkOps = updates.map((item) => ({
      updateOne: {
        filter: { _id: item._id },
        update: {
          $set: {
            SampleLetter: item.SampleLetter,
            SampleSize: item.SampleSize,
            AQLData: item.AQLData
          }
        }
      }
    }));

    const result = await QASectionsAqlValues.bulkWrite(bulkOps);

    res.status(200).json({
      message: "Bulk update successful",
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });
  } catch (error) {
    console.error("Bulk update error:", error);
    res.status(500).json({ message: error.message });
  }
};
