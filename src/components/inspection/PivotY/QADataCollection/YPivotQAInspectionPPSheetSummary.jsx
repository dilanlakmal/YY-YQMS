import React from "react";
import {
  FileSpreadsheet,
  CheckCircle,
  AlertTriangle,
  PenTool,
  FileText,
  User,
  Images,
  XCircle,
  MinusCircle
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

// Helper for labels map (Same as input form)
const materialLabels = [
  [
    { label: "PP / Size Set / Ref samples 客批样衣", key: "ppSizeSet" },
    { label: "Approval Swatches 布办", key: "approvalSwatches" }
  ],
  [
    {
      label: "Approval Full Size Spec 客批尺寸表",
      key: "approvalFullSizeSpec"
    },
    { label: "Approval Trim card 物料卡", key: "approvalTrimCard" }
  ],
  [
    { label: "Sample Comments 客人评语", key: "sampleComments" },
    { label: "Approval Print / Embroidery 印花、绣花", key: "approvalPrintEmb" }
  ],
  [
    { label: "Hand feel Standard 手感样", key: "handFeelStandard" },
    {
      label: "Fabric inspection result 验布结果",
      key: "fabricInspectionResult"
    }
  ],
  [
    {
      label: "Approval Washing Standard 洗水样",
      key: "approvalWashingStandard"
    },
    { label: "Other", key: "other", type: "text" }
  ]
];

// Helper to resolve image URL
const getImageUrl = (url) => {
  if (!url) return null;

  // If it's already a full URL or Base64, return as is
  if (
    url.startsWith("http") ||
    url.startsWith("https") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  // If it's a relative path (e.g. /storage/...), prepend the API Base URL
  // Ensure we don't have double slashes
  const cleanPath = url.startsWith("/") ? url : `/${url}`;

  // Remove trailing slash from API_BASE_URL if present to avoid double slashes
  const cleanBase = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;

  return `${cleanBase}${cleanPath}`;
};

const StatusBadge = ({ value }) => {
  if (value === "OK" || value === "Pass") {
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded border border-green-200">
        <CheckCircle className="w-3 h-3" /> {value}
      </span>
    );
  }
  if (value === "NO" || value === "Fail") {
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2 py-0.5 rounded border border-red-200">
        <XCircle className="w-3 h-3" /> {value}
      </span>
    );
  }
  if (value === "NA") {
    return (
      <span className="flex items-center gap-1 text-xs font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
        <MinusCircle className="w-3 h-3" /> N/A
      </span>
    );
  }
  return (
    <span className="text-xs text-gray-700 font-bold">{value || "-"}</span>
  );
};

