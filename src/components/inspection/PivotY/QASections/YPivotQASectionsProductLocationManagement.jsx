import React, { useState, useEffect, useRef } from "react";
import {
  Upload,
  Save,
  X,
  Plus,
  Trash2,
  MapPin,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  Edit,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
} from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";
import { useTranslation } from "react-i18next";

const YPivotQASectionsProductLocationManagement = () => {
  // State management
  const { t } = useTranslation();
  const [productTypes, setProductTypes] = useState([]);
  const [selectedProductType, setSelectedProductType] = useState("");
  const [frontImage, setFrontImage] = useState(null);
  const [backImage, setBackImage] = useState(null);
  const [frontImagePreview, setFrontImagePreview] = useState(null);
  const [backImagePreview, setBackImagePreview] = useState(null);
  const [frontLocations, setFrontLocations] = useState([]);
  const [backLocations, setBackLocations] = useState([]);
  const [isMarkingFront, setIsMarkingFront] = useState(false);
  const [isMarkingBack, setIsMarkingBack] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savedConfigurations, setSavedConfigurations] = useState([]);
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [editingConfigId, setEditingConfigId] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState(null);

  // State for advanced editing
  const [editingLocationId, setEditingLocationId] = useState(null);
  const [editingLocationName, setEditingLocationName] = useState("");
  const [editingLocationNameChinese, setEditingLocationNameChinese] =
    useState(""); // ✅ NEW STATE
  const [draggingLocation, setDraggingLocation] = useState(null);

  const frontImageRef = useRef(null);
  const backImageRef = useRef(null);

  // Refs for hidden file inputs
  const frontFileInputRef = useRef(null);
  const backFileInputRef = useRef(null);

  // Fetch product types on mount
  useEffect(() => {
    fetchProductTypes();
    fetchSavedConfigurations();
  }, []);

  const fetchProductTypes = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections-product-type`,
      );
      if (response.data.success) {
        setProductTypes(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching product types:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to load product types",
      });
    }
  };

  const fetchSavedConfigurations = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections-product-location`,
      );
      if (response.data.success) {
        setSavedConfigurations(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching configurations:", error);
    }
  };

  // Handle image upload
  const handleImageUpload = (e, view) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "error",
        title: "Invalid File",
        text: "Please upload an image file",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({
        icon: "error",
        title: "File Too Large",
        text: "Please upload an image smaller than 10MB",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (view === "front") {
        setFrontImage(file);
        setFrontImagePreview(reader.result);
        setFrontLocations([]);
      } else {
        setBackImage(file);
        setBackImagePreview(reader.result);
        setBackLocations([]);
      }
    };
    reader.readAsDataURL(file);
  };

  //handle image change
  const handleImageChange = (e, view) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      Swal.fire({
        icon: "error",
        title: "Invalid File",
        text: "Please upload an image file",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      Swal.fire({
        icon: "error",
        title: "File Too Large",
        text: "Please upload an image smaller than 10MB",
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (view === "front") {
        setFrontImage(file); // Update state for upload
        setFrontImagePreview(reader.result); // Update preview
        // NOTE: We do NOT clear locations here, unlike handleImageUpload
      } else {
        setBackImage(file);
        setBackImagePreview(reader.result);
        // NOTE: We do NOT clear locations here
      }
    };
    reader.readAsDataURL(file);

    // Reset input so you can select the same file again if needed
    e.target.value = null;
  };

  // ✅ MODIFIED: Handle image click to mark location with Dual Inputs
  const handleImageClick = async (e, view) => {
    const isMarking = view === "front" ? isMarkingFront : isMarkingBack;
    if (!isMarking) return;

    // Use currentTarget (the image itself) for accurate coordinates
    const rect = e.currentTarget.getBoundingClientRect();

    // Calculate percentage based on the IMAGE dimensions, not the container
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    // Using SweetAlert2 with HTML content for multiple inputs
    const { value: formValues } = await Swal.fire({
      title: t("fincheckProductLocation.alerts.addLocationTitle"), // Translated
      html:
        `<input id="swal-input1" class="swal2-input" placeholder="${t("fincheckProductLocation.alerts.englishPlaceholder")}">` +
        `<input id="swal-input2" class="swal2-input" placeholder="${t("fincheckProductLocation.alerts.chinesePlaceholder")}">`,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: t("fincheckProductLocation.alerts.addLocationTitle"),
      confirmButtonColor: "#6366f1",
      cancelButtonText: t("fincheckProductLocation.cancel"), // Added cancel button text
      preConfirm: () => {
        const englishName = document.getElementById("swal-input1").value;
        const chineseName = document.getElementById("swal-input2").value;
        if (!englishName) {
          Swal.showValidationMessage(
            t("fincheckProductLocation.alerts.englishRequired"),
          );
        }
        return { englishName, chineseName };
      },
    });

    if (formValues) {
      const locations = view === "front" ? frontLocations : backLocations;
      const newLocation = {
        LocationNo: locations.length + 1,
        LocationName: formValues.englishName,
        LocationNameChinese: formValues.chineseName || "", // ✅ NEW FIELD
        x: x,
        y: y,
        tempId: Date.now(),
      };

      if (view === "front") {
        setFrontLocations([...frontLocations, newLocation]);
      } else {
        setBackLocations([...backLocations, newLocation]);
      }

      Swal.fire({
        icon: "success",
        title: t("fincheckProductLocation.alerts.locationAddedTitle"),
        text: t("fincheckProductLocation.alerts.locationAddedText", {
          name: formValues.englishName,
        }),
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  const removeLocation = (location, view) => {
    Swal.fire({
      title: t("fincheckProductLocation.alerts.removeLocationTitle"),
      text: t("fincheckProductLocation.alerts.removeLocationConfirm", {
        name: location.LocationName,
      }),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: t("fincheckProductLocation.alerts.yesRemove"),
      cancelButtonText: t("fincheckProductLocation.cancel"),
    }).then((result) => {
      if (result.isConfirmed) {
        const idToRemove = location._id || location.tempId;
        if (view === "front") {
          const updated = frontLocations
            .filter((loc) => (loc._id || loc.tempId) !== idToRemove)
            .map((loc, index) => ({ ...loc, LocationNo: index + 1 }));
          setFrontLocations(updated);
        } else {
          const updated = backLocations
            .filter((loc) => (loc._id || loc.tempId) !== idToRemove)
            .map((loc, index) => ({ ...loc, LocationNo: index + 1 }));
          setBackLocations(updated);
        }
      }
    });
  };

  // ✅ MODIFIED: Handle Edit to populate both fields
  const handleEditLocationName = (location) => {
    setEditingLocationId(location._id || location.tempId);
    setEditingLocationName(location.LocationName);
    setEditingLocationNameChinese(location.LocationNameChinese || ""); // Populate Chinese Name
  };

  // ✅ MODIFIED: Save both fields
  const handleSaveLocationName = (location, view) => {
    const idToUpdate = location._id || location.tempId;
    const updateFn = (locations) =>
      locations.map((loc) =>
        (loc._id || loc.tempId) === idToUpdate
          ? {
              ...loc,
              LocationName: editingLocationName,
              LocationNameChinese: editingLocationNameChinese,
            }
          : loc,
      );

    if (view === "front") {
      setFrontLocations(updateFn);
    } else {
      setBackLocations(updateFn);
    }
    setEditingLocationId(null);
    setEditingLocationName("");
    setEditingLocationNameChinese("");
  };

  const handleDragStart = (e, location, view) => {
    e.preventDefault();
    setDraggingLocation({ ...location, view });
  };

  const handleDragMove = (e, view) => {
    if (!draggingLocation || draggingLocation.view !== view) return;

    const imageRef = view === "front" ? frontImageRef : backImageRef;
    if (!imageRef.current) return;

    // Calculate relative to the image element reference
    const rect = imageRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    const idToUpdate = draggingLocation._id || draggingLocation.tempId;
    const updateFn = (locations) =>
      locations.map((loc) =>
        (loc._id || loc.tempId) === idToUpdate ? { ...loc, x, y } : loc,
      );

    if (view === "front") {
      setFrontLocations(updateFn);
    } else {
      setBackLocations(updateFn);
    }
  };

  const handleDragEnd = () => {
    setDraggingLocation(null);
  };

  // Save configuration
  const handleSave = async () => {
    if (!selectedProductType) {
      Swal.fire({
        icon: "error",
        title: t("fincheckProductLocation.alerts.validationError"),
        text: t("fincheckProductLocation.alerts.selectTypeError"),
      });
      return;
    }

    if (!editingConfigId && (!frontImage || !backImage)) {
      Swal.fire({
        icon: "error",
        title: t("fincheckProductLocation.alerts.validationError"),
        text: t("fincheckProductLocation.alerts.uploadBothError"),
      });
      return;
    }

    if (frontLocations.length === 0 && backLocations.length === 0) {
      const result = await Swal.fire({
        icon: "warning",
        title: t("fincheckProductLocation.alerts.noLocTitle"),
        text: t("fincheckProductLocation.alerts.noLocText"),
        showCancelButton: true,
        confirmButtonText: t("fincheckProductLocation.alerts.yesContinue"),
        cancelButtonText: t("fincheckProductLocation.alerts.goBack"),
        confirmButtonColor: "#6366f1",
        cancelButtonColor: "#6b7280",
      });
      if (!result.isConfirmed) return;
    }

    if (editingConfigId) {
      submitUpdateData();
    } else {
      submitCreateData();
    }
  };

  const submitCreateData = async () => {
    setLoading(true);
    try {
      const productTypeObj = productTypes.find(
        (pt) => pt._id === selectedProductType,
      );
      const formData = new FormData();
      formData.append("productTypeId", selectedProductType);
      formData.append(
        "productTypeName",
        productTypeObj?.EnglishProductName || "Unknown",
      );
      formData.append("frontView", frontImage);
      formData.append("backView", backImage);
      formData.append("frontLocations", JSON.stringify(frontLocations));
      formData.append("backLocations", JSON.stringify(backLocations));

      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections-product-location`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (response.data.success) {
        await Swal.fire({
          icon: "success",
          title: "Success!",
          text: "Configuration saved successfully",
        });
        resetForm();
        fetchSavedConfigurations();
        setShowCreateForm(false);
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to save configuration",
      });
    } finally {
      setLoading(false);
    }
  };

  const submitUpdateData = async () => {
    setLoading(true);
    try {
      const formData = new FormData();
      if (frontImage) formData.append("frontView", frontImage);
      if (backImage) formData.append("backView", backImage);

      formData.append("frontLocations", JSON.stringify(frontLocations));
      formData.append("backLocations", JSON.stringify(backLocations));

      const response = await axios.put(
        `${API_BASE_URL}/api/qa-sections-product-location/${editingConfigId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (response.data.success) {
        await Swal.fire({
          icon: "success",
          title: "Updated!",
          text: "Configuration updated successfully",
        });
        resetForm();
        fetchSavedConfigurations();
        setShowCreateForm(false);
      }
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.response?.data?.message || "Failed to update configuration",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedProductType("");
    setFrontImage(null);
    setBackImage(null);
    setFrontImagePreview(null);
    setBackImagePreview(null);
    setFrontLocations([]);
    setBackLocations([]);
    setIsMarkingFront(false);
    setIsMarkingBack(false);
    setEditingConfigId(null);
  };

  const deleteConfiguration = async (id) => {
    const result = await Swal.fire({
      title: t("fincheckProductLocation.alerts.deleteTitle"),
      text: t("fincheckProductLocation.alerts.deleteText"),
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: t("fincheckProductLocation.alerts.yesDelete"),
      cancelButtonText: t("fincheckProductLocation.cancel"),
    });

    if (result.isConfirmed) {
      try {
        const response = await axios.delete(
          `${API_BASE_URL}/api/qa-sections-product-location/${id}`,
        );

        if (response.data.success) {
          await Swal.fire({
            icon: "success",
            title: t("fincheckProductLocation.alerts.deletedTitle"),
            text: t("fincheckProductLocation.alerts.deletedText"),
            timer: 1500,
            showConfirmButton: false,
          });
          fetchSavedConfigurations();
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            error.response?.data?.message || "Failed to delete configuration",
        });
      }
    }
  };

  const handleEditConfiguration = (config) => {
    setEditingConfigId(config._id);
    setSelectedProductType(config.productTypeId._id);
    setFrontLocations(config.frontView.locations);
    setBackLocations(config.backView.locations);

    setFrontImagePreview(
      `${API_BASE_URL}/api/qa-sections-product-location/image/${config.frontView.imagePath
        .split("/")
        .pop()}`,
    );
    setBackImagePreview(
      `${API_BASE_URL}/api/qa-sections-product-location/image/${config.backView.imagePath
        .split("/")
        .pop()}`,
    );

    setFrontImage(null);
    setBackImage(null);
    setShowCreateForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ✅ MODIFIED: Render tooltip with both languages
  const renderLocationMarkers = (locations, color = "red", view) => {
    return locations.map((location) => {
      const isEditingThisLocation =
        editingLocationId === (location._id || location.tempId);

      return (
        <div
          key={location.LocationNo || location._id || location.tempId}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
          style={{
            left: `${location.x}%`,
            top: `${location.y}%`,
          }}
          onMouseEnter={() => setHoveredLocation(location)}
          onMouseLeave={() => setHoveredLocation(null)}
          onMouseDown={(e) => handleDragStart(e, location, view)}
        >
          <div className="relative">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white shadow-lg transition-transform ${
                draggingLocation
                  ? "cursor-grabbing"
                  : "cursor-grab hover:scale-110"
              } ${
                isEditingThisLocation
                  ? "ring-4 ring-offset-2 ring-yellow-400 animate-pulse"
                  : ""
              }`}
              style={{
                backgroundColor: color === "red" ? "#ef4444" : "#3b82f6",
              }}
            >
              {location.LocationNo}
            </div>
            {hoveredLocation?.LocationNo === location.LocationNo && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded whitespace-nowrap z-10 shadow-lg">
                <div className="font-semibold text-amber-300">
                  Location {location.LocationNo}
                </div>
                <div className="font-bold">{location.LocationName}</div>
                {location.LocationNameChinese && (
                  <div className="text-gray-300 text-[10px]">
                    {location.LocationNameChinese}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    });
  };

  // Configuration Card Component
  const ConfigurationCard = ({ config }) => {
    const isExpanded = expandedCardId === config._id;
    const totalLocations =
      config.frontView.locations.length + config.backView.locations.length;

    // Helper to handle image download
    const handleDownloadImage = async (imagePath, type, productName) => {
      try {
        // Extract filename from the relative path stored in DB
        const filename = imagePath.split("/").pop();
        const url = `${API_BASE_URL}/api/qa-sections-product-location/image/${filename}`;

        const response = await axios.get(url, {
          responseType: "blob", // Important for handling binary data
        });

        // Create a temporary URL for the blob
        const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = blobUrl;

        // Set download filename (e.g., Hoodie_FrontView.jpg)
        link.setAttribute("download", `${productName}_${type}_${filename}`);

        document.body.appendChild(link);
        link.click();

        // Cleanup
        link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch (error) {
        console.error("Download failed:", error);
        Swal.fire({
          icon: "error",
          title: "Download Failed",
          text: "Could not download the image.",
        });
      }
    };

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden transform hover:scale-105 transition-all duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <MapPin size={18} className="text-white" />
              </div>
              <span className="text-white font-semibold text-sm">
                {t("fincheckProductLocation.configuration")}
              </span>
            </div>
            <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold">
              {totalLocations} {t("fincheckProductLocation.locations")}
            </span>
          </div>
        </div>

        {/* Product Name */}
        <div className="px-5 py-4 bg-gray-50 dark:bg-gray-750">
          <h4
            className="font-bold text-lg text-gray-900 dark:text-gray-700 truncate"
            title={config.productTypeName}
          >
            {config.productTypeName}
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Created: {new Date(config.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Images Grid */}
        <div className="px-5 py-4 space-y-4">
          {/* Front View */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {t("fincheckProductLocation.frontView")} (
                  {config.frontView.locations.length})
                </span>
              </div>
              <button
                onClick={() =>
                  handleDownloadImage(
                    config.frontView.imagePath,
                    "FrontView",
                    config.productTypeName,
                  )
                }
                className="p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-md transition-colors"
                title="Download Front View"
              >
                <Download size={14} />
              </button>
            </div>

            {/* FIXED: Using Flex center + relative inline-block wrapper to ensure perfect positioning */}
            <div className="h-80 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
              <div className="relative inline-block">
                <img
                  src={`${API_BASE_URL}/api/qa-sections-product-location/image/${config.frontView.imagePath
                    .split("/")
                    .pop()}`}
                  alt="Front View"
                  className="max-h-80 w-auto max-w-full object-contain block"
                  onError={(e) => {
                    e.target.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ddd' width='400' height='300'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EImage not found%3C/text%3E%3C/svg%3E";
                  }}
                />
                {renderLocationMarkers(config.frontView.locations, "red")}
              </div>
            </div>
          </div>

          {/* Back View */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {t("fincheckProductLocation.backView")} (
                  {config.backView.locations.length})
                </span>
              </div>
              <button
                onClick={() =>
                  handleDownloadImage(
                    config.backView.imagePath,
                    "BackView",
                    config.productTypeName,
                  )
                }
                className="p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-md transition-colors"
                title="Download Back View"
              >
                <Download size={14} />
              </button>
            </div>

            {/* FIXED: Using Flex center + relative inline-block wrapper */}
            <div className="h-80 border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden">
              <div className="relative inline-block">
                <img
                  src={`${API_BASE_URL}/api/qa-sections-product-location/image/${config.backView.imagePath
                    .split("/")
                    .pop()}`}
                  alt="Back View"
                  className="max-h-80 w-auto max-w-full object-contain block"
                  onError={(e) => {
                    e.target.src =
                      "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23ddd' width='400' height='300'/%3E%3Ctext fill='%23999' x='50%25' y='50%25' text-anchor='middle' dy='.3em'%3EImage not found%3C/text%3E%3C/svg%3E";
                  }}
                />
                {renderLocationMarkers(config.backView.locations, "blue")}
              </div>
            </div>
          </div>
        </div>

        {/* ✅ MODIFIED: Expandable List showing English + Chinese */}
        {isExpanded && (
          <div className="px-5 pb-4 space-y-3">
            {/* Front Locations */}
            {config.frontView.locations.length > 0 && (
              <div className="bg-red-50 dark:bg-red-900/10 rounded-lg p-3 border border-red-200 dark:border-red-800">
                <h5 className="font-semibold text-xs text-red-700 dark:text-red-300 mb-2">
                  {t("fincheckProductLocation.frontLocationsTitle")}
                </h5>
                <div className="space-y-1.5">
                  {config.frontView.locations.map((loc) => (
                    <div
                      key={loc._id}
                      className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300"
                    >
                      <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {loc.LocationNo}
                      </span>
                      {/* ✅ MODIFIED: Inline Chinese Name in brackets */}
                      <div className="flex-1 font-medium">
                        {loc.LocationName}
                        {loc.LocationNameChinese && (
                          <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
                            ({loc.LocationNameChinese})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Back Locations */}
            {config.backView.locations.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/10 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
                <h5 className="font-semibold text-xs text-blue-700 dark:text-blue-300 mb-2">
                  {t("fincheckProductLocation.backLocationsTitle")}
                </h5>
                <div className="space-y-1.5">
                  {config.backView.locations.map((loc) => (
                    <div
                      key={loc._id}
                      className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300"
                    >
                      <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                        {loc.LocationNo}
                      </span>
                      {/* ✅ MODIFIED: Inline Chinese Name in brackets */}
                      <div className="flex-1 font-medium">
                        {loc.LocationName}
                        {loc.LocationNameChinese && (
                          <span className="text-gray-500 dark:text-gray-400 font-normal ml-1">
                            ({loc.LocationNameChinese})
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="px-5 pb-5 space-y-2">
          <button
            onClick={() => setExpandedCardId(isExpanded ? null : config._id)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-all text-sm font-medium"
          >
            {isExpanded ? (
              <>
                <ChevronUp size={16} />
                {t("fincheckProductLocation.hideDetails")}
              </>
            ) : (
              <>
                <ChevronDown size={16} />
                {t("fincheckProductLocation.showDetails")}
              </>
            )}
          </button>

          <div className="flex gap-2">
            <button
              onClick={() => handleEditConfiguration(config)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-500 dark:bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 shadow-md transition-all"
            >
              <Edit size={16} />
              {t("fincheckProductLocation.edit")}
            </button>
            <button
              onClick={() => deleteConfiguration(config._id)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 dark:bg-red-600 text-white font-semibold rounded-lg hover:bg-red-600 dark:hover:bg-red-700 shadow-md transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2.5 rounded-lg backdrop-blur-sm">
                <MapPin size={22} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {t("fincheckProductLocation.title")}
                </h2>
                <p className="text-indigo-100 text-xs mt-0.5">
                  <span className="font-semibold text-white">
                    {savedConfigurations.length}
                  </span>{" "}
                  {t("fincheckProductLocation.totalConfig")}
                </p>
              </div>
            </div>

            {!showCreateForm && (
              <button
                onClick={() => {
                  setShowCreateForm(true);
                  resetForm();
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-indigo-50 shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <Plus size={18} />
                {t("fincheckProductLocation.createNew")}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 border-indigo-500 dark:border-indigo-400 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
              {editingConfigId ? (
                <>
                  <Edit size={20} className="text-indigo-600" />
                  {t("fincheckProductLocation.editTitle")}
                </>
              ) : (
                <>
                  <Plus size={20} className="text-indigo-600" />
                  {t("fincheckProductLocation.createTitle")}
                </>
              )}
            </h3>
            <button
              onClick={() => {
                setShowCreateForm(false);
                resetForm();
              }}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
            >
              <X size={20} />
            </button>
          </div>

          {/* Product Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              {t("fincheckProductLocation.selectProductType")}{" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProductType}
              onChange={(e) => setSelectedProductType(e.target.value)}
              disabled={!!editingConfigId}
              className={`w-full px-4 py-3 text-sm border-2 border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition-all outline-none ${
                editingConfigId
                  ? "bg-gray-100 dark:bg-gray-800 cursor-not-allowed"
                  : ""
              }`}
            >
              <option value="">
                {t("fincheckProductLocation.selectPlaceholder")}
              </option>
              {productTypes.map((type) => {
                const configuredTypeIds = savedConfigurations.map(
                  (c) => c.productTypeId._id,
                );
                const isConfigured = configuredTypeIds.includes(type._id);
                const isCurrentlyEditing =
                  editingConfigId && type._id === selectedProductType;
                const isDisabled = isConfigured && !isCurrentlyEditing;

                return (
                  <option key={type._id} value={type._id} disabled={isDisabled}>
                    {type.EnglishProductName}
                    {type.ChineseProductName && ` (${type.ChineseProductName})`}
                    {isDisabled &&
                      ` ${t("fincheckProductLocation.alreadyConfigured")}`}
                  </option>
                );
              })}
            </select>
            {editingConfigId && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
                {t("fincheckProductLocation.typeChangeWarning")}
              </p>
            )}
          </div>

          {/* Image Upload Section */}
          {selectedProductType && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Front View */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      {t("fincheckProductLocation.frontView")}
                    </h4>
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                      {frontLocations.length}{" "}
                      {frontLocations.length !== 1
                        ? t("fincheckProductLocation.locations")
                        : t("fincheckProductLocation.location")}
                    </span>
                  </div>

                  {!frontImagePreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-semibold">
                            {t("fincheckProductLocation.clickUpload")}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {t("fincheckProductLocation.uploadHint")}
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "front")}
                      />
                    </label>
                  ) : (
                    <div className="space-y-3">
                      <div
                        className="h-96 border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 flex items-center justify-center"
                        onMouseMove={(e) => handleDragMove(e, "front")}
                        onMouseUp={handleDragEnd}
                        onMouseLeave={handleDragEnd}
                      >
                        <div className="relative inline-block">
                          <img
                            ref={frontImageRef}
                            src={frontImagePreview}
                            alt="Front View"
                            className={`max-h-96 w-auto max-w-full object-contain block ${
                              isMarkingFront
                                ? "cursor-crosshair"
                                : "cursor-default"
                            }`}
                            onClick={(e) => handleImageClick(e, "front")}
                          />
                          {renderLocationMarkers(
                            frontLocations,
                            "red",
                            "front",
                          )}
                        </div>
                      </div>

                      <input
                        type="file"
                        ref={frontFileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, "front")}
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsMarkingFront(!isMarkingFront)}
                          className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                            isMarkingFront
                              ? "bg-indigo-600 text-white shadow-md"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                          }`}
                        >
                          <MapPin className="w-4 h-4 inline mr-1.5" />
                          {isMarkingFront
                            ? t("fincheckProductLocation.markingOn")
                            : t("fincheckProductLocation.markLocations")}
                        </button>
                        <button
                          onClick={() => frontFileInputRef.current.click()}
                          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          title={t("fincheckProductLocation.changeImage")}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setFrontImage(null);
                            setFrontImagePreview(null);
                            setFrontLocations([]);
                            setIsMarkingFront(false);
                          }}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          title={t("fincheckProductLocation.removeImage")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* ✅ MODIFIED: Inline Editor for Both Names */}
                      {frontLocations.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                          <h5 className="font-semibold text-xs text-gray-700 dark:text-gray-300 mb-2">
                            {t("fincheckProductLocation.markedLocations")}
                          </h5>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {frontLocations.map((loc) => {
                              const isEditing =
                                editingLocationId === (loc._id || loc.tempId);
                              return (
                                <div
                                  key={loc._id || loc.tempId}
                                  className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600"
                                >
                                  <div className="flex items-center gap-2 flex-grow">
                                    <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                      {loc.LocationNo}
                                    </span>
                                    {isEditing ? (
                                      <div className="flex flex-col gap-1 w-full">
                                        <input
                                          type="text"
                                          placeholder="English Name"
                                          value={editingLocationName}
                                          onChange={(e) =>
                                            setEditingLocationName(
                                              e.target.value,
                                            )
                                          }
                                          className="text-xs p-1 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                          autoFocus
                                        />
                                        <input
                                          type="text"
                                          placeholder="Chinese Name"
                                          value={editingLocationNameChinese}
                                          onChange={(e) =>
                                            setEditingLocationNameChinese(
                                              e.target.value,
                                            )
                                          }
                                          className="text-xs p-1 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex flex-col">
                                        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                                          {loc.LocationName}
                                        </span>
                                        {loc.LocationNameChinese && (
                                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                            {loc.LocationNameChinese}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 ml-2">
                                    {isEditing ? (
                                      <>
                                        <button
                                          onClick={() =>
                                            handleSaveLocationName(loc, "front")
                                          }
                                          title={t(
                                            "fincheckProductLocation.saveName",
                                          )}
                                        >
                                          <Check className="w-3.5 h-3.5 text-green-500" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            setEditingLocationId(null)
                                          }
                                          title={t(
                                            "fincheckProductLocation.cancel",
                                          )}
                                        >
                                          <X className="w-3.5 h-3.5 text-gray-500" />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() =>
                                            handleEditLocationName(loc)
                                          }
                                          title={t(
                                            "fincheckProductLocation.editName",
                                          )}
                                        >
                                          <Edit className="w-3.5 h-3.5 text-blue-500" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            removeLocation(loc, "front")
                                          }
                                          title={t(
                                            "fincheckProductLocation.removeLoc",
                                          )}
                                        >
                                          <X className="w-3.5 h-3.5 text-red-500" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Back View */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800 dark:text-white flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      {t("fincheckProductLocation.backView")}
                    </h4>
                    <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
                      {backLocations.length} location
                      {backLocations.length !== 1
                        ? t("fincheckProductLocation.locations")
                        : t("fincheckProductLocation.location")}
                    </span>
                  </div>

                  {!backImagePreview ? (
                    <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700/30 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 text-gray-400 mb-2" />
                        <p className="mb-1 text-sm text-gray-600 dark:text-gray-400">
                          <span className="font-semibold">
                            {t("fincheckProductLocation.clickUpload")}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-500">
                          {t("fincheckProductLocation.uploadHint")}
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e, "back")}
                      />
                    </label>
                  ) : (
                    <div className="space-y-3">
                      <div
                        className="h-96 border-2 border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900 flex items-center justify-center"
                        onMouseMove={(e) => handleDragMove(e, "back")}
                        onMouseUp={handleDragEnd}
                        onMouseLeave={handleDragEnd}
                      >
                        <div className="relative inline-block">
                          <img
                            ref={backImageRef}
                            src={backImagePreview}
                            alt="Back View"
                            className={`max-h-96 w-auto max-w-full object-contain block ${
                              isMarkingBack
                                ? "cursor-crosshair"
                                : "cursor-default"
                            }`}
                            onClick={(e) => handleImageClick(e, "back")}
                          />
                          {renderLocationMarkers(backLocations, "blue", "back")}
                        </div>
                      </div>

                      <input
                        type="file"
                        ref={backFileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => handleImageChange(e, "back")}
                      />

                      <div className="flex gap-2">
                        <button
                          onClick={() => setIsMarkingBack(!isMarkingBack)}
                          className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition-all ${
                            isMarkingBack
                              ? "bg-indigo-600 text-white shadow-md"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                          }`}
                        >
                          <MapPin className="w-4 h-4 inline mr-1.5" />
                          {isMarkingBack
                            ? t("fincheckProductLocation.markingOn")
                            : t("fincheckProductLocation.markLocations")}
                        </button>

                        <button
                          onClick={() => backFileInputRef.current.click()}
                          className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                          title={t("fincheckProductLocation.changeImage")}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setBackImage(null);
                            setBackImagePreview(null);
                            setBackLocations([]);
                            setIsMarkingBack(false);
                          }}
                          className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          title={t("fincheckProductLocation.removeImage")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* ✅ MODIFIED: Inline Editor for Both Names (Back) */}
                      {backLocations.length > 0 && (
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 border border-gray-200 dark:border-gray-600">
                          <h5 className="font-semibold text-xs text-gray-700 dark:text-gray-300 mb-2">
                            {t("fincheckProductLocation.markedLocations")}
                          </h5>
                          <div className="space-y-1.5 max-h-48 overflow-y-auto">
                            {backLocations.map((loc) => {
                              const isEditing =
                                editingLocationId === (loc._id || loc.tempId);
                              return (
                                <div
                                  key={loc._id || loc.tempId}
                                  className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600"
                                >
                                  <div className="flex items-center gap-2 flex-grow">
                                    <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0">
                                      {loc.LocationNo}
                                    </span>
                                    {isEditing ? (
                                      <div className="flex flex-col gap-1 w-full">
                                        <input
                                          type="text"
                                          placeholder="English Name"
                                          value={editingLocationName}
                                          onChange={(e) =>
                                            setEditingLocationName(
                                              e.target.value,
                                            )
                                          }
                                          className="text-xs p-1 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                          autoFocus
                                        />
                                        <input
                                          type="text"
                                          placeholder="Chinese Name"
                                          value={editingLocationNameChinese}
                                          onChange={(e) =>
                                            setEditingLocationNameChinese(
                                              e.target.value,
                                            )
                                          }
                                          className="text-xs p-1 border rounded w-full dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100"
                                        />
                                      </div>
                                    ) : (
                                      <div className="flex flex-col">
                                        <span className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                                          {loc.LocationName}
                                        </span>
                                        {loc.LocationNameChinese && (
                                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                                            {loc.LocationNameChinese}
                                          </span>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5 ml-2">
                                    {isEditing ? (
                                      <>
                                        <button
                                          onClick={() =>
                                            handleSaveLocationName(loc, "back")
                                          }
                                          title={t(
                                            "fincheckProductLocation.saveName",
                                          )}
                                        >
                                          <Check className="w-3.5 h-3.5 text-green-500" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            setEditingLocationId(null)
                                          }
                                          title={t(
                                            "fincheckProductLocation.cancel",
                                          )}
                                        >
                                          <X className="w-3.5 h-3.5 text-gray-500" />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button
                                          onClick={() =>
                                            handleEditLocationName(loc)
                                          }
                                          title={t(
                                            "fincheckProductLocation.editName",
                                          )}
                                        >
                                          <Edit className="w-3.5 h-3.5 text-blue-500" />
                                        </button>
                                        <button
                                          onClick={() =>
                                            removeLocation(loc, "back")
                                          }
                                          title={t(
                                            "fincheckProductLocation.removeLoc",
                                          )}
                                        >
                                          <X className="w-3.5 h-3.5 text-red-500" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Info Alert */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-800 dark:text-blue-300">
                    <p className="font-semibold mb-1.5">
                      {t("fincheckProductLocation.infoTitle")}
                    </p>
                    <ol className="list-decimal list-inside space-y-1 ml-2 text-[11px]">
                      <li>{t("fincheckProductLocation.infoStep1")}</li>
                      <li>{t("fincheckProductLocation.infoStep2")}</li>
                      <li>{t("fincheckProductLocation.infoStep3")}</li>
                      <li>{t("fincheckProductLocation.infoStep4")}</li>
                      <li>{t("fincheckProductLocation.infoStep5")}</li>
                      <li>{t("fincheckProductLocation.infoStep6")}</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Save/Cancel Buttons */}
              {frontImagePreview && backImagePreview && (
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 border border-gray-200 dark:border-gray-600">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t("fincheckProductLocation.productLabel")}
                        <span className="font-semibold text-gray-800 dark:text-white">
                          {
                            productTypes.find(
                              (pt) => pt._id === selectedProductType,
                            )?.EnglishProductName
                          }
                        </span>
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {t("fincheckProductLocation.totalLocLabel")}
                        <span className="font-semibold text-gray-800 dark:text-white">
                          {frontLocations.length + backLocations.length}
                        </span>
                        <span className="text-[11px] ml-2">
                          ({t("fincheckProductLocation.front")}:{" "}
                          {frontLocations.length},{" "}
                          {t("fincheckProductLocation.back")}:{" "}
                          {backLocations.length})
                        </span>
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setShowCreateForm(false);
                          resetForm();
                        }}
                        className="px-5 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium text-sm"
                        disabled={loading}
                      >
                        <X className="w-4 h-4 inline mr-1.5" />
                        {t("fincheckProductLocation.cancel")}
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={loading}
                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {t("fincheckProductLocation.saving")}
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            {editingConfigId
                              ? t("fincheckProductLocation.updateConfig")
                              : t("fincheckProductLocation.saveConfig")}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Saved Configurations Grid */}
      {savedConfigurations.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            {t("fincheckProductLocation.savedConfigTitle")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {savedConfigurations.map((config) => (
              <ConfigurationCard key={config._id} config={config} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {savedConfigurations.length === 0 && !showCreateForm && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-16 text-center">
          <div className="bg-gray-100 dark:bg-gray-700 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-10 h-10 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-2">
            {t("fincheckProductLocation.noConfigTitle")}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t("fincheckProductLocation.noConfigDesc")}
          </p>
          <button
            onClick={() => {
              setShowCreateForm(true);
              resetForm();
            }}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4 inline mr-2" />
            {t("fincheckProductLocation.createConfigBtn")}
          </button>
        </div>
      )}
    </div>
  );
};

export default YPivotQASectionsProductLocationManagement;
