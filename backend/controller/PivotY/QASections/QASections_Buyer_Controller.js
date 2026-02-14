import { QASectionsBuyer } from "../../MongoDB/dbConnectionController.js";

// POST /api/qa-sections-buyers
export const CreateBuyer = async (req, res) => {
  try {
    const { buyer, buyerFullName, additionalInfo } = req.body;
    if (!buyer) {
      return res
        .status(400)
        .json({ success: false, message: "Buyer name is required." });
    }
    const newBuyer = new QASectionsBuyer({
      buyer,
      buyerFullName,
      additionalInfo
    });
    await newBuyer.save();
    res.status(201).json({
      success: true,
      message: "Buyer created successfully.",
      data: newBuyer
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "This buyer name already exists." });
    }
    res.status(500).json({
      success: false,
      message: "Failed to create buyer.",
      error: error.message
    });
  }
};

// GET /api/qa-sections-buyers
export const GetBuyers = async (req, res) => {
  try {
    const buyers = await QASectionsBuyer.find().sort({ buyer: 1 });
    res.status(200).json({ success: true, count: buyers.length, data: buyers });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch buyers.",
      error: error.message
    });
  }
};

// PUT /api/qa-sections-buyers/:id
export const UpdateBuyer = async (req, res) => {
  try {
    const { buyer, buyerFullName, additionalInfo } = req.body;
    if (!buyer) {
      return res
        .status(400)
        .json({ success: false, message: "Buyer name is required." });
    }
    const updatedBuyer = await QASectionsBuyer.findByIdAndUpdate(
      req.params.id,
      { buyer, buyerFullName, additionalInfo },
      { new: true, runValidators: true }
    );
    if (!updatedBuyer) {
      return res
        .status(404)
        .json({ success: false, message: "Buyer not found." });
    }
    res.status(200).json({
      success: true,
      message: "Buyer updated successfully.",
      data: updatedBuyer
    });
  } catch (error) {
    if (error.code === 11000) {
      return res
        .status(409)
        .json({ success: false, message: "This buyer name already exists." });
    }
    res.status(500).json({
      success: false,
      message: "Failed to update buyer.",
      error: error.message
    });
  }
};

// DELETE /api/qa-sections-buyers/:id
export const DeleteBuyer = async (req, res) => {
  try {
    const deletedBuyer = await QASectionsBuyer.findByIdAndDelete(req.params.id);
    if (!deletedBuyer) {
      return res
        .status(404)
        .json({ success: false, message: "Buyer not found." });
    }
    res
      .status(200)
      .json({ success: true, message: "Buyer deleted successfully." });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete buyer.",
      error: error.message
    });
  }
};
