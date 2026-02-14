import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  MapPin,
  Info,
  ClipboardList,
  ArrowDownWideNarrow,
  Loader2,
} from "lucide-react";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../../config";

// Helper to construct image URL
const getImageUrl = (path) => {
  if (!path) return "";
  if (path.startsWith("http") || path.startsWith("https")) return path;

  // Use PUBLIC_ASSET_URL for storage images
  const baseUrl = PUBLIC_ASSET_URL.endsWith("/")
    ? PUBLIC_ASSET_URL.slice(0, -1)
    : PUBLIC_ASSET_URL;

  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};

// --- COLOR LOGIC ---
const getMarkerColorStyles = (qty) => {
  if (qty === 0)
    return "bg-green-100 border-green-400 text-green-800 shadow-sm opacity-80 hover:opacity-100";
  if (qty <= 2)
    return "bg-yellow-300 border-yellow-500 text-yellow-900 shadow-md";
  if (qty <= 5) return "bg-orange-500 border-orange-600 text-white shadow-lg";
  return "bg-red-600 border-red-700 text-white shadow-xl";
};

const getPulseColor = (qty) => {
  if (qty === 0) return null;
  if (qty <= 2) return "bg-yellow-400";
  if (qty <= 5) return "bg-orange-500";
  return "bg-red-600";
};

