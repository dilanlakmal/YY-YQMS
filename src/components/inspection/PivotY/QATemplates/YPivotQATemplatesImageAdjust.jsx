// YPivotQATemplatesImageAdjust.jsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  SlidersHorizontal,
  Sun,
  Contrast,
  Lightbulb,
  Droplets,
  Sparkles,
  Aperture,
  X,
  RotateCcw,
  Check
} from "lucide-react";

// ============================================
// ADJUSTMENT CONFIGURATION
// ============================================

const ADJUSTMENTS = [
  {
    id: "exposure",
    label: "Exposure",
    icon: Aperture,
    min: -100,
    max: 100,
    default: 0,
    color: "text-yellow-400",
    bgColor: "bg-yellow-500"
  },
  {
    id: "brightness",
    label: "Brightness",
    icon: Sun,
    min: -100,
    max: 100,
    default: 0,
    color: "text-orange-400",
    bgColor: "bg-orange-500"
  },
  {
    id: "contrast",
    label: "Contrast",
    icon: Contrast,
    min: -100,
    max: 100,
    default: 0,
    color: "text-blue-400",
    bgColor: "bg-blue-500"
  },
  {
    id: "highlights",
    label: "Highlights",
    icon: Lightbulb,
    min: -100,
    max: 100,
    default: 0,
    color: "text-amber-400",
    bgColor: "bg-amber-500"
  },
  {
    id: "saturation",
    label: "Saturation",
    icon: Droplets,
    min: -100,
    max: 100,
    default: 0,
    color: "text-pink-400",
    bgColor: "bg-pink-500"
  },
  {
    id: "vibrance",
    label: "Vibrance",
    icon: Sparkles,
    min: -100,
    max: 100,
    default: 0,
    color: "text-purple-400",
    bgColor: "bg-purple-500"
  }
];

const DEFAULT_VALUES = ADJUSTMENTS.reduce((acc, adj) => {
  acc[adj.id] = adj.default;
  return acc;
}, {});

// ============================================
// TOUCH-FRIENDLY SLIDER COMPONENT
// ============================================

