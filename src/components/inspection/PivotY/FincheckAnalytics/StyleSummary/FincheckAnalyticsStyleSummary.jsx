import React, { useState, useEffect } from "react";
import axios from "axios";
import { Search, Loader2, Package, X, CheckCircle2 } from "lucide-react";
import { API_BASE_URL } from "../../../../../../config";

// Sub-components
import StyleSummaryCards from "./StyleSummaryCards";
import StyleSummaryTable from "./StyleSummaryTable";
import StyleSummaryPieChart from "./StyleSummaryPieChart";
import DailyInspectionStyleTrendChart from "./DailyInspectionStyleTrendChart";
import StyleSummaryLocationDefectMap from "./StyleSummaryLocationDefectMap";
import StyleSummaryMeasurementSection from "./StyleSummaryMeasurementSection";
import StyleMeasurementFinalConclusion from "./StyleMeasurementFinalConclusion";
import StyleSummaryFinalMeasurementPointCalc from "./StyleSummaryFinalMeasurementPointCalc";

const FincheckAnalyticsStyleSummary = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [styleOptions, setStyleOptions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // State for the selected object
  const [selectedStyle, setSelectedStyle] = useState(null);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  // 1. Fetch Style Options (On Mount)
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-analytics/style-summary`,
        );
        if (res.data.success) {
          setStyleOptions(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load styles", err);
      }
    };
    fetchOptions();
  }, []);

  // 2. Filter Options based on search
  const filteredOptions = styleOptions
    .filter(
      (opt) =>
        opt.style.toLowerCase().includes(searchTerm.toLowerCase()) ||
        opt.custStyle?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    .slice(0, 10);

  // 3. Handle Select
  const handleSelectStyle = async (styleObj) => {
    setSelectedStyle(styleObj); // <--- Now using this state
    setSearchTerm(styleObj.style);
    setShowDropdown(false);
    setLoading(true);

    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-analytics/style-summary`,
        { params: { styleNo: styleObj.style } },
      );
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load style details", err);
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Clear
  const handleClearSelection = () => {
    setSelectedStyle(null);
    setSearchTerm("");
    setData(null);
    // Optionally focus the input again here if using a ref
  };

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      {/* 
          1. SEARCH BAR CONTAINER 
          - Added 'sticky top-0' to keep it visible while scrolling
          - Added 'z-[60]' to stay above table headers (z-50)
          - Added solid background to prevent transparency overlap
      */}
      <div className="sticky top-0 z-[60] bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm p-4 -mx-4 px-4 border-b border-gray-200 dark:border-gray-800 transition-all">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-2 relative">
          {selectedStyle ? (
            // --- SELECTED STATE VIEW ---
            <div className="flex items-center justify-between px-3 py-2 animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-white leading-tight">
                    {selectedStyle.style}
                  </p>
                  <p className="text-xs text-gray-500">
                    {selectedStyle.custStyle} • {selectedStyle.buyer}
                  </p>
                </div>
              </div>

              <button
                onClick={handleClearSelection}
                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                title="Clear Selection"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            // --- INPUT STATE VIEW ---
            <div className="flex items-center gap-3 px-2">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Search Style No or Customer Style..."
                  className="w-full pl-9 pr-4 py-2 bg-transparent text-sm text-gray-800 dark:text-white font-medium placeholder-gray-400 focus:outline-none"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowDropdown(true);
                  }}
                  onFocus={() => setShowDropdown(true)}
                />
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* DROPDOWN (Only visible in Input State) */}
          {!selectedStyle && showDropdown && searchTerm.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto animate-fadeIn z-[70]">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSelectStyle(opt)}
                    className="w-full text-left px-4 py-3 hover:bg-purple-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors group"
                  >
                    <p className="font-bold text-gray-800 dark:text-gray-200 group-hover:text-purple-700 dark:group-hover:text-purple-400">
                      {opt.style}
                    </p>
                    <p className="text-xs text-gray-500">
                      {opt.custStyle} • {opt.buyer}
                    </p>
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-gray-400 text-center italic">
                  No styles found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Content Area */}
      {loading ? (
        <div className="h-96 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="w-10 h-10 animate-spin mb-3 text-purple-500" />
          <p className="text-sm font-medium">Loading Style Analytics...</p>
        </div>
      ) : !data ? (
        <div className="h-96 flex flex-col items-center justify-center text-gray-300 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
          <Package className="w-16 h-16 mb-4 opacity-30" />
          <p className="text-lg font-medium">
            Select a style to view analytics
          </p>
        </div>
      ) : (
        <div className="animate-fadeIn space-y-6">
          <StyleSummaryCards data={data} />
          <StyleSummaryTable
            reportsByType={data.reportsByType}
            defectsList={data.defectsList}
          />
          <StyleSummaryPieChart defectsList={data.defectsList} />
          <DailyInspectionStyleTrendChart styleNo={selectedStyle.style} />
          <StyleSummaryLocationDefectMap styleNo={selectedStyle.style} />
          <StyleSummaryMeasurementSection styleNo={selectedStyle.style} />
          <StyleMeasurementFinalConclusion styleNo={selectedStyle.style} />
          <StyleSummaryFinalMeasurementPointCalc
            styleNo={selectedStyle.style}
          />
        </div>
      )}
    </div>
  );
};

export default FincheckAnalyticsStyleSummary;
