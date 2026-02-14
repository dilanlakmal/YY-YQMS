import React from "react";
import { Package, FileText, Layers, Bug, Shirt } from "lucide-react";
import { PUBLIC_ASSET_URL } from "../../../../../../config";

const StatCard = ({ title, value, subItems, icon: Icon, colorClass }) => (
  <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
    <div className="flex justify-between items-start mb-2">
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
          {title}
        </p>
        <h3 className="text-2xl font-black text-gray-800 dark:text-white mt-1">
          {value}
        </h3>
      </div>
      <div className={`p-2 rounded-xl ${colorClass.bg} ${colorClass.text}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>

    {/* Sub Items (Scrollable if many) */}
    <div className="mt-auto pt-3 border-t border-gray-100 dark:border-gray-700 space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar">
      {subItems &&
        subItems.map((item, idx) => (
          <div key={idx} className="flex justify-between items-center text-xs">
            <span className="text-gray-600 dark:text-gray-400 font-medium truncate pr-2">
              {item.label}
            </span>
            <span className="font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
              {item.value}
            </span>
          </div>
        ))}
    </div>
  </div>
);

const StyleSummaryCards = ({ data }) => {
  const getImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    const cleanPath = url.startsWith("/") ? url.substring(1) : url;
    const baseUrl = PUBLIC_ASSET_URL.endsWith("/")
      ? PUBLIC_ASSET_URL
      : `${PUBLIC_ASSET_URL}/`;
    return `${baseUrl}${cleanPath}`;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 animate-fadeIn">
      {/* 1. Style Info Card */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-lg p-5 text-white flex flex-col relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 opacity-30 pattern-grid-lg"></div>

        <div className="relative z-10 flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-indigo-200 font-bold uppercase tracking-wider mb-1">
              Style Order
            </p>
            <h2 className="text-2xl font-black truncate" title={data.style}>
              {data.style}
            </h2>
            <p className="text-sm text-indigo-100 font-medium mt-0.5 truncate">
              {data.custStyle}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="px-2 py-1 bg-white/20 rounded-lg text-xs font-bold backdrop-blur-sm">
                {data.buyer}
              </span>
              <span className="px-2 py-1 bg-white/20 rounded-lg text-xs font-bold backdrop-blur-sm">
                Qty: {data.orderQty?.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Product Image */}
          <div className="w-20 h-20 bg-white rounded-xl shadow-lg flex items-center justify-center p-1 shrink-0 ml-2">
            {data.productImage ? (
              <img
                src={getImageUrl(data.productImage)}
                alt="Product"
                className="w-full h-full object-contain rounded-lg"
              />
            ) : (
              <Shirt className="w-8 h-8 text-gray-300" />
            )}
          </div>
        </div>
        <p className="relative z-10 mt-auto pt-4 text-xs font-medium text-right opacity-80">
          {data.productType}
        </p>
      </div>

      {/* 2. Total Reports */}
      <StatCard
        title="Total Reports"
        value={data.totalReports}
        icon={FileText}
        colorClass={{
          bg: "bg-blue-100 dark:bg-blue-900/30",
          text: "text-blue-600",
        }}
        subItems={data.reportsByType.map((r) => ({
          label: r.type,
          value: r.count,
        }))}
      />

      {/* 3. Total Sample */}
      <StatCard
        title="Total Sample"
        value={data.totalSample.toLocaleString()}
        icon={Layers}
        colorClass={{
          bg: "bg-emerald-100 dark:bg-emerald-900/30",
          text: "text-emerald-600",
        }}
        subItems={data.reportsByType.map((r) => ({
          label: r.type,
          value: r.sample.toLocaleString(),
        }))}
      />

      {/* 4. Total Defects */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-all flex flex-col h-full">
        <div className="flex justify-between items-start mb-2">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Total Defects
            </p>
            <h3 className="text-2xl font-black text-red-600 mt-1">
              {data.totalDefects}
            </h3>
          </div>
          <div className="p-2 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-600">
            <Bug className="w-5 h-5" />
          </div>
        </div>

        {/* Severity Grid */}
        <div className="grid grid-cols-3 gap-1 mt-auto">
          <div className="text-center bg-green-50 rounded p-1 border border-green-100">
            <span className="block text-[9px] font-bold text-green-700">
              MIN
            </span>
            <span className="text-xs font-bold text-green-800">
              {data.minor}
            </span>
          </div>
          <div className="text-center bg-orange-50 rounded p-1 border border-orange-100">
            <span className="block text-[9px] font-bold text-orange-700">
              MAJ
            </span>
            <span className="text-xs font-bold text-orange-800">
              {data.major}
            </span>
          </div>
          <div className="text-center bg-red-50 rounded p-1 border border-red-100">
            <span className="block text-[9px] font-bold text-red-700">
              CRIT
            </span>
            <span className="text-xs font-bold text-red-800">
              {data.critical}
            </span>
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 text-center">
          <span className="text-xs font-bold text-gray-500">Rate: </span>
          <span
            className={`text-sm font-black ${parseFloat(data.defectRate) > 0 ? "text-red-600" : "text-green-600"}`}
          >
            {data.defectRate}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default StyleSummaryCards;
