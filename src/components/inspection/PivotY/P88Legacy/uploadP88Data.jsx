import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, X, Download, Eye, EyeOff } from 'lucide-react';
import axios from "axios";
import { API_BASE_URL } from "../../../../../config.js";

const UploadP88Data = () => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [uploadMessage, setUploadMessage] = useState('');
  const [csvData, setCsvData] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [showFullData, setShowFullData] = useState(false); // Toggle for full data view

  // Handle drag events
  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Handle drop event
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  // Handle file input change
  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Process the selected file
  const handleFile = (selectedFile) => {
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setUploadStatus('error');
      setUploadMessage('Please select a CSV file only.');
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setUploadStatus('error');
      setUploadMessage('File size must be less than 50MB.');
      return;
    }

    setFile(selectedFile);
    setUploadStatus(null);
    setUploadMessage('');
    
    parseCSV(selectedFile);
  };

  // Proper CSV parsing function
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i += 2;
          continue;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
      i++;
    }

    result.push(current.trim());
    return result;
  };

  // Parse CSV file
  const parseCSV = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
        
        if (lines.length === 0) {
          setUploadStatus('error');
          setUploadMessage('CSV file is empty.');
          return;
        }


        // Parse headers
        const headers = parseCSVLine(lines[0]).map(header => 
          header.replace(/^["']|["']$/g, '').trim()
        );
        setCsvHeaders(headers);

        // Parse data rows
        const data = lines.slice(1).map((line, index) => {
          try {
            const values = parseCSVLine(line).map(value => 
              value.replace(/^["']|["']$/g, '').trim()
            );
            
            const row = {};
            headers.forEach((header, i) => {
              row[header] = values[i] || '';
            });
            row._rowIndex = index + 2;
            return row;
          } catch (lineError) {
            console.error(`Error parsing line ${index + 2}:`, lineError);
            return null;
          }
        }).filter(row => row !== null);

        setCsvData(data);
        setUploadStatus('success');
        setUploadMessage(`Successfully parsed ${data.length} rows with ${headers.length} columns.`);
        
      } catch (error) {
        setUploadStatus('error');
        setUploadMessage('Error parsing CSV file. Please check the file format.');
        console.error('CSV parsing error:', error);
      }
    };
    reader.readAsText(file);
  };

  // Upload data to server
  const handleUpload = async () => {

    if (!file || csvData.length === 0) {
      setUploadMessage('No valid data to upload.');
      return;
    }

    setUploading(true);
    setUploadStatus(null);
    setUploadMessage('Uploading...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await axios.post(`${API_BASE_URL}/api/upload-p88-data`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data && response.data.success) {
        const result = response.data;
        
        setUploadStatus('success');
        setUploadMessage(
          `Successfully processed ${result.results.totalRows} rows. ` +
          `New: ${result.results.newRecords || 0}, Updated: ${result.results.updatedRecords || 0}, Errors: ${result.results.errors || 0}`
        );
        
      } else {
        throw new Error(response.data?.message || 'Upload failed');
      }

    } catch (error) {
      console.error('💥 Upload error:', error);
      setUploadStatus('error');
      setUploadMessage(`Failed to upload data: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploading(false);
    }
  };

  // Clear file and reset state
  const clearFile = () => {
    setFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setUploadStatus(null);
    setUploadMessage('');
    setShowFullData(false);
    const fileInput = document.getElementById('file-upload');
    if (fileInput) fileInput.value = '';
  };

  // Render cell content with proper handling
  const renderCellContent = (value, maxLength = 20) => {
    if (!value) return <span className="text-gray-400">-</span>;
    
    const stringValue = value.toString();
    
    if (showFullData || stringValue.length <= maxLength) {
      return <span className="break-words">{stringValue}</span>;
    }
    
    return (
      <span 
        className="cursor-help" 
        title={stringValue}
      >
        {stringValue.substring(0, maxLength)}...
      </span>
    );
  };

  return (
    <div className="max-w-full mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Upload P88 Data
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Upload CSV files to import data into the P88 system
        </p>
      </div>

      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          dragActive
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          id="file-upload"
          type="file"
          accept=".csv"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        
        <div className="space-y-4">
          <div className="mx-auto w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <Upload size={32} className="text-gray-500 dark:text-gray-400" />
          </div>
          
          <div>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              Drop your CSV file here, or{' '}
              <span className="text-blue-600 hover:text-blue-700 cursor-pointer">
                browse
              </span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Supports CSV files up to 50MB
            </p>
          </div>
        </div>
      </div>

      {/* File Info */}
      {file && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText size={20} className="text-blue-600" />
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {file.name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={clearFile}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <X size={16} className="text-gray-500" />
            </button>
          </div>
        </div>
      )}

      {/* Status Message */}
      {uploadMessage && (
        <div className={`flex items-center gap-2 p-4 rounded-lg ${
          uploadStatus === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-400'
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400'
        }`}>
          {uploadStatus === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertCircle size={20} />
          )}
          <p>{uploadMessage}</p>
        </div>
      )}

      {/* Data Preview */}
      {csvData.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Data Preview ({csvData.length} rows, {csvHeaders.length} columns)
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Showing first 5 rows
              </p>
            </div>
            <button
              onClick={() => setShowFullData(!showFullData)}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              {showFullData ? <EyeOff size={16} /> : <Eye size={16} />}
              {showFullData ? 'Collapse' : 'Expand'} Data
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-gray-900 dark:text-white border-r w-12">
                      #
                    </th>
                    {csvHeaders.map((header, index) => (
                      <th
                        key={index}
                        className="px-3 py-2 text-left font-medium text-gray-900 dark:text-white border-r whitespace-nowrap"
                        style={{ minWidth: showFullData ? 'auto' : '120px', maxWidth: showFullData ? 'none' : '200px' }}
                      >
                        <div className={showFullData ? '' : 'truncate'} title={header}>
                          {header}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {csvData.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-3 py-2 text-gray-500 dark:text-gray-400 border-r font-mono text-xs">
                        {rowIndex + 1}
                      </td>
                      {csvHeaders.map((header, colIndex) => (
                        <td
                          key={colIndex}
                          className="px-3 py-2 text-gray-900 dark:text-gray-300 border-r"
                          style={{ 
                            minWidth: showFullData ? 'auto' : '120px', 
                            maxWidth: showFullData ? 'none' : '200px',
                            wordBreak: showFullData ? 'break-word' : 'normal'
                          }}
                        >
                          {renderCellContent(row[header], showFullData ? 1000 : 20)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {csvData.length > 5 && (
              <div className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-t">
                ... and {csvData.length - 5} more rows
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {csvData.length > 0 && (
        <div className="flex justify-center">
          <button
            onClick={handleUpload}
            disabled={uploading}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              uploading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 active:scale-95'
            } text-white`}
          >
            {uploading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Uploading...
              </div>
            ) : (
              `Upload ${csvData.length} Records`
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default UploadP88Data;
