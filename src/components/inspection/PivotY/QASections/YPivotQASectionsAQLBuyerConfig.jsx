import axios from "axios";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle,
  Edit3,
  Info,
  Layers,
  Save,
  Search,
  Settings,
  ShieldAlert,
  RefreshCw
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";

const YPivotQASectionsAQLBuyerConfig = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Raw Data
  const [buyers, setBuyers] = useState([]);
  const [existingConfigs, setExistingConfigs] = useState([]);
  const [aqlLevels, setAqlLevels] = useState([]);

  // UI State for the Configuration Table
  const [buyerConfigs, setBuyerConfigs] = useState({});
  const [filter, setFilter] = useState("");

  // --- 1. Initial Data Fetching ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [buyersRes, valuesRes, configsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/qa-sections-buyers`),
          axios.get(`${API_BASE_URL}/api/qa-sections/aql-values/get`),
          axios.get(`${API_BASE_URL}/api/qa-sections/aql-buyer-config/get`)
        ]);

        setBuyers(buyersRes.data.data);
        setExistingConfigs(configsRes.data.data);

        // Extract unique AQL Levels for dropdowns (0.01 to 10)
        if (valuesRes.data.length > 0) {
          const levels = valuesRes.data[0].AQLData.map((d) => d.AQLLevel).sort(
            (a, b) => a - b
          );
          setAqlLevels(levels);
        }

        // Initialize local state with existing configs or defaults
        const initialConfigState = {};
        buyersRes.data.data.forEach((buyer) => {
          // Find existing configs for this buyer
          const buyerRecords = configsRes.data.data.filter(
            (c) => c.Buyer === buyer.buyer
          );

          const minorRec = buyerRecords.find((c) => c.Status === "Minor");
          const majorRec = buyerRecords.find((c) => c.Status === "Major");
          const criticalRec = buyerRecords.find((c) => c.Status === "Critical");

          // Use existing or Defaults: General, II, Minor=1, Major=1, Critical=0.01
          initialConfigState[buyer.buyer] = {
            InspectionType: minorRec?.InspectionType || "General",
            Level: minorRec?.Level || "II",
            MinorAQL: minorRec?.AQLLevel || 1,
            MajorAQL: majorRec?.AQLLevel || 1,
            CriticalAQL: criticalRec?.AQLLevel || 0.01,
            isModified: false
          };
        });
        setBuyerConfigs(initialConfigState);
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to load initial data", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // --- 2. Handlers ---

  const handleConfigChange = (buyerName, field, value) => {
    setBuyerConfigs((prev) => ({
      ...prev,
      [buyerName]: {
        ...prev[buyerName],
        [field]: value,
        isModified: true
      }
    }));
  };

  const handleSave = async (buyerName) => {
    const config = buyerConfigs[buyerName];
    if (!config) return;

    const payload = [
      {
        Buyer: buyerName,
        InspectionType: config.InspectionType,
        Level: config.Level,
        Status: "Minor",
        AQLLevel: Number(config.MinorAQL)
      },
      {
        Buyer: buyerName,
        InspectionType: config.InspectionType,
        Level: config.Level,
        Status: "Major",
        AQLLevel: Number(config.MajorAQL)
      },
      {
        Buyer: buyerName,
        InspectionType: config.InspectionType,
        Level: config.Level,
        Status: "Critical",
        AQLLevel: Number(config.CriticalAQL)
      }
    ];

    setSaving(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/qa-sections/aql-buyer-config/upsert`,
        payload
      );

      if (res.data.success) {
        // Update existingConfigs locally to reflect changes in bottom table immediately
        const newConfigs = res.data.data;
        setExistingConfigs((prev) => {
          // Remove old records for this buyer
          const filtered = prev.filter((c) => c.Buyer !== buyerName);
          return [...filtered, ...newConfigs];
        });

        // Reset modified flag
        setBuyerConfigs((prev) => ({
          ...prev,
          [buyerName]: { ...prev[buyerName], isModified: false }
        }));

        Swal.fire({
          icon: "success",
          title: "Saved!",
          text: `AQL Configuration for ${buyerName} updated successfully.`,
          timer: 1500,
          showConfirmButton: false
        });
      }
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to save configuration",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  // --- 3. Derived Data for Tables ---

  const filteredBuyers = useMemo(() => {
    return buyers.filter((b) =>
      b.buyer.toLowerCase().includes(filter.toLowerCase())
    );
  }, [buyers, filter]);

  // Helper to group existing config data for the detailed view
  const getDetailedTableData = (buyerName) => {
    const records = existingConfigs.filter((c) => c.Buyer === buyerName);
    if (records.length === 0) return null;

    // Assuming all 3 status records have same batch structure (which they should if created correctly)
    // We use Minor record as base for iteration
    const minorRec = records.find((c) => c.Status === "Minor");
    const majorRec = records.find((c) => c.Status === "Major");
    const criticalRec = records.find((c) => c.Status === "Critical");

    if (!minorRec || !minorRec.SampleData) return null;

    return minorRec.SampleData.map((item, index) => {
      const majItem = majorRec?.SampleData[index];
      const critItem = criticalRec?.SampleData[index];

      return {
        BatchName: item.BatchName,
        Min: item.Min,
        Max: item.Max,
        SampleLetter: item.SampleLetter,
        SampleSize: item.SampleSize,
        Minor: { AQL: minorRec.AQLLevel, Ac: item.Ac, Re: item.Re },
        Major: { AQL: majorRec?.AQLLevel, Ac: majItem?.Ac, Re: majItem?.Re },
        Critical: {
          AQL: criticalRec?.AQLLevel,
          Ac: critItem?.Ac,
          Re: critItem?.Re
        }
      };
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-500 font-medium">Loading Configurations...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* ==========================================
          SECTION 1: CONFIGURATION TABLE
      ========================================== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Settings size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  AQL Buyer Configuration
                </h2>
                <p className="text-blue-100 text-xs">
                  Set inspection standards per buyer
                </p>
              </div>
            </div>
            <div className="relative w-full md:max-w-xs">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-200"
              />
              <input
                type="text"
                placeholder="Search Buyer..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder-blue-200 focus:outline-none focus:bg-white/20 transition-colors"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600 dark:text-gray-300">
                  Buyer
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600 dark:text-gray-300">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-gray-600 dark:text-gray-300">
                  Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-yellow-600 dark:text-yellow-400">
                  Minor AQL
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-orange-600 dark:text-orange-400">
                  Major AQL
                </th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase text-red-600 dark:text-red-400">
                  Critical AQL
                </th>
                <th className="px-4 py-3 text-center text-xs font-bold uppercase text-gray-600 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {filteredBuyers.map((buyer) => {
                const config = buyerConfigs[buyer.buyer] || {};
                return (
                  <tr
                    key={buyer._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-800 dark:text-gray-200">
                        {buyer.buyer}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={config.InspectionType}
                        onChange={(e) =>
                          handleConfigChange(
                            buyer.buyer,
                            "InspectionType",
                            e.target.value
                          )
                        }
                        className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5"
                      >
                        <option value="General">General</option>
                        <option value="Special">Special</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={config.Level}
                        onChange={(e) =>
                          handleConfigChange(
                            buyer.buyer,
                            "Level",
                            e.target.value
                          )
                        }
                        className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1.5"
                      >
                        {config.InspectionType === "General" ? (
                          <>
                            <option value="I">I</option>
                            <option value="II">II</option>
                            <option value="III">III</option>
                          </>
                        ) : (
                          <>
                            <option value="S-1">S-1</option>
                            <option value="S-2">S-2</option>
                            <option value="S-3">S-3</option>
                            <option value="S-4">S-4</option>
                          </>
                        )}
                      </select>
                    </td>
                    {/* AQL Selects */}
                    {["MinorAQL", "MajorAQL", "CriticalAQL"].map(
                      (field, idx) => {
                        const colors = [
                          "border-yellow-300 focus:border-yellow-500",
                          "border-orange-300 focus:border-orange-500",
                          "border-red-300 focus:border-red-500"
                        ];
                        return (
                          <td key={field} className="px-4 py-3">
                            <select
                              value={config[field]}
                              onChange={(e) =>
                                handleConfigChange(
                                  buyer.buyer,
                                  field,
                                  e.target.value
                                )
                              }
                              className={`bg-gray-50 dark:bg-gray-700 border ${colors[idx]} text-gray-900 dark:text-white text-sm rounded-lg focus:ring-1 block w-full p-1.5 font-medium`}
                            >
                              {aqlLevels.map((lvl) => (
                                <option key={lvl} value={lvl}>
                                  {lvl}
                                </option>
                              ))}
                            </select>
                          </td>
                        );
                      }
                    )}

                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleSave(buyer.buyer)}
                        disabled={!config.isModified || saving}
                        className={`p-2 rounded-lg shadow-sm transition-all duration-200 flex items-center gap-1 mx-auto ${
                          config.isModified
                            ? "bg-green-600 hover:bg-green-700 text-white transform hover:scale-105"
                            : "bg-gray-200 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        {saving ? (
                          <RefreshCw size={16} className="animate-spin" />
                        ) : (
                          <Save size={16} />
                        )}
                        <span className="text-xs font-bold">Save</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ==========================================
          SECTION 2: DETAILED RESULT TABLES
      ========================================== */}
      {filteredBuyers.map((buyer) => {
        const detailData = getDetailedTableData(buyer.buyer);
        if (!detailData) return null; // Don't render if no saved config

        return (
          <div
            key={`detail-${buyer.buyer}`}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-fadeIn"
          >
            <div className="bg-gray-100 dark:bg-gray-900 px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-500 text-white text-xs font-bold px-2 py-1 rounded">
                  {buyer.buyer}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs font-mono">
                    Type: {buyerConfigs[buyer.buyer]?.InspectionType}
                  </span>
                  <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs font-mono">
                    Level: {buyerConfigs[buyer.buyer]?.Level}
                  </span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-b border-gray-300 dark:border-gray-600">
                    <th
                      rowSpan="2"
                      className="px-3 py-2 text-left font-bold border-r border-gray-200"
                    >
                      Batch Range
                    </th>
                    <th
                      rowSpan="2"
                      className="px-3 py-2 text-center font-bold border-r border-gray-200"
                    >
                      Code
                    </th>
                    <th
                      rowSpan="2"
                      className="px-3 py-2 text-center font-bold border-r border-gray-200"
                    >
                      Size
                    </th>

                    {/* Critical Header */}
                    <th
                      colSpan="2"
                      className="px-2 py-1 text-center font-bold text-red-600 bg-red-50 dark:bg-red-900/20 border-r border-red-200"
                    >
                      Critical (AQL {detailData[0].Critical.AQL})
                    </th>
                    {/* Major Header */}
                    <th
                      colSpan="2"
                      className="px-2 py-1 text-center font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 border-r border-orange-200"
                    >
                      Major (AQL {detailData[0].Major.AQL})
                    </th>
                    {/* Minor Header */}
                    <th
                      colSpan="2"
                      className="px-2 py-1 text-center font-bold text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20"
                    >
                      Minor (AQL {detailData[0].Minor.AQL})
                    </th>
                  </tr>
                  <tr className="bg-gray-100 dark:bg-gray-600 text-xs">
                    <th className="px-2 py-1 text-center border-r border-gray-200 text-red-600">
                      Ac
                    </th>
                    <th className="px-2 py-1 text-center border-r border-gray-200 text-red-600">
                      Re
                    </th>
                    <th className="px-2 py-1 text-center border-r border-gray-200 text-orange-600">
                      Ac
                    </th>
                    <th className="px-2 py-1 text-center border-r border-gray-200 text-orange-600">
                      Re
                    </th>
                    <th className="px-2 py-1 text-center border-r border-gray-200 text-yellow-600">
                      Ac
                    </th>
                    <th className="px-2 py-1 text-center text-yellow-600">
                      Re
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {detailData.map((row, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-3 py-2 font-medium border-r border-gray-200 dark:border-gray-700">
                        {row.BatchName}
                      </td>
                      <td className="px-3 py-2 text-center bg-gray-50 dark:bg-gray-500 border-r border-gray-200 font-mono">
                        {row.SampleLetter}
                      </td>
                      <td className="px-3 py-2 text-center border-r border-gray-200 font-bold">
                        {row.SampleSize}
                      </td>

                      {/* Critical Values */}
                      <td className="px-2 py-2 text-center font-bold text-red-600 bg-red-50/50 dark:bg-red-300 border-r border-red-100">
                        {row.Critical.Ac}
                      </td>
                      <td className="px-2 py-2 text-center font-bold text-red-600 bg-red-50/50 dark:bg-red-300 border-r border-gray-200">
                        {row.Critical.Re}
                      </td>

                      {/* Major Values */}
                      <td className="px-2 py-2 text-center font-bold text-orange-600 bg-orange-50/50 dark:bg-orange-300 border-r border-orange-100">
                        {row.Major.Ac}
                      </td>
                      <td className="px-2 py-2 text-center font-bold text-orange-600 bg-orange-50/50 dark:bg-orange-300 border-r border-gray-200">
                        {row.Major.Re}
                      </td>

                      {/* Minor Values */}
                      <td className="px-2 py-2 text-center font-bold text-yellow-600 dark:text-yellow-100 bg-yellow-50/50 dark:bg-yellow-700 border-r border-yellow-100">
                        {row.Minor.Ac}
                      </td>
                      <td className="px-2 py-2 text-center font-bold text-yellow-600 dark:text-yellow-100 bg-yellow-50/50 dark:bg-yellow-700">
                        {row.Minor.Re}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default YPivotQASectionsAQLBuyerConfig;
