import React, { useState, useCallback } from "react";
import {
  Upload,
  FileText,
  Loader,
  AlertTriangle,
  Save,
  CheckCircle,
  XCircle,
  FileUp,
  Trash2,
} from "lucide-react";
import { read, utils } from "xlsx";
import { cleanWashingSpecData } from "../components/inspection/BWSpecs/WashingSpecDataCleaning";
import WashingSpecsDataPreview from "../components/inspection/BWSpecs/WashingSpecsDataPreview";
import UploadedSpecsView from "../components/inspection/BWSpecs/UploadedSpecsView";
import { API_BASE_URL } from "../../config";

const UploadWashingSpecs = () => {
  // --- State Management ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [moNo, setMoNo] = useState("");
  const [styleNo, setStyleNo] = useState("");
  const [washingSpecsData, setWashingSpecsData] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState({ message: "", type: "" });
  const [isDragging, setIsDragging] = useState(false);

  // --- File Processing Logic ---
  const resetState = () => {
    setWashingSpecsData([]);
    setError("");
    setSaveStatus({ message: "", type: "" });
    setStyleNo("");
  };

  const processFile = (file) => {
    if (
      file &&
      (file.type === "application/vnd.ms-excel" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
        file.name.endsWith(".xls") ||
        file.name.endsWith(".xlsx"))
    ) {
      setSelectedFile(file);
      resetState();
      // Extract MO No from filename (e.g., "GPAR11234-K1.xlsx" -> "GPAR11234-K1")
      const extractedMo = file.name.replace(/\.[^/.]+$/, "");
      setMoNo(extractedMo.trim());
    } else {
      setError("Invalid file type. Please upload an Excel file (.xlsx, .xls).");
      setSelectedFile(null);
    }
  };

  // --- Event Handlers ---
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    processFile(file);
  };

  const handleDragEvents = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e) => {
    handleDragEvents(e);
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    handleDragEvents(e);
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    handleDragEvents(e);
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    processFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setMoNo("");
    resetState();
  };

  const handlePreview = useCallback(async () => {
    if (!selectedFile) {
      setError("Please select an Excel file first.");
      return;
    }

    setIsLoading(true);
    resetState();

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = event.target.result;
          const workbook = read(data, { type: "array" });
          const processedData = [];
          let extractedStyleNo = "";

          workbook.SheetNames.forEach((sheetName) => {
            // Process sheets that match P1, P2, PA, PAA, etc. pattern
            // Updated regex: P followed by number(s) or letter(s)
            if (sheetName.match(/^P([a-zA-Z]+|\d+)$/i)) {
              const worksheet = workbook.Sheets[sheetName];
              const json_data = utils.sheet_to_json(worksheet, {
                header: 1,
                defval: null,
                raw: false,
              });

              const cleanedData = cleanWashingSpecData(json_data, sheetName);
              processedData.push(cleanedData);

              // Extract styleNo from the first valid sheet
              if (!extractedStyleNo && cleanedData.styleNo) {
                extractedStyleNo = cleanedData.styleNo;
              }
            }
          });

          if (processedData.length === 0) {
            throw new Error(
              "No valid sheets (e.g., P1, P2, PA) found in the Excel file.",
            );
          }

          setWashingSpecsData(processedData);
          setStyleNo(extractedStyleNo);
        } catch (e) {
          console.error("Parsing Error:", e);
          setError(
            e.message ||
              "Failed to parse the Excel file. Please check the format.",
          );
        } finally {
          setIsLoading(false);
        }
      };
      reader.onerror = (err) => {
        console.error("FileReader Error:", err);
        setError("Failed to read the file.");
        setIsLoading(false);
      };
      reader.readAsArrayBuffer(selectedFile);
    } catch (e) {
      console.error("General Error:", e);
      setError(e.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  }, [selectedFile]);

  const handleSave = async () => {
    if (washingSpecsData.length === 0) {
      setError("No data to save. Please preview a file first.");
      return;
    }

    setIsSaving(true);
    setSaveStatus({ message: "", type: "" });
    setError("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/washing-specs/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ moNo, styleNo, washingSpecsData }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Failed to save data.");
      }

      setSaveStatus({ message: result.message, type: "success" });

      // Clear data after successful save
      setWashingSpecsData([]);
      setSelectedFile(null);
      setMoNo("");
      setStyleNo("");
      window.location.reload(); // Simple reload to update table
    } catch (err) {
      console.error("Save Error:", err);
      setSaveStatus({ message: err.message, type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="animate-fadeIn mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-300">
      {/* --- Upload Section --- */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transition-all duration-300">
        <div className="flex flex-col gap-6">
          {/* Drag & Drop Area */}
          <label
            htmlFor="file-upload"
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragEvents}
            onDrop={handleDrop}
            className={`flex flex-col items-center justify-center w-full px-4 py-12 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-300 ${
              isDragging
                ? "border-indigo-600 bg-indigo-50 dark:border-indigo-400 dark:bg-indigo-900/30 scale-[1.02]"
                : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50"
            }`}
          >
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/50 rounded-full mb-4 shadow-sm">
              <Upload className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            </div>
            <span className="text-lg font-semibold text-gray-700 dark:text-gray-200 text-center">
              Before and After Wash Measurement Specs
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Drag & drop your Excel file here or click to browse
            </span>
            <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Supports sheets: P1, P2, PA, PAA, etc.
            </span>
            <input
              id="file-upload"
              name="file-upload"
              type="file"
              className="sr-only"
              accept=".xlsx, .xls"
              onChange={handleFileChange}
            />
          </label>

          {/* Selected File Display */}
          {selectedFile && (
            <div className="flex items-center justify-between p-4 bg-gray-100 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg animate-fadeIn">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
                  <FileUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                    {selectedFile.name}
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
              <button
                onClick={handleRemoveFile}
                className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 hover:bg-gray-200 dark:hover:bg-gray-600/50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* MO No & Style No Display */}
          {(moNo || styleNo) && (
            <div className="flex flex-wrap gap-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              {moNo && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    MO No:
                  </span>
                  <span className="text-sm font-bold text-blue-800 dark:text-blue-200">
                    {moNo}
                  </span>
                </div>
              )}
              {styleNo && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    Style No:
                  </span>
                  <span className="text-sm font-bold text-blue-800 dark:text-blue-200">
                    {styleNo}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handlePreview}
              disabled={!selectedFile || isLoading || isSaving}
              className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md disabled:bg-indigo-300 dark:disabled:bg-indigo-900/50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin mr-2" /> Processing...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5 mr-2" /> Preview
                </>
              )}
            </button>

            <button
              onClick={handleSave}
              disabled={washingSpecsData.length === 0 || isLoading || isSaving}
              className="w-full sm:w-auto flex items-center justify-center px-8 py-3.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md disabled:bg-green-300 dark:disabled:bg-green-900/50 disabled:cursor-not-allowed transition-all hover:scale-105 active:scale-95"
            >
              {isSaving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin mr-2" /> Saving...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" /> Save
                </>
              )}
            </button>
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mt-6 flex items-center p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg animate-fadeIn">
            <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {saveStatus.message && (
          <div
            className={`mt-6 flex items-center p-4 rounded-lg border animate-fadeIn ${
              saveStatus.type === "success"
                ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"
                : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"
            }`}
          >
            {saveStatus.type === "success" ? (
              <CheckCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            )}
            <span className="font-medium">{saveStatus.message}</span>
          </div>
        )}
      </div>

      {/* --- Preview Section --- */}
      <div className="mt-8 space-y-6">
        {washingSpecsData.length > 0 && (
          <WashingSpecsDataPreview
            moNo={moNo}
            styleNo={styleNo}
            allSpecData={washingSpecsData}
          />
        )}
      </div>

      {/* --- Uploaded Specs Table --- */}
      <div className="max-w-7xl mx-auto">
        <UploadedSpecsView />
      </div>
    </div>
  );
};

export default UploadWashingSpecs;
