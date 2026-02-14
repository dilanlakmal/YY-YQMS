import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Search,
  User,
  Loader2,
  FileText,
  Package,
  Layers,
  Bug,
  Percent,
  X,
} from "lucide-react";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../../config";
import FincheckAnalyticsStyleTable from "./FincheckAnalyticsStyleTable";
import FincheckAnalyticsTrendChart from "./FincheckAnalyticsTrendChart";

// --- Internal Helper: Async Search Input ---
const QAInspectorSearch = ({ onSelect }) => {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (term.length >= 2) {
        setLoading(true);
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/users/search?term=${term}`,
          );
          setResults(res.data || []);
          setShowDropdown(true);
        } catch (error) {
          console.error("Search error", error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setShowDropdown(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [term]);

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <input
          type="text"
          placeholder="Search QA by ID or Name..."
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm transition-all"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onFocus={() => results.length > 0 && setShowDropdown(true)}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin" />
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-fadeIn">
          {results.map((u) => (
            <button
              key={u.emp_id}
              onClick={() => {
                onSelect(u);
                setTerm("");
                setShowDropdown(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-gray-700/50 flex items-center gap-3 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                {u.face_photo ? (
                  <img
                    src={u.face_photo}
                    alt={u.eng_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-gray-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  {u.eng_name}
                </p>
                <p className="text-xs text-gray-500">{u.emp_id}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Helper: Improved Stat Card ---
const StatCard = ({
  title,
  value,
  footerContent,
  icon: Icon,
  colorClass,
  delay,
}) => (
  <div
    className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 flex flex-col justify-between hover:shadow-md transition-shadow animate-fadeIn h-full"
    style={{ animationDelay: `${delay}ms` }}
  >
    {/* Top Row: Title & Icon */}
    <div className="flex justify-between items-start mb-2">
      <div>
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {title}
        </p>
        <h4 className="text-3xl font-black text-gray-800 dark:text-white mt-1 tracking-tight">
          {value}
        </h4>
      </div>
      <div
        className={`p-2.5 rounded-xl shadow-sm ${colorClass.bg} ${colorClass.text}`}
      >
        <Icon className="w-5 h-5" />
      </div>
    </div>

    {/* Footer: Details / Breakdown */}
    {footerContent && (
      <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700">
        {footerContent}
      </div>
    )}
  </div>
);

// --- MAIN COMPONENT ---
const FincheckAnalyticsQASummary = () => {
  const [selectedQA, setSelectedQA] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [topN, setTopN] = useState(5);

  const fetchAnalytics = async (empId, limit) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-analytics/qa-summary`,
        {
          params: { empId, topN: limit },
        },
      );
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching analytics", error);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when Top N changes or QA changes
  useEffect(() => {
    if (selectedQA) {
      fetchAnalytics(selectedQA.emp_id, topN);
    }
  }, [selectedQA, topN]);

  const handleClear = () => {
    setSelectedQA(null);
    setData(null);
  };

  // Helper to construct photo URL
  const getPhotoUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    const cleanPath = url.startsWith("/") ? url.substring(1) : url;
    const baseUrl = PUBLIC_ASSET_URL.endsWith("/")
      ? PUBLIC_ASSET_URL
      : `${PUBLIC_ASSET_URL}/`;
    return `${baseUrl}${cleanPath}`;
  };

  // Helper to calculate rate
  const calculateRate = (defects, sample) => {
    if (!sample || sample === 0) return "0.00";
    return ((defects / sample) * 100).toFixed(2);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* 1. Search Bar Area */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-gray-800 dark:text-white">
              Inspector Profile
            </h2>
            <p className="text-xs text-gray-500">
              Select a QA to view performance
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedQA ? (
            <div className="flex items-center gap-3 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-xl border border-indigo-100 dark:border-indigo-800 animate-fadeIn">
              <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                {selectedQA.eng_name}
              </span>
              <button
                onClick={handleClear}
                className="p-1 hover:bg-white rounded-full transition-colors text-indigo-400 hover:text-red-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <QAInspectorSearch onSelect={setSelectedQA} />
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-500" />
          <p className="text-sm font-medium">Analyzing QA Performance...</p>
        </div>
      ) : !data ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <User className="w-12 h-12 mb-2 opacity-50" />
          <p className="text-sm">Please select a QA Inspector</p>
        </div>
      ) : (
        <>
          {/* 2. Profile & Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Profile Card */}
            <div className="lg:col-span-1 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-lg p-6 text-white flex flex-col items-center text-center relative overflow-hidden h-full justify-center">
              <div className="absolute inset-0 bg-white/5 opacity-50 pattern-grid-lg"></div>
              <div className="relative z-10">
                <div className="w-24 h-24 rounded-full border-4 border-white/20 shadow-xl overflow-hidden bg-white/10 mb-4 mx-auto">
                  {data.profile.face_photo ? (
                    <img
                      src={getPhotoUrl(data.profile.face_photo)}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-10 h-10 text-white/50" />
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-black tracking-tight">
                  {data.profile.eng_name}
                </h3>
                <div className="inline-block bg-white/20 px-3 py-0.5 rounded-full text-xs font-mono font-bold mt-1 mb-3 backdrop-blur-sm">
                  {data.profile.emp_id}
                </div>
                <p className="text-xs text-indigo-100 uppercase font-bold tracking-widest border-t border-white/20 pt-3 w-full">
                  {data.profile.job_title || "Quality Assurance"}
                </p>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Reports Breakdown */}
              <StatCard
                title="Total Reports"
                value={data.stats.totalReports}
                footerContent={
                  <div className="flex flex-wrap gap-1.5">
                    {data.reportBreakdown.map((r) => (
                      <span
                        key={r.reportType}
                        className="inline-flex items-center gap-1 bg-slate-100 dark:bg-gray-700 px-2 py-1 rounded-md text-[10px] font-bold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-gray-600"
                      >
                        {r.reportType}
                        <span className="bg-white dark:bg-gray-600 px-1 rounded-sm text-indigo-600 dark:text-indigo-400">
                          {r.reportCount}
                        </span>
                      </span>
                    ))}
                  </div>
                }
                icon={FileText}
                colorClass={{
                  bg: "bg-blue-100 dark:bg-blue-900/30",
                  text: "text-blue-600",
                }}
                delay={100}
              />

              {/* Card 2: Styles */}
              <StatCard
                title="Total Styles"
                value={data.stats.totalStyles}
                footerContent={
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    <Package className="w-3.5 h-3.5 opacity-70" />
                    Unique Order Numbers
                  </div>
                }
                icon={Package}
                colorClass={{
                  bg: "bg-purple-100 dark:bg-purple-900/30",
                  text: "text-purple-600",
                }}
                delay={200}
              />

              {/* Card 3: Samples */}
              <StatCard
                title="Total Sample"
                value={data.stats.totalSample.toLocaleString()}
                footerContent={
                  <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
                    <Layers className="w-3.5 h-3.5 opacity-70" />
                    Total Items Inspected
                  </div>
                }
                icon={Layers}
                colorClass={{
                  bg: "bg-emerald-100 dark:bg-emerald-900/30",
                  text: "text-emerald-600",
                }}
                delay={300}
              />

              {/* Card 4: Defect Rate & Findings */}
              <StatCard
                title="Defect Rate"
                value={`${data.stats.defectRate}%`}
                footerContent={
                  <div className="space-y-2">
                    <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 pb-1.5 mb-1.5">
                      <span className="text-xs font-bold text-slate-500 uppercase">
                        Total Defects
                      </span>
                      <span className="text-sm font-black text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded border border-red-100 dark:border-red-900/50">
                        {data.stats.totalDefects}
                      </span>
                    </div>
                    {/* Severity Breakdown */}
                    <div className="flex justify-between gap-1">
                      <div className="flex-1 bg-green-50 dark:bg-green-900/10 rounded px-1 py-1 text-center border border-green-100 dark:border-green-800">
                        <p className="text-[8px] font-bold text-green-700 dark:text-green-400 uppercase">
                          Minor
                        </p>
                        <p className="text-xs font-bold text-green-800 dark:text-green-300">
                          {data.stats.minor}
                        </p>
                      </div>
                      <div className="flex-1 bg-orange-50 dark:bg-orange-900/10 rounded px-1 py-1 text-center border border-orange-100 dark:border-orange-800">
                        <p className="text-[8px] font-bold text-orange-700 dark:text-orange-400 uppercase">
                          Major
                        </p>
                        <p className="text-xs font-bold text-orange-800 dark:text-orange-300">
                          {data.stats.major}
                        </p>
                      </div>
                      <div className="flex-1 bg-red-50 dark:bg-red-900/10 rounded px-1 py-1 text-center border border-red-100 dark:border-red-800">
                        <p className="text-[8px] font-bold text-red-700 dark:text-red-400 uppercase">
                          Critical
                        </p>
                        <p className="text-xs font-bold text-red-800 dark:text-red-300">
                          {data.stats.critical}
                        </p>
                      </div>
                    </div>
                  </div>
                }
                icon={Percent}
                colorClass={{
                  bg: "bg-red-100 dark:bg-red-900/30",
                  text: "text-red-600",
                }}
                delay={400}
              />
            </div>
          </div>

          {/* 3. Detailed Findings - Cards Layout */}
          <div className="space-y-4">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg text-rose-600">
                  <Bug className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-gray-800 dark:text-white text-lg">
                  Defect Findings Analysis
                </h3>
              </div>

              {/* Top N Filter */}
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1">
                <span className="text-xs font-bold text-gray-500 uppercase">
                  Top N:
                </span>
                <select
                  className="bg-transparent text-sm font-bold text-indigo-600 outline-none cursor-pointer py-1"
                  value={topN}
                  onChange={(e) => setTopN(Number(e.target.value))}
                >
                  {[3, 5, 7, 10, 15, 20].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {data.tableRows.map((row) => {
                const defectRate = calculateRate(
                  row.totalDefects,
                  row.sampleSize,
                );

                return (
                  <div
                    key={row.reportType}
                    className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all flex flex-col"
                  >
                    {/* Header Row */}
                    <div className="flex justify-between items-start mb-5">
                      <h4 className="text-base font-black text-gray-800 dark:text-white leading-tight">
                        {row.reportType}
                      </h4>
                      <div
                        className={`px-3 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 ${
                          parseFloat(defectRate) > 0
                            ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-800"
                            : "bg-green-50 text-green-600 border-green-100 dark:bg-green-900/20 dark:border-green-800"
                        }`}
                      >
                        {defectRate}% Rate
                      </div>
                    </div>

                    {/* Key Metrics with Breakdown */}
                    <div className="flex flex-col gap-4 mb-5">
                      {/* Row 1: Counts */}
                      <div className="flex items-center gap-6 overflow-x-auto pb-1">
                        {/* 1. Total Reports */}
                        <div className="shrink-0">
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                            Total Reports
                          </p>
                          <p className="text-lg font-bold text-gray-700 dark:text-gray-200 font-mono mt-0.5">
                            {row.reportCount}
                          </p>
                        </div>

                        <div className="w-px h-8 bg-gray-100 dark:bg-gray-700 shrink-0"></div>

                        {/* 2. Total Styles */}
                        <div className="shrink-0">
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                            Total Styles
                          </p>
                          <p className="text-lg font-bold text-gray-700 dark:text-gray-200 font-mono mt-0.5">
                            {row.totalStyles}
                          </p>
                        </div>

                        <div className="w-px h-8 bg-gray-100 dark:bg-gray-700 shrink-0"></div>

                        {/* 3. Sample Size */}
                        <div className="shrink-0">
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                            Total Sample#
                          </p>
                          <p className="text-lg font-bold text-gray-700 dark:text-gray-200 font-mono mt-0.5">
                            {row.sampleSize.toLocaleString()}
                          </p>
                        </div>

                        <div className="w-px h-8 bg-gray-100 dark:bg-gray-700 shrink-0"></div>

                        {/* 4. Total Defects */}
                        <div className="shrink-0">
                          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">
                            Total Defects#
                          </p>
                          <p className="text-lg font-bold text-gray-700 dark:text-gray-200 font-mono mt-0.5">
                            {row.totalDefects}
                          </p>
                        </div>
                      </div>

                      {/* Report Breakdown Badges */}
                      <div className="flex items-center gap-2">
                        {row.minor > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-green-100 text-green-700 font-bold border border-green-200">
                            {row.minor} Minor
                          </span>
                        )}
                        {row.major > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-orange-100 text-orange-700 font-bold border border-orange-200">
                            {row.major} Major
                          </span>
                        )}
                        {row.critical > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold border border-red-200">
                            {row.critical} Critical
                          </span>
                        )}
                        {row.totalDefects === 0 && (
                          <span className="text-[10px] text-gray-400 font-medium italic">
                            No defects found
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gray-100 dark:bg-gray-700 mb-4"></div>

                    {/* Defect Badges (Dynamic Top N) */}
                    <div className="flex-1">
                      <p className="text-xs font-bold text-gray-500 mb-2 uppercase flex items-center gap-2">
                        Top {topN} Defects
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {row.topDefects.length > 0 ? (
                          row.topDefects.map((d, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-gray-300 transition-colors"
                            >
                              <span
                                className="text-xs font-semibold text-gray-700 dark:text-gray-300"
                                title={d.name}
                              >
                                {d.name}
                              </span>
                              <span className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-[10px] font-bold px-1.5 rounded border border-red-200 dark:border-red-800">
                                {d.qty}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic bg-gray-50 dark:bg-gray-900 px-3 py-1.5 rounded-lg border border-dashed border-gray-200 dark:border-gray-700">
                            No defects recorded
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          {/* --- 4. DEFECT FINDINGS BY STYLE TABLE --- */}
          <FincheckAnalyticsStyleTable empId={selectedQA.emp_id} />
          {/* --- 5. CHART COMPONENT --- */}
          <FincheckAnalyticsTrendChart empId={selectedQA.emp_id} />
        </>
      )}
    </div>
  );
};

export default FincheckAnalyticsQASummary;
