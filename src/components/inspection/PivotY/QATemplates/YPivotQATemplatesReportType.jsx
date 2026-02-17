import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  Plus,
  Edit,
  Trash2,
  X,
  Save,
  CheckSquare,
  Square,
  Loader,
  FileText,
  CheckCircle,
  XCircle,
  Camera,
  Box,
  ScanLine,
  Ship,
  GripVertical,
  RefreshCw, // Added for Bulk Update icon
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../../../../config";

const YPivotQATemplatesReportType = () => {
  const { t } = useTranslation();

  // --- State ---
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [photoSections, setPhotoSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false); // State for bulk sync

  // Drag and Drop State
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const dragNode = useRef(null);

  // Form State
  const initialFormState = {
    _id: null,
    ReportType: "",
    ReportTypeChinese: "", // New Field
    Measurement: "No",
    MeasurementAdditional: "No",
    Header: "Yes",
    Photos: "Yes",
    Line: "Yes",
    Table: "Yes",
    Colors: "Yes",
    ShippingStage: "Yes",
    InspectedQtyMethod: "NA",
    isCarton: "No",
    isQCScan: "No",
    InspectedQty: 0,
    QualityPlan: "Yes",
    Conclusion: "Yes",
    DefectCategoryList: [],
    SelectedPhotoSectionList: [],
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- Fetch Data ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [tplRes, catRes, photoRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/qa-sections-templates`),
        axios.get(`${API_BASE_URL}/api/qa-sections-templates/categories`),
        axios.get(`${API_BASE_URL}/api/qa-sections-templates/photo-sections`),
      ]);
      setTemplates(tplRes.data.data);
      setCategories(catRes.data.data);
      setPhotoSections(photoRes.data.data);
    } catch (error) {
      console.error("Error loading data:", error);
      Swal.fire(
        t("fincheckTemplates.alerts.error"),
        "Failed to load data.",
        "error",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    setIsDragging(true);
    dragNode.current = e.target;
    dragNode.current.addEventListener("dragend", handleDragEnd);
    setTimeout(() => {
      if (dragNode.current) {
        dragNode.current.style.opacity = "0.5";
      }
    }, 0);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target.outerHTML);
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    if (index !== draggedItem) {
      setDragOverItem(index);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedItem(null);
    setDragOverItem(null);
    if (dragNode.current) {
      dragNode.current.style.opacity = "1";
      dragNode.current.removeEventListener("dragend", handleDragEnd);
      dragNode.current = null;
    }
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === dropIndex) {
      handleDragEnd();
      return;
    }
    const newTemplates = [...templates];
    const draggedItemContent = newTemplates[draggedItem];
    newTemplates.splice(draggedItem, 1);
    newTemplates.splice(dropIndex, 0, draggedItemContent);
    const updatedTemplates = newTemplates.map((template, index) => ({
      ...template,
      no: index + 1,
    }));
    setTemplates(updatedTemplates);
    handleDragEnd();
    await saveNewOrder(updatedTemplates);
  };

  const saveNewOrder = async (orderedTemplates) => {
    setIsReordering(true);
    try {
      const orderedIds = orderedTemplates.map((t) => t._id);
      await axios.put(`${API_BASE_URL}/api/qa-sections-templates-reorder`, {
        orderedIds,
      });
      Swal.fire({
        icon: "success",
        title: t("fincheckTemplates.alerts.reordered"),
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Reorder error:", error);
      Swal.fire(
        t("fincheckTemplates.alerts.error"),
        "Failed to save new order.",
        "error",
      );
      fetchData();
    } finally {
      setIsReordering(false);
    }
  };

  // --- Handlers ---
  const handleAddNew = () => {
    setFormData(initialFormState);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const handleEdit = (template) => {
    setFormData({
      _id: template._id,
      ReportType: template.ReportType,
      ReportTypeChinese: template.ReportTypeChinese || "", // Populate Chinese name
      Measurement: template.Measurement,
      MeasurementAdditional: template.MeasurementAdditional || "No",
      Header: template.Header,
      Photos: template.Photos,
      Line: template.Line || "Yes",
      Table: template.Table || "Yes",
      Colors: template.Colors || "Yes",
      ShippingStage: template.ShippingStage || "Yes",
      InspectedQtyMethod: template.InspectedQtyMethod || "NA",
      isCarton: template.isCarton || "No",
      isQCScan: template.isQCScan || "No",
      InspectedQty: template.InspectedQty || 0,
      QualityPlan: template.QualityPlan,
      Conclusion: template.Conclusion,
      DefectCategoryList: template.DefectCategoryList || [],
      SelectedPhotoSectionList: template.SelectedPhotoSectionList || [],
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: t("fincheckTemplates.alerts.deleteConfirm"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: t("fincheckTemplates.alerts.yesDelete"),
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/api/qa-sections-templates/${id}`);
        Swal.fire({
          icon: "success",
          title: t("fincheckTemplates.alerts.deleted"),
          timer: 1500,
          showConfirmButton: false,
        });
        fetchData();
      } catch (error) {
        console.error("Delete error:", error);
        Swal.fire(
          t("fincheckTemplates.alerts.error"),
          "Failed to delete.",
          "error",
        );
      }
    }
  };

  // --- Bulk Sync Handler ---
  const handleBulkSync = async () => {
    setIsSyncing(true);
    try {
      await axios.put(`${API_BASE_URL}/api/qa-sections-templates/bulk-sync`);
      Swal.fire({
        icon: "success",
        title: t("fincheckTemplates.alerts.synced"),
        text: t("fincheckTemplates.alerts.syncSuccess"),
        timer: 1500,
        showConfirmButton: false,
      });
      fetchData(); // Refresh table to show new names
    } catch (error) {
      console.error("Sync error:", error);
      Swal.fire(
        t("fincheckTemplates.alerts.error"),
        "Failed to sync names.",
        "error",
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCategoryToggle = (cat) => {
    const exists = formData.DefectCategoryList.find(
      (c) => c.categoryId === cat._id,
    );
    let newList;
    if (exists) {
      newList = formData.DefectCategoryList.filter(
        (c) => c.categoryId !== cat._id,
      );
    } else {
      newList = [
        ...formData.DefectCategoryList,
        {
          categoryId: cat._id,
          CategoryCode: cat.CategoryCode,
          CategoryNameEng: cat.CategoryNameEng,
          CategoryNameCh: cat.CategoryNameCh, // Store master Chinese name
        },
      ];
    }
    setFormData({ ...formData, DefectCategoryList: newList });
  };

  const handlePhotoSectionToggle = (section) => {
    const exists = formData.SelectedPhotoSectionList.find(
      (p) => p.PhotoSectionID === section._id,
    );
    let newList;
    if (exists) {
      newList = formData.SelectedPhotoSectionList.filter(
        (p) => p.PhotoSectionID !== section._id,
      );
    } else {
      newList = [
        ...formData.SelectedPhotoSectionList,
        {
          PhotoSectionID: section._id,
          SectionName: section.sectionName,
          SectionNameCh: section.sectionNameChinese, // Store master Chinese name
        },
      ];
    }
    setFormData({ ...formData, SelectedPhotoSectionList: newList });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (isEditing) {
        await axios.put(
          `${API_BASE_URL}/api/qa-sections-templates/${formData._id}`,
          formData,
        );
        Swal.fire({
          icon: "success",
          title: t("fincheckTemplates.alerts.updated"),
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await axios.post(`${API_BASE_URL}/api/qa-sections-templates`, formData);
        Swal.fire({
          icon: "success",
          title: t("fincheckTemplates.alerts.saved"),
          timer: 1500,
          showConfirmButton: false,
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Save error:", error);
      Swal.fire(
        t("fincheckTemplates.alerts.error"),
        error.response?.data?.message || "Failed to save template.",
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  // --- UI Components ---
  const StatusBadge = ({ val }) => {
    // If val exists in translation file, use translated value within brackets
    // e.g., Yes -> Yes (是)
    // AQL -> AQL (No translation needed)

    // Safety check for null/undefined
    if (!val) return null;

    let displayVal = val;
    // Only add brackets if the translated key is different from the key itself and translation exists
    const translated = t(`fincheckTemplates.status.${val}`);
    if (translated && translated !== val && val !== "AQL") {
      displayVal = `${val} (${translated})`;
    }

    const isYes = val === "Yes";
    const isMeas = val === "Before" || val === "After";
    const isMethod = val === "Fixed" || val === "AQL";

    let colorClass =
      "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400";
    let icon = <XCircle className="w-3 h-3" />;

    if (isYes) {
      colorClass =
        "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      icon = <CheckCircle className="w-3 h-3" />;
    } else if (isMeas || isMethod) {
      colorClass =
        "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      icon = <FileText className="w-3 h-3" />;
    }

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${colorClass}`}
      >
        {icon} {displayVal}
      </span>
    );
  };

  const headerClass =
    "px-2 py-3 text-center whitespace-normal break-words leading-tight";

  const getRowClass = (index) => {
    let baseClass =
      "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200";
    if (isDragging) {
      if (index === draggedItem) {
        baseClass += " opacity-50 bg-indigo-50 dark:bg-indigo-900/20";
      }
      if (index === dragOverItem) {
        baseClass +=
          " border-t-2 border-indigo-500 dark:border-indigo-400 transform scale-[1.01]";
      }
    }
    return baseClass;
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-20">
      {/* Top Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            {t("fincheckTemplates.title")}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t("fincheckTemplates.subtitle")}{" "}
            <span className="text-indigo-600 dark:text-indigo-400">
              {t("fincheckTemplates.dragInfo")}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isReordering && (
            <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
              <Loader className="w-4 h-4 animate-spin" />
              {t("fincheckTemplates.savingOrder")}
            </div>
          )}

          {/* Bulk Update Button */}
          <button
            onClick={handleBulkSync}
            disabled={isSyncing}
            title={t("fincheckTemplates.bulkUpdateTooltip")}
            className="flex items-center gap-2 px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`}
            />
            {isSyncing
              ? t("fincheckTemplates.modal.saving")
              : t("fincheckTemplates.bulkUpdate")}
          </button>

          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> {t("fincheckTemplates.addNew")}
          </button>
        </div>
      </div>

      {/* Drag Instruction Banner */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3 flex items-center gap-3">
        <div className="bg-indigo-100 dark:bg-indigo-900/40 p-2 rounded-lg">
          <GripVertical className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-indigo-800 dark:text-indigo-200">
            {t("fincheckTemplates.dragBannerTitle")}
          </p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400">
            {t("fincheckTemplates.dragBannerDesc")}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 dark:bg-gray-700/50 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-2 py-3 w-10 text-center">
                  <GripVertical className="w-4 h-4 mx-auto text-gray-400" />
                </th>
                <th className={`${headerClass} w-10`}>
                  {t("fincheckTemplates.table.no")}
                </th>
                <th className="px-4 py-3 min-w-[150px] whitespace-normal break-words leading-tight">
                  {t("fincheckTemplates.table.reportType")}
                </th>
                <th className={headerClass}>
                  {t("fincheckTemplates.table.meas")}
                </th>
                <th className={headerClass}>
                  {t("fincheckTemplates.table.meas2")}
                </th>
                <th className={headerClass}>
                  {t("fincheckTemplates.table.head")}
                </th>
                <th className={headerClass}>
                  {t("fincheckTemplates.table.pics")}
                </th>
                <th className="px-4 py-3 min-w-[180px] whitespace-normal break-words leading-tight">
                  {t("fincheckTemplates.table.defectCats")}
                </th>
                <th className="px-4 py-3 min-w-[200px] whitespace-normal break-words leading-tight">
                  {t("fincheckTemplates.table.photoSecs")}
                </th>
                <th className={headerClass}>
                  {t("fincheckTemplates.table.line")}
                </th>
                <th className={headerClass}>
                  {t("fincheckTemplates.table.tab")}
                </th>
                <th className={headerClass}>
                  {t("fincheckTemplates.table.col")}
                </th>
                <th className={headerClass}>
                  {t("fincheckTemplates.table.stage")}
                </th>
                <th className={headerClass}>
                  {t("fincheckTemplates.table.meth")}
                </th>
                <th className={headerClass}>
                  {t("fincheckTemplates.table.qty")}
                </th>
                <th className={headerClass}>
                  {t("fincheckTemplates.table.ctn")}
                </th>
                <th className={headerClass}>
                  {t("fincheckTemplates.table.scan")}
                </th>
                <th className={headerClass}>
                  {t("fincheckTemplates.table.qplan")}
                </th>
                <th className={headerClass}>
                  {t("fincheckTemplates.table.conc")}
                </th>
                <th className="px-4 py-3 text-right">
                  {t("fincheckTemplates.table.actions")}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="19" className="text-center py-10">
                    <Loader className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan="19" className="text-center py-10 text-gray-500">
                    {t("fincheckTemplates.noTemplates")}
                  </td>
                </tr>
              ) : (
                templates.map((tItem, index) => (
                  <tr
                    key={tItem._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`${getRowClass(index)} cursor-grab active:cursor-grabbing`}
                  >
                    <td className="px-2 py-4 text-center">
                      <div className="flex justify-center">
                        <GripVertical className="w-5 h-5 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-grab active:cursor-grabbing" />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                        {tItem.no}
                      </span>
                    </td>
                    {/* Report Type: English + (Chinese) */}
                    <td className="px-4 py-4 font-bold text-gray-800 dark:text-gray-100">
                      {tItem.ReportType}
                      {tItem.ReportTypeChinese && (
                        <span className="block text-xs font-normal text-gray-500">
                          ({tItem.ReportTypeChinese})
                        </span>
                      )}
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={tItem.Measurement} />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={tItem.MeasurementAdditional || "No"} />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={tItem.Header} />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={tItem.Photos} />
                    </td>
                    {/* Defect Categories (Code Only as requested) */}
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {tItem.DefectCategoryList.map((c) => (
                          <span
                            key={c.categoryId}
                            className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] rounded border border-indigo-100 dark:border-indigo-800"
                          >
                            {c.CategoryCode}
                          </span>
                        ))}
                      </div>
                    </td>
                    {/* Photo Sections: Name + (Chinese) */}
                    <td className="px-4 py-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
                        {tItem.SelectedPhotoSectionList &&
                        tItem.SelectedPhotoSectionList.length > 0 ? (
                          tItem.SelectedPhotoSectionList.map((p) => (
                            <span
                              key={p.PhotoSectionID}
                              className="px-1.5 py-0.5 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-[10px] rounded border border-teal-100 dark:border-teal-800 flex items-center gap-1 truncate"
                              title={p.SectionName}
                            >
                              <Camera className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">
                                {p.SectionName}
                                {p.SectionNameCh ? ` (${p.SectionNameCh})` : ""}
                              </span>
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-[10px] italic col-span-2">
                            {t("fincheckTemplates.table.none")}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={tItem.Line || "Yes"} />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={tItem.Table || "Yes"} />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={tItem.Colors || "Yes"} />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={tItem.ShippingStage || "Yes"} />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={tItem.InspectedQtyMethod || "NA"} />
                    </td>
                    <td className="px-2 py-4 text-center font-mono text-gray-700 dark:text-gray-300">
                      {tItem.InspectedQty || 0}
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={tItem.isCarton || "No"} />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={tItem.isQCScan || "No"} />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={tItem.QualityPlan} />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={tItem.Conclusion} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(tItem);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md dark:hover:bg-blue-900/30 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(tItem._id);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-md dark:hover:bg-red-900/30 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[95vh]">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                {isEditing
                  ? t("fincheckTemplates.modal.editTitle")
                  : t("fincheckTemplates.modal.addTitle")}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <div className="p-6 overflow-y-auto custom-scrollbar">
              <form
                id="templateForm"
                onSubmit={handleSubmit}
                className="space-y-6"
              >
                {/* Report Type (English & Chinese) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t("fincheckTemplates.modal.reportTypeName")}
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.ReportType}
                      onChange={(e) =>
                        setFormData({ ...formData, ReportType: e.target.value })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="e.g., Pilot Run - Sewing"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      {t("fincheckTemplates.modal.reportTypeNameCh")}
                    </label>
                    <input
                      type="text"
                      value={formData.ReportTypeChinese}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          ReportTypeChinese: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="e.g., 试点运行 - 缝纫"
                    />
                  </div>
                </div>

                {/* Settings Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {/* Basic Yes/No Fields */}
                  {[
                    "Header",
                    "Photos",
                    "Line",
                    "Table",
                    "Colors",
                    "ShippingStage",
                    "QualityPlan",
                    "Conclusion",
                  ].map((field) => (
                    <div key={field}>
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase flex items-center gap-1">
                        {field === "ShippingStage" && (
                          <Ship className="w-3 h-3" />
                        )}
                        {t(`fincheckTemplates.formLabels.${field}`)}
                      </label>
                      <select
                        value={formData[field]}
                        onChange={(e) =>
                          setFormData({ ...formData, [field]: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="Yes">
                          Yes ({t("fincheckTemplates.status.Yes")})
                        </option>
                        <option value="No">
                          No ({t("fincheckTemplates.status.No")})
                        </option>
                      </select>
                    </div>
                  ))}

                  {/* Measurement Field */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase">
                      {t("fincheckTemplates.formLabels.Measurement")}
                    </label>
                    <select
                      value={formData.Measurement}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          Measurement: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="No">
                        No ({t("fincheckTemplates.status.No")})
                      </option>
                      <option value="Before">
                        Before ({t("fincheckTemplates.status.Before")})
                      </option>
                      <option value="After">
                        After ({t("fincheckTemplates.status.After")})
                      </option>
                    </select>
                  </div>

                  {/* Measurement Additional */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase text-indigo-600">
                      {t("fincheckTemplates.formLabels.MeasurementAdditional")}
                    </label>
                    <select
                      value={formData.MeasurementAdditional}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          MeasurementAdditional: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50/50 dark:bg-indigo-900/20 dark:border-indigo-800"
                    >
                      <option value="No">
                        No ({t("fincheckTemplates.status.No")})
                      </option>
                      <option value="Before">
                        Before ({t("fincheckTemplates.status.Before")})
                      </option>
                      <option value="After">
                        After ({t("fincheckTemplates.status.After")})
                      </option>
                    </select>
                  </div>

                  {/* Inspected Method */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase">
                      {t("fincheckTemplates.formLabels.InspectedQtyMethod")}
                    </label>
                    <select
                      value={formData.InspectedQtyMethod}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          InspectedQtyMethod: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="NA">
                        NA ({t("fincheckTemplates.status.NA")})
                      </option>
                      <option value="Fixed">
                        Fixed ({t("fincheckTemplates.status.Fixed")})
                      </option>
                      <option value="AQL">AQL</option>
                    </select>
                  </div>

                  {/* Inspected Qty */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase">
                      {t("fincheckTemplates.formLabels.InspectedQty")}
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.InspectedQty}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          InspectedQty: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* isCarton */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase flex items-center gap-1">
                      <Box className="w-3 h-3" />{" "}
                      {t("fincheckTemplates.formLabels.isCarton")}
                    </label>
                    <select
                      value={formData.isCarton}
                      onChange={(e) =>
                        setFormData({ ...formData, isCarton: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Yes">
                        Yes ({t("fincheckTemplates.status.Yes")})
                      </option>
                      <option value="No">
                        No ({t("fincheckTemplates.status.No")})
                      </option>
                    </select>
                  </div>

                  {/* isQCScan */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase flex items-center gap-1">
                      <ScanLine className="w-3 h-3" />{" "}
                      {t("fincheckTemplates.formLabels.isQCScan")}
                    </label>
                    <select
                      value={formData.isQCScan}
                      onChange={(e) =>
                        setFormData({ ...formData, isQCScan: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Yes">
                        Yes ({t("fincheckTemplates.status.Yes")})
                      </option>
                      <option value="No">
                        No ({t("fincheckTemplates.status.No")})
                      </option>
                    </select>
                  </div>
                </div>

                {/* --- Defect Categories Section --- */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">
                    {t("fincheckTemplates.modal.includeDefects")}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {categories.map((cat) => {
                      const isSelected = formData.DefectCategoryList.some(
                        (c) => c.categoryId === cat._id,
                      );
                      return (
                        <div
                          key={cat._id}
                          onClick={() => handleCategoryToggle(cat)}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                            ${
                              isSelected
                                ? "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-500 dark:border-indigo-400 shadow-sm"
                                : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700"
                            }
                          `}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <span className="block font-bold text-gray-800 dark:text-gray-100 text-sm truncate">
                              {cat.no}. {cat.CategoryCode}
                            </span>
                            <span className="block text-xs text-gray-500 dark:text-gray-400 truncate">
                              {cat.CategoryNameEng}
                              {cat.CategoryNameCh && ` (${cat.CategoryNameCh})`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* --- Photo Sections Selection --- */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-3 flex items-center gap-2">
                    <Camera className="w-4 h-4" />{" "}
                    {t("fincheckTemplates.modal.includePhotos")}
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {photoSections.map((section) => {
                      const isSelected = formData.SelectedPhotoSectionList.some(
                        (p) => p.PhotoSectionID === section._id,
                      );
                      return (
                        <div
                          key={section._id}
                          onClick={() => handlePhotoSectionToggle(section)}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all
                            ${
                              isSelected
                                ? "bg-teal-50 dark:bg-teal-900/20 border-teal-500 dark:border-teal-400 shadow-sm"
                                : "bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700"
                            }
                          `}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <span className="block font-bold text-gray-800 dark:text-gray-100 text-sm truncate">
                              {section.sectionName}
                              {section.sectionNameChinese &&
                                ` (${section.sectionNameChinese})`}
                            </span>
                            <span className="block text-xs text-gray-500 dark:text-gray-400">
                              {section.itemList.length} items
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    {photoSections.length === 0 && (
                      <div className="col-span-3 text-center text-sm text-gray-500 py-2">
                        {t("fincheckTemplates.modal.noPhotosAvail")}
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
              >
                {t("fincheckTemplates.modal.cancel")}
              </button>
              <button
                type="submit"
                form="templateForm"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-800 transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving
                  ? t("fincheckTemplates.modal.saving")
                  : isEditing
                    ? t("fincheckTemplates.modal.update")
                    : t("fincheckTemplates.modal.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles for Drag */}
      <style jsx>{`
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
          animation: fadeIn 0.3s ease-out;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: rgba(156, 163, 175, 0.8);
        }
      `}</style>
    </div>
  );
};

export default YPivotQATemplatesReportType;
