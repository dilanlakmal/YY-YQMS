import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Loader2,
  Calendar,
  User,
  Layers,
  FileText,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Star, // Using Star icon for Critical label
  FileDown,
} from "lucide-react";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../../config";
import MeasurementReportPDF from "./MeasurementReportPDF";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const checkTolerance = (spec, value) => {
  if (value === 0 || value === "" || value === null || value === undefined)
    return { isWithin: true, isDefault: true };
  const reading = parseFloat(value);
  if (isNaN(reading)) return { isWithin: true, isDefault: true };

  const tolMinusDecimal = parseFloat(spec.TolMinus?.decimal);
  const tolPlusDecimal = parseFloat(spec.TolPlus?.decimal);
  if (isNaN(tolMinusDecimal) && isNaN(tolPlusDecimal))
    return { isWithin: true, isDefault: true };

  const lowerLimit = isNaN(tolMinusDecimal) ? 0 : -Math.abs(tolMinusDecimal);
  const upperLimit = isNaN(tolPlusDecimal) ? 0 : Math.abs(tolPlusDecimal);
  const epsilon = 0.0001;
  const isWithin =
    reading >= lowerLimit - epsilon && reading <= upperLimit + epsilon;

  return { isWithin, isDefault: false };
};

const formatSpecFraction = (fractionStr) => {
  if (!fractionStr || fractionStr === "-") return "-";
  return String(fractionStr).replace(/(\d)-(\d)/g, "$1 $2");
};

