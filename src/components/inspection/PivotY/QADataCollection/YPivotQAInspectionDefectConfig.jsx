import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  Bug,
  Search,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Save,
  Edit,
  Trash2,
  Minus,
  Play,
  CheckCircle2,
  MapPinOff,
  MapPin,
  Lock,
  Layers,
  MessageSquare,
  Images,
  BarChart3,
  User,
  AlertTriangle,
  FileText,
  FilePenLine,
  Check,
  MoreHorizontal,
  Camera,
  Upload,
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

// Sub-components
import YPivotQATemplatesDefectLocationSelection from "../QATemplates/YPivotQATemplatesDefectLocationSelection";
import YPivotQATemplatesImageEditor from "../QATemplates/YPivotQATemplatesImageEditor";
import { determineBuyerFromOrderNo } from "./YPivotQAInspectionBuyerDetermination";
import YPivotQAInspectionDefectSummary from "./YPivotQAInspectionDefectSummary";
import YPivotQAInspectionManualDefect from "./YPivotQAInspectionManualDefect";

// --- UTILITY: Image Compression ---
const compressImage = async (source, maxWidth = 1280, quality = 0.8) => {
  return new Promise((resolve) => {
    // If it's already a small file, return as is
    if (source instanceof File && source.size < 500 * 1024) {
      resolve(source);
      return;
    }

    const img = new Image();
    let src = "";
    let isObjectUrl = false;

    if (source instanceof Blob || source instanceof File) {
      src = URL.createObjectURL(source);
      isObjectUrl = true;
    } else {
      src = source; // Base64 or URL
    }

    img.src = src;
    img.crossOrigin = "anonymous";

    img.onload = () => {
      let width = img.width;
      let height = img.height;

      // Maintain aspect ratio
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (isObjectUrl) URL.revokeObjectURL(src);
          // Return a File object to simulate a real user upload
          const file = new File([blob], `compressed_${Date.now()}.jpg`, {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(file);
        },
        "image/jpeg",
        quality,
      );
    };

    img.onerror = () => {
      if (isObjectUrl) URL.revokeObjectURL(src);
      resolve(source); // Fallback
    };
  });
};

