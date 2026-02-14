// YPivotQATemplatesImageCrop.jsx
import React, { useState, useCallback, useRef, useEffect } from "react";
import {
  X,
  Check,
  RotateCcw,
  Maximize2,
  Square,
  RectangleHorizontal,
  Smartphone,
  Monitor,
  Move,
  Crop,
  FlipHorizontal,
  FlipVertical,
  RotateCw
} from "lucide-react";

// ============================================
// CONFIGURATION
// ============================================

const ASPECT_RATIOS = [
  { id: "free", label: "Free", icon: Maximize2, ratio: null },
  { id: "1:1", label: "1:1", icon: Square, ratio: 1 },
  { id: "4:3", label: "4:3", icon: RectangleHorizontal, ratio: 4 / 3 },
  { id: "16:9", label: "16:9", icon: Monitor, ratio: 16 / 9 },
  { id: "9:16", label: "9:16", icon: Smartphone, ratio: 9 / 16 },
  { id: "3:2", label: "3:2", icon: RectangleHorizontal, ratio: 3 / 2 },
  { id: "2:3", label: "2:3", icon: RectangleHorizontal, ratio: 2 / 3 }
];

const MIN_CROP_SIZE = 50; // Minimum crop area in pixels

// ============================================
// CROP HOOK
// ============================================

/**
 * Custom hook for image cropping functionality
 */
export const useImageCrop = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);
  const [originalDimensions, setOriginalDimensions] = useState({
    width: 0,
    height: 0
  });
  const resolveRef = useRef(null);
  const rejectRef = useRef(null);

  /**
   * Open crop modal with an image
   * @param {string} src - Image source (data URL or URL)
   * @returns {Promise} - Resolves with cropped image or null if cancelled
   */
  const openCropModal = useCallback((src) => {
    return new Promise((resolve, reject) => {
      resolveRef.current = resolve;
      rejectRef.current = reject;

      // Load image to get dimensions
      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.width, height: img.height });
        setImageSrc(src);
        setIsOpen(true);
      };
      img.onerror = () => {
        reject(new Error("Failed to load image"));
      };
      img.src = src;
    });
  }, []);

  /**
   * Handle crop completion
   */
  const handleComplete = useCallback((croppedImageSrc, cropData) => {
    setIsOpen(false);
    setImageSrc(null);
    if (resolveRef.current) {
      resolveRef.current({
        success: true,
        imageSrc: croppedImageSrc,
        cropData
      });
      resolveRef.current = null;
    }
  }, []);

  /**
   * Handle crop cancellation
   */
  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setImageSrc(null);
    if (resolveRef.current) {
      resolveRef.current({ success: false, cancelled: true });
      resolveRef.current = null;
    }
  }, []);

  return {
    isOpen,
    imageSrc,
    originalDimensions,
    openCropModal,
    handleComplete,
    handleCancel
  };
};

// ============================================
// MAIN CROP MODAL COMPONENT
// ============================================

/**
 * Image Crop Modal Component
 */
