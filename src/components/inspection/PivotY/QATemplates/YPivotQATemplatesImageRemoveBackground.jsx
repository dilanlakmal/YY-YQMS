// // YPivotQATemplatesImageRemoveBackground.jsx - Normal Version
// import React, { useState, useCallback } from "react";
// import { removeBackground } from "@imgly/background-removal";

// /**
//  * Custom hook for background removal functionality
//  * Uses @imgly/background-removal (free, runs entirely in browser using ML)
//  */
// export const useBackgroundRemoval = () => {
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [progressMessage, setProgressMessage] = useState("");
//   const [error, setError] = useState(null);

//   const removeImageBackground = useCallback(async (imageSrc, options = {}) => {
//     const {
//       backgroundColor = "#FFFFFF",
//       quality = 0.95,
//       outputFormat = "image/png"
//     } = options;

//     setIsProcessing(true);
//     setProgress(0);
//     setProgressMessage("Initializing...");
//     setError(null);

//     try {
//       // Convert data URL to blob if needed
//       let imageBlob;
//       if (imageSrc.startsWith("data:")) {
//         const response = await fetch(imageSrc);
//         imageBlob = await response.blob();
//       } else {
//         const response = await fetch(imageSrc);
//         imageBlob = await response.blob();
//       }

//       setProgressMessage("Loading AI model...");

//       // Remove background using @imgly/background-removal
//       const resultBlob = await removeBackground(imageBlob, {
//         progress: (key, current, total) => {
//           const progressPercent = Math.round((current / total) * 100);
//           setProgress(progressPercent);

//           // Update message based on progress stage
//           if (key === "compute:inference") {
//             setProgressMessage("Analyzing image...");
//           } else if (key === "compute:mask") {
//             setProgressMessage("Detecting edges...");
//           } else if (key === "compute:output") {
//             setProgressMessage("Removing background...");
//           }
//         },
//         model: "medium", // 'small' (faster), 'medium' (balanced), 'large' (best quality)
//         output: {
//           format: "image/png",
//           quality: 1.0
//         }
//       });

//       setProgressMessage("Applying white background...");
//       setProgress(90);

//       // Convert result blob to image
//       const img = new Image();
//       const resultUrl = URL.createObjectURL(resultBlob);

//       await new Promise((resolve, reject) => {
//         img.onload = resolve;
//         img.onerror = reject;
//         img.src = resultUrl;
//       });

//       // Create canvas with white background
//       const canvas = document.createElement("canvas");
//       canvas.width = img.width;
//       canvas.height = img.height;
//       const ctx = canvas.getContext("2d");

//       // Enable high quality rendering
//       ctx.imageSmoothingEnabled = true;
//       ctx.imageSmoothingQuality = "high";

//       // Fill with background color (white by default)
//       ctx.fillStyle = backgroundColor;
//       ctx.fillRect(0, 0, canvas.width, canvas.height);

//       // Draw the image with removed background on top
//       ctx.drawImage(img, 0, 0);

//       // Clean up blob URL
//       URL.revokeObjectURL(resultUrl);

//       // Return as data URL
//       const finalImageSrc = canvas.toDataURL(outputFormat, quality);

//       setProgress(100);
//       setProgressMessage("Complete!");
//       setIsProcessing(false);

//       return {
//         success: true,
//         imageSrc: finalImageSrc,
//         originalWidth: img.width,
//         originalHeight: img.height
//       };
//     } catch (err) {
//       console.error("Background removal error:", err);
//       const errorMessage =
//         err.message || "Failed to remove background. Please try again.";
//       setError(errorMessage);
//       setIsProcessing(false);
//       setProgressMessage("");

//       return {
//         success: false,
//         error: errorMessage
//       };
//     }
//   }, []);

//   const resetState = useCallback(() => {
//     setIsProcessing(false);
//     setProgress(0);
//     setProgressMessage("");
//     setError(null);
//   }, []);

//   return {
//     removeImageBackground,
//     isProcessing,
//     progress,
//     progressMessage,
//     error,
//     resetState
//   };
// };

