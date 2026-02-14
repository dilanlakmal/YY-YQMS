import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback
} from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  Save,
  Loader2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Bug,
  RefreshCw
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";
import YPivotQAInspectionDefectConfig from "./YPivotQAInspectionDefectConfig";

// helper function to convert blob URL to File object
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
// HELPER: Transform Backend Image to Frontend Format
// ==============================================================================
const transformImageFromBackend = (img) => {
  if (!img) return null;

  let displayUrl = img.imageURL || "";

  // Prepend API_BASE_URL if it's a relative path
  if (
    displayUrl &&
    !displayUrl.startsWith("http") &&
    !displayUrl.startsWith("data:")
  ) {
    displayUrl = `${API_BASE_URL}${displayUrl}`;
  }

  return {
    id: img.imageId || img.id,
    imageId: img.imageId || img.id,
    imageURL: img.imageURL, // Keep original relative URL for backend reference
    imgSrc: displayUrl, // Full URL for display
    editedImgSrc: null,
    uploadedAt: img.uploadedAt
  };
};

// ==============================================================================
// HELPER: Transform Frontend Image to Backend Format
// ==============================================================================
const transformImageToBackend = (img) => {
  if (!img) return null;

  // Priority order: imageURL (from injectUrl) > imgSrc (if valid path)
  let finalUrl = img.imageURL;

  // Fallback to imgSrc if it's a valid server path (not blob/data)
  if (!finalUrl && img.imgSrc) {
    if (img.imgSrc.startsWith("/") || img.imgSrc.startsWith("http")) {
      finalUrl = img.imgSrc;
    }
  }

  // Must have a valid URL to save
  if (!finalUrl) {
    console.warn("[transformImageToBackend] No valid URL:", {
      id: img.id,
      imageURL: img.imageURL,
      imgSrc: img.imgSrc?.substring(0, 50)
    });
    return null;
  }

  return {
    id: img.id || img.imageId,
    imageId: img.id || img.imageId,
    imageURL: finalUrl
  };
};

// ==============================================================================
// HELPER: Transform Position from Backend
// ==============================================================================
const transformPositionFromBackend = (pos) => {
  return {
    pcsNo: pos.pcsNo,
    status: pos.status || "Major",
    requiredImage: pos.requiredImage
      ? transformImageFromBackend(pos.requiredImage)
      : null,
    additionalRemark: pos.additionalRemark || "",
    additionalImages: (pos.additionalImages || [])
      .map(transformImageFromBackend)
      .filter(Boolean),
    position: pos.position || "Outside",
    comment: pos.comment || "",
    qcUser: pos.qcUser || null
  };
};

// ==============================================================================
// HELPER: Transform Position to Backend
// ==============================================================================
const transformPositionToBackend = (pos) => {
  return {
    pcsNo: pos.pcsNo,
    status: pos.status || "Major",
    requiredImage: pos.requiredImage
      ? transformImageToBackend(pos.requiredImage)
      : null,
    additionalRemark: (pos.additionalRemark || "").slice(0, 250),
    additionalImages: (pos.additionalImages || [])
      .slice(0, 5)
      .map(transformImageToBackend)
      .filter(Boolean),
    position: pos.position || "Outside",
    comment: pos.comment || "",
    qcUser: pos.qcUser || null
  };
};

// ==============================================================================
// HELPER: Transform Location from Backend
// ==============================================================================
const transformLocationFromBackend = (loc) => {
  return {
    uniqueId: loc.uniqueId,
    locationId: loc.locationId,
    locationNo: loc.locationNo,
    locationName: loc.locationName,
    view: loc.view,
    qty: loc.qty || 1,
    positions: (loc.positions || []).map(transformPositionFromBackend)
  };
};

// ==============================================================================
// HELPER: Transform Location to Backend
// ==============================================================================
const transformLocationToBackend = (loc) => {
  const positions = (loc.positions || []).map(transformPositionToBackend);
  return {
    uniqueId: loc.uniqueId,
    locationId: loc.locationId,
    locationNo: loc.locationNo,
    locationName: loc.locationName,
    view: loc.view,
    qty: positions.length || loc.qty || 1,
    positions
  };
};

