import axios from "axios";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Edit2,
  ImageIcon,
  Plus,
  Save,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";

// Modal Component with Portal
const Modal = ({ isOpen, children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {children}
    </div>,
    document.body,
  );
};

const YPivotQASectionsPhotos = () => {
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});

  // Edit section modal state
  const [editingSectionModal, setEditingSectionModal] = useState({
    isOpen: false,
    sectionId: null,
    sectionName: "",
    sectionNameChinese: "",
  });

  // Edit item modal state
  const [editingItemModal, setEditingItemModal] = useState({
    isOpen: false,
    sectionId: null,
    itemNo: null,
    itemName: "",
    itemNameChinese: "",
    maxCount: 10,
  });

  // Add new section state
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSectionData, setNewSectionData] = useState({
    sectionName: "",
    sectionNameChinese: "",
    itemList: [{ no: 1, itemName: "", itemNameChinese: "", maxCount: 10 }],
  });

  // Add new item to existing section state
  const [addingItemModal, setAddingItemModal] = useState({
    isOpen: false,
    sectionId: null,
    itemName: "",
    itemNameChinese: "",
    maxCount: 10,
  });

  // Fetch all sections on mount
  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections-photos`,
      );
      if (response.data.success) {
        setSections(response.data.data);
        // Expand all sections by default
        const expanded = {};
        response.data.data.forEach((s) => {
          expanded[s._id] = true;
        });
        setExpandedSections(expanded);
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
      Swal.fire("Error", "Failed to load photo sections", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSectionExpand = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  // === SECTION NAME EDITING ===
  const openEditSectionModal = (section) => {
    setEditingSectionModal({
      isOpen: true,
      sectionId: section._id,
      sectionName: section.sectionName,
      sectionNameChinese: section.sectionNameChinese || "",
    });
  };

  const closeEditSectionModal = () => {
    setEditingSectionModal({
      isOpen: false,
      sectionId: null,
      sectionName: "",
      sectionNameChinese: "",
    });
  };

  const handleSaveSectionName = async () => {
    const { sectionId, sectionName, sectionNameChinese } = editingSectionModal;

    if (!sectionName.trim()) {
      Swal.fire(
        "Validation Error",
        "Section name (English) cannot be empty",
        "warning",
      );
      return;
    }

    if (!sectionNameChinese.trim()) {
      Swal.fire(
        "Validation Error",
        "Section name (Chinese) cannot be empty",
        "warning",
      );
      return;
    }

    try {
      const section = sections.find((s) => s._id === sectionId);
      const response = await axios.put(
        `${API_BASE_URL}/api/qa-sections-photos/${sectionId}`,
        {
          sectionName,
          sectionNameChinese,
          itemList: section.itemList,
        },
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Section name updated successfully",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchSections();
        closeEditSectionModal();
      }
    } catch (error) {
      console.error("Error updating section name:", error);
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to update section name",
        "error",
      );
    }
  };

  // === ITEM EDITING ===
  const openEditItemModal = (sectionId, item) => {
    setEditingItemModal({
      isOpen: true,
      sectionId,
      itemNo: item.no,
      itemName: item.itemName,
      itemNameChinese: item.itemNameChinese || "",
      maxCount: item.maxCount,
    });
  };

  const closeEditItemModal = () => {
    setEditingItemModal({
      isOpen: false,
      sectionId: null,
      itemNo: null,
      itemName: "",
      itemNameChinese: "",
      maxCount: 10,
    });
  };

  const handleSaveItem = async () => {
    const { sectionId, itemNo, itemName, itemNameChinese, maxCount } =
      editingItemModal;

    if (!itemName.trim()) {
      Swal.fire(
        "Validation Error",
        "Item name (English) cannot be empty",
        "warning",
      );
      return;
    }

    if (!itemNameChinese.trim()) {
      Swal.fire(
        "Validation Error",
        "Item name (Chinese) cannot be empty",
        "warning",
      );
      return;
    }

    if (maxCount < 1) {
      Swal.fire("Validation Error", "Max count must be at least 1", "warning");
      return;
    }

    try {
      const section = sections.find((s) => s._id === sectionId);
      const updatedItemList = section.itemList.map((item) =>
        item.no === itemNo
          ? {
              ...item,
              itemName,
              itemNameChinese,
              maxCount: parseInt(maxCount),
            }
          : item,
      );

      const response = await axios.put(
        `${API_BASE_URL}/api/qa-sections-photos/${sectionId}`,
        {
          sectionName: section.sectionName,
          sectionNameChinese: section.sectionNameChinese,
          itemList: updatedItemList,
        },
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Item updated successfully",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchSections();
        closeEditItemModal();
      }
    } catch (error) {
      console.error("Error updating item:", error);
      Swal.fire("Error", "Failed to update item", "error");
    }
  };

  // === DELETE ITEM ===
  const handleDeleteItem = async (sectionId, itemNo, itemName) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete "${itemName}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.delete(
          `${API_BASE_URL}/api/qa-sections-photos/${sectionId}/items/${itemNo}`,
        );

        if (response.data.success) {
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Item deleted successfully",
            timer: 1500,
            showConfirmButton: false,
          });
          fetchSections();
        }
      } catch (error) {
        console.error("Error deleting item:", error);
        Swal.fire("Error", "Failed to delete item", "error");
      }
    }
  };

  // === DELETE ENTIRE SECTION ===
  const handleDeleteSection = async (sectionId, sectionName) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete the entire section "${sectionName}"? This will remove all items in this section.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.delete(
          `${API_BASE_URL}/api/qa-sections-photos/${sectionId}`,
        );

        if (response.data.success) {
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Section deleted successfully",
            timer: 1500,
            showConfirmButton: false,
          });
          fetchSections();
        }
      } catch (error) {
        console.error("Error deleting section:", error);
        Swal.fire("Error", "Failed to delete section", "error");
      }
    }
  };

  // === ADD NEW SECTION ===
  const handleShowAddNew = () => {
    setIsAddingNew(true);
    setNewSectionData({
      sectionName: "",
      sectionNameChinese: "",
      itemList: [{ no: 1, itemName: "", itemNameChinese: "", maxCount: 10 }],
    });
  };

  const handleCancelAddNew = () => {
    setIsAddingNew(false);
    setNewSectionData({
      sectionName: "",
      sectionNameChinese: "",
      itemList: [],
    });
  };

  const handleAddNewItem = () => {
    const newNo =
      newSectionData.itemList.length > 0
        ? Math.max(...newSectionData.itemList.map((i) => i.no)) + 1
        : 1;
    setNewSectionData({
      ...newSectionData,
      itemList: [
        ...newSectionData.itemList,
        { no: newNo, itemName: "", itemNameChinese: "", maxCount: 10 },
      ],
    });
  };

  const handleRemoveNewItem = (no) => {
    const filtered = newSectionData.itemList.filter((item) => item.no !== no);
    const renumbered = filtered.map((item, index) => ({
      ...item,
      no: index + 1,
    }));
    setNewSectionData({ ...newSectionData, itemList: renumbered });
  };

  const handleNewItemChange = (no, field, value) => {
    setNewSectionData({
      ...newSectionData,
      itemList: newSectionData.itemList.map((item) =>
        item.no === no ? { ...item, [field]: value } : item,
      ),
    });
  };

  const handleSaveNewSection = async () => {
    if (!newSectionData.sectionName.trim()) {
      Swal.fire(
        "Validation Error",
        "Section name (English) cannot be empty",
        "warning",
      );
      return;
    }

    if (!newSectionData.sectionNameChinese.trim()) {
      Swal.fire(
        "Validation Error",
        "Section name (Chinese) cannot be empty",
        "warning",
      );
      return;
    }

    const validItems = newSectionData.itemList.filter(
      (item) => item.itemName.trim() && item.itemNameChinese.trim(),
    );

    if (validItems.length === 0) {
      Swal.fire(
        "Validation Error",
        "At least one item with both English and Chinese names is required",
        "warning",
      );
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections-photos`,
        {
          sectionName: newSectionData.sectionName,
          sectionNameChinese: newSectionData.sectionNameChinese,
          itemList: validItems,
        },
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Created!",
          text: "New section created successfully",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchSections();
        handleCancelAddNew();
      }
    } catch (error) {
      console.error("Error creating section:", error);
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to create section",
        "error",
      );
    }
  };

  // === ADD ITEM TO EXISTING SECTION ===
  const openAddItemModal = (sectionId) => {
    setAddingItemModal({
      isOpen: true,
      sectionId,
      itemName: "",
      itemNameChinese: "",
      maxCount: 10,
    });
  };

  const closeAddItemModal = () => {
    setAddingItemModal({
      isOpen: false,
      sectionId: null,
      itemName: "",
      itemNameChinese: "",
      maxCount: 10,
    });
  };

  const handleSaveNewItemToSection = async () => {
    const { sectionId, itemName, itemNameChinese, maxCount } = addingItemModal;

    if (!itemName.trim()) {
      Swal.fire(
        "Validation Error",
        "Item name (English) cannot be empty",
        "warning",
      );
      return;
    }

    if (!itemNameChinese.trim()) {
      Swal.fire(
        "Validation Error",
        "Item name (Chinese) cannot be empty",
        "warning",
      );
      return;
    }

    if (maxCount < 1) {
      Swal.fire("Validation Error", "Max count must be at least 1", "warning");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections-photos/${sectionId}/items`,
        { itemName, itemNameChinese, maxCount },
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Added!",
          text: "Item added successfully",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchSections();
        closeAddItemModal();
      }
    } catch (error) {
      console.error("Error adding item:", error);
      Swal.fire("Error", "Failed to add item", "error");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-2 sm:p-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-6 h-6 text-indigo-500" />
            Photo Sections Manager
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage photo sections and their item lists with bilingual support
          </p>
        </div>
        <button
          onClick={handleShowAddNew}
          disabled={isAddingNew}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
        >
          <Plus size={18} />
          Add New Section
        </button>
      </div>

      {/* Add New Section Form */}
      {isAddingNew && (
        <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 dark:from-indigo-900/30 dark:via-blue-900/20 dark:to-purple-900/20 p-4 sm:p-6 rounded-xl shadow-lg border-2 border-indigo-200 dark:border-indigo-700">
          <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-300 mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Photo Section
          </h3>

          {/* Section Name Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Section Name (English) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newSectionData.sectionName}
                onChange={(e) =>
                  setNewSectionData({
                    ...newSectionData,
                    sectionName: e.target.value,
                  })
                }
                placeholder="Enter section name in English..."
                className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Section Name (Chinese) 中文名稱{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newSectionData.sectionNameChinese}
                onChange={(e) =>
                  setNewSectionData({
                    ...newSectionData,
                    sectionNameChinese: e.target.value,
                  })
                }
                placeholder="輸入中文分區名稱..."
                className="w-full p-3 border-2 border-orange-300 dark:border-orange-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              />
            </div>
          </div>

          {/* Item List */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Item List
            </label>
            <div className="space-y-3">
              {newSectionData.itemList.map((item) => (
                <div
                  key={item.no}
                  className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                      Item #{item.no}
                    </span>
                    <button
                      onClick={() => handleRemoveNewItem(item.no)}
                      className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                      title="Remove item"
                    >
                      <XCircle size={16} />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <input
                      type="text"
                      value={item.itemName}
                      onChange={(e) =>
                        handleNewItemChange(item.no, "itemName", e.target.value)
                      }
                      placeholder="Item name (English)"
                      className="p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                    <input
                      type="text"
                      value={item.itemNameChinese}
                      onChange={(e) =>
                        handleNewItemChange(
                          item.no,
                          "itemNameChinese",
                          e.target.value,
                        )
                      }
                      placeholder="項目名稱 (Chinese)"
                      className="p-2.5 border border-orange-300 dark:border-orange-600 rounded-lg bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-orange-500 text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        Max:
                      </label>
                      <input
                        type="number"
                        value={item.maxCount}
                        onChange={(e) =>
                          handleNewItemChange(
                            item.no,
                            "maxCount",
                            parseInt(e.target.value) || 1,
                          )
                        }
                        min="1"
                        className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              ))}
              <button
                onClick={handleAddNewItem}
                className="w-full p-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 font-medium border-2 border-dashed border-gray-300 dark:border-gray-600 transition-colors"
              >
                + Add Another Item
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
            <button
              onClick={handleCancelAddNew}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600 transition-colors"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              onClick={handleSaveNewSection}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors"
            >
              <Check size={16} />
              Save Section
            </button>
          </div>
        </div>
      )}

      {/* Sections List */}
      <div className="space-y-4">
        {sections.map((section) => (
          <div
            key={section._id}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
          >
            {/* Section Header */}
            <div
              className="p-4 bg-gradient-to-r from-indigo-500 to-purple-500 dark:from-indigo-600 dark:to-purple-600 cursor-pointer"
              onClick={() => toggleSectionExpand(section._id)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {expandedSections[section._id] ? (
                    <ChevronUp className="w-5 h-5 text-white" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-white" />
                  )}
                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {section.sectionName}
                    </h3>
                    <p className="text-sm text-white/80">
                      {section.sectionNameChinese || "No Chinese name"}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 bg-white/20 text-white text-xs font-semibold rounded-full">
                    {section.itemList.length} items
                  </span>
                </div>
                <div
                  className="flex items-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => openEditSectionModal(section)}
                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                    title="Edit section name"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => openAddItemModal(section._id)}
                    className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                    title="Add item"
                  >
                    <Plus size={16} />
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteSection(section._id, section.sectionName)
                    }
                    className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition-colors"
                    title="Delete section"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>

            {/* Section Items */}
            {expandedSections[section._id] && (
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {section.itemList.map((item) => (
                  <div
                    key={`${section._id}-${item.no}`}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full text-sm font-bold">
                            {item.no}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-800 dark:text-gray-200 truncate">
                              {item.itemName}
                            </p>
                            <p className="text-sm text-orange-600 dark:text-orange-400 truncate">
                              {item.itemNameChinese || "No Chinese name"}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 pl-11 sm:pl-0">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-semibold rounded-full">
                          Max: {item.maxCount}
                        </span>
                        <button
                          onClick={() => openEditItemModal(section._id, item)}
                          className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow transition-colors"
                          title="Edit item"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() =>
                            handleDeleteItem(
                              section._id,
                              item.no,
                              item.itemName,
                            )
                          }
                          className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg shadow transition-colors"
                          title="Delete item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {section.itemList.length === 0 && (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No items in this section. Click the + button to add one.
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {/* Empty State */}
        {sections.length === 0 && (
          <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
            <ImageIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              No sections available.
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
              Click "Add New Section" to create one.
            </p>
          </div>
        )}
      </div>

      {/* Edit Section Modal */}
      <Modal isOpen={editingSectionModal.isOpen}>
        <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-500 to-purple-500">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <Edit2 className="w-5 h-5" />
              Edit Section Name
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Section Name (English)
              </label>
              <input
                type="text"
                value={editingSectionModal.sectionName}
                onChange={(e) =>
                  setEditingSectionModal({
                    ...editingSectionModal,
                    sectionName: e.target.value,
                  })
                }
                className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Section Name (Chinese) 中文名稱
              </label>
              <input
                type="text"
                value={editingSectionModal.sectionNameChinese}
                onChange={(e) =>
                  setEditingSectionModal({
                    ...editingSectionModal,
                    sectionNameChinese: e.target.value,
                  })
                }
                className="w-full p-3 border-2 border-orange-300 dark:border-orange-600 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-orange-500"
              />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
            <button
              onClick={closeEditSectionModal}
              className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSectionName}
              className="px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow transition-colors flex items-center gap-2"
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Item Modal */}
      <Modal isOpen={editingItemModal.isOpen}>
        <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-indigo-500">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <Edit2 className="w-5 h-5" />
              Edit Item
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Item Name (English)
              </label>
              <input
                type="text"
                value={editingItemModal.itemName}
                onChange={(e) =>
                  setEditingItemModal({
                    ...editingItemModal,
                    itemName: e.target.value,
                  })
                }
                className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Item Name (Chinese) 項目名稱
              </label>
              <input
                type="text"
                value={editingItemModal.itemNameChinese}
                onChange={(e) =>
                  setEditingItemModal({
                    ...editingItemModal,
                    itemNameChinese: e.target.value,
                  })
                }
                className="w-full p-3 border-2 border-orange-300 dark:border-orange-600 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Max Count
              </label>
              <input
                type="number"
                value={editingItemModal.maxCount}
                onChange={(e) =>
                  setEditingItemModal({
                    ...editingItemModal,
                    maxCount: parseInt(e.target.value) || 1,
                  })
                }
                min="1"
                className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
            <button
              onClick={closeEditItemModal}
              className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveItem}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow transition-colors flex items-center gap-2"
            >
              <Save size={16} />
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Item Modal */}
      <Modal isOpen={addingItemModal.isOpen}>
        <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-green-500 to-emerald-500">
            <h3 className="font-bold text-white text-lg flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Item
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Item Name (English)
              </label>
              <input
                type="text"
                value={addingItemModal.itemName}
                onChange={(e) =>
                  setAddingItemModal({
                    ...addingItemModal,
                    itemName: e.target.value,
                  })
                }
                placeholder="Enter item name in English..."
                className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Item Name (Chinese) 項目名稱
              </label>
              <input
                type="text"
                value={addingItemModal.itemNameChinese}
                onChange={(e) =>
                  setAddingItemModal({
                    ...addingItemModal,
                    itemNameChinese: e.target.value,
                  })
                }
                placeholder="輸入中文項目名稱..."
                className="w-full p-3 border-2 border-orange-300 dark:border-orange-600 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-orange-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Max Count
              </label>
              <input
                type="number"
                value={addingItemModal.maxCount}
                onChange={(e) =>
                  setAddingItemModal({
                    ...addingItemModal,
                    maxCount: parseInt(e.target.value) || 1,
                  })
                }
                min="1"
                className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
            <button
              onClick={closeAddItemModal}
              className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNewItemToSection}
              className="px-5 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg shadow transition-colors flex items-center gap-2"
            >
              <Plus size={16} />
              Add Item
            </button>
          </div>
        </div>
      </Modal>

      {/* CSS Styles */}
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: scale(0.95);
            }
            to {
              opacity: 1;
              transform: scale(1);
            }
          }
          .animate-fadeIn {
            animation: fadeIn 0.2s ease-out;
          }
        `}
      </style>
    </div>
  );
};

export default YPivotQASectionsPhotos;
