import React from "react";
import MeasurementSpecsShared from "./MeasurementSpecsShared";

const QASectionsMeasurementAWSelection = () => {
  return (
    <MeasurementSpecsShared
      title="After Wash Spec Selection"
      subtitle="Configure pattern specs from Order Details."
      colorTheme="purple"
      apiEndpoints={{
        get: "/api/qa-sections/measurement-specs-aw",
        save: "/api/qa-sections/measurement-specs-aw/save",
      }}
      dataKeys={{
        allSpecs: "AllAfterWashSpecs",
        selectedSpecs: "selectedAfterWashSpecs",
      }}
    />
  );
};

export default QASectionsMeasurementAWSelection;