// /**
//  * Modal component for showing background removal progress
//  */
// export const BackgroundRemovalModal = ({
//   isOpen,
//   progress,
//   progressMessage,
//   onCancel,
//   error,
//   onRetry
// }) => {
//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm">
//       <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-700">
//         <div className="text-center space-y-4">
//           {error ? (
//             // Error State
//             <>
//               <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
//                 <svg
//                   className="w-10 h-10 text-red-500"
//                   fill="none"
//                   viewBox="0 0 24 24"
//                   stroke="currentColor"
//                 >
//                   <path
//                     strokeLinecap="round"
//                     strokeLinejoin="round"
//                     strokeWidth={2}
//                     d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
//                   />
//                 </svg>
//               </div>

//               <h3 className="text-xl font-bold text-white">
//                 Processing Failed
//               </h3>
//               <p className="text-gray-400 text-sm leading-relaxed">{error}</p>

//               <div className="flex gap-3 justify-center pt-2">
//                 <button
//                   onClick={onCancel}
//                   className="px-5 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
//                 >
//                   Close
//                 </button>
//                 {onRetry && (
//                   <button
//                     onClick={onRetry}
//                     className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium"
//                   >
//                     Try Again
//                   </button>
//                 )}
//               </div>
//             </>
//           ) : (
//             // Processing State
//             <>
//               <div className="w-24 h-24 mx-auto relative">
//                 {/* Outer ring */}
//                 <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>

//                 {/* Progress ring */}
//                 <svg className="absolute inset-0 w-full h-full -rotate-90">
//                   <circle
//                     cx="48"
//                     cy="48"
//                     r="44"
//                     stroke="url(#progressGradient)"
//                     strokeWidth="4"
//                     fill="none"
//                     strokeLinecap="round"
//                     strokeDasharray={`${2 * Math.PI * 44}`}
//                     strokeDashoffset={`${
//                       2 * Math.PI * 44 * (1 - progress / 100)
//                     }`}
//                     className="transition-all duration-300"
//                   />
//                   <defs>
//                     <linearGradient
//                       id="progressGradient"
//                       x1="0%"
//                       y1="0%"
//                       x2="100%"
//                       y2="0%"
//                     >
//                       <stop offset="0%" stopColor="#6366f1" />
//                       <stop offset="100%" stopColor="#a855f7" />
//                     </linearGradient>
//                   </defs>
//                 </svg>

//                 {/* Center content */}
//                 <div className="absolute inset-0 flex items-center justify-center">
//                   <span className="text-white font-bold text-lg">
//                     {progress}%
//                   </span>
//                 </div>
//               </div>

//               <h3 className="text-xl font-bold text-white">
//                 Removing Background
//               </h3>

//               <p className="text-indigo-400 text-sm font-medium">
//                 {progressMessage || "Processing..."}
//               </p>

//               <p className="text-gray-500 text-xs">
//                 AI is detecting and removing the background
//               </p>

//               {/* Progress bar */}
//               <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
//                 <div
//                   className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out relative"
//                   style={{ width: `${progress}%` }}
//                 >
//                   <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
//                 </div>
//               </div>

//               <button
//                 onClick={onCancel}
//                 className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm mt-2"
//               >
//                 Cancel
//               </button>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// /**
//  * Background color picker for replacement background
//  */
// export const BackgroundColorPicker = ({
//   isOpen,
//   onSelect,
//   onCancel,
//   currentColor = "#FFFFFF"
// }) => {
//   const [selectedColor, setSelectedColor] = useState(currentColor);

//   const presetColors = [
//     { color: "#FFFFFF", name: "White" },
//     { color: "#F3F4F6", name: "Light Gray" },
//     { color: "#E5E7EB", name: "Gray" },
//     { color: "#000000", name: "Black" },
//     { color: "#FEF3C7", name: "Cream" },
//     { color: "#DBEAFE", name: "Light Blue" },
//     { color: "#D1FAE5", name: "Light Green" },
//     { color: "#FCE7F3", name: "Light Pink" }
//   ];

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black/70 z-[10000] flex items-center justify-center p-4">
//       <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-700">
//         <h3 className="text-lg font-bold text-white mb-4 text-center">
//           Choose Background Color
//         </h3>

