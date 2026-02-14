import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  FileText,
  Camera,
  MessageSquare,
  Maximize2,
  X,
  Layers,
  User,
  AlertCircle
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

// --- Simple Image Modal ---
const ImageModal = ({ src, alt, onClose }) => {
  if (!src) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
      <div
        className="relative max-w-5xl w-full max-h-[90vh] flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        />
      </div>
    </div>,
    document.body
  );
};

const YPivotQAInspectionManualDefectDisplay = ({ manualData }) => {
  const [previewImage, setPreviewImage] = useState(null);

  if (!manualData || !Array.isArray(manualData) || manualData.length === 0) {
    return null;
  }

  // Helper to resolve image URL
  const resolveUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    return `${API_BASE_URL}${url}`;
  };

  return (
    <div className="space-y-6 mt-6 border-t border-gray-100 dark:border-gray-700 pt-6">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
          <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
          Manual Defect Entries
        </h3>
      </div>

      {manualData.map((item, index) => {
        // Skip empty entries
        if (!item.remarks && (!item.images || item.images.length === 0)) {
          return null;
        }

        const configLabel =
          [
            item.line ? `Line ${item.line}` : null,
            item.table ? `Table ${item.table}` : null,
            item.color ? `Color ${item.color}` : null
          ]
            .filter(Boolean)
            .join(" • ") || "General Observation";

        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm"
          >
            {/* Header: Context Info */}
            <div className="bg-gray-50 dark:bg-gray-900/50 px-4 py-2 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                  {configLabel}
                </span>
              </div>
              {item.qcUser && (
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 bg-white dark:bg-gray-800 px-2 py-0.5 rounded border border-gray-200 dark:border-gray-700">
                  <User className="w-3 h-3" />
                  <span>{item.qcUser.eng_name || item.qcUser.emp_id}</span>
                </div>
              )}
            </div>

            <div className="p-4 space-y-4">
              {/* General Remarks */}
              {item.remarks && (
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-lg p-3 flex gap-3">
                  <MessageSquare className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase mb-1">
                      Inspector Note
                    </h4>
                    <p className="text-xs text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap">
                      {item.remarks}
                    </p>
                  </div>
                </div>
              )}

              {/* Images Grid */}
              {item.images && item.images.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Camera className="w-3 h-3" /> Attached Photos (
                    {item.images.length})
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {item.images.map((img, imgIdx) => {
                      const imgSrc = resolveUrl(img.imageURL || img.imgSrc);
                      return (
                        <div
                          key={img.id || imgIdx}
                          className="group relative flex flex-col bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                        >
                          {/* Thumbnail */}
                          <div
                            className="relative aspect-square cursor-pointer overflow-hidden"
                            onClick={() =>
                              setPreviewImage({
                                src: imgSrc,
                                alt: `Manual Evidence ${imgIdx + 1}`
                              })
                            }
                          >
                            <img
                              src={imgSrc}
                              alt="Manual Evidence"
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              loading="lazy"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                              <Maximize2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all drop-shadow-md" />
                            </div>
                          </div>

                          {/* Individual Image Remark */}
                          {img.remark && (
                            <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex-1">
                              <p className="text-[10px] text-gray-600 dark:text-gray-300 italic line-clamp-2">
                                "{img.remark}"
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Modal */}
      {previewImage && (
        <ImageModal
          src={previewImage.src}
          alt={previewImage.alt}
          onClose={() => setPreviewImage(null)}
        />
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default YPivotQAInspectionManualDefectDisplay;
