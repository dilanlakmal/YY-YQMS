import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  Save,
  Loader2,
  FileText,
  CheckCircle2,
  AlertCircle,
  Edit3
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";
import YPivotQATemplatesPPSheet from "../QATemplates/YPivotQATemplatesPPSheet";

// Helper: Convert Blob URL to File
const blobUrlToFile = async (blobUrl, filename = "image.jpg") => {
  try {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    return new File([blob], filename, { type: blob.type || "image/jpeg" });
  } catch (error) {
    console.error("[blobUrlToFile] Failed to convert:", blobUrl, error);
    return null;
  }
};

// Modal Component
const AutoDismissModal = ({ isOpen, onClose, type, message }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => onClose(), 1500);
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
              ? "bg-green-100 text-green-600"
              : "bg-red-100 text-red-600"
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

const YPivotQAInspectionPPSheetDataSave = ({
  orderData,
  selectedOrders,
  inspectionDate,
  reportData,
  onUpdatePPSheetData,
  reportId,
  isReportSaved
}) => {
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    message: ""
  });
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  // 1. Determine Pre-filled Data
  const prefilledData = useMemo(() => {
    const style =
      selectedOrders && selectedOrders.length > 0
        ? selectedOrders.join(", ")
        : "";
    const qty = orderData?.dtOrder?.totalQty
      ? orderData.dtOrder.totalQty.toString()
      : "";
    const date = inspectionDate || new Date().toISOString().split("T")[0];
    return { style, qty, date };
  }, [orderData, selectedOrders, inspectionDate]);

  // 2. Fetch Existing Data
  useEffect(() => {
    const fetchExistingPPSheetData = async () => {
      if (!reportId) return;
      // --- Check if data exists in props (Client Navigation) ---
      if (
        reportData.ppSheetData &&
        Object.keys(reportData.ppSheetData).length > 0
      ) {
        // If it has a timestamp, it was saved previously
        if (reportData.ppSheetData.timestamp) {
          setIsUpdateMode(true);
        }
        // --- Ensure images in props have full URLs ---
        // The parent might have passed raw backend data (relative paths)
        const rawImages = reportData.ppSheetData.images || [];
        const needsProcessing = rawImages.some(
          (img) =>
            img.url &&
            !img.url.startsWith("http") &&
            !img.url.startsWith("data:") &&
            !img.url.startsWith("blob:")
        );

        if (needsProcessing) {
          const processedImages = rawImages.map((img) => {
            let displayUrl = img.url || img.imageURL;
            if (
              displayUrl &&
              !displayUrl.startsWith("http") &&
              !displayUrl.startsWith("data:") &&
              !displayUrl.startsWith("blob:")
            ) {
              displayUrl = `${API_BASE_URL}${displayUrl}`;
            }
            return {
              ...img,
              url: displayUrl,
              imgSrc: displayUrl
            };
          });

          // Update parent state immediately to fix display
          if (onUpdatePPSheetData) {
            onUpdatePPSheetData({
              ...reportData.ppSheetData,
              images: processedImages
            });
          }
        }

        return;
      }

      setLoadingData(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}`
        );
        if (res.data.success && res.data.data.ppSheetData) {
          // --- Data found on server, enable Update Mode ---
          setIsUpdateMode(true);
          const backendData = res.data.data.ppSheetData;
          const processedImages = (backendData.images || []).map((img) => {
            let displayUrl = img.imageURL;
            if (
              displayUrl &&
              !displayUrl.startsWith("http") &&
              !displayUrl.startsWith("data:")
            ) {
              displayUrl = `${API_BASE_URL}${displayUrl}`;
            }
            return {
              id: img.imageId,
              url: displayUrl,
              imgSrc: displayUrl,
              imageURL: img.imageURL, // Preserve backend path
              history: []
            };
          });
          if (onUpdatePPSheetData)
            onUpdatePPSheetData({ ...backendData, images: processedImages });
        }
      } catch (error) {
        console.error("Error fetching PP Sheet data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    if (reportId) fetchExistingPPSheetData();
  }, [reportId]);

  // 3. Save Handler
  const handleSaveData = async () => {
    if (!isReportSaved || !reportId) {
      setStatusModal({
        isOpen: true,
        type: "error",
        message: "Please save Order information first."
      });
      return;
    }

    const currentData = reportData.ppSheetData;
    if (!currentData) {
      setStatusModal({
        isOpen: true,
        type: "error",
        message: "No data to save."
      });
      return;
    }

    setSaving(true);
    try {
      // A. COLLECT FILES
      const imageFiles = [];
      const imageMap = {};

      for (const img of currentData.images || []) {
        const imageId = img.id || `pp_${Date.now()}`;

        // 1. Existing Path
        if (img.imageURL && img.imageURL.startsWith("/")) {
          imageMap[imageId] = img.imageURL;
          continue;
        }

        // 2. Fallback: Path from Display URL
        if (
          !img.imageURL &&
          img.url &&
          img.url.includes("/storage/") &&
          !img.url.startsWith("blob:")
        ) {
          const relativePath = img.url.substring(img.url.indexOf("/storage/"));
          imageMap[imageId] = relativePath;
          continue;
        }

        // 3. Blob URL -> File
        if (img.url && img.url.startsWith("blob:")) {
          const file = await blobUrlToFile(img.url, `ppsheet_${imageId}.jpg`);
          if (file) imageFiles.push({ id: imageId, file });
        }
      }

      // B. UPLOAD FILES
      if (imageFiles.length > 0) {
        const formData = new FormData();
        imageFiles.forEach((item) => formData.append("images", item.file));

        const uploadRes = await axios.post(
          `${API_BASE_URL}/api/fincheck-inspection/upload-pp-sheet-images`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        if (uploadRes.data.success) {
          const paths = uploadRes.data.data.paths || [];
          imageFiles.forEach((item, index) => {
            if (paths[index]) imageMap[item.id] = paths[index];
          });
        }
      }

      // C. CONSTRUCT PAYLOAD
      const processedImages = (currentData.images || []).map((img) => {
        const imageId = img.id || `pp_${Date.now()}`;
        // Get uploaded path or fallback to existing property
        let finalPath = imageMap[imageId] || img.imageURL;

        return {
          id: imageId,
          imageURL: finalPath || null, // Null removes from DB
          imgSrc: null // Don't send base64/blob
        };
      });

      const payload = {
        ...currentData,
        images: processedImages
      };

      // D. SAVE DATA
      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/update-pp-sheet-data`,
        { reportId: reportId, ppSheetData: payload }
      );

      if (res.data.success) {
        // --- Set Update Mode on success ---
        setIsUpdateMode(true);
        setStatusModal({
          isOpen: true,
          type: "success",
          message: "PP Sheet Saved Successfully!"
        });

        // Update local state with new paths (important for subsequent saves)
        // We re-construct the local state to include the new imageURLs
        if (onUpdatePPSheetData) {
          const updatedImages = (currentData.images || []).map((img) => {
            const imageId = img.id || `pp_${Date.now()}`;
            const finalPath = imageMap[imageId] || img.imageURL;
            return {
              ...img,
              imageURL: finalPath
            };
          });
          onUpdatePPSheetData({ ...currentData, images: updatedImages });
        }
      }
    } catch (error) {
      console.error("Error saving PP Sheet data:", error);
      setStatusModal({
        isOpen: true,
        type: "error",
        message: "Failed to save PP Sheet data."
      });
    } finally {
      setSaving(false);
    }
  };

  if (!orderData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <FileText className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300">
          Waiting for Order Data
        </h3>
        <p className="text-sm text-gray-400 text-center max-w-xs mt-2">
          Please select an order in the "Order" tab to generate the PP Sheet
          details.
        </p>
      </div>
    );
  }

  if (loadingData)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="ml-3 text-gray-600 font-medium">
          Loading existing PP Sheet...
        </span>
      </div>
    );

  return (
    <div className="relative pb-24">
      <YPivotQATemplatesPPSheet
        prefilledData={prefilledData}
        savedState={reportData.ppSheetData}
        onDataChange={onUpdatePPSheetData}
      />

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40">
        <div className="max-w-8xl mx-auto flex justify-end px-4">
          <button
            onClick={handleSaveData}
            disabled={!isReportSaved || saving}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 ${
              isReportSaved
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white"
                : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
            title={
              !isReportSaved ? "Save Order Data first" : "Save PP Sheet Data"
            }
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isUpdateMode ? "Updating..." : "Saving..."}
              </>
            ) : (
              <>
                {/* --- Conditional Text/Icon --- */}
                {isUpdateMode ? (
                  <Edit3 className="w-5 h-5" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {isUpdateMode ? "Update PP Sheet Data" : "Save PP Sheet Data"}
              </>
            )}
          </button>
        </div>
      </div>

      <AutoDismissModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        type={statusModal.type}
        message={statusModal.message}
      />
    </div>
  );
};

export default YPivotQAInspectionPPSheetDataSave;