//         <div className="grid grid-cols-4 gap-3 mb-4">
//           {presetColors.map((preset) => (
//             <button
//               key={preset.color}
//               onClick={() => setSelectedColor(preset.color)}
//               className={`aspect-square rounded-xl border-2 transition-all ${
//                 selectedColor === preset.color
//                   ? "border-indigo-500 scale-105 ring-2 ring-indigo-500/50"
//                   : "border-gray-600 hover:border-gray-500"
//               }`}
//               style={{ backgroundColor: preset.color }}
//               title={preset.name}
//             />
//           ))}
//         </div>

//         {/* Custom color input */}
//         <div className="flex items-center gap-3 mb-6">
//           <label className="text-gray-400 text-sm">Custom:</label>
//           <input
//             type="color"
//             value={selectedColor}
//             onChange={(e) => setSelectedColor(e.target.value)}
//             className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-600"
//           />
//           <input
//             type="text"
//             value={selectedColor}
//             onChange={(e) => setSelectedColor(e.target.value)}
//             className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 text-sm font-mono"
//             placeholder="#FFFFFF"
//           />
//         </div>

//         {/* Preview */}
//         <div className="mb-6">
//           <p className="text-gray-400 text-xs mb-2">Preview:</p>
//           <div
//             className="h-16 rounded-lg border border-gray-600"
//             style={{ backgroundColor: selectedColor }}
//           />
//         </div>

//         <div className="flex gap-3">
//           <button
//             onClick={onCancel}
//             className="flex-1 px-4 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={() => onSelect(selectedColor)}
//             className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium"
//           >
//             Remove Background
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default useBackgroundRemoval;

// YPivotQATemplatesImageRemoveBackground.jsx
// BROWSER CACHING VERSION - Models cached automatically

import React, { useState, useCallback, useEffect, useRef } from "react";
import { removeBackground } from "@imgly/background-removal";

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  // Model options: 'small' (fastest), 'medium' (balanced), 'large' (best quality)
  model: "medium",

  // Output settings
  output: {
    format: "image/png",
    quality: 1.0
  },

  // Enable debug logging in development
  debug: process.env.NODE_ENV === "development"
};

// ============================================
// CACHE MANAGEMENT
// ============================================

// Cache name used by the library
const CACHE_NAME = "background-removal";

/**
 * Check if models are cached in browser
 * Returns approximate cache status
 */
export const checkModelCache = async () => {
  try {
    // Check if Cache API is available
    if (!("caches" in window)) {
      return { cached: false, reason: "Cache API not available" };
    }

    // Try to open the cache
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();

    // Check for model files (ONNX files are the main models)
    const hasOnnxFiles = keys.some(
      (request) =>
        request.url.includes(".onnx") || request.url.includes("model")
    );

    const hasWasmFiles = keys.some((request) => request.url.includes(".wasm"));

    if (hasOnnxFiles && hasWasmFiles) {
      return {
        cached: true,
        fileCount: keys.length,
        message: "Models cached and ready"
      };
    } else if (keys.length > 0) {
      return {
        cached: "partial",
        fileCount: keys.length,
        message: "Partially cached"
      };
    }

    return { cached: false, reason: "No cached models found" };
  } catch (error) {
    console.warn("Cache check failed:", error);
    return { cached: false, reason: error.message };
  }
};

/**
 * Clear cached models (useful for troubleshooting)
 */
export const clearModelCache = async () => {
  try {
    const deleted = await caches.delete(CACHE_NAME);
    console.log(deleted ? "✅ Model cache cleared" : "ℹ️ No cache to clear");
    return deleted;
  } catch (error) {
    console.error("Failed to clear cache:", error);
    return false;
  }
};

/**
 * Get estimated cache size
 */
export const getCacheSize = async () => {
  try {
    if (!("storage" in navigator && "estimate" in navigator.storage)) {
      return null;
    }

    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage,
      available: estimate.quota,
      usedMB: (estimate.usage / (1024 * 1024)).toFixed(2),
      availableMB: (estimate.quota / (1024 * 1024)).toFixed(2)
    };
  } catch (error) {
    return null;
  }
};

// ============================================
// SINGLETON STATE FOR MODEL STATUS
// ============================================

