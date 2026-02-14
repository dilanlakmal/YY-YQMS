/**
 * Image Processor Worker Helper
 * Provides fast image processing using Web Workers with OffscreenCanvas
 */

// Worker code as a string (will be converted to blob URL)
const workerCode = `
self.onmessage = async (e) => {
  const { id, file, maxWidth, quality } = e.data;
  
  try {
    // Create bitmap from file (works in Web Worker)
    const bitmap = await createImageBitmap(file);
    
    // Calculate new dimensions maintaining aspect ratio
    let width = bitmap.width;
    let height = bitmap.height;
    
    if (width > maxWidth) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    }
    
    // Create OffscreenCanvas (faster than regular canvas)
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");
    
    // High quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);
    
    // Convert to blob
    const blob = await canvas.convertToBlob({ 
      type: "image/jpeg", 
      quality: quality 
    });
    
    // Convert blob to base64
    const reader = new FileReader();
    reader.onload = () => {
      self.postMessage({ 
        id, 
        success: true, 
        imgSrc: reader.result,
        width,
        height
      });
    };
    reader.onerror = () => {
      self.postMessage({ 
        id, 
        success: false, 
        error: "Failed to convert to base64" 
      });
    };
    reader.readAsDataURL(blob);
    
    // Cleanup
    bitmap.close();
  } catch (error) {
    self.postMessage({ 
      id, 
      success: false, 
      error: error.message 
    });
  }
};
`;

/**
 * Creates and returns a Web Worker instance for image processing
 * @returns {Worker|null} Worker instance or null if not supported
 */
export const createImageWorker = () => {
  // Check browser support
  const supportsWorker = typeof Worker !== "undefined";
  const supportsOffscreen = typeof OffscreenCanvas !== "undefined";

  if (!supportsWorker || !supportsOffscreen) {
    console.warn("Web Worker or OffscreenCanvas not supported, using fallback");
    return null;
  }

  try {
    const blob = new Blob([workerCode], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    // Clean up the blob URL after worker is created
    URL.revokeObjectURL(workerUrl);

    return worker;
  } catch (error) {
    console.error("Failed to create Web Worker:", error);
    return null;
  }
};

/**
 * Process image using main thread (fallback method)
 * @param {File} file - Image file to process
 * @param {number} maxWidth - Maximum width
 * @param {number} quality - JPEG quality (0-1)
 * @returns {Promise<string>} Base64 image data
 */
export const processImageFallback = (file, maxWidth = 2048, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    const blobUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(blobUrl);

      let { width, height } = img;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL("image/jpeg", quality));
    };

    img.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error("Failed to load image"));
    };

    img.src = blobUrl;
  });
};

/**
 * Get instant preview URL for a file (blob URL)
 * @param {File} file - Image file
 * @returns {string} Blob URL for instant preview
 */
export const getQuickPreview = (file) => {
  return URL.createObjectURL(file);
};

/**
 * Revoke a blob URL to free memory
 * @param {string} url - Blob URL to revoke
 */
export const revokePreview = (url) => {
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
};

export default {
  createImageWorker,
  processImageFallback,
  getQuickPreview,
  revokePreview
};
