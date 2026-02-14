import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef
} from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../../config";

const PhotoUploadContext = createContext();

export const usePhotoUpload = () => useContext(PhotoUploadContext);

export const PhotoUploadProvider = ({ children, reportId }) => {
  // Queue: Array of { id, sectionId, itemNo, images, ... }
  const [uploadQueue, setUploadQueue] = useState([]);

  // Status: Map of `${sectionId}_${itemNo}` -> { status: 'pending'|'uploading'|'success'|'error', progress: 0, total: 0 }
  const [uploadStatus, setUploadStatus] = useState({});

  const isProcessingRef = useRef(false);

  // Helper: Small delay to allow UI updates and GC to run
  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // =========================================================
  // HELPER: Image Compression (Optimized for Low Memory)
  // =========================================================
  const compressToBlob = async (source, maxWidth = 1920, quality = 0.7) => {
    return new Promise((resolve) => {
      // Optimization: If source is a File and size is small (< 300KB), skip compression to save RAM
      if (source instanceof File && source.size < 300 * 1024) {
        resolve(source);
        return;
      }

      // Create an image object
      const img = new Image();

      // Handle File/Blob objects vs Base64/URL strings
      let src = "";
      let isObjectUrl = false;

      if (source instanceof Blob || source instanceof File) {
        src = URL.createObjectURL(source);
        isObjectUrl = true;
      } else {
        src = source;
      }

      img.src = src;

      img.onload = () => {
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        // Draw to canvas
        let canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        let ctx = canvas.getContext("2d");

        // Image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        ctx.drawImage(img, 0, 0, width, height);

        // Export as BLOB (Binary)
        canvas.toBlob(
          (blob) => {
            // ✅ CRITICAL MEMORY CLEANUP
            if (isObjectUrl) URL.revokeObjectURL(src);

            // Clear canvas references to help Garbage Collector
            ctx = null;
            canvas.width = 0;
            canvas.height = 0;
            canvas = null;
            img.src = "";

            resolve(blob);
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => {
        console.warn("Image compression failed, using original");
        if (isObjectUrl) URL.revokeObjectURL(src);
        resolve(source); // Return original if compression fails
      };
    });
  };

  // =========================================================
  // ACTION: Add to Upload Queue (Sequential Processing)
  // =========================================================
  const addToUploadQueue = useCallback(async (payload) => {
    const { sectionId, itemNo, images } = payload;
    const uniqueKey = `${sectionId}_${itemNo}`;

    // 1. Set Initial Status
    setUploadStatus((prev) => ({
      ...prev,
      [uniqueKey]: { status: "compressing", progress: 0, total: images.length }
    }));

    // 2. Process Images SEQUENTIALLY to prevent Memory Crashes
    const processedImages = [];

    // We use a for loop instead of Promise.all to ensure one finishes before the next starts
    for (let i = 0; i < images.length; i++) {
      const img = images[i];

      // Update UI with granular progress (e.g. "Compressing 1/5")
      setUploadStatus((prev) => ({
        ...prev,
        [uniqueKey]: {
          status: "compressing",
          progress: i + 1,
          total: images.length
        }
      }));

      // ✅ PAUSE: Give the browser 50ms to breathe and Garbage Collect previous canvas
      await delay(50);

      try {
        // A. If it's a Raw File or Edited Blob -> Compress it
        if (img.file instanceof Blob || img.file instanceof File) {
          const compressedBlob = await compressToBlob(img.file);
          processedImages.push({ ...img, file: compressedBlob });
        }
        // B. If it's a new Base64 string -> Compress to Blob
        else if (img.imgSrc && img.imgSrc.startsWith("data:image")) {
          const compressedBlob = await compressToBlob(img.imgSrc);
          processedImages.push({ ...img, file: compressedBlob });
        }
        // C. Existing URL -> Pass through
        else {
          processedImages.push(img);
        }
      } catch (err) {
        console.error("Compression error for image index " + i, err);
        // Fallback: push original if compression fails
        processedImages.push(img);
      }
    }

    // 3. Add to Queue
    setUploadQueue((prev) => [
      ...prev,
      { ...payload, images: processedImages, uniqueKey }
    ]);

    // 4. Update Status to Queued
    setUploadStatus((prev) => ({
      ...prev,
      [uniqueKey]: { status: "queued", progress: 0, total: images.length }
    }));
  }, []);

  // =========================================================
  // WORKER: Process Queue (Multipart + JSON)
  // =========================================================

  useEffect(() => {
    const processQueue = async () => {
      if (isProcessingRef.current || uploadQueue.length === 0) return;

      isProcessingRef.current = true;
      const currentTask = uploadQueue[0];
      const {
        uniqueKey,
        reportId: taskReportId,
        sectionId,
        itemNo,
        images,
        sectionName,
        itemName,
        remarks
      } = currentTask;

      try {
        setUploadStatus((prev) => ({
          ...prev,
          [uniqueKey]: {
            status: "uploading",
            progress: 0,
            total: images.length
          }
        }));

        const targetReportId = taskReportId || reportId;
        if (!targetReportId) throw new Error("Report ID missing");

        // --- BUILD FORM DATA ---
        const formData = new FormData();
        formData.append("reportId", targetReportId);
        formData.append("sectionId", sectionId);
        formData.append("itemNo", itemNo);
        if (sectionName) formData.append("sectionName", sectionName);
        if (itemName) formData.append("itemName", itemName);
        if (remarks) formData.append("remarks", remarks);

        const imageMeta = [];

        images.forEach((img, idx) => {
          // CASE A: Binary file
          if (
            img.file &&
            (img.file instanceof Blob || img.file instanceof File)
          ) {
            const ext = img.file.type.split("/")[1] || "jpg";
            const fileName = `image_${idx}.${ext}`;

            formData.append("images", img.file, fileName);

            imageMeta.push({
              type: "file",
              id: img.id,
              index: idx
            });
          }
          // CASE B: Existing server URL
          else if (
            img.url &&
            typeof img.url === "string" &&
            img.url.includes("/storage/")
          ) {
            imageMeta.push({
              type: "url",
              id: img.id,
              imageURL: img.url,
              index: idx
            });
          }
          // CASE C: Error state (Blob URL without file)
          else if (
            img.url &&
            typeof img.url === "string" &&
            img.url.startsWith("blob:")
          ) {
            console.warn("⚠️ DETECTED BLOB URL WITHOUT FILE - SKIPPING:", img);
          }
        });

        formData.append("imageMetadata", JSON.stringify(imageMeta));

        // --- SEND REQUEST ---
        const response = await axios.post(
          `${API_BASE_URL}/api/fincheck-inspection/upload-photo-batch`,
          formData,
          {
            headers: { "Content-Type": "multipart/form-data" },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              // Calculate visual progress (0-100% of the bar)
              const simulatedItemProgress = Math.floor(
                (percentCompleted / 100) * images.length
              );

              setUploadStatus((prev) => ({
                ...prev,
                [uniqueKey]: {
                  ...prev[uniqueKey],
                  status: "uploading",
                  progress: simulatedItemProgress
                }
              }));
            }
          }
        );

        if (response.data.success) {
          setUploadStatus((prev) => ({
            ...prev,
            [uniqueKey]: {
              status: "success",
              progress: images.length,
              total: images.length
            }
          }));

          // Trigger Success Callback
          if (
            currentTask.onSuccess &&
            response.data.data &&
            response.data.data.savedImages
          ) {
            currentTask.onSuccess(response.data.data.savedImages);
          }

          setTimeout(() => {
            setUploadStatus((prev) => {
              const newState = { ...prev };
              delete newState[uniqueKey];
              return newState;
            });
          }, 3000);
        } else {
          throw new Error(response.data.message);
        }
      } catch (error) {
        console.error("Background Upload Error:", error);
        setUploadStatus((prev) => ({
          ...prev,
          [uniqueKey]: {
            status: "error",
            progress: 0,
            total: images.length,
            error: error.message
          }
        }));
      } finally {
        setUploadQueue((prev) => prev.slice(1));
        isProcessingRef.current = false;
      }
    };

    processQueue();
  }, [uploadQueue, reportId]);

  return (
    <PhotoUploadContext.Provider value={{ addToUploadQueue, uploadStatus }}>
      {children}
    </PhotoUploadContext.Provider>
  );
};
