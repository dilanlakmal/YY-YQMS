import axios from "axios";
import {
  Check,
  Edit2,
  Plus,
  Save,
  Trash2,
  X,
  Search,
  Ship,
  Info,
  ListOrdered
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";

const YPivotQASectionsShippingStageConfig = () => {
  const [stages, setStages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [newStage, setNewStage] = useState({
    ShippingStage: "",
    Remarks: ""
  });

  const [editData, setEditData] = useState({
    ShippingStage: "",
    Remarks: ""
  });

  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchStages();
  }, []);

  const fetchStages = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections-shipping-stage`
      );
      if (response.data.success) {
        setStages(response.data.data);
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to load shipping stages", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStages = useMemo(() => {
    if (!filter) return stages;
    const lowerFilter = filter.toLowerCase();
    return stages.filter(
      (s) =>
        s.ShippingStage.toLowerCase().includes(lowerFilter) ||
        s.Remarks.toLowerCase().includes(lowerFilter)
    );
  }, [stages, filter]);

  // === HANDLERS ===
  const handleSaveNew = async () => {
    if (!newStage.ShippingStage.trim()) {
      Swal.fire(
        "Validation Error",
        "Shipping Stage name is required.",
        "warning"
      );
      return;
    }
    try {
      await axios.post(
        `${API_BASE_URL}/api/qa-sections-shipping-stage`,
        newStage
      );
      Swal.fire("Success", "New shipping stage added!", "success");
      fetchStages();
      setNewStage({
        ShippingStage: "",
        Remarks: ""
      });
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to add shipping stage.",
        "error"
      );
    }
  };

  const handleEdit = (stage) => {
    setEditingId(stage._id);
    setEditData({
      ShippingStage: stage.ShippingStage,
      Remarks: stage.Remarks
    });
  };

  const handleCancelEdit = () => setEditingId(null);

  const handleSaveEdit = async (id) => {
    if (!editData.ShippingStage.trim()) {
      Swal.fire(
        "Validation Error",
        "Shipping Stage name is required.",
        "warning"
      );
      return;
    }
    try {
      await axios.put(
        `${API_BASE_URL}/api/qa-sections-shipping-stage/${id}`,
        editData
      );
      Swal.fire("Success", "Shipping stage updated successfully!", "success");
      fetchStages();
      setEditingId(null);
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to update shipping stage.",
        "error"
      );
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete Stage "${name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(
          `${API_BASE_URL}/api/qa-sections-shipping-stage/${id}`
        );
        Swal.fire("Deleted!", "Shipping stage has been deleted.", "success");
        fetchStages();
      } catch (error) {
        Swal.fire("Error", "Failed to delete shipping stage.", "error");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Add New Stage */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-gradient-to-br from-indigo-500 to-cyan-600 p-2.5 rounded-lg shadow-md">
            <Plus size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Add New Shipping Stage
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Configure shipping stages (D1, D2, etc.)
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Ship size={14} className="text-indigo-500" />
              Shipping Stage <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. D1, D2, Final"
              value={newStage.ShippingStage}
              onChange={(e) =>
                setNewStage({ ...newStage, ShippingStage: e.target.value })
              }
              className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Info size={14} className="text-blue-500" />
              Remarks
            </label>
            <input
              type="text"
              placeholder="Optional remarks"
              value={newStage.Remarks}
              onChange={(e) =>
                setNewStage({ ...newStage, Remarks: e.target.value })
              }
              className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveNew}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <Plus size={18} />
            Add Stage
          </button>
        </div>
      </div>

      {/* Section 2: Manage Existing Stages */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-cyan-600 px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-lg backdrop-blur-sm">
                <Ship size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Manage Stages</h2>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-indigo-100 text-xs">
                    <span className="font-semibold text-white">
                      {stages.length}
                    </span>{" "}
                    Total Stages
                  </p>
                </div>
              </div>
            </div>

            <div className="relative w-full md:max-w-xs">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-200"
              />
              <input
                type="text"
                placeholder="Search stages..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all outline-none"
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 w-24">
                    <div className="flex items-center gap-1">
                      <ListOrdered size={14} /> No
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 w-48">
                    Shipping Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                    Remarks
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 w-32">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan="4" className="text-center p-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Loading stages...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredStages.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center p-12 text-gray-500">
                      No shipping stages found.
                    </td>
                  </tr>
                ) : (
                  filteredStages.map((stage) => (
                    <tr
                      key={stage._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      {editingId === stage._id ? (
                        // Edit Mode Rows
                        <>
                          <td className="px-6 py-3 text-gray-500 text-sm">
                            {stage.no}
                          </td>
                          <td className="px-6 py-3">
                            <input
                              type="text"
                              value={editData.ShippingStage}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  ShippingStage: e.target.value
                                })
                              }
                              className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </td>
                          <td className="px-6 py-3">
                            <input
                              type="text"
                              value={editData.Remarks}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  Remarks: e.target.value
                                })
                              }
                              className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleSaveEdit(stage._id)}
                                className="p-2 bg-green-500 text-white rounded hover:bg-green-600"
                              >
                                <Save size={14} />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        // View Mode Rows
                        <>
                          <td className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">
                            {stage.no}
                          </td>
                          <td className="px-6 py-3 font-bold text-gray-800 dark:text-gray-100">
                            {stage.ShippingStage}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {stage.Remarks || "-"}
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleEdit(stage)}
                                className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(stage._id, stage.ShippingStage)
                                }
                                className="p-2 bg-red-500 text-white rounded hover:bg-red-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YPivotQASectionsShippingStageConfig;
