import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Loader2, Calendar, TrendingUp } from "lucide-react";
import { API_BASE_URL } from "../../../../../../config";

const FincheckAnalyticsTrendChart = ({ empId }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Default: Today and 7 days ago
  const [dateRange, setDateRange] = useState({
    start: "",
    end: "",
  });

  // Calculate default last 7 working days
  useEffect(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);

    const formatDate = (d) => d.toISOString().split("T")[0];

    setDateRange({
      start: formatDate(start),
      end: formatDate(end),
    });
  }, []);

  useEffect(() => {
    if (empId && dateRange.start && dateRange.end) {
      fetchData();
    }
  }, [empId, dateRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-analytics/qa-trend`,
        {
          params: {
            empId,
            startDate: dateRange.start,
            endDate: dateRange.end,
          },
        },
      );
      if (res.data.success) {
        // Filter out Sundays
        const filteredData = res.data.data.filter((item) => {
          const day = new Date(item.date).getDay();
          return day !== 0; // 0 is Sunday
        });
        setData(filteredData);
      }
    } catch (error) {
      console.error("Error fetching trend data:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- CHART RENDERING LOGIC ---
  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = 350;
  const PADDING = { top: 40, right: 60, bottom: 50, left: 60 };

  const processedChart = useMemo(() => {
    if (!data || data.length === 0) return null;

    // 1. Determine Scales
    // Left Axis (Bars - Sample Size)
    const maxSample = Math.max(...data.map((d) => d.totalSample), 10);
    // Right Axis (Line - Defect Qty)
    const maxDefect = Math.max(...data.map((d) => d.totalDefects), 5);

    // 2. Calculate Coordinates
    const count = data.length;
    // We distribute points evenly within the drawable width
    const drawableWidth = SVG_WIDTH - PADDING.left - PADDING.right;
    const drawableHeight = SVG_HEIGHT - PADDING.top - PADDING.bottom;

    const stepX = drawableWidth / count;

    return {
      items: data.map((d, i) => {
        const x = PADDING.left + i * stepX + stepX / 2; // Center of column

        // Bar Height (Sample Size)
        // Note: SVG Y coordinates start from top. 0 is top.
        const barHeight = (d.totalSample / maxSample) * drawableHeight;
        const barY = SVG_HEIGHT - PADDING.bottom - barHeight;

        // Line Point (Defects)
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
          colWidth: stepX * 0.6, // Bars occupy 60% of the slot
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

  // Handle Date Inputs
  const handleDateChange = (field, value) => {
    setDateRange((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 mt-6">
        <Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-500" />
        <p className="text-sm">Loading Trend Data...</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mt-6 animate-fadeIn">
      {/* 1. HEADER & FILTER */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        {/* Title */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
            <TrendingUp className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-white text-lg">
            Daily Inspection Trend
          </h3>
        </div>

        {/* Date Filter - Responsive Grid */}
        <div className="w-full md:w-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl p-1.5 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center justify-center pl-2 text-gray-400">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              <div className="relative">
                <label className="text-[9px] font-bold text-gray-400 absolute top-0.5 left-1">
                  START
                </label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => handleDateChange("start", e.target.value)}
                  className="w-full pt-3 pb-0.5 px-1 text-xs font-bold text-gray-700 dark:text-gray-200 bg-transparent outline-none border-b border-transparent focus:border-indigo-500"
                />
              </div>
              <div className="relative">
                <label className="text-[9px] font-bold text-gray-400 absolute top-0.5 left-1">
                  END
                </label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => handleDateChange("end", e.target.value)}
                  className="w-full pt-3 pb-0.5 px-1 text-xs font-bold text-gray-700 dark:text-gray-200 bg-transparent outline-none border-b border-transparent focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CHART AREA */}
      <div className="p-4 relative">
        {data.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-gray-400 italic text-sm border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            No inspection data found for this period.
          </div>
        ) : (
          <div
            className="relative w-full overflow-hidden"
            style={{ paddingTop: "35%" }}
          >
            {/* Aspect Ratio Container (approx height 350px on wide screens) */}
            <div className="absolute inset-0">
              {/* SVG CHART */}
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

                {/* --- Y-AXIS LABELS (Left: Sample) --- */}
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

                {/* --- Y-AXIS LABELS (Right: Defects) --- */}
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

                {/* --- BARS (Sample Size) --- */}
                {processedChart.items.map((d, i) => (
                  <g key={`bar-${i}`}>
                    <rect
                      x={d.x - d.colWidth / 2}
                      y={d.barY}
                      width={d.colWidth}
                      height={d.barHeight}
                      fill="#10b981"
                      opacity={hoveredIndex === i ? "0.6" : "0.3"}
                      className="transition-all duration-300"
                      rx="4"
                    />
                    {/* Report Count Badge (Blue Bubble at bottom of bar) */}
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

                {/* --- LINE (Defects) --- */}
                <polyline
                  points={processedChart.items
                    .map((d) => `${d.x},${d.lineY}`)
                    .join(" ")}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="drop-shadow-md"
                />

                {/* --- POINTS & LABELS (Defects) --- */}
                {processedChart.items.map((d, i) => (
                  <g key={`point-${i}`}>
                    {/* Defect Line Point */}
                    <circle
                      cx={d.x}
                      cy={d.lineY}
                      r={hoveredIndex === i ? "6" : "4"}
                      fill="white"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      className="transition-all duration-300"
                    />

                    {/* Defect Qty Label (Always Visible Above Point) */}
                    <text
                      x={d.x}
                      y={d.lineY - 12}
                      textAnchor="middle"
                      className="fill-red-600 font-bold text-[12px]"
                      fontWeight="800"
                    >
                      {d.totalDefects}
                    </text>

                    {/* X-Axis Date Label */}
                    <text
                      x={d.x}
                      y={SVG_HEIGHT - 15}
                      textAnchor="middle"
                      className="fill-gray-500 text-[11px] font-medium"
                    >
                      {d.dateLabel}
                    </text>

                    {/* Invisible Hover Hitbox Area */}
                    <rect
                      x={d.x - d.colWidth / 2 - 10}
                      y={PADDING.top}
                      width={d.colWidth + 20}
                      height={SVG_HEIGHT - PADDING.top - PADDING.bottom}
                      fill="transparent"
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="cursor-crosshair"
                    />
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

export default FincheckAnalyticsTrendChart;
