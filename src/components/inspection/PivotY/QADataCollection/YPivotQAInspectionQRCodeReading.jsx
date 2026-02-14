import React, { useState, useEffect, useRef, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  QrCode,
  Search,
  Upload,
  Camera,
  Loader2,
  AlertCircle,
  FileText,
  X,
  StopCircle,
  RefreshCcw
} from "lucide-react";

const YPivotQAInspectionQRCodeReading = ({ onReportFound, isLoading }) => {
  const [reportIdInput, setReportIdInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);

  // HTML5 QR Code instance reference
  const html5QrCodeRef = useRef(null);
  const fileInputRef = useRef(null);
  const scannerRegionId = "html5qr-code-full-region";

  // --- 1. Manual Submit Logic ---
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!reportIdInput.trim()) {
      setError("Please enter a valid Report ID");
      return;
    }
    setError("");
    onReportFound(reportIdInput.trim());
  };

  // --- 2. Camera Logic ---

  // Helper to select back camera
  const selectDefaultCamera = useCallback((devices) => {
    if (devices && devices.length > 0) {
      // Priority 1: Label contains 'back' or 'environment'
      const backCamera = devices.find(
        (device) =>
          device.label.toLowerCase().includes("back") ||
          device.label.toLowerCase().includes("environment")
      );
      if (backCamera) {
        setSelectedCameraId(backCamera.id);
        return;
      }
      // Priority 2: Last camera (often back on mobile)
      if (devices.length > 1) {
        setSelectedCameraId(devices[devices.length - 1].id);
        return;
      }
      // Priority 3: First available
      setSelectedCameraId(devices[0].id);
    }
  }, []);

  // Initialize Cameras
  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices);
          selectDefaultCamera(devices);
        }
      })
      .catch((err) => {
        console.error("Error getting cameras", err);
        // Don't show error immediately, only if they try to click Camera button
      });

    // Cleanup on unmount
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch((err) => console.error(err));
      }
    };
  }, [selectDefaultCamera]);

  const startScanning = async () => {
    setError("");
    if (!selectedCameraId) {
      setError("No camera found or permission denied.");
      return;
    }

    setIsScanning(true);

    try {
      // Create instance if not exists
      if (!html5QrCodeRef.current) {
        html5QrCodeRef.current = new Html5Qrcode(scannerRegionId);
      }

      await html5QrCodeRef.current.start(
        selectedCameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          // Success Callback
          stopScanning();
          // Assuming the QR code contains the ID directly, or a JSON
          // Clean the text if necessary
          onReportFound(decodedText.trim());
        },
        (errorMessage) => {
          // Ignore frame errors to prevent console spam
        }
      );
    } catch (err) {
      setError("Failed to start camera. Please check permissions.");
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        // clear() removes the canvas/video element from DOM
        await html5QrCodeRef.current.clear();
      } catch (err) {
        console.error("Failed to stop", err);
      } finally {
        setIsScanning(false);
        html5QrCodeRef.current = null;
      }
    } else {
      setIsScanning(false);
    }
  };

  // --- 3. File Upload Logic ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError("");

    try {
      // We need a temporary instance to scan the file
      const html5QrCode = new Html5Qrcode(scannerRegionId);
      const result = await html5QrCode.scanFile(file, false);

      // Cleanup
      html5QrCode.clear();

      if (result) {
        onReportFound(result.trim());
      }
    } catch (err) {
      console.error("File scan error", err);
      setError(
        "Could not read QR code from this image. Please ensure the image is clear."
      );
    } finally {
      // Reset input so same file can be selected again if needed
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-8 animate-fadeIn">
      {/* Header - Compact on Mobile */}
      <div className="text-center mb-4 sm:mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 mb-2 sm:mb-4 shadow-sm border border-blue-100 dark:border-blue-800">
          <QrCode className="w-6 h-6 sm:w-8 sm:h-8" />
        </div>
        <h2 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-gray-200">
          Previous Inspection Report
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 max-w-4xl mx-auto">
        {/* Left Side: Manual Input */}
        <div className="flex flex-col space-y-2 sm:space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
              <FileText className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-gray-700 dark:text-gray-300">
              Manual Entry
            </h3>
          </div>

          <form onSubmit={handleManualSubmit} className="relative">
            <input
              type="text"
              value={reportIdInput}
              onChange={(e) => setReportIdInput(e.target.value)}
              placeholder="Enter Report ID"
              // Input text-base prevents iOS zoom
              className="w-full pl-4 pr-12 py-2.5 sm:py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl font-medium text-base sm:text-sm text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !reportIdInput}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </button>
          </form>
          <p className="text-xs text-gray-500 dark:text-gray-400 pl-1 hidden sm:block">
            Type the unique ID found on the top of the report.
          </p>
        </div>

        {/* Right Side: Scan Options */}
        <div className="flex flex-col space-y-2 sm:space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
              <Camera className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm sm:text-base text-gray-700 dark:text-gray-300">
              Scan QR Code
            </h3>
          </div>

          {!isScanning ? (
            <div className="grid grid-cols-2 gap-3">
              {/* Camera Button */}
              <button
                onClick={startScanning}
                className="flex flex-col items-center justify-center gap-2 p-3 sm:p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/10 transition-all group"
              >
                <div className="p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                  <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                  Use Camera
                </span>
              </button>

              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 p-3 sm:p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all group"
              >
                <div className="p-2 sm:p-3 bg-white dark:bg-gray-800 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-xs font-bold text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                  Upload Image
                </span>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </button>
            </div>
          ) : (
            // Active Scanning UI
            <div className="flex flex-col gap-2">
              <button
                onClick={stopScanning}
                className="w-full py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center justify-center gap-2 font-bold transition-colors"
              >
                <StopCircle className="w-5 h-5" /> Stop Scanning
              </button>

              {/* Camera Selector (if multiple) */}
              {cameras.length > 1 && (
                <div className="flex justify-center">
                  <div className="relative inline-flex items-center gap-2 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">
                    <RefreshCcw className="w-3 h-3 text-gray-500" />
                    <select
                      value={selectedCameraId || ""}
                      onChange={(e) => {
                        stopScanning().then(() => {
                          setSelectedCameraId(e.target.value);
                          // Automatically restart with new camera
                          setTimeout(() => startScanning(), 100);
                        });
                      }}
                      className="text-xs bg-transparent border-none focus:ring-0 text-gray-700 dark:text-gray-300 cursor-pointer"
                    >
                      {cameras.map((camera) => (
                        <option key={camera.id} value={camera.id}>
                          {camera.label ||
                            `Camera ${cameras.indexOf(camera) + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 
              This is the mounting point for Html5Qrcode. 
              Always present it, but hide it visually if not scanning or file uploading 
              (though Html5Qrcode clears it automatically).
          */}
          <div
            id={scannerRegionId}
            className={`rounded-xl overflow-hidden border-2 border-gray-300 dark:border-gray-600 ${
              isScanning ? "block" : "hidden"
            }`}
            style={{ minHeight: isScanning ? "250px" : "0" }}
          ></div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 sm:mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-center gap-2 text-red-600 dark:text-red-400 animate-fadeIn">
          <AlertCircle className="w-5 h-5" />
          <span className="font-medium text-sm">{error}</span>
          <button
            onClick={() => setError("")}
            className="ml-2 hover:text-red-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default YPivotQAInspectionQRCodeReading;
