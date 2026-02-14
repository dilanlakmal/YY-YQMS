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
  GripVertical
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

const YPivotQATemplatesReportType = () => {
  // --- State ---
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [photoSections, setPhotoSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    SelectedPhotoSectionList: []
  };
  const [formData, setFormData] = useState(initialFormState);

  // --- Fetch Data ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [tplRes, catRes, photoRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/qa-sections-templates`),
        axios.get(`${API_BASE_URL}/api/qa-sections-templates/categories`),
        axios.get(`${API_BASE_URL}/api/qa-sections-templates/photo-sections`)
      ]);
      setTemplates(tplRes.data.data);
      setCategories(catRes.data.data);
      setPhotoSections(photoRes.data.data);
    } catch (error) {
      console.error("Error loading data:", error);
      Swal.fire("Error", "Failed to load data.", "error");
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

    // Make the drag image slightly transparent
    setTimeout(() => {
      if (dragNode.current) {
        dragNode.current.style.opacity = "0.5";
      }
    }, 0);

    // Set drag data
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

    // Create new array with reordered items
    const newTemplates = [...templates];
    const draggedItemContent = newTemplates[draggedItem];

    // Remove dragged item
    newTemplates.splice(draggedItem, 1);
    // Insert at new position
    newTemplates.splice(dropIndex, 0, draggedItemContent);

    // Update local state immediately for smooth UX
    const updatedTemplates = newTemplates.map((template, index) => ({
      ...template,
      no: index + 1
    }));
    setTemplates(updatedTemplates);

    // Reset drag state
    handleDragEnd();

    // Save new order to database
    await saveNewOrder(updatedTemplates);
  };

  const saveNewOrder = async (orderedTemplates) => {
    setIsReordering(true);
    try {
      const orderedIds = orderedTemplates.map((t) => t._id);
      await axios.put(`${API_BASE_URL}/api/qa-sections-templates-reorder`, {
        orderedIds
      });

      Swal.fire({
        icon: "success",
        title: "Reordered!",
        text: "Template order updated successfully.",
        timer: 1500,
        showConfirmButton: false
      });
    } catch (error) {
      console.error("Reorder error:", error);
      Swal.fire("Error", "Failed to save new order. Refreshing data.", "error");
      // Refresh data if save failed
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
      SelectedPhotoSectionList: template.SelectedPhotoSectionList || []
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this template?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_BASE_URL}/api/qa-sections-templates/${id}`);
        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Template deleted successfully",
          timer: 1500,
          showConfirmButton: false
        });
        fetchData();
      } catch (error) {
        console.error("Delete error:", error);
        Swal.fire("Error", "Failed to delete template.", "error");
      }
    }
  };

  const handleCategoryToggle = (cat) => {
    const exists = formData.DefectCategoryList.find(
      (c) => c.categoryId === cat._id
    );
    let newList;
    if (exists) {
      newList = formData.DefectCategoryList.filter(
        (c) => c.categoryId !== cat._id
      );
    } else {
      newList = [
        ...formData.DefectCategoryList,
        {
          categoryId: cat._id,
          CategoryCode: cat.CategoryCode,
          CategoryNameEng: cat.CategoryNameEng
        }
      ];
    }
    setFormData({ ...formData, DefectCategoryList: newList });
  };

  const handlePhotoSectionToggle = (section) => {
    const exists = formData.SelectedPhotoSectionList.find(
      (p) => p.PhotoSectionID === section._id
    );
    let newList;
    if (exists) {
      newList = formData.SelectedPhotoSectionList.filter(
        (p) => p.PhotoSectionID !== section._id
      );
    } else {
      newList = [
        ...formData.SelectedPhotoSectionList,
        {
          PhotoSectionID: section._id,
          SectionName: section.sectionName
        }
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
          formData
        );
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Report Template updated successfully.",
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        await axios.post(`${API_BASE_URL}/api/qa-sections-templates`, formData);
        Swal.fire({
          icon: "success",
          title: "Saved!",
          text: "New Report Template created successfully.",
          timer: 1500,
          showConfirmButton: false
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Save error:", error);
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to save template.",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  // --- UI Components ---
  const StatusBadge = ({ val }) => {
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
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${colorClass}`}
      >
        {icon} {val}
      </span>
    );
  };

  // Shared class for table headers to allow wrapping
  const headerClass =
    "px-2 py-3 text-center whitespace-normal break-words leading-tight";

  // Get row class based on drag state
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
            Manage Report Templates
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configure report structures and categories.{" "}
            <span className="text-indigo-600 dark:text-indigo-400">
              Drag rows to reorder.
            </span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isReordering && (
            <div className="flex items-center gap-2 text-sm text-indigo-600 dark:text-indigo-400">
              <Loader className="w-4 h-4 animate-spin" />
              Saving order...
            </div>
          )}
          <button
            onClick={handleAddNew}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> Add New Report
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
            Drag and Drop to Reorder
          </p>
          <p className="text-xs text-indigo-600 dark:text-indigo-400">
            Use the grip handle or drag any row to change the template order.
            Changes are saved automatically.
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
                <th className={`${headerClass} w-10`}>No</th>
                <th className="px-4 py-3 min-w-[150px] whitespace-normal break-words leading-tight">
                  Report Type
                </th>
                <th className={headerClass}>Meas.</th>
                <th className={headerClass}>Meas 2</th>
                <th className={headerClass}>Head</th>
                <th className={headerClass}>Pics</th>
                <th className="px-4 py-3 min-w-[180px] whitespace-normal break-words leading-tight">
                  Defect Categories
                </th>
                <th className="px-4 py-3 min-w-[200px] whitespace-normal break-words leading-tight">
                  Photo Sections
                </th>
                <th className={headerClass}>Line</th>
                <th className={headerClass}>Tab</th>
                <th className={headerClass}>Col</th>
                <th className={headerClass}>Stage</th>
                <th className={headerClass}>Meth</th>
                <th className={headerClass}>Qty</th>
                <th className={headerClass}>Ctn</th>
                <th className={headerClass}>Scan</th>
                <th className={headerClass}>Q.Plan</th>
                <th className={headerClass}>Conc</th>
                <th className="px-4 py-3 text-right">Actions</th>
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
                    No templates found.
                  </td>
                </tr>
              ) : (
                templates.map((t, index) => (
                  <tr
                    key={t._id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, index)}
                    className={`${getRowClass(
                      index
                    )} cursor-grab active:cursor-grabbing`}
                  >
                    {/* Drag Handle */}
                    <td className="px-2 py-4 text-center">
                      <div className="flex justify-center">
                        <GripVertical className="w-5 h-5 text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors cursor-grab active:cursor-grabbing" />
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                        {t.no}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-bold text-gray-800 dark:text-gray-100">
                      {t.ReportType}
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={t.Measurement} />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={t.MeasurementAdditional || "No"} />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={t.Header} />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={t.Photos} />
                    </td>
                    {/* Defect Categories */}
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {t.DefectCategoryList.map((c) => (
                          <span
                            key={c.categoryId}
                            className="px-1.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] rounded border border-indigo-100 dark:border-indigo-800"
                          >
                            {c.CategoryCode}
                          </span>
                        ))}
                      </div>
                    </td>
                    {/* Photo Sections */}
                    <td className="px-4 py-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-1">
                        {t.SelectedPhotoSectionList &&
                        t.SelectedPhotoSectionList.length > 0 ? (
                          t.SelectedPhotoSectionList.map((p) => (
                            <span
                              key={p.PhotoSectionID}
                              className="px-1.5 py-0.5 bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 text-[10px] rounded border border-teal-100 dark:border-teal-800 flex items-center gap-1 truncate"
                              title={p.SectionName}
                            >
                              <Camera className="w-3 h-3 flex-shrink-0" />
                              <span className="truncate">{p.SectionName}</span>
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-[10px] italic col-span-2">
                            None
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={t.Line || "Yes"} />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={t.Table || "Yes"} />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={t.Colors || "Yes"} />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={t.ShippingStage || "Yes"} />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={t.InspectedQtyMethod || "NA"} />
                    </td>
                    <td className="px-2 py-4 text-center font-mono text-gray-700 dark:text-gray-300">
                      {t.InspectedQty || 0}
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={t.isCarton || "No"} />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={t.isQCScan || "No"} />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={t.QualityPlan} />
                    </td>
                    <td className="px-2 py-4 text-center">
                      <StatusBadge val={t.Conclusion} />
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(t);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md dark:hover:bg-blue-900/30 transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(t._id);
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
                {isEditing ? "Edit Report Template" : "Add New Report Template"}
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
                {/* Report Type */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Report Type Name
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
                    "Conclusion"
                  ].map((field) => (
                    <div key={field}>
                      <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase flex items-center gap-1">
                        {field === "ShippingStage" && (
                          <Ship className="w-3 h-3" />
                        )}
                        {field.replace(/([A-Z])/g, " $1").trim()}
                      </label>
                      <select
                        value={formData[field]}
                        onChange={(e) =>
                          setFormData({ ...formData, [field]: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  ))}

                  {/* Measurement Field */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase">
                      Measurement
                    </label>
                    <select
                      value={formData.Measurement}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          Measurement: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="No">No</option>
                      <option value="Before">Before</option>
                      <option value="After">After</option>
                    </select>
                  </div>

                  {/* *** NEW: Additional Measurement *** */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase text-indigo-600">
                      Meas. Additional (Tab 2)
                    </label>
                    <select
                      value={formData.MeasurementAdditional}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          MeasurementAdditional: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-indigo-200 bg-indigo-50/50..."
                    >
                      <option value="No">No</option>
                      <option value="Before">Before</option>
                      <option value="After">After</option>
                    </select>
                  </div>

                  {/* Inspected Method */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase">
                      Insp. Method
                    </label>
                    <select
                      value={formData.InspectedQtyMethod}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          InspectedQtyMethod: e.target.value
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="NA">NA</option>
                      <option value="Fixed">Fixed</option>
                      <option value="AQL">AQL</option>
                    </select>
                  </div>

                  {/* Inspected Qty */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase">
                      Insp. Qty
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.InspectedQty}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          InspectedQty: parseInt(e.target.value) || 0
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* isCarton */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase flex items-center gap-1">
                      <Box className="w-3 h-3" /> is Carton
                    </label>
                    <select
                      value={formData.isCarton}
                      onChange={(e) =>
                        setFormData({ ...formData, isCarton: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  {/* isQCScan */}
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1 uppercase flex items-center gap-1">
                      <ScanLine className="w-3 h-3" /> is QC Scan
                    </label>
                    <select
                      value={formData.isQCScan}
                      onChange={(e) =>
                        setFormData({ ...formData, isQCScan: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                {/* --- Defect Categories Section --- */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">
                    Include Defect Categories
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {categories.map((cat) => {
                      const isSelected = formData.DefectCategoryList.some(
                        (c) => c.categoryId === cat._id
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
                    <Camera className="w-4 h-4" /> Include Photo Sections
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {photoSections.map((section) => {
                      const isSelected = formData.SelectedPhotoSectionList.some(
                        (p) => p.PhotoSectionID === section._id
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
                        No photo sections available to select.
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
                Cancel
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
                  ? "Saving..."
                  : isEditing
                  ? "Update Template"
                  : "Save Template"}
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
