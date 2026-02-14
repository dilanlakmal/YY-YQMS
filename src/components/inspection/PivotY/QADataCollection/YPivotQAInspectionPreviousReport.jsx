import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import {
  Search,
  Calendar,
  Filter,
  Download,
  Loader2,
  FileText,
  User,
  Hash,
  RefreshCw,
  QrCode
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

// =============================================================================
// Helper: Filter Input Component
// =============================================================================
const FilterInput = ({ label, icon: Icon, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
      <Icon className="w-3.5 h-3.5" />
      {label}
    </label>
    {children}
  </div>
);

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const YPivotQAInspectionPreviousReport = ({ user }) => {
  // --- State ---
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);

  // Filters
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [orderSearch, setOrderSearch] = useState("");
  const [selectedReportType, setSelectedReportType] = useState("All");
  const [filterEmpId, setFilterEmpId] = useState(user?.emp_id || "");

  // QR Download State
  const [downloadingId, setDownloadingId] = useState(null); // Report ID being processed
  const hiddenQrRef = useRef(null);

  // --- Fetch Data ---
  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
        empId: filterEmpId,
        orderNo: orderSearch,
        reportType: selectedReportType === "All" ? "" : selectedReportType
      });

      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-inspection/previous-reports?${params}`
      );

      if (res.data.success) {
        setReports(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initial Load & Filter Changes
  useEffect(() => {
    // Debounce search slightly to avoid too many calls on typing order no
    const timer = setTimeout(() => {
      fetchReports();
    }, 400);
    return () => clearTimeout(timer);
  }, [startDate, endDate, orderSearch, selectedReportType, filterEmpId]);

  // --- Cross-Filtering Logic (Derived Data) ---
  const availableOptions = useMemo(() => {
    const types = new Set(["All"]);
    const orders = new Set();

    reports.forEach((r) => {
      if (r.reportType) types.add(r.reportType);
      if (r.orderNosString) orders.add(r.orderNosString);
    });

    return {
      reportTypes: Array.from(types),
      orders: Array.from(orders).slice(0, 50) // Limit to 50 suggestions
    };
  }, [reports]);

  // --- QR Download Logic ---
  // 1. User Clicks Download -> Set downloadingId -> Hidden QR Renders
  // 2. useEffect watches downloadingId -> Draws High Res Image -> Downloads -> Clears ID

  const handleDownloadClick = (report) => {
    setDownloadingId(report);
  };

  useEffect(() => {
    if (downloadingId && hiddenQrRef.current) {
      // Give React a moment to render the canvas in the hidden div
      const timer = setTimeout(() => {
        generateHighResImage(downloadingId);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [downloadingId]);

  const generateHighResImage = (report) => {
    const sourceCanvas = hiddenQrRef.current.querySelector("canvas");
    if (!sourceCanvas) {
      setDownloadingId(null);
      return;
    }

    const qrImageURI = sourceCanvas.toDataURL("image/png");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    // Dimensions
    const width = 1200;
    const height = 1600;
    canvas.width = width;
    canvas.height = height;

    // Draw Background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, width, height);

    // Draw Header
    ctx.fillStyle = "#4F46E5";
    ctx.fillRect(0, 0, width, 250);

    // Draw Title
    ctx.textAlign = "center";
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 60px sans-serif";
    ctx.fillText("FIN CHECK INSPECTION", width / 2, 120);
    ctx.font = "40px sans-serif";
    ctx.fillText("QUALITY REPORT", width / 2, 190);

    // Draw Report ID
    ctx.fillStyle = "#111827";
    ctx.font = "bold 100px monospace";
    ctx.fillText(report.reportId, width / 2, 400);
    ctx.font = "30px sans-serif";
    ctx.fillStyle = "#9CA3AF";
    ctx.fillText("REPORT ID", width / 2, 450);

    // Load QR Image
    const img = new Image();
    img.onload = () => {
      const qrSize = 500;
      ctx.drawImage(img, (width - qrSize) / 2, 500, qrSize, qrSize);

      // Data Table
      const startY = 1100;
      const startX = 150;
      const rowHeight = 80;
      const labelWidth = 300;

      const formattedDate = new Date(
        report.inspectionDate
      ).toLocaleDateString();
      const formattedOrders = report.orderNosString || "";

      ctx.textAlign = "left";

      const drawRow = (label, value, y) => {
        ctx.font = "bold 40px sans-serif";
        ctx.fillStyle = "#6B7280";
        ctx.fillText(label, startX, y);
        ctx.font = "bold 40px sans-serif";
        ctx.fillStyle = "#1F2937";
        ctx.fillText(value, startX + labelWidth, y);

        // Line
        ctx.beginPath();
        ctx.moveTo(startX, y + 20);
        ctx.lineTo(width - startX, y + 20);
        ctx.strokeStyle = "#E5E7EB";
        ctx.lineWidth = 2;
        ctx.stroke();
      };

      drawRow("Date:", formattedDate, startY);
      drawRow("Inspector:", report.empId, startY + rowHeight);
      drawRow("Insp. Type:", report.inspectionType, startY + rowHeight * 2);
      drawRow("Report:", report.reportType, startY + rowHeight * 3);

      // Order Row (Custom for length)
      const orderY = startY + rowHeight * 4;
      ctx.fillStyle = "#6B7280";
      ctx.fillText("Order(s):", startX, orderY);
      ctx.fillStyle = "#4F46E5";

      let orderText = formattedOrders;
      const maxW = width - (startX + labelWidth) - 50;
      if (ctx.measureText(orderText).width > maxW) {
        // Simple truncation
        while (
          ctx.measureText(orderText + "...").width > maxW &&
          orderText.length > 0
        ) {
          orderText = orderText.slice(0, -1);
        }
        orderText += "...";
      }
      ctx.fillText(orderText, startX + labelWidth, orderY);

      // Footer
      ctx.textAlign = "center";
      ctx.font = "italic 30px sans-serif";
      ctx.fillStyle = "#9CA3AF";
      ctx.fillText("Generated by YQMS System", width / 2, height - 50);

      // Download
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `Inspection_${report.reportId}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      setDownloadingId(null); // Reset
    };
    img.src = qrImageURI;
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* --- Filter Pane --- */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100 dark:border-gray-700">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
            <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h2 className="text-sm font-bold text-gray-800 dark:text-white">
            Filter Previous Reports
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Start Date */}
          <FilterInput label="Start Date" icon={Calendar}>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </FilterInput>

          {/* End Date */}
          <FilterInput label="End Date" icon={Calendar}>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            />
          </FilterInput>

          {/* Order No (Search) */}
          <FilterInput label="Order No" icon={Hash}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search Order..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
              />
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </div>
          </FilterInput>

          {/* Report Type (Dropdown) */}
          <FilterInput label="Report Name" icon={FileText}>
            <select
              value={selectedReportType}
              onChange={(e) => setSelectedReportType(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
            >
              {availableOptions.reportTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </FilterInput>

          {/* Emp ID (Auto-filled but editable) */}
          <FilterInput label="Inspector ID" icon={User}>
            <input
              type="text"
              value={filterEmpId}
              readOnly={true}
              className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-xs font-medium text-gray-500 cursor-not-allowed select-none"
            />
          </FilterInput>
        </div>
      </div>

      {/* --- Results Table --- */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-gray-800 to-gray-900 px-4 py-3 flex justify-between items-center">
          <h3 className="text-white font-bold text-sm flex items-center gap-2">
            <Search className="w-4 h-4" />
            Search Results
          </h3>
          <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-lg">
            {reports.length} Found
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase font-bold border-b border-gray-200 dark:border-gray-600">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">QA ID</th>
                <th className="px-4 py-3">Report Name</th>
                <th className="px-4 py-3">Order No(s)</th>
                <th className="px-4 py-3">Report ID</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mx-auto" />
                    <p className="mt-2 text-gray-500">Searching...</p>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    No reports found matching criteria.
                  </td>
                </tr>
              ) : (
                reports.map((report) => (
                  <tr
                    key={report.reportId}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                      {new Date(report.inspectionDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">
                      {report.empId}
                    </td>
                    <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400 font-bold">
                      {report.reportType}
                    </td>
                    <td
                      className="px-4 py-3 text-gray-800 dark:text-gray-200 max-w-[200px] truncate"
                      title={report.orderNosString}
                    >
                      {report.orderNosString}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-gray-800 dark:text-gray-200">
                      {report.reportId}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDownloadClick(report)}
                        disabled={downloadingId?.reportId === report.reportId}
                        className={`inline-flex items-center justify-center p-2 rounded-lg transition-all shadow-sm ${
                          downloadingId?.reportId === report.reportId
                            ? "bg-gray-200 text-gray-400 cursor-wait"
                            : "bg-indigo-100 hover:bg-indigo-200 text-indigo-600"
                        }`}
                        title="Download QR"
                      >
                        {downloadingId?.reportId === report.reportId ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Hidden QR Generator (Renders off-screen) --- */}
      <div
        ref={hiddenQrRef}
        style={{
          position: "absolute",
          top: "-9999px",
          left: "-9999px",
          visibility: "hidden"
        }}
      >
        {downloadingId && (
          <QRCodeCanvas
            value={String(downloadingId.reportId)}
            size={500} // Render large for quality
            level={"H"}
            includeMargin={true}
          />
        )}
      </div>

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

export default YPivotQAInspectionPreviousReport;
