import React from "react";
import { Truck, Package } from "lucide-react";

const OrderShippingStageBreakdownTable = ({ shippingData, orderNos }) => {
  if (!shippingData || !shippingData.rows || shippingData.rows.length === 0) {
    return null;
  }

  const { seqColumns, rows, columnTotals, grandTotal } = shippingData;

  return (
    <div className="space-y-2 mt-4">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-orange-500" />
          <h3 className="font-bold text-sm text-gray-800 dark:text-white">
            Order Qty Breakdown in Shipping Stage
          </h3>
        </div>
        {orderNos && (
          <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
            Consolidated: {orderNos.join(", ")}
          </span>
        )}
      </div>

      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
              {/* Color Column */}
              <th className="px-3 py-2 text-left font-bold text-[10px] uppercase tracking-wide sticky left-0 bg-orange-600 z-10 min-w-[120px]">
                Color
              </th>

              {/* Sequence Columns */}
              {seqColumns.map((seq) => (
                <th
                  key={seq}
                  className="px-2 py-2 text-center font-bold text-[10px] uppercase tracking-wide min-w-[60px]"
                >
                  D{seq}
                </th>
              ))}

              {/* Total Column */}
              <th className="px-3 py-2 text-center font-bold text-[10px] uppercase tracking-wide bg-orange-700 min-w-[80px]">
                Total
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row, index) => (
              <tr
                key={row.color}
                className={`border-b border-gray-100 dark:border-gray-700 ${
                  index % 2 === 0
                    ? "bg-white dark:bg-gray-800"
                    : "bg-gray-50 dark:bg-gray-800/50"
                } hover:bg-orange-50 dark:hover:bg-orange-900/20`}
              >
                {/* Color Name */}
                <td className="px-3 py-1.5 font-semibold text-gray-800 dark:text-gray-200 sticky left-0 bg-inherit z-10 border-r border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    {/* Placeholder dot since we don't have hex codes here, or use generic gray */}
                    <div className="w-2.5 h-2.5 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-300" />
                    <span className="text-[11px] whitespace-nowrap">
                      {row.color}
                    </span>
                  </div>
                </td>

                {/* Seq Values */}
                {seqColumns.map((seq) => (
                  <td
                    key={seq}
                    className={`px-2 py-1.5 text-center text-[11px] font-medium border-r border-gray-100 dark:border-gray-700 last:border-0 ${
                      row.seqValues[seq] > 0
                        ? "text-gray-800 dark:text-gray-200"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  >
                    {row.seqValues[seq]
                      ? row.seqValues[seq].toLocaleString()
                      : "-"}
                  </td>
                ))}

                {/* Row Total */}
                <td className="px-3 py-1.5 text-center text-[11px] font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30">
                  {row.rowTotal.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
              <td className="px-3 py-2 text-[10px] text-gray-800 dark:text-gray-200 sticky left-0 bg-gray-200 dark:bg-gray-600 z-10 uppercase">
                Total
              </td>

              {/* Column Totals */}
              {seqColumns.map((seq) => (
                <td
                  key={seq}
                  className="px-2 py-2 text-center text-[10px] text-gray-800 dark:text-gray-200"
                >
                  {columnTotals[seq]?.toLocaleString() || "-"}
                </td>
              ))}

              {/* Grand Total */}
              <td className="px-3 py-2 text-center text-[11px] text-white bg-orange-600">
                {grandTotal.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default OrderShippingStageBreakdownTable;
