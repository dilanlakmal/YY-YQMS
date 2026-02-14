import React from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const InspectionReportPage = ({ inspection, onClose }) => {
  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'N/A';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  const downloadPDF = async () => {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = 210;
    const pdfHeight = 297;
    const margin = 15;
    const contentWidth = pdfWidth - (margin * 2);
    const contentHeight = pdfHeight - (margin * 2);

    // Get all sections to be rendered separately
    const sections = [
      'page-1-content',
      'page-2-content'
    ];

    let isFirstPage = true;

    for (const sectionId of sections) {
      const element = document.getElementById(sectionId);
      if (!element) continue;

      const canvas = await html2canvas(element, {
        scale: 1.2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        removeContainer: true,
        imageTimeout: 15000,
        height: element.scrollHeight,
        width: element.scrollWidth
      });

      const imgData = canvas.toDataURL('image/png', 0.95);
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height * contentWidth) / canvas.width;

      if (!isFirstPage) {
        pdf.addPage();
      }

      // If content is too tall for one page, split it
      if (imgHeight > contentHeight) {
        let heightLeft = imgHeight;
        let position = margin;

        pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
        heightLeft -= contentHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', margin, position, imgWidth, imgHeight);
          heightLeft -= contentHeight;
        }
      } else {
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      }

      isFirstPage = false;
    }

    pdf.save(`Inspection_Report_${inspection.inspectionNumbers?.join('_') || 'Unknown'}.pdf`);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pass': return 'bg-emerald-500 text-white';
      case 'Fail': return 'bg-red-500 text-white';
      case 'Rejected': return 'bg-red-500 text-white';
      case 'Pending': return 'bg-amber-500 text-white';
      case 'Reworked': return 'bg-amber-500 text-white';
      case 'Accepted': return 'bg-emerald-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Pass': return 'bg-emerald-100 text-emerald-800';
      case 'Fail': return 'bg-red-100 text-red-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Pending Approval': return 'bg-amber-100 text-amber-800';
      case 'Reworked': return 'bg-amber-100 text-amber-800';
      case 'Accepted': return 'bg-emerald-100 text-emerald-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      window.close();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        
        {/* Page Header - Not included in PDF */}
        <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 rounded-2xl px-6 py-6 mb-6 shadow-xl print:hidden">
          <div className="flex justify-between items-center">
            <div className="text-white">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                📋 Inspection Report
              </h1>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={downloadPDF} 
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download PDF
              </button>
              <button 
                onClick={handleClose} 
                className="flex items-center gap-2 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Close
              </button>
            </div>
          </div>
        </div>

        {/* Page 1 Content */}
        <div 
          id="page-1-content" 
          className="bg-white p-8 rounded-lg shadow-sm mb-6"
          style={{
            fontFamily: 'Arial, sans-serif',
            lineHeight: '1.4',
            color: '#333'
          }}
        >
          
          {/* Document Header */}
          <div className="border-b-2 border-gray-300 pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {inspection.poNumbers?.join(', ') || 'N/A'} - Inspection Summary
                </h1>
                <p className="text-lg text-gray-700 mb-1">
                  Yorkmars (Cambodia) Garment MFG Co., LTD
                </p>
                <p className="text-base text-gray-600">
                  Inspection #: {inspection.inspectionNumbers?.join(', ') || 'N/A'} | 
                  Group #: {inspection.groupNumber || 'N/A'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-base font-semibold text-gray-900">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
         
          <div className="flex items-center justify-center pb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-800">
                Inspection Summary Report
              </h2>
            </div>
          </div>

          {/* Report Type and Status */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {inspection.reportType || 'Inline Inspection- Finishing'}
                </h2>
              </div>
              <div className={`px-4 py-2 rounded-lg font-bold text-lg ${getStatusColor(inspection.inspectionResult)}`}>
                {inspection.inspectionResult || 'Pending'}
              </div>
            </div>
          </div>

          {/* Date Information */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <p className="text-sm font-semibold text-purple-700 mb-1">Scheduled Inspection Date</p>
              <p className="text-base font-bold text-gray-800">{formatDateTime(inspection.scheduledInspectionDate)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <p className="text-sm font-semibold text-green-700 mb-1">Submitted Inspection Date</p>
              <p className="text-base font-bold text-gray-800">{formatDateTime(inspection.submittedInspectionDate)}</p>
            </div>
          </div>

          {/* Inspection Details Table */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Inspection Details</h3>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <table className="w-full text-m">
                <tbody>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700 w-1/6">Report Type</td>
                    <td className="py-4 pl-2 text-gray-800 w-1/6">{inspection.reportType || 'N/A'}</td>
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700 w-1/6">Project</td>
                    <td className="py-4 pl-2 text-gray-800 w-1/4">{inspection.project || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700">Inspector</td>
                    <td className="py-4 pl-2 text-gray-800">{inspection.inspector || 'N/A'}</td>
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700">Supplier</td>
                    <td className="py-4 pl-2 text-gray-800">{inspection.supplier || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700">Total PO Items Qty</td>
                    <td className="py-4 pl-2 text-gray-800">{inspection.totalPoItemsQty?.toLocaleString() || '0'}</td>
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700">Sample Inspected</td>
                    <td className="py-4 pl-2 text-gray-800">{inspection.sampleInspected || '0'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700">Factory Name</td>
                    <td className="py-4 pl-2 text-gray-800">{inspection.supplier || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700">Created Date</td>
                    <td className="py-4 pl-2 text-gray-800">{formatDate(inspection.createdAt)}</td>
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700">Submitted Inspection Date</td>
                    <td className="py-4 pl-2 text-gray-800">{formatDate(inspection.submittedInspectionDate)}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700">Last Modified Date</td>
                    <td className="py-4 pl-2 text-gray-800">{formatDate(inspection.lastModifiedDate)}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700">PO #</td>
                    <td className="py-4 pl-2 text-gray-800">{inspection.poNumbers?.join(', ') || 'N/A'}</td>
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700">ETD</td>
                    <td className="py-4 pl-2 text-gray-800">{inspection.etd?.length > 0 ? inspection.etd.map(date => formatDate(date)).join(', ') : 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700">Destination</td>
                    <td className="py-4 pl-2 text-gray-800">{inspection.destination || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700">SKU #</td>
                    <td className="py-4 pl-2 text-gray-800">{inspection.skuNumbers?.join(', ') || 'N/A'}</td>
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700">Description</td>
                    <td className="py-4 pl-2 text-gray-800">{inspection.description || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700">Style</td>
                    <td className="py-4 pl-2 text-gray-800">{inspection.style || 'N/A'}</td>
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700">Color</td>
                    <td className="py-4 pl-2 text-gray-800">{inspection.colors?.join(', ') || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700">Custom PO#</td>
                    <td className="py-4 pl-2 text-gray-800">{inspection.poLineCustomerPO || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-gray-200">
                    <td className="py-4 px-6 font-bold bg-blue-50 text-gray-700">Inspected Qty (Pcs)</td>
                    <td className="py-4 pl-2 text-gray-800">{inspection.qtyInspected?.toLocaleString() || '0'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Page 2 Content */}
        <div 
          id="page-2-content" 
          className="bg-white p-8 rounded-lg shadow-sm"
          style={{
            fontFamily: 'Arial, sans-serif',
            lineHeight: '1.4',
            color: '#333'
          }}
        >
          
          {/* Conclusion */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-3">Conclusion</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Inspection Result</p>
                <span className={`inline-block px-3 py-2 rounded-lg text-sm font-semibold ${getStatusBadgeColor(inspection.inspectionResult)}`}>
                  {inspection.inspectionResult || 'Pending'}
                </span>
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-2">Approval Status</p>
                <span className={`inline-block px-3 py-2 rounded-lg text-sm font-semibold ${getStatusBadgeColor(inspection.approvalStatus)}`}>
                  {inspection.approvalStatus || 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Defect Summary and Quality Metrics */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">Defect Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <span className="font-semibold text-gray-800">Critical</span>
                  <span className="text-xl font-bold text-red-600">{inspection.qtyCriticalDefects || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg border-l-4 border-amber-500">
                  <span className="font-semibold text-gray-800">Major</span>
                  <span className="text-xl font-bold text-amber-600">{inspection.qtyMajorDefects || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-lg border-l-4 border-emerald-500">
                  <span className="font-semibold text-gray-800">Minor</span>
                  <span className="text-xl font-bold text-emerald-600">{inspection.qtyMinorDefects || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                  <span className="font-semibold text-gray-800">Total Product + Quality Plan Defects</span>
                  <span className="text-xl font-bold text-blue-600">{inspection.totalNumberOfDefects || 0}</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">Quality Metrics</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-800">Total Defective Units</span>
                  <span className="text-xl font-bold text-gray-800">{inspection.totalDefectiveUnits || 0}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-800">Defect Rate</span>
                  <span className="text-xl font-bold text-gray-800">{inspection.defectRate || 0}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Defects */}
          {inspection.defects && inspection.defects.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Detailed Defects</h3>
              <div className="border border-gray-300 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border-b border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Defect Name</th>
                      <th className="border-b border-gray-300 px-4 py-3 text-left font-semibold text-gray-700">Quantity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inspection.defects.map((defect, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border-b border-gray-200 px-4 py-3 text-gray-800">{defect.defectName}</td>
                        <td className="border-b border-gray-200 px-4 py-3 font-semibold text-gray-800">{defect.count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Comments */}
          {inspection.allComments && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">Comments</h3>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="text-gray-700 leading-relaxed">{inspection.allComments}</p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default InspectionReportPage;