const AdjustmentSlider = ({
  adjustment,
  value,
  onChange,
  isActive,
  onActivate
}) => {
  const sliderRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  // Sync local value with prop
  useEffect(() => {
    if (!isDragging) {
      setLocalValue(value);
    }
  }, [value, isDragging]);

  const calculateValue = useCallback(
    (clientX) => {
      if (!sliderRef.current) return value;

      const rect = sliderRef.current.getBoundingClientRect();
      const percentage = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width)
      );
      const range = adjustment.max - adjustment.min;
      const newValue = Math.round(adjustment.min + percentage * range);

      return newValue;
    },
    [adjustment.min, adjustment.max, value]
  );

  const handleStart = (e) => {
    e.preventDefault();
    setIsDragging(true);
    onActivate();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const newValue = calculateValue(clientX);
    setLocalValue(newValue);
    onChange(newValue);
  };

  const handleMove = useCallback(
    (e) => {
      if (!isDragging) return;
      e.preventDefault();

      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const newValue = calculateValue(clientX);
      setLocalValue(newValue);
      onChange(newValue);
    },
    [isDragging, calculateValue, onChange]
  );

  const handleEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global mouse/touch events for dragging
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMove = (e) => handleMove(e);
      const handleGlobalEnd = () => handleEnd();

      window.addEventListener("mousemove", handleGlobalMove);
      window.addEventListener("mouseup", handleGlobalEnd);
      window.addEventListener("touchmove", handleGlobalMove, {
        passive: false
      });
      window.addEventListener("touchend", handleGlobalEnd);

      return () => {
        window.removeEventListener("mousemove", handleGlobalMove);
        window.removeEventListener("mouseup", handleGlobalEnd);
        window.removeEventListener("touchmove", handleGlobalMove);
        window.removeEventListener("touchend", handleGlobalEnd);
      };
    }
  }, [isDragging, handleMove, handleEnd]);

  // Calculate positions
  const percentage =
    ((localValue - adjustment.min) / (adjustment.max - adjustment.min)) * 100;
  const centerPercentage =
    ((0 - adjustment.min) / (adjustment.max - adjustment.min)) * 100;

  const Icon = adjustment.icon;

  return (
    <div
      className={`transition-all duration-200 ${
        isActive ? "bg-gray-700/80" : "bg-gray-800/60"
      } rounded-xl p-3`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className={`w-4 h-4 ${adjustment.color}`} />
          <span className="text-sm font-medium text-white">
            {adjustment.label}
          </span>
        </div>
        <div
          className={`text-sm font-mono font-bold px-2 py-0.5 rounded ${
            localValue === 0
              ? "text-gray-400 bg-gray-700"
              : localValue > 0
              ? "text-green-400 bg-green-900/30"
              : "text-red-400 bg-red-900/30"
          }`}
        >
          {localValue > 0 ? "+" : ""}
          {localValue}
        </div>
      </div>

      {/* Slider Track */}
      <div
        ref={sliderRef}
        className="relative h-10 cursor-pointer touch-none select-none"
        onMouseDown={handleStart}
        onTouchStart={handleStart}
      >
        {/* Background Track */}
        <div className="absolute top-1/2 left-0 right-0 h-2 -translate-y-1/2 bg-gray-700 rounded-full overflow-hidden">
          {/* Center Line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gray-500"
            style={{ left: `${centerPercentage}%` }}
          />

          {/* Filled portion */}
          <div
            className={`absolute top-0 bottom-0 ${adjustment.bgColor} opacity-60 transition-all duration-75`}
            style={{
              left: localValue >= 0 ? `${centerPercentage}%` : `${percentage}%`,
              width:
                localValue >= 0
                  ? `${percentage - centerPercentage}%`
                  : `${centerPercentage - percentage}%`
            }}
          />
        </div>

        {/* Thumb */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full border-2 shadow-lg transition-transform duration-75 ${
            isDragging ? "scale-125" : "scale-100"
          } ${adjustment.bgColor} border-white`}
          style={{ left: `${percentage}%` }}
        >
          {/* Inner glow when active */}
          {isDragging && (
            <div className="absolute inset-0 rounded-full animate-ping bg-white opacity-30" />
          )}
        </div>

        {/* Touch target zones for better mobile experience */}
        <div className="absolute inset-0 flex">
          {/* Left zone (-100 to -50) */}
          <div
            className="flex-1 h-full"
            onClick={() => onChange(Math.max(adjustment.min, localValue - 10))}
          />
          {/* Center-left zone (-50 to 0) */}
          <div className="flex-1 h-full" />
          {/* Center-right zone (0 to 50) */}
          <div className="flex-1 h-full" />
          {/* Right zone (50 to 100) */}
          <div
            className="flex-1 h-full"
            onClick={() => onChange(Math.min(adjustment.max, localValue + 10))}
          />
        </div>
      </div>

      {/* Min/Max Labels */}
      <div className="flex justify-between mt-1 px-1">
        <span className="text-[10px] text-gray-500">{adjustment.min}</span>
        <span className="text-[10px] text-gray-500">0</span>
        <span className="text-[10px] text-gray-500">+{adjustment.max}</span>
      </div>
    </div>
  );
};

// ============================================
// ADJUST HOOK
// ============================================

/**
 * Custom hook for image adjustments
 */
export const useImageAdjust = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [values, setValues] = useState({ ...DEFAULT_VALUES });
  const [originalImageSrc, setOriginalImageSrc] = useState(null);
  const [previewImageSrc, setPreviewImageSrc] = useState(null);
  const resolveRef = useRef(null);

  /**
   * Open adjustment panel
   */
  const openAdjustPanel = useCallback((imageSrc) => {
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      setOriginalImageSrc(imageSrc);
      setPreviewImageSrc(imageSrc);
      setValues({ ...DEFAULT_VALUES });
      setIsOpen(true);
    });
  }, []);

  /**
   * Apply adjustments to image
   */
  const applyAdjustments = useCallback(
    async (imageSrc, adjustments, options = {}) => {
      const { quality = 1.0, outputFormat = "image/png" } = options;

      return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext("2d");

            // Build filter string
            const filters = [];

            // Brightness: -100 to 100 → 0 to 2 (1 is normal)
            if (adjustments.brightness !== 0) {
              const brightness = 1 + adjustments.brightness / 100;
              filters.push(`brightness(${brightness})`);
            }

            // Contrast: -100 to 100 → 0 to 2 (1 is normal)
            if (adjustments.contrast !== 0) {
              const contrast = 1 + adjustments.contrast / 100;
              filters.push(`contrast(${contrast})`);
            }

            // Saturation: -100 to 100 → 0 to 2 (1 is normal)
            if (adjustments.saturation !== 0) {
              const saturation = 1 + adjustments.saturation / 100;
              filters.push(`saturate(${saturation})`);
            }

            // Apply CSS filters
            if (filters.length > 0) {
              ctx.filter = filters.join(" ");
            }

            ctx.drawImage(img, 0, 0);

            // For exposure, highlights, and vibrance, we need pixel manipulation
            if (
              adjustments.exposure !== 0 ||
              adjustments.highlights !== 0 ||
              adjustments.vibrance !== 0
            ) {
              // Reset filter for pixel operations
              ctx.filter = "none";

              const imageData = ctx.getImageData(
                0,
                0,
                canvas.width,
                canvas.height
              );
              const data = imageData.data;

              for (let i = 0; i < data.length; i += 4) {
                let r = data[i];
                let g = data[i + 1];
                let b = data[i + 2];

                // Exposure adjustment (affects all tones)
                if (adjustments.exposure !== 0) {
                  const exposureFactor = Math.pow(2, adjustments.exposure / 50);
                  r = Math.min(255, r * exposureFactor);
                  g = Math.min(255, g * exposureFactor);
                  b = Math.min(255, b * exposureFactor);
                }

                // Highlights adjustment (affects bright areas more)
                if (adjustments.highlights !== 0) {
                  const luminance = (r + g + b) / 3;
                  const highlightFactor = luminance / 255; // Higher for brighter pixels
                  const adjustment =
                    (adjustments.highlights / 100) * highlightFactor * 50;
                  r = Math.min(255, Math.max(0, r + adjustment));
                  g = Math.min(255, Math.max(0, g + adjustment));
                  b = Math.min(255, Math.max(0, b + adjustment));
                }

                // Vibrance adjustment (smart saturation - affects less saturated colors more)
                if (adjustments.vibrance !== 0) {
                  const max = Math.max(r, g, b);
                  const min = Math.min(r, g, b);
                  const saturation = max === 0 ? 0 : (max - min) / max;
                  const vibranceFactor =
                    (1 - saturation) * (adjustments.vibrance / 100);

                  const avg = (r + g + b) / 3;
                  r = Math.min(
                    255,
                    Math.max(0, r + (r - avg) * vibranceFactor)
                  );
                  g = Math.min(
                    255,
                    Math.max(0, g + (g - avg) * vibranceFactor)
                  );
                  b = Math.min(
                    255,
                    Math.max(0, b + (b - avg) * vibranceFactor)
                  );
                }

                data[i] = Math.round(r);
                data[i + 1] = Math.round(g);
                data[i + 2] = Math.round(b);
              }

              ctx.putImageData(imageData, 0, 0);
            }

            const adjustedImageSrc = canvas.toDataURL(outputFormat, quality);

            resolve({
              success: true,
              imageSrc: adjustedImageSrc,
              adjustments: { ...adjustments }
            });
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => {
          reject(new Error("Failed to load image"));
        };

        img.src = imageSrc;
      });
    },
    []
  );

  /**
   * Generate preview with current adjustments
   */
  const generatePreview = useCallback(
    async (adjustments) => {
      if (!originalImageSrc) return;

      try {
        const result = await applyAdjustments(originalImageSrc, adjustments, {
          quality: 0.7 // Lower quality for preview
        });
        if (result.success) {
          setPreviewImageSrc(result.imageSrc);
        }
      } catch (error) {
        console.error("Preview generation failed:", error);
      }
    },
    [originalImageSrc, applyAdjustments]
  );

  /**
   * Handle value change
   */
  const handleValueChange = useCallback(
    (id, value) => {
      const newValues = { ...values, [id]: value };
      setValues(newValues);

      // Debounced preview update
      generatePreview(newValues);
    },
    [values, generatePreview]
  );

  /**
   * Reset all values
   */
  const resetAll = useCallback(() => {
    setValues({ ...DEFAULT_VALUES });
    setPreviewImageSrc(originalImageSrc);
  }, [originalImageSrc]);

  /**
   * Apply and close
   */
  const handleApply = useCallback(async () => {
    if (!originalImageSrc) return;

    try {
      const result = await applyAdjustments(originalImageSrc, values, {
        quality: 1.0
      });

      setIsOpen(false);

      if (resolveRef.current) {
        resolveRef.current(result);
        resolveRef.current = null;
      }
    } catch (error) {
      console.error("Apply adjustments failed:", error);
      if (resolveRef.current) {
        resolveRef.current({ success: false, error: error.message });
        resolveRef.current = null;
      }
    }
  }, [originalImageSrc, values, applyAdjustments]);

  /**
   * Cancel and close
   */
  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setOriginalImageSrc(null);
    setPreviewImageSrc(null);

    if (resolveRef.current) {
      resolveRef.current({ success: false, cancelled: true });
      resolveRef.current = null;
    }
  }, []);

  return {
    isOpen,
    values,
    previewImageSrc,
    originalImageSrc,
    openAdjustPanel,
    handleValueChange,
    resetAll,
    handleApply,
    handleCancel,
    applyAdjustments
  };
};

// ============================================
// ADJUSTMENT PANEL COMPONENT
// ============================================

export const ImageAdjustPanel = ({
  isOpen,
  values,
  previewImageSrc,
  onValueChange,
  onReset,
  onApply,
  onCancel
}) => {
  const [activeSlider, setActiveSlider] = useState(null);
  const [showPanel, setShowPanel] = useState(false);

  // Animation timing
  useEffect(() => {
    if (isOpen) {
      setShowPanel(true);
    } else {
      const timer = setTimeout(() => setShowPanel(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!showPanel) return null;

  const hasChanges = Object.entries(values).some(
    ([key, value]) => value !== DEFAULT_VALUES[key]
  );

  return (
    <div
      className={`fixed inset-0 z-[10000] flex flex-col bg-black transition-opacity duration-300 ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Header */}
      <div className="flex-shrink-0 bg-gray-900 border-b border-gray-700 px-4 py-3 flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center gap-2 px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
          <span className="hidden sm:inline">Cancel</span>
        </button>

        <h2 className="text-white font-bold flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-indigo-400" />
          Adjust
        </h2>

        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            disabled={!hasChanges}
            className="flex items-center gap-1 px-3 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            onClick={onApply}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors"
          >
            <Check className="w-5 h-5" />
            <span className="hidden sm:inline">Apply</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Preview Area */}
        <div className="flex-1 flex items-center justify-center p-4 bg-gray-950 min-h-0">
          {previewImageSrc && (
            <img
              src={previewImageSrc}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              draggable={false}
            />
          )}
        </div>

        {/* Adjustment Panel */}
        <div className="flex-shrink-0 lg:w-80 bg-gray-900 border-t lg:border-t-0 lg:border-l border-gray-700 overflow-y-auto">
          <div className="p-4 space-y-3">
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-4">
              Adjustments
            </h3>

            {ADJUSTMENTS.map((adjustment) => (
              <AdjustmentSlider
                key={adjustment.id}
                adjustment={adjustment}
                value={values[adjustment.id]}
                onChange={(value) => onValueChange(adjustment.id, value)}
                isActive={activeSlider === adjustment.id}
                onActivate={() => setActiveSlider(adjustment.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================
// QUICK ADJUST TOOLBAR PANEL
// ============================================

export const AdjustToolbarPanel = ({
  isOpen,
  values,
  onValueChange,
  onClose,
  activeAdjustment,
  onSelectAdjustment
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute bottom-full left-0 right-0 mb-2 mx-2 bg-gray-800/95 backdrop-blur-sm rounded-xl border border-gray-700 shadow-2xl overflow-hidden z-50">
      {/* Adjustment Icons Row */}
      <div className="flex items-center justify-center gap-1 p-2 border-b border-gray-700">
        {ADJUSTMENTS.map((adj) => {
          const Icon = adj.icon;
          const isActive = activeAdjustment === adj.id;
          const hasValue = values[adj.id] !== 0;

          return (
            <button
              key={adj.id}
              onClick={() => onSelectAdjustment(isActive ? null : adj.id)}
              className={`relative p-2.5 rounded-lg transition-all ${
                isActive
                  ? `${adj.bgColor} text-white`
                  : `${adj.color} hover:bg-gray-700`
              }`}
              title={adj.label}
            >
              <Icon className="w-5 h-5" />
              {hasValue && !isActive && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-gray-800" />
              )}
            </button>
          );
        })}

        {/* Close button */}
        <div className="w-px h-6 bg-gray-700 mx-1" />
        <button
          onClick={onClose}
          className="p-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Active Slider */}
      {activeAdjustment && (
        <div className="p-3">
          {ADJUSTMENTS.filter((adj) => adj.id === activeAdjustment).map(
            (adjustment) => (
              <AdjustmentSlider
                key={adjustment.id}
                adjustment={adjustment}
                value={values[adjustment.id]}
                onChange={(value) => onValueChange(adjustment.id, value)}
                isActive={true}
                onActivate={() => {}}
              />
            )
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// ADJUST BUTTON COMPONENT
// ============================================

export const AdjustButton = ({
  onClick,
  disabled = false,
  isActive = false,
  hasChanges = false,
  className = ""
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-lg transition-all relative ${
        isActive
          ? "bg-indigo-600 text-white"
          : "text-cyan-400 hover:bg-cyan-900/30 hover:text-cyan-300"
      } disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
      title="Adjust Image"
    >
      <SlidersHorizontal className="w-5 h-5" />
      {hasChanges && !isActive && (
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-gray-800" />
      )}
    </button>
  );
};

export default useImageAdjust;
