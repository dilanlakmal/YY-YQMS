import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Search, Loader2, Package, AlertCircle, Filter } from "lucide-react";
import { API_BASE_URL } from "../../../../../../config";

const FincheckAnalyticsStyleTable = ({ empId }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({ reportTypes: [], rows: [] });
  const [filterTerm, setFilterTerm] = useState("");
  const [activeType, setActiveType] = useState("All");

  // Fetch data whenever empId or activeType changes
  useEffect(() => {
    if (empId) {
      fetchData();
    }
  }, [empId, activeType]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-analytics/qa-style-breakdown`,
        {
          params: {
            empId,
            reportType: activeType,
          },
        },
      );
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching style table:", error);
    } finally {
      setLoading(false);
    }
  };

  // Search Filter Logic
  const filteredRows = useMemo(() => {
    if (!filterTerm) return data.rows;
    return data.rows.filter((row) =>
      row.style.toLowerCase().includes(filterTerm.toLowerCase()),
    );
  }, [data.rows, filterTerm]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mt-6 animate-fadeIn">
      {/* 1. Header & Controls */}
      <div className="flex flex-col gap-4 p-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        {/* Title & Search Row */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-gray-800 dark:text-white text-lg">
              Defect Findings by Style
            </h3>
          </div>

          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Filter Order No..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 outline-none shadow-sm"
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Toggle Buttons Row */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-gray-500 uppercase mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filter:
          </span>

          <button
            onClick={() => setActiveType("All")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
              activeType === "All"
                ? "bg-purple-600 text-white border-purple-600 shadow-md"
                : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            All Reports
          </button>

          {data.reportTypes.map((type) => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                activeType === type
                  ? "bg-purple-600 text-white border-purple-600 shadow-md"
                  : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Table */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-2 text-purple-500" />
          <p className="text-sm">Processing Style Analytics...</p>
        </div>
      ) : (
        <div
          className="overflow-x-auto custom-scrollbar"
          style={{ maxHeight: "600px" }}
        >
          <table className="w-full text-sm border-collapse min-w-[1000px]">
            <thead className="bg-gray-100 dark:bg-gray-900 text-xs uppercase font-bold text-gray-600 dark:text-gray-300 sticky top-0 z-20 shadow-sm">
              <tr>
                {/* Fixed Columns */}
                <th className="px-4 py-3 text-left w-[180px] border-r border-gray-200 dark:border-gray-700">
                  Style / Order No
                </th>
                <th className="px-4 py-3 text-center w-[100px] border-r border-gray-200 dark:border-gray-700">
                  Total Reports
                </th>
                <th className="px-4 py-3 text-right w-[100px] border-r border-gray-200 dark:border-gray-700">
                  Total Sample
                </th>
                <th className="px-4 py-3 text-right w-[100px] border-r border-gray-200 dark:border-gray-700">
                  Total Defects
                </th>
                <th className="px-4 py-3 text-center w-[100px] border-r border-gray-200 dark:border-gray-700">
                  Defect Rate
                </th>

                {/* Scrollable Detail Column */}
                <th className="px-4 py-3 text-left">
                  Defect Details (Sorted by Qty)
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredRows.length > 0 ? (
                filteredRows.map((row) => (
                  <tr
                    key={row.style}
                    className="hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors"
                  >
                    {/* Style */}
                    <td className="px-4 py-3 font-bold text-purple-700 dark:text-purple-400 border-r border-gray-200 dark:border-gray-700">
                      {row.style}
                    </td>

                    {/* Reports */}
                    <td className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300 border-r border-gray-200 dark:border-gray-700">
                      <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-xs font-bold">
                        {row.totalReports}
                      </span>
                    </td>

                    {/* Sample */}
                    <td className="px-4 py-3 text-right font-mono text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                      {row.totalSample.toLocaleString()}
                    </td>

                    {/* Defects */}
                    <td className="px-4 py-3 text-right border-r border-gray-200 dark:border-gray-700">
                      <span
                        className={`font-bold ${row.totalDefects > 0 ? "text-red-600" : "text-gray-400"}`}
                      >
                        {row.totalDefects}
                      </span>
                    </td>

                    {/* Rate */}
                    <td className="px-4 py-3 text-center border-r border-gray-200 dark:border-gray-700">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold border ${
                          parseFloat(row.defectRate) > 0
                            ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-800"
                            : "bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:border-green-800"
                        }`}
                      >
                        {row.defectRate}%
                      </span>
                    </td>

                    {/* Defect Details Column */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        {row.defectDetails.length > 0 ? (
                          row.defectDetails.map((defect, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm"
                            >
                              <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                {defect.name}
                              </span>
                              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full">
                                {defect.qty}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">
                            No defects recorded
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    <div className="flex flex-col items-center">
                      <AlertCircle className="w-10 h-10 mb-2 opacity-50" />
                      <p>No orders found matching your search</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 flex justify-between">
        <span>
          * Showing defect breakdown for selected report type ({activeType}).
        </span>
        <span>Total Styles: {filteredRows.length}</span>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      `}</style>
    </div>
  );
};

export default FincheckAnalyticsStyleTable;
