import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Search, Check, X, ListChecks, XCircle, Info } from "lucide-react";

const YPivotQATemplatesSpecsConfigModal = ({
  isOpen,
  onClose,
  specsData,
  selectedSpecsIds,
  onSaveConfig,
  measType
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  // ==========================================================================
  // For Before Wash: Track selection by MEASUREMENT POINT NAME (not by ID)
  // This ensures all K value variants are selected/deselected together
  // ==========================================================================
  const [selectedPointNames, setSelectedPointNames] = useState(new Set());

  // Initialize selected point names from selectedSpecsIds
  useEffect(() => {
    if (isOpen) {
      if (measType === "Before") {
        // Convert IDs to measurement point names
        const names = new Set();
        selectedSpecsIds.forEach((id) => {
          const spec = specsData.find((s) => s.id === id);
          if (spec) {
            names.add(spec.MeasurementPointEngName);
          }
        });
        setSelectedPointNames(names);
      } else {
        // For After Wash, use IDs directly converted to names
        const names = new Set();
        selectedSpecsIds.forEach((id) => {
          const spec = specsData.find((s) => s.id === id);
          if (spec) {
            names.add(spec.MeasurementPointEngName);
          }
        });
        setSelectedPointNames(names);
      }
      setSearchTerm("");
    }
  }, [selectedSpecsIds, isOpen, specsData, measType]);

  // ==========================================================================
  // Get UNIQUE measurement points for display
  // ==========================================================================
  const uniqueMeasurementPoints = useMemo(() => {
    const pointsMap = new Map();

    specsData.forEach((spec, index) => {
      const pointName = spec.MeasurementPointEngName;

      if (!pointsMap.has(pointName)) {
        // Collect all K values for this measurement point
        const kValuesForPoint = specsData
          .filter((s) => s.MeasurementPointEngName === pointName)
          .map((s) => s.kValue)
          .filter((k) => k && k !== "NA");

        // Get unique K values
        const uniqueKValues = [...new Set(kValuesForPoint)];

        // Count total specs for this point (across all K values)
        const totalSpecs = specsData.filter(
          (s) => s.MeasurementPointEngName === pointName
        ).length;

        pointsMap.set(pointName, {
          pointName: pointName,
          chineseName: spec.MeasurementPointChiName,
          no: spec.no || index + 1,
          kValues: uniqueKValues,
          totalSpecs: totalSpecs,
          // Store sample spec for display purposes
          sampleSpec: spec
        });
      }
    });

    return Array.from(pointsMap.values());
  }, [specsData]);

  // Filter based on search
  const filteredPoints = useMemo(() => {
    return uniqueMeasurementPoints.filter(
      (point) =>
        point.pointName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (point.chineseName &&
          point.chineseName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [uniqueMeasurementPoints, searchTerm]);

  // Check if a point is selected
  const isPointSelected = (pointName) => {
    return selectedPointNames.has(pointName);
  };

  // Toggle selection for a measurement point
  const togglePoint = (pointName) => {
    const newSet = new Set(selectedPointNames);
    if (newSet.has(pointName)) {
      newSet.delete(pointName);
    } else {
      newSet.add(pointName);
    }
    setSelectedPointNames(newSet);
  };

  // Select/Deselect All
  const handleSelectAll = () => {
    const newSet = new Set(selectedPointNames);
    filteredPoints.forEach((point) => {
      newSet.add(point.pointName);
    });
    setSelectedPointNames(newSet);
  };

  const handleDeselectAll = () => {
    const newSet = new Set(selectedPointNames);
    filteredPoints.forEach((point) => {
      newSet.delete(point.pointName);
    });
    setSelectedPointNames(newSet);
  };

  // ==========================================================================
  // CRITICAL: When saving, return ALL spec IDs for selected measurement points
  // This preserves different values for each K value
  // ==========================================================================
  const handleSave = () => {
    // Get ALL spec IDs where the measurement point name is selected
    const selectedIds = specsData
      .filter((spec) => selectedPointNames.has(spec.MeasurementPointEngName))
      .map((spec) => spec.id);

    console.log("Saving configuration:");
    console.log("- Selected Point Names:", Array.from(selectedPointNames));
    console.log("- Total IDs being saved:", selectedIds.length);
    console.log("- IDs:", selectedIds);

    onSaveConfig(selectedIds);
    onClose();
  };

  // Count selected unique points
  const selectedPointsCount = selectedPointNames.size;

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[110] bg-white dark:bg-gray-900 flex flex-col h-[100dvh] animate-fadeIn">
      {/* Header */}
      <div className="flex-shrink-0 px-4 sm:px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center shadow-lg safe-area-top">
        <div>
          <h2 className="text-white font-bold text-lg sm:text-xl">
            Configure Measurement Points
          </h2>
          <p className="text-indigo-200 text-xs mt-1">
            Select points to measure for {measType} Wash
          </p>
        </div>
        <button
          onClick={onClose}
          className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {/* Info Banner for Before Wash */}
      {measType === "Before" && (
        <div className="flex-shrink-0 px-4 py-3 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2 max-w-4xl mx-auto">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                Before Wash Configuration
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                Selected measurement points will apply to{" "}
                <strong>all K values</strong> with their respective spec values.
                You can select which K value to use when starting the
                measurement.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Search & Bulk Actions */}
      <div className="flex-shrink-0 p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 space-y-3">
        <div className="relative max-w-4xl mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search measurement points..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        <div className="flex gap-2 max-w-4xl mx-auto">
          <button
            onClick={handleSelectAll}
            className="flex-1 py-2.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-sm font-bold hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors flex items-center justify-center gap-2"
          >
            <ListChecks className="w-4 h-4" /> Select All
          </button>
          <button
            onClick={handleDeselectAll}
            className="flex-1 py-2.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-xl text-sm font-bold hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4" /> Deselect All
          </button>
        </div>

        {/* Selection Summary */}
        <div className="flex items-center justify-between text-sm max-w-4xl mx-auto">
          <span className="text-gray-600 dark:text-gray-400">
            Unique Measurement Points:{" "}
            <span className="font-bold text-gray-800 dark:text-white">
              {uniqueMeasurementPoints.length}
            </span>
            {measType === "Before" && (
              <span className="text-xs text-gray-400 ml-2">
                (Total specs with K values: {specsData.length})
              </span>
            )}
          </span>
          <span className="text-indigo-600 dark:text-indigo-400 font-bold">
            Selected: {selectedPointsCount}
          </span>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-auto p-4">
        <div className="max-w-4xl mx-auto space-y-2">
          {filteredPoints.length === 0 ? (
            <div className="text-center py-16">
              <Search className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">
                No matching points found.
              </p>
            </div>
          ) : (
            filteredPoints.map((point, index) => {
              const isSelected = isPointSelected(point.pointName);

              return (
                <div
                  key={point.pointName}
                  onClick={() => togglePoint(point.pointName)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center gap-4
                    ${
                      isSelected
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm"
                        : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    }
                  `}
                >
                  {/* Checkbox */}
                  <div
                    className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors flex-shrink-0
                      ${
                        isSelected
                          ? "bg-indigo-500 border-indigo-500 text-white"
                          : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                      }
                    `}
                  >
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 dark:text-white text-sm sm:text-base">
                      {point.pointName}
                    </h4>
                    {point.chineseName && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {point.chineseName}
                      </p>
                    )}

                    {/* Show K values badge for Before Wash */}
                    {measType === "Before" &&
                      point.kValues &&
                      point.kValues.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          <span className="text-[10px] text-gray-400 mr-1">
                            K values ({point.kValues.length}):
                          </span>
                          {point.kValues.slice(0, 6).map((k, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded"
                            >
                              {k}
                            </span>
                          ))}
                          {point.kValues.length > 6 && (
                            <span className="text-[10px] text-gray-400">
                              +{point.kValues.length - 6} more
                            </span>
                          )}
                        </div>
                      )}

                    {/* Show total specs count */}
                    {measType === "Before" && point.totalSpecs > 1 && (
                      <p className="text-[10px] text-indigo-500 dark:text-indigo-400 mt-1">
                        ✓ {point.totalSpecs} spec variations will be saved
                      </p>
                    )}
                  </div>

                  {/* Index Number */}
                  <div className="flex-shrink-0 text-right">
                    <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                      #{point.no}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 safe-area-bottom">
        <div className="max-w-4xl mx-auto">
          {/* Stats before save */}
          {measType === "Before" && selectedPointsCount > 0 && (
            <div className="mb-3 p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-center">
              <p className="text-xs text-indigo-600 dark:text-indigo-400">
                <strong>{selectedPointsCount}</strong> measurement points
                selected →
                <strong>
                  {" "}
                  {
                    specsData.filter((s) =>
                      selectedPointNames.has(s.MeasurementPointEngName)
                    ).length
                  }
                </strong>{" "}
                total specs will be saved (including all K values)
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl transition-all hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={selectedPointsCount === 0}
              className="flex-[2] py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Configuration ({selectedPointsCount} Points)
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default YPivotQATemplatesSpecsConfigModal;
