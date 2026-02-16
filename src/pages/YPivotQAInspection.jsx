import {
  FileText,
  Camera,
  ClipboardCheck,
  User,
  Shield,
  Sparkles,
  Package,
  Ruler,
  CheckSquare,
  Settings,
  Info,
  Lock,
  FileSpreadsheet,
  Home,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Plus,
  AlertTriangle,
  QrCode,
  Bell,
} from "lucide-react";
import React, {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/authentication/AuthContext";

import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/layout/LangSwitch";

import { PhotoUploadProvider } from "../components/inspection/PivotY/QATemplates/PhotoUploadContext";
import YPivotQAInspectionOrderData from "../components/inspection/PivotY/QADataCollection/YPivotQAInspectionOrderData";
import YPivotQAInspectionSummary from "../components/inspection/PivotY/QADataCollection/YPivotQAInspectionSummary";
import YPivotQAInspectionHeaderDataSave from "../components/inspection/PivotY/QADataCollection/YPivotQAInspectionHeaderDataSave";
import YPivotQAInspectionPhotoDataSave from "../components/inspection/PivotY/QADataCollection/YPivotQAInspectionPhotoDataSave";
import YPivotQAInspectionConfigSave from "../components/inspection/PivotY/QADataCollection/YPivotQAInspectionConfigSave";
import YPivotQAInspectionMeasurementDataSave from "../components/inspection/PivotY/QADataCollection/YPivotQAInspectionMeasurementDataSave";
import YPivotQAInspectionDefectDataSave from "../components/inspection/PivotY/QADataCollection/YPivotQAInspectionDefectDataSave";
import YPivotQAInspectionPPSheetDataSave from "../components/inspection/PivotY/QADataCollection/YPivotQAInspectionPPSheetDataSave";
import YPivotQAInspectionPreviousReport from "../components/inspection/PivotY/QADataCollection/YPivotQAInspectionPreviousReport";
import YPivotQAInspectionNotifications from "../components/inspection/PivotY/QAReports/YPivotQAInspectionNotifications";

import axios from "axios";
import { API_BASE_URL } from "../../config";

// ==================================================================================
// 1. INDEXED DB UTILITY (Handles Large Data & Images preventing QuotaExceededError)
// ==================================================================================
const DB_NAME = "YQMS_INSPECTION_DB";
const STORE_NAME = "drafts";
const DRAFT_KEY = "current_inspection_draft";

const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
};

const saveToDB = async (data) => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(data, DRAFT_KEY);
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IndexedDB Save Error:", err);
  }
};

const loadFromDB = async () => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(DRAFT_KEY);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error("IndexedDB Load Error:", err);
    return null;
  }
};

const clearDB = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.delete(DRAFT_KEY);
  } catch (err) {
    console.error("IndexedDB Clear Error:", err);
  }
};
// ==================================================================================

const PlaceholderComponent = ({ title, icon: Icon }) => {
  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg min-h-[400px] flex flex-col justify-center items-center border border-gray-200 dark:border-gray-700">
      <div className="mb-4 p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
        <Icon
          size={48}
          strokeWidth={1.5}
          className="text-indigo-500 dark:text-indigo-400"
        />
      </div>
      <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">
        {title}
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-center text-sm">
        This section is under development.
      </p>
    </div>
  );
};

