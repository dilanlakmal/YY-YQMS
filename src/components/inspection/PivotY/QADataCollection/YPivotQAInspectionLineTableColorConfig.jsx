import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Scan,
  CheckCircle2,
  Play,
  X,
  Calculator,
  Loader2,
  Hash,
  PauseCircle,
  CopyPlus,
  Edit,
  Save,
  ChevronDown,
} from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";
import { useTranslation } from "react-i18next";
import EmpQRCodeScanner from "../../qc_roving/EmpQRCodeScanner";

// ============================================================
// Helper: Simple Native Dropdown Component
// ============================================================
const SimpleSelect = ({
  label,
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const selectedLabel = options.find((o) => o.value === value)?.label || "";

  return (
    <div className="w-full">
      {label && (
        <label className="block text-[10px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
          {label}
        </label>
      )}
      {disabled ? (
        <div className="px-2 sm:px-3 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg text-xs sm:text-sm border border-gray-200 dark:border-gray-700 font-medium text-gray-700 dark:text-gray-300 min-h-[36px] sm:min-h-[40px] flex items-center">
          {selectedLabel || "N/A"}
        </div>
      ) : (
        <div className="relative">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            className="w-full px-2 sm:px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200 appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none min-h-[36px] sm:min-h-[40px] pr-8"
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      )}
    </div>
  );
};

// ============================================================
// Helper: QC User Inline Select (For SubCon)
// ============================================================
const QCInlineSelect = ({ options, onSelect, disabled }) => {
  const { t } = useTranslation();
  return (
    <div className="relative w-full">
      <select
        value=""
        onChange={(e) => {
          const selected = options.find((q) => q.value === e.target.value);
          if (selected) onSelect(selected.originalData);
        }}
        disabled={disabled}
        className="w-full px-2 sm:px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-xs sm:text-sm font-medium appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none min-h-[36px] sm:min-h-[40px] pr-8"
      >
        <option value="">
          {t("fincheckInspectionLineTableColorConfig.common.selectQC")}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
};

// ============================================================
// Helper: Simple QC Search Input
// ============================================================
const SimpleQCSearch = ({ onSelect, disabled }) => {
  const { t } = useTranslation();
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const delay = setTimeout(async () => {
      if (term.length >= 2) {
        setLoading(true);
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/users/search?term=${term}`,
          );
          setResults(res.data);
          setShowResults(true);
        } catch (err) {
          console.error(err);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setShowResults(false);
      }
    }, 400);
    return () => clearTimeout(delay);
  }, [term]);

  const handleSelect = (user) => {
    onSelect(user);
    setTerm("");
    setResults([]);
    setShowResults(false);
  };

  if (disabled) {
    return (
      <div className="px-2 py-2 bg-gray-100 dark:bg-gray-700 text-gray-400 text-xs rounded-lg border min-h-[36px] flex items-center">
        {t("fincheckInspectionLineTableColorConfig.common.searchDisabled")}
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div className="flex items-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500">
        <input
          type="text"
          className="w-full px-2 py-2 text-xs sm:text-sm outline-none bg-transparent dark:text-white min-h-[36px] sm:min-h-[40px]"
          placeholder={t(
            "fincheckInspectionLineTableColorConfig.common.typeIdOrName",
          )}
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          onFocus={() => results.length > 0 && setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 200)}
        />
        {loading && (
          <Loader2 className="w-4 h-4 animate-spin text-indigo-500 mr-2" />
        )}
      </div>

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 max-h-40 overflow-y-auto">
          {results.map((user) => (
            <div
              key={user.emp_id}
              className="px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 cursor-pointer border-b last:border-0 dark:border-gray-700"
              onMouseDown={() => handleSelect(user)}
            >
              <p className="text-xs font-bold text-gray-800 dark:text-white">
                {user.eng_name}
              </p>
              <p className="text-[10px] text-gray-500">{user.emp_id}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// Main Component: Line / Table / Color Configuration
// ============================================================
const YPivotQAInspectionLineTableColorConfig = ({
  reportData,
  orderData,
  onUpdate,
  onSetActiveGroup,
  activeGroup,
  onSaveWithData,
  onClearAll,
  lockTrigger,
}) => {
  const { t } = useTranslation();
  const { selectedTemplate, config } = reportData;
  const isAQL = selectedTemplate?.InspectedQtyMethod === "AQL";
  const aqlSampleSize = config?.aqlSampleSize || 0;

  const [groups, setGroups] = useState(reportData.lineTableConfig || []);
  const [lines, setLines] = useState([]);
  const [tables, setTables] = useState([]);
  const [orderColors, setOrderColors] = useState([]);
  const [subConQCs, setSubConQCs] = useState([]);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [activeGroupIndex, setActiveGroupIndex] = useState(null);

  // FIXED: Only sync from parent on initial load, not on every update
  const isInitialMount = useRef(true);

  // Lock all cards when save is triggered from parent
  useEffect(() => {
    if (lockTrigger > 0) {
      setEditingGroupId(null);
    }
  }, [lockTrigger]);

  useEffect(() => {
    if (reportData.lineTableConfig) {
      setGroups(reportData.lineTableConfig);

      // Only reset editingGroupId on initial load (from backend)
      // NOT when we're updating locally (adding new groups, etc.)
      if (isInitialMount.current) {
        setEditingGroupId(null);
        isInitialMount.current = false;
      }
    }
  }, [reportData.lineTableConfig]);

  // Load resources
  useEffect(() => {
    const fetchResources = async () => {
      try {
        const promises = [];

        if (config?.isSubCon) {
          promises.push(
            axios.get(`${API_BASE_URL}/api/subcon-sewing-factories-manage`),
          );
        } else if (selectedTemplate?.Line === "Yes") {
          promises.push(axios.get(`${API_BASE_URL}/api/qa-sections-lines`));
        } else {
          promises.push(Promise.resolve(null));
        }

        if (selectedTemplate?.Table === "Yes") {
          promises.push(axios.get(`${API_BASE_URL}/api/qa-sections-tables`));
        } else {
          promises.push(Promise.resolve(null));
        }

        if (
          selectedTemplate?.Colors === "Yes" &&
          orderData?.selectedOrders?.length
        ) {
          promises.push(
            axios.post(`${API_BASE_URL}/api/fincheck-inspection/order-colors`, {
              orderNos: orderData.selectedOrders,
            }),
          );
        } else {
          promises.push(Promise.resolve(null));
        }

        const [linesRes, tablesRes, colorsRes] = await Promise.all(promises);

        if (linesRes) {
          if (config?.isSubCon) {
            const allFactories = Array.isArray(linesRes.data)
              ? linesRes.data
              : linesRes.data.data || [];
            const factory = allFactories.find(
              (f) => f._id === config.selectedSubConFactory,
            );
            if (factory) {
              setLines(
                (factory.lineList || []).map((l) => ({ value: l, label: l })),
              );
              setSubConQCs(
                (factory.qcList || []).map((qc) => ({
                  value: qc.qcID,
                  label: `${qc.qcID} - ${qc.qcName}`,
                  originalData: { emp_id: qc.qcID, eng_name: qc.qcName },
                })),
              );
            }
          } else {
            const data = linesRes.data.data || linesRes.data;
            if (Array.isArray(data)) {
              setLines(
                data
                  .filter((l) => l.Active)
                  .map((l) => ({ value: l._id, label: l.LineNo })),
              );
            }
          }
        }

        if (tablesRes) {
          setTables(
            tablesRes.data.data
              .filter((t) => t.Active)
              .map((t) => ({ value: t._id, label: t.TableNo })),
          );
        }

        if (colorsRes) {
          setOrderColors(
            colorsRes.data.data.map((c) => ({
              value: c.color,
              label: c.color,
            })),
          );
        }
      } catch (err) {
        console.error("Error fetching resources", err);
      }
    };

    if (selectedTemplate) fetchResources();
  }, [selectedTemplate, config, orderData]);

  // AQL Sync
  useEffect(() => {
    if (isAQL && groups.length > 0 && groups[0].assignments[0]) {
      if (groups[0].assignments[0].qty !== aqlSampleSize.toString()) {
        const updated = [...groups];
        updated[0].assignments[0].qty = aqlSampleSize.toString();
        setGroups(updated);
        onUpdate({ lineTableConfig: updated });
      }
    }
  }, [isAQL, aqlSampleSize, groups, onUpdate]);

  // Calculate total
  const totalDisplayQty = useMemo(() => {
    if (isAQL) return aqlSampleSize;
    return groups.reduce((total, group) => {
      return (
        total +
        group.assignments.reduce((sum, a) => sum + (parseInt(a.qty) || 0), 0)
      );
    }, 0);
  }, [groups, isAQL, aqlSampleSize]);

  // Handlers
  const handleAddGroup = () => {
    let defaultQty = "";
    if (!isAQL && selectedTemplate.InspectedQty) {
      defaultQty = selectedTemplate.InspectedQty.toString();
    }

    const newGroup = {
      id: Date.now(),
      line: "",
      lineName: "",
      table: "",
      tableName: config?.isSubCon ? "N/A" : "",
      color: "",
      colorName: "",
      assignments: [{ id: Date.now() + 1, qcUser: null, qty: defaultQty }],
    };
    const updated = [...groups, newGroup];
    setGroups(updated);
    setEditingGroupId(newGroup.id);
    onUpdate({ lineTableConfig: updated });
  };

  const handleAddAllColors = () => {
    if (orderColors.length === 0) {
      Swal.fire(
        t("fincheckInspectionLineTableColorConfig.swal.noColorsTitle"),
        t("fincheckInspectionLineTableColorConfig.swal.noColorsText"),
        "warning",
      );
      return;
    }

    let defaultQty = "";
    if (!isAQL && selectedTemplate.InspectedQty) {
      defaultQty = selectedTemplate.InspectedQty.toString();
    }

    const existing = new Set(groups.map((g) => g.color));
    const toAdd = orderColors.filter((c) => !existing.has(c.value));

    if (toAdd.length === 0) {
      Swal.fire(
        t("fincheckInspectionLineTableColorConfig.swal.allColorsAddedTitle"),
        t("fincheckInspectionLineTableColorConfig.swal.allColorsAddedText"),
        "info",
      );
      return;
    }

    const newGroups = toAdd.map((c, i) => ({
      id: Date.now() + i,
      line: "",
      lineName: "",
      table: "",
      tableName: config?.isSubCon ? "N/A" : "",
      color: c.value,
      colorName: c.label,
      assignments: [
        { id: Date.now() + i + 1000, qcUser: null, qty: defaultQty },
      ],
    }));

    const updated = [...groups, ...newGroups];
    setGroups(updated);
    onUpdate({ lineTableConfig: updated });
    // Trigger Auto-Save immediately
    if (onSaveWithData) {
      onSaveWithData(updated);
    }
    Swal.fire(
      t("fincheckInspectionLineTableColorConfig.swal.colorsAddedTitle"),
      `${newGroups.length} color groups added.`,
      "success",
    );
  };

  const handleRemoveGroup = async (index) => {
    const result = await Swal.fire({
      title: t("fincheckInspectionLineTableColorConfig.swal.removeGroupTitle"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: t(
        "fincheckInspectionLineTableColorConfig.swal.removeGroupConfirm",
      ),
    });

    if (result.isConfirmed) {
      const updated = [...groups];
      if (activeGroup?.id === updated[index].id) onSetActiveGroup(null);
      if (editingGroupId === updated[index].id) setEditingGroupId(null);
      updated.splice(index, 1);
      setGroups(updated);
      onUpdate({ lineTableConfig: updated });
      if (onSaveWithData) onSaveWithData(updated);
    }
  };

  const checkDuplicate = (vals, idx) => {
    return groups.some((g, i) => {
      if (i === idx) return false;
      let match = true;
      if (selectedTemplate.Line === "Yes" && g.line !== vals.line)
        match = false;
      if (selectedTemplate.Table === "Yes" && g.table !== vals.table)
        match = false;
      if (selectedTemplate.Colors === "Yes" && g.color !== vals.color)
        match = false;
      return match;
    });
  };

  const handleUpdateGroup = (idx, field, value, opts = []) => {
    const updated = [...groups];
    const test = { ...updated[idx], [field]: value };

    if (checkDuplicate(test, idx)) {
      Swal.fire(
        t("fincheckInspectionLineTableColorConfig.swal.duplicateTitle"),
        t("fincheckInspectionLineTableColorConfig.swal.duplicateText"),
        "warning",
      );
      return;
    }

    updated[idx][field] = value;
    const nameField = `${field}Name`;
    const opt = opts.find((o) => o.value === value);
    updated[idx][nameField] = opt ? opt.label : value;

    setGroups(updated);
    onUpdate({ lineTableConfig: updated });

    // --- AUTO-SAVE TRIGGER ---
    // Check if this specific group is now complete
    const currentGroup = updated[idx];
    const isComplete =
      (!showLine || currentGroup.line) &&
      (!showTable || config?.isSubCon || currentGroup.table) &&
      (!showColors || currentGroup.color) &&
      (!showQC || currentGroup.assignments.every((a) => a.qcUser));

    // If complete, trigger immediate save via parent callback
    if (isComplete && onSaveWithData) {
      // Small delay to ensure state is settled or to debounce slightly if needed
      // But direct call is usually fine for dropdowns
      onSaveWithData(updated);
    }

    if (activeGroup?.id === updated[idx].id) {
      onSetActiveGroup({
        ...updated[idx],
        lineName: updated[idx].lineName || updated[idx].line,
        tableName: updated[idx].tableName || updated[idx].table,
        colorName: updated[idx].colorName || updated[idx].color,
        activeAssignmentId: activeGroup.activeAssignmentId,
        activeQC: activeGroup.activeQC,
      });
    }
  };

  const handleAddAssignment = (gIdx, qcUser = null) => {
    if (qcUser) {
      const exists = groups[gIdx].assignments.some(
        (a) => a.qcUser?.emp_id === qcUser.emp_id,
      );
      if (exists) {
        Swal.fire(
          t("fincheckInspectionLineTableColorConfig.swal.duplicateTitle"),
          t("fincheckInspectionLineTableColorConfig.swal.qcDuplicateText"),
          "error",
        );
        return;
      }
    }

    let defaultQty = "";
    if (!isAQL && selectedTemplate.InspectedQty) {
      defaultQty = selectedTemplate.InspectedQty.toString();
    }

    const updated = [...groups];
    updated[gIdx].assignments.push({ id: Date.now(), qcUser, qty: defaultQty });
    setGroups(updated);
    onUpdate({ lineTableConfig: updated });
    // --- Trigger Auto Save if group is complete ---
    if (onSaveWithData) onSaveWithData(updated);
  };

  const handleRemoveAssignment = (gIdx, aIdx) => {
    const updated = [...groups];
    updated[gIdx].assignments.splice(aIdx, 1);
    setGroups(updated);
    onUpdate({ lineTableConfig: updated });
    // --- Trigger Auto Save ---
    if (onSaveWithData) onSaveWithData(updated);
  };

  const handleUpdateAssignment = (gIdx, aIdx, field, value) => {
    const updated = [...groups];
    if (field === "qcUser" && value) {
      const exists = groups[gIdx].assignments.some(
        (a, i) => i !== aIdx && a.qcUser?.emp_id === value.emp_id,
      );
      if (exists) {
        Swal.fire(
          t("fincheckInspectionLineTableColorConfig.swal.duplicateTitle"),
          t("fincheckInspectionLineTableColorConfig.swal.qcDuplicateText"),
          "error",
        );
        return;
      }
    }
    updated[gIdx].assignments[aIdx][field] = value;
    setGroups(updated);
    onUpdate({ lineTableConfig: updated });
    // --- Trigger Auto Save ---
    if (onSaveWithData) onSaveWithData(updated);
  };

  const handleQCSelect = (user, gIdx) => {
    const group = groups[gIdx];
    const exists = group.assignments.some(
      (a) => a.qcUser?.emp_id === user.emp_id,
    );
    if (exists) {
      Swal.fire(
        t("fincheckInspectionLineTableColorConfig.swal.duplicateTitle"),
        t("fincheckInspectionLineTableColorConfig.swal.qcAlreadyInList"),
        "error",
      );
      return;
    }

    const empty = group.assignments.findIndex((a) => !a.qcUser);
    if (empty !== -1) {
      handleUpdateAssignment(gIdx, empty, "qcUser", user);
    } else {
      handleAddAssignment(gIdx, user);
    }
  };

  const handleScanSuccess = (userData) => {
    if (activeGroupIndex !== null) {
      if (config?.isSubCon) {
        const id = userData.emp_id || userData;
        const found = subConQCs.find((q) => q.value === id);
        if (found) handleQCSelect(found.originalData, activeGroupIndex);
        else
          Swal.fire(
            t("fincheckInspectionLineTableColorConfig.swal.errorTitle"),
            t("fincheckInspectionLineTableColorConfig.swal.qcNotInFactory"),
            "error",
          );
      } else {
        handleQCSelect(userData, activeGroupIndex);
      }
    }
    setIsScannerOpen(false);
    setActiveGroupIndex(null);
  };

  const handleActivateGroup = (group, assignment = null) => {
    if (selectedTemplate.Line === "Yes" && !group.line) {
      return Swal.fire(
        t("fincheckInspectionLineTableColorConfig.swal.missingTitle"),
        t("fincheckInspectionLineTableColorConfig.swal.missingLine"),
        "warning",
      );
    }
    if (selectedTemplate.Table === "Yes" && !config?.isSubCon && !group.table) {
      return Swal.fire(
        t("fincheckInspectionLineTableColorConfig.swal.missingTitle"),
        t("fincheckInspectionLineTableColorConfig.swal.missingTable"),
        "warning",
      );
    }
    if (selectedTemplate.Colors === "Yes" && !group.color) {
      return Swal.fire(
        t("fincheckInspectionLineTableColorConfig.swal.missingTitle"),
        t("fincheckInspectionLineTableColorConfig.swal.missingColor"),
        "warning",
      );
    }

    // Lock the card when activated
    setEditingGroupId(null);

    const ctx = {
      ...group,
      lineName: lines.find((l) => l.value === group.line)?.label || group.line,
      tableName: config?.isSubCon
        ? "N/A"
        : tables.find((t) => t.value === group.table)?.label || group.table,
      colorName:
        orderColors.find((c) => c.value === group.color)?.label || group.color,
      activeAssignmentId: assignment?.id,
      activeQC: assignment?.qcUser,
    };

    onSetActiveGroup(ctx);
    Swal.fire({
      icon: "success",
      title: t(
        "fincheckInspectionLineTableColorConfig.swal.sessionActiveTitle",
      ),
      timer: 1200,
      showConfirmButton: false,
    });
  };

  const handleToggleEdit = (targetId) => {
    if (editingGroupId !== null && editingGroupId === targetId) {
      const current = groups.find((g) => g.id === editingGroupId);
      if (current) {
        const missing = [];
        if (showLine && !current.line) missing.push("Line");
        if (showTable && !config?.isSubCon && !current.table)
          missing.push("Table");
        if (showColors && !current.color) missing.push("Color");
        if (showQC && current.assignments.some((a) => !a.qcUser))
          missing.push("QC");

        if (missing.length > 0) {
          Swal.fire(
            t("fincheckInspectionLineTableColorConfig.swal.incompleteTitle"),
            `Fill: ${missing.join(", ")}`,
            "warning",
          );
          return;
        }
      }
      // If validation passes and we are closing edit mode:
      if (onSaveWithData) {
        onSaveWithData(groups); // Trigger backend save
      }
    }

    setEditingGroupId(editingGroupId === targetId ? null : targetId);
  };

  // ✅ Handle Remove All Button Click
  const handleRemoveAllGroups = async () => {
    if (groups.length === 0) {
      Swal.fire(
        t("fincheckInspectionLineTableColorConfig.swal.emptyTitle"),
        t("fincheckInspectionLineTableColorConfig.swal.emptyText"),
        "info",
      );
      return;
    }

    const result = await Swal.fire({
      title: t("fincheckInspectionLineTableColorConfig.swal.removeAllTitle"),
      text: t("fincheckInspectionLineTableColorConfig.swal.removeAllText"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: t(
        "fincheckInspectionLineTableColorConfig.swal.removeAllConfirm",
      ),
    });

    if (result.isConfirmed) {
      // 1. Clear Local State
      setGroups([]);
      setEditingGroupId(null);

      // 2. Clear Parent State (Visual)
      onUpdate({ lineTableConfig: [] });

      // 3. Trigger Backend Clear (If prop exists)
      if (onClearAll) {
        onClearAll();
      }
    }
  };

  if (!selectedTemplate) return null;

  const showLine = selectedTemplate.Line === "Yes";
  const showTable = selectedTemplate.Table === "Yes";
  const showColors = selectedTemplate.Colors === "Yes";
  const showQC = selectedTemplate.isQCScan === "Yes";
  const canAddAllColors =
    showColors && !showLine && !showTable && orderColors.length > 0;

  const isCurrentComplete = useMemo(() => {
    if (editingGroupId === null) return true;
    const g = groups.find((g) => g.id === editingGroupId);
    if (!g) return true;
    if (showLine && !g.line) return false;
    if (showTable && !config?.isSubCon && !g.table) return false;
    if (showColors && !g.color) return false;
    if (showQC && g.assignments.some((a) => !a.qcUser)) return false;
    return true;
  }, [groups, editingGroupId, showLine, showTable, showColors, showQC, config]);

  return (
    <div className="space-y-3 sm:space-y-4 pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-0 z-30">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-3 sm:px-4 py-2.5 sm:py-3 flex justify-between items-center">
          <div className="min-w-0">
            <h2 className="text-white font-bold text-sm sm:text-base flex items-center gap-1.5 truncate">
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{selectedTemplate.ReportType}</span>
            </h2>
            <p className="text-indigo-200 text-[10px] sm:text-xs">
              {isAQL
                ? t("fincheckInspectionLineTableColorConfig.header.aqlStandard")
                : t(
                    "fincheckInspectionLineTableColorConfig.header.fixedQuantity",
                  )}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-indigo-200 text-[9px] sm:text-[10px] font-bold uppercase">
              {isAQL
                ? t("fincheckInspectionLineTableColorConfig.header.sample")
                : t("fincheckInspectionLineTableColorConfig.header.totalQty")}
            </p>
            <div className="flex items-center gap-1.5 justify-end">
              <span className="text-xl sm:text-2xl font-black text-white">
                {totalDisplayQty}
              </span>
              {isAQL ? (
                <span className="bg-orange-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                  <Hash className="w-2.5 h-2.5" />
                  AQL
                </span>
              ) : (
                <span className="bg-purple-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                  <Calculator className="w-2.5 h-2.5" />
                  Auto
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Active Session Banner */}
      {activeGroup && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-2.5 sm:p-3 rounded-xl flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-green-100 dark:bg-green-800 rounded-full flex-shrink-0">
              <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 dark:text-green-300 fill-current" />
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-green-800 dark:text-green-300 truncate">
                {t(
                  "fincheckInspectionLineTableColorConfig.session.activeSession",
                )}
              </p>
              <p className="text-[10px] sm:text-xs text-green-700 dark:text-green-400 truncate">
                {[
                  activeGroup.lineName,
                  activeGroup.tableName,
                  activeGroup.colorName,
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
            </div>
          </div>
          <button
            onClick={() => onSetActiveGroup(null)}
            className="px-2 py-1 bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-400 text-[10px] sm:text-xs font-bold rounded-lg flex-shrink-0"
          >
            {t("fincheckInspectionLineTableColorConfig.session.end")}
          </button>
        </div>
      )}

      {/* Groups */}
      <div className="space-y-3">
        {groups.map((group, gIdx) => {
          const isActive = activeGroup?.id === group.id;
          const isEditing = editingGroupId === group.id;
          const isLocked = !isEditing;

          return (
            <div
              key={group.id}
              className={`bg-white dark:bg-gray-800 rounded-xl shadow border transition-all ${
                isActive
                  ? "border-green-500 ring-2 ring-green-100 dark:ring-green-900/30"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              {/* Card Header */}
              <div className="p-2.5 sm:p-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                {/* Dropdowns */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-2">
                  {showLine && (
                    <SimpleSelect
                      label={
                        config?.isSubCon
                          ? t(
                              "fincheckInspectionLineTableColorConfig.fields.subConLine",
                            )
                          : t(
                              "fincheckInspectionLineTableColorConfig.fields.line",
                            )
                      }
                      options={lines}
                      value={group.line}
                      onChange={(v) =>
                        handleUpdateGroup(gIdx, "line", v, lines)
                      }
                      placeholder={t(
                        "fincheckInspectionLineTableColorConfig.fields.selectPlaceholder",
                      )}
                      disabled={isLocked}
                    />
                  )}

                  {showTable &&
                    (config?.isSubCon ? (
                      <div>
                        <label className="block text-[10px] sm:text-xs font-bold text-gray-500 mb-1">
                          {t(
                            "fincheckInspectionLineTableColorConfig.fields.table",
                          )}
                        </label>
                        <div className="px-2 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs text-gray-500 font-bold text-center min-h-[36px] flex items-center justify-center">
                          {t(
                            "fincheckInspectionLineTableColorConfig.common.notAvailable",
                          )}
                        </div>
                      </div>
                    ) : (
                      <SimpleSelect
                        label={t(
                          "fincheckInspectionLineTableColorConfig.fields.table",
                        )}
                        options={tables}
                        value={group.table}
                        onChange={(v) =>
                          handleUpdateGroup(gIdx, "table", v, tables)
                        }
                        placeholder={t(
                          "fincheckInspectionLineTableColorConfig.fields.selectPlaceholder",
                        )}
                        disabled={isLocked}
                      />
                    ))}

                  {showColors && (
                    <SimpleSelect
                      label={t(
                        "fincheckInspectionLineTableColorConfig.fields.color",
                      )}
                      options={orderColors}
                      value={group.color}
                      onChange={(v) =>
                        handleUpdateGroup(gIdx, "color", v, orderColors)
                      }
                      placeholder={t(
                        "fincheckInspectionLineTableColorConfig.fields.selectPlaceholder",
                      )}
                      disabled={isLocked}
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex gap-1.5">
                    {isActive && (
                      <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" />
                        {t(
                          "fincheckInspectionLineTableColorConfig.status.active",
                        )}
                      </span>
                    )}
                    {isLocked && !isActive && (
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] font-medium rounded">
                        {t(
                          "fincheckInspectionLineTableColorConfig.status.locked",
                        )}
                      </span>
                    )}
                    {isEditing && (
                      <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-600 text-[10px] font-bold rounded">
                        {t(
                          "fincheckInspectionLineTableColorConfig.status.editing",
                        )}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleToggleEdit(group.id)}
                      className={`p-1.5 rounded-lg border ${
                        isEditing
                          ? "bg-indigo-50 border-indigo-200 text-indigo-600"
                          : "bg-white border-gray-200 text-gray-500 hover:text-indigo-600"
                      }`}
                    >
                      {isEditing ? (
                        <Save className="w-3.5 h-3.5" />
                      ) : (
                        <Edit className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      onClick={() => handleRemoveGroup(gIdx)}
                      disabled={isLocked}
                      className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg disabled:opacity-30"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Assignments */}
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {group.assignments.map((assign, aIdx) => (
                  <div key={assign.id} className="p-2.5 sm:p-3">
                    <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
                      {/* QC Section */}
                      {showQC && (
                        <div className="flex-1 min-w-0">
                          {assign.qcUser ? (
                            <div className="flex items-center justify-between gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold text-xs flex-shrink-0">
                                  {assign.qcUser.eng_name?.charAt(0) || "U"}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-bold text-gray-800 dark:text-white truncate">
                                    {assign.qcUser.eng_name}
                                  </p>
                                  <p className="text-[10px] text-gray-500">
                                    {assign.qcUser.emp_id}
                                  </p>
                                </div>
                              </div>
                              {!isLocked && (
                                <button
                                  onClick={() =>
                                    handleUpdateAssignment(
                                      gIdx,
                                      aIdx,
                                      "qcUser",
                                      null,
                                    )
                                  }
                                  className="p-1 text-gray-400 hover:text-red-500"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ) : (
                            <div
                              className={`flex gap-2 items-center ${
                                isLocked ? "opacity-50 pointer-events-none" : ""
                              }`}
                            >
                              <button
                                onClick={() => {
                                  setActiveGroupIndex(gIdx);
                                  setIsScannerOpen(true);
                                }}
                                className="px-2 py-2 bg-indigo-50 text-indigo-600 rounded-lg flex items-center gap-1 flex-shrink-0"
                              >
                                <Scan className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-bold hidden sm:inline">
                                  {t(
                                    "fincheckInspectionLineTableColorConfig.actions.scan",
                                  )}
                                </span>
                              </button>
                              <div className="flex-1">
                                {config?.isSubCon ? (
                                  subConQCs.length > 0 ? (
                                    <QCInlineSelect
                                      options={subConQCs}
                                      onSelect={(u) => handleQCSelect(u, gIdx)}
                                      disabled={isLocked}
                                    />
                                  ) : (
                                    <div className="px-2 py-2 bg-gray-100 text-gray-400 text-xs rounded-lg">
                                      {t(
                                        "fincheckInspectionLineTableColorConfig.common.noQCList",
                                      )}
                                    </div>
                                  )
                                ) : (
                                  <SimpleQCSearch
                                    onSelect={(u) => handleQCSelect(u, gIdx)}
                                    disabled={isLocked}
                                  />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Qty Input */}
                      {!isAQL && (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            inputMode="numeric"
                            value={assign.qty}
                            onChange={(e) =>
                              handleUpdateAssignment(
                                gIdx,
                                aIdx,
                                "qty",
                                e.target.value,
                              )
                            }
                            disabled={isLocked}
                            className={`w-20 sm:w-24 px-2 py-2 border rounded-lg text-xs sm:text-sm font-bold text-center focus:ring-2 focus:ring-indigo-500 outline-none ${
                              isLocked ? "bg-gray-50 text-gray-500" : "bg-white"
                            }`}
                            placeholder={t(
                              "fincheckInspectionLineTableColorConfig.fields.qtyPlaceholder",
                            )}
                          />
                          <span className="text-[10px] text-gray-400">
                            {t(
                              "fincheckInspectionLineTableColorConfig.units.pcs",
                            )}
                          </span>
                        </div>
                      )}

                      {/* Row Actions */}
                      <div className="flex items-center gap-2 justify-end sm:justify-start">
                        {group.assignments.length > 1 && !isLocked && (
                          <button
                            onClick={() => handleRemoveAssignment(gIdx, aIdx)}
                            className="p-1.5 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleActivateGroup(group, assign)}
                          disabled={(showQC && !assign.qcUser) || isActive}
                          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold shadow transition-all ${
                            isActive
                              ? "bg-gray-200 text-gray-500 cursor-default"
                              : "bg-emerald-500 hover:bg-emerald-600 text-white"
                          } disabled:opacity-50`}
                        >
                          {isActive ? (
                            <PauseCircle className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5 fill-current" />
                          )}
                          {isActive
                            ? t(
                                "fincheckInspectionLineTableColorConfig.actions.activeBtnLabel",
                              )
                            : t(
                                "fincheckInspectionLineTableColorConfig.actions.start",
                              )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Inspector */}
                {showQC && !isAQL && !isLocked && (
                  <div className="p-2 bg-gray-50 dark:bg-gray-900/30">
                    <button
                      onClick={() => handleAddAssignment(gIdx)}
                      className="w-full py-2 text-[10px] sm:text-xs font-bold text-indigo-600 border border-dashed border-indigo-300 rounded-lg flex items-center justify-center gap-1 hover:bg-indigo-50"
                    >
                      <Plus className="w-3.5 h-3.5" />{" "}
                      {t(
                        "fincheckInspectionLineTableColorConfig.actions.addInspector",
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Empty State */}
        {groups.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
            <FileText className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-gray-500 text-sm font-medium">
              {t("fincheckInspectionLineTableColorConfig.empty.title")}
            </p>
            <p className="text-gray-400 text-xs">
              {t("fincheckInspectionLineTableColorConfig.empty.description")}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={handleAddGroup}
            disabled={!isCurrentComplete}
            className={`py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              isCurrentComplete
                ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg hover:shadow-xl hover:from-indigo-600 hover:to-purple-700 active:scale-[0.98]"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Plus className="w-5 h-5" />
            {t("fincheckInspectionLineTableColorConfig.actions.addGroup")}
          </button>

          {canAddAllColors && (
            <button
              onClick={handleAddAllColors}
              className="py-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:from-amber-600 hover:to-orange-700 active:scale-[0.98] transition-all"
            >
              <CopyPlus className="w-5 h-5" />
              {t(
                "fincheckInspectionLineTableColorConfig.actions.addAllColors",
              )}{" "}
              ({orderColors.length})
            </button>
          )}

          {/* ✅ Remove All Button (Only show if groups exist) */}
          {groups.length > 0 && (
            <button
              onClick={handleRemoveAllGroups}
              className="py-3 bg-white dark:bg-gray-700 border-2 border-red-100 dark:border-red-900/30 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <Trash2 className="w-5 h-5" />
              {t("fincheckInspectionLineTableColorConfig.actions.removeAll")}
            </button>
          )}
        </div>
      </div>

      {/* Scanner */}
      {isScannerOpen && (
        <EmpQRCodeScanner
          onUserDataFetched={handleScanSuccess}
          onClose={() => {
            setIsScannerOpen(false);
            setActiveGroupIndex(null);
          }}
        />
      )}
    </div>
  );
};

export default YPivotQAInspectionLineTableColorConfig;