const ModelState = {
  isReady: false,
  isLoading: false,
  isCached: null, // null = unknown, true = cached, false = not cached
  lastCheck: null,
  error: null,
  listeners: new Set()
};

const notifyListeners = () => {
  const state = {
    isReady: ModelState.isReady,
    isLoading: ModelState.isLoading,
    isCached: ModelState.isCached,
    error: ModelState.error
  };
  ModelState.listeners.forEach((cb) => cb(state));
};

/**
 * Subscribe to model state changes
 */
export const subscribeToModelState = (callback) => {
  ModelState.listeners.add(callback);
  callback({
    isReady: ModelState.isReady,
    isLoading: ModelState.isLoading,
    isCached: ModelState.isCached,
    error: ModelState.error
  });
  return () => ModelState.listeners.delete(callback);
};

/**
 * Check cache status on init
 */
export const initializeCacheStatus = async () => {
  if (ModelState.lastCheck && Date.now() - ModelState.lastCheck < 5000) {
    return ModelState.isCached;
  }

  const result = await checkModelCache();
  ModelState.isCached = result.cached === true;
  ModelState.lastCheck = Date.now();
  notifyListeners();

  if (CONFIG.debug) {
    console.log("📦 Cache status:", result);
  }

  return result;
};

// ============================================
// MAIN HOOK
// ============================================

/**
 * Custom hook for background removal with browser caching
 *
 * @param {Object} options
 * @param {string} options.model - Model size: 'small' | 'medium' | 'large'
 * @param {boolean} options.checkCacheOnMount - Check cache status on mount
 */