const YPivotQAInspectionPPSheetSummary = ({ ppSheetData }) => {
  if (!ppSheetData) return null;

  return (
    <div className="space-y-4">
      {/* 1. Header Info */}
      <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border border-gray-200 dark:border-gray-700 grid grid-cols-3 gap-4">
        <div>
          <p className="text-[10px] text-gray-500 uppercase font-bold">Style</p>
          <p className="text-sm font-bold text-gray-800 dark:text-white">
            {ppSheetData.style || "-"}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase font-bold">Qty</p>
          <p className="text-sm font-bold text-gray-800 dark:text-white">
            {ppSheetData.qty || "-"}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500 uppercase font-bold">Date</p>
          <p className="text-sm font-bold text-gray-800 dark:text-white">
            {ppSheetData.date || "-"}
          </p>
        </div>
      </div>

      {/* 2. Material Availability */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-blue-600 px-3 py-1.5 flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-white" />
          <h4 className="text-white text-xs font-bold uppercase">
            Material Availability
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {materialLabels.map((row, idx) => (
                <tr key={idx} className="bg-white dark:bg-gray-800">
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300 font-medium border-r dark:border-gray-700 w-1/4">
                    {row[0].label}
                  </td>
                  <td className="px-3 py-2 border-r dark:border-gray-700 w-1/4">
                    <StatusBadge value={ppSheetData.materials?.[row[0].key]} />
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-300 font-medium border-r dark:border-gray-700 w-1/4">
                    {row[1].label}
                  </td>
                  <td className="px-3 py-2 w-1/4">
                    <StatusBadge value={ppSheetData.materials?.[row[1].key]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 3. Risk Analysis */}
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden flex flex-col">
          <div className="bg-orange-500 px-3 py-1.5 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-white" />
            <h4 className="text-white text-xs font-bold uppercase">
              Risk Analysis
            </h4>
          </div>
          <div className="p-3 bg-white dark:bg-gray-800 flex-1 space-y-2">
            {ppSheetData.riskAnalysis && ppSheetData.riskAnalysis.length > 0 ? (
              ppSheetData.riskAnalysis.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-orange-50 dark:bg-orange-900/10 p-2 rounded border border-orange-100 dark:border-orange-800/50"
                >
                  <p className="text-[10px] font-bold text-orange-800 dark:text-orange-300 uppercase mb-0.5">
                    Risk:
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300 mb-1.5">
                    {item.risk || "-"}
                  </p>
                  <div className="h-px bg-orange-200 dark:bg-orange-800/50 mb-1.5"></div>
                  <p className="text-[10px] font-bold text-orange-800 dark:text-orange-300 uppercase mb-0.5">
                    Action:
                  </p>
                  <p className="text-xs text-gray-700 dark:text-gray-300">
                    {item.action || "-"}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 italic">
                No risk analysis recorded.
              </p>
            )}
          </div>
        </div>

        {/* 4. Operations & Comments */}
        <div className="space-y-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-purple-600 px-3 py-1.5 flex items-center gap-2">
              <PenTool className="w-4 h-4 text-white" />
              <h4 className="text-white text-xs font-bold uppercase">
                Critical Operations
              </h4>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800">
              <ul className="list-disc list-inside space-y-1">
                {ppSheetData.criticalOperations?.map((op, i) => (
                  <li
                    key={i}
                    className="text-xs text-gray-700 dark:text-gray-300"
                  >
                    {op}
                  </li>
                ))}
                {(!ppSheetData.criticalOperations ||
                  ppSheetData.criticalOperations.length === 0) && (
                  <li className="text-xs text-gray-400 italic list-none">
                    None
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-teal-600 px-3 py-1.5 flex items-center gap-2">
              <FileText className="w-4 h-4 text-white" />
              <h4 className="text-white text-xs font-bold uppercase">
                Other Comments
              </h4>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800">
              <ul className="list-disc list-inside space-y-1">
                {ppSheetData.otherComments?.map((cm, i) => (
                  <li
                    key={i}
                    className="text-xs text-gray-700 dark:text-gray-300"
                  >
                    {cm}
                  </li>
                ))}
                {(!ppSheetData.otherComments ||
                  ppSheetData.otherComments.length === 0) && (
                  <li className="text-xs text-gray-400 italic list-none">
                    None
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Attendance */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        <div className="bg-green-600 px-3 py-1.5 flex items-center gap-2">
          <User className="w-4 h-4 text-white" />
          <h4 className="text-white text-xs font-bold uppercase">Attendance</h4>
        </div>
        <div className="p-3 bg-white dark:bg-gray-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Object.entries(ppSheetData.attendance || {}).map(([role, users]) => (
            <div
              key={role}
              className="bg-gray-50 dark:bg-gray-900 rounded p-2 border border-gray-100 dark:border-gray-700"
            >
              <p className="text-[9px] font-bold text-gray-500 uppercase mb-1.5">
                {role}
              </p>
              {users && users.length > 0 ? (
                <div className="flex flex-wrap gap-1">
                  {users.map((u) => (
                    <span
                      key={u.emp_id}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded text-[10px] text-gray-700 dark:text-gray-300 shadow-sm"
                      title={u.eng_name}
                    >
                      <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                        {u.emp_id}
                      </span>
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-[10px] text-gray-400 italic"> - </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 6. Images */}
      {ppSheetData.images && ppSheetData.images.length > 0 && (
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="bg-pink-600 px-3 py-1.5 flex items-center gap-2">
            <Images className="w-4 h-4 text-white" />
            <h4 className="text-white text-xs font-bold uppercase">
              PP Sheet Images
            </h4>
          </div>
          <div className="p-3 bg-white dark:bg-gray-800">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {ppSheetData.images.map((img, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-24 h-24 rounded border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  <img
                    src={getImageUrl(img.imageURL || img.url)}
                    alt="PP Sheet Doc"
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YPivotQAInspectionPPSheetSummary;
