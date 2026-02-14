import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Camera,
  Upload,
  Type,
  ArrowRight,
  Square,
  Circle as CircleIcon,
  PenTool,
  X,
  Trash2,
  Undo2,
  SwitchCamera,
  Minus,
  Plus,
  ZoomIn,
  ZoomOut,
  Save,
  Palette,
  Settings,
  Loader,
  Move,
  Check,
  Eraser, // for background removal button
  Crop,
  RotateCcw,
  FlipHorizontal2,
  SlidersHorizontal,
  ImageOff // alternative icon
} from "lucide-react";

import {
  useBackgroundRemoval,
  BackgroundRemovalModal,
  BackgroundColorPicker,
  ModelStatusIndicator,
  initializeCacheStatus
} from "./YPivotQATemplatesImageRemoveBackground";

import {
  useImageCrop,
  ImageCropModal,
  CropButton
} from "./YPivotQATemplatesImageCrop";

// Rotate
import { useImageRotate, RotateButton } from "./YPivotQATemplatesImageRotate";

// Flip
import { useImageFlip, FlipButton } from "./YPivotQATemplatesImageFlip";

// Adjust
import {
  useImageAdjust,
  AdjustButton,
  AdjustToolbarPanel
} from "./YPivotQATemplatesImageAdjust";

