import {
  AlertTriangle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Filter,
  FilterX,
  Loader,
  Eye,
  Search,
  List
} from "lucide-react";
import React, { useCallback, useRef, useEffect, useState } from "react";
import { API_BASE_URL } from "../../../../config";
import AdditionalInfoModal from "./AdditionalInfoModal";

// --- Custom Hook for Debouncing text input ---
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// --- Reusable Searchable Select Component (Dark Mode Enhanced) ---
export const SearchableSelect = ({
  options,
  value,
  onChange,
  placeholder,
  name
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option) => {
    onChange({ target: { name, value: option } });
    setIsOpen(false);
    setSearchTerm("");
  };

  return (
    <div className="relative" ref={ref}>
      <div
        className="w-full p-2.5 pl-3 pr-8 flex items-center justify-between border border-gray-300 dark:border-gray-600 rounded-lg text-sm shadow-sm bg-white dark:bg-gray-700 cursor-pointer hover:border-indigo-500 dark:hover:border-indigo-400 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className={`${
            value
              ? "text-gray-900 dark:text-gray-100"
              : "text-gray-500 dark:text-gray-400"
          } truncate`}
        >
          {value || placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 dark:text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          <div className="p-2 sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 z-10">
            <input
              type="text"
              placeholder="Search..."
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>
          <ul>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <li
                  key={option}
                  className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/50 cursor-pointer transition-colors"
                  onClick={() => handleSelect(option)}
                >
                  {option}
                </li>
              ))
            ) : (
              <li className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                No results found
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

// --- Helper Functions ---
const formatFabricContent = (fabricArray) => {
  if (!fabricArray || fabricArray.length === 0) return "N/A";
  return fabricArray
    .map((f) => `${f.fabricName}: ${f.percentageValue}%`)
    .join(", ");
};

const calculateTotalQty = (countryArray) => {
  if (!countryArray || countryArray.length === 0) return 0;
  return countryArray.reduce((sum, country) => sum + country.TotalQty, 0);
};

const formatTimestamp = (isoString) => {
  if (!isoString) return { date: "N/A", time: "" };
  try {
    const date = new Date(isoString);
    date.setHours(date.getHours() + 7); // Add +7 hours

    const datePart = date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const timePart = date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
    return { date: datePart, time: timePart };
  } catch (error) {
    return { date: "Invalid Date", time: "" };
  }
};

const YorksysOrdersView = () => {
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Filter State
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

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    const params = new URLSearchParams({
      page: currentPage,
      limit: PAGE_LIMIT
    });
    if (filters.factory) params.append("factory", filters.factory);
    if (filters.buyer) params.append("buyer", filters.buyer);
    if (filters.season) params.append("season", filters.season);
    if (debouncedMoNo) params.append("moNo", debouncedMoNo);
    if (debouncedStyle) params.append("style", debouncedStyle);

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
  }, [
    currentPage,
    filters.factory,
    filters.buyer,
    filters.season,
    debouncedMoNo,
    debouncedStyle
  ]);

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // --- Event Handlers ---
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setCurrentPage(1);
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
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

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg transition-colors duration-300">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg">
          <List className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Yorksys Orders
        </h2>
      </div>

      {/* --- Filter Pane --- */}
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

      {/* --- Table Section --- */}
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
                  "Currency",
                  "Destination",
                  "Ship Mode",
                  "Season",
                  "Fabric Content",
                  "Total Order Qty",
                  "Created At",
                  "Updated At",
                  "Actions"
                ].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {orders.map((order) => {
                const createdAt = formatTimestamp(order.createdAt);
                const updatedAt = formatTimestamp(order.updatedAt);
                return (
                  <tr
                    key={order._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors align-middle"
                  >
                    <td className="text-sm px-6 py-4 font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      {order.factory}
                    </td>
                    <td className="text-sm px-6 py-4 font-bold whitespace-nowrap text-indigo-700 dark:text-indigo-400">
                      {order.moNo}
                    </td>
                    <td className="text-sm px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {order.style}
                    </td>
                    <td className="text-sm px-6 py-4 font-medium text-gray-700 dark:text-gray-200 whitespace-nowrap">
                      {order.buyer}
                    </td>
                    <td className="text-sm px-6 py-4 whitespace-nowrap text-center text-gray-600 dark:text-gray-400">
                      {order.currency}
                    </td>
                    <td className="text-xs px-6 py-4 text-gray-600 dark:text-gray-300">
                      {order.destination}
                    </td>
                    <td className="text-sm px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-300">
                      {order.shipMode}
                    </td>
                    <td className="text-xs px-6 py-4 whitespace-nowrap text-center text-gray-600 dark:text-gray-300">
                      {order.season}
                    </td>
                    <td className="px-6 py-4">
                      <div
                        className="text-xs bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded font-medium max-w-[400px] truncate"
                        title={formatFabricContent(order.FabricContent)}
                      >
                        {formatFabricContent(order.FabricContent)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-2 py-1 rounded">
                        {calculateTotalQty(
                          order.OrderQtyByCountry
                        ).toLocaleString()}
                      </span>
                    </td>
                    <td className="text-xs px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {createdAt.date}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] opacity-80">
                          <Clock size={10} />
                          {createdAt.time}
                        </span>
                      </div>
                    </td>
                    <td className="text-xs px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {updatedAt.date}
                        </span>
                        <span className="flex items-center gap-1 text-[10px] opacity-80">
                          <Clock size={10} />
                          {updatedAt.time}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 rounded-lg py-2 px-3 transition-colors shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!loading && orders.length === 0 && (
                <tr>
                  <td
                    colSpan="13"
                    className="text-center py-12 text-gray-500 dark:text-gray-400"
                  >
                    <p className="text-base font-medium">
                      No orders found matching your criteria.
                    </p>
                    <p className="text-xs mt-1">
                      Try adjusting the filters or search terms.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Pagination Controls --- */}
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

      {/* Modal */}
      <AdditionalInfoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        order={selectedOrder}
      />
    </div>
  );
};

export default YorksysOrdersView;
