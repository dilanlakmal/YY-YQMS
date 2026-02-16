import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";
import {
  Camera,
  Upload,
  X,
  Edit3,
  Loader,
  ChevronRight,
  MessageSquare,
  Trash2,
  Save,
  AlertCircle,
  Images,
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";
import YPivotQATemplatesImageEditor from "./YPivotQATemplatesImageEditor";

// Maximum images per section
const MAX_IMAGES_PER_SECTION = 5;

// ==============================================================================
// INTERNAL COMPONENT: REMARK MODAL
// ==============================================================================
const RemarkModal = ({ isOpen, onClose, onSave, initialText, title, t }) => {
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
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-500" />
            {title || t("fincheckHeader.addRemark")}
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
            placeholder={t("fincheckHeader.remarkPlaceholder")}
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
            {t("fincheckHeader.cancel")}
          </button>
          <button
            onClick={() => onSave(text)}
            disabled={!text.trim()}
            className="px-6 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {t("fincheckHeader.save")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================
const YPivotQATemplatesHeader = ({ headerData, onUpdateHeaderData }) => {
  // --- i18n Hook ---
  const { t, i18n } = useTranslation();

  // --- Current Language State (tracks i18n language) ---
  const [currentLanguage, setCurrentLanguage] = useState(
    () => localStorage.getItem("preferredLanguage") || i18n.language || "en",
  );

  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // -- State for Selections (Initialize from props or empty) --
  const [selectedOptions, setSelectedOptions] = useState(
    headerData?.selectedOptions || {},
  );

  // -- State for Remarks (Initialize from props or empty) --
  const [remarks, setRemarks] = useState(headerData?.remarks || {});
  const [remarkModalState, setRemarkModalState] = useState({
    isOpen: false,
    sectionId: null,
    sectionTitle: "",
  });

  // -- State for Images (Initialize from props or empty) --
  const [capturedImages, setCapturedImages] = useState(
    headerData?.capturedImages || {},
  );

  const [showImageEditor, setShowImageEditor] = useState(false);
  const [currentEditContext, setCurrentEditContext] = useState(null);

  // --- Language Change Listener ---
  useEffect(() => {
    // Handler for i18n language change
    const handleI18nLanguageChange = (lng) => {
      setCurrentLanguage(lng);
    };

    // Handler for custom event from LanguageSwitcher
    const handleCustomLanguageChange = (event) => {
      const newLang = event.detail?.language;
      if (newLang) {
        setCurrentLanguage(newLang);
      }
    };

    // Subscribe to i18n language changes
    i18n.on("languageChanged", handleI18nLanguageChange);

    // Subscribe to custom event
    window.addEventListener("languageChanged", handleCustomLanguageChange);

    // Cleanup
    return () => {
      i18n.off("languageChanged", handleI18nLanguageChange);
      window.removeEventListener("languageChanged", handleCustomLanguageChange);
    };
  }, [i18n]);

  // --- Helper Functions for Language-Based Display ---
  // Get main title based on current language
  const getMainTitle = useCallback(
    (section) => {
      if (currentLanguage === "ch" && section.MainTitleChinese) {
        return section.MainTitleChinese;
      }
      return section.MainTitle;
    },
    [currentLanguage],
  );

  // Get option name based on current language
  const getOptionName = useCallback(
    (option) => {
      if (currentLanguage === "ch" && option.NameChinese) {
        return option.NameChinese;
      }
      return option.Name;
    },
    [currentLanguage],
  );

  // --- Helper to Sync with Parent ---
  const updateParent = (updates) => {
    if (onUpdateHeaderData) {
      onUpdateHeaderData({
        selectedOptions,
        remarks,
        capturedImages,
        ...updates,
      });
    }
  };

  // --- Fetch Header Configuration ---
  useEffect(() => {
    const fetchSections = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/qa-sections-home`,
        );
        setSections(response.data.data);

        // Initialize default selections ONLY if no saved data exists
        if (
          !headerData ||
          Object.keys(headerData?.selectedOptions || {}).length === 0
        ) {
          const initialSelections = {};
          response.data.data.forEach((section) => {
            if (section.Options && section.Options.length > 0) {
              // Always store English name for consistency
              initialSelections[section._id] = section.Options[0].Name;
            }
          });
          setSelectedOptions(initialSelections);
          if (onUpdateHeaderData) {
            onUpdateHeaderData({ selectedOptions: initialSelections });
          }
        }
      } catch (error) {
        console.error("Failed to load header sections:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSections();
  }, []);

  // --- Remark Logic ---
  const openRemarkModal = (section) => {
    setRemarkModalState({
      isOpen: true,
      sectionId: section._id,
      sectionTitle: getMainTitle(section),
    });
  };

  const handleSaveRemark = (text) => {
    const { sectionId } = remarkModalState;
    if (sectionId) {
      const newRemarks = { ...remarks, [sectionId]: text };
      setRemarks(newRemarks);
      updateParent({ remarks: newRemarks });
    }
    setRemarkModalState({ isOpen: false, sectionId: null, sectionTitle: "" });
  };

  const clearRemark = (sectionId) => {
    if (window.confirm(t("fincheckHeader.clearRemarkConfirm"))) {
      const newRemarks = { ...remarks };
      delete newRemarks[sectionId];
      setRemarks(newRemarks);
      updateParent({ remarks: newRemarks });
    }
  };

  // --- Image Handling Logic ---
  const getImagesForSection = useMemo(() => {
    return (sectionId) => {
      return Object.keys(capturedImages)
        .filter((k) => k.startsWith(`${sectionId}_`))
        .map((k) => {
          const idx = parseInt(k.split("_")[1]);
          return {
            key: k,
            data: capturedImages[k],
            index: idx,
          };
        })
        .sort((a, b) => a.index - b.index);
    };
  }, [capturedImages]);

  const getNextImageIndex = (sectionId) => {
    let index = 0;
    while (capturedImages[`${sectionId}_${index}`]) {
      index++;
    }
    return index;
  };

  // Get current images count for a section
  const getCurrentImagesCount = (sectionId) => {
    return getImagesForSection(sectionId).length;
  };

  // Get available slots for adding new images
  const getAvailableSlots = (sectionId) => {
    const currentCount = getCurrentImagesCount(sectionId);
    return Math.max(0, MAX_IMAGES_PER_SECTION - currentCount);
  };

  // Open image editor for NEW capture/upload (multi-image mode)
  const openImageEditorForNew = (mode, sectionId) => {
    const availableSlots = getAvailableSlots(sectionId);

    if (availableSlots <= 0) {
      alert(
        `${t("fincheckHeader.maximumReached")} (${MAX_IMAGES_PER_SECTION})`,
      );
      return;
    }

    setCurrentEditContext({
      mode,
      sectionId,
      isEditing: false,
      maxImages: availableSlots,
      existingData: null,
    });
    setShowImageEditor(true);
  };

  // Open image editor for EDITING existing image
  const openImageEditorForEdit = (sectionId, imageIndex) => {
    const key = `${sectionId}_${imageIndex}`;
    const imageData = capturedImages[key];

    if (imageData) {
      setCurrentEditContext({
        mode: "edit",
        sectionId,
        imageIndex,
        isEditing: true,
        maxImages: 1,
        existingData: [
          {
            imgSrc: imageData.imgSrc || imageData.url,
            history: imageData.history || [],
          },
        ],
      });
      setShowImageEditor(true);
    }
  };

  const handleImageEditorClose = () => {
    setShowImageEditor(false);
    setCurrentEditContext(null);
  };

  // Handle multiple images save from editor
  const handleImagesSave = (savedImages) => {
    if (!currentEditContext || !savedImages || savedImages.length === 0) {
      handleImageEditorClose();
      return;
    }

    const { sectionId, isEditing, imageIndex } = currentEditContext;
    let newImages = { ...capturedImages };

    // Helper to construct image object
    const createImageData = (img) => {
      const finalUrl = img.editedImgSrc || img.imgSrc;

      return {
        id: img.id,
        url: finalUrl,
        file: img.file,
        imgSrc: img.imgSrc,
        history: img.history || [],
      };
    };

    if (isEditing && imageIndex !== undefined) {
      // Editing single existing image
      const key = `${sectionId}_${imageIndex}`;
      newImages[key] = createImageData(savedImages[0]);
    } else {
      // Adding new images
      let nextIndex = getNextImageIndex(sectionId);
      const availableSlots = getAvailableSlots(sectionId);
      const imagesToAdd = savedImages.slice(0, availableSlots);

      imagesToAdd.forEach((img) => {
        const key = `${sectionId}_${nextIndex}`;
        newImages[key] = createImageData(img);
        nextIndex++;
      });

      if (savedImages.length > availableSlots) {
        alert(
          `Only ${availableSlots} image(s) were added. Maximum ${MAX_IMAGES_PER_SECTION} images per section.`,
        );
      }
    }

    setCapturedImages(newImages);
    updateParent({ capturedImages: newImages });
    handleImageEditorClose();
  };

  const removeImage = (sectionId, imageIndex, e) => {
    if (e) e.stopPropagation();

    if (!window.confirm(t("fincheckHeader.removeImage"))) return;

    const newImages = { ...capturedImages };

    // Get all images for this section except the one being removed
    const remainingImages = [];
    let idx = 0;
    while (idx < 20) {
      const key = `${sectionId}_${idx}`;
      if (idx !== imageIndex && capturedImages[key]) {
        remainingImages.push(capturedImages[key]);
      }
      idx++;
    }

    // Clear all old keys for this section
    Object.keys(newImages).forEach((key) => {
      if (key.startsWith(`${sectionId}_`)) {
        delete newImages[key];
      }
    });

    // Re-add with sequential indices (no gaps)
    remainingImages.forEach((img, i) => {
      newImages[`${sectionId}_${i}`] = img;
    });

    setCapturedImages(newImages);
    updateParent({ capturedImages: newImages });
  };

  const editExistingImage = (e, sectionId, imageIndex) => {
    e.stopPropagation();
    openImageEditorForEdit(sectionId, imageIndex);
  };

  // --- Option Handling ---
  // Always store English name as value for consistency across languages
  const handleOptionSelect = (sectionId, optionName) => {
    const newOptions = { ...selectedOptions, [sectionId]: optionName };
    setSelectedOptions(newOptions);
    updateParent({ selectedOptions: newOptions });
  };

  // Helper for option styling - uses English name for matching
  const getOptionStyle = (optionName, isSelected) => {
    const baseStyle =
      "bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700";

    if (!isSelected) return baseStyle;

    switch (optionName) {
      case "Conform":
      case "Yes":
      case "New Order":
        return "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/30";
      case "Non-Conform":
      case "No":
        return "bg-red-600 border-red-500 text-white shadow-md shadow-red-500/30";
      case "N/A":
        return "bg-orange-500 border-orange-400 text-white shadow-md shadow-orange-500/30";
      default:
        return "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/30";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fadeIn pb-20 max-w-5xl mx-auto">
      {/* Title */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-3 shadow-lg mb-6">
        <h2 className="text-white font-bold text-sm uppercase tracking-wider flex items-center gap-2">
          <ChevronRight className="w-4 h-4" />
          {t("fincheckHeader.checklist")}
        </h2>
      </div>

      {sections.map((section) => {
        const sectionImages = getImagesForSection(section._id);
        const availableSlots = getAvailableSlots(section._id);
        const canAddMore = availableSlots > 0;
        const currentRemark = remarks[section._id];
        const displayTitle = getMainTitle(section);

        return (
          <div
            key={section._id}
            className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm dark:shadow-md overflow-hidden transition-all hover:border-gray-300 dark:hover:border-gray-700"
          >
            {/* --- TOP ROW: Title | Actions | Options --- */}
            <div className="p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              {/* 1. Left: Title */}
              <div className="min-w-[150px]">
                <h4 className="text-gray-800 dark:text-gray-100 font-bold text-sm">
                  {displayTitle}
                </h4>
                {sectionImages.length === 0 && (
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-1">
                    <Images className="w-3 h-3" />
                    {t("fincheckHeader.upToImages", {
                      count: MAX_IMAGES_PER_SECTION,
                    })}
                  </p>
                )}
              </div>

              {/* 2. Middle: Actions (Camera + Upload + Remark) */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Camera */}
                <button
                  onClick={() =>
                    canAddMore && openImageEditorForNew("camera", section._id)
                  }
                  disabled={!canAddMore}
                  className={`p-2 rounded-lg transition-all flex items-center gap-2 border ${
                    canAddMore
                      ? "bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-gray-200 dark:border-gray-700 hover:border-indigo-500"
                      : "bg-gray-50 dark:bg-gray-800/50 text-gray-400 cursor-not-allowed border-gray-100 dark:border-gray-800"
                  }`}
                  title={
                    canAddMore
                      ? `${t("fincheckHeader.takePhotos")} (${t("fincheckHeader.slotsAvailable", { count: availableSlots })})`
                      : t("fincheckHeader.maximumReached")
                  }
                >
                  <Camera className="w-4 h-4" />
                </button>

                {/* Upload */}
                <button
                  onClick={() =>
                    canAddMore && openImageEditorForNew("upload", section._id)
                  }
                  disabled={!canAddMore}
                  className={`p-2 rounded-lg transition-all flex items-center gap-2 border ${
                    canAddMore
                      ? "bg-white dark:bg-gray-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-gray-200 dark:border-gray-700 hover:border-emerald-500"
                      : "bg-gray-50 dark:bg-gray-800/50 text-gray-400 cursor-not-allowed border-gray-100 dark:border-gray-800"
                  }`}
                  title={
                    canAddMore
                      ? `${t("fincheckHeader.uploadImages")} (${t("fincheckHeader.slotsAvailable", { count: availableSlots })})`
                      : t("fincheckHeader.maximumReached")
                  }
                >
                  <Upload className="w-4 h-4" />
                </button>

                {/* Counter with available slots */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                    {sectionImages.length}/{MAX_IMAGES_PER_SECTION}
                  </span>
                  {canAddMore && sectionImages.length > 0 && (
                    <span className="text-[9px] text-indigo-500 dark:text-indigo-400">
                      (+{availableSlots})
                    </span>
                  )}
                </div>

                <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden sm:block"></div>

                {/* Remark Button Logic */}
                {currentRemark ? (
                  // State: Remark Exists
                  <div className="flex items-center bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden h-[34px]">
                    <button
                      onClick={() => openRemarkModal(section)}
                      className="px-3 h-full text-xs font-bold text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors flex items-center gap-2"
                      title={t("fincheckHeader.edit")}
                    >
                      <MessageSquare className="w-3.5 h-3.5 fill-current" />
                      {t("fincheckHeader.remarkAdded")}
                    </button>
                    <div className="w-px h-4 bg-amber-200 dark:bg-amber-800"></div>
                    <button
                      onClick={() => openRemarkModal(section)}
                      className="px-2 h-full text-amber-600 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
                      title={t("fincheckHeader.edit")}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <div className="w-px h-4 bg-amber-200 dark:bg-amber-800"></div>
                    <button
                      onClick={() => clearRemark(section._id)}
                      className="px-2 h-full text-amber-600 dark:text-amber-500 hover:bg-red-100 dark:hover:bg-red-900/40 hover:text-red-600 transition-colors"
                      title={t("fincheckHeader.clear")}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  // State: No Remark
                  <button
                    onClick={() => openRemarkModal(section)}
                    className="h-[34px] px-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all flex items-center gap-2 text-xs font-medium"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    {t("fincheckHeader.addRemark")}
                  </button>
                )}
              </div>

              {/* 3. Right: Options */}
              <div className="flex flex-wrap items-center gap-2 justify-end flex-1">
                {section.Options.map((option) => {
                  // Always compare using English name for consistency
                  const isSelected =
                    selectedOptions[section._id] === option.Name;
                  const displayOptionName = getOptionName(option);

                  return (
                    <button
                      key={option.OptionNo}
                      onClick={() =>
                        handleOptionSelect(section._id, option.Name)
                      }
                      className={`
                        px-4 py-1.5 rounded-md text-xs font-bold border transition-all duration-200
                        ${getOptionStyle(option.Name, isSelected)}
                      `}
                      title={
                        currentLanguage === "ch"
                          ? option.Name
                          : option.NameChinese || option.Name
                      }
                    >
                      {displayOptionName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* --- BOTTOM ROW: Images Preview (Only shows if images exist) --- */}
            {sectionImages.length > 0 && (
              <div className="px-4 pb-4 border-t border-gray-100 dark:border-gray-800/50 pt-3 bg-gray-50 dark:bg-gray-900/50">
                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
                  {sectionImages.map(({ key, data, index }) => (
                    <div
                      key={key}
                      className="relative flex-shrink-0 w-16 h-16 group cursor-pointer"
                      onClick={(e) => editExistingImage(e, section._id, index)}
                    >
                      <img
                        src={data.url}
                        alt={t("fincheckHeader.captured")}
                        className="w-full h-full object-cover rounded-md border border-gray-300 dark:border-gray-600 group-hover:border-indigo-500 transition-colors shadow-sm"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center">
                        <Edit3 className="w-4 h-4 text-white" />
                      </div>
                      <button
                        onClick={(e) => removeImage(section._id, index, e)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[8px] px-1 rounded-sm font-bold">
                        #{index + 1}
                      </div>
                    </div>
                  ))}

                  {/* Add More Button - shown inline when there are images but room for more */}
                  {canAddMore && (
                    <div className="flex-shrink-0 w-16 h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-md overflow-hidden hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors bg-white dark:bg-gray-800">
                      <button
                        onClick={() =>
                          openImageEditorForNew("camera", section._id)
                        }
                        className="w-full h-1/2 flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group border-b border-gray-200 dark:border-gray-700"
                        title={`${t("fincheckHeader.takePhotos")} (${availableSlots} ${t("fincheckHeader.slots")})`}
                      >
                        <Camera className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
                      </button>
                      <button
                        onClick={() =>
                          openImageEditorForNew("upload", section._id)
                        }
                        className="w-full h-1/2 flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors group"
                        title={`${t("fincheckHeader.uploadImages")} (${availableSlots} ${t("fincheckHeader.slots")})`}
                      >
                        <Upload className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
                      </button>
                    </div>
                  )}

                  {/* Slots indicator */}
                  {canAddMore && availableSlots > 1 && (
                    <div className="flex-shrink-0 flex items-center justify-center px-2">
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap">
                        +{availableSlots} {t("fincheckHeader.slots")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* --- MODALS & OVERLAYS --- */}

      {/* Image Editor */}
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
        isOpen={remarkModalState.isOpen}
        onClose={() =>
          setRemarkModalState((prev) => ({ ...prev, isOpen: false }))
        }
        onSave={handleSaveRemark}
        initialText={remarks[remarkModalState.sectionId]}
        title={remarkModalState.sectionTitle}
        t={t}
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
          animation: fadeIn 0.3s ease-out;
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

export default YPivotQATemplatesHeader;
