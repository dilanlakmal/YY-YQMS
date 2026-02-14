import { 
SubConDefect,           
} from "../../MongoDB/dbConnectionController.js";
 
// GET all defects with filtering
export const getAllDefects = async (req, res) => {
  try {
      let query = {};
      if (req.query.DefectCode) {
        query.DefectCode = req.query.DefectCode;
      }
      if (req.query.DisplayCode) {
        query.DisplayCode = req.query.DisplayCode;
      }
      if (req.query.DefectNameEng) {
        query.DefectNameEng = { $regex: req.query.DefectNameEng, $options: "i" };
      }
      const defects = await SubConDefect.find(query).sort({ DisplayCode: 1 });
      res.json(defects);
    } catch (error) {
      console.error("Error fetching sub-con defects for management:", error);
      res.status(500).json({ error: "Failed to fetch defects" });
    }
};

// POST a new defect
export const saveSubConSewingDefect = async (req, res) => {
  try {
      // Auto-increment 'no' and 'DisplayCode'
      const lastDefect = await SubConDefect.findOne().sort({ no: -1 });
      const newNo = lastDefect ? lastDefect.no + 1 : 1;
  
      const lastDisplayCodeDefect = await SubConDefect.findOne().sort({
        DisplayCode: -1
      });
      const newDisplayCode = lastDisplayCodeDefect
        ? lastDisplayCodeDefect.DisplayCode + 1
        : 1;
  
      const newDefect = new SubConDefect({
        ...req.body,
        no: newNo,
        DisplayCode: newDisplayCode
      });
      await newDefect.save();
      res.status(201).json(newDefect);
    } catch (error) {
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ error: "A defect with this Defect Code already exists." });
      }
      console.error("Error creating sub-con defect:", error);
      res.status(500).json({ error: "Failed to create defect" });
    }
};

// PUT (update) an existing defect by ID
export const updateSubConSewingDefect = async (req, res) => {
  try {
      const { id } = req.params;
      // Do not allow 'no' or 'DisplayCode' to be updated
      const { no, DisplayCode, ...updateData } = req.body;
  
      const updatedDefect = await SubConDefect.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true
      });
      if (!updatedDefect) {
        return res.status(404).json({ error: "Defect not found." });
      }
      res.json(updatedDefect);
    } catch (error) {
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ error: "A defect with this Defect Code already exists." });
      }
      console.error("Error updating sub-con defect:", error);
      res.status(500).json({ error: "Failed to update defect" });
    }
};

// DELETE an existing defect by its ID
export const deleteSubConSewingDefect = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedDefect = await SubConDefect.findByIdAndDelete(id);

    if (!deletedDefect) {
      return res.status(404).json({ error: "Defect not found." });
    }

    res.json({ message: "Defect deleted successfully." });
  } catch (error) {
    console.error("Error deleting sub-con defect:", error);
    res.status(500).json({ error: "Failed to delete defect" });
  }
};