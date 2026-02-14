import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef
} from "react";
import {
  Calendar,
  Search,
  Package,
  Loader2,
  Building2,
  User,
  MapPin,
  Truck,
  Users,
  Hash,
  Globe,
  Tag,
  Shirt,
  Layers,
  ChevronDown,
  ChevronUp,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Link2,
  Plus,
  Boxes,
  Eye,
  EyeOff,
  ClipboardList,
  Save,
  Lock,
  QrCode,
  Edit3
} from "lucide-react";
import axios from "axios";
import { API_BASE_URL } from "../../../../../config";

// Import the Report Type component
import YPivotQAInspectionReportType from "./YPivotQAInspectionReportType";
import YPivotQualityPlan from "./YPivotQualityPlan";
import YPivotQAInspectionOrderDataSaveModal from "./YPivotQAInspectionOrderDataSaveModal";
import YPivotQAInspectionQRCodeReading from "./YPivotQAInspectionQRCodeReading";

// ============================================================
// Sub-Components
// ============================================================

// Color/Size Breakdown Table
const ColorSizeBreakdownTable = ({ data, orderNo }) => {
  if (!data || !data.colors || data.colors.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
        <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No color/size data available</p>
      </div>
    );
  }

  const { sizeList, colors, sizeTotals, grandTotal } = data;

  return (
    <div className="space-y-2">
      {orderNo && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">
            {orderNo}
          </span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
              <th className="px-3 py-2 text-left font-bold text-xs uppercase tracking-wide sticky left-0 bg-indigo-600 z-10">
                Color
              </th>
              {sizeList.map((size) => (
                <th
                  key={size}
                  className="px-2 py-2 text-center font-bold text-xs uppercase tracking-wide min-w-[50px]"
                >
                  {size}
                </th>
              ))}
              <th className="px-3 py-2 text-center font-bold text-xs uppercase tracking-wide bg-indigo-700 min-w-[70px]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {colors.map((row, index) => (
              <tr
                key={index}
                className={`border-b border-gray-200 dark:border-gray-700 ${
                  index % 2 === 0
                    ? "bg-white dark:bg-gray-800"
                    : "bg-gray-50 dark:bg-gray-800/50"
                } hover:bg-indigo-50 dark:hover:bg-indigo-900/20`}
              >
                <td className="px-3 py-1.5 font-semibold text-gray-800 dark:text-gray-200 sticky left-0 bg-inherit z-10">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600"
                      style={{ backgroundColor: row.colorCode || "#ccc" }}
                    />
                    <span className="truncate max-w-[100px] text-xs">
                      {row.color}
                    </span>
                  </div>
                </td>
                {sizeList.map((size) => (
                  <td
                    key={size}
                    className={`px-2 py-1.5 text-center text-xs font-medium ${
                      row.sizes[size]
                        ? "text-gray-800 dark:text-gray-200"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  >
                    {row.sizes[size] || "-"}
                  </td>
                ))}
                <td className="px-3 py-1.5 text-center text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30">
                  {row.total.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gradient-to-r from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 font-bold">
              <td className="px-3 py-2 text-xs text-gray-800 dark:text-gray-200 sticky left-0 bg-gray-200 dark:bg-gray-700 z-10">
                Total
              </td>
              {sizeList.map((size) => (
                <td
                  key={size}
                  className="px-2 py-2 text-center text-xs text-gray-800 dark:text-gray-200"
                >
                  {sizeTotals[size]?.toLocaleString() || "-"}
                </td>
              ))}
              <td className="px-3 py-2 text-center text-xs text-white bg-gradient-to-r from-indigo-600 to-purple-600">
                {grandTotal.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

// SKU Data Table
const SKUDataTable = ({ skuData, orderNo }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!skuData || skuData.length === 0) return null;

  const displayData = isExpanded ? skuData : skuData.slice(0, 3);

  return (
    <div className="space-y-2">
      {orderNo && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg">
            {orderNo}
          </span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              <th className="px-2 py-1.5 text-left font-bold uppercase">SKU</th>
              <th className="px-2 py-1.5 text-left font-bold uppercase">
                PO Line
              </th>
              <th className="px-2 py-1.5 text-left font-bold uppercase">
                Color
              </th>
              <th className="px-2 py-1.5 text-center font-bold uppercase">
                ETD
              </th>
              <th className="px-2 py-1.5 text-center font-bold uppercase">
                ETA
              </th>
              <th className="px-2 py-1.5 text-right font-bold uppercase">
                Qty
              </th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((sku, index) => (
              <tr
                key={index}
                className={`border-b border-gray-200 dark:border-gray-700 ${
                  index % 2 === 0
                    ? "bg-white dark:bg-gray-800"
                    : "bg-gray-50 dark:bg-gray-800/50"
                }`}
              >
                <td className="px-2 py-1.5 font-mono text-gray-700 dark:text-gray-300">
                  {sku.sku || "N/A"}
                </td>
                <td className="px-2 py-1.5 text-gray-600 dark:text-gray-400">
                  {sku.POLine || "N/A"}
                </td>
                <td className="px-2 py-1.5 text-gray-700 dark:text-gray-300">
                  {sku.Color || "N/A"}
                </td>
                <td className="px-2 py-1.5 text-center text-gray-600 dark:text-gray-400">
                  {sku.ETD || "-"}
                </td>
                <td className="px-2 py-1.5 text-center text-gray-600 dark:text-gray-400">
                  {sku.ETA || "-"}
                </td>
                <td className="px-2 py-1.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                  {sku.Qty?.toLocaleString() || 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {skuData.length > 3 && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors flex items-center justify-center gap-1"
        >
          {isExpanded ? (
            <ChevronUp className="w-3 h-3" />
          ) : (
            <ChevronDown className="w-3 h-3" />
          )}
          {isExpanded ? "Show Less" : `Show All (${skuData.length})`}
        </button>
      )}
    </div>
  );
};

// Info Card Component
const InfoCard = ({ icon: Icon, label, value, color = "indigo" }) => {
  const colorClasses = {
    indigo:
      "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
    emerald:
      "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
    purple:
      "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
    orange:
      "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    blue: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    pink: "bg-pink-50 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 border-pink-200 dark:border-pink-800"
  };

  return (
    <div
      className={`flex items-center gap-2 p-2.5 rounded-xl border ${colorClasses[color]} transition-all hover:shadow-md`}
    >
      <div className="p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </p>
        <p
          className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate"
          title={value || "N/A"}
        >
          {value || "N/A"}
        </p>
      </div>
    </div>
  );
};

// Order Type Toggle
const OrderTypeToggle = ({
  orderType,
  setOrderType,
  hasData,
  isSingleData
}) => {
  const types = [
    { id: "qr", label: "Scan QR", short: "QR", icon: QrCode, color: "blue" },
    {
      id: "single",
      label: "Single",
      short: "S",
      icon: Package,
      color: "indigo"
    },
    { id: "multi", label: "Multi", short: "M", icon: Link2, color: "purple" },
    { id: "batch", label: "Batch", short: "B", icon: Boxes, color: "emerald" }
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
      {types.map((type) => {
        const isActive = orderType === type.id;
        const Icon = type.icon;

        // LOGIC TO GRAY OUT TABS
        let isDisabled = false;

        if (hasData && type.id !== "qr") {
          // If we have data loaded...
          if (isSingleData) {
            // If data is Single, disable Multi and Batch
            if (type.id === "multi" || type.id === "batch") isDisabled = true;
          } else {
            // If data is Multi/Batch (not Single), disable Single
            if (type.id === "single") isDisabled = true;
          }
        }

        return (
          <button
            key={type.id}
            onClick={() => !isDisabled && setOrderType(type.id)}
            disabled={isDisabled}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex-1 sm:flex-none ${
              isActive
                ? `bg-white dark:bg-gray-700 shadow-md text-${type.color}-600 dark:text-${type.color}-400`
                : isDisabled
                ? "text-gray-300 dark:text-gray-600 cursor-not-allowed opacity-60"
                : "text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50"
            }`}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            {/* Show Full Label on Desktop (sm and up) */}
            <span className="hidden sm:inline">{type.label}</span>
            {/* Show Short Label on Mobile */}
            <span className="inline sm:hidden">{type.short}</span>
          </button>
        );
      })}
    </div>
  );
};

