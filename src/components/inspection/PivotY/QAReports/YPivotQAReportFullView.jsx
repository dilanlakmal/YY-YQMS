import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FileText,
  Package,
  Layers,
  Hash,
  Users,
  MapPin,
  Calendar,
  Settings,
  Tag,
  Shirt,
  Globe,
  Truck,
  Camera,
  MessageSquare,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  Building2,
  ClipboardCheck,
  AlertCircle,
  Shield,
  Trophy,
  Ruler,
  Bug,
  Award,
  User,
  ArrowLeft,
  Home,
  Printer,
  Download,
  RefreshCw,
  Eye,
  Clock,
  ClipboardList,
  FileSpreadsheet,
  Gavel,
  Calculator,
  Gauge,
  Activity,
  PenTool,
  Zap,
} from "lucide-react";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";

// Import from Measurement Summary
import {
  groupMeasurementsByGroupId,
  calculateGroupStats,
  calculateOverallMeasurementResult,
  MeasurementStatsCards,
  MeasurementLegend,
  MeasurementSummaryTable,
  OverallMeasurementSummaryTable,
} from "../QADataCollection/YPivotQAInspectionMeasurementSummary";

import YPivotQAReportMeasurementValueDistribution from "./YPivotQAReportMeasurementValueDistribution";

// Import from Defect Summary
import {
  useDefectSummaryData,
  useAqlData,
  calculateAqlResult,
  AQLConfigCards,
  AQLResultTable,
  FinalDefectResultBanner,
  DefectSummaryTable,
} from "../QADataCollection/YPivotQAInspectionDefectSummary";

import DefectLocationSummary from "./DefectLocationSummary";

import { determineBuyerFromOrderNo } from "../QADataCollection/YPivotQAInspectionBuyerDetermination";
import { useAuth } from "../../../authentication/AuthContext";

import YPivotQAReportPPSheetSection from "./YPivotQAReportPPSheetSection";
import YPivotQAReportMeasurementManualDisplay from "./YPivotQAReportMeasurementManualDisplay";
import YPivotQAInspectionManualDefectDisplay from "./YPivotQAInspectionManualDefectDisplay";
import YPivotQAInspectionMissingDefectsByQC from "./YPivotQAInspectionMissingDefectsByQC";

import OrderShippingStageBreakdownTable from "./OrderShippingStageBreakdownTable";

import YPivotQAReportDecisionModal from "./YPivotQAReportDecisionModal";

import YPivotQAReportPDFGenerator from "./YPivotQAReportPDFGenerator";

// =============================================================================
// HELPER COMPONENTS
// =============================================================================

