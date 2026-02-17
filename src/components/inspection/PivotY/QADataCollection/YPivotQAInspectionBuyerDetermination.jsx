import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  Building2,
  ShoppingBag,
  Package,
  ImageIcon,
  ChevronDown,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Save,
} from "lucide-react";
import axios from "axios";
import { useTranslation } from "react-i18next";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";

// ============================================================
// Buyer Configuration
// ============================================================
const BUYER_CONFIG = {
  // --- Existing / High Priority ---
  ATACZ: {
    name: "ATACZ",
    fullName: "ATACZ",
    gradientClass: "from-cyan-500 to-cyan-600",
    textClass: "text-cyan-600 dark:text-cyan-400",
    bgClass: "bg-cyan-50 dark:bg-cyan-900/30",
    borderClass: "border-cyan-200 dark:border-cyan-800",
    code: "PMHA",
  },
  "TRUE NORTH": {
    name: "True North",
    fullName: "True North",
    gradientClass: "from-sky-500 to-sky-600",
    textClass: "text-sky-600 dark:text-sky-400",
    bgClass: "bg-sky-50 dark:bg-sky-900/30",
    borderClass: "border-sky-200 dark:border-sky-800",
    code: "COW",
  },
  Costco: {
    name: "Costco",
    fullName: "Costco Wholesale",
    gradientClass: "from-red-500 to-red-600",
    textClass: "text-red-600 dark:text-red-400",
    bgClass: "bg-red-50 dark:bg-red-900/30",
    borderClass: "border-red-200 dark:border-red-800",
    code: "CO",
  },
  Aritzia: {
    name: "Aritzia",
    fullName: "Aritzia",
    gradientClass: "from-purple-500 to-purple-600",
    textClass: "text-purple-600 dark:text-purple-400",
    bgClass: "bg-purple-50 dark:bg-purple-900/30",
    borderClass: "border-purple-200 dark:border-purple-800",
    code: "AR",
  },
  "KIT AND ACE": {
    name: "Kit & Ace",
    fullName: "Kit and Ace",
    gradientClass: "from-slate-500 to-slate-600",
    textClass: "text-slate-600 dark:text-slate-400",
    bgClass: "bg-slate-50 dark:bg-slate-900/30",
    borderClass: "border-slate-200 dark:border-slate-800",
    code: "KA",
  },
  Reitmans: {
    name: "Reitmans",
    fullName: "Reitmans",
    gradientClass: "from-pink-500 to-pink-600",
    textClass: "text-pink-600 dark:text-pink-400",
    bgClass: "bg-pink-50 dark:bg-pink-900/30",
    borderClass: "border-pink-200 dark:border-pink-800",
    code: "RT",
  },

  // --- New Additions ---
  "G.A.": {
    name: "G.A.",
    fullName: "G.A.",
    gradientClass: "from-orange-500 to-orange-600",
    textClass: "text-orange-600 dark:text-orange-400",
    bgClass: "bg-orange-50 dark:bg-orange-900/30",
    borderClass: "border-orange-200 dark:border-orange-800",
    code: "EA",
  },
  LUNYA: {
    name: "Lunya",
    fullName: "Lunya",
    gradientClass: "from-violet-500 to-violet-600",
    textClass: "text-violet-600 dark:text-violet-400",
    bgClass: "bg-violet-50 dark:bg-violet-900/30",
    borderClass: "border-violet-200 dark:border-violet-800",
    code: "LY",
  },
  "OAK AND FORT": {
    name: "Oak & Fort",
    fullName: "Oak and Fort",
    gradientClass: "from-stone-500 to-stone-600",
    textClass: "text-stone-600 dark:text-stone-400",
    bgClass: "bg-stone-50 dark:bg-stone-900/30",
    borderClass: "border-stone-200 dark:border-stone-800",
    code: "OF",
  },
  "Bjorn Borg": {
    name: "Bjorn Borg",
    fullName: "Bjorn Borg",
    gradientClass: "from-lime-500 to-lime-600",
    textClass: "text-lime-600 dark:text-lime-400",
    bgClass: "bg-lime-50 dark:bg-lime-900/30",
    borderClass: "border-lime-200 dark:border-lime-800",
    code: "BB",
  },

  // --- Sweater Specifics ---
  "SWEATERS P.A.R. APPAREL LLC": {
    name: "PAR Apparel",
    fullName: "Sweaters PAR Apparel LLC",
    gradientClass: "from-amber-500 to-amber-600",
    textClass: "text-amber-600 dark:text-amber-400",
    bgClass: "bg-amber-50 dark:bg-amber-900/30",
    borderClass: "border-amber-200 dark:border-amber-800",
    code: "PA",
  },
  "SWEATER FAMILY": {
    name: "Sweater Family",
    fullName: "Sweater Family",
    gradientClass: "from-rose-500 to-rose-600",
    textClass: "text-rose-600 dark:text-rose-400",
    bgClass: "bg-rose-50 dark:bg-rose-900/30",
    borderClass: "border-rose-200 dark:border-rose-800",
    code: "GF",
  },
  "SWEATER OAK AND FORT": {
    name: "Sweater Oak & Fort",
    fullName: "Sweater Oak & Fort",
    gradientClass: "from-stone-600 to-stone-700",
    textClass: "text-stone-700 dark:text-stone-300",
    bgClass: "bg-stone-100 dark:bg-stone-800",
    borderClass: "border-stone-300 dark:border-stone-600",
    code: "MOF",
  },
  "SWEATER COSTCO": {
    name: "Sweater Costco",
    fullName: "Sweater Costco",
    gradientClass: "from-red-600 to-red-700",
    textClass: "text-red-700 dark:text-red-300",
    bgClass: "bg-red-100 dark:bg-red-900/50",
    borderClass: "border-red-300 dark:border-red-700",
    code: "MCOC",
  },

  // --- Fallback ---
  Other: {
    name: "Unknown",
    fullName: "Unknown / Other",
    gradientClass: "from-gray-500 to-gray-600",
    textClass: "text-gray-600 dark:text-gray-400",
    bgClass: "bg-gray-50 dark:bg-gray-900/30",
    borderClass: "border-gray-200 dark:border-gray-700",
    code: "--",
  },
};

