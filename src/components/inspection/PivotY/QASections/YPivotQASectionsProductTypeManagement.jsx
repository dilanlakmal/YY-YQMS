import axios from "axios";
import {
  Check,
  Edit,
  Plus,
  Save,
  Trash2,
  X,
  Search,
  Image as ImageIcon,
  Upload,
  Languages,
  Globe
} from "lucide-react";
import React, { useEffect, useMemo, useState, useRef } from "react";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";

// ====== MOVE COMPONENTS OUTSIDE ======

// Product Card Component (MOVED OUTSIDE)
const ProductCard = ({
  product,
  isEditing,
  formData,
  setFormData,
  imagePreview,
  selectedImage,
  fileInputRef,
  handleImageChange,
  removeImage,
  handleSave,
  handleCancel,
  handleEdit,
  handleDelete
}) => {
  if (isEditing) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-indigo-500 dark:border-indigo-400 overflow-hidden transform transition-all duration-300">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Edit size={18} />
              <span className="font-semibold text-sm">Editing Product</span>
            </div>
            <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold">
              No: {product.no}
            </span>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* English Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Globe size={14} className="text-indigo-500" />
              English Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="English name..."
              value={formData.EnglishProductName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  EnglishProductName: e.target.value
                })
              }
              className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all outline-none"
            />
          </div>

          {/* Khmer Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Languages size={14} className="text-purple-500" />
              Khmer Name
            </label>
            <input
              type="text"
              placeholder="ឈ្មោះជាភាសាខ្មែរ..."
              value={formData.KhmerProductName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  KhmerProductName: e.target.value
                })
              }
              className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all outline-none"
            />
          </div>

          {/* Chinese Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Languages size={14} className="text-blue-500" />
              Chinese Name
            </label>
            <input
              type="text"
              placeholder="中文名称..."
              value={formData.ChineseProductName}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  ChineseProductName: e.target.value
                })
              }
              className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all outline-none"
            />
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <ImageIcon size={14} className="text-green-500" />
              Product Image
            </label>
            <div className="flex flex-col items-center gap-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg shadow-md"
                  />
                  <button
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-all"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                  <ImageIcon
                    size={40}
                    className="text-gray-400 dark:text-gray-500"
                  />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current.click()}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-all text-sm font-medium"
              >
                <Upload size={16} />
                {imagePreview ? "Change Image" : "Upload Image"}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => handleSave(product._id)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 dark:bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 dark:hover:bg-green-700 shadow-md transition-all"
            >
              <Save size={16} />
              Save Changes
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-500 dark:bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700 shadow-md transition-all"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // View Mode
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transform hover:scale-105 transition-all duration-300">
      {/* Header with Number */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <ImageIcon size={16} className="text-white" />
            </div>
            <span className="text-white font-semibold text-sm">
              Product Type
            </span>
          </div>
          <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold">
            No: {product.no}
          </span>
        </div>
      </div>

      {/* Image Section */}
      <div className="p-4 bg-gray-50 dark:bg-gray-750">
        {product.imageURL ? (
          <img
            src={`${API_BASE_URL}/api/qa-sections-product-type/image/${product.imageURL
              .split("/")
              .pop()}`}
            alt={product.EnglishProductName}
            className="w-full h-48 object-cover rounded-lg shadow-md"
          />
        ) : (
          <div className="w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
            <ImageIcon size={48} className="text-gray-400 dark:text-gray-500" />
          </div>
        )}
      </div>

      {/* Content Section */}
      <div className="p-5 space-y-3">
        {/* English Name */}
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <Globe size={12} className="text-indigo-500" />
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              English
            </span>
          </div>
          <p className="text-base font-bold text-gray-900 dark:text-gray-100">
            {product.EnglishProductName}
          </p>
        </div>

        {/* Khmer Name */}
        {product.KhmerProductName && (
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Languages size={12} className="text-purple-500" />
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Khmer
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {product.KhmerProductName}
            </p>
          </div>
        )}

        {/* Chinese Name */}
        {product.ChineseProductName && (
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <Languages size={12} className="text-blue-500" />
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                Chinese
              </span>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {product.ChineseProductName}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="px-5 pb-5 flex gap-2">
        <button
          onClick={() => handleEdit(product)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 dark:bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 shadow-md transition-all"
        >
          <Edit size={16} />
          Edit
        </button>
        <button
          onClick={() => handleDelete(product._id, product.EnglishProductName)}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 dark:bg-red-600 text-white font-semibold rounded-lg hover:bg-red-600 dark:hover:bg-red-700 shadow-md transition-all"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};

// Add New Card Component (MOVED OUTSIDE)
const AddNewCard = ({
  formData,
  setFormData,
  imagePreview,
  fileInputRef,
  handleImageChange,
  removeImage,
  handleSave,
  handleCancel
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-green-500 dark:border-green-400 overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3">
        <div className="flex items-center gap-2 text-white">
          <Plus size={18} />
          <span className="font-semibold text-sm">Add New Product</span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* English Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Globe size={14} className="text-indigo-500" />
            English Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="English name..."
            value={formData.EnglishProductName}
            onChange={(e) =>
              setFormData({
                ...formData,
                EnglishProductName: e.target.value
              })
            }
            className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all outline-none"
          />
        </div>

        {/* Khmer Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Languages size={14} className="text-purple-500" />
            Khmer Name
          </label>
          <input
            type="text"
            placeholder="ឈ្មោះជាភាសាខ្មែរ..."
            value={formData.KhmerProductName}
            onChange={(e) =>
              setFormData({
                ...formData,
                KhmerProductName: e.target.value
              })
            }
            className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 dark:focus:ring-purple-800 transition-all outline-none"
          />
        </div>

        {/* Chinese Name */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <Languages size={14} className="text-blue-500" />
            Chinese Name
          </label>
          <input
            type="text"
            placeholder="中文名称..."
            value={formData.ChineseProductName}
            onChange={(e) =>
              setFormData({
                ...formData,
                ChineseProductName: e.target.value
              })
            }
            className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-800 transition-all outline-none"
          />
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <ImageIcon size={14} className="text-green-500" />
            Product Image
          </label>
          <div className="flex flex-col items-center gap-3 p-4 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg shadow-md"
                />
                <button
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-all"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <ImageIcon
                  size={40}
                  className="text-gray-400 dark:text-gray-500"
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleImageChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current.click()}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-all text-sm font-medium"
            >
              <Upload size={16} />
              {imagePreview ? "Change Image" : "Upload Image"}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => handleSave(null)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 dark:bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 dark:hover:bg-green-700 shadow-md transition-all"
          >
            <Save size={16} />
            Save Product
          </button>
          <button
            onClick={handleCancel}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-500 dark:bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-600 dark:hover:bg-gray-700 shadow-md transition-all"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ====== MAIN COMPONENT ======
const YPivotQASectionsProductTypeManagement = () => {
  const [productTypes, setProductTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    EnglishProductName: "",
    KhmerProductName: "",
    ChineseProductName: ""
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isImageMarkedForRemoval, setIsImageMarkedForRemoval] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchProductTypes();
  }, []);

  const fetchProductTypes = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections-product-type`
      );
      setProductTypes(response.data.data || []);
    } catch (error) {
      Swal.fire("Error", "Failed to load product types.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProductTypes = useMemo(() => {
    if (!filter) return productTypes;
    return productTypes.filter((pt) =>
      pt.EnglishProductName.toLowerCase().includes(filter.toLowerCase())
    );
  }, [productTypes, filter]);

  // --- FORM HANDLERS ---
  const handleAddNew = () => {
    setIsAddingNew(true);
    setFormData({
      EnglishProductName: "",
      KhmerProductName: "",
      ChineseProductName: ""
    });
    setSelectedImage(null);
    setImagePreview(null);
    setIsImageMarkedForRemoval(false);
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setFormData({
      EnglishProductName: product.EnglishProductName,
      KhmerProductName: product.KhmerProductName,
      ChineseProductName: product.ChineseProductName
    });
    setSelectedImage(null);
    setImagePreview(
      product.imageURL
        ? `${API_BASE_URL}/api/qa-sections-product-type/image/${product.imageURL
            .split("/")
            .pop()}`
        : null
    );
    setIsImageMarkedForRemoval(false);
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAddingNew(false);
    setFormData({
      EnglishProductName: "",
      KhmerProductName: "",
      ChineseProductName: ""
    });
    setSelectedImage(null);
    setImagePreview(null);
    setIsImageMarkedForRemoval(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
      setIsImageMarkedForRemoval(false);
    }
  };

  const handleSave = async (productId = null) => {
    if (!formData.EnglishProductName.trim()) {
      Swal.fire(
        "Validation Error",
        "English Product Name is required.",
        "warning"
      );
      return;
    }

    const data = new FormData();
    data.append("EnglishProductName", formData.EnglishProductName);
    data.append("KhmerProductName", formData.KhmerProductName);
    data.append("ChineseProductName", formData.ChineseProductName);
    if (selectedImage) {
      data.append("image", selectedImage);
    }

    if (productId && isImageMarkedForRemoval) {
      data.append("removeImage", "true");
    }

    const url = productId
      ? `${API_BASE_URL}/api/qa-sections-product-type/${productId}`
      : `${API_BASE_URL}/api/qa-sections-product-type`;

    const method = productId ? "put" : "post";

    try {
      await axios[method](url, data, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      Swal.fire(
        "Success",
        `Product Type ${productId ? "updated" : "created"} successfully!`,
        "success"
      );
      fetchProductTypes();
      handleCancel();
    } catch (error) {
      Swal.fire(
        "Error",
        error.response?.data?.message ||
          `Failed to ${productId ? "update" : "create"} product type.`,
        "error"
      );
    }
  };

  const handleDelete = async (id, name) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Delete "${name}"? This action cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!"
    });
    if (result.isConfirmed) {
      try {
        await axios.delete(
          `${API_BASE_URL}/api/qa-sections-product-type/${id}`
        );
        Swal.fire("Deleted!", "Product Type has been deleted.", "success");
        fetchProductTypes();
      } catch (error) {
        Swal.fire("Error", "Failed to delete product type.", "error");
      }
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setSelectedImage(null);
    if (editingId) {
      setIsImageMarkedForRemoval(true);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header with Search and Add Button */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-lg backdrop-blur-sm">
                <ImageIcon size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Product Type Management
                </h2>
                <p className="text-indigo-100 text-xs mt-0.5">
                  <span className="font-semibold text-white">
                    {productTypes.length}
                  </span>{" "}
                  Total Products
                  {filter && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="font-semibold text-white">
                        {filteredProductTypes.length}
                      </span>{" "}
                      Filtered
                    </>
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative w-full md:w-64">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-200"
                />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border-2 border-white/20 rounded-lg bg-white/10 backdrop-blur-sm text-white placeholder-white/60 focus:border-white/40 focus:ring-2 focus:ring-white/20 transition-all duration-200 outline-none"
                />
              </div>

              {/* Add New Button */}
              {!isAddingNew && (
                <button
                  onClick={handleAddNew}
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 whitespace-nowrap"
                >
                  <Plus size={18} />
                  Add New
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-indigo-200 dark:border-indigo-800 border-t-indigo-600 dark:border-t-indigo-400 rounded-full animate-spin"></div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
              Loading product types...
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Add New Card - Show First */}
          {isAddingNew && (
            <AddNewCard
              formData={formData}
              setFormData={setFormData}
              imagePreview={imagePreview}
              fileInputRef={fileInputRef}
              handleImageChange={handleImageChange}
              removeImage={removeImage}
              handleSave={handleSave}
              handleCancel={handleCancel}
            />
          )}

          {/* Product Cards */}
          {filteredProductTypes.length === 0 && !isAddingNew ? (
            <div className="col-span-full flex flex-col items-center justify-center py-16">
              <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
                <Search
                  size={40}
                  className="text-gray-400 dark:text-gray-500"
                />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
                No product types found
              </p>
              {filter && (
                <button
                  onClick={() => setFilter("")}
                  className="mt-3 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium flex items-center gap-1"
                >
                  <X size={16} />
                  Clear filter
                </button>
              )}
            </div>
          ) : (
            filteredProductTypes.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                isEditing={editingId === product._id}
                formData={formData}
                setFormData={setFormData}
                imagePreview={imagePreview}
                selectedImage={selectedImage}
                fileInputRef={fileInputRef}
                handleImageChange={handleImageChange}
                removeImage={removeImage}
                handleSave={handleSave}
                handleCancel={handleCancel}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default YPivotQASectionsProductTypeManagement;
