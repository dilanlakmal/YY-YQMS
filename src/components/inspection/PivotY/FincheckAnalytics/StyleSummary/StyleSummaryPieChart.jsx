import React, { useState, useMemo, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { PieChart as PieIcon } from "lucide-react";

const COLORS = [
  "#6366f1", // Indigo
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Violet
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#f43f5e", // Rose
  "#64748b", // Slate
];

const FILTERS = ["All", "Minor", "Major", "Critical"];

// --- CUSTOM TOOLTIP COMPONENT ---
// This acts as the "Pop up" on mobile touch and hover on desktop
const CustomTooltip = ({ active, payload, total }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const percent = ((data.value / total) * 100).toFixed(1);

    return (
      <div className="bg-white/95 dark:bg-gray-800/95 p-3 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl backdrop-blur-sm min-w-[150px] animate-fadeIn z-50">
        {/* Defect Name */}
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wide border-b border-gray-100 dark:border-gray-700 pb-1">
          {data.name}
        </p>

        {/* Stats Row */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[10px] text-gray-400">Quantity</p>
            <p className="text-sm font-black text-gray-800 dark:text-white">
              {data.value}{" "}
              <span className="text-[10px] font-normal text-gray-400">pcs</span>
            </p>
          </div>

          <div className="text-right">
            <p className="text-[10px] text-gray-400">Share</p>
            <span className="inline-block text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 py-0.5 rounded">
              {percent}%
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

const StyleSummaryPieChart = ({ defectsList }) => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  // 1. Handle Screen Resize
  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 2. Filter and Sort Data
  const chartData = useMemo(() => {
    if (!defectsList) return [];

    const data = defectsList
      .map((d) => {
        let value = 0;
        if (activeFilter === "All") value = d.qty;
        else if (activeFilter === "Minor") value = d.minor;
        else if (activeFilter === "Major") value = d.major;
        else if (activeFilter === "Critical") value = d.critical;

        return {
          name: d.name,
          value: value,
        };
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);

    return data;
  }, [defectsList, activeFilter]);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  // 3. Dynamic Color Logic
  const getColor = (index) => {
    if (index === 0) return "#f87171"; // Red
    if (index === 1) return "#fb923c"; // Orange
    if (index === 2) return "#facc15"; // Yellow

    const greenSpectrum = [
      "#a3e635",
      "#4ade80",
      "#34d399",
      "#2dd4bf",
      "#22d3ee",
      "#38bdf8",
    ];
    const spectrumIndex = (index - 3) % greenSpectrum.length;
    return greenSpectrum[spectrumIndex];
  };

  // 4. Custom Label (Desktop Only)
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
    value,
    name,
  }) => {
    // MOBILE: No labels on chart, rely on Tooltip/Legend
    if (!isDesktop) return null;

    // DESKTOP: Limit to 15 to prevent clutter
    if (index >= 15) return null;

    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 20;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const percentVal = (percent * 100).toFixed(0);
    const textAnchor = x > cx ? "start" : "end";

    return (
      <text
        x={x}
        y={y}
        fill="#374151"
        textAnchor={textAnchor}
        dominantBaseline="central"
        style={{ fontSize: "10px", fontWeight: "600" }}
      >
        {`${name}: ${value} (${percentVal}%)`}
      </text>
    );
  };

  // Helper for button styling
  const getButtonClass = (type) => {
    const baseClass =
      "px-3 py-1 rounded-lg text-xs font-bold border transition-all";
    if (activeFilter === type) {
      switch (type) {
        case "Minor":
          return `${baseClass} bg-green-100 text-green-700 border-green-200`;
        case "Major":
          return `${baseClass} bg-orange-100 text-orange-700 border-orange-200`;
        case "Critical":
          return `${baseClass} bg-red-100 text-red-700 border-red-200`;
        default:
          return `${baseClass} bg-indigo-100 text-indigo-700 border-indigo-200`;
      }
    }
    return `${baseClass} bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-600 hover:bg-gray-50`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mt-6 animate-fadeIn h-[500px] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
            <PieIcon className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-white text-lg">
            Defect Distribution
          </h3>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={getButtonClass(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Content */}
      <div className="flex-1 w-full min-h-0 relative p-4">
        {chartData.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center text-gray-400 italic text-sm">
            No {activeFilter !== "All" ? activeFilter : ""} defects recorded
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={isDesktop ? 80 : 55}
                outerRadius={isDesktop ? 110 : 75}
                paddingAngle={2}
                dataKey="value"
                label={renderCustomLabel} // Labels Desktop Only
                labelLine={isDesktop} // Lines Desktop Only
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getColor(index)}
                    strokeWidth={1}
                    stroke="#fff"
                  />
                ))}
              </Pie>

              {/* Custom Tooltip used for Mobile Popup & Desktop Hover */}
              <Tooltip content={<CustomTooltip total={total} />} />

              <Legend
                layout="vertical"
                align="right"
                verticalAlign="middle"
                wrapperStyle={{
                  paddingRight: "10px",
                  fontSize: "11px",
                  fontWeight: "500",
                  maxHeight: "350px",
                  overflowY: "auto",
                  maxWidth: "200px",
                }}
                iconType="circle"
                iconSize={8}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default StyleSummaryPieChart;
