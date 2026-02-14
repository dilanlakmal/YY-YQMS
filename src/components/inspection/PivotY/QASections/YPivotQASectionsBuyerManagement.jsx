import axios from "axios";
import {
  Check,
  Edit2,
  Plus,
  Save,
  Trash2,
  X,
  Search,
  Users,
  Building2,
  Info,
  Sparkles
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";

const YPivotQASectionsBuyerManagement = () => {
  const [buyers, setBuyers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [newBuyer, setNewBuyer] = useState({
    buyer: "",
    buyerFullName: "",
    additionalInfo: ""
  });
  const [editData, setEditData] = useState({
    buyer: "",
    buyerFullName: "",
    additionalInfo: ""
  });
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchBuyers();
  }, []);

  const fetchBuyers = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections-buyers`
      );
      setBuyers(response.data.data);
    } catch (error) {
      Swal.fire("Error", "Failed to load buyers", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredBuyers = useMemo(() => {
    if (!filter) return buyers;
    return buyers.filter((b) =>
      b.buyer.toLowerCase().includes(filter.toLowerCase())
    );
  }, [buyers, filter]);

  // === HANDLERS ===
  const handleSaveNew = async () => {
    if (!newBuyer.buyer.trim()) {
      Swal.fire("Validation Error", "Buyer name is required.", "warning");
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/qa-sections-buyers`, newBuyer);
      Swal.fire("Success", "New buyer added!", "success");
      fetchBuyers();
      setNewBuyer({ buyer: "", buyerFullName: "", additionalInfo: "" });
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to add buyer.",
        "error"
      );
    }
  };

  const handleEdit = (buyer) => {
    setEditingId(buyer._id);
    setEditData({
      buyer: buyer.buyer,
      buyerFullName: buyer.buyerFullName,
      additionalInfo: buyer.additionalInfo
    });
  };

  const handleCancelEdit = () => setEditingId(null);

  const handleSaveEdit = async (id) => {
    if (!editData.buyer.trim()) {
      Swal.fire("Validation Error", "Buyer name is required.", "warning");
      return;
    }
    try {
      await axios.put(`${API_BASE_URL}/api/qa-sections-buyers/${id}`, editData);
      Swal.fire("Success", "Buyer updated successfully!", "success");
      fetchBuyers();
      setEditingId(null);
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to update buyer.",
        "error"
      );
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete "${name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/api/qa-sections-buyers/${id}`);
        Swal.fire("Deleted!", "Buyer has been deleted.", "success");
        fetchBuyers();
      } catch (error) {
        Swal.fire("Error", "Failed to delete buyer.", "error");
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Section 1: Add New Buyer */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-lg shadow-md">
            <Plus size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
              Add New Buyer
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Create a new buyer entry in the system
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Building2 size={14} className="text-indigo-500" />
              Buyer Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., ANF, H&M, ZARA"
              value={newBuyer.buyer}
              onChange={(e) =>
                setNewBuyer({ ...newBuyer, buyer: e.target.value })
              }
              className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all duration-200 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Sparkles size={14} className="text-purple-500" />
              Full Name
            </label>
            <input
              type="text"
              placeholder="Complete buyer name"
              value={newBuyer.buyerFullName}
              onChange={(e) =>
                setNewBuyer({ ...newBuyer, buyerFullName: e.target.value })
              }
              className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all duration-200 outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Info size={14} className="text-blue-500" />
              Additional Info
            </label>
            <div className="relative">
              <textarea
                placeholder="Extra details about the buyer..."
                value={newBuyer.additionalInfo}
                onChange={(e) =>
                  setNewBuyer({ ...newBuyer, additionalInfo: e.target.value })
                }
                maxLength={250}
                className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 outline-none resize-none h-[88px]"
              />
              <div className="absolute bottom-2 right-2 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs font-medium text-gray-600 dark:text-gray-400 shadow-sm border border-gray-200 dark:border-gray-700">
                {newBuyer.additionalInfo.length}/250
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveNew}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
          >
            <Plus size={18} />
            Save New Buyer
          </button>
        </div>
      </div>

      {/* Section 2: Manage Existing Buyers */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-lg backdrop-blur-sm">
                <Users size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Manage Buyers</h2>
                <div className="flex items-center gap-4 mt-1">
                  <p className="text-indigo-100 text-xs">
                    <span className="font-semibold text-white">
                      {buyers.length}
                    </span>{" "}
                    Total Buyers
                  </p>
                  <span className="text-indigo-200">•</span>
                  <p className="text-indigo-100 text-xs">
                    <span className="font-semibold text-white">
                      {filteredBuyers.length}
                    </span>{" "}
                    Filtered
                  </p>
                  <span className="text-indigo-200">•</span>
                  <p className="text-indigo-100 text-xs">
                    <span className="font-semibold text-white">
                      {editingId ? "1" : "0"}
                    </span>{" "}
                    Editing
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
                placeholder="Search buyers..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 outline-none"
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
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-indigo-500" />
                      Buyer
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-purple-500" />
                      Full Name
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                    <div className="flex items-center gap-2">
                      <Info size={14} className="text-blue-500" />
                      Additional Info
                    </div>
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
                        <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          Loading buyers...
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : filteredBuyers.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center p-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
                          <Search
                            size={28}
                            className="text-gray-400 dark:text-gray-500"
                          />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                          No buyers found
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBuyers.map((buyer, index) => (
                    <tr
                      key={buyer._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150"
                    >
                      {editingId === buyer._id ? (
                        <>
                          <td className="px-6 py-3">
                            <input
                              type="text"
                              value={editData.buyer}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  buyer: e.target.value
                                })
                              }
                              className="w-full px-3 py-2 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all duration-200 outline-none"
                            />
                          </td>
                          <td className="px-6 py-3">
                            <input
                              type="text"
                              value={editData.buyerFullName}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  buyerFullName: e.target.value
                                })
                              }
                              className="w-full px-3 py-2 text-sm border-2 border-purple-300 dark:border-purple-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all duration-200 outline-none"
                            />
                          </td>
                          <td className="px-6 py-3">
                            <input
                              type="text"
                              value={editData.additionalInfo}
                              onChange={(e) =>
                                setEditData({
                                  ...editData,
                                  additionalInfo: e.target.value
                                })
                              }
                              maxLength={250}
                              className="w-full px-3 py-2 text-sm border-2 border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 outline-none"
                            />
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleSaveEdit(buyer._id)}
                                title="Save"
                                className="p-2 bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 transition-all duration-200 transform hover:scale-110 shadow-sm"
                              >
                                <Save size={16} />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                title="Cancel"
                                className="p-2 bg-gray-500 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-110 shadow-sm"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                {buyer.buyer.substring(0, 2).toUpperCase()}
                              </div>
                              <span className="font-semibold text-sm text-gray-800 dark:text-gray-100">
                                {buyer.buyer}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">
                            {buyer.buyerFullName || (
                              <span className="text-gray-400 dark:text-gray-500 italic">
                                Not specified
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-3">
                            <div
                              className="text-sm text-gray-600 dark:text-gray-400 max-w-md truncate"
                              title={buyer.additionalInfo}
                            >
                              {buyer.additionalInfo || (
                                <span className="text-gray-400 dark:text-gray-500 italic">
                                  No additional info
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => handleEdit(buyer)}
                                title="Edit"
                                className="p-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-all duration-200 transform hover:scale-110 shadow-sm"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(buyer._id, buyer.buyer)
                                }
                                title="Delete"
                                className="p-2 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 transition-all duration-200 transform hover:scale-110 shadow-sm"
                              >
                                <Trash2 size={16} />
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

        {/* Footer */}
        {!isLoading && filteredBuyers.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">
                Showing{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {filteredBuyers.length}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-gray-900 dark:text-white">
                  {buyers.length}
                </span>{" "}
                buyers
              </span>
              {filter && (
                <button
                  onClick={() => setFilter("")}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center gap-1 transition-colors"
                >
                  <X size={14} />
                  Clear filter
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YPivotQASectionsBuyerManagement;
