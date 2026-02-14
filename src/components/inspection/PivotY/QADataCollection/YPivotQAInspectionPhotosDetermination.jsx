import React, { useMemo } from "react";
import { Camera, AlertCircle } from "lucide-react";
import YPivotQATemplatesPhotos from "../QATemplates/YPivotQATemplatesPhotos";

const YPivotQAInspectionPhotosDetermination = ({
  reportData,
  onUpdatePhotoData
}) => {
  const selectedTemplate = reportData?.selectedTemplate;

  // Extract the IDs of the photo sections allowed by the selected template
  const allowedSectionIds = useMemo(() => {
    if (!selectedTemplate || !selectedTemplate.SelectedPhotoSectionList) {
      return [];
    }
    // Map the PhotoSectionID from the template schema to an array of strings
    return selectedTemplate.SelectedPhotoSectionList.map(
      (item) => item.PhotoSectionID
    );
  }, [selectedTemplate]);

  // If no template is selected yet
  if (!selectedTemplate) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 min-h-[400px]">
        <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
          <Camera className="w-10 h-10 text-indigo-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">
          Photos Section
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          Please select a Report Type in the "Report" tab to configure which
          photos are required for this inspection.
        </p>
      </div>
    );
  }

  // If template is selected but "Photos" config is set to "No"
  if (selectedTemplate.Photos === "No") {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 min-h-[400px]">
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <Camera className="w-10 h-10 text-gray-400" />
        </div>
        <h3 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">
          Photos Not Required
        </h3>
        <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
          The selected report type "
          <strong>{selectedTemplate.ReportType}</strong>" does not require
          photos
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Configuration Context Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-4 shadow-lg text-white flex justify-between items-center">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Photos
          </h2>
          <p className="text-xs text-orange-100 opacity-90">
            {allowedSectionIds.length > 0
              ? `Showing sections for: ${selectedTemplate.ReportType}`
              : `Warning: No specific photo sections configured for ${selectedTemplate.ReportType}`}
          </p>
        </div>
        <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
          {allowedSectionIds.length} Sections
        </div>
      </div>

      {/* Render the Photos Component with Filter and State Props */}
      <YPivotQATemplatesPhotos
        allowedSectionIds={allowedSectionIds}
        reportData={reportData}
        onUpdatePhotoData={onUpdatePhotoData}
      />
    </div>
  );
};

export default YPivotQAInspectionPhotosDetermination;