// ============================================================
// Buyer Determination Logic
// ============================================================
export const determineBuyerFromOrderNo = (orderNo) => {
  if (!orderNo || typeof orderNo !== "string") {
    return { buyer: "Other" };
  }

  const moNo = orderNo.toUpperCase();

  // 1. Check for the most specific "PMHA" for ATACZ
  if (moNo.includes("PMHA")) return { buyer: "ATACZ" };

  // 2. Check for the more specific "COW" for True North
  if (moNo.includes("COW")) return { buyer: "TRUE NORTH" };

  // 3. Check for Costco variants
  if (moNo.includes("COC")) return { buyer: "Costco" };
  if (moNo.includes("COT")) return { buyer: "Costco" };
  if (moNo.includes("COX")) return { buyer: "Costco" };
  if (moNo.includes("COA")) return { buyer: "Costco" };
  if (moNo.includes("PMCOC")) return { buyer: "SWEATER COSTCO" }; // Moved here for grouping, though specific check exists below

  // 4. Aritzia
  if (moNo.includes("GPAR")) return { buyer: "Aritzia" };
  if (moNo.includes("PTAR")) return { buyer: "Aritzia" };

  // 5. Kit & Ace
  if (moNo.includes("PTKA")) return { buyer: "KIT AND ACE" };

  // 6. Reitmans
  if (moNo.includes("PTRT")) return { buyer: "Reitmans" };
  if (moNo.includes("GPRT")) return { buyer: "Reitmans" };

  // 7. G.A.
  if (moNo.includes("GPEA")) return { buyer: "G.A." };

  // 8. Lunya
  if (moNo.includes("GPLY")) return { buyer: "LUNYA" };

  // 9. Oak and Fort
  if (moNo.includes("GPOF")) return { buyer: "OAK AND FORT" };
  if (moNo.includes("GMOF")) return { buyer: "SWEATER OAK AND FORT" };

  // 10. Bjorn Borg
  if (moNo.includes("GPBB")) return { buyer: "Bjorn Borg" };

  // 11. Sweaters
  if (moNo.includes("GMPA")) return { buyer: "SWEATERS P.A.R. APPAREL LLC" };
  if (moNo.includes("GMGF")) return { buyer: "SWEATER FAMILY" };

  // Note: Your helper had logic for ANF commented out, so I have excluded it here too.
  // If you need ANF back, uncomment and ensure "ANF" is in BUYER_CONFIG.

  return { buyer: "Other" };
};

// ============================================================
// Product Type Image Component
// ============================================================
const ProductTypeImage = ({ imageURL, productTypeName, size = "medium" }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const sizeClasses = {
    small: "w-12 h-12",
    medium: "w-20 h-20",
    large: "w-32 h-32",
  };

  const fullImageUrl = imageURL ? `${PUBLIC_ASSET_URL}${imageURL}` : null;

  if (!fullImageUrl || imageError) {
    return (
      <div
        className={`${sizeClasses[size]} flex items-center justify-center bg-gray-100 dark:bg-gray-700 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600`}
      >
        <ImageIcon className="w-6 h-6 text-gray-400" />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} relative rounded-xl overflow-hidden border-2 border-gray-200 dark:border-gray-700 shadow-md`}
    >
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </div>
      )}
      <img
        src={fullImageUrl}
        alt={productTypeName || "Product Type"}
        className={`w-full h-full object-cover ${
          imageLoading ? "opacity-0" : "opacity-100"
        }`}
        onLoad={() => setImageLoading(false)}
        onError={() => {
          setImageLoading(false);
          setImageError(true);
        }}
      />
    </div>
  );
};

// ============================================================
// Product Type Selector Component
// ============================================================
const ProductTypeSelector = ({
  productTypeOptions,
  selectedProductType,
  onSelectProductType,
  loading,
  onSave,
  saving,
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return productTypeOptions;
    return productTypeOptions.filter((pt) =>
      pt.EnglishProductName.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [productTypeOptions, searchTerm]);

  const selectedOption = useMemo(() => {
    if (!selectedProductType) return null;
    return productTypeOptions.find(
      (pt) => pt.EnglishProductName === selectedProductType,
    );
  }, [productTypeOptions, selectedProductType]);

  return (
    <div className="space-y-3">
      {/* Dropdown */}
      <div className="relative">
        <div
          onClick={() => !loading && setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border-2 border-amber-300 dark:border-amber-700 rounded-xl text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer transition-all ${
            loading ? "opacity-50 cursor-not-allowed" : "hover:border-amber-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-amber-500" />
            <span className={selectedProductType ? "" : "text-gray-400"}>
              {loading
                ? t(
                    "fincheckInspectionOrderDataBuyerDetermination.common.loading",
                  )
                : selectedProductType ||
                  t(
                    "fincheckInspectionOrderDataBuyerDetermination.productType.selectPlaceholder",
                  )}
            </span>
          </div>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          ) : (
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </div>

        {isOpen && !loading && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl overflow-hidden">
              {/* Search */}
              <div className="p-2 border-b border-gray-200 dark:border-gray-700">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t(
                    "fincheckInspectionOrderDataBuyerDetermination.productType.searchPlaceholder",
                  )}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              <div className="max-h-64 overflow-y-auto">
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((pt) => {
                    const isSelected =
                      selectedProductType === pt.EnglishProductName;
                    return (
                      <button
                        key={pt._id}
                        onClick={() => {
                          onSelectProductType(
                            pt.EnglishProductName,
                            pt.imageURL,
                          );
                          setIsOpen(false);
                          setSearchTerm("");
                        }}
                        className={`w-full px-3 py-2 text-left text-sm flex items-center gap-3 transition-colors ${
                          isSelected
                            ? "bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                            : "hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {/* Mini Image */}
                        <div className="w-10 h-10 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700">
                          {pt.imageURL ? (
                            <img
                              src={`${PUBLIC_ASSET_URL}${pt.imageURL}`}
                              alt={pt.EnglishProductName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <span className="flex-1 font-medium truncate">
                          {pt.EnglishProductName}
                        </span>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })
                ) : (
                  <div className="px-3 py-4 text-center text-sm text-gray-500">
                    {t(
                      "fincheckInspectionOrderDataBuyerDetermination.productType.noFound",
                    )}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Selected Product Type Image */}
      {selectedOption && (
        <div className="flex items-center gap-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
          <ProductTypeImage
            imageURL={selectedOption.imageURL}
            productTypeName={selectedOption.EnglishProductName}
            size="medium"
          />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium uppercase">
              {t(
                "fincheckInspectionOrderDataBuyerDetermination.productType.selectedLabel",
              )}
            </p>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-200 truncate">
              {selectedOption.EnglishProductName}
            </p>
          </div>
          <button
            onClick={onSave}
            disabled={saving}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {t("fincheckInspectionOrderDataBuyerDetermination.actions.save")}
          </button>
        </div>
      )}
    </div>
  );
};

// ============================================================
// Main Component
// ============================================================
const YPivotQAInspectionBuyerDetermination = ({
  selectedOrders = [],
  orderData = null,
  orderType = "single",
  onProductTypeUpdate, // <--- FIX 1: New Prop to bubble up ID
}) => {
  const { t } = useTranslation();
  // Product Type State
  const [productTypeInfo, setProductTypeInfo] = useState(null);
  const [productTypeOptions, setProductTypeOptions] = useState([]);
  const [selectedProductType, setSelectedProductType] = useState(null);
  const [selectedProductTypeImage, setSelectedProductTypeImage] =
    useState(null);
  const [loadingProductType, setLoadingProductType] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [savingProductType, setSavingProductType] = useState(false);

  const buyerInfo = useMemo(() => {
    if (!selectedOrders || selectedOrders.length === 0) return null;

    const determination = determineBuyerFromOrderNo(selectedOrders[0]);
    // UPDATE THIS LINE: Change .Unknown to .Other
    const config = BUYER_CONFIG[determination.buyer] || BUYER_CONFIG["Other"];

    return {
      ...determination,
      ...config,
    };
  }, [selectedOrders]);

  // Fetch Product Type Info
  const fetchProductTypeInfo = useCallback(async () => {
    if (!selectedOrders || selectedOrders.length === 0) {
      setProductTypeInfo(null);
      return;
    }

    setLoadingProductType(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-inspection/order-product-type`,
        { orderNos: selectedOrders },
      );

      if (res.data.success) {
        setProductTypeInfo(res.data.data);
        if (res.data.data.hasProductType) {
          setSelectedProductType(res.data.data.productType);
          setSelectedProductTypeImage(res.data.data.imageURL);

          // <--- FIX 2: Propagate ID up when auto-loaded
          if (onProductTypeUpdate && res.data.data.productTypeId) {
            onProductTypeUpdate(res.data.data.productTypeId);
          }
        } else {
          setSelectedProductType(null);
          setSelectedProductTypeImage(null);
          if (onProductTypeUpdate) onProductTypeUpdate(null);
        }
      }
    } catch (error) {
      console.error("Error fetching product type info:", error);
      setProductTypeInfo(null);
    } finally {
      setLoadingProductType(false);
    }
  }, [selectedOrders, onProductTypeUpdate]);

  // Fetch Product Type Options
  const fetchProductTypeOptions = useCallback(async () => {
    setLoadingOptions(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-inspection/product-type-options`,
      );
      if (res.data.success) {
        setProductTypeOptions(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching product type options:", error);
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  // Handle Product Type Selection
  const handleSelectProductType = (productTypeName, imageURL) => {
    setSelectedProductType(productTypeName);
    setSelectedProductTypeImage(imageURL);
  };

  // Save Product Type
  const handleSaveProductType = async () => {
    if (
      !selectedProductType ||
      !selectedOrders ||
      selectedOrders.length === 0
    ) {
      return;
    }

    setSavingProductType(true);
    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/fincheck-inspection/update-product-type`,
        {
          orderNos: selectedOrders,
          productType: selectedProductType,
        },
      );

      if (res.data.success) {
        // Update local state to reflect the save
        setProductTypeInfo((prev) => ({
          ...prev,
          productType: selectedProductType,
          imageURL: res.data.data.imageURL,
          hasProductType: true,
        }));

        // <--- FIX 3: Find ID and Propagate ID up when manually saved
        const matchedOption = productTypeOptions.find(
          (opt) => opt.EnglishProductName === selectedProductType,
        );
        if (matchedOption && onProductTypeUpdate) {
          onProductTypeUpdate(matchedOption._id);
        }
      }
    } catch (error) {
      console.error("Error saving product type:", error);
    } finally {
      setSavingProductType(false);
    }
  };

  // Fetch data on mount and when orders change
  useEffect(() => {
    fetchProductTypeInfo();
  }, [fetchProductTypeInfo]);

  useEffect(() => {
    fetchProductTypeOptions();
  }, [fetchProductTypeOptions]);

  if (!selectedOrders || selectedOrders.length === 0 || !buyerInfo) {
    return null;
  }

  // Format order display
  const orderDisplay = useMemo(() => {
    if (selectedOrders.length === 1) {
      return selectedOrders[0];
    } else if (selectedOrders.length === 2) {
      return selectedOrders.join(", ");
    } else {
      return `${selectedOrders[0]}, +${selectedOrders.length - 1} more`;
    }
  }, [selectedOrders]);

  // Determine if we need to show selector
  const showProductTypeSelector = !productTypeInfo?.hasProductType;
  const hasExistingProductType = productTypeInfo?.hasProductType;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 relative z-10">
      {/* Header with Order Numbers */}
      <div
        className={`bg-gradient-to-r ${buyerInfo.gradientClass} px-4 py-3 rounded-t-2xl`}
      >
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <ShoppingBag className="w-4 h-4" />
          <span>
            {t("fincheckInspectionOrderDataBuyerDetermination.header.customer")}
          </span>
          <span className="text-white/50">|</span>
          <span className="font-medium text-white/90 truncate">
            {orderDisplay}
          </span>
        </h3>
      </div>

      {/* Customer Info Card */}
      <div className="p-4 space-y-4">
        {/* Buyer Info */}
        <div
          className={`p-4 rounded-xl border-2 ${buyerInfo.borderClass} ${buyerInfo.bgClass}`}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Left Side - Icon + Customer Info */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="p-3 rounded-xl bg-white dark:bg-gray-800 shadow-md flex-shrink-0">
                <Building2 className={`w-6 h-6 ${buyerInfo.textClass}`} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {t(
                    "fincheckInspectionOrderDataBuyerDetermination.buyerInfo.customerInfo",
                  )}
                </p>
                <p
                  className={`text-lg font-bold ${buyerInfo.textClass} truncate`}
                >
                  {buyerInfo.fullName} | {buyerInfo.name}
                </p>
              </div>
            </div>

            {/* Right Side - Code Box */}
            {buyerInfo.code && (
              <div
                className={`px-5 py-2 rounded-xl bg-white dark:bg-gray-800 shadow-md border-2 ${buyerInfo.borderClass} flex-shrink-0`}
              >
                <p className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center font-medium">
                  {t(
                    "fincheckInspectionOrderDataBuyerDetermination.buyerInfo.code",
                  )}
                </p>
                <p
                  className={`text-xl font-black ${buyerInfo.textClass} text-center`}
                >
                  {buyerInfo.code}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Product Type Section */}
        <div className="p-4 rounded-xl border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20">
          <div className="flex items-center gap-2 mb-3">
            <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
              {t(
                "fincheckInspectionOrderDataBuyerDetermination.productType.title",
              )}
            </h4>
            {loadingProductType && (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
            )}
          </div>

          {/* If Product Type Exists */}
          {hasExistingProductType && !loadingProductType && (
            <div className="flex items-center gap-4">
              <ProductTypeImage
                imageURL={productTypeInfo?.imageURL}
                productTypeName={productTypeInfo?.productType}
                size="large"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium uppercase mb-1">
                  {t(
                    "fincheckInspectionOrderDataBuyerDetermination.productType.currentLabel",
                  )}
                </p>
                <p className="text-xl font-bold text-emerald-800 dark:text-emerald-100 truncate">
                  {productTypeInfo?.productType}
                </p>
                {!productTypeInfo?.imageURL && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {t(
                      "fincheckInspectionOrderDataBuyerDetermination.productType.noImage",
                    )}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* If No Product Type - Show Selector */}
          {showProductTypeSelector && !loadingProductType && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {t(
                    "fincheckInspectionOrderDataBuyerDetermination.productType.noAssigned",
                  )}
                </p>
              </div>

              <ProductTypeSelector
                productTypeOptions={productTypeOptions}
                selectedProductType={selectedProductType}
                onSelectProductType={handleSelectProductType}
                loading={loadingOptions}
                onSave={handleSaveProductType}
                saving={savingProductType}
              />
            </div>
          )}

          {/* Loading State */}
          {loadingProductType && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default YPivotQAInspectionBuyerDetermination;
