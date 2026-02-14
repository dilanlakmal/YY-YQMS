import React, { useState, useEffect, useRef } from "react";
import {
  Save,
  Edit,
  X,
  Trash2,
  MapPin,
  Loader2,
  Search,
  Check,
  RefreshCw,
  AlertCircle,
  Clock,
  Calendar,
} from "lucide-react";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../../../../config";

const StyleProductLocationManagement = () => {
  // --- STATE ---
  // Order Search
  const [orderSearchTerm, setOrderSearchTerm] = useState("");
  const [orderSearchResults, setOrderSearchResults] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isSearchingOrders, setIsSearchingOrders] = useState(false);

  // Product Data
  const [productTypes, setProductTypes] = useState([]);
  const [selectedProductType, setSelectedProductType] = useState("");

  // List Data (The Table)
  const [styleList, setStyleList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);

  // Configuration Data
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [isInherited, setIsInherited] = useState(false); // True if showing "Common" template
  const [frontImage, setFrontImage] = useState(null); // File object
  const [backImage, setBackImage] = useState(null); // File object
  const [frontImagePreview, setFrontImagePreview] = useState(null);
  const [backImagePreview, setBackImagePreview] = useState(null);
  const [existingFrontPath, setExistingFrontPath] = useState("");
  const [existingBackPath, setExistingBackPath] = useState("");

  const [frontLocations, setFrontLocations] = useState([]);
  const [backLocations, setBackLocations] = useState([]);

  // UI Interaction
  const [isMarkingFront, setIsMarkingFront] = useState(false);
  const [isMarkingBack, setIsMarkingBack] = useState(false);
  const [draggingLocation, setDraggingLocation] = useState(null);
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [saving, setSaving] = useState(false);

  // Table Pagination & Search State
  const [tableSearchTerm, setTableSearchTerm] = useState(""); // Input value
  const [showTableDropdown, setShowTableDropdown] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [debouncedSearch, setDebouncedSearch] = useState(""); // For API call

  // Refs
  const frontImageRef = useRef(null);
  const backImageRef = useRef(null);
  const frontFileInputRef = useRef(null);
  const backFileInputRef = useRef(null);
  const topRef = useRef(null); // For scrolling to top

  // Debounce logic: Update debouncedSearch 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(tableSearchTerm);
      setCurrentPage(1); // Reset to page 1 on new search
    }, 500);
    return () => clearTimeout(timer);
  }, [tableSearchTerm]);

  // --- INITIAL DATA FETCH ---
  // Fetch when Page or Search changes
  useEffect(() => {
    fetchStyleList();
  }, [currentPage, debouncedSearch]);

  useEffect(() => {
    fetchProductTypes();
    fetchStyleList();
  }, []);

  // Fetch Config when Order AND Product Type are selected
  useEffect(() => {
    if (selectedOrder && selectedProductType) {
      fetchStyleConfiguration();
    } else {
      resetConfigView();
    }
  }, [selectedOrder, selectedProductType]);

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
    }
  };

  const fetchStyleList = async () => {
    setLoadingList(true);
    try {
      // Send query params
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections-product-location/styles?page=${currentPage}&limit=10&search=${debouncedSearch}`,
      );

      if (response.data.success) {
        setStyleList(response.data.data);
        // Set Pagination Data
        const { totalPages, totalRecords } = response.data.pagination;
        setTotalPages(totalPages);
        setTotalRecords(totalRecords);
      }
    } catch (error) {
      console.error("Error fetching style list:", error);
    } finally {
      setLoadingList(false);
    }
  };

  //   const fetchStyleList = async () => {
  //     setLoadingList(true);
  //     try {
  //       const response = await axios.get(
  //         `${API_BASE_URL}/api/qa-sections-product-location/styles`,
  //       );
  //       if (response.data.success) {
  //         setStyleList(response.data.data);
  //       }
  //     } catch (error) {
  //       console.error("Error fetching style list:", error);
  //     } finally {
  //       setLoadingList(false);
  //     }
  //   };

  // --- ORDER SEARCH ---
  const handleOrderSearch = async (e) => {
    const term = e.target.value;
    setOrderSearchTerm(term);

    if (term.length < 2) {
      setOrderSearchResults([]);
      return;
    }

    setIsSearchingOrders(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/orders/search?term=${term}`,
      );
      if (response.data.success) {
        setOrderSearchResults(response.data.data);
      }
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setIsSearchingOrders(false);
    }
  };

  const selectOrder = (order) => {
    setSelectedOrder(order);
    setOrderSearchTerm(
      `${order.order_number} (${order.style_name || "No Style Name"})`,
    );
    setOrderSearchResults([]);
  };

  // --- CONFIGURATION LOGIC ---

  const fetchStyleConfiguration = async () => {
    setLoadingConfig(true);
    resetConfigView();

    try {
      const styleId = selectedOrder.order_number;
      const url = `${API_BASE_URL}/api/qa-sections-product-location/style/${styleId}/type/${selectedProductType}`;

      const response = await axios.get(url);

      if (response.data.success) {
        const config = response.data.data;
        setIsInherited(response.data.isInherited);

        const frontFilename = config.frontView.imagePath.split("/").pop();
        const backFilename = config.backView.imagePath.split("/").pop();

        setFrontImagePreview(
          `${API_BASE_URL}/api/qa-sections-product-location/image/${frontFilename}`,
        );
        setBackImagePreview(
          `${API_BASE_URL}/api/qa-sections-product-location/image/${backFilename}`,
        );

        setExistingFrontPath(config.frontView.imagePath);
        setExistingBackPath(config.backView.imagePath);

        setFrontLocations(config.frontView.locations || []);
        setBackLocations(config.backView.locations || []);
      }
    } catch (error) {
      console.error("Fetch config error:", error);
      if (error.response?.status === 404) {
        Swal.fire({
          icon: "info",
          title: "No Configuration",
          text: 'No "Common" template or specific style configuration found for this product type.',
        });
      }
    } finally {
      setLoadingConfig(false);
    }
  };

  const resetConfigView = () => {
    setFrontImage(null);
    setBackImage(null);
    setFrontImagePreview(null);
    setBackImagePreview(null);
    setFrontLocations([]);
    setBackLocations([]);
    setExistingFrontPath("");
    setExistingBackPath("");
    setIsInherited(false);
  };

  // --- TABLE EDIT HANDLER ---
  const handleEditFromTable = (item) => {
    // 1. Construct a mock "Order" object since we might not have full DtOrder data
    //    But we know the 'style' field IS the order number.
    const mockOrder = {
      _id: item._id, // Just to have an ID
      order_number: item.style,
      style_name: "Existing Record", // Placeholder text
    };

    // 2. Set State
    setSelectedOrder(mockOrder);
    setOrderSearchTerm(`${item.style}`); // Set input text
    setSelectedProductType(item.productTypeId?._id);

    // 3. Scroll to top
    topRef.current?.scrollIntoView({ behavior: "smooth" });

    // 4. The useEffect([selectedOrder, selectedProductType]) will trigger
    //    and fetch the latest data for editing.
  };

  // --- IMAGE HANDLING ---

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

    const reader = new FileReader();
    reader.onloadend = () => {
      if (view === "front") {
        setFrontImage(file);
        setFrontImagePreview(reader.result);
      } else {
        setBackImage(file);
        setBackImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = null;
  };

  // --- LOCATION MARKER LOGIC ---

  const handleImageClick = (e, view) => {
    const isMarking = view === "front" ? isMarkingFront : isMarkingBack;
    if (!isMarking) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    Swal.fire({
      title: "Enter Location Name",
      input: "text",
      inputPlaceholder: "e.g., Defect Spot",
      showCancelButton: true,
      confirmButtonText: "Add",
      inputValidator: (value) => !value && "Please enter a name",
    }).then((result) => {
      if (result.isConfirmed) {
        const locations = view === "front" ? frontLocations : backLocations;
        const maxNo = locations.reduce(
          (max, loc) => Math.max(max, loc.LocationNo),
          0,
        );

        const newLocation = {
          LocationNo: maxNo + 1,
          LocationName: result.value,
          x,
          y,
          tempId: Date.now(),
        };

        if (view === "front")
          setFrontLocations([...frontLocations, newLocation]);
        else setBackLocations([...backLocations, newLocation]);
      }
    });
  };

  // Remove Location
  const removeLocation = (location, view) => {
    const idToRemove = location._id || location.tempId;
    const filterFn = (loc) => (loc._id || loc.tempId) !== idToRemove;
    const reIndex = (locs) =>
      locs.map((loc, idx) => ({ ...loc, LocationNo: idx + 1 }));

    if (view === "front") {
      const filtered = frontLocations.filter(filterFn);
      setFrontLocations(reIndex(filtered));
    } else {
      const filtered = backLocations.filter(filterFn);
      setBackLocations(reIndex(filtered));
    }
  };

  const handleDragStart = (e, location, view) => {
    e.preventDefault();
    setDraggingLocation({ ...location, view });
  };

  // Handle drag and Move Point
  const handleDragMove = (e, view) => {
    if (!draggingLocation || draggingLocation.view !== view) return;
    const imageRef = view === "front" ? frontImageRef : backImageRef;
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    let x = ((e.clientX - rect.left) / rect.width) * 100;
    let y = ((e.clientY - rect.top) / rect.height) * 100;

    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    const idToUpdate = draggingLocation._id || draggingLocation.tempId;
    const updateFn = (list) =>
      list.map((loc) =>
        (loc._id || loc.tempId) === idToUpdate ? { ...loc, x, y } : loc,
      );

    if (view === "front") setFrontLocations(updateFn(frontLocations));
    else setBackLocations(updateFn(backLocations));
  };

  // --- SAVE LOGIC ---

  const handleSave = async () => {
    if (!selectedOrder || !selectedProductType) return;

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("style", selectedOrder.order_number);
      formData.append("productTypeId", selectedProductType);

      const ptName = productTypes.find(
        (pt) => pt._id === selectedProductType,
      )?.EnglishProductName;
      formData.append("productTypeName", ptName || "Unknown");

      formData.append("frontLocations", JSON.stringify(frontLocations));
      formData.append("backLocations", JSON.stringify(backLocations));

      if (frontImage) formData.append("frontView", frontImage);
      else formData.append("existingFrontPath", existingFrontPath);

      if (backImage) formData.append("backView", backImage);
      else formData.append("existingBackPath", existingBackPath);

      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections-product-location/style`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      if (response.data.success) {
        Swal.fire({
          icon: "success",
          title: "Saved!",
          text: `Style configuration for Order ${selectedOrder.order_number} saved successfully.`,
        });
        fetchStyleList(); // Refresh table
        handleCancel(); // Close the config window
      }
    } catch (error) {
      console.error("Save error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save configuration.",
      });
    } finally {
      setSaving(false);
    }
  };

  // --- Handle cancel when editing Points ---
  const handleCancel = () => {
    // 1. Reset Form Data
    resetConfigView();
    // 2. Clear Selections (This hides the form window)
    setSelectedOrder(null);
    setSelectedProductType("");
    setOrderSearchTerm("");
    // 3. Scroll to top to see search bar again clearly
    topRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // --- RENDER HELPERS ---

  const renderMarkers = (locations, color, view) => {
    return locations.map((loc) => (
      <div
        key={loc._id || loc.tempId}
        className="absolute transform -translate-x-1/2 -translate-y-1/2 group cursor-grab active:cursor-grabbing"
        style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
        onMouseEnter={() => setHoveredLocation(loc)}
        onMouseLeave={() => setHoveredLocation(null)}
        onMouseDown={(e) => handleDragStart(e, loc, view)}
      >
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white shadow-lg ${
            color === "red" ? "bg-red-500" : "bg-blue-500"
          } text-white`}
        >
          {loc.LocationNo}
        </div>
        {hoveredLocation === loc && (
          <div className="absolute bottom-full mb-2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10">
            {loc.LocationName}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="space-y-6" ref={topRef}>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2.5 rounded-lg backdrop-blur-sm">
              <MapPin size={22} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                Style Location Management
              </h2>
              <p className="text-emerald-100 text-xs">
                Customize inspection points per Order/Style
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6 border border-gray-200 dark:border-gray-700">
        {/* Selection Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* 1. Order Search */}
          <div className="relative">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Search Order No / Style <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                value={orderSearchTerm}
                onChange={handleOrderSearch}
                placeholder="Type Order No..."
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
              {isSearchingOrders && (
                <Loader2 className="absolute right-3 top-3 animate-spin w-4 h-4 text-emerald-500" />
              )}
            </div>

            {/* Search Dropdown */}
            {orderSearchResults.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                {orderSearchResults.map((order) => (
                  <div
                    key={order._id}
                    onClick={() => selectOrder(order)}
                    className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b dark:border-gray-600 last:border-0"
                  >
                    <p className="font-semibold text-sm text-gray-800 dark:text-white">
                      {order.order_number}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-300">
                      Style: {order.style_name || "N/A"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Product Type Select */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Select Product Type <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedProductType}
              onChange={(e) => setSelectedProductType(e.target.value)}
              className="w-full px-4 py-2.5 border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500"
              disabled={!selectedOrder}
            >
              <option value="">-- Select --</option>
              {productTypes.map((pt) => (
                <option key={pt._id} value={pt._id}>
                  {pt.EnglishProductName}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* --- PREVIOUSLY ADDED STYLES TABLE --- */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Clock size={18} className="text-emerald-600" />
              Previously Added Style Locations
            </h3>

            {/* TABLE SEARCH BAR */}
            <div className="relative w-full md:w-64">
              <input
                type="text"
                value={tableSearchTerm}
                onChange={(e) => {
                  setTableSearchTerm(e.target.value);
                  setShowTableDropdown(true);
                }}
                onFocus={() => setShowTableDropdown(true)}
                onBlur={() =>
                  setTimeout(() => setShowTableDropdown(false), 200)
                }
                placeholder="Search by Order No..."
                className="w-full pl-9 pr-8 py-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-emerald-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />

              {/* CLEAR BUTTON */}
              {tableSearchTerm && (
                <button
                  onClick={() => {
                    setTableSearchTerm("");
                    setShowTableDropdown(false);
                  }}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X size={16} />
                </button>
              )}

              {/* DROPDOWN from table results */}
              {showTableDropdown && tableSearchTerm && styleList.length > 0 && (
                <div className="absolute z-30 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                  {styleList.map((item) => (
                    <div
                      key={item._id}
                      onMouseDown={() => {
                        setTableSearchTerm(item.style);
                        setShowTableDropdown(false);
                      }}
                      className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b dark:border-gray-600 last:border-0"
                    >
                      <p className="font-semibold text-sm text-gray-800 dark:text-white">
                        {item.style}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-300">
                        {item.productTypeId?.EnglishProductName ||
                          "Unknown Type"}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                <tr>
                  <th className="px-6 py-3">Style / Order</th>
                  <th className="px-6 py-3">Product Type</th>
                  <th className="px-6 py-3 text-center">Front Locs</th>
                  <th className="px-6 py-3 text-center">Back Locs</th>
                  <th className="px-6 py-3">Last Updated</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingList ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500" />
                    </td>
                  </tr>
                ) : styleList.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      {tableSearchTerm
                        ? "No matching styles found."
                        : "No style-specific configurations found."}
                    </td>
                  </tr>
                ) : (
                  styleList.map((item) => (
                    <tr
                      key={item._id}
                      className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {item.style}
                      </td>
                      <td className="px-6 py-4">
                        {item.productTypeId?.EnglishProductName ||
                          "Unknown Type"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded border border-red-200">
                          {item.frontView?.locations?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded border border-blue-200">
                          {item.backView?.locations?.length || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="flex items-center gap-1 text-xs">
                            <Calendar size={12} />{" "}
                            {new Date(item.updatedAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <Clock size={12} />{" "}
                            {new Date(item.updatedAt).toLocaleTimeString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleEditFromTable(item)}
                          className="font-medium text-blue-600 dark:text-blue-500 hover:underline flex items-center gap-1 ml-auto"
                        >
                          <Edit size={14} /> Edit
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* PAGINATION CONTROLS */}
          {styleList.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 sm:px-6 rounded-b-lg">
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Showing{" "}
                    <span className="font-medium">
                      {(currentPage - 1) * 10 + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-medium">
                      {Math.min(currentPage * 10, totalRecords)}
                    </span>{" "}
                    of <span className="font-medium">{totalRecords}</span>{" "}
                    results
                  </p>
                </div>
                <div>
                  <nav
                    className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px"
                    aria-label="Pagination"
                  >
                    <button
                      onClick={() =>
                        setCurrentPage(Math.max(1, currentPage - 1))
                      }
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      Previous
                    </button>

                    {/* Simple Page Numbers */}
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          currentPage === i + 1
                            ? "z-10 bg-emerald-50 dark:bg-emerald-900 border-emerald-500 text-emerald-600 dark:text-emerald-200"
                            : "bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}

                    <button
                      onClick={() =>
                        setCurrentPage(Math.min(totalPages, currentPage + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State for Config */}
        {loadingConfig && (
          <div className="py-12 flex flex-col items-center justify-center text-gray-500 border-t border-gray-200 dark:border-gray-700 mt-6 pt-6">
            <Loader2 className="w-8 h-8 animate-spin mb-2 text-emerald-500" />
            <p>Loading Configuration...</p>
          </div>
        )}
        {/* Configuration Interface */}
        {!loadingConfig && frontImagePreview && backImagePreview && (
          <div className="animate-fadeIn border-t border-gray-200 dark:border-gray-700 mt-6 pt-6">
            {/* Inherited Status Banner */}
            {isInherited ? (
              <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-3 flex items-center gap-3">
                <AlertCircle className="text-yellow-600 w-5 h-5" />
                <div>
                  <p className="text-sm font-bold text-yellow-800 dark:text-yellow-200">
                    Using Common Template
                  </p>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300">
                    You are creating a new record based on the template. Saving
                    will create a specific record for Order:{" "}
                    {selectedOrder?.order_number}.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mb-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 rounded-lg p-3 flex items-center gap-3">
                <Check className="text-emerald-600 w-5 h-5" />
                <div>
                  <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                    Editing Style Configuration
                  </p>
                  <p className="text-xs text-emerald-700 dark:text-emerald-300">
                    You are updating the custom configuration for Order:{" "}
                    {selectedOrder?.order_number}.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* FRONT VIEW */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>{" "}
                    Front View
                  </h4>
                  <span className="text-xs text-gray-500">
                    {frontLocations.length} Locations
                  </span>
                </div>

                {/* Image Container */}
                <div
                  className="h-96 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden relative"
                  onMouseMove={(e) => handleDragMove(e, "front")}
                  onMouseUp={() => setDraggingLocation(null)}
                  onMouseLeave={() => setDraggingLocation(null)}
                >
                  <div className="relative inline-block">
                    <img
                      ref={frontImageRef}
                      src={frontImagePreview}
                      className={`max-h-96 object-contain ${isMarkingFront ? "cursor-crosshair" : "cursor-default"}`}
                      onClick={(e) => handleImageClick(e, "front")}
                      alt="Front"
                    />
                    {renderMarkers(frontLocations, "red", "front")}
                  </div>
                </div>

                {/* Controls */}
                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={frontFileInputRef}
                    className="hidden"
                    onChange={(e) => handleImageChange(e, "front")}
                  />
                  <button
                    onClick={() => setIsMarkingFront(!isMarkingFront)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${isMarkingFront ? "bg-emerald-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                  >
                    {isMarkingFront
                      ? "Click Image to Add Point"
                      : "Mark Locations"}
                  </button>
                  <button
                    onClick={() => frontFileInputRef.current.click()}
                    className="px-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg"
                    title="Change Image"
                  >
                    <RefreshCw size={18} />
                  </button>
                  <button
                    onClick={() => setFrontLocations([])}
                    className="px-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg"
                    title="Clear All"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                {/* Location List */}
                <div className="max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50 dark:bg-gray-900/50">
                  {frontLocations.map((loc) => (
                    <div
                      key={loc.LocationNo}
                      className="flex justify-between items-center p-1.5 text-xs border-b last:border-0"
                    >
                      <div className="flex gap-2 items-center">
                        <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center">
                          {loc.LocationNo}
                        </span>
                        <span>{loc.LocationName}</span>
                      </div>
                      <button
                        onClick={() => removeLocation(loc, "front")}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* BACK VIEW */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>{" "}
                    Back View
                  </h4>
                  <span className="text-xs text-gray-500">
                    {backLocations.length} Locations
                  </span>
                </div>

                <div
                  className="h-96 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 flex items-center justify-center overflow-hidden relative"
                  onMouseMove={(e) => handleDragMove(e, "back")}
                  onMouseUp={() => setDraggingLocation(null)}
                  onMouseLeave={() => setDraggingLocation(null)}
                >
                  <div className="relative inline-block">
                    <img
                      ref={backImageRef}
                      src={backImagePreview}
                      className={`max-h-96 object-contain ${isMarkingBack ? "cursor-crosshair" : "cursor-default"}`}
                      onClick={(e) => handleImageClick(e, "back")}
                      alt="Back"
                    />
                    {renderMarkers(backLocations, "blue", "back")}
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="file"
                    ref={backFileInputRef}
                    className="hidden"
                    onChange={(e) => handleImageChange(e, "back")}
                  />
                  <button
                    onClick={() => setIsMarkingBack(!isMarkingBack)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium ${isMarkingBack ? "bg-emerald-600 text-white" : "bg-gray-100 hover:bg-gray-200 text-gray-700"}`}
                  >
                    {isMarkingBack
                      ? "Click Image to Add Point"
                      : "Mark Locations"}
                  </button>
                  <button
                    onClick={() => backFileInputRef.current.click()}
                    className="px-3 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg"
                    title="Change Image"
                  >
                    <RefreshCw size={18} />
                  </button>
                  <button
                    onClick={() => setBackLocations([])}
                    className="px-3 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg"
                    title="Clear All"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50 dark:bg-gray-900/50">
                  {backLocations.map((loc) => (
                    <div
                      key={loc.LocationNo}
                      className="flex justify-between items-center p-1.5 text-xs border-b last:border-0"
                    >
                      <div className="flex gap-2 items-center">
                        <span className="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center">
                          {loc.LocationNo}
                        </span>
                        <span>{loc.LocationName}</span>
                      </div>
                      <button
                        onClick={() => removeLocation(loc, "back")}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              {/* CANCEL BUTTON */}
              <button
                onClick={handleCancel}
                disabled={saving}
                className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-bold shadow-md flex items-center gap-2 transition-colors"
              >
                <X size={18} />
                Cancel
              </button>

              {/* SAVE / UPDATE BUTTON */}
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-lg flex items-center gap-2 disabled:opacity-50 transition-colors"
              >
                {saving ? (
                  <Loader2 className="animate-spin" />
                ) : // Change icon and text based on inheritance status
                !isInherited ? (
                  <Edit size={18} />
                ) : (
                  <Save size={18} />
                )}
                {/* 
                           Logic: If 'isInherited' is TRUE, it means we are using the Common Template 
                           (Creating a new Style record). 
                           If 'isInherited' is FALSE, we are editing an existing Style record.
                        */}
                {!isInherited
                  ? "Update Style Configuration"
                  : "Save Style Configuration"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StyleProductLocationManagement;
