import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef
} from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  Camera,
  Upload,
  X,
  Search,
  XCircle,
  Loader,
  ChevronDown,
  ChevronUp,
  Edit3,
  MessageSquare,
  Trash2,
  Save,
  Images,
  Check,
  UploadCloud,
  Clock
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";
import YPivotQATemplatesImageEditor from "./YPivotQATemplatesImageEditor";
import MultipleImageUpload from "./MultipleImageUpload"; // ✅ IMPORTED NEW COMPONENT
import { usePhotoUpload } from "./PhotoUploadContext";

// ==============================================================================
// INTERNAL COMPONENT: REMARK MODAL
// ==============================================================================
const RemarkModal = ({ isOpen, onClose, onSave, initialText, title }) => {
  const [text, setText] = useState(initialText || "");

  useEffect(() => {
    if (isOpen) setText(initialText || "");
  }, [isOpen, initialText]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden transform transition-all scale-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            Remark:{" "}
            <span className="font-normal text-gray-600 dark:text-gray-400 truncate max-w-[200px]">
              {title}
            </span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <textarea
            className="w-full h-40 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-800 dark:text-gray-200 resize-none"
            placeholder="Type remark here (max 250 chars)..."
            maxLength={250}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="flex justify-end mt-2">
            <span
              className={`text-xs ${
                text.length >= 250 ? "text-red-500" : "text-gray-400"
              }`}
            >
              {text.length}/250
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(text)}
            disabled={!text.trim()}
            className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================
const YPivotQATemplatesPhotos = ({
  allowedSectionIds = [],
  reportData,
  reportId,
  onUpdatePhotoData
}) => {
  // Access saved state from parent
  const savedState = reportData?.photoData || {};

  // --- CONTEXT HOOK ---
  const { addToUploadQueue, uploadStatus } = usePhotoUpload();

  const [sections, setSections] = useState([]);
  const [filteredSections, setFilteredSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedSections, setExpandedSections] = useState(new Set());
  const [deviceType, setDeviceType] = useState("desktop");

  // Data State (Synced with Parent)
  const [capturedImages, setCapturedImages] = useState(
    savedState.capturedImages || {}
  );
  const [remarks, setRemarks] = useState(savedState.remarks || {});

  // Image editor state
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [currentEditContext, setCurrentEditContext] = useState(null);

  // Remark Modal State
  const [remarkModal, setRemarkModal] = useState({
    isOpen: false,
    key: null,
    title: ""
  });

  // Track scroll for returning from editor
  const scrollPositionRef = useRef(0);
  const lastEditedItemRef = useRef(null);

  // Sync Helper
  const updateParent = (updates) => {
    if (onUpdatePhotoData) {
      onUpdatePhotoData({
        capturedImages,
        remarks,
        ...updates
      });
    }
  };

  // Device detection
  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      if (width < 768) return "mobile";
      if (width < 1024) return "tablet";
      return "desktop";
    };
    setDeviceType(detectDevice());
    const handleResize = () => setDeviceType(detectDevice());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/qa-sections-photos`
        );
        setSections(response.data.data);
      } catch (error) {
        console.error("Error fetching photo sections:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Filtering Logic
  useEffect(() => {
    let result = sections;

    if (allowedSectionIds && allowedSectionIds.length > 0) {
      result = result.filter((section) =>
        allowedSectionIds.includes(section._id)
      );
    }

    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result
        .map((section) => ({
          ...section,
          itemList: section.itemList.filter((item) =>
            item.itemName.toLowerCase().includes(query)
          )
        }))
        .filter((section) => section.itemList.length > 0);
    }

    setFilteredSections(result);
  }, [searchQuery, sections, allowedSectionIds]);

  // --- Handlers ---

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  // --- Image Handlers ---

  // Get current images count for an item
  const getCurrentImagesCount = (sectionId, itemNo) => {
    let count = 0;
    let index = 0;
    while (count < 20) {
      const key = `${sectionId}_${itemNo}_${index}`;
      if (capturedImages[key]) {
        count++;
      } else {
        break;
      }
      index++;
    }
    return count;
  };

  // Get max allowed images for adding (considering current count)
  const getAvailableSlots = (sectionId, itemNo, maxCount) => {
    const currentCount = getCurrentImagesCount(sectionId, itemNo);
    return Math.max(0, maxCount - currentCount);
  };

  // Open image editor for NEW capture/upload (multi-image mode)
  const openImageEditorForNew = (mode, sectionId, itemNo, maxCount) => {
    const availableSlots = getAvailableSlots(sectionId, itemNo, maxCount);

    if (availableSlots <= 0) {
      alert("Maximum images reached for this item!");
      return;
    }

    // Save current scroll position and item reference
    scrollPositionRef.current = window.scrollY;
    lastEditedItemRef.current = { sectionId, itemNo };

    setCurrentEditContext({
      mode,
      sectionId,
      itemNo,
      isEditing: false,
      maxImages: availableSlots,
      maxCount: maxCount,
      existingData: null
    });
    setShowImageEditor(true);
  };

  // Open image editor for EDITING existing image
  const openImageEditorForEdit = (sectionId, itemNo, imageIndex) => {
    const key = `${sectionId}_${itemNo}_${imageIndex}`;
    const imageData = capturedImages[key];

    if (imageData) {
      scrollPositionRef.current = window.scrollY;
      lastEditedItemRef.current = { sectionId, itemNo };

      setCurrentEditContext({
        mode: "edit",
        sectionId,
        itemNo,
        imageIndex,
        isEditing: true,
        maxImages: 1,
        existingData: [
          {
            imgSrc: imageData.imgSrc || imageData.url,
            history: imageData.history || []
          }
        ]
      });
      setShowImageEditor(true);
    }
  };

  // ✅ NEW HANDLER: Handle Batch Upload directly from MultipleImageUpload
  const handleDirectBatchUpload = (sectionId, itemNo, newImages) => {
    if (!newImages || newImages.length === 0) return;

    const section = sections.find((s) => s._id === sectionId);
    const sectionName = section?.sectionName || "Unknown";
    const item = section?.itemList.find((i) => i.no === itemNo);
    const itemName = item?.itemName || `Item ${itemNo}`;

    // 1. Prepare Local State (With Blob URLs for immediate display)
    let newCapturedImages = { ...capturedImages };
    let finalImageListForUpload = [];
    let nextIndex = getNextImageIndex(sectionId, itemNo);

    // Get existing images for upload queue order
    const imagesForItem = getImagesForItem(sectionId, itemNo);
    imagesForItem.forEach(({ data }) => {
      finalImageListForUpload.push({
        id: data.id,
        url: data.url,
        file: null
      });
    });

    // Append new images
    newImages.forEach((img) => {
      const key = `${sectionId}_${itemNo}_${nextIndex}`;

      // Update Local State
      newCapturedImages[key] = {
        id: `${sectionId}_${itemNo}_${nextIndex}_${Date.now()}`,
        url: img.imgSrc, // Blob URL
        imgSrc: img.imgSrc,
        history: []
      };

      // Add to Upload List (This is where context picks it up for compression)
      finalImageListForUpload.push({
        id: newCapturedImages[key].id,
        url: img.imgSrc,
        file: img.file // ✅ RAW FILE PASSED HERE
      });

      nextIndex++;
    });

    // Update React State
    setCapturedImages(newCapturedImages);
    updateParent({ capturedImages: newCapturedImages });

    // Send to Upload Queue (Context handles compression)
    if (reportId && finalImageListForUpload.length > 0) {
      addToUploadQueue({
        reportId,
        sectionId,
        sectionName,
        itemNo: parseInt(itemNo),
        itemName,
        images: finalImageListForUpload,
        remarks: remarks[`${sectionId}_${itemNo}`] || "",
        // ✅ Callback to replace Blob URLs with Server URLs on success
        onSuccess: (savedServerImages) => {
          setCapturedImages((prev) => {
            const updated = { ...prev };
            let hasChanges = false;

            savedServerImages.forEach((serverImg) => {
              const stateKey = Object.keys(updated).find(
                (key) => updated[key].id === serverImg.imageId
              );

              if (stateKey) {
                let fullDisplayUrl = serverImg.imageURL;
                if (
                  fullDisplayUrl &&
                  !fullDisplayUrl.startsWith("http") &&
                  !fullDisplayUrl.startsWith("blob:")
                ) {
                  fullDisplayUrl = `${API_BASE_URL}${fullDisplayUrl}`;
                }

                updated[stateKey] = {
                  ...updated[stateKey],
                  url: fullDisplayUrl,
                  imgSrc: fullDisplayUrl
                };
                hasChanges = true;
              }
            });

            if (hasChanges) {
              updateParent({ capturedImages: updated });
              return updated;
            }
            return prev;
          });
        }
      });
    }
  };

  const handleImageEditorClose = () => {
    const editedItem = lastEditedItemRef.current;
    setShowImageEditor(false);
    setCurrentEditContext(null);

    requestAnimationFrame(() => {
      if (editedItem) {
        setExpandedSections((prev) => {
          const newSet = new Set(prev);
          newSet.add(editedItem.sectionId);
          return newSet;
        });
      }
      setTimeout(() => {
        window.scrollTo({
          top: scrollPositionRef.current,
          behavior: "instant"
        });
      }, 50);
    });
  };

  // Handle multiple images save from editor (Camera/Canvas mode)
  const handleImagesSave = async (savedImages) => {
    // 1. Safety Check
    if (!currentEditContext || !savedImages || savedImages.length === 0) {
      handleImageEditorClose();
      return;
    }

    const { sectionId, itemNo, isEditing, imageIndex } = currentEditContext;
    const section = sections.find((s) => s._id === sectionId);
    const sectionName = section?.sectionName || "Unknown";
    const item = section?.itemList.find((i) => i.no === itemNo);
    const itemName = item?.itemName || `Item ${itemNo}`;

    // 2. Ensure every image has a valid 'file' object
    // If 'file' is missing but we have a blob URL, fetch it to create the file.
    const processedSavedImages = await Promise.all(
      savedImages.map(async (img) => {
        // If file exists, return as is
        if (img.file) return img;

        // If no file, but we have a Blob URL (common in first-time camera captures)
        const src = img.editedImgSrc || img.imgSrc;
        if (src && src.startsWith("blob:")) {
          try {
            const response = await fetch(src);
            const blob = await response.blob();
            const rebuiltFile = new File([blob], `captured_${Date.now()}.jpg`, {
              type: blob.type || "image/jpeg"
            });
            return { ...img, file: rebuiltFile };
          } catch (error) {
            console.error("Error recovering file from blob:", error);
            return img;
          }
        }
        return img;
      })
    );

    let newCapturedImages = { ...capturedImages };
    const uploadList = [];

    // 3. Prepare Upload List
    let finalImageListForUpload = [];

    // A. Add existing images (that are not being edited)
    const existingItemImages = [];
    let idx = 0;
    while (idx < 20) {
      const key = `${sectionId}_${itemNo}_${idx}`;
      if (newCapturedImages[key] && (!isEditing || idx !== imageIndex)) {
        // Push to local state helper
        existingItemImages.push({
          ...newCapturedImages[key],
          originalIndex: idx
        });
        // Push to upload queue (file: null tells context it's an existing server image)
        finalImageListForUpload.push({
          id: newCapturedImages[key].id,
          url: newCapturedImages[key].url,
          file: null
        });
      }
      idx++;
    }

    if (isEditing) {
      for (let i = 0; i < 20; i++) {
        const key = `${sectionId}_${itemNo}_${i}`;
        if (i === imageIndex) {
          const editedImg = processedSavedImages[0]; // Use processed image
          const displayUrl = editedImg.editedImgSrc || editedImg.imgSrc;

          newCapturedImages[key] = {
            id:
              newCapturedImages[key]?.id ||
              `${sectionId}_${itemNo}_${i}_${Date.now()}`,
            url: displayUrl,
            imgSrc: displayUrl,
            history: editedImg.history || []
          };

          // Add to upload list
          finalImageListForUpload.push({
            id: newCapturedImages[key].id,
            url: displayUrl,
            file: editedImg.file // ✅ Guaranteed to exist now
          });
        } else if (newCapturedImages[key]) {
          finalImageListForUpload.push({
            id: newCapturedImages[key].id,
            url: newCapturedImages[key].url,
            file: null
          });
        }
      }
    } else {
      // C. Process NEW Additions
      let nextIndex = getNextImageIndex(sectionId, itemNo);

      processedSavedImages.forEach((img) => {
        const key = `${sectionId}_${itemNo}_${nextIndex}`;
        const displayUrl = img.editedImgSrc || img.imgSrc;

        newCapturedImages[key] = {
          id: `${sectionId}_${itemNo}_${nextIndex}_${Date.now()}`,
          url: displayUrl,
          imgSrc: displayUrl,
          history: img.history || []
        };

        finalImageListForUpload.push({
          id: newCapturedImages[key].id,
          url: displayUrl,
          file: img.file // ✅ Guaranteed to exist now
        });

        nextIndex++;
      });
    }

    setCapturedImages(newCapturedImages);
    updateParent({ capturedImages: newCapturedImages });
    handleImageEditorClose();

    // 5. ✅ FIX: Ensure we have a ReportID (Fallback to reportData if prop is lagging)
    const activeReportId = reportId || reportData?.reportId;
    if (activeReportId && finalImageListForUpload.length > 0) {
      addToUploadQueue({
        reportId: activeReportId,
        sectionId,
        sectionName,
        itemNo: parseInt(itemNo),
        itemName,
        images: finalImageListForUpload,
        remarks: remarks[`${sectionId}_${itemNo}`] || "",
        onSuccess: (savedServerImages) => {
          // ... (Existing onSuccess logic) ...
          setCapturedImages((prev) => {
            const updated = { ...prev };
            let hasChanges = false;
            savedServerImages.forEach((serverImg) => {
              const stateKey = Object.keys(updated).find(
                (key) => updated[key].id === serverImg.imageId
              );
              if (stateKey) {
                let fullDisplayUrl = serverImg.imageURL;
                if (
                  fullDisplayUrl &&
                  !fullDisplayUrl.startsWith("http") &&
                  !fullDisplayUrl.startsWith("blob:")
                ) {
                  fullDisplayUrl = `${API_BASE_URL}${fullDisplayUrl}`;
                }
                updated[stateKey] = {
                  ...updated[stateKey],
                  url: fullDisplayUrl,
                  imgSrc: fullDisplayUrl
                };
                hasChanges = true;
              }
            });
            if (hasChanges) {
              updateParent({ capturedImages: updated });
              return updated;
            }
            return prev;
          });
        }
      });
    } else if (!activeReportId) {
      // Optional: Alert user if they are trying to save without an Order/Report ID
      console.warn("Cannot auto-save photo: Report ID is missing.");
    }
  };

  const removeImage = async (sectionId, itemNo, imageIndex, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm("Remove this image?")) return;

    const keyToRemove = `${sectionId}_${itemNo}_${imageIndex}`;
    const imageToRemove = capturedImages[keyToRemove];
    const imageId = imageToRemove?.id;

    const newImages = { ...capturedImages };
    const remainingImages = [];
    let idx = 0;
    while (idx < 20) {
      const key = `${sectionId}_${itemNo}_${idx}`;
      if (idx !== imageIndex && capturedImages[key]) {
        remainingImages.push(capturedImages[key]);
      }
      idx++;
    }

    Object.keys(newImages).forEach((key) => {
      if (key.startsWith(`${sectionId}_${itemNo}_`)) {
        delete newImages[key];
      }
    });

    remainingImages.forEach((img, i) => {
      newImages[`${sectionId}_${itemNo}_${i}`] = img;
    });

    setCapturedImages(newImages);
    updateParent({ capturedImages: newImages });

    if (reportId && imageId) {
      try {
        await axios.post(
          `${API_BASE_URL}/api/fincheck-inspection/delete-photo`,
          {
            reportId: reportId,
            sectionId,
            itemNo: parseInt(itemNo),
            imageId
          }
        );
        console.log("✅ Image deleted from server");
      } catch (error) {
        console.error("Failed to delete from server:", error);
      }
    }
  };

  const editExistingImage = (e, sectionId, itemNo, imageIndex) => {
    e.stopPropagation();
    openImageEditorForEdit(sectionId, itemNo, imageIndex);
  };

  // --- Remark Handlers ---
  const openRemarkModal = (sectionId, itemNo, itemName) => {
    setRemarkModal({
      isOpen: true,
      key: `${sectionId}_${itemNo}`,
      title: itemName
    });
  };

  const handleSaveRemark = async (text) => {
    const { key } = remarkModal;
    if (key) {
      const newRemarks = { ...remarks, [key]: text };
      setRemarks(newRemarks);
      updateParent({ remarks: newRemarks });

      if (reportId) {
        const [sectionId, itemNoStr] = key.split("_");
        const itemNo = parseInt(itemNoStr);
        const section = sections.find((s) => s._id === sectionId);
        const item = section?.itemList.find((i) => i.no === itemNo);

        try {
          await axios.post(
            `${API_BASE_URL}/api/fincheck-inspection/update-photo-remark`,
            {
              reportId: reportId,
              sectionId,
              sectionName: section?.sectionName,
              itemNo,
              itemName: item?.itemName,
              remarks: text
            }
          );
        } catch (error) {
          console.error("Failed to save remark:", error);
        }
      }
    }
    setRemarkModal({ isOpen: false, key: null, title: "" });
  };

  const clearRemark = (sectionId, itemNo) => {
    if (window.confirm("Clear this remark?")) {
      const key = `${sectionId}_${itemNo}`;
      const newRemarks = { ...remarks };
      delete newRemarks[key];
      setRemarks(newRemarks);
      updateParent({ remarks: newRemarks });
    }
  };

  // --- Utilities ---
  const getImagesForItem = useMemo(() => {
    return (sectionId, itemNo) => {
      const images = [];
      let index = 0;
      while (images.length < 20) {
        const key = `${sectionId}_${itemNo}_${index}`;
        if (capturedImages[key]) {
          images.push({
            key,
            data: capturedImages[key],
            index
          });
        } else {
          break;
        }
        index++;
      }
      return images;
    };
  }, [capturedImages]);

  const getNextImageIndex = (sectionId, itemNo) => {
    let index = 0;
    while (capturedImages[`${sectionId}_${itemNo}_${index}`]) {
      index++;
    }
    return index;
  };

  const getGridCols = () => {
    if (deviceType === "mobile") return "grid-cols-1";
    if (deviceType === "tablet") return "grid-cols-2";
    return "grid-cols-3";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-20 animate-fadeIn">
      {/* Header Search */}
      <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-xl p-4 shadow-lg">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search photo sections..."
            className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-white dark:bg-gray-800 border-2 border-transparent focus:border-white focus:ring-2 focus:ring-white/20 outline-none transition-all text-sm text-gray-800 dark:text-white placeholder-gray-400 shadow-md"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <XCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Sections List */}
      {filteredSections.length > 0 ? (
        <div className="space-y-3">
          {filteredSections.map((section) => {
            const isExpanded = expandedSections.has(section._id);

            return (
              <div
                key={section._id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
              >
                {/* Main Section Header */}
                <button
                  onClick={() => toggleSection(section._id)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                      <Camera className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-sm font-bold text-gray-800 dark:text-white">
                        {section.sectionName}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {section.itemList.length} items
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </button>

                {/* Sub-cards Grid */}
                {isExpanded && (
                  <div
                    className={`grid ${getGridCols()} gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700`}
                  >
                    {section.itemList.map((item) => {
                      const images = getImagesForItem(section._id, item.no);
                      const canAddMore = images.length < item.maxCount;
                      const availableSlots = item.maxCount - images.length;
                      const remarkKey = `${section._id}_${item.no}`;
                      const currentRemark = remarks[remarkKey];
                      const statusKey = `${section._id}_${item.no}`;
                      const status = uploadStatus[statusKey];

                      return (
                        <div
                          key={item.no}
                          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm hover:shadow-md transition-shadow"
                        >
                          {/* Sub-card Title + Remark */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded text-xs font-bold">
                                {item.no}
                              </span>
                              <h4
                                className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate"
                                title={item.itemName}
                              >
                                {item.itemName}
                              </h4>
                            </div>

                            {/* Remark Button */}
                            {currentRemark ? (
                              <div className="flex items-center bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden h-6 ml-2 flex-shrink-0">
                                <button
                                  onClick={() =>
                                    openRemarkModal(
                                      section._id,
                                      item.no,
                                      item.itemName
                                    )
                                  }
                                  className="px-2 h-full text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-100 transition-colors border-r border-amber-200 dark:border-amber-800"
                                >
                                  Remark
                                </button>
                                <button
                                  onClick={() =>
                                    clearRemark(section._id, item.no)
                                  }
                                  className="px-1.5 h-full text-amber-600 hover:text-red-500 hover:bg-red-50 transition-colors"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  openRemarkModal(
                                    section._id,
                                    item.no,
                                    item.itemName
                                  )
                                }
                                className="ml-2 p-1 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-md transition-all"
                                title="Add Remark"
                              >
                                <MessageSquare className="w-4 h-4" />
                              </button>
                            )}

                            <span className="flex-shrink-0 text-xs font-bold text-gray-500 dark:text-gray-400 ml-2 border-l pl-2 border-gray-200 dark:border-gray-700">
                              {images.length}/{item.maxCount}
                            </span>
                          </div>

                          {/* Progress Indicator */}
                          {status && (
                            <div className="mb-3 px-1 animate-fadeIn">
                              <div className="flex justify-between items-center text-[10px] text-gray-500 dark:text-gray-400 mb-1">
                                <div className="flex items-center gap-1.5">
                                  {status.status === "compressing" ? (
                                    <>
                                      <Clock className="w-3 h-3 text-amber-500 animate-spin" />
                                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                                        Compressing...
                                      </span>
                                    </>
                                  ) : status.status === "queued" ? (
                                    <>
                                      <Clock className="w-3 h-3 text-gray-400" />
                                      <span className="font-medium">
                                        Queued
                                      </span>
                                    </>
                                  ) : status.status === "uploading" ? (
                                    <>
                                      <UploadCloud className="w-3 h-3 text-blue-500 animate-bounce" />
                                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                                        Uploading...
                                      </span>
                                    </>
                                  ) : status.status === "success" ? (
                                    <>
                                      <Check className="w-3 h-3 text-green-500" />
                                      <span className="text-green-600 dark:text-green-400 font-medium">
                                        Saved
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-red-500 font-medium">
                                      Error
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono">
                                  {status.progress}/{status.total}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700 overflow-hidden">
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-300 ${
                                    status.status === "success"
                                      ? "bg-green-500"
                                      : status.status === "error"
                                      ? "bg-red-500"
                                      : "bg-indigo-600"
                                  } ${
                                    status.status === "compressing"
                                      ? "animate-pulse"
                                      : ""
                                  }`}
                                  style={{
                                    width: `${
                                      (status.progress / status.total) * 100
                                    }%`
                                  }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Images Container */}
                          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                            {images.map(({ key, data, index }) => (
                              <div
                                key={key}
                                className="relative flex-shrink-0 w-20 h-20 group cursor-pointer"
                                onClick={(e) =>
                                  editExistingImage(
                                    e,
                                    section._id,
                                    item.no,
                                    index
                                  )
                                }
                              >
                                <img
                                  src={data.url}
                                  alt={`Photo ${index + 1}`}
                                  className="w-full h-full object-cover rounded-lg border-2 border-gray-300 dark:border-gray-600 group-hover:border-indigo-400 transition-colors"
                                />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                                  <Edit3 className="w-5 h-5 text-white" />
                                </div>
                                <button
                                  onClick={(e) =>
                                    removeImage(section._id, item.no, index, e)
                                  }
                                  className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg z-10"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                                <div className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded backdrop-blur-sm font-bold">
                                  #{index + 1}
                                </div>
                              </div>
                            ))}

                            {/* ✅ MODIFIED ADD BUTTONS CONTAINER */}
                            {canAddMore && (
                              <div className="flex-shrink-0 w-32 md:w-20 h-20 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors bg-gray-50 dark:bg-gray-900/30 flex md:flex-col">
                                {/* LEFT SIDE (Mobile) / TOP SIDE (Desktop) - Contains Camera & Single Upload */}
                                <div className="flex flex-col w-1/2 md:w-full h-full md:h-2/3 border-r md:border-r-0 md:border-b border-gray-300 dark:border-gray-600">
                                  {/* 1. Camera Button */}
                                  <button
                                    onClick={() =>
                                      openImageEditorForNew(
                                        "camera",
                                        section._id,
                                        item.no,
                                        item.maxCount
                                      )
                                    }
                                    className="w-full h-1/2 flex flex-col items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group border-b border-gray-300 dark:border-gray-600"
                                    title={`Take photos (${availableSlots} slots available)`}
                                  >
                                    <Camera className="w-4 h-4 text-gray-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 transition-colors" />
                                  </button>

                                  {/* 2. Editor Upload Button */}
                                  <button
                                    onClick={() =>
                                      openImageEditorForNew(
                                        "upload",
                                        section._id,
                                        item.no,
                                        item.maxCount
                                      )
                                    }
                                    className="w-full h-1/2 flex flex-col items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors group"
                                    title={`Upload & Edit images (${availableSlots} slots available)`}
                                  >
                                    <Upload className="w-4 h-4 text-gray-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors" />
                                  </button>
                                </div>

                                {/* RIGHT SIDE (Mobile) / BOTTOM SIDE (Desktop) - Contains Multi Upload */}
                                <div className="w-1/2 md:w-full h-full md:h-1/3">
                                  {/* 3. DIRECT BATCH UPLOAD BUTTON */}
                                  <MultipleImageUpload
                                    sectionId={section._id}
                                    itemNo={item.no}
                                    maxCount={item.maxCount}
                                    currentCount={images.length}
                                    onImagesSelected={(files) =>
                                      handleDirectBatchUpload(
                                        section._id,
                                        item.no,
                                        files
                                      )
                                    }
                                  />
                                </div>
                              </div>
                            )}

                            {/* Show slots indicator */}
                            {images.length > 0 &&
                              canAddMore &&
                              availableSlots > 1 && (
                                <div className="flex-shrink-0 flex items-center justify-center px-2">
                                  <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                                    +{availableSlots} slots
                                  </span>
                                </div>
                              )}
                          </div>

                          {images.length === 0 && (
                            <div className="mt-2 text-center">
                              <p className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1">
                                <Images className="w-3 h-3" />
                                You can add up to {item.maxCount} images
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">
            No Results Found
          </h3>
        </div>
      )}

      {/* Image Editor Modal */}
      {showImageEditor && currentEditContext && (
        <YPivotQATemplatesImageEditor
          autoStartMode={
            currentEditContext.mode === "edit" ? null : currentEditContext.mode
          }
          existingData={currentEditContext.existingData}
          maxImages={currentEditContext.maxImages}
          onSave={handleImagesSave}
          onCancel={handleImageEditorClose}
        />
      )}

      {/* Remark Modal */}
      <RemarkModal
        isOpen={remarkModal.isOpen}
        onClose={() => setRemarkModal((prev) => ({ ...prev, isOpen: false }))}
        onSave={handleSaveRemark}
        initialText={remarkModal.key ? remarks[remarkModal.key] : ""}
        title={remarkModal.title}
      />

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .scrollbar-thin::-webkit-scrollbar {
          height: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 2px;
        }
        .dark .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #4a5568;
        }
      `}</style>
    </div>
  );
};

export default YPivotQATemplatesPhotos;
