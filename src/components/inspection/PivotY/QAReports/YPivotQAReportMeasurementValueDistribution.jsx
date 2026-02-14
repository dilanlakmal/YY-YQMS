import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Loader2,
  Calculator,
  TrendingUp,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

const YPivotQAReportMeasurementValueDistribution = ({ reportId }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!reportId) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}/measurement-point-calc`,
        );
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load value distribution:", err);
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [reportId]);

  // Helper to format Tol- value
  const formatTolMinus = (tolValue) => {
    if (!tolValue || tolValue === "-" || tolValue === "0" || tolValue === 0)
      return tolValue;
    let strVal = String(tolValue).trim();
    if (strVal.startsWith("-")) return strVal;
    return `-${strVal}`;
  };

  const getPassRateColor = (passRate) => {
    const rate = parseFloat(passRate);
    if (rate >= 95) return "text-green-600";
    if (rate >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  // --- NEW: Check if a bucket value is outside spec tolerance ---
  const isOutOfTolerance = (spec, bucket) => {
    // If we don't have decimal limits, assume pass
    if (spec.tolMinusDecimal === undefined || spec.tolPlusDecimal === undefined)
      return false;

    const val = bucket.decimal;
    const min = spec.tolMinusDecimal;
    const max = spec.tolPlusDecimal;
    const epsilon = 0.0001;

    // Logic: lowerLimit <= value <= upperLimit
    // So Fail if: value < lower - eps OR value > upper + eps
    return val < min - epsilon || val > max + epsilon;
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
      </div>
    );
  }

  if (error || !data || data.specs.length === 0) {
    return null;
  }

  const { specs, sizeList, valueBuckets, grandTotals } = data;

  // Calculate sub-column count: Points + Pass + Fail + Neg + Pos + Buckets
  const subColCount = 5 + valueBuckets.length;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mt-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 px-4 py-3 flex justify-between items-center">
        <h2 className="text-white font-bold text-sm flex items-center gap-2">
          <Calculator className="w-4 h-4" /> Measurement Value Distribution
        </h2>

        {/* Mini Stats in Header */}
        <div className="flex gap-4 text-white/90 text-xs">
          <div className="flex items-center gap-1">
            <span className="font-medium opacity-75">Points:</span>
            <span className="font-bold bg-white/20 px-1.5 rounded">
              {grandTotals.points}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium opacity-75">Rate:</span>
            <span
              className={`font-bold bg-white/20 px-1.5 rounded ${parseFloat(grandTotals.passRate) < 95 ? "text-red-100" : "text-green-100"}`}
            >
              {grandTotals.passRate}%
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700">
              <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                Σ
              </span>
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">
                Total Points
              </p>
              <p className="text-sm font-black text-gray-800 dark:text-white">
                {grandTotals.points}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">
                Pass
              </p>
              <p className="text-sm font-black text-green-600">
                {grandTotals.pass}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30">
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">
                Fail
              </p>
              <p className="text-sm font-black text-red-600">
                {grandTotals.fail}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] text-gray-500 uppercase font-bold">
                Pass Rate
              </p>
              <p
                className={`text-sm font-black ${getPassRateColor(grandTotals.passRate)}`}
              >
                {grandTotals.passRate}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="text-xs border-collapse w-full">
          <thead>
            {/* Top Row: Sizes */}
            <tr className="bg-gray-100 dark:bg-gray-700">
              <th className="sticky left-0 z-20 bg-gray-100 dark:bg-gray-700 px-3 py-3 text-left font-bold text-gray-700 dark:text-gray-300 w-[200px] min-w-[200px] border-b border-r border-gray-200 dark:border-gray-600">
                Measurement Point
              </th>
              <th className="px-2 py-3 text-center font-bold text-red-600 w-[50px] min-w-[50px] border-b border-gray-200 dark:border-gray-600 bg-red-50 dark:bg-red-900/20">
                Tol -
              </th>
              <th className="px-2 py-3 text-center font-bold text-green-600 w-[50px] min-w-[50px] border-b border-gray-200 dark:border-gray-600 bg-green-50 dark:bg-green-900/20">
                Tol +
              </th>

              {/* All Sizes Header */}
              <th
                colSpan={subColCount}
                className="px-2 py-3 text-center font-bold text-purple-700 dark:text-purple-400 border-l-2 border-b border-purple-300 dark:border-purple-700 bg-purple-100 dark:bg-purple-900/30"
              >
                All Sizes
              </th>

              {/* Individual Size Headers */}
              {sizeList.map((size) => (
                <th
                  key={size}
                  colSpan={subColCount}
                  className="px-2 py-3 text-center font-bold text-indigo-700 dark:text-indigo-400 border-l-2 border-b border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20"
                >
                  {size}
                </th>
              ))}
            </tr>

            {/* Sub-header Row: Categories + Buckets */}
            <tr className="bg-gray-50 dark:bg-gray-750">
              <th className="sticky left-0 z-20 bg-gray-50 dark:bg-gray-750 border-b border-r border-gray-200 dark:border-gray-600"></th>
              <th className="border-b border-gray-200 dark:border-gray-600"></th>
              <th className="border-b border-gray-200 dark:border-gray-600"></th>

              {/* Function to render Sub-headers for a group */}
              {[
                {
                  key: "all",
                  bg: "bg-purple-50 dark:bg-purple-900/20",
                  border: "border-purple-300 dark:border-purple-700",
                },
                ...sizeList.map((s) => ({
                  key: s,
                  bg: "bg-gray-100 dark:bg-gray-700",
                  border: "border-indigo-200 dark:border-indigo-800",
                })),
              ].map((group, idx) => (
                <React.Fragment key={group.key}>
                  <th
                    className={`px-1 py-2 text-center font-semibold text-gray-600 dark:text-gray-400 border-l-2 border-b ${group.border} ${group.bg} min-w-[35px] text-[10px]`}
                  >
                    Pts
                  </th>
                  <th className="px-1 py-2 text-center font-semibold text-green-700 dark:text-green-400 border-b border-gray-200 dark:border-gray-600 bg-green-100 dark:bg-green-900/30 min-w-[35px] text-[10px]">
                    Pass
                  </th>
                  <th className="px-1 py-2 text-center font-semibold text-red-700 dark:text-red-400 border-b border-gray-200 dark:border-gray-600 bg-red-100 dark:bg-red-900/30 min-w-[35px] text-[10px]">
                    Fail
                  </th>
                  <th className="px-1 py-2 text-center font-semibold text-orange-700 dark:text-orange-400 border-b border-gray-200 dark:border-gray-600 bg-orange-100 dark:bg-orange-900/30 min-w-[35px] text-[9px]">
                    Neg.Tol
                  </th>
                  <th className="px-1 py-2 text-center font-semibold text-red-700 dark:text-red-400 border-b border-gray-200 dark:border-gray-600 bg-red-100 dark:bg-red-900/30 min-w-[35px] text-[9px]">
                    Pos.Tol
                  </th>

                  {/* Buckets */}
                  {valueBuckets.map((bucket) => (
                    <th
                      key={`${group.key}-${bucket.key}`}
                      className="px-1 py-2 text-center text-[9px] text-gray-500 font-medium border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 min-w-[30px]"
                    >
                      {bucket.label}
                    </th>
                  ))}
                </React.Fragment>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {specs.map((spec, idx) => {
              const isCritical = spec.isCritical;
              const baseRowBg = isCritical
                ? "bg-blue-50 dark:bg-blue-900/20"
                : idx % 2 === 0
                  ? "bg-white dark:bg-gray-800"
                  : "bg-gray-50/50 dark:bg-gray-800/50";

              return (
                <tr
                  key={spec.measurementPointName}
                  className={`${baseRowBg} hover:bg-gray-50 dark:hover:bg-gray-700/30`}
                >
                  {/* Point Name */}
                  <td
                    className={`sticky left-0 z-10 px-3 py-2 font-medium text-gray-800 dark:text-gray-200 border-r border-gray-100 dark:border-gray-700 ${isCritical ? "bg-blue-100 dark:bg-blue-900/30" : "bg-inherit"}`}
                  >
                    <div className="flex items-center gap-1.5">
                      {isCritical && (
                        <span className="text-blue-600 font-bold">★</span>
                      )}
                      <span className="line-clamp-2">
                        {spec.measurementPointName}
                      </span>
                    </div>
                  </td>

                  <td className="px-2 py-2 text-center font-bold text-red-600 bg-red-50/50 dark:bg-red-900/10 text-[10px]">
                    {formatTolMinus(spec.tolMinus)}
                  </td>
                  <td className="px-2 py-2 text-center font-bold text-green-600 bg-green-50/50 dark:bg-green-900/10 text-[10px]">
                    {spec.tolPlus}
                  </td>

                  {/* All Sizes Data */}
                  <td className="px-1 py-2 text-center font-medium text-gray-700 dark:text-gray-300 border-l-2 border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/20">
                    {spec.allSizeTotals.points || "-"}
                  </td>
                  <td className="px-1 py-2 text-center font-bold text-green-600 bg-green-50 dark:bg-green-900/20">
                    {spec.allSizeTotals.pass || "-"}
                  </td>
                  <td className="px-1 py-2 text-center font-bold text-red-600 bg-red-50 dark:bg-red-900/20">
                    {spec.allSizeTotals.fail || "-"}
                  </td>
                  <td className="px-1 py-2 text-center font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20">
                    {spec.allSizeTotals.negTol || "-"}
                  </td>
                  <td className="px-1 py-2 text-center font-bold text-red-600 bg-red-50 dark:bg-red-900/20">
                    {spec.allSizeTotals.posTol || "-"}
                  </td>

                  {/* All Sizes Buckets */}
                  {valueBuckets.map((bucket) => {
                    const count = spec.allSizeTotals.buckets?.[bucket.key] || 0;
                    const outOfTol = isOutOfTolerance(spec, bucket);

                    // --- COLOR LOGIC ---
                    let cellClass = "text-gray-300"; // Default empty
                    if (count > 0) {
                      if (outOfTol) {
                        cellClass =
                          "font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40";
                      } else {
                        cellClass =
                          "font-bold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40";
                      }
                    }

                    return (
                      <td
                        key={`all-${bucket.key}`}
                        className={`px-1 py-2 text-center text-[10px] ${cellClass}`}
                      >
                        {count || "-"}
                      </td>
                    );
                  })}

                  {/* Individual Sizes Data */}
                  {sizeList.map((size) => {
                    const sizeData = spec.sizeData[size] || {};
                    return (
                      <React.Fragment
                        key={`${spec.measurementPointName}-${size}`}
                      >
                        <td className="px-1 py-2 text-center font-medium text-gray-700 dark:text-gray-300 border-l-2 border-indigo-100 dark:border-indigo-900 bg-gray-50/50 dark:bg-gray-700/30">
                          {sizeData.points || "-"}
                        </td>
                        <td className="px-1 py-2 text-center font-bold text-green-600 bg-green-50 dark:bg-green-900/20">
                          {sizeData.pass || "-"}
                        </td>
                        <td className="px-1 py-2 text-center font-bold text-red-600 bg-red-50 dark:bg-red-900/20">
                          {sizeData.fail || "-"}
                        </td>
                        <td className="px-1 py-2 text-center font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20">
                          {sizeData.negTol || "-"}
                        </td>
                        <td className="px-1 py-2 text-center font-bold text-red-600 bg-red-50 dark:bg-red-900/20">
                          {sizeData.posTol || "-"}
                        </td>

                        {/* Size Buckets */}
                        {valueBuckets.map((bucket) => {
                          const count = sizeData.buckets?.[bucket.key] || 0;
                          const outOfTol = isOutOfTolerance(spec, bucket);

                          // --- COLOR LOGIC ---
                          let cellClass = "text-gray-300";
                          if (count > 0) {
                            if (outOfTol) {
                              cellClass =
                                "font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40";
                            } else {
                              cellClass =
                                "font-bold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/40";
                            }
                          }

                          return (
                            <td
                              key={`${size}-${bucket.key}`}
                              className={`px-1 py-2 text-center text-[10px] ${cellClass}`}
                            >
                              {count || "-"}
                            </td>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="p-2 bg-gray-50 dark:bg-gray-800 text-[10px] text-gray-400 text-center border-t border-gray-200 dark:border-gray-700">
        Showing comprehensive measurement value distribution aggregated across
        all configurations
      </div>
    </div>
  );
};

export default YPivotQAReportMeasurementValueDistribution;
