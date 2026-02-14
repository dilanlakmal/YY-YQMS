import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  Layers,
  Eye,
  MessageSquare,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Tag,
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

// ============================================================================
// INTERNAL: FULL SCREEN IMAGE SLIDER MODAL
// ============================================================================
const DefectGalleryModal = ({ images, initialIndex, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Handle Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex]);

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const currentImg = images[currentIndex];

  if (!currentImg) return null;

  // Resolve URL
  const imgSrc =
    currentImg.imageURL ||
    currentImg.url ||
    currentImg.src ||
    currentImg.editedImgSrc;
  const displayUrl =
    imgSrc && imgSrc.startsWith("http") ? imgSrc : `${API_BASE_URL}${imgSrc}`;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/95 backdrop-blur-sm flex flex-col animate-fadeIn"
      onClick={onClose}
    >
      {/* 1. Top Bar: Counter & Close */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-start z-50">
        <div className="bg-black/50 px-3 py-1 rounded-full text-white text-xs font-mono border border-white/20">
          {currentIndex + 1} / {images.length}
        </div>
        <button
          onClick={onClose}
          className="bg-white/10 hover:bg-red-600/80 text-white p-2 rounded-full transition-colors border border-white/10"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex items-center justify-center relative w-full h-full p-4 pb-20">
        {/* Previous Arrow */}
        <button
          onClick={handlePrev}
          className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 z-40 hidden sm:flex"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>

        {/* Image (Responsive Object Fit) */}
        <div
          className="relative max-w-full max-h-full flex items-center justify-center"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={displayUrl}
            alt={currentImg.defectName}
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
          />
        </div>

        {/* Next Arrow */}
        <button
          onClick={handleNext}
          className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all border border-white/10 z-40 hidden sm:flex"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      </div>

      {/* 3. Bottom Details Footer */}
      <div
        className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/80 to-transparent p-6 pb-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="max-w-3xl mx-auto text-center space-y-2">
          {/* Defect Name & Pcs Badge */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-bold uppercase rounded border border-indigo-400">
              {currentImg.pcsLabel}
            </span>
            <h2 className="text-lg font-bold text-white leading-tight">
              {currentImg.isMain
                ? currentImg.defectName
                : "Additional Evidence"}
            </h2>
            {currentImg.status && (
              <span
                className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                  currentImg.status === "Minor"
                    ? "bg-green-900/60 text-green-200 border-green-700"
                    : currentImg.status === "Major"
                      ? "bg-orange-900/60 text-orange-200 border-orange-700"
                      : "bg-red-900/60 text-red-200 border-red-700"
                }`}
              >
                {currentImg.status}
              </span>
            )}
          </div>

          {/* Location & Config Info */}
          <div className="flex flex-wrap justify-center items-center gap-3 text-xs text-gray-300">
            <div className="flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-400" />
              <span>{currentImg.configLabel}</span>
            </div>
            {currentImg.isMain && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-emerald-400" />
                <span>{currentImg.locationText}</span>
              </div>
            )}
            {!currentImg.isMain && (
              <div className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-purple-400" />
                <span>Associated with: {currentImg.defectName}</span>
              </div>
            )}
          </div>

          {/* Comment */}
          {currentImg.comment && (
            <div className="mt-2 inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
              <MessageSquare className="w-3 h-3 text-yellow-400" />
              <p className="text-xs text-gray-200 italic">
                "{currentImg.comment}"
              </p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const YPivotQAInspectionDefectVisuals = ({ defectData }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [initialSlide, setInitialSlide] = useState(0);

  // 1. Flatten and Process Images
  const defectImages = useMemo(() => {
    const images = [];
    if (!defectData || !Array.isArray(defectData)) return images;

    const configCounters = {};
    const pieceIdMap = {};

    const getDisplayPcsNumber = (configKey, uniqueDbId) => {
      const mapKey = `${configKey}__${uniqueDbId}`;
      if (pieceIdMap[mapKey]) return pieceIdMap[mapKey];

      if (!configCounters[configKey]) configCounters[configKey] = 0;
      configCounters[configKey]++;
      pieceIdMap[mapKey] = configCounters[configKey];
      return configCounters[configKey];
    };

    defectData.forEach((defect) => {
      const { defectName } = defect;

      // Construct Config Label
      const configParts = [
        defect.lineName ? `Line ${defect.lineName}` : null,
        defect.tableName ? `Table ${defect.tableName}` : null,
        defect.colorName ? `Color ${defect.colorName}` : null,
      ].filter(Boolean);
      const configLabel =
        configParts.length > 0 ? configParts.join(" • ") : "General";

      if (defect.isNoLocation) {
        defect.images?.forEach((img, idx) => {
          const dbUniqueId = `${defect._id || defect.defectId}_Gen_${idx}`;
          const displayNum = getDisplayPcsNumber(configLabel, dbUniqueId);

          images.push({
            ...img,
            uniquePieceId: dbUniqueId,
            pcsLabel: `Pcs #${displayNum}`,
            defectName,
            locationText: "General",
            positionType: "N/A",
            status: defect.status,
            configLabel: configLabel,
            isMain: true,
            comment: defect.additionalRemark || "",
          });
        });
      } else {
        defect.locations?.forEach((loc) => {
          loc.positions?.forEach((pos) => {
            const dbUniqueId = `${defect._id || defect.defectId}_${
              loc.locationId
            }_${pos.pcsNo}`;
            const displayNum = getDisplayPcsNumber(configLabel, dbUniqueId);
            const pcsLabel = `Pcs #${displayNum}`;

            const commonProps = {
              uniquePieceId: dbUniqueId,
              pcsLabel,
              defectName,
              locationText: `${loc.locationName} - ${loc.view}`,
              positionType: pos.position,
              status: pos.status,
              configLabel: configLabel,
            };

            if (pos.requiredImage) {
              images.push({
                ...pos.requiredImage,
                ...commonProps,
                isMain: true,
                comment:
                  pos.requiredImage.additionalRemark || pos.comment || "",
              });
            }

            pos.additionalImages?.forEach((img) => {
              images.push({
                ...img,
                ...commonProps,
                isMain: false,
                comment: img.comment || pos.additionalRemark || "",
              });
            });
          });
        });
      }
    });

    return images;
  }, [defectData]);

  // 2. Group by Configuration for Display Grid
  const defectImagesByConfig = useMemo(() => {
    const groups = {};
    defectImages.forEach((img) => {
      const key = img.configLabel;
      if (!groups[key]) {
        groups[key] = { images: [], uniquePieces: new Set() };
      }
      groups[key].images.push(img);
      groups[key].uniquePieces.add(img.uniquePieceId);
    });
    return groups;
  }, [defectImages]);

  // 3. Handle Click to Open Modal
  const handleImageClick = (img) => {
    // Find absolute index in the flat array for the slider
    const index = defectImages.findIndex((item) => item === img);
    if (index !== -1) {
      setInitialSlide(index);
      setModalOpen(true);
    }
  };

  if (defectImages.length === 0) return null;

  return (
    <>
      <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
          <Camera className="w-3.5 h-3.5" />
          Defect Visual Evidence
        </h3>

        {Object.entries(defectImagesByConfig).map(([configName, groupData]) => (
          <div key={configName} className="mb-6 last:mb-0">
            {/* Config Header */}
            <div className="flex items-center gap-2 mb-3 pl-1">
              <Layers className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                {configName}
              </span>
              <span className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full font-bold">
                {groupData.uniquePieces.size} pcs
              </span>
            </div>

            {/* Images Grid (Mobile: 1, Tablet: 2, Desktop: 3) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupData.images.map((img, idx) => {
                const imgSrc =
                  img.imageURL || img.url || img.src || img.editedImgSrc;
                const displayUrl =
                  imgSrc && imgSrc.startsWith("http")
                    ? imgSrc
                    : `${API_BASE_URL}${imgSrc}`;

                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm group flex flex-col"
                  >
                    {/* Image Area */}
                    <div
                      className="relative h-48 cursor-pointer overflow-hidden bg-gray-100 dark:bg-gray-900"
                      onClick={() => handleImageClick(img)}
                    >
                      <img
                        src={displayUrl}
                        alt={img.defectName}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all drop-shadow-md" />
                      </div>

                      {/* Badges */}
                      <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                        {img.status && (
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase shadow-sm border ${
                              img.status === "Minor"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : img.status === "Major"
                                  ? "bg-orange-100 text-orange-700 border-orange-200"
                                  : "bg-red-600 text-white border-red-700"
                            }`}
                          >
                            {img.status}
                          </span>
                        )}
                        {!img.isMain && (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase shadow-sm border bg-purple-500 text-white border-purple-600">
                            Add. Evidence
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info Footer */}
                    <div className="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <span className="flex-shrink-0 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[9px] font-bold border border-gray-200 dark:border-gray-600">
                            {img.pcsLabel}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-tight line-clamp-1">
                          {img.isMain ? img.defectName : "Additional Evidence"}
                        </p>
                        {img.isMain && (
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-1">
                            {img.locationText}
                          </p>
                        )}
                      </div>

                      {img.comment && (
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-start gap-1.5">
                          <MessageSquare className="w-3 h-3 text-indigo-500 mt-0.5 flex-shrink-0" />
                          <p className="text-[10px] text-gray-600 dark:text-gray-300 italic leading-snug line-clamp-2">
                            {img.comment}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Internal Full Screen Modal */}
      {modalOpen && (
        <DefectGalleryModal
          images={defectImages}
          initialIndex={initialSlide}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
};

export default YPivotQAInspectionDefectVisuals;
