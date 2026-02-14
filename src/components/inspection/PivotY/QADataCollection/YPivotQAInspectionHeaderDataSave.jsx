import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  Save,
  Loader2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Cloud,
  RefreshCw
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";
import YPivotQATemplatesHeader from "../QATemplates/YPivotQATemplatesHeader";

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

const YPivotQAInspectionHeaderDataSave = ({
  headerData,
  onUpdateHeaderData,
  reportId,
  isReportSaved,
  onSaveSuccess
}) => {
  const [saving, setSaving] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [sectionsList, setSectionsList] = useState([]);
  const lastSavedPayload = useRef("");
  const autoSaveTimeoutRef = useRef(null);
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    message: ""
  });

  useEffect(() => {
    const fetchSections = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/api/qa-sections-home`);
        if (res.data.success) setSectionsList(res.data.data);
      } catch (err) {
        console.error("Error fetching sections:", err);
      }
    };
    fetchSections();
  }, []);

  useEffect(() => {
    const fetchExistingHeaderData = async () => {
      if (!reportId) return;
      setLoadingData(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}`
        );
        if (res.data.success && res.data.data.headerData) {
          const backendHeaderData = res.data.data.headerData;
          if (Array.isArray(backendHeaderData) && backendHeaderData.length > 0)
            setIsUpdateMode(true);

          const newSelectedOptions = {};
          const newRemarks = {};
          const newCapturedImages = {};

          backendHeaderData.forEach((section) => {
            const secId = section.headerId;
            if (section.selectedOption)
              newSelectedOptions[secId] = section.selectedOption;
            if (section.remarks) newRemarks[secId] = section.remarks;
            if (section.images && section.images.length > 0) {
              section.images.forEach((img, idx) => {
                const key = `${secId}_${idx}`;
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
                  imageURL: img.imageURL, // IMPORTANT: PRESERVE BACKEND PATH
                  history: []
                };
              });
            }
          });

          onUpdateHeaderData(
            {
              selectedOptions: newSelectedOptions,
              remarks: newRemarks,
              capturedImages: newCapturedImages
            },
            { isFromBackend: true }
          );

          if (sectionsList.length > 0) {
            const simplePayload = generateSimplePayload(
              sectionsList,
              newSelectedOptions,
              newRemarks,
              Object.keys(newCapturedImages)
            );
            lastSavedPayload.current = JSON.stringify(simplePayload);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoadingData(false);
      }
    };

    if (reportId && sectionsList.length > 0) {
      const hasData = Object.keys(headerData.selectedOptions || {}).length > 0;
      if (!hasData) fetchExistingHeaderData();
      else {
        setIsUpdateMode(true);
        const simplePayload = generateSimplePayload(
          sectionsList,
          headerData.selectedOptions,
          headerData.remarks,
          Object.keys(headerData.capturedImages || {})
        );
        lastSavedPayload.current = JSON.stringify(simplePayload);
      }
    }
  }, [reportId, sectionsList.length]);

  const generateSimplePayload = (sections, options, remarks, imageKeys) =>
    sections.map((section) => ({
      headerId: section._id,
      selectedOption: (options || {})[section._id] || "",
      remarks: (remarks || {})[section._id] || "",
      imageCount: imageKeys.filter((k) => k.startsWith(`${section._id}_`))
        .length
    }));

  const handleSaveHeaderData = async (isManual = true) => {
    if (!isReportSaved || !reportId || sectionsList.length === 0) {
      if (isManual)
        setStatusModal({
          isOpen: true,
          type: "error",
          message: "Cannot save. Missing report info."
        });
      return;
    }

    const checkPayload = generateSimplePayload(
      sectionsList,
      headerData.selectedOptions,
      headerData.remarks,
      Object.keys(headerData.capturedImages || {})
    );
    const payloadString = JSON.stringify(checkPayload);

    if (payloadString === lastSavedPayload.current) {
      if (isManual)
        setStatusModal({
          isOpen: true,
          type: "success",
          message: "Data is up to date!"
        });
      return;
    }

    if (isManual) setSaving(true);
    else setAutoSaving(true);

    try {
      const imageFiles = [];
      const imageMap = {};

      const allImageKeys = Object.keys(headerData.capturedImages || {});
      for (const key of allImageKeys) {
        const img = headerData.capturedImages[key];
        const imageId = img.id || key;

        // 1. Existing Server Path (from metadata)
        if (img.imageURL && img.imageURL.startsWith("/")) {
          imageMap[imageId] = img.imageURL;
          continue;
        }

        // 2. Existing Server Path Fallback (from display URL)
        // If imageURL is missing (lost state), try to recover from display URL
        if (
          !img.imageURL &&
          img.url &&
          img.url.includes("/storage/") &&
          !img.url.startsWith("blob:") &&
          !img.url.startsWith("data:")
        ) {
          const relativePath = img.url.substring(img.url.indexOf("/storage/"));
          imageMap[imageId] = relativePath;
          continue;
        }

        // 3. Blob URL (New Upload)
        if (img.url && img.url.startsWith("blob:")) {
          const file = await blobUrlToFile(img.url, `header_${imageId}.jpg`);
          if (file) imageFiles.push({ id: imageId, file });
        }

        // 4. Base64 (Legacy/Fallback)
        else if (img.url && img.url.startsWith("data:")) {
          try {
            const res = await fetch(img.url);
            const blob = await res.blob();
            const file = new File([blob], `header_${imageId}.jpg`, {
              type: "image/jpeg"
            });
            imageFiles.push({ id: imageId, file });
          } catch (e) {
            console.error("Base64 fail", e);
          }
        }
      }

      if (imageFiles.length > 0) {
        const formData = new FormData();
        imageFiles.forEach((item) => formData.append("images", item.file));
        const uploadRes = await axios.post(
          `${API_BASE_URL}/api/fincheck-inspection/upload-header-images`,
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

      const payloadData = sectionsList.map((section) => {
        const secId = section._id;
        const sectionImages = Object.keys(headerData.capturedImages || {})
          .filter((k) => k.startsWith(`${secId}_`))
          .map((k) => {
            const img = headerData.capturedImages[k];
            const imageId = img.id || k;

            // Try map, then fallback to property
            let finalPath = imageMap[imageId] || img.imageURL;

            return {
              id: imageId,
              imageURL: finalPath || null, // null removes it from DB
              imgSrc: null
            };
          });

        return {
          headerId: secId,
          name: section.MainTitle,
          selectedOption: (headerData.selectedOptions || {})[secId] || "",
          remarks: (headerData.remarks || {})[secId] || "",
          images: sectionImages
        };
      });

      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/update-header-data`,
        { reportId: reportId, headerData: payloadData }
      );

      if (res.data.success) {
        setIsUpdateMode(true);
        lastSavedPayload.current = payloadString;
        if (onSaveSuccess) onSaveSuccess();
        if (isManual)
          setStatusModal({
            isOpen: true,
            type: "success",
            message: "Header Data Saved Successfully!"
          });
      }
    } catch (error) {
      console.error("Error saving header data:", error);
      if (isManual)
        setStatusModal({
          isOpen: true,
          type: "error",
          message: "Failed to save header data."
        });
    } finally {
      if (isManual) setSaving(false);
      else setAutoSaving(false);
    }
  };

  useEffect(() => {
    if (!isReportSaved || !reportId || loadingData || sectionsList.length === 0)
      return;
    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(() => {
      handleSaveHeaderData(false);
    }, 2000);
    return () => {
      if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    };
  }, [headerData, isReportSaved, reportId, loadingData, sectionsList]);

  if (loadingData)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="ml-3 text-gray-600 font-medium">
          Loading existing data...
        </span>
      </div>
    );

  return (
    <div className="relative pb-24">
      <YPivotQATemplatesHeader
        headerData={headerData}
        onUpdateHeaderData={onUpdateHeaderData}
      />
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {autoSaving ? (
              <div className="flex items-center gap-2 text-xs font-medium text-indigo-500 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving
                changes...
              </div>
            ) : lastSavedPayload.current ? (
              <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                <Cloud className="w-3.5 h-3.5" /> All changes saved
              </div>
            ) : null}
          </div>
          <button
            onClick={() => handleSaveHeaderData(true)}
            disabled={!isReportSaved || saving}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 ${
              !isReportSaved
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
            }`}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isUpdateMode ? "Update Header Data" : "Save Header Data"}
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

export default YPivotQAInspectionHeaderDataSave;
