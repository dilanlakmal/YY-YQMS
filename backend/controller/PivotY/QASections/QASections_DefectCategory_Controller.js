import { QASectionsDefectCategory } from "../../MongoDB/dbConnectionController.js";

/* ============================================================
   🆕 QA SECTIONS DEFECT CATEGORY - CRUD Endpoints Controllers
   ============================================================ */

/**
 * POST /api/qa-sections-defect-category
 * Controller: Creates a new defect category
 */
export const CreateDefectCategory = async (req, res) => {
  try {
    const {
      CategoryCode,
      CategoryNameEng,
      CategoryNameKhmer,
      CategoryNameChinese
    } = req.body;

    // Validate required fields
    if (!CategoryCode || !CategoryNameEng) {
      return res.status(400).json({
        success: false,
        message: "CategoryCode and CategoryNameEng are required"
      });
    }

    // Get the highest no and increment
    const maxCategory = await QASectionsDefectCategory.findOne()
      .sort({ no: -1 })
      .select("no");

    const newNo = maxCategory ? maxCategory.no + 1 : 1;

    const newCategory = new QASectionsDefectCategory({
      no: newNo,
      CategoryCode,
      CategoryNameEng,
      CategoryNameKhmer: CategoryNameKhmer || "",
      CategoryNameChinese: CategoryNameChinese || ""
    });

    await newCategory.save();

    return res.status(201).json({
      success: true,
      message: "Defect category created successfully",
      data: newCategory
    });
  } catch (error) {
    console.error("Error creating defect category:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate entry for CategoryCode or other unique field."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create defect category",
      error: error.message
    });
  }
};

/**
 * GET /api/qa-sections-defect-category
 * Controller: Retrieves all defect categories sorted by no
 */
export const GetDefectCategories = async (req, res) => {
  try {
    const categories = await QASectionsDefectCategory.find().sort({ no: 1 });

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    console.error("Error fetching defect categories:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch defect categories",
      error: error.message
    });
  }
};

/**
 * GET /api/qa-sections-defect-category/:id
 * Controller: Retrieves a specific defect category by ID
 */
export const GetSpecificDefectCategory = async (req, res) => {
  try {
    const category = await QASectionsDefectCategory.findById(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Defect category not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error("Error fetching defect category:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch defect category",
      error: error.message
    });
  }
};

/**
 * PUT /api/qa-sections-defect-category/:id
 * Controller: Updates a specific defect category
 */
export const UpdateDefectCategory = async (req, res) => {
  try {
    const {
      CategoryCode,
      CategoryNameEng,
      CategoryNameKhmer,
      CategoryNameChinese
    } = req.body;

    // Validate required fields
    if (!CategoryCode || !CategoryNameEng) {
      return res.status(400).json({
        success: false,
        message: "CategoryCode and CategoryNameEng are required"
      });
    }

    const updatedCategory = await QASectionsDefectCategory.findByIdAndUpdate(
      req.params.id,
      {
        CategoryCode,
        CategoryNameEng,
        CategoryNameKhmer: CategoryNameKhmer || "",
        CategoryNameChinese: CategoryNameChinese || ""
      },
      { new: true, runValidators: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({
        success: false,
        message: "Defect category not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Defect category updated successfully",
      data: updatedCategory
    });
  } catch (error) {
    console.error("Error updating defect category:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update defect category",
      error: error.message
    });
  }
};

/**
 * DELETE /api/qa-sections-defect-category/:id
 * Controller: Deletes a specific defect category
 */
export const DeleteDefectCategory = async (req, res) => {
  try {
    const deletedCategory = await QASectionsDefectCategory.findByIdAndDelete(
      req.params.id
    );

    if (!deletedCategory) {
      return res.status(404).json({
        success: false,
        message: "Defect category not found"
      });
    }
    return res.status(200).json({
      success: true,
      message: "Defect category deleted successfully",
      data: deletedCategory
    });
  } catch (error) {
    console.error("Error deleting defect category:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete defect category",
      error: error.message
    });
  }
};
