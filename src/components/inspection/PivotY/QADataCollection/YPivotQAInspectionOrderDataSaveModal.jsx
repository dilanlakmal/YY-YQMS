import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Save,
  Loader2,
  Calendar,
  User,
  Package,
  Hash,
  Building2,
  Shirt,
  Factory,
  FileText,
  MessageSquare,
  Boxes,
  Truck,
  Ruler,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  ClipboardList,
  Image,
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";

// ============================================================
// Info Row Component
// ============================================================
const InfoRow = ({ icon: Icon, label, value, color = "gray" }) => {
  const colorClasses = {
    gray: "text-gray-600 dark:text-gray-400",
    indigo: "text-indigo-600 dark:text-indigo-400",
    emerald: "text-emerald-600 dark:text-emerald-400",
    purple: "text-purple-600 dark:text-purple-400",
    orange: "text-orange-600 dark:text-orange-400",
    blue: "text-blue-600 dark:text-blue-400",
    pink: "text-pink-600 dark:text-pink-400",
    cyan: "text-cyan-600 dark:text-cyan-400",
    amber: "text-amber-600 dark:text-amber-400",
  };

  return (
    <div className="flex items-start gap-2 py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div
        className={`p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 ${colorClasses[color]}`}
      >
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </p>
        <p className="text-sm font-bold text-gray-800 dark:text-gray-200 break-words">
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
};

// ============================================================
// AQL Config Table
// ============================================================
const AQLConfigDisplay = ({ aqlConfig, inspectedQty }) => {
  if (!aqlConfig || !aqlConfig.items || aqlConfig.items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* AQL Info */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
          <p className="text-[9px] text-gray-500 uppercase">Type</p>
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
            {aqlConfig.inspectionType || "N/A"}
          </p>
        </div>
        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
          <p className="text-[9px] text-gray-500 uppercase">Level</p>
          <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
            {aqlConfig.level || "N/A"}
          </p>
        </div>
        <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg text-center">
          <p className="text-[9px] text-purple-600 uppercase">Batch</p>
          <p className="text-xs font-bold text-purple-700 dark:text-purple-300">
            {aqlConfig.batch || "N/A"}
          </p>
        </div>
        <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-center">
          <p className="text-[9px] text-emerald-600 uppercase">Sample Letter</p>
          <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
            {aqlConfig.sampleLetter || "N/A"}
          </p>
        </div>
        <div className="p-2 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg text-center">
          <p className="text-[9px] text-cyan-600 uppercase">Sample Size</p>
          <p className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
            {aqlConfig.sampleSize || "N/A"}
          </p>
        </div>
      </div>

      {/* AQL Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-gray-700 to-gray-800 text-white">
              <th className="px-3 py-2 text-left text-xs font-bold uppercase">
                Status
              </th>
              <th className="px-3 py-2 text-center text-xs font-bold uppercase">
                AQL Level
              </th>
              <th className="px-3 py-2 text-center text-xs font-bold uppercase">
                Ac
              </th>
              <th className="px-3 py-2 text-center text-xs font-bold uppercase">
                Re
              </th>
            </tr>
          </thead>
          <tbody>
            {aqlConfig.items.map((item, index) => {
              const bgClass =
                item.status === "Minor"
                  ? "bg-blue-50/50 dark:bg-blue-900/10"
                  : item.status === "Major"
                    ? "bg-orange-50/50 dark:bg-orange-900/10"
                    : "bg-red-50/50 dark:bg-red-900/10";

              const textClass =
                item.status === "Minor"
                  ? "text-blue-700 dark:text-blue-400"
                  : item.status === "Major"
                    ? "text-orange-700 dark:text-orange-400"
                    : "text-red-700 dark:text-red-400";

              return (
                <tr
                  key={index}
                  className={`border-b border-gray-200 dark:border-gray-700 ${bgClass}`}
                >
                  <td className={`px-3 py-2 font-semibold ${textClass}`}>
                    {item.status}
                  </td>
                  <td className="px-3 py-2 text-center font-medium text-gray-700 dark:text-gray-300">
                    {item.aqlLevel ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-center font-bold text-green-600 dark:text-green-400">
                    {item.ac ?? "—"}
                  </td>
                  <td className="px-3 py-2 text-center font-bold text-red-600 dark:text-red-400">
                    {item.re ?? "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ============================================================
// Helper function to get user photo URL
// ============================================================
const getUserPhotoUrl = (facePhoto) => {
  if (!facePhoto) return null;

  // If it's already a full URL (starts with http or https), use as is
  if (facePhoto.startsWith("http://") || facePhoto.startsWith("https://")) {
    return facePhoto;
  }

  // If it starts with a slash, it's a relative path - prepend PUBLIC_ASSET_URL
  if (facePhoto.startsWith("/")) {
    return `${PUBLIC_ASSET_URL}${facePhoto}`;
  }

  // Otherwise, prepend PUBLIC_ASSET_URL with a slash
  return `${PUBLIC_ASSET_URL}/${facePhoto}`;
};

// ============================================================
// Main Modal Component - FULL SCREEN with createPortal
// ============================================================
const YPivotQAInspectionOrderDataSaveModal = ({
  isOpen,
  onClose,
  onConfirm,
  user,
  orderState,
  reportState,
  qualityPlanData,
}) => {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Extract data for display
  const inspectionDate = orderState?.inspectionDate;
  const inspectionType = orderState?.inspectionType || "first";
  const orderNos = orderState?.selectedOrders || [];
  const orderData = orderState?.orderData;
  const orderType = orderState?.orderType || "single";

  const selectedTemplate = reportState?.selectedTemplate;
  const config = reportState?.config || {};

  // Get user photo URL
  const userPhotoUrl = useMemo(() => {
    return getUserPhotoUrl(user?.face_photo);
  }, [user?.face_photo]);

  // Buyer determination
  const determineBuyer = (orderNo) => {
    if (!orderNo) return { buyer: "Unknown", code: "--" };
    const upper = orderNo.toUpperCase();
    if (upper.includes("COM")) return { buyer: "MWW", code: "COM" };
    if (/CO[A-LN-Z]/.test(upper)) return { buyer: "Costco", code: "CO" };
    if (upper.includes("AR")) return { buyer: "Aritzia", code: "AR" };
    if (upper.includes("RT")) return { buyer: "Reitmans", code: "RT" };
    if (upper.includes("AF")) return { buyer: "ANF", code: "AF" };
    if (upper.includes("NT")) return { buyer: "STORI", code: "NT" };
    return { buyer: "Unknown", code: "--" };
  };

  const buyerInfo =
    orderNos.length > 0
      ? determineBuyer(orderNos[0])
      : { buyer: "Unknown", code: "--" };

  const prepareAqlPayload = () => {
    if (selectedTemplate?.InspectedQtyMethod !== "AQL") return null;
    const src = config.aqlConfig || {};

    // We need to extract the float values from the items array if not present at top level
    const minorItem = src.items?.find((i) => i.status === "Minor");
    const majorItem = src.items?.find((i) => i.status === "Major");
    const criticalItem = src.items?.find((i) => i.status === "Critical");

    return {
      inspectionType: src.inspectionType || "General",
      level: src.level || "II",
      // Extract floats
      minorAQL: parseFloat(minorItem?.aqlLevel) || 0,
      majorAQL: parseFloat(majorItem?.aqlLevel) || 0,
      criticalAQL: parseFloat(criticalItem?.aqlLevel) || 0,

      inspectedQty: parseInt(config.inspectedQty) || 0,
      batch: src.batch || "",
      sampleLetter: src.sampleLetter || "",
      sampleSize: parseInt(src.sampleSize) || 0,

      items:
        src.items?.map((item) => ({
          status: item.status,
          ac: parseInt(item.ac) || 0,
          re: parseInt(item.re) || 0,
        })) || [],
    };
  };

  // Handle save
  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      // Prepare specific AQL payload
      const finalAqlConfig = prepareAqlPayload();

      // DETERMINE IF WE NEED TO SAVE EMB/PRINT DATA
      const reportTypeName = selectedTemplate?.ReportType || "";
      const isEMB = reportTypeName.toLowerCase().includes("emb");
      const isPrinting = reportTypeName.toLowerCase().includes("printing");

      // Only include if relevant to the report type
      const finalEmbInfo =
        isEMB && !isPrinting && config.embInfo ? config.embInfo : null;
      const finalPrintInfo =
        isPrinting && config.printInfo ? config.printInfo : null;

      const payload = {
        inspectionDate,
        inspectionType,
        orderNos,
        orderType,
        empId: user?.emp_id,
        empName: user?.eng_name || user?.kh_name || user?.job_title,
        inspectionDetails: {
          buyer: buyerInfo.buyer,
          buyerCode: buyerInfo.code,
          productType:
            config.productType || orderData?.yorksysOrder?.productType,
          productTypeId: config.productTypeId,
          supplier: "YM",
          isSubCon: config.isSubCon || false,
          subConFactory: config.selectedSubConFactoryName || "",
          subConFactoryId: config.selectedSubConFactory,
          reportTypeName: selectedTemplate?.ReportType,
          reportTypeId: selectedTemplate?._id,
          measurement: selectedTemplate?.Measurement || "N/A",
          method: selectedTemplate?.InspectedQtyMethod || "N/A",

          // Handle Empty Strings for Numbers
          inspectedQty: config.inspectedQty !== "" ? config.inspectedQty : null,
          aqlSampleSize: config.aqlSampleSize || 0,
          cartonQty: config.cartonQty !== "" ? config.cartonQty : null,

          shippingStage: config.shippingStage || "",
          remarks: config.remarks || "",
          totalOrderQty: orderData?.dtOrder?.totalQty || 0,
          custStyle: orderData?.dtOrder?.custStyle || "",
          customer: orderData?.dtOrder?.customer || "",
          factory: orderData?.dtOrder?.factory || "",

          // Use the transformed AQL config
          aqlConfig: finalAqlConfig,

          productionStatus: qualityPlanData?.productionStatus || null,
          packingList: qualityPlanData?.packingList || null,
          qualityPlanEnabled: selectedTemplate?.QualityPlan === "Yes",
          embInfo: finalEmbInfo,
          printInfo: finalPrintInfo,
        },
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/create-report`,
        payload,
      );

      if (response.data.success) {
        onConfirm({
          reportData: response.data.data,
          isNew: response.data.isNew,
          message: response.data.message,
        });
      } else {
        setError(response.data.message || "Failed to save report");
      }
    } catch (err) {
      console.error("Save error:", err);
      setError(
        err.response?.data?.message || "Failed to save inspection report",
      );
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  // Use createPortal to render full screen modal to document.body
  return createPortal(
    <div className="fixed inset-0 z-[100] h-[100dvh] bg-white dark:bg-gray-900 overflow-y-auto animate-fadeIn flex flex-col">
      {/* Header - Fixed at top */}
      <div className="flex-shrink-0 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center shadow-lg safe-area-top">
        <div className="min-w-0 flex-1">
          <h2 className="text-white font-bold text-lg line-clamp-1 flex items-center gap-2">
            <Save className="w-5 h-5" />
            Save Inspection Report
          </h2>
          <p className="text-indigo-100 text-xs">
            Review and confirm all details before saving
          </p>
        </div>
        <button
          onClick={onClose}
          disabled={saving}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors flex-shrink-0"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body - Scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 pb-24">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* User Info Section */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-4 sm:gap-6">
              {/* User Photo */}
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-4 border-amber-300 dark:border-amber-700 bg-gray-100 dark:bg-gray-700 flex-shrink-0 shadow-lg">
                {userPhotoUrl ? (
                  <img
                    src={userPhotoUrl}
                    alt={user?.name || "User"}
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
                  className={`fallback-icon w-full h-full items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 ${
                    userPhotoUrl ? "hidden" : "flex"
                  }`}
                >
                  <User className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wide mb-1">
                  Inspector
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-200 truncate">
                  {user?.eng_name || user?.name || user?.job_title || "Unknown"}
                </p>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                  Employee ID:{" "}
                  <span className="font-semibold">{user?.emp_id || "N/A"}</span>
                </p>
                {user?.job_title && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    {user.job_title}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Inspection Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-1">
              <InfoRow
                icon={Calendar}
                label="Inspection Date"
                value={
                  inspectionDate
                    ? new Date(inspectionDate).toLocaleDateString()
                    : "N/A"
                }
                color="indigo"
              />
              <InfoRow
                icon={ClipboardList}
                label="Inspection Type"
                value={
                  inspectionType === "first"
                    ? "First Inspection"
                    : "Re-Inspection"
                }
                color="emerald"
              />
              <InfoRow
                icon={Package}
                label="Order No(s)"
                value={orderNos.join(", ")}
                color="purple"
              />
              <InfoRow
                icon={Hash}
                label="Total Order Qty"
                value={orderData?.dtOrder?.totalQty?.toLocaleString() || "0"}
                color="blue"
              />
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 space-y-1">
              <InfoRow
                icon={Building2}
                label="Buyer"
                value={buyerInfo.buyer}
                color="orange"
              />
              <InfoRow
                icon={Shirt}
                label="Product Type"
                value={
                  config.productType ||
                  orderData?.yorksysOrder?.productType ||
                  "N/A"
                }
                color="pink"
              />
              <InfoRow
                icon={Factory}
                label="Supplier"
                value="YM"
                color="cyan"
              />
              <InfoRow
                icon={Factory}
                label="Sub-Con"
                value={
                  config.isSubCon
                    ? `Yes - ${config.selectedSubConFactoryName || "N/A"}`
                    : "No"
                }
                color="amber"
              />
            </div>
          </div>

          {/* Report Type Info */}
          {selectedTemplate && (
            <div className="p-4 sm:p-6 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-base font-bold text-purple-800 dark:text-purple-200">
                  Report Configuration
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg text-center shadow-sm">
                  <p className="text-[10px] text-gray-500 uppercase font-medium">
                    Report Type
                  </p>
                  <p className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate mt-1">
                    {selectedTemplate.ReportType}
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg text-center shadow-sm">
                  <p className="text-[10px] text-gray-500 uppercase font-medium">
                    Measurement
                  </p>
                  <p className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {selectedTemplate.Measurement || "N/A"}
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg text-center shadow-sm">
                  <p className="text-[10px] text-gray-500 uppercase font-medium">
                    Method
                  </p>
                  <p className="text-sm font-bold text-orange-600 dark:text-orange-400 mt-1">
                    {selectedTemplate.InspectedQtyMethod || "N/A"}
                  </p>
                </div>
                <div className="p-3 bg-white dark:bg-gray-800 rounded-lg text-center shadow-sm">
                  <p className="text-[10px] text-gray-500 uppercase font-medium">
                    Inspected Qty
                  </p>
                  <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {config.inspectedQty || selectedTemplate.InspectedQty || 0}
                  </p>
                </div>
              </div>

              {/* Additional config fields */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                {selectedTemplate.isCarton === "Yes" && (
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg text-center shadow-sm">
                    <p className="text-[10px] text-gray-500 uppercase font-medium">
                      Carton Qty
                    </p>
                    <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1">
                      {config.cartonQty || 0}
                    </p>
                  </div>
                )}
                {selectedTemplate.ShippingStage === "Yes" && (
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg text-center shadow-sm">
                    <p className="text-[10px] text-gray-500 uppercase font-medium">
                      Shipping Stage
                    </p>
                    <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400 mt-1">
                      {config.shippingStage || "N/A"}
                    </p>
                  </div>
                )}
              </div>

              {/* Remarks */}
              {config.remarks && (
                <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                  <p className="text-[10px] text-gray-500 uppercase font-medium mb-1">
                    Remarks
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {config.remarks}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* AQL Config - Only show if method is AQL */}
          {selectedTemplate?.InspectedQtyMethod === "AQL" &&
            config.aqlConfig && (
              <div className="p-4 sm:p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-200 dark:border-indigo-800">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-base font-bold text-indigo-800 dark:text-indigo-200">
                    AQL Configuration
                  </h3>
                </div>
                <AQLConfigDisplay
                  aqlConfig={config.aqlConfig}
                  inspectedQty={config.inspectedQty}
                />
              </div>
            )}

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-700 dark:text-red-400">
                  Error
                </p>
                <p className="text-sm text-red-600 dark:text-red-500">
                  {error}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 safe-area-bottom">
        <div className="max-w-4xl mx-auto flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-3 text-sm font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Yes, Save Report
              </>
            )}
          </button>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .safe-area-top {
          padding-top: env(safe-area-inset-top);
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>,
    document.body,
  );
};

export default YPivotQAInspectionOrderDataSaveModal;
