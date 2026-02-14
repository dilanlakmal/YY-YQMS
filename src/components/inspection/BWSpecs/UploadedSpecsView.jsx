import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FilterX,
  AlertTriangle,
  CheckCircle,
  Loader,
  Table,
  Wrench,
  ShieldCheck, // Icon for Fix TOL
  X
} from "lucide-react";
import { API_BASE_URL } from "../../../../config";
import { debounce } from "lodash";

const UploadedSpecsView = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fix Logic States
  const [isFixing, setIsFixing] = useState(false);
  const [isFixingTol, setIsFixingTol] = useState(false); // New state for TOL fix
  const [fixResult, setFixResult] = useState(null);
  const [fixTolResult, setFixTolResult] = useState(null); // New result state for TOL

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filter
  const [moSearch, setMoSearch] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);

  // --- Fetch Table Data ---
  const fetchTableData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/washing-specs/uploaded-list`,
        {
          params: {
            page,
            limit: 10,
            moNo: moSearch
          }
        }
      );
      setData(response.data.data);
      setTotalPages(response.data.pagination.totalPages);
      setTotalRecords(response.data.pagination.totalRecords);
    } catch (err) {
      console.error(err);
      setError("Failed to load uploaded specs data.");
    } finally {
      setLoading(false);
    }
  }, [page, moSearch]);

  useEffect(() => {
    fetchTableData();
  }, [fetchTableData]);

  // --- Fix Issues Handler (Specs) ---
  const handleFixIssues = async () => {
    if (
      !window.confirm(
        "This will scan all orders and attempt to calculate decimal values where they are missing (e.g., fix '6  1/4'). Continue?"
      )
    ) {
      return;
    }

    setIsFixing(true);
    setFixResult(null);
    setFixTolResult(null); // Clear other result

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/washing-specs/fix-issues`
      );
      setFixResult(response.data.stats);
      fetchTableData();
    } catch (err) {
      console.error(err);
      alert("Failed to fix issues. Check console.");
    } finally {
      setIsFixing(false);
    }
  };

  // --- Fix TOL Handler (NEW) ---
  const handleFixTol = async () => {
    if (
      !window.confirm(
        "This will scan all orders and fix spacing/decimal issues in Tolerance (TOL-, TOL+) fields. Continue?"
      )
    ) {
      return;
    }

    setIsFixingTol(true);
    setFixTolResult(null);
    setFixResult(null); // Clear other result

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/washing-specs/fix-tol`
      );
      setFixTolResult(response.data.stats);
      fetchTableData();
    } catch (err) {
      console.error(err);
      alert("Failed to fix TOL issues. Check console.");
    } finally {
      setIsFixingTol(false);
    }
  };

  // --- Pagination Helper ---
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 7;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (page <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
      } else if (page >= totalPages - 3) {
        pages.push(
          1,
          "...",
          totalPages - 4,
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
      }
    }
    return pages;
  };

  // --- Autocomplete Logic ---
  const fetchSuggestions = useCallback(
    debounce(async (term) => {
      if (!term || term.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/search-mono?term=${term}`
        );
        setSuggestions(response.data || []);
        setShowSuggestions(true);
      } catch (err) {
        console.error(err);
      }
    }, 300),
    []
  );

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setMoSearch(val);
    fetchSuggestions(val);
    setPage(1);
  };

  const handleSuggestionClick = (mo) => {
    setMoSearch(mo);
    setShowSuggestions(false);
    setPage(1);
  };

  const clearFilter = () => {
    setMoSearch("");
    setPage(1);
  };

  return (
    <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 transition-colors duration-300 relative">
      {/* --- Notification: Fix SPECS Result --- */}
      {fixResult && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg relative animate-fadeIn">
          <button
            onClick={() => setFixResult(null)}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
          <h4 className="font-bold text-green-800 dark:text-green-300 mb-2 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" /> Spec Fix Completed
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-green-700 dark:text-green-400">
            <div>
              <span className="block font-semibold">B/W Fixed:</span>{" "}
              {fixResult.totalBwIssuesFixed}
            </div>
            <div>
              <span className="block font-semibold">A/W Fixed:</span>{" "}
              {fixResult.totalAwIssuesFixed}
            </div>
            <div>
              <span className="block font-semibold">Total Decimals:</span>{" "}
              {fixResult.totalDecimalsInserted}
            </div>
            <div>
              <span className="block font-semibold">Docs Updated:</span>{" "}
              {fixResult.documentsUpdated}
            </div>
          </div>
        </div>
      )}

      {/* --- Notification: Fix TOL Result --- */}
      {fixTolResult && (
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg relative animate-fadeIn">
          <button
            onClick={() => setFixTolResult(null)}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X className="w-4 h-4" />
          </button>
          <h4 className="font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" /> TOL Fix Completed
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-700 dark:text-blue-400">
            <div>
              <span className="block font-semibold">B/W TOL Fixed:</span>{" "}
              {fixTolResult.totalBwTolFixed}
            </div>
            <div>
              <span className="block font-semibold">A/W TOL Fixed:</span>{" "}
              {fixTolResult.totalAwTolFixed}
            </div>
            <div>
              <span className="block font-semibold">Total Decimals:</span>{" "}
              {fixTolResult.totalDecimalsInserted}
            </div>
            <div>
              <span className="block font-semibold">Docs Updated:</span>{" "}
              {fixTolResult.documentsUpdated}
            </div>
          </div>
        </div>
      )}

      {/* --- Header & Controls --- */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        {/* Title Area */}
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Table className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">
            Uploaded Spec Status
          </h2>
        </div>

        {/* Action Area */}
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          {/* Fix Specs Button */}
          <button
            onClick={handleFixIssues}
            //disabled={true} // Enable this when ready
            className="flex items-center justify-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-bold rounded-lg shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isFixing ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Wrench className="w-4 h-4" />
            )}
            {isFixing ? "Fixing..." : "Fix Issues"}
          </button>

          {/* Fix TOL Button (NEW) */}
          <button
            onClick={handleFixTol}
            disabled={isFixingTol}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold rounded-lg shadow-sm transition-colors disabled:opacity-70 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {isFixingTol ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            {isFixingTol ? "Fixing..." : "Fix TOL"}
          </button>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64" ref={searchRef}>
            <div className="relative">
              <input
                type="text"
                placeholder="Filter by MO No..."
                value={moSearch}
                onChange={handleInputChange}
                className="w-full pl-9 pr-8 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-gray-200"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              {moSearch && (
                <button
                  onClick={clearFilter}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <FilterX className="w-4 h-4" />
                </button>
              )}
            </div>

            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                {suggestions.map((mo, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSuggestionClick(mo)}
                    className="px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer dark:text-gray-200"
                  >
                    {mo}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* --- Data Table --- */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-100 dark:bg-gray-700/80">
            <tr>
              <th className="px-4 py-3 text-left font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                MO No
              </th>
              <th className="px-4 py-3 text-left font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Style
              </th>
              <th className="px-4 py-3 text-center font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Qty
              </th>
              <th className="px-4 py-3 text-center font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Colors
              </th>
              <th className="px-4 py-3 text-left font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Color List
              </th>
              <th className="px-4 py-3 text-center font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                Sizes
              </th>
              <th className="px-4 py-3 text-center font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-l border-gray-300 dark:border-gray-600 bg-orange-50 dark:bg-orange-900/20">
                B/W Issues
              </th>
              <th className="px-4 py-3 text-center font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider border-l border-gray-300 dark:border-gray-600 bg-purple-50 dark:bg-purple-900/20">
                A/W Issues
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan="8" className="py-10 text-center">
                  <div className="flex justify-center items-center gap-2 text-gray-500 dark:text-gray-400">
                    <Loader className="w-5 h-5 animate-spin" /> Loading Data...
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan="8"
                  className="py-10 text-center text-gray-500 dark:text-gray-400"
                >
                  No uploaded specifications found.
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={row._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-indigo-600 dark:text-indigo-400">
                    {row.moNo}
                  </td>
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {row.custStyle}
                  </td>
                  <td className="px-4 py-3 text-center font-medium text-gray-800 dark:text-gray-200">
                    {row.totalQty.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                    {row.totalColors}
                  </td>
                  <td
                    className="px-4 py-3 text-gray-600 dark:text-gray-400 text-xs max-w-[400px] truncate"
                    title={row.colors}
                  >
                    {row.colors}
                  </td>
                  <td className="px-4 py-3 text-center text-gray-700 dark:text-gray-300">
                    {row.totalSizes}
                  </td>

                  <td className="px-4 py-3 text-center border-l border-gray-200 dark:border-gray-700">
                    {row.bwIssues > 0 ? (
                      <div className="flex flex-col items-center text-red-600 dark:text-red-400">
                        <div className="flex items-center gap-1 font-bold">
                          <AlertTriangle className="w-4 h-4" /> {row.bwIssues}
                        </div>
                        <span className="text-[10px]">Null Values</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
                        <CheckCircle className="w-4 h-4" /> OK
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3 text-center border-l border-gray-200 dark:border-gray-700">
                    {row.awIssues > 0 ? (
                      <div className="flex flex-col items-center text-red-600 dark:text-red-400">
                        <div className="flex items-center gap-1 font-bold">
                          <AlertTriangle className="w-4 h-4" /> {row.awIssues}
                        </div>
                        <span className="text-[10px]">Null Values</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 text-green-600 dark:text-green-400 text-xs font-medium">
                        <CheckCircle className="w-4 h-4" /> OK
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- Pagination --- */}
      {totalRecords > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>
            Showing page {page} of {totalPages} ({totalRecords} records)
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {getPageNumbers().map((p, index) =>
              p === "..." ? (
                <span key={index} className="px-3">
                  ...
                </span>
              ) : (
                <button
                  key={index}
                  onClick={() => setPage(p)}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-bold ${
                    p === page
                      ? "bg-blue-600 text-white"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadedSpecsView;
