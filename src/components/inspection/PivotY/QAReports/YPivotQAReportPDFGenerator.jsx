import React, { useState, useCallback } from "react";
import { pdf } from "@react-pdf/renderer";
import { Loader2, Download, AlertCircle, CheckCircle } from "lucide-react";
import axios from "axios";
import YPivotQAReportPDFDocument from "./YPivotQAReportPDFDocument";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";

// =============================================================================
// UTILITY: Convert Image URL to Base64
// =============================================================================
const imageUrlToBase64 = async (url) => {
  return new Promise((resolve) => {
    try {
      if (!url) {
        resolve(null);
        return;
      }

      // Handle data URLs (already base64)
      if (url.startsWith("data:")) {
        resolve(url);
        return;
      }

      // Construct full URL if needed
      let fullUrl = url;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        const baseUrl = API_BASE_URL.endsWith("/")
          ? API_BASE_URL.slice(0, -1)
          : API_BASE_URL;
        const path = url.startsWith("/") ? url : `/${url}`;
        fullUrl = `${baseUrl}${path}`;
      }

      // Use Image element approach (works better for CORS)
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth;
          canvas.height = img.naturalHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          const base64 = canvas.toDataURL("image/jpeg", 0.8); // Compress to 80% quality
          resolve(base64);
        } catch (e) {
          console.warn("Canvas error:", e);
          resolve(null);
        }
      };

      img.onerror = () => {
        console.warn(`Failed to load image: ${fullUrl}`);
        resolve(null);
      };

      // Add cache buster to avoid CORS cache issues
      img.src =
        fullUrl + (fullUrl.includes("?") ? "&" : "?") + "t=" + Date.now();

      // Timeout after 10 seconds
      setTimeout(() => {
        resolve(null);
      }, 10000);
    } catch (error) {
      console.warn(`Error converting image:`, error);
      resolve(null);
    }
  });
};

// =============================================================================
// UTILITY: Process Images in Batches (for 50-100+ images)
// =============================================================================
const processImagesInBatches = async (images, batchSize = 5, onProgress) => {
  const results = [];
  const total = images.length;

  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);

    // Process batch in parallel
    const batchResults = await Promise.all(
      batch.map(async (img) => {
        const url = img.url || img.imageURL;
        const base64 = await imageUrlToBase64(url);
        return { ...img, base64 };
      }),
    );

    results.push(...batchResults);

    if (onProgress) {
      const processed = Math.min(i + batchSize, total);
      onProgress(Math.round((processed / total) * 100));
    }

    // Small delay between batches to prevent overwhelming
    if (i + batchSize < images.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  return results;
};

// =============================================================================
// UTILITY: Batch Process Images with Progress
// =============================================================================
const processImagesWithProgress = async (images, onProgress) => {
  const results = [];
  const total = images.length;

  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    const base64 = await imageUrlToBase64(img.url || img.imageURL);
    results.push({
      ...img,
      base64,
    });

    if (onProgress) {
      onProgress(Math.round(((i + 1) / total) * 100));
    }
  }

  return results;
};

// =============================================================================
// UTILITY: Get Inspector Photo URL
// =============================================================================
const getInspectorPhotoUrl = (facePhoto) => {
  if (!facePhoto) return null;
  if (facePhoto.startsWith("http://") || facePhoto.startsWith("https://")) {
    return facePhoto;
  }
  const cleanPath = facePhoto.startsWith("/")
    ? facePhoto.substring(1)
    : facePhoto;
  const baseUrl = PUBLIC_ASSET_URL.endsWith("/")
    ? PUBLIC_ASSET_URL
    : `${PUBLIC_ASSET_URL}/`;
  return `${baseUrl}${cleanPath}`;
};

