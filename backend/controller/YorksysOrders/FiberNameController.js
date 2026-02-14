import { HumidityFiberName } from "../MongoDB/dbConnectionController.js";

// Create Fiber
export const createFiber = async (req, res) => {
  try {
    const { fiberName, fiberNameKhmer, fiberNameChi } = req.body;

    const existingFiber = await HumidityFiberName.findOne({ fiberName });
    if (existingFiber) {
      return res.status(400).json({ message: "Fiber name already exists" });
    }

    const newFiber = new HumidityFiberName({
      fiberName,
      fiberNameKhmer,
      fiberNameChi,
    });

    await newFiber.save();
    res
      .status(201)
      .json({ message: "Fiber created successfully", data: newFiber });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating fiber", error: error.message });
  }
};

// Get All Fibers
export const getAllFibers = async (req, res) => {
  try {
    const fibers = await HumidityFiberName.find({}).sort({ fiberName: 1 });
    res.status(200).json(fibers);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching fibers", error: error.message });
  }
};

// Update Fiber
export const updateFiber = async (req, res) => {
  try {
    const { id } = req.params;
    const { fiberName, fiberNameKhmer, fiberNameChi } = req.body;

    const updatedFiber = await HumidityFiberName.findByIdAndUpdate(
      id,
      { fiberName, fiberNameKhmer, fiberNameChi },
      { new: true },
    );

    if (!updatedFiber) {
      return res.status(404).json({ message: "Fiber not found" });
    }

    res
      .status(200)
      .json({ message: "Fiber updated successfully", data: updatedFiber });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating fiber", error: error.message });
  }
};

// Delete Fiber
export const deleteFiber = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedFiber = await HumidityFiberName.findByIdAndDelete(id);

    if (!deletedFiber) {
      return res.status(404).json({ message: "Fiber not found" });
    }

    res.status(200).json({ message: "Fiber deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting fiber", error: error.message });
  }
};
