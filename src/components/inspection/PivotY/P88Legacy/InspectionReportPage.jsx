import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import InspectionReportModal from '../P88Legacy/inspectionreport';

const InspectionReportPage = () => {
  const { id } = useParams();
  const [inspection, setInspection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInspectionData = async () => {
      try {
        setLoading(true);
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '';
        const response = await fetch(`${apiBaseUrl}/api/p88-data/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch inspection data');
        }
        
        const data = await response.json();
        
        if (data.success) {
          setInspection(data.data);
        } else {
          throw new Error(data.message || 'Failed to load inspection data');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInspectionData();
    }
  }, [id]);

  const handleClose = () => {
    window.close(); // Close the tab
    // Or if you want to go back to the previous page:
    // window.history.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-semibold text-gray-700">Loading inspection report...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error Loading Report</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => window.close()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Close Tab
          </button>
        </div>
      </div>
    );
  }

  if (!inspection) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">📋</div>
          <h2 className="text-2xl font-bold text-gray-700 mb-2">No Data Found</h2>
          <p className="text-gray-600 mb-6">The requested inspection report could not be found.</p>
          <button 
            onClick={() => window.close()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Close Tab
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <InspectionReportModal 
        inspection={inspection} 
        onClose={handleClose}
      />
    </div>
  );
};

export default InspectionReportPage;