const ImagePreviewModal = ({ images, startIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = React.useState(startIndex);

  if (!images || images.length === 0) return null;

  const currentImage = images[currentIndex];

  const resolveUrl = (img) => {
    // 1. Get the raw path from various possible property names
    const url = img.url || img.src || img.imageURL;

    if (!url) return "";

    // 2. If it's already a full URL (http/https), return it as is
    if (url.startsWith("http://") || url.startsWith("https://")) {
      return url;
    }

    // 3. Otherwise, prepend API_BASE_URL
    // Clean up slashes to avoid double slash (e.g., base//path)
    const baseUrl = API_BASE_URL.endsWith("/")
      ? API_BASE_URL.slice(0, -1)
      : API_BASE_URL;

    const path = url.startsWith("/") ? url : `/${url}`;

    return `${baseUrl}${path}`;
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Keyboard navigation
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Helper for Status Badge Color
  const getStatusColor = (status) => {
    if (!status) return "bg-gray-500 text-white";
    const s = status.toLowerCase();
    if (s === "minor") return "bg-orange-200 text-orange-900 border-orange-300"; // Light Orange
    if (s === "major") return "bg-red-200 text-red-900 border-red-300"; // Light Red
    if (s === "critical") return "bg-red-800 text-white border-red-900"; // Dark Red
    return "bg-gray-500 text-white";
  };

  return (
    <div
      className="fixed inset-0 z-[150] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div className="relative w-full h-full flex flex-col items-center justify-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-50 bg-gray-800/50 hover:bg-red-600 text-white rounded-full p-2 transition-colors border border-gray-600 backdrop-blur"
        >
          <XCircle className="w-8 h-8" />
        </button>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-white/10 text-white rounded-full transition-all z-40 border border-white/10 backdrop-blur"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/40 hover:bg-white/10 text-white rounded-full transition-all z-40 border border-white/10 backdrop-blur"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </>
        )}

        {/* Main Image */}
        <div
          className="flex-1 w-full flex items-center justify-center overflow-hidden pb-20"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={resolveUrl(currentImage)}
            alt={currentImage.defectName || "Preview"}
            className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
          />
        </div>

        {/* Footer Bar */}
        <div
          className="absolute bottom-6 w-full max-w-5xl px-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gray-900/90 backdrop-blur-xl rounded-2xl border border-gray-700 p-4 shadow-2xl">
            {/* Grid Layout: Left (Config), Center (Defect), Right (Counter) */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {/* LEFT: Config Label */}
              <div className="flex-1 w-full md:w-auto flex justify-start">
                {currentImage.configLabel ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 border border-gray-600">
                    <Layers className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-xs font-mono font-bold text-gray-300 uppercase tracking-wide">
                      {currentImage.configLabel}
                    </span>
                  </div>
                ) : (
                  <div /> // Spacer
                )}
              </div>

              {/* CENTER: Defect Info */}
              <div className="flex-[2] flex flex-col items-center justify-center text-center">
                {/* Name + Badges Row */}
                <div className="flex flex-wrap items-center justify-center gap-2 mb-1">
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {currentImage.isMain === false
                      ? "Additional Evidence"
                      : currentImage.defectName || "Image Preview"}
                  </h3>

                  {/* Position Badge (Inside/Outside) */}
                  {currentImage.positionType &&
                    currentImage.positionType !== "N/A" && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${
                          currentImage.positionType === "Outside"
                            ? "bg-blue-900/40 text-blue-200 border-blue-700/50"
                            : "bg-indigo-900/40 text-indigo-200 border-indigo-700/50"
                        }`}
                      >
                        {currentImage.positionType}
                      </span>
                    )}

                  {/* Status Badge (Minor/Major/Critical) */}
                  {currentImage.status && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getStatusColor(
                        currentImage.status,
                      )}`}
                    >
                      {currentImage.status}
                    </span>
                  )}
                </div>

                {/* Location Text */}
                {currentImage.locationText && (
                  <p className="text-sm text-gray-400 font-medium">
                    ( {currentImage.locationText} )
                  </p>
                )}
              </div>

              {/* RIGHT: Counter */}
              <div className="flex-1 w-full md:w-auto flex justify-end">
                {images.length > 1 && (
                  <div className="px-3 py-1 rounded-full bg-black/40 border border-white/10 text-xs font-mono text-gray-400">
                    {currentIndex + 1} / {images.length}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// NEW: PRODUCTION STATUS COMPONENTS
// =============================================================================

const ProgressBar = ({ label, value, colorClass = "bg-blue-500" }) => (
  <div className="mb-3">
    <div className="flex justify-between items-center mb-1">
      <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
        {label}
      </span>
      <span className="text-xs font-bold text-gray-800 dark:text-white">
        {value}%
      </span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
      <div
        className={`h-2 rounded-full ${colorClass} transition-all duration-500`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  </div>
);

const ProductionStatusSection = ({ inspectionDetails }) => {
  if (!inspectionDetails || !inspectionDetails.qualityPlanEnabled) return null;

  const { productionStatus, packingList } = inspectionDetails;

  // Check if production status has non-zero values
  const showProduction =
    productionStatus && Object.values(productionStatus).some((val) => val > 0);

  // Check if packing list has non-zero values
  const showPacking =
    packingList && Object.values(packingList).some((val) => val > 0);

  if (!showProduction && !showPacking) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mt-4">
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 flex items-center gap-2">
        <ClipboardList className="w-4 h-4 text-white" />
        <h2 className="text-white font-bold text-sm">
          Production Status & Packing List
        </h2>
      </div>

      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* LEFT: Production Status (Progress Bars) */}
        {showProduction && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase border-b border-gray-100 dark:border-gray-700 pb-2">
              Production Progress
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <ProgressBar
                label="Cutting"
                value={productionStatus.cutting}
                colorClass="bg-purple-500"
              />
              <ProgressBar
                label="Sewing"
                value={productionStatus.sewing}
                colorClass="bg-indigo-500"
              />
              <ProgressBar
                label="Ironing"
                value={productionStatus.ironing}
                colorClass="bg-blue-500"
              />
              <ProgressBar
                label="QC2 Checking"
                value={productionStatus.qc2FinishedChecking}
                colorClass="bg-teal-500"
              />
              <ProgressBar
                label="Folding"
                value={productionStatus.folding}
                colorClass="bg-emerald-500"
              />
              <ProgressBar
                label="Packing"
                value={productionStatus.packing}
                colorClass="bg-green-500"
              />
            </div>
          </div>
        )}

        {/* RIGHT: Packing List (Card Grid) */}
        {showPacking && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-gray-500 uppercase border-b border-gray-100 dark:border-gray-700 pb-2">
              Packing List Status
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <p className="text-[10px] text-blue-500 uppercase font-bold">
                  Total Cartons
                </p>
                <p className="text-lg font-black text-gray-800 dark:text-gray-100">
                  {packingList.totalCartons?.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-100 dark:border-green-800">
                <p className="text-[10px] text-green-500 uppercase font-bold">
                  Finished Cartons
                </p>
                <p className="text-lg font-black text-gray-800 dark:text-gray-100">
                  {packingList.finishedCartons?.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                <p className="text-[10px] text-purple-500 uppercase font-bold">
                  Total Pcs
                </p>
                <p className="text-lg font-black text-gray-800 dark:text-gray-100">
                  {packingList.totalPcs?.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-100 dark:border-orange-800">
                <p className="text-[10px] text-orange-500 uppercase font-bold">
                  Finished Pcs
                </p>
                <p className="text-lg font-black text-gray-800 dark:text-gray-100">
                  {packingList.finishedPcs?.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Optional Summary Text */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
              <p className="text-xs text-gray-500">
                Carton Completion:{" "}
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  {Math.round(
                    (packingList.finishedCartons /
                      (packingList.totalCartons || 1)) *
                      100,
                  )}
                  %
                </span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const InfoRow = ({ label, value, icon: Icon, className = "" }) => (
  <div
    className={`flex items-start gap-2.5 p-2.5 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-100 dark:border-gray-700 ${className}`}
  >
    <div className="p-1.5 bg-white dark:bg-gray-800 rounded-md shadow-sm text-gray-500 dark:text-gray-400 flex-shrink-0">
      {Icon ? (
        <Icon className="w-3.5 h-3.5" />
      ) : (
        <Hash className="w-3.5 h-3.5" />
      )}
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <p
        className="text-xs font-bold text-gray-800 dark:text-white mt-0.5 truncate"
        title={value}
      >
        {value || "-"}
      </p>
    </div>
  </div>
);

const SectionHeader = ({ title, icon: Icon }) => (
  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
    <div className="p-1 rounded-lg bg-gray-100 dark:bg-gray-700">
      {Icon && <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
    </div>
    <h3 className="font-bold text-gray-800 dark:text-white text-sm">{title}</h3>
  </div>
);

const StatusBadge = ({ value }) => {
  let style = "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
  if (["Conform", "Yes", "New Order"].includes(value)) {
    style = "bg-emerald-100 text-emerald-700 border-emerald-200";
  } else if (["Non-Conform", "No"].includes(value)) {
    style = "bg-red-100 text-red-700 border-red-200";
  } else if (value === "N/A") {
    style = "bg-orange-100 text-orange-700 border-orange-200";
  }
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${style}`}
    >
      {value}
    </span>
  );
};

const ResultCard = ({ title, result, icon: Icon }) => {
  const isPass = result === "PASS";
  return (
    <div
      className={`flex items-center gap-2 p-2.5 rounded-lg border ${
        isPass
          ? `bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800`
          : `bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800`
      }`}
    >
      <div
        className={`p-1.5 rounded-full ${
          isPass ? "bg-green-100" : "bg-red-100"
        }`}
      >
        <Icon
          className={`w-4 h-4 ${isPass ? "text-green-600" : "text-red-600"}`}
        />
      </div>
      <div>
        <p className="text-[8px] font-bold text-gray-500 uppercase">{title}</p>
        <p
          className={`text-sm font-black ${
            isPass ? "text-green-600" : "text-red-600"
          }`}
        >
          {result}
        </p>
      </div>
    </div>
  );
};

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
// NEW HELPER COMPONENTS FOR ORDER DATA
// =============================================================================

// Color/Size Breakdown Table
const ColorSizeBreakdownTable = ({ data, orderNo }) => {
  if (!data || !data.colors || data.colors.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 rounded-lg">
        <Package className="w-8 h-8 mx-auto mb-1 opacity-50" />
        <p className="text-xs">No color/size data available</p>
      </div>
    );
  }

  const { sizeList, colors, sizeTotals, grandTotal } = data;

  return (
    <div className="space-y-2">
      {orderNo && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded">
            {orderNo}
          </span>
        </div>
      )}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <th className="px-3 py-2 text-left font-bold text-[10px] uppercase tracking-wide sticky left-0 bg-indigo-600 z-10">
                Color
              </th>
              {sizeList.map((size) => (
                <th
                  key={size}
                  className="px-2 py-2 text-center font-bold text-[10px] uppercase tracking-wide min-w-[40px]"
                >
                  {size}
                </th>
              ))}
              <th className="px-3 py-2 text-center font-bold text-[10px] uppercase tracking-wide bg-indigo-700 min-w-[60px]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {colors.map((row, index) => (
              <tr
                key={index}
                className={`border-b border-gray-100 dark:border-gray-700 ${
                  index % 2 === 0
                    ? "bg-white dark:bg-gray-800"
                    : "bg-gray-50 dark:bg-gray-800/50"
                } hover:bg-indigo-50 dark:hover:bg-indigo-900/20`}
              >
                <td className="px-3 py-1.5 font-semibold text-gray-800 dark:text-gray-200 sticky left-0 bg-inherit z-10 border-r border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: row.colorCode || "#ccc" }}
                    />
                    <span className="text-[11px] whitespace-nowrap">
                      {row.color}
                    </span>
                  </div>
                </td>
                {sizeList.map((size) => (
                  <td
                    key={size}
                    className={`px-2 py-1.5 text-center text-[11px] font-medium border-r border-gray-100 dark:border-gray-700 last:border-0 ${
                      row.sizes[size]
                        ? "text-gray-800 dark:text-gray-200"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  >
                    {row.sizes[size] || "-"}
                  </td>
                ))}
                <td className="px-3 py-1.5 text-center text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30">
                  {row.total.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
              <td className="px-3 py-2 text-[10px] text-gray-800 dark:text-gray-200 sticky left-0 bg-gray-200 dark:bg-gray-600 z-10 uppercase">
                Total
              </td>
              {sizeList.map((size) => (
                <td
                  key={size}
                  className="px-2 py-2 text-center text-[10px] text-gray-800 dark:text-gray-200"
                >
                  {sizeTotals[size]?.toLocaleString() || "-"}
                </td>
              ))}
              <td className="px-3 py-2 text-center text-[11px] text-white bg-indigo-600">
                {grandTotal.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

// SKU Data Table
const SKUDataTable = ({ skuData, orderNo }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!skuData || skuData.length === 0) return null;

  const displayData = isExpanded ? skuData : skuData.slice(0, 3);

  return (
    <div className="space-y-2">
      {orderNo && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded">
            {orderNo}
          </span>
        </div>
      )}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              {/* --- Added specific width w-[40%] to SKU Column --- */}
              <th className="px-3 py-2 text-left font-bold text-[10px] uppercase w-[40%]">
                SKU
              </th>
              <th className="px-2 py-2 text-left font-bold text-[10px] uppercase">
                PO Line
              </th>
              <th className="px-2 py-2 text-left font-bold text-[10px] uppercase">
                Color
              </th>
              <th className="px-2 py-2 text-center font-bold text-[10px] uppercase">
                Ex.Fty Date
              </th>
              <th className="px-2 py-2 text-center font-bold text-[10px] uppercase">
                Buyer.DEL Date
              </th>
              <th className="px-2 py-2 text-right font-bold text-[10px] uppercase">
                Qty
              </th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((sku, index) => (
              <tr
                key={index}
                className={`border-b border-gray-100 dark:border-gray-700 ${
                  index % 2 === 0
                    ? "bg-white dark:bg-gray-800"
                    : "bg-gray-50 dark:bg-gray-800/50"
                }`}
              >
                {/* --- Added 'font-bold' to ALL cells below --- */}
                <td className="px-3 py-2 font-bold text-[11px] text-gray-800 dark:text-gray-200 break-all">
                  {sku.sku || "N/A"}
                </td>
                <td className="px-2 py-2 font-bold text-[11px] text-gray-600 dark:text-gray-400">
                  {sku.POLine || "N/A"}
                </td>
                <td className="px-2 py-2 font-bold text-[11px] text-gray-700 dark:text-gray-300">
                  {sku.Color || "N/A"}
                </td>
                <td className="px-2 py-2 font-bold text-center text-[11px] text-gray-600 dark:text-gray-400">
                  {sku.ETD || "-"}
                </td>
                <td className="px-2 py-2 font-bold text-center text-[11px] text-gray-600 dark:text-gray-400">
                  {sku.ETA || "-"}
                </td>
                <td className="px-2 py-2 font-bold text-right text-[11px] text-emerald-600 dark:text-emerald-400">
                  {sku.Qty?.toLocaleString() || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {skuData.length > 3 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors flex items-center justify-center gap-1 uppercase tracking-wide"
        >
          {isExpanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
          {isExpanded ? "Show Less" : `Show All (${skuData.length})`}
        </button>
      )}
    </div>
  );
};

const getProductImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const baseUrl = PUBLIC_ASSET_URL.endsWith("/")
    ? PUBLIC_ASSET_URL.slice(0, -1)
    : PUBLIC_ASSET_URL;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${path}`;
};

// ==============================================================================
// NEW HELPER: Technical Info Display Card (For EMB/Print)
// ==============================================================================
const TechInfoCard = ({ label, value, enabled, icon: Icon }) => (
  <div
    className={`flex items-center gap-3 p-3 rounded-lg border ${enabled ? "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700" : "bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 opacity-60"}`}
  >
    <div
      className={`p-2 rounded-full ${enabled ? "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300" : "bg-gray-200 dark:bg-gray-800 text-gray-400"}`}
    >
      <Icon size={16} />
    </div>
    <div>
      <p className="text-[9px] font-bold text-gray-500 uppercase">{label}</p>
      <p
        className={`text-sm font-bold ${enabled ? "text-gray-800 dark:text-gray-200" : "text-gray-400 italic"}`}
      >
        {enabled && value !== "" && value !== null ? value : "Disabled"}
      </p>
    </div>
  </div>
);

// =============================================================================
// DATA TRANSFORMATION HELPERS
// =============================================================================

const transformHeaderDataFromBackend = (backendHeaderData) => {
  if (!backendHeaderData || !Array.isArray(backendHeaderData)) {
    return { selectedOptions: {}, remarks: {}, capturedImages: {} };
  }

  const selectedOptions = {};
  const remarks = {};
  const capturedImages = {};

  backendHeaderData.forEach((section) => {
    const headerId = section.headerId;
    if (section.selectedOption) {
      selectedOptions[headerId] = section.selectedOption;
    }
    if (section.remarks) {
      remarks[headerId] = section.remarks;
    }
    if (section.images && Array.isArray(section.images)) {
      section.images.forEach((img, index) => {
        const key = img.id || `${headerId}_${index}`;
        capturedImages[key] = {
          id: img.id || key,
          url: img.imageURL ? `${API_BASE_URL}${img.imageURL}` : img.imgSrc,
        };
      });
    }
  });

  return { selectedOptions, remarks, capturedImages };
};

const transformPhotoDataFromBackend = (backendPhotoData) => {
  if (!backendPhotoData || !Array.isArray(backendPhotoData)) {
    return { remarks: {}, capturedImages: {} };
  }

  const remarks = {};
  const capturedImages = {};

  backendPhotoData.forEach((section) => {
    if (section.items && Array.isArray(section.items)) {
      section.items.forEach((item) => {
        const itemKeyBase = `${section.sectionId}_${item.itemNo}`;
        if (item.remarks) {
          remarks[itemKeyBase] = item.remarks;
        }
        if (item.images && Array.isArray(item.images)) {
          item.images.forEach((img, index) => {
            const key = img.id || `${itemKeyBase}_${index}`;
            capturedImages[key] = {
              id: img.id || key,
              url: img.imageURL ? `${API_BASE_URL}${img.imageURL}` : img.imgSrc,
            };
          });
        }
      });
    }
  });

  return { remarks, capturedImages };
};

const transformMeasurementDataFromBackend = (backendMeasurementData) => {
  if (!backendMeasurementData || !Array.isArray(backendMeasurementData)) {
    return { savedMeasurements: [], manualDataByGroup: {} };
  }

  const processedMeasurements = backendMeasurementData
    //.filter((m) => m.size !== "Manual_Entry")
    .map((m) => ({
      ...m,
      allEnabledPcs: new Set(m.allEnabledPcs || []),
      criticalEnabledPcs: new Set(m.criticalEnabledPcs || []),
    }));

  const processedManualDataByGroup = {};
  backendMeasurementData.forEach((item) => {
    if (item.manualData) {
      const groupId = item.groupId;
      const processedImages = (item.manualData.images || []).map((img) => {
        let displayUrl = img.imageURL;
        if (
          displayUrl &&
          !displayUrl.startsWith("http") &&
          !displayUrl.startsWith("data:")
        ) {
          displayUrl = `${API_BASE_URL}${displayUrl}`;
        }
        return {
          id: img.imageId || img.id,
          url: displayUrl,
          imgSrc: displayUrl,
          editedImgSrc: displayUrl,
          remark: img.remark || "",
          history: [],
        };
      });

      processedManualDataByGroup[groupId] = {
        remarks: item.manualData.remarks || "",
        status: item.manualData.status || "Pass",
        images: processedImages,
      };
    }
  });

  return {
    savedMeasurements: processedMeasurements,
    manualDataByGroup: processedManualDataByGroup,
    isConfigured: processedMeasurements.length > 0,
  };
};

// =============================================================================
// MAIN COMPONENT
// =============================================================================

const YPivotQAReportFullView = () => {
  const { reportId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Loading & Error States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data States
  const [report, setReport] = useState(null);
  const [orderData, setOrderData] = useState(null);
  const [inspectorInfo, setInspectorInfo] = useState(null);
  const [definitions, setDefinitions] = useState({ headers: [], photos: [] });
  const [measurementSpecs, setMeasurementSpecs] = useState({
    Before: { full: [], selected: [] },
    After: { full: [], selected: [] },
  });
  const [sizeList, setSizeList] = useState([]);
  const [activeValidColors, setActiveValidColors] = useState([]);
  const [shippingBreakdown, setShippingBreakdown] = useState(null);

  // UI States
  const [previewImage, setPreviewImage] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    aql: true,
    defectSummary: true,
    order: true,
    config: true,
    header: true,
    photos: true,
    measurement: true,
    measurementDistribution: false,
    ppSheet: true,
    techInfo: true,
  });

  const toggleSection = (key) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  // Permission State
  const [canViewReportId, setCanViewReportId] = useState(false);
  const [isApprover, setIsApprover] = useState(false);

  const [defectHeatmap, setDefectHeatmap] = useState(null);

  const [showDecisionModal, setShowDecisionModal] = useState(false);

  // =========================================================================
  // FETCH ALL DATA
  // =========================================================================
  useEffect(() => {
    const fetchAllData = async () => {
      if (!reportId) {
        setError("No Report ID provided");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // 1. Fetch Report Data
        const reportRes = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}`,
        );

        if (!reportRes.data.success) {
          throw new Error("Report not found");
        }

        const reportData = reportRes.data.data;
        setReport(reportData);

        // 2. Fetch Order Data
        const orderNos = reportData.orderNos || [];
        if (orderNos.length > 0) {
          let orderFetchResult = null;

          if (reportData.orderType === "single" || orderNos.length === 1) {
            const orderRes = await axios.get(
              `${API_BASE_URL}/api/fincheck-inspection/order-details/${orderNos[0]}`,
            );
            if (orderRes.data.success) {
              orderFetchResult = {
                ...orderRes.data.data,
                isSingle: true,
                orderBreakdowns: [
                  {
                    orderNo: orderNos[0],
                    totalQty: orderRes.data.data.dtOrder?.totalQty,
                    colorSizeBreakdown: orderRes.data.data.colorSizeBreakdown,
                    yorksysOrder: orderRes.data.data.yorksysOrder,
                  },
                ],
              };
            }
          } else {
            const orderRes = await axios.post(
              `${API_BASE_URL}/api/fincheck-inspection/multiple-order-details`,
              { orderNos },
            );
            if (orderRes.data.success) {
              orderFetchResult = { ...orderRes.data.data, isSingle: false };
            }
          }

          setOrderData(orderFetchResult);
        }

        // 3. Fetch Inspector Info
        if (reportData.empId) {
          try {
            const inspectorRes = await axios.get(
              `${API_BASE_URL}/api/user-details?empId=${reportData.empId}`,
            );
            if (inspectorRes.data) {
              setInspectorInfo(inspectorRes.data);
            }
          } catch (err) {
            console.warn("Could not fetch inspector info", err);
            setInspectorInfo({
              emp_id: reportData.empId,
              eng_name: reportData.empName,
              face_photo: null,
            });
          }
        }

        // 4. Fetch Section Definitions
        const [headersRes, photosRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/qa-sections-home`),
          axios.get(`${API_BASE_URL}/api/qa-sections-photos`),
        ]);
        setDefinitions({
          headers: headersRes.data.data || [],
          photos: photosRes.data.data || [],
        });

        // 5. Fetch Measurement Specs
        if (
          reportData.measurementData &&
          reportData.measurementData.length > 0
        ) {
          try {
            const specsRes = await axios.get(
              `${API_BASE_URL}/api/fincheck-reports/${reportId}/measurement-specs`,
            );

            if (specsRes.data.success) {
              setMeasurementSpecs(specsRes.data.specs); // Save { Before:..., After:... }
              setSizeList(specsRes.data.sizeList || []);
              // --- ADD THIS LINE to save the filtered colors from backend ---
              setActiveValidColors(specsRes.data.activeColors || []);
            }
          } catch (err) {
            console.warn("Could not fetch measurement specs", err);
          }
        }
      } catch (err) {
        console.error("Error fetching report data:", err);
        setError(
          err.response?.data?.message || err.message || "Failed to load report",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [reportId]);

  // USEEFFECT FOR PERMISSION CHECK
  useEffect(() => {
    const checkPermission = async () => {
      if (user?.emp_id) {
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/fincheck-reports/check-permission?empId=${user.emp_id}`,
          );
          if (res.data && res.data.isAdmin) {
            setCanViewReportId(true);
          } else {
            setCanViewReportId(false);
          }
        } catch (error) {
          console.error("Failed to check permission", error);
          setCanViewReportId(false);
        }
      }
    };
    checkPermission();
  }, [user]);

  // USEEFFECT FOR APPROVAL PERMISSION CHECK
  useEffect(() => {
    const checkApprovalStatus = async () => {
      // We need both the logged-in User AND the Report to be loaded
      // so we can validate the specific report ID/Buyer against the user.
      if (user?.emp_id && report?.reportId) {
        try {
          // Pass both empId AND reportId
          const res = await axios.get(
            `${API_BASE_URL}/api/fincheck-reports/check-approval-permission?empId=${user.emp_id}&reportId=${report.reportId}`,
          );

          if (res.data && res.data.success && res.data.isApprover) {
            setIsApprover(true);
          } else {
            setIsApprover(false);
          }
        } catch (error) {
          console.error("Failed to check approval permission", error);
          setIsApprover(false);
        }
      }
    };

    checkApprovalStatus();
    // Add 'report' to dependency array so it re-runs once report details are fetched
  }, [user, report]);

  // Fetch Defect Heatmap (Visual Locations)
  useEffect(() => {
    const fetchHeatmap = async () => {
      if (!reportId) return;
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}/defect-heatmap`,
        );
        if (res.data.success) {
          setDefectHeatmap(res.data.data);
        }
      } catch (err) {
        // It's okay if this fails (e.g., 404 if no map config exists)
        // Just log nicely and don't set state
        console.log("No defect location map available or error fetching.");
      }
    };

    // Only fetch if we have loaded the report (to ensure it exists)
    if (report) {
      fetchHeatmap();
    }
  }, [reportId, report]);

  // =========================================================================
  // DERIVED DATA
  // =========================================================================

  const selectedOrders = useMemo(() => report?.orderNos || [], [report]);

  // NEW: Extract Unique SKUs from all breakdowns
  const allUniqueSKUs = useMemo(() => {
    if (!orderData?.orderBreakdowns) return [];
    const skus = new Set();
    orderData.orderBreakdowns.forEach((bd) => {
      if (bd.yorksysOrder?.skuData) {
        bd.yorksysOrder.skuData.forEach((item) => {
          if (item.sku) skus.add(item.sku);
        });
      }
    });
    return Array.from(skus).sort();
  }, [orderData]);

  const determinedBuyer = useMemo(() => {
    if (!selectedOrders || selectedOrders.length === 0) return "Unknown";
    return determineBuyerFromOrderNo(selectedOrders[0]).buyer;
  }, [selectedOrders]);

  const selectedTemplate = useMemo(() => {
    return (
      report?.selectedTemplate || {
        ReportType: report?.reportType,
        Measurement:
          report?.inspectionDetails?.measurement || report?.measurementMethod,
        InspectedQtyMethod: report?.inspectionMethod,
        _id: report?.inspectionDetails?.reportTypeId,
        SelectedPhotoSectionList: [],
      }
    );
  }, [report]);

  const config = useMemo(() => {
    const details = report?.inspectionDetails || {};
    return {
      inspectedQty: details.inspectedQty,
      cartonQty: details.cartonQty,
      shippingStage: details.shippingStage,
      remarks: details.remarks,
      aqlSampleSize: details.aqlSampleSize,
      aqlConfig: details.aqlConfig,
      productType: details.productType,
      productTypeId: details.productTypeId,
      embInfo: details.embInfo,
      printInfo: details.printInfo,
    };
  }, [report]);

  // Extract for easy access
  const embInfo = config?.embInfo;
  const printInfo = config?.printInfo;

  const lineTableConfig = useMemo(() => {
    return report?.inspectionConfig?.configGroups || [];
  }, [report]);

  const headerData = useMemo(() => {
    return transformHeaderDataFromBackend(report?.headerData);
  }, [report?.headerData]);

  const photoData = useMemo(() => {
    return transformPhotoDataFromBackend(report?.photoData);
  }, [report?.photoData]);

  const processedMeasurementData = useMemo(() => {
    return transformMeasurementDataFromBackend(report?.measurementData);
  }, [report?.measurementData]);

  const savedMeasurements = processedMeasurementData.savedMeasurements;

  // EFFECT: Fetch Shipping Breakdown if Shipping Stage exists
  useEffect(() => {
    const fetchShippingData = async () => {
      // Logic: If we have a reportId AND the config says there is a shipping stage
      if (reportId && config?.shippingStage) {
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}/shipping-stage-breakdown`,
          );
          if (res.data.success) {
            setShippingBreakdown(res.data.data);
          }
        } catch (err) {
          console.error("Failed to load shipping breakdown", err);
        }
      }
    };

    // Ensure config is loaded before checking
    if (config?.shippingStage) {
      fetchShippingData();
    }
  }, [reportId, config?.shippingStage]);

  // =========================================================================
  // NEW: Process Measurement Data by Stage (Before / After)
  // =========================================================================
  const measurementStageData = useMemo(() => {
    const stages = ["Before", "After"];

    return stages
      .map((stage) => {
        // Filter measurements for this stage
        const stageMeasurements = savedMeasurements.filter((m) => {
          // 1. Check Stage
          const isStageMatch =
            m.stage === stage || (!m.stage && stage === "Before");

          // 2. Check Color (If we have a valid list, ensure this measurement matches)
          // We use m.colorName as that is what the backend used to generate the list
          const isColorValid =
            activeValidColors.length === 0 || // If list is empty, show all (backward compatibility)
            activeValidColors.includes(m.colorName);

          return isStageMatch && isColorValid;
        });

        // const stageMeasurements = savedMeasurements.filter(
        //   (m) => m.stage === stage || (!m.stage && stage === "Before")
        // );

        if (stageMeasurements.length === 0) return null;

        // Get the specific Specs for this stage from state
        // Note: measurementSpecs state structure must be { Before:..., After:... }
        const stageSpecs = measurementSpecs[stage] || {
          full: [],
          selected: [],
        };

        // Create display copies with Suffixes for the Overall Table (e.g. "Size (B)")
        const suffix = stage === "Before" ? "(B)" : "(A)";
        const measurementsForDisplay = stageMeasurements.map((m) => ({
          ...m,
          size: `${m.size} ${suffix}`,
        }));

        // Group data
        const grouped = groupMeasurementsByGroupId(stageMeasurements);
        const groupedForOverall = groupMeasurementsByGroupId(
          measurementsForDisplay,
        );

        return {
          stage,
          label:
            stage === "Before"
              ? "Before Wash Measurement"
              : "Buyer Spec Measurement",
          suffix,
          groupedData: grouped,
          groupedDataForOverall: groupedForOverall,
          specs: stageSpecs,
        };
      })
      .filter(Boolean); // Remove empty stages
  }, [savedMeasurements, measurementSpecs]);

  const measurementResult = useMemo(() => {
    return calculateOverallMeasurementResult(savedMeasurements);
  }, [savedMeasurements]);

  const savedDefects = useMemo(() => {
    return report?.defectData || [];
  }, [report?.defectData]);

  // Calculations
  const isAQLMethod = useMemo(
    () =>
      selectedTemplate?.InspectedQtyMethod === "AQL" ||
      report?.inspectionMethod === "AQL",
    [selectedTemplate, report],
  );

  const inspectedQty = useMemo(
    () => parseInt(config?.inspectedQty) || 0,
    [config?.inspectedQty],
  );

  // Flatten Defect Images for Display
  const defectImages = useMemo(() => {
    const images = [];
    if (!report?.defectData) return images;

    // 1. Helpers to track sequential counting per Config Group
    const configCounters = {}; // Stores current max count for a Config: { "Line 30": 2 }
    const pieceIdMap = {}; // Maps a unique DB ID to a Display ID: { "db_id_123": 1 }

    // Helper function to get the Sequential Display Number
    const getDisplayPcsNumber = (configKey, uniqueDbId) => {
      // Create a composite key to ensure uniqueness across report
      const mapKey = `${configKey}__${uniqueDbId}`;
      if (pieceIdMap[mapKey]) return pieceIdMap[mapKey]; // Return existing number if we've seen this piece (e.g. for Additional images)

      // Initialize counter for this config if new
      if (!configCounters[configKey]) configCounters[configKey] = 0;

      // Increment and save
      configCounters[configKey]++;
      pieceIdMap[mapKey] = configCounters[configKey];
      return configCounters[configKey];
    };

    report.defectData.forEach((defect) => {
      const { defectName } = defect;

      // Config Label
      const configParts = [
        defect.lineName ? `Line ${defect.lineName}` : null,
        defect.tableName ? `Table ${defect.tableName}` : null,
        defect.colorName ? `Color ${defect.colorName}` : null,
      ].filter(Boolean);
      const configLabel =
        configParts.length > 0 ? configParts.join(" • ") : "General";

      if (defect.isNoLocation) {
        // No Location Mode
        defect.images?.forEach((img, idx) => {
          // For No-Location, every image is treated as a new "Piece" finding
          // We generate a unique ID based on the defect + index
          const dbUniqueId = `${defect._id}_Gen_${idx}`;
          const displayNum = getDisplayPcsNumber(configLabel, dbUniqueId);

          images.push({
            ...img,
            uniquePieceId: dbUniqueId,
            pcsLabel: `Pcs #${displayNum}`,
            defectName,
            locationText: "General",
            positionType: "N/A",
            status: defect.status,
            configLabel: configLabel,
            isMain: true,
            // For No-Location, use the root remark
            comment: defect.additionalRemark || "",
          });
        });
      } else {
        // Location Mode
        defect.locations?.forEach((loc) => {
          loc.positions?.forEach((pos) => {
            const dbUniqueId = `${defect._id}_${loc.locationId}_${pos.pcsNo}`;
            const displayNum = getDisplayPcsNumber(configLabel, dbUniqueId);
            const pcsLabel = `Pcs #${displayNum}`;

            // Common props (REMOVED 'comment' from here to prevent bleeding)
            const commonProps = {
              uniquePieceId: dbUniqueId,
              pcsLabel,
              defectName,
              locationText: `${loc.locationName} - ${loc.view}`,
              positionType: pos.position,
              status: pos.status,
              configLabel: configLabel,
            };

            // 1. Required (Main) Image
            if (pos.requiredImage) {
              // Priority: Image-level remark > Position-level remark > Legacy comment
              const mainRemark =
                pos.requiredImage.additionalRemark || pos.comment || "";

              images.push({
                ...pos.requiredImage,
                ...commonProps,
                isMain: true,
                comment: mainRemark, // Specific to Main
              });
            }

            // 2. Additional Images
            pos.additionalImages?.forEach((img) => {
              // If image has no specific comment, use the 'pos.additionalRemark' here
              const addRemark = img.comment || pos.additionalRemark || "";
              images.push({
                ...img,
                ...commonProps,
                isMain: false,
                comment: addRemark, // Specific to Additional
              });
            });
          });
        });
      }
    });

    return images;
  }, [report?.defectData]);

  // =========================================================================
  // Group Defect Images by Configuration for Display
  // =========================================================================

  const defectImagesByConfig = useMemo(() => {
    const groups = {};
    defectImages.forEach((img) => {
      const key = img.configLabel;
      if (!groups[key]) {
        groups[key] = { images: [], uniquePieces: new Set() };
      }
      groups[key].images.push(img);
      groups[key].uniquePieces.add(img.uniquePieceId); // Add Piece ID to Set
    });
    return groups;
  }, [defectImages]);

  // =========================================================================
  // Flatten Photo Documentation Images for Swiping
  // =========================================================================
  const allPhotoDataImages = useMemo(() => {
    if (!report?.photoData) return [];

    const flatList = [];

    report.photoData.forEach((section) => {
      if (section.items && Array.isArray(section.items)) {
        section.items.forEach((item) => {
          if (item.images && Array.isArray(item.images)) {
            item.images.forEach((img) => {
              // Construct the object structure expected by ImagePreviewModal
              flatList.push({
                ...img, // Keep original ID and URL
                // 1. Main Section Name -> Mapped to Title
                defectName: section.sectionName,

                // 2. Sub Section Name -> Mapped to Position Badge
                // (Using positionType allows it to appear as a badge)
                positionType: item.itemName,

                // 3. Remarks -> Mapped to Subtitle/Location text
                locationText: item.remarks ? item.remarks : "",
              });
            });
          }
        });
      }
    });

    return flatList;
  }, [report?.photoData]);

  const summaryData = useDefectSummaryData(savedDefects, null, report);
  const { aqlSampleData, loadingAql } = useAqlData(
    isAQLMethod,
    determinedBuyer,
    inspectedQty,
  );

  const aqlResult = useMemo(
    () => calculateAqlResult(aqlSampleData, summaryData.totals),
    [aqlSampleData, summaryData.totals],
  );

  const defectResult = useMemo(() => {
    if (aqlResult) return aqlResult.final;
    if (summaryData.totals.critical > 0 || summaryData.totals.major > 0)
      return "FAIL";
    return "PASS";
  }, [aqlResult, summaryData.totals]);

  const finalReportResult = useMemo(() => {
    if (measurementResult.result === "FAIL" || defectResult === "FAIL") {
      return "FAIL";
    }
    return "PASS";
  }, [measurementResult.result, defectResult]);

  // Scope columns for config table
  const scopeColumns = useMemo(() => {
    if (!selectedTemplate) return [];
    const cols = [];
    if (selectedTemplate.Line === "Yes") cols.push("Line");
    if (selectedTemplate.Table === "Yes") cols.push("Table");
    if (selectedTemplate.Colors === "Yes") cols.push("Color");
    // Fallback: check if lineTableConfig has these fields
    if (cols.length === 0 && lineTableConfig.length > 0) {
      const sample = lineTableConfig[0];
      if (sample.lineName || sample.line) cols.push("Line");
      if (sample.tableName || sample.table) cols.push("Table");
      if (sample.colorName || sample.color) cols.push("Color");
    }
    return cols;
  }, [selectedTemplate, lineTableConfig]);

  const relevantPhotoSections = useMemo(() => {
    if (
      !selectedTemplate?.SelectedPhotoSectionList ||
      definitions.photos.length === 0
    ) {
      return definitions.photos; // Show all if not specified
    }
    const allowedIds = selectedTemplate.SelectedPhotoSectionList.map(
      (i) => i.PhotoSectionID,
    );
    return definitions.photos.filter((p) => allowedIds.includes(p._id));
  }, [selectedTemplate, definitions.photos]);

  const dtOrder = orderData?.dtOrder || {};
  const yorksys = orderData?.yorksysOrder || {};
  const skuData = yorksys.skuData || [];

  const colorSizeBreakdown = useMemo(() => {
    if (!orderData?.orderBreakdowns) return null;
    return (
      orderData.colorSizeBreakdown ||
      orderData.orderBreakdowns[0]?.colorSizeBreakdown
    );
  }, [orderData]);

  // =========================================================================
  // HANDLERS
  // =========================================================================

  const handleGoBack = () => {
    window.close(); // Close tab if opened in new tab
    // Fallback: navigate back
    navigate("/fincheck-reports");
  };

  const handleDecisionSubmit = async (result) => {
    setTimeout(() => {
      window.location.reload();
    }, 2000);
  };

  // =========================================================================
  // RENDER
  // =========================================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 dark:text-white">
            Loading Report...
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Report ID: {reportId}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 dark:text-white mb-2">
            Error Loading Report
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{error}</p>
          <button
            onClick={handleGoBack}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700">No Report Data</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-xl print:hidden">
        <div className="max-w-8xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleGoBack}
              className="flex items-center gap-2 px-3 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-white font-bold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-black text-white">
                  Inspection Report
                </h1>
                {/* CONDITIONAL RENDER HERE */}
                {canViewReportId && (
                  <p className="text-xs text-indigo-100">
                    ID: <span className="font-mono">{report.reportId}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* --- DECISION BUTTON --- */}
            {isApprover && (
              <button
                // Only allow click if status is 'completed'
                onClick={() => {
                  if (report.status === "completed") {
                    setShowDecisionModal(true);
                  }
                }}
                disabled={report.status !== "completed"}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold border transition-colors ${
                  report.status === "completed"
                    ? "bg-indigo-800/40 hover:bg-indigo-900/40 text-white border-indigo-400/30 cursor-pointer"
                    : "bg-gray-400/20 text-gray-400 border-gray-500/20 cursor-not-allowed"
                }`}
                title={
                  report.status !== "completed"
                    ? "Report must be completed by QA first"
                    : "Make Leader Decision"
                }
              >
                <Gavel className="w-4 h-4" />
                <span className="hidden sm:inline">Decision</span>
              </button>
            )}

            {/* New PDF Generator Button */}
            <YPivotQAReportPDFGenerator
              report={report}
              orderData={orderData}
              shippingBreakdown={shippingBreakdown}
              inspectorInfo={inspectorInfo}
              definitions={definitions}
              headerData={headerData}
              measurementStageData={measurementStageData}
              measurementResult={measurementResult}
              summaryData={summaryData}
              defectImages={defectImages}
              aqlResult={aqlResult}
              aqlSampleData={aqlSampleData}
              finalResult={finalReportResult}
              defectResult={defectResult}
              isAQLMethod={isAQLMethod}
              inspectedQty={inspectedQty}
              sizeList={sizeList}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 pb-12 pt-20 print:pt-4 space-y-4">
        {/* 1. Inspector & Report ID */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Inspector Card */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 h-full relative overflow-hidden flex flex-col">
              <div className="h-20 bg-gradient-to-br from-indigo-600 to-purple-700 relative">
                <div className="absolute inset-0 bg-white/10 opacity-30"></div>
              </div>

              <div className="flex justify-center -mt-10 relative px-4">
                <div className="w-20 h-20 rounded-2xl border-4 border-white dark:border-gray-800 shadow-lg overflow-hidden bg-gray-100 dark:bg-gray-700 relative">
                  {inspectorInfo?.face_photo ? (
                    <img
                      src={getInspectorPhotoUrl(inspectorInfo.face_photo)}
                      alt="Inspector"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.parentElement.querySelector(
                          ".fallback-icon",
                        ).style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className={`fallback-icon w-full h-full items-center justify-center text-gray-400 bg-gray-100 dark:bg-gray-700 ${
                      inspectorInfo?.face_photo ? "hidden" : "flex"
                    }`}
                  >
                    <User className="w-8 h-8" />
                  </div>
                </div>
              </div>

              <div className="p-4 pt-2 text-center flex-1 flex flex-col">
                <h3 className="text-base font-bold text-gray-800 dark:text-white leading-tight">
                  {inspectorInfo?.eng_name || report.empName || "Unknown"}
                </h3>
                <div className="mt-2 flex justify-center">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-100 dark:border-indigo-800">
                    <span className="text-[10px] font-bold uppercase">ID</span>
                    <span className="text-xs font-mono font-bold">
                      {report.empId || "--"}
                    </span>
                  </div>
                </div>
                <div className="mt-4 w-full pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-2 text-left">
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase font-medium">
                      Title
                    </p>
                    <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate">
                      {inspectorInfo?.job_title || "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-400 uppercase font-medium">
                      Dept
                    </p>
                    <p className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate">
                      {inspectorInfo?.dept_name || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Report Info Card */}
          <div className="md:col-span-8 lg:col-span-9">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-5 h-full">
              <div className="flex flex-col md:flex-row gap-6 h-full">
                {/* LEFT SIDE: Product Image & Type */}
                <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col">
                  <div className="flex-1 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-600 p-4 flex flex-col items-center justify-center relative overflow-hidden group">
                    {/* Product Image Logic */}
                    {(() => {
                      // Try to find image in populated productTypeId or inspectionDetails
                      const imgUrl =
                        report.inspectionDetails?.productTypeId?.imageURL ||
                        report.productTypeId?.imageURL || // If populated at root
                        config?.productTypeId?.imageURL;

                      const fullUrl = getProductImageUrl(imgUrl);

                      if (fullUrl) {
                        return (
                          <img
                            src={fullUrl}
                            alt="Product"
                            className="w-full h-32 object-contain drop-shadow-md transform group-hover:scale-105 transition-transform duration-300"
                          />
                        );
                      } else {
                        return (
                          <div className="text-gray-300 dark:text-gray-600">
                            <Shirt className="w-16 h-16" />
                          </div>
                        );
                      }
                    })()}

                    <div className="mt-3 text-center w-full">
                      <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-1">
                        Product Type
                      </p>
                      <span className="inline-block px-3 py-1 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-sm font-black text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-600">
                        {report.productType || "Unknown"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT SIDE: Report Details */}
                <div className="flex-1 flex flex-col justify-center">
                  {/* Header Section - Flex Container for Name & Order Card */}
                  <div className="mb-5 border-b border-gray-100 dark:border-gray-700 pb-3 flex justify-between items-start gap-4">
                    {/* Left: Report Name & Created Date */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                          <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                          Inspection Report
                        </span>
                      </div>
                      <h1 className="text-lg font-black text-gray-800 dark:text-white leading-tight">
                        {report.reportType || "General Inspection"}
                      </h1>
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Created: {new Date(report.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {/* Right: Order & Style Card (Small Width) */}
                    <div className="hidden sm:block">
                      <div className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm p-2.5 min-w-[140px] max-w-[200px]">
                        <div className="text-right">
                          <p className="text-[9px] uppercase font-bold text-gray-400 mb-0.5">
                            Order No
                          </p>
                          <p
                            className="text-sm font-black text-gray-800 dark:text-white leading-tight truncate"
                            title={selectedOrders.join(", ")}
                          >
                            {selectedOrders.length > 0
                              ? selectedOrders[0]
                              : "-"}
                            {selectedOrders.length > 1 && (
                              <span className="text-xs text-gray-400 font-medium">
                                {" "}
                                +{selectedOrders.length - 1}
                              </span>
                            )}
                          </p>
                        </div>
                        <div className="mt-1.5 pt-1.5 border-t border-gray-100 dark:border-gray-600 text-right">
                          <p className="text-[10px] text-gray-500 dark:text-gray-400">
                            Style:{" "}
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              {dtOrder.custStyle || "N/A"}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* The 4 Info Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Card 1: Report ID */}
                    {canViewReportId && (
                      <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30">
                        <p className="text-[10px] text-indigo-500 uppercase font-bold mb-1">
                          Report ID
                        </p>
                        <p className="text-sm font-mono font-black text-indigo-700 dark:text-indigo-300 truncate">
                          {report.reportId}
                        </p>
                      </div>
                    )}

                    {/* Card 2: Date */}
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                        Date
                      </p>
                      <p className="text-sm font-bold text-gray-800 dark:text-white">
                        {new Date(report.inspectionDate).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Card 3: Type (First/Re) */}
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700">
                      <p className="text-[10px] text-gray-500 uppercase font-bold mb-1">
                        Type
                      </p>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            report.inspectionType === "first"
                              ? "bg-emerald-500"
                              : "bg-amber-500"
                          }`}
                        ></span>
                        <p className="text-sm font-bold text-gray-800 dark:text-white capitalize">
                          {report.inspectionType || "First"}
                        </p>
                      </div>
                    </div>

                    {/* Card 4: Buyer */}
                    <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30">
                      <p className="text-[10px] text-purple-500 uppercase font-bold mb-1">
                        Buyer
                      </p>
                      <p className="text-sm font-black text-purple-700 dark:text-purple-300 truncate">
                        {determinedBuyer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Report Result Cards */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-gray-800 dark:text-white">
              Report Result
            </h2>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <ResultCard title="Final" result={finalReportResult} icon={Award} />
            <ResultCard
              title="Measurement"
              result={measurementResult.result}
              icon={Ruler}
            />
            <ResultCard title="Defect" result={defectResult} icon={Bug} />
          </div>
        </div>

        {/* 3. AQL Defect Result (Only if AQL) */}
        {isAQLMethod && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("aql")}
            >
              <h2 className="text-white font-bold text-sm flex items-center gap-2">
                <Shield className="w-4 h-4" /> Defect Result (AQL)
              </h2>
              {expandedSections.aql ? (
                <ChevronUp className="text-white w-4 h-4" />
              ) : (
                <ChevronDown className="text-white w-4 h-4" />
              )}
            </div>

            {expandedSections.aql && (
              <div className="p-3 space-y-3">
                {loadingAql ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                  </div>
                ) : aqlResult ? (
                  <>
                    <AQLConfigCards
                      aqlSampleData={aqlSampleData}
                      aqlResult={aqlResult}
                      inspectedQty={inspectedQty}
                    />
                    <AQLResultTable
                      defectsList={summaryData.defectsList}
                      totals={summaryData.totals}
                      aqlResult={aqlResult}
                    />
                    <FinalDefectResultBanner result={aqlResult.final} compact />
                  </>
                ) : (
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 text-center">
                    <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                    <p className="text-xs font-bold text-amber-700">
                      AQL Configuration Not Available
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 4. Defect Summary */}
        {(summaryData.groups.length >= 0 ||
          (report.defectManualData && report.defectManualData.length > 0)) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("defectSummary")}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-white" />
                <h2 className="text-white font-bold text-sm">Defect Summary</h2>
                <span className="bg-white/20 px-1.5 py-0.5 rounded text-white text-[10px] font-bold">
                  {summaryData.totals.total} total
                </span>
              </div>
              {expandedSections.defectSummary ? (
                <ChevronUp className="text-white w-4 h-4" />
              ) : (
                <ChevronDown className="text-white w-4 h-4" />
              )}
            </div>

            {/* --- MANUAL DEFECT DISPLAY SECTION --- */}
            {report.defectManualData && report.defectManualData.length > 0 && (
              <div className="px-4 pb-6">
                <YPivotQAInspectionManualDefectDisplay
                  manualData={report.defectManualData}
                />
              </div>
            )}

            {expandedSections.defectSummary && (
              <div className="p-0">
                {/* existing Summary Table */}
                <DefectSummaryTable
                  groups={summaryData.groups}
                  totals={summaryData.totals}
                />

                {/* --- MISSING DEFECTS BY QC INSPECTOR CHART --- */}
                <div className="px-4 pb-2">
                  <YPivotQAInspectionMissingDefectsByQC reportId={reportId} />
                </div>

                {/* --- DEFECT LOCATION VISUAL SUMMARY --- */}
                {defectHeatmap && (
                  <DefectLocationSummary
                    mapData={defectHeatmap.map}
                    counts={defectHeatmap.counts}
                  />
                )}

                {/* Defect Images Grid */}
                {defectImages.length > 0 && (
                  <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                      <Camera className="w-3.5 h-3.5" />
                      Defect Visual Evidence
                    </h3>

                    {/* Iterate through Groups */}
                    {Object.entries(defectImagesByConfig).map(
                      ([configName, groupData]) => (
                        <div key={configName} className="mb-8 last:mb-0">
                          {/* Configuration Header */}
                          <div className="flex items-center gap-2 mb-3 pl-1">
                            <Layers className="w-3.5 h-3.5 text-indigo-500" />
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">
                              {configName}
                            </span>
                            {/* COUNT: Use the Set size (Unique Pieces) instead of Image Length */}
                            <span className="text-[10px] bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded-full font-bold">
                              {groupData.uniquePieces.size}
                            </span>
                          </div>

                          {/* Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groupData.images.map((img) => (
                              <div
                                key={img.imageId || img.url}
                                className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm group flex flex-col"
                              >
                                {/* Image Container */}
                                <div
                                  className="relative h-72 cursor-pointer overflow-hidden bg-gray-100"
                                  onClick={() => {
                                    const globalIndex = defectImages.findIndex(
                                      (x) => x === img,
                                    );
                                    setPreviewImage({
                                      images: defectImages,
                                      startIndex:
                                        globalIndex !== -1 ? globalIndex : 0,
                                    });
                                  }}
                                >
                                  <img
                                    src={
                                      img.imageURL.startsWith("http")
                                        ? img.imageURL
                                        : `${API_BASE_URL}${img.imageURL}`
                                    }
                                    alt={img.defectName}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                  />

                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100 transition-all drop-shadow-md" />
                                  </div>

                                  {/* LABELS CONTAINER */}
                                  <div className="absolute top-2 right-2 flex flex-row items-center gap-1">
                                    {/* Position Badge */}
                                    {img.positionType &&
                                      img.positionType !== "N/A" && (
                                        <span
                                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase shadow-sm border ${
                                            img.positionType === "Outside"
                                              ? "bg-orange-500 text-white border-orange-600"
                                              : "bg-blue-500 text-white border-blue-600"
                                          }`}
                                        >
                                          {img.positionType}
                                        </span>
                                      )}
                                    {/* Status Badge */}
                                    {img.status && (
                                      <span
                                        className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase shadow-sm border ${
                                          img.status === "Minor"
                                            ? "bg-orange-100 text-orange-700 border-orange-200"
                                            : img.status === "Major"
                                              ? "bg-red-100 text-red-700 border-red-200"
                                              : "bg-red-600 text-white border-red-700"
                                        }`}
                                      >
                                        {img.status}
                                      </span>
                                    )}
                                    {/* NEW: Additional Badge (Purple) */}
                                    {!img.isMain && (
                                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase shadow-sm border bg-purple-500 text-white border-purple-600">
                                        Additional
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Details Footer */}
                                <div className="p-3 flex-1 flex flex-col justify-between">
                                  <div>
                                    {/* NEW: Pcs # Label + Defect Name */}
                                    <div className="flex items-start gap-1.5 mb-1">
                                      <span className="flex-shrink-0 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-[10px] font-bold border border-gray-200 dark:border-gray-600">
                                        {img.pcsLabel}
                                      </span>

                                      {/* Title Logic: Main vs Additional */}
                                      <p className="text-sm font-bold text-gray-800 dark:text-gray-200 leading-tight">
                                        {img.isMain
                                          ? img.defectName
                                          : "Additional Evidence"}
                                      </p>
                                    </div>

                                    {/* Location Text (Hide for Additional if you want, or keep for context) */}
                                    {img.isMain && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate pl-1">
                                        {img.locationText}
                                      </p>
                                    )}
                                  </div>

                                  {/* Comment Section (with Icon) */}
                                  {(img.comment ||
                                    (img.isMain && img.displayRemark)) && (
                                    <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700 flex items-start gap-1.5">
                                      <MessageSquare className="w-3 h-3 text-indigo-500 mt-0.5 flex-shrink-0" />
                                      <p className="text-[10px] text-gray-600 dark:text-gray-300 italic leading-snug">
                                        {img.comment}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 5. Measurement Summary */}
        {measurementStageData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div
              className="bg-[#0088CC] px-4 py-3 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("measurement")}
            >
              <h2 className="text-white font-bold text-sm flex items-center gap-2">
                <Ruler className="w-4 h-4" /> Measurement Summary
              </h2>
              {expandedSections.measurement ? (
                <ChevronUp className="text-white w-4 h-4" />
              ) : (
                <ChevronDown className="text-white w-4 h-4" />
              )}
            </div>

            {expandedSections.measurement && (
              <div className="p-4 space-y-8">
                {/* Loop through each Stage (Before / After) */}
                {measurementStageData.map((stageData) => {
                  // Check if we have any data groups (including Manual Entry)
                  const hasData = stageData.groupedData.groups.length > 0;

                  return (
                    <div key={stageData.stage} className="space-y-5">
                      {/* Stage Header */}
                      <div className="flex items-center gap-2 pb-2 border-b-2 border-cyan-100 dark:border-cyan-900">
                        <span
                          className={`px-3 py-1 rounded-lg text-xs font-bold text-white ${
                            stageData.stage === "Before"
                              ? "bg-purple-500"
                              : "bg-teal-500"
                          }`}
                        >
                          {stageData.label}
                        </span>
                      </div>

                      {/* LOADING STATE: Only show if NO Specs AND NO Data (Manual or otherwise) */}
                      {stageData.specs.full.length === 0 && !hasData ? (
                        <div className="flex flex-col items-center justify-center py-6 text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed border-gray-200">
                          <Loader2 className="w-6 h-6 animate-spin mb-1 text-indigo-500" />
                          <p className="text-xs">
                            Loading Specs for {stageData.label}...
                          </p>
                        </div>
                      ) : (
                        <>
                          {/* Overall Result Table - Only show if we have specs */}
                          {stageData.specs.full.length > 0 && (
                            <OverallMeasurementSummaryTable
                              groupedMeasurements={
                                stageData.groupedDataForOverall
                              }
                              sizeList={sizeList}
                            />
                          )}

                          {/* Detailed Groups */}
                          {stageData.groupedData.groups.map((group) => {
                            const configLabel =
                              [
                                group.lineName
                                  ? `Line ${group.lineName}`
                                  : null,
                                group.tableName
                                  ? `Table ${group.tableName}`
                                  : null,
                                group.colorName
                                  ? group.colorName.toUpperCase()
                                  : null,
                              ]
                                .filter(Boolean)
                                .join(" / ") || "General Configuration";

                            // Calculate stats only if specs exist
                            const stats =
                              stageData.specs.full.length > 0
                                ? calculateGroupStats(
                                    group.measurements,
                                    stageData.specs.full,
                                    stageData.specs.selected,
                                  )
                                : {
                                    totalPoints: 0,
                                    passPoints: 0,
                                    failPoints: 0,
                                    totalPcs: 0,
                                    passPcs: 0,
                                    failPcs: 0,
                                    pointPassRate: "0.0",
                                    pcsPassRate: "0.0",
                                  };

                            // Robustly find manual data
                            let manualData = group.measurements.find(
                              (m) => m.manualData,
                            )?.manualData;

                            if (
                              !manualData &&
                              report.measurementData?.manualDataByGroup
                            ) {
                              manualData =
                                report.measurementData.manualDataByGroup[
                                  group.id
                                ];
                            }

                            return (
                              <div
                                key={`${stageData.stage}-${group.id}`}
                                className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm"
                              >
                                <div className="bg-gray-100 dark:bg-gray-700/50 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                                  <Layers className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200 uppercase">
                                    {configLabel} ({stageData.label})
                                  </span>
                                </div>

                                <div className="p-4 space-y-5 bg-white dark:bg-gray-800">
                                  {/* Display Manual Data */}
                                  {manualData && (
                                    <YPivotQAReportMeasurementManualDisplay
                                      manualData={manualData}
                                    />
                                  )}

                                  {/* Only show Stats and Table if Specs exist */}
                                  {stageData.specs.full.length > 0 && (
                                    <>
                                      <MeasurementStatsCards stats={stats} />
                                      <div className="py-1">
                                        <MeasurementLegend />
                                      </div>
                                      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                                        <MeasurementSummaryTable
                                          measurements={group.measurements}
                                          specsData={stageData.specs.full}
                                          selectedSpecsList={
                                            stageData.specs.selected
                                          }
                                          sizeList={sizeList}
                                        />
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* --- SECTION: Measurement Value Distribution --- */}
        {measurementStageData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mt-4">
            <div
              className="bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("measurementDistribution")}
            >
              <h2 className="text-white font-bold text-sm flex items-center gap-2">
                <Calculator className="w-4 h-4" /> Measurement Value
                Distribution
              </h2>
              {expandedSections.measurementDistribution ? (
                <ChevronUp className="text-white w-4 h-4" />
              ) : (
                <ChevronDown className="text-white w-4 h-4" />
              )}
            </div>

            {expandedSections.measurementDistribution && (
              <div className="p-4">
                <YPivotQAReportMeasurementValueDistribution
                  reportId={reportId}
                />
              </div>
            )}
          </div>
        )}

        {/* 6. Order Information */}
        {orderData && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("order")}
            >
              <div>
                <h2 className="text-white font-bold text-base flex items-center gap-2">
                  <FileText className="w-5 h-5" /> Order Information
                </h2>
                <p className="text-blue-100 text-xs mt-0.5">
                  {dtOrder.customer} • Style: {dtOrder.custStyle}
                </p>
              </div>
              {expandedSections.order ? (
                <ChevronUp className="text-white w-4 h-4" />
              ) : (
                <ChevronDown className="text-white w-4 h-4" />
              )}
            </div>

            {expandedSections.order && (
              <div className="p-4 space-y-8">
                {/* 1. General Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                  <InfoRow
                    label="Order No(s)"
                    value={selectedOrders.join(", ")}
                    icon={Package}
                    className="md:col-span-2"
                  />
                  <InfoRow
                    label="Total Qty"
                    value={dtOrder.totalQty?.toLocaleString()}
                    icon={Hash}
                  />
                  <InfoRow
                    label="Factory"
                    value={dtOrder.factory}
                    icon={Building2}
                  />
                  <InfoRow label="Origin" value={dtOrder.origin} icon={Globe} />
                  <InfoRow label="Mode" value={dtOrder.mode} icon={Truck} />
                  <InfoRow
                    label="Sales Team"
                    value={dtOrder.salesTeamName}
                    icon={Users}
                  />
                  <InfoRow
                    label="Country"
                    value={dtOrder.country}
                    icon={MapPin}
                  />
                  <InfoRow
                    label="Season"
                    value={yorksys.season}
                    icon={Calendar}
                  />
                  <InfoRow
                    label="Destination"
                    value={yorksys.destination}
                    icon={MapPin}
                  />
                  <InfoRow
                    label="Product Type"
                    value={yorksys.productType}
                    icon={Layers}
                  />
                  {/* --- Carton Qty--- */}
                  {config.cartonQty && (
                    <InfoRow
                      label="Carton Qty"
                      value={config.cartonQty}
                      icon={Truck}
                    />
                  )}

                  <InfoRow
                    label="Fabric Content"
                    value={yorksys.fabricContent
                      ?.map((f) => `${f.fabricName} ${f.percentageValue}%`)
                      .join(", ")}
                    icon={Shirt}
                    className="md:col-span-2"
                  />
                  {/* --- Shipping Stage--- */}
                  {config.shippingStage && (
                    <InfoRow
                      label="Shipping Stage"
                      value={config.shippingStage}
                      icon={Truck}
                    />
                  )}

                  <InfoRow
                    label="SKU Description"
                    value={yorksys.skuDescription}
                    icon={Tag}
                    className="md:col-span-4"
                  />

                  {/* --- START OF NEW REMARKS SECTION --- */}
                  {config.remarks && (
                    <div className="md:col-span-4 mt-1">
                      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-3.5 flex gap-3">
                        <div className="shrink-0">
                          <div className="p-2 bg-amber-100 dark:bg-amber-800/40 rounded-lg">
                            <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">
                            Inspection Remarks
                          </h4>
                          <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                            {config.remarks}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* NEW: All Distinct SKUs Card */}
                  {allUniqueSKUs.length > 0 && (
                    <div className="md:col-span-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mt-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Hash className="w-3.5 h-3.5 text-gray-500" />
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                          All Included SKUs ({allUniqueSKUs.length})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {allUniqueSKUs.map((sku, i) => (
                          <span
                            key={i}
                            className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded text-xs font-mono font-medium shadow-sm"
                          >
                            {sku}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Color/Size Breakdowns (Full Width) */}
                {orderData.orderBreakdowns &&
                  orderData.orderBreakdowns.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                        <Package className="w-4 h-4 text-indigo-500" />
                        <h3 className="font-bold text-sm text-gray-800 dark:text-white">
                          Order Qty Breakdown
                        </h3>
                      </div>

                      <div className="space-y-6">
                        {orderData.orderBreakdowns.map((breakdown) => (
                          <div key={`cs-${breakdown.orderNo}`}>
                            <ColorSizeBreakdownTable
                              data={breakdown.colorSizeBreakdown}
                              orderNo={
                                orderData.orderBreakdowns.length > 1
                                  ? breakdown.orderNo
                                  : null
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* --- Shipping Stage Breakdown Table --- */}
                {config?.shippingStage && shippingBreakdown && (
                  <OrderShippingStageBreakdownTable
                    shippingData={shippingBreakdown}
                    orderNos={selectedOrders}
                  />
                )}

                {/* 3. SKU Details Tables (Full Width, Below Breakdown) */}
                {orderData.orderBreakdowns &&
                  orderData.orderBreakdowns.some(
                    (b) => b.yorksysOrder?.skuData?.length > 0,
                  ) && (
                    <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">
                        <Hash className="w-4 h-4 text-emerald-500" />
                        <h3 className="font-bold text-sm text-gray-800 dark:text-white">
                          SKU Details
                        </h3>
                      </div>

                      {/* --- MODIFIED: Changed from grid-cols-2 to space-y-6 for FULL WIDTH --- */}
                      <div className="space-y-6">
                        {orderData.orderBreakdowns.map((breakdown) => {
                          const skuData = breakdown.yorksysOrder?.skuData;
                          if (!skuData || skuData.length === 0) return null;

                          return (
                            <div key={`sku-${breakdown.orderNo}`}>
                              <SKUDataTable
                                skuData={skuData}
                                orderNo={
                                  orderData.orderBreakdowns.length > 1
                                    ? breakdown.orderNo
                                    : null
                                }
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
              </div>
            )}
          </div>
        )}

        {/* 7. Report Configuration */}
        {selectedTemplate && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <SectionHeader title="Inspection Setup" icon={Settings} />
              <div className="space-y-2 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200">
                  <span className="text-gray-500">Report Type</span>
                  <span className="font-bold text-indigo-600">
                    {report.reportType || selectedTemplate.ReportType}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200">
                  <span className="text-gray-500">Sampling</span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                      isAQLMethod
                        ? "bg-orange-100 text-orange-700"
                        : "bg-purple-100 text-purple-700"
                    }`}
                  >
                    {report.inspectionMethod ||
                      selectedTemplate.InspectedQtyMethod}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200">
                  <span className="text-gray-500">Inspected Qty</span>
                  <span className="font-bold text-blue-600">
                    {config?.inspectedQty || 0}
                  </span>
                </div>
                {isAQLMethod && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-gray-500">AQL Sample</span>
                    <span className="font-bold text-orange-600">
                      {config?.aqlSampleSize}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                {/* RENAMED TITLE */}
                <SectionHeader title="Inspection Configuration" icon={Layers} />
              </div>
              <div className="flex-1 overflow-x-auto">
                {lineTableConfig.length > 0 ? (
                  <table className="w-full text-xs text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-medium">
                      <tr>
                        {/* 1. DYNAMIC CONFIG COLUMNS */}
                        {lineTableConfig.some((g) => g.lineName || g.line) && (
                          <th className="px-3 py-2">Line</th>
                        )}
                        {lineTableConfig.some(
                          (g) => g.tableName || g.table,
                        ) && <th className="px-3 py-2">Table</th>}
                        {lineTableConfig.some(
                          (g) => g.colorName || g.color,
                        ) && <th className="px-3 py-2">Color</th>}

                        {/* 2. CARTON COLUMN (Conditionally displayed) */}
                        {config.cartonQty > 0 && (
                          <th className="px-3 py-2 text-center text-blue-600">
                            Cartons
                          </th>
                        )}

                        {/* 3. AQL SPECIFIC: FINISHED QTY */}
                        {isAQLMethod && (
                          <th className="px-3 py-2 text-center">
                            Finished Qty
                          </th>
                        )}

                        {/* 4. SAMPLE SIZE (Common) */}
                        <th className="px-3 py-2 text-right">Sample Size</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {lineTableConfig.map((group, idx) => {
                        // Check which config columns are active to ensure alignment
                        const hasLine = lineTableConfig.some(
                          (g) => g.lineName || g.line,
                        );
                        const hasTable = lineTableConfig.some(
                          (g) => g.tableName || g.table,
                        );
                        const hasColor = lineTableConfig.some(
                          (g) => g.colorName || g.color,
                        );
                        const hasCartons = config.cartonQty > 0;

                        // Calculate Fixed Sample Size (Sum of assignments for this group)
                        const fixedSampleSize =
                          group.assignments?.reduce(
                            (sum, a) => sum + (a.qty || 0),
                            0,
                          ) || 0;

                        return (
                          <tr
                            key={idx}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/20"
                          >
                            {/* --- CONFIG COLUMNS --- */}
                            {hasLine && (
                              <td className="px-3 py-2 font-bold text-gray-700 dark:text-gray-300">
                                {group.lineName || group.line || "-"}
                              </td>
                            )}
                            {hasTable && (
                              <td className="px-3 py-2 text-gray-600 dark:text-gray-400">
                                {group.tableName || group.table || "-"}
                              </td>
                            )}
                            {hasColor && (
                              <td className="px-3 py-2 text-indigo-600 dark:text-indigo-400 font-medium">
                                {group.colorName || group.color || "-"}
                              </td>
                            )}

                            {/* --- METRIC COLUMNS (Merged for AQL / Cartons) --- */}

                            {/* A. CARTONS (Merged if exists) */}
                            {hasCartons &&
                              (idx === 0 ? (
                                <td
                                  className="px-3 py-2 text-center font-mono font-bold text-blue-600 border-l border-gray-100 dark:border-gray-700"
                                  rowSpan={lineTableConfig.length}
                                >
                                  {config.cartonQty}
                                </td>
                              ) : null)}

                            {/* B. AQL MODE: Merged Columns */}
                            {isAQLMethod ? (
                              idx === 0 ? (
                                <>
                                  {/* Finished Qty (InspectedQty from details) */}
                                  <td
                                    className="px-3 py-2 text-center font-mono border-l border-gray-100 dark:border-gray-700"
                                    rowSpan={lineTableConfig.length}
                                  >
                                    {config.inspectedQty || 0}
                                  </td>
                                  {/* AQL Sample Size (Report Wide) */}
                                  <td
                                    className="px-3 py-2 text-right font-mono font-bold text-emerald-600 border-l border-gray-100 dark:border-gray-700"
                                    rowSpan={lineTableConfig.length}
                                  >
                                    {config.aqlSampleSize || 0}
                                  </td>
                                </>
                              ) : null // Don't render for subsequent rows
                            ) : (
                              // C. FIXED MODE: Individual Row Values
                              <td className="px-3 py-2 text-right font-mono font-bold text-gray-800 dark:text-gray-200">
                                {fixedSampleSize}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-6 text-center text-gray-400">
                    <AlertCircle className="w-6 h-6 mx-auto mb-1 opacity-50" />
                    <p className="text-xs">No configuration found</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* EMB / Print info */}
        {(embInfo || printInfo) && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div
              className={`bg-gradient-to-r ${printInfo ? "from-pink-600 to-rose-600" : "from-blue-600 to-indigo-600"} px-4 py-2.5 flex justify-between items-center cursor-pointer`}
              onClick={() => toggleSection("techInfo")}
            >
              <h2 className="text-white font-bold text-sm flex items-center gap-2">
                {printInfo ? (
                  <Printer className="w-4 h-4" />
                ) : (
                  <Settings className="w-4 h-4" />
                )}
                {printInfo ? "Printing Info" : "EMB Info"}
              </h2>
              {expandedSections.techInfo ? (
                <ChevronUp className="text-white w-4 h-4" />
              ) : (
                <ChevronDown className="text-white w-4 h-4" />
              )}
            </div>

            {expandedSections.techInfo && (
              <div className="p-4 space-y-3">
                {/* EMB DISPLAY */}
                {embInfo && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <TechInfoCard
                        label="Speed"
                        value={embInfo.speed?.value}
                        enabled={embInfo.speed?.enabled}
                        icon={Gauge}
                      />
                      <TechInfoCard
                        label="Stitch"
                        value={embInfo.stitch?.value}
                        enabled={embInfo.stitch?.enabled}
                        icon={Activity}
                      />
                      <TechInfoCard
                        label="Needle Size"
                        value={embInfo.needleSize?.value}
                        enabled={embInfo.needleSize?.enabled}
                        icon={PenTool}
                      />
                    </div>
                    {embInfo.remarks && (
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase">
                            Remarks
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {embInfo.remarks}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* PRINT DISPLAY */}
                {printInfo && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <TechInfoCard
                        label="Machine Type"
                        value={printInfo.machineType?.value}
                        enabled={printInfo.machineType?.enabled}
                        icon={Settings}
                      />
                      <TechInfoCard
                        label="Speed"
                        value={printInfo.speed?.value}
                        enabled={printInfo.speed?.enabled}
                        icon={Zap}
                      />
                      <TechInfoCard
                        label="Pressure"
                        value={printInfo.pressure?.value}
                        enabled={printInfo.pressure?.enabled}
                        icon={Activity}
                      />
                    </div>
                    {printInfo.remarks && (
                      <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 flex gap-2">
                        <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase">
                            Remarks
                          </p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {printInfo.remarks}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* 8. Header Inspection */}
        {definitions.headers.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("header")}
            >
              <h2 className="text-white font-bold text-sm flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4" /> CheckList
              </h2>
              {expandedSections.header ? (
                <ChevronUp className="text-white w-4 h-4" />
              ) : (
                <ChevronDown className="text-white w-4 h-4" />
              )}
            </div>

            {expandedSections.header && (
              <div className="p-4 space-y-8">
                {/* PART 1: Checklist Status Grid (1 Row, 3 Columns) */}
                <div>
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                    <ClipboardList className="w-3.5 h-3.5" />
                    Checklist Status
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {definitions.headers.map((section) => {
                      const selectedVal =
                        headerData?.selectedOptions?.[section._id];
                      return (
                        <div
                          key={section._id}
                          className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between gap-2"
                        >
                          <span
                            className="font-bold text-gray-700 dark:text-gray-300 text-xs truncate"
                            title={section.MainTitle}
                          >
                            {section.MainTitle}
                          </span>
                          {selectedVal ? (
                            <StatusBadge value={selectedVal} />
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">
                              Pending
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* PART 2: Findings & Evidence (Photos/Remarks) */}
                {(() => {
                  // Filter sections that actually have content (Images OR Remarks)
                  const evidenceSections = definitions.headers.filter(
                    (section) => {
                      const hasRemark = headerData?.remarks?.[section._id];
                      const hasImages = Object.keys(
                        headerData?.capturedImages || {},
                      ).some((k) => k.startsWith(`${section._id}_`));
                      return hasRemark || hasImages;
                    },
                  );

                  if (evidenceSections.length === 0) return null;

                  return (
                    <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
                      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <Camera className="w-3.5 h-3.5" />
                        Detailed Findings
                      </h3>

                      <div className="space-y-6">
                        {evidenceSections.map((section) => {
                          const remark = headerData?.remarks?.[section._id];
                          const images = Object.keys(
                            headerData?.capturedImages || {},
                          )
                            .filter((k) => k.startsWith(`${section._id}_`))
                            .map((k) => ({
                              ...headerData.capturedImages[k],
                              key: k,
                            }));

                          return (
                            <div
                              key={`${section._id}-evidence`}
                              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm"
                            >
                              {/* Header Name for Evidence Block */}
                              <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                  {section.MainTitle}
                                </span>
                              </div>

                              <div className="p-4">
                                {/* Large Photos Grid */}
                                {images.length > 0 && (
                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    {images.map((img, idx) => (
                                      <div
                                        key={img.key}
                                        className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                                        onClick={() =>
                                          setPreviewImage({
                                            src: img.url,
                                            alt: `${
                                              section.MainTitle
                                            } - Image ${idx + 1}`,
                                          })
                                        }
                                      >
                                        <img
                                          src={img.url}
                                          alt="Evidence"
                                          className="w-full h-48 object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                          <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 drop-shadow-lg transform scale-75 group-hover:scale-100 transition-all" />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {/* Remark Box */}
                                {remark && (
                                  <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded-lg border border-amber-100 dark:border-amber-900/30">
                                    <div className="flex gap-2">
                                      <MessageSquare className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                      <div>
                                        <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase mb-0.5">
                                          Inspector Remark
                                        </p>
                                        <p className="text-xs text-amber-900 dark:text-amber-100">
                                          {remark}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* --- PRODUCTION STATUS --- */}
        <ProductionStatusSection inspectionDetails={report.inspectionDetails} />

        {/* 9. Photo Documentation */}
        {report.photoData && report.photoData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div
              className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-2.5 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("photos")}
            >
              <h2 className="text-white font-bold text-sm flex items-center gap-2">
                <Camera className="w-4 h-4" /> Photos
              </h2>
              {expandedSections.photos ? (
                <ChevronUp className="text-white w-4 h-4" />
              ) : (
                <ChevronDown className="text-white w-4 h-4" />
              )}
            </div>

            {expandedSections.photos && (
              <div className="p-4 space-y-6">
                {/* Loop through Saved Sections from Schema */}
                {report.photoData.map((section, sectionIdx) => (
                  <div
                    key={section.sectionId || sectionIdx}
                    className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-6 last:pb-0"
                  >
                    {/* Section Name */}
                    <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-3 text-sm flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
                      <Layers className="w-4 h-4 text-orange-500" />
                      {section.sectionName}
                    </h3>

                    {/* Grid Structure: 1 Row, 3 Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {section.items &&
                        section.items.map((item, itemIdx) => {
                          // Skip items with no images unless there is a remark
                          if (
                            (!item.images || item.images.length === 0) &&
                            !item.remarks
                          ) {
                            return null;
                          }

                          return (
                            <div
                              key={`${section.sectionId}-${item.itemNo}-${itemIdx}`}
                              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col"
                            >
                              {/* Item Header */}
                              <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                                  <span className="inline-block bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded mr-2 text-[10px]">
                                    #{item.itemNo}
                                  </span>
                                  {item.itemName}
                                </span>
                              </div>

                              {/* Images Area - Real Resolution / Aspect Ratio */}
                              <div className="p-3 flex-1">
                                {item.images && item.images.length > 0 ? (
                                  <div className="space-y-2">
                                    {item.images.map((img, imgIdx) => {
                                      const imgUrl = img.imageURL.startsWith(
                                        "http",
                                      )
                                        ? img.imageURL
                                        : `${API_BASE_URL}${img.imageURL}`;

                                      return (
                                        <div
                                          key={img.imageId || imgIdx}
                                          className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700"
                                          onClick={() => {
                                            // 1. Find the global index of this specific image in the flattened array
                                            // We match based on URL or ID to ensure we find the exact photo
                                            const globalIndex =
                                              allPhotoDataImages.findIndex(
                                                (flatImg) =>
                                                  (img.imageId &&
                                                    flatImg.imageId ===
                                                      img.imageId) ||
                                                  flatImg.imageURL ===
                                                    img.imageURL,
                                              );

                                            // 2. Open Modal with the Full Array and the specific Start Index
                                            if (globalIndex !== -1) {
                                              setPreviewImage({
                                                images: allPhotoDataImages,
                                                startIndex: globalIndex,
                                              });
                                            }
                                          }}
                                        >
                                          {/* Use w-full to fit container, h-auto for real aspect ratio */}
                                          <img
                                            src={imgUrl}
                                            alt={item.itemName}
                                            className="w-full h-auto object-cover max-h-[300px]"
                                            loading="lazy"
                                          />
                                          {/* Hover Overlay */}
                                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                            <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 drop-shadow-lg transform scale-75 group-hover:scale-100 transition-all" />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="h-24 flex items-center justify-center bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300">
                                    <span className="text-xs text-gray-400 italic">
                                      No photos captured
                                    </span>
                                  </div>
                                )}
                              </div>

                              {/* Remarks Footer */}
                              {item.remarks && (
                                <div className="bg-amber-50 dark:bg-amber-900/10 px-3 py-2 border-t border-amber-100 dark:border-amber-900/30">
                                  <p className="text-[10px] text-amber-800 dark:text-amber-200 italic">
                                    <MessageSquare className="w-3 h-3 inline mr-1 opacity-70" />
                                    {item.remarks}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {/* 10. PP Sheet / Pilot Run Meeting Report (Conditional) */}
        {report.ppSheetData && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mt-4">
            <div
              className="bg-gradient-to-r from-teal-500 to-emerald-500 px-4 py-2.5 flex justify-between items-center cursor-pointer"
              onClick={() => toggleSection("ppSheet")}
            >
              <h2 className="text-white font-bold text-sm flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" /> PP Sheet / Pilot Meeting
              </h2>
              {expandedSections.ppSheet ? (
                <ChevronUp className="text-white w-4 h-4" />
              ) : (
                <ChevronDown className="text-white w-4 h-4" />
              )}
            </div>

            {expandedSections.ppSheet && (
              <YPivotQAReportPPSheetSection
                ppSheetData={report.ppSheetData}
                onImageClick={(url, title) => {
                  // Reusing the existing image preview logic
                  if (url) {
                    setPreviewImage({
                      images: [{ url: url, defectName: title }],
                      startIndex: 0,
                    });
                  }
                }}
              />
            )}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <ImagePreviewModal
          images={previewImage.images}
          startIndex={previewImage.startIndex}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {/* --- DECISION MODAL --- */}
      {showDecisionModal && (
        <YPivotQAReportDecisionModal
          isOpen={showDecisionModal}
          onClose={() => setShowDecisionModal(false)}
          report={report}
          user={user}
          onSubmit={handleDecisionSubmit}
        />
      )}

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:pt-4 {
            padding-top: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
};

export default YPivotQAReportFullView;
