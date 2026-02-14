import React, { useState } from "react";
import { BarChart3, TrendingUp, Layers, Percent } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const BuyerSummaryChart = ({
  data,
  dates,
  selectedBuyers,
  availableBuyers,
  dynamicTitle,
}) => {
  const [metric, setMetric] = useState("qty"); // 'qty', 'sample', 'rate'

  const toggles = [
    { id: "qty", label: "Defect Qty", icon: BarChart3 },
    { id: "sample", label: "Sample Size", icon: Layers },
    { id: "rate", label: "Defect Rate", icon: Percent },
  ];

  const colors = [
    "#8884d8",
    "#82ca9d",
    "#ffc658",
    "#ff7300",
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
  ];

  // --- Process Data to include totals for Tooltip calculation ---
  const processedChartData = dates.map((date) => {
    const entry = { date };

    // Totals for this specific date (across all buyers)
    let dailyTotalDefects = 0;
    let dailyTotalSample = 0;

    data.forEach((buyer) => {
      const buyerName = buyer._id;
      const reports = buyer.reportTypes.filter((rt) => rt.date === date);

      const sumDefects = reports.reduce((acc, curr) => acc + curr.defects, 0);
      const sumSample = reports.reduce((acc, curr) => acc + curr.sample, 0);

      dailyTotalDefects += sumDefects;
      dailyTotalSample += sumSample;

      // Calculate value for the BAR based on metric
      let barValue = 0;
      if (metric === "qty") barValue = sumDefects;
      else if (metric === "sample") barValue = sumSample;
      else if (metric === "rate")
        barValue =
          sumSample > 0
            ? parseFloat(((sumDefects / sumSample) * 100).toFixed(2))
            : 0;

      if (barValue > 0) {
        entry[buyerName] = barValue;
      }
    });

    // Attach hidden totals to the data entry for the Tooltip to use
    entry._dailyTotalDefects = dailyTotalDefects;
    entry._dailyTotalSample = dailyTotalSample;

    return entry;
  });

  // --- Fixed Tooltip ---
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Access the full data object for this date
      const dataEntry = payload[0].payload;
      const totalDefects = dataEntry._dailyTotalDefects || 0;
      const totalSample = dataEntry._dailyTotalSample || 0;

      // Calculate Total Rate
      const totalRate =
        totalSample > 0
          ? ((totalDefects / totalSample) * 100).toFixed(2)
          : "0.00";

      // Calculate displayed total (sum of bars)
      const displayedTotal = payload.reduce(
        (sum, entry) => sum + (entry.value || 0),
        0,
      );

      return (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 min-w-[220px] z-50">
          <p className="text-xs font-bold text-gray-500 uppercase mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">
            {label}
          </p>

          <div className="space-y-1 mb-2">
            {payload.map((entry, index) => (
              <div
                key={index}
                className="flex justify-between items-center text-xs"
              >
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  ></div>
                  <span className="text-gray-600 dark:text-gray-300 font-medium">
                    {entry.name}
                  </span>
                </div>
                <span className="font-bold text-gray-800 dark:text-white">
                  {metric === "rate" ? `${entry.value}%` : entry.value}
                </span>
              </div>
            ))}
          </div>

          {/* Horizontal Line & Total Section */}
          <div className="pt-2 border-t border-gray-300 dark:border-gray-600">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-black text-gray-800 dark:text-white uppercase">
                Total {metric === "rate" ? "Rate" : "Value"}
              </span>
              <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                {metric === "rate" ? `${totalRate}%` : displayedTotal}
              </span>
            </div>
            {/* Extra Context */}
            <div className="flex justify-between text-[10px] text-gray-400">
              <span>Defects: {totalDefects}</span>
              <span>Sample: {totalSample}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const buyersToShow =
    selectedBuyers.length > 0 ? selectedBuyers : availableBuyers.slice(0, 10);

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
        {/* Title Area */}
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-lg text-gray-800 dark:text-white">
            Trend Analysis
          </h3>
          <span className="text-xs text-gray-400 hidden sm:inline-block border border-gray-200 dark:border-gray-700 px-2 py-1 rounded-md ml-2">
            {dynamicTitle}
          </span>
        </div>

        {/* Metric Toggles */}
        <div className="flex bg-gray-100 dark:bg-gray-900 p-1 rounded-lg">
          {toggles.map((t) => (
            <button
              key={t.id}
              onClick={() => setMetric(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                metric === t.id
                  ? "bg-white dark:bg-gray-800 text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={processedChartData}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e5e7eb"
              vertical={false}
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 11 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 11 }}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ fill: "rgba(99, 102, 241, 0.05)" }}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }}
            />
            {buyersToShow.map((buyer, idx) => (
              <Bar
                key={buyer}
                dataKey={buyer}
                stackId="a"
                fill={colors[idx % colors.length]}
                radius={[0, 0, 0, 0]}
                animationDuration={800}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BuyerSummaryChart;
