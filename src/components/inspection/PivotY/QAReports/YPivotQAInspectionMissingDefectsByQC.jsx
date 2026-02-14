import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  User,
  Layers,
  Loader2,
  Users,
  Percent,
  CheckCircle2,
} from "lucide-react";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";

const YPivotQAInspectionMissingDefectsByQC = ({ reportId }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Hardcoded as requested
  const INSPECTED_QTY = 20;

  useEffect(() => {
    const fetchData = async () => {
      if (!reportId) return;
      try {
        setLoading(true);
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}/defects-by-qc`,
        );
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (error) {
        console.error("Error loading QC defect data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reportId]);

  if (loading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  // If no inspectors found at all (neither config nor defects), return null
  if (!data || data.length === 0) return null;

  // Helper to resolve image URL
  const getPhotoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    const cleanPath = url.startsWith("/") ? url.substring(1) : url;
    const baseUrl = PUBLIC_ASSET_URL.endsWith("/")
      ? PUBLIC_ASSET_URL
      : `${PUBLIC_ASSET_URL}/`;
    return `${baseUrl}${cleanPath}`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "minor":
        return "bg-green-100 text-green-700 border-green-200";
      case "major":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "critical":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  // Helper to construct the Config Label (Line • Table • Color)
  const getConfigLabel = (config) => {
    const parts = [];
    if (config.line) parts.push(`Line ${config.line}`);
    if (config.table) parts.push(`Table ${config.table}`);
    if (config.color) parts.push(config.color);

    return parts.length > 0 ? parts.join(" • ") : "General Config";
  };

  // Logic for Rate Badge Background
  const getRateBadgeStyles = (inspector) => {
    const { totalDefects, minorCount, majorCount, criticalCount } = inspector;

    // Condition 1: Perfect Score (0 Defects) -> Green
    if (totalDefects === 0) {
      return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
    }

    // Condition 2: Only 1 Minor defect -> Green
    const isSingleMinor =
      totalDefects === 1 &&
      minorCount === 1 &&
      majorCount === 0 &&
      criticalCount === 0;

    if (isSingleMinor) {
      return "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800";
    }

    // Condition 3: Else (More than 1, or any Major/Critical) -> Red
    return "bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mt-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-500 to-red-600 px-4 py-2.5 flex items-center gap-2">
        <Users className="w-4 h-4 text-white" />
        <h2 className="text-white font-bold text-sm">
          Missing Defects by QC Inspector
        </h2>
      </div>

      <div className="p-4">
        {/* Responsive Grid: 1 col mobile, 2 col tablet, 3 col desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.map((inspector) => {
            // Calculate Rate: (Total Defects / 20) * 100
            const defectRate = (
              (inspector.totalDefects / INSPECTED_QTY) *
              100
            ).toFixed(0);

            return (
              <div
                key={inspector._id}
                className="bg-gray-50 dark:bg-gray-900/40 rounded-xl border border-gray-200 dark:border-gray-700 p-0 flex flex-col shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* 1. QC Profile & Global Totals Header */}
                <div className="p-4 pb-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 relative">
                  {/* Top Row: Profile + Defect Rate Badge */}
                  <div className="flex justify-between items-start mb-3">
                    {/* Profile */}
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-12 h-12 rounded-full border-2 border-gray-100 dark:border-gray-600 shadow-sm overflow-hidden bg-gray-200 dark:bg-gray-700">
                          {inspector.qcDetails.face_photo ? (
                            <img
                              src={getPhotoUrl(inspector.qcDetails.face_photo)}
                              alt={inspector.qcDetails.eng_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.parentElement.querySelector(
                                  ".fallback",
                                ).style.display = "flex";
                              }}
                            />
                          ) : null}
                          <div
                            className={`fallback w-full h-full items-center justify-center text-gray-400 ${
                              inspector.qcDetails.face_photo ? "hidden" : "flex"
                            }`}
                          >
                            <User className="w-6 h-6" />
                          </div>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 truncate">
                          {inspector.qcDetails.eng_name}
                        </h3>
                        <div className="flex flex-wrap gap-y-1 gap-x-2 mt-0.5">
                          <div className="inline-flex items-center gap-1">
                            <span className="text-[10px] text-gray-400 uppercase font-bold">
                              ID
                            </span>
                            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400">
                              {inspector._id}
                            </span>
                          </div>
                          {inspector.qcDetails.job_title && (
                            <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0 rounded truncate max-w-full">
                              {inspector.qcDetails.job_title}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Defect Rate Badge (Top Right) */}
                    <div
                      className={`flex flex-col items-center justify-center px-2 py-1.5 rounded-lg border shadow-sm ml-2 shrink-0 ${getRateBadgeStyles(
                        inspector,
                      )}`}
                    >
                      <div className="flex items-center gap-0.5">
                        <span className="text-sm font-black">{defectRate}</span>
                        <Percent className="w-3 h-3" />
                      </div>
                      <span className="text-[8px] font-bold uppercase tracking-wider opacity-80">
                        Rate
                      </span>
                    </div>
                  </div>

                  {/* Stats Row: Inspected | Defects | Breakdown */}
                  <div className="flex items-center justify-between">
                    {/* Left: Inspected & Defects Counts */}
                    <div className="flex items-center gap-4 pr-3 border-r border-gray-100 dark:border-gray-700">
                      {/* Inspected */}
                      <div className="text-center">
                        <p className="text-[9px] text-gray-400 uppercase font-bold">
                          Inspected
                        </p>
                        <p className="text-lg font-black text-gray-800 dark:text-white leading-tight">
                          {INSPECTED_QTY}
                        </p>
                      </div>

                      {/* Defects */}
                      <div className="text-center">
                        <p className="text-[9px] text-gray-400 uppercase font-bold">
                          Defects
                        </p>
                        <p className="text-lg font-black text-gray-800 dark:text-white leading-tight">
                          {inspector.totalDefects}
                        </p>
                      </div>
                    </div>

                    {/* Right: Breakdown Badges */}
                    <div className="flex gap-1.5 flex-1 justify-end">
                      {inspector.totalDefects === 0 ? (
                        <div className="px-2 py-1 rounded bg-green-50 dark:bg-green-900/20 text-center border border-green-100 dark:border-green-800/50 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-green-600" />
                          <span className="text-[10px] font-bold text-green-700 dark:text-green-300">
                            Perfect
                          </span>
                        </div>
                      ) : (
                        <>
                          {inspector.minorCount > 0 && (
                            <div className="px-2 py-1 rounded bg-green-50 dark:bg-green-900/20 text-center border border-green-100 dark:border-green-800/50">
                              <p className="text-[8px] text-green-700 dark:text-green-300 font-bold uppercase">
                                Min
                              </p>
                              <p className="text-xs font-bold text-green-800 dark:text-green-200">
                                {inspector.minorCount}
                              </p>
                            </div>
                          )}
                          {inspector.majorCount > 0 && (
                            <div className="px-2 py-1 rounded bg-orange-50 dark:bg-orange-900/20 text-center border border-orange-100 dark:border-orange-800/50">
                              <p className="text-[8px] text-orange-700 dark:text-orange-300 font-bold uppercase">
                                Maj
                              </p>
                              <p className="text-xs font-bold text-orange-800 dark:text-orange-200">
                                {inspector.majorCount}
                              </p>
                            </div>
                          )}
                          {inspector.criticalCount > 0 && (
                            <div className="px-2 py-1 rounded bg-red-50 dark:bg-red-900/20 text-center border border-red-100 dark:border-red-800/50">
                              <p className="text-[8px] text-red-700 dark:text-red-300 font-bold uppercase">
                                Crit
                              </p>
                              <p className="text-xs font-bold text-red-800 dark:text-red-200">
                                {inspector.criticalCount}
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Scrollable Defect List Grouped by Config */}
                <div className="flex-1 overflow-y-auto max-h-[250px] bg-gray-50 dark:bg-gray-900/20 custom-scrollbar p-3 space-y-3">
                  {inspector.configs.map((config, configIdx) => (
                    <div key={configIdx} className="space-y-2">
                      {/* Config Label Header */}
                      <div className="flex items-center gap-1.5 pb-1 border-b border-gray-200 dark:border-gray-700/50">
                        <Layers className="w-3 h-3 text-gray-400" />
                        <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                          {getConfigLabel(config)}
                        </span>
                      </div>

                      {/* Defect Items for this Config */}
                      {config.defects && config.defects.length > 0 ? (
                        <div className="space-y-1.5">
                          {config.defects.map((defect, idx) => (
                            <div
                              key={`${configIdx}-${idx}`}
                              className="flex items-center justify-between bg-white dark:bg-gray-800 px-2.5 py-2 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm"
                            >
                              <span
                                className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate mr-2"
                                title={defect.name}
                              >
                                {defect.name}
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <span
                                  className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${getStatusColor(
                                    defect.status,
                                  )}`}
                                >
                                  {defect.status || "N/A"}
                                </span>
                                <span className="text-xs font-bold bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-800 dark:text-gray-200 min-w-[20px] text-center">
                                  {defect.qty}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        // If no defects for this config, show placeholder
                        <div className="text-center py-2 bg-white/50 dark:bg-gray-800/50 rounded-md border border-dashed border-gray-200 dark:border-gray-700">
                          <p className="text-[10px] text-gray-400 italic">
                            No defects recorded
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

export default YPivotQAInspectionMissingDefectsByQC;