export const useBackgroundRemoval = (options = {}) => {
  const { model = CONFIG.model, checkCacheOnMount = true } = options;

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState(null);
  const [cacheStatus, setCacheStatus] = useState({
    isReady: ModelState.isReady,
    isLoading: ModelState.isLoading,
    isCached: ModelState.isCached,
    error: ModelState.error
  });

  const abortControllerRef = useRef(null);
  const isProcessingRef = useRef(false);
  const startTimeRef = useRef(null);

  // Subscribe to global model state
  useEffect(() => {
    const unsubscribe = subscribeToModelState(setCacheStatus);
    return unsubscribe;
  }, []);

  // Check cache status on mount
  useEffect(() => {
    if (checkCacheOnMount) {
      initializeCacheStatus();
    }
  }, [checkCacheOnMount]);

  /**
   * Remove background from image
   */
  const removeImageBackground = useCallback(
    async (imageSrc, options = {}) => {
      const {
        backgroundColor = "#FFFFFF",
        quality = 0.95,
        outputFormat = "image/png"
      } = options;

      // Prevent double processing
      if (isProcessingRef.current) {
        console.warn("Background removal already in progress");
        return { success: false, error: "Already processing" };
      }

      isProcessingRef.current = true;
      startTimeRef.current = Date.now();

      setIsProcessing(true);
      setProgress(0);
      setError(null);

      // Check cache status for appropriate messaging
      const cacheResult = await checkModelCache();
      const isCached = cacheResult.cached === true;

      ModelState.isCached = isCached;
      ModelState.isLoading = true;
      notifyListeners();

      // Set initial message based on cache status
      if (isCached) {
        setProgressMessage("Loading cached AI model...");
      } else {
        setProgressMessage("Downloading AI model (one-time, ~30MB)...");
      }

      try {
        // Convert image to blob
        let imageBlob;
        if (imageSrc.startsWith("data:")) {
          const response = await fetch(imageSrc);
          imageBlob = await response.blob();
        } else {
          const response = await fetch(imageSrc);
          imageBlob = await response.blob();
        }

        setProgress(5);

        // Track download vs processing phases
        let downloadComplete = false;
        let lastProgressKey = "";

        // Remove background with progress tracking
        const resultBlob = await removeBackground(imageBlob, {
          model: model,
          output: CONFIG.output,
          progress: (key, current, total) => {
            lastProgressKey = key;
            const rawPercent = total > 0 ? current / total : 0;

            // Map progress to 5-90 range
            const mappedPercent = Math.round(5 + rawPercent * 85);
            setProgress(mappedPercent);

            // Phase-specific messages
            if (key.includes("fetch") || key.includes("download")) {
              // Download phase
              if (!downloadComplete) {
                if (isCached) {
                  setProgressMessage("Loading from cache...");
                } else {
                  const downloadPercent = Math.round(rawPercent * 100);
                  setProgressMessage(
                    `Downloading model... ${downloadPercent}%`
                  );
                }
              }
            } else if (key.includes("init") || key.includes("load")) {
              downloadComplete = true;
              setProgressMessage("Initializing AI engine...");
            } else if (key.includes("inference") || key.includes("compute")) {
              downloadComplete = true;
              setProgressMessage("AI analyzing image...");
            } else if (key.includes("mask")) {
              setProgressMessage("Detecting subject edges...");
            } else if (key.includes("output") || key.includes("result")) {
              setProgressMessage("Generating transparent image...");
            } else {
              // Generic progress
              if (rawPercent < 0.3) {
                setProgressMessage(
                  isCached ? "Loading model..." : "Downloading..."
                );
              } else if (rawPercent < 0.7) {
                setProgressMessage("Processing image...");
              } else {
                setProgressMessage("Finalizing...");
              }
            }

            if (CONFIG.debug) {
              console.log(`[${key}] ${Math.round(rawPercent * 100)}%`);
            }
          }
        });

        // Model is now cached for future use
        ModelState.isReady = true;
        ModelState.isCached = true;
        ModelState.isLoading = false;
        notifyListeners();

        setProgress(92);
        setProgressMessage("Applying background color...");

        // Create image from result blob
        const img = new Image();
        const resultUrl = URL.createObjectURL(resultBlob);

        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = resultUrl;
        });

        setProgress(95);

        // Create canvas with new background color
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");

        // High quality rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        // Fill with background color
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw transparent image on top
        ctx.drawImage(img, 0, 0);

        // Cleanup blob URL
        URL.revokeObjectURL(resultUrl);

        setProgress(98);
        setProgressMessage("Saving result...");

        // Generate final image
        const finalImageSrc = canvas.toDataURL(outputFormat, quality);

        const processingTime = (
          (Date.now() - startTimeRef.current) /
          1000
        ).toFixed(1);

        if (CONFIG.debug) {
          console.log(
            `✅ Background removed in ${processingTime}s (cached: ${isCached})`
          );
        }

        setProgress(100);
        setProgressMessage("Complete!");

        // Brief delay to show completion
        await new Promise((resolve) => setTimeout(resolve, 300));

        isProcessingRef.current = false;
        setIsProcessing(false);

        return {
          success: true,
          imageSrc: finalImageSrc,
          originalWidth: img.width,
          originalHeight: img.height,
          processingTime: parseFloat(processingTime),
          wasCached: isCached
        };
      } catch (err) {
        isProcessingRef.current = false;
        ModelState.isLoading = false;
        notifyListeners();

        // Handle abort
        if (err.name === "AbortError") {
          setIsProcessing(false);
          setProgressMessage("");
          return { success: false, cancelled: true };
        }

        console.error("Background removal error:", err);

        // User-friendly error messages
        let errorMessage = "Failed to remove background.";

        if (
          err.message?.includes("fetch") ||
          err.message?.includes("network")
        ) {
          errorMessage =
            "Network error. Please check your internet connection and try again.";
        } else if (
          err.message?.includes("memory") ||
          err.message?.includes("OOM")
        ) {
          errorMessage =
            "Not enough memory. Try closing other tabs or use a smaller image.";
        } else if (
          err.message?.includes("WebGL") ||
          err.message?.includes("GPU")
        ) {
          errorMessage =
            "Graphics acceleration issue. The process may be slower on this device.";
        } else if (err.message?.includes("timeout")) {
          errorMessage = "Processing timed out. Try a smaller image.";
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        setIsProcessing(false);
        setProgressMessage("");

        return {
          success: false,
          error: errorMessage
        };
      }
    },
    [model]
  );

  /**
   * Cancel ongoing processing
   */
  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    isProcessingRef.current = false;
    ModelState.isLoading = false;
    notifyListeners();

    setIsProcessing(false);
    setProgress(0);
    setProgressMessage("");
  }, []);

  /**
   * Reset all state
   */
  const resetState = useCallback(() => {
    isProcessingRef.current = false;
    setIsProcessing(false);
    setProgress(0);
    setProgressMessage("");
    setError(null);
  }, []);

  /**
   * Manually check cache status
   */
  const refreshCacheStatus = useCallback(async () => {
    const result = await initializeCacheStatus();
    return result;
  }, []);

  /**
   * Clear model cache
   */
  const clearCache = useCallback(async () => {
    const result = await clearModelCache();
    if (result) {
      ModelState.isReady = false;
      ModelState.isCached = false;
      notifyListeners();
    }
    return result;
  }, []);

  return {
    // Main action
    removeImageBackground,

    // Control actions
    cancelProcessing,
    resetState,
    refreshCacheStatus,
    clearCache,

    // Processing state
    isProcessing,
    progress,
    progressMessage,
    error,

    // Cache state
    isCached: cacheStatus.isCached,
    isModelReady: cacheStatus.isReady,
    isModelLoading: cacheStatus.isLoading
  };
};

