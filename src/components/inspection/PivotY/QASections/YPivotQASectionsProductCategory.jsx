import axios from "axios";
import { Check, Edit2, Plus, Save, Trash2, X, Layers } from "lucide-react";
import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";

const YPivotQASectionsProductCategory = () => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [newCategory, setNewCategory] = useState({
    CategoryCode: "",
    CategoryNameEng: "",
    CategoryNameKhmer: "",
    CategoryNameChinese: ""
  });

  const [editData, setEditData] = useState({
    CategoryCode: "",
    CategoryNameEng: "",
    CategoryNameKhmer: "",
    CategoryNameChinese: ""
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections-defect-category`
      );
      if (response.data.success) {
        setCategories(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      Swal.fire("Error", "Failed to load categories", "error");
    } finally {
      setIsLoading(false);
    }
  };

  // === ADD NEW CATEGORY ===
  const handleShowAddNew = () => {
    setIsAddingNew(true);
    setNewCategory({
      CategoryCode: "",
      CategoryNameEng: "",
      CategoryNameKhmer: "",
      CategoryNameChinese: ""
    });
  };

  const handleCancelAddNew = () => {
    setIsAddingNew(false);
    setNewCategory({
      CategoryCode: "",
      CategoryNameEng: "",
      CategoryNameKhmer: "",
      CategoryNameChinese: ""
    });
  };

  const handleSaveNew = async () => {
    if (
      !newCategory.CategoryCode.trim() ||
      !newCategory.CategoryNameEng.trim()
    ) {
      Swal.fire(
        "Validation Error",
        "Category Code and English Name are required",
        "warning"
      );
      return;
    }

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections-defect-category`,
        newCategory
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Created!",
          text: `Category created with No: ${response.data.data.no}`,
          timer: 1500,
          showConfirmButton: false
        });
        fetchCategories();
        handleCancelAddNew();
      }
    } catch (error) {
      console.error("Error creating category:", error);
      Swal.fire(
        "Error",
        error.response?.data?.message || "Failed to create category",
        "error"
      );
    }
  };

  // === EDIT CATEGORY ===
  const handleEdit = (category) => {
    setEditingId(category._id);
    setEditData({
      CategoryCode: category.CategoryCode,
      CategoryNameEng: category.CategoryNameEng,
      CategoryNameKhmer: category.CategoryNameKhmer,
      CategoryNameChinese: category.CategoryNameChinese
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditData({
      CategoryCode: "",
      CategoryNameEng: "",
      CategoryNameKhmer: "",
      CategoryNameChinese: ""
    });
  };

  const handleSaveEdit = async (id) => {
    if (!editData.CategoryCode.trim() || !editData.CategoryNameEng.trim()) {
      Swal.fire(
        "Validation Error",
        "Category Code and English Name are required",
        "warning"
      );
      return;
    }

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/qa-sections-defect-category/${id}`,
        editData
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Category updated successfully",
          timer: 1500,
          showConfirmButton: false
        });
        fetchCategories();
        handleCancelEdit();
      }
    } catch (error) {
      console.error("Error updating category:", error);
      Swal.fire("Error", "Failed to update category", "error");
    }
  };

  // === DELETE CATEGORY ===
  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to delete "${name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.delete(
          `${API_BASE_URL}/api/qa-sections-defect-category/${id}`
        );

        if (response.data.success) {
          Swal.fire({
            icon: "success",
            title: "Deleted!",
            text: "Category deleted successfully",
            timer: 1500,
            showConfirmButton: false
          });
          fetchCategories();
        }
      } catch (error) {
        console.error("Error deleting category:", error);
        Swal.fire("Error", "Failed to delete category", "error");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
            Loading categories...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add New Category Button */}
      <div className="flex justify-end">
        <button
          onClick={handleShowAddNew}
          disabled={isAddingNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
        >
          <Plus size={18} />
          Add New Category
        </button>
      </div>

      {/* Add New Category Form */}
      {isAddingNew && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border-2 border-indigo-200 dark:border-indigo-700">
          <div className="flex items-center gap-3 mb-5">
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 rounded-lg shadow-md">
              <Plus size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                Add New Category
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Category No will be auto-generated
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Category Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newCategory.CategoryCode}
                onChange={(e) =>
                  setNewCategory({
                    ...newCategory,
                    CategoryCode: e.target.value
                  })
                }
                placeholder="e.g., ACC, SEW, FIN"
                className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                English Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={newCategory.CategoryNameEng}
                onChange={(e) =>
                  setNewCategory({
                    ...newCategory,
                    CategoryNameEng: e.target.value
                  })
                }
                placeholder="English name..."
                className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Khmer Name
              </label>
              <input
                type="text"
                value={newCategory.CategoryNameKhmer}
                onChange={(e) =>
                  setNewCategory({
                    ...newCategory,
                    CategoryNameKhmer: e.target.value
                  })
                }
                placeholder="ឈ្មោះជាភាសាខ្មែរ..."
                className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300">
                Chinese Name
              </label>
              <input
                type="text"
                value={newCategory.CategoryNameChinese}
                onChange={(e) =>
                  setNewCategory({
                    ...newCategory,
                    CategoryNameChinese: e.target.value
                  })
                }
                placeholder="中文名称..."
                className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all outline-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={handleCancelAddNew}
              className="flex items-center gap-2 px-5 py-2.5 bg-gray-500 dark:bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700 shadow-md transition-all"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              onClick={handleSaveNew}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 dark:bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 dark:hover:bg-green-700 shadow-md transition-all"
            >
              <Check size={16} />
              Save Category
            </button>
          </div>
        </div>
      )}

      {/* Manage Category Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-lg backdrop-blur-sm">
              <Layers size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Manage Categories
              </h2>
              <p className="text-indigo-100 text-xs mt-0.5">
                <span className="font-semibold text-white">
                  {categories.length}
                </span>{" "}
                Total Categories
                {editingId && (
                  <>
                    <span className="mx-2">•</span>
                    <span className="font-semibold text-white">1</span> Editing
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="max-h-[600px] overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider w-20">
                    No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    English
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    Khmer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                    Chinese
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider w-32">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {categories.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-full">
                          <Layers
                            size={28}
                            className="text-gray-400 dark:text-gray-500"
                          />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          No categories available. Click "Add New Category" to
                          create one.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  categories.map((category) => (
                    <tr
                      key={category._id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      {/* No - Not Editable */}
                      <td className="px-6 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-bold text-sm">
                          {category.no}
                        </span>
                      </td>

                      {/* Category Code */}
                      <td className="px-6 py-3">
                        {editingId === category._id ? (
                          <input
                            type="text"
                            value={editData.CategoryCode}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                CategoryCode: e.target.value
                              })
                            }
                            className="w-full px-3 py-2 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 outline-none"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {category.CategoryCode}
                          </span>
                        )}
                      </td>

                      {/* English */}
                      <td className="px-6 py-3">
                        {editingId === category._id ? (
                          <input
                            type="text"
                            value={editData.CategoryNameEng}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                CategoryNameEng: e.target.value
                              })
                            }
                            className="w-full px-3 py-2 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 outline-none"
                          />
                        ) : (
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {category.CategoryNameEng}
                          </span>
                        )}
                      </td>

                      {/* Khmer */}
                      <td className="px-6 py-3">
                        {editingId === category._id ? (
                          <input
                            type="text"
                            value={editData.CategoryNameKhmer}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                CategoryNameKhmer: e.target.value
                              })
                            }
                            className="w-full px-3 py-2 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 outline-none"
                          />
                        ) : (
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {category.CategoryNameKhmer || (
                              <span className="text-gray-400 dark:text-gray-500 italic">
                                -
                              </span>
                            )}
                          </span>
                        )}
                      </td>

                      {/* Chinese */}
                      <td className="px-6 py-3">
                        {editingId === category._id ? (
                          <input
                            type="text"
                            value={editData.CategoryNameChinese}
                            onChange={(e) =>
                              setEditData({
                                ...editData,
                                CategoryNameChinese: e.target.value
                              })
                            }
                            className="w-full px-3 py-2 text-sm border-2 border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 outline-none"
                          />
                        ) : (
                          <span className="text-sm text-gray-900 dark:text-gray-100">
                            {category.CategoryNameChinese || (
                              <span className="text-gray-400 dark:text-gray-500 italic">
                                -
                              </span>
                            )}
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-center gap-2">
                          {editingId === category._id ? (
                            <>
                              <button
                                onClick={() => handleSaveEdit(category._id)}
                                className="p-2 bg-green-500 dark:bg-green-600 text-white rounded-lg hover:bg-green-600 dark:hover:bg-green-700 shadow-sm transition-all transform hover:scale-110"
                                title="Save changes"
                              >
                                <Save size={16} />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-2 bg-gray-500 dark:bg-gray-600 text-white rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700 shadow-sm transition-all transform hover:scale-110"
                                title="Cancel"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => handleEdit(category)}
                                className="p-2 bg-blue-500 dark:bg-blue-600 text-white rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 shadow-sm transition-all transform hover:scale-110"
                                title="Edit category"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  handleDelete(
                                    category._id,
                                    category.CategoryNameEng
                                  )
                                }
                                className="p-2 bg-red-500 dark:bg-red-600 text-white rounded-lg hover:bg-red-600 dark:hover:bg-red-700 shadow-sm transition-all transform hover:scale-110"
                                title="Delete category"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        {categories.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-700 px-6 py-3 border-t border-gray-200 dark:border-gray-600">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Total:{" "}
              <span className="font-semibold text-gray-900 dark:text-white">
                {categories.length}
              </span>{" "}
              {categories.length === 1 ? "category" : "categories"}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YPivotQASectionsProductCategory;
