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
  MinusCircle,
  Hash,
  Calendar,
  Layers,
  ChevronRight
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

// --- Helpers ---
const materialLabels = [
  [
    { label: "PP / Size Set Samples", sub: "客批样衣", key: "ppSizeSet" },
    { label: "Approval Swatches", sub: "布办", key: "approvalSwatches" }
  ],
  [
    { label: "Full Size Spec", sub: "客批尺寸表", key: "approvalFullSizeSpec" },
    { label: "Trim Card", sub: "物料卡", key: "approvalTrimCard" }
  ],
  [
    { label: "Sample Comments", sub: "客人评语", key: "sampleComments" },
    { label: "Print / Embroidery", sub: "印花/绣花", key: "approvalPrintEmb" }
  ],
  [
    { label: "Hand Feel Standard", sub: "手感样", key: "handFeelStandard" },
    {
      label: "Fabric Inspection",
      sub: "验布结果",
      key: "fabricInspectionResult"
    }
  ],
  [
    {
      label: "Washing Standard",
      sub: "洗水样",
      key: "approvalWashingStandard"
    },
    { label: "Other", sub: "", key: "other", type: "text" }
  ]
];

const getImageUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http") || url.startsWith("data:")) return url;
  const cleanPath = url.startsWith("/") ? url : `/${url}`;
  const cleanBase = API_BASE_URL.endsWith("/")
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL;
  return `${cleanBase}${cleanPath}`;
};