// =============================================================================
// PDF GENERATOR COMPONENT
// =============================================================================
const YPivotQAReportPDFGenerator = ({
  // Report Data
  report,
  orderData,
  shippingBreakdown,
  inspectorInfo,
  definitions,
  headerData,
  measurementStageData,
  measurementResult,
  summaryData,
  defectImages,
  aqlResult,
  aqlSampleData,
  finalResult,
  defectResult,
  isAQLMethod,
  sizeList,
  inspectedQty,
  // Trigger ref or callback
  triggerRef,
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState("");
  const [error, setError] = useState(null);

  // ==========================================================================
  // GENERATE PDF HANDLER
  // ==========================================================================

  const generatePDF = useCallback(async () => {
    setIsGenerating(true);
    setError(null);
    setProgress(0);
    setStage("Preparing...");

    try {
      // ========================================================================
      // STAGE 1: Collect ALL Image URLs
      // ========================================================================
      setStage("Collecting images...");
      setProgress(5);

      const allDefectImages = [];
      const allHeaderImages = [];
      const allPhotoImages = [];

      // Collect Defect Images
      if (defectImages && defectImages.length > 0) {
        defectImages.forEach((img) => {
          const url = img.imageURL?.startsWith("http")
            ? img.imageURL
            : `${API_BASE_URL}${img.imageURL}`;
          allDefectImages.push({ ...img, url });
        });
      }

      // Collect Header Images
      if (headerData?.capturedImages) {
        Object.entries(headerData.capturedImages).forEach(([key, img]) => {
          allHeaderImages.push({ key, url: img.url, ...img });
        });
      }

      // Collect Photo Documentation Images
      if (report?.photoData) {
        report.photoData.forEach((section) => {
          section.items?.forEach((item) => {
            item.images?.forEach((img) => {
              const url = img.imageURL?.startsWith("http")
                ? img.imageURL
                : `${API_BASE_URL}${img.imageURL}`;
              allPhotoImages.push({
                sectionId: section.sectionId,
                sectionName: section.sectionName,
                itemNo: item.itemNo,
                itemName: item.itemName,
                remarks: item.remarks,
                ...img,
                url,
              });
            });
          });
        });
      }

      const totalImages =
        allDefectImages.length + allHeaderImages.length + allPhotoImages.length;
      console.log(`Total images to process: ${totalImages}`);

      // ========================================================================
      // STAGE 2: Process Inspector Photo
      // ========================================================================
      setStage("Processing inspector photo...");
      setProgress(8);

      let inspectorWithPhoto = { ...inspectorInfo };

      try {
        // Call the API endpoint you created in the Controller
        // This returns { inspectorImage: "data:image/jpeg;base64,..." }
        const apiRes = await axios.get(
          `${API_BASE_URL}/api/fincheck-reports/${report.reportId}/images-base64`,
        );

        if (apiRes.data.success && apiRes.data.data.inspectorImage) {
          console.log("Inspector image fetched from server");
          inspectorWithPhoto.photoBase64 = apiRes.data.data.inspectorImage;
        } else {
          // Fallback: If server returns null, try client side (unlikely to work if CORS)
          // or just leave it null (PDF will show initials/fallback icon)
          console.warn("Server returned no inspector image");
        }
      } catch (err) {
        console.warn("Failed to fetch inspector image from server:", err);
      }

      // ========================================================================
      // STAGE 3: Process Defect Images
      // ========================================================================
      setStage(`Processing defect images (0/${allDefectImages.length})...`);
      setProgress(10);

      let defectImagesWithBase64 = [];
      if (allDefectImages.length > 0) {
        defectImagesWithBase64 = await processImagesInBatches(
          allDefectImages,
          5, // Process 5 at a time
          (p) => {
            setProgress(10 + Math.round(p * 0.3)); // 10-40%
            setStage(
              `Processing defect images (${Math.round(
                (allDefectImages.length * p) / 100,
              )}/${allDefectImages.length})...`,
            );
          },
        );
      }

      // ========================================================================
      // STAGE 4: Process Header Images
      // ========================================================================
      setStage(`Processing checklist images (0/${allHeaderImages.length})...`);
      setProgress(42);

      let headerDataWithImages = { ...headerData, capturedImages: {} };
      if (allHeaderImages.length > 0) {
        const processedHeaderImages = await processImagesInBatches(
          allHeaderImages,
          5,
          (p) => {
            setProgress(42 + Math.round(p * 0.15)); // 42-57%
            setStage(
              `Processing checklist images (${Math.round(
                (allHeaderImages.length * p) / 100,
              )}/${allHeaderImages.length})...`,
            );
          },
        );

        processedHeaderImages.forEach((img) => {
          headerDataWithImages.capturedImages[img.key] = {
            ...img,
            base64: img.base64,
          };
        });
      }

      // ========================================================================
      // STAGE 5A: Process PP Sheet Images (NEW)
      // ========================================================================
      let ppSheetDataWithImages = null;

      if (report.ppSheetData) {
        setStage("Processing PP Sheet images...");
        setProgress(55); // Inserted between Checklists (42-57%) and Photos (60%)

        const ppImages = report.ppSheetData.images || [];
        let processedPPImages = [];

        if (ppImages.length > 0) {
          // Ensure URLs are absolute before processing
          const ppImagesWithUrls = ppImages.map((img) => ({
            ...img,
            url: (img.imageURL || img.url || "").startsWith("http")
              ? img.imageURL || img.url
              : `${API_BASE_URL}${img.imageURL || img.url}`,
          }));

          processedPPImages = await processImagesInBatches(
            ppImagesWithUrls,
            5,
            (p) => {
              // Minor progress updates within this micro-stage
            },
          );
        }

        ppSheetDataWithImages = {
          ...report.ppSheetData,
          images: processedPPImages, // These now contain .base64
        };
      }

      // ========================================================================
      // STAGE 5B: Fetch & Process Defect Heatmap (NEW)
      // ========================================================================
      let defectHeatmapData = null;
      setStage("Processing defect location map...");
      setProgress(58);

      try {
        // 1. Fetch JSON Data
        const heatmapRes = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${report.reportId}/defect-heatmap`,
        );

        if (heatmapRes.data.success && heatmapRes.data.data) {
          const mapData = heatmapRes.data.data.map;
          const counts = heatmapRes.data.data.counts;

          // 2. Convert Front/Back Images to Base64
          // We must do this because React-PDF renders Base64 much more reliably than remote URLs
          // especially if auth/cookies are involved or for performance.

          if (mapData.frontView?.imagePath) {
            const base64 = await imageUrlToBase64(mapData.frontView.imagePath);
            if (base64) mapData.frontView.imagePath = base64;
          }

          if (mapData.backView?.imagePath) {
            const base64 = await imageUrlToBase64(mapData.backView.imagePath);
            if (base64) mapData.backView.imagePath = base64;
          }

          defectHeatmapData = {
            map: mapData,
            counts: counts,
          };
        }
      } catch (err) {
        console.warn("Could not fetch defect heatmap for PDF:", err);
        // Not critical, continue without map
      }

      // ========================================================================
      // STAGE 5C: Fetch QC Defects Data (NEW)
      // ========================================================================
      let qcDefectsData = null;
      setStage("Fetching QC defects data...");
      setProgress(59);

      try {
        const qcRes = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${report.reportId}/defects-by-qc`,
        );

        if (qcRes.data.success && qcRes.data.data) {
          qcDefectsData = qcRes.data.data;
          console.log(
            "QC defects data fetched:",
            qcDefectsData.length,
            "inspectors",
          );
        }
      } catch (err) {
        console.warn("Could not fetch QC defects data for PDF:", err);
        // Not critical, continue without QC defects data
      }

      setProgress(61);

      // ========================================================================
      // STAGE 5D: Process Photo Documentation Images
      // ========================================================================
      setStage(
        `Processing photo documentation (0/${allPhotoImages.length})...`,
      );
      setProgress(62);

      let photoDataWithImages = [];
      if (allPhotoImages.length > 0) {
        const processedPhotoImages = await processImagesInBatches(
          allPhotoImages,
          5,
          (p) => {
            setProgress(60 + Math.round(p * 0.25)); // 60-85%
            setStage(
              `Processing photo documentation (${Math.round(
                (allPhotoImages.length * p) / 100,
              )}/${allPhotoImages.length})...`,
            );
          },
        );

        // Reconstruct photoData structure with base64 images
        const photoDataMap = {};
        processedPhotoImages.forEach((img) => {
          const key = img.sectionId;
          if (!photoDataMap[key]) {
            photoDataMap[key] = {
              sectionId: img.sectionId,
              sectionName: img.sectionName,
              items: {},
            };
          }
          if (!photoDataMap[key].items[img.itemNo]) {
            photoDataMap[key].items[img.itemNo] = {
              itemNo: img.itemNo,
              itemName: img.itemName,
              remarks: img.remarks,
              images: [],
            };
          }
          photoDataMap[key].items[img.itemNo].images.push({
            ...img,
            base64: img.base64,
          });
        });

        // Convert to array format
        photoDataWithImages = Object.values(photoDataMap).map((section) => ({
          ...section,
          items: Object.values(section.items),
        }));
      }

      setProgress(70);

      // ========================================================================
      // STAGE 5E: Fetch Measurement Value Distribution Data (NEW)
      // ========================================================================
      let measurementDistributionData = null;
      setStage("Fetching measurement distribution data...");
      setProgress(75);

      try {
        const distRes = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${report.reportId}/measurement-point-calc`,
        );

        if (distRes.data.success && distRes.data.data) {
          measurementDistributionData = distRes.data.data;
          console.log(
            "Measurement distribution data fetched:",
            measurementDistributionData.specs?.length,
            "specs",
          );
        }
      } catch (err) {
        console.warn(
          "Could not fetch measurement distribution data for PDF:",
          err,
        );
        // Not critical, continue without distribution data
      }

      setProgress(88);

      // ========================================================================
      // STAGE 6: Generate PDF Document
      // ========================================================================
      setStage("Creating PDF document...");

      const pdfDocument = (
        <YPivotQAReportPDFDocument
          reportData={report}
          orderData={orderData}
          inspectorInfo={inspectorWithPhoto}
          inspectionDetails={report?.inspectionDetails}
          shippingBreakdown={shippingBreakdown}
          definitions={definitions}
          headerData={headerData}
          measurementStageData={measurementStageData}
          measurementResult={measurementResult}
          summaryData={summaryData}
          defectImages={defectImages}
          aqlResult={aqlResult}
          aqlSampleData={aqlSampleData}
          finalResult={finalResult}
          defectResult={defectResult}
          isAQLMethod={isAQLMethod}
          inspectedQty={inspectedQty}
          photoDataWithImages={photoDataWithImages}
          headerDataWithImages={headerDataWithImages}
          defectImagesWithBase64={defectImagesWithBase64}
          ppSheetDataWithImages={ppSheetDataWithImages}
          defectHeatmapData={defectHeatmapData}
          sizeList={sizeList}
          measurementDistributionData={measurementDistributionData}
          qcDefectsData={qcDefectsData}
        />
      );

      setProgress(92);
      setStage("Rendering PDF...");

      // Generate blob - THIS IS THE KEY AWAIT
      const blob = await pdf(pdfDocument).toBlob();

      setProgress(98);

      // ========================================================================
      // STAGE 7: Download PDF
      // ========================================================================
      setStage("Downloading...");

      const orderNo = report?.orderNos?.[0] || "Report";
      const date = new Date().toISOString().split("T")[0];
      const fileName = `Fincheck_Inspection_${orderNo}_${date}.pdf`;

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setProgress(100);
      setStage("Complete!");

      setTimeout(() => {
        setIsGenerating(false);
        setProgress(0);
        setStage("");
      }, 2000);
    } catch (err) {
      console.error("PDF Generation Error:", err);
      setError(err.message || "Failed to generate PDF");
      setIsGenerating(false);
    }
  }, [
    report,
    orderData,
    inspectorInfo,
    definitions,
    headerData,
    measurementStageData,
    measurementResult,
    summaryData,
    defectImages,
    aqlResult,
    aqlSampleData,
    finalResult,
    defectResult,
    isAQLMethod,
    inspectedQty,
    sizeList,
  ]);

  // Expose generate function via ref if provided
  React.useImperativeHandle(triggerRef, () => ({
    generatePDF,
  }));

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <>
      {/* Generate Button */}
      <button
        onClick={generatePDF}
        disabled={isGenerating}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold shadow-lg transition-all ${
          isGenerating
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-white text-indigo-600 hover:bg-gray-50"
        }`}
      >
        {isGenerating ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        <span className="hidden sm:inline">
          {isGenerating ? "Generating..." : "Download PDF"}
        </span>
      </button>

      {/* Progress Modal */}
      {isGenerating && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center">
              {/* Icon */}
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                {progress === 100 ? (
                  <CheckCircle className="w-8 h-8 text-green-500" />
                ) : (
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                )}
              </div>

              {/* Title */}
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                {progress === 100 ? "PDF Generated!" : "Generating PDF..."}
              </h3>

              {/* Stage */}
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {stage}
              </p>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Progress Percentage */}
              <p className="text-xs font-mono text-gray-400">{progress}%</p>
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="w-8 h-8 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">
                PDF Generation Failed
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {error}
              </p>
              <button
                onClick={() => setError(null)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default YPivotQAReportPDFGenerator;
