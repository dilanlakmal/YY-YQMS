import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import {
  Briefcase,
  Layers,
  FileText,
  Bug,
  Search,
  Plus,
  X,
  Camera,
  Upload,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  Save,
  Edit,
  Trash2,
  ListFilter,
  Minus
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

// Sub-components
import YPivotQATemplatesDefectLocationSelection from "./YPivotQATemplatesDefectLocationSelection";
import YPivotQATemplatesImageEditor from "./YPivotQATemplatesImageEditor";

const YPivotQATemplatesDefectTotalSelection = () => {
  // --- Global State ---
  const [activeTab, setActiveTab] = useState("order"); // 'order', 'list', 'selected'

  // Data State
  const [buyers, setBuyers] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [reportTypes, setReportTypes] = useState([]);
  const [allDefects, setAllDefects] = useState([]);

  // Selections
  const [orderData, setOrderData] = useState({
    buyerId: "",
    buyerName: "",
    productTypeId: "",
    reportTypeId: "" // New Field
  });

  // The Master List of configured defects
  const [selectedDefects, setSelectedDefects] = useState([]);

  // Modal/Config State
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [currentDefect, setCurrentDefect] = useState(null);
  const [configForm, setConfigForm] = useState({
    status: "",
    qty: 1, // New Field
    locations: [],
    images: []
  });
  const [editingIndex, setEditingIndex] = useState(null);

  // Expanded Categories State
  const [expandedCategories, setExpandedCategories] = useState({});

  // Image Editor State
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [imageEditorContext, setImageEditorContext] = useState(null);

  // --- Initial Data Fetch ---
  useEffect(() => {
    const fetchInitData = async () => {
      try {
        const [buyersRes, typesRes, reportsRes, defectsRes] = await Promise.all(
          [
            axios.get(`${API_BASE_URL}/api/qa-sections-buyers`),
            axios.get(`${API_BASE_URL}/api/qa-sections-product-type`),
            axios.get(`${API_BASE_URL}/api/qa-sections-templates`),
            axios.get(`${API_BASE_URL}/api/qa-sections-defect-list`)
          ]
        );

        if (buyersRes.data.success) setBuyers(buyersRes.data.data);
        if (typesRes.data.success) setProductTypes(typesRes.data.data);
        if (reportsRes.data.success) setReportTypes(reportsRes.data.data);
        if (defectsRes.data.success) setAllDefects(defectsRes.data.data);
      } catch (error) {
        console.error("Initialization Error:", error);
      }
    };
    fetchInitData();
  }, []);

  // --- Logic: Filter Defects based on Report Type ---
  const allowedCategories = useMemo(() => {
    if (!orderData.reportTypeId) return [];
    const report = reportTypes.find((r) => r._id === orderData.reportTypeId);
    if (!report || !report.DefectCategoryList) return [];
    // Return array of CategoryCodes that are allowed
    return report.DefectCategoryList.map((c) => c.CategoryCode);
  }, [orderData.reportTypeId, reportTypes]);

  // --- Logic: Group & Sort Defects ---
  const [searchTerm, setSearchTerm] = useState("");

  const groupedDefects = useMemo(() => {
    if (!allDefects.length) return {};

    // 1. Filter by Search AND Report Type
    const filtered = allDefects.filter((d) => {
      const matchesSearch =
        d.english.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.code.toLowerCase().includes(searchTerm.toLowerCase());
      // Only show if category is allowed (or allow all if report not selected yet to prevent confusion, though logic forces selection)
      const isAllowed =
        allowedCategories.length === 0 ||
        allowedCategories.includes(d.CategoryCode);
      return matchesSearch && isAllowed;
    });

    // 2. Group by Category Name
    const groups = filtered.reduce((acc, curr) => {
      const cat = curr.CategoryNameEng || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(curr);
      return acc;
    }, {});

    // 3. Sort each group numerically by Code (1.1, 1.2, 10.1)
    Object.keys(groups).forEach((key) => {
      groups[key].sort((a, b) => {
        const numA = parseFloat(a.code);
        const numB = parseFloat(b.code);
        return numA - numB;
      });
    });

    return groups;
  }, [allDefects, searchTerm, allowedCategories]);

  // --- Logic: Summary Stats ---
  const summaryStats = useMemo(() => {
    let totalQty = 0;
    let critical = 0;
    let major = 0;
    let minor = 0;

    selectedDefects.forEach((d) => {
      totalQty += d.qty;
      if (d.status === "Critical") critical += d.qty;
      else if (d.status === "Major") major += d.qty;
      else if (d.status === "Minor") minor += d.qty;
    });

    return { totalQty, critical, major, minor };
  }, [selectedDefects]);

  // --- Logic: Group Selected Defects ---
  const groupedSelected = useMemo(() => {
    return selectedDefects.reduce((acc, curr) => {
      const cat = curr.categoryName || "Other";
      if (!acc[cat]) acc[cat] = { items: [], qty: 0 };
      acc[cat].items.push(curr);
      acc[cat].qty += curr.qty;
      return acc;
    }, {});
  }, [selectedDefects]);

  // --- Handlers: Order Tab ---
  const handleBuyerChange = (e) => {
    const buyerId = e.target.value;
    const buyer = buyers.find((b) => b._id === buyerId);
    setOrderData((prev) => ({
      ...prev,
      buyerId,
      buyerName: buyer ? buyer.buyer : ""
    }));
  };

  // --- Handlers: Accordion ---
  const toggleCategory = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // --- Handlers: Config Modal ---
  const openConfigModal = (defect, index = null) => {
    if (
      !orderData.buyerId ||
      !orderData.productTypeId ||
      !orderData.reportTypeId
    ) {
      alert("Please select Buyer, Report Type, and Product Type first.");
      setActiveTab("order");
      return;
    }

    // ---Check for duplicates ---
    // If trying to add a new one (index is null), check if it already exists
    if (index === null) {
      const existingIndex = selectedDefects.findIndex(
        (d) => d.defectId === defect._id
      );

      if (existingIndex !== -1) {
        // If it exists, switch to "Edit" mode for the existing entry
        // You can also add an alert here if you want to notify the user
        index = existingIndex;
      }
    }

    let initialStatus = "";
    let initialQty = 1;

    if (index !== null) {
      // Edit (Either clicked edit button OR switched from duplicate check)
      const existing = selectedDefects[index];
      initialStatus = existing.status;
      initialQty = existing.qty;
      setConfigForm({
        status: existing.status,
        qty: existing.qty,
        locations: existing.locations,
        images: existing.images
      });
      setEditingIndex(index);
    } else {
      // New (Truly new defect)
      const buyerRule = defect.statusByBuyer.find(
        (r) => r.buyerName === orderData.buyerName
      );
      initialStatus = buyerRule ? buyerRule.commonStatus : "";
      setConfigForm({
        status: initialStatus,
        qty: 1,
        locations: [],
        images: []
      });
      setEditingIndex(null);
    }

    setCurrentDefect(defect);
    setIsConfigOpen(true);
  };

  const getStatusOptions = () => {
    if (!currentDefect || !orderData.buyerName)
      return ["Minor", "Major", "Critical"];
    const buyerRule = currentDefect.statusByBuyer.find(
      (r) => r.buyerName === orderData.buyerName
    );
    return buyerRule && buyerRule.defectStatus.length > 0
      ? buyerRule.defectStatus
      : ["Minor", "Major", "Critical"];
  };

  const handleQtyChange = (delta) => {
    setConfigForm((prev) => ({
      ...prev,
      qty: Math.max(1, prev.qty + delta)
    }));
  };

  // --- Handlers: Image Editor ---
  const openImageEditor = (mode, index) => {
    setImageEditorContext({ mode, index });
    setShowImageEditor(true);
  };

  const handleImageSave = (url, history, imgSrc) => {
    setConfigForm((prev) => {
      const newImages = [...prev.images];
      const newImage = { url, history, imgSrc };

      if (imageEditorContext.mode === "edit") {
        newImages[imageEditorContext.index] = newImage;
      } else {
        newImages.push(newImage);
      }
      return { ...prev, images: newImages };
    });
    setShowImageEditor(false);
  };

  // --- Handlers: Save ---
  const handleSaveConfig = () => {
    if (!configForm.status) {
      alert("Please select a Defect Status.");
      return;
    }
    if (configForm.locations.length === 0) {
      alert("Please select at least one Location.");
      return;
    }

    const newEntry = {
      defectId: currentDefect._id,
      defectName: currentDefect.english,
      defectCode: currentDefect.code,
      categoryName: currentDefect.CategoryNameEng,
      ...configForm
    };

    if (editingIndex !== null) {
      const updated = [...selectedDefects];
      updated[editingIndex] = newEntry;
      setSelectedDefects(updated);
    } else {
      setSelectedDefects([...selectedDefects, newEntry]);
    }

    setIsConfigOpen(false);
    setActiveTab("selected");
  };

  const handleDeleteSelected = (defectCode) => {
    // Find index based on code or unique ID (using code/name combo as key logic for this example)
    // Better to store a unique ID, but index works for simple lists
    if (window.confirm("Remove this defect?")) {
      setSelectedDefects((prev) =>
        prev.filter((d) => d.defectCode !== defectCode)
      );
    }
  };

  // ================= RENDER HELPERS =================

  // 1. Order Data Tab
  const renderOrderTab = () => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md space-y-6 max-w-2xl mx-auto mt-8 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-bold text-gray-800 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 flex items-center gap-2">
        <Briefcase className="w-5 h-5 text-indigo-500" />
        Inspection Details
      </h3>

      {/* Buyer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Buyer
        </label>
        <div className="relative">
          <Briefcase className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <select
            value={orderData.buyerId}
            onChange={handleBuyerChange}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="">-- Select Buyer --</option>
            {buyers.map((b) => (
              <option key={b._id} value={b._id}>
                {b.buyer}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Report Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Report Type
        </label>
        <div className="relative">
          <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <select
            value={orderData.reportTypeId}
            onChange={(e) =>
              setOrderData((prev) => ({
                ...prev,
                reportTypeId: e.target.value
              }))
            }
            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="">-- Select Report Type --</option>
            {reportTypes.map((r) => (
              <option key={r._id} value={r._id}>
                {r.ReportType}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Product Type
        </label>
        <div className="relative">
          <Layers className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <select
            value={orderData.productTypeId}
            onChange={(e) =>
              setOrderData((prev) => ({
                ...prev,
                productTypeId: e.target.value
              }))
            }
            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          >
            <option value="">-- Select Product Type --</option>
            {productTypes.map((p) => (
              <option key={p._id} value={p._id}>
                {p.EnglishProductName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="pt-4 flex justify-end">
        <button
          onClick={() => setActiveTab("list")}
          disabled={
            !orderData.buyerId ||
            !orderData.productTypeId ||
            !orderData.reportTypeId
          }
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
        >
          Next: Select Defects
        </button>
      </div>
    </div>
  );

  // 2. Defect List Tab
  const renderListTab = () => (
    <div className="space-y-4">
      {/* Search */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm sticky top-0 z-10 border border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search defect name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* Accordions */}
      <div className="space-y-3 pb-20">
        {Object.entries(groupedDefects).length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            No defects found for this report type.
          </div>
        ) : (
          Object.entries(groupedDefects).map(([category, items]) => (
            <div
              key={category}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between bg-gray-50 dark:bg-gray-700 px-4 py-3 font-bold text-gray-700 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <span>
                  {category}{" "}
                  <span className="text-xs font-normal text-gray-500 dark:text-gray-100 ml-2">
                    ({items.length})
                  </span>
                </span>
                {expandedCategories[category] ? (
                  <ChevronUp className="w-5 h-5" />
                ) : (
                  <ChevronDown className="w-5 h-5" />
                )}
              </button>

              {/* Expandable Content */}
              {expandedCategories[category] && (
                <div className="divide-y divide-gray-100 dark:divide-gray-700 animate-fadeIn">
                  {items.map((defect) => (
                    <div
                      key={defect._id}
                      className="p-4 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors flex justify-between items-center group"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300 w-10 text-center">
                            {defect.code}
                          </span>
                          <h4 className="font-bold text-gray-800 dark:text-gray-100">
                            {defect.english}
                          </h4>
                        </div>
                        {defect.khmer && (
                          <p className="text-xs text-gray-500 mt-0.5 ml-12">
                            {defect.khmer}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => openConfigModal(defect)}
                        className="p-2 bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-800 text-indigo-600 rounded-lg shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );

  // 3. Selected Defects Tab
  const renderSelectedTab = () => (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left">
            <h2 className="text-2xl font-black">{summaryStats.totalQty}</h2>
            <p className="text-xs text-slate-400 uppercase tracking-wider">
              Total Defects
            </p>
          </div>

          <div className="flex gap-2 sm:gap-6">
            <div className="text-center px-4 py-2 bg-red-500/20 rounded-lg border border-red-500/30">
              <p className="text-xl font-bold text-red-400">
                {summaryStats.critical}
              </p>
              <p className="text-[10px] uppercase">Critical</p>
            </div>
            <div className="text-center px-4 py-2 bg-orange-500/20 rounded-lg border border-orange-500/30">
              <p className="text-xl font-bold text-orange-400">
                {summaryStats.major}
              </p>
              <p className="text-[10px] uppercase">Major</p>
            </div>
            <div className="text-center px-4 py-2 bg-green-500/20 rounded-lg border border-green-500/30">
              <p className="text-xl font-bold text-green-400">
                {summaryStats.minor}
              </p>
              <p className="text-[10px] uppercase">Minor</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grouped List */}
      {Object.entries(groupedSelected).length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700">
          <Bug className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No defects added yet.</p>
          <button
            onClick={() => setActiveTab("list")}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700"
          >
            Go to Defect List
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSelected).map(([category, { items, qty }]) => (
            <div
              key={category}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              {/* Category Header */}
              <div className="bg-gray-100 dark:bg-gray-900 px-4 py-2 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                  {category}
                </h3>
                <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full font-mono">
                  Qty: {qty}
                </span>
              </div>

              {/* Items Grid */}
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {items.map((item, idx) => {
                  // Find true index in master list to edit correctly
                  const masterIndex = selectedDefects.indexOf(item);

                  return (
                    <div
                      key={idx}
                      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:border-indigo-500 dark:hover:border-indigo-500 transition-all group"
                    >
                      {/* Card Header */}
                      <div className="px-4 py-3 flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-mono bg-gray-100 dark:bg-gray-700 px-1.5 rounded text-gray-600 dark:text-gray-400">
                              {item.defectCode}
                            </span>
                            <span
                              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                item.status === "Critical"
                                  ? "bg-red-100 text-red-700"
                                  : item.status === "Major"
                                  ? "bg-orange-100 text-orange-700"
                                  : "bg-green-100 text-green-700"
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-800 dark:text-white text-sm">
                            {item.defectName}
                          </h4>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                            {item.qty}
                          </span>
                          <span className="text-[10px] text-gray-400">
                            Count
                          </span>
                        </div>
                      </div>

                      {/* Locations Summary */}
                      <div className="px-4 pb-3 border-b border-gray-100 dark:border-gray-800">
                        <div className="flex flex-wrap gap-1">
                          {item.locations.map((loc) => (
                            <span
                              key={loc.uniqueId}
                              className="px-1.5 py-0.5 bg-gray-50 dark:bg-gray-750 text-[10px] rounded border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400"
                            >
                              {loc.view} #{loc.locationNo}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                        {/* Images preview */}
                        <div className="flex -space-x-2">
                          {item.images.map((img, i) => (
                            <img
                              key={i}
                              src={img.url}
                              className="w-6 h-6 rounded-full border border-white dark:border-gray-800 object-cover"
                              alt="thumb"
                            />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              openConfigModal(
                                allDefects.find(
                                  (d) => d._id === item.defectId
                                ) || item,
                                masterIndex
                              )
                            }
                            className="p-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:text-blue-600 transition-colors shadow-sm"
                          >
                            <Edit className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteSelected(item.defectCode)
                            }
                            className="p-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded hover:text-red-600 transition-colors shadow-sm"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // --- CONFIGURATION MODAL ---
  const renderConfigModal = () =>
    createPortal(
      <div className="fixed inset-0 z-[100] h-[100dvh] bg-white dark:bg-gray-900 overflow-y-auto animate-fadeIn flex flex-col">
        {/* Modal Header */}
        <div className="flex-shrink-0 px-4 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center shadow-lg safe-area-top">
          <div>
            <h2 className="text-white font-bold text-lg line-clamp-1">
              {currentDefect.english}
            </h2>
            <span className="text-indigo-100 text-xs font-mono">
              {currentDefect.code}
            </span>
          </div>
          <button
            onClick={() => setIsConfigOpen(false)}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8 pb-24">
          {/* 1. Status & Quantity Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <section>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                Defect Status
              </h3>
              <div className="flex gap-2">
                {getStatusOptions().map((status) => (
                  <button
                    key={status}
                    onClick={() =>
                      setConfigForm((prev) => ({ ...prev, status }))
                    }
                    className={`flex-1 py-3 rounded-xl font-bold border-2 transition-all shadow-sm text-sm
                                ${
                                  configForm.status === status
                                    ? status === "Critical"
                                      ? "border-red-500 bg-red-50 text-red-700"
                                      : status === "Major"
                                      ? "border-orange-500 bg-orange-50 text-orange-700"
                                      : "border-green-500 bg-green-50 text-green-700"
                                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-500 hover:border-gray-400"
                                }
                                `}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
                Defect Quantity
              </h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleQtyChange(-1)}
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                >
                  <Minus className="w-6 h-6" />
                </button>
                <div className="flex-1 h-12 flex items-center justify-center bg-white dark:bg-gray-800 border-2 border-indigo-100 dark:border-gray-700 rounded-xl">
                  <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {configForm.qty}
                  </span>
                </div>
                <button
                  onClick={() => handleQtyChange(1)}
                  className="w-12 h-12 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                >
                  <Plus className="w-6 h-6" />
                </button>
              </div>
            </section>
          </div>

          {/* 2. Location Selection */}
          <section className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Bug className="w-4 h-4" />
              Defect Locations
            </h3>

            {/* Reuse the modified Location Component */}
            <YPivotQATemplatesDefectLocationSelection
              forcedProductTypeId={orderData.productTypeId}
              initialSelections={configForm.locations}
              onSelectionChange={(locs) =>
                setConfigForm((prev) => ({ ...prev, locations: locs }))
              }
            />
          </section>

          {/* 3. Image Upload */}
          <section>
            <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 flex justify-between">
              <span>Defect Images</span>
              <span className="text-xs bg-gray-200 dark:bg-gray-700 px-2 rounded-full">
                {configForm.images.length}/5
              </span>
            </h3>

            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {configForm.images.map((img, i) => (
                <div
                  key={i}
                  className="relative w-24 h-24 flex-shrink-0 group cursor-pointer"
                  onClick={() => openImageEditor("edit", i)}
                >
                  <img
                    src={img.url}
                    className="w-full h-full object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                    alt="Defect"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                    <Edit className="w-5 h-5 text-white" />
                  </div>
                </div>
              ))}

              {configForm.images.length < 5 && (
                <div className="flex-shrink-0 w-24 h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-800 flex flex-col">
                  <button
                    onClick={() => openImageEditor("camera")}
                    className="flex-1 w-full flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-b border-gray-200 dark:border-gray-700 transition-colors group"
                  >
                    <Camera className="w-5 h-5 text-gray-400 group-hover:text-indigo-500" />
                  </button>
                  <button
                    onClick={() => openImageEditor("upload")}
                    className="flex-1 w-full flex items-center justify-center hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors group"
                  >
                    <Upload className="w-5 h-5 text-gray-400 group-hover:text-emerald-500" />
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Modal Footer */}
        <div className="flex-shrink-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 safe-area-bottom">
          <button
            onClick={handleSaveConfig}
            disabled={!configForm.status || configForm.locations.length === 0}
            className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Save className="w-5 h-5" />
            {editingIndex !== null ? "Update Defect" : "Add Defect"}
          </button>
        </div>

        {/* Image Editor Modal (Nested) */}
        {showImageEditor && (
          <YPivotQATemplatesImageEditor
            autoStartMode={
              imageEditorContext?.mode === "edit"
                ? null
                : imageEditorContext?.mode === "camera"
                ? "camera"
                : "upload"
            }
            existingData={
              imageEditorContext?.mode === "edit"
                ? configForm.images[imageEditorContext.index]
                : null
            }
            onSave={handleImageSave}
            onCancel={() => setShowImageEditor(false)}
          />
        )}
      </div>,
      document.body
    );

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 pb-20">
      {/* Top Navigation Tabs */}
      <div className="sticky top-0 z-20 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center justify-center p-2 gap-2">
          {[
            { id: "order", label: "1. Order Data", icon: Briefcase },
            { id: "list", label: "2. Defect List", icon: ListFilter },
            { id: "selected", label: "3. Selected", icon: CheckCircle }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={
                tab.id !== "order" &&
                (!orderData.buyerId ||
                  !orderData.productTypeId ||
                  !orderData.reportTypeId)
              }
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-bold rounded-lg transition-all
                   ${
                     activeTab === tab.id
                       ? "bg-indigo-600 text-white shadow-md"
                       : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                   } disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {activeTab === "order" && renderOrderTab()}
        {activeTab === "list" && renderListTab()}
        {activeTab === "selected" && renderSelectedTab()}
      </div>

      {/* Full Screen Config Modal */}
      {isConfigOpen && currentDefect && renderConfigModal()}
    </div>
  );
};

export default YPivotQATemplatesDefectTotalSelection;
