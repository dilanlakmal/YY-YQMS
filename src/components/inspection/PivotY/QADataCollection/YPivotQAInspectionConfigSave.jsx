import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  Save,
  Loader2,
  Info,
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";
import YPivotQAInspectionLineTableColorConfig from "./YPivotQAInspectionLineTableColorConfig";

// ==============================================================================
// AUTO-DISMISS STATUS MODAL
// ==============================================================================
const AutoDismissModal = ({ isOpen, onClose, type, message }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isSuccess = type === "success";

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px] animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center gap-3 min-w-[250px] transform scale-100 transition-all">
        <div
          className={`p-3 rounded-full ${
            isSuccess
              ? "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
              : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-8 h-8" />
          ) : (
            <AlertCircle className="w-8 h-8" />
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white text-center">
          {isSuccess ? "Success" : "Error"}
        </h3>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 text-center">
          {message}
        </p>
      </div>
    </div>,
    document.body
  );
};

// ==============================================================================
// MAIN COMPONENT
// ==============================================================================
const YPivotQAInspectionConfigSave = ({
  reportData,
  orderData,
  onUpdate,
  onSetActiveGroup,
  activeGroup,
  reportId,
  isReportSaved,
  onSaveSuccess
}) => {
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);

  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    message: ""
  });

  const [lockTrigger, setLockTrigger] = useState(0);

  // --- FETCH EXISTING DATA ---
  useEffect(() => {
    const fetchExistingConfig = async () => {
      if (!reportId) {
        setIsUpdateMode(false);
        return;
      }

      if (reportData.lineTableConfig && reportData.lineTableConfig.length > 0) {
        setIsUpdateMode(true);
        return;
      }

      setLoadingData(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}`
        );

        if (res.data.success && res.data.data.inspectionConfig) {
          const savedConfig = res.data.data.inspectionConfig;
          if (savedConfig?.configGroups?.length > 0) {
            onUpdate(
              { lineTableConfig: savedConfig.configGroups },
              { isFromBackend: true }
            );
            setIsUpdateMode(true);
          } else {
            setIsUpdateMode(false);
          }
        } else {
          setIsUpdateMode(false);
        }
      } catch (error) {
        console.error("Error fetching config:", error);
        setIsUpdateMode(false);
      } finally {
        setLoadingData(false);
      }
    };

    if (reportId) fetchExistingConfig();
  }, [reportId]);

  // --- SAVE TO BACKEND ---
  const saveToBackend = async (
    groupsToSave,
    showModal = true,
    shouldLock = true
  ) => {
    if (!isReportSaved || !reportId) return;

    const selectedTemplate = reportData.selectedTemplate;
    const isAQL = selectedTemplate?.InspectedQtyMethod === "AQL";
    const aqlSampleSize = reportData.config?.aqlSampleSize || 0;

    let total = 0;
    if (isAQL) {
      total = aqlSampleSize;
    } else {
      total = groupsToSave.reduce(
        (t, g) =>
          t + g.assignments.reduce((s, a) => s + (parseInt(a.qty) || 0), 0),
        0
      );
    }

    setSaving(true);
    try {
      const payload = {
        reportName: selectedTemplate.ReportType,
        inspectionMethod: selectedTemplate.InspectedQtyMethod || "Fixed",
        sampleSize: total,
        configGroups: groupsToSave
      };

      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/update-inspection-config`,
        { reportId, configData: payload }
      );

      if (res.data.success) {
        setIsUpdateMode(true);
        // ONLY TRIGGER LOCK IF REQUESTED
        if (shouldLock) {
          setLockTrigger((prev) => prev + 1);
        }

        if (onSaveSuccess) {
          onSaveSuccess();
        }

        // setLockTrigger((prev) => prev + 1);
        // if (onSaveSuccess) {
        //   onSaveSuccess();
        // }
        if (showModal) {
          setStatusModal({
            isOpen: true,
            type: "success",
            message: isUpdateMode
              ? "Config Data Updated Successfully!"
              : "Config Data Saved Successfully!"
          });
        }
      }
    } catch (error) {
      console.error("Save error:", error);
      if (showModal) {
        setStatusModal({
          isOpen: true,
          type: "error",
          message: "Failed to save configuration."
        });
      }
    } finally {
      setSaving(false);
    }
  };

  // --- SAVE BUTTON HANDLER ---
  const handleSaveClick = () => {
    if (!isReportSaved || !reportId) {
      setStatusModal({
        isOpen: true,
        type: "error",
        message: "Please save Order information first."
      });
      return;
    }

    const groups = reportData.lineTableConfig || [];
    if (groups.length === 0) {
      setStatusModal({
        isOpen: true,
        type: "error",
        message: "Add at least one configuration group."
      });
      return;
    }

    // Validate all groups
    const selectedTemplate = reportData.selectedTemplate;
    const showLine = selectedTemplate?.Line === "Yes";
    const showTable = selectedTemplate?.Table === "Yes";
    const showColors = selectedTemplate?.Colors === "Yes";
    const showQC = selectedTemplate?.isQCScan === "Yes";
    const isSubCon = reportData.config?.isSubCon;

    for (let i = 0; i < groups.length; i++) {
      const g = groups[i];
      const missing = [];
      if (showLine && !g.line) missing.push("Line");
      if (showTable && !isSubCon && !g.table) missing.push("Table");
      if (showColors && !g.color) missing.push("Color");
      if (showQC && g.assignments.some((a) => !a.qcUser)) missing.push("QC");

      if (missing.length > 0) {
        Swal.fire({
          icon: "warning",
          title: `Group ${i + 1} Incomplete`,
          text: `Fill: ${missing.join(", ")}`
        });
        return;
      }
    }
    // Manual Click = Lock the UI (Pass true)
    saveToBackend(groups, true, true);
    //saveToBackend(groups);
  };

  // --- IMMEDIATE SAVE HANDLER ---
  const handleImmediateSave = (updatedGroups) => {
    saveToBackend(updatedGroups, false, false);
    //saveToBackend(updatedGroups, true);
  };

  // ✅ Handle Clear All Backend Call
  const handleClearAllConfig = async () => {
    if (!reportId) return;

    setSaving(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/clear-inspection-config`,
        { reportId }
      );

      if (res.data.success) {
        // Update local state to empty
        onUpdate({ lineTableConfig: [] }, { isFromBackend: true });

        // Show success modal
        setStatusModal({
          isOpen: true,
          type: "success",
          message: "All configurations removed successfully!"
        });

        // Update UI mode
        setIsUpdateMode(false); // Reset to not saved/empty state if you prefer
      }
    } catch (error) {
      console.error("Clear error:", error);
      setStatusModal({
        isOpen: true,
        type: "error",
        message: "Failed to clear configuration."
      });
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="flex flex-col justify-center items-center h-64 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <span className="text-gray-600 dark:text-gray-400 font-medium text-sm">
          Loading configuration...
        </span>
      </div>
    );
  }

  return (
    <div className="relative pb-24">
      {/* Info Banner */}
      {!activeGroup && (
        <div className="mb-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-2.5 sm:p-3 rounded-xl flex items-start gap-2">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-bold text-blue-700 dark:text-blue-300">
              Configuration Required
            </p>
            <p className="text-[10px] sm:text-xs text-blue-600 dark:text-blue-400">
              Add groups below and click "Start" to begin inspection.
            </p>
          </div>
        </div>
      )}

      {/* Config Component */}
      <YPivotQAInspectionLineTableColorConfig
        reportData={reportData}
        orderData={orderData}
        onUpdate={onUpdate}
        onSetActiveGroup={onSetActiveGroup}
        activeGroup={activeGroup}
        onSaveWithData={handleImmediateSave}
        onClearAll={handleClearAllConfig}
        lockTrigger={lockTrigger}
      />

      {/* Fixed Bottom Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_12px_-1px_rgba(0,0,0,0.1)] z-40">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          {/* Status */}
          <div className="hidden sm:flex items-center gap-2">
            {isUpdateMode ? (
              <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                Data Saved
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                Not Saved
              </span>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={handleSaveClick}
            disabled={!isReportSaved || saving}
            className={`w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-[0.98] ${
              isReportSaved
                ? isUpdateMode
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isUpdateMode ? "Updating..." : "Saving..."}
              </>
            ) : isUpdateMode ? (
              <>
                <RefreshCw className="w-5 h-5" />
                Update Config Data
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Config Data
              </>
            )}
          </button>
        </div>
      </div>

      {/* Status Modal */}
      <AutoDismissModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
        type={statusModal.type}
        message={statusModal.message}
      />
    </div>
  );
};

export default YPivotQAInspectionConfigSave;
