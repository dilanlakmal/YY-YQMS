import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  Save,
  Loader2,
  Camera,
  Edit3,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";
import YPivotQATemplatesPhotos from "../QATemplates/YPivotQATemplatesPhotos";

// ==============================================================================
// INTERNAL COMPONENT: AUTO-DISMISS STATUS MODAL
// ==============================================================================
const AutoDismissModal = ({ isOpen, onClose, type, message }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 1500); // Auto close after 1.5 seconds
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSuccess = type === "success";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px] animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center gap-3 min-w-[250px] transform scale-100 transition-all">
        <div
          className={`p-3 rounded-full ${
            isSuccess
              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-8 h-8" />
          ) : (
            <AlertCircle className="w-8 h-8" />
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white text-center">
          {isSuccess ? "Success" : "Error"}
        </h3>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 text-center">
          {message}
        </p>
      </div>
    </div>,
    document.body
  );
};

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================
const YPivotQAInspectionPhotoDataSave = ({
  reportData,
  onUpdatePhotoData,
  reportId,
  isReportSaved,
  onSaveSuccess
}) => {
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);

  // NEW: Track update mode vs save mode
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  // NEW: Status Modal State
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    message: ""
  });

  // 1. Determine Allowed Sections based on Template (Logic from Determination component)
  const selectedTemplate = reportData?.selectedTemplate;

  const allowedSectionIds = useMemo(() => {
    if (!selectedTemplate || !selectedTemplate.SelectedPhotoSectionList) {
      return [];
    }
    return selectedTemplate.SelectedPhotoSectionList.map(
      (item) => item.PhotoSectionID
    );
  }, [selectedTemplate]);

  // 2. Fetch Existing Data (Logic from Header Data Save component)
  useEffect(() => {
    const fetchExistingPhotoData = async () => {
      if (!reportId) return;

      setLoadingData(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}`
        );

        if (res.data.success && res.data.data.photoData) {
          const backendPhotoData = res.data.data.photoData;

          // LOGIC: If backend returns non-empty array, set button to Update
          if (Array.isArray(backendPhotoData) && backendPhotoData.length > 0) {
            setIsUpdateMode(true);
          } else {
            setIsUpdateMode(false);
          }

          const newRemarks = {};
          const newCapturedImages = {};

          // Flatten the nested structure back to UI State keys
          backendPhotoData.forEach((section) => {
            const secId = section.sectionId;

            section.items.forEach((item) => {
              const itemNo = item.itemNo;

              // Restore Remarks
              if (item.remarks) {
                const key = `${secId}_${itemNo}`;
                newRemarks[key] = item.remarks;
              }

              // Restore Images
              if (item.images && item.images.length > 0) {
                item.images.forEach((img, idx) => {
                  const key = `${secId}_${itemNo}_${idx}`;

                  let displayUrl = img.imageURL;
                  if (
                    displayUrl &&
                    !displayUrl.startsWith("http") &&
                    !displayUrl.startsWith("data:")
                  ) {
                    displayUrl = `${API_BASE_URL}${displayUrl}`;
                  }

                  newCapturedImages[key] = {
                    id: img.imageId,
                    url: displayUrl,
                    imgSrc: displayUrl,
                    history: []
                  };
                });
              }
            });
          });

          onUpdatePhotoData(
            {
              remarks: newRemarks,
              capturedImages: newCapturedImages
            },
            { isFromBackend: true }
          );
        }
      } catch (error) {
        console.error("Error fetching existing photo data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    // Check if we should load data
    // If we have reportId, we should check/sync, unless we are certain we have latest
    // Using simple heuristic: if reportId exists, fetch unless specifically blocked
    if (reportId) {
      // If we already have local data (e.g. from QR scan initial load), we assume it's an update
      const hasLocalData =
        Object.keys(reportData.photoData?.capturedImages || {}).length > 0;

      if (!hasLocalData) {
        fetchExistingPhotoData();
      } else {
        // Data exists locally (from QR hydration likely), so it is an Update scenario
        setIsUpdateMode(true);
      }
    }
  }, [reportId]);

  // 3. Save Handler
  const handleSavePhotoData = async () => {
    if (!isReportSaved || !reportId) {
      setStatusModal({
        isOpen: true,
        type: "error",
        message: "Please save Order information first."
      });
      return;
    }

    setSaving(true);
    try {
      // We need the full Section/Item definitions to send names to backend
      const configRes = await axios.get(
        `${API_BASE_URL}/api/qa-sections-photos`
      );
      const allSections = configRes.data.data;

      // Filter only sections relevant to this report
      const relevantSections = allSections.filter((sec) =>
        allowedSectionIds.includes(sec._id)
      );

      const payloadData = relevantSections
        .map((section) => {
          const processedItems = section.itemList.map((item) => {
            const itemKeyBase = `${section._id}_${item.no}`;

            // Get Remarks
            const itemRemark =
              (reportData.photoData?.remarks || {})[itemKeyBase] || "";

            // Get Images for this item
            const itemImages = Object.keys(
              reportData.photoData?.capturedImages || {}
            )
              .filter((k) => k.startsWith(`${itemKeyBase}_`))
              .sort((a, b) => {
                // Sort by index suffix to maintain order
                const idxA = parseInt(a.split("_")[2]);
                const idxB = parseInt(b.split("_")[2]);
                return idxA - idxB;
              })
              .map((k) => {
                const img = reportData.photoData.capturedImages[k];

                let payloadImageURL = null;
                let payloadImgSrc = null;

                if (img.url.startsWith("data:")) {
                  // New Image -> Base64
                  payloadImgSrc = img.url;
                  payloadImageURL = null;
                } else {
                  // Existing Image -> Relative URL
                  payloadImageURL = img.url.replace(API_BASE_URL, "");
                  payloadImgSrc = null;
                }

                return {
                  id: img.id,
                  imageURL: payloadImageURL,
                  imgSrc: payloadImgSrc
                };
              });

            return {
              itemNo: item.no,
              itemName: item.itemName,
              remarks: itemRemark,
              images: itemImages
            };
          });

          // Keep items if they have remarks OR images.
          const itemsWithData = processedItems.filter(
            (i) => i.remarks || i.images.length > 0
          );

          return {
            sectionId: section._id,
            sectionName: section.sectionName,
            items: itemsWithData
          };
        })
        .filter((sec) => sec.items.length > 0); // Only send sections with data

      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/update-photo-data`,
        {
          reportId: reportId,
          photoData: payloadData
        }
      );

      if (res.data.success) {
        setIsUpdateMode(true);
        if (onSaveSuccess) {
          onSaveSuccess();
        }
        setStatusModal({
          isOpen: true,
          type: "success",
          message: isUpdateMode
            ? "Photo Data Updated Successfully!"
            : "Photo Data Saved Successfully!"
        });
      }
    } catch (error) {
      console.error("Error saving photo data:", error);
      setStatusModal({
        isOpen: true,
        type: "error",
        message: "Failed to save photo data."
      });
    } finally {
      setSaving(false);
    }
  };

  // 4. Render Loading State
  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="ml-3 text-gray-600 font-medium">
          Loading existing photos...
        </span>
      </div>
    );
  }

  // 5. Render Empty/Warning State if no template selected
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
          Please select a Report Type in the "Order" tab to configure which
          photos are required.
        </p>
      </div>
    );
  }

  // 6. Render Not Required State
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
          photos.
        </p>
      </div>
    );
  }

  return (
    <div className="relative pb-24">
      {/* 1. Configuration Context Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-4 shadow-lg text-white flex justify-between items-center mb-6">
        <div>
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Camera className="w-5 h-5" />
            Photos
          </h2>
          <p className="text-xs text-orange-100 opacity-90">
            {allowedSectionIds.length > 0
              ? `Sections for: ${selectedTemplate.ReportType}`
              : `Warning: No specific photo sections configured for ${selectedTemplate.ReportType}`}
          </p>
        </div>
        <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">
          {allowedSectionIds.length} Sections
        </div>
      </div>

      {/* 2. UI Component */}
      <YPivotQATemplatesPhotos
        allowedSectionIds={allowedSectionIds}
        reportData={reportData}
        reportId={reportId}
        onUpdatePhotoData={onUpdatePhotoData}
      />

      {/* 3. Floating Save/Update Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40">
        <div className="max-w-8xl mx-auto flex justify-end">
          <button
            onClick={handleSavePhotoData}
            disabled={!isReportSaved || saving}
            className={`
              flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95
              ${
                !isReportSaved
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                  : isUpdateMode
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  : "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white"
              }
            `}
            title={
              !isReportSaved
                ? "Save Order Data first"
                : isUpdateMode
                ? "Update Photo Data"
                : "Save Photo Data"
            }
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isUpdateMode ? "Updating..." : "Saving..."}
              </>
            ) : (
              <>
                {isUpdateMode ? (
                  <Edit3 className="w-5 h-5" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {isUpdateMode ? "Update Photo Data" : "Save Photo Data"}
              </>
            )}
          </button>
        </div>
      </div>

      {/* 4. Status Modal */}
      <AutoDismissModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
        type={statusModal.type}
        message={statusModal.message}
      />
    </div>
  );
};

export default YPivotQAInspectionPhotoDataSave;
