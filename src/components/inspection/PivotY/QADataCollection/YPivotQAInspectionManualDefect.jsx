import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2"; // Import SweetAlert2
import {
  FileText,
  Camera,
  Upload,
  X,
  Edit,
  Trash2,
  MessageSquare
} from "lucide-react";
import YPivotQATemplatesImageEditor from "../QATemplates/YPivotQATemplatesImageEditor";

// --- Internal Comment Modal Component ---
const CommentModal = ({ isOpen, onClose, onSave, initialValue }) => {
  const [comment, setComment] = useState("");

  // FIX: Reset or Set state whenever the modal opens or the target image changes
  useEffect(() => {
    if (isOpen) {
      setComment(initialValue || "");
    }
  }, [isOpen, initialValue]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-gray-200 dark:border-gray-700 transform scale-100 transition-all">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <h3 className="font-bold text-gray-800 dark:text-white text-sm">
            {initialValue ? "Edit Remark" : "Add Image Remark"}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
        <div className="p-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value.slice(0, 100))}
            placeholder="Type a short remark for this image (max 100 chars)..."
            rows={3}
            className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            autoFocus
          />
          <div className="text-right mt-1">
            <span
              className={`text-[10px] ${
                comment.length >= 100 ? "text-red-500" : "text-gray-400"
              }`}
            >
              {comment.length}/100
            </span>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onSave(comment);
                onClose();
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
            >
              Save Remark
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

const YPivotQAInspectionManualDefect = ({ data, onUpdate }) => {
  // Local state for UI controls
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editorContext, setEditorContext] = useState(null);

  // State for Comment Modal
  const [commentModal, setCommentModal] = useState({
    isOpen: false,
    imageIndex: null,
    initialValue: ""
  });

  // Destructure data or provide defaults
  const remarks = data?.remarks || "";
  const images = data?.images || [];

  // --- Handlers ---

  const handleTextChange = (e) => {
    const text = e.target.value.slice(0, 1000); // Enforce 1000 char limit
    onUpdate({
      ...data,
      remarks: text
    });
  };

  // mode can be 'camera', 'upload', or null
  const handleOpenEditor = (mode = "upload", existingImages = null) => {
    setEditorContext({
      mode: mode,
      existingData: existingImages,
      isEditing: !!existingImages
    });
    setShowImageEditor(true);
  };

  const handleEditorSave = (savedImages) => {
    let updatedList;

    if (editorContext.isEditing) {
      // If we passed existing images to edit, replace them
      // Preserve the 'remark' field if it exists
      updatedList = savedImages.map((img, i) => ({
        ...img,
        remark: editorContext.existingData[i]?.remark || ""
      }));
    } else {
      // If adding new, initialize remark as empty
      const newImagesWithRemark = savedImages.map((img) => ({
        ...img,
        remark: ""
      }));
      updatedList = [...images, ...newImagesWithRemark];
    }

    // Enforce max 10 images constraint logic
    if (updatedList.length > 10) {
      Swal.fire({
        icon: "info",
        title: "Limit Reached",
        text: "Maximum 10 images allowed. Excess images were trimmed."
      });
      updatedList = updatedList.slice(0, 10);
    }

    onUpdate({
      ...data,
      images: updatedList
    });

    setShowImageEditor(false);
    setEditorContext(null);
  };

  // FIX: Switched to SweetAlert2
  const handleDeleteImage = async (index) => {
    const result = await Swal.fire({
      title: "Delete Photo?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444", // Red
      cancelButtonColor: "#6b7280", // Gray
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      reverseButtons: true
    });

    if (result.isConfirmed) {
      const newImages = [...images];
      newImages.splice(index, 1);
      onUpdate({
        ...data,
        images: newImages
      });
      // Optional: Small toast success
      Swal.fire({
        icon: "success",
        title: "Deleted",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500
      });
    }
  };

  // Open Comment Modal
  const handleOpenCommentModal = (index) => {
    setCommentModal({
      isOpen: true,
      imageIndex: index,
      initialValue: images[index]?.remark || ""
    });
  };

  // Save Comment
  const handleSaveComment = (newComment) => {
    const newImages = [...images];
    if (newImages[commentModal.imageIndex]) {
      newImages[commentModal.imageIndex] = {
        ...newImages[commentModal.imageIndex],
        remark: newComment
      };
      onUpdate({
        ...data,
        images: newImages
      });
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* --- Remarks Section --- */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-500" />
            General Remarks
          </h3>
          <span
            className={`text-xs font-bold ${
              remarks.length >= 1000 ? "text-red-500" : "text-gray-400"
            }`}
          >
            {remarks.length} / 1000
          </span>
        </div>
        <textarea
          value={remarks}
          onChange={handleTextChange}
          placeholder="Type your manual inspection notes, general observations, or specific issues not covered by the defect list..."
          rows={6}
          className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all"
        />
      </div>

      {/* --- Photos Section --- */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-500" />
            Manual Photos
          </h3>
          <span className="text-xs text-gray-400 font-medium">
            {images.length} / 10 Max
          </span>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div
              key={img.id || idx}
              className="relative flex flex-col bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group/card"
            >
              {/* Image Container */}
              <div className="relative group aspect-square w-full">
                <img
                  src={img.editedImgSrc || img.imgSrc}
                  alt={`Evidence ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                {/* Overlay Actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleOpenEditor(null, [img])}
                    className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors"
                    title="Edit Annotations"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteImage(idx)}
                    className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full text-white backdrop-blur-sm transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                  #{idx + 1}
                </div>
              </div>

              {/* Comment Button Area */}
              <div className="p-2 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex flex-col flex-1">
                {/* 
                   If there is a remark, show it.
                   If not, show the 'Add Remark' button.
                   Hovering over the card allows editing if remark exists.
                */}
                {img.remark ? (
                  <div
                    className="flex-1 cursor-pointer group/remark"
                    onClick={() => handleOpenCommentModal(idx)}
                  >
                    <p className="text-[10px] text-gray-600 dark:text-gray-300 line-clamp-2 leading-tight">
                      "{img.remark}"
                    </p>
                    <div className="mt-1 hidden group-hover/remark:flex items-center gap-1 text-[9px] text-indigo-500 font-bold">
                      <Edit className="w-2.5 h-2.5" /> Edit
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => handleOpenCommentModal(idx)}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-bold transition-colors bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-100 dark:border-gray-600"
                  >
                    <MessageSquare className="w-3 h-3" />
                    Add Remark
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Add Buttons (Capture & Upload) */}
          {images.length < 10 && (
            <div className="aspect-[3/4] sm:aspect-square flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-2 transition-all">
              <span className="text-xs font-bold text-gray-400">Add Photo</span>
              <div className="flex gap-2">
                {/* Camera Button */}
                <button
                  onClick={() => handleOpenEditor("camera")}
                  className="flex flex-col items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 hover:scale-105 transition-all shadow-sm"
                  title="Take Photo"
                >
                  <Camera className="w-5 h-5" />
                </button>

                {/* Upload Button */}
                <button
                  onClick={() => handleOpenEditor("upload")}
                  className="flex flex-col items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/50 hover:scale-105 transition-all shadow-sm"
                  title="Upload Image"
                >
                  <Upload className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {images.length === 0 && (
          <div className="text-center py-6 text-gray-400 text-sm">
            No photos added yet. Click above to add evidence.
          </div>
        )}
      </div>

      {/* --- Image Editor Portal --- */}
      {showImageEditor && (
        <YPivotQATemplatesImageEditor
          autoStartMode={editorContext?.isEditing ? null : editorContext?.mode}
          existingData={editorContext?.existingData}
          onSave={handleEditorSave}
          onCancel={() => {
            setShowImageEditor(false);
            setEditorContext(null);
          }}
        />
      )}

      {/* --- Comment Modal Portal --- */}
      <CommentModal
        isOpen={commentModal.isOpen}
        onClose={() =>
          setCommentModal({ ...commentModal, isOpen: false, initialValue: "" })
        }
        onSave={handleSaveComment}
        initialValue={commentModal.initialValue}
      />
    </div>
  );
};

export default YPivotQAInspectionManualDefect;
