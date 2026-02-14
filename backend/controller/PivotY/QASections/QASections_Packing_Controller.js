// QASections_Packing_Controller.js

import { QASectionsPacking } from "../../MongoDB/dbConnectionController.js";

/* ============================================================
   🆕 QA SECTIONS PACKING - CRUD Endpoints Controllers
   ============================================================ */

/**
 * POST /api/qa-sections-packing
 * Controller: Creates a new packing section
 */
export const CreatePackingSection = async (req, res) => {
  try {
    const { sectionName, itemList } = req.body;

    // Validate required fields
    if (!sectionName || !itemList || !Array.isArray(itemList)) {
      return res.status(400).json({
        success: false,
        message: "sectionName and itemList array are required"
      });
    }

    // Get the highest sectionNo and increment
    const maxSection = await QASectionsPacking.findOne()
      .sort({ sectionNo: -1 })
      .select("sectionNo");

    const newSectionNo = maxSection ? maxSection.sectionNo + 1 : 1;

    const newSection = new QASectionsPacking({
      sectionNo: newSectionNo,
      sectionName,
      itemList
    });

    await newSection.save();

    return res.status(201).json({
      success: true,
      message: "Packing section created successfully",
      data: newSection
    });
  } catch (error) {
    console.error("Error creating packing section:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate section number"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create packing section",
      error: error.message
    });
  }
};

/**
 * GET /api/qa-sections-packing
 * Controller: Retrieves all packing sections sorted by sectionNo
 */
export const GetPackingSections = async (req, res) => {
  try {
    const sections = await QASectionsPacking.find().sort({ sectionNo: 1 });

    return res.status(200).json({
      success: true,
      count: sections.length,
      data: sections
    });
  } catch (error) {
    console.error("Error fetching packing sections:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch packing sections",
      error: error.message
    });
  }
};

/**
 * GET /api/qa-sections-packing/:id
 * Controller: Retrieves a specific packing section by ID
 */
export const GetSpecificPackingSection = async (req, res) => {
  try {
    const section = await QASectionsPacking.findById(req.params.id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Packing section not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    console.error("Error fetching packing section:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch packing section",
      error: error.message
    });
  }
};

/**
 * PUT /api/qa-sections-packing/:id
 * Controller: Updates a specific packing section
 */
export const UpdatePackingSection = async (req, res) => {
  try {
    const { sectionName, itemList } = req.body;

    // Validate required fields
    if (!sectionName || !itemList || !Array.isArray(itemList)) {
      return res.status(400).json({
        success: false,
        message: "sectionName and itemList array are required"
      });
    }

    const updatedSection = await QASectionsPacking.findByIdAndUpdate(
      req.params.id,
      { sectionName, itemList },
      { new: true, runValidators: true }
    );

    if (!updatedSection) {
      return res.status(404).json({
        success: false,
        message: "Packing section not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Packing section updated successfully",
      data: updatedSection
    });
  } catch (error) {
    console.error("Error updating packing section:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update packing section",
      error: error.message
    });
  }
};

/**
 * DELETE /api/qa-sections-packing/:id
 * Controller: Deletes a specific packing section
 */
export const DeletePackingSection = async (req, res) => {
  try {
    const deletedSection = await QASectionsPacking.findByIdAndDelete(
      req.params.id
    );

    if (!deletedSection) {
      return res.status(404).json({
        success: false,
        message: "Packing section not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Packing section deleted successfully",
      data: deletedSection
    });
  } catch (error) {
    console.error("Error deleting packing section:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete packing section",
      error: error.message
    });
  }
};

/**
 * POST /api/qa-sections-packing/:id/items
 * Controller: Adds a new item to an existing packing section
 */
export const AddPackingSectionItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemName, maxCount } = req.body;

    if (!itemName || maxCount === undefined) {
      return res.status(400).json({
        success: false,
        message: "itemName and maxCount are required"
      });
    }

    const section = await QASectionsPacking.findById(id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Packing section not found"
      });
    }

    // Get the highest item number and increment
    const maxItemNo =
      section.itemList.length > 0
        ? Math.max(...section.itemList.map((item) => item.no))
        : 0;

    const newItem = {
      no: maxItemNo + 1,
      itemName,
      maxCount: parseInt(maxCount)
    };

    section.itemList.push(newItem);
    await section.save();

    return res.status(201).json({
      success: true,
      message: "Item added successfully",
      data: section
    });
  } catch (error) {
    console.error("Error adding item:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to add item",
      error: error.message
    });
  }
};

/**
 * DELETE /api/qa-sections-packing/:id/items/:itemNo
 * Controller: Deletes a specific item from a packing section
 */
export const DeletePackingSectionItem = async (req, res) => {
  try {
    const { id, itemNo } = req.params;

    const section = await QASectionsPacking.findById(id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Packing section not found"
      });
    }

    // Remove the item with the specified no
    section.itemList = section.itemList.filter(
      (item) => item.no !== parseInt(itemNo)
    );

    // Re-number the remaining items
    section.itemList = section.itemList.map((item, index) => {
      let newItem = item.toObject ? item.toObject() : { ...item };
      newItem.no = index + 1;
      return newItem;
    });

    await section.save();

    return res.status(200).json({
      success: true,
      message: "Item deleted successfully",
      data: section
    });
  } catch (error) {
    console.error("Error deleting item:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete item",
      error: error.message
    });
  }
};
