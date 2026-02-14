import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FailedReportsFilter from './FailedReportsFilter';

const FailedReportsTable = () => {
    const [failedItems, setFailedItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalCount, setTotalCount] = useState(0);
    
    // Loading states for individual items
    const [copyingItems, setCopyingItems] = useState(new Set());
    const [openingItems, setOpeningItems] = useState(new Set());
    
    // Toast notification state
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    
    // Dark mode state
    const [darkMode, setDarkMode] = useState(() => {
        // Check localStorage or system preference
        const saved = localStorage.getItem('darkMode');
        if (saved !== null) {
            return JSON.parse(saved);
        }
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    });
    
    // Filter state
    const [filters, setFilters] = useState({
        userId: '',
        inspectionNumber: '',
        groupId: '',
        status: '',
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        fetchFailedReports();
    }, [filters]);

    // Save dark mode preference
    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    const fetchFailedReports = async () => {
        try {
            setLoading(true);
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
            
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value.trim() !== '') {
                    queryParams.append(key, value);
                }
            });

            const url = queryParams.toString() 
                ? `${apiBaseUrl}/api/p88failedReport/filtered-reports?${queryParams}`
                : `${apiBaseUrl}/api/p88failedReport/failed-reports`;

            const res = await axios.get(url);
            setFailedItems(res.data?.data || []);
            setTotalCount(res.data?.totalCount || res.data?.data?.length || 0);
        } catch (err) {
            setError(err.message);
            showToast('Failed to load reports', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    useEffect(() => {
        fetchFailedReports();
    }, []);

    // Toast notification function
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
    };

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    const handleManualDownload = async (item) => {
        setOpeningItems(prev => new Set([...prev, item._id]));
        
        try {
            const manualUrl = `https://yw.pivot88.com/inspectionreport/show/${item.inspectionNumber}`;
            window.open(manualUrl, '_blank');

            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
            const statusUrl = `${apiBaseUrl}/api/p88failedReport/failed-reports/mark-downloaded`;
            
            await axios.post(statusUrl, { reportId: item._id });
            
            setFailedItems(prev => 
                prev.map(i => i._id === item._id ? { ...i, status: 'Downloaded' } : i)
            );

            showToast(`Report ${item.inspectionNumber} opened successfully!`, 'success');
        } catch (err) {
            console.error("Failed to update status in database:", err);
            showToast('Failed to update report status', 'error');
        } finally {
            setOpeningItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(item._id);
                return newSet;
            });
        }
    };

    const handleCopyLink = async (item) => {
        setCopyingItems(prev => new Set([...prev, item._id]));
        
        try {
            const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
            const linkUrl = `${apiBaseUrl}/api/p88failedReport/generate-report-link-by-inspection`;
            
            const response = await axios.post(linkUrl, { 
                inspectionNumber: item.inspectionNumber 
            });

            if (response.data.success) {
                const { reportUrl } = response.data;
                
                try {
                    await navigator.clipboard.writeText(reportUrl);
                    showToast(`Link copied for inspection ${item.inspectionNumber}!`, 'success');
                } catch (clipboardError) {
                    const textArea = document.createElement('textarea');
                    textArea.value = reportUrl;
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    showToast(`Link copied for inspection ${item.inspectionNumber}!`, 'success');
                }
            } else {
                throw new Error(response.data.error || 'Failed to generate link');
            }
        } catch (err) {
            console.error("Error copying link:", err);
            const fallbackUrl = `https://yw.pivot88.com/inspectionreport/show/${item.inspectionNumber}`;
            
            try {
                await navigator.clipboard.writeText(fallbackUrl);
                showToast(`Fallback link copied for inspection ${item.inspectionNumber}`, 'warning');
            } catch (clipboardError) {
                showToast('Failed to copy link to clipboard', 'error');
            }
        } finally {
            setCopyingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(item._id);
                return newSet;
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-300 text-lg font-medium">Loading reports...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
            {/* Toast Notification */}
            {toast.show && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ${
                    toast.type === 'success' ? 'bg-green-500 text-white' :
                    toast.type === 'error' ? 'bg-red-500 text-white' :
                    toast.type === 'warning' ? 'bg-yellow-500 text-white' :
                    'bg-blue-500 text-white'
                } animate-slide-in-right`}>
                    <div className="flex items-center space-x-2">
                        <span className="text-lg">
                            {toast.type === 'success' ? '✅' : 
                             toast.type === 'error' ? '❌' : 
                             toast.type === 'warning' ? '⚠️' : 'ℹ️'}
                        </span>
                        <span className="font-medium">{toast.message}</span>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-4 py-8">
                {/* Header Section with Title and Dark Mode Toggle */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden mb-8 transition-colors duration-300">
                    {/* Filter Section */}
                    <div className="p-6 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 transition-colors duration-300">
                        <FailedReportsFilter 
                            filters={filters}
                            onFilterChange={handleFilterChange}
                        />
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-400 dark:border-red-500 p-4 rounded-r-lg">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400 dark:text-red-300" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                                    Error loading reports: {error}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Table Header with Refresh Button */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            📊 Failed Reports Table
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {failedItems.length > 0 
                                ? `Showing ${failedItems.length} of ${totalCount} reports`
                                : 'No reports to display'
                            }
                        </p>
                    </div>
                    
                    {/* Refresh Button - Positioned separately */}
                    <button 
                        onClick={fetchFailedReports} 
                        disabled={loading}
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white font-medium rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        <svg className={`w-5 h-5 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        <span>{loading ? 'Refreshing...' : 'Refresh Data'}</span>
                    </button>
                </div>

                {/* Table Section */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                                        👤 User ID
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                                        🔍 Inspection No
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                                        📊 Group ID
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                                        📅 Failed Date
                                    </th>
                                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                                        🏷️ Status
                                    </th>
                                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                                        ⚡ Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-600">
                                {failedItems.length > 0 ? (
                                    failedItems.map((item, index) => {
                                        const isCopying = copyingItems.has(item._id);
                                        const isOpening = openingItems.has(item._id);
                                        
                                        return (
                                            <tr 
                                                key={item._id} 
                                                className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 ${
                                                    item.status === 'Downloaded' 
                                                        ? 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 dark:border-green-500' 
                                                        : 'hover:shadow-sm'
                                                } ${index % 2 === 0 ? 'bg-white dark:bg-gray-800' : 'bg-gray-25 dark:bg-gray-750'}`}
                                            >
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <div className="flex-shrink-0 h-8 w-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                                                            <span className="text-blue-600 dark:text-blue-300 font-bold text-sm">
                                                                {Array.isArray(item.emp_ids) ? item.emp_ids[0]?.charAt(0) : item.emp_ids?.charAt(0)}
                                                            </span>
                                                        </div>
                                                        <div className="ml-3">
                                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                                {Array.isArray(item.emp_ids) ? item.emp_ids.join(', ') : item.emp_ids}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center">
                                                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                                            {item.inspectionNumber}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{item.groupId}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-600 dark:text-gray-400">
                                                        {item.failedAt ? new Date(item.failedAt).toLocaleDateString('en-US', {
                                                            year: 'numeric',
                                                            month: 'short',
                                                            day: 'numeric'
                                                        }) : 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                                        item.status === 'Downloaded' 
                                                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 ring-1 ring-green-200 dark:ring-green-700' 
                                                            : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 ring-1 ring-yellow-200 dark:ring-yellow-700'
                                                    }`}>
                                                        <span className={`w-2 h-2 rounded-full mr-2 ${
                                                            item.status === 'Downloaded' ? 'bg-green-400 dark:bg-green-300' : 'bg-yellow-400 dark:bg-yellow-300'
                                                        }`}></span>
                                                        {item.status || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex justify-center space-x-3">
                                                        {/* Open Report Button */}
                                                        <button 
                                                            onClick={() => handleManualDownload(item)}
                                                            disabled={isOpening}
                                                            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                                                                isOpening
                                                                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                                                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 dark:from-blue-600 dark:to-blue-700 dark:hover:from-blue-700 dark:hover:to-blue-800 text-white shadow-lg hover:shadow-xl focus:ring-blue-500'
                                                            }`}
                                                            title="Open report in new tab"
                                                        >
                                                            {isOpening ? (
                                                                <>
                                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                    Opening...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                                                    </svg>
                                                                    Open Report
                                                                </>
                                                            )}
                                                        </button>

                                                        {/* Copy Link Button */}
                                                        <button 
                                                            onClick={() => handleCopyLink(item)}
                                                            disabled={isCopying}
                                                            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                                                                isCopying
                                                                    ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                                                                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 dark:from-green-600 dark:to-green-700 dark:hover:from-green-700 dark:hover:to-green-800 text-white shadow-lg hover:shadow-xl focus:ring-green-500'
                                                            }`}
                                                            title="Copy report link to clipboard"
                                                        >
                                                            {isCopying ? (
                                                                <>
                                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                                    </svg>
                                                                    Copying...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                                    </svg>
                                                                    Copy Link
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-16 text-center">
                                            <div className="flex flex-col items-center justify-center">
                                                <svg className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">No reports found</h3>
                                                <p className="text-gray-500 dark:text-gray-400 text-center max-w-md">
                                                    {Object.values(filters).some(value => value) 
                                                        ? 'No failed reports match your current filters. Try adjusting your search criteria.' 
                                                        : 'No failed reports found. All reports have been processed successfully!'
                                                    }
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Footer Stats */}
                {failedItems.length > 0 && (
                    <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 transition-colors duration-300">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-6">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{totalCount}</div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Total Reports</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {failedItems.filter(item => item.status === 'Downloaded').length}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Downloaded</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                                                                {failedItems.filter(item => item.status !== 'Downloaded').length}
                                    </div>
                                    <div className="text-sm text-gray-500 dark:text-gray-400">Pending</div>
                                </div>
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                Last updated: {new Date().toLocaleTimeString()}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Custom CSS for animations */}
            <style>{`
                @keyframes slide-in-right {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out;
                }
                
                /* Dark mode custom scrollbar */
                .dark ::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                
                .dark ::-webkit-scrollbar-track {
                    background: #374151;
                }
                
                .dark ::-webkit-scrollbar-thumb {
                    background: #6B7280;
                    border-radius: 4px;
                }
                
                .dark ::-webkit-scrollbar-thumb:hover {
                    background: #9CA3AF;
                }
                
                /* Light mode custom scrollbar */
                ::-webkit-scrollbar {
                    width: 8px;
                    height: 8px;
                }
                
                ::-webkit-scrollbar-track {
                    background: #F3F4F6;
                }
                
                ::-webkit-scrollbar-thumb {
                    background: #D1D5DB;
                    border-radius: 4px;
                }
                
                ::-webkit-scrollbar-thumb:hover {
                    background: #9CA3AF;
                }
            `}</style>
        </div>
    );
};

export default FailedReportsTable;