const StatusBadge = ({ value }) => {
  let style = "bg-gray-100 text-gray-600 border-gray-200";
  let Icon = MinusCircle;

  if (value === "OK" || value === "Pass") {
    style = "bg-emerald-100 text-emerald-700 border-emerald-200";
    Icon = CheckCircle;
  } else if (value === "NO" || value === "Fail") {
    style = "bg-red-100 text-red-700 border-red-200";
    Icon = XCircle;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${style}`}
    >
      <Icon className="w-3 h-3" />
      {value || "N/A"}
    </span>
  );
};

const YPivotQAReportPPSheetSection = ({ ppSheetData, onImageClick }) => {
  if (!ppSheetData) return null;

  return (
    <div className="space-y-6 p-4">
      {/* 1. Header Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full text-blue-600 dark:text-blue-200">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-blue-500 uppercase font-bold">
              Pilot Style
            </p>
            <p className="text-sm font-black text-gray-800 dark:text-gray-100">
              {ppSheetData.style || "-"}
            </p>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-100 dark:border-purple-800 flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-full text-purple-600 dark:text-purple-200">
            <Hash className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-purple-500 uppercase font-bold">
              Pilot Qty
            </p>
            <p className="text-sm font-black text-gray-800 dark:text-gray-100">
              {ppSheetData.qty || "-"}
            </p>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center gap-3">
          <div className="p-2 bg-gray-200 dark:bg-gray-600 rounded-full text-gray-600 dark:text-gray-300">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 uppercase font-bold">
              Meeting Date
            </p>
            <p className="text-sm font-black text-gray-800 dark:text-gray-100">
              {ppSheetData.date || "-"}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Material Availability Table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-indigo-500" />
          <h4 className="text-sm font-bold text-gray-800 dark:text-white">
            Material Availability
          </h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {materialLabels.map((row, idx) => (
                <tr
                  key={idx}
                  className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <td className="px-4 py-2.5 w-1/4 border-r border-gray-100 dark:border-gray-700">
                    <p className="font-bold text-gray-700 dark:text-gray-300">
                      {row[0].label}
                    </p>
                    {row[0].sub && (
                      <p className="text-[10px] text-gray-400">{row[0].sub}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 w-1/4 border-r border-gray-100 dark:border-gray-700">
                    <StatusBadge value={ppSheetData.materials?.[row[0].key]} />
                  </td>
                  <td className="px-4 py-2.5 w-1/4 border-r border-gray-100 dark:border-gray-700">
                    <p className="font-bold text-gray-700 dark:text-gray-300">
                      {row[1].label}
                    </p>
                    {row[1].sub && (
                      <p className="text-[10px] text-gray-400">{row[1].sub}</p>
                    )}
                  </td>
                  <td className="px-4 py-2.5 w-1/4">
                    <StatusBadge value={ppSheetData.materials?.[row[1].key]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Risk Analysis Table */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-white" />
          <h4 className="text-sm font-bold text-white">Risk Analysis</h4>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-orange-50 dark:bg-orange-900/20 border-b border-orange-100 dark:border-orange-800">
                <th className="px-4 py-2 font-bold text-orange-800 dark:text-orange-200 w-12 text-center">
                  #
                </th>
                <th className="px-4 py-2 font-bold text-orange-800 dark:text-orange-200 w-1/2">
                  Potential Risk
                </th>
                <th className="px-4 py-2 font-bold text-orange-800 dark:text-orange-200 w-1/2">
                  Action / Countermeasure
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-900">
              {ppSheetData.riskAnalysis &&
              ppSheetData.riskAnalysis.length > 0 ? (
                ppSheetData.riskAnalysis.map((item, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 text-center font-mono text-gray-400 font-bold">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex gap-2">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-200 font-medium">
                          {item.risk || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="flex gap-2">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-gray-700 dark:text-gray-200">
                          {item.action || "-"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-gray-400 italic"
                  >
                    No risk analysis records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 4. Critical Operations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm h-full">
          <div className="bg-purple-50 dark:bg-purple-900/20 px-4 py-2 border-b border-purple-100 dark:border-purple-800 flex items-center gap-2">
            <PenTool className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <h4 className="text-sm font-bold text-purple-800 dark:text-purple-200">
              Critical Operations
            </h4>
          </div>
          <div className="p-4">
            <ul className="space-y-2">
              {ppSheetData.criticalOperations?.length > 0 ? (
                ppSheetData.criticalOperations.map((op, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <ChevronRight className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {op}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-gray-400 italic">None recorded</li>
              )}
            </ul>
          </div>
        </div>

        {/* 5. Other Comments */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm h-full">
          <div className="bg-teal-50 dark:bg-teal-900/20 px-4 py-2 border-b border-teal-100 dark:border-teal-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <h4 className="text-sm font-bold text-teal-800 dark:text-teal-200">
              Other Comments
            </h4>
          </div>
          <div className="p-4">
            <ul className="space-y-2">
              {ppSheetData.otherComments?.length > 0 ? (
                ppSheetData.otherComments.map((cm, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs">
                    <div className="w-1.5 h-1.5 rounded-full bg-teal-400 mt-1.5 flex-shrink-0"></div>
                    <span className="text-gray-700 dark:text-gray-300">
                      {cm}
                    </span>
                  </li>
                ))
              ) : (
                <li className="text-xs text-gray-400 italic">None recorded</li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* 6. Attendance */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
          <User className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h4 className="text-sm font-bold text-gray-800 dark:text-white">
            Meeting Attendance
          </h4>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Object.entries(ppSheetData.attendance || {}).map(
              ([role, users]) => (
                <div
                  key={role}
                  className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2.5 border border-gray-100 dark:border-gray-700 flex flex-col h-full"
                >
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-wide mb-2 pb-1 border-b border-gray-200 dark:border-gray-700">
                    {role}
                  </p>
                  <div className="flex-1 space-y-1">
                    {users && users.length > 0 ? (
                      users.map((u) => (
                        <div key={u.emp_id} className="flex flex-col">
                          <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 truncate">
                            {u.eng_name || u.emp_id}
                          </span>
                          <span className="text-[9px] font-mono text-gray-400">
                            {u.emp_id}
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-[10px] text-gray-400 italic">
                        -
                      </span>
                    )}
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* 7. Images */}
      {ppSheetData.images && ppSheetData.images.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
          <div className="bg-pink-50 dark:bg-pink-900/20 px-4 py-2 border-b border-pink-100 dark:border-pink-800 flex items-center gap-2">
            <Images className="w-4 h-4 text-pink-600 dark:text-pink-400" />
            <h4 className="text-sm font-bold text-pink-800 dark:text-pink-200">
              Attached Documents / Images
            </h4>
          </div>
          <div className="p-4 overflow-x-auto">
            <div className="flex gap-4">
              {ppSheetData.images.map((img, i) => {
                const url = getImageUrl(img.imageURL || img.url);
                return (
                  <div
                    key={i}
                    className="flex-shrink-0 w-32 h-32 group relative cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-all"
                    onClick={() =>
                      onImageClick && onImageClick(url, "PP Sheet")
                    }
                  >
                    <img
                      src={url}
                      alt="PP Sheet Doc"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YPivotQAReportPPSheetSection;
