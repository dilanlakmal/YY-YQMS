import {
  QASectionsDefectList,
  QASectionsDefectCategory
} from "../../MongoDB/dbConnectionController.js";

/* ============================================================
   🆕 QA SECTIONS DEFECT LIST - CRUD Endpoints Controllers
   ============================================================ */

/**
 * POST /api/qa-sections-defect-list
 * Controller: Creates a new defect
 */
export const CreateDefect = async (req, res) => {
  try {
    const {
      code,
      english,
      khmer,
      chinese,
      defectLetter,
      CategoryCode,
      CategoryNameEng,
      CategoryNameKhmer,
      CategoryNameChinese,
      isCommon,
      remarks
    } = req.body;

    if (
      !code ||
      !english ||
      !defectLetter ||
      !CategoryCode ||
      !CategoryNameEng ||
      !isCommon
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Code, English, Defect Letter, Category Info, and isCommon are required."
      });
    }

    // Find the corresponding category to get the MainCategoryCode
    const category = await QASectionsDefectCategory.findOne({
      CategoryCode: CategoryCode
    });
    if (!category) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Category Code provided." });
    }

    const newDefect = new QASectionsDefectList({
      MainCategoryCode: category.no, // Auto-set from category
      code,
      english,
      khmer,
      chinese,
      defectLetter,
      CategoryNameEng,
      CategoryNameKhmer,
      CategoryNameChinese,
      CategoryCode,
      isCommon,
      remarks,
      statusByBuyer: [],
      decisions: []
    });

    await newDefect.save();

    return res.status(201).json({
      success: true,
      message: "Defect created successfully",
      data: newDefect
    });
  } catch (error) {
    console.error("Error creating defect:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: `Defect with code "${req.body.code}" already exists.`
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to create defect",
      error: error.message
    });
  }
};

/**
 * GET /api/qa-sections-defect-list
 * Controller: Retrieves all defects sorted by code
 */
export const GetDefects = async (req, res) => {
  try {
    const defects = await QASectionsDefectList.find().sort({ code: 1 });
    return res
      .status(200)
      .json({ success: true, count: defects.length, data: defects });
  } catch (error) {
    console.error("Error fetching defects:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch defects",
      error: error.message
    });
  }
};

/**
 * GET /api/qa-sections-defect-list/:id
 * Controller: Retrieves a specific defect by ID
 */
export const GetSpecificDefect = async (req, res) => {
  try {
    const defect = await QASectionsDefectList.findById(req.params.id);

    if (!defect) {
      return res.status(404).json({
        success: false,
        message: "Defect not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: defect
    });
  } catch (error) {
    console.error("Error fetching defect:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch defect",
      error: error.message
    });
  }
};

/**
 * PUT /api/qa-sections-defect-list/:id
 * Controller: Updates a specific defect
 */
export const UpdateDefect = async (req, res) => {
  try {
    const {
      code,
      english,
      khmer,
      chinese,
      defectLetter,
      CategoryCode,
      CategoryNameEng,
      CategoryNameKhmer,
      CategoryNameChinese,
      isCommon,
      remarks
    } = req.body;

    if (
      !code ||
      !english ||
      !defectLetter ||
      !CategoryCode ||
      !CategoryNameEng ||
      !isCommon
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Required fields are missing." });
    }

    // Find the corresponding category to update the MainCategoryCode
    const category = await QASectionsDefectCategory.findOne({
      CategoryCode: CategoryCode
    });
    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Invalid Category Code provided for update."
      });
    }

    const updatedDefect = await QASectionsDefectList.findByIdAndUpdate(
      req.params.id,
      {
        MainCategoryCode: category.no, // Update MainCategoryCode based on new category
        code,
        english,
        khmer,
        chinese,
        defectLetter,
        CategoryCode,
        CategoryNameEng,
        CategoryNameKhmer,
        CategoryNameChinese,
        isCommon,
        remarks
      },
      { new: true, runValidators: true }
    );

    if (!updatedDefect) {
      return res
        .status(404)
        .json({ success: false, message: "Defect not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Defect updated successfully",
      data: updatedDefect
    });
  } catch (error) {
    console.error("Error updating defect:", error);
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: `Defect with code "${req.body.code}" already exists.`
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to update defect",
      error: error.message
    });
  }
};

/**
 * DELETE /api/qa-sections-defect-list/:id
 * Controller: Deletes a specific defect
 */
export const DeleteDefect = async (req, res) => {
  try {
    const deletedDefect = await QASectionsDefectList.findByIdAndDelete(
      req.params.id
    );

    if (!deletedDefect) {
      return res.status(404).json({
        success: false,
        message: "Defect not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Defect deleted successfully",
      data: deletedDefect
    });
  } catch (error) {
    console.error("Error deleting defect:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete defect",
      error: error.message
    });
  }
};

/**
 * 🆕 NEW CONTROLLER
 * PUT /api/qa-sections-defect-list/bulk-update/status-by-buyer
 * Controller: Performs a bulk update on the statusByBuyer array for multiple defects.
 */
export const BulkUpdateStatusByBuyer = async (req, res) => {
  try {
    const updates = req.body; // Expects an array of { defectId, statusByBuyer }

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Request body must be a non-empty array of updates."
      });
    }

    const operations = updates.map(({ defectId, statusByBuyer }) => ({
      updateOne: {
        filter: { _id: defectId },
        update: { $set: { statusByBuyer: statusByBuyer } }
      }
    }));

    const result = await QASectionsDefectList.bulkWrite(operations);

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} defects updated successfully.`,
      data: result
    });
  } catch (error) {
    console.error("Error during bulk update of statusByBuyer:", error);
    res.status(500).json({
      success: false,
      message: "Bulk update failed.",
      error: error.message
    });
  }
};
