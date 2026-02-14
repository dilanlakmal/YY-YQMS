import axios from "axios";
import { Check, Edit2, Plus, Save, Trash2, X, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";

const YPivotQASectionsPhotos = () => {
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editingSectionName, setEditingSectionName] = useState("");
  const [editingItemId, setEditingItemId] = useState(null);
  const [editingItemData, setEditingItemData] = useState({
    itemName: "",
    maxCount: 10
  });

  // Add new section states
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [newItemList, setNewItemList] = useState([
    { no: 1, itemName: "", maxCount: 10 }
  ]);

  // Add new item to existing section states
  const [addingItemToSectionId, setAddingItemToSectionId] = useState(null);
  const [newItemForSection, setNewItemForSection] = useState({
    itemName: "",
    maxCount: 10
  });

  // Fetch all sections on mount
  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections-photos`
      );
      if (response.data.success) {
        setSections(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
      Swal.fire("Error", "Failed to load photo sections", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // === SECTION NAME EDITING ===
  const handleEditSectionName = (section) => {
    setEditingSectionId(section._id);
    setEditingSectionName(section.sectionName);
  };

  const handleSaveSectionName = async (sectionId) => {
    if (!editingSectionName.trim()) {
      Swal.fire("Validation Error", "Section name cannot be empty", "warning");
      return;
    }

    try {
      const section = sections.find((s) => s._id === sectionId);
      const response = await axios.put(
        `${API_BASE_URL}/api/qa-sections-photos/${sectionId}`,
        {
          sectionName: editingSectionName,
          itemList: section.itemList
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Section name updated successfully",
          timer: 1500,
          showConfirmButton: false
        });
        fetchSections();
        setEditingSectionId(null);
        setEditingSectionName("");
      }
    } catch (error) {
      console.error("Error updating section name:", error);
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to update section name",
        "error"
      );
    }
  };

  const handleCancelSectionNameEdit = () => {
    setEditingSectionId(null);
    setEditingSectionName("");
  };

  // === ITEM EDITING ===
  const handleEditItem = (sectionId, item) => {
    setEditingItemId(`${sectionId}-${item.no}`);
    setEditingItemData({
      itemName: item.itemName,
      maxCount: item.maxCount
    });
  };

  const handleSaveItem = async (sectionId, itemNo) => {
    if (!editingItemData.itemName.trim()) {
      Swal.fire("Validation Error", "Item name cannot be empty", "warning");
      return;
    }

    if (editingItemData.maxCount < 1) {
      Swal.fire("Validation Error", "Max count must be at least 1", "warning");
      return;
    }

    try {
      const section = sections.find((s) => s._id === sectionId);
      const updatedItemList = section.itemList.map((item) =>
        item.no === itemNo
          ? {
              ...item,
              itemName: editingItemData.itemName,
              maxCount: parseInt(editingItemData.maxCount)
            }
          : item
      );

      const response = await axios.put(
        `${API_BASE_URL}/api/qa-sections-photos/${sectionId}`,
        {
          sectionName: section.sectionName,
          itemList: updatedItemList
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Item updated successfully",
          timer: 1500,
          showConfirmButton: false
        });
        fetchSections();
        setEditingItemId(null);
        setEditingItemData({ itemName: "", maxCount: 10 });
      }
    } catch (error) {
      console.error("Error updating item:", error);
      Swal.fire("Error", "Failed to update item", "error");
    }
  };

  const handleCancelItemEdit = () => {
    setEditingItemId(null);
    setEditingItemData({ itemName: "", maxCount: 10 });
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
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.delete(
          `${API_BASE_URL}/api/qa-sections-photos/${sectionId}/items/${itemNo}`
        );

        if (response.data.success) {
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Item deleted successfully",
            timer: 1500,
            showConfirmButton: false
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
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.delete(
          `${API_BASE_URL}/api/qa-sections-photos/${sectionId}`
        );

        if (response.data.success) {
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Section deleted successfully",
            timer: 1500,
            showConfirmButton: false
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
    setNewSectionName("");
    setNewItemList([{ no: 1, itemName: "", maxCount: 10 }]);
  };

  const handleCancelAddNew = () => {
    setIsAddingNew(false);
    setNewSectionName("");
    setNewItemList([]);
  };

  const handleAddNewItem = () => {
    const newNo =
      newItemList.length > 0
        ? Math.max(...newItemList.map((i) => i.no)) + 1
        : 1;
    setNewItemList([...newItemList, { no: newNo, itemName: "", maxCount: 10 }]);
  };

  const handleRemoveNewItem = (no) => {
    const filtered = newItemList.filter((item) => item.no !== no);
    // Re-number items
    const renumbered = filtered.map((item, index) => ({
      ...item,
      no: index + 1
    }));
    setNewItemList(renumbered);
  };

  const handleNewItemChange = (no, field, value) => {
    setNewItemList(
      newItemList.map((item) =>
        item.no === no ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSaveNewSection = async () => {
    if (!newSectionName.trim()) {
      Swal.fire("Validation Error", "Section name cannot be empty", "warning");
      return;
    }

    const validItems = newItemList.filter((item) => item.itemName.trim());
    if (validItems.length === 0) {
      Swal.fire(
        "Validation Error",
        "At least one item with a name is required",
        "warning"
      );
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections-photos`,
        {
          sectionName: newSectionName,
          itemList: validItems
        }
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Created!",
          text: "New section created successfully",
          timer: 1500,
          showConfirmButton: false
        });
        fetchSections();
        handleCancelAddNew();
      }
    } catch (error) {
      console.error("Error creating section:", error);
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to create section",
        "error"
      );
    }
  };

  // === ADD ITEM TO EXISTING SECTION ===
  const handleShowAddItemToSection = (sectionId) => {
    setAddingItemToSectionId(sectionId);
    setNewItemForSection({ itemName: "", maxCount: 10 });
  };

  const handleCancelAddItemToSection = () => {
    setAddingItemToSectionId(null);
    setNewItemForSection({ itemName: "", maxCount: 10 });
  };

  const handleSaveItemToSection = async (sectionId) => {
    if (!newItemForSection.itemName.trim()) {
      Swal.fire("Validation Error", "Item name cannot be empty", "warning");
      return;
    }

    if (newItemForSection.maxCount < 1) {
      Swal.fire("Validation Error", "Max count must be at least 1", "warning");
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections-photos/${sectionId}/items`,
        newItemForSection
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Added!",
          text: "Item added successfully",
          timer: 1500,
          showConfirmButton: false
        });
        fetchSections();
        handleCancelAddItemToSection();
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
    <div className="space-y-6">
      {/* Add New Section Button */}
      <div className="flex justify-end">
        <button
          onClick={handleShowAddNew}
          disabled={isAddingNew}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
        >
          <Plus size={18} />
          Add New Section
        </button>
      </div>

      {/* Add New Section Form */}
      {isAddingNew && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-6 rounded-lg shadow-lg border-2 border-indigo-200 dark:border-indigo-700">
          <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-300 mb-4">
            Add New Photo Section
          </h3>

          {/* Section Name */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Section Name
            </label>
            <input
              type="text"
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="Enter section name..."
              className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Item List */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Item List
            </label>
            <div className="space-y-3">
              {newItemList.map((item) => (
                <div
                  key={item.no}
                  className="flex gap-3 items-center bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <span className="text-sm font-bold text-gray-500 dark:text-gray-400 w-8">
                    {item.no}.
                  </span>
                  <input
                    type="text"
                    value={item.itemName}
                    onChange={(e) =>
                      handleNewItemChange(item.no, "itemName", e.target.value)
                    }
                    placeholder="Item name..."
                    className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500"
                  />
                  <input
                    type="number"
                    value={item.maxCount}
                    onChange={(e) =>
                      handleNewItemChange(
                        item.no,
                        "maxCount",
                        parseInt(e.target.value) || 1
                      )
                    }
                    min="1"
                    className="w-24 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    onClick={() => handleRemoveNewItem(item.no)}
                    className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    title="Remove item"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              ))}
              <button
                onClick={handleAddNewItem}
                className="w-full p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
              >
                + Add Item
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={handleCancelAddNew}
              className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-600"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              onClick={handleSaveNewSection}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
            >
              <Check size={16} />
              Save Section
            </button>
          </div>
        </div>
      )}

      {/* Manage Photos Section Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-700 dark:to-blue-700">
          <h2 className="text-xl font-bold text-white">
            Manage Photo Sections and Item List
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-1/4">
                  Section Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-2/5">
                  Item List
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-32">
                  Max Count
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider w-32">
                  Item Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sections.map((section) => (
                <React.Fragment key={section._id}>
                  {section.itemList.map((item, index) => (
                    <tr
                      key={`${section._id}-${item.no}`}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      {/* Section Name - only show on first row */}
                      {index === 0 && (
                        <td
                          rowSpan={
                            section.itemList.length +
                            (addingItemToSectionId === section._id ? 1 : 0)
                          }
                          className="px-6 py-4 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50"
                        >
                          {editingSectionId === section._id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editingSectionName}
                                onChange={(e) =>
                                  setEditingSectionName(e.target.value)
                                }
                                className="w-full p-2 border-2 border-indigo-300 dark:border-indigo-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500"
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() =>
                                    handleSaveSectionName(section._id)
                                  }
                                  className="flex-1 p-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs"
                                >
                                  <Save size={14} className="mx-auto" />
                                </button>
                                <button
                                  onClick={handleCancelSectionNameEdit}
                                  className="flex-1 p-1 bg-gray-500 text-white rounded hover:bg-gray-600 text-xs"
                                >
                                  <X size={14} className="mx-auto" />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <p className="font-bold text-gray-900 dark:text-gray-100">
                                {section.sectionName}
                              </p>
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => handleEditSectionName(section)}
                                  className="flex items-center justify-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded"
                                >
                                  <Edit2 size={12} />
                                  Edit Name
                                </button>
                                <button
                                  onClick={() =>
                                    handleShowAddItemToSection(section._id)
                                  }
                                  disabled={
                                    addingItemToSectionId === section._id
                                  }
                                  className="flex items-center justify-center gap-1 text-xs text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded disabled:opacity-50"
                                >
                                  <Plus size={12} />
                                  Add Item
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteSection(
                                      section._id,
                                      section.sectionName
                                    )
                                  }
                                  className="flex items-center justify-center gap-1 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded"
                                >
                                  <Trash2 size={12} />
                                  Delete Section
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                      )}

                      {/* Item Name */}
                      <td className="px-6 py-4">
                        {editingItemId === `${section._id}-${item.no}` ? (
                          <input
                            type="text"
                            value={editingItemData.itemName}
                            onChange={(e) =>
                              setEditingItemData({
                                ...editingItemData,
                                itemName: e.target.value
                              })
                            }
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm"
                          />
                        ) : (
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {item.no}. {item.itemName}
                          </span>
                        )}
                      </td>

                      {/* Max Count */}
                      <td className="px-6 py-4 text-center">
                        {editingItemId === `${section._id}-${item.no}` ? (
                          <input
                            type="number"
                            value={editingItemData.maxCount}
                            onChange={(e) =>
                              setEditingItemData({
                                ...editingItemData,
                                maxCount: parseInt(e.target.value) || 1
                              })
                            }
                            min="1"
                            className="w-20 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-sm text-center"
                          />
                        ) : (
                          <span className="inline-flex items-center justify-center px-3 py-1 text-sm font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                            {item.maxCount}
                          </span>
                        )}
                      </td>

                      {/* Item Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          {editingItemId === `${section._id}-${item.no}` ? (
                            <>
                              <button
                                onClick={() =>
                                  handleSaveItem(section._id, item.no)
                                }
                                className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md transition-all"
                                title="Save changes"
                              >
                                <Save size={16} />
                              </button>
                              <button
                                onClick={handleCancelItemEdit}
                                className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 shadow-md transition-all"
                                title="Cancel"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() =>
                                  handleEditItem(section._id, item)
                                }
                                className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all"
                                title="Edit item"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  handleDeleteItem(
                                    section._id,
                                    item.no,
                                    item.itemName
                                  )
                                }
                                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md transition-all"
                                title="Delete item"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Add Item Row - shows when adding item to this section */}
                  {addingItemToSectionId === section._id && (
                    <tr className="bg-green-50 dark:bg-green-900/20">
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={newItemForSection.itemName}
                          onChange={(e) =>
                            setNewItemForSection({
                              ...newItemForSection,
                              itemName: e.target.value
                            })
                          }
                          placeholder="New item name..."
                          className="w-full p-2 border-2 border-green-300 dark:border-green-600 rounded-md bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-6 py-4 text-center">
                        <input
                          type="number"
                          value={newItemForSection.maxCount}
                          onChange={(e) =>
                            setNewItemForSection({
                              ...newItemForSection,
                              maxCount: parseInt(e.target.value) || 1
                            })
                          }
                          min="1"
                          className="w-20 p-2 border-2 border-green-300 dark:border-green-600 rounded-md bg-white dark:bg-gray-700 text-sm text-center focus:ring-2 focus:ring-green-500"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleSaveItemToSection(section._id)}
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md transition-all"
                            title="Save new item"
                          >
                            <Save size={16} />
                          </button>
                          <button
                            onClick={handleCancelAddItemToSection}
                            className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 shadow-md transition-all"
                            title="Cancel"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {sections.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No sections available. Click "Add New Section" to create one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default YPivotQASectionsPhotos;