const YPivotQATemplatesImageEditor = ({
  autoStartMode = null,
  existingData = null,
  maxImages = 20,
  onSave = null,
  onCancel = null
}) => {
  // --- Device Detection ---
  const [deviceType, setDeviceType] = useState("desktop");
  const [isInitializing, setIsInitializing] = useState(false);

  // ✅ ADD: Size-based canvas load limit (in MB)
  const CANVAS_SIZE_LIMIT_MB = deviceType === "desktop" ? 100 : 10;

  // ✅ ADD: Track total size of loaded images
  const [totalImageSizeMB, setTotalImageSizeMB] = useState(0);
  const [canvasDisabled, setCanvasDisabled] = useState(false);

  useEffect(() => {
    const detectDevice = () => {
      const width = window.innerWidth;
      if (width < 768) return "mobile";
      if (width < 1024) return "tablet";
      return "desktop";
    };
    setDeviceType(detectDevice());
    const handleResize = () => setDeviceType(detectDevice());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // --- Lock Body Scroll ---
  useEffect(() => {
    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";
    return () => {
      document.body.style.overflow = "unset";
      document.body.style.overscrollBehavior = "unset";
    };
  }, []);

  // --- Modes & State ---
  const [mode, setMode] = useState(
    existingData ? "editor" : autoStartMode ? "initializing" : "initial"
  );

  // MULTIPLE IMAGES STATE
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const currentImage = images[currentImageIndex] || null;
  const imgSrc = currentImage?.imgSrc || null;

  // --- Camera State ---
  const videoRef = useRef(null);
  const fileInputRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [facingMode, setFacingMode] = useState("environment");
  const [pendingStream, setPendingStream] = useState(null); // ✅ ADD THIS LINE
  const [isCameraLoading, setIsCameraLoading] = useState(false); // ✅ ADD THIS LINE

  // --- Uploading State ---
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadTotal, setUploadTotal] = useState(0);

  // --- Editor State ---
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const didInitRef = useRef(false);
  const [context, setContext] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  // Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // History for current image
  const [history, setHistory] = useState([]);
  const [currentAction, setCurrentAction] = useState(null);

  // Tools
  const [activeTool, setActiveTool] = useState("pen");
  const [color, setColor] = useState("#ef4444");
  const [lineWidth, setLineWidth] = useState(8);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [showSettings, setShowSettings] = useState(false);

  // Text Input Modal State
  const [showTextInput, setShowTextInput] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [textPos, setTextPos] = useState({ x: 0, y: 0 });

  // TEXT SELECTION & MOVEMENT
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [hoveredElementId, setHoveredElementId] = useState(null);
  const [isDraggingElement, setIsDraggingElement] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const longPressTimerRef = useRef(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  // Touch/pinch zoom
  const [lastTouchDistance, setLastTouchDistance] = useState(null);

  // --- Background Removal State ---
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [bgRemovalColor, setBgRemovalColor] = useState("#FFFFFF");

  // ==========================================
  // HELPER: Calculate total size of images
  // ==========================================
  const calculateTotalSize = useCallback((imagesList) => {
    let totalBytes = 0;

    imagesList.forEach((img) => {
      // Try to get size from File object
      if (img.file && img.file.size) {
        totalBytes += img.file.size;
      }
      // Estimate from data URL (base64)
      else if (img.imgSrc && img.imgSrc.startsWith("data:")) {
        const base64Length = img.imgSrc.length - (img.imgSrc.indexOf(",") + 1);
        const estimatedBytes = (base64Length * 3) / 4;
        totalBytes += estimatedBytes;
      }
      // Estimate from blob URL (rough estimate: 2MB per image)
      else if (img.imgSrc && img.imgSrc.startsWith("blob:")) {
        totalBytes += 2 * 1024 * 1024; // Estimate 2MB
      }
    });

    return totalBytes / 1024 / 1024; // Convert to MB
  }, []);

  // 2. ADD useEffect TO CHECK CACHE ON MOUNT (add after other useEffects)
  useEffect(() => {
    // Check cache status early so we know if models are ready
    initializeCacheStatus();
  }, []);

  // Use the background removal hook
  const {
    removeImageBackground,
    isProcessing: isBgRemoving,
    progress: bgRemovalProgress,
    progressMessage: bgRemovalMessage,
    error: bgRemovalError,
    resetState: resetBgRemovalState,
    cancelProcessing: cancelBgRemoval, // NEW
    isCached: isModelCached, // NEW - cache status
    isModelReady // NEW - model ready status
  } = useBackgroundRemoval();

  // --- Crop State ---
  const {
    isOpen: isCropOpen,
    imageSrc: cropImageSrc,
    originalDimensions: cropOriginalDimensions,
    openCropModal,
    handleComplete: handleCropComplete,
    handleCancel: handleCropCancel
  } = useImageCrop();

  // --- Rotate State ---
  const { rotateImage } = useImageRotate();
  const [isRotating, setIsRotating] = useState(false);

  // --- Flip State ---
  const { flipImageHorizontal } = useImageFlip();
  const [isFlipping, setIsFlipping] = useState(false);

  // --- Adjust State ---
  const {
    isOpen: isAdjustOpen,
    values: adjustValues,
    previewImageSrc: adjustPreviewSrc,
    openAdjustPanel,
    handleValueChange: handleAdjustValueChange,
    resetAll: resetAdjustments,
    handleApply: applyAdjustments,
    handleCancel: cancelAdjustments
  } = useImageAdjust();

  // Toolbar adjust panel state (inline mode)
  const [showAdjustPanel, setShowAdjustPanel] = useState(false);
  const [activeAdjustment, setActiveAdjustment] = useState(null);
  const [adjustmentValues, setAdjustmentValues] = useState({
    exposure: 0,
    brightness: 0,
    contrast: 0,
    highlights: 0,
    saturation: 0,
    vibrance: 0
  });

  // Generate unique ID
  const generateId = () =>
    `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // ✅ ADD: Helper to scale dimensions for high-res canvas
  const getScaledValue = useCallback(
    (value) => {
      if (!canvasSize.width || canvasSize.width <= 0) return value;
      // Scale based on canvas resolution (reference: 1000px)
      const scaleFactor = Math.max(1, canvasSize.width / 1000);
      return value * scaleFactor;
    },
    [canvasSize.width]
  );

  // ==========================================
  // MEMORY LEAK CLEANUP
  // ==========================================
  useEffect(() => {
    // Cleanup Blob URLs when component unmounts to free memory
    return () => {
      images.forEach((img) => {
        if (img.imgSrc && img.imgSrc.startsWith("blob:")) {
          URL.revokeObjectURL(img.imgSrc);
        }
      });
    };
  }, []); // Run once on unmount (closure captures initial empty, but we rely on browser GC mostly)

  // Sync history when image changes
  useEffect(() => {
    if (currentImage) {
      setHistory(currentImage.history || []);
      setSelectedElementId(null);
      setHoveredElementId(null);
    } else {
      setHistory([]);
    }
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [currentImageIndex, currentImage?.id, images.length]);

  // ✅ ADD: Calculate total size and check if canvas should be disabled
  useEffect(() => {
    const totalSizeMB = calculateTotalSize(images);
    setTotalImageSizeMB(totalSizeMB);

    const shouldDisable = totalSizeMB > CANVAS_SIZE_LIMIT_MB;
    setCanvasDisabled(shouldDisable);

    if (shouldDisable) {
      console.warn(
        `⚠️ Canvas disabled: Total size ${totalSizeMB.toFixed(
          2
        )}MB exceeds ${CANVAS_SIZE_LIMIT_MB}MB limit for ${deviceType}`
      );
    }
  }, [images, CANVAS_SIZE_LIMIT_MB, deviceType, calculateTotalSize]);

  // Update images array when history changes
  const updateCurrentImageHistory = useCallback(
    (newHistory) => {
      setImages((prev) =>
        prev.map((img, idx) =>
          idx === currentImageIndex ? { ...img, history: newHistory } : img
        )
      );
    },
    [currentImageIndex]
  );

  // ✅ ADD THIS NEW useEffect - Attach stream when video element becomes available
  useEffect(() => {
    const attachStreamToVideo = async () => {
      if (mode === "camera" && pendingStream && videoRef.current) {
        console.log("📹 Attaching stream to video element...");

        try {
          videoRef.current.srcObject = pendingStream;

          // Wait for metadata to load
          await new Promise((resolve, reject) => {
            const video = videoRef.current;
            if (!video) {
              reject(new Error("Video element not found"));
              return;
            }

            const onLoadedMetadata = () => {
              video.removeEventListener("loadedmetadata", onLoadedMetadata);
              video.removeEventListener("error", onError);
              resolve();
            };

            const onError = (e) => {
              video.removeEventListener("loadedmetadata", onLoadedMetadata);
              video.removeEventListener("error", onError);
              reject(e);
            };

            video.addEventListener("loadedmetadata", onLoadedMetadata);
            video.addEventListener("error", onError);

            // Timeout fallback
            setTimeout(resolve, 2000);
          });

          // Explicitly call play() - important for some browsers
          try {
            await videoRef.current.play();
            console.log("✅ Video playing successfully");
          } catch (playError) {
            console.warn(
              "Auto-play failed, user interaction may be needed:",
              playError
            );
          }

          // Clear pending stream and loading state
          setPendingStream(null);
          setIsCameraLoading(false);

          // Log actual resolution
          const videoTrack = pendingStream.getVideoTracks()[0];
          if (videoTrack) {
            const settings = videoTrack.getSettings();
            console.log(
              `📷 Camera active: ${settings.width}x${settings.height}`
            );
          }
        } catch (error) {
          console.error("Error attaching stream:", error);
          setIsCameraLoading(false);
        }
      }
    };

    attachStreamToVideo();
  }, [mode, pendingStream]);

  // ==========================================
  // INITIALIZE WITH PROPS
  // ==========================================

  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    const initializeEditor = async () => {
      if (existingData) {
        if (Array.isArray(existingData)) {
          setImages(
            existingData.map((data, idx) => ({
              id: generateId(),
              imgSrc: data.imgSrc,
              history: data.history || [],
              editedImgSrc: null
            }))
          );
        } else {
          setImages([
            {
              id: generateId(),
              imgSrc: existingData.imgSrc,
              history: existingData.history || [],
              editedImgSrc: null
            }
          ]);
        }
        setMode("editor");
        return;
      }

      // ✅ AUTO-START CAMERA
      if (autoStartMode === "camera") {
        setIsInitializing(true);
        await startCamera();
        setIsInitializing(false);
      }
      // ✅ AUTO-START UPLOAD
      else if (autoStartMode === "upload") {
        setIsInitializing(true);
        // Longer delay to ensure file input is mounted
        await new Promise((resolve) => setTimeout(resolve, 300));
        if (fileInputRef.current) {
          fileInputRef.current.click();
          // Keep initializing state until user interacts with file picker
        } else {
          console.error("File input not found");
          setMode("initial");
        }
        setIsInitializing(false);
      }
      // ✅ NO AUTO-START - Show initial screen
      else {
        setMode("initial");
      }
    };

    initializeEditor();
  }, []);

  // ==========================================
  // 1. CAMERA & UPLOAD LOGIC
  // ==========================================

  const startCamera = async () => {
    try {
      setIsCameraLoading(true);

      // ✅ Clean up existing stream
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
      if (pendingStream) {
        pendingStream.getTracks().forEach((track) => track.stop());
        setPendingStream(null);
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }

      // ✅ Better mobile/tablet detection
      const isMobileOrTablet =
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        ) ||
        "ontouchstart" in window ||
        (navigator.maxTouchPoints && navigator.maxTouchPoints > 1);

      const preferRearCamera = isMobileOrTablet;
      setFacingMode(preferRearCamera ? "environment" : "user");

      let newStream = null;

      // ✅ HIGH QUALITY settings - preserved from original
      const highQualityConstraints = {
        width: { ideal: 4096, min: 1280 },
        height: { ideal: 2160, min: 720 },
        frameRate: { ideal: 30 }
      };

      // ✅ Strategy 1: Device enumeration (most reliable for rear camera)
      if (preferRearCamera) {
        try {
          // Get temporary permission to enumerate devices
          const tempStream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
          tempStream.getTracks().forEach((track) => track.stop());

          // Small delay after stopping temp stream
          await new Promise((resolve) => setTimeout(resolve, 100));

          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(
            (device) => device.kind === "videoinput"
          );

          console.log(
            "Available cameras:",
            videoDevices.map((d) => ({ label: d.label, id: d.deviceId }))
          );

          // Find back camera by label
          let backCamera = videoDevices.find((device) =>
            /back|rear|environment|後|背面|trasera|arrière|hinten|0/i.test(
              device.label
            )
          );

          // If not found and multiple cameras, try the last one (usually back camera on mobile)
          if (!backCamera && videoDevices.length >= 2) {
            backCamera = videoDevices[videoDevices.length - 1];
          }

          if (backCamera) {
            try {
              newStream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                  deviceId: { exact: backCamera.deviceId },
                  ...highQualityConstraints
                }
              });
              console.log(
                "✅ Using back camera by deviceId:",
                backCamera.label
              );
            } catch (deviceIdError) {
              console.log("deviceId approach failed:", deviceIdError.message);
            }
          }
        } catch (enumError) {
          console.log("Device enumeration failed:", enumError.message);
        }
      }

      // ✅ Strategy 2: exact facingMode
      if (!newStream && preferRearCamera) {
        try {
          newStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { exact: "environment" },
              ...highQualityConstraints
            }
          });
          console.log("✅ Using exact facingMode: environment");
        } catch (exactError) {
          console.log("Exact facingMode failed:", exactError.message);
        }
      }

      // ✅ Strategy 3: string facingMode (some devices prefer this)
      if (!newStream && preferRearCamera) {
        try {
          newStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: "environment",
              ...highQualityConstraints
            }
          });
          console.log("✅ Using string facingMode: environment");
        } catch (stringError) {
          console.log("String facingMode failed:", stringError.message);
        }
      }

      // ✅ Strategy 4: ideal facingMode
      if (!newStream) {
        try {
          newStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              facingMode: { ideal: preferRearCamera ? "environment" : "user" },
              ...highQualityConstraints
            }
          });
          console.log("✅ Using ideal facingMode");
        } catch (idealError) {
          console.log("Ideal facingMode failed:", idealError.message);
        }
      }

      // ✅ Strategy 5: No facingMode, just high quality
      if (!newStream) {
        try {
          newStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: highQualityConstraints
          });
          console.log("✅ Using fallback without facingMode");
        } catch (fallbackError) {
          console.log("High quality fallback failed:", fallbackError.message);
        }
      }

      // ✅ Strategy 6: Minimal constraints (last resort)
      if (!newStream) {
        try {
          newStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
              width: { ideal: 4096 },
              height: { ideal: 2160 }
            }
          });
          console.log("✅ Using minimal high-quality constraints");
        } catch (minimalError) {
          console.log("Minimal failed:", minimalError.message);

          // Absolute last resort
          newStream = await navigator.mediaDevices.getUserMedia({
            video: true
          });
          console.log("⚠️ Using basic video constraint");
        }
      }

      if (newStream) {
        // ✅ Store stream and set mode FIRST
        // The video element will be rendered, THEN we attach the stream via useEffect
        setStream(newStream);
        setPendingStream(newStream);
        setMode("camera"); // This renders the video element

        // The useEffect above will handle attaching the stream to the video element
      } else {
        throw new Error("Could not access any camera");
      }
    } catch (err) {
      console.error("Camera Error:", err);
      setIsCameraLoading(false);
      alert(
        "Unable to access camera. Please check:\n1. Camera permissions are allowed\n2. No other app is using the camera\n3. Try refreshing the page"
      );
      if (onCancel) {
        onCancel();
      } else {
        setMode("initial");
      }
    }
  };

  const switchCamera = async () => {
    const nextMode = facingMode === "user" ? "environment" : "user";

    setIsCameraLoading(true);

    // Clean up current stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setFacingMode(nextMode);

    // Small delay before requesting new stream
    await new Promise((resolve) => setTimeout(resolve, 300));

    const highQualityConstraints = {
      width: { ideal: 4096, min: 1280 },
      height: { ideal: 2160, min: 720 }
    };

    let newStream = null;

    // ✅ Strategy 1: exact facingMode
    try {
      newStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { exact: nextMode },
          ...highQualityConstraints
        }
      });
      console.log("✅ Switched with exact facingMode");
    } catch (err) {
      console.log("Exact switch failed:", err.message);
    }

    // ✅ Strategy 2: string facingMode
    if (!newStream) {
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: nextMode,
            ...highQualityConstraints
          }
        });
        console.log("✅ Switched with string facingMode");
      } catch (err) {
        console.log("String facingMode switch failed:", err.message);
      }
    }

    // ✅ Strategy 3: ideal facingMode
    if (!newStream) {
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: nextMode },
            ...highQualityConstraints
          }
        });
        console.log("✅ Switched with ideal facingMode");
      } catch (err) {
        console.log("Ideal switch failed:", err.message);
      }
    }

    // ✅ Strategy 4: Device enumeration
    if (!newStream) {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");

        if (videoDevices.length >= 2) {
          const currentSettings = stream?.getVideoTracks()[0]?.getSettings();
          const currentDeviceId = currentSettings?.deviceId;

          const otherCamera = videoDevices.find(
            (d) => d.deviceId !== currentDeviceId
          );

          if (otherCamera) {
            newStream = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: {
                deviceId: { exact: otherCamera.deviceId },
                ...highQualityConstraints
              }
            });
            console.log("✅ Switched using deviceId");
          }
        }
      } catch (err) {
        console.log("Device enumeration switch failed:", err.message);
      }
    }

    if (!newStream) {
      console.log("All switch methods failed, restarting camera...");
      setIsCameraLoading(false);
      await startCamera();
      return;
    }

    // ✅ Use the same pattern - set pending stream for useEffect to handle
    setStream(newStream);
    setPendingStream(newStream);
  };

  // Capture without stopping camera, add to images array
  const captureImage = () => {
    if (!videoRef.current) return;
    if (images.length >= maxImages) {
      alert(`Maximum ${maxImages} images allowed!`);
      return;
    }

    const video = videoRef.current;
    // ADD: Check if video is ready with valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error("Video not ready");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");

    // ADD: High quality rendering settings
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    //ctx.drawImage(video, 0, 0);

    const newImage = {
      id: generateId(),
      imgSrc: canvas.toDataURL("image/jpeg", 1.0),
      //imgSrc: canvas.toDataURL("image/png"),
      history: [],
      editedImgSrc: null
    };

    setImages((prev) => [...prev, newImage]);

    // Visual feedback - flash effect
    if (videoRef.current) {
      videoRef.current.style.opacity = "0.5";
      setTimeout(() => {
        if (videoRef.current) videoRef.current.style.opacity = "1";
      }, 100);
    }
  };

  const finishCapturing = () => {
    stopCamera();
    if (images.length > 0) {
      setCurrentImageIndex(0);
      setMode("editor");
    } else {
      setMode("initial");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (pendingStream) {
      pendingStream.getTracks().forEach((track) => track.stop());
      setPendingStream(null);
    }
    setIsCameraLoading(false);
  };

  // Handle multiple file upload
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);

    if (files.length === 0) {
      if (images.length === 0) {
        if (autoStartMode === "upload") handleCancel();
        else setMode("initial");
      }
      setIsInitializing(false);
      return;
    }

    const remainingSlots = maxImages - images.length;
    const filesToProcess = files.slice(0, remainingSlots);

    setIsUploading(true);
    setUploadProgress(0);
    setUploadTotal(filesToProcess.length);
    setMode("editor");

    // Process immediately - Blob creation is synchronous and fast
    const newImages = filesToProcess.map((file) => ({
      id: generateId(),
      imgSrc: URL.createObjectURL(file), // ✅ ZERO RAM USAGE vs Base64
      file: file, // ✅ Keep raw file for upload
      history: [],
      editedImgSrc: null,
      isRawFile: true // Flag to identify this hasn't been rasterized yet
    }));

    setImages((prev) => [...prev, ...newImages]);

    // Set current index if this is the first batch
    if (images.length === 0 && newImages.length > 0) {
      setCurrentImageIndex(0);
    }

    // Simulate progress for UI feedback (since createObjectURL is instant)
    setUploadProgress(filesToProcess.length);
    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadTotal(0);
    }, 500);

    e.target.value = "";
  };

  // ==========================================
  // 2. CANVAS RENDERING ENGINE
  // ==========================================

  // Keep full resolution, use CSS for display
  useEffect(() => {
    if (mode === "editor" && imgSrc && canvasRef.current && !canvasDisabled) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();

      // ✅ to allow editing external URLs
      img.crossOrigin = "anonymous";

      img.onload = () => {
        const screenW = window.innerWidth;
        const screenH = window.innerHeight;
        const headerHeight = 60;
        const toolbarHeight = deviceType === "mobile" ? 180 : 140;
        const thumbnailHeight = images.length > 0 ? 80 : 0;
        const padding = 20;

        const maxAvailableWidth = screenW - padding;
        const maxAvailableHeight =
          screenH - headerHeight - toolbarHeight - thumbnailHeight - padding;

        const scale = Math.min(
          maxAvailableWidth / img.width,
          maxAvailableHeight / img.height,
          1
        );

        // Keep canvas at FULL original resolution
        canvas.width = img.width;
        canvas.height = img.height;

        // Use CSS to scale the DISPLAY size only
        const displayWidth = img.width * scale;
        const displayHeight = img.height * scale;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;

        // ✅ Store both original and display sizes
        setCanvasSize({
          width: img.width, // Original resolution
          height: img.height, // Original resolution
          displayWidth: displayWidth, // CSS display size
          displayHeight: displayHeight,
          scale: scale // Scale factor for coordinate conversion
        });

        setContext(ctx);
        redrawCanvas(ctx, img, img.width, img.height);
      };
      img.src = imgSrc;
    }
  }, [mode, imgSrc, deviceType]);

  // Just make sure it uses the original dimensions
  useEffect(() => {
    if (context && imgSrc && canvasRef.current && !canvasDisabled) {
      const img = new Image();
      // ✅ this line here as well
      img.crossOrigin = "anonymous";
      img.onload = () => {
        // ✅ Check if canvas dimensions match the image dimensions
        // If they don't match, it means the main initialization effect hasn't finished resizing yet.
        // We abort to prevent the "tiled/glitched" render.
        const canvas = canvasRef.current;
        if (
          Math.abs(canvas.width - img.width) > 1 ||
          Math.abs(canvas.height - img.height) > 1
        ) {
          return;
        }

        // Uses full resolution width/height from the image itself
        redrawCanvas(context, img, img.width, img.height);
      };
      img.src = imgSrc;
    }
    // ✅ Added imgSrc and canvasSize to dependency array to ensure freshness
  }, [
    history,
    currentAction,
    zoom,
    pan,
    selectedElementId,
    hoveredElementId,
    imgSrc,
    canvasSize,
    canvasDisabled
  ]);

  const redrawCanvas = (ctx, img, width, height) => {
    if (!ctx) return;

    // ✅ ADD: Calculate scale factor for stroke widths
    const scaleFactor = Math.max(1, width / 1000);

    ctx.save();
    ctx.clearRect(0, 0, width, height);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);
    ctx.drawImage(img, 0, 0, width, height);

    [...history, currentAction].forEach((item) => {
      if (!item) return;

      ctx.strokeStyle = item.color;
      //  Scale the line width
      ctx.lineWidth = item.width * scaleFactor;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.fillStyle = item.color;

      if (item.type === "pen") {
        if (item.points && item.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(item.points[0].x, item.points[0].y);
          item.points.forEach((p) => ctx.lineTo(p.x, p.y));
          ctx.stroke();
        }
      } else if (item.type === "arrow") {
        //  Pass scaled width
        drawArrow(
          ctx,
          item.x,
          item.y,
          item.endX,
          item.endY,
          item.width * scaleFactor
        );
      } else if (item.type === "rect") {
        ctx.beginPath();
        ctx.strokeRect(item.x, item.y, item.w, item.h);
      } else if (item.type === "circle") {
        ctx.beginPath();
        ctx.ellipse(
          item.x + item.w / 2,
          item.y + item.h / 2,
          Math.abs(item.w / 2),
          Math.abs(item.h / 2),
          0,
          0,
          2 * Math.PI
        );
        ctx.stroke();
      } else if (item.type === "text") {
        //  Scale font size
        const baseFontSize = deviceType === "mobile" ? 20 : 24;
        const fontSize = Math.round(baseFontSize * scaleFactor);
        ctx.font = `bold ${fontSize}px sans-serif`;
        ctx.textBaseline = "middle";

        const textMetrics = ctx.measureText(item.text);
        const textWidth = textMetrics.width;
        const textHeight = fontSize;
        //  Scale padding
        const padding = 8 * scaleFactor;

        const isSelected = selectedElementId === item.id;
        const isHovered = hoveredElementId === item.id;

        if (isSelected || isHovered) {
          ctx.save();
          ctx.strokeStyle = isSelected ? "#3b82f6" : "#6b7280";
          //  Scale selection box stroke
          ctx.lineWidth = 2 * scaleFactor;
          ctx.setLineDash(
            isHovered && !isSelected ? [5 * scaleFactor, 5 * scaleFactor] : []
          );
          ctx.strokeRect(
            item.x - padding,
            item.y - textHeight / 2 - padding,
            textWidth + padding * 2,
            textHeight + padding * 2
          );
          ctx.setLineDash([]);
          ctx.restore();
        }

        ctx.fillStyle = item.color;
        ctx.fillText(item.text, item.x, item.y);
      }
    });

    ctx.restore();
  };

  // width is already scaled when passed
  const drawArrow = (ctx, fromX, fromY, toX, toY, width) => {
    // ✅ Arrow head scales with the line width (which is already scaled)
    const headlen = Math.max(width * 2, width * 4);
    const angle = Math.atan2(toY - fromY, toX - fromX);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headlen * Math.cos(angle - Math.PI / 6),
      toY - headlen * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      toX - headlen * Math.cos(angle + Math.PI / 6),
      toY - headlen * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fill();
  };

  // ==========================================
  // 3. ZOOM & PAN
  // ==========================================

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY * -0.001;
    setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && !isDrawing && !isDraggingElement) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      if (lastTouchDistance) {
        const delta = distance - lastTouchDistance;
        setZoom((prev) => Math.max(0.5, Math.min(3, prev + delta * 0.005)));
      }
      setLastTouchDistance(distance);
    }
  };

  const handleTouchEndZoom = () => setLastTouchDistance(null);

  // ==========================================
  // 4. TEXT ELEMENT DETECTION
  // ==========================================

  const getTextElementAtPosition = (pos) => {
    const fontSize = deviceType === "mobile" ? 20 : 24;
    const padding = 8;

    // Check in reverse order (top-most first)
    for (let i = history.length - 1; i >= 0; i--) {
      const item = history[i];
      if (item.type === "text") {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx) {
          ctx.font = `bold ${fontSize}px sans-serif`;
          const textMetrics = ctx.measureText(item.text);
          const textWidth = textMetrics.width;
          const textHeight = fontSize;

          const bounds = {
            left: item.x - padding,
            right: item.x + textWidth + padding,
            top: item.y - textHeight / 2 - padding,
            bottom: item.y + textHeight / 2 + padding
          };

          if (
            pos.x >= bounds.left &&
            pos.x <= bounds.right &&
            pos.y >= bounds.top &&
            pos.y <= bounds.bottom
          ) {
            return { item, index: i };
          }
        }
      }
    }
    return null;
  };

  // ==========================================
  // 5. INTERACTION HANDLERS
  // ==========================================

  // Account for display scaling
  const getCoords = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // ✅ Calculate the ratio between internal size and display size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // ✅ Convert screen coordinates to canvas coordinates
    const x = ((clientX - rect.left) * scaleX - pan.x) / zoom;
    const y = ((clientY - rect.top) * scaleY - pan.y) / zoom;

    return { x, y };
  };

  const handleMouseMove = (e) => {
    if (isDraggingElement && selectedElementId) {
      const pos = getCoords(e);
      setHistory((prev) =>
        prev.map((item) =>
          item.id === selectedElementId
            ? { ...item, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }
            : item
        )
      );
      return;
    }

    if (isDrawing) {
      handleMove(e);
      return;
    }

    // Hover detection for desktop
    if (deviceType === "desktop" && !isDrawing) {
      const pos = getCoords(e);
      const textElement = getTextElementAtPosition(pos);
      setHoveredElementId(textElement?.item?.id || null);
    }
  };

  const handleStart = (e) => {
    if (e.touches && e.touches.length > 1) return;

    const pos = getCoords(e);

    // Check if clicking on a text element
    const textElement = getTextElementAtPosition(pos);

    if (textElement) {
      setSelectedElementId(textElement.item.id);
      setDragOffset({
        x: pos.x - textElement.item.x,
        y: pos.y - textElement.item.y
      });

      // For touch devices, start long press timer
      if (e.touches) {
        setIsLongPressing(false);
        longPressTimerRef.current = setTimeout(() => {
          setIsLongPressing(true);
          setIsDraggingElement(true);
        }, 500);
      } else {
        // Desktop - immediate drag on click
        setIsDraggingElement(true);
      }
      return;
    }

    // Clear selection if clicking elsewhere
    setSelectedElementId(null);

    if (activeTool === "text") {
      setTextPos(pos);
      setShowTextInput(true);
      return;
    }

    setIsDrawing(true);
    setStartPos(pos);

    if (activeTool === "pen") {
      setCurrentAction({
        id: generateId(),
        type: "pen",
        color: color,
        width: lineWidth,
        points: [pos]
      });
    } else {
      setCurrentAction({
        id: generateId(),
        type: activeTool,
        color: color,
        width: lineWidth,
        x: pos.x,
        y: pos.y,
        w: 0,
        h: 0,
        endX: pos.x,
        endY: pos.y
      });
    }
  };

  const handleMove = (e) => {
    if (!isDrawing) return;
    if (e.touches && e.touches.length > 1) return;

    e.preventDefault();
    const pos = getCoords(e);

    if (activeTool === "pen") {
      setCurrentAction((prev) => ({
        ...prev,
        points: [...(prev?.points || []), pos]
      }));
    } else if (activeTool === "arrow") {
      setCurrentAction((prev) => ({ ...prev, endX: pos.x, endY: pos.y }));
    } else if (activeTool === "rect" || activeTool === "circle") {
      setCurrentAction((prev) => ({
        ...prev,
        w: pos.x - startPos.x,
        h: pos.y - startPos.y
      }));
    }
  };

  const handleEnd = () => {
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    if (isDraggingElement) {
      setIsDraggingElement(false);
      setIsLongPressing(false);
      updateCurrentImageHistory(history);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentAction) {
      const newHistory = [...history, currentAction];
      setHistory(newHistory);
      updateCurrentImageHistory(newHistory);
      setCurrentAction(null);
    }
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 1) {
      handleStart(e);
    }
  };

  const handleTouchMoveCanvas = (e) => {
    handleTouchMove(e);
    if (isDraggingElement) {
      e.preventDefault();
      const pos = getCoords(e);
      setHistory((prev) =>
        prev.map((item) =>
          item.id === selectedElementId
            ? { ...item, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y }
            : item
        )
      );
    } else if (isDrawing) {
      handleMove(e);
    }
  };

  const handleTouchEndCanvas = () => {
    handleEnd();
    handleTouchEndZoom();
  };

  const confirmText = () => {
    if (textValue.trim()) {
      const newTextItem = {
        id: generateId(),
        type: "text",
        text: textValue,
        x: textPos.x,
        y: textPos.y,
        color: color,
        width: lineWidth
      };
      const newHistory = [...history, newTextItem];
      setHistory(newHistory);
      updateCurrentImageHistory(newHistory);
    }
    setTextValue("");
    setShowTextInput(false);
  };

  const deleteSelectedElement = () => {
    if (selectedElementId) {
      const newHistory = history.filter(
        (item) => item.id !== selectedElementId
      );
      setHistory(newHistory);
      updateCurrentImageHistory(newHistory);
      setSelectedElementId(null);
    }
  };

  const undoLast = () => {
    const newHistory = history.slice(0, -1);
    setHistory(newHistory);
    updateCurrentImageHistory(newHistory);
    setSelectedElementId(null);
  };

  const clearAll = () => {
    if (window.confirm("Clear all edits on this image?")) {
      setHistory([]);
      updateCurrentImageHistory([]);
      setSelectedElementId(null);
    }
  };

  // ==========================================
  // 6. IMAGE MANAGEMENT
  // ==========================================

  const selectImage = (index) => {
    // Save current canvas state before switching
    if (canvasRef.current && currentImage) {
      const editedImgSrc = canvasRef.current.toDataURL("image/png");
      setImages((prev) =>
        prev.map((img, idx) =>
          idx === currentImageIndex ? { ...img, editedImgSrc, history } : img
        )
      );
    }
    setCurrentImageIndex(index);
  };

  const removeImage = (index, e) => {
    e.stopPropagation();
    if (window.confirm("Remove this image?")) {
      setImages((prev) => prev.filter((_, idx) => idx !== index));
      if (currentImageIndex >= index && currentImageIndex > 0) {
        setCurrentImageIndex((prev) => prev - 1);
      }
      if (images.length === 1) {
        setMode("initial");
      }
    }
  };

  // ==========================================
  // OPTIMIZED SAVE (Return Blobs/Files)
  // ==========================================
  const handleSave = () => {
    if (!onSave) return;
    if (isUploading) return;

    const savePromises = images.map((img, idx) => {
      return new Promise((resolve) => {
        // CASE A: Raw File, No Edits, Not Current Canvas
        // Optimization: Return the original file directly. No canvas processing needed.
        if (
          img.isRawFile &&
          (!img.history || img.history.length === 0) &&
          idx !== currentImageIndex
        ) {
          resolve({
            id: img.id,
            imgSrc: img.imgSrc, // This is a blob: URL
            file: img.file, // ✅ The raw File object
            isRaw: true,
            history: []
          });
          return;
        }

        // CASE B: Image is currently on Canvas (Grab visible state)
        if (idx === currentImageIndex && canvasRef.current && !canvasDisabled) {
          const originalZoom = zoom;
          const originalPan = { ...pan };

          // Reset view to capture full image
          setZoom(1);
          setPan({ x: 0, y: 0 });

          setTimeout(() => {
            try {
              // Convert Canvas to Blob (Binary) instead of Base64
              canvasRef.current.toBlob(
                (blob) => {
                  // Restore view
                  setZoom(originalZoom);
                  setPan(originalPan);

                  resolve({
                    id: img.id,
                    imgSrc: img.imgSrc, // Keep original preview
                    file: blob, // ✅ Edited image as Blob
                    isEdited: true,
                    history: img.history
                  });
                },
                "image/jpeg",
                0.9
              ); // 90% Quality
            } catch (e) {
              console.error("Canvas export failed (CORS). Saving original.", e);
              setZoom(originalZoom);
              setPan(originalPan);
              // Fallback to original if CORS fails
              resolve({
                id: img.id,
                imgSrc: img.imgSrc,
                file: img.file,
                history: []
              });
            }
          }, 50); // Small delay to allow react render cycle to reset zoom
        }
        // ✅ ADD: CASE B2: Current image but canvas is disabled - save as raw
        else if (idx === currentImageIndex && canvasDisabled) {
          resolve({
            id: img.id,
            imgSrc: img.imgSrc,
            file: img.file, // Original file
            isRaw: true,
            history: []
          });
        }

        // CASE C: Image has edits but is not currently displayed
        // We must recreate the canvas in memory
        else if (img.history && img.history.length > 0) {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          const image = new Image();

          // Important for existing server URLs
          image.crossOrigin = "anonymous";

          image.onload = () => {
            canvas.width = image.width;
            canvas.height = image.height;

            // 1. Draw original image
            ctx.drawImage(image, 0, 0);

            // 2. Re-apply history
            const scaleFactor = Math.max(1, image.width / 1000);

            img.history.forEach((item) => {
              ctx.strokeStyle = item.color;
              ctx.lineWidth = item.width * scaleFactor;
              ctx.lineCap = "round";
              ctx.lineJoin = "round";
              ctx.fillStyle = item.color;

              if (
                item.type === "pen" &&
                item.points &&
                item.points.length > 1
              ) {
                ctx.beginPath();
                ctx.moveTo(item.points[0].x, item.points[0].y);
                item.points.forEach((p) => ctx.lineTo(p.x, p.y));
                ctx.stroke();
              } else if (item.type === "arrow") {
                drawArrow(
                  ctx,
                  item.x,
                  item.y,
                  item.endX,
                  item.endY,
                  item.width * scaleFactor
                );
              } else if (item.type === "rect") {
                ctx.beginPath();
                ctx.strokeRect(item.x, item.y, item.w, item.h);
              } else if (item.type === "circle") {
                ctx.beginPath();
                ctx.ellipse(
                  item.x + item.w / 2,
                  item.y + item.h / 2,
                  Math.abs(item.w / 2),
                  Math.abs(item.h / 2),
                  0,
                  0,
                  2 * Math.PI
                );
                ctx.stroke();
              } else if (item.type === "text") {
                // Calculate font size roughly same as display
                const fontSize = Math.round(
                  (deviceType === "mobile" ? 20 : 24) * scaleFactor
                );
                ctx.font = `bold ${fontSize}px sans-serif`;
                ctx.textBaseline = "middle";
                ctx.fillText(item.text, item.x, item.y);
              }
            });

            // 3. Export to Blob
            try {
              canvas.toBlob(
                (blob) => {
                  resolve({
                    id: img.id,
                    imgSrc: img.imgSrc,
                    file: blob, // ✅ Edited Blob
                    isEdited: true,
                    history: img.history
                  });
                },
                "image/jpeg",
                0.9
              );
            } catch (e) {
              console.error("Background export failed", e);
              resolve({
                id: img.id,
                imgSrc: img.imgSrc,
                file: img.file || null,
                history: []
              });
            }
          };

          // Error loading image
          image.onerror = () => {
            resolve({
              id: img.id,
              imgSrc: img.imgSrc,
              file: img.file || null,
              history: []
            });
          };

          image.src = img.imgSrc;
        }
        // CASE D: Fallback (Existing URL, no edits)
        else {
          resolve({
            id: img.id,
            imgSrc: img.imgSrc,
            file: img.file || null, // Might be null if it was an existing URL image
            history: []
          });
        }
      });
    });

    Promise.all(savePromises).then((savedImages) => {
      onSave(savedImages);
    });
  };

  const handleCancel = () => {
    stopCamera();
    if (onCancel) {
      onCancel();
    }
  };

  const addMoreImages = () => {
    fileInputRef.current?.click();
  };

  // ==========================================
  // BACKGROUND REMOVAL HANDLER
  // ==========================================

  const handleRemoveBackground = async (backgroundColor = "#FFFFFF") => {
    if (!imgSrc) return;

    setShowBgColorPicker(false);

    try {
      const result = await removeImageBackground(imgSrc, {
        backgroundColor,
        quality: 0.95,
        outputFormat: "image/png"
      });

      if (result.success) {
        // Update the current image with the new background-removed image
        setImages((prev) =>
          prev.map((img, idx) =>
            idx === currentImageIndex
              ? {
                  ...img,
                  imgSrc: result.imageSrc,
                  // Clear history since we have a new base image
                  // Or you could keep it: history: img.history
                  history: []
                }
              : img
          )
        );

        // Clear current image history
        setHistory([]);
      }
    } catch (error) {
      console.error("Background removal failed:", error);
    }
  };

  // 4. UPDATE handleBgRemovalCancel
  const handleBgRemovalCancel = () => {
    cancelBgRemoval(); // Use the new cancel function
    resetBgRemovalState();
  };

  // const handleBgRemovalCancel = () => {
  //   resetBgRemovalState();
  // };

  const handleBgRemovalRetry = () => {
    resetBgRemovalState();
    setShowBgColorPicker(true);
  };

  // ==========================================
  // CROP HANDLER
  // ==========================================

  const handleCropClick = async () => {
    if (!imgSrc) return;

    try {
      const result = await openCropModal(imgSrc);

      if (result.success && result.imageSrc) {
        // Update the current image with the cropped version
        setImages((prev) =>
          prev.map((img, idx) =>
            idx === currentImageIndex
              ? {
                  ...img,
                  imgSrc: result.imageSrc,
                  // Clear history since we have a new base image
                  history: []
                }
              : img
          )
        );

        // Clear current image history
        setHistory([]);

        console.log("✅ Image cropped successfully", result.cropData);
      }
    } catch (error) {
      console.error("Crop failed:", error);
    }
  };

  const handleCropDone = (croppedImageSrc, cropData) => {
    // Update the current image with the cropped version
    setImages((prev) =>
      prev.map((img, idx) =>
        idx === currentImageIndex
          ? {
              ...img,
              imgSrc: croppedImageSrc,
              history: [] // Clear history for new cropped image
            }
          : img
      )
    );

    setHistory([]);
    handleCropComplete(croppedImageSrc, cropData);
  };

  // ==========================================
  // ROTATE HANDLER
  // ==========================================

  const handleRotateClick = async () => {
    if (!imgSrc || isRotating) return;

    setIsRotating(true);

    try {
      const result = await rotateImage(imgSrc);

      if (result.success) {
        // Update the current image with the rotated version
        setImages((prev) =>
          prev.map((img, idx) =>
            idx === currentImageIndex
              ? {
                  ...img,
                  imgSrc: result.imageSrc,
                  history: [] // Clear history for new rotated image
                }
              : img
          )
        );

        setHistory([]);
        console.log("✅ Image rotated successfully");
      }
    } catch (error) {
      console.error("Rotate failed:", error);
    } finally {
      setIsRotating(false);
    }
  };

  // ==========================================
  // FLIP HANDLER
  // ==========================================

  const handleFlipClick = async () => {
    if (!imgSrc || isFlipping) return;

    setIsFlipping(true);

    try {
      const result = await flipImageHorizontal(imgSrc);

      if (result.success) {
        // Update the current image with the flipped version
        setImages((prev) =>
          prev.map((img, idx) =>
            idx === currentImageIndex
              ? {
                  ...img,
                  imgSrc: result.imageSrc,
                  history: [] // Clear history for new flipped image
                }
              : img
          )
        );

        setHistory([]);
        console.log("✅ Image flipped successfully");
      }
    } catch (error) {
      console.error("Flip failed:", error);
    } finally {
      setIsFlipping(false);
    }
  };

  // ==========================================
  // ADJUST HANDLERS
  // ==========================================

  const handleAdjustClick = () => {
    setShowAdjustPanel(!showAdjustPanel);
    if (showAdjustPanel) {
      setActiveAdjustment(null);
    }
  };

  const handleAdjustmentChange = async (id, value) => {
    const newValues = { ...adjustmentValues, [id]: value };
    setAdjustmentValues(newValues);

    // Apply adjustments to preview (debounced in real implementation)
    // For now, we'll apply on confirm
  };

  const handleApplyAdjustments = async () => {
    if (!imgSrc) return;

    // Check if any adjustments were made
    const hasChanges = Object.values(adjustmentValues).some((v) => v !== 0);
    if (!hasChanges) {
      setShowAdjustPanel(false);
      setActiveAdjustment(null);
      return;
    }

    try {
      const result = await openAdjustPanel(imgSrc);

      // Apply the current adjustment values
      // This is handled by the adjust panel internally
    } catch (error) {
      console.error("Adjust failed:", error);
    }
  };

  const handleAdjustDone = (result) => {
    if (result.success && result.imageSrc) {
      setImages((prev) =>
        prev.map((img, idx) =>
          idx === currentImageIndex
            ? {
                ...img,
                imgSrc: result.imageSrc,
                history: []
              }
            : img
        )
      );

      setHistory([]);

      // Reset adjustment values
      setAdjustmentValues({
        exposure: 0,
        brightness: 0,
        contrast: 0,
        highlights: 0,
        saturation: 0,
        vibrance: 0
      });
    }

    setShowAdjustPanel(false);
    setActiveAdjustment(null);
  };

  // Close adjust panel when clicking outside or changing images
  useEffect(() => {
    setShowAdjustPanel(false);
    setActiveAdjustment(null);
    setAdjustmentValues({
      exposure: 0,
      brightness: 0,
      contrast: 0,
      highlights: 0,
      saturation: 0,
      vibrance: 0
    });
  }, [currentImageIndex]);

  // ==========================================
  // 7. UI RENDERING
  // ==========================================

  return createPortal(
    <div className="fixed inset-0 w-full h-full h-[100dvh] bg-black/95 z-[9999] flex flex-col overflow-hidden overscroll-none touch-none">
      {/* HEADER */}
      <div className="relative z-50 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-2 sm:p-3 flex justify-between items-center flex-shrink-0 border-b border-white/10 safe-area-top">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
            <PenTool className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-xs sm:text-sm font-bold text-white">
              Image Editor Pro
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-[10px] text-indigo-100 hidden sm:block">
                {images.length > 0
                  ? `${images.length}/${maxImages} images`
                  : "Professional QA Annotation Tool"}
              </p>
              {/* NEW: Model status indicator */}
              <ModelStatusIndicator className="hidden sm:flex" />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {mode === "editor" && images.length > 0 && (
            <button
              onClick={handleSave}
              disabled={isUploading} // Disable button
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all shadow-lg ${
                isUploading
                  ? "bg-gray-500 text-gray-300 cursor-not-allowed" // Visual feedback
                  : "bg-white/90 hover:bg-white text-indigo-600 hover:shadow-xl active:scale-95"
              }`}
            >
              {isUploading ? (
                <Loader className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              )}
              <span>{isUploading ? "Loading..." : "Save All"}</span>
            </button>
          )}

          <button
            onClick={handleCancel}
            className="p-1.5 hover:bg-white/20 rounded-lg transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden bg-gray-900 min-h-0"
        ref={containerRef}
      >
        {/* Loading State */}
        {isInitializing && (
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-12 h-12 text-indigo-500 animate-spin" />
            <p className="text-white text-sm">Initializing...</p>
          </div>
        )}

        {/* STATE: INITIAL */}
        {(mode === "initial" || mode === "initializing") && (
          <div className="text-center space-y-6 p-4 sm:p-8">
            {mode === "initializing" || isInitializing ? (
              <div className="flex flex-col items-center gap-4">
                <Loader className="w-12 h-12 text-indigo-500 animate-spin" />
                <p className="text-white text-sm">
                  {isUploading
                    ? "Uploading in Progress..."
                    : autoStartMode === "camera"
                    ? "Starting camera..."
                    : "Processing..."}
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-row justify-center gap-3 sm:gap-6">
                  <button
                    onClick={startCamera}
                    className="group flex flex-col items-center justify-center w-28 h-28 sm:w-40 sm:h-40 bg-gray-800 hover:bg-indigo-600 border-2 border-gray-700 hover:border-indigo-500 rounded-2xl transition-all duration-300 shadow-lg"
                  >
                    <Camera className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 group-hover:text-white mb-2 sm:mb-3" />
                    <span className="text-xs sm:text-base text-gray-300 group-hover:text-white font-semibold">
                      Take Photos
                    </span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="group flex flex-col items-center justify-center w-28 h-28 sm:w-40 sm:h-40 bg-gray-800 hover:bg-emerald-600 border-2 border-gray-700 hover:border-emerald-500 rounded-2xl cursor-pointer transition-all duration-300 shadow-lg"
                  >
                    <Upload className="w-8 h-8 sm:w-12 sm:h-12 text-gray-400 group-hover:text-white mb-2 sm:mb-3" />
                    <span className="text-xs sm:text-base text-gray-300 group-hover:text-white font-semibold">
                      Upload
                    </span>
                  </button>
                </div>

                {/* ✅ ADD PROGRESS BAR HERE */}
                {isUploading && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-center gap-2 text-sm text-indigo-400">
                      <Loader className="w-4 h-4 animate-spin" />
                      <span>
                        Uploading {uploadProgress} of {uploadTotal} images...
                      </span>
                    </div>
                    <div className="w-full max-w-md mx-auto bg-gray-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300 ease-out"
                        style={{
                          width: `${(uploadProgress / uploadTotal) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                )}

                <p className="text-gray-500 text-sm">Max {maxImages} images</p>
              </>
            )}
          </div>
        )}

        {/* STATE: CAMERA */}
        {mode === "camera" && (
          <div className="relative w-full h-full bg-black flex flex-col">
            {/* ✅ ADD: Camera Loading Overlay */}
            {isCameraLoading && (
              <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80">
                <Loader className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
                <p className="text-white text-sm">Starting camera...</p>
                <p className="text-gray-400 text-xs mt-2">Please wait</p>
              </div>
            )}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full flex-1 object-contain transition-opacity duration-100"
              style={{ opacity: isCameraLoading ? 0.3 : 1 }} // ✅ Dim while loading
            />

            {/* Captured Images Preview */}
            {images.length > 0 && (
              <div className="absolute top-4 left-4 right-4 flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <div
                    key={img.id}
                    className="relative flex-shrink-0 w-12 h-12 sm:w-16 sm:h-16 rounded-lg overflow-hidden border-2 border-white/50"
                  >
                    <img
                      src={img.imgSrc}
                      alt={`Capture ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-[10px] text-center py-0.5">
                      {idx + 1}
                    </span>
                    <button
                      onClick={(e) => removeImage(idx, e)}
                      className="absolute top-0 right-0 bg-red-500 rounded-bl-lg p-0.5"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="absolute bottom-8 left-0 right-0 flex items-center justify-center gap-4 sm:gap-8 safe-area-bottom">
              <div className="flex items-center gap-4 sm:gap-8 bg-black/50 px-4 sm:px-8 py-4 rounded-full backdrop-blur-md border border-white/10">
                <button
                  onClick={() => {
                    stopCamera();
                    if (images.length > 0) {
                      setMode("editor");
                    } else {
                      handleCancel();
                    }
                  }}
                  className="p-2 sm:p-3 bg-gray-700 rounded-full text-white hover:bg-gray-600 transition-colors"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                <div className="flex flex-col items-center">
                  <button
                    onClick={captureImage}
                    disabled={images.length >= maxImages || isCameraLoading} // ✅ Disable while loading
                    className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-full border-4 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] hover:scale-105 transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span className="text-white text-xs mt-1">
                    {images.length}/{maxImages}
                  </span>
                </div>

                {images.length > 0 ? (
                  <button
                    onClick={finishCapturing}
                    className="p-2 sm:p-3 bg-green-600 rounded-full text-white hover:bg-green-500 transition-colors"
                    title="Done Capturing"
                  >
                    <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                ) : (
                  deviceType !== "desktop" && (
                    <button
                      onClick={switchCamera}
                      disabled={isCameraLoading} // ✅ Disable while loading
                      className="p-2 sm:p-3 bg-gray-700 rounded-full text-white hover:bg-gray-600 transition-colors"
                      title="Switch Camera"
                    >
                      <SwitchCamera className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* STATE: EDITOR */}
        {mode === "editor" && (
          <>
            {/* ✅ LOADING STATE - Show when uploading but NO image loaded yet */}
            {isUploading && !imgSrc && (
              <div className="absolute inset-0 bg-black/90 z-50 flex flex-col items-center justify-center gap-6 p-4">
                <div className="relative">
                  <Loader className="w-16 h-16 text-indigo-500 animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-indigo-500/20 rounded-full animate-ping"></div>
                  </div>
                </div>

                <div className="text-white text-center space-y-3">
                  <p className="text-xl font-bold">Processing Images...</p>
                  <p className="text-sm text-gray-300">
                    Please wait while we prepare your images
                  </p>

                  {/* Progress Counter */}
                  <div className="flex items-center justify-center gap-2 text-indigo-400 font-mono text-sm mt-4">
                    <span className="text-2xl font-bold">{uploadProgress}</span>
                    <span className="text-gray-500">/</span>
                    <span className="text-lg">{uploadTotal}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-sm space-y-2">
                  <div className="bg-gray-800 rounded-full h-2 overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-500 ease-out relative overflow-hidden"
                      style={{
                        width: `${(uploadProgress / uploadTotal) * 100}%`
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                  <p className="text-xs text-center text-gray-400">
                    {Math.round((uploadProgress / uploadTotal) * 100)}% Complete
                  </p>
                </div>
              </div>
            )}

            {/* ✅ CANVAS DISABLED WARNING */}
            {imgSrc && canvasDisabled && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900/95 z-40 p-6">
                <div className="max-w-md text-center space-y-4">
                  <div className="w-16 h-16 mx-auto bg-amber-500/20 rounded-full flex items-center justify-center">
                    <Camera className="w-8 h-8 text-amber-500" />
                  </div>

                  <h3 className="text-xl font-bold text-white">
                    Canvas Editing Disabled
                  </h3>

                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                    <p className="text-sm text-amber-200 mb-2">
                      Total image size:{" "}
                      <span className="font-bold">
                        {totalImageSizeMB.toFixed(2)} MB
                      </span>
                    </p>
                    <p className="text-sm text-amber-200">
                      Limit for {deviceType}:{" "}
                      <span className="font-bold">
                        {CANVAS_SIZE_LIMIT_MB} MB
                      </span>
                    </p>
                  </div>

                  <div className="text-gray-300 text-sm space-y-2">
                    <p>
                      To prevent browser crashes, canvas editing is disabled
                      when total image size is too large.
                    </p>
                    <p className="text-amber-400 font-medium">
                      ✓ You can still save all {images.length} image(s)
                    </p>
                    <p className="text-gray-400 text-xs">
                      Tip: Edit images individually or use smaller file sizes
                    </p>
                  </div>

                  {/* Show image thumbnails */}
                  <div className="flex flex-wrap justify-center gap-2 mt-4">
                    {images.slice(0, 5).map((img, idx) => (
                      <div key={img.id} className="relative w-16 h-16">
                        <img
                          src={img.imgSrc}
                          alt={`Image ${idx + 1}`}
                          className="w-full h-full object-cover rounded-lg border-2 border-gray-600"
                        />
                        <span className="absolute -top-2 -right-2 w-5 h-5 bg-indigo-500 text-white text-xs rounded-full flex items-center justify-center">
                          {idx + 1}
                        </span>
                      </div>
                    ))}
                    {images.length > 5 && (
                      <div className="w-16 h-16 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center text-gray-400 text-xs">
                        +{images.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ✅ CANVAS & CONTROLS - Only show when image exists */}
            {imgSrc && !canvasDisabled && (
              <>
                {/* Upload Progress Indicator (compact, when adding more images) */}
                {isUploading && (
                  <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-black/80 backdrop-blur-sm px-6 py-3 rounded-full border border-indigo-500/50 shadow-lg">
                    <div className="flex items-center gap-3 text-white">
                      <Loader className="w-5 h-5 text-indigo-400 animate-spin" />
                      <div className="text-sm font-medium">
                        Loading {uploadProgress}/{uploadTotal}
                      </div>
                      <div className="w-24 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-all duration-300"
                          style={{
                            width: `${(uploadProgress / uploadTotal) * 100}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Canvas */}
                <canvas
                  id="image-editor-canvas"
                  ref={canvasRef}
                  onMouseDown={handleStart}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleEnd}
                  onMouseLeave={handleEnd}
                  onWheel={handleWheel}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMoveCanvas}
                  onTouchEnd={handleTouchEndCanvas}
                  className={`object-contain shadow-2xl block ${
                    isDraggingElement
                      ? "cursor-move"
                      : hoveredElementId
                      ? "cursor-pointer"
                      : "cursor-crosshair"
                  } ${isDraggingElement ? "" : "touch-none"}`}
                  style={{
                    transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${
                      pan.y / zoom
                    }px)`,
                    transformOrigin: "center center"
                  }}
                />

                {/* Selected Element Controls */}
                {selectedElementId && (
                  <div className="absolute top-4 right-4 bg-gray-800 rounded-lg p-2 flex gap-2 shadow-lg z-50">
                    <button
                      onClick={() => setIsDraggingElement(true)}
                      className="p-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-colors"
                      title="Move"
                    >
                      <Move className="w-4 h-4" />
                    </button>
                    <button
                      onClick={deleteSelectedElement}
                      className="p-2 bg-red-600 rounded-lg text-white hover:bg-red-500 transition-colors"
                      title="Delete"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {/* Long press indicator */}
                {isLongPressing && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
                      Dragging enabled - Move your finger
                    </div>
                  </div>
                )}

                {/* Text Input Modal */}
                {showTextInput && (
                  <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-2xl w-full max-w-md">
                      <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">
                        Enter Text
                      </h3>
                      <input
                        type="text"
                        value={textValue}
                        onChange={(e) => setTextValue(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && confirmText()}
                        autoFocus
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white mb-4 focus:ring-2 focus:ring-indigo-500 outline-none"
                        placeholder="Defect note..."
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setShowTextInput(false);
                            setTextValue("");
                          }}
                          className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={confirmText}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                        >
                          Add Text
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Background Removal Progress Modal */}
                <BackgroundRemovalModal
                  isOpen={isBgRemoving}
                  progress={bgRemovalProgress}
                  progressMessage={bgRemovalMessage}
                  error={bgRemovalError}
                  onCancel={handleBgRemovalCancel}
                  onRetry={handleBgRemovalRetry}
                  isCached={isModelCached}
                />

                {/* Background Color Picker Modal */}
                <BackgroundColorPicker
                  isOpen={showBgColorPicker}
                  currentColor={bgRemovalColor}
                  onSelect={(color) => {
                    setBgRemovalColor(color);
                    handleRemoveBackground(color);
                  }}
                  onCancel={() => setShowBgColorPicker(false)}
                  isCached={isModelCached}
                />

                {/* Crop Modal */}
                <ImageCropModal
                  isOpen={isCropOpen}
                  imageSrc={cropImageSrc}
                  originalDimensions={cropOriginalDimensions}
                  onComplete={handleCropDone}
                  onCancel={handleCropCancel}
                  quality={1.0}
                  outputFormat="image/png"
                />
              </>
            )}
          </>
        )}
      </div>

      {/* IMAGE THUMBNAILS (Editor Only) */}
      {mode === "editor" && images.length > 0 && (
        <div className="bg-gray-900 border-t border-gray-700 p-2 flex-shrink-0 z-40">
          {/* ✅ ADD: Size indicator header */}
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-xs text-gray-400">{images.length} image(s)</p>
            <p
              className={`text-xs font-bold ${
                canvasDisabled ? "text-amber-400" : "text-gray-400"
              }`}
            >
              Total: {totalImageSizeMB.toFixed(2)} MB / {CANVAS_SIZE_LIMIT_MB}{" "}
              MB
            </p>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-2">
            {images.map((img, idx) => (
              <div
                key={img.id}
                onClick={() => selectImage(idx)}
                className={`relative flex-shrink-0 cursor-pointer transition-all ${
                  idx === currentImageIndex
                    ? "ring-2 ring-indigo-500 ring-offset-2 ring-offset-gray-900"
                    : "opacity-70 hover:opacity-100"
                } ${canvasDisabled ? "cursor-not-allowed opacity-50" : ""}`}
              >
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden bg-gray-800">
                  <img
                    src={img.imgSrc}
                    alt={`Image ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="absolute -top-2 -left-2 w-5 h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                  {idx + 1}
                </span>

                {/* ✅ ADD: Size badge */}
                {img.file?.size && (
                  <span className="absolute -bottom-1 left-0 right-0 bg-black/80 text-white text-[8px] text-center py-0.5 backdrop-blur-sm">
                    {(img.file.size / 1024 / 1024).toFixed(1)}MB
                  </span>
                )}

                <button
                  onClick={(e) => removeImage(idx, e)}
                  className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}

            {/* Add More Button */}
            {images.length < maxImages && (
              <button
                onClick={addMoreImages}
                className="flex-shrink-0 w-14 h-14 sm:w-16 sm:h-16 rounded-lg border-2 border-dashed border-gray-600 hover:border-indigo-500 flex items-center justify-center text-gray-500 hover:text-indigo-400 transition-colors"
              >
                <Plus className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* TOOLBAR (Editor Only) */}
      {mode === "editor" && (
        <div className="bg-gray-800 border-t border-gray-700 flex-shrink-0 safe-area-bottom z-50 relative">
          {/* ✅ ADD: Canvas Disabled Warning Banner */}
          {canvasDisabled && (
            <div className="p-2 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <p className="text-xs text-amber-200 font-medium">
                Editing disabled ({totalImageSizeMB.toFixed(1)}MB exceeds{" "}
                {CANVAS_SIZE_LIMIT_MB}MB limit)
              </p>
            </div>
          )}

          {/* Settings Panel */}
          {showSettings && !canvasDisabled && (
            <div className="p-3 border-b border-gray-700 bg-gray-900/50">
              <div className="flex flex-wrap items-center justify-center gap-4">
                <div className="flex gap-2 items-center">
                  <Palette className="w-4 h-4 text-gray-400" />
                  {[
                    "#ef4444",
                    "#22c55e",
                    "#3b82f6",
                    "#eab308",
                    "#ffffff",
                    "#000000"
                  ].map((c) => (
                    <button
                      key={c}
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        color === c
                          ? "border-white scale-110 ring-2 ring-offset-1 ring-offset-gray-800 ring-indigo-500"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-2">
                  <button
                    onClick={() => setLineWidth(Math.max(1, lineWidth - 2))}
                    className="p-1 hover:bg-gray-600 rounded transition-colors text-white"
                    disabled={lineWidth <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2 min-w-[60px] justify-center">
                    <div
                      className="rounded-full"
                      style={{
                        width: `${lineWidth * 2}px`,
                        height: `${lineWidth * 2}px`,
                        backgroundColor: color
                      }}
                    />
                    <span className="text-xs font-bold text-white">
                      {lineWidth}px
                    </span>
                  </div>
                  <button
                    onClick={() => setLineWidth(Math.min(20, lineWidth + 2))}
                    className="p-1 hover:bg-gray-600 rounded transition-colors text-white"
                    disabled={lineWidth >= 20}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ✅ ADJUST PANEL */}
          <AdjustToolbarPanel
            isOpen={showAdjustPanel}
            values={adjustmentValues}
            onValueChange={handleAdjustmentChange}
            onClose={() => {
              setShowAdjustPanel(false);
              setActiveAdjustment(null);
            }}
            activeAdjustment={activeAdjustment}
            onSelectAdjustment={setActiveAdjustment}
          />

          {/* Main Toolbar */}
          <div className="p-2 flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide">
            <div className="flex gap-1">
              {[
                { id: "pen", icon: PenTool },
                { id: "arrow", icon: ArrowRight },
                { id: "rect", icon: Square },
                { id: "circle", icon: CircleIcon },
                { id: "text", icon: Type }
              ].map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => {
                    setActiveTool(tool.id);
                    setSelectedElementId(null);
                  }}
                  className={`p-2 rounded-lg transition-all ${
                    activeTool === tool.id
                      ? "bg-indigo-600 text-white"
                      : "text-gray-400 hover:bg-gray-700 hover:text-white"
                  }`}
                  title={tool.id}
                >
                  <tool.icon className="w-5 h-5" />
                </button>
              ))}
              {/* Divider */}
              <div className="w-px h-6 bg-gray-600 mx-1" />

              {/* ✅ ROTATE BUTTON */}
              <button
                onClick={handleRotateClick}
                disabled={!imgSrc || isRotating}
                className={`p-2 rounded-lg transition-all text-blue-400 hover:bg-blue-900/30 hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 ${
                  isRotating ? "animate-spin" : ""
                }`}
                title="Rotate 90° Counter-clockwise"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* ✅ FLIP BUTTON */}
              <button
                onClick={handleFlipClick}
                disabled={!imgSrc || isFlipping}
                className={`p-2 rounded-lg transition-all text-purple-400 hover:bg-purple-900/30 hover:text-purple-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 ${
                  isFlipping ? "animate-pulse" : ""
                }`}
                title="Flip Horizontal"
              >
                <FlipHorizontal2 className="w-5 h-5" />
              </button>

              {/* ✅ CROP BUTTON*/}
              <button
                onClick={handleCropClick}
                disabled={!imgSrc}
                className="p-2 rounded-lg transition-all text-amber-400 hover:bg-amber-900/30 hover:text-amber-300 disabled:opacity-30 disabled:cursor-not-allowed"
                title="Crop Image"
              >
                <Crop className="w-5 h-5" />
              </button>

              {/* Divider */}
              <div className="w-px h-6 bg-gray-600 mx-1" />
              {/* Background Removal Button */}
              <button
                onClick={() => setShowBgColorPicker(true)}
                disabled={!imgSrc || isBgRemoving}
                className={`p-2 rounded-lg transition-all relative group ${
                  isBgRemoving
                    ? "bg-emerald-600/20 text-emerald-400"
                    : isModelCached
                    ? "text-green-400 hover:bg-green-900/30 hover:text-green-300"
                    : "text-emerald-400 hover:bg-emerald-900/30 hover:text-emerald-300"
                } disabled:opacity-30 disabled:cursor-not-allowed`}
                title={
                  isModelCached
                    ? "Remove Background (AI Ready)"
                    : "Remove Background (Will download AI model)"
                }
              >
                {isBgRemoving ? (
                  <Loader className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Eraser className="w-5 h-5" />
                    {/* Green dot indicator when cached */}
                    {isModelCached && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-gray-800"></span>
                    )}
                  </>
                )}
                {/* Tooltip on hover */}
                <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {isModelCached
                    ? "AI Ready - Instant Processing"
                    : "First use downloads AI model"}
                </span>
              </button>
            </div>

            <div className="flex gap-1 items-center bg-gray-700 rounded-lg px-2">
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-gray-600 rounded transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4 text-white" />
              </button>
              <span className="text-xs font-bold text-white px-2 min-w-[50px] text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-gray-600 rounded transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="flex gap-1 items-center">
              {/* ✅ ADJUST BUTTON */}
              <button
                onClick={handleAdjustClick}
                disabled={!imgSrc}
                className={`p-2 rounded-lg transition-all relative ${
                  showAdjustPanel
                    ? "bg-cyan-600 text-white"
                    : "text-cyan-400 hover:bg-cyan-900/30 hover:text-cyan-300"
                } disabled:opacity-30 disabled:cursor-not-allowed`}
                title="Adjust Image"
              >
                <SlidersHorizontal className="w-5 h-5" />
                {Object.values(adjustmentValues).some((v) => v !== 0) &&
                  !showAdjustPanel && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-gray-800" />
                  )}
              </button>

              {/* Settings Button */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-2 rounded-lg transition-all ${
                  showSettings
                    ? "bg-indigo-600 text-white"
                    : "text-gray-400 hover:bg-gray-700 hover:text-white"
                }`}
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              {/* Undo Button */}
              <button
                onClick={undoLast}
                disabled={history.length === 0}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Undo"
              >
                <Undo2 className="w-5 h-5" />
              </button>

              {/* Clear All Button */}
              <button
                onClick={clearAll}
                disabled={history.length === 0}
                className="p-2 rounded-lg text-red-400 hover:bg-red-900/30 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Clear All"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for adding more images */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileUpload}
      />

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .safe-area-top {
          padding-top: env(safe-area-inset-top);
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>,
    document.body
  );
};

export default YPivotQATemplatesImageEditor;
