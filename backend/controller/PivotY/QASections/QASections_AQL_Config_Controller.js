import {
  QASectionsAqlBuyerConfig,
  QASectionsAqlSampleLetters,
  QASectionsAqlValues
} from "../../MongoDB/dbConnectionController.js";

// Helper function to generate the SampleData array
const generateSampleData = async (InspectionType, Level, AQLLevel) => {
  // 1. Get Batch/Sample Letter Config
  const lettersDoc = await QASectionsAqlSampleLetters.findOne({
    InspectionType,
    Level
  });

  if (!lettersDoc) {
    console.error(
      `❌ CONFIG ERROR: Sample Letter not found for Type: ${InspectionType}, Level: ${Level}`
    );
    throw new Error(`Configuration not found for ${InspectionType} - ${Level}`);
  }

  // 2. Get all AQL Values
  const allValuesDocs = await QASectionsAqlValues.find();
  if (allValuesDocs.length === 0) {
    console.error(
      "❌ CONFIG ERROR: No AQL Values found in qa_sections_aql_values collection"
    );
  }

  // 3. Map through batches
  const sampleData = lettersDoc.BatchSize.map((batch) => {
    const valDoc = allValuesDocs.find(
      (v) => v.SampleLetter === batch.SampleLetter
    );

    if (!valDoc) return null;

    const aqlData = valDoc.AQLData.find(
      (ad) => ad.AQLLevel === Number(AQLLevel)
    );

    const Ac = aqlData ? aqlData.Ac : 0;
    const Re = aqlData ? aqlData.Re : 0;

    return {
      BatchName: batch.BatchName,
      Min: batch.Min,
      Max: batch.Max,
      SampleLetter: batch.SampleLetter,
      SampleSize: valDoc.SampleSize,
      Ac,
      Re
    };
  }).filter((item) => item !== null);

  return sampleData;
};

// UPSERT (Create or Update) Configurations
export const UpsertBuyerConfig = async (req, res) => {
  const configs = req.body;

  if (!Array.isArray(configs) || configs.length === 0) {
    return res.status(400).json({ message: "Invalid payload" });
  }

  try {
    const results = [];

    for (const config of configs) {
      const { Buyer, InspectionType, Level, Status, AQLLevel } = config;

      // Generate the calculated array
      const generatedSampleData = await generateSampleData(
        InspectionType,
        Level,
        AQLLevel
      );

      // Upsert into DB
      const updatedDoc = await QASectionsAqlBuyerConfig.findOneAndUpdate(
        { Buyer, Status },
        {
          Buyer,
          InspectionType,
          Level,
          Status,
          AQLLevel,
          SampleData: generatedSampleData
        },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      results.push(updatedDoc);
    }

    console.log("----------- AQL BUYER CONFIG UPSERT END -----------");
    res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("❌ CONTROLLER ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

// GET Configurations
export const GetBuyerConfigs = async (req, res) => {
  try {
    const data = await QASectionsAqlBuyerConfig.find().sort({
      Buyer: 1,
      Status: 1
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
