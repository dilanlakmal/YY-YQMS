import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Loader2, Calendar, TrendingUp } from "lucide-react";
import { API_BASE_URL } from "../../../../../../config";

const DailyInspectionStyleTrendChart = ({ styleNo }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Date Range State
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (styleNo) {
      setInitialized(false);
      setData([]);
      fetchData();
    }
  }, [styleNo]);

  useEffect(() => {
    if (initialized && styleNo && dateRange.start && dateRange.end) {
      fetchData(true);
    }
  }, [dateRange.start, dateRange.end]);

  const fetchData = async (isManualFetch = false) => {
    setLoading(true);
    try {
      const params = { styleNo };
      if (isManualFetch) {
        params.startDate = dateRange.start;
        params.endDate = dateRange.end;
      }

      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-analytics/style-trend`,
        { params },
      );

      if (res.data.success) {
        setData(res.data.data);
        if (!isManualFetch && res.data.range) {
          setDateRange(res.data.range);
          setInitialized(true);
        }
      }
    } catch (error) {
      console.error("Error fetching style trend:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- CHART RENDERING LOGIC ---
  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = 350;
  const PADDING = { top: 50, right: 60, bottom: 50, left: 60 }; // Increased top padding for labels

  const processedChart = useMemo(() => {
    if (!data || data.length === 0) return null;

    const maxSample = Math.max(...data.map((d) => d.totalSample), 10);
    const maxDefect = Math.max(...data.map((d) => d.totalDefects), 5);

    const count = data.length;
    const drawableWidth = SVG_WIDTH - PADDING.left - PADDING.right;
    const drawableHeight = SVG_HEIGHT - PADDING.top - PADDING.bottom;
    const stepX = drawableWidth / count;

    return {
      items: data.map((d, i) => {
        const x = PADDING.left + i * stepX + stepX / 2;
        const barHeight = (d.totalSample / maxSample) * drawableHeight;
        const barY = SVG_HEIGHT - PADDING.bottom - barHeight;
        const lineY =
          SVG_HEIGHT -
          PADDING.bottom -
          (d.totalDefects / maxDefect) * drawableHeight;

        return {
          ...d,
          x,
          barY,
          barHeight,
          lineY,
          colWidth: stepX * 0.6,
          dateLabel: new Date(d.date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
        };
      }),
      maxSample,
      maxDefect,
    };
  }, [data]);

  const handleDateChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  if (loading && !initialized) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 mt-6">
        <Loader2 className="w-8 h-8 animate-spin mb-2 text-purple-500" />
        <p className="text-sm">Analyzing Style Trend...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mt-6 animate-fadeIn">
      {/* 1. HEADER & FILTER */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-white text-lg">
            Daily Inspection Style Trend
          </h3>
        </div>

        {/* Date Filter - Improved UI */}
        <div className="w-full md:w-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-2 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-lg">
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                Start
              </span>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateChange("start", e.target.value)}
                className="text-xs font-bold text-gray-700 dark:text-gray-200 bg-transparent outline-none cursor-pointer"
              />
            </div>
            <span className="text-gray-400 font-bold">-</span>
            <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700 px-2 py-1 rounded-lg">
              <span className="text-[10px] font-bold text-gray-400 uppercase">
                End
              </span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateChange("end", e.target.value)}
                className="text-xs font-bold text-gray-700 dark:text-gray-200 bg-transparent outline-none cursor-pointer"
              />
            </div>
            <div className="hidden sm:block text-gray-300">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. CHART AREA */}
      <div className="p-4 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 z-10 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        )}

        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-gray-400 italic text-sm border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            No inspection data found for this period.
          </div>
        ) : (
          <div
            className="relative w-full overflow-hidden"
            style={{ paddingTop: "35%" }}
          >
            <div className="absolute inset-0">
              <svg
                viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
                preserveAspectRatio="none"
                className="w-full h-full"
              >
                {/* --- Grid Lines --- */}
                <line
                  x1={PADDING.left}
                  y1={PADDING.top}
                  x2={SVG_WIDTH - PADDING.right}
                  y2={PADDING.top}
                  stroke="#e5e7eb"
                  strokeWidth="1"
                  strokeDasharray="4"
                />
                <line
                  x1={PADDING.left}
                  y1={SVG_HEIGHT - PADDING.bottom}
                  x2={SVG_WIDTH - PADDING.right}
                  y2={SVG_HEIGHT - PADDING.bottom}
                  stroke="#e5e7eb"
                  strokeWidth="2"
                />

                {/* --- Y-Axis Labels (Left: Sample) --- */}
                <text
                  x={PADDING.left - 10}
                  y={PADDING.top + 5}
                  textAnchor="end"
                  className="fill-emerald-500 text-[12px] font-bold"
                >
                  {processedChart.maxSample.toLocaleString()}
                </text>
                <text
                  x={PADDING.left - 10}
                  y={
                    (SVG_HEIGHT - PADDING.top - PADDING.bottom) / 2 +
                    PADDING.top
                  }
                  textAnchor="end"
                  className="fill-emerald-500 text-[10px] font-bold opacity-70"
                >
                  {Math.round(processedChart.maxSample / 2).toLocaleString()}
                </text>
                <text
                  x={PADDING.left - 10}
                  y={SVG_HEIGHT - PADDING.bottom}
                  textAnchor="end"
                  className="fill-emerald-500 text-[10px] font-bold"
                >
                  0
                </text>

                {/* --- Y-Axis Labels (Right: Defects) --- */}
                <text
                  x={SVG_WIDTH - PADDING.right + 10}
                  y={PADDING.top + 5}
                  textAnchor="start"
                  className="fill-red-500 text-[12px] font-bold"
                >
                  {processedChart.maxDefect}
                </text>
                <text
                  x={SVG_WIDTH - PADDING.right + 10}
                  y={
                    (SVG_HEIGHT - PADDING.top - PADDING.bottom) / 2 +
                    PADDING.top
                  }
                  textAnchor="start"
                  className="fill-red-500 text-[10px] font-bold opacity-70"
                >
                  {Math.round(processedChart.maxDefect / 2)}
                </text>
                <text
                  x={SVG_WIDTH - PADDING.right + 10}
                  y={SVG_HEIGHT - PADDING.bottom}
                  textAnchor="start"
                  className="fill-red-500 text-[10px] font-bold"
                >
                  0
                </text>

                {/* --- Chart Content --- */}
                {processedChart.items.map((d, i) => (
                  <g key={`group-${i}`}>
                    {/* 1. Bar (Sample Size) */}
                    <rect
                      x={d.x - d.colWidth / 2}
                      y={d.barY}
                      width={d.colWidth}
                      height={d.barHeight}
                      fill="#10b981"
                      opacity={hoveredIndex === i ? "0.6" : "0.3"}
                      className="transition-all duration-300"
                      rx="4"
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />

                    {/* Sample Size Label (Green) */}
                    <text
                      x={d.x}
                      y={d.barY - 8}
                      textAnchor="middle"
                      className="fill-emerald-600 dark:fill-emerald-400 font-bold text-[10px]"
                    >
                      {d.totalSample.toLocaleString()}
                    </text>

                    {/* 2. Report Count Badge (Blue Bubble) */}
                    <g
                      transform={`translate(${d.x}, ${SVG_HEIGHT - PADDING.bottom - 15})`}
                    >
                      <rect
                        x="-12"
                        y="-10"
                        width="24"
                        height="16"
                        rx="8"
                        fill="#6366f1"
                      />
                      <text
                        x="0"
                        y="2"
                        textAnchor="middle"
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        {d.reportCount}
                      </text>
                    </g>
                  </g>
                ))}

                {/* 3. Line (Defects) */}
                <polyline
                  points={processedChart.items
                    .map((d) => `${d.x},${d.lineY}`)
                    .join(" ")}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-md pointer-events-none"
                />

                {/* Points & Defect Labels */}
                {processedChart.items.map((d, i) => (
                  <g key={`point-${i}`} className="pointer-events-none">
                    <circle
                      cx={d.x}
                      cy={d.lineY}
                      r={hoveredIndex === i ? "6" : "4"}
                      fill="white"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      className="transition-all duration-300"
                    />
                    {/* Defect Qty Label (Red, large) */}
                    <text
                      x={d.x}
                      y={d.lineY - 15}
                      textAnchor="middle"
                      className="fill-red-600 font-bold text-[13px] drop-shadow-sm"
                      fontWeight="900"
                    >
                      {d.totalDefects}
                    </text>

                    {/* Date Label (X-Axis) */}
                    <text
                      x={d.x}
                      y={SVG_HEIGHT - 15}
                      textAnchor="middle"
                      className="fill-gray-500 text-[11px] font-medium"
                    >
                      {d.dateLabel}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* 3. LEGEND */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700 flex flex-wrap justify-center gap-4 sm:gap-8 text-xs font-bold">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-emerald-400/30 border border-emerald-500"></span>
          <span className="text-gray-600 dark:text-gray-300">Sample Size</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <span className="w-4 h-0.5 bg-red-500"></span>
            <span className="w-2 h-2 rounded-full border-2 border-red-500 bg-white -ml-2"></span>
          </div>
          <span className="text-gray-600 dark:text-gray-300">Defect Qty</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-5 h-3 rounded-full bg-indigo-500 flex items-center justify-center text-[8px] text-white">
            #
          </span>
          <span className="text-gray-600 dark:text-gray-300">
            Total Reports
          </span>
        </div>
      </div>
    </div>
  );
};

export default DailyInspectionStyleTrendChart;