const YPivotQAInspectionDefectConfig = ({
  selectedOrders,
  orderData,
  reportData,
  onUpdateDefectData,
  activeGroup,
  onDefectsSaved,
}) => {
  // --- Derived Data ---
  const activeProductTypeId = reportData?.config?.productTypeId;

  const determinedBuyer = useMemo(() => {
    if (!selectedOrders || selectedOrders.length === 0) return "Unknown";
    const result = determineBuyerFromOrderNo(selectedOrders[0]);
    return result.buyer;
  }, [selectedOrders]);

  // --- State ---
  const [activeTab, setActiveTab] = useState("list");
  const [savedDefects, setSavedDefects] = useState(
    reportData?.defectData?.savedDefects || [],
  );

  const currentManualData = useMemo(() => {
    const allManualData = reportData?.defectData?.manualDataByGroup || {};
    const groupId = activeGroup ? activeGroup.id : 0;
    return allManualData[groupId] || { remarks: "", images: [] };
  }, [reportData?.defectData?.manualDataByGroup, activeGroup]);

  const [allDefects, setAllDefects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Multi-select state
  const [selectedDefectIds, setSelectedDefectIds] = useState(new Set());

  // Modal State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [selectedDefectsForModal, setSelectedDefectsForModal] = useState([]);
  const [activeDefectIndex, setActiveDefectIndex] = useState(0);
  const [editingDefectId, setEditingDefectId] = useState(null); // For editing existing aggregated defect

  // Available statuses for current defect
  const [availableStatuses, setAvailableStatuses] = useState([]);
  const [defaultStatus, setDefaultStatus] = useState("Major");

  // Form State for each defect in modal
  const [defectForms, setDefectForms] = useState({});

  // UI State
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [imageEditorContext, setImageEditorContext] = useState(null);

  // State for custom delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState({
    isOpen: false,
    type: null, // 'single' or 'aggregated'
    id: null,
    message: "",
  });

  // Expanded defect cards in results
  const [expandedResultCards, setExpandedResultCards] = useState({});

  // Get available QCs from active group
  const availableQCs = useMemo(() => {
    if (!activeGroup?.assignments) return [];
    return activeGroup.assignments.filter((a) => a.qcUser).map((a) => a.qcUser);
  }, [activeGroup]);

  const defaultQC = useMemo(() => {
    return (
      activeGroup?.activeQC ||
      (availableQCs.length > 0 ? availableQCs[0] : null)
    );
  }, [activeGroup, availableQCs]);

  // --- Sync to Parent ---
  const updateParent = (newDefects) => {
    if (onUpdateDefectData) {
      const existingManualDataMap =
        reportData?.defectData?.manualDataByGroup || {};
      onUpdateDefectData({
        savedDefects: newDefects,
        manualDataByGroup: existingManualDataMap,
      });
    }
  };

  const handleManualDataUpdate = (newManualDataForActiveGroup) => {
    if (onUpdateDefectData) {
      // --- MODIFY THIS LINE ---
      // Use activeGroup.id if available.
      // If no active group (General mode), use 0.
      const groupId = activeGroup ? activeGroup.id : 0;

      const existingManualDataMap =
        reportData?.defectData?.manualDataByGroup || {};

      const updatedMap = {
        ...existingManualDataMap,
        [groupId]: newManualDataForActiveGroup,
      };

      onUpdateDefectData({
        savedDefects: savedDefects,
        manualDataByGroup: updatedMap,
      });
    }
  };

  // const handleManualDataUpdate = (newManualDataForActiveGroup) => {
  //   if (onUpdateDefectData) {
  //     const groupId = activeGroup?.id || "general";
  //     const existingManualDataMap =
  //       reportData?.defectData?.manualDataByGroup || {};
  //     const updatedMap = {
  //       ...existingManualDataMap,
  //       [groupId]: newManualDataForActiveGroup
  //     };
  //     onUpdateDefectData({
  //       savedDefects: savedDefects,
  //       manualDataByGroup: updatedMap
  //     });
  //   }
  // };

  // --- Initial Fetch ---
  useEffect(() => {
    const fetchDefects = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/qa-sections-defect-list`,
        );
        if (res.data.success) {
          setAllDefects(res.data.data);
        }
      } catch (err) {
        console.error("Error fetching defects:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDefects();
  }, []);

  // --- Computed: Filtered Defects ---
  const filteredDefectsGrouped = useMemo(() => {
    if (!allDefects.length) return {};

    const reportCategories =
      reportData?.selectedTemplate?.DefectCategoryList?.map(
        (c) => c.CategoryCode,
      );

    const filtered = allDefects.filter((d) => {
      const matchesSearch =
        d.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.code.toLowerCase().includes(searchTerm.toLowerCase());

      const isAllowed =
        !reportCategories ||
        reportCategories.length === 0 ||
        reportCategories.includes(d.CategoryCode);

      return matchesSearch && isAllowed;
    });

    const groups = filtered.reduce((acc, curr) => {
      const cat = curr.CategoryNameEng || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(curr);
      return acc;
    }, {});

    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => parseFloat(a.code) - parseFloat(b.code));
    });

    return groups;
  }, [allDefects, searchTerm, reportData?.selectedTemplate]);

  // --- Computed: Aggregated Defects for Results ---
  const aggregatedDefects = useMemo(() => {
    const aggregated = {};

    savedDefects.forEach((defect, originalIndex) => {
      // Create separate keys for no-location vs location-based entries
      const locationType = defect.isNoLocation ? "noLoc" : "withLoc";
      const key = `${defect.groupId}_${defect.defectId}_${locationType}`;

      if (!aggregated[key]) {
        aggregated[key] = {
          defectId: defect.defectId,
          defectName: defect.defectName,
          defectCode: defect.defectCode,
          categoryName: defect.categoryName,
          groupId: defect.groupId,
          lineName: defect.lineName,
          tableName: defect.tableName,
          colorName: defect.colorName,
          determinedBuyer: defect.determinedBuyer,
          isNoLocation: defect.isNoLocation, // <-- ADD THIS
          entries: [],
        };
      }

      aggregated[key].entries.push({
        ...defect,
        originalIndex,
      });
    });

    // Calculate totals and stats for each aggregated defect
    Object.values(aggregated).forEach((agg) => {
      agg.totalQty = agg.entries.reduce((sum, e) => sum + (e.qty || 0), 0);

      if (agg.isNoLocation) {
        // For no-location entries, count by status directly
        agg.criticalCount = agg.entries.reduce(
          (sum, e) => sum + (e.status === "Critical" ? e.qty : 0),
          0,
        );
        agg.majorCount = agg.entries.reduce(
          (sum, e) => sum + (e.status === "Major" ? e.qty : 0),
          0,
        );
        agg.minorCount = agg.entries.reduce(
          (sum, e) => sum + (e.status === "Minor" ? e.qty : 0),
          0,
        );
      } else {
        // For location-based entries, count from positions
        agg.criticalCount = agg.entries.reduce((sum, e) => {
          return (
            sum +
            (e.locations || []).reduce((locSum, loc) => {
              return (
                locSum +
                (loc.positions || []).filter((p) => p.status === "Critical")
                  .length
              );
            }, 0)
          );
        }, 0);
        agg.majorCount = agg.entries.reduce((sum, e) => {
          return (
            sum +
            (e.locations || []).reduce((locSum, loc) => {
              return (
                locSum +
                (loc.positions || []).filter((p) => p.status === "Major").length
              );
            }, 0)
          );
        }, 0);
        agg.minorCount = agg.entries.reduce((sum, e) => {
          return (
            sum +
            (e.locations || []).reduce((locSum, loc) => {
              return (
                locSum +
                (loc.positions || []).filter((p) => p.status === "Minor").length
              );
            }, 0)
          );
        }, 0);
      }
    });

    return aggregated;
  }, [savedDefects]);

  // --- Computed: Active Session Stats ---
  const activeSessionStats = useMemo(() => {
    const relevantDefects = activeGroup
      ? savedDefects.filter((d) => d.groupId === activeGroup.id)
      : [];

    let total = 0,
      critical = 0,
      major = 0,
      minor = 0;

    relevantDefects.forEach((d) => {
      if (d.isNoLocation) {
        total += d.qty;
        if (d.status === "Critical") critical += d.qty;
        else if (d.status === "Major") major += d.qty;
        else if (d.status === "Minor") minor += d.qty;
      } else {
        (d.locations || []).forEach((loc) => {
          (loc.positions || []).forEach((pos) => {
            total += 1;
            if (pos.status === "Critical") critical += 1;
            else if (pos.status === "Major") major += 1;
            else if (pos.status === "Minor") minor += 1;
          });
        });
      }
    });

    return { total, critical, major, minor };
  }, [savedDefects, activeGroup]);

  // --- Helper: Get statuses for a defect based on buyer ---
  const getStatusesForDefect = (defectTemplate) => {
    if (
      !defectTemplate?.statusByBuyer ||
      !determinedBuyer ||
      determinedBuyer === "Unknown"
    ) {
      return {
        statuses: ["Minor", "Major", "Critical"],
        defaultStatus: "Major",
      };
    }

    const buyerRule = defectTemplate.statusByBuyer.find(
      (r) =>
        r.buyerName?.toLowerCase().trim() ===
        determinedBuyer.toLowerCase().trim(),
    );

    if (buyerRule?.defectStatus?.length > 0) {
      return {
        statuses: buyerRule.defectStatus,
        defaultStatus: buyerRule.commonStatus || buyerRule.defectStatus[0],
      };
    }

    const defaultRule = defectTemplate.statusByBuyer.find((r) =>
      ["default", "all", "*"].includes(r.buyerName?.toLowerCase()),
    );

    if (defaultRule?.defectStatus?.length > 0) {
      return {
        statuses: defaultRule.defectStatus,
        defaultStatus: defaultRule.commonStatus || defaultRule.defectStatus[0],
      };
    }

    return { statuses: ["Minor", "Major", "Critical"], defaultStatus: "Major" };
  };

  // --- Handlers ---

  const toggleDefectSelection = (defectId) => {
    setSelectedDefectIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(defectId)) {
        newSet.delete(defectId);
      } else {
        newSet.add(defectId);
      }
      return newSet;
    });
  };

  const handleOpenModalForSelected = () => {
    if (selectedDefectIds.size === 0) return;

    const selectedDefects = allDefects.filter((d) =>
      selectedDefectIds.has(d._id),
    );

    // Initialize forms for each defect
    const forms = {};
    selectedDefects.forEach((defect) => {
      const { statuses, defaultStatus: defStatus } =
        getStatusesForDefect(defect);
      forms[defect._id] = {
        status: defStatus,
        qty: 1,
        locations: [],
        isNoLocation: false,
        additionalRemark: "",
        selectedQC: defaultQC,
        availableStatuses: statuses,
        defaultStatus: defStatus,
        // ADD THIS: Initialize specific positions for No Location mode
        noLocationPositions: [
          {
            pcsNo: 1,
            status: defStatus,
            requiredImage: null,
          },
        ],
      };
    });

    setSelectedDefectsForModal(selectedDefects);
    setDefectForms(forms);
    setActiveDefectIndex(0);
    setEditingDefectId(null);

    if (selectedDefects.length > 0) {
      const firstDefect = selectedDefects[0];
      const { statuses, defaultStatus: defStatus } =
        getStatusesForDefect(firstDefect);
      setAvailableStatuses(statuses);
      setDefaultStatus(defStatus);
    }

    setIsConfigOpen(true);
    setSelectedDefectIds(new Set());
  };

  const handleOpenModalForEdit = (aggregatedDefect) => {
    const defectTemplate = allDefects.find(
      (d) => d._id === aggregatedDefect.defectId,
    ) || {
      _id: aggregatedDefect.defectId,
      english: aggregatedDefect.defectName,
      code: aggregatedDefect.defectCode,
      CategoryNameEng: aggregatedDefect.categoryName,
      statusByBuyer: [],
    };

    const { statuses, defaultStatus: defStatus } =
      getStatusesForDefect(defectTemplate);

    let formData = {};

    if (aggregatedDefect.isNoLocation) {
      // Handle No-Location entries
      const existingEntries = aggregatedDefect.entries;
      const totalQty = existingEntries.reduce(
        (sum, e) => sum + (e.qty || 0),
        0,
      );

      // Create positions array from existing entries
      // If an entry has qty=2, we make 2 positions for it
      let currentPcs = 1;
      const reconstructedPositions = [];

      existingEntries.forEach((entry) => {
        const count = entry.qty || 1;
        for (let i = 0; i < count; i++) {
          reconstructedPositions.push({
            pcsNo: currentPcs++,
            status: entry.status || defStatus,
            // Check if there is a saved image in the entry (we will save it there in Step 3)
            requiredImage: entry.images?.[i] || null,
          });
        }
      });

      formData = {
        status: existingEntries[0]?.status || defStatus, // Fallback global status
        qty: totalQty,
        locations: [],
        isNoLocation: true,
        additionalRemark: existingEntries[0]?.additionalRemark || "",
        selectedQC: existingEntries[0]?.qcUser || defaultQC,
        availableStatuses: statuses,
        defaultStatus: defStatus,
        existingEntries: aggregatedDefect.entries,
        // ADD THIS:
        noLocationPositions:
          reconstructedPositions.length > 0
            ? reconstructedPositions
            : [{ pcsNo: 1, status: defStatus, requiredImage: null }],
      };
    } else {
      // Handle Location-based entries
      const combinedLocations = [];

      aggregatedDefect.entries.forEach((entry) => {
        if (entry.locations) {
          entry.locations.forEach((loc) => {
            // Check if this location already exists in combinedLocations
            const existingLocIndex = combinedLocations.findIndex(
              (l) => l.uniqueId === loc.uniqueId,
            );

            if (existingLocIndex !== -1) {
              // Merge positions into existing location
              const existingLoc = combinedLocations[existingLocIndex];
              const maxPcsNo = Math.max(
                0,
                ...(existingLoc.positions || []).map((p) => p.pcsNo),
              );

              const renumberedPositions = (loc.positions || []).map(
                (pos, idx) => ({
                  ...pos,
                  pcsNo: maxPcsNo + idx + 1,
                  requiredImage: pos.requiredImage || null,
                  additionalRemark: pos.additionalRemark || "",
                  additionalImages: pos.additionalImages || [],
                }),
              );

              combinedLocations[existingLocIndex] = {
                ...existingLoc,
                qty: (existingLoc.qty || 0) + (loc.qty || 1),
                positions: [
                  ...(existingLoc.positions || []),
                  ...renumberedPositions,
                ],
              };
            } else {
              // Add as new location
              const updatedPositions = (loc.positions || []).map((pos) => ({
                ...pos,
                requiredImage: pos.requiredImage || null,
                additionalRemark: pos.additionalRemark || "",
                additionalImages: pos.additionalImages || [],
              }));

              combinedLocations.push({
                ...loc,
                positions: updatedPositions,
                entryId: entry.originalIndex,
              });
            }
          });
        }
      });

      formData = {
        status: defStatus,
        qty: aggregatedDefect.totalQty,
        locations: combinedLocations,
        isNoLocation: false,
        additionalRemark: "",
        selectedQC: defaultQC,
        availableStatuses: statuses,
        defaultStatus: defStatus,
        existingEntries: aggregatedDefect.entries,
      };
    }

    setSelectedDefectsForModal([defectTemplate]);
    setDefectForms({ [defectTemplate._id]: formData });
    setActiveDefectIndex(0);
    setEditingDefectId(aggregatedDefect.defectId);
    setAvailableStatuses(statuses);
    setDefaultStatus(defStatus);
    setIsConfigOpen(true);
  };

  const handleRemoveDefectFromModal = (defectId) => {
    const newDefects = selectedDefectsForModal.filter(
      (d) => d._id !== defectId,
    );
    setSelectedDefectsForModal(newDefects);

    const newForms = { ...defectForms };
    delete newForms[defectId];
    setDefectForms(newForms);

    if (newDefects.length === 0) {
      setIsConfigOpen(false);
    } else if (activeDefectIndex >= newDefects.length) {
      setActiveDefectIndex(newDefects.length - 1);
    }
  };

  const handleSelectDefectInModal = (index) => {
    setActiveDefectIndex(index);
    const defect = selectedDefectsForModal[index];
    if (defect) {
      const form = defectForms[defect._id];
      if (form) {
        setAvailableStatuses(form.availableStatuses);
        setDefaultStatus(form.defaultStatus);
      }
    }
  };

  const updateDefectForm = (defectId, updates) => {
    setDefectForms((prev) => ({
      ...prev,
      [defectId]: { ...prev[defectId], ...updates },
    }));
  };

  const handleLocationSelectionChange = useCallback((defectId, locations) => {
    updateDefectForm(defectId, { locations });
  }, []);

  // Calculate qty for a defect form
  const getCalculatedQty = (form) => {
    if (form.isNoLocation) {
      return form.qty;
    }
    if (form.locations.length === 0) {
      return 0;
    }
    return form.locations.reduce((sum, loc) => {
      // Count positions if available, otherwise use qty
      const posCount = loc.positions?.length || loc.qty || 1;
      return sum + posCount;
    }, 0);
  };

  // Check if a defect form is valid
  const isDefectFormValid = (form) => {
    if (form.isNoLocation) {
      return form.qty > 0;
    }
    if (form.locations.length === 0) return false;

    // Check if all pieces in all locations have their required image
    const allImagesOk = form.locations.every((loc) => {
      if (!loc.positions || loc.positions.length === 0) return false;
      return loc.positions.every(
        (pos) => pos.requiredImage !== null && pos.requiredImage !== undefined,
      );
    });

    return allImagesOk;
  };

  // Count valid defects
  const validDefectsCount = useMemo(() => {
    return selectedDefectsForModal.filter((d) => {
      const form = defectForms[d._id];
      return form && isDefectFormValid(form);
    }).length;
  }, [selectedDefectsForModal, defectForms]);

  // Check if ALL defects are valid (for button enable/disable)
  const allDefectsValid = useMemo(() => {
    if (selectedDefectsForModal.length === 0) return false;
    return selectedDefectsForModal.every((d) => {
      const form = defectForms[d._id];
      return form && isDefectFormValid(form);
    });
  }, [selectedDefectsForModal, defectForms]);

  const handleSaveDefects = () => {
    let updatedList = [...savedDefects];

    // 1. Remove OLD entries if editing
    if (editingDefectId) {
      const currentForm = defectForms[editingDefectId];

      // To handle the separation of cards.
      // We check if the entries we are editing were originally "No Location" or not.
      // We can infer this from the existing entries attached to the form.
      const isEditingNoLocation =
        currentForm.existingEntries?.[0]?.isNoLocation === true;

      updatedList = updatedList.filter((d) => {
        // Keep entries that are NOT the defect we are editing
        if (d.defectId !== editingDefectId) return true;
        if (d.groupId !== activeGroup?.id) return true;

        // If we are editing "No Location" type, only remove "No Location" entries.
        // If we are editing "With Location" type, only remove "With Location" entries.
        // This ensures if we switch types, the old type is removed and new type is added below.
        if (d.isNoLocation === isEditingNoLocation) return false;

        return true;
      });
    }

    // 2. Add NEW entries
    selectedDefectsForModal.forEach((defect) => {
      const form = defectForms[defect._id];
      if (!form || !isDefectFormValid(form)) return;

      if (form.isNoLocation) {
        // Save individual pieces from noLocationPositions
        // We create separate entries per Qty so they can hold their own images/status
        (form.noLocationPositions || []).forEach((pos) => {
          updatedList.push({
            defectId: defect._id,
            defectName: defect.english,
            defectCode: defect.code,
            categoryName: defect.CategoryNameEng,
            groupId: activeGroup?.id,
            lineName: activeGroup?.lineName,
            tableName: activeGroup?.tableName,
            colorName: activeGroup?.colorName,
            determinedBuyer: determinedBuyer,
            timestamp: new Date().toISOString(),
            // EXPLICITLY MARK NO LOCATION
            isNoLocation: true,
            qty: 1,
            status: pos.status,
            qcUser: form.selectedQC,
            additionalRemark: form.additionalRemark,
            // SAVE THE IMAGE HERE
            images: pos.requiredImage ? [pos.requiredImage] : [],
            locations: [],
          });
        });
      } else {
        // Add as new entry logic for Location-Based
        updatedList.push({
          defectId: defect._id,
          defectName: defect.english,
          defectCode: defect.code,
          categoryName: defect.CategoryNameEng,
          groupId: activeGroup?.id,
          lineName: activeGroup?.lineName,
          tableName: activeGroup?.tableName,
          colorName: activeGroup?.colorName,
          determinedBuyer: determinedBuyer,
          timestamp: new Date().toISOString(),
          isNoLocation: false, // <--- IMPORTANT: Explicitly false
          status: null, // Status is inside locations
          qcUser: null,
          additionalRemark: "",
          qty: getCalculatedQty(form),
          locations: form.locations,
        });
      }
    });

    setSavedDefects(updatedList);
    updateParent(updatedList);
    setIsConfigOpen(false);
    setSelectedDefectsForModal([]);
    setDefectForms({});
    setEditingDefectId(null);

    // ADD THIS: Trigger auto-save after modal closes
    if (onDefectsSaved) {
      console.log("[DefectConfig] Calling onDefectsSaved...");
      onDefectsSaved();
    }
  };

  const handleDeleteDefect = (originalIndex) => {
    // Open the custom modal instead of window.confirm
    setDeleteConfirm({
      isOpen: true,
      type: "single",
      id: originalIndex,
      message: "Are you sure you want to delete this specific defect entry?",
    });
  };

  const handleDeleteAggregatedDefect = (aggregatedKey) => {
    const agg = aggregatedDefects[aggregatedKey];
    if (!agg) return;

    const typeLabel = agg.isNoLocation ? "(No Location)" : "(With Locations)";

    // Open the custom modal
    setDeleteConfirm({
      isOpen: true,
      type: "aggregated",
      id: aggregatedKey,
      message: `Delete all ${agg.entries.length} entries for "${agg.defectName}" ${typeLabel}?`,
    });
  };

  // This function actually performs the delete when user clicks "Yes"
  const confirmDeleteAction = () => {
    let updatedList = [...savedDefects];

    if (deleteConfirm.type === "single") {
      updatedList.splice(deleteConfirm.id, 1);
    } else if (deleteConfirm.type === "aggregated") {
      const agg = aggregatedDefects[deleteConfirm.id];
      if (agg) {
        const indicesToRemove = new Set(
          agg.entries.map((e) => e.originalIndex),
        );
        updatedList = savedDefects.filter(
          (_, idx) => !indicesToRemove.has(idx),
        );
      }
    }

    setSavedDefects(updatedList);
    updateParent(updatedList);

    // Close modal
    setDeleteConfirm({ isOpen: false, type: null, id: null, message: "" });
  };

  const toggleCategory = (cat) => {
    setExpandedCategories((p) => ({ ...p, [cat]: !p[cat] }));
  };

  const toggleResultCard = (key) => {
    setExpandedResultCards((p) => ({ ...p, [key]: !p[key] }));
  };

  // --- Helper: Get status badge classes ---
  const getStatusBadgeClasses = (status) => {
    switch (status) {
      case "Critical":
        return "bg-red-100 text-red-700 border-red-200";
      case "Major":
        return "bg-orange-100 text-orange-700 border-orange-200";
      case "Minor":
        return "bg-green-100 text-green-700 border-green-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusColorClasses = (status, isSelected) => {
    if (!isSelected)
      return "border-gray-200 bg-white text-gray-500 hover:border-gray-400";
    switch (status) {
      case "Critical":
        return "border-red-500 bg-red-50 text-red-700";
      case "Major":
        return "border-orange-500 bg-orange-50 text-orange-700";
      case "Minor":
        return "border-green-500 bg-green-50 text-green-700";
      default:
        return "border-gray-500 bg-gray-50 text-gray-700";
    }
  };

  // --- Helper: Get comments display ---
  const getCommentsDisplay = (locations) => {
    if (!locations || locations.length === 0) return null;
    const comments = [];
    locations.forEach((loc) => {
      if (loc.positions) {
        loc.positions.forEach((pos) => {
          if (pos.comment && pos.comment.trim()) {
            comments.push(
              `#${loc.locationNo} Pcs${pos.pcsNo}: ${pos.comment.trim()}`,
            );
          }
        });
      }
    });
    if (comments.length === 0) return null;
    return comments.join(" | ");
  };

  const getTotalImagesCount = (locations) => {
    if (!locations || locations.length === 0) return 0;
    return locations.reduce((sum, loc) => {
      const requiredImagesCount = (loc.positions || []).filter(
        (pos) => pos.requiredImage,
      ).length;
      const additionalImagesCount = (loc.positions || []).reduce(
        (posSum, pos) => posSum + (pos.additionalImages?.length || 0),
        0,
      );
      return sum + requiredImagesCount + additionalImagesCount;
    }, 0);
  };
  // ================= RENDER =================

  const renderActiveBanner = () => {
    if (!activeGroup) {
      return (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-xl flex items-start gap-2 mb-4">
          <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-bold text-amber-700 dark:text-amber-400 text-sm">
              No Active Inspection Context
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500">
              Go to <strong>Info</strong> tab and click "Start" to add defects.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-2.5 rounded-xl flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Play className="w-3.5 h-3.5 text-green-600 fill-current" />
          <div className="text-xs font-bold text-green-800 dark:text-green-300 flex flex-wrap gap-1">
            <span>Active:</span>
            {activeGroup.lineName && (
              <span className="bg-white/50 px-1.5 rounded border border-green-200">
                Line {activeGroup.lineName}
              </span>
            )}
            {activeGroup.tableName && (
              <span className="bg-white/50 px-1.5 rounded border border-green-200">
                Table {activeGroup.tableName}
              </span>
            )}
            {activeGroup.colorName && (
              <span className="bg-white/50 px-1.5 rounded border border-green-200">
                {activeGroup.colorName}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // --- List Tab ---
  const renderListTab = () => {
    if (!activeGroup) return null;

    return (
      <div className="space-y-3 pb-24">
        {/* Search and Actions */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search defects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
          </div>
        </div>

        {/* Selection Info Bar */}
        {selectedDefectIds.size > 0 && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                {selectedDefectIds.size} defect
                {selectedDefectIds.size > 1 ? "s" : ""} selected
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedDefectIds(new Set())}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Clear
              </button>
              <button
                onClick={handleOpenModalForSelected}
                className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-1.5 shadow-md"
              >
                <Plus className="w-4 h-4" />
                Add Selected
              </button>
            </div>
          </div>
        )}

        {/* Defect Categories */}
        {Object.entries(filteredDefectsGrouped).map(([category, items]) => (
          <div
            key={category}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            <button
              onClick={() => toggleCategory(category)}
              className="w-full flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-3 py-2.5 font-bold text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-sm"
            >
              <span>
                {category}{" "}
                <span className="text-xs font-normal opacity-70">
                  ({items.length})
                </span>
              </span>
              {expandedCategories[category] ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {expandedCategories[category] && (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {items.map((defect) => {
                  const isSelected = selectedDefectIds.has(defect._id);
                  return (
                    <div
                      key={defect._id}
                      onClick={() => toggleDefectSelection(defect._id)}
                      className={`p-2.5 flex justify-between items-center cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-indigo-50 dark:bg-indigo-900/20"
                          : "hover:bg-gray-50 dark:hover:bg-gray-700/50"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isSelected
                              ? "bg-indigo-600 border-indigo-600"
                              : "border-gray-300 bg-white"
                          }`}
                        >
                          {isSelected && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">
                              {defect.code}
                            </span>
                            <span className="text-xs font-medium text-gray-800 dark:text-gray-200">
                              {defect.english}
                            </span>
                          </div>
                          {defect.khmer && (
                            <p className="text-[10px] text-gray-500 mt-0.5 ml-7">
                              {defect.khmer}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {/* Floating Add Button */}
        {selectedDefectIds.size > 0 && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40">
            <button
              onClick={handleOpenModalForSelected}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-full shadow-xl hover:shadow-2xl flex items-center gap-2 animate-bounce"
            >
              <Plus className="w-5 h-5" />
              Add {selectedDefectIds.size} Defect
              {selectedDefectIds.size > 1 ? "s" : ""}
            </button>
          </div>
        )}
      </div>
    );
  };

  // --- Results Tab ---
  const renderResultsTab = () => {
    const groupedByContext = {};

    Object.entries(aggregatedDefects).forEach(([key, agg]) => {
      const contextKey = agg.groupId || "legacy";
      if (!groupedByContext[contextKey]) {
        groupedByContext[contextKey] = {
          id: contextKey,
          line: agg.lineName,
          table: agg.tableName,
          color: agg.colorName,
          defects: [],
        };
      }
      groupedByContext[contextKey].defects.push({ key, ...agg });
    });

    return (
      <div className="space-y-4 pb-20">
        {/* Active Session Summary */}
        {activeGroup && (
          <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg p-4 text-white">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-black">
                  {activeSessionStats.total}
                </h2>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider">
                  Active Session Defects
                </p>
              </div>
              <div className="flex gap-3">
                <div className="text-center px-2 py-1 bg-red-500/20 rounded-lg border border-red-500/30">
                  <p className="text-lg font-bold text-red-400">
                    {activeSessionStats.critical}
                  </p>
                  <p className="text-[9px] uppercase opacity-70">Critical</p>
                </div>
                <div className="text-center px-2 py-1 bg-orange-500/20 rounded-lg border border-orange-500/30">
                  <p className="text-lg font-bold text-orange-400">
                    {activeSessionStats.major}
                  </p>
                  <p className="text-[9px] uppercase opacity-70">Major</p>
                </div>
                <div className="text-center px-2 py-1 bg-green-500/20 rounded-lg border border-green-500/30">
                  <p className="text-lg font-bold text-green-400">
                    {activeSessionStats.minor}
                  </p>
                  <p className="text-[9px] uppercase opacity-70">Minor</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Grouped Results */}
        {Object.values(groupedByContext).map((group) => {
          const isActive = activeGroup && activeGroup.id === group.id;

          return (
            <div key={group.id} className="space-y-2">
              {/* Group Header */}
              <div
                className={`flex items-center gap-2 pb-2 border-b-2 ${
                  isActive
                    ? "border-green-500"
                    : "border-gray-200 dark:border-gray-700"
                }`}
              >
                <div
                  className={`p-1.5 rounded-lg ${
                    isActive
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Layers className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <h4
                    className={`text-xs font-bold ${
                      isActive ? "text-green-700" : "text-gray-600"
                    }`}
                  >
                    {group.line && `Line ${group.line}`}
                    {group.table && ` • Table ${group.table}`}
                    {group.color && ` • ${group.color}`}
                  </h4>
                </div>
                {isActive ? (
                  <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded font-bold">
                    Active
                  </span>
                ) : (
                  <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Locked
                  </span>
                )}
              </div>

              {/* Defect Cards */}
              <div className="grid grid-cols-1 gap-3">
                {group.defects.map((agg) => {
                  const isExpanded = expandedResultCards[agg.key];

                  return (
                    <div
                      key={agg.key}
                      className={`bg-white dark:bg-gray-800 rounded-lg border shadow-sm transition-all ${
                        isActive
                          ? "border-gray-200 hover:border-indigo-400"
                          : "border-gray-300 opacity-70"
                      }`}
                    >
                      {/* Card Header */}
                      <div
                        className="px-3 py-2.5 flex justify-between items-start cursor-pointer"
                        onClick={() => toggleResultCard(agg.key)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="text-[10px] font-mono bg-gray-100 dark:bg-gray-700 px-1.5 rounded">
                              {agg.defectCode}
                            </span>
                            {/* Type indicator */}
                            {agg.isNoLocation ? (
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600 flex items-center gap-0.5">
                                <MapPinOff className="w-2.5 h-2.5" /> No
                                Location
                              </span>
                            ) : (
                              <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-600 flex items-center gap-0.5">
                                <MapPin className="w-2.5 h-2.5" /> With Location
                              </span>
                            )}
                            {agg.criticalCount > 0 && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700">
                                {agg.criticalCount} Critical
                              </span>
                            )}
                            {agg.majorCount > 0 && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-orange-100 text-orange-700">
                                {agg.majorCount} Major
                              </span>
                            )}
                            {agg.minorCount > 0 && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">
                                {agg.minorCount} Minor
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-gray-800 dark:text-white text-sm truncate">
                            {agg.defectName}
                          </h4>
                          <p className="text-[10px] text-gray-500 mt-0.5">
                            {agg.entries.length} entr
                            {agg.entries.length > 1 ? "ies" : "y"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold text-indigo-600">
                            {agg.totalQty}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Content */}
                      {isExpanded && (
                        <div className="border-t border-gray-100 dark:border-gray-700">
                          {/* Entries List */}
                          <div className="p-2 space-y-2 max-h-80 overflow-y-auto">
                            {agg.entries.map((entry, idx) => (
                              <div
                                key={idx}
                                className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-2 border border-gray-100 dark:border-gray-700"
                              >
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-[10px] font-bold text-gray-500">
                                    Entry #{idx + 1}
                                  </span>
                                  <span className="text-xs font-bold text-indigo-600">
                                    Qty: {entry.qty}
                                  </span>
                                </div>

                                {entry.isNoLocation ? (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded flex items-center gap-1">
                                      <MapPinOff className="w-3 h-3" /> No
                                      Location
                                    </span>
                                    {entry.status && (
                                      <span
                                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeClasses(
                                          entry.status,
                                        )}`}
                                      >
                                        {entry.status}
                                      </span>
                                    )}
                                  </div>
                                ) : (
                                  <div className="space-y-1">
                                    {/* 1. Display Total Images Count if > 0 */}
                                    {getTotalImagesCount(entry.locations) >
                                      0 && (
                                      <div className="flex items-center gap-1 mb-1">
                                        <span className="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded flex items-center gap-1 border border-indigo-100">
                                          <Images className="w-3 h-3" />
                                          {getTotalImagesCount(
                                            entry.locations,
                                          )}{" "}
                                          Image(s) Attached
                                        </span>
                                      </div>
                                    )}

                                    {/* 2. Display Comment Summary if exists */}
                                    {getCommentsDisplay(entry.locations) && (
                                      <div className="flex items-start gap-1 mb-1 px-1.5 py-1 bg-yellow-50 border border-yellow-100 rounded">
                                        <MessageSquare className="w-3 h-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                                        <p className="text-[9px] text-yellow-800 italic line-clamp-2">
                                          {getCommentsDisplay(entry.locations)}
                                        </p>
                                      </div>
                                    )}
                                    {(entry.locations || []).map(
                                      (loc, locIdx) => (
                                        <div
                                          key={locIdx}
                                          className="bg-white dark:bg-gray-800 rounded p-1.5 border border-gray-200 dark:border-gray-600"
                                        >
                                          <div className="flex items-center gap-1 flex-wrap">
                                            <span
                                              className={`text-[8px] font-bold px-1 rounded ${
                                                loc.view === "Front"
                                                  ? "bg-red-100 text-red-600"
                                                  : "bg-blue-100 text-blue-600"
                                              }`}
                                            >
                                              {loc.view}
                                            </span>
                                            <span className="text-[9px] font-medium">
                                              #{loc.locationNo} -{" "}
                                              {loc.locationName}
                                            </span>
                                            {/* Image count badge */}
                                            {loc.positions && (
                                              <span className="text-[8px] text-gray-500 bg-gray-100 px-1 rounded flex items-center gap-0.5">
                                                <Images className="w-2.5 h-2.5" />
                                                {
                                                  loc.positions.filter(
                                                    (p) => p.requiredImage,
                                                  ).length
                                                }
                                                /{loc.positions.length}
                                              </span>
                                            )}
                                          </div>
                                          {loc.positions &&
                                            loc.positions.length > 0 && (
                                              <div className="mt-1 flex flex-wrap gap-1">
                                                {loc.positions.map(
                                                  (pos, posIdx) => (
                                                    <div
                                                      key={posIdx}
                                                      className="flex items-center gap-0.5"
                                                    >
                                                      <span
                                                        className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${getStatusBadgeClasses(
                                                          pos.status,
                                                        )}`}
                                                      >
                                                        Pcs{pos.pcsNo}:{" "}
                                                        {pos.status}
                                                      </span>
                                                      {pos.requiredImage && (
                                                        <span className="text-[7px] text-green-500">
                                                          ✓img
                                                        </span>
                                                      )}
                                                    </div>
                                                  ),
                                                )}
                                              </div>
                                            )}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Actions */}
                          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-2 border-t border-gray-100 dark:border-gray-700">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isActive) handleOpenModalForEdit(agg);
                              }}
                              disabled={!isActive}
                              className={`p-1.5 rounded transition-colors ${
                                isActive
                                  ? "bg-white border text-indigo-600 hover:bg-indigo-50"
                                  : "bg-transparent text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isActive)
                                  handleDeleteAggregatedDefect(agg.key);
                              }}
                              disabled={!isActive}
                              className={`p-1.5 rounded transition-colors ${
                                isActive
                                  ? "bg-white border text-red-500 hover:bg-red-50"
                                  : "bg-transparent text-gray-400 cursor-not-allowed"
                              }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {Object.keys(aggregatedDefects).length === 0 && (
          <div className="text-center py-10 text-gray-400">
            <Bug className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="font-medium text-sm">No defects recorded yet.</p>
            <p className="text-xs">Select defects from the list to add.</p>
          </div>
        )}
      </div>
    );
  };

  // Helper to update No Location Qty and adjust the positions array
  const updateNoLocationQtyAndPositions = (defectId, newQty) => {
    const form = defectForms[defectId];
    if (!form) return;

    const currentPositions = form.noLocationPositions || [];
    let newPositions = [...currentPositions];

    if (newQty > currentPositions.length) {
      // Add new pieces
      for (let i = currentPositions.length; i < newQty; i++) {
        newPositions.push({
          pcsNo: i + 1,
          status: form.defaultStatus,
          requiredImage: null,
        });
      }
    } else if (newQty < currentPositions.length) {
      // Remove pieces
      newPositions = newPositions.slice(0, newQty);
    }

    updateDefectForm(defectId, {
      qty: newQty,
      noLocationPositions: newPositions,
    });
  };

  // Helper to update specific piece in No Location mode
  const updateNoLocationPiece = (defectId, index, field, value) => {
    const form = defectForms[defectId];
    const newPositions = [...(form.noLocationPositions || [])];
    newPositions[index] = { ...newPositions[index], [field]: value };
    updateDefectForm(defectId, { noLocationPositions: newPositions });
  };

  // Image Editor Handlers
  const handleImageEditorSave = async (savedImages) => {
    if (!savedImages || savedImages.length === 0) {
      setShowImageEditor(false);
      return;
    }

    const image = savedImages[0];

    // ENSURE ID EXISTS FIRST
    const imageId =
      image.id ||
      `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    let compressedImageObj = {
      ...image,
      id: imageId, // Always set ID
    };

    if (image.file) {
      try {
        const compressedFile = await compressImage(image.file);
        const displayUrl = URL.createObjectURL(compressedFile);

        compressedImageObj = {
          id: imageId, // Preserve ID
          file: compressedFile,
          imgSrc: displayUrl,
          editedImgSrc: displayUrl,
        };
      } catch (e) {
        console.error("Compression failed", e);
      }
    }

    console.log(`[handleImageEditorSave] Saving image with ID: ${imageId}`);

    if (imageEditorContext?.type === "noLoc") {
      updateNoLocationPiece(
        imageEditorContext.defectId,
        imageEditorContext.index,
        "requiredImage",
        compressedImageObj,
      );
    }

    setShowImageEditor(false);
    setImageEditorContext(null);
  };

  const handleImageEditorCancel = () => {
    setShowImageEditor(false);
    setImageEditorContext(null);
  };

  // --- Modal ---
  const renderConfigModal = () => {
    if (!isConfigOpen || selectedDefectsForModal.length === 0) return null;

    const currentDefect = selectedDefectsForModal[activeDefectIndex];
    const currentForm = defectForms[currentDefect?._id];

    if (!currentDefect || !currentForm) return null;

    const calculatedQty = getCalculatedQty(currentForm);
    const isCurrentFormValid = isDefectFormValid(currentForm);

    return createPortal(
      <div className="fixed inset-0 z-[100] h-[100dvh] bg-white dark:bg-gray-900 overflow-hidden flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="flex-shrink-0 px-3 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg safe-area-top">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-white" />
              <h2 className="text-white font-bold text-sm">
                Configure Defects ({selectedDefectsForModal.length})
              </h2>
            </div>
            <button
              onClick={() => setIsConfigOpen(false)}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded-full text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Buyer Info */}
          {determinedBuyer && determinedBuyer !== "Unknown" && (
            <div className="text-[10px] text-indigo-200 mb-2">
              Buyer:{" "}
              <span className="font-bold text-white">{determinedBuyer}</span>
            </div>
          )}

          {/* Defect Tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {selectedDefectsForModal.map((defect, idx) => {
              const form = defectForms[defect._id];
              const isValid = form && isDefectFormValid(form);
              const isActive = idx === activeDefectIndex;

              return (
                <div
                  key={defect._id}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all flex-shrink-0 ${
                    isActive
                      ? "bg-white text-indigo-700 shadow-md"
                      : "bg-white/20 text-white hover:bg-white/30"
                  }`}
                  onClick={() => handleSelectDefectInModal(idx)}
                >
                  <div className="flex flex-col">
                    <span className="text-[9px] font-mono opacity-70">
                      {defect.code}
                    </span>
                    <span className="text-[10px] font-bold truncate max-w-[100px]">
                      {defect.english}
                    </span>
                  </div>
                  {isValid && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  )}
                  {!editingDefectId && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveDefectFromModal(defect._id);
                      }}
                      className="p-0.5 hover:bg-red-100 rounded-full text-red-400 hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 pb-24">
          {/* Current Defect Info */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-3 border border-indigo-200 dark:border-indigo-800">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-indigo-600">
                  {currentDefect.code}
                </span>
                <h3 className="font-bold text-indigo-800 dark:text-indigo-300 text-sm">
                  {currentDefect.english}
                </h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-500">Total Qty</span>
                <p className="text-2xl font-black text-indigo-600">
                  {calculatedQty}
                </p>
              </div>
            </div>
          </div>

          {/* No Location Checkbox */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={currentForm.isNoLocation}
                onChange={(e) =>
                  updateDefectForm(currentDefect._id, {
                    isNoLocation: e.target.checked,
                    locations: [],
                    qty: 1,
                  })
                }
                className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                No Location Required
              </span>
            </label>
            <MapPinOff className="w-4 h-4 text-gray-400" />
          </div>

          {/* No Location Mode Content */}
          {currentForm.isNoLocation && (
            <div className="space-y-4">
              {/* Status Selection */}
              {/* Global Qty Control */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <span className="text-xs font-bold text-gray-600">
                  Total Pieces
                </span>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      updateNoLocationQtyAndPositions(
                        currentDefect._id,
                        Math.max(1, currentForm.qty - 1),
                      )
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-xl font-bold text-indigo-600 w-8 text-center">
                    {currentForm.qty}
                  </span>
                  <button
                    onClick={() =>
                      updateNoLocationQtyAndPositions(
                        currentDefect._id,
                        currentForm.qty + 1,
                      )
                    }
                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Pieces List with Image & Status */}
              <div className="space-y-2">
                {(currentForm.noLocationPositions || []).map((pos, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-gray-800 border border-gray-200 rounded-lg p-2 flex gap-3 items-center"
                  >
                    {/* Pcs Number */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                      #{pos.pcsNo}
                    </div>

                    {/* Status Selector */}
                    <div className="flex-1">
                      <div className="flex gap-1">
                        {currentForm.availableStatuses.map((status) => (
                          <button
                            key={status}
                            onClick={() =>
                              updateNoLocationPiece(
                                currentDefect._id,
                                idx,
                                "status",
                                status,
                              )
                            }
                            className={`flex-1 py-1 text-[10px] font-bold rounded border ${getStatusColorClasses(
                              status,
                              pos.status === status,
                            )}`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Image Upload for this piece */}
                    <div className="flex-shrink-0">
                      {pos.requiredImage ? (
                        <div className="relative w-10 h-10 rounded overflow-hidden border border-green-300 group">
                          <img
                            src={
                              pos.requiredImage.editedImgSrc ||
                              pos.requiredImage.imgSrc
                            }
                            className="w-full h-full object-cover"
                          />
                          <button
                            onClick={() =>
                              updateNoLocationPiece(
                                currentDefect._id,
                                idx,
                                "requiredImage",
                                null,
                              )
                            }
                            className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex gap-1">
                          {/* Camera Button - Passes mode: 'camera' */}
                          <button
                            onClick={() => {
                              setImageEditorContext({
                                defectId: currentDefect._id,
                                index: idx,
                                type: "noLoc",
                                mode: "camera", // <--- SPECIFY CAMERA MODE
                              });
                              setShowImageEditor(true);
                            }}
                            className="w-10 h-10 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-400 hover:text-indigo-500 hover:border-indigo-400 bg-white"
                            title="Camera"
                          >
                            <Camera className="w-4 h-4" />
                          </button>

                          {/* Upload Button - Passes mode: 'upload' */}
                          <button
                            onClick={() => {
                              setImageEditorContext({
                                defectId: currentDefect._id,
                                index: idx,
                                type: "noLoc",
                                mode: "upload", // <--- SPECIFY UPLOAD MODE
                              });
                              setShowImageEditor(true);
                            }}
                            className="w-10 h-10 border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center text-gray-400 hover:text-indigo-500 hover:border-indigo-400 bg-white"
                            title="Upload"
                          >
                            <Upload className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* QC Selection */}
              {availableQCs.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase mb-2">
                    QC / Inspector
                  </h4>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {availableQCs.map((qc) => {
                      const isSelected =
                        currentForm.selectedQC?.emp_id === qc.emp_id;
                      return (
                        <div
                          key={qc.emp_id}
                          onClick={() =>
                            updateDefectForm(currentDefect._id, {
                              selectedQC: qc,
                            })
                          }
                          className={`relative flex flex-col items-center p-2 rounded-lg border-2 cursor-pointer transition-all min-w-[60px] ${
                            isSelected
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-gray-200 bg-white hover:border-gray-300"
                          }`}
                        >
                          <span
                            className={`text-[8px] font-bold ${
                              isSelected ? "text-indigo-600" : "text-gray-400"
                            }`}
                          >
                            {qc.emp_id}
                          </span>
                          {qc.face_photo ? (
                            <img
                              src={qc.face_photo}
                              alt="qc"
                              className="w-8 h-8 rounded-full object-cover border-2 border-white shadow"
                            />
                          ) : (
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                isSelected
                                  ? "bg-indigo-200 text-indigo-700"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              <User className="w-4 h-4" />
                            </div>
                          )}
                          <span
                            className={`text-[8px] font-medium truncate w-full text-center mt-1 ${
                              isSelected ? "text-indigo-800" : "text-gray-600"
                            }`}
                          >
                            {qc.eng_name?.split(" ")[0]}
                          </span>
                          {isSelected && (
                            <div className="absolute -top-1 -right-1 bg-indigo-600 text-white rounded-full p-0.5">
                              <Check className="w-2.5 h-2.5" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Additional Remark */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Additional Remark
                  </h4>
                  <span
                    className={`text-[9px] ${
                      (currentForm.additionalRemark?.length || 0) >= 250
                        ? "text-red-500"
                        : "text-gray-400"
                    }`}
                  >
                    {currentForm.additionalRemark?.length || 0}/250
                  </span>
                </div>
                <textarea
                  value={currentForm.additionalRemark || ""}
                  onChange={(e) =>
                    updateDefectForm(currentDefect._id, {
                      additionalRemark: e.target.value.slice(0, 250),
                    })
                  }
                  placeholder="Add remark..."
                  maxLength={250}
                  rows={2}
                  className="w-full px-3 py-2 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* Location Mode Content */}
          {!currentForm.isNoLocation && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> Locations & Pieces
                </h4>
                <span className="text-[10px] text-gray-500">
                  {currentForm.locations.length} location
                  {currentForm.locations.length !== 1 ? "s" : ""} selected
                </span>
              </div>

              <YPivotQATemplatesDefectLocationSelection
                key={currentDefect._id}
                forcedProductTypeId={activeProductTypeId}
                forcedStyle={selectedOrders?.[0]}
                initialSelections={currentForm.locations}
                onSelectionChange={(locs) =>
                  handleLocationSelectionChange(currentDefect._id, locs)
                }
                availableStatuses={currentForm.availableStatuses}
                defaultStatus={currentForm.defaultStatus}
                availableQCs={availableQCs}
                defaultQC={defaultQC}
              />
            </div>
          )}

          {/* Validation Messages */}
          {!isCurrentFormValid && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="text-xs text-amber-700 dark:text-amber-400">
                  {currentForm.isNoLocation ? (
                    <p>Please set quantity greater than 0</p>
                  ) : currentForm.locations.length === 0 ? (
                    <p>Please select at least one location</p>
                  ) : (
                    <div>
                      <p className="font-medium mb-1">
                        Required images missing:
                      </p>
                      {currentForm.locations.map((loc) => {
                        const missingPcs = (loc.positions || []).filter(
                          (pos) => !pos.requiredImage,
                        );
                        if (missingPcs.length === 0) return null;
                        return (
                          <p key={loc.uniqueId} className="text-[10px]">
                            • {loc.locationName}: Pcs{" "}
                            {missingPcs.map((p) => p.pcsNo).join(", ")}
                          </p>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-3 border-t border-gray-200 bg-white dark:bg-gray-800 safe-area-bottom">
          <button
            onClick={handleSaveDefects}
            disabled={!allDefectsValid}
            className={`w-full py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all ${
              allDefectsValid
                ? "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98]"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            <Save className="w-5 h-5" />
            {editingDefectId
              ? "Update Defect"
              : `Add Defects (${selectedDefectsForModal.length})`}
          </button>

          {!allDefectsValid && (
            <p className="text-center text-[10px] text-gray-400 mt-2">
              Complete all {selectedDefectsForModal.length} defect
              configurations to continue ({validDefectsCount}/
              {selectedDefectsForModal.length} ready)
            </p>
          )}
        </div>
      </div>,
      document.body,
    );
  };

  // ================= MAIN RETURN =================

  return (
    <div className="space-y-3 animate-fadeIn">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-3 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
            <Bug className="w-4 h-4 text-indigo-500" /> Defect Entry
          </h3>
          <p className="text-[10px] text-gray-500 mt-0.5">
            Record defects for inspection.
            {determinedBuyer && determinedBuyer !== "Unknown" && (
              <span className="ml-1 text-indigo-500 font-medium">
                Buyer: {determinedBuyer}
              </span>
            )}
          </p>
        </div>
        <div className="flex bg-gray-100 dark:bg-gray-700 p-0.5 rounded-lg">
          <button
            onClick={() => setActiveTab("manual")}
            className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${
              activeTab === "manual"
                ? "bg-white dark:bg-gray-600 shadow text-indigo-600"
                : "text-gray-500"
            }`}
          >
            <FilePenLine className="w-3 h-3" />
            Manual
          </button>
          <button
            onClick={() => setActiveTab("list")}
            className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all ${
              activeTab === "list"
                ? "bg-white dark:bg-gray-600 shadow text-indigo-600"
                : "text-gray-500"
            }`}
          >
            Select
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${
              activeTab === "results"
                ? "bg-white dark:bg-gray-600 shadow text-indigo-600"
                : "text-gray-500"
            }`}
          >
            Results
            {savedDefects.length > 0 && (
              <span className="bg-indigo-500 text-white text-[8px] px-1 rounded-full">
                {savedDefects.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("summary")}
            className={`px-2.5 py-1.5 rounded-md text-[10px] font-bold transition-all flex items-center gap-1 ${
              activeTab === "summary"
                ? "bg-white dark:bg-gray-600 shadow text-indigo-600"
                : "text-gray-500"
            }`}
          >
            <BarChart3 className="w-3 h-3" />
            Summary
          </button>
        </div>
      </div>

      {renderActiveBanner()}

      {activeTab === "manual" && (
        <YPivotQAInspectionManualDefect
          data={currentManualData}
          onUpdate={handleManualDataUpdate}
        />
      )}
      {activeTab === "list" && renderListTab()}
      {activeTab === "results" && renderResultsTab()}
      {activeTab === "summary" && (
        <YPivotQAInspectionDefectSummary
          savedDefects={savedDefects}
          activeGroup={activeGroup}
          reportData={reportData}
          selectedOrders={selectedOrders}
        />
      )}

      {renderConfigModal()}

      {showImageEditor && (
        <YPivotQATemplatesImageEditor
          autoStartMode={imageEditorContext?.mode || "camera"}
          existingData={null}
          maxImages={1}
          onSave={handleImageEditorSave}
          onCancel={handleImageEditorCancel}
        />
      )}

      {deleteConfirm.isOpen &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden border border-gray-100 dark:border-gray-700 transform scale-100 transition-all">
              <div className="p-5 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-8 h-8 text-red-600 dark:text-red-500" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Confirm Deletion
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {deleteConfirm.message}
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() =>
                      setDeleteConfirm({ ...deleteConfirm, isOpen: false })
                    }
                    className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDeleteAction}
                    className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" /> Delete
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
        .scrollbar-thin::-webkit-scrollbar {
          height: 4px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 2px;
        }
        .safe-area-top {
          padding-top: env(safe-area-inset-top);
        }
        .safe-area-bottom {
          padding-bottom: env(safe-area-inset-bottom);
        }
      `}</style>
    </div>
  );
};

export default YPivotQAInspectionDefectConfig;
