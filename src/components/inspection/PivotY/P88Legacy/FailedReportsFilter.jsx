import React, { useState, useEffect } from 'react';
import axios from 'axios';

const FailedReportsFilter = ({ onFilterChange, filters }) => {
    const [users, setUsers] = useState([]);
    const [inspectionNumbers, setInspectionNumbers] = useState([]);
    const [groupIds, setGroupIds] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(true); // Changed from false to true

    useEffect(() => {
        fetchFilterOptions();
    }, []);

    const fetchFilterOptions = async () => {
        try {
            setLoading(true);
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
            const response = await axios.get(`${apiBaseUrl}/api/p88failedReport/filter-options`);
            
            if (response.data.success) {
                setUsers(response.data.users || []);
                setInspectionNumbers(response.data.inspectionNumbers || []);
                setGroupIds(response.data.groupIds || []);
            }
        } catch (error) {
            console.error('Error fetching filter options:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (filterType, value) => {
        const newFilters = {
            ...filters,
            [filterType]: value
        };
        onFilterChange(newFilters);
    };

    const clearAllFilters = () => {
        const clearedFilters = {
            userId: '',
            inspectionNumber: '',
            groupId: '',
            status: '',
            startDate: '',
            endDate: ''
        };
        onFilterChange(clearedFilters);
    };

    const activeFiltersCount = Object.values(filters).filter(value => value).length;
    const hasDateRangeError = filters.startDate && filters.endDate && new Date(filters.startDate) > new Date(filters.endDate);

    return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl shadow-lg overflow-hidden transition-all duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                🔍 Advanced Filters
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                {activeFiltersCount > 0 ? `${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} active` : 'No filters applied'}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                        {/* Active Filters Count Badge */}
                        {activeFiltersCount > 0 && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 ring-1 ring-blue-200 dark:ring-blue-700">
                                <span className="w-2 h-2 bg-blue-400 dark:bg-blue-300 rounded-full mr-2 animate-pulse"></span>
                                {activeFiltersCount} Active
                            </span>
                        )}
                        
                        {/* Clear All Button */}
                        <button
                            onClick={clearAllFilters}
                            disabled={activeFiltersCount === 0}
                            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                activeFiltersCount > 0
                                    ? 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-800 border border-red-200 dark:border-red-700'
                                    : 'bg-gray-100 dark:bg-gray-600 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-200 dark:border-gray-500'
                            }`}
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Clear All
                        </button>
                        
                        {/* Expand/Collapse Button */}
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200"
                            title={isExpanded ? 'Collapse filters' : 'Expand filters'}
                        >
                            <svg 
                                className={`w-5 h-5 text-gray-600 dark:text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Filters Content - Updated with better height management */}
            <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
                <div className="p-6">
                    {loading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="flex items-center space-x-3">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 dark:border-blue-400"></div>
                                <span className="text-gray-600 dark:text-gray-400">Loading filter options...</span>
                            </div>
                        </div>
                    )}

                    {!loading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                            {/* User ID Filter */}
                            <div className="space-y-2">
                                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    <span className="text-lg">👤</span>
                                    <span>User ID</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={filters.userId || ''}
                                        onChange={(e) => handleFilterChange('userId', e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 text-sm text-gray-900 dark:text-gray-100 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400 dark:hover:border-gray-500"
                                        disabled={loading}
                                    >
                                        <option value="">All Users</option>
                                        {users.map((user) => (
                                            <option key={user} value={user}>
                                                {user}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Inspection Number Filter */}
                            <div className="space-y-2">
                                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    <span className="text-lg">📋</span>
                                    <span>Inspection No</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={filters.inspectionNumber || ''}
                                        onChange={(e) => handleFilterChange('inspectionNumber', e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 text-sm text-gray-900 dark:text-gray-100 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400 dark:hover:border-gray-500"
                                        disabled={loading}
                                    >
                                        <option value="">All Inspections</option>
                                        {inspectionNumbers.map((inspNo) => (
                                            <option key={inspNo} value={inspNo}>
                                                {inspNo}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Group ID Filter */}
                            <div className="space-y-2">
                                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    <span className="text-lg">🏷️</span>
                                    <span>Group ID</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={filters.groupId || ''}
                                        onChange={(e) => handleFilterChange('groupId', e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 text-sm text-gray-900 dark:text-gray-100 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400 dark:hover:border-gray-500"
                                        disabled={loading}
                                    >
                                        <option value="">All Groups</option>
                                        {groupIds.map((groupId) => (
                                            <option key={groupId} value={groupId}>
                                                {groupId}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Status Filter */}
                            <div className="space-y-2">
                                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    <span className="text-lg">📊</span>
                                    <span>Status</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={filters.status || ''}
                                        onChange={(e) => handleFilterChange('status', e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 text-sm text-gray-900 dark:text-gray-100 transition-all duration-200 appearance-none cursor-pointer hover:border-gray-400 dark:hover:border-gray-500"
                                    >
                                        <option value="">All Status</option>
                                        <option value="Pending">🟡 Pending</option>
                                        <option value="Downloaded">🟢 Downloaded</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                        <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Start Date Filter */}
                            <div className="space-y-2">
                                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    <span className="text-lg">📅</span>
                                    <span>Start Date</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={filters.startDate || ''}
                                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 text-sm text-gray-900 dark:text-gray-100 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                                    />
                                </div>
                            </div>

                            {/* End Date Filter */}
                            <div className="space-y-2">
                                <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    <span className="text-lg">📅</span>
                                    <span>End Date</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={filters.endDate || ''}
                                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                                        className="w-full px-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 text-sm text-gray-900 dark:text-gray-100 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Active Filters Summary */}
            {activeFiltersCount > 0 && (
                <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
                    <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0 p-1 bg-blue-100 dark:bg-blue-900 rounded-lg">
                            <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="flex-1">
                            <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                                Active Filters ({activeFiltersCount})
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {filters.userId && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                                        👤 User: {filters.userId}
                                        <button
                                            onClick={() => handleFilterChange('userId', '')}
                                            className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {filters.inspectionNumber && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                                        📋 Inspection: {filters.inspectionNumber}
                                        <button
                                            onClick={() => handleFilterChange('inspectionNumber', '')}
                                            className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {filters.groupId && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                                        🏷️ Group: {filters.groupId}
                                        <button
                                            onClick={() => handleFilterChange('groupId', '')}
                                            className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {filters.status && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                                        📊 Status: {filters.status}
                                        <button
                                            onClick={() => handleFilterChange('status', '')}
                                            className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {filters.startDate && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                                        📅 From: {new Date(filters.startDate).toLocaleDateString()}
                                        <button
                                            onClick={() => handleFilterChange('startDate', '')}
                                            className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                                {filters.endDate && (
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                                        📅 To: {new Date(filters.endDate).toLocaleDateString()}
                                        <button
                                            onClick={() => handleFilterChange('endDate', '')}
                                            className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
                                        >
                                            ×
                                        </button>
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Date Range Validation Error */}
            {hasDateRangeError && (
                <div className="px-6 py-4 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
                    <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 p-1 bg-red-100 dark:bg-red-900 rounded-lg">
                            <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="text-sm text-red-700 dark:text-red-300 font-medium">
                            ⚠️ Invalid date range: Start date must be before end date
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FailedReportsFilter;
