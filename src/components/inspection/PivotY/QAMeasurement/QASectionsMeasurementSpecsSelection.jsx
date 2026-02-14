import React from "react";
import MeasurementSpecsShared from "./MeasurementSpecsShared";

const QASectionsMeasurementSpecsSelection = () => {
  return (
    <MeasurementSpecsShared
      title="Spec Selection (Before Wash)"
      subtitle="Search MO, Select Points, Save Configuration."
      colorTheme="indigo"
      apiEndpoints={{
        get: "/api/qa-sections/measurement-specs",
        save: "/api/qa-sections/measurement-specs/save",
      }}
      dataKeys={{
        allSpecs: "AllBeforeWashSpecs",
        selectedSpecs: "selectedBeforeWashSpecs",
      }}
      enableApplyToAW={true}
    />
  );
};

export default QASectionsMeasurementSpecsSelection;
