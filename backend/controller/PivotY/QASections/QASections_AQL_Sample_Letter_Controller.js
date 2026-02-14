import {
  QASectionsAqlSampleLetters,
  QASectionsAqlValues
} from "../../MongoDB/dbConnectionController.js";

// Get all Sample Letters (Charts)
export const getAQLSampleLetters = async (req, res) => {
  try {
    const data = await QASectionsAqlSampleLetters.find().sort({
      createdAt: -1
    });
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new Sample Letter Chart
export const createAQLSampleLetter = async (req, res) => {
  const newData = new QASectionsAqlSampleLetters(req.body);
  try {
    await newData.save();
    res.status(201).json(newData);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

// Update existing Chart by ID
export const updateAQLSampleLetter = async (req, res) => {
  const { id } = req.params;
  const data = req.body;

  try {
    const updatedData = await QASectionsAqlSampleLetters.findByIdAndUpdate(
      id,
      data,
      { new: true }
    );
    if (!updatedData) {
      return res.status(404).json({ message: "Sample Letter chart not found" });
    }
    res.status(200).json(updatedData);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

// Delete Chart by ID
export const deleteAQLSampleLetter = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedData = await QASectionsAqlSampleLetters.findByIdAndDelete(id);
    if (!deletedData) {
      return res.status(404).json({ message: "Sample Letter chart not found" });
    }
    res
      .status(200)
      .json({ message: "Sample Letter chart deleted successfully" });
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

// ---------------------------------------------------------
// Calculate AQL Result (Sample Letter -> Ac/Re Values)
// ---------------------------------------------------------
export const calculateAQLResult = async (req, res) => {
  try {
    const { InspectionType, Level, InspectedQty, AQLLevel } = req.body;

    // 1. Validate Inputs
    if (
      !InspectionType ||
      !Level ||
      InspectedQty === undefined ||
      AQLLevel === undefined
    ) {
      return res.status(400).json({
        message:
          "Missing required fields: InspectionType, Level, InspectedQty, or AQLLevel."
      });
    }

    const qty = Number(InspectedQty);
    const aqlLvl = Number(AQLLevel);

    // 2. Find the Sample Letter Document based on Type and Level
    const letterDoc = await QASectionsAqlSampleLetters.findOne({
      InspectionType,
      Level
    });

    if (!letterDoc) {
      return res.status(404).json({
        message: `No configuration found for InspectionType: '${InspectionType}' and Level: '${Level}'`
      });
    }

    // 3. Find the specific Batch Size object where InspectedQty fits between Min and Max
    const batchObj = letterDoc.BatchSize.find(
      (item) => qty >= item.Min && qty <= item.Max
    );

    if (!batchObj) {
      return res.status(404).json({
        message: `Inspected Qty ${qty} is out of range (Min/Max) for the selected level.`
      });
    }

    const sampleLetter = batchObj.SampleLetter;

    // 4. Find the AQL Values Document based on the Sample Letter found above
    const valuesDoc = await QASectionsAqlValues.findOne({
      SampleLetter: sampleLetter
    });

    if (!valuesDoc) {
      return res.status(404).json({
        message: `No AQL Value data found for Sample Letter: '${sampleLetter}'`
      });
    }

    // 5. Find the specific AQL Level Data (Ac, Re)
    // This acts as validation: if the AQL Level passed by user doesn't exist in the array, it returns undefined
    const aqlDataResult = valuesDoc.AQLData.find(
      (item) => item.AQLLevel === aqlLvl
    );

    if (!aqlDataResult) {
      // Optional: Get list of valid levels to show in error message
      const validLevels = valuesDoc.AQLData.map((x) => x.AQLLevel).join(", ");
      return res.status(400).json({
        message: `Invalid AQL Level: ${aqlLvl}. Valid levels for Sample Letter '${sampleLetter}' are: [${validLevels}]`
      });
    }

    // 6. Return the combined result
    res.status(200).json({
      success: true,
      data: {
        InspectionType,
        Level,
        InspectedQty,
        SampleLetter: sampleLetter,
        SampleSize: valuesDoc.SampleSize,
        AQLLevel: aqlDataResult.AQLLevel,
        Ac: aqlDataResult.Ac,
        Re: aqlDataResult.Re
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