// Create a Simple Confirmation Modal Sub-Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-gray-200 dark:border-gray-700 transform scale-100 transition-all">
        <div className="flex flex-col items-center text-center gap-4">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400">
            <AlertTriangle size={32} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {message}
            </p>
          </div>
          <div className="flex gap-3 w-full mt-2">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-lg"
            >
              Yes, Start New
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusModal = ({ isOpen, onClose, type, title, message, subMessage }) => {
  if (!isOpen) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100 border border-gray-100 dark:border-gray-700">
        {/* Header Color Bar */}
        <div
          className={`h-2 w-full ${
            isSuccess ? "bg-green-500" : "bg-amber-500"
          }`}
        />

        <div className="p-6">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                isSuccess
                  ? "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"
                  : "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
              }`}
            >
              {isSuccess ? <CheckCircle2 size={24} /> : <Info size={24} />}
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                {title}
              </h3>
              <p
                className={`font-medium text-sm mb-2 ${
                  isSuccess
                    ? "text-green-700 dark:text-green-400"
                    : "text-amber-700 dark:text-amber-400"
                }`}
              >
                {message}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                {subMessage}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-6 flex justify-end">
            <button
              onClick={onClose}
              className={`px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-transform active:scale-95 ${
                isSuccess
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              }`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================================================================================
// HELPER FUNCTIONS TO TRANSFORM BACKEND DATA TO COMPONENT FORMAT
// ==================================================================================

// Transform PP Sheet data from backend (Fix image URLs)
const transformPPSheetDataFromBackend = (backendData) => {
  if (!backendData) return null;

  // Create a copy to modify images
  const processedData = { ...backendData };

  if (processedData.images && Array.isArray(processedData.images)) {
    processedData.images = processedData.images.map((img) => {
      let displayUrl = img.imageURL;

      // Prepend API_BASE_URL if it's a relative path
      if (
        displayUrl &&
        !displayUrl.startsWith("http") &&
        !displayUrl.startsWith("data:")
      ) {
        displayUrl = `${API_BASE_URL}${displayUrl}`;
      }

      return {
        id: img.imageId || img.id,
        url: displayUrl, // Used by <img> src
        imgSrc: displayUrl, // Used by Editor
        imageURL: img.imageURL, // Keep original relative path
        history: [],
      };
    });
  }

  return processedData;
};

// Transform header data from backend format to component format
const transformHeaderDataFromBackend = (backendHeaderData) => {
  if (!backendHeaderData || !Array.isArray(backendHeaderData)) {
    return {};
  }

  const selectedOptions = {};
  const remarks = {};
  const capturedImages = {};

  backendHeaderData.forEach((section) => {
    const headerId = section.headerId;

    if (section.selectedOption) {
      selectedOptions[headerId] = section.selectedOption;
    }

    if (section.remarks) {
      remarks[headerId] = section.remarks;
    }

    if (section.images && Array.isArray(section.images)) {
      section.images.forEach((img, index) => {
        const key = img.id || `${headerId}_${index}`;
        capturedImages[key] = {
          id: img.id || key,
          url: img.imageURL ? `${API_BASE_URL}${img.imageURL}` : img.imgSrc,
        };
      });
    }
  });

  return { selectedOptions, remarks, capturedImages };
};

// Transform photo data from backend format to component format
const transformPhotoDataFromBackend = (backendPhotoData) => {
  if (!backendPhotoData || !Array.isArray(backendPhotoData)) {
    return {};
  }

  const remarks = {};
  const capturedImages = {};

  backendPhotoData.forEach((section) => {
    if (section.items && Array.isArray(section.items)) {
      section.items.forEach((item) => {
        const itemKeyBase = `${section.sectionId}_${item.itemNo}`;

        if (item.remarks) {
          remarks[itemKeyBase] = item.remarks;
        }

        if (item.images && Array.isArray(item.images)) {
          item.images.forEach((img, index) => {
            const key = img.id || `${itemKeyBase}_${index}`;
            capturedImages[key] = {
              id: img.id || key,
              url: img.imageURL ? `${API_BASE_URL}${img.imageURL}` : img.imgSrc,
            };
          });
        }
      });
    }
  });

  return { remarks, capturedImages };
};

// Transform defect manual data from backend array to component object format
const transformDefectManualData = (backendManualData) => {
  if (!backendManualData || !Array.isArray(backendManualData)) {
    return {};
  }

  const result = {};
  backendManualData.forEach((item) => {
    const groupId = item.groupId || 0;
    result[groupId] = item;
  });

  return result;
};

// Transform measurement data from backend format to component format
const transformMeasurementDataFromBackend = (
  backendMeasurementData,
  orderSizes = [],
) => {
  if (!backendMeasurementData || !Array.isArray(backendMeasurementData)) {
    return { savedMeasurements: [], manualDataByGroup: {} };
  }

  // 1. Process Standard Measurements (convert arrays to Sets)
  const processedMeasurements = backendMeasurementData
    .filter((m) => m.size !== "Manual_Entry")
    .map((m) => ({
      ...m,
      allEnabledPcs: new Set(m.allEnabledPcs || []),
      criticalEnabledPcs: new Set(m.criticalEnabledPcs || []),
      // Ensure stage is preserved - default to "Before" for legacy data
      stage: m.stage || "Before",
    }));

  // 2. Process Manual Data by Group
  const processedManualDataByGroup = {};
  backendMeasurementData.forEach((item) => {
    if (item.manualData) {
      const groupId = item.groupId;
      const processedImages = (item.manualData.images || []).map((img) => {
        let displayUrl = img.imageURL;
        if (
          displayUrl &&
          !displayUrl.startsWith("http") &&
          !displayUrl.startsWith("data:")
        ) {
          displayUrl = `${API_BASE_URL}${displayUrl}`;
        }
        return {
          id: img.imageId || img.id,
          url: displayUrl,
          imgSrc: displayUrl,
          editedImgSrc: displayUrl,
          remark: img.remark || "",
          history: [],
        };
      });
      processedManualDataByGroup[groupId] = {
        remarks: item.manualData.remarks || "",
        status: item.manualData.status || "Pass",
        images: processedImages,
      };
    }
  });

  // 3. Group measurements by stage and extract last selected values
  const beforeMeasurements = processedMeasurements.filter(
    (m) => m.stage === "Before",
  );
  const afterMeasurements = processedMeasurements.filter(
    (m) => m.stage === "After",
  );

  // Extract unique K values from Before measurements
  const beforeKValues = [
    ...new Set(
      beforeMeasurements.map((m) => m.kValue).filter((k) => k && k !== "NA"),
    ),
  ].sort();

  // Get last selected K value (most recently used)
  const lastBeforeKValue =
    beforeMeasurements.length > 0
      ? beforeMeasurements[beforeMeasurements.length - 1].kValue || ""
      : "";

  // 4. Build stage-specific config stubs
  const result = {
    savedMeasurements: processedMeasurements,
    manualDataByGroup: processedManualDataByGroup,
    isConfigured: processedMeasurements.length > 0,
  };

  // Add configBefore if Before measurements exist
  if (beforeMeasurements.length > 0) {
    result.configBefore = {
      isConfigured: true,
      lastSelectedKValue: lastBeforeKValue,
      usedKValues: beforeKValues,
      orderSizes: orderSizes,
      // These will be populated when specs are fetched
      fullSpecsList: [],
      selectedSpecsList: [],
      kValuesList: beforeKValues.length > 0 ? beforeKValues : [],
    };
  }

  // Add configAfter if After measurements exist
  if (afterMeasurements.length > 0) {
    result.configAfter = {
      isConfigured: true,
      orderSizes: orderSizes,
      fullSpecsList: [],
      selectedSpecsList: [],
      kValuesList: [], // After wash has no K values
    };
  }

  return result;
};

// Helper function to extract sizes from order data
const extractOrderSizes = (orderData) => {
  if (!orderData) return [];
  const allSizes = new Set();

  if (orderData.orderBreakdowns && Array.isArray(orderData.orderBreakdowns)) {
    orderData.orderBreakdowns.forEach((breakdown) => {
      if (breakdown.colorSizeBreakdown?.sizeList) {
        breakdown.colorSizeBreakdown.sizeList.forEach((s) => allSizes.add(s));
      }
    });
  } else if (orderData.colorSizeBreakdown?.sizeList) {
    orderData.colorSizeBreakdown.sizeList.forEach((s) => allSizes.add(s));
  } else if (orderData.dtOrder?.sizeList) {
    orderData.dtOrder.sizeList.forEach((s) => allSizes.add(s));
  }

  return Array.from(allSizes);
};

const YPivotQAInspection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // --- STATE FOR DB LOADING ---
  const [isRestoring, setIsRestoring] = useState(true);

  // --- APPLICATION STATE (Initialized with defaults) ---
  const [activeTab, setActiveTab] = useState("order");

  //Report saved state
  const [savedReportData, setSavedReportData] = useState(null);
  const [isReportSaved, setIsReportSaved] = useState(false);

  // Shared state for order data
  const [sharedOrderState, setSharedOrderState] = useState({
    inspectionDate: new Date().toISOString().split("T")[0],
    orderType: "single",
    selectedOrders: [],
    orderData: null,
    inspectionType: "first",
  });

  // Shared state for Report Configuration
  const [sharedReportState, setSharedReportState] = useState({
    selectedTemplate: null,
    headerData: {},
    photoData: {},
    config: {},
    lineTableConfig: [],
    measurementData: {},
    defectData: {},
    ppSheetData: null,
  });

  // Add new state for quality plan (after sharedReportState):
  const [qualityPlanData, setQualityPlanData] = useState({
    productionStatus: {},
    packingList: {},
    accountedPercentage: "0.00",
  });

  // State for Active Inspection Context (Activated via Play button)
  const [activeGroup, setActiveGroup] = useState(null);

  // ===========================================================================
  // DIRTY SECTIONS STATE - Tracks which sections have unsaved changes
  // ===========================================================================
  const [dirtySections, setDirtySections] = useState({
    inspectionDetails: false,
    headerData: false,
    photoData: false,
    inspectionConfig: false,
    measurementData: false,
    defectData: false,
    defectManualData: false,
    ppSheetData: false,
  });

  const [notificationCount, setNotificationCount] = useState(0);

  // Add a ref to track if we're currently loading data from backend
  const isLoadingFromBackendRef = useRef(false);

  // Helper function to mark a section as dirty (has unsaved changes)
  const markSectionDirty = useCallback((sectionName) => {
    setDirtySections((prev) => {
      // Only update if not already dirty (optimization)
      if (prev[sectionName]) return prev;
      return { ...prev, [sectionName]: true };
    });
  }, []);

  // Helper function to mark a section as clean (after individual save)
  const markSectionClean = useCallback((sectionName) => {
    setDirtySections((prev) => {
      // Only update if dirty (optimization)
      if (!prev[sectionName]) return prev;
      return { ...prev, [sectionName]: false };
    });
  }, []);

  // Helper to mark all sections as clean
  const markAllSectionsClean = useCallback(() => {
    setDirtySections({
      inspectionDetails: false,
      headerData: false,
      photoData: false,
      inspectionConfig: false,
      measurementData: false,
      defectData: false,
      defectManualData: false,
      ppSheetData: false,
    });
  }, []);

  // Get list of dirty section names
  const getDirtySectionsList = useCallback(() => {
    return Object.entries(dirtySections)
      .filter(([_, isDirty]) => isDirty)
      .map(([name]) => name);
  }, [dirtySections]);

  // Check if any section is dirty
  const hasUnsavedChanges = useMemo(() => {
    return Object.values(dirtySections).some((dirty) => dirty);
  }, [dirtySections]);
  // ===========================================================================

  //  State for the Status Modal
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success", // 'success' or 'info'
    title: "",
    message: "",
    subMessage: "",
  });

  //  State for confirmation modal
  const [showNewConfirm, setShowNewConfirm] = useState(false);

  // ======================================================================
  // 1. RESTORE STATE FROM INDEXED DB ON MOUNT
  // ======================================================================
  useEffect(() => {
    const restoreData = async () => {
      setIsRestoring(true);
      const draft = await loadFromDB();

      if (draft) {
        // Bulk update state from DB
        if (draft.activeTab) setActiveTab(draft.activeTab);
        if (draft.savedReportData) setSavedReportData(draft.savedReportData);
        if (draft.isReportSaved !== undefined)
          setIsReportSaved(draft.isReportSaved);
        if (draft.sharedOrderState) setSharedOrderState(draft.sharedOrderState);
        if (draft.sharedReportState)
          setSharedReportState(draft.sharedReportState);
        if (draft.qualityPlanData) setQualityPlanData(draft.qualityPlanData);
        if (draft.activeGroup) setActiveGroup(draft.activeGroup);
        // Restore dirty sections state
        if (draft.dirtySections) setDirtySections(draft.dirtySections);
      }
      setIsRestoring(false);
    };

    restoreData();
  }, []);

  // ======================================================================
  // 2. SAVE STATE TO INDEXED DB ON CHANGE (Debounced)
  // ======================================================================
  const saveTimeoutRef = useRef(null);

  useEffect(() => {
    // Only start saving AFTER we have attempted to restore
    if (isRestoring) return;

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    // Debounce save by 1 second to prevent freezing UI on every keystroke
    saveTimeoutRef.current = setTimeout(() => {
      const stateToSave = {
        activeTab,
        savedReportData,
        isReportSaved,
        sharedOrderState,
        sharedReportState,
        qualityPlanData,
        activeGroup,
        dirtySections, // Include dirty sections in persistence
      };

      // Async save to IndexedDB
      saveToDB(stateToSave);
    }, 1000);

    return () => clearTimeout(saveTimeoutRef.current);
  }, [
    isRestoring,
    activeTab,
    savedReportData,
    isReportSaved,
    sharedOrderState,
    sharedReportState,
    qualityPlanData,
    activeGroup,
    dirtySections,
  ]);

  // ==================================================================================
  // FETCH MEASUREMENT SPECS WHEN REPORT IS LOADED (for Summary to display properly)
  // ==================================================================================
  useEffect(() => {
    const fetchAllMeasurementSpecs = async () => {
      // Only run if we have a loaded report
      if (!savedReportData || !isReportSaved) return;

      const template = sharedReportState.selectedTemplate;
      const moNo = sharedOrderState.selectedOrders?.[0];
      if (!moNo) return;

      const orderSizes = extractOrderSizes(sharedOrderState.orderData);
      const stagesToFetch = [];

      // Check primary measurement type
      const primaryType = template?.Measurement;
      if (primaryType && primaryType !== "No") {
        const configKey = `config${primaryType}`;
        const hasSpecs =
          sharedReportState.measurementData?.[configKey]?.fullSpecsList
            ?.length > 0;
        if (!hasSpecs) {
          stagesToFetch.push(primaryType);
        }
      }

      // Check secondary measurement type
      const secondaryType = template?.MeasurementAdditional;
      if (secondaryType && secondaryType !== "No") {
        const configKey = `config${secondaryType}`;
        const hasSpecs =
          sharedReportState.measurementData?.[configKey]?.fullSpecsList
            ?.length > 0;
        if (!hasSpecs && !stagesToFetch.includes(secondaryType)) {
          stagesToFetch.push(secondaryType);
        }
      }

      if (stagesToFetch.length === 0) {
        console.log("[Main] All specs already loaded");
        return;
      }

      console.log("[Main] Fetching specs for stages:", stagesToFetch);

      // Fetch specs for each stage
      for (const stage of stagesToFetch) {
        try {
          const endpoint =
            stage === "Before"
              ? `/api/qa-sections/measurement-specs/${moNo}`
              : `/api/qa-sections/measurement-specs-aw/${moNo}`;

          const res = await axios.get(`${API_BASE_URL}${endpoint}`);
          const { source, data } = res.data;

          let all = [];
          let selected = [];
          let kValues = [];

          if (stage === "Before") {
            all = data.AllBeforeWashSpecs || [];
            selected = data.selectedBeforeWashSpecs || [];
            const kSet = new Set(
              all.map((s) => s.kValue).filter((k) => k && k !== "NA"),
            );
            kValues = Array.from(kSet).sort();
          } else {
            all = data.AllAfterWashSpecs || [];
            selected = data.selectedAfterWashSpecs || [];
            kValues = []; // No K values for After wash
          }

          const finalList =
            source === "qa_sections" && selected.length > 0 ? selected : all;
          const configKey = `config${stage}`;

          // Get existing config for this stage (might have lastSelectedKValue, etc.)
          const existingConfig =
            sharedReportState.measurementData?.[configKey] || {};

          // Update state with fetched specs
          setSharedReportState((prev) => ({
            ...prev,
            measurementData: {
              ...prev.measurementData,
              [configKey]: {
                ...existingConfig,
                fullSpecsList: all,
                selectedSpecsList: finalList,
                sourceType: source,
                isConfigured:
                  source === "qa_sections" || existingConfig.isConfigured,
                kValuesList:
                  kValues.length > 0
                    ? kValues
                    : existingConfig.usedKValues || [],
                orderSizes: orderSizes,
                // Preserve last selected K value if it exists
                lastSelectedKValue:
                  existingConfig.lastSelectedKValue ||
                  (kValues.length > 0 ? kValues[0] : ""),
              },
            },
          }));

          console.log(`[Main] Loaded ${all.length} specs for ${stage} wash`);
        } catch (error) {
          console.error(`[Main] Error fetching ${stage} wash specs:`, error);
        }
      }
    };

    fetchAllMeasurementSpecs();
  }, [
    savedReportData?._id,
    isReportSaved,
    sharedReportState.selectedTemplate?.Measurement,
    sharedReportState.selectedTemplate?.MeasurementAdditional,
    sharedOrderState.selectedOrders?.[0],
    sharedOrderState.orderData,
  ]);

  // Fetch Notification Count
  useEffect(() => {
    if (!user?.emp_id) return;
    const fetchCount = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-reports/notifications?empId=${user.emp_id}`,
        );
        if (res.data.success) {
          setNotificationCount(res.data.data.length);
        }
      } catch (e) {
        /* silent fail */
      }
    };
    fetchCount();
    // Poll every 60s
    const interval = setInterval(fetchCount, 60000);
    return () => clearInterval(interval);
  }, [user?.emp_id]);

  // Handler to update PP Sheet data - MODIFIED to mark dirty
  const handlePPSheetUpdate = useCallback(
    (newData, options = {}) => {
      // ✅ Added options = {}
      setSharedReportState((prev) => ({
        ...prev,
        ppSheetData: newData,
      }));
      if (!options?.isFromBackend) {
        // ✅ Use optional chaining
        markSectionDirty("ppSheetData");
      }
    },
    [markSectionDirty],
  );

  // Handler for save complete
  const handleSaveComplete = useCallback(
    (result) => {
      const { reportData, isNew, message } = result;

      setSavedReportData(reportData);
      setIsReportSaved(true);

      // Mark inspectionDetails as clean since we just saved
      markSectionClean("inspectionDetails");
      markSectionClean("inspectionConfig");

      // ========================================================================
      //  HYDRATE sharedReportState when loading an EXISTING report
      // ========================================================================
      if (!isNew && reportData) {
        console.log("Hydrating state from loaded report:", reportData._id);

        // *** PROCESS MEASUREMENT DATA PROPERLY ***
        const orderSizes = extractOrderSizes(sharedOrderState.orderData);
        const processedMeasurementData = transformMeasurementDataFromBackend(
          reportData.measurementData,
          orderSizes,
        );

        // Hydrate sharedReportState from loaded report data
        setSharedReportState((prev) => {
          const newState = {
            ...prev,
            // Template - might be stored differently based on your backend
            selectedTemplate:
              reportData.selectedTemplate || prev.selectedTemplate,

            // Config from inspectionDetails
            config: {
              ...prev.config,
              productType:
                reportData.inspectionDetails?.productType ||
                prev.config?.productType,
              productTypeId:
                reportData.inspectionDetails?.productTypeId ||
                prev.config?.productTypeId,
              inspectedQty:
                reportData.inspectionDetails?.inspectedQty ??
                prev.config?.inspectedQty,
              cartonQty:
                reportData.inspectionDetails?.cartonQty ??
                prev.config?.cartonQty,
              shippingStage:
                reportData.inspectionDetails?.shippingStage ||
                prev.config?.shippingStage,
              remarks:
                reportData.inspectionDetails?.remarks || prev.config?.remarks,
              isSubCon:
                reportData.inspectionDetails?.isSubCon ?? prev.config?.isSubCon,
              selectedSubConFactory:
                reportData.inspectionDetails?.subConFactoryId ||
                prev.config?.selectedSubConFactory,
              selectedSubConFactoryName:
                reportData.inspectionDetails?.subConFactory ||
                prev.config?.selectedSubConFactoryName,
              aqlSampleSize:
                reportData.inspectionDetails?.aqlSampleSize ||
                prev.config?.aqlSampleSize,
              aqlConfig:
                reportData.inspectionDetails?.aqlConfig ||
                prev.config?.aqlConfig,
            },

            // Line/Table Config
            lineTableConfig:
              reportData.inspectionConfig?.configGroups || prev.lineTableConfig,

            // Header Data - needs to be transformed to match your component's expected format
            headerData: reportData.headerData
              ? transformHeaderDataFromBackend(reportData.headerData)
              : prev.headerData,

            // Photo Data - needs to be transformed
            photoData: reportData.photoData
              ? transformPhotoDataFromBackend(reportData.photoData)
              : prev.photoData,

            // *** MEASUREMENT DATA - Use the processed data ***
            measurementData: {
              ...prev.measurementData,
              ...processedMeasurementData,
              // Merge with existing config if present
              configBefore: {
                ...(prev.measurementData?.configBefore || {}),
                ...(processedMeasurementData.configBefore || {}),
              },
              configAfter: {
                ...(prev.measurementData?.configAfter || {}),
                ...(processedMeasurementData.configAfter || {}),
              },
            },

            // Defect Data
            defectData: {
              ...prev.defectData,
              savedDefects:
                reportData.defectData || prev.defectData?.savedDefects || [],
              manualDataByGroup: reportData.defectManualData
                ? transformDefectManualData(reportData.defectManualData)
                : prev.defectData?.manualDataByGroup || {},
            },

            // PP Sheet Data
            ppSheetData: reportData.ppSheetData
              ? transformPPSheetDataFromBackend(reportData.ppSheetData)
              : prev.ppSheetData,
          };

          return newState;
        });

        // Mark all sections as clean since we just loaded from backend
        markAllSectionsClean();
      }

      // --- LOGIC TO SHOW NICE MODAL ---
      if (isNew === false) {
        setStatusModal({
          isOpen: true,
          type: "info",
          title: "Existing Report Loaded",
          message: message || "Report loaded successfully.",
          subMessage:
            "All saved data has been loaded. You can continue editing or submit the report.",
        });
      } else {
        setStatusModal({
          isOpen: true,
          type: "success",
          title: "Report Created",
          message: "New inspection report created successfully.",
          subMessage:
            "You can now proceed to fill in the Header, Photos, and Measurement details.",
        });
      }
    },
    [markSectionClean, markAllSectionsClean],
  );

  // Handle tab change with validation
  const handleTabChange = useCallback(
    (tabId, targetRequiresSave) => {
      if (
        activeTab === "order" &&
        tabId !== "order" &&
        !isReportSaved &&
        targetRequiresSave
      ) {
        return;
      }
      setActiveTab(tabId);
    },
    [activeTab, isReportSaved],
  );

  // Handler for order data changes - MODIFIED to mark dirty
  const handleOrderDataChange = useCallback(
    (newState) => {
      setSharedOrderState((prev) => ({ ...prev, ...newState }));
      markSectionDirty("inspectionDetails"); // Mark as dirty when order data changes
    },
    [markSectionDirty],
  );

  // Handler for report data changes - MODIFIED to mark dirty
  const handleReportDataChange = useCallback(
    (newState, options = {}) => {
      // ✅ Added options = {}
      setSharedReportState((prev) => ({ ...prev, ...newState }));
      if (!options?.isFromBackend) {
        // ✅ Use optional chaining
        if (newState.config !== undefined) {
          markSectionDirty("inspectionDetails");
        }
        if (newState.lineTableConfig !== undefined) {
          markSectionDirty("inspectionConfig");
        }
      }
    },
    [markSectionDirty],
  );

  // Add after other handlers:
  const handleQualityPlanChange = useCallback(
    (newData) => {
      setQualityPlanData(newData);
      markSectionDirty("inspectionDetails"); // Quality plan is part of inspection details
    },
    [markSectionDirty],
  );

  // Handler for header updates - MODIFIED to mark dirty
  const handleHeaderDataUpdate = useCallback(
    (headerUpdates, options = {}) => {
      // ✅ Added options = {}
      setSharedReportState((prev) => ({
        ...prev,
        headerData: {
          ...prev.headerData,
          ...headerUpdates,
        },
      }));
      if (!options?.isFromBackend) {
        // ✅ Use optional chaining
        markSectionDirty("headerData");
      }
    },
    [markSectionDirty],
  );

  // Handler for photo updates - MODIFIED to mark dirty
  const handlePhotoDataUpdate = useCallback(
    (photoUpdates, options = {}) => {
      // ✅ Added options = {}
      setSharedReportState((prev) => ({
        ...prev,
        photoData: {
          ...prev.photoData,
          ...photoUpdates,
        },
      }));
      if (!options?.isFromBackend) {
        // ✅ Use optional chaining
        markSectionDirty("photoData");
      }
    },
    [markSectionDirty],
  );

  // Handler specifically for measurement updates - MODIFIED to mark dirty
  const handleMeasurementDataUpdate = useCallback(
    (measurementUpdates, options = {}) => {
      // ✅ Added options = {}
      setSharedReportState((prev) => ({
        ...prev,
        measurementData: {
          ...prev.measurementData,
          ...measurementUpdates,
        },
      }));
      if (!options?.isFromBackend) {
        // ✅ Use optional chaining
        markSectionDirty("measurementData");
      }
    },
    [markSectionDirty],
  );

  // Handler for defect updates - MODIFIED to mark dirty
  const handleDefectDataUpdate = useCallback(
    (defectUpdates, options = {}) => {
      // ✅ Added options = {}
      setSharedReportState((prev) => ({
        ...prev,
        defectData: {
          ...prev.defectData,
          ...defectUpdates,
        },
      }));
      if (!options?.isFromBackend) {
        // ✅ Use optional chaining
        if (defectUpdates.savedDefects !== undefined) {
          markSectionDirty("defectData");
        }
        if (defectUpdates.manualDataByGroup !== undefined) {
          markSectionDirty("defectManualData");
        }
      }
    },
    [markSectionDirty],
  );

  // Handler for setting active group (Play button)
  const handleSetActiveGroup = useCallback((group) => {
    setActiveGroup(group);
  }, []);

  // Navigate to Home - MODIFIED TO CLEAR DB
  const handleGoHome = useCallback(async () => {
    await clearDB(); // Clear draft data when leaving
    navigate("/home");
  }, [navigate]);

  // --- Prepare QR Data Object ---
  const qrData = useMemo(() => {
    return {
      reportId: savedReportData?.reportId,
      inspectionDate: sharedOrderState.inspectionDate,
      orderNos: sharedOrderState.selectedOrders,
      reportType: sharedReportState.selectedTemplate?.ReportType || "N/A",
      inspectionType: sharedOrderState.inspectionType,
      empId: savedReportData?.empId || user?.emp_id || "Unknown",
      empName: savedReportData?.empName || user?.eng_name || "Unknown",
    };
  }, [savedReportData, sharedOrderState, sharedReportState, user]);

  // ===========================================================================
  //  Callback for when a section is saved individually (passed to children)
  // ===========================================================================
  const handleSectionSaveSuccess = useCallback(
    (sectionName) => {
      markSectionClean(sectionName);
    },
    [markSectionClean],
  );

  // Handler for when the full report is submitted/finalized from the Summary tab
  const handleReportFinalized = useCallback((updatedReportData) => {
    setSavedReportData((prev) => ({
      ...prev,
      status: updatedReportData.status,
      resubmissionHistory: updatedReportData.resubmissionHistory,
      updatedAt: updatedReportData.updatedAt,
    }));

    // Optional: If you want to force the UI to lock/unlock based on status immediately
    // setIsReportSaved(true); // It should already be true, but safe to ensure
  }, []);

  const tabs = useMemo(
    () => [
      {
        id: "order",
        label: t("fincheckInspection.tabs.order"),
        icon: <Package size={18} />,
        component: (
          <YPivotQAInspectionOrderData
            onOrderDataChange={handleOrderDataChange}
            externalSelectedOrders={sharedOrderState.selectedOrders}
            externalOrderData={sharedOrderState.orderData}
            externalOrderType={sharedOrderState.orderType}
            externalInspectionDate={sharedOrderState.inspectionDate}
            externalInspectionType={sharedOrderState.inspectionType}
            onReportDataChange={handleReportDataChange}
            savedReportState={sharedReportState}
            onQualityPlanChange={handleQualityPlanChange}
            qualityPlanData={qualityPlanData}
            user={user}
            onSaveComplete={handleSaveComplete}
            savedReportId={savedReportData?.reportId}
            isReportSaved={isReportSaved}
            savedReportData={savedReportData}
          />
        ),
        gradient: "from-blue-500 to-cyan-500",
        description: t("fincheckInspection.descriptions.order"),
        requiresSave: false,
      },
      ...(sharedReportState.selectedTemplate?.ReportType === "Pilot Run-Sewing"
        ? [
            {
              id: "pp_sheet",
              label: t("fincheckInspection.tabs.ppSheet"),
              icon: <FileSpreadsheet size={18} />,
              component: (
                <YPivotQAInspectionPPSheetDataSave
                  orderData={sharedOrderState.orderData}
                  selectedOrders={sharedOrderState.selectedOrders}
                  inspectionDate={sharedOrderState.inspectionDate}
                  reportData={sharedReportState}
                  onUpdatePPSheetData={handlePPSheetUpdate}
                  reportId={savedReportData?.reportId}
                  isReportSaved={isReportSaved}
                  onSaveSuccess={() => handleSectionSaveSuccess("ppSheetData")}
                />
              ),
              gradient: "from-indigo-600 to-blue-600",
              description: t("fincheckInspection.descriptions.ppSheet"),
              requiresSave: true,
            },
          ]
        : []),
      {
        id: "header",
        label: t("fincheckInspection.tabs.header"),
        icon: <FileText size={18} />,
        component: (
          <YPivotQAInspectionHeaderDataSave
            headerData={sharedReportState.headerData}
            onUpdateHeaderData={handleHeaderDataUpdate}
            reportId={savedReportData?.reportId}
            isReportSaved={isReportSaved}
            onSaveSuccess={() => handleSectionSaveSuccess("headerData")}
          />
        ),
        gradient: "from-purple-500 to-pink-500",
        description: t("fincheckInspection.descriptions.header"),
        requiresSave: true,
      },
      {
        id: "photos",
        label: t("fincheckInspection.tabs.photos"),
        icon: <Camera size={18} />,
        component: (
          <YPivotQAInspectionPhotoDataSave
            reportData={sharedReportState}
            onUpdatePhotoData={handlePhotoDataUpdate}
            reportId={savedReportData?.reportId}
            isReportSaved={isReportSaved}
            onSaveSuccess={() => handleSectionSaveSuccess("photoData")}
          />
        ),
        gradient: "from-orange-500 to-red-500",
        description: t("fincheckInspection.descriptions.photos"),
        requiresSave: true,
      },
      {
        id: "info",
        label: t("fincheckInspection.tabs.info"),
        icon: <Info size={18} />,
        component: (
          <YPivotQAInspectionConfigSave
            reportData={sharedReportState}
            orderData={sharedOrderState}
            onUpdate={handleReportDataChange}
            onSetActiveGroup={handleSetActiveGroup}
            activeGroup={activeGroup}
            reportId={savedReportData?.reportId}
            isReportSaved={isReportSaved}
            onSaveSuccess={() => handleSectionSaveSuccess("inspectionConfig")}
          />
        ),
        gradient: "from-teal-500 to-cyan-500",
        description: t("fincheckInspection.descriptions.info"),
        requiresSave: true,
      },
      // =================================================================
      // 1. PRIMARY MEASUREMENT TAB (CONDITIONAL)
      // =================================================================
      ...(sharedReportState.selectedTemplate?.Measurement &&
      sharedReportState.selectedTemplate.Measurement !== "No"
        ? [
            {
              id: "measurement",
              label:
                sharedReportState.selectedTemplate.Measurement === "Before"
                  ? t("fincheckInspection.tabs.measB")
                  : t("fincheckInspection.tabs.measA"),
              icon: <Ruler size={18} />,
              component: (
                <YPivotQAInspectionMeasurementDataSave
                  selectedOrders={sharedOrderState.selectedOrders}
                  orderData={sharedOrderState.orderData}
                  reportData={sharedReportState}
                  onUpdateMeasurementData={handleMeasurementDataUpdate}
                  activeGroup={activeGroup}
                  reportId={savedReportData?.reportId}
                  isReportSaved={isReportSaved}
                  onSaveSuccess={() =>
                    handleSectionSaveSuccess("measurementData")
                  }
                  // *** NEW PROPS ***
                  targetStage={sharedReportState.selectedTemplate.Measurement}
                  displayLabel={`${sharedReportState.selectedTemplate.Measurement} Wash`}
                />
              ),
              gradient: "from-green-500 to-emerald-500",
              description: t("fincheckInspection.descriptions.meas"),
              requiresSave: true,
            },
          ]
        : []),

      // =================================================================
      // 2. ADDITIONAL MEASUREMENT TAB (CONDITIONAL)
      // =================================================================
      ...(sharedReportState.selectedTemplate?.MeasurementAdditional &&
      sharedReportState.selectedTemplate.MeasurementAdditional !== "No"
        ? [
            {
              id: "measurement_2",
              label:
                sharedReportState.selectedTemplate.MeasurementAdditional ===
                "Before"
                  ? t("fincheckInspection.tabs.measB")
                  : t("fincheckInspection.tabs.measA"),
              icon: <Ruler size={18} />,
              component: (
                <YPivotQAInspectionMeasurementDataSave
                  selectedOrders={sharedOrderState.selectedOrders}
                  orderData={sharedOrderState.orderData}
                  reportData={sharedReportState}
                  onUpdateMeasurementData={handleMeasurementDataUpdate}
                  activeGroup={activeGroup}
                  reportId={savedReportData?.reportId}
                  isReportSaved={isReportSaved}
                  onSaveSuccess={() =>
                    handleSectionSaveSuccess("measurementData")
                  }
                  // *** NEW PROPS ***
                  targetStage={
                    sharedReportState.selectedTemplate.MeasurementAdditional
                  }
                  displayLabel={`${sharedReportState.selectedTemplate.MeasurementAdditional} Wash`}
                />
              ),
              // Use a slightly different gradient to distinguish visually
              gradient: "from-teal-500 to-emerald-600",
              description: t("fincheckInspection.descriptions.meas"),
              requiresSave: true,
            },
          ]
        : []),
      {
        id: "defects",
        label: t("fincheckInspection.tabs.defects"),
        icon: <ClipboardCheck size={18} />,
        component: (
          <YPivotQAInspectionDefectDataSave
            selectedOrders={sharedOrderState.selectedOrders}
            orderData={sharedOrderState.orderData}
            reportData={sharedReportState}
            onUpdateDefectData={handleDefectDataUpdate}
            activeGroup={activeGroup}
            reportId={savedReportData?.reportId}
            isReportSaved={isReportSaved}
            onSaveSuccess={(type) => {
              // Type can be 'defectData' or 'defectManualData'
              handleSectionSaveSuccess(type || "defectData");
            }}
          />
        ),
        gradient: "from-red-500 to-rose-500",
        description: t("fincheckInspection.descriptions.defects"),
        requiresSave: true,
      },
      {
        id: "summary",
        label: t("fincheckInspection.tabs.summary"),
        icon: <CheckSquare size={18} />,
        component: (
          <YPivotQAInspectionSummary
            orderData={sharedOrderState}
            reportData={sharedReportState}
            qrData={qrData}
            //  Pass dirty state props
            dirtySections={dirtySections}
            getDirtySectionsList={getDirtySectionsList}
            hasUnsavedChanges={hasUnsavedChanges}
            markAllSectionsClean={markAllSectionsClean}
            activeGroup={activeGroup}
            onReportSubmitted={handleReportFinalized}
          />
        ),
        gradient: "from-indigo-500 to-violet-500",
        description: t("fincheckInspection.descriptions.summary"),
        requiresSave: true,
      },
      {
        id: "qr_history",
        label: t("fincheckInspection.tabs.history"),
        icon: <QrCode size={18} />,
        component: <YPivotQAInspectionPreviousReport user={user} />,
        gradient: "from-slate-700 to-gray-800",
        description: t("fincheckInspection.descriptions.history"),
        requiresSave: false,
      },
      {
        id: "notifications",
        label: t("fincheckInspection.tabs.notifications"),
        // Custom Icon with Badge
        icon: (
          <div className="relative">
            <Bell size={18} />
            {notificationCount > 0 && (
              <span className="absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white border border-white">
                {notificationCount}
              </span>
            )}
          </div>
        ),
        component: <YPivotQAInspectionNotifications user={user} />,
        gradient: "from-pink-500 to-rose-500", // Distinct color
        description: t("fincheckInspection.descriptions.notifications"),
        requiresSave: false,
      },
    ],
    [
      handleOrderDataChange,
      sharedOrderState,
      handleReportDataChange,
      sharedReportState,
      handleHeaderDataUpdate,
      handlePhotoDataUpdate,
      handleMeasurementDataUpdate,
      handleDefectDataUpdate,
      handleSetActiveGroup,
      activeGroup,
      handleQualityPlanChange,
      qualityPlanData,
      user,
      handleSaveComplete,
      savedReportData,
      isReportSaved,
      handlePPSheetUpdate,
      qrData,
      handleSectionSaveSuccess,
      dirtySections,
      getDirtySectionsList,
      hasUnsavedChanges,
      markAllSectionsClean,
    ],
  );

  const activeComponent = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab)?.component || null;
  }, [activeTab, tabs]);

  const activeTabData = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab);
  }, [activeTab, tabs]);

  //  Function to reset everything
  const handleStartNewInspection = async () => {
    // 1. Clear IndexedDB
    await clearDB();

    // 2. Reset Order State
    setSharedOrderState({
      inspectionDate: new Date().toISOString().split("T")[0],
      orderType: "single",
      selectedOrders: [],
      orderData: null,
      inspectionType: "first",
    });

    // 3. Reset Report State
    setSharedReportState({
      selectedTemplate: null,
      headerData: {},
      photoData: {},
      config: {},
      lineTableConfig: [],
      measurementData: {},
      defectData: {},
      ppSheetData: null,
    });

    // 4. Reset Quality Plan
    setQualityPlanData({
      productionStatus: {},
      packingList: {},
      accountedPercentage: "0.00",
    });

    // 5. Reset System State
    setSavedReportData(null);
    setIsReportSaved(false);
    setActiveGroup(null);

    // 6. Reset dirty sections
    markAllSectionsClean();

    // 7. Navigate to Order Tab
    setActiveTab("order");

    // 8. Close Modal
    setShowNewConfirm(false);
  };

  // --- RENDER LOADING SCREEN ---
  if (isRestoring) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 dark:text-white">
            Restoring Session...
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Retrieving your data and photos
          </p>
        </div>
      </div>
    );
  }

  return (
    <PhotoUploadProvider reportId={savedReportData?.reportId}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 text-gray-800 dark:text-gray-200">
        {/* Animated Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-72 h-72 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>

        {/* FIXED Header with Integrated Tabs */}
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:16px_16px]"></div>

          <div className="relative max-w-8xl mx-auto px-3 sm:px-4 lg:px-6 py-2 lg:py-3">
            {/* MOBILE/TABLET LAYOUT */}
            <div className="lg:hidden space-y-2">
              {/* Top Row: Title + YQMS Button + User Info */}
              <div className="flex items-center justify-between gap-2">
                {/* Title Section with YQMS Button */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* YQMS Home Button - Mobile */}
                  <button
                    onClick={handleGoHome}
                    className="flex-shrink-0 flex items-center justify-center w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 rounded-lg shadow-lg transition-all active:scale-95"
                    title="Go to YQMS Home"
                  >
                    <Home size={18} className="text-white" />
                  </button>

                  <div className="flex items-center justify-center w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg shadow-lg flex-shrink-0">
                    <Shield size={18} className="text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h1 className="text-sm font-black text-white tracking-tight truncate">
                        {t("fincheckInspection.title")}
                      </h1>
                      <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full flex-shrink-0">
                        <Sparkles size={8} className="text-yellow-300" />
                        <span className="text-[8px] font-bold text-white">
                          {t("fincheckInspection.pro")}
                        </span>
                      </div>
                      <button
                        onClick={() => setShowNewConfirm(true)}
                        className="ml-10 flex items-center justify-center gap-1.5 h-7 px-3 bg-white text-indigo-600 rounded-lg shadow-md active:scale-95 transition-transform"
                      >
                        <Plus size={24} strokeWidth={3} />
                        <span className="text-[12px] font-bold uppercase">
                          {t("fincheckInspection.new")}
                        </span>
                      </button>
                    </div>
                    {/* Active Tab Indicator - Inline with title */}
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400"></span>
                      </div>
                      <p className="text-[10px] text-indigo-100 font-medium truncate">
                        {activeTabData?.label} • Active
                        {hasUnsavedChanges && (
                          <span className="ml-1 text-amber-300">
                            • {t("fincheckInspection.unsavedChanges")}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
                {/* RIGHT SIDE MOBILE: Lang Switcher + User Info */}
                <div className="flex items-center gap-1">
                  {/* Language Switcher - Compact for Mobile */}
                  <div className="scale-75 origin-right">
                    <LanguageSwitcher />
                  </div>
                  {/* User Info */}
                  {user && (
                    <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-2 py-1 shadow-lg flex-shrink-0">
                      <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-md shadow">
                        <User size={14} className="text-white" />
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-white font-bold text-[10px] leading-tight truncate max-w-[80px]">
                          {user.job_title || t("fincheckInspection.operator")}
                        </p>
                        <p className="text-indigo-200 text-[9px] font-medium leading-tight">
                          {user.emp_id}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Tabs - Scrollable */}
              <div className="overflow-x-auto scrollbar-hide -mx-3 px-3">
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1 min-w-max">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const isLocked = tab.requiresSave && !isReportSaved;

                    return (
                      <button
                        key={tab.id}
                        onClick={() =>
                          !isLocked && handleTabChange(tab.id, tab.requiresSave)
                        }
                        disabled={isLocked}
                        className={`group relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-300 ${
                          isActive
                            ? "bg-white shadow-lg scale-105"
                            : isLocked
                              ? "bg-transparent opacity-50 cursor-not-allowed"
                              : "bg-transparent hover:bg-white/20"
                        }`}
                        title={
                          isLocked
                            ? "Save order data first to access this tab"
                            : tab.description
                        }
                      >
                        <div
                          className={`transition-colors duration-300 ${
                            isActive ? "text-indigo-600" : "text-white"
                          }`}
                        >
                          {isLocked ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            React.cloneElement(tab.icon, {
                              className: "w-4 h-4",
                            })
                          )}
                        </div>
                        <span
                          className={`text-[9px] font-bold transition-colors duration-300 whitespace-nowrap ${
                            isActive ? "text-indigo-600" : "text-white"
                          }`}
                        >
                          {tab.label}
                        </span>
                        {isActive && (
                          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full shadow animate-pulse"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* DESKTOP LAYOUT */}
            <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-4">
              {/* Left Side */}
              <div className="flex items-center gap-4 flex-1">
                {/* YQMS Home Button - Desktop */}
                <button
                  onClick={handleGoHome}
                  className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 rounded-xl shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95"
                  title="Go to YQMS Home"
                >
                  <ArrowLeft size={16} className="text-white" />
                  <span className="text-sm font-bold text-white">YQMS</span>
                </button>

                {/* Title */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                    <Shield size={22} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl font-black text-white tracking-tight">
                        {t("fincheckInspection.title")} |{" "}
                        {t("fincheckInspection.y_pivot_inspection")}
                      </h1>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                        <Sparkles size={10} className="text-yellow-300" />
                        <span className="text-[10px] font-bold text-white">
                          {t("fincheckInspection.pro")}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-indigo-100 font-medium">
                      {t("fincheckInspection.subtitle")}
                    </p>
                  </div>
                </div>
                {/* Tabs */}
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1.5">
                  {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const isLocked = tab.requiresSave && !isReportSaved;

                    return (
                      <button
                        key={tab.id}
                        onClick={() =>
                          !isLocked && handleTabChange(tab.id, tab.requiresSave)
                        }
                        disabled={isLocked}
                        className={`group relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-300 ${
                          isActive
                            ? "bg-white shadow-lg scale-105"
                            : isLocked
                              ? "bg-transparent opacity-50 cursor-not-allowed"
                              : "bg-transparent hover:bg-white/20"
                        }`}
                        title={
                          isLocked
                            ? "Save order data first to access this tab"
                            : tab.description
                        }
                      >
                        <div
                          className={`transition-colors duration-300 ${
                            isActive ? "text-indigo-600" : "text-white"
                          }`}
                        >
                          {isLocked ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            React.cloneElement(tab.icon, {
                              className: "w-4 h-4",
                            })
                          )}
                        </div>
                        <span
                          className={`text-[10px] font-bold transition-colors duration-300 ${
                            isActive ? "text-indigo-600" : "text-white"
                          }`}
                        >
                          {tab.label}
                        </span>
                        {isActive && (
                          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full shadow animate-pulse"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
                {/* Active Status */}
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2">
                  <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">
                      {activeTabData?.label}
                    </p>
                    <p className="text-indigo-200 text-[10px] font-medium leading-tight">
                      {hasUnsavedChanges
                        ? `${t("fincheckInspection.unsavedCount")}: ${getDirtySectionsList().length}`
                        : t("fincheckInspection.allSaved")}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNewConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-indigo-600 rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95 group"
                  title="Start a new inspection report"
                >
                  <div className="p-1 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                    <Plus
                      size={16}
                      strokeWidth={3}
                      className="text-indigo-600"
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-bold uppercase tracking-wider leading-none">
                      {t("fincheckInspection.newInspection")}
                    </p>
                  </div>
                </button>
              </div>
              {/* Right Side - Language Switcher + User Info */}
              <div className="flex items-center gap-3">
                {/* Language Switcher Added Here */}
                <LanguageSwitcher />
                {user && (
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 shadow-lg">
                    <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow">
                      <User size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm leading-tight">
                        {user.job_title || t("fincheckInspection.operator")}
                      </p>
                      <p className="text-indigo-200 text-xs font-medium leading-tight">
                        {t("fincheckInspection.id")} : {user.emp_id}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Content Container - Reduced padding-top */}
        <div className="relative max-w-8xl mx-auto px-3 sm:px-4 lg:px-6 pb-6 pt-[100px] lg:pt-[72px]">
          <div className="animate-fadeIn">
            <div className="transform transition-all duration-500 ease-out">
              {activeComponent}
            </div>
          </div>
        </div>

        <StatusModal
          isOpen={statusModal.isOpen}
          onClose={() => setStatusModal((prev) => ({ ...prev, isOpen: false }))}
          type={statusModal.type}
          title={statusModal.title}
          message={statusModal.message}
          subMessage={statusModal.subMessage}
        />

        <ConfirmationModal
          isOpen={showNewConfirm}
          onClose={() => setShowNewConfirm(false)}
          onConfirm={handleStartNewInspection}
          title="Start New Inspection?"
          message="Are you sure you want to start a new report? Any unsaved changes in the current session will be lost. Please ensure you have saved your work."
        />

        {/* Styles */}
        <style jsx>{`
          .scrollbar-hide::-webkit-scrollbar {
            display: none;
          }
          .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.4s ease-out;
          }
          .bg-grid-white {
            background-image:
              linear-gradient(
                to right,
                rgba(255, 255, 255, 0.1) 1px,
                transparent 1px
              ),
              linear-gradient(
                to bottom,
                rgba(255, 255, 255, 0.1) 1px,
                transparent 1px
              );
          }
          .delay-1000 {
            animation-delay: 1s;
          }
        `}</style>
      </div>
    </PhotoUploadProvider>
  );
};

export default YPivotQAInspection;
