import React, { useRef } from "react";
import { ImagePlus } from "lucide-react";

const MultipleImageUpload = ({
  sectionId,
  itemNo,
  maxCount,
  currentCount,
  onImagesSelected
}) => {
  const fileInputRef = useRef(null);
  const availableSlots = Math.max(0, maxCount - currentCount);

  const handleFileChange = (e) => {
    // ... (Keep existing logic unchanged) ...
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (files.length > availableSlots) {
      alert(
        `You can only add ${availableSlots} more image(s). Please select fewer images.`
      );
      e.target.value = "";
      return;
    }

    const processedImages = files.map((file) => ({
      imgSrc: URL.createObjectURL(file),
      editedImgSrc: null,
      file: file,
      history: [],
      isRawFile: true
    }));

    onImagesSelected(processedImages);
    e.target.value = "";
  };

  const handleClick = () => {
    if (availableSlots <= 0) {
      alert("Maximum images reached for this item!");
      return;
    }
    fileInputRef.current?.click();
  };

  return (
    <>
      <button
        onClick={handleClick}
        // ✅ CHANGED: w-full h-full (Parent controls dimensions)
        className="w-full h-full flex flex-col items-center justify-center hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
        title={`Batch Upload from Gallery (${availableSlots} slots available)`}
      >
        <ImagePlus className="w-4 h-4 text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </>
  );
};

export default MultipleImageUpload;
