// YPivotQATemplatesImageRotate.jsx
import React, { useCallback } from "react";
import { RotateCcw } from "lucide-react";

// ============================================
// ROTATE HOOK
// ============================================

/**
 * Custom hook for image rotation functionality
 */
export const useImageRotate = () => {
  /**
   * Rotate image by 90 degrees counter-clockwise
   * @param {string} imageSrc - Image source (data URL or URL)
   * @param {Object} options - Options
   * @returns {Promise<Object>} - Result with rotated image
   */
  const rotateImage = useCallback(async (imageSrc, options = {}) => {
    const { quality = 1.0, outputFormat = "image/png" } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        try {
          // Create canvas with swapped dimensions (for 90° rotation)
          const canvas = document.createElement("canvas");
          canvas.width = img.height;
          canvas.height = img.width;

          const ctx = canvas.getContext("2d");

          // High quality settings
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          // Move to center
          ctx.translate(canvas.width / 2, canvas.height / 2);

          // Rotate 90 degrees counter-clockwise (-90 degrees = -π/2 radians)
          ctx.rotate(-Math.PI / 2);

          // Draw image centered
          ctx.drawImage(img, -img.width / 2, -img.height / 2);

          // Generate output
          const rotatedImageSrc = canvas.toDataURL(outputFormat, quality);

          resolve({
            success: true,
            imageSrc: rotatedImageSrc,
            originalDimensions: { width: img.width, height: img.height },
            newDimensions: { width: canvas.width, height: canvas.height },
            rotation: -90
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
  }, []);

  /**
   * Rotate image by specific degrees
   * @param {string} imageSrc - Image source
   * @param {number} degrees - Rotation degrees (negative = counter-clockwise)
   * @param {Object} options - Options
   */
  const rotateImageByDegrees = useCallback(
    async (imageSrc, degrees, options = {}) => {
      const { quality = 1.0, outputFormat = "image/png" } = options;

      return new Promise((resolve, reject) => {
        const img = new Image();

        img.onload = () => {
          try {
            const radians = (degrees * Math.PI) / 180;
            const sin = Math.abs(Math.sin(radians));
            const cos = Math.abs(Math.cos(radians));

            // Calculate new dimensions
            const newWidth = img.width * cos + img.height * sin;
            const newHeight = img.width * sin + img.height * cos;

            const canvas = document.createElement("canvas");
            canvas.width = Math.round(newWidth);
            canvas.height = Math.round(newHeight);

            const ctx = canvas.getContext("2d");
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";

            // Move to center and rotate
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate(radians);
            ctx.drawImage(img, -img.width / 2, -img.height / 2);

            const rotatedImageSrc = canvas.toDataURL(outputFormat, quality);

            resolve({
              success: true,
              imageSrc: rotatedImageSrc,
              originalDimensions: { width: img.width, height: img.height },
              newDimensions: { width: canvas.width, height: canvas.height },
              rotation: degrees
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

  return {
    rotateImage,
    rotateImageByDegrees
  };
};

// ============================================
// ROTATE BUTTON COMPONENT
// ============================================

/**
 * Rotate button for toolbar
 */
export const RotateButton = ({
  onClick,
  disabled = false,
  isProcessing = false,
  className = ""
}) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isProcessing}
      className={`p-2 rounded-lg transition-all text-blue-400 hover:bg-blue-900/30 hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 ${className}`}
      title="Rotate 90° Counter-clockwise"
    >
      <RotateCcw className={`w-5 h-5 ${isProcessing ? "animate-spin" : ""}`} />
    </button>
  );
};

export default useImageRotate;
