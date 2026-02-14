import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef
} from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  Save,
  Loader2,
  Ruler,
  Edit3,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";
import YPivotQAInspectionMeasurementConfig from "./YPivotQAInspectionMeasurementConfig";

// --- AUTO DISMISS MODAL COMPONENT ---
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

// Add this helper at the top of the file
const blobToBase64 = async (url) => {
  if (!url || !url.startsWith("blob:")) return url;
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    console.error("Error converting blob to base64", e);
    return null;
  }
};

const YPivotQAInspectionMeasurementDataSave = ({
  selectedOrders,
  orderData,
  reportData,
  onUpdateMeasurementData,
  activeGroup,
  reportId,
  isReportSaved,
  onSaveSuccess,
  targetStage = "Before",
  displayLabel = null
}) => {
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    message: ""
  });

  // Ref to track if we've already fetched data for this reportId
  const fetchedReportIdRef = useRef(null);

  // =================================================================================
  // 1. FILTER DATA & UNPACK CONFIG (View Logic)
  // =================================================================================
  const stageSpecificReportData = useMemo(() => {
    const allMeasurements = reportData.measurementData?.savedMeasurements || [];

    // Filter Measurements by Stage
    const filteredMeasurements = allMeasurements.filter((m) => {
      if (m.stage) {
        return m.stage === targetStage;
      }
      // Fallback for legacy data - use kValue presence to guess
      // If kValue exists and not empty, likely Before wash
      if (targetStage === "Before") {
        return true; // Default legacy data to Before
      }
      return false;
    });

    // Unpack Config (Specs List) based on Stage
    const configKey = `config${targetStage}`; // e.g. "configBefore"
    const specificConfig = reportData.measurementData?.[configKey] || {};

    console.log(
      `[Wrapper ${targetStage}] Filtered ${filteredMeasurements.length} measurements`
    );
    console.log(
      `[Wrapper ${targetStage}] Config:`,
      Object.keys(specificConfig)
    );

    return {
      ...reportData,
      selectedTemplate: {
        ...reportData.selectedTemplate,
        Measurement: targetStage // Override to trick child component
      },
      measurementData: {
        // Include global manual data
        manualDataByGroup: reportData.measurementData?.manualDataByGroup || {},
        // Include stage-specific config
        ...specificConfig,
        // Include filtered measurements
        savedMeasurements: filteredMeasurements
      }
    };
  }, [reportData, targetStage]);

  // =================================================================================
  // 2. MERGE DATA & PACK CONFIG (Update Logic)
  // =================================================================================
  const handleChildUpdate = useCallback(
    (childUpdates, options = {}) => {
      // If this is data coming from backend fetch, pass it through directly
      if (options.isFromBackend) {
        onUpdateMeasurementData(childUpdates, options);
        return;
      }

      const allMeasurements =
        reportData.measurementData?.savedMeasurements || [];

      // A. Identify measurements from OTHER stages (to preserve them)
      const otherStageMeasurements = allMeasurements.filter((m) => {
        if (m.stage) return m.stage !== targetStage;
        // Legacy data handling
        if (targetStage === "Before") return false;
        return true;
      });

      // ---PREVENT DATA WIPE ---
      // If childUpdates contains new measurements, use them.
      // If NOT (e.g. during auto-save reset), keep the existing measurements for this stage.
      let measurementsToProcess = childUpdates.savedMeasurements;

      if (!measurementsToProcess) {
        measurementsToProcess = allMeasurements.filter(
          (m) =>
            m.stage === targetStage || (!m.stage && targetStage === "Before")
        );
      }

      const updatedCurrentStageMeasurements = measurementsToProcess.map(
        (m) => ({
          ...m,
          stage: targetStage
        })
      );
      // --- FIX END ---

      const combinedMeasurements = [
        ...otherStageMeasurements,
        ...updatedCurrentStageMeasurements
      ];

      // B. Pack Configuration Data into Namespaced Key
      // (Remove savedMeasurements from configFields so we don't duplicate it)
      const { savedMeasurements, manualDataByGroup, ...configFields } =
        childUpdates;

      const configKey = `config${targetStage}`;

      // Build the update object
      const updatePayload = {
        ...reportData.measurementData, // Keep global state
        savedMeasurements: combinedMeasurements,
        [configKey]: {
          ...(reportData.measurementData?.[configKey] || {}),
          ...configFields // Store specs list and selections
        }
      };

      // Also update manualDataByGroup if provided
      if (manualDataByGroup) {
        updatePayload.manualDataByGroup = {
          ...(reportData.measurementData?.manualDataByGroup || {}),
          ...manualDataByGroup
        };
      }

      onUpdateMeasurementData(updatePayload);
    },
    [reportData, targetStage, onUpdateMeasurementData]
  );

  // =================================================================================
  // 3. FETCH EXISTING DATA FROM BACKEND (Only once per reportId)
  // =================================================================================
  useEffect(() => {
    const fetchExistingMeasurementData = async () => {
      if (!reportId) return;

      // Skip if we already fetched for this reportId
      if (fetchedReportIdRef.current === reportId) {
        return;
      }

      const measurementData = reportData.measurementData || {};
      const savedMeasurements = measurementData.savedMeasurements || [];

      // Check if data is already properly hydrated (Sets instead of Arrays)
      const hasProperlyFormattedData =
        savedMeasurements.length > 0 &&
        savedMeasurements[0]?.allEnabledPcs instanceof Set;

      // Check if config exists for THIS stage
      const configKey = `config${targetStage}`;
      const hasConfig = measurementData[configKey]?.fullSpecsList?.length > 0;

      if (hasProperlyFormattedData && hasConfig) {
        console.log(
          `[Wrapper ${targetStage}] Data already hydrated, skipping fetch`
        );
        setIsUpdateMode(savedMeasurements.some((m) => m.stage === targetStage));
        fetchedReportIdRef.current = reportId;
        return;
      }

      // Check if measurements exist for this stage (even without full hydration)
      const stageHasMeasurements = savedMeasurements.some(
        (m) => m.stage === targetStage || (!m.stage && targetStage === "Before")
      );

      if (stageHasMeasurements) {
        setIsUpdateMode(true);
      }

      // If parent already has processed data but just missing specs, skip fetch
      // The main page's useEffect will fetch specs
      if (savedMeasurements.length > 0) {
        console.log(
          `[Wrapper ${targetStage}] Parent has data, waiting for specs fetch`
        );
        fetchedReportIdRef.current = reportId;
        return;
      }

      // Only fetch if we have no data at all
      setLoadingData(true);
      console.log(`[Wrapper ${targetStage}] Fetching data from backend...`);

      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}`
        );

        if (res.data.success && res.data.data.measurementData) {
          const backendData = res.data.data.measurementData;

          // Filter for this stage
          const stageMeasurements = backendData.filter(
            (m) =>
              m.stage === targetStage || (!m.stage && targetStage === "Before")
          );

          setIsUpdateMode(stageMeasurements.length > 0);

          // Process Measurements (Arrays -> Sets)
          const processedMeasurements = backendData
            .filter((m) => m.size !== "Manual_Entry")
            .map((m) => ({
              ...m,
              allEnabledPcs: new Set(m.allEnabledPcs || []),
              criticalEnabledPcs: new Set(m.criticalEnabledPcs || []),
              stage: m.stage || "Before"
            }));

          // Process Manual Data
          const processedManualDataByGroup = {};
          backendData.forEach((item) => {
            if (item.manualData) {
              const processedImages = (item.manualData.images || []).map(
                (img) => {
                  let displayUrl = img.imageURL;
                  if (
                    displayUrl &&
                    !displayUrl.startsWith("http") &&
                    !displayUrl.startsWith("data:")
                  ) {
                    displayUrl = `${API_BASE_URL}${displayUrl}`;
                  }
                  return {
                    id: img.imageId,
                    url: displayUrl,
                    imgSrc: displayUrl,
                    editedImgSrc: displayUrl,
                    remark: img.remark || "",
                    history: []
                  };
                }
              );
              processedManualDataByGroup[item.groupId] = {
                remarks: item.manualData.remarks || "",
                status: item.manualData.status || "Pass",
                images: processedImages
              };
            }
          });

          // Extract K values used in Before measurements
          const beforeMeasurements = processedMeasurements.filter(
            (m) => m.stage === "Before"
          );
          const usedKValues = [
            ...new Set(
              beforeMeasurements
                .map((m) => m.kValue)
                .filter((k) => k && k !== "NA")
            )
          ].sort();

          onUpdateMeasurementData(
            {
              savedMeasurements: processedMeasurements,
              manualDataByGroup: processedManualDataByGroup,
              isConfigured: processedMeasurements.length > 0,
              // Set up stage configs with what we know from saved data
              configBefore:
                beforeMeasurements.length > 0
                  ? {
                      isConfigured: true,
                      lastSelectedKValue:
                        usedKValues.length > 0
                          ? usedKValues[usedKValues.length - 1]
                          : "",
                      usedKValues: usedKValues
                    }
                  : undefined,
              configAfter: processedMeasurements.some(
                (m) => m.stage === "After"
              )
                ? {
                    isConfigured: true
                  }
                : undefined
            },
            { isFromBackend: true }
          );

          fetchedReportIdRef.current = reportId;
        }
      } catch (error) {
        console.error(
          `[Wrapper ${targetStage}] Error fetching measurement data:`,
          error
        );
      } finally {
        setLoadingData(false);
      }
    };

    if (reportId) {
      fetchExistingMeasurementData();
    }
  }, [reportId, targetStage]);

  // Reset fetch ref when reportId changes
  useEffect(() => {
    if (reportId !== fetchedReportIdRef.current) {
      fetchedReportIdRef.current = null;
    }
  }, [reportId]);

  // =================================================================================
  // 4. SAVE HANDLER
  // =================================================================================
  const handleSaveData = async () => {
    if (!isReportSaved || !reportId) {
      setStatusModal({
        isOpen: true,
        type: "error",
        message: "Please save Order information first."
      });
      return;
    }

    const currentMeasurements =
      reportData.measurementData?.savedMeasurements || [];
    const manualDataByGroup =
      reportData.measurementData?.manualDataByGroup || {};

    // Filter to only save measurements for THIS stage
    const stageMeasurements = currentMeasurements.filter(
      (m) => m.stage === targetStage
    );

    setSaving(true);
    try {
      const payload = [];

      const processManualImagesForSave = async (images) => {
        if (!images || images.length === 0) return [];

        return Promise.all(
          images.map(async (img) => {
            let payloadImgSrc = null;
            let payloadImageURL = null;

            // Get the raw source
            const rawSrc = img.editedImgSrc || img.imgSrc || img.url;

            if (rawSrc) {
              if (rawSrc.startsWith("blob:")) {
                // CONVERT BLOB TO BASE64 FOR BACKEND
                payloadImgSrc = await blobToBase64(rawSrc);
                payloadImageURL = null; // Clear URL so backend creates new file
              } else if (rawSrc.startsWith("data:")) {
                // Already Base64
                payloadImgSrc = rawSrc;
                payloadImageURL = null;
              } else if (rawSrc.includes("/storage/")) {
                // Existing Server Path - Keep it, Don't send Base64
                // Strip full domain if present
                if (rawSrc.startsWith("http")) {
                  try {
                    const urlObj = new URL(rawSrc);
                    payloadImageURL = urlObj.pathname;
                  } catch (e) {
                    payloadImageURL = rawSrc;
                  }
                } else {
                  payloadImageURL = rawSrc;
                }
                payloadImgSrc = null;
              }
            }

            return {
              id: img.id,
              imageId: img.id,
              imageURL: payloadImageURL, // Send relative path if existing
              imgSrc: payloadImgSrc, // Send Base64 if new/edited
              remark: img.remark
            };
          })
        );
      };

      // Group measurements by groupId for this stage
      const measurementsByGroup = {};
      stageMeasurements.forEach((m) => {
        if (!measurementsByGroup[m.groupId]) {
          measurementsByGroup[m.groupId] = [];
        }
        measurementsByGroup[m.groupId].push(m);
      });

      // Process each group
      // We need to await the image processing
      const allGroupIdsStr = Object.keys(measurementsByGroup);

      for (const groupIdStr of allGroupIdsStr) {
        const groupMeasurements = measurementsByGroup[groupIdStr];
        const groupId = parseInt(groupIdStr);

        // Process this group's measurements
        for (let index = 0; index < groupMeasurements.length; index++) {
          const m = groupMeasurements[index];
          const isFirstInGroup = index === 0;

          const cleanMeasurement = {
            ...m,
            allEnabledPcs: Array.from(m.allEnabledPcs || []),
            criticalEnabledPcs: Array.from(m.criticalEnabledPcs || []),
            stage: targetStage
          };

          // Attach manual data only to first measurement in group
          if (isFirstInGroup) {
            const groupManualData = manualDataByGroup[groupId];
            if (groupManualData) {
              // AWAIT THE IMAGE PROCESSING
              const processedImages = await processManualImagesForSave(
                groupManualData.images
              );

              cleanMeasurement.manualData = {
                remarks: groupManualData.remarks,
                status: groupManualData.status,
                images: processedImages
              };
            }
          } else {
            cleanMeasurement.manualData = null;
          }
          payload.push(cleanMeasurement);
        }
      }

      // Handle groups with only manual data (no measurements)
      const allManualGroupIds = Object.keys(manualDataByGroup).map(Number);
      const groupsWithMeasurements = new Set(
        stageMeasurements.map((m) => m.groupId)
      );

      for (const groupId of allManualGroupIds) {
        if (!groupsWithMeasurements.has(groupId)) {
          const groupManualData = manualDataByGroup[groupId];
          if (
            groupManualData &&
            (groupManualData.remarks || groupManualData.images?.length > 0)
          ) {
            // AWAIT THE IMAGE PROCESSING
            const processedImages = await processManualImagesForSave(
              groupManualData.images
            );

            payload.push({
              groupId: groupId,
              size: "Manual_Entry",
              stage: targetStage,
              line: "",
              table: "",
              color: "",
              qcUser: null,
              allMeasurements: {},
              criticalMeasurements: {},
              allEnabledPcs: [],
              criticalEnabledPcs: [],
              inspectorDecision:
                groupManualData.status === "Pass" ? "pass" : "fail",
              manualData: {
                remarks: groupManualData.remarks,
                status: groupManualData.status,
                images: processedImages
              }
            });
          }
        }
      }

      if (payload.length === 0) {
        setSaving(false);
        setStatusModal({
          isOpen: true,
          type: "error",
          message: `No ${displayLabel || targetStage} data to save.`
        });
        return;
      }

      console.log(`[Wrapper ${targetStage}] Saving ${payload.length} items`);

      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/update-measurement-data`,
        {
          reportId: reportId,
          measurementData: payload
        }
      );

      if (res.data.success) {
        setIsUpdateMode(true);
        if (onSaveSuccess) onSaveSuccess();
        setStatusModal({
          isOpen: true,
          type: "success",
          message: `${displayLabel || targetStage} Measurements Saved!`
        });
      }
    } catch (error) {
      console.error(
        `[Wrapper ${targetStage}] Error saving measurements:`,
        error
      );
      setStatusModal({
        isOpen: true,
        type: "error",
        message: "Failed to save measurement results."
      });
    } finally {
      setSaving(false);
    }
  };

  // =================================================================================
  // 5. AUTO-SAVE EFFECT
  // =================================================================================
  useEffect(() => {
    // Check if the trigger flag is present in the unpacked measurement data
    if (stageSpecificReportData?.measurementData?.triggerAutoSave) {
      // 1. Trigger the Save
      handleSaveData();

      // 2. Reset the flag immediately to prevent infinite loops
      // We use handleChildUpdate to ensure it goes through the same logic path
      // passing skipSelectionPersist to avoid resetting UI state like K-value
      handleChildUpdate(
        { triggerAutoSave: false },
        { skipSelectionPersist: true }
      );
    }
  }, [
    stageSpecificReportData?.measurementData?.triggerAutoSave,
    handleChildUpdate
  ]);

  // =================================================================================
  // 6. RENDER
  // =================================================================================
  if (loadingData) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <span className="ml-3 text-gray-600 font-medium">
          Loading {displayLabel || targetStage} measurements...
        </span>
      </div>
    );
  }

  if (!reportData?.selectedTemplate) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Ruler className="w-12 h-12 text-gray-300 mb-4" />
        <p className="text-gray-500">Please select a Report Type first.</p>
      </div>
    );
  }

  return (
    <div className="relative pb-24">
      <YPivotQAInspectionMeasurementConfig
        // Key forces re-mount when switching tabs
        key={`${targetStage}_${reportId || "new"}`}
        selectedOrders={selectedOrders}
        orderData={orderData}
        reportData={stageSpecificReportData}
        onUpdateMeasurementData={handleChildUpdate}
        activeGroup={activeGroup}
        displayLabel={displayLabel}
      />

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-40">
        <div className="max-w-8xl mx-auto flex justify-end px-4">
          <button
            onClick={handleSaveData}
            disabled={!isReportSaved || saving}
            className={`
              flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95
              ${
                !isReportSaved
                  ? "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                  : isUpdateMode
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                  : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
              }
            `}
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isUpdateMode ? "Updating..." : "Saving..."}
              </>
            ) : (
              <>
                {isUpdateMode ? (
                  <Edit3 className="w-5 h-5" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {isUpdateMode
                  ? `Update ${displayLabel || targetStage}`
                  : `Save ${displayLabel || targetStage}`}
              </>
            )}
          </button>
        </div>
      </div>

      <AutoDismissModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
        type={statusModal.type}
        message={statusModal.message}
      />
    </div>
  );
};

export default YPivotQAInspectionMeasurementDataSave;