// ==============================================================================
// HELPER: Transform Defect from Backend
// ==============================================================================
const transformDefectFromBackend = (defect) => {
  if (defect.isNoLocation) {
    // No-Location mode
    return {
      defectId: defect.defectId,
      defectName: defect.defectName,
      defectCode: defect.defectCode,
      categoryName: defect.categoryName || "",
      groupId: defect.groupId,
      lineName: defect.lineName || "",
      tableName: defect.tableName || "",
      colorName: defect.colorName || "",
      determinedBuyer: defect.determinedBuyer || "Unknown",
      timestamp: defect.timestamp,
      isNoLocation: true,
      status: defect.status || "Major",
      qty: defect.qty || 1,
      qcUser: defect.qcUser || null,
      additionalRemark: defect.additionalRemark || "",
      images: (defect.images || [])
        .map(transformImageFromBackend)
        .filter(Boolean),
      locations: []
    };
  } else {
    // Location-based mode
    return {
      defectId: defect.defectId,
      defectName: defect.defectName,
      defectCode: defect.defectCode,
      categoryName: defect.categoryName || "",
      groupId: defect.groupId,
      lineName: defect.lineName || "",
      tableName: defect.tableName || "",
      colorName: defect.colorName || "",
      determinedBuyer: defect.determinedBuyer || "Unknown",
      timestamp: defect.timestamp,
      isNoLocation: false,
      status: null,
      qty: defect.qty || 1,
      qcUser: defect.qcUser || null,
      additionalRemark: defect.additionalRemark || "",
      images: [],
      locations: (defect.locations || []).map(transformLocationFromBackend)
    };
  }
};

// ==============================================================================
// HELPER: Transform Defect to Backend
// ==============================================================================
const transformDefectToBackend = (defect) => {
  if (defect.isNoLocation) {
    // No-Location mode
    return {
      groupId: defect.groupId,
      defectId: defect.defectId,
      defectName: defect.defectName,
      defectCode: defect.defectCode,
      categoryName: defect.categoryName || "",
      status: defect.status || "Major",
      qty: defect.qty || 1,
      determinedBuyer: defect.determinedBuyer || "Unknown",
      additionalRemark: (defect.additionalRemark || "").slice(0, 250),
      isNoLocation: true,
      locations: [],
      images: (defect.images || [])
        .map(transformImageToBackend)
        .filter(Boolean),
      lineName: defect.lineName || "",
      tableName: defect.tableName || "",
      colorName: defect.colorName || "",
      qcUser: defect.qcUser || null,
      timestamp: defect.timestamp
    };
  } else {
    // Location-based mode
    const locations = (defect.locations || []).map(transformLocationToBackend);
    const totalQty = locations.reduce(
      (sum, loc) => sum + (loc.positions?.length || loc.qty || 0),
      0
    );

    return {
      groupId: defect.groupId,
      defectId: defect.defectId,
      defectName: defect.defectName,
      defectCode: defect.defectCode,
      categoryName: defect.categoryName || "",
      status: null, // Status is per-position for location-based
      qty: totalQty || defect.qty || 1,
      determinedBuyer: defect.determinedBuyer || "Unknown",
      additionalRemark: (defect.additionalRemark || "").slice(0, 250),
      isNoLocation: false,
      locations,
      images: [],
      lineName: defect.lineName || "",
      tableName: defect.tableName || "",
      colorName: defect.colorName || "",
      qcUser: defect.qcUser || null,
      timestamp: defect.timestamp
    };
  }
};

// ==============================================================================
// HELPER: Transform Manual Data from Backend
// ==============================================================================
const transformManualDataFromBackend = (backendManualData) => {
  const manualDataByGroup = {};

  (backendManualData || []).forEach((manual) => {
    const groupId =
      manual.groupId !== undefined && manual.groupId !== null
        ? manual.groupId
        : 0;
    manualDataByGroup[groupId] = {
      remarks: manual.remarks || "",
      images: (manual.images || []).map((img) => ({
        id: img.imageId || img.id,
        imageId: img.imageId || img.id,
        imageURL: img.imageURL,
        imgSrc: img.imageURL
          ? img.imageURL.startsWith("http")
            ? img.imageURL
            : `${API_BASE_URL}${img.imageURL}`
          : null,
        editedImgSrc: null,
        remark: img.remark || "",
        uploadedAt: img.uploadedAt
      })),
      line: manual.line || "",
      table: manual.table || "",
      color: manual.color || "",
      qcUser: manual.qcUser || null
    };
  });

  return manualDataByGroup;
};