// ============================================
// UI COMPONENTS
// ============================================

/**
 * Progress Modal Component
 */
export const BackgroundRemovalModal = ({
  isOpen,
  progress,
  progressMessage,
  error,
  onCancel,
  onRetry,
  isCached = null
}) => {
  if (!isOpen) return null;

  const isDownloading = progressMessage?.toLowerCase().includes("download");
  const isFirstTime = isCached === false && isDownloading;

  return (
    <div className="fixed inset-0 bg-black/80 z-[10000] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-700">
        <div className="text-center space-y-4">
          {error ? (
            // Error State
            <>
              <div className="w-20 h-20 mx-auto bg-red-500/20 rounded-full flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>

              <h3 className="text-xl font-bold text-white">
                Processing Failed
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">{error}</p>

              <div className="flex gap-3 justify-center pt-2">
                <button
                  onClick={onCancel}
                  className="px-5 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
                >
                  Close
                </button>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-medium"
                  >
                    Try Again
                  </button>
                )}
              </div>
            </>
          ) : (
            // Processing State
            <>
              {/* Animated Progress Circle */}
              <div className="w-28 h-28 mx-auto relative">
                {/* Background ring */}
                <div className="absolute inset-0 border-4 border-gray-700 rounded-full"></div>

                {/* Spinning gradient ring for loading effect */}
                {progress < 100 && (
                  <div
                    className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
                    style={{
                      borderTopColor: "rgba(99, 102, 241, 0.3)",
                      animationDuration: "2s"
                    }}
                  ></div>
                )}

                {/* Progress ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="52"
                    stroke="url(#bgRemovalGradient)"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    strokeDashoffset={`${
                      2 * Math.PI * 52 * (1 - progress / 100)
                    }`}
                    className="transition-all duration-500 ease-out"
                  />
                  <defs>
                    <linearGradient
                      id="bgRemovalGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="50%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>

                {/* Center percentage */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-white font-bold text-2xl">
                    {progress}%
                  </span>
                  {isCached && progress < 90 && (
                    <span className="text-green-400 text-[10px] mt-0.5">
                      CACHED
                    </span>
                  )}
                </div>
              </div>

              <h3 className="text-xl font-bold text-white">
                {progress === 100 ? "Complete!" : "Removing Background"}
              </h3>

              <p className="text-indigo-400 text-sm font-medium min-h-[20px]">
                {progressMessage || "Processing..."}
              </p>

              {/* First-time download notice */}
              {isFirstTime && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2">
                  <p className="text-amber-400 text-xs">
                    ⚡ <strong>First-time setup:</strong> Downloading AI model
                    (~30MB).
                    <br />
                    <span className="text-amber-400/70">
                      Future uses will be much faster!
                    </span>
                  </p>
                </div>
              )}

              {/* Cached notice */}
              {isCached && progress < 50 && (
                <div className="bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-2">
                  <p className="text-green-400 text-xs">
                    ✓ Using cached AI model - this will be fast!
                  </p>
                </div>
              )}

              {/* Progress bar */}
              <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-500 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                </div>
              </div>

              {progress < 100 && (
                <button
                  onClick={onCancel}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors text-sm mt-2"
                >
                  Cancel
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-shimmer {
          animation: shimmer 1.5s infinite;
        }
      `}</style>
    </div>
  );
};

/**
 * Background Color Picker Component
 */
export const BackgroundColorPicker = ({
  isOpen,
  onSelect,
  onCancel,
  currentColor = "#FFFFFF",
  isCached = null
}) => {
  const [selectedColor, setSelectedColor] = useState(currentColor);
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedColor(currentColor);
      setShowCustomInput(false);
    }
  }, [isOpen, currentColor]);

  const presetColors = [
    { color: "#FFFFFF", name: "White", popular: true },
    { color: "#F8FAFC", name: "Slate 50" },
    { color: "#F1F5F9", name: "Slate 100" },
    { color: "#E2E8F0", name: "Slate 200" },
    { color: "#000000", name: "Black", popular: true },
    { color: "#1E293B", name: "Slate 800" },
    { color: "#0F172A", name: "Slate 900" },
    { color: "#FEF3C7", name: "Amber 100" },
    { color: "#DBEAFE", name: "Blue 100", popular: true },
    { color: "#BFDBFE", name: "Blue 200" },
    { color: "#D1FAE5", name: "Emerald 100" },
    { color: "#A7F3D0", name: "Emerald 200" },
    { color: "#FCE7F3", name: "Pink 100" },
    { color: "#FBCFE8", name: "Pink 200" },
    { color: "#E9D5FF", name: "Purple 200" },
    { color: "#FEE2E2", name: "Red 100" }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 z-[10000] flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-5 max-w-md w-full shadow-2xl border border-gray-700 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <h3 className="text-lg font-bold text-white mb-1">
            Choose Background Color
          </h3>
          <p className="text-gray-400 text-xs">
            The original background will be replaced with this color
          </p>
        </div>

        {/* Cache Status Notice */}
        {isCached === false && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
            <div className="flex items-start gap-2">
              <span className="text-amber-400 text-lg">⚡</span>
              <div>
                <p className="text-amber-400 text-sm font-medium">
                  First-time Setup
                </p>
                <p className="text-amber-400/70 text-xs mt-0.5">
                  AI model will be downloaded (~30MB). This only happens once!
                </p>
              </div>
            </div>
          </div>
        )}

        {isCached === true && (
          <div className="mb-4 bg-green-500/10 border border-green-500/30 rounded-xl px-4 py-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full"></span>
              <p className="text-green-400 text-sm">
                AI model cached - ready for instant processing!
              </p>
            </div>
          </div>
        )}

        {/* Color Grid */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {presetColors.map((preset) => (
            <button
              key={preset.color}
              onClick={() => setSelectedColor(preset.color)}
              className={`relative aspect-square rounded-xl border-2 transition-all hover:scale-105 group ${
                selectedColor === preset.color
                  ? "border-indigo-500 scale-105 ring-2 ring-indigo-500/50"
                  : "border-gray-600 hover:border-gray-500"
              }`}
              style={{ backgroundColor: preset.color }}
              title={preset.name}
            >
              {selectedColor === preset.color && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className={`w-5 h-5 ${
                      preset.color === "#000000" ||
                      preset.color === "#1E293B" ||
                      preset.color === "#0F172A"
                        ? "text-white"
                        : "text-gray-800"
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
              )}
              {preset.popular && selectedColor !== preset.color && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 rounded-full border border-gray-800"></div>
              )}
            </button>
          ))}
        </div>

        {/* Custom Color Section */}
        <div className="mb-5">
          <button
            onClick={() => setShowCustomInput(!showCustomInput)}
            className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mb-2"
          >
            <svg
              className={`w-4 h-4 transition-transform ${
                showCustomInput ? "rotate-90" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
            Custom Color
          </button>

          {showCustomInput && (
            <div className="flex items-center gap-3 bg-gray-700/50 p-3 rounded-xl">
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="w-12 h-12 rounded-lg cursor-pointer border-2 border-gray-600 bg-transparent"
              />
              <input
                type="text"
                value={selectedColor.toUpperCase()}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                    setSelectedColor(val.toUpperCase());
                  }
                }}
                className="flex-1 bg-gray-700 text-white px-3 py-2 rounded-lg border border-gray-600 text-sm font-mono uppercase focus:border-indigo-500 focus:outline-none"
                placeholder="#FFFFFF"
                maxLength={7}
              />
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="mb-5">
          <p className="text-gray-400 text-xs mb-2 flex items-center gap-1">
            <svg
              className="w-3 h-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            Preview
          </p>
          <div
            className="h-20 rounded-xl border border-gray-600 transition-colors relative overflow-hidden"
            style={{ backgroundColor: selectedColor }}
          >
            {/* Checkered pattern to show transparency reference */}
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `
                linear-gradient(45deg, #808080 25%, transparent 25%),
                linear-gradient(-45deg, #808080 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #808080 75%),
                linear-gradient(-45deg, transparent 75%, #808080 75%)
              `,
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px"
              }}
            ></div>
            <div
              className="absolute inset-0"
              style={{ backgroundColor: selectedColor }}
            ></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-xl hover:bg-gray-600 transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => onSelect(selectedColor)}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all font-medium shadow-lg shadow-indigo-500/25"
          >
            Remove Background
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Small status indicator for toolbar
 */
export const ModelStatusIndicator = ({ className = "", showLabel = true }) => {
  const [state, setState] = useState({
    isReady: ModelState.isReady,
    isCached: ModelState.isCached,
    isLoading: ModelState.isLoading
  });

  useEffect(() => {
    return subscribeToModelState(setState);
  }, []);

  // Check cache on mount
  useEffect(() => {
    initializeCacheStatus();
  }, []);

  if (state.isReady || state.isCached === true) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs ${className}`}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
        </span>
        {showLabel && (
          <span className="text-green-400 font-medium">AI Ready</span>
        )}
      </span>
    );
  }

  if (state.isLoading) {
    return (
      <span className={`inline-flex items-center gap-1.5 text-xs ${className}`}>
        <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
        {showLabel && (
          <span className="text-amber-400 font-medium">Loading...</span>
        )}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${className}`}>
      <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
      {showLabel && <span className="text-gray-400">AI Standby</span>}
    </span>
  );
};

/**
 * Cache Management Component (optional, for settings/debug)
 */
export const CacheManager = ({ className = "" }) => {
  const [cacheInfo, setCacheInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkCache = async () => {
    setIsLoading(true);
    const status = await checkModelCache();
    const size = await getCacheSize();
    setCacheInfo({ status, size });
    setIsLoading(false);
  };

  const handleClearCache = async () => {
    if (
      window.confirm(
        "Clear cached AI models? You'll need to re-download them next time."
      )
    ) {
      await clearModelCache();
      checkCache();
    }
  };

  useEffect(() => {
    checkCache();
  }, []);

  return (
    <div className={`bg-gray-800 rounded-xl p-4 ${className}`}>
      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
          />
        </svg>
        AI Model Cache
      </h4>

      {isLoading ? (
        <div className="text-gray-400 text-sm">Checking cache...</div>
      ) : cacheInfo ? (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Status:</span>
            <span
              className={
                cacheInfo.status.cached === true
                  ? "text-green-400"
                  : "text-amber-400"
              }
            >
              {cacheInfo.status.cached === true ? "Cached ✓" : "Not Cached"}
            </span>
          </div>
          {cacheInfo.status.fileCount && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Files:</span>
              <span className="text-white">{cacheInfo.status.fileCount}</span>
            </div>
          )}
          {cacheInfo.size && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Storage Used:</span>
              <span className="text-white">{cacheInfo.size.usedMB} MB</span>
            </div>
          )}
          <div className="pt-2 flex gap-2">
            <button
              onClick={checkCache}
              className="flex-1 px-3 py-1.5 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 text-sm transition-colors"
            >
              Refresh
            </button>
            <button
              onClick={handleClearCache}
              className="flex-1 px-3 py-1.5 bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 text-sm transition-colors"
            >
              Clear Cache
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default useBackgroundRemoval;
