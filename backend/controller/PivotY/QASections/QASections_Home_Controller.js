import { QASectionsHome } from "../../MongoDB/dbConnectionController.js";

/* ============================================================
   🆕 QA SECTIONS HOME - CRUD Endpoints Controllers
   ============================================================ */

/**
 * POST /api/qa-sections-home
 * Controller: Creates a new QA section item
 */
export const CreateQASectionitem = async (req, res) => {
  try {
    const { MainTitle, MainTitleChinese, Options } = req.body;

    // Validate required fields
    if (
      !MainTitle ||
      !MainTitleChinese ||
      !Options ||
      !Array.isArray(Options)
    ) {
      return res.status(400).json({
        success: false,
        message: "MainTitle, MainTitleChinese and Options array are required",
      });
    }

    // Validate each option has both Name and NameChinese
    for (const option of Options) {
      if (!option.Name || !option.NameChinese) {
        return res.status(400).json({
          success: false,
          message: "Each option must have both Name and NameChinese",
        });
      }
    }

    // Get the highest DisplayOrderNo and increment
    const maxOrder = await QASectionsHome.findOne()
      .sort({ DisplayOrderNo: -1 })
      .select("DisplayOrderNo");

    const newDisplayOrderNo = maxOrder ? maxOrder.DisplayOrderNo + 1 : 1;

    const newItem = new QASectionsHome({
      DisplayOrderNo: newDisplayOrderNo,
      MainTitle,
      MainTitleChinese,
      Options,
    });

    await newItem.save();

    return res.status(201).json({
      success: true,
      message: "QA section item created successfully",
      data: newItem,
    });
  } catch (error) {
    console.error("Error creating QA section:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate DisplayOrderNo",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create QA section",
      error: error.message,
    });
  }
};

/**
 * GET /api/qa-sections-home
 * Controller: Retrieves all QA section items sorted by DisplayOrderNo
 */
export const GetQASectionitems = async (req, res) => {
  try {
    const items = await QASectionsHome.find().sort({ DisplayOrderNo: 1 });

    return res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error("Error fetching QA sections:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch QA sections",
      error: error.message,
    });
  }
};

/**
 * GET /api/qa-sections-home/:id
 * Controller: Retrieves a specific QA section item by ID
 */
export const GetSpecificQASectionitem = async (req, res) => {
  try {
    const item = await QASectionsHome.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "QA section item not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Error fetching QA section:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch QA section",
      error: error.message,
    });
  }
};

/**
 * PUT /api/qa-sections-home/:id
 * Controller: Updates a specific QA section item
 */
export const UpdateQASectionitem = async (req, res) => {
  try {
    const { MainTitle, MainTitleChinese, Options } = req.body;

    // Validate required fields
    if (
      !MainTitle ||
      !MainTitleChinese ||
      !Options ||
      !Array.isArray(Options)
    ) {
      return res.status(400).json({
        success: false,
        message: "MainTitle, MainTitleChinese and Options array are required",
      });
    }

    // Validate each option has both Name and NameChinese
    for (const option of Options) {
      if (!option.Name || !option.NameChinese) {
        return res.status(400).json({
          success: false,
          message: "Each option must have both Name and NameChinese",
        });
      }
    }

    const updatedItem = await QASectionsHome.findByIdAndUpdate(
      req.params.id,
      { MainTitle, MainTitleChinese, Options },
      { new: true, runValidators: true },
    );

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: "QA section item not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "QA section item updated successfully",
      data: updatedItem,
    });
  } catch (error) {
    console.error("Error updating QA section:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update QA section",
      error: error.message,
    });
  }
};

/**
 * DELETE /api/qa-sections-home/:id
 * Controller: Deletes a specific QA section item
 */
export const DeleteQASectionitem = async (req, res) => {
  try {
    const deletedItem = await QASectionsHome.findByIdAndDelete(req.params.id);

    if (!deletedItem) {
      return res.status(404).json({
        success: false,
        message: "QA section item not found",
      });
    }

    // Re-order remaining items
    const remainingItems = await QASectionsHome.find().sort({
      DisplayOrderNo: 1,
    });

    for (let i = 0; i < remainingItems.length; i++) {
      if (remainingItems[i].DisplayOrderNo !== i + 1) {
        await QASectionsHome.findByIdAndUpdate(remainingItems[i]._id, {
          DisplayOrderNo: i + 1,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "QA section item deleted successfully",
      data: deletedItem,
    });
  } catch (error) {
    console.error("Error deleting QA section:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete QA section",
      error: error.message,
    });
  }
};
