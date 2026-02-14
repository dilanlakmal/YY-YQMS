import { useState, useMemo } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config.js";
import FilterPlane from "../components/inspection/Measurement/FilterPlane.jsx";
import MeasurementSheet from "../components/inspection/Measurement/MeasurementSheet.jsx";
import { Printer, AlertTriangle, Loader } from "lucide-react";

const Measurement = () => {
  const [measurementData, setMeasurementData] = useState(null);
  const [filterCriteria, setFilterCriteria] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFilter = async (criteria) => {
    setLoading(true);
    setError("");
    setFilterCriteria(criteria);
    setMeasurementData(null);

    try {
      const measurementUrl = `${API_BASE_URL}/api/measurement-v2/${criteria.styleNo}?washType=${criteria.washType}`;
      const measurementResponse = await axios.get(measurementUrl);
      setMeasurementData(measurementResponse.data || null);
    } catch (err) {
      console.error("Error fetching measurement data:", err);
      setError(
        err.response?.data?.message ||
          "Failed to fetch data. Please try again.",
      );
      setMeasurementData(null);
    } finally {
      setLoading(false);
    }
  };

  const enhancedFilterCriteria = useMemo(() => {
    if (!filterCriteria || !measurementData) return null;

    return {
      ...filterCriteria,
      customer: measurementData.customer || "",
      custStyle: measurementData.custStyle || "",
      totalQty: measurementData.totalQty || "",
      sizes: measurementData.sizes || [],
    };
  }, [filterCriteria, measurementData]);

  return (
    <div className="animate-fadeIn bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg transition-colors duration-300">
      {/* --- Header --- */}
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
          <Printer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Measurement Reports
        </h2>
      </div>

      {/* --- Filter Section --- */}
      <div className="mb-6 bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
        <FilterPlane onFilter={handleFilter} loading={loading} />
      </div>

      {/* --- Loading State --- */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
          <Loader className="w-8 h-8 animate-spin mb-2 text-indigo-600 dark:text-indigo-400" />
          <span className="font-medium">Loading measurement data...</span>
        </div>
      )}

      {/* --- Error State --- */}
      {error && (
        <div className="mb-6 flex items-center p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg animate-fadeIn">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {/* --- Results Section --- */}
      {!loading && enhancedFilterCriteria && filterCriteria && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <MeasurementSheet
            data={measurementData?.measurements}
            filterCriteria={enhancedFilterCriteria}
          />
        </div>
      )}
    </div>
  );
};

export default Measurement;
