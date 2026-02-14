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
  Sparkles,
  Layers,
  Globe,
  Scissors,
  FileText,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader
} from "lucide-react";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../config";

const YorkSysOrdersRibContentSave = () => {
  // ==========================================
  // STATE: Fiber Management
  // ==========================================
  const [fibers, setFibers] = useState([]);
  const [isFiberLoading, setIsFiberLoading] = useState(true);
  const [fiberEditingId, setFiberEditingId] = useState(null);

  const [newFiber, setNewFiber] = useState({
    fiberName: "",
    fiberNameKhmer: "",
    fiberNameChi: ""
  });

  const [editFiberData, setEditFiberData] = useState({
    fiberName: "",
    fiberNameKhmer: "",
    fiberNameChi: ""
  });
  const [fiberFilter, setFiberFilter] = useState("");

  // ==========================================
  // STATE: Yorksys Orders & Rib Content
  // ==========================================
  const [orders, setOrders] = useState([]);
  const [isOrderLoading, setIsOrderLoading] = useState(false);

  // Pagination & Filtering State
  const [moFilter, setMoFilter] = useState("");
  const [debouncedMoFilter, setDebouncedMoFilter] = useState("");
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalRecords: 0,
    limit: 10
  });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [ribContentRows, setRibContentRows] = useState([]);

  // ==========================================
  // EFFECTS
  // ==========================================

  // 1. Initial Load (Fibers)
  useEffect(() => {
    fetchFibers();
  }, []);

  // 2. Debounce Logic for MO Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMoFilter(moFilter);
      setPagination((prev) => ({ ...prev, currentPage: 1 })); // Reset to page 1 on new search
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [moFilter]);

  // 3. Fetch Orders when page or filter changes
  useEffect(() => {
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedMoFilter, pagination.currentPage]);

  // ==========================================
  // FUNCTIONS: Fiber Management
  // ==========================================
  const fetchFibers = async () => {
    setIsFiberLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/humidity/fiber/get-all`
      );
      setFibers(response.data);
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "Failed to load fiber names", "error");
    } finally {
      setIsFiberLoading(false);
    }
  };

  const filteredFibers = useMemo(() => {
    if (!fiberFilter) return fibers;
    return fibers.filter((f) =>
      f.fiberName.toLowerCase().includes(fiberFilter.toLowerCase())
    );
  }, [fibers, fiberFilter]);

  const handleSaveNewFiber = async () => {
    if (!newFiber.fiberName.trim()) {
      Swal.fire(
        "Validation Error",
        "Fiber Name (English) is required.",
        "warning"
      );
      return;
    }
    try {
      await axios.post(`${API_BASE_URL}/api/humidity/fiber/create`, newFiber);
      Swal.fire("Success", "New Fiber added!", "success");
      fetchFibers();
      setNewFiber({ fiberName: "", fiberNameKhmer: "", fiberNameChi: "" });
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to add fiber.",
        "error"
      );
    }
  };

  const handleEditFiber = (fiber) => {
    setFiberEditingId(fiber._id);
    setEditFiberData({
      fiberName: fiber.fiberName,
      fiberNameKhmer: fiber.fiberNameKhmer,
      fiberNameChi: fiber.fiberNameChi
    });
  };

  const handleSaveEditFiber = async (id) => {
    if (!editFiberData.fiberName.trim()) {
      Swal.fire("Validation Error", "Fiber Name is required.", "warning");
      return;
    }
    try {
      await axios.put(
        `${API_BASE_URL}/api/humidity/fiber/update/${id}`,
        editFiberData
      );
      Swal.fire("Success", "Fiber updated successfully!", "success");
      fetchFibers();
      setFiberEditingId(null);
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to update fiber.",
        "error"
      );
    }
  };

  const handleDeleteFiber = async (id, name) => {
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
        await axios.delete(`${API_BASE_URL}/api/humidity/fiber/delete/${id}`);
        Swal.fire("Deleted!", "Fiber has been deleted.", "success");
        fetchFibers();
      } catch (error) {
        Swal.fire("Error", "Failed to delete fiber.", "error");
      }
    }
  };

  // ==========================================
  // FUNCTIONS: Yorksys Order Fetching
  // ==========================================
  const fetchOrders = async () => {
    setIsOrderLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/yorksys-orders`, {
        params: {
          moNo: debouncedMoFilter,
          page: pagination.currentPage,
          limit: pagination.limit
        }
      });

      const { data, pagination: paginationData } = response.data;

      setOrders(data);
      setPagination((prev) => ({
        ...prev,
        totalPages: paginationData.totalPages,
        totalRecords: paginationData.totalRecords
      }));
    } catch (error) {
      console.error(error);
      // Don't alert on every keystroke error, but log it
    } finally {
      setIsOrderLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  // ==========================================
  // FUNCTIONS: Modal & Rib Content Logic
  // ==========================================
  const openEditModal = (order) => {
    setSelectedOrder(order);
    // Initialize rows with existing RibContent or one empty row if none
    const initialRows =
      order.RibContent && order.RibContent.length > 0
        ? order.RibContent.map((r) => ({ ...r })) // clone
        : [{ fabricName: "", percentageValue: "" }];
    setRibContentRows(initialRows);
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
    setRibContentRows([]);
  };

  const handleRibRowChange = (index, field, value) => {
    const updatedRows = [...ribContentRows];
    updatedRows[index][field] = value;
    setRibContentRows(updatedRows);
  };

  const addRibRow = () => {
    setRibContentRows([
      ...ribContentRows,
      { fabricName: "", percentageValue: "" }
    ]);
  };

  const removeRibRow = (index) => {
    const updatedRows = ribContentRows.filter((_, i) => i !== index);
    setRibContentRows(updatedRows);
  };

  const handleSaveRibContent = async () => {
    // Filter out empty rows (where no fabric is selected)
    const validRows = ribContentRows.filter(
      (row) => row.fabricName && row.fabricName !== ""
    );

    // Validate Percentages
    for (let row of validRows) {
      if (
        !row.percentageValue ||
        row.percentageValue < 0 ||
        row.percentageValue > 100
      ) {
        Swal.fire(
          "Validation",
          "Please ensure all percentages are valid (0-100).",
          "warning"
        );
        return;
      }
    }

    try {
      await axios.put(
        `${API_BASE_URL}/api/yorksys-orders/${selectedOrder._id}/rib-content`,
        { ribContent: validRows }
      );

      Swal.fire("Success", "Rib Content updated!", "success");

      // Update local orders state to reflect changes without re-fetching
      const updatedOrders = orders.map((o) => {
        if (o._id === selectedOrder._id) {
          return { ...o, RibContent: validRows };
        }
        return o;
      });
      setOrders(updatedOrders);
      closeEditModal();
    } catch (error) {
      console.error(error);
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to update Rib Content.",
        "error"
      );
    }
  };

  // Helper to render fabric array as string
  const renderFabricString = (arr) => {
    if (!arr || arr.length === 0)
      return <span className="text-gray-400 italic">None</span>;
    return arr.map((item, idx) => (
      <div key={idx} className="text-xs">
        <span className="font-semibold">{item.fabricName}:</span>{" "}
        {item.percentageValue}%
      </div>
    ));
  };

  return (
    <div className="space-y-8 pb-10">
      {/* ========================================================== */}
      {/* SECTION 1: MANAGE FIBER NAMES */}
      {/* ========================================================== */}

      <div className="space-y-4">
        {/* Add New Fiber Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-lg shadow-md">
              <Layers size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                Manage Fiber Names
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Create new fibers to be used in Order Rib Content
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Globe size={14} className="text-indigo-500" />
                Fiber Name (English) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., COTTON, POLYESTER"
                value={newFiber.fiberName}
                onChange={(e) =>
                  setNewFiber({
                    ...newFiber,
                    fiberName: e.target.value.toUpperCase()
                  })
                }
                className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all duration-200 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Globe size={14} className="text-purple-500" />
                Fiber Name (Khmer)
              </label>
              <input
                type="text"
                placeholder="e.g., កប្បាស"
                value={newFiber.fiberNameKhmer}
                onChange={(e) =>
                  setNewFiber({ ...newFiber, fiberNameKhmer: e.target.value })
                }
                className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all duration-200 outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Globe size={14} className="text-blue-500" />
                Fiber Name (Chinese)
              </label>
              <input
                type="text"
                placeholder="e.g., 棉"
                value={newFiber.fiberNameChi}
                onChange={(e) =>
                  setNewFiber({ ...newFiber, fiberNameChi: e.target.value })
                }
                className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all duration-200 outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveNewFiber}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
            >
              <Plus size={18} />
              Add Fiber
            </button>
          </div>
        </div>

        {/* Fiber Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-3 text-white font-bold">
                <Users size={20} /> Fiber List
              </div>
              <div className="relative w-full md:max-w-xs">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-200"
                />
                <input
                  type="text"
                  placeholder="Search fiber..."
                  value={fiberFilter}
                  onChange={(e) => setFiberFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 text-sm border-2 border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:border-white/40 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="max-h-[300px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-700 dark:text-gray-200">
                    English Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-700 dark:text-gray-200">
                    Khmer Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase text-gray-700 dark:text-gray-200">
                    Chinese Name
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold uppercase text-gray-700 dark:text-gray-200">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {isFiberLoading ? (
                  <tr>
                    <td colSpan="4" className="text-center p-4">
                      Loading...
                    </td>
                  </tr>
                ) : (
                  filteredFibers.map((fiber) => (
                    <tr
                      key={fiber._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      {fiberEditingId === fiber._id ? (
                        <>
                          <td className="px-6 py-2">
                            <input
                              className="w-full border rounded px-2 py-1 text-black"
                              value={editFiberData.fiberName}
                              onChange={(e) =>
                                setEditFiberData({
                                  ...editFiberData,
                                  fiberName: e.target.value.toUpperCase()
                                })
                              }
                            />
                          </td>
                          <td className="px-6 py-2">
                            <input
                              className="w-full border rounded px-2 py-1 text-black"
                              value={editFiberData.fiberNameKhmer}
                              onChange={(e) =>
                                setEditFiberData({
                                  ...editFiberData,
                                  fiberNameKhmer: e.target.value
                                })
                              }
                            />
                          </td>
                          <td className="px-6 py-2">
                            <input
                              className="w-full border rounded px-2 py-1 text-black"
                              value={editFiberData.fiberNameChi}
                              onChange={(e) =>
                                setEditFiberData({
                                  ...editFiberData,
                                  fiberNameChi: e.target.value
                                })
                              }
                            />
                          </td>
                          <td className="px-6 py-2 flex justify-center gap-2">
                            <button
                              onClick={() => handleSaveEditFiber(fiber._id)}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Save size={18} />
                            </button>
                            <button
                              onClick={() => setFiberEditingId(null)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <X size={18} />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-3 text-sm font-medium">
                            {fiber.fiberName}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            {fiber.fiberNameKhmer}
                          </td>
                          <td className="px-6 py-3 text-sm">
                            {fiber.fiberNameChi}
                          </td>
                          <td className="px-6 py-3 flex justify-center gap-2">
                            <button
                              onClick={() => handleEditFiber(fiber)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() =>
                                handleDeleteFiber(fiber._id, fiber.fiberName)
                              }
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 size={18} />
                            </button>
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

      <div className="border-t border-gray-300 dark:border-gray-600 my-8"></div>

      {/* ========================================================== */}
      {/* SECTION 2: ADD RIB CONTENT TO YORKSYS ORDERS */}
      {/* ========================================================== */}

      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2.5 rounded-lg shadow-md">
              <Scissors size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                Add Rib Content
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Filter MO Numbers and update Rib Content
              </p>
            </div>
          </div>
        </div>

        {/* Filter / Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="w-full md:w-1/3">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
              Filter by MO Number
            </label>
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                size={18}
              />
              <input
                type="text"
                className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 outline-none focus:border-emerald-500 transition-colors"
                placeholder="Type to filter..."
                value={moFilter}
                onChange={(e) => setMoFilter(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="relative">
            {isOrderLoading && (
              <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex justify-center items-center z-10 backdrop-blur-sm">
                <Loader className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            )}

            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                    MO No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                    Style
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                    Buyer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                    Fabric Content
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    Rib Content
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {orders.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                    >
                      No orders found.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr
                      key={order._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {order.moNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {order.style}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {order.buyer}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                        {renderFabricString(order.FabricContent)}
                      </td>
                      <td className="px-6 py-4 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10">
                        {renderFabricString(order.RibContent)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openEditModal(order)}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <Edit2 size={14} className="mr-1" /> Edit Rib
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination Controls */}
        {pagination.totalRecords > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4 px-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing{" "}
              <span className="font-bold">
                {(pagination.currentPage - 1) * pagination.limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-bold">
                {Math.min(
                  pagination.currentPage * pagination.limit,
                  pagination.totalRecords
                )}
              </span>{" "}
              of <span className="font-bold">{pagination.totalRecords}</span>{" "}
              entries
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} />
              </button>

              <span className="text-sm font-medium px-4">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>

              <button
                onClick={() => handlePageChange(pagination.currentPage + 1)}
                disabled={pagination.currentPage === pagination.totalPages}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* MODAL: EDIT RIB CONTENT */}
      {/* ========================================================== */}

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          aria-labelledby="modal-title"
          role="dialog"
          aria-modal="true"
        >
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
              aria-hidden="true"
              onClick={closeEditModal}
            ></div>

            <span
              className="hidden sm:inline-block sm:align-middle sm:h-screen"
              aria-hidden="true"
            >
              &#8203;
            </span>

            <div className="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Scissors
                      className="h-6 w-6 text-emerald-600"
                      aria-hidden="true"
                    />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3
                      className="text-lg leading-6 font-medium text-gray-900 dark:text-white"
                      id="modal-title"
                    >
                      Edit Rib Content
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Update Rib composition for MO:{" "}
                        <span className="font-bold">{selectedOrder?.moNo}</span>
                      </p>

                      {/* Modal Table */}
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase text-gray-700 dark:text-gray-200">
                              Fiber Name
                            </th>
                            <th className="px-4 py-2 text-left text-xs font-bold uppercase text-gray-700 dark:text-gray-200">
                              Percentage (%)
                            </th>
                            <th className="px-4 py-2 text-center text-xs font-bold uppercase text-gray-700 dark:text-gray-200">
                              Remove
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                          {ribContentRows.map((row, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2">
                                <select
                                  className="w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm dark:bg-gray-700 dark:text-white p-2 border"
                                  value={row.fabricName}
                                  onChange={(e) =>
                                    handleRibRowChange(
                                      index,
                                      "fabricName",
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="">Select Fiber...</option>
                                  {fibers.map((f) => (
                                    <option key={f._id} value={f.fiberName}>
                                      {f.fiberName}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-4 py-2">
                                <div className="flex items-center">
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    className="w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm dark:bg-gray-700 dark:text-white p-2 border"
                                    value={row.percentageValue}
                                    onChange={(e) =>
                                      handleRibRowChange(
                                        index,
                                        "percentageValue",
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-2 text-center">
                                <button
                                  onClick={() => removeRibRow(index)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>

                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={addRibRow}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-emerald-700 bg-emerald-100 hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
                        >
                          <Plus size={14} className="mr-1" /> Add Row
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-emerald-600 text-base font-medium text-white hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleSaveRibContent}
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={closeEditModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default YorkSysOrdersRibContentSave;