// Selected Orders Chips
const SelectedOrdersChips = ({ orders, onRemove, isLocked }) => {
  if (!orders || orders.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {orders.map((orderNo) => (
        <div
          key={orderNo}
          className="flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium"
        >
          <span>{orderNo}</span>
          {/* Only show X if NOT locked */}
          {!isLocked && (
            <button
              onClick={() => onRemove(orderNo)}
              className="p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          {/* <button
            onClick={() => onRemove(orderNo)}
            className="p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full transition-colors"
          >
            <X className="w-3 h-3" />
          </button> */}
        </div>
      ))}
    </div>
  );
};

// Inspection Type Toggle Component
const InspectionTypeToggle = ({ inspectionType, setInspectionType }) => {
  const types = [
    { id: "first", label: "First Inspection", color: "emerald" },
    { id: "re", label: "Re-Inspection", color: "amber" }
  ];

  return (
    <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
      {types.map((type) => {
        const isActive = inspectionType === type.id;
        return (
          <button
            key={type.id}
            onClick={() => setInspectionType(type.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all flex-1 justify-center ${
              isActive
                ? type.color === "emerald"
                  ? "bg-white dark:bg-gray-700 shadow-md text-emerald-600 dark:text-emerald-400"
                  : "bg-white dark:bg-gray-700 shadow-md text-amber-600 dark:text-amber-400"
                : "text-gray-500 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50"
            }`}
          >
            {type.label}
          </button>
        );
      })}
    </div>
  );
};

// ============================================================
// Main Component
// ============================================================
const YPivotQAInspectionOrderData = ({
  onOrderDataChange,
  externalSelectedOrders,
  externalOrderData,
  externalOrderType,
  externalInspectionDate,
  // New props for Report Type integration
  onReportDataChange,
  savedReportState = {},
  externalInspectionType,
  onQualityPlanChange,
  qualityPlanData = {},
  user,
  onSaveComplete,
  savedReportId,
  savedReportData,
  isReportSaved = false
}) => {
  // Use external state if provided, otherwise use local state
  const [inspectionDateLocal, setInspectionDateLocal] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [orderTypeLocal, setOrderTypeLocal] = useState("single");
  const [selectedOrdersLocal, setSelectedOrdersLocal] = useState([]);
  const [orderDataLocal, setOrderDataLocal] = useState(null);

  // Add inspection type local state (after other local states)
  const [inspectionTypeLocal, setInspectionTypeLocal] = useState("first");

  // Determine which values to use (external props take priority)
  const inspectionDate =
    externalInspectionDate !== undefined
      ? externalInspectionDate
      : inspectionDateLocal;
  const orderType =
    externalOrderType !== undefined ? externalOrderType : orderTypeLocal;
  const selectedOrders =
    externalSelectedOrders !== undefined
      ? externalSelectedOrders
      : selectedOrdersLocal;
  const orderData =
    externalOrderData !== undefined ? externalOrderData : orderDataLocal;

  // Determine inspection type (after other determine statements)
  const inspectionType =
    externalInspectionType !== undefined
      ? externalInspectionType
      : inspectionTypeLocal;

  // Other state (always local)
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [error, setError] = useState(null);
  const skipSearchRef = useRef(false);
  const [shippingStages, setShippingStages] = useState([]);

  // State to control visibility of order details
  const [showOrderDetails, setShowOrderDetails] = useState(false);

  // NEW: Modal state
  const [showSaveModal, setShowSaveModal] = useState(false);

  // NEW: State for checking existence
  const [checkingExistence, setCheckingExistence] = useState(false);

  // Track previous orderType to detect actual changes
  const prevOrderTypeRef = useRef(orderType);

  // Unified state update function
  const updateState = useCallback(
    (updates) => {
      const newState = {
        inspectionDate:
          updates.inspectionDate !== undefined
            ? updates.inspectionDate
            : inspectionDate,
        orderType:
          updates.orderType !== undefined ? updates.orderType : orderType,
        selectedOrders:
          updates.selectedOrders !== undefined
            ? updates.selectedOrders
            : selectedOrders,
        orderData:
          updates.orderData !== undefined ? updates.orderData : orderData,
        inspectionType:
          updates.inspectionType !== undefined
            ? updates.inspectionType
            : inspectionType
      };

      // Update local state
      if (updates.inspectionDate !== undefined)
        setInspectionDateLocal(updates.inspectionDate);
      if (updates.orderType !== undefined) setOrderTypeLocal(updates.orderType);
      if (updates.selectedOrders !== undefined)
        setSelectedOrdersLocal(updates.selectedOrders);
      if (updates.orderData !== undefined) setOrderDataLocal(updates.orderData);
      if (updates.inspectionType !== undefined)
        setInspectionTypeLocal(updates.inspectionType);

      // Notify parent
      onOrderDataChange?.(newState);
    },
    [
      inspectionDate,
      orderType,
      selectedOrders,
      orderData,
      inspectionType,
      onOrderDataChange
    ]
  );

  // Wrapper functions
  const setInspectionDate = useCallback(
    (value) => {
      updateState({ inspectionDate: value });
    },
    [updateState]
  );

  const setOrderType = useCallback(
    (value) => {
      // ONLY update the orderType.
      updateState({
        orderType: value
      });
      // do NOT hide order details, so if user comes back, it's still there.
    },
    [updateState]
  );

  const setSelectedOrders = useCallback(
    (value) => {
      updateState({ selectedOrders: value });
    },
    [updateState]
  );

  const setOrderData = useCallback(
    (value) => {
      updateState({ orderData: value });
    },
    [updateState]
  );

  // Add setInspectionType wrapper function (after other wrapper functions):
  const setInspectionType = useCallback(
    (value) => {
      updateState({ inspectionType: value });
    },
    [updateState]
  );

  // Reset search state when order type changes (but NOT the order data - that's handled by setOrderType)
  useEffect(() => {
    if (prevOrderTypeRef.current !== orderType) {
      prevOrderTypeRef.current = orderType;
      setSearchTerm("");
      setSearchResults([]);
      setShowSearchDropdown(false);
      setError(null);
    }
  }, [orderType]);

  // Search orders
  const searchOrders = useCallback(
    async (term) => {
      if (!term || term.length < 2) {
        setSearchResults([]);
        return;
      }

      setSearchLoading(true);
      try {
        const mode = orderType === "multi" ? "multi" : "single";
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-inspection/search-orders?term=${term}&mode=${mode}`
        );
        if (res.data.success) {
          setSearchResults(res.data.data);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error("Search error:", err);
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    },
    [orderType]
  );

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (skipSearchRef.current) {
        skipSearchRef.current = false;
        return;
      }
      searchOrders(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, searchOrders]);

  useEffect(() => {
    const fetchShippingStages = async () => {
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/qa-sections-shipping-stage`
        );
        if (response.data.success) {
          setShippingStages(response.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch shipping stages:", err);
      }
    };

    fetchShippingStages();
  }, []);

  // Fetch single order details
  const fetchSingleOrderDetails = async (moNo) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-inspection/order-details/${moNo}`
      );
      if (res.data.success) {
        const newOrderData = {
          ...res.data.data,
          isSingle: true,
          orderBreakdowns: [
            {
              orderNo: moNo,
              totalQty: res.data.data.dtOrder.totalQty,
              colorSizeBreakdown: res.data.data.colorSizeBreakdown,
              yorksysOrder: res.data.data.yorksysOrder
            }
          ]
        };

        // Update both selectedOrders and orderData together
        updateState({
          selectedOrders: [moNo],
          orderData: newOrderData
        });

        setShowSearchDropdown(false);
        setSearchResults([]);
        // Reset show order details when new order is selected
        setShowOrderDetails(false);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.response?.data?.message || "Failed to fetch order details");
      updateState({ orderData: null });
    } finally {
      setLoading(false);
    }
  };

  // Fetch multiple order details
  const fetchMultipleOrderDetails = async (orderNos) => {
    if (!orderNos || orderNos.length === 0) {
      updateState({ selectedOrders: [], orderData: null });
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/multiple-order-details`,
        { orderNos: orderNos }
      );
      if (res.data.success) {
        // Include selectedOrders to avoid stale closure issue
        updateState({
          selectedOrders: orderNos,
          orderData: {
            ...res.data.data,
            isSingle: false
          }
        });
        // Reset show order details when new orders are selected
        setShowOrderDetails(false);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.response?.data?.message || "Failed to fetch order details");
      updateState({ selectedOrders: orderNos, orderData: null });
    } finally {
      setLoading(false);
    }
  };

  // Handle order selection - Single mode
  const handleSelectSingleOrder = (order) => {
    skipSearchRef.current = true;
    setShowSearchDropdown(false);
    setSearchResults([]);
    setSearchTerm(order.Order_No);
    fetchSingleOrderDetails(order.Order_No);
  };

  // Handle order selection - Multi mode
  const handleSelectMultiOrder = (group) => {
    setShowSearchDropdown(false);
    setSearchResults([]);
    setSearchTerm("");
    // fetchMultipleOrderDetails will update both selectedOrders and orderData
    fetchMultipleOrderDetails(group.orderNos);
  };

  // Handle order selection - Batch mode
  const handleSelectBatchOrder = (order) => {
    const orderNo = order.Order_No;
    if (!selectedOrders.includes(orderNo)) {
      const newOrders = [...selectedOrders, orderNo];
      // fetchMultipleOrderDetails will update both selectedOrders and orderData
      fetchMultipleOrderDetails(newOrders);
    }
    setShowSearchDropdown(false);
    setSearchResults([]);
    setSearchTerm("");
  };

  // Remove order from selection
  const handleRemoveOrder = (orderNo) => {
    const newOrders = selectedOrders.filter((o) => o !== orderNo);
    if (newOrders.length > 0) {
      // fetchMultipleOrderDetails will update both selectedOrders and orderData
      fetchMultipleOrderDetails(newOrders);
    } else {
      updateState({ selectedOrders: [], orderData: null });
      setShowOrderDetails(false);
    }
  };

  // Clear all selections
  const handleClearAll = () => {
    updateState({
      selectedOrders: [],
      orderData: null
    });
    setSearchTerm("");
    setSearchResults([]);
    setError(null);
    setShowOrderDetails(false);
  };

  // Refresh data
  const handleRefresh = () => {
    if (selectedOrders.length === 1 && orderType === "single") {
      fetchSingleOrderDetails(selectedOrders[0]);
    } else if (selectedOrders.length > 0) {
      fetchMultipleOrderDetails(selectedOrders);
    }
  };

  // Format fabric content
  const formatFabricContent = (fabricContent) => {
    if (!fabricContent || fabricContent.length === 0) return "N/A";
    return fabricContent
      .map((fc) => `${fc.fabricName} ${fc.percentageValue}%`)
      .join(", ");
  };

  // Render search dropdown based on order type
  const renderSearchDropdown = () => {
    if (!showSearchDropdown || searchResults.length === 0) return null;

    if (orderType === "multi") {
      return (
        <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
          {searchResults.map((group, index) => (
            <button
              key={index}
              onClick={() => handleSelectMultiOrder(group)}
              className="w-full px-4 py-3 text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-purple-500" />
                    {group.baseOrderNo}
                    <span className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-1.5 py-0.5 rounded">
                      {group.orderCount} orders
                    </span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {group.orderNos.join(", ")}
                  </p>
                </div>
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">
                  {group.totalQty?.toLocaleString() || 0} pcs
                </span>
              </div>
            </button>
          ))}
        </div>
      );
    }

    // Single or Batch mode
    return (
      <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto">
        {searchResults.map((order, index) => {
          const isAlreadySelected = selectedOrders.includes(order.Order_No);
          return (
            <button
              key={index}
              onClick={() =>
                orderType === "single"
                  ? handleSelectSingleOrder(order)
                  : handleSelectBatchOrder(order)
              }
              disabled={isAlreadySelected && orderType === "batch"}
              className={`w-full px-4 py-3 text-left transition-colors border-b border-gray-100 dark:border-gray-700 last:border-0 ${
                isAlreadySelected && orderType === "batch"
                  ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-50"
                  : "hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    {order.Order_No}
                    {isAlreadySelected && orderType === "batch" && (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    )}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {order.CustStyle || "N/A"} • {order.EngName || "N/A"}
                  </p>
                </div>
                <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-lg">
                  {order.TotalQty?.toLocaleString() || 0} pcs
                </span>
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  // ============================================================
  // NEW: REAL-TIME CHECK FOR EXISTING REPORT
  // ============================================================
  useEffect(() => {
    // Extract Index Fields from state
    const reportTypeId = savedReportState?.selectedTemplate?._id;
    // Product Type usually comes from the Template Config or Order Data
    const productTypeId = savedReportState?.config?.productTypeId;

    // Check if we have all necessary data AND we haven't already saved/loaded
    if (
      !isReportSaved &&
      inspectionDate &&
      inspectionType &&
      selectedOrders.length > 0 &&
      reportTypeId &&
      productTypeId &&
      user?.emp_id
    ) {
      const checkReport = async () => {
        setCheckingExistence(true);
        try {
          const res = await axios.post(
            `${API_BASE_URL}/api/fincheck-inspection/check-existing-report`,
            {
              inspectionDate,
              inspectionType,
              orderNos: selectedOrders,
              empId: user.emp_id,
              productTypeId,
              reportTypeId
            }
          );

          if (res.data.success && res.data.exists) {
            console.log("Existing report found!", res.data.data);

            // Hydrate Quality Plan / Production Status
            if (onQualityPlanChange && foundReport.inspectionDetails) {
              onQualityPlanChange({
                productionStatus:
                  foundReport.inspectionDetails.productionStatus || {},
                packingList: foundReport.inspectionDetails.packingList || {},
                accountedPercentage: "0.00" // Component will recalculate this automatically
              });
            }

            // AUTOMATICALLY LOAD THE DATA (Switch to Update Mode)
            if (onSaveComplete) {
              onSaveComplete({
                reportData: res.data.data,
                isNew: false,
                message: "Existing report loaded automatically."
              });
            }
          }
        } catch (err) {
          console.error("Auto-check failed", err);
        } finally {
          setCheckingExistence(false);
        }
      };

      // 500ms delay to prevent API spam while typing/selecting
      const timer = setTimeout(checkReport, 500);
      return () => clearTimeout(timer);
    }
  }, [
    inspectionDate,
    inspectionType,
    selectedOrders,
    savedReportState?.selectedTemplate,
    savedReportState?.config?.productTypeId,
    user?.emp_id,
    isReportSaved, // Stop checking if we are already in saved mode
    onSaveComplete
  ]);

  // Validation for save
  const canSave = useMemo(() => {
    // Required: Date, Inspection Type, Order(s), Order Data, Report Type
    if (!inspectionDate) return false;
    if (!inspectionType) return false;
    if (!selectedOrders || selectedOrders.length === 0) return false;
    if (!orderData) return false;
    if (!savedReportState?.selectedTemplate) return false;

    const template = savedReportState.selectedTemplate;
    const config = savedReportState.config || {};

    // If AQL method, inspected qty is required
    if (template.InspectedQtyMethod === "AQL") {
      if (!config.inspectedQty || parseInt(config.inspectedQty) <= 0)
        return false;
    }

    // If carton is required
    if (template.isCarton === "Yes") {
      if (!config.cartonQty || parseInt(config.cartonQty) <= 0) return false;
    }

    // If shipping stage is required
    // if (template.ShippingStage === "Yes") {
    //   if (!config.shippingStage) return false;
    // }

    // Product Type is required
    if (!config.productTypeId && !orderData?.yorksysOrder?.productType)
      return false;

    return true;
  }, [
    inspectionDate,
    inspectionType,
    selectedOrders,
    orderData,
    savedReportState
  ]);

  // Handle save modal confirm
  const handleSaveConfirm = (savedData) => {
    setShowSaveModal(false);
    if (onSaveComplete) {
      onSaveComplete(savedData);
    }
  };

  // --- NEW: Handle Report Retrieval from QR/ID ---
  const handleReportByQR = async (reportId) => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Report Metadata
      const reportRes = await axios.get(
        `${API_BASE_URL}/api/fincheck-inspection/report/${reportId}`
      );

      if (reportRes.data.success) {
        const reportData = reportRes.data.data;

        // Extract key info from the report
        const backendOrderType = reportData.orderType || "single";
        const backendOrderNos = reportData.orderNos || [];
        const backendInspectionDate = reportData.inspectionDate
          ? reportData.inspectionDate.split("T")[0]
          : new Date().toISOString().split("T")[0];
        const backendInspectionType = reportData.inspectionType || "first";

        // 2. Load Order Data based on the type found in report
        let orderFetchSuccess = false;

        if (backendOrderType === "single" && backendOrderNos.length > 0) {
          const orderRes = await axios.get(
            `${API_BASE_URL}/api/fincheck-inspection/order-details/${backendOrderNos[0]}`
          );
          if (orderRes.data.success) {
            const newOrderData = {
              ...orderRes.data.data,
              isSingle: true,
              orderBreakdowns: [
                {
                  orderNo: backendOrderNos[0],
                  totalQty: orderRes.data.data.dtOrder.totalQty,
                  colorSizeBreakdown: orderRes.data.data.colorSizeBreakdown,
                  yorksysOrder: orderRes.data.data.yorksysOrder
                }
              ]
            };

            updateState({
              selectedOrders: backendOrderNos,
              orderData: newOrderData,
              inspectionDate: backendInspectionDate,
              inspectionType: backendInspectionType,
              orderType: "single"
            });
            orderFetchSuccess = true;
          }
        } else if (
          (backendOrderType === "multi" || backendOrderType === "batch") &&
          backendOrderNos.length > 0
        ) {
          const orderRes = await axios.post(
            `${API_BASE_URL}/api/fincheck-inspection/multiple-order-details`,
            { orderNos: backendOrderNos }
          );
          if (orderRes.data.success) {
            updateState({
              selectedOrders: backendOrderNos,
              orderData: { ...orderRes.data.data, isSingle: false },
              inspectionDate: backendInspectionDate,
              inspectionType: backendInspectionType,
              orderType: backendOrderType
            });
            orderFetchSuccess = true;
          }
        }

        if (orderFetchSuccess) {
          // =====================================================
          // NEW: Fetch the Report Template if we have the ID
          // =====================================================
          let selectedTemplate = null;
          const reportTypeId = reportData.inspectionDetails?.reportTypeId;

          if (reportTypeId) {
            try {
              const templateRes = await axios.get(
                `${API_BASE_URL}/api/qa-template-report-type/${reportTypeId}`
              );
              if (templateRes.data.success || templateRes.data) {
                selectedTemplate = templateRes.data.data || templateRes.data;
              }
            } catch (templateErr) {
              console.warn("Could not fetch template:", templateErr);
            }
          }

          // Attach the template to the report data
          const enrichedReportData = {
            ...reportData,
            selectedTemplate: selectedTemplate
          };

          // Hydrate Quality Plan / Production Status
          if (onQualityPlanChange && reportData.inspectionDetails) {
            onQualityPlanChange({
              productionStatus:
                reportData.inspectionDetails.productionStatus || {},
              packingList: reportData.inspectionDetails.packingList || {},
              accountedPercentage: "0.00"
            });
          }

          // 3. Hydrate Parent State via onSaveComplete
          if (onSaveComplete) {
            onSaveComplete({
              reportData: enrichedReportData,
              isNew: false,
              message: "Report loaded via QR Code"
            });
          }
        } else {
          setError("Order data linked to this report could not be found.");
        }
      } else {
        setError(
          "Report not found. Please check the ID or start a new inspection."
        );
      }
    } catch (err) {
      console.error("QR Load Error:", err);
      if (err.response && err.response.status === 404) {
        setError("Report ID does not exist.");
      } else {
        setError("Failed to load report data. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Selection Section */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 relative z-20">
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3 flex items-center justify-between">
          <h2 className="text-white font-bold text-sm flex items-center gap-2">
            <Package className="w-4 h-4" />
            Order
          </h2>
          <div className="flex items-center gap-2">
            {isReportSaved && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-green-500 rounded-lg text-xs font-bold text-white">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Saved
              </div>
            )}
            <OrderTypeToggle
              orderType={orderType}
              setOrderType={setOrderType}
              hasData={!!orderData}
              isSingleData={orderData?.isSingle}
            />
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Order Type Description */}
          <div className="p-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              {orderType === "qr" &&
                "Scan a QR code to load an existing inspection report."}
              {orderType === "single" &&
                "Select a single order for inspection."}
              {orderType === "multi" &&
                "Automatically combines related orders (e.g., PTCOC335, PTCOC335A)."}
              {orderType === "batch" &&
                "Manually select multiple orders for combined inspection."}
            </p>
          </div>

          {/* --- CONDITIONALLY RENDER QR COMPONENT OR FORM --- */}
          {orderType === "qr" ? (
            <YPivotQAInspectionQRCodeReading
              onReportFound={handleReportByQR}
              isLoading={loading}
            />
          ) : (
            /* --- EXISTING FORM CONTENT --- */
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Inspection Date */}
                <div className={`min-w-0 ${isReportSaved ? "opacity-75" : ""}`}>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    {isReportSaved && (
                      <Lock className="w-3 h-3 text-gray-400" />
                    )}
                  </label>
                  <input
                    type="date"
                    value={inspectionDate}
                    onChange={(e) => setInspectionDate(e.target.value)}
                    disabled={isReportSaved}
                    className="w-11/12 md:w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-base sm:text-sm font-medium text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:cursor-not-allowed"
                  />
                </div>

                {/* Inspection Type */}
                <div
                  className={
                    isReportSaved ? "opacity-75 pointer-events-none" : ""
                  }
                >
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <ClipboardList className="w-3.5 h-3.5 text-emerald-500" />
                    {isReportSaved && (
                      <Lock className="w-3 h-3 text-gray-400" />
                    )}
                  </label>
                  <InspectionTypeToggle
                    inspectionType={inspectionType}
                    setInspectionType={setInspectionType}
                  />
                </div>

                {/* Order Search */}
                <div
                  className={`relative ${
                    isReportSaved ? "opacity-75 pointer-events-none" : ""
                  }`}
                  style={{ zIndex: 60 }}
                >
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Search className="w-3.5 h-3.5 text-indigo-500" />
                    {orderType === "batch" ? "Add Order No" : "Order No"}
                    {/* SHOW LOCK ICON IF SAVED */}
                    {isReportSaved && (
                      <Lock className="w-3 h-3 text-gray-400" />
                    )}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onFocus={() =>
                        searchResults.length > 0 && setShowSearchDropdown(true)
                      }
                      placeholder={
                        isReportSaved
                          ? "Order locked"
                          : orderType === "batch"
                          ? "Search to add more orders..."
                          : "Search MO Number..."
                      }
                      className="w-full pl-10 pr-10 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-base sm:text-sm font-medium text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    {searchLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-500 animate-spin" />
                    )}
                  </div>
                  {!isReportSaved && renderSearchDropdown()}
                </div>
              </div>

              {/* Selected Orders (for Multi/Batch) */}
              {selectedOrders.length > 0 &&
                (orderType === "multi" || orderType === "batch") && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                        Selected Orders ({selectedOrders.length})
                      </label>
                      {!isReportSaved && (
                        <button
                          onClick={handleClearAll}
                          className="text-xs text-red-500 hover:text-red-600 font-medium"
                        >
                          Clear All
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {selectedOrders.map((orderNo) => (
                        <div
                          key={orderNo}
                          className="flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-medium"
                        >
                          <span>{orderNo}</span>
                          {!isReportSaved && (
                            <button
                              onClick={() => handleRemoveOrder(orderNo)}
                              className="p-0.5 hover:bg-indigo-200 dark:hover:bg-indigo-800 rounded-full transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <SelectedOrdersChips
                      orders={selectedOrders}
                      onRemove={handleRemoveOrder}
                      isLocked={isReportSaved}
                    />
                  </div>
                )}

              {/* Selected Order Badge (Single mode) */}
              {selectedOrders.length === 1 && orderType === "single" && (
                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-green-700 dark:text-green-400">
                      Order Selected: {selectedOrders[0]}
                    </p>
                    <p className="text-xs text-green-600 dark:text-green-500">
                      Inspection Date:{" "}
                      {new Date(inspectionDate).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={handleRefresh}
                    className="p-2 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg transition-colors"
                    title="Refresh Data"
                  >
                    <RefreshCw className="w-4 h-4 text-green-600" />
                  </button>
                  {/* --- Only show X button if NOT saved --- */}
                  {!isReportSaved && (
                    <button
                      onClick={handleClearAll}
                      className="p-2 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                      title="Clear Selection"
                    >
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                  {/* <button
                    onClick={handleClearAll}
                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                    title="Clear Selection"
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </button> */}
                </div>
              )}

              {/* Multi/Batch Selected Badge */}
              {selectedOrders.length > 0 &&
                (orderType === "multi" || orderType === "batch") &&
                orderData && (
                  <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl">
                    <Link2 className="w-5 h-5 text-purple-500" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-purple-700 dark:text-purple-400">
                        {selectedOrders.length} Orders Combined
                      </p>
                      <p className="text-xs text-purple-600 dark:text-purple-500">
                        Total Qty:{" "}
                        {orderData.dtOrder?.totalQty?.toLocaleString() || 0} pcs
                      </p>
                    </div>
                    <button
                      onClick={handleRefresh}
                      className="p-2 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors"
                      title="Refresh Data"
                    >
                      <RefreshCw className="w-4 h-4 text-purple-600" />
                    </button>
                  </div>
                )}
            </>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mb-4" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            Loading order details...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-700 dark:text-red-400">
              Error Loading Order
            </p>
            <p className="text-sm text-red-600 dark:text-red-500">{error}</p>
          </div>
        </div>
      )}

      {/* Order Data Toggle Section */}
      {orderData && !loading && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowOrderDetails(!showOrderDetails)}
            className="w-full bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 px-4 py-3 flex items-center justify-between rounded-t-2xl transition-all"
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-white" />
              <h3 className="text-white font-bold text-sm">Order Data</h3>
              <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
                {selectedOrders.length}{" "}
                {selectedOrders.length === 1 ? "Order" : "Orders"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/70">
                {showOrderDetails ? "Click to hide" : "Click to view details"}
              </span>
              {showOrderDetails ? (
                <EyeOff className="w-5 h-5 text-white" />
              ) : (
                <Eye className="w-5 h-5 text-white" />
              )}
            </div>
          </button>

          {/* Collapsible Content */}
          {showOrderDetails && (
            <div className="p-4 space-y-4 animate-fadeIn">
              {/* Order Information */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 px-4 py-2.5 flex items-center justify-between rounded-t-xl">
                  <h3 className="text-white font-bold text-sm flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Order Information
                  </h3>
                  {!orderData.isSingle && (
                    <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full font-medium">
                      {selectedOrders.length} Orders Combined
                    </span>
                  )}
                </div>

                <div className="p-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    <InfoCard
                      icon={Tag}
                      label="Cust. Style"
                      value={orderData.dtOrder?.custStyle}
                      color="indigo"
                    />
                    <InfoCard
                      icon={User}
                      label="Customer"
                      value={orderData.dtOrder?.customer}
                      color="purple"
                    />
                    <InfoCard
                      icon={Building2}
                      label="Factory"
                      value={orderData.dtOrder?.factory}
                      color="blue"
                    />
                    <InfoCard
                      icon={Hash}
                      label="Total Qty"
                      value={orderData.dtOrder?.totalQty?.toLocaleString()}
                      color="emerald"
                    />
                    <InfoCard
                      icon={Globe}
                      label="Origin"
                      value={orderData.dtOrder?.origin}
                      color="orange"
                    />
                    <InfoCard
                      icon={Truck}
                      label="Mode"
                      value={orderData.dtOrder?.mode}
                      color="pink"
                    />
                    <InfoCard
                      icon={Users}
                      label="Sales Team"
                      value={orderData.dtOrder?.salesTeamName}
                      color="indigo"
                    />
                    <InfoCard
                      icon={MapPin}
                      label="Country"
                      value={orderData.dtOrder?.country}
                      color="purple"
                    />
                  </div>
                </div>
              </div>

              {/* Yorksys Order Info */}
              {orderData.yorksysOrder && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-4 py-2.5 rounded-t-xl">
                    <h3 className="text-white font-bold text-sm flex items-center gap-2">
                      <Layers className="w-4 h-4" />
                      Additional Order Details
                    </h3>
                  </div>

                  <div className="p-3">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mb-3">
                      <InfoCard
                        icon={Tag}
                        label="SKU Description"
                        value={orderData.yorksysOrder.skuDescription}
                        color="purple"
                      />
                      <InfoCard
                        icon={MapPin}
                        label="Destination"
                        value={orderData.yorksysOrder.destination}
                        color="blue"
                      />
                      <InfoCard
                        icon={Calendar}
                        label="Season"
                        value={orderData.yorksysOrder.season}
                        color="orange"
                      />
                      <InfoCard
                        icon={Shirt}
                        label="Product Type"
                        value={orderData.yorksysOrder.productType}
                        color="pink"
                      />
                    </div>

                    {orderData.yorksysOrder.fabricContent &&
                      orderData.yorksysOrder.fabricContent.length > 0 && (
                        <div className="p-2.5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                          <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400 mb-1 uppercase tracking-wide">
                            Fabric Content
                          </p>
                          <p className="text-xs font-medium text-gray-800 dark:text-gray-200">
                            {formatFabricContent(
                              orderData.yorksysOrder.fabricContent
                            )}
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Color/Size Breakdown - Per Order */}
              {orderData.orderBreakdowns &&
                orderData.orderBreakdowns.length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-2.5 flex items-center justify-between rounded-t-xl">
                      <h3 className="text-white font-bold text-sm flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Order Qty by Color & Size
                      </h3>
                      <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full font-medium">
                        {orderData.orderBreakdowns.length}{" "}
                        {orderData.orderBreakdowns.length === 1
                          ? "Order"
                          : "Orders"}
                      </span>
                    </div>
                    <div className="p-3 space-y-4">
                      {orderData.orderBreakdowns.map((breakdown, index) => (
                        <div
                          key={breakdown.orderNo}
                          className={
                            index > 0
                              ? "pt-4 border-t border-gray-200 dark:border-gray-700"
                              : ""
                          }
                        >
                          <ColorSizeBreakdownTable
                            data={breakdown.colorSizeBreakdown}
                            orderNo={
                              orderData.orderBreakdowns.length > 1
                                ? breakdown.orderNo
                                : null
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* SKU Data - Per Order */}
              {orderData.orderBreakdowns &&
                orderData.orderBreakdowns.some(
                  (b) => b.yorksysOrder?.skuData?.length > 0
                ) && (
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-4 py-2.5 flex items-center justify-between rounded-t-xl">
                      <h3 className="text-white font-bold text-sm flex items-center gap-2">
                        <Hash className="w-4 h-4" />
                        Order Data by SKU
                      </h3>
                    </div>
                    <div className="p-3 space-y-4">
                      {orderData.orderBreakdowns
                        .filter((b) => b.yorksysOrder?.skuData?.length > 0)
                        .map((breakdown, index) => (
                          <div
                            key={breakdown.orderNo}
                            className={
                              index > 0
                                ? "pt-4 border-t border-gray-200 dark:border-gray-700"
                                : ""
                            }
                          >
                            <SKUDataTable
                              skuData={breakdown.yorksysOrder.skuData}
                              orderNo={
                                orderData.orderBreakdowns.length > 1
                                  ? breakdown.orderNo
                                  : null
                              }
                            />
                          </div>
                        ))}
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      )}

      {/* Empty State - Only show when no orders selected */}
      {!selectedOrders.length && !loading && orderType !== "qr" && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 flex flex-col items-center justify-center">
          <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full mb-4">
            <Search className="w-10 h-10 text-indigo-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-700 dark:text-gray-300 mb-2">
            Search for an Order
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
            {orderType === "single" &&
              "Enter an MO Number to load order details."}
            {orderType === "multi" &&
              "Search to find and combine related orders automatically."}
            {orderType === "batch" &&
              "Search and select multiple orders for combined inspection."}
          </p>
        </div>
      )}

      {/* ============================================================ */}
      {/* Report Type Section - Integrated from YPivotQAInspectionReportType */}
      {/* ============================================================ */}
      {selectedOrders.length > 0 && orderData && !loading && (
        <>
          <YPivotQAInspectionReportType
            selectedOrders={selectedOrders}
            orderData={orderData}
            orderType={orderType}
            onReportDataChange={onReportDataChange}
            savedState={savedReportState}
            shippingStages={shippingStages}
            loadedReportData={savedReportData}
          />

          {/* Quality Plan - Only shows if template has QualityPlan="Yes" */}
          <YPivotQualityPlan
            selectedTemplate={savedReportState?.selectedTemplate}
            qualityPlanData={qualityPlanData}
            onQualityPlanChange={onQualityPlanChange}
          />

          {/* Save Button Section - Fixed at bottom of content */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div
              className={`px-4 py-3 ${
                isReportSaved
                  ? "bg-gradient-to-r from-blue-600 to-indigo-600"
                  : "bg-gradient-to-r from-green-500 to-emerald-600"
              }`}
            >
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                {isReportSaved ? (
                  <Edit3 className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isReportSaved
                  ? "Update Inspection Report"
                  : "Save Inspection Report"}
              </h3>
            </div>

            <div className="p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {canSave
                    ? isReportSaved
                      ? "You can update the configuration details below."
                      : "All required fields are complete. Ready to save!"
                    : "Complete all required fields to save/update the report."}
                </p>
                {isReportSaved && (
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Identity fields (Order, Date,
                    Type) are locked.
                  </p>
                )}
                {!canSave && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Make sure to select a Report Type and fill in all required
                    configuration.
                  </p>
                )}
              </div>

              <button
                onClick={() => setShowSaveModal(true)}
                disabled={!canSave}
                className={`flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-bold transition-all shadow-lg ${
                  canSave
                    ? isReportSaved
                      ? "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                      : "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                    : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                }`}
              >
                {isReportSaved ? (
                  <>
                    <RefreshCw className="w-5 h-5" />
                    Update Report
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Save Report
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Save Modal */}
          <YPivotQAInspectionOrderDataSaveModal
            isOpen={showSaveModal}
            onClose={() => setShowSaveModal(false)}
            onConfirm={handleSaveConfirm}
            user={user}
            orderState={{
              inspectionDate,
              inspectionType,
              selectedOrders,
              orderData,
              orderType
            }}
            reportState={savedReportState}
            qualityPlanData={qualityPlanData}
          />
        </>
      )}

      {/* Styles */}
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
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};

export default YPivotQAInspectionOrderData;
