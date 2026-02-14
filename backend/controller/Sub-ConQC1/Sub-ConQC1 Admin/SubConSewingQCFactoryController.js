import {  
SubconSewingFactory,            
} from "../../MongoDB/dbConnectionController.js";

// --- FACTORY MANAGEMENT ---

 // GET all factories (can also be used for filtering by name)
 export const getSubConSewingFactory = async (req, res) => {
  try {
      let query = {};
      if (req.query.factory) {
        // Using regex for partial matching, case-insensitive
        query.factory = { $regex: req.query.factory, $options: "i" };
      }
      const factories = await SubconSewingFactory.find(query).sort({ no: 1 });
      res.json(factories);
    } catch (error) {
      console.error("Error fetching sub-con factories:", error);
      res.status(500).json({ error: "Failed to fetch factories" });
    }
 };

 // POST a new factory
 export const saveSubConSewingFactory = async (req, res) => {
  try {
    // Auto-increment 'no' field
    const lastFactory = await SubconSewingFactory.findOne().sort({ no: -1 });
    const newNo = lastFactory ? lastFactory.no + 1 : 1;

    const newFactory = new SubconSewingFactory({
      ...req.body,
      no: newNo
    });
    await newFactory.save();
    res.status(201).json(newFactory);
  } catch (error) {
    // Handle potential duplicate factory name error
    if (error.code === 11000) {
      return res
        .status(400)
        .json({ error: "A factory with this name already exists." });
    }
    // General error handling
    console.error("Error creating sub-con factory:", error);
    res.status(500).json({ error: "Failed to create factory" });
  } 
 };

 // PUT (update) an existing factory by its ID
 export const updateSubConSewingFactory = async (req, res) => {
  try {
      const { id } = req.params;
      const updatedFactory = await SubconSewingFactory.findByIdAndUpdate(
        id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!updatedFactory) {
        return res.status(404).json({ error: "Factory not found." });
      }
      res.json(updatedFactory);
    } catch (error) {
      if (error.code === 11000) {
        return res
          .status(400)
          .json({ error: "A factory with this name already exists." });
      }
      console.error("Error updating sub-con factory:", error);
      res.status(500).json({ error: "Failed to update factory" });
    }
 };

 // DELETE an existing factory by its ID
 export const deleteSubConSewingFactory = async (req, res) => {
  try {
      const { id } = req.params;
      const deletedFactory = await SubconSewingFactory.findByIdAndDelete(id);
  
      if (!deletedFactory) {
        return res.status(404).json({ error: "Factory not found." });
      }
  
      res.json({ message: "Factory deleted successfully." });
    } catch (error) {
      console.error("Error deleting sub-con factory:", error);
      res.status(500).json({ error: "Failed to delete factory" });
    }
 };


 // --- QC LIST MANAGEMENT IN SUB CON---
// GET: Fetch a flattened list of all QCs from all factories for the management table
export const getAllSubConQCList = async (req, res) => {
  try {
      const factories = await SubconSewingFactory.find({
        "qcList.0": { $exists: true }
      }).lean();
  
      const allQCs = factories.flatMap((factory) =>
        factory.qcList.map((qc) => ({
          factoryId: factory._id,
          factoryName: factory.factory,
          qcMongoId: qc._id, // Mongoose subdocument ID
          qcIndex: qc.qcIndex,
          qcID: qc.qcID,
          qcName: qc.qcName
        }))
      );
  
      res.json(allQCs);
    } catch (error) {
      console.error("Error fetching all QCs:", error);
      res.status(500).json({ error: "Failed to fetch QC list" });
    }
};

// POST: Add a new QC to a specific factory's qcList
export const addSpecificSubConQCList = async (req, res) => {
  const { factoryId } = req.params;
    const { qcID, qcName } = req.body;

    try {
      const factory = await SubconSewingFactory.findById(factoryId);
      if (!factory) {
        return res.status(404).json({ error: "Factory not found." });
      }

      // Check for duplicate qcID within the same factory
      if (factory.qcList.some((qc) => qc.qcID === qcID)) {
        return res
          .status(409)
          .json({ error: "This QC ID already exists for this factory." });
      }

      const newQcIndex =
        factory.qcList.length > 0
          ? Math.max(...factory.qcList.map((q) => q.qcIndex)) + 1
          : 1;

      const newQc = {
        qcIndex: newQcIndex,
        qcID,
        qcName
      };

      factory.qcList.push(newQc);
      await factory.save();

      res.status(201).json(factory.qcList[factory.qcList.length - 1]); // Return the newly added QC
    } catch (error) {
      console.error("Error adding QC:", error);
      res.status(500).json({ error: "Failed to add QC" });
    }
};

// PUT: Update a specific QC in a factory's qcList
export const updateSpecificSubConQCList = async (req, res) => {
  const { qcMongoId } = req.params;
    const { qcID, qcName } = req.body;

    try {
      const factory = await SubconSewingFactory.findOne({
        "qcList._id": qcMongoId
      });
      if (!factory) {
        return res.status(404).json({ error: "QC not found in any factory." });
      }

      const qcToUpdate = factory.qcList.id(qcMongoId);
      qcToUpdate.qcID = qcID;
      qcToUpdate.qcName = qcName;

      await factory.save();
      res.json(qcToUpdate);
    } catch (error) {
      console.error("Error updating QC:", error);
      res.status(500).json({ error: "Failed to update QC" });
    }
};

// DELETE: Remove a specific QC from a factory's qcList
export const deleteSpecificSubConQCList = async (req, res) => {
  const { qcMongoId } = req.params;

    try {
      const result = await SubconSewingFactory.updateOne(
        { "qcList._id": qcMongoId },
        { $pull: { qcList: { _id: qcMongoId } } }
      );

      if (result.nModified === 0) {
        return res.status(404).json({ error: "QC not found." });
      }

      res.json({ message: "QC deleted successfully." });
    } catch (error) {
      console.error("Error deleting QC:", error);
      res.status(500).json({ error: "Failed to delete QC" });
    }
};
