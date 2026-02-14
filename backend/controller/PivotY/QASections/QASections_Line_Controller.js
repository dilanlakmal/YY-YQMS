import { QASectionsLine } from "../../MongoDB/dbConnectionController.js";

/**
 * CREATE Line
 */
export const CreateLine = async (req, res) => {
  try {
    const { LineNo, ProductType, Description, Type } = req.body;

    if (!LineNo) {
      return res
        .status(400)
        .json({ success: false, message: "Line No is required" });
    }

    const newLine = new QASectionsLine({
      LineNo,
      ProductType: ProductType || "KNIT",
      Description,
      Type: Type || "Main"
    });

    await newLine.save();

    res
      .status(201)
      .json({
        success: true,
        message: "Line created successfully",
        data: newLine
      });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "Line No already exists" });
    }
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * GET All Lines (Sorted numerically if possible, else string)
 */
export const GetLines = async (req, res) => {
  try {
    // We sort by createdAt for now, or you can add custom logic to sort LineNo strings numerically
    const lines = await QASectionsLine.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: lines });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * UPDATE Line
 */
export const UpdateLine = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedLine = await QASectionsLine.findByIdAndUpdate(id, updateData, {
      new: true
    });

    if (!updatedLine) {
      return res
        .status(404)
        .json({ success: false, message: "Line not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Line updated", data: updatedLine });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * DELETE Line
 */
export const DeleteLine = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedLine = await QASectionsLine.findByIdAndDelete(id);

    if (!deletedLine) {
      return res
        .status(404)
        .json({ success: false, message: "Line not found" });
    }

    res.status(200).json({ success: true, message: "Line deleted" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
