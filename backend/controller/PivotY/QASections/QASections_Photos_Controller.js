import { QASectionsPhotos } from "../../MongoDB/dbConnectionController.js";

/* ============================================================
   🆕 QA SECTIONS PHOTOS - CRUD Endpoints Controllers
   ============================================================ */

/**
 * POST /api/qa-sections-photos
 * Controller: Creates a new photo section
 */
export const CreatePhotoSection = async (req, res) => {
  try {
    const { sectionName, itemList } = req.body;

    // Validate required fields
    if (!sectionName || !itemList || !Array.isArray(itemList)) {
      return res.status(400).json({
        success: false,
        message: "sectionName and itemList array are required"
      });
    }

    // Check for duplicate section name
    const existingSection = await QASectionsPhotos.findOne({ sectionName });
    if (existingSection) {
      return res.status(409).json({
        success: false,
        message: `Section "${sectionName}" already exists`
      });
    }

    const newSection = new QASectionsPhotos({
      sectionName,
      itemList
    });

    await newSection.save();

    return res.status(201).json({
      success: true,
      message: "Photo section created successfully",
      data: newSection
    });
  } catch (error) {
    console.error("Error creating photo section:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate section name"
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create photo section",
      error: error.message
    });
  }
};

/**
 * GET /api/qa-sections-photos
 * Controller: Retrieves all photo sections sorted by sectionName
 */
export const GetPhotoSections = async (req, res) => {
  try {
    const sections = await QASectionsPhotos.find().sort({ sectionName: 1 });

    return res.status(200).json({
      success: true,
      count: sections.length,
      data: sections
    });
  } catch (error) {
    console.error("Error fetching photo sections:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch photo sections",
      error: error.message
    });
  }
};

/**
 * GET /api/qa-sections-photos/:id
 * Controller: Retrieves a specific photo section by ID
 */
export const GetSpecificPhotoSection = async (req, res) => {
  try {
    const section = await QASectionsPhotos.findById(req.params.id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Photo section not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: section
    });
  } catch (error) {
    console.error("Error fetching photo section:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch photo section",
      error: error.message
    });
  }
};

/**
 * PUT /api/qa-sections-photos/:id
 * Controller: Updates a specific photo section
 */
export const UpdatePhotoSection = async (req, res) => {
  try {
    const { sectionName, itemList } = req.body;

    // Validate required fields
    if (!sectionName || !itemList || !Array.isArray(itemList)) {
      return res.status(400).json({
        success: false,
        message: "sectionName and itemList array are required"
      });
    }

    // Check if updating to a name that already exists (excluding current document)
    const existingSection = await QASectionsPhotos.findOne({
      sectionName,
      _id: { $ne: req.params.id }
    });

    if (existingSection) {
      return res.status(409).json({
        success: false,
        message: `Section "${sectionName}" already exists`
      });
    }

    const updatedSection = await QASectionsPhotos.findByIdAndUpdate(
      req.params.id,
      { sectionName, itemList },
      { new: true, runValidators: true }
    );

    if (!updatedSection) {
      return res.status(404).json({
        success: false,
        message: "Photo section not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Photo section updated successfully",
      data: updatedSection
    });
  } catch (error) {
    console.error("Error updating photo section:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update photo section",
      error: error.message
    });
  }
};

/**
 * DELETE /api/qa-sections-photos/:id
 * Controller: Deletes a specific photo section
 */
export const DeletePhotoSection = async (req, res) => {
  try {
    const deletedSection = await QASectionsPhotos.findByIdAndDelete(
      req.params.id
    );

    if (!deletedSection) {
      return res.status(404).json({
        success: false,
        message: "Photo section not found"
      });
    }

    return res.status(200).json({
      success: true,
      message: "Photo section deleted successfully",
      data: deletedSection
    });
  } catch (error) {
    console.error("Error deleting photo section:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete photo section",
      error: error.message
    });
  }
};

/**
 * POST /api/qa-sections-photos/:id/items
 * Controller: Adds a new item to an existing photo section
 */
export const AddPhotoSectionItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { itemName, maxCount } = req.body;

    if (!itemName || maxCount === undefined) {
      return res.status(400).json({
        success: false,
        message: "itemName and maxCount are required"
      });
    }

    const section = await QASectionsPhotos.findById(id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Photo section not found"
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
 * DELETE /api/qa-sections-photos/:id/items/:itemNo
 * Controller: Deletes a specific item from a photo section
 */
export const DeletePhotoSectionItem = async (req, res) => {
  try {
    const { id, itemNo } = req.params;

    const section = await QASectionsPhotos.findById(id);

    if (!section) {
      return res.status(404).json({
        success: false,
        message: "Photo section not found"
      });
    }

    // Remove the item with the specified no
    section.itemList = section.itemList.filter(
      (item) => item.no !== parseInt(itemNo)
    );

    // Re-number the remaining items
    section.itemList = section.itemList.map((item, index) => {
      // Create a new object to avoid modifying the original subdocument in-place before saving
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
