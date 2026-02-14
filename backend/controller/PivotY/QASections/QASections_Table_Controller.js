import { QASectionsTable } from "../../MongoDB/dbConnectionController.js";

/**
 * CREATE Table
 */
export const CreateTable = async (req, res) => {
  try {
    const { TableNo, ProductType, Description, Type } = req.body;

    if (!TableNo) {
      return res
        .status(400)
        .json({ success: false, message: "Table No is required" });
    }

    const newTable = new QASectionsTable({
      TableNo,
      ProductType: ProductType || "KNIT",
      Description,
      Type: Type || "Main"
    });

    await newTable.save();

    res
      .status(201)
      .json({
        success: true,
        message: "Table created successfully",
        data: newTable
      });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Table No already exists" });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET All Tables
 */
export const GetTables = async (req, res) => {
  try {
    const tables = await QASectionsTable.find().sort({ TableNo: 1 });
    res.status(200).json({ success: true, data: tables });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * UPDATE Table
 */
export const UpdateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedTable = await QASectionsTable.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedTable) {
      return res
        .status(404)
        .json({ success: false, message: "Table not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Table updated", data: updatedTable });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * DELETE Table
 */
export const DeleteTable = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTable = await QASectionsTable.findByIdAndDelete(id);

    if (!deletedTable) {
      return res
        .status(404)
        .json({ success: false, message: "Table not found" });
    }

    res.status(200).json({ success: true, message: "Table deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
