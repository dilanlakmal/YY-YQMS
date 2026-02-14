import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  X,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Ban,
  Hash,
} from "lucide-react";
import { API_BASE_URL } from "../../../../../../config";

const BuyerCellDetailModal = ({ isOpen, onClose, context }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && context) {
      fetchDetails();
    }
  }, [isOpen, context]);

  const fetchDetails = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-analytics/buyer-cell-details`,
        {
          params: {
            buyer: context.buyer,
            reportType: context.reportType,
            date: context.date,
          },
        },
      );
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error("Error details", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fadeIn p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900">
          <div>
            <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
              Defect Details
              <span className="text-xs font-normal text-gray-500 bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
                {context?.date}
              </span>
            </h3>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-1">
              {context?.buyer} • {context?.reportType}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-0">
          {loading ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-500" />
              <p className="text-sm">Loading details...</p>
            </div>
          ) : data ? (
            <>
              {/* Summary Stats Bar */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <div className="text-center p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-xs text-gray-500 font-bold uppercase">
                    Sample Size
                  </p>
                  <p className="text-xl font-black text-blue-600 dark:text-blue-400">
                    {data.totalSample}
                  </p>
                </div>
                <div className="text-center p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
                  <p className="text-xs text-gray-500 font-bold uppercase">
                    Total Defects
                  </p>
                  <p className="text-xl font-black text-red-600 dark:text-red-400">
                    {data.totalDefects}
                  </p>
                </div>
                <div className="text-center p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20">
                  <p className="text-xs text-gray-500 font-bold uppercase">
                    Defect Rate
                  </p>
                  <p className="text-xl font-black text-purple-600 dark:text-purple-400">
                    {data.defectRate}%
                  </p>
                </div>
              </div>

              {/* Defects List */}
              <div className="p-4">
                <div className="flex justify-between items-center mb-3 border-b border-gray-100 dark:border-gray-700 pb-2">
                  <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">
                    Defect Breakdown ({data.defects ? data.defects.length : 0}{" "}
                    types)
                  </h4>
                  <span className="text-[10px] text-gray-400 italic">
                    Sorted by highest Qty
                  </span>
                </div>

                {data.defects && data.defects.length > 0 ? (
                  <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
                    {data.defects.map((def, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors gap-3"
                      >
                        {/* Left: Name and Code */}
                        <div className="flex items-center gap-3 flex-1">
                          <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-500">
                            <Hash className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-white leading-tight">
                              {def.name}
                            </p>
                            {def.code && (
                              <span className="text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded mt-1 inline-block">
                                Code: {def.code}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Middle: Breakdown Badges */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {def.minor > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                              <CheckCircle className="w-3 h-3 text-green-600" />
                              <span className="text-xs font-bold text-green-700 dark:text-green-400">
                                Minor: {def.minor}
                              </span>
                            </div>
                          )}
                          {def.major > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
                              <AlertTriangle className="w-3 h-3 text-orange-600" />
                              <span className="text-xs font-bold text-orange-700 dark:text-orange-400">
                                Major: {def.major}
                              </span>
                            </div>
                          )}
                          {def.critical > 0 && (
                            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                              <Ban className="w-3 h-3 text-red-600" />
                              <span className="text-xs font-bold text-red-700 dark:text-red-400">
                                Critical: {def.critical}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Right: Total Qty */}
                        <div className="text-right pl-4 border-l border-gray-100 dark:border-gray-700 min-w-[70px]">
                          <span className="block text-xl font-black text-gray-800 dark:text-white leading-none">
                            {def.totalQty}
                          </span>
                          <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                            Total
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-400 italic bg-gray-50 rounded-lg">
                    No defects found for this selection.
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-gray-500">
              No data available
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyerCellDetailModal;
