import React, { useState, useMemo } from "react";
import { Layers, Ruler, Hash } from "lucide-react";

const WashingSpecsDataPreview = ({ moNo, styleNo, allSpecData }) => {
  // State to track the currently active P-Value tab
  const [activeSheetIndex, setActiveSheetIndex] = useState(0);

  if (!allSpecData || allSpecData.length === 0) {
    return null;
  }

  // ---------------------------------------------------------
  // Natural Sort (Handles P1, P10, PA, PAA correctly)
  // ---------------------------------------------------------
  const sortedSheets = useMemo(() => {
    return [...allSpecData].sort((a, b) => {
      return a.sheetName.localeCompare(b.sheetName, undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });
  }, [allSpecData]);

  // Ensure active data corresponds to the sorted order
  const currentSpec = sortedSheets[activeSheetIndex];

  // Safety check if selection is out of bounds or data is empty
  if (!currentSpec || !currentSpec.rows || currentSpec.rows.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        No valid data found for this selection.
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-all duration-300">
      {/* --- Header Section --- */}
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 rounded-t-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <Ruler className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                Measurement Specs Preview
              </h2>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
                <span>
                  MO No:{" "}
                  <span className="text-indigo-600 dark:text-indigo-400">
                    {moNo}
                  </span>
                </span>
                {styleNo && (
                  <span>
                    Style:{" "}
                    <span className="text-green-600 dark:text-green-400">
                      {styleNo}
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Sheet Count Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full shadow-sm">
            <Layers className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
              {sortedSheets.length} Sheets Found
            </span>
          </div>
        </div>
      </div>

      {/* --- P-Value Tabs --- */}
      <div className="px-6 pt-6">
        <div className="flex flex-wrap gap-2">
          {sortedSheets.map((sheet, index) => (
            <button
              key={sheet.sheetName}
              onClick={() => setActiveSheetIndex(index)}
              className={`relative px-5 py-2.5 rounded-lg text-sm font-bold transition-all duration-200 border group ${
                activeSheetIndex === index
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-md scale-105 z-10"
                  : "bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{sheet.sheetName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                    activeSheetIndex === index
                      ? "bg-indigo-500 text-indigo-100"
                      : "bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 group-hover:bg-gray-200"
                  }`}
                >
                  {sheet.rows?.length || 0}
                </span>
              </div>

              {activeSheetIndex === index && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full"></span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* --- Data Table --- */}
      <div className="p-6">
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-700/80">
              {/* Header Row 1: Metadata & Sizes */}
              <tr>
                <th
                  rowSpan="2"
                  className="px-3 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 sticky left-0 z-20 w-12"
                >
                  <Hash className="w-4 h-4 mx-auto" />
                </th>
                <th
                  rowSpan="2"
                  className="px-4 py-3 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 min-w-[180px]"
                >
                  Measurement Point (Chi)
                </th>
                <th
                  rowSpan="2"
                  className="px-2 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 w-16"
                >
                  Tol (-)
                </th>
                <th
                  rowSpan="2"
                  className="px-2 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 w-16"
                >
                  Tol (+)
                </th>
                {currentSpec.headers.map((header) => (
                  <th
                    key={header.size}
                    colSpan="2"
                    className="px-4 py-2 text-center text-sm font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 border-b border-gray-200 dark:border-gray-600 bg-indigo-50 dark:bg-indigo-900/30"
                  >
                    {header.size}
                  </th>
                ))}
              </tr>
              {/* Header Row 2: A/W & B/W Labels */}
              <tr>
                {currentSpec.headers.map((header) => (
                  <React.Fragment key={`${header.size}-specs`}>
                    <th className="px-2 py-2 text-center text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                      A/W
                    </th>
                    <th className="px-2 py-2 text-center text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider border-r border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                      B/W
                    </th>
                  </React.Fragment>
                ))}
              </tr>
            </thead>

            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {currentSpec.rows.map((row, index) => (
                <tr
                  key={index}
                  className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors group"
                >
                  {/* Seq Number */}
                  <td className="px-3 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 sticky left-0 bg-white dark:bg-gray-800 group-hover:bg-indigo-50/50 dark:group-hover:bg-indigo-900/10 z-10">
                    {row.seq}
                  </td>
                  {/* Measurement Point */}
                  <td className="px-4 py-3 text-xs font-medium text-gray-800 dark:text-gray-200 border-r border-gray-200 dark:border-gray-700">
                    {row["Measurement Point - Chi"]}
                  </td>
                  {/* Tolerances */}
                  <td className="px-2 py-3 text-center text-xs font-bold text-red-600 dark:text-red-400 border-r border-gray-200 dark:border-gray-700 bg-red-50/30 dark:bg-red-900/10">
                    {row["Tol Minus"].raw || "-"}
                  </td>
                  <td className="px-2 py-3 text-center text-xs font-bold text-green-600 dark:text-green-400 border-r border-gray-200 dark:border-gray-700 bg-green-50/30 dark:bg-green-900/10">
                    {row["Tol Plus"].raw || "-"}
                  </td>
                  {/* Size Specs */}
                  {currentSpec.headers.map((header) => (
                    <React.Fragment key={`${header.size}-${index}`}>
                      <td className="px-2 py-3 text-center text-xs font-medium text-gray-900 dark:text-gray-100 border-r border-gray-200 dark:border-gray-700">
                        {row.specs[header.size]?.["After Washing"]?.raw || "-"}
                      </td>
                      <td className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                        {row.specs[header.size]?.["Before Washing"]?.raw || "-"}
                      </td>
                    </React.Fragment>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default WashingSpecsDataPreview;
