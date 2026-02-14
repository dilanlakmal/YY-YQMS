import React, { useMemo, useState, useEffect } from "react";
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
  ChevronDown,
  ChevronUp,
  Loader,
  Building2,
  ClipboardCheck,
  AlertCircle,
  Shield,
  Trophy,
  Ruler,
  Bug,
  Award,
  User,
  Save,
  CheckCircle2,
  FileSpreadsheet,
  Printer,
  Gauge,
  Activity,
  PenTool,
  Zap,
} from "lucide-react";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";
import YPivotQAInspectionQRCode from "./YPivotQAInspectionQRCode";
import { determineBuyerFromOrderNo } from "./YPivotQAInspectionBuyerDetermination";
import YPivotQAInspectionPPSheetSummary from "./YPivotQAInspectionPPSheetSummary";
import YPivotQAInspectionDefectVisuals from "./YPivotQAInspectionDefectVisuals";
import { createPortal } from "react-dom";

// Import from Measurement Summary
import {
  groupMeasurementsByGroupId,
  calculateGroupStats,
  calculateOverallMeasurementResult,
  MeasurementStatsCards,
  MeasurementLegend,
  MeasurementSummaryTable,
  OverallMeasurementSummaryTable,
} from "./YPivotQAInspectionMeasurementSummary";

// Import from Defect Summary
import {
  useDefectSummaryData,
  useAqlData,
  calculateAqlResult,
  AQLConfigCards,
  AQLResultTable,
  FinalDefectResultBanner,
  DefectSummaryTable,
} from "./YPivotQAInspectionDefectSummary";

