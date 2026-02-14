import React, { useState, useEffect, useCallback } from "react";
import FilterPanel from "./FilterPanel.jsx";
import SummaryCards from "./SummaryCards.jsx";
import ReactPaginate from "react-paginate";

const SummaryP88Data = () => {
  const [inspectionData, setInspectionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState({
    total: 0,
    passed: 0,
    failed: 0,
    pending: 0,
    hold: 0
  });
  const [filterOptions, setFilterOptions] = useState({
    inspector: [],
    supplier: [],
    project: [],
    reportType: [],
    poNumbers: [],
    style: [],
  });

  // State for server-side operations
  const [currentPage, setCurrentPage] = useState(0);
  const [pageCount, setPageCount] = useState(0);
  const [filters, setFilters] = useState({
    inspectionResult: '',
    approvalStatus: '',
    inspector: '',
    supplier: '',
    project: '',
    reportType: '',
    poNumbers: '',
    style: '',
  });
  const [sortConfig, setSortConfig] = useState({
    key: "scheduledInspectionDate",
    direction: "desc"
  });

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchInspectionData = useCallback(async () => {
    try {
      setLoading(true);
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const params = new URLSearchParams({
        page: currentPage + 1,
        limit: 100,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== "")
        )
      });

      const response = await fetch(
        `${apiBaseUrl}/api/p88-data?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch inspection data");
      }

      const data = await response.json();
      setInspectionData(data.results || []);
      setPageCount(data.pagination.totalPages || 0);
      setSummary(
        data.summary || { total: 0, passed: 0, failed: 0, pending: 0, hold: 0 }
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, sortConfig]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchInspectionData();
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [currentPage, filters, sortConfig, fetchInspectionData]);

  const fetchFilterOptions = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
      const response = await fetch(`${apiBaseUrl}/api/p88-data/filter-options`);
      if (!response.ok) {
        throw new Error("Failed to fetch filter options");
      }
      const data = await response.json();
      setFilterOptions(data.data);
    } catch (err) {
      console.error(err.message);
    }
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      'Pass': { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-800 dark:text-emerald-300', icon: '✅' },
      'Fail': { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-300', icon: '❌' },
      'Pending Approval': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-800 dark:text-amber-300', icon: '⏳' },
      'Not Completed': { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-300', icon: '🔄' },
      'Reworked': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-300', icon: '🔧' },
      'Accepted': { bg: 'bg-emerald-500 dark:bg-emerald-600', text: 'text-white', icon: '✅' },
      'Rejected': { bg: 'bg-red-500 dark:bg-red-600', text: 'text-white', icon: '❌' }
    };

    const config = statusConfig[status] || { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-300', icon: '❓' };
    
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}
      >
        <span className="text-xs">{config.icon}</span>
        {status || "Not Completed"}
      </span>
    );
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <span className="text-gray-400 ml-1">↕️</span>;
    }
    return (
      <span
        className={`ml-1 ${
          sortConfig.direction === "asc" ? "text-blue-500" : "text-blue-500"
        }`}
      >
        {sortConfig.direction === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(0);
  };

  const handlePageClick = (event) => {
    setCurrentPage(event.selected);
  };

  // Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl">📊</span>
              </div>
            </div>
            <p className="text-xl font-semibold text-gray-700 dark:text-gray-200 mt-6">Loading inspection data...</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Please wait while we fetch the latest information</p>
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center h-96 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-red-200 dark:border-red-900">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">Oops! Something went wrong</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 text-center max-w-md">
              We encountered an error while loading the inspection data: <span className="font-medium">{error}</span>
            </p>
            <button
              onClick={fetchInspectionData}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <span>🔄</span>
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-8xl mx-auto p-6">
        {/* Header */}
        {/* <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-blue-100 p-3 rounded-xl">
              <span className="text-3xl">📋</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-800">P88 Inspection Dashboard</h1>
              <p className="text-gray-600">Monitor and manage all inspection activities</p>
            </div>
          </div>
        </div> */}

        {/* Filter Panel */}
        <FilterPanel
          filters={filters}
          onFilterChange={handleFilterChange}
          options={filterOptions}
        />

        {/* Summary Cards */}
        <SummaryCards summary={summary} />

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          {/* Table Header */}
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Inspection Records</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {inspectionData.length} records found
                  {Object.values(filters).some((v) => v) && " (filtered)"}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                <span>📊</span>
                <span>
                  Page {currentPage + 1} of {pageCount}
                </span>
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th
                    className="px-4 py-4 text-left font-semibold text-gray-700 dark:text-gray-200 select-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">#️⃣</span>
                      <span>No.</span>
                    </div>
                  </th>
                  {[
                    { key: 'scheduledInspectionDate', label: 'Scheduled Date', icon: '📅' },
                    { key: 'inspector', label: 'Inspector', icon: '👤' },
                    { key: 'approvalStatus', label: 'Status', icon: '✅' },
                    { key: 'reportType', label: 'Report Type', icon: '📋' },
                    { key: 'etd', label: 'ETD', icon: '🚢' },
                    { key: 'eta', label: 'ETA', icon: '🏁' },
                    { key: 'poNumbers', label: 'PO #', icon: '📄' },
                   { key: 'style', label: 'Style', icon: '👕' },
                    { key: 'submittedInspectionDate', label: 'Submitted Date', icon: '📤' },
                    { key: 'qtyToInspect', label: 'Qty to Inspect', icon: '📊' },
                    { key: 'qtyInspected', label: 'Qty Inspected', icon: '✅' },
                    { key: 'totalPoItemsQty', label: 'Total PO Qty', icon: '📦' },
                    { key: 'supplier', label: 'Supplier Comments', icon: '💬' },
                    { key: 'project', label: 'Project', icon: '🏗️' },
                    { key: 'sampleInspected', label: 'Sample Inspected', icon: '🔬' }
                  ].map((column) => (
                    <th
                      key={column.key}
                      onClick={() => handleSort(column.key)}
                      className="px-4 py-4 text-left font-semibold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-150 select-none group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{column.icon}</span>
                        <span>{column.label}</span>
                        {/* {getSortIcon(column.key)} */}
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-4 text-left font-semibold text-gray-700 dark:text-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🏭</span>
                      <span>Factory Name</span>
                    </div>
                  </th>
                  {/* <th className="px-4 py-4 text-left font-semibold text-gray-700">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">📄</span>
                      <span>Docs</span>
                    </div>
                  </th> */}
                  <th className="px-4 py-4 text-left font-semibold text-gray-700 dark:text-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">⚡</span>
                      <span>Actions</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {inspectionData.map((inspection, index) => (
                  <tr key={inspection._id || index} className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-150 group">
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 font-medium text-center">
                      {currentPage * 100 + index + 1}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-[150px] break-words">
                      {formatDateTime(inspection.scheduledInspectionDate)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-[150px] break-words">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                        {inspection.inspector || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(inspection.approvalStatus)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-[150px] break-words">
                      {inspection.reportType || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-[150px] break-words">
                      {inspection.etd && inspection.etd.length > 0 
                        ? formatDate(inspection.etd[0]) 
                        : '-'
                      }
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-[150px] break-words">
                      {inspection.eta && inspection.eta.length > 0 
                        ? formatDate(inspection.eta[0]) 
                        : '-'
                      }
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-[150px] break-words">
                      {inspection.poNumbers?.join(', ') || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-[150px] break-words">
                      {Array.isArray(inspection.style) ? inspection.style.join(', ') : inspection.style || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-[150px] break-words">
                      {formatDateTime(inspection.submittedInspectionDate)}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 text-center font-medium">
                      <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2 py-1 rounded-full text-xs">
                        {inspection.qtyToInspect || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 text-center font-medium">
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded-full text-xs">
                        {inspection.qtyInspected || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 text-center font-medium">
                      <span className="bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 px-2 py-1 rounded-full text-xs">
                        {inspection.totalPoItemsQty || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-[150px] break-words">
                      {inspection.allComments || '-'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-[150px] break-words">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 bg-purple-400 rounded-full"></span>
                        {inspection.project || "-"}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 text-center font-medium">
                      <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 px-2 py-1 rounded-full text-xs">
                        {inspection.sampleInspected || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-700 dark:text-gray-300 max-w-[150px] break-words">
                      {inspection.supplier || '-'}
                    </td>
                    {/* <td className="px-4 py-4 text-center">
                      <button 
                        className="p-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed opacity-50"
                        disabled
                        title="Documents not available"
                      >
                        📄
                      </button>
                    </td> */}
                    <td className="px-4 py-4">
                      <a
                        href={`/inspection-report/${inspection._id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 shadow-md hover:shadow-lg"
                        title="View Full Report"
                      >
                        <span>📊</span>
                        <span className="hidden sm:inline">View Report</span>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {inspectionData.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No inspections found</h3>
              <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters or check back later for new data.</p>
            </div>
          )}
        </div>

        {/* Enhanced Pagination */}
        {pageCount > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Showing page <span className="font-semibold">{currentPage + 1}</span> of{' '}
                <span className="font-semibold">{pageCount}</span>
              </div>

              <ReactPaginate
                previousLabel={
                  <div className="flex items-center gap-2">
                    <span>←</span>
                    <span className="hidden sm:inline">Previous</span>
                  </div>
                }
                nextLabel={
                  <div className="flex items-center gap-2">
                    <span className="hidden sm:inline">Next</span>
                    <span>→</span>
                  </div>
                }
                breakLabel={"..."}
                pageCount={pageCount}
                marginPagesDisplayed={2}
                pageRangeDisplayed={5}
                onPageChange={handlePageClick}
                forcePage={currentPage}
                containerClassName={'flex items-center space-x-1'}
                pageClassName={''}
                pageLinkClassName={'px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150'}
                previousClassName={''}
                previousLinkClassName={'px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150'}
                nextClassName={''}
                nextLinkClassName={'px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-150'}
                breakClassName={''}
                breakLinkClassName={'px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400'}
                activeClassName={''}
                activeLinkClassName={'px-4 py-2 rounded-lg text-sm font-medium bg-blue-500 text-white shadow-md'}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryP88Data;
