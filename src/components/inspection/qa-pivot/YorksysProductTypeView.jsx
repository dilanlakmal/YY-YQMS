import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Filter,
  FilterX,
  Loader,
  Search,
  Edit,
  Save,
  XCircle,
  Layers
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "../../../../config";
import { useDebounce, SearchableSelect } from "./YorksysOrdersView";

// Helper to calculate total quantity
const calculateTotalQty = (countryArray) => {
  if (!countryArray || countryArray.length === 0) return 0;
  return countryArray.reduce((sum, country) => sum + country.TotalQty, 0);
};

const YorksysProductTypeView = () => {
  const PAGE_LIMIT = 10;

  // --- State Management ---
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalRecords: 0,
    limit: PAGE_LIMIT
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [productTypeList, setProductTypeList] = useState([]);

  // Editing State
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [selectedProductType, setSelectedProductType] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Filter State (same as YorksysOrdersView)
  const initialFilters = {
    factory: "",
    moNo: "",
    style: "",
    buyer: "",
    season: ""
  };
  const [filters, setFilters] = useState(initialFilters);
  const [filterOptions, setFilterOptions] = useState({
    factories: [],
    buyers: [],
    seasons: []
  });
  const debouncedMoNo = useDebounce(filters.moNo, 500);
  const debouncedStyle = useDebounce(filters.style, 500);

  // --- Data Fetching ---
  const fetchFilterOptions = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/yorksys-orders/filters`
      );
      const result = await response.json();
      if (result.success) setFilterOptions(result.data);
    } catch (err) {
      console.error("Failed to fetch filter options:", err);
    }
  };

  const fetchProductTypes = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/qa-sections-product-type`
      );
      const result = await response.json();
      if (result.success) {
        setProductTypeList(result.data);
      }
    } catch (err) {
      console.error("Failed to fetch product types:", err);
    }
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      page: currentPage,
      limit: PAGE_LIMIT,
      ...Object.fromEntries(
        Object.entries({
          ...filters,
          moNo: debouncedMoNo,
          style: debouncedStyle
        }).filter(([, v]) => v)
      )
    });

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/yorksys-orders?${params.toString()}`
      );
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || "Failed to fetch orders.");
      setOrders(result.data);
      setPagination(result.pagination);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, debouncedMoNo, debouncedStyle]);

  useEffect(() => {
    fetchFilterOptions();
    fetchProductTypes();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // --- Event Handlers ---
  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setCurrentPage(1);
  };

  const handleEdit = (order) => {
    setEditingOrderId(order._id);
    setSelectedProductType(order.productType || "Top");
  };

  const handleCancel = () => {
    setEditingOrderId(null);
    setSelectedProductType("");
  };

  const handleSave = async (orderId) => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/yorksys-orders/${orderId}/product-type`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productType: selectedProductType })
        }
      );
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      // Update local state to reflect change without re-fetching
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId
            ? { ...order, productType: selectedProductType }
            : order
        )
      );
      handleCancel(); // Exit editing mode
    } catch (err) {
      alert(`Error saving: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (
      newPage >= 1 &&
      newPage <= pagination.totalPages &&
      newPage !== currentPage
    ) {
      setCurrentPage(newPage);
    }
  };

  // --- UI Rendering Logic ---
  const generatePageNumbers = () => {
    const { totalPages } = pagination;
    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      if (currentPage > 2) pages.push(currentPage - 1);
      if (currentPage > 1 && currentPage < totalPages) pages.push(currentPage);
      if (currentPage < totalPages - 1) pages.push(currentPage + 1);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  const startRecord =
    pagination.totalRecords > 0 ? (currentPage - 1) * pagination.limit + 1 : 0;
  const endRecord = Math.min(
    startRecord + pagination.limit - 1,
    pagination.totalRecords
  );

  // --- UI ---
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg transition-colors duration-300">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
          <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Assign Product Type
        </h2>
      </div>

      {/* Filter Pane */}
      <div className="mb-6 p-5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-700/30">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200">
            Filter Options
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">
              Factory
            </label>
            <SearchableSelect
              name="factory"
              value={filters.factory}
              onChange={handleFilterChange}
              options={filterOptions.factories}
              placeholder="All Factories"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">
              Buyer
            </label>
            <SearchableSelect
              name="buyer"
              value={filters.buyer}
              onChange={handleFilterChange}
              options={filterOptions.buyers}
              placeholder="All Buyers"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">
              Season
            </label>
            <SearchableSelect
              name="season"
              value={filters.season}
              onChange={handleFilterChange}
              options={filterOptions.seasons}
              placeholder="All Seasons"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">
              MO No
            </label>
            <div className="relative">
              <input
                type="text"
                name="moNo"
                placeholder="Search MO..."
                value={filters.moNo}
                onChange={handleFilterChange}
                className="w-full p-2.5 pl-9 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5 uppercase">
              Cust. Style
            </label>
            <div className="relative">
              <input
                type="text"
                name="style"
                placeholder="Search Style..."
                value={filters.style}
                onChange={handleFilterChange}
                className="w-full p-2.5 pl-9 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          <div className="self-end">
            <button
              onClick={clearFilters}
              className="w-full flex items-center justify-center gap-2 p-2.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 text-sm font-bold transition-all"
            >
              <FilterX className="w-4 h-4" /> Clear
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-center p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg animate-fadeIn">
          <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="font-medium">Error: {error}</span>
        </div>
      )}

      {/* Table Section */}
      <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
        <div className="relative min-h-[300px]">
          {loading && (
            <div className="absolute inset-0 bg-white/80 dark:bg-gray-800/80 flex justify-center items-center z-10 backdrop-blur-sm transition-all">
              <Loader className="w-8 h-8 animate-spin text-indigo-600 dark:text-indigo-400" />
            </div>
          )}
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-700/80">
              <tr>
                {[
                  "Factory",
                  "MO No",
                  "Cust.Style",
                  "Buyer",
                  "Destination",
                  "Ship Mode",
                  "Season",
                  "Total Order Qty",
                  "Product Type",
                  "Action"
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {orders.map((order) => (
                <tr
                  key={order._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors align-middle"
                >
                  <td className="px-6 py-4 text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {order.factory}
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-indigo-700 dark:text-indigo-400">
                    {order.moNo}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {order.style}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700 dark:text-gray-200">
                    {order.buyer}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300 max-w-xs truncate">
                    {order.destination}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                    {order.shipMode}
                  </td>
                  <td className="px-6 py-4 text-xs text-center text-gray-600 dark:text-gray-300">
                    {order.season}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-2 py-1 rounded">
                      {calculateTotalQty(
                        order.OrderQtyByCountry
                      ).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {editingOrderId === order._id ? (
                      <select
                        value={selectedProductType}
                        onChange={(e) => setSelectedProductType(e.target.value)}
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none"
                      >
                        {productTypeList.map((pt) => (
                          <option key={pt._id} value={pt.EnglishProductName}>
                            {pt.EnglishProductName}
                          </option>
                        ))}
                      </select>
                    ) : order.productType ? (
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-100 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md">
                        {order.productType}
                      </span>
                    ) : (
                      <span className="text-xs italic text-gray-400 dark:text-gray-500">
                        N/A
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingOrderId === order._id ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSave(order._id)}
                          disabled={isSaving}
                          className="flex items-center gap-1.5 text-xs font-bold text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-lg py-1.5 px-3 transition-colors shadow-sm"
                        >
                          {isSaving ? (
                            <Loader className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(order)}
                        className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg py-1.5 px-3 transition-colors shadow-sm"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {!loading && orders.length === 0 && (
                <tr>
                  <td
                    colSpan="10"
                    className="text-center py-12 text-gray-500 dark:text-gray-400"
                  >
                    <p className="text-base font-medium">
                      No orders found matching your criteria.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.totalRecords > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 px-2 gap-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing{" "}
            <span className="font-bold text-gray-900 dark:text-gray-100">
              {startRecord}
            </span>{" "}
            to{" "}
            <span className="font-bold text-gray-900 dark:text-gray-100">
              {endRecord}
            </span>{" "}
            of{" "}
            <span className="font-bold text-gray-900 dark:text-gray-100">
              {pagination.totalRecords}
            </span>{" "}
            results
          </p>
          <nav className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            {generatePageNumbers().map((page, index) =>
              page === "..." ? (
                <span
                  key={index}
                  className="px-3 py-2 text-gray-500 dark:text-gray-400"
                >
                  ...
                </span>
              ) : (
                <button
                  key={index}
                  onClick={() => handlePageChange(page)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-bold transition-all ${
                    page === currentPage
                      ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === pagination.totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default YorksysProductTypeView;
