import React, { useState } from "react";
import axios from "axios";
import {
  Search,
  AlertCircle,
  CheckCircle,
  Database,
  Layers,
  User,
  XCircle,
  AlertTriangle,
  Copy,
  ArrowRight,
  X,
  Loader2,
  Wrench, // Added Icon
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

const FincheckInspectionReportModify = () => {
  const [searchId, setSearchId] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // --- Modal State ---
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [targetGroup, setTargetGroup] = useState(null); // { index, id, name }
  const [sourceGroupIndex, setSourceGroupIndex] = useState("");
  const [availableSizes, setAvailableSizes] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [isSubmittingCopy, setIsSubmittingCopy] = useState(false);

  // --- Fix State ---
  const [isFixingId, setIsFixingId] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchId) return;
    fetchReport(searchId);
  };

  const fetchReport = async (id) => {
    setLoading(true);
    setError(null);
    setReport(null);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/fincheck-modify/report/${id}`,
      );
      if (response.data.success) {
        setReport(response.data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching report");
    } finally {
      setLoading(false);
    }
  };

  // Helper to safely display Scope string
  const getScopeString = (line, table, color) => {
    const parts = [];
    if (line && line.trim()) parts.push(line);
    if (table && table.trim()) parts.push(table);
    if (color && color.trim()) parts.push(color);
    return parts.length > 0 ? parts.join(" / ") : "N/A";
  };

  // --- Logic for Table 2: Aggregate Measurement Data ---
  const getConsolidatedMeasurements = (measurementData) => {
    if (!measurementData || !Array.isArray(measurementData)) return [];
    const grouped = {};
    measurementData.forEach((item) => {
      const gId = item.groupId;
      if (!grouped[gId]) {
        grouped[gId] = {
          groupId: gId,
          lineName: item.lineName,
          tableName: item.tableName,
          colorName: item.colorName,
          recordCount: 0,
          sizes: new Set(),
        };
      }
      grouped[gId].recordCount += 1;
      if (item.size) grouped[gId].sizes.add(item.size);
    });
    return Object.values(grouped).map((g) => ({
      ...g,
      sizes: Array.from(g.sizes).sort(),
    }));
  };

  // --- Actions Handlers ---

  const openCopyModal = (groupIndex, groupConfigId, groupName) => {
    setTargetGroup({ index: groupIndex, id: groupConfigId, name: groupName });
    setSourceGroupIndex("");
    setAvailableSizes([]);
    setSelectedSizes([]);
    setIsCopyModalOpen(true);
  };

  const handleSourceChange = (e) => {
    const sIndex = e.target.value;
    setSourceGroupIndex(sIndex);
    if (sIndex !== "") {
      const consolidated = getConsolidatedMeasurements(report.measurementData);
      const sourceData = consolidated.find(
        (g) => String(g.groupId) === String(sIndex),
      );
      const sizes = sourceData ? sourceData.sizes : [];
      setAvailableSizes(sizes);
      setSelectedSizes(sizes);
    } else {
      setAvailableSizes([]);
      setSelectedSizes([]);
    }
  };

  const toggleSize = (size) => {
    setSelectedSizes((prev) =>
      prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size],
    );
  };

  const executeCopy = async () => {
    if (!targetGroup || sourceGroupIndex === "" || selectedSizes.length === 0)
      return;

    setIsSubmittingCopy(true);
    try {
      const payload = {
        reportId: report.reportId,
        sourceGroupId: parseInt(sourceGroupIndex),
        targetGroupId: targetGroup.index,
        targetConfigId: targetGroup.id,
        selectedSizes: selectedSizes,
      };

      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-modify/copy-measurement`,
        payload,
      );

      if (res.data.success) {
        alert("Success! Data copied.");
        setIsCopyModalOpen(false);
        setReport(res.data.data);
      }
    } catch (err) {
      alert(
        "Error copying data: " + (err.response?.data?.message || err.message),
      );
    } finally {
      setIsSubmittingCopy(false);
    }
  };

  // NEW: Fix ID Handler
  const handleFixId = async (correctConfigId, line, table, color) => {
    if (
      !confirm(
        "Are you sure you want to update the IDs for all measurement records matching this scope name?",
      )
    )
      return;

    setIsFixingId(true);
    try {
      const payload = {
        reportId: report.reportId,
        correctConfigId: correctConfigId,
        line: line,
        table: table,
        color: color,
      };

      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-modify/fix-group-id`,
        payload,
      );

      if (res.data.success) {
        alert(res.data.message);
        setReport(res.data.data);
      }
    } catch (err) {
      alert(
        "Error fixing IDs: " + (err.response?.data?.message || err.message),
      );
    } finally {
      setIsFixingId(false);
    }
  };

  const validSourceGroups = report
    ? getConsolidatedMeasurements(report.measurementData)
    : [];

  return (
    <div className="w-full h-full flex flex-col space-y-4 p-2 relative">
      {/* --- Search Header --- */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <form
          onSubmit={(e) => handleSearch(e)}
          className="flex gap-4 items-center"
        >
          <div className="relative flex-1 max-w-md">
            <input
              type="number"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Report ID (e.g., 8593847291)"
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-800 dark:text-gray-100"
            />
            <Search
              className="absolute left-3 top-2.5 text-gray-400"
              size={18}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search Report"}
          </button>
        </form>

        {error && (
          <div className="mt-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* --- Results Content --- */}
      {report && (
        <div className="flex-1 overflow-y-auto space-y-6 animate-fadeIn pb-10">
          {/* Report Summary */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-2">
              Report Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-500 dark:text-gray-400 block">
                  Report ID
                </span>
                <span className="font-mono font-medium text-gray-800 dark:text-gray-200">
                  {report.reportId}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 block">
                  Inspection Date
                </span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {new Date(report.inspectionDate).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 block">
                  Orders
                </span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {report.orderNosString}
                </span>
              </div>
              <div>
                <span className="text-gray-500 dark:text-gray-400 block">
                  Inspector
                </span>
                <span className="font-medium text-gray-800 dark:text-gray-200">
                  {report.empName} ({report.empId})
                </span>
              </div>
            </div>
          </div>

          {/* --- Section 1: Config Groups Table --- */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <Layers className="text-indigo-500" size={20} />
              <h3 className="text-md font-bold text-gray-800 dark:text-gray-100">
                1. Configuration Groups
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="px-4 py-3 w-40">Config ID</th>
                    <th className="px-4 py-3">Scope (Line/Table/Color)</th>
                    <th className="px-4 py-3">Assignments</th>
                    <th className="px-4 py-3 text-center">Name Matches?</th>
                    <th className="px-4 py-3 text-center">ID Sync Check</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {report.inspectionConfig?.configGroups?.map(
                    (group, index) => {
                      const configId = group.id;
                      const line = group.lineName || group.line || "";
                      const table = group.tableName || group.table || "";
                      const color = group.colorName || group.color || "";
                      const scopeName = getScopeString(line, table, color);

                      const matchingByName =
                        report.measurementData?.filter((m) => {
                          const mLine = m.lineName || "";
                          const mTable = m.tableName || "";
                          const mColor = m.colorName || "";
                          return (
                            mLine === line &&
                            mTable === table &&
                            mColor === color
                          );
                        }) || [];

                      const nameMatchExists = matchingByName.length > 0;

                      let idSyncStatus = "no_data";
                      if (nameMatchExists) {
                        const allIdsMatch = matchingByName.every(
                          (m) => String(m.groupId) === String(configId),
                        );
                        idSyncStatus = allIdsMatch ? "synced" : "mismatch";
                      } else {
                        const matchingByIndex = report.measurementData?.some(
                          (m) => String(m.groupId) === String(index),
                        );
                        if (matchingByIndex) idSyncStatus = "index_match";
                      }

                      return (
                        <tr
                          key={index}
                          className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="px-4 py-3 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {configId || "Missing ID"}
                            <div className="text-[10px] text-gray-400 mt-1">
                              Index: {index}
                            </div>
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                            {scopeName}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-2">
                              {group.assignments?.map((assign, idx) => (
                                <div
                                  key={idx}
                                  className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-600"
                                >
                                  {assign.qcUser?.face_photo ? (
                                    <img
                                      src={assign.qcUser.face_photo}
                                      alt="QC"
                                      className="w-6 h-6 rounded-full object-cover"
                                    />
                                  ) : (
                                    <User size={16} className="text-gray-400" />
                                  )}
                                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                                    {assign.qcUser?.emp_id || "N/A"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {nameMatchExists ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                <CheckCircle size={12} className="mr-1" /> Yes (
                                {matchingByName.length})
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                                <AlertCircle size={12} className="mr-1" /> Empty
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            {idSyncStatus === "synced" && (
                              <span className="text-green-500 text-xs font-bold">
                                ID Synced
                              </span>
                            )}
                            {idSyncStatus === "index_match" && (
                              <span className="text-blue-500 text-xs font-bold">
                                Index Match
                              </span>
                            )}
                            {idSyncStatus === "mismatch" && (
                              <span className="text-red-500 text-xs font-bold">
                                ID Mismatch
                              </span>
                            )}
                            {idSyncStatus === "no_data" && (
                              <span className="text-gray-400 text-xs">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center space-x-2">
                            {/* CASE 1: No Data -> Show Copy/Repair */}
                            {!nameMatchExists && (
                              <button
                                onClick={() =>
                                  openCopyModal(index, configId, scopeName)
                                }
                                className="inline-flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded shadow-sm transition-colors"
                              >
                                <Copy size={12} className="mr-1.5" />
                                Repair / Copy
                              </button>
                            )}

                            {/* CASE 2: Names Match but ID Mismatch -> Show Fix ID */}
                            {nameMatchExists && idSyncStatus !== "synced" && (
                              <button
                                onClick={() =>
                                  handleFixId(configId, line, table, color)
                                }
                                disabled={isFixingId}
                                className="inline-flex items-center px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-medium rounded shadow-sm transition-colors disabled:opacity-50"
                              >
                                {isFixingId ? (
                                  <Loader2
                                    size={12}
                                    className="animate-spin mr-1.5"
                                  />
                                ) : (
                                  <Wrench size={12} className="mr-1.5" />
                                )}
                                Fix ID
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    },
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* --- Section 2: Measurement Data Table --- */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <Database className="text-emerald-500" size={20} />
              <h3 className="text-md font-bold text-gray-800 dark:text-gray-100">
                2. Actual Measurement Data Records
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-300">
                  <tr>
                    <th className="px-4 py-3">Scope</th>
                    <th className="px-4 py-3">Saved Group ID</th>
                    <th className="px-4 py-3 text-center">Count</th>
                    <th className="px-4 py-3">Sizes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {getConsolidatedMeasurements(report.measurementData).map(
                    (group, idx) => (
                      <tr
                        key={idx}
                        className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                          {getScopeString(
                            group.lineName,
                            group.tableName,
                            group.colorName,
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                          {group.groupId}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-bold">
                            {group.recordCount}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {group.sizes.map((size) => (
                              <span
                                key={size}
                                className="px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-xs"
                              >
                                {size}
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- COPY / REPAIR MODAL --- */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700 animate-fadeIn">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex items-center justify-between">
              <div className="flex items-center gap-2 text-white">
                <Copy size={20} />
                <h3 className="font-bold text-lg">Copy Measurement Data</h3>
              </div>
              <button
                onClick={() => setIsCopyModalOpen(false)}
                className="text-white/80 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Target (Destination) Info */}
              <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-1">
                  Target (Destination)
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-700 dark:text-indigo-300 font-mono font-bold text-sm">
                    {targetGroup?.index}
                  </div>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {targetGroup?.name}
                  </span>
                </div>
              </div>

              <div className="flex justify-center">
                <ArrowRight className="text-gray-400" size={24} />
              </div>

              {/* Source Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Select Source to Copy From
                </label>
                <select
                  value={sourceGroupIndex}
                  onChange={handleSourceChange}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-gray-800 dark:text-gray-200"
                >
                  <option value="">
                    -- Choose a Config Group with Data --
                  </option>
                  {validSourceGroups.map((g) => (
                    <option key={g.groupId} value={g.groupId}>
                      [ID: {g.groupId}]{" "}
                      {getScopeString(g.lineName, g.tableName, g.colorName)} (
                      {g.recordCount} records)
                    </option>
                  ))}
                </select>
              </div>

              {/* Size Selection */}
              {sourceGroupIndex !== "" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Select Sizes to Copy
                    </label>
                    <button
                      onClick={() => setSelectedSizes(availableSizes)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      Select All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-600">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => toggleSize(size)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all border ${
                          selectedSizes.includes(size)
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {selectedSizes.length} sizes selected. New records will have
                    timestamp +4 hours from original.
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setIsCopyModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeCopy}
                disabled={
                  isSubmittingCopy ||
                  sourceGroupIndex === "" ||
                  selectedSizes.length === 0
                }
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmittingCopy ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Executing...
                  </>
                ) : (
                  <>
                    <Database size={16} />
                    Execute Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FincheckInspectionReportModify;