// ==============================================================================
// HELPER: Transform Manual Data to Backend
// ==============================================================================
const transformManualDataToBackend = (manualDataByGroup) => {
  return Object.entries(manualDataByGroup || {}).map(([key, data]) => {
    // Object keys are strings. Convert back to Number.
    // Use Number() to safely handle large integers/timestamps
    let numericGroupId = Number(key);

    // 2. If it is NaN (e.g. legacy "general" string), force it to 0
    if (isNaN(numericGroupId)) {
      numericGroupId = 0;
    }

    return {
      groupId: numericGroupId, // Save as Number
      remarks: data.remarks || "",
      images: (data.images || []).map((img) => {
        // ... (keep existing image logic)
        const isBase64 =
          img.imgSrc?.startsWith("data:") ||
          img.editedImgSrc?.startsWith("data:");
        const hasExistingUrl = img.imageURL && img.imageURL.startsWith("/");

        return {
          id: img.id || img.imageId,
          imageId: img.id || img.imageId,
          imgSrc: img.editedImgSrc || (isBase64 ? img.imgSrc : null),
          imageURL: hasExistingUrl && !isBase64 ? img.imageURL : null,
          remark: (img.remark || "").slice(0, 100)
        };
      }),
      line: data.line || "",
      table: data.table || "",
      color: data.color || "",
      qcUser: data.qcUser || null
    };
  });
};

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================
const YPivotQAInspectionDefectDataSave = ({
  selectedOrders,
  orderData,
  reportData,
  onUpdateDefectData,
  activeGroup,
  reportId,
  isReportSaved,
  onSaveSuccess
}) => {
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    message: ""
  });

  // Check if there's existing defect data
  const hasDefectData = useMemo(() => {
    const defects = reportData?.defectData?.savedDefects || [];
    const manualData = reportData?.defectData?.manualDataByGroup || {};
    return defects.length > 0 || Object.keys(manualData).length > 0;
  }, [reportData?.defectData]);

  // Get defect counts for display
  const defectStats = useMemo(() => {
    const defects = reportData?.defectData?.savedDefects || [];
    let total = 0;
    let critical = 0;
    let major = 0;
    let minor = 0;

    defects.forEach((d) => {
      if (d.isNoLocation) {
        total += d.qty || 1;
        if (d.status === "Critical") critical += d.qty || 1;
        else if (d.status === "Major") major += d.qty || 1;
        else if (d.status === "Minor") minor += d.qty || 1;
      } else {
        (d.locations || []).forEach((loc) => {
          (loc.positions || []).forEach((pos) => {
            total += 1;
            if (pos.status === "Critical") critical += 1;
            else if (pos.status === "Major") major += 1;
            else if (pos.status === "Minor") minor += 1;
          });
        });
      }
    });

    return { total, critical, major, minor };
  }, [reportData?.defectData?.savedDefects]);

  // state to track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const lastSavedHashRef = useRef(null);
  const [triggerAutoSave, setTriggerAutoSave] = useState(false);

  // --- FETCH EXISTING DATA ON MOUNT ---
  useEffect(() => {
    const fetchExistingDefectData = async () => {
      if (!reportId) {
        setIsUpdateMode(false);
        setDataLoaded(true);
        return;
      }

      // If we already have data loaded from parent, check update mode
      if (hasDefectData && dataLoaded) {
        setIsUpdateMode(true);
        return;
      }

      setLoadingData(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}`
        );

        if (res.data.success) {
          const backendDefectData = res.data.data.defectData || [];
          const backendManualData = res.data.data.defectManualData || [];

          if (backendDefectData.length > 0 || backendManualData.length > 0) {
            setIsUpdateMode(true);

            // Transform backend data to frontend format
            const transformedDefects = backendDefectData.map(
              transformDefectFromBackend
            );
            const transformedManualData =
              transformManualDataFromBackend(backendManualData);

            onUpdateDefectData(
              {
                savedDefects: transformedDefects,
                manualDataByGroup: transformedManualData
              },
              { isFromBackend: true }
            );
          } else {
            setIsUpdateMode(false);
          }
        }
      } catch (error) {
        console.error("Error fetching defect data:", error);
        setIsUpdateMode(false);
      } finally {
        setLoadingData(false);
        setDataLoaded(true);
      }
    };

    if (reportId && !dataLoaded) {
      fetchExistingDefectData();
    }
  }, [reportId, dataLoaded]);

  // Update isUpdateMode when data changes
  useEffect(() => {
    if (dataLoaded && hasDefectData) {
      setIsUpdateMode(true);
    }
  }, [hasDefectData, dataLoaded]);

  // ADD this helper function to generate hash of defect data
  const generateDataHash = (defects, manualData) => {
    try {
      // Create a simplified version for comparison (excluding file objects and blob URLs)
      const simplifiedDefects = (defects || []).map((d) => ({
        defectId: d.defectId,
        groupId: d.groupId,
        isNoLocation: d.isNoLocation,
        qty: d.qty,
        status: d.status,
        locations: (d.locations || []).map((l) => ({
          uniqueId: l.uniqueId,
          positions: (l.positions || []).map((p) => ({
            pcsNo: p.pcsNo,
            status: p.status,
            hasImage: !!(p.requiredImage?.imageURL || p.requiredImage?.imgSrc)
          }))
        })),
        imageCount: (d.images || []).length
      }));

      const simplifiedManual = Object.entries(manualData || {}).map(
        ([k, v]) => ({
          groupId: k,
          remarks: v.remarks,
          imageCount: (v.images || []).length
        })
      );

      return JSON.stringify({
        defects: simplifiedDefects,
        manual: simplifiedManual
      });
    } catch (e) {
      return Date.now().toString(); // Fallback - always different
    }
  };

  // ADD this useEffect to detect changes
  useEffect(() => {
    if (!dataLoaded) return;

    const savedDefects = reportData?.defectData?.savedDefects || [];
    const manualData = reportData?.defectData?.manualDataByGroup || {};
    const currentHash = generateDataHash(savedDefects, manualData);

    // Compare with last saved hash
    if (
      lastSavedHashRef.current !== null &&
      currentHash !== lastSavedHashRef.current
    ) {
      setHasUnsavedChanges(true);
    }
  }, [reportData?.defectData, dataLoaded]);

  // ADD this useEffect - triggers save when flag is set AND data has changed
  useEffect(() => {
    if (triggerAutoSave && !saving && isReportSaved && reportId) {
      const savedDefects = reportData?.defectData?.savedDefects || [];

      if (savedDefects.length > 0) {
        console.log(
          "[AutoSave] Triggered by flag, defects count:",
          savedDefects.length
        );

        // Reset flag first
        setTriggerAutoSave(false);

        // Then trigger save
        handleSaveDefectData(true);
      } else {
        setTriggerAutoSave(false);
      }
    }
  }, [
    triggerAutoSave,
    reportData?.defectData?.savedDefects,
    saving,
    isReportSaved,
    reportId
  ]);

  // ADD this simple handler to pass to DefectConfig
  const handleDefectsSaved = useCallback(() => {
    console.log("[AutoSave] Modal closed, setting trigger flag...");
    // Use setTimeout to ensure state update from DefectConfig has propagated
    setTimeout(() => {
      setTriggerAutoSave(true);
    }, 100);
  }, []);

  // --- SAVE HANDLER ---
  const handleSaveDefectData = async (isAutoSave = false) => {
    if (!isReportSaved || !reportId) {
      if (!isAutoSave) {
        setStatusModal({
          isOpen: true,
          type: "error",
          message: "Please save Order information first."
        });
      }
      return;
    }

    const savedDefects = reportData?.defectData?.savedDefects || [];
    const manualDataByGroup = reportData?.defectData?.manualDataByGroup || {};

    if (
      savedDefects.length === 0 &&
      Object.keys(manualDataByGroup).length === 0
    ) {
      if (!isAutoSave) {
        setStatusModal({
          isOpen: true,
          type: "error",
          message: "No defect data to save. Add defects first."
        });
      }
      return;
    }

    // CHECK FOR CHANGES - Skip if no changes
    const currentHash = generateDataHash(savedDefects, manualDataByGroup);

    if (!hasUnsavedChanges && lastSavedHashRef.current === currentHash) {
      console.log("[Save] No changes detected, skipping save");
      if (!isAutoSave) {
        setStatusModal({
          isOpen: true,
          type: "success",
          message: "Data already up to date!"
        });
      }
      return;
    }

    setSaving(true);
    try {
      // =========================================================
      // STEP 1: COLLECT & UPLOAD IMAGES
      // =========================================================
      const imageFiles = [];
      const imageMap = {};

      const collectImage = async (img, contextPrefix) => {
        if (!img) return;

        if (!img.id && !img.imageId) {
          img.id = `${contextPrefix}_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
        }
        const imageId = img.id || img.imageId;

        // Already uploaded?
        if (img.imageURL && img.imageURL.startsWith("/")) {
          imageMap[imageId] = img.imageURL;
          return;
        }

        // Has File object?
        if (img.file instanceof File || img.file instanceof Blob) {
          imageFiles.push({ id: imageId, file: img.file });
          return;
        }

        // Has blob URL? Convert it
        const blobUrl = img.editedImgSrc || img.imgSrc;
        if (blobUrl && blobUrl.startsWith("blob:")) {
          const file = await blobUrlToFile(blobUrl, `${imageId}.jpg`);
          if (file) {
            img.file = file;
            imageFiles.push({ id: imageId, file });
          }
          return;
        }
      };

      // Collect from savedDefects
      for (const [dIdx, defect] of savedDefects.entries()) {
        if (defect.isNoLocation) {
          for (const [iIdx, img] of (defect.images || []).entries()) {
            await collectImage(img, `noloc_${dIdx}_${iIdx}`);
          }
        } else {
          for (const [lIdx, loc] of (defect.locations || []).entries()) {
            for (const [pIdx, pos] of (loc.positions || []).entries()) {
              if (pos.requiredImage) {
                await collectImage(
                  pos.requiredImage,
                  `loc_${dIdx}_${lIdx}_${pIdx}_req`
                );
              }
              for (const [aIdx, addImg] of (
                pos.additionalImages || []
              ).entries()) {
                await collectImage(
                  addImg,
                  `loc_${dIdx}_${lIdx}_${pIdx}_add_${aIdx}`
                );
              }
            }
          }
        }
      }

      // Collect from manualData
      for (const [groupId, group] of Object.entries(manualDataByGroup)) {
        for (const [iIdx, img] of (group.images || []).entries()) {
          await collectImage(img, `manual_${groupId}_${iIdx}`);
        }
      }

      console.log(`[Save] Images to upload: ${imageFiles.length}`);

      // Upload only if there are new files
      if (imageFiles.length > 0) {
        const formData = new FormData();
        imageFiles.forEach((item) => {
          formData.append("images", item.file, `defect_${item.id}.jpg`);
        });

        const uploadRes = await axios.post(
          `${API_BASE_URL}/api/fincheck-inspection/upload-defect-images`,
          formData,
          { headers: { "Content-Type": "multipart/form-data" } }
        );

        if (uploadRes.data.success) {
          const paths = uploadRes.data.data?.paths || [];
          imageFiles.forEach((item, index) => {
            if (paths[index]) {
              imageMap[item.id] = paths[index];
            }
          });
        }
      }

      // =========================================================
      // STEP 2: INJECT URLs INTO DATA
      // =========================================================
      const injectUrl = (img) => {
        if (!img) return null;
        const imageId = img.id || img.imageId;

        if (imageMap[imageId]) {
          return {
            ...img,
            imageURL: imageMap[imageId],
            imgSrc: imageMap[imageId],
            file: null,
            editedImgSrc: null
          };
        }
        return img;
      };

      const defectsWithUrls = savedDefects.map((d) => {
        if (d.isNoLocation) {
          return {
            ...d,
            images: (d.images || []).map(injectUrl).filter(Boolean)
          };
        } else {
          return {
            ...d,
            locations: (d.locations || []).map((loc) => ({
              ...loc,
              positions: (loc.positions || []).map((pos) => ({
                ...pos,
                requiredImage: injectUrl(pos.requiredImage),
                additionalImages: (pos.additionalImages || [])
                  .map(injectUrl)
                  .filter(Boolean)
              }))
            }))
          };
        }
      });

      const manualDataWithUrls = {};
      Object.entries(manualDataByGroup).forEach(([groupId, data]) => {
        manualDataWithUrls[groupId] = {
          ...data,
          images: (data.images || []).map(injectUrl).filter(Boolean)
        };
      });

      // =========================================================
      // STEP 3: TRANSFORM & SEND
      // =========================================================
      const finalDefects = defectsWithUrls.map(transformDefectToBackend);
      const finalManualData = transformManualDataToBackend(manualDataWithUrls);

      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/update-defect-data`,
        {
          reportId,
          defectData: finalDefects,
          defectManualData: finalManualData
        }
      );

      if (res.data.success) {
        // UPDATE: Store hash and reset change flag
        const newHash = generateDataHash(savedDefects, manualDataByGroup);
        lastSavedHashRef.current = newHash;
        setHasUnsavedChanges(false);

        setIsUpdateMode(true);
        if (onSaveSuccess) onSaveSuccess("defectData");

        // Show message only for manual save, not auto-save
        if (!isAutoSave) {
          setStatusModal({
            isOpen: true,
            type: "success",
            message: isUpdateMode
              ? "Defect Data Updated!"
              : "Defect Data Saved!"
          });
        } else {
          console.log("[AutoSave] Saved successfully");
        }

        if (res.data.data) {
          const updatedDefects = (res.data.data.defectData || []).map(
            transformDefectFromBackend
          );
          const updatedManual = transformManualDataFromBackend(
            res.data.data.defectManualData || []
          );
          onUpdateDefectData({
            savedDefects: updatedDefects,
            manualDataByGroup: updatedManual
          });

          // Update hash after server response
          lastSavedHashRef.current = generateDataHash(
            updatedDefects,
            updatedManual
          );
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      if (!isAutoSave) {
        setStatusModal({
          isOpen: true,
          type: "error",
          message:
            error.response?.data?.message || "Failed to save defect data."
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // --- LOADING STATE ---
  if (loadingData) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">
          Loading defect data...
        </span>
      </div>
    );
  }

  return (
    <div className="relative pb-28">
      {/* Main Defect Config Component */}
      <YPivotQAInspectionDefectConfig
        selectedOrders={selectedOrders}
        orderData={orderData}
        reportData={reportData}
        onUpdateDefectData={onUpdateDefectData}
        activeGroup={activeGroup}
        onDefectsSaved={handleDefectsSaved}
      />

      {/* Fixed Bottom Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_12px_-1px_rgba(0,0,0,0.1)] z-40">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          {/* Left Side: Status & Stats */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Save Status Badge */}
            {isUpdateMode ? (
              hasUnsavedChanges ? (
                <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                  Unsaved Changes
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full">
                  <CheckCircle2 className="w-3 h-3" />
                  Data Saved
                </span>
              )
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
                Not Saved
              </span>
            )}

            {/* Defect Stats - Hidden on mobile */}
            {defectStats.total > 0 && (
              <div className="hidden sm:flex items-center gap-2 text-xs">
                <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                  <Bug className="w-3 h-3 text-gray-500" />
                  <span className="font-bold text-gray-700 dark:text-gray-300">
                    {defectStats.total}
                  </span>
                </span>
                {defectStats.critical > 0 && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-bold">
                    C:{defectStats.critical}
                  </span>
                )}
                {defectStats.major > 0 && (
                  <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded font-bold">
                    M:{defectStats.major}
                  </span>
                )}
                {defectStats.minor > 0 && (
                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-bold">
                    m:{defectStats.minor}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Right Side: Save Button */}
          <button
            onClick={() => handleSaveDefectData(false)}
            disabled={!isReportSaved || saving}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-[0.98] ${
              isReportSaved
                ? hasUnsavedChanges
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
                  : isUpdateMode
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isUpdateMode ? "Updating..." : "Saving..."}
              </>
            ) : hasUnsavedChanges ? (
              <>
                <Save className="w-5 h-5" />
                Save New Changes
              </>
            ) : isUpdateMode ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Update Defect Data
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Defect Data
              </>
            )}
          </button>
        </div>

        {/* Mobile Stats Row */}
        {defectStats.total > 0 && (
          <div className="sm:hidden flex items-center justify-center gap-2 mt-2 text-xs">
            <span className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
              <Bug className="w-3 h-3 text-gray-500" />
              <span className="font-bold text-gray-700 dark:text-gray-300">
                {defectStats.total} Total
              </span>
            </span>
            {defectStats.critical > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded font-bold">
                C:{defectStats.critical}
              </span>
            )}
            {defectStats.major > 0 && (
              <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded font-bold">
                M:{defectStats.major}
              </span>
            )}
            {defectStats.minor > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded font-bold">
                m:{defectStats.minor}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Status Modal */}
      <AutoDismissModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
        type={statusModal.type}
        message={statusModal.message}
      />

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default YPivotQAInspectionDefectDataSave;