// ==============================================================================
// INTERNAL COMPONENT: AUTO-DISMISS STATUS MODAL
// ==============================================================================
const AutoDismissModal = ({ isOpen, onClose, type, message }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSuccess = type === "success";

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px] animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center gap-3 min-w-[250px] transform scale-100 transition-all">
        <div
          className={`p-3 rounded-full ${
            isSuccess
              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-8 h-8" />
          ) : (
            <AlertCircle className="w-8 h-8" />
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white text-center">
          {isSuccess ? "Success" : "Error"}
        </h3>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 text-center">
          {message}
        </p>
      </div>
    </div>,
    document.body,
  );
};

// --- Helper: Modal for Image Preview ---
const ImagePreviewModal = ({ src, alt, onClose }) => {
  if (!src) return null;
  return (
    <div
      className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div className="relative max-w-4xl w-full max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute -top-4 -right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
        >
          <XCircle className="w-8 h-8" />
        </button>
        <img
          src={src}
          alt={alt}
          className="w-full h-full object-contain rounded-lg shadow-2xl"
        />
        <p className="text-center text-white/80 mt-2 font-mono text-sm">
          {alt}
        </p>
      </div>
    </div>
  );
};

// --- Helper: Info Row ---
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

// --- Helper: Section Header ---
const SectionHeader = ({ title, icon: Icon }) => (
  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
    <div className="p-1 rounded-lg bg-gray-100 dark:bg-gray-700">
      {Icon && <Icon className="w-4 h-4 text-gray-600 dark:text-gray-400" />}
    </div>
    <h3 className="font-bold text-gray-800 dark:text-white text-sm">{title}</h3>
  </div>
);

// --- Helper: Status Badge ---
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

// --- Helper: Compact Result Card ---
const ResultCard = ({ title, result, icon: Icon, colorClass }) => {
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

// --- NEW HELPER: Resolve Photo URL ---
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

// ==============================================================================
//  HELPER: Technical Info Display Card (For EMB/Print)
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

// --- MAIN COMPONENT ---
const YPivotQAInspectionSummary = ({
  orderData,
  reportData,
  qrData,
  defectData = null,
  activeGroup = null,
  // NEW PROPS: Dirty state management
  dirtySections = {},
  getDirtySectionsList = () => [],
  hasUnsavedChanges = false,
  markAllSectionsClean = () => {},
  onReportSubmitted,
}) => {
  const { selectedOrders, orderData: details } = orderData;
  const { selectedTemplate, config, lineTableConfig, headerData, photoData } =
    reportData;

  // Extract EMB and Print Info
  const embInfo = config?.embInfo;
  const printInfo = config?.printInfo;

  const [inspectorInfo, setInspectorInfo] = useState(null);

  const isPilotRun = selectedTemplate?.ReportType === "Pilot Run-Sewing";
  const ppSheetData = reportData?.ppSheetData;

  const savedDefects = useMemo(() => {
    if (defectData?.savedDefects) return defectData.savedDefects;
    if (reportData?.defectData?.savedDefects)
      return reportData.defectData.savedDefects;
    return [];
  }, [defectData, reportData]);

  const savedMeasurements = useMemo(() => {
    return reportData?.measurementData?.savedMeasurements || [];
  }, [reportData]);

  // NEW: Process Measurement Data by Stage (Before / After) separate logic
  const measurementStageData = useMemo(() => {
    const stages = ["Before", "After"];

    return stages
      .map((stage) => {
        // 1. Filter measurements for this specific stage
        // (Legacy fallback: if no stage property, assume 'Before')
        const stageMeasurements = savedMeasurements.filter(
          (m) => m.stage === stage || (!m.stage && stage === "Before"),
        );

        if (stageMeasurements.length === 0) return null;

        // 2. Get the specific Specs/Config for this stage (Before specs vs After specs)
        const configKey = `config${stage}`; // e.g., configBefore, configAfter
        const stageConfig = reportData?.measurementData?.[configKey] || {};
        const fullSpecs = stageConfig.fullSpecsList || [];
        const selectedSpecs = stageConfig.selectedSpecsList || [];

        // 3. Create display copies with Suffixes for the Overall Table (e.g. "XS (B)")
        const suffix = stage === "Before" ? "(B)" : "(A)";
        const measurementsForDisplay = stageMeasurements.map((m) => ({
          ...m,
          size: `${m.size} ${suffix}`, // Appends (B) or (A) to size
        }));

        // 4. Group data for detailed tables
        const grouped = groupMeasurementsByGroupId(stageMeasurements);

        // 5. Group data for the Overall Table using the suffixed sizes
        const groupedForOverall = groupMeasurementsByGroupId(
          measurementsForDisplay,
        );

        return {
          stage,
          label: stage === "Before" ? "Before Wash" : "After Wash",
          suffix,
          groupedData: grouped, // For detailed cards/tables
          groupedDataForOverall: groupedForOverall, // For top summary table
          specs: { full: fullSpecs, selected: selectedSpecs }, // Specific specs for this stage
        };
      })
      .filter(Boolean); // Remove empty stages
  }, [savedMeasurements, reportData]);

  const measurementSpecsData = useMemo(() => {
    return reportData?.measurementData?.fullSpecsList || [];
  }, [reportData]);

  const measurementSelectedSpecs = useMemo(() => {
    return reportData?.measurementData?.selectedSpecsList || [];
  }, [reportData]);

  const groupedMeasurements = useMemo(() => {
    return groupMeasurementsByGroupId(savedMeasurements);
  }, [savedMeasurements]);

  const measurementResult = useMemo(() => {
    return calculateOverallMeasurementResult(savedMeasurements);
  }, [savedMeasurements]);

  const [definitions, setDefinitions] = useState({ headers: [], photos: [] });
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    aql: true,
    defectSummary: true,
    order: true,
    config: true,
    header: true,
    photos: true,
    measurement: true,
    ppSheet: true,
    techInfo: true,
  });

  // Derived values
  const isAQLMethod = useMemo(
    () => selectedTemplate?.InspectedQtyMethod === "AQL",
    [selectedTemplate],
  );
  const determinedBuyer = useMemo(() => {
    if (!selectedOrders || selectedOrders.length === 0) return "Unknown";
    return determineBuyerFromOrderNo(selectedOrders[0]).buyer;
  }, [selectedOrders]);
  const inspectedQty = useMemo(
    () => parseInt(config?.inspectedQty) || 0,
    [config?.inspectedQty],
  );

  // Use exported hooks
  const summaryData = useDefectSummaryData(savedDefects, activeGroup);
  const { aqlSampleData, loadingAql } = useAqlData(
    isAQLMethod,
    determinedBuyer,
    inspectedQty,
  );
  const aqlResult = useMemo(
    () => calculateAqlResult(aqlSampleData, summaryData.totals),
    [aqlSampleData, summaryData.totals],
  );

  // Final results
  const defectResult = useMemo(() => {
    if (aqlResult) return aqlResult.final;
    if (summaryData.totals.critical > 0 || summaryData.totals.major > 0)
      return "FAIL";
    return "PASS";
  }, [aqlResult, summaryData.totals]);

  // Final Overall Report Result (Combines Measurement & Defect)
  const finalReportResult = useMemo(() => {
    const measResult = measurementResult.result;
    const defResult = defectResult;

    if (measResult === "FAIL" || defResult === "FAIL") {
      return "FAIL";
    }

    return "PASS";
  }, [measurementResult.result, defectResult]);

  // --- Submit Handler ---
  const [submitting, setSubmitting] = useState(false);

  // Auto-dismiss status modal state
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    message: "",
  });

  useEffect(() => {
    const empId = reportData?.empId || qrData?.empId;
    if (empId) {
      const fetchInspector = async () => {
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/user-details?empId=${empId}`,
          );
          if (res.data) {
            setInspectorInfo(res.data);
          }
        } catch (err) {
          console.error("Failed to fetch inspector details", err);
          setInspectorInfo({
            emp_id: empId,
            eng_name: reportData?.empName || qrData?.empName,
            face_photo: null,
          });
        }
      };
      fetchInspector();
    }
  }, [reportData?.empId, qrData?.empId]);

  useEffect(() => {
    const fetchDefinitions = async () => {
      try {
        const [headersRes, photosRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/qa-sections-home`),
          axios.get(`${API_BASE_URL}/api/qa-sections-photos`),
        ]);
        setDefinitions({
          headers: headersRes.data.data,
          photos: photosRes.data.data,
        });
      } catch (error) {
        console.error("Failed to load section definitions", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDefinitions();
  }, []);

  const dtOrder = details?.dtOrder || {};
  const yorksys = details?.yorksysOrder || {};
  const skuData = yorksys.skuData || [];

  const colorSizeBreakdown = useMemo(() => {
    if (!details?.orderBreakdowns) return null;
    return (
      details.colorSizeBreakdown ||
      details.orderBreakdowns[0]?.colorSizeBreakdown
    );
  }, [details]);

  const scopeColumns = useMemo(() => {
    if (!selectedTemplate) return [];
    const cols = [];
    if (selectedTemplate.Line === "Yes") cols.push("Line");
    if (selectedTemplate.Table === "Yes") cols.push("Table");
    if (selectedTemplate.Colors === "Yes") cols.push("Color");
    return cols;
  }, [selectedTemplate]);

  const toggleSection = (key) =>
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const relevantPhotoSections = useMemo(() => {
    if (
      !selectedTemplate?.SelectedPhotoSectionList ||
      definitions.photos.length === 0
    )
      return [];
    const allowedIds = selectedTemplate.SelectedPhotoSectionList.map(
      (i) => i.PhotoSectionID,
    );
    return definitions.photos.filter((p) => allowedIds.includes(p._id));
  }, [selectedTemplate, definitions.photos]);

  // ===========================================================================
  // OPTIMIZED FINAL SUBMIT HANDLER
  // ===========================================================================
  const handleFullSubmit = async () => {
    if (!qrData?.reportId) {
      setStatusModal({
        isOpen: true,
        type: "error",
        message: "Report ID missing.",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Get list of sections that have unsaved changes
      const sectionsToUpdate = getDirtySectionsList();

      // Build payload - only include sections that need updating
      const payload = {
        reportId: qrData.reportId,
        sectionsToUpdate: sectionsToUpdate,
      };

      // ---------------------------------------------------------
      // Only add sections to payload if they are dirty
      // ---------------------------------------------------------

      // INSPECTION DETAILS
      if (dirtySections.inspectionDetails) {
        payload.inspectionDetails = {
          buyer: determinedBuyer,
          productType:
            reportData.config?.productType ||
            orderData?.yorksysOrder?.productType,
          productTypeId: reportData.config?.productTypeId,
          reportTypeName: selectedTemplate?.ReportType,
          reportTypeId: selectedTemplate?._id,
          measurement: selectedTemplate?.Measurement,
          method: selectedTemplate?.InspectedQtyMethod,
          inspectedQty: reportData.config?.inspectedQty,
          cartonQty: reportData.config?.cartonQty,
          shippingStage: reportData.config?.shippingStage,
          remarks: reportData.config?.remarks,
          isSubCon: reportData.config?.isSubCon,
          subConFactory: reportData.config?.selectedSubConFactoryName,
          subConFactoryId: reportData.config?.selectedSubConFactory,
          aqlSampleSize: reportData.config?.aqlSampleSize,
          totalOrderQty: details?.dtOrder?.totalQty,
          aqlConfig: reportData.config?.aqlConfig,
        };
      }

      // HEADER DATA
      if (dirtySections.headerData) {
        payload.headerData = definitions.headers.map((section) => {
          const secId = section._id;
          const sectionImages = Object.keys(
            reportData.headerData?.capturedImages || {},
          )
            .filter((k) => k.startsWith(`${secId}_`))
            .map((k) => {
              const img = reportData.headerData.capturedImages[k];
              let payloadImageURL = null;
              let payloadImgSrc = null;

              if (img.url && img.url.startsWith("data:")) {
                payloadImgSrc = img.url;
              } else if (img.url) {
                payloadImageURL = img.url.replace(API_BASE_URL, "");
              }

              return {
                id: img.id || k,
                imageURL: payloadImageURL,
                imgSrc: payloadImgSrc,
              };
            });

          return {
            headerId: secId,
            name: section.MainTitle,
            selectedOption:
              (reportData.headerData?.selectedOptions || {})[secId] || "",
            remarks: (reportData.headerData?.remarks || {})[secId] || "",
            images: sectionImages,
          };
        });
      }

      // PHOTO DATA
      if (dirtySections.photoData) {
        payload.photoData = relevantPhotoSections
          .map((section) => {
            const processedItems = section.itemList
              .map((item) => {
                const itemKeyBase = `${section._id}_${item.no}`;
                const itemRemark =
                  (reportData.photoData?.remarks || {})[itemKeyBase] || "";

                const itemImages = Object.keys(
                  reportData.photoData?.capturedImages || {},
                )
                  .filter((k) => k.startsWith(`${itemKeyBase}_`))
                  .sort((a, b) => {
                    const idxA = parseInt(a.split("_")[2]);
                    const idxB = parseInt(b.split("_")[2]);
                    return idxA - idxB;
                  })
                  .map((k) => {
                    const img = reportData.photoData.capturedImages[k];
                    let payloadImageURL = null;
                    let payloadImgSrc = null;

                    if (img.url && img.url.startsWith("data:")) {
                      payloadImgSrc = img.url;
                    } else if (img.url) {
                      payloadImageURL = img.url.replace(API_BASE_URL, "");
                    }

                    return {
                      id: img.id || k,
                      imageURL: payloadImageURL,
                      imgSrc: payloadImgSrc,
                    };
                  });

                return {
                  itemNo: item.no,
                  itemName: item.itemName,
                  remarks: itemRemark,
                  images: itemImages,
                };
              })
              .filter((i) => i.remarks || i.images.length > 0);

            return {
              sectionId: section._id,
              sectionName: section.sectionName,
              items: processedItems,
            };
          })
          .filter((sec) => sec.items.length > 0);
      }

      // INSPECTION CONFIG
      if (dirtySections.inspectionConfig) {
        let finalSampleSize = 0;
        const isAQL = selectedTemplate?.InspectedQtyMethod === "AQL";

        if (isAQL) {
          finalSampleSize = parseInt(reportData.config?.aqlSampleSize) || 0;
        } else {
          const groups = lineTableConfig || [];
          finalSampleSize = groups.reduce((total, group) => {
            const groupTotal = group.assignments.reduce(
              (sum, a) => sum + (parseInt(a.qty) || 0),
              0,
            );
            return total + groupTotal;
          }, 0);
        }

        payload.inspectionConfig = {
          reportName: selectedTemplate?.ReportType,
          inspectionMethod: selectedTemplate?.InspectedQtyMethod || "Fixed",
          sampleSize: finalSampleSize,
          configGroups: lineTableConfig || [],
        };
      }

      // MEASUREMENT DATA
      if (dirtySections.measurementData) {
        payload.measurementData = savedMeasurements;
      }

      // DEFECT DATA
      if (dirtySections.defectData) {
        payload.defectData = savedDefects;
      }

      // DEFECT MANUAL DATA
      if (dirtySections.defectManualData) {
        payload.defectManualData = Object.values(
          reportData?.defectData?.manualDataByGroup || {},
        ).map((item) => ({ ...item, groupId: item.groupId || 0 }));
      }

      // PP SHEET DATA
      if (dirtySections.ppSheetData) {
        payload.ppSheetData = reportData?.ppSheetData || null;
      }

      console.log("Optimized Payload:", {
        sectionsToUpdate: payload.sectionsToUpdate,
        payloadKeys: Object.keys(payload),
      });

      // ---------------------------------------------------------
      // Make API Call
      // ---------------------------------------------------------
      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/submit-full-report`,
        payload,
      );

      if (res.data.success) {
        // Clear all dirty states
        markAllSectionsClean();

        if (onReportSubmitted) {
          // Pass the data object (contains status, updatedAt, resubmissionHistory) back to Parent
          onReportSubmitted(res.data.data);
        }

        // >>> Success Message Logic <<<
        let successMessage = "Report Finalized Successfully!";

        if (res.data.hasChanges) {
          if (res.data.isResubmission) {
            // It was a resubmission
            const history = res.data.data.resubmissionHistory || [];
            const lastEntry = history[history.length - 1];
            successMessage = `Resubmission #${
              lastEntry?.resubmissionNo || "New"
            } Saved!`;
          } else {
            // First time submit
            successMessage = `Report Submitted! Updated: ${res.data.updatedSections.join(
              ", ",
            )}`;
          }
        }

        setStatusModal({
          isOpen: true,
          type: "success",
          message: res.data.hasChanges
            ? `Report Submitted! Updated: ${res.data.updatedSections.join(
                ", ",
              )}`
            : "Report Finalized Successfully!",
        });
      } else {
        setStatusModal({
          isOpen: true,
          type: "error",
          message: res.data.message || "Submission Failed",
        });
      }
    } catch (err) {
      console.error("Submit Error:", err);
      setStatusModal({
        isOpen: true,
        type: "error",
        message:
          err.response?.data?.message || "Server Error during submission",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!selectedOrders.length) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-gray-400 h-96">
        <Package className="w-16 h-16 mb-4 opacity-30" />
        <p className="text-lg font-medium">No Order Selected</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Get dirty sections list for display
  const dirtySectionsList = getDirtySectionsList();

  return (
    <div className="max-w-7xl mx-auto space-y-4 pb-24 animate-fadeIn">
      {/* --- TOP HEADER WITH SUBMIT BUTTON --- */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-xl font-black text-gray-800 dark:text-white tracking-tight">
            Inspection Summary
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {hasUnsavedChanges ? (
              <span className="text-amber-600 dark:text-amber-400">
                ⚠️ Unsaved changes in: {dirtySectionsList.join(", ")}
              </span>
            ) : (
              "All sections saved. Click submit to finalize the report."
            )}
          </p>
        </div>

        <button
          onClick={handleFullSubmit}
          disabled={submitting}
          className={`px-6 py-2.5 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all transform active:scale-95 ${
            submitting
              ? "bg-gray-400 cursor-not-allowed text-white"
              : hasUnsavedChanges
                ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                : "bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
          }`}
        >
          {submitting ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : hasUnsavedChanges ? (
            <>
              <Save className="w-5 h-5" />
              Save & Submit ({dirtySectionsList.length})
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Finalize Report
            </>
          )}
        </button>
      </div>

      {/* 1. QR CODE AND USER INFO */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* LEFT: INSPECTOR CARD */}
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
                {inspectorInfo?.eng_name || inspectorInfo?.name || "Unknown"}
              </h3>

              <div className="mt-2 flex justify-center">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-100 dark:border-indigo-800">
                  <span className="text-[10px] font-bold uppercase">ID</span>
                  <span className="text-xs font-mono font-bold">
                    {inspectorInfo?.emp_id || "--"}
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
                    {inspectorInfo?.dept_name || "N/A"} (
                    {inspectorInfo?.sect_name || "N/A"})
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-8 lg:col-span-9 h-full">
          <YPivotQAInspectionQRCode
            reportId={qrData?.reportId}
            inspectionDate={qrData?.inspectionDate}
            orderNos={qrData?.orderNos}
            reportType={qrData?.reportType}
            inspectionType={qrData?.inspectionType}
            empId={qrData?.empId}
          />
        </div>
      </div>

      {/* 2. REPORT RESULT CARDS */}
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

      {/* 3. AQL DEFECT RESULT (Only if AQL) */}
      {isAQLMethod && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection("aql")}
          >
            <h2 className="text-white font-bold text-sm flex items-center gap-2">
              <Shield className="w-4 h-4" /> Report: Defect Result (AQL)
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
                  <Loader className="w-6 h-6 animate-spin text-purple-500" />
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

      {/* 4. DEFECT SUMMARY BY CONFIG */}
      {summaryData.groups.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection("defectSummary")}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-white" />
              <h2 className="text-white font-bold text-sm">
                Defect Summary by Configuration
              </h2>
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
          {expandedSections.defectSummary && (
            <>
              <DefectSummaryTable
                groups={summaryData.groups}
                totals={summaryData.totals}
              />
              <YPivotQAInspectionDefectVisuals defectData={savedDefects} />
            </>
          )}
        </div>
      )}

      {/* 5. OVERALL MEASUREMENT SUMMARY */}
      {measurementStageData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div
            className="bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-2.5 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection("measurement")}
          >
            <h2 className="text-white font-bold text-sm flex items-center gap-2">
              <Ruler className="w-4 h-4" /> Overall Measurement Summary
            </h2>
            {expandedSections.measurement ? (
              <ChevronUp className="text-white w-4 h-4" />
            ) : (
              <ChevronDown className="text-white w-4 h-4" />
            )}
          </div>

          {expandedSections.measurement && (
            <div className="p-3 space-y-6">
              {/* Loop through each Stage (Before / After) */}
              {measurementStageData.map((stageData) => (
                <div key={stageData.stage} className="space-y-4">
                  {/* Stage Separator Title */}
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

                  {/* Overall Table for this Stage (Shows sizes with (B)/(A)) */}
                  <OverallMeasurementSummaryTable
                    groupedMeasurements={stageData.groupedDataForOverall}
                  />

                  {/* Detailed 6-Card Visuals & Tables per Group for this Stage */}
                  {stageData.groupedData.groups.map((group) => {
                    const configLabel =
                      [
                        group.lineName ? `Line ${group.lineName}` : null,
                        group.tableName ? `Table ${group.tableName}` : null,
                        group.colorName || null,
                      ]
                        .filter(Boolean)
                        .join(" / ") || "General";

                    // Use specific specs for this stage to calculate stats
                    const stats = calculateGroupStats(
                      group.measurements,
                      stageData.specs.full,
                      stageData.specs.selected,
                    );

                    return (
                      <div
                        key={`${stageData.stage}-${group.id}`}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                      >
                        <div className="bg-gray-100 dark:bg-gray-700 px-3 py-2 flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            {configLabel} ({stageData.label})
                          </span>
                        </div>
                        <div className="p-3 space-y-2">
                          {/* 6 Stats Cards */}
                          <MeasurementStatsCards stats={stats} compact />
                          <MeasurementLegend compact />
                          {/* Detailed Measurement Table */}
                          <MeasurementSummaryTable
                            measurements={group.measurements}
                            specsData={stageData.specs.full}
                            selectedSpecsList={stageData.specs.selected}
                            compact
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6. ORDER INFORMATION */}
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
            <ChevronUp className="text-white" />
          ) : (
            <ChevronDown className="text-white" />
          )}
        </div>

        {expandedSections.order && (
          <div className="p-4 space-y-4">
            {/* Order Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <InfoRow
                label="Order No(s)"
                value={selectedOrders.join(", ")}
                icon={Package}
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
              <InfoRow label="Country" value={dtOrder.country} icon={MapPin} />
              <InfoRow label="Season" value={yorksys.season} icon={Calendar} />
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
              <InfoRow
                label="SKU Description"
                value={yorksys.skuDescription}
                icon={Tag}
                className="md:col-span-2"
              />
              <InfoRow
                label="Fabric Content"
                value={yorksys.fabricContent
                  ?.map((f) => `${f.fabricName} ${f.percentageValue}%`)
                  .join(", ")}
                icon={Shirt}
                className="md:col-span-2"
              />
            </div>

            {/* Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {colorSizeBreakdown && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-purple-600 px-3 py-1.5 text-white text-xs font-bold flex items-center gap-1">
                    <Package className="w-3 h-3" /> Order Qty Breakdown
                  </div>
                  <div className="overflow-x-auto max-h-[200px]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 sticky top-0">
                        <tr>
                          <th className="px-3 py-1.5 font-bold">Color</th>
                          <th className="px-3 py-1.5 text-right font-bold">
                            Total
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {colorSizeBreakdown.colors.map((row, i) => (
                          <tr
                            key={i}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                          >
                            <td className="px-3 py-1.5">{row.color}</td>
                            <td className="px-3 py-1.5 text-right font-bold text-indigo-600">
                              {row.total.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {skuData.length > 0 && (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                  <div className="bg-emerald-600 px-3 py-1.5 text-white text-xs font-bold flex items-center gap-1">
                    <Hash className="w-3 h-3" /> SKU Data
                  </div>
                  <div className="overflow-x-auto max-h-[200px]">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 sticky top-0">
                        <tr>
                          <th className="px-3 py-1.5 font-bold">SKU</th>
                          <th className="px-3 py-1.5 font-bold">PO Line</th>
                          <th className="px-3 py-1.5 text-right font-bold">
                            Qty
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {skuData.map((row, i) => (
                          <tr
                            key={i}
                            className="hover:bg-gray-50 dark:hover:bg-gray-700/30"
                          >
                            <td className="px-3 py-1.5 font-mono">{row.sku}</td>
                            <td className="px-3 py-1.5">{row.POLine}</td>
                            <td className="px-3 py-1.5 text-right font-bold text-emerald-600">
                              {row.Qty.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 6. REPORT CONFIGURATION */}
      {selectedTemplate && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
            <SectionHeader title="Inspection Setup" icon={Settings} />
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200">
                <span className="text-gray-500">Report Type</span>
                <span className="font-bold text-indigo-600">
                  {selectedTemplate.ReportType}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200">
                <span className="text-gray-500">Sampling</span>
                <span
                  className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                    selectedTemplate.InspectedQtyMethod === "AQL"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {selectedTemplate.InspectedQtyMethod}
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-dashed border-gray-200">
                <span className="text-gray-500">Inspected Qty</span>
                <span className="font-bold text-blue-600">
                  {config?.inspectedQty || 0}
                </span>
              </div>
              {selectedTemplate.InspectedQtyMethod === "AQL" && (
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
              <SectionHeader title="Inspection Scope" icon={Layers} />
            </div>
            <div className="flex-1 overflow-x-auto">
              {lineTableConfig.length > 0 ? (
                <table className="w-full text-xs text-left">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 font-medium">
                    <tr>
                      {scopeColumns.map((col) => (
                        <th key={col} className="px-3 py-2">
                          {col}
                        </th>
                      ))}
                      {selectedTemplate.isQCScan === "Yes" && (
                        <th className="px-3 py-2">Inspector</th>
                      )}
                      <th className="px-3 py-2 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {lineTableConfig.map((group) =>
                      group.assignments.map((assign, idx) => (
                        <tr
                          key={`${group.id}-${assign.id}`}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/20"
                        >
                          {scopeColumns.includes("Line") && (
                            <td className="px-3 py-1.5 font-bold">
                              {idx === 0 ? group.lineName || group.line : ""}
                            </td>
                          )}
                          {scopeColumns.includes("Table") && (
                            <td className="px-3 py-1.5">
                              {idx === 0 ? group.tableName || group.table : ""}
                            </td>
                          )}
                          {scopeColumns.includes("Color") && (
                            <td className="px-3 py-1.5 text-indigo-600">
                              {idx === 0 ? group.colorName || group.color : ""}
                            </td>
                          )}
                          {selectedTemplate.isQCScan === "Yes" && (
                            <td className="px-3 py-1.5">
                              {assign.qcUser ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[8px] font-bold">
                                    {assign.qcUser.eng_name.charAt(0)}
                                  </div>
                                  <span>{assign.qcUser.eng_name}</span>
                                </div>
                              ) : (
                                <span className="text-gray-400 italic">—</span>
                              )}
                            </td>
                          )}
                          <td className="px-3 py-1.5 text-right font-mono">
                            {assign.qty || 0}
                          </td>
                        </tr>
                      )),
                    )}
                  </tbody>
                </table>
              ) : (
                <div className="p-6 text-center text-gray-400">
                  <AlertCircle className="w-6 h-6 mx-auto mb-1 opacity-50" />
                  <p className="text-xs">No scope configured</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EMB or Print Info */}
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
              {printInfo ? "Printing Configuration" : "EMB Configuration"}
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

      {/* 7. HEADER INSPECTION */}
      {definitions.headers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div
            className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2.5 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection("header")}
          >
            <h2 className="text-white font-bold text-sm flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4" /> Checklist
            </h2>
            {expandedSections.header ? (
              <ChevronUp className="text-white w-4 h-4" />
            ) : (
              <ChevronDown className="text-white w-4 h-4" />
            )}
          </div>

          {expandedSections.header && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {definitions.headers.map((section) => {
                const selectedVal = headerData?.selectedOptions?.[section._id];
                const remark = headerData?.remarks?.[section._id];
                const images = Object.keys(headerData?.capturedImages || {})
                  .filter((k) => k.startsWith(`${section._id}_`))
                  .map((k) => ({ ...headerData.capturedImages[k], key: k }));

                return (
                  <div
                    key={section._id}
                    className="bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700 p-3 flex flex-col gap-2"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-gray-800 dark:text-gray-200 text-xs flex-1">
                        {section.MainTitle}
                      </h4>
                      {selectedVal ? (
                        <StatusBadge value={selectedVal} />
                      ) : (
                        <span className="text-[9px] text-gray-400 italic">
                          Not Checked
                        </span>
                      )}
                    </div>
                    {remark && (
                      <div className="bg-amber-50 dark:bg-amber-900/20 p-1.5 rounded border border-amber-100 flex gap-1.5">
                        <MessageSquare className="w-2.5 h-2.5 text-amber-500 mt-0.5 flex-shrink-0" />
                        <p className="text-[10px] text-amber-800 italic">
                          "{remark}"
                        </p>
                      </div>
                    )}
                    {images.length > 0 && (
                      <div className="flex gap-1.5 mt-auto pt-1 overflow-x-auto">
                        {images.map((img) => (
                          <div
                            key={img.key}
                            className="relative flex-shrink-0 cursor-pointer"
                            onClick={() =>
                              setPreviewImage({
                                src: img.url,
                                alt: section.MainTitle,
                              })
                            }
                          >
                            <img
                              src={img.url}
                              className="w-8 h-8 object-cover rounded border border-gray-300"
                              alt="Evidence"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 8. PHOTO DOCUMENTATION */}
      {relevantPhotoSections.length > 0 &&
        selectedTemplate?.Photos !== "No" && (
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
              <div className="p-4 space-y-4">
                {relevantPhotoSections.map((section) => (
                  <div
                    key={section._id}
                    className="border-b border-gray-100 dark:border-gray-700 last:border-0 pb-4 last:pb-0"
                  >
                    <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-3 text-xs flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-orange-500" />{" "}
                      {section.sectionName}
                    </h3>

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                      {section.itemList.map((item) => {
                        const images = [];
                        let idx = 0;
                        while (idx < 20) {
                          const key = `${section._id}_${item.no}_${idx}`;
                          if (photoData?.capturedImages?.[key]) {
                            images.push({
                              ...photoData.capturedImages[key],
                              key,
                            });
                          } else if (images.length > 0 && idx > item.maxCount)
                            break;
                          idx++;
                        }
                        const remarkKey = `${section._id}_${item.no}`;
                        const remark = photoData?.remarks?.[remarkKey];

                        if (images.length === 0 && !remark) return null;

                        return (
                          <div
                            key={item.no}
                            className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2 border border-gray-200 dark:border-gray-700"
                          >
                            <span className="text-[10px] font-bold text-gray-700 dark:text-gray-200 line-clamp-1">
                              <span className="inline-block bg-orange-100 text-orange-700 px-1 rounded mr-1">
                                #{item.no}
                              </span>
                              {item.itemName}
                            </span>
                            <div className="grid grid-cols-3 gap-1 mt-1.5">
                              {images.map((img) => (
                                <div
                                  key={img.key}
                                  className="aspect-square rounded overflow-hidden cursor-pointer border border-gray-200"
                                  onClick={() =>
                                    setPreviewImage({
                                      src: img.url,
                                      alt: item.itemName,
                                    })
                                  }
                                >
                                  <img
                                    src={img.url}
                                    className="w-full h-full object-cover"
                                    alt="Doc"
                                  />
                                </div>
                              ))}
                            </div>
                            {remark && (
                              <p className="mt-1 text-[9px] text-gray-500 italic truncate">
                                <MessageSquare className="w-2.5 h-2.5 inline mr-0.5" />
                                {remark}
                              </p>
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

      {/* 9. PP SHEET SUMMARY (Conditional) */}
      {isPilotRun && ppSheetData && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-600 to-blue-600 px-4 py-2.5 flex justify-between items-center cursor-pointer"
            onClick={() => toggleSection("ppSheet")}
          >
            <h2 className="text-white font-bold text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" /> PP Meeting Report
            </h2>
            {expandedSections.ppSheet ? (
              <ChevronUp className="text-white w-4 h-4" />
            ) : (
              <ChevronDown className="text-white w-4 h-4" />
            )}
          </div>

          {expandedSections.ppSheet && (
            <div className="p-4">
              <YPivotQAInspectionPPSheetSummary ppSheetData={ppSheetData} />
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {previewImage && (
        <ImagePreviewModal
          src={previewImage.src}
          alt={previewImage.alt}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {/* Auto Dismiss Modal */}
      <AutoDismissModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
        type={statusModal.type}
        message={statusModal.message}
      />

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
      `}</style>
    </div>
  );
};

export default YPivotQAInspectionSummary;
