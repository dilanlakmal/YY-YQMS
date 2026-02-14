import React from "react";
import { Info, BarChart3 } from "lucide-react";

const BuyerSummaryTable = ({ data, dates, loading, onCellClick }) => {
  const getCellColor = (rate) => {
    const num = parseFloat(rate);
    if (isNaN(num) || num === 0) return "bg-gray-50 text-gray-400";
    if (num <= 5) return "bg-green-100 text-green-700 border-green-200";
    if (num <= 10) return "bg-orange-100 text-orange-700 border-orange-200";
    return "bg-red-100 text-red-700 border-red-200";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      {/* Card Title */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/30 rounded text-indigo-600">
            <BarChart3 className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-white">
            Defect Trend Analysis
          </h3>
        </div>
      </div>

      {/* Table Container - Essential for sticky headers */}
      <div className="overflow-x-auto custom-scrollbar max-h-[600px]">
        <table className="min-w-full text-sm text-left border-collapse">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30">
            <tr>
              {/* Fixed Header 1: Buyer Name */}
              <th className="sticky left-0 z-40 bg-gray-50 dark:bg-gray-900 px-4 py-3 min-w-[150px] font-bold shadow-[1px_0_0_0_rgba(0,0,0,0.05)]">
                Buyer Name
              </th>
              {/* Fixed Header 2: Report Type */}
              <th className="sticky left-[150px] z-40 bg-gray-50 dark:bg-gray-900 px-4 py-3 min-w-[150px] font-bold border-r border-gray-200 dark:border-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                Report Type
              </th>
              {/* Date Headers */}
              {dates.map((date) => (
                <th
                  key={date}
                  className="px-2 py-3 min-w-[120px] text-center font-bold bg-gray-50 dark:bg-gray-900"
                >
                  {date.split("-").slice(1).join("/")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td
                  colSpan={dates.length + 2}
                  className="p-12 text-center text-gray-400"
                >
                  Loading data...
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={dates.length + 2}
                  className="p-12 text-center text-gray-400"
                >
                  No data matching filters.
                </td>
              </tr>
            ) : (
              data.map((buyerGroup) => (
                <React.Fragment key={buyerGroup.buyer}>
                  {buyerGroup.rows.map((row, rIdx) => {
                    const isLastRow = rIdx === buyerGroup.rows.length - 1;
                    const rowKey = `${buyerGroup.buyer}-${row.type}`;

                    return (
                      <tr
                        key={rowKey}
                        className={
                          isLastRow
                            ? "bg-gray-50/80 font-bold border-b-2 border-gray-200"
                            : "hover:bg-gray-50/30"
                        }
                      >
                        {/* Sticky Body 1: Buyer Name (Merged) */}
                        {rIdx === 0 && (
                          <td
                            rowSpan={buyerGroup.rows.length}
                            className="sticky left-0 z-20 bg-white dark:bg-gray-800 px-4 py-3 font-bold text-gray-900 dark:text-white align-top border-r border-gray-100 dark:border-gray-700 shadow-[1px_0_0_0_rgba(0,0,0,0.05)]"
                          >
                            {buyerGroup.buyer}
                          </td>
                        )}

                        {/* Sticky Body 2: Report Type */}
                        <td
                          className={`sticky left-[150px] z-20 ${isLastRow ? "bg-gray-50 dark:bg-gray-800" : "bg-white dark:bg-gray-800"} px-4 py-3 border-r border-gray-100 dark:border-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] ${isLastRow ? "text-indigo-600" : "text-gray-600"}`}
                        >
                          {row.type}
                        </td>

                        {/* Data Cells */}
                        {dates.map((date) => {
                          const cellData = row.data[date];
                          const sample = cellData ? cellData.sample : 0;
                          const defects = cellData ? cellData.defects : 0;
                          const rate =
                            sample > 0
                              ? ((defects / sample) * 100).toFixed(2)
                              : "0.00";
                          const hasData = sample > 0;
                          const colorClass = hasData ? getCellColor(rate) : "";

                          return (
                            <td
                              key={date}
                              className="p-1 text-center align-middle border-r border-gray-50 dark:border-gray-800 last:border-0"
                            >
                              {hasData ? (
                                <div
                                  className={`relative group rounded-lg py-1.5 px-1 border ${colorClass} flex flex-col items-center justify-center min-h-[50px]`}
                                >
                                  <span className="text-sm font-black tracking-tight">
                                    {rate}%
                                  </span>
                                  <div className="flex items-center gap-1.5 text-[10px] opacity-80 mt-0.5 font-mono">
                                    <span className="font-bold">{sample}</span>
                                    <span className="opacity-50">|</span>
                                    <span
                                      className={
                                        defects > 0
                                          ? "text-red-700 font-black"
                                          : "text-green-800"
                                      }
                                    >
                                      {defects}
                                    </span>
                                  </div>

                                  {/* Info Button */}
                                  <button
                                    onClick={() =>
                                      onCellClick(
                                        buyerGroup.buyer,
                                        row.type,
                                        date,
                                      )
                                    }
                                    className="absolute -top-1.5 -right-1.5 bg-white dark:bg-gray-700 text-indigo-500 shadow-md p-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-10"
                                    title="View Details"
                                  >
                                    <Info className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="min-h-[50px] flex items-center justify-center">
                                  <span className="text-gray-300">-</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BuyerSummaryTable;