// --- Single View Component ---
const ViewContainer = ({ title, viewData, viewCounts }) => {
  if (!viewData || !viewData.imagePath) return null;

  return (
    <div className="flex-1 min-w-[300px]">
      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center uppercase tracking-wide">
        {title}
      </h4>

      {/* Outer container centers the content */}
      <div className="w-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm flex items-center justify-center p-4 min-h-[300px]">
        {/* 
            FIX: Removed 'w-full'. 
            Used 'relative w-fit' so the div shrinks to wrap the image exactly.
            This ensures top/left % coordinates are relative to the IMAGE size, not the container width.
        */}
        <div className="relative w-fit">
          <img
            src={getImageUrl(viewData.imagePath)}
            alt={title}
            className="max-h-[500px] w-auto max-w-full object-contain block"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentNode.innerHTML =
                "<div class='p-8 text-xs text-gray-400 text-center'>Image not found</div>";
            }}
          />

          {/* Render Markers */}
          {viewData.locations.map((loc) => {
            const locationData = viewCounts[loc.LocationNo];
            const count = locationData ? locationData.total : 0;
            const pulseColor = getPulseColor(count);

            return (
              <div
                key={loc._id || loc.LocationNo}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{ top: `${loc.y}%`, left: `${loc.x}%` }}
              >
                {/* 1. Animation (Pulse) */}
                {pulseColor && (
                  <>
                    <span
                      className={`absolute -inset-4 rounded-full opacity-40 animate-ping ${pulseColor}`}
                    ></span>
                    <span
                      className={`absolute -inset-1 rounded-full opacity-60 animate-pulse ${pulseColor}`}
                    ></span>
                  </>
                )}

                {/* 2. Marker Circle (Location No) */}
                <div
                  className={`relative flex items-center justify-center w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 z-10 ${getMarkerColorStyles(
                    count,
                  )}`}
                >
                  <span className="text-[10px] font-bold">
                    {loc.LocationNo}
                  </span>

                  {/* 3. Count Label (Floating Top Right) */}
                  {count > 0 && (
                    <div className="absolute -top-3 -right-3 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-white border border-gray-200 text-black text-[9px] font-black rounded-full shadow-md z-20 whitespace-nowrap">
                      {count}
                    </div>
                  )}
                </div>

                {/* 4. Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block z-30 w-max max-w-[180px] animate-fadeIn">
                  <div className="bg-gray-900 text-white text-xs rounded py-2 px-3 shadow-xl text-center border border-gray-700">
                    <p className="font-bold text-sm mb-1">{loc.LocationName}</p>
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <span className="text-[10px] text-gray-300">
                        Loc #{loc.LocationNo}
                      </span>
                      {count > 0 ? (
                        <span className="bg-red-500 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {count} Defect{count > 1 ? "s" : ""}
                        </span>
                      ) : (
                        <span className="bg-green-500 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          Pass
                        </span>
                      )}
                    </div>
                    {/* Breakdown in tooltip */}
                    {locationData && locationData.defects && (
                      <div className="mt-1 pt-1 border-t border-gray-700 text-[9px] text-gray-300 text-left">
                        {Object.entries(locationData.defects).map(
                          ([name, qty]) => (
                            <div key={name} className="flex justify-between">
                              <span className="truncate max-w-[100px]">
                                {name}
                              </span>
                              <span className="font-bold text-white">
                                x{qty}
                              </span>
                            </div>
                          ),
                        )}
                      </div>
                    )}
                  </div>
                  <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900 absolute left-1/2 -translate-x-1/2 top-full"></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- Main Component ---
const StyleSummaryLocationDefectMap = ({ styleNo }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (styleNo) {
      fetchData();
    }
  }, [styleNo]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-analytics/style-location-map`,
        { params: { styleNo } },
      );
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching location map:", error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare Data for Table (Combine Map + Counts + Details)
  const tableData = useMemo(() => {
    if (!data) return [];
    const { map, counts } = data;
    const rows = [];

    // Calculate Total Defects for Header
    const totalVisualDefects =
      Object.values(counts.Front || {}).reduce((acc, c) => acc + c.total, 0) +
      Object.values(counts.Back || {}).reduce((acc, c) => acc + c.total, 0);

    const processLocations = (locations, viewName, viewCounts) => {
      if (!locations) return;
      locations.forEach((loc) => {
        const d = viewCounts?.[loc.LocationNo];
        // Only add to table if there are defects
        if (d && d.total > 0) {
          rows.push({
            view: viewName,
            no: loc.LocationNo,
            name: loc.LocationName,
            qty: d.total,
            defects: Object.entries(d.defects).map(([n, q]) => ({
              name: n,
              qty: q,
            })),
          });
        }
      });
    };

    processLocations(map.frontView?.locations, "Front", counts.Front);
    processLocations(map.backView?.locations, "Back", counts.Back);

    // Sort by Total Qty (High to Low)
    const sortedRows = rows.sort((a, b) => b.qty - a.qty);

    return { rows: sortedRows, total: totalVisualDefects };
  }, [data]);

  if (loading) {
    return (
      <div className="h-64 flex flex-col items-center justify-center text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 mt-6">
        <Loader2 className="w-8 h-8 animate-spin mb-2 text-indigo-500" />
        <p className="text-sm">Mapping Defect Locations...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden mt-6 animate-fadeIn">
      {/* Header Bar */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-pink-100 dark:bg-pink-900/30 rounded-lg text-pink-600">
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-gray-800 dark:text-white text-lg">
            Defect Location Heatmap
          </h3>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[10px] font-bold bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-green-200 border border-green-400"></span>{" "}
            0
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 border border-yellow-500"></span>{" "}
            1-2
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 border border-orange-600"></span>{" "}
            3-5
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 border border-red-700 animate-pulse"></span>{" "}
            &gt; 5
          </div>
        </div>
      </div>

      {/* Images Section */}
      <div className="p-6">
        <div className="flex flex-col xl:flex-row gap-8 justify-center mb-8">
          <ViewContainer
            title="Front View"
            viewData={data.map.frontView}
            viewCounts={data.counts.Front || {}}
          />
          <ViewContainer
            title="Back View"
            viewData={data.map.backView}
            viewCounts={data.counts.Back || {}}
          />
        </div>

        {/* Info Text */}
        <div className="flex items-center gap-2 justify-center text-xs text-gray-400 mb-6">
          <Info className="w-3 h-3" />
          <p>
            Markers show <strong>Location No</strong>. Badges show{" "}
            <strong>Defect Qty</strong>.
          </p>
        </div>

        {/* Summary Table */}
        {tableData.rows.length > 0 && (
          <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-gray-500" />
                <h4 className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
                  Top Affected Locations
                </h4>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded border border-indigo-100">
                {tableData.total} Total Visual Defects
              </span>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-bold uppercase">
                  <tr>
                    <th className="px-4 py-3 w-12 text-center border-r border-gray-200 dark:border-gray-600">
                      #
                    </th>
                    <th className="px-4 py-3 w-20 border-r border-gray-200 dark:border-gray-600">
                      View
                    </th>
                    <th className="px-4 py-3 w-1/4 border-r border-gray-200 dark:border-gray-600">
                      Location Name
                    </th>
                    <th className="px-4 py-3">Defect Breakdown</th>
                    <th className="px-4 py-3 w-20 text-center font-black bg-gray-200/50 dark:bg-gray-600/50">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {tableData.rows.map((row, index) => (
                    <tr
                      key={index}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 group"
                    >
                      <td className="px-4 py-3 text-center font-mono font-bold text-indigo-500 border-r border-gray-100 dark:border-gray-700">
                        {row.no}
                      </td>
                      <td className="px-4 py-3 border-r border-gray-100 dark:border-gray-700">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            row.view === "Front"
                              ? "bg-red-50 text-red-700 border-red-100"
                              : "bg-blue-50 text-blue-700 border-blue-100"
                          }`}
                        >
                          {row.view}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 border-r border-gray-100 dark:border-gray-700">
                        {row.name}
                      </td>

                      {/* Defect Details with Red Circle for Qty */}
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          {row.defects.map((d, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700 pl-2 pr-1 py-1 rounded border border-gray-200 dark:border-gray-600"
                            >
                              <span className="text-[10px] text-gray-600 dark:text-gray-300 font-medium">
                                {d.name}
                              </span>
                              {/* Updated to Red Circle */}
                              <span className="flex items-center justify-center min-w-[16px] h-4 px-1 bg-red-500 text-white text-[9px] font-bold rounded-full">
                                {d.qty}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-center bg-gray-50/50 dark:bg-gray-800/50">
                        <span
                          className={`inline-block w-7 h-7 leading-7 rounded-full text-[11px] font-bold text-white shadow-sm ${
                            row.qty <= 2
                              ? "bg-yellow-400"
                              : row.qty <= 5
                                ? "bg-orange-500"
                                : "bg-red-600"
                          }`}
                        >
                          {row.qty}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StyleSummaryLocationDefectMap;