export const ImageCropModal = ({
  isOpen,
  imageSrc,
  originalDimensions,
  onComplete,
  onCancel,
  initialAspectRatio = "free",
  quality = 1.0,
  outputFormat = "image/png"
}) => {
  // Refs
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);

  // State
  const [imageLoaded, setImageLoaded] = useState(false);
  const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
  const [scale, setScale] = useState(1);

  // Crop area state (in display coordinates)
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [aspectRatio, setAspectRatio] = useState(initialAspectRatio);

  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [cropStart, setCropStart] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0
  });

  // Drawing new crop area
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });

  // Transform state
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // Get current aspect ratio value
  const currentRatio = ASPECT_RATIOS.find((r) => r.id === aspectRatio)?.ratio;

  // ==========================================
  // INITIALIZE CROP AREA
  // ==========================================

  useEffect(() => {
    if (!isOpen) {
      setImageLoaded(false);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      return;
    }
  }, [isOpen]);

  // Calculate display size when image loads
  const handleImageLoad = useCallback(() => {
    if (!imageRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const containerRect = container.getBoundingClientRect();

    // Available space (accounting for padding)
    const maxWidth = containerRect.width - 40;
    const maxHeight = containerRect.height - 40;

    // Calculate scale to fit
    const scaleX = maxWidth / originalDimensions.width;
    const scaleY = maxHeight / originalDimensions.height;
    const fitScale = Math.min(scaleX, scaleY, 1);

    const displayWidth = originalDimensions.width * fitScale;
    const displayHeight = originalDimensions.height * fitScale;

    setScale(fitScale);
    setDisplaySize({ width: displayWidth, height: displayHeight });

    // Initialize crop area to full image or with aspect ratio
    let initialCrop;
    if (currentRatio) {
      initialCrop = calculateAspectRatioCrop(
        displayWidth,
        displayHeight,
        currentRatio
      );
    } else {
      initialCrop = {
        x: 0,
        y: 0,
        width: displayWidth,
        height: displayHeight
      };
    }

    setCropArea(initialCrop);
    setImageLoaded(true);
  }, [originalDimensions, currentRatio]);

  // Recalculate when aspect ratio changes
  useEffect(() => {
    if (!imageLoaded || !displaySize.width) return;

    if (currentRatio) {
      const newCrop = calculateAspectRatioCrop(
        displaySize.width,
        displaySize.height,
        currentRatio
      );
      setCropArea(newCrop);
    }
  }, [aspectRatio, currentRatio, imageLoaded, displaySize]);

  // ==========================================
  // HELPER FUNCTIONS
  // ==========================================

  function calculateAspectRatioCrop(maxWidth, maxHeight, ratio) {
    let width, height;

    if (maxWidth / maxHeight > ratio) {
      // Container is wider than ratio
      height = maxHeight;
      width = height * ratio;
    } else {
      // Container is taller than ratio
      width = maxWidth;
      height = width / ratio;
    }

    return {
      x: (maxWidth - width) / 2,
      y: (maxHeight - height) / 2,
      width,
      height
    };
  }

  function constrainCropArea(crop, maxWidth, maxHeight, ratio) {
    let { x, y, width, height } = crop;

    // Enforce minimum size
    width = Math.max(width, MIN_CROP_SIZE);
    height = Math.max(height, MIN_CROP_SIZE);

    // Enforce aspect ratio
    if (ratio) {
      if (width / height > ratio) {
        width = height * ratio;
      } else {
        height = width / ratio;
      }
    }

    // Enforce maximum size
    width = Math.min(width, maxWidth);
    height = Math.min(height, maxHeight);

    // Enforce bounds
    x = Math.max(0, Math.min(x, maxWidth - width));
    y = Math.max(0, Math.min(y, maxHeight - height));

    return { x, y, width, height };
  }

  function getEventCoords(e, container) {
    const rect = container.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Calculate position relative to the image display area
    const containerCenterX = rect.width / 2;
    const containerCenterY = rect.height / 2;

    const imageLeft = containerCenterX - displaySize.width / 2;
    const imageTop = containerCenterY - displaySize.height / 2;

    return {
      x: clientX - rect.left - imageLeft,
      y: clientY - rect.top - imageTop
    };
  }

  // ==========================================
  // MOUSE/TOUCH HANDLERS
  // ==========================================

  const handleMouseDown = (e) => {
    if (e.button !== 0 && !e.touches) return;
    e.preventDefault();

    const coords = getEventCoords(e, containerRef.current);

    // Check if clicking inside crop area
    const insideCrop =
      coords.x >= cropArea.x &&
      coords.x <= cropArea.x + cropArea.width &&
      coords.y >= cropArea.y &&
      coords.y <= cropArea.y + cropArea.height;

    if (insideCrop && !resizeHandle) {
      // Start dragging
      setIsDragging(true);
      setDragStart(coords);
      setCropStart({ ...cropArea });
    } else if (!resizeHandle) {
      // Start drawing new crop area
      setIsDrawing(true);
      setDrawStart(coords);
      setCropArea({
        x: coords.x,
        y: coords.y,
        width: 0,
        height: 0
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!isDragging && !isResizing && !isDrawing) return;
    e.preventDefault();

    const coords = getEventCoords(e, containerRef.current);

    if (isDragging) {
      // Move crop area
      const deltaX = coords.x - dragStart.x;
      const deltaY = coords.y - dragStart.y;

      const newCrop = constrainCropArea(
        {
          x: cropStart.x + deltaX,
          y: cropStart.y + deltaY,
          width: cropArea.width,
          height: cropArea.height
        },
        displaySize.width,
        displaySize.height,
        currentRatio
      );

      setCropArea(newCrop);
    } else if (isResizing && resizeHandle) {
      // Resize crop area
      handleResize(coords);
    } else if (isDrawing) {
      // Draw new crop area
      let width = coords.x - drawStart.x;
      let height = coords.y - drawStart.y;

      let x = drawStart.x;
      let y = drawStart.y;

      // Handle negative dimensions
      if (width < 0) {
        x = coords.x;
        width = Math.abs(width);
      }
      if (height < 0) {
        y = coords.y;
        height = Math.abs(height);
      }

      // Apply aspect ratio if set
      if (currentRatio) {
        if (width / height > currentRatio) {
          width = height * currentRatio;
        } else {
          height = width / currentRatio;
        }
      }

      const newCrop = constrainCropArea(
        { x, y, width, height },
        displaySize.width,
        displaySize.height,
        currentRatio
      );

      setCropArea(newCrop);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setIsDrawing(false);
    setResizeHandle(null);
  };

  const handleResize = (coords) => {
    let { x, y, width, height } = cropStart;

    switch (resizeHandle) {
      case "nw":
        width = cropStart.x + cropStart.width - coords.x;
        height = cropStart.y + cropStart.height - coords.y;
        x = coords.x;
        y = coords.y;
        break;
      case "ne":
        width = coords.x - cropStart.x;
        height = cropStart.y + cropStart.height - coords.y;
        y = coords.y;
        break;
      case "sw":
        width = cropStart.x + cropStart.width - coords.x;
        height = coords.y - cropStart.y;
        x = coords.x;
        break;
      case "se":
        width = coords.x - cropStart.x;
        height = coords.y - cropStart.y;
        break;
      case "n":
        height = cropStart.y + cropStart.height - coords.y;
        y = coords.y;
        break;
      case "s":
        height = coords.y - cropStart.y;
        break;
      case "w":
        width = cropStart.x + cropStart.width - coords.x;
        x = coords.x;
        break;
      case "e":
        width = coords.x - cropStart.x;
        break;
      default:
        break;
    }

    // Apply aspect ratio
    if (currentRatio) {
      const centerX = x + width / 2;
      const centerY = y + height / 2;

      if (width / height > currentRatio) {
        width = height * currentRatio;
      } else {
        height = width / currentRatio;
      }

      // Re-center for corner handles
      if (["nw", "ne", "sw", "se"].includes(resizeHandle)) {
        x = centerX - width / 2;
        y = centerY - height / 2;
      }
    }

    const newCrop = constrainCropArea(
      { x, y, width, height },
      displaySize.width,
      displaySize.height,
      currentRatio
    );

    setCropArea(newCrop);
  };

  const startResize = (handle, e) => {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizeHandle(handle);
    setCropStart({ ...cropArea });
    setDragStart(getEventCoords(e, containerRef.current));
  };

  // ==========================================
  // TRANSFORM FUNCTIONS
  // ==========================================

  const handleRotateLeft = () => {
    setRotation((prev) => (prev - 90 + 360) % 360);
  };

  const handleRotateRight = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFlipHorizontal = () => {
    setFlipH((prev) => !prev);
  };

  const handleFlipVertical = () => {
    setFlipV((prev) => !prev);
  };

  const handleReset = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setAspectRatio("free");

    // Reset crop to full image
    setCropArea({
      x: 0,
      y: 0,
      width: displaySize.width,
      height: displaySize.height
    });
  };

  // ==========================================
  // CROP EXECUTION
  // ==========================================

  const executeCrop = useCallback(() => {
    if (!imageRef.current || !originalDimensions.width) return;

    // Convert display coordinates to original image coordinates
    const originalCrop = {
      x: Math.round(cropArea.x / scale),
      y: Math.round(cropArea.y / scale),
      width: Math.round(cropArea.width / scale),
      height: Math.round(cropArea.height / scale)
    };

    // Ensure crop is within bounds
    originalCrop.x = Math.max(0, originalCrop.x);
    originalCrop.y = Math.max(0, originalCrop.y);
    originalCrop.width = Math.min(
      originalCrop.width,
      originalDimensions.width - originalCrop.x
    );
    originalCrop.height = Math.min(
      originalCrop.height,
      originalDimensions.height - originalCrop.y
    );

    // Create canvas at original quality
    const canvas = document.createElement("canvas");

    // Handle rotation (swap dimensions for 90/270 degrees)
    const isRotated90 = rotation === 90 || rotation === 270;
    if (isRotated90) {
      canvas.width = originalCrop.height;
      canvas.height = originalCrop.width;
    } else {
      canvas.width = originalCrop.width;
      canvas.height = originalCrop.height;
    }

    const ctx = canvas.getContext("2d");

    // High quality settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    // Apply transforms
    ctx.save();

    // Move to center
    ctx.translate(canvas.width / 2, canvas.height / 2);

    // Apply rotation
    ctx.rotate((rotation * Math.PI) / 180);

    // Apply flips
    ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

    // Calculate draw position
    const drawWidth = isRotated90 ? originalCrop.height : originalCrop.width;
    const drawHeight = isRotated90 ? originalCrop.width : originalCrop.height;

    // Draw the cropped portion
    ctx.drawImage(
      imageRef.current,
      originalCrop.x,
      originalCrop.y,
      originalCrop.width,
      originalCrop.height,
      -drawWidth / 2,
      -drawHeight / 2,
      originalCrop.width,
      originalCrop.height
    );

    ctx.restore();

    // Generate output
    const croppedImageSrc = canvas.toDataURL(outputFormat, quality);

    onComplete(croppedImageSrc, {
      crop: originalCrop,
      rotation,
      flipH,
      flipV,
      originalDimensions,
      resultDimensions: { width: canvas.width, height: canvas.height }
    });
  }, [
    cropArea,
    scale,
    originalDimensions,
    rotation,
    flipH,
    flipV,
    quality,
    outputFormat,
    onComplete
  ]);

  // ==========================================
  // RENDER
  // ==========================================

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black z-[10000] flex flex-col">
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
          <Crop className="w-5 h-5 text-indigo-400" />
          Crop Image
        </h2>

        <button
          onClick={executeCrop}
          disabled={
            cropArea.width < MIN_CROP_SIZE || cropArea.height < MIN_CROP_SIZE
          }
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="w-5 h-5" />
          <span className="hidden sm:inline">Apply</span>
        </button>
      </div>

      {/* Main Crop Area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-gray-950 flex items-center justify-center cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
      >
        {/* Image Container */}
        <div
          className="relative"
          style={{
            width: displaySize.width || "auto",
            height: displaySize.height || "auto",
            transform: `rotate(${rotation}deg) scaleX(${
              flipH ? -1 : 1
            }) scaleY(${flipV ? -1 : 1})`,
            transition: "transform 0.3s ease"
          }}
        >
          {/* Image */}
          <img
            ref={imageRef}
            src={imageSrc}
            alt="Crop"
            onLoad={handleImageLoad}
            className="block max-w-full max-h-full select-none pointer-events-none"
            style={{
              width: displaySize.width || "auto",
              height: displaySize.height || "auto"
            }}
            draggable={false}
          />

          {/* Dark overlay outside crop area */}
          {imageLoaded && (
            <>
              {/* Top */}
              <div
                className="absolute bg-black/60 pointer-events-none"
                style={{
                  top: 0,
                  left: 0,
                  right: 0,
                  height: cropArea.y
                }}
              />
              {/* Bottom */}
              <div
                className="absolute bg-black/60 pointer-events-none"
                style={{
                  top: cropArea.y + cropArea.height,
                  left: 0,
                  right: 0,
                  bottom: 0
                }}
              />
              {/* Left */}
              <div
                className="absolute bg-black/60 pointer-events-none"
                style={{
                  top: cropArea.y,
                  left: 0,
                  width: cropArea.x,
                  height: cropArea.height
                }}
              />
              {/* Right */}
              <div
                className="absolute bg-black/60 pointer-events-none"
                style={{
                  top: cropArea.y,
                  left: cropArea.x + cropArea.width,
                  right: 0,
                  height: cropArea.height
                }}
              />

              {/* Crop Area Border & Handles */}
              <div
                className="absolute border-2 border-white shadow-lg"
                style={{
                  left: cropArea.x,
                  top: cropArea.y,
                  width: cropArea.width,
                  height: cropArea.height
                }}
              >
                {/* Grid lines (rule of thirds) */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/30" />
                  <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/30" />
                  <div className="absolute top-1/3 left-0 right-0 h-px bg-white/30" />
                  <div className="absolute top-2/3 left-0 right-0 h-px bg-white/30" />
                </div>

                {/* Resize Handles */}
                {/* Corners */}
                <CropHandle
                  position="nw"
                  onMouseDown={(e) => startResize("nw", e)}
                />
                <CropHandle
                  position="ne"
                  onMouseDown={(e) => startResize("ne", e)}
                />
                <CropHandle
                  position="sw"
                  onMouseDown={(e) => startResize("sw", e)}
                />
                <CropHandle
                  position="se"
                  onMouseDown={(e) => startResize("se", e)}
                />

                {/* Edges */}
                <CropHandle
                  position="n"
                  onMouseDown={(e) => startResize("n", e)}
                  edge
                />
                <CropHandle
                  position="s"
                  onMouseDown={(e) => startResize("s", e)}
                  edge
                />
                <CropHandle
                  position="w"
                  onMouseDown={(e) => startResize("w", e)}
                  edge
                />
                <CropHandle
                  position="e"
                  onMouseDown={(e) => startResize("e", e)}
                  edge
                />

                {/* Center move indicator */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-black/50 rounded-lg px-2 py-1 flex items-center gap-1">
                    <Move className="w-4 h-4 text-white/70" />
                    <span className="text-white/70 text-xs">
                      {Math.round(cropArea.width / scale)} ×{" "}
                      {Math.round(cropArea.height / scale)}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Loading indicator */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin w-8 h-8 border-2 border-white border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Bottom Toolbar */}
      <div className="flex-shrink-0 bg-gray-900 border-t border-gray-700 p-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 max-w-4xl mx-auto">
          {/* Aspect Ratio Selection */}
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1 overflow-x-auto max-w-full">
            {ASPECT_RATIOS.map((ratio) => (
              <button
                key={ratio.id}
                onClick={() => setAspectRatio(ratio.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  aspectRatio === ratio.id
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:text-white hover:bg-gray-700"
                }`}
              >
                <ratio.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{ratio.label}</span>
              </button>
            ))}
          </div>

          {/* Transform Tools */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleRotateLeft}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Rotate Left"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={handleRotateRight}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Rotate Right"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-gray-700 mx-1" />

            <button
              onClick={handleFlipHorizontal}
              className={`p-2 rounded-lg transition-colors ${
                flipH
                  ? "text-indigo-400 bg-indigo-500/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
              title="Flip Horizontal"
            >
              <FlipHorizontal className="w-5 h-5" />
            </button>
            <button
              onClick={handleFlipVertical}
              className={`p-2 rounded-lg transition-colors ${
                flipV
                  ? "text-indigo-400 bg-indigo-500/20"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
              title="Flip Vertical"
            >
              <FlipVertical className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-gray-700 mx-1" />

            <button
              onClick={handleReset}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Crop Info */}
        <div className="text-center mt-2">
          <p className="text-gray-500 text-xs">
            Original: {originalDimensions.width} × {originalDimensions.height}
            {" • "}
            Crop: {Math.round(cropArea.width / scale)} ×{" "}
            {Math.round(cropArea.height / scale)}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================
// CROP HANDLE COMPONENT
// ============================================

const CropHandle = ({ position, onMouseDown, edge = false }) => {
  const baseStyles = "absolute bg-white border-2 border-indigo-500 z-10";

  const positionStyles = {
    // Corners
    nw: "top-0 left-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize",
    ne: "top-0 right-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize",
    sw: "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize",
    se: "bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-se-resize",
    // Edges
    n: "top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 cursor-n-resize",
    s: "bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 cursor-s-resize",
    w: "top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 cursor-w-resize",
    e: "top-1/2 right-0 translate-x-1/2 -translate-y-1/2 cursor-e-resize"
  };

  const sizeStyles = edge
    ? "w-4 h-4 sm:w-3 sm:h-3"
    : "w-4 h-4 sm:w-3.5 sm:h-3.5";

  return (
    <div
      className={`${baseStyles} ${sizeStyles} ${positionStyles[position]} rounded-sm hover:bg-indigo-400 transition-colors touch-none`}
      onMouseDown={onMouseDown}
      onTouchStart={onMouseDown}
    />
  );
};

// ============================================
// COMPACT CROP BUTTON FOR TOOLBAR
// ============================================

export const CropButton = ({
  onClick,
  disabled = false,
  isActive = false,
  className = ""
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2 rounded-lg transition-all ${
        isActive
          ? "bg-amber-600 text-white"
          : "text-amber-400 hover:bg-amber-900/30 hover:text-amber-300"
      } disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
      title="Crop Image"
    >
      <Crop className="w-5 h-5" />
    </button>
  );
};

export default ImageCropModal;
