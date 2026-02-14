import axios from "axios";
import {
  Save,
  Loader2,
  Search,
  AlertCircle,
  CheckSquare,
  Grid3x3,
  FileText,
  Tag,
  TrendingUp,
  Database,
  Filter as FilterIcon,
  X,
  Ban // Added Icon for visual feedback
} from "lucide-react";
import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";

const YPivotQASectionsBuyerStatusManagement = () => {
  const [defects, setDefects] = useState([]);
  const [buyers, setBuyers] = useState([]);
  // New State for Disabled Configs
  const [disabledConfigs, setDisabledConfigs] = useState({});

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Filter state
  const [filters, setFilters] = useState({
    code: "",
    english: "",
    CategoryNameEng: ""
  });

  // Initial data fetch
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Added the 3rd API call to get AQL Configs
        const [defectsRes, buyersRes, configRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/api/qa-sections-defect-list`),
          axios.get(`${API_BASE_URL}/api/qa-sections-buyers`),
          axios.get(`${API_BASE_URL}/api/qa-sections/aql-buyer-config/get`)
        ]);

        const sortedDefects = (defectsRes.data.data || []).sort((a, b) => {
          const partsA = a.code.split(".").map(Number);
          const partsB = b.code.split(".").map(Number);
          if (partsA[0] !== partsB[0]) return partsA[0] - partsB[0];
          return (partsA[1] || 0) - (partsB[1] || 0);
        });

        setDefects(sortedDefects);
        setBuyers(
          (buyersRes.data.data || []).sort((a, b) =>
            a.buyer.localeCompare(b.buyer)
          )
        );

        // --- PROCESS AQL CONFIGS ---
        // Create a map:
        const disabledMap = {};
        if (configRes.data && configRes.data.data) {
          configRes.data.data.forEach((conf) => {
            // Check if AQLLevel is 0.01 (Use fuzzy comparison for floats if needed, but exact match is usually fine here)
            if (conf.AQLLevel === 0.01 && conf.Status === "Minor") {
              if (!disabledMap[conf.Buyer]) {
                disabledMap[conf.Buyer] = [];
              }
              disabledMap[conf.Buyer].push(conf.Status);
            }
          });
        }
        setDisabledConfigs(disabledMap);
      } catch (error) {
        console.error(error);
        Swal.fire("Error", "Failed to load initial data.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredDefects = useMemo(() => {
    return defects.filter((defect) => {
      const filterCode = filters.code.toLowerCase();
      const filterEnglish = filters.english.toLowerCase();
      const filterCategory = filters.CategoryNameEng.toLowerCase();
      return (
        (filterCode ? defect.code.toLowerCase().includes(filterCode) : true) &&
        (filterEnglish
          ? defect.english.toLowerCase().includes(filterEnglish)
          : true) &&
        (filterCategory
          ? defect.CategoryNameEng.toLowerCase().includes(filterCategory)
          : true)
      );
    });
  }, [defects, filters]);

  // Calculate statistics
  const stats = useMemo(() => {
    let totalAssignments = 0;
    let criticalCount = 0;
    let majorCount = 0;
    let minorCount = 0;

    defects.forEach((defect) => {
      defect.statusByBuyer?.forEach((status) => {
        totalAssignments += status.defectStatus.length;
        if (status.defectStatus.includes("Critical")) criticalCount++;
        if (status.defectStatus.includes("Major")) majorCount++;
        if (status.defectStatus.includes("Minor")) minorCount++;
      });
    });

    return { totalAssignments, criticalCount, majorCount, minorCount };
  }, [defects]);

  // Handle changes to checkboxes (Status) - IMMUTABLE UPDATE
  const handleStatusChange = (defectId, buyerName, status) => {
    // Double check logic: prevent change if disabled config exists
    if (disabledConfigs[buyerName]?.includes(status)) {
      return; // Do nothing if disabled
    }

    setHasChanges(true);
    setDefects((prevDefects) =>
      prevDefects.map((defect) => {
        if (defect._id !== defectId) return defect;

        const existingBuyerStatus = defect.statusByBuyer.find(
          (b) => b.buyerName === buyerName
        );
        let newStatusByBuyer;

        if (existingBuyerStatus) {
          newStatusByBuyer = defect.statusByBuyer.map((bs) => {
            if (bs.buyerName !== buyerName) return bs;

            const newDefectStatus = bs.defectStatus.includes(status)
              ? bs.defectStatus.filter((s) => s !== status)
              : [...bs.defectStatus, status];

            return { ...bs, defectStatus: newDefectStatus };
          });
        } else {
          newStatusByBuyer = [
            ...defect.statusByBuyer,
            { buyerName, defectStatus: [status], commonStatus: "" }
          ];
        }
        return { ...defect, statusByBuyer: newStatusByBuyer };
      })
    );
  };

  // Handle changes to dropdown (Common) - IMMUTABLE UPDATE
  const handleCommonChange = (defectId, buyerName, value) => {
    setHasChanges(true);
    setDefects((prevDefects) =>
      prevDefects.map((defect) => {
        if (defect._id !== defectId) return defect;

        const existingBuyerStatus = defect.statusByBuyer.find(
          (b) => b.buyerName === buyerName
        );
        let newStatusByBuyer;

        if (existingBuyerStatus) {
          newStatusByBuyer = defect.statusByBuyer.map((bs) =>
            bs.buyerName === buyerName ? { ...bs, commonStatus: value } : bs
          );
        } else {
          newStatusByBuyer = [
            ...defect.statusByBuyer,
            { buyerName, defectStatus: [], commonStatus: value }
          ];
        }
        return { ...defect, statusByBuyer: newStatusByBuyer };
      })
    );
  };

  const handleBulkUpdate = async () => {
    setIsSaving(true);
    try {
      const updates = defects.map((defect) => ({
        defectId: defect._id,
        statusByBuyer: defect.statusByBuyer.map(
          ({ buyerName, defectStatus, commonStatus }) => ({
            buyerName,
            defectStatus,
            commonStatus
          })
        )
      }));

      await axios.put(
        `${API_BASE_URL}/api/qa-sections-defect-list/bulk-update/status-by-buyer`,
        updates
      );

      Swal.fire({
        icon: "success",
        title: "Success!",
        text: "All changes have been saved.",
        timer: 2000,
        showConfirmButton: false
      });
      setHasChanges(false);
    } catch (error) {
      Swal.fire("Error", "Failed to save changes.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const clearAllFilters = () => {
    setFilters({ code: "", english: "", CategoryNameEng: "" });
  };

  const hasActiveFilters =
    filters.code || filters.english || filters.CategoryNameEng;

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-lg backdrop-blur-sm">
                <CheckSquare size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Buyer Defect Status Management
                </h2>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-indigo-100 text-xs">
                    <span className="font-semibold text-white">
                      {defects.length}
                    </span>{" "}
                    Total Defects
                  </p>
                  <span className="text-indigo-200">•</span>
                  <p className="text-indigo-100 text-xs">
                    <span className="font-semibold text-white">
                      {buyers.length}
                    </span>{" "}
                    Buyers
                  </p>
                  <span className="text-indigo-200">•</span>
                  <p className="text-indigo-100 text-xs">
                    <span className="font-semibold text-white">
                      {filteredDefects.length}
                    </span>{" "}
                    Filtered
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {hasChanges && (
                <div className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 backdrop-blur-sm border-2 border-yellow-400/30 rounded-lg">
                  <AlertCircle size={16} className="text-yellow-200" />
                  <span className="text-sm font-semibold text-yellow-100">
                    Unsaved Changes
                  </span>
                </div>
              )}
              <button
                onClick={handleBulkUpdate}
                disabled={!hasChanges || isSaving}
                className="px-6 py-2.5 bg-white text-indigo-600 font-semibold rounded-lg shadow-md hover:shadow-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
              >
                {isSaving ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {isSaving ? "Saving..." : "Save All Changes"}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Bar */}
        <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-b border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <Database
                  size={16}
                  className="text-blue-600 dark:text-blue-400"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Total Assignments
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {stats.totalAssignments}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <AlertCircle
                  size={16}
                  className="text-red-600 dark:text-red-400"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Critical
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {stats.criticalCount}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                <TrendingUp
                  size={16}
                  className="text-orange-600 dark:text-orange-400"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Major
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {stats.majorCount}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <FileText
                  size={16}
                  className="text-yellow-600 dark:text-yellow-400"
                />
              </div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Minor
                </p>
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {stats.minorCount}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2 rounded-lg shadow-md">
              <FilterIcon size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                Filter Defects
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Narrow down the defect list by code, name, or category
              </p>
            </div>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors text-sm"
            >
              <X size={14} />
              Clear All
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Grid3x3 size={14} className="text-indigo-500" />
              Filter by Defect Code
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={filters.code}
                onChange={(e) =>
                  setFilters({ ...filters, code: e.target.value })
                }
                className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all duration-200 outline-none"
                placeholder="e.g., 1.10"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <FileText size={14} className="text-purple-500" />
              Filter by Defect Name
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={filters.english}
                onChange={(e) =>
                  setFilters({ ...filters, english: e.target.value })
                }
                className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all duration-200 outline-none"
                placeholder="e.g., Snagging"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Tag size={14} className="text-blue-500" />
              Filter by Category
            </label>
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={filters.CategoryNameEng}
                onChange={(e) =>
                  setFilters({ ...filters, CategoryNameEng: e.target.value })
                }
                className="w-full pl-9 pr-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 outline-none"
                placeholder="e.g., Fabric"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="max-h-[calc(100vh-400px)] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-20">
                <tr>
                  <th
                    rowSpan="2"
                    className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase sticky left-0 bg-gray-50 dark:bg-gray-900 w-80 z-30 border-r-2 border-gray-300 dark:border-gray-600"
                  >
                    <div className="flex items-center gap-2">
                      <FileText size={14} className="text-indigo-500" />
                      Defect Information
                    </div>
                  </th>
                  {buyers.map((buyer) => (
                    <th
                      key={buyer._id}
                      colSpan="2"
                      className="px-4 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase border-l-2 border-gray-300 dark:border-gray-600 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20"
                    >
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded flex items-center justify-center text-white font-bold text-[10px]">
                          {buyer.buyer.substring(0, 2).toUpperCase()}
                        </div>
                        {buyer.buyer.toUpperCase()}
                      </div>
                    </th>
                  ))}
                </tr>
                <tr>
                  {buyers.map((buyer) => (
                    <React.Fragment key={buyer._id}>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase border-l-2 border-gray-300 dark:border-gray-600 bg-indigo-50/50 dark:bg-indigo-900/10">
                        <div className="flex items-center justify-center gap-1">
                          <CheckSquare size={12} className="text-indigo-500" />
                          Status
                        </div>
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-bold text-gray-600 dark:text-gray-300 uppercase bg-purple-50/50 dark:bg-purple-900/10">
                        <div className="flex items-center justify-center gap-1">
                          <Tag size={12} className="text-purple-500" />
                          Common
                        </div>
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td
                      colSpan={1 + buyers.length * 2}
                      className="text-center p-12"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-10 h-10 text-indigo-600 dark:text-indigo-400 animate-spin" />
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          Loading defects data...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredDefects.length === 0 ? (
                  <tr>
                    <td
                      colSpan={1 + buyers.length * 2}
                      className="text-center p-12"
                    >
                      <div className="flex flex-col items-center gap-3">
                        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
                          <Search
                            size={28}
                            className="text-gray-400 dark:text-gray-500"
                          />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          No defects found matching your filters
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredDefects.map((defect, index) => {
                    const statusMap = new Map(
                      defect.statusByBuyer?.map((s) => [s.buyerName, s])
                    );
                    return (
                      <tr
                        key={defect._id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150 group"
                      >
                        <td className="px-6 py-4 sticky left-0 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700/30 z-10 w-80 border-r border-gray-200 dark:border-gray-700">
                          <div className="space-y-1">
                            <div className="flex items-start gap-2">
                              <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded shadow-sm min-w-[50px]">
                                {defect.code}
                              </span>
                              <div className="flex-1">
                                <div className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                                  {defect.english}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {defect.khmer}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  {defect.chinese}
                                </div>
                              </div>
                            </div>
                            {defect.CategoryNameEng && (
                              <div className="flex items-center gap-1 mt-2">
                                <Tag size={12} className="text-blue-500" />
                                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                  {defect.CategoryNameEng}
                                </span>
                              </div>
                            )}
                          </div>
                        </td>
                        {buyers.map((buyer) => {
                          const buyerStatus = statusMap.get(buyer.buyer) || {
                            defectStatus: [],
                            commonStatus: ""
                          };
                          return (
                            <React.Fragment key={buyer._id}>
                              <td className="px-4 py-4 border-l border-gray-200 dark:border-gray-700 text-sm bg-gray-50/30 dark:bg-gray-900/20">
                                <div className="space-y-2">
                                  {["Critical", "Major", "Minor"].map(
                                    (status) => {
                                      const isChecked =
                                        buyerStatus.defectStatus.includes(
                                          status
                                        );
                                      const statusColors = {
                                        Critical:
                                          "text-red-600 dark:text-red-400 focus:ring-red-500",
                                        Major:
                                          "text-orange-600 dark:text-orange-400 focus:ring-orange-500",
                                        Minor:
                                          "text-yellow-600 dark:text-yellow-400 focus:ring-yellow-500"
                                      };

                                      // Check if disabled based on AQL config
                                      const isDisabled =
                                        disabledConfigs[buyer.buyer]?.includes(
                                          status
                                        );

                                      return (
                                        <div
                                          key={status}
                                          className="flex items-center gap-2"
                                        >
                                          <input
                                            type="checkbox"
                                            id={`${defect._id}-${buyer._id}-${status}`}
                                            checked={isChecked}
                                            disabled={isDisabled} // Disable input if config matches
                                            onChange={() =>
                                              handleStatusChange(
                                                defect._id,
                                                buyer.buyer,
                                                status
                                              )
                                            }
                                            className={`h-4 w-4 rounded border-gray-300 dark:border-gray-600 ${
                                              statusColors[status]
                                            } focus:ring-2 dark:bg-gray-700 transition-all ${
                                              isDisabled
                                                ? "opacity-50 cursor-not-allowed"
                                                : "cursor-pointer"
                                            }`}
                                          />
                                          <label
                                            htmlFor={`${defect._id}-${buyer._id}-${status}`}
                                            className={`text-xs font-medium select-none ${
                                              isDisabled
                                                ? "text-gray-400 line-through cursor-not-allowed"
                                                : "text-gray-700 dark:text-gray-300 cursor-pointer"
                                            }`}
                                          >
                                            {status}
                                            {isDisabled && (
                                              <Ban
                                                size={10}
                                                className="inline ml-1 text-gray-400"
                                              />
                                            )}
                                          </label>
                                        </div>
                                      );
                                    }
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-4 bg-white dark:bg-gray-800">
                                {/* 1. Get disabled statuses for this buyer */}
                                {(() => {
                                  const disabledStatuses =
                                    disabledConfigs[buyer.buyer] || [];

                                  return (
                                    <select
                                      value={buyerStatus.commonStatus}
                                      onChange={(e) =>
                                        handleCommonChange(
                                          defect._id,
                                          buyer.buyer,
                                          e.target.value
                                        )
                                      }
                                      className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all duration-200 outline-none cursor-pointer"
                                    >
                                      <option value="">-- Select --</option>

                                      {/* Critical (Always enabled based on previous logic) */}
                                      <option value="Critical">
                                        🔴 Critical
                                      </option>

                                      {/* Major - Check if disabled */}
                                      <option
                                        value="Major"
                                        disabled={disabledStatuses.includes(
                                          "Major"
                                        )}
                                        className={
                                          disabledStatuses.includes("Major")
                                            ? "text-gray-400 bg-gray-100"
                                            : ""
                                        }
                                      >
                                        🟠 Major{" "}
                                        {disabledStatuses.includes("Major")
                                          ? "(N/A)"
                                          : ""}
                                      </option>

                                      {/* Minor - Check if disabled */}
                                      <option
                                        value="Minor"
                                        disabled={disabledStatuses.includes(
                                          "Minor"
                                        )}
                                        className={
                                          disabledStatuses.includes("Minor")
                                            ? "text-gray-400 bg-gray-100"
                                            : ""
                                        }
                                      >
                                        🟡 Minor{" "}
                                        {disabledStatuses.includes("Minor")
                                          ? "(N/A)"
                                          : ""}
                                      </option>
                                    </select>
                                  );
                                })()}
                              </td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        {!isLoading && filteredDefects.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">
                Showing{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {filteredDefects.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {defects.length}
                </span>{" "}
                defects across{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {buyers.length}
                </span>{" "}
                buyers
              </span>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                >
                  <X size={14} />
                  Clear filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YPivotQASectionsBuyerStatusManagement;
