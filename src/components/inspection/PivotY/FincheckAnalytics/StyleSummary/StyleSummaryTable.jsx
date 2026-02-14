import React from "react";
import { LayoutList } from "lucide-react";

const StyleSummaryTable = ({ reportsByType, defectsList }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-fadeIn">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center gap-2">
        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
          <LayoutList className="w-5 h-5" />
        </div>
        <h3 className="font-bold text-gray-800 dark:text-white text-lg">
          Style Summary by Inspection Report
        </h3>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        <table className="w-full text-sm border-collapse min-w-[800px]">
          <thead className="bg-gray-100 dark:bg-gray-900 text-xs uppercase font-bold text-gray-600 dark:text-gray-300">
            <tr>
              <th className="px-4 py-3 text-left w-[20%] border-r border-gray-200 dark:border-gray-700">
                Report Type
              </th>
              <th className="px-4 py-3 text-center w-[10%] border-r border-gray-200 dark:border-gray-700">
                Reports
              </th>
              <th className="px-4 py-3 text-right w-[10%] border-r border-gray-200 dark:border-gray-700">
                Sample
              </th>
              <th className="px-4 py-3 text-center w-[20%] border-r border-gray-200 dark:border-gray-700">
                Total Defects
              </th>
              <th className="px-4 py-3 text-left w-[40%]">
                Defect Details (Sorted by Qty)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {reportsByType.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50 dark:hover:bg-gray-900/20 transition-colors"
              >
                <td className="px-4 py-3 font-bold text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700">
                  {row.type}
                </td>
                <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                  {row.count}
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-600 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700">
                  {row.sample.toLocaleString()}
                </td>

                {/* Total Defects with Breakdown */}
                <td className="px-4 py-3 border-r border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col gap-1 items-center">
                    <span className="text-lg font-black text-gray-800 dark:text-white">
                      {row.defects}
                    </span>
                    <div className="flex gap-1">
                      {row.minor > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-green-100 text-green-700 text-[9px] font-bold">
                          MI:{row.minor}
                        </span>
                      )}
                      {row.major > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-[9px] font-bold">
                          MA:{row.major}
                        </span>
                      )}
                      {row.critical > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[9px] font-bold">
                          CR:{row.critical}
                        </span>
                      )}
                    </div>
                  </div>
                </td>

                {/* Defect Details Column */}
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    {row.topDefects && row.topDefects.length > 0 ? (
                      row.topDefects.map((defect, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-sm"
                        >
                          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                            {defect.name}
                          </span>
                          {/* Breakdown Labels in Table */}
                          {defect.minor > 0 && (
                            <span className="text-[8px] bg-green-50 text-green-700 px-1 rounded border border-green-100 font-bold">
                              MI:{defect.minor}
                            </span>
                          )}
                          {defect.major > 0 && (
                            <span className="text-[8px] bg-orange-50 text-orange-700 px-1 rounded border border-orange-100 font-bold">
                              MA:{defect.major}
                            </span>
                          )}
                          {defect.critical > 0 && (
                            <span className="text-[8px] bg-red-50 text-red-700 px-1 rounded border border-red-100 font-bold">
                              CR:{defect.critical}
                            </span>
                          )}

                          <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 rounded-full ml-1">
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
            ))}
          </tbody>
        </table>
      </div>

      {/* 2nd Table: Detailed Global Defect List (Horizontal) */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">
          All Defect Details
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {defectsList.map((d, i) => (
            <div
              key={i}
              className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
            >
              <div className="flex flex-wrap items-center gap-1.5 min-w-0 pr-2">
                <span
                  className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate"
                  title={d.name}
                >
                  {d.name}
                </span>

                {/* Breakdown Labels */}
                {d.minor > 0 && (
                  <span className="text-[9px] font-bold text-green-700 bg-green-100 border border-green-200 px-1.5 rounded">
                    MI:{d.minor}
                  </span>
                )}
                {d.major > 0 && (
                  <span className="text-[9px] font-bold text-orange-700 bg-orange-100 border border-orange-200 px-1.5 rounded">
                    MA:{d.major}
                  </span>
                )}
                {d.critical > 0 && (
                  <span className="text-[9px] font-bold text-red-700 bg-red-100 border border-red-200 px-1.5 rounded">
                    CR:{d.critical}
                  </span>
                )}
              </div>

              {/* Total Qty Circle */}
              <div className="flex shrink-0">
                <span className="flex items-center justify-center w-6 h-6 text-[10px] font-bold bg-red-500 text-white rounded-full shadow-sm">
                  {d.qty}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StyleSummaryTable;
