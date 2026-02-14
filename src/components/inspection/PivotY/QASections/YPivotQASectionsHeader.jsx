import axios from "axios";
import { Check, Edit2, Plus, Save, Trash2, X, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";

const YPivotQASectionsHeader = () => {
  const [sections, setSections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({
    MainTitle: "",
    MainTitleChinese: "",
    Options: [],
  });
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newRowData, setNewRowData] = useState({
    MainTitle: "",
    MainTitleChinese: "",
    Options: [],
  });

  // Fetch all sections on component mount
  useEffect(() => {
    fetchSections();
  }, []);

  const fetchSections = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/qa-sections-home`);
      if (response.data.success) {
        setSections(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching sections:", error);
      Swal.fire("Error", "Failed to load QA sections", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Start editing a row
  const handleEdit = (section) => {
    setEditingId(section._id);
    setEditData({
      MainTitle: section.MainTitle,
      MainTitleChinese: section.MainTitleChinese || "",
      Options: section.Options.map((opt) => ({
        OptionNo: opt.OptionNo,
        Name: opt.Name,
        NameChinese: opt.NameChinese || "",
      })),
    });
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({ MainTitle: "", MainTitleChinese: "", Options: [] });
  };

  // Save edited row
  const handleSaveEdit = async (id) => {
    if (!editData.MainTitle.trim()) {
      Swal.fire("Validation Error", "Main Title cannot be empty", "warning");
      return;
    }

    if (!editData.MainTitleChinese.trim()) {
      Swal.fire(
        "Validation Error",
        "Main Title (Chinese) cannot be empty",
        "warning",
      );
      return;
    }

    if (editData.Options.length === 0) {
      Swal.fire(
        "Validation Error",
        "At least one option is required",
        "warning",
      );
      return;
    }

    // Validate all options have both names
    for (const opt of editData.Options) {
      if (!opt.Name.trim() || !opt.NameChinese.trim()) {
        Swal.fire(
          "Validation Error",
          "All options must have both English and Chinese names",
          "warning",
        );
        return;
      }
    }

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/qa-sections-home/${id}`,
        editData,
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Section updated successfully",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchSections();
        handleCancelEdit();
      }
    } catch (error) {
      console.error("Error updating section:", error);
      Swal.fire("Error", "Failed to update section", "error");
    }
  };

  // Delete a row
  const handleDelete = async (id, title) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete "${title}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.delete(
          `${API_BASE_URL}/api/qa-sections-home/${id}`,
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

  // Add option to edit data
  const handleAddOption = () => {
    const newOptionNo =
      editData.Options.length > 0
        ? Math.max(...editData.Options.map((o) => o.OptionNo)) + 1
        : 1;

    setEditData({
      ...editData,
      Options: [
        ...editData.Options,
        { OptionNo: newOptionNo, Name: "", NameChinese: "" },
      ],
    });
  };

  // Remove option from edit data
  const handleRemoveOption = (optionNo) => {
    setEditData({
      ...editData,
      Options: editData.Options.filter((opt) => opt.OptionNo !== optionNo),
    });
  };

  // Update option name (English)
  const handleOptionNameChange = (optionNo, newName) => {
    setEditData({
      ...editData,
      Options: editData.Options.map((opt) =>
        opt.OptionNo === optionNo ? { ...opt, Name: newName } : opt,
      ),
    });
  };

  // Update option name (Chinese)
  const handleOptionNameChineseChange = (optionNo, newNameChinese) => {
    setEditData({
      ...editData,
      Options: editData.Options.map((opt) =>
        opt.OptionNo === optionNo
          ? { ...opt, NameChinese: newNameChinese }
          : opt,
      ),
    });
  };

  // === NEW ROW FUNCTIONS ===
  const handleShowAddNewRow = () => {
    setIsAddingNew(true);
    setNewRowData({
      MainTitle: "",
      MainTitleChinese: "",
      Options: [{ OptionNo: 1, Name: "", NameChinese: "" }],
    });
  };

  const handleCancelAddNew = () => {
    setIsAddingNew(false);
    setNewRowData({ MainTitle: "", MainTitleChinese: "", Options: [] });
  };

  const handleAddNewOption = () => {
    const newOptionNo =
      newRowData.Options.length > 0
        ? Math.max(...newRowData.Options.map((o) => o.OptionNo)) + 1
        : 1;

    setNewRowData({
      ...newRowData,
      Options: [
        ...newRowData.Options,
        { OptionNo: newOptionNo, Name: "", NameChinese: "" },
      ],
    });
  };

  const handleRemoveNewOption = (optionNo) => {
    setNewRowData({
      ...newRowData,
      Options: newRowData.Options.filter((opt) => opt.OptionNo !== optionNo),
    });
  };

  const handleNewOptionNameChange = (optionNo, newName) => {
    setNewRowData({
      ...newRowData,
      Options: newRowData.Options.map((opt) =>
        opt.OptionNo === optionNo ? { ...opt, Name: newName } : opt,
      ),
    });
  };

  const handleNewOptionNameChineseChange = (optionNo, newNameChinese) => {
    setNewRowData({
      ...newRowData,
      Options: newRowData.Options.map((opt) =>
        opt.OptionNo === optionNo
          ? { ...opt, NameChinese: newNameChinese }
          : opt,
      ),
    });
  };

  const handleConfirmAddNew = async () => {
    if (!newRowData.MainTitle.trim()) {
      Swal.fire("Validation Error", "Main Title cannot be empty", "warning");
      return;
    }

    if (!newRowData.MainTitleChinese.trim()) {
      Swal.fire(
        "Validation Error",
        "Main Title (Chinese) cannot be empty",
        "warning",
      );
      return;
    }

    // Filter and validate options
    const validOptions = newRowData.Options.filter(
      (opt) => opt.Name.trim() && opt.NameChinese.trim(),
    );

    if (validOptions.length === 0) {
      Swal.fire(
        "Validation Error",
        "At least one option with both English and Chinese names is required",
        "warning",
      );
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections-home`,
        {
          MainTitle: newRowData.MainTitle,
          MainTitleChinese: newRowData.MainTitleChinese,
          Options: validOptions,
        },
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Added!",
          text: "New section added successfully",
          timer: 1500,
          showConfirmButton: false,
        });
        fetchSections();
        handleCancelAddNew();
      }
    } catch (error) {
      console.error("Error adding new section:", error);
      Swal.fire("Error", "Failed to add new section", "error");
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
      {/* Add New Row Button */}
      <div className="flex justify-end">
        <button
          onClick={handleShowAddNewRow}
          disabled={isAddingNew}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md transition-all"
        >
          <Plus size={18} />
          Add New Row
        </button>
      </div>

      {/* Add New Row Form */}
      {isAddingNew && (
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-6 rounded-lg shadow-lg border-2 border-indigo-200 dark:border-indigo-700">
          <h3 className="text-lg font-bold text-indigo-700 dark:text-indigo-300 mb-4">
            Add New Section
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Main Data Input */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Main Data Title (English)
                </label>
                <input
                  type="text"
                  value={newRowData.MainTitle}
                  onChange={(e) =>
                    setNewRowData({ ...newRowData, MainTitle: e.target.value })
                  }
                  placeholder="Enter main data title..."
                  className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Main Data Title (Chinese) 中文標題
                </label>
                <input
                  type="text"
                  value={newRowData.MainTitleChinese}
                  onChange={(e) =>
                    setNewRowData({
                      ...newRowData,
                      MainTitleChinese: e.target.value,
                    })
                  }
                  placeholder="輸入中文標題..."
                  className="w-full p-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Options Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Selection Options
              </label>
              <div className="space-y-3">
                {newRowData.Options.map((option) => (
                  <div
                    key={option.OptionNo}
                    className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        Option {option.OptionNo}
                      </span>
                      <button
                        onClick={() => handleRemoveNewOption(option.OptionNo)}
                        className="ml-auto p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                        title="Remove option"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={option.Name}
                        onChange={(e) =>
                          handleNewOptionNameChange(
                            option.OptionNo,
                            e.target.value,
                          )
                        }
                        placeholder="Option name (English)"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                      <input
                        type="text"
                        value={option.NameChinese}
                        onChange={(e) =>
                          handleNewOptionNameChineseChange(
                            option.OptionNo,
                            e.target.value,
                          )
                        }
                        placeholder="選項名稱 (Chinese)"
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleAddNewOption}
                  className="w-full p-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 font-medium"
                >
                  + Add Option
                </button>
              </div>
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
              onClick={handleConfirmAddNew}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700"
            >
              <Check size={16} />
              Confirm
            </button>
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gradient-to-r from-indigo-600 to-blue-600 dark:from-indigo-700 dark:to-blue-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-1/4">
                  Main Data
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider w-1/2">
                  Options
                </th>
                <th className="px-6 py-4 text-center text-xs font-bold text-white uppercase tracking-wider w-1/4">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sections.map((section) => (
                <tr
                  key={section._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  {/* Main Data Column */}
                  <td className="px-6 py-4">
                    {editingId === section._id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editData.MainTitle}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              MainTitle: e.target.value,
                            })
                          }
                          placeholder="English title"
                          className="w-full p-2 border-2 border-indigo-300 dark:border-indigo-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          value={editData.MainTitleChinese}
                          onChange={(e) =>
                            setEditData({
                              ...editData,
                              MainTitleChinese: e.target.value,
                            })
                          }
                          placeholder="中文標題"
                          className="w-full p-2 border-2 border-orange-300 dark:border-orange-600 rounded-md bg-white dark:bg-gray-700 focus:ring-2 focus:ring-orange-500"
                        />
                      </div>
                    ) : (
                      <div>
                        <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {section.MainTitle}
                        </span>
                        <span className="block text-sm text-orange-600 dark:text-orange-400 mt-1">
                          {section.MainTitleChinese}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Options Column */}
                  <td className="px-6 py-4">
                    {editingId === section._id ? (
                      <div className="space-y-3">
                        {editData.Options.map((option) => (
                          <div
                            key={option.OptionNo}
                            className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                Option {option.OptionNo}
                              </span>
                              <button
                                onClick={() =>
                                  handleRemoveOption(option.OptionNo)
                                }
                                className="p-1.5 bg-red-500 text-white rounded-md hover:bg-red-600"
                                title="Remove option"
                              >
                                <XCircle size={12} />
                              </button>
                            </div>
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={option.Name}
                                onChange={(e) =>
                                  handleOptionNameChange(
                                    option.OptionNo,
                                    e.target.value,
                                  )
                                }
                                placeholder="English name"
                                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                              />
                              <input
                                type="text"
                                value={option.NameChinese}
                                onChange={(e) =>
                                  handleOptionNameChineseChange(
                                    option.OptionNo,
                                    e.target.value,
                                  )
                                }
                                placeholder="中文名稱"
                                className="w-full p-2 border border-orange-300 dark:border-orange-600 rounded-md bg-white dark:bg-gray-800 text-sm"
                              />
                            </div>
                          </div>
                        ))}
                        <button
                          onClick={handleAddOption}
                          className="w-full p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-md hover:bg-indigo-200 dark:hover:bg-indigo-900/50 text-sm font-medium"
                        >
                          + Add Option
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {section.Options.map((option) => (
                          <div
                            key={option.OptionNo}
                            className="inline-flex flex-col items-center px-3 py-2 rounded-lg text-sm font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-700"
                          >
                            <span>{option.Name}</span>
                            <span className="text-xs text-orange-600 dark:text-orange-400">
                              {option.NameChinese}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  {/* Actions Column */}
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      {editingId === section._id ? (
                        <>
                          <button
                            onClick={() => handleSaveEdit(section._id)}
                            className="p-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md transition-all"
                            title="Save changes"
                          >
                            <Save size={18} />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 shadow-md transition-all"
                            title="Cancel editing"
                          >
                            <X size={18} />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => handleEdit(section)}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md transition-all"
                            title="Edit section"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() =>
                              handleDelete(section._id, section.MainTitle)
                            }
                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md transition-all"
                            title="Delete section"
                          >
                            <Trash2 size={18} />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {sections.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">
              No sections available. Click "Add New Row" to create one.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default YPivotQASectionsHeader;
