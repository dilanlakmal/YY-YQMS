import React, { useState } from "react";
import {
  FileText,
  Camera,
  Upload,
  X,
  Edit,
  Plus,
  Trash2,
  CheckCircle,
  XCircle
} from "lucide-react";
import YPivotQATemplatesImageEditor from "../QATemplates/YPivotQATemplatesImageEditor";
import Swal from "sweetalert2";

const YPivotQAInspectionMeasurementManual = ({ data, onUpdate }) => {
  // Destructure with defaults
  const remarks = data?.remarks || "";
  const status = data?.status || "Pass"; // Default to Pass
  const images = data?.images || [];

  // Local state for image editor
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [editorContext, setEditorContext] = useState(null);

  // --- Handlers ---

  const handleRemarkChange = (e) => {
    const text = e.target.value.slice(0, 1000);
    onUpdate({ ...data, remarks: text });
  };

  const handleStatusToggle = (newStatus) => {
    onUpdate({ ...data, status: newStatus });
  };

  const handleImageRemarkChange = (index, text) => {
    const newImages = [...images];
    newImages[index] = { ...newImages[index], remark: text.slice(0, 100) };
    onUpdate({ ...data, images: newImages });
  };

  // Image Editor Handlers
  const handleOpenEditor = (mode = "upload", existingImages = null) => {
    setEditorContext({
      mode,
      existingData: existingImages,
      isEditing: !!existingImages
    });
    setShowImageEditor(true);
  };

  const handleEditorSave = (savedImages) => {
    let updatedList;
    if (editorContext.isEditing) {
      updatedList = savedImages.map((img) => ({
        ...img,
        remark: "" // Reset remark on new image or preserve if we could track ID
      }));
    } else {
      // Append new images with empty remarks
      const newItems = savedImages.map((img) => ({ ...img, remark: "" }));
      updatedList = [...images, ...newItems];
    }

    if (updatedList.length > 10) {
      alert("Maximum 10 images allowed. Trimming excess.");
      updatedList = updatedList.slice(0, 10);
    }

    onUpdate({ ...data, images: updatedList });
    setShowImageEditor(false);
    setEditorContext(null);
  };

  const handleDeleteImage = async (index) => {
    // REPLACE window.confirm with Swal
    const result = await Swal.fire({
      title: "Delete Photo?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it"
    });

    if (result.isConfirmed) {
      const newImages = [...images];
      newImages.splice(index, 1);
      onUpdate({ ...data, images: newImages });

      Swal.fire({
        icon: "success",
        title: "Deleted!",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500
      });
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-fadeIn">
      {/* 1. General Remarks */}
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
          onChange={handleRemarkChange}
          placeholder="Type general measurement observations..."
          rows={4}
          className="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-all"
        />
      </div>

      {/* 2. Measurement Status Toggle */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
        <h3 className="font-bold text-gray-700 dark:text-gray-200">
          Measurement Status
        </h3>
        <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
          <button
            onClick={() => handleStatusToggle("Pass")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${
              status === "Pass"
                ? "bg-green-500 text-white shadow-md"
                : "text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
            }`}
          >
            <CheckCircle className="w-4 h-4" /> Pass
          </button>
          <button
            onClick={() => handleStatusToggle("Fail")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${
              status === "Fail"
                ? "bg-red-500 text-white shadow-md"
                : "text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
            }`}
          >
            <XCircle className="w-4 h-4" /> Fail
          </button>
        </div>
      </div>

      {/* 3. Photos Section */}
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

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img, idx) => (
            <div
              key={idx}
              className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Image Container */}
              <div className="relative aspect-square group">
                <img
                  src={img.editedImgSrc || img.imgSrc}
                  alt={`Evidence ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {/* Note: Editing re-opens editor but logic below is simplified */}
                  <button
                    onClick={() => handleDeleteImage(idx)}
                    className="p-2 bg-red-500 rounded-full text-white"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="absolute top-1 left-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                  #{idx + 1}
                </div>
              </div>

              {/* Image Remark Input */}
              <div className="p-2">
                <input
                  type="text"
                  value={img.remark || ""}
                  onChange={(e) => handleImageRemarkChange(idx, e.target.value)}
                  placeholder="Add note (100 chars)..."
                  maxLength={100}
                  className="w-full text-xs bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
            </div>
          ))}

          {/* Add Buttons */}
          {images.length < 10 && (
            <div className="aspect-square flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-gray-900 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4">
              <span className="text-xs font-bold text-gray-400">Add Photo</span>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenEditor("camera")}
                  className="flex flex-col items-center justify-center w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg hover:scale-105 transition-all"
                  title="Take Photo"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handleOpenEditor("upload")}
                  className="flex flex-col items-center justify-center w-10 h-10 bg-emerald-100 text-emerald-600 rounded-lg hover:scale-105 transition-all"
                  title="Upload Image"
                >
                  <Upload className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Editor */}
      {showImageEditor && (
        <YPivotQATemplatesImageEditor
          autoStartMode={editorContext?.mode}
          existingData={editorContext?.existingData}
          onSave={handleEditorSave}
          onCancel={() => {
            setShowImageEditor(false);
            setEditorContext(null);
          }}
        />
      )}
    </div>
  );
};

export default YPivotQAInspectionMeasurementManual;
