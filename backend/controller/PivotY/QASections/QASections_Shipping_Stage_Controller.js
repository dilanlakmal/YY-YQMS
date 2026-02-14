import { QASectionsShippingStage } from "../../MongoDB/dbConnectionController.js";

/* ============================================================
   🆕 QA SECTIONS SHIPPING STAGE - CRUD Endpoints Controllers
   ============================================================ */

/**
 * POST /api/qa-sections-shipping-stage
 * Controller: Creates a new shipping stage
 */
export const CreateShippingStage = async (req, res) => {
  try {
    const { ShippingStage, Remarks } = req.body;

    // Validate required fields
    if (!ShippingStage) {
      return res.status(400).json({
        success: false,
        message: "ShippingStage is required"
      });
    }

    // Get the highest no and increment
    const maxStage = await QASectionsShippingStage.findOne()
      .sort({ no: -1 })
      .select("no");

    const newNo = maxStage ? maxStage.no + 1 : 1;

    const newStage = new QASectionsShippingStage({
      no: newNo,
      ShippingStage,
      Remarks: Remarks || ""
    });

    await newStage.save();

    return res.status(201).json({
      success: true,
      message: "Shipping Stage created successfully",
      data: newStage
    });
  } catch (error) {
    console.error("Error creating shipping stage:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate entry found (No or ShippingStage)."
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create shipping stage",
      error: error.message
    });
  }
};

/**
 * GET /api/qa-sections-shipping-stage
 * Controller: Retrieves all shipping stages sorted by no
 */
export const GetShippingStages = async (req, res) => {
  try {
    const stages = await QASectionsShippingStage.find().sort({ no: 1 });

    return res.status(200).json({
      success: true,
      count: stages.length,
      data: stages
    });
  } catch (error) {
    console.error("Error fetching shipping stages:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch shipping stages",
      error: error.message
    });
  }
};

/**
 * GET /api/qa-sections-shipping-stage/:id
 * Controller: Retrieves a specific shipping stage by ID
 */
export const GetSpecificShippingStage = async (req, res) => {
  try {
    const stage = await QASectionsShippingStage.findById(req.params.id);

    if (!stage) {
      return res.status(404).json({
        success: false,
        message: "Shipping stage not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: stage
    });
  } catch (error) {
    console.error("Error fetching shipping stage:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch shipping stage",
      error: error.message
    });
  }
};

/**
 * PUT /api/qa-sections-shipping-stage/:id
 * Controller: Updates a specific shipping stage
 */
export const UpdateShippingStage = async (req, res) => {
  try {
    const { ShippingStage, Remarks } = req.body;

    // Validate required fields
    if (!ShippingStage) {
      return res.status(400).json({
        success: false,
        message: "ShippingStage is required"
      });
    }

    const updatedStage = await QASectionsShippingStage.findByIdAndUpdate(
      req.params.id,
      {
        ShippingStage,
        Remarks: Remarks || ""
      },
      { new: true, runValidators: true }
    );

    if (!updatedStage) {
      return res.status(404).json({
        success: false,
        message: "Shipping stage not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Shipping stage updated successfully",
      data: updatedStage
    });
  } catch (error) {
    console.error("Error updating shipping stage:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update shipping stage",
      error: error.message
    });
  }
};

/**
 * DELETE /api/qa-sections-shipping-stage/:id
 * Controller: Deletes a specific shipping stage
 */
export const DeleteShippingStage = async (req, res) => {
  try {
    const deletedStage = await QASectionsShippingStage.findByIdAndDelete(
      req.params.id
    );

    if (!deletedStage) {
      return res.status(404).json({
        success: false,
        message: "Shipping stage not found"
      });
    }
    return res.status(200).json({
      success: true,
      message: "Shipping stage deleted successfully",
      data: deletedStage
    });
  } catch (error) {
    console.error("Error deleting shipping stage:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete shipping stage",
      error: error.message
    });
  }
};