// Helper to resolve photo URL
const resolvePhotoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const baseUrl = PUBLIC_ASSET_URL.endsWith("/")
    ? PUBLIC_ASSET_URL.slice(0, -1)
    : PUBLIC_ASSET_URL;
  return `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;
};

// ============================================================================
// SUB-COMPONENT: Single Measurement Table
// ============================================================================
const MeasurementGroupTable = ({ group, specsData, sizeList }) => {
  const { measurements, manualMeasurements, stage, kValue } = group;

  // 1. Determine which specs to use (Full and Selected/Critical)
  //   const fullSpecs =
  //     stage === "Before" ? specsData.Before?.full : specsData.After?.full;

  //   const criticalSpecs =
  //     stage === "Before" ? specsData.Before?.selected : specsData.After?.selected;

  // 2. GET RAW LISTS
  let fullSpecs =
    stage === "Before" ? specsData.Before?.full : specsData.After?.full;
  let criticalSpecs =
    stage === "Before" ? specsData.Before?.selected : specsData.After?.selected;

  // 3. APPLY FILTERING TO BOTH LISTS (Only for 'Before' stage)
  if (stage === "Before") {
    if (kValue) {
      // Case A: Group has specific K-Value -> Filter both lists for this K-Value
      if (fullSpecs) {
        fullSpecs = fullSpecs.filter((s) => s.kValue === kValue);
      }
      if (criticalSpecs) {
        criticalSpecs = criticalSpecs.filter((s) => s.kValue === kValue);
      }
    } else {
      // Case B: Group has NO K-Value -> Filter both lists for empty K-Value
      if (fullSpecs) {
        fullSpecs = fullSpecs.filter((s) => !s.kValue);
      }
      if (criticalSpecs) {
        criticalSpecs = criticalSpecs.filter((s) => !s.kValue);
      }
    }
  }

  // 4. GENERATE CRITICAL ID SET (From the filtered list)
  const criticalSpecIds = new Set((criticalSpecs || []).map((s) => s.id));

  // 5. Filter out Manual_Entry and Sort Measurements
  const validMeasurements = measurements.filter(
    (m) => m.size !== "Manual_Entry",
  );

  // 6. CHECK IF WE HAVE ANYTHING TO SHOW (Table Data OR Manual Images)
  const hasTableData =
    validMeasurements.length > 0 && fullSpecs && fullSpecs.length > 0;
  const hasManualData = manualMeasurements && manualMeasurements.length > 0;

  if (!hasTableData && !hasManualData) return null;

  const sortedMeasurements = [...validMeasurements].sort((a, b) => {
    const idxA = sizeList.indexOf(a.size);
    const idxB = sizeList.indexOf(b.size);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.size.localeCompare(b.size, undefined, { numeric: true });
  });

  return (
    <div className="mb-6 last:mb-0">
      {hasTableData ? (
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 mb-6 last:mb-0 shadow-sm">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                {/* Spec Info Headers */}
                <th className="p-2 text-left font-bold min-w-[150px] sticky left-0 bg-gray-100 dark:bg-gray-700 z-10 shadow-[1px_0_2px_-1px_rgba(0,0,0,0.1)]">
                  Measurement Point
                </th>
                <th className="p-2 text-center text-red-600 font-bold w-[50px]">
                  TOL (-)
                </th>
                <th className="p-2 text-center text-green-600 font-bold w-[50px]">
                  TOL (+)
                </th>

                {/* Size Headers */}
                {sortedMeasurements.map((m, idx) => {
                  const allPcs = m.allEnabledPcs?.length || 0;
                  const critPcs = m.criticalEnabledPcs?.length || 0;
                  const colSpan = 1 + allPcs + critPcs;
                  return (
                    <th
                      key={idx}
                      colSpan={colSpan}
                      className="p-2 text-center border-l border-gray-300 dark:border-gray-600 bg-indigo-50 dark:bg-indigo-900/30"
                    >
                      <div className="font-bold text-indigo-700 dark:text-indigo-300">
                        {m.size}
                      </div>
                    </th>
                  );
                })}
              </tr>
              <tr className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-600">
                <th colSpan={3}></th> {/* Spacers */}
                {sortedMeasurements.map((m, idx) => (
                  <React.Fragment key={idx}>
                    <th className="p-1 text-center bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 font-bold border-l border-b border-gray-200 dark:border-gray-700 text-[10px]">
                      Spec
                    </th>
                    {m.allEnabledPcs?.map((pcsIndex, pIdx) => (
                      <th
                        key={`a-${pIdx}`}
                        className="p-1 text-center bg-amber-50 dark:bg-amber-900/10 text-[9px] min-w-[35px] border-l border-b border-gray-200 dark:border-gray-700"
                      >
                        <span className="bg-amber-500 text-white px-1 rounded font-bold">
                          A
                        </span>{" "}
                        <span className="text-gray-500">#{pIdx + 1}</span>
                      </th>
                    ))}
                    {m.criticalEnabledPcs?.map((pcsIndex, pIdx) => (
                      <th
                        key={`c-${pIdx}`}
                        className="p-1 text-center bg-purple-50 dark:bg-purple-900/10 text-[9px] min-w-[35px] border-l border-b border-gray-200 dark:border-gray-700"
                      >
                        <span className="bg-purple-500 text-white px-1 rounded font-bold">
                          C
                        </span>{" "}
                        <span className="text-gray-500">#{pIdx + 1}</span>
                      </th>
                    ))}
                  </React.Fragment>
                ))}
              </tr>
            </thead>
            <tbody>
              {fullSpecs.map((spec, sIdx) => {
                // Check if this row is critical
                const isCriticalRow = criticalSpecIds.has(spec.id);

                // Row styling based on critical status
                const rowClass = isCriticalRow
                  ? "bg-blue-50/60 dark:bg-blue-900/20"
                  : sIdx % 2 === 0
                    ? "bg-white dark:bg-gray-800"
                    : "bg-gray-50 dark:bg-gray-800/50";

                const stickyCellClass = isCriticalRow
                  ? "bg-blue-50 dark:bg-blue-900"
                  : sIdx % 2 === 0
                    ? "bg-white dark:bg-gray-800"
                    : "bg-gray-50 dark:bg-gray-800";

                return (
                  <tr key={spec.id} className={rowClass}>
                    <td
                      className={`p-2 border-r border-b border-gray-200 dark:border-gray-700 sticky left-0 z-10 shadow-[1px_0_2px_-1px_rgba(0,0,0,0.1)] ${stickyCellClass}`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-700 dark:text-gray-300 leading-tight">
                          {spec.MeasurementPointEngName}
                        </span>
                        {isCriticalRow && (
                          <span className="flex items-center gap-0.5 mt-0.5 text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase">
                            <Star className="w-2.5 h-2.5 fill-current" />{" "}
                            Critical Point
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-1 text-center text-red-500 font-bold text-[10px] bg-red-50/30 border-r border-b border-gray-200 dark:border-gray-700">
                      {spec.TolMinus?.fraction || "-"}
                    </td>
                    <td className="p-1 text-center text-green-500 font-bold text-[10px] bg-green-50/30 border-b border-gray-200 dark:border-gray-700">
                      {spec.TolPlus?.fraction || "-"}
                    </td>

                    {sortedMeasurements.map((m, mIdx) => {
                      const sizeSpec = spec.Specs?.find(
                        (s) => s.size === m.size,
                      );
                      const specValDisplay = sizeSpec
                        ? formatSpecFraction(sizeSpec.fraction)
                        : "-";

                      return (
                        <React.Fragment key={mIdx}>
                          {/* Spec Value */}
                          <td className="p-1 text-center border-l border-b border-gray-200 dark:border-gray-700 font-bold text-blue-600 dark:text-blue-400 bg-blue-50/30">
                            {specValDisplay}
                          </td>

                          {/* All Mode Readings ('A') */}
                          {m.allEnabledPcs?.map((pcsIndex) => {
                            const valObj =
                              m.allMeasurements?.[spec.id]?.[pcsIndex];
                            const decimal = valObj?.decimal || 0;
                            const fraction = valObj?.fraction || "-";
                            const check = checkTolerance(spec, decimal);

                            let colorClass = "";
                            // 'A' Logic: 0 = Green (Pass), Value = Check Tol
                            if (decimal === 0) {
                              colorClass =
                                "text-green-600 font-bold bg-green-50 dark:bg-green-900/20"; // 0 is Pass for 'A'
                            } else {
                              colorClass =
                                check.isWithin || check.isDefault
                                  ? "text-green-600 font-bold bg-green-50 dark:bg-green-900/20"
                                  : "text-red-600 font-bold bg-red-50 dark:bg-red-900/20";
                            }

                            return (
                              <td
                                key={`val-a-${pcsIndex}`}
                                className={`p-1 text-center text-[10px] font-mono border-l border-b border-gray-200 dark:border-gray-700 ${colorClass}`}
                              >
                                {fraction}
                              </td>
                            );
                          })}

                          {/* Critical Mode Readings ('C') */}
                          {m.criticalEnabledPcs?.map((pcsIndex) => {
                            const valObj =
                              m.criticalMeasurements?.[spec.id]?.[pcsIndex];
                            const decimal = valObj?.decimal || 0;
                            const fraction = valObj?.fraction || "-";
                            const check = checkTolerance(spec, decimal);

                            let colorClass = "";
                            // 'C' Logic: 0 = Gray (Skipped/Empty), Value = Check Tol

                            // 1. If explicitly empty/skipped ("-"), make it Gray
                            if (fraction === "-") {
                              colorClass =
                                "text-gray-400 bg-gray-50 dark:bg-gray-800";
                            }
                            // 2. If it is a real measured 0, make it Green
                            else if (decimal === 0) {
                              colorClass =
                                "text-green-600 font-bold bg-green-50 dark:bg-green-900/20";
                            }
                            // 3. Otherwise check tolerance
                            else {
                              colorClass =
                                check.isWithin || check.isDefault
                                  ? "text-green-600 font-bold bg-green-50 dark:bg-green-900/20"
                                  : "text-red-600 font-bold bg-red-50 dark:bg-red-900/20";
                            }

                            // if (decimal === 0) {
                            //   colorClass =
                            //     "text-green-600 font-bold bg-green-50 dark:bg-green-900/20";
                            // } else {
                            //   colorClass =
                            //     check.isWithin || check.isDefault
                            //       ? "text-green-600 font-bold bg-green-50 dark:bg-green-900/20"
                            //       : "text-red-600 font-bold bg-red-50 dark:bg-red-900/20";
                            // }

                            return (
                              <td
                                key={`val-c-${pcsIndex}`}
                                className={`p-1 text-center text-[10px] font-mono border-l border-b border-gray-200 dark:border-gray-700 ${colorClass}`}
                              >
                                {fraction}
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
      ) : (
        // Optional: Message if only manual data exists but no table
        <div className="p-3 text-xs text-gray-500 italic bg-gray-50 border border-gray-200 rounded mb-4">
          * Digital measurements were not recorded. Please see manual records
          below.
        </div>
      )}

      {/* --- NEW: MANUAL MEASUREMENT IMAGES SECTION --- */}
      {hasManualData && (
        <div className="mt-4 bg-gray-100 dark:bg-gray-700/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Manual Measurement Records
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {manualMeasurements.map((mEntry, mIdx) => (
              <React.Fragment key={mIdx}>
                {mEntry.manualData?.images?.map((img, imgIdx) => (
                  <div
                    key={`${mIdx}-${imgIdx}`}
                    className="flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                  >
                    {/* Remark Header */}
                    {img.remark ? (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 p-2 border-b border-gray-100 dark:border-gray-700">
                        <span className="text-[10px] font-bold text-yellow-700 dark:text-yellow-400 uppercase block mb-0.5">
                          Remark:
                        </span>
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-tight">
                          {img.remark}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-50 dark:bg-gray-700 p-2 border-b border-gray-100 dark:border-gray-600">
                        <span className="text-[10px] text-gray-400 italic">
                          No specific remark
                        </span>
                      </div>
                    )}

                    {/* Image Area */}
                    <div className="relative aspect-[4/3] bg-gray-200 dark:bg-gray-900 group">
                      <img
                        src={resolvePhotoUrl(img.imageURL)}
                        alt="Manual Measurement"
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      {/* Hover Overlay to view full (Optional interaction) */}
                      <a
                        href={resolvePhotoUrl(img.imageURL)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center"
                      >
                        {/* Can add 'View' icon here if needed */}
                      </a>
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// SUB-COMPONENT: Pagination Controls
// ============================================================================
const PaginationBar = ({ current, total, onPageChange, compact = false }) => {
  if (total <= 1) return null;

  // Reduced page numbers logic
  const getPageNumbers = () => {
    const pages = [];
    if (total <= 5) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 2) {
        pages.push(1, 2, 3, "...", total);
      } else if (current >= total - 1) {
        pages.push(1, "...", total - 2, total - 1, total);
      } else {
        pages.push(1, "...", current, "...", total);
      }
    }
    return pages;
  };

  return (
    <div
      className={`flex items-center gap-1.5 ${compact ? "scale-90 origin-left" : ""}`}
    >
      <button
        onClick={() => onPageChange(current - 1)}
        disabled={current === 1}
        className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      </button>

      <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-800 p-0.5 rounded-lg border border-gray-200 dark:border-gray-700">
        {getPageNumbers().map((page, idx) =>
          typeof page === "number" ? (
            <button
              key={idx}
              onClick={() => onPageChange(page)}
              className={`w-7 h-7 flex items-center justify-center text-xs font-bold rounded-md transition-all ${
                current === page
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {page}
            </button>
          ) : (
            <span
              key={idx}
              className="w-5 h-7 flex items-center justify-center text-gray-400 text-[10px]"
            >
              ...
            </span>
          ),
        )}
      </div>

      <button
        onClick={() => onPageChange(current + 1)}
        disabled={current === total}
        className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      </button>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
