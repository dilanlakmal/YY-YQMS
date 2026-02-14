import {
  // __dirname,
  __backendDir,
} from "../Config/appConfig.js";

export const getBuyerFromMoNumber = (moNo) => {
  if (!moNo) return "Other";

  // Check for the most specific "PMHA" for ATACZ
  if (moNo.includes("PMHA")) return "ATACZ";

  // Check for the more specific "COW" for True North
  if (moNo.includes("COW")) return "TRUE NORTH";

  // Then, check for the more general "CO" for Costco
  if (moNo.includes("COC")) return "Costco";
  if (moNo.includes("COT")) return "Costco";
  if (moNo.includes("COX")) return "Costco";
  if (moNo.includes("COA")) return "Costco";

  // The rest of the original rules
  if (moNo.includes("GPAR")) return "Aritzia";
  if (moNo.includes("PTAR")) return "Aritzia";

  if (moNo.includes("PTKA")) return "KIT AND ACE";

  if (moNo.includes("PTRT")) return "Reitmans";
  if (moNo.includes("GPRT")) return "Reitmans";

  if (moNo.includes("GPEA")) return "G.A.";

  if (moNo.includes("GPLY")) return "LUNYA";

  if (moNo.includes("GPOF")) return "OAK AND FORT";

  if (moNo.includes("GPBB")) return "Bjorn Borg";

  if (moNo.includes("GMPA")) return "SWEATERS  P.A.R. APPAREL LLC";

  if (moNo.includes("GMGF")) return "SWEATER FAMILY";

  if (moNo.includes("GMOF")) return "SWEATER OAK AND FORT";

  if (moNo.includes("PMCOC")) return "SWEATER COSTCO";

  // if (moNo.includes("GPAF")) return "ANF";
  // if (moNo.includes("PTAF")) return "ANF";

  // Default case if no other rules match
  return "Other";
};
