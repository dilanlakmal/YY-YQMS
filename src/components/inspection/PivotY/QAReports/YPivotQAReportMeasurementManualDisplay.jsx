import React, { useState } from "react";
import {
  FileText,
  Camera,
  MessageSquare,
  CheckCircle2,
  XCircle,
  Eye,
  Info,
  Maximize2,
  X
} from "lucide-react";
import { createPortal } from "react-dom";
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

const YPivotQAReportMeasurementManualDisplay = ({ manualData }) => {
  const [previewImage, setPreviewImage] = useState(null);

  if (
    !manualData ||
    (!manualData.remarks &&
      (!manualData.images || manualData.images.length === 0))
  ) {
    return null;
  }

  const { remarks, status, images } = manualData;
  const isPass = status === "Pass";

  // Helper to resolve image URL
  const resolveUrl = (url) => {
    if (!url) return "";
    if (url.startsWith("http") || url.startsWith("data:")) return url;
    return `${API_BASE_URL}${url}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-2.5 flex justify-between items-center">
        <h2 className="text-white font-bold text-sm flex items-center gap-2">
          <FileText className="w-4 h-4" /> Manual Measurement Findings
        </h2>
        <div
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shadow-sm border ${
            isPass
              ? "bg-green-100 text-green-700 border-green-200"
              : "bg-red-100 text-red-700 border-red-200"
          }`}
        >
          {isPass ? (
            <CheckCircle2 className="w-3 h-3" />
          ) : (
            <XCircle className="w-3 h-3" />
          )}
          {status}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* 1. General Remarks */}
        {remarks && (
          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800 rounded-lg p-3 flex gap-3">
            <div className="shrink-0">
              <div className="p-1.5 bg-amber-100 dark:bg-amber-800/40 rounded-md">
                <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div>
              <h4 className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">
                Inspector Remarks
              </h4>
              <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                {remarks}
              </p>
            </div>
          </div>
        )}

        {/* 2. Photo Grid */}
        {images && images.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Camera className="w-3.5 h-3.5" /> Captured Evidence (
              {images.length})
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((img, idx) => {
                const imgSrc = resolveUrl(img.imageURL || img.imgSrc);
                return (
                  <div
                    key={img.id || idx}
                    className="group relative flex flex-col bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden hover:shadow-md transition-all"
                  >
                    {/* Image Thumbnail */}
                    <div
                      className="relative aspect-square cursor-pointer overflow-hidden bg-gray-200 dark:bg-gray-800"
                      onClick={() =>
                        setPreviewImage({
                          src: imgSrc,
                          alt: `Image ${idx + 1}`
                        })
                      }
                    >
                      <img
                        src={imgSrc}
                        alt={`Evidence ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all drop-shadow-md" />
                      </div>
                      <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                        #{idx + 1}
                      </div>
                    </div>

                    {/* Image Remark */}
                    {img.remark && (
                      <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex-1">
                        <p className="text-[10px] text-gray-600 dark:text-gray-300 line-clamp-3 italic">
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

export default YPivotQAReportMeasurementManualDisplay;
