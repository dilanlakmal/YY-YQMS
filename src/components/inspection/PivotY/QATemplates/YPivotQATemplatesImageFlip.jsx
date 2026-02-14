// YPivotQATemplatesImageFlip.jsx
import React, { useCallback, useState } from "react";
import { FlipHorizontal2, FlipVertical2 } from "lucide-react";

// Custom flip icon since lucide might not have exact one
const FlipIcon = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3v18" />
    <path d="M16 7l4 5-4 5" />
    <path d="M8 7L4 12l4 5" />
  </svg>
);

// ============================================
// FLIP HOOK
// ============================================

/**
 * Custom hook for image flip functionality
 */
export const useImageFlip = () => {
  /**
   * Flip image horizontally
   * @param {string} imageSrc - Image source (data URL or URL)
   * @param {Object} options - Options
   * @returns {Promise<Object>} - Result with flipped image
   */
  const flipImageHorizontal = useCallback(async (imageSrc, options = {}) => {
    const { quality = 1.0, outputFormat = "image/png" } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext("2d");

          // High quality settings
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          // Flip horizontally
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);

          // Draw image
          ctx.drawImage(img, 0, 0);

          // Generate output
          const flippedImageSrc = canvas.toDataURL(outputFormat, quality);

          resolve({
            success: true,
            imageSrc: flippedImageSrc,
            dimensions: { width: img.width, height: img.height },
            flipType: "horizontal"
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
   * Flip image vertically
   * @param {string} imageSrc - Image source (data URL or URL)
   * @param {Object} options - Options
   * @returns {Promise<Object>} - Result with flipped image
   */
  const flipImageVertical = useCallback(async (imageSrc, options = {}) => {
    const { quality = 1.0, outputFormat = "image/png" } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;

          const ctx = canvas.getContext("2d");

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";

          // Flip vertically
          ctx.translate(0, canvas.height);
          ctx.scale(1, -1);

          ctx.drawImage(img, 0, 0);

          const flippedImageSrc = canvas.toDataURL(outputFormat, quality);

          resolve({
            success: true,
            imageSrc: flippedImageSrc,
            dimensions: { width: img.width, height: img.height },
            flipType: "vertical"
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
   * Flip image in specified direction
   * @param {string} imageSrc - Image source
   * @param {string} direction - 'horizontal' or 'vertical'
   * @param {Object} options - Options
   */
  const flipImage = useCallback(
    async (imageSrc, direction = "horizontal", options = {}) => {
      if (direction === "vertical") {
        return flipImageVertical(imageSrc, options);
      }
      return flipImageHorizontal(imageSrc, options);
    },
    [flipImageHorizontal, flipImageVertical]
  );

  return {
    flipImage,
    flipImageHorizontal,
    flipImageVertical
  };
};

// ============================================
// FLIP BUTTON COMPONENT
// ============================================

/**
 * Flip button for toolbar (horizontal flip)
 */
export const FlipButton = ({
  onClick,
  disabled = false,
  isProcessing = false,
  direction = "horizontal",
  className = ""
}) => {
  const Icon = direction === "vertical" ? FlipVertical2 : FlipHorizontal2;
  const title = direction === "vertical" ? "Flip Vertical" : "Flip Horizontal";

  return (
    <button
      onClick={onClick}
      disabled={disabled || isProcessing}
      className={`p-2 rounded-lg transition-all text-purple-400 hover:bg-purple-900/30 hover:text-purple-300 disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 ${className}`}
      title={title}
    >
      <Icon className={`w-5 h-5 ${isProcessing ? "animate-pulse" : ""}`} />
    </button>
  );
};

/**
 * Flip button with dropdown for both directions
 */
export const FlipButtonWithMenu = ({
  onFlipHorizontal,
  onFlipVertical,
  disabled = false,
  className = ""
}) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        disabled={disabled}
        className={`p-2 rounded-lg transition-all text-purple-400 hover:bg-purple-900/30 hover:text-purple-300 disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
        title="Flip Image"
      >
        <FlipIcon className="w-5 h-5" />
      </button>

      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-gray-800 rounded-lg shadow-xl border border-gray-700 overflow-hidden z-50">
            <button
              onClick={() => {
                onFlipHorizontal();
                setShowMenu(false);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white w-full"
            >
              <FlipHorizontal2 className="w-4 h-4" />
              <span>Horizontal</span>
            </button>
            <button
              onClick={() => {
                onFlipVertical();
                setShowMenu(false);
              }}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white w-full"
            >
              <FlipVertical2 className="w-4 h-4" />
              <span>Vertical</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default useImageFlip;
