import React, { useMemo } from "react";
import {
  MapPin,
  Info,
  ClipboardList,
  ArrowDownWideNarrow,
  Tag
} from "lucide-react";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";

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

// Color logic based on quantity
const getMarkerColorStyles = (qty) => {
  if (qty === 0)
    return "bg-green-100 border-green-400 text-green-800 shadow-sm";
  if (qty === 1)
    return "bg-yellow-100 border-yellow-400 text-yellow-800 shadow-md";
  if (qty > 1 && qty <= 2)
    return "bg-orange-500 border-orange-600 text-white shadow-lg";
  return "bg-red-600 border-red-700 text-white shadow-xl";
};

const getPulseColor = (qty) => {
  if (qty === 0) return null;
  if (qty === 1) return "bg-yellow-400";
  if (qty > 1 && qty <= 2) return "bg-orange-500";
  return "bg-red-500";
};

// --- Single View Component ---
const ViewContainer = ({ title, viewData, viewCounts }) => {
  if (!viewData || !viewData.imagePath) return null;

  return (
    <div className="flex-1 min-w-[300px]">
      <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3 text-center uppercase tracking-wide">
        {title}
      </h4>

      <div className="w-full bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm flex items-center justify-center p-2 min-h-[200px]">
        <div className="relative inline-block">
          <img
            src={getImageUrl(viewData.imagePath)}
            alt={title}
            className="max-h-[500px] w-auto max-w-full object-contain block"
            onError={(e) => {
              e.target.style.display = "none";
              e.target.parentNode.innerHTML =
                "<div class='p-8 text-xs text-gray-400'>Image not found</div>";
            }}
          />

          {/* Render Markers */}
          {viewData.locations.map((loc) => {
            // Updated Logic: Check if we have data for this location object
            const locationData = viewCounts[loc.LocationNo];
            const count = locationData ? locationData.total : 0;
            const pulseColor = getPulseColor(count);

            return (
              <div
                key={loc._id || loc.LocationNo}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-pointer"
                style={{ top: `${loc.y}%`, left: `${loc.x}%` }}
              >
                {/* 1. Animation */}
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
                    count
                  )}`}
                >
                  <span className="text-[10px] font-bold">
                    {loc.LocationNo}
                  </span>

                  {/* 3. Count Badge (Floating Top Right) */}
                  {count > 0 && (
                    <div className="absolute -top-3 -right-3 min-w-[20px] h-[20px] flex items-center justify-center bg-white border-2 border-white text-black text-[10px] font-black rounded-full shadow-md z-20">
                      {count}
                    </div>
                  )}
                </div>

                {/* 4. Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover:block z-30 w-max max-w-[180px] animate-fadeIn">
                  <div className="bg-gray-900 text-white text-xs rounded py-1.5 px-3 shadow-xl text-center border border-gray-700">
                    <p className="font-bold text-sm mb-0.5">
                      {loc.LocationName}
                    </p>
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="text-[10px] text-gray-300">
                        Loc #{loc.LocationNo}
                      </span>
                      {count > 0 && (
                        <span className="bg-red-500 px-1.5 py-0.5 rounded text-[10px] font-bold">
                          {count} Defect{count > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    {/* Tiny breakdown in tooltip */}
                    {locationData && locationData.defects && (
                      <div className="mt-1 pt-1 border-t border-gray-700 text-[9px] text-gray-300 text-left">
                        {Object.entries(locationData.defects).map(
                          ([name, qty]) => (
                            <div key={name} className="flex justify-between">
                              <span className="truncate max-w-[100px]">
                                {name}
                              </span>
                              <span className="font-bold">x{qty}</span>
                            </div>
                          )
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
const DefectLocationSummary = ({ mapData, counts }) => {
  if (!mapData) return null;

  // 1. Calculate Total Defects (Summing .total from new structure)
  const calculateTotal = (viewCountObj) => {
    return Object.values(viewCountObj || {}).reduce(
      (acc, curr) => acc + (curr.total || 0),
      0
    );
  };
  const totalVisualDefects =
    calculateTotal(counts.Front) + calculateTotal(counts.Back);

  // 2. Prepare Data for Table (Combine Map + Counts + Details)
  const tableData = useMemo(() => {
    const rows = [];

    const processLocations = (locations, viewName, viewCounts) => {
      if (!locations) return;
      locations.forEach((loc) => {
        const data = viewCounts?.[loc.LocationNo];
        if (data && data.total > 0) {
          // Convert defects object { "Stain": 2, "Hole": 1 } into array [{name: "Stain", qty: 2}, ...]
          const defectDetails = Object.entries(data.defects || {}).map(
            ([name, qty]) => ({
              name,
              qty
            })
          );

          rows.push({
            id: `${viewName[0]}-${loc.LocationNo}`,
            view: viewName,
            no: loc.LocationNo,
            name: loc.LocationName,
            qty: data.total,
            defects: defectDetails
          });
        }
      });
    };

    processLocations(mapData.frontView?.locations, "Front", counts.Front);
    processLocations(mapData.backView?.locations, "Back", counts.Back);

    // Sort by Total Qty (High to Low)
    return rows.sort((a, b) => b.qty - a.qty);
  }, [mapData, counts]);

  return (
    <div className="p-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-100 dark:border-gray-700">
      {/* Header Bar */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-2">
          <MapPin className="w-3.5 h-3.5" />
          Defect Location Map
        </h3>
        <div className="flex items-center gap-3">
          {/* Legend */}
          <div className="hidden sm:flex items-center gap-2 text-[9px] text-gray-400 font-medium bg-white dark:bg-gray-800 px-2 py-1 rounded border border-gray-200 dark:border-gray-700">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-200 border border-green-400"></span>{" "}
              0
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-200 border border-yellow-400"></span>{" "}
              1
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-500"></span> 2-3
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-600"></span> &gt;3
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-100">
            {totalVisualDefects} defects mapped
          </span>
        </div>
      </div>

      {/* Images Section */}
      <div className="flex flex-col md:flex-row gap-8 justify-center mb-8">
        <ViewContainer
          title="Front View"
          viewData={mapData.frontView}
          viewCounts={counts.Front || {}}
        />
        <ViewContainer
          title="Back View"
          viewData={mapData.backView}
          viewCounts={counts.Back || {}}
        />
      </div>

      {/* Info Text */}
      <div className="mt-4 flex items-center gap-2 justify-center text-xs text-gray-400 mb-6">
        <Info className="w-3 h-3" />
        <p>
          Markers show <strong>Location No</strong>. Badge shows{" "}
          <strong>Defect Qty</strong>.
        </p>
      </div>

      {/* Summary Table */}
      {tableData.length > 0 && (
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-2 px-1">
            <ClipboardList className="w-3.5 h-3.5 text-gray-500" />
            <h4 className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">
              Location Breakdown
            </h4>
            <div className="ml-auto flex items-center gap-1 text-[10px] text-gray-400">
              <ArrowDownWideNarrow className="w-3 h-3" />
              Sorted by Qty
            </div>
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
                  <th className="px-4 py-3">Defect Details</th>
                  <th className="px-4 py-3 w-20 text-center font-black bg-gray-200/50 dark:bg-gray-600/50">
                    Total Qty
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {tableData.map((row, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 group"
                  >
                    <td className="px-4 py-3 text-center font-mono font-bold text-indigo-500 border-r border-gray-100 dark:border-gray-700 group-hover:border-gray-200">
                      {row.no}
                    </td>
                    <td className="px-4 py-3 border-r border-gray-100 dark:border-gray-700 group-hover:border-gray-200">
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
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 border-r border-gray-100 dark:border-gray-700 group-hover:border-gray-200">
                      {row.name}
                    </td>

                    {/* New Defect Details Column */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        {row.defects.map((d, i) => (
                          <div
                            key={i}
                            className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600 overflow-hidden"
                          >
                            <span className="px-2 py-0.5 text-[10px] text-gray-600 dark:text-gray-300">
                              {d.name}
                            </span>
                            <span className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-[10px] font-bold text-gray-800 dark:text-gray-100 border-l border-gray-300 dark:border-gray-500">
                              {d.qty}
                            </span>
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-center bg-gray-50/50 dark:bg-gray-800/50">
                      <span
                        className={`inline-block w-7 h-7 leading-7 rounded-full text-[11px] font-bold text-white shadow-sm ${
                          row.qty === 1
                            ? "bg-yellow-400"
                            : row.qty <= 3
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
  );
};

export default DefectLocationSummary;