const StyleSummaryMeasurementSection = ({ styleNo }) => {
  const [loading, setLoading] = useState(false);
  const [reportTypes, setReportTypes] = useState([]);
  const [activeReportType, setActiveReportType] = useState("All");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // Data State
  const [specs, setSpecs] = useState(null);
  const [sizeList, setSizeList] = useState([]);
  const [currentReport, setCurrentReport] = useState(null);

  // PDF Generation State
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Fetch Function (Limit is always 1)
  const fetchReportData = async (page, rType) => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-analytics/style-measurement`,
        {
          params: {
            styleNo,
            reportType: rType === "All" ? "" : rType,
            page: page,
            limit: 1, // FETCH ONLY 1 REPORT AT A TIME
          },
        },
      );

      if (res.data.success) {
        const { reportTypes, reports, specs, sizeList, pagination } =
          res.data.data;

        // Update Static Data
        setReportTypes(["All", ...reportTypes]);
        setSpecs(specs);
        setSizeList(sizeList);

        // Update Pagination Info
        setTotalPages(pagination.total);

        // Update Current Report (It's an array, take the first one)
        setCurrentReport(reports.length > 0 ? reports[0] : null);
      }
    } catch (err) {
      console.error("Failed to load measurements", err);
      setCurrentReport(null);
    } finally {
      setLoading(false);
    }
  };

  // 1. Initial Load or Filter Change -> Reset to Page 1
  useEffect(() => {
    setCurrentPage(1);
    fetchReportData(1, activeReportType);
  }, [styleNo, activeReportType]);

  // 2. Handle Page Change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      fetchReportData(newPage, activeReportType);
    }
  };

  // DOWNLOAD HANDLER FUNCTION
  const handleDownloadPDF = async () => {
    if (!styleNo || !specs || !sizeList) return;

    setIsGeneratingPDF(true);

    try {
      // Fetch ALL reports for this style (Limit high number like 1000 to get everything)
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-analytics/style-measurement`,
        {
          params: {
            styleNo,
            reportType: activeReportType === "All" ? "" : activeReportType,
            page: 1,
            limit: 1000, // Fetch All
          },
        },
      );

      if (res.data.success && res.data.data.reports.length > 0) {
        const allReports = res.data.data.reports;

        // Generate Blob
        const blob = await pdf(
          <MeasurementReportPDF
            reports={allReports}
            specs={specs}
            sizeList={sizeList}
            styleNo={styleNo}
          />,
        ).toBlob();

        // Save File
        const timestamp = new Date().toISOString().slice(0, 10);
        saveAs(blob, `Measurement_Reports_${styleNo}_${timestamp}.pdf`);
      }
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  if (!currentReport && !loading) {
    return null;
  }

  return (
    <>
      <div
        id="measurement-section"
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col"
      >
        {/* 1. Header & Controls */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          {/* DESKTOP LAYOUT: Title -> Pagination -> Filters */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-xl shrink-0">
                <Layers className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white leading-tight">
                    Measurement Data
                  </h2>
                  <p className="text-xs text-gray-500">
                    View measurements per report
                  </p>
                </div>
                {/* PDF BUTTON START */}
                <button
                  onClick={handleDownloadPDF}
                  disabled={isGeneratingPDF || !currentReport}
                  className="ml-2 p-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-lg transition-colors border border-gray-200 dark:border-gray-600 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Download All Reports as PDF"
                >
                  {isGeneratingPDF ? (
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                  ) : (
                    <FileDown className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-xs font-bold hidden sm:inline">
                    PDF
                  </span>
                </button>
              </div>
            </div>

            {/* DESKTOP PAGINATION: Hidden on Mobile */}
            <div className="hidden md:block">
              <PaginationBar
                current={currentPage}
                total={totalPages}
                onPageChange={handlePageChange}
              />
            </div>

            {/* Filter Tabs (Responsive) */}
            <div className="w-full md:w-auto flex items-center gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <Filter className="w-3 h-3 text-gray-400 ml-2 shrink-0" />
              <div className="flex-1 grid grid-cols-2 md:flex md:flex-wrap gap-1">
                {reportTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setActiveReportType(type)}
                    className={`px-3 py-1.5 md:py-1 text-[10px] md:text-xs font-bold rounded-md transition-all truncate ${
                      activeReportType === type
                        ? "bg-white dark:bg-gray-600 text-indigo-600 dark:text-indigo-300 shadow-sm"
                        : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* MOBILE PAGINATION: Below Filters */}
          <div className="md:hidden mt-4 flex justify-center">
            <PaginationBar
              current={currentPage}
              total={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        </div>

        {/* 2. Content Body */}
        <div className="p-4 bg-gray-50/50 dark:bg-gray-900/20 flex-1 min-h-[400px]">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center py-20 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin mb-3 text-indigo-500" />
              <p className="text-sm font-medium">
                Loading Page {currentPage}...
              </p>
            </div>
          ) : !currentReport ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800">
              <AlertCircle className="w-10 h-10 mb-2 opacity-50" />
              <p className="text-sm font-bold">No reports found</p>
              <p className="text-xs">Try selecting a different report type</p>
            </div>
          ) : (
            <div className="animate-fadeIn">
              {/* REPORT CARD */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                {/* Card Header Info */}
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 dark:from-gray-700 dark:to-gray-600 p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex flex-wrap items-center gap-4 md:gap-8">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                        Report Type
                      </span>
                      <span className="text-white font-bold text-sm">
                        {currentReport.reportType}
                      </span>
                    </div>
                    <div className="hidden md:block w-px h-8 bg-white/20"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                        Inspection Date
                      </span>
                      <div className="flex items-center gap-1.5 text-white font-bold text-sm">
                        <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                        {new Date(
                          currentReport.inspectionDate,
                        ).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="hidden md:block w-px h-8 bg-white/20"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">
                        QC Inspector
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        {/* QA Photo */}
                        <div className="w-7 h-7 rounded-full bg-gray-700 border border-gray-500 overflow-hidden flex items-center justify-center shrink-0">
                          {currentReport.qaFacePhoto ? (
                            <img
                              src={resolvePhotoUrl(currentReport.qaFacePhoto)}
                              alt="QA"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div className="flex flex-col leading-tight">
                          <span className="text-white font-bold text-sm">
                            {currentReport.qaName}
                          </span>
                          <span className="text-[10px] text-indigo-300 font-mono">
                            ({currentReport.qaId})
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <a
                    href={`/fincheck-reports/view/${currentReport.reportId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors text-xs font-bold shadow-lg shadow-indigo-900/20 whitespace-nowrap"
                  >
                    <FileText className="w-4 h-4" />
                    View Full Report #{currentReport.reportId}
                  </a>
                </div>

                {/* Card Content (Tables) */}
                <div className="p-5">
                  {!currentReport.hasMeasurementData ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400 border border-dashed border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                      <AlertCircle className="w-10 h-10 mb-2 opacity-50" />
                      <p className="text-sm font-bold text-gray-500 dark:text-gray-400">
                        No Digital Measurement Recorded
                      </p>
                      <p className="text-xs mt-1">
                        For Report #{currentReport.reportId}
                      </p>
                    </div>
                  ) : (
                    <div>
                      {currentReport.measurementGroups.map((group, gIdx) => (
                        <div key={gIdx} className="mb-8 last:mb-0">
                          {/* Config Header */}
                          <div className="flex items-center gap-3 mb-3">
                            <div className="h-6 w-1 bg-indigo-500 rounded-full"></div>
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white uppercase tracking-tight">
                              {/* 1. Config Info */}
                              {[
                                group.config.line,
                                group.config.table,
                                group.config.color,
                              ]
                                .filter(Boolean)
                                .join(" / ") || "General Config"}
                              {/* 2. Display K Value if Stage is 'Before' and kValue exists */}
                              {group.stage === "Before" && group.kValue && (
                                <span className="ml-2 text-indigo-600 dark:text-indigo-400 font-bold">
                                  (K: {group.kValue})
                                </span>
                              )}
                            </h3>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded font-bold text-white shadow-sm ${group.stage === "Before" ? "bg-purple-500" : "bg-teal-500"}`}
                            >
                              {group.stageLabel}
                            </span>
                          </div>

                          {/* Config Table */}
                          <MeasurementGroupTable
                            group={group}
                            specsData={specs}
                            sizeList={sizeList}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* 8. ADD PROCESSING MODAL HERE */}
      {isGeneratingPDF && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl max-w-sm w-full flex flex-col items-center text-center">
            <div className="relative mb-4">
              {/* Spinner Animation */}
              <div className="w-16 h-16 border-4 border-indigo-100 dark:border-indigo-900/50 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <FileDown className="absolute inset-0 m-auto w-6 h-6 text-indigo-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1">
              Generating PDF...
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Fetching all measurement data and compiling tables. This may take
              a moment.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default StyleSummaryMeasurementSection;
