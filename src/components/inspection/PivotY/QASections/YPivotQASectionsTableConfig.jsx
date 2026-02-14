import axios from "axios";
import {
  Check,
  Edit2,
  Plus,
  Save,
  Trash2,
  X,
  Search,
  Grid,
  Layers,
  Info,
  Type
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";

const YPivotQASectionsTableConfig = () => {
  const [tables, setTables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [newTable, setNewTable] = useState({
    TableNo: "",
    ProductType: "KNIT",
    Description: "",
    Type: "Main"
  });

  const [editData, setEditData] = useState({
    TableNo: "",
    ProductType: "KNIT",
    Description: "",
    Type: "Main"
  });

  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections-tables`
      );
      if (response.data.success) {
        setTables(response.data.data);
      }
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to load tables", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTables = useMemo(() => {
    if (!filter) return tables;
    return tables.filter(
      (t) =>
        t.TableNo.toLowerCase().includes(filter.toLowerCase()) ||
        t.Description.toLowerCase().includes(filter.toLowerCase())
    );
  }, [tables, filter]);

  // === HANDLERS ===
  const handleSaveNew = async () => {
    if (!newTable.TableNo.trim()) {
      Swal.fire("Validation Error", "Table No is required.", "warning");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/qa-sections-tables`, newTable);
      Swal.fire("Success", "New table added!", "success");
      fetchTables();
      setNewTable({
        TableNo: "",
        ProductType: "KNIT",
        Description: "",
        Type: "Main"
      });
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to add table.",
        "error"
      );
    }
  };

  const handleEdit = (table) => {
    setEditingId(table._id);
    setEditData({
      TableNo: table.TableNo,
      ProductType: table.ProductType,
      Description: table.Description,
      Type: table.Type
    });
  };

  const handleCancelEdit = () => setEditingId(null);

  const handleSaveEdit = async (id) => {
    if (!editData.TableNo.trim()) {
      Swal.fire("Validation Error", "Table No is required.", "warning");
      return;
    }
    try {
      await axios.put(`${API_BASE_URL}/api/qa-sections-tables/${id}`, editData);
      Swal.fire("Success", "Table updated successfully!", "success");
      fetchTables();
      setEditingId(null);
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to update table.",
        "error"
      );
    }
  };

  const handleDelete = async (id, no) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete Table "${no}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/api/qa-sections-tables/${id}`);
        Swal.fire("Deleted!", "Table has been deleted.", "success");
        fetchTables();
      } catch (error) {
        Swal.fire("Error", "Failed to delete table.", "error");
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Section 1: Add New Table */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-lg shadow-md">
            <Plus size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Add New Table
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Configure inspection tables
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Grid size={14} className="text-indigo-500" />
              Table No <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. A, B, C"
              value={newTable.TableNo}
              onChange={(e) =>
                setNewTable({ ...newTable, TableNo: e.target.value })
              }
              className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Layers size={14} className="text-cyan-500" />
              Product Type
            </label>
            <select
              value={newTable.ProductType}
              onChange={(e) =>
                setNewTable({ ...newTable, ProductType: e.target.value })
              }
              className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 dark:focus:ring-cyan-800 transition-all outline-none"
            >
              <option value="KNIT">KNIT</option>
              <option value="BRA">BRA</option>
              <option value="KNIT+BRA">KNIT+BRA</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Type size={14} className="text-purple-500" />
              Table Type
            </label>
            <select
              value={newTable.Type}
              onChange={(e) =>
                setNewTable({ ...newTable, Type: e.target.value })
              }
              className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all outline-none"
            >
              <option value="Main">Main</option>
              <option value="Support">Support</option>
              <option value="Sample">Sample</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Info size={14} className="text-blue-500" />
              Description
            </label>
            <input
              type="text"
              placeholder="Optional description"
              value={newTable.Description}
              onChange={(e) =>
                setNewTable({ ...newTable, Description: e.target.value })
              }
              className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveNew}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <Plus size={18} />
            Add Table
          </button>
        </div>
      </div>

      {/* Section 2: Manage Existing Tables */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-lg backdrop-blur-sm">
                <Grid size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Manage Tables</h2>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-indigo-100 text-xs">
                    <span className="font-semibold text-white">
                      {tables.length}
                    </span>{" "}
                    Total Tables
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
                placeholder="Search table no..."
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
                    Table No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 w-32">
                    Product Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 w-32">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                    Description
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 w-32">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="text-center p-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Loading tables...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredTables.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center p-12 text-gray-500">
                      No tables found.
                    </td>
                  </tr>
                ) : (
                  filteredTables.map((table) => (
                    <tr
                      key={table._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      {editingId === table._id ? (
                        // Edit Mode Rows
                        <>
                          <td className="px-6 py-3">
                            <input
                              type="text"
                              value={editData.TableNo}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  TableNo: e.target.value
                                })
                              }
                              className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </td>
                          <td className="px-6 py-3">
                            <select
                              value={editData.ProductType}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  ProductType: e.target.value
                                })
                              }
                              className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                              <option value="KNIT">KNIT</option>
                              <option value="BRA">BRA</option>
                              <option value="KNIT+BRA">KNIT+BRA</option>
                            </select>
                          </td>
                          <td className="px-6 py-3">
                            <select
                              value={editData.Type}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  Type: e.target.value
                                })
                              }
                              className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            >
                              <option value="Main">Main</option>
                              <option value="Support">Support</option>
                              <option value="Sample">Sample</option>
                            </select>
                          </td>
                          <td className="px-6 py-3">
                            <input
                              type="text"
                              value={editData.Description}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  Description: e.target.value
                                })
                              }
                              className="w-full px-2 py-1 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            />
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleSaveEdit(table._id)}
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
                          <td className="px-6 py-3 font-bold text-gray-800 dark:text-gray-100">
                            {table.TableNo}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {table.ProductType}
                          </td>
                          <td className="px-6 py-3">
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-medium 
                                ${
                                  table.Type === "Main"
                                    ? "bg-green-100 text-green-700"
                                    : table.Type === "Support"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-purple-100 text-purple-700"
                                }`}
                            >
                              {table.Type}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                            {table.Description || "-"}
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleEdit(table)}
                                className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                              >
                                <Edit2 size={14} />
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(table._id, table.TableNo)
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

export default YPivotQASectionsTableConfig;
