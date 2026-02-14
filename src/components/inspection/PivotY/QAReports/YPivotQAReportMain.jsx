import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import axios from "axios";
import {
  FileText,
  Filter,
  Search,
  Download,
  Calendar,
  Hash,
  Box,
  Layers,
  User,
  Loader2,
  RefreshCw,
  Building2,
  Globe,
  Clock,
  X,
  MoreVertical,
  Eye,
  Trash2,
  Factory,
  EyeOff,
  Info,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Settings2,
  Check,
  GripVertical,
  RotateCcw,
  Save,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Menu,
} from "lucide-react";
import { createPortal } from "react-dom";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";
import { useAuth } from "../../../authentication/AuthContext";
import YPivotQAInspectionQRCode from "../QADataCollection/YPivotQAInspectionQRCode";

// =============================================================================
// Helper: Filter Input Wrapper
// =============================================================================
const FilterWrapper = ({ label, icon: Icon, children }) => (
  <div className="flex flex-col gap-1.5 min-w-0">
    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5 uppercase tracking-wide">
      <Icon className="w-3.5 h-3.5 text-indigo-500 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </label>
    {children}
  </div>
);

// =============================================================================
// Helper: Status Badge
// =============================================================================
const StatusBadge = ({ status }) => {
  const styles = {
    completed: "bg-green-100 text-green-700 border-green-200",
    draft: "bg-amber-100 text-amber-700 border-amber-200",
    in_progress: "bg-blue-100 text-blue-700 border-blue-200",
    cancelled: "bg-red-100 text-red-700 border-red-200",
  };

  const label = status ? status.replace("_", " ") : "Unknown";

  return (
    <span
      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
        styles[status] || "bg-gray-100 text-gray-600"
      }`}
    >
      {label}
    </span>
  );
};

// =============================================================================
// Helper: Product Image Modal
// =============================================================================
const ProductImageModal = ({ src, alt, onClose }) => {
  if (!src) return null;
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div className="relative max-w-lg w-full bg-white rounded-xl overflow-hidden shadow-2xl p-2">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={src}
          alt={alt}
          className="w-full h-auto object-contain rounded-lg"
        />
        <div className="p-3 text-center">
          <p className="font-bold text-gray-800">{alt}</p>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// =============================================================================
// Sub-Component: Multi-Inspector Select (Rich UI with Photos)
// =============================================================================
const MultiInspectorSelect = ({ selectedItems = [], onChange }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Search Users API
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm && searchTerm.length >= 1) {
        setLoading(true);
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/users/search?term=${searchTerm}`,
          );
          // Filter out users already selected
          const existingIds = selectedItems.map((i) => i.emp_id);
          const filtered = (res.data || []).filter(
            (u) => !existingIds.includes(u.emp_id),
          );
          setResults(filtered);
          setShowDropdown(true);
        } catch (error) {
          console.error("User search error", error);
          setResults([]);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, selectedItems]);

  const handleSelect = (user) => {
    // Add full user object to state
    onChange([...selectedItems, user]);
    setSearchTerm("");
    inputRef.current?.focus();
    setShowDropdown(false);
  };

  const handleRemove = (empIdToRemove) => {
    onChange(selectedItems.filter((u) => u.emp_id !== empIdToRemove));
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className="flex flex-col gap-1.5 p-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl min-h-[42px] focus-within:ring-2 focus-within:ring-indigo-500 transition-all cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        {/* Selected Items - Stacked as "One Line One ID" */}
        {selectedItems.length > 0 && (
          <div className="flex flex-col gap-1 w-full">
            {selectedItems.map((user) => (
              <div
                key={user.emp_id}
                className="flex items-center justify-between gap-2 px-2 py-1.5 bg-indigo-50 dark:bg-indigo-900/40 border border-indigo-100 dark:border-indigo-800 rounded-lg group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  {/* Small Photo Avatar */}
                  <div className="w-5 h-5 rounded-full bg-indigo-200 flex-shrink-0 overflow-hidden border border-indigo-300">
                    {user.face_photo ? (
                      <img
                        src={user.face_photo}
                        alt="u"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-3 h-3 text-indigo-700 m-auto mt-1" />
                    )}
                  </div>
                  {/* ID and Name */}
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-200 truncate">
                    {user.emp_id}
                    {/* <span className="font-normal text-indigo-600 dark:text-indigo-400 ml-1">
                      ({user.eng_name?.split(" ")[0]})
                    </span> */}
                  </span>
                </div>

                {/* Remove Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(user.emp_id);
                  }}
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-white rounded-full transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input Field */}
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400 ml-1" />
          <input
            ref={inputRef}
            type="text"
            placeholder={
              selectedItems.length === 0
                ? "Search ID or Name..."
                : "Add more..."
            }
            className="flex-1 bg-transparent text-sm outline-none text-gray-700 dark:text-gray-200 h-6 min-w-0"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              if (e.target.value) setShowDropdown(true);
            }}
            onFocus={() => {
              if (results.length > 0) setShowDropdown(true);
            }}
          />
          {loading && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" />
          )}
        </div>
      </div>

      {/* Dropdown Results */}
      {showDropdown && results.length > 0 && (
        <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {results.map((u) => (
            <button
              key={u.emp_id}
              onClick={() => handleSelect(u)}
              className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-center gap-3 transition-colors group"
            >
              {/* Dropdown Avatar */}
              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center flex-shrink-0 border border-gray-200 dark:border-gray-500 overflow-hidden">
                {u.face_photo ? (
                  <img
                    src={u.face_photo}
                    alt="user"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-gray-500 dark:text-gray-300" />
                )}
              </div>

              <div className="min-w-0">
                <p className="font-bold text-sm text-gray-800 dark:text-gray-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                  {u.emp_id}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {u.eng_name}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Sub-Component: Multi-Select Autocomplete (For PO Line)
// =============================================================================

const MultiSelectAutocomplete = ({
  selectedItems = [], // Ensure default is empty array
  onChange,
  placeholder,
  apiEndpoint,
  staticOptions = null, // NEW: Accept static array of strings
  valueKey = null, // Optional: If searching objects, which key to use? (simple string default)
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null); // Ref to focus input

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      // 1. If Static Options are provided (Local Filter)
      if (staticOptions) {
        if (searchTerm === "") {
          // Show all (filtered by selected) if clicked with no search
          const filtered = staticOptions.filter(
            (item) => !selectedItems.includes(item),
          );
          setResults(filtered);
        } else {
          const lowerTerm = searchTerm.toLowerCase();
          const filtered = staticOptions.filter(
            (item) =>
              item.toLowerCase().includes(lowerTerm) &&
              !selectedItems.includes(item),
          );
          setResults(filtered);
        }
        // Only show if we have results or user is searching
        if (searchTerm !== "" || showDropdown) setShowDropdown(true);
      }
      // 2. If API Endpoint is provided (Async Fetch)
      else if (apiEndpoint && searchTerm.length >= 1) {
        // Allow 1 char search
        setLoading(true);
        try {
          const res = await axios.get(
            `${API_BASE_URL}${apiEndpoint}?term=${searchTerm}`,
          );
          let data = res.data.data || res.data || [];

          // Handle User Search format specifically if needed, or assume array of strings
          // If data is array of objects (like Users), map to ID string
          if (
            data.length > 0 &&
            typeof data[0] === "object" &&
            data[0].emp_id
          ) {
            data = data.map((u) => u.emp_id);
          }

          const filtered = data.filter((item) => !selectedItems.includes(item));
          setResults(filtered);
          setShowDropdown(true);
        } catch (error) {
          console.error("Autocomplete error", error);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, apiEndpoint, staticOptions, selectedItems, showDropdown]);

  const handleSelect = (item) => {
    onChange([...selectedItems, item]);
    setSearchTerm("");
    // Keep focus on input
    if (inputRef.current) inputRef.current.focus();
  };

  const handleRemove = (itemToRemove) => {
    onChange(selectedItems.filter((i) => i !== itemToRemove));
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className="flex flex-wrap items-center gap-1.5 p-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl min-h-[42px] focus-within:ring-2 focus-within:ring-indigo-500 transition-all cursor-text"
        onClick={() => {
          if (inputRef.current) inputRef.current.focus();
          setShowDropdown(true);
        }}
      >
        {selectedItems.map((item) => (
          <span
            key={item}
            className="flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold rounded-md border border-indigo-200 dark:border-indigo-800 break-all"
          >
            <span>{item}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(item);
              }}
              className="hover:text-red-500 rounded-full focus:outline-none p-0.5 hover:bg-white/50"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          placeholder={selectedItems.length === 0 ? placeholder : ""}
          className="flex-1 min-w-[60px] bg-transparent text-sm outline-none text-gray-700 dark:text-gray-200 h-6"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setShowDropdown(true)}
        />
        {loading && (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500 mr-2" />
        )}
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-[100] mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {results.map((item, idx) => (
            <button
              key={idx}
              onClick={() => handleSelect(item)}
              className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors"
            >
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Helper: Inspector Detail Modal (Auto-Close)
// =============================================================================
const InspectorAutoCloseModal = ({ data, onClose }) => {
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchPhoto = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/user-details?empId=${data.empId}`,
        );
        if (isMounted && res.data && res.data.face_photo) {
          let url = res.data.face_photo;
          if (!url.startsWith("http") && !url.startsWith("data:")) {
            const baseUrl = PUBLIC_ASSET_URL.endsWith("/")
              ? PUBLIC_ASSET_URL
              : `${PUBLIC_ASSET_URL}/`;
            const cleanPath = url.startsWith("/") ? url.substring(1) : url;
            url = `${baseUrl}${cleanPath}`;
          }
          setPhotoUrl(url);
        }
      } catch (err) {
        // Silent fail
      }
    };

    if (data && data.empId) {
      fetchPhoto();
    }

    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [data, onClose]);

  if (!data) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[1px] animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center gap-3 min-w-[200px] max-w-[280px] transform scale-100 transition-all relative">
        <h3 className="text-xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tighter">
          {data.empId}
        </h3>

        <div className="w-24 h-24 rounded-full border-4 border-gray-100 dark:border-gray-700 overflow-hidden shadow-inner bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Inspector"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-10 h-10 text-gray-400" />
          )}
        </div>

        <div className="text-center">
          <p className="text-sm font-bold text-gray-800 dark:text-white leading-tight">
            {data.empName || "Unknown Name"}
          </p>
          <p className="text-[10px] text-gray-500 uppercase mt-1">Inspector</p>
        </div>

        <div className="absolute bottom-0 left-0 h-1 bg-indigo-500 animate-shrinkWidth w-full rounded-b-2xl opacity-50"></div>
      </div>
    </div>,
    document.body,
  );
};

// =============================================================================
// Helper: Report QR Code Modal (Manual Close)
// =============================================================================
const ReportQRModal = ({ report, onClose }) => {
  if (!report) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full p-2 border border-gray-200 dark:border-gray-700 transform scale-100 transition-all">
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 p-2 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:text-red-500 rounded-full shadow-lg border border-gray-100 dark:border-gray-600 transition-colors z-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-hidden rounded-2xl">
          <YPivotQAInspectionQRCode
            reportId={report.reportId}
            inspectionDate={report.inspectionDate}
            orderNos={report.orderNos}
            reportType={report.reportType}
            inspectionType={report.inspectionType}
            empId={report.empId}
          />
        </div>

        <p className="text-center text-xs text-gray-400 py-2">
          Scan this code to load report details instantly.
        </p>
      </div>
    </div>,
    document.body,
  );
};

// =============================================================================
// Column Customize Modal
// =============================================================================

const ColumnCustomizeModal = ({
  columns,
  visibleColumns,
  savedFilters, // <--- Received from parent
  onApplyColumns,
  onApplyFilter, // <--- Function to apply a filter
  onDeleteFilter, // <--- Function to delete
  onClose,
}) => {
  const [selected, setSelected] = useState([...visibleColumns]);
  const [activeTab, setActiveTab] = useState("columns"); // 'columns' or 'filters'

  const toggleColumn = (colId) => {
    setSelected((prev) =>
      prev.includes(colId) ? prev.filter((c) => c !== colId) : [...prev, colId],
    );
  };

  const handleApply = () => {
    onApplyColumns(selected);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with Tabs */}
        <div className="px-4 sm:px-5 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex-shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-indigo-500" /> Settings
            </h3>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <div className="flex p-1 bg-gray-200 dark:bg-gray-700 rounded-xl">
            <button
              onClick={() => setActiveTab("columns")}
              className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${
                activeTab === "columns"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Columns
            </button>
            <button
              onClick={() => setActiveTab("filters")}
              className={`flex-1 py-1.5 text-sm font-bold rounded-lg transition-all ${
                activeTab === "filters"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Favorite Filters
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {activeTab === "columns" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* ... (Existing Column list logic here) ... */}
              {columns.map((col) => {
                const isSelected = selected.includes(col.id);
                return (
                  <button
                    key={col.id}
                    onClick={() => toggleColumn(col.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-left ${
                      isSelected
                        ? "bg-indigo-50 border-indigo-200 dark:bg-indigo-900/30 dark:border-indigo-700"
                        : "bg-gray-50 border-gray-200 dark:bg-gray-900 dark:border-gray-700"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 ${
                        isSelected ? "bg-indigo-600 text-white" : "bg-gray-200"
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3" />}
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                      {col.label}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {savedFilters.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Filter className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No saved filters found.</p>
                  <p className="text-xs mt-1">
                    Save filters from the main screen.
                  </p>
                </div>
              ) : (
                savedFilters.map((sf) => (
                  <div
                    key={sf._id}
                    className="group flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 hover:border-indigo-200 transition-all"
                  >
                    <button
                      onClick={() => {
                        onApplyFilter(sf);
                        onClose();
                      }}
                      className="flex-1 text-left min-w-0"
                    >
                      <p className="font-bold text-gray-800 dark:text-gray-200 truncate">
                        {sf.name}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(sf.createdAt).toLocaleDateString()}
                      </p>
                    </button>
                    <button
                      onClick={() => onDeleteFilter(sf._id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer (Only show Apply for columns) */}
        {activeTab === "columns" && (
          <div className="px-4 sm:px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-bold text-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-5 py-2 text-sm font-bold bg-indigo-600 text-white rounded-xl shadow-lg"
            >
              Apply Columns
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
};

// =============================================================================
// Helper: Auto Dismiss Modal (Success/Error)
// =============================================================================
const AutoDismissModal = ({ isOpen, onClose, type, message }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => onClose(), 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const isSuccess = type === "success";

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px] animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center gap-3 min-w-[250px] transform scale-100 transition-all">
        <div
          className={`p-3 rounded-full ${
            isSuccess
              ? "bg-green-100 text-green-600"
              : "bg-red-100 text-red-600"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-8 h-8" />
          ) : (
            <AlertCircle className="w-8 h-8" />
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white text-center">
          {isSuccess ? "Success" : "Error"}
        </h3>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 text-center">
          {message}
        </p>
      </div>
    </div>,
    document.body,
  );
};

// =============================================================================
// Pagination Component - MOBILE RESPONSIVE
// =============================================================================
const PaginationControls = ({
  currentPage,
  totalPages,
  totalCount,
  pageSize,
  onPageChange,
  loading,
}) => {
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Mobile-friendly page numbers (fewer visible)
  const getMobilePageNumbers = () => {
    const pages = [];
    if (totalPages <= 3) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage === 1) {
        pages.push(1, 2, "...", totalPages);
      } else if (currentPage === totalPages) {
        pages.push(1, "...", totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage, "...", totalPages);
      }
    }
    return pages;
  };

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = Math.min(currentPage * pageSize, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
      {/* Record Info */}
      <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
        Showing{" "}
        <span className="font-bold text-gray-800 dark:text-white">
          {startRecord}
        </span>{" "}
        -{" "}
        <span className="font-bold text-gray-800 dark:text-white">
          {endRecord}
        </span>{" "}
        of{" "}
        <span className="font-bold text-indigo-600 dark:text-indigo-400">
          {totalCount.toLocaleString()}
        </span>
      </div>

      {/* Page Controls */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || loading}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="First Page"
        >
          <ChevronsLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Previous */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Previous Page"
        >
          <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Page Numbers - Desktop */}
        <div className="hidden sm:flex items-center gap-1 mx-2">
          {getPageNumbers().map((page, idx) =>
            page === "..." ? (
              <span
                key={`ellipsis-${idx}`}
                className="px-2 text-gray-400 font-medium"
              >
                ...
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                disabled={loading}
                className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-bold transition-all ${
                  currentPage === page
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30"
                }`}
              >
                {page}
              </button>
            ),
          )}
        </div>

        {/* Page Numbers - Mobile */}
        <div className="flex sm:hidden items-center gap-1 mx-1">
          {getMobilePageNumbers().map((page, idx) =>
            page === "..." ? (
              <span
                key={`ellipsis-m-${idx}`}
                className="px-1 text-gray-400 text-xs"
              >
                ..
              </span>
            ) : (
              <button
                key={page}
                onClick={() => onPageChange(page)}
                disabled={loading}
                className={`min-w-[28px] h-7 px-2 rounded-lg text-xs font-bold transition-all ${
                  currentPage === page
                    ? "bg-indigo-600 text-white shadow-lg"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                }`}
              >
                {page}
              </button>
            ),
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Next Page"
        >
          <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Last Page */}
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || loading}
          className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title="Last Page"
        >
          <ChevronsRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// COLUMN DEFINITIONS
// =============================================================================
const ALL_COLUMNS = [
  { id: "date", label: "Date", required: true },
  { id: "reportId", label: "Report ID", requiresPermission: true },
  { id: "poLines", label: "PO Line" },
  { id: "orderNo", label: "Order No", required: true },
  { id: "custStyle", label: "Cust. Style" },
  { id: "customer", label: "Customer" },
  { id: "reportType", label: "Report Name", required: true },
  { id: "product", label: "Product" },
  { id: "orderType", label: "Type" },
  { id: "method", label: "Method" },
  { id: "wash", label: "Wash" },
  { id: "qaId", label: "QA ID" },
  { id: "supplier", label: "Supplier" },
  { id: "external", label: "External" },
  { id: "factory", label: "Factory" },
  { id: "finishedQty", label: "Finished #" },
  { id: "sampleSize", label: "Sample Size" },
  { id: "defectQty", label: "Defect Qty" },
  { id: "createdDate", label: "Created Date" },
  { id: "updatedDate", label: "Updated Date" },
  { id: "status", label: "QA Status" },
  { id: "resubmission", label: "Resubmission" },
  { id: "decision", label: "Leader Decision" },
  { id: "season", label: "Season" },
  { id: "action", label: "Action", required: true },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const YPivotQAReportMain = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [canViewReportId, setCanViewReportId] = useState(false);
  const [reports, setReports] = useState([]);
  const [viewingReportQR, setViewingReportQR] = useState(null);
  const [viewingInspector, setViewingInspector] = useState(null);
  const [showColumnModal, setShowColumnModal] = useState(false);

  // --- Mobile Filter Panel Toggle ---
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // --- State for Preferences ---
  const [savedFiltersList, setSavedFiltersList] = useState([]);
  const [showSaveFilterModal, setShowSaveFilterModal] = useState(false);
  const [newFilterName, setNewFilterName] = useState("");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // Visible Columns State
  const [visibleColumns, setVisibleColumns] = useState([
    "date",
    "reportId",
    "poLines",
    "orderNo",
    "custStyle",
    "customer",
    "reportType",
    "product",
    "qaId",
    "factory",
    "finishedQty",
    "sampleSize",
    "defectQty",
    "createdDate",
    "updatedDate",
    "status",
    "resubmission",
    "decision",
    "season",
    "action",
  ]);

  // Filter State
  const [filters, setFilters] = useState({
    startDate: new Date().toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    reportId: "",
    // CHANGED TO ARRAYS
    reportType: [],
    orderType: "All",
    orderNo: [],
    productType: [],
    empId: [],
    subConFactory: [],
    custStyle: [],
    buyer: [],
    supplier: [],
    qaStatus: [],
    leaderDecision: [],
    poLines: [],
    season: [],
  });

  // Dynamic Options (for Dropdowns)
  const [options, setOptions] = useState({
    reportTypes: [],
    productTypes: [],
    subConFactories: [],
    buyers: [],
    suppliers: [],
  });

  // Static Options for the new filters
  const staticFilterOptions = {
    qaStatus: ["Pending", "Completed"],
    leaderDecision: ["Pending QA", "Pending", "Approved", "Rework", "Rejected"],
  };

  // Product Image Modal State
  const [previewImage, setPreviewImage] = useState(null);

  // Menu State
  const [openMenuId, setOpenMenuId] = useState(null);

  // Action column dropdown handller
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });

  // Display Loaded filter names
  const [activeFilterName, setActiveFilterName] = useState(null);

  // --- SWAL FIRE STATE ---
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    message: "",
  });

  const getNumSuffix = (num) => {
    const j = num % 10,
      k = num % 100;
    if (j === 1 && k !== 11) return "st";
    if (j === 2 && k !== 12) return "nd";
    if (j === 3 && k !== 13) return "rd";
    return "th";
  };

  // --- NEW USE EFFECT FOR REAL-TIME UPDATES ---
  useEffect(() => {
    // 1. Open the channel
    const channel = new BroadcastChannel("qa_report_updates");

    // 2. Listen for messages
    channel.onmessage = (event) => {
      if (event.data && event.data.type === "DECISION_UPDATE") {
        const { reportId, status, updatedAt } = event.data;

        // 3. Update the local state instantly
        setReports((prevReports) =>
          prevReports.map((report) => {
            if (report.reportId === reportId) {
              return {
                ...report,
                // Update the status string
                decisionStatus: status,
                // Update timestamp (Critical: this clears the "Action Required"
                // logic in your table render because UpdatedAt > ResubmissionDate)
                decisionUpdatedAt: updatedAt,
              };
            }
            return report;
          }),
        );
      }
    };

    // 4. Cleanup when component unmounts
    return () => {
      channel.close();
    };
  }, []); // Empty dependency array ensures this runs once on mount

  // --- 1. Fetch Preferences on Load ---
  useEffect(() => {
    if (user?.emp_id) {
      fetchUserPreferences();
    }
  }, [user?.emp_id]);

  const fetchUserPreferences = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-reports/preferences/get?empId=${user.emp_id}`,
      );
      if (res.data.success) {
        setSavedFiltersList(res.data.data.savedFilters || []);
        if (
          res.data.data.favoriteColumns &&
          res.data.data.favoriteColumns.length > 0
        ) {
          setVisibleColumns(res.data.data.favoriteColumns);
        }
      }
    } catch (error) {
      console.error("Error fetching preferences", error);
    }
  };

  // --- 2. Handle Save Filter ---
  const handleSaveFilterClick = () => {
    setNewFilterName("");
    setShowSaveFilterModal(true);
  };

  const confirmSaveFilter = async () => {
    if (!newFilterName.trim()) {
      setStatusModal({
        isOpen: true,
        type: "error",
        message: "Please enter a name",
      });
      return;
    }
    if (newFilterName.length > 25) {
      setStatusModal({
        isOpen: true,
        type: "error",
        message: "Name too long (max 25 chars)",
      });
      return;
    }

    try {
      // Logic for Dynamic Date
      const filtersToSave = { ...filters };
      const today = new Date().toISOString().split("T")[0];

      // If End Date is selected and equals Today, save as dynamic tag
      if (filtersToSave.endDate === today) {
        filtersToSave.endDate = "DYNAMIC_TODAY";
      }

      // If Start Date is NOT selected or empty, ensure it's not saved as a specific date if you want logic there too
      // But prompt specifically mentioned End Date logic.
      // Note: If no dates selected, the state holds Today's date by default in your code.
      // We only save DYNAMIC_TODAY if it matches today.

      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-reports/preferences/save`,
        {
          empId: user.emp_id,
          type: "filter",
          data: {
            name: newFilterName,
            filters: filtersToSave,
          },
        },
      );

      if (res.data.success) {
        setSavedFiltersList(res.data.data.savedFilters);
        setShowSaveFilterModal(false);
        setStatusModal({
          isOpen: true,
          type: "success",
          message: "Filter saved successfully!",
        });
      }
    } catch (error) {
      // 3. Error Modal
      setStatusModal({
        isOpen: true,
        type: "error",
        message: error.response?.data?.message || "Failed to save filter",
      });
    }
  };

  // --- 3. Apply Favorite Filter ---
  const applySavedFilter = (savedItem) => {
    const loadedFilters = { ...savedItem.filters };

    // Logic to restore Dynamic Date
    if (loadedFilters.endDate === "DYNAMIC_TODAY") {
      loadedFilters.endDate = new Date().toISOString().split("T")[0];
    }

    // If Start Date was saved as a specific date, it applies as is.
    // If you want Start Date to also be dynamic if it was today, you would need similar logic above.

    setFilters(loadedFilters);
    setActiveFilterName(savedItem.name);
  };

  // --- 4. Delete Filter ---
  const handleDeleteFilter = async (filterId) => {
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-reports/preferences/delete-filter`,
        {
          empId: user.emp_id,
          filterId,
        },
      );
      if (res.data.success) {
        setSavedFiltersList(res.data.data.savedFilters);
        setStatusModal({
          isOpen: true,
          type: "success",
          message: "Filter deleted successfully",
        });
      }
    } catch (error) {
      console.error("Delete failed", error);
      setStatusModal({
        isOpen: true,
        type: "error",
        message: "Failed to delete filter",
      });
    }
  };

  // --- 5. Save Column Preferences ---
  const handleColumnChangeAndSave = async (newColumns) => {
    setVisibleColumns(newColumns);
    // Save to DB
    try {
      await axios.post(
        `${API_BASE_URL}/api/fincheck-reports/preferences/save`,
        {
          empId: user.emp_id,
          type: "columns",
          data: newColumns,
        },
      );
    } catch (error) {
      console.error("Failed to save column preference", error);
    }
  };

  // --- Fetch Filter Options ---
  const fetchFilterOptions = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-reports/filter-options`,
        {
          params: {
            startDate: filters.startDate,
            endDate: filters.endDate,
          },
        },
      );
      if (res.data.success) {
        setOptions(res.data.data);
      }
    } catch (error) {
      console.error("Error fetching filter options:", error);
    }
  };

  // --- Fetch Data ---
  const fetchReports = async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        // CASE: empId is now an array of Objects {emp_id, eng_name...}
        if (key === "empId" && Array.isArray(value) && value.length > 0) {
          // Extract just the emp_id strings and join them
          const ids = value.map((user) => user.emp_id).join(",");
          params.append(key, ids);
        }
        // Handle Standard Arrays (Multi-selects)
        else if (Array.isArray(value) && value.length > 0) {
          // --- Map poLines to poLine ---
          if (key === "poLines") {
            params.append("poLine", value.join(",")); // Send as "poLine" to match backend
          } else {
            params.append(key, value.join(","));
          }
          //params.append(key, value.join(","));
        }
        // Handle Single Strings
        else if (value && value !== "All" && !Array.isArray(value)) {
          params.append(key, value);
        }
      });

      params.append("page", page);
      params.append("limit", pageSize);

      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-reports/list?${params}`,
      );

      if (res.data.success) {
        setReports(res.data.data);
        setTotalCount(res.data.totalCount || 0);
        setTotalPages(res.data.totalPages || 1);
        setCurrentPage(res.data.currentPage || 1);
      }
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check Permission on Mount
  useEffect(() => {
    const checkPermission = async () => {
      if (user?.emp_id) {
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/fincheck-reports/check-permission?empId=${user.emp_id}`,
          );
          if (res.data && res.data.isAdmin) {
            setCanViewReportId(true);
          } else {
            setCanViewReportId(false);
          }
        } catch (error) {
          console.error("Failed to check permission", error);
          setCanViewReportId(false);
        }
      }
    };
    checkPermission();
  }, [user]);

  // Fetch options when date range changes
  useEffect(() => {
    fetchFilterOptions();
  }, [filters.startDate, filters.endDate]);

  // Initial Load & Debounced Fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchReports(1);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [filters]);

  // Close menu when clicking anywhere else
  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, []);

  // Handle Input Change
  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Reset Filters
  const handleReset = () => {
    setActiveFilterName(null);
    setFilters({
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      reportId: "",
      reportType: [],
      orderType: "All",
      orderNo: [],
      productType: [],
      empId: [],
      subConFactory: [],
      custStyle: [],
      buyer: [],
      supplier: [],
      qaStatus: [],
      leaderDecision: [],
      poLines: [],
      season: [],
    });
  };

  // Hard Reset: Resets EVERYTHING to default
  const handleResetAll = () => {
    setActiveFilterName(null);
    setFilters({
      startDate: "",
      endDate: "",
      reportId: "",

      // Must be empty arrays []
      reportType: [],
      orderType: "All",
      orderNo: [],
      productType: [],
      empId: [],
      subConFactory: [],
      custStyle: [],
      buyer: [],
      supplier: [],
      qaStatus: [],
      leaderDecision: [],
      poLines: [],
      season: [],
    });
  };

  // Handle Action Menu Toggle
  const handleMenuToggle = (e, id, index) => {
    e.stopPropagation();

    if (openMenuId === id) {
      setOpenMenuId(null);
    } else {
      const rect = e.currentTarget.getBoundingClientRect();
      const totalRows = reports.length;

      // Logic: If table > 6 rows AND this is one of the last 3 rows
      const shouldOpenUpwards = totalRows > 6 && index >= totalRows - 3;

      // Approximate menu height is ~130px (3 items * ~40px + dividers)
      const menuHeight = 135;

      // For mobile, ensure menu doesn't go off screen
      const viewportWidth = window.innerWidth;
      let leftPos = rect.right - 160;
      if (leftPos < 10) leftPos = 10;
      if (leftPos + 160 > viewportWidth - 10) leftPos = viewportWidth - 170;

      setMenuPos({
        // If upwards: Top of button - menu height - spacing
        // If downwards: Bottom of button + spacing
        top: shouldOpenUpwards ? rect.top - menuHeight - 5 : rect.bottom + 5,
        left: leftPos,
      });
      setOpenMenuId(id);
    }
  };

  // Helper for column visibility check
  const isColumnVisible = (colId) => {
    // Simply check if it's in the array
    return visibleColumns.includes(colId);
  };

  const handleViewReport = (report) => {
    const url = `/fincheck-reports/view/${report.reportId}`;
    window.open(url, "_blank");
  };

  const handleDeleteReport = (report) => {
    if (
      window.confirm(
        `Are you sure you want to delete Report #${report.reportId}?`,
      )
    ) {
      console.log("Delete Report:", report.reportId);
    }
  };

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      fetchReports(page);
    }
  };

  // Available columns for modal (excluding permission-required if no permission)
  const availableColumnsForModal = useMemo(() => {
    return ALL_COLUMNS.filter((col) => {
      if (col.id === "reportId" && !canViewReportId) return false;
      return true;
    });
  }, [canViewReportId]);

  // Helper to construct full image URL
  const getProductImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http")) return url;
    const baseUrl = PUBLIC_ASSET_URL.endsWith("/")
      ? PUBLIC_ASSET_URL.slice(0, -1)
      : PUBLIC_ASSET_URL;
    const path = url.startsWith("/") ? url : `/${url}`;
    return `${baseUrl}${path}`;
  };

  // --- Helper for Date/Time Formatting ---
  const formatDateTime = (isoString) => {
    if (!isoString) return { date: "-", time: "-" };
    const dateObj = new Date(isoString);
    const date = dateObj.toLocaleDateString();
    const time = dateObj.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
    return { date, time };
  };

  // Filter by Order Number - Clears all other filters
  const handleFilterByOrderNo = (orderNosString) => {
    // Close the menu
    setOpenMenuId(null);

    // Extract the first order number from the string
    // orderNosString might be "ORDER1, ORDER2, ORDER3"
    const firstOrderNo = orderNosString.split(",")[0].trim();

    setActiveFilterName(null);

    // Reset ALL filters and only set orderNo
    setFilters({
      startDate: "",
      endDate: "",
      reportId: "",
      reportType: [],
      orderType: "All",
      orderNo: [firstOrderNo],
      productType: [],
      empId: [],
      subConFactory: [],
      custStyle: [],
      buyer: [],
      supplier: [],
      poLines: [],
    });

    // Reset to page 1
    setCurrentPage(1);

    // Optional: Show a toast notification
    setStatusModal({
      isOpen: true,
      type: "success",
      message: `Filtering all reports for Order: ${firstOrderNo}`,
    });
  };

  // --- Helper to Generate Summary String ---
  const activeFilterSummary = useMemo(() => {
    if (!activeFilterName) return null;

    const readableLabels = {
      startDate: "Start",
      endDate: "End",
      reportId: "Report ID",
      reportType: "Type",
      orderType: "Ord Type",
      orderNo: "Order #",
      productType: "Product",
      empId: "QA ID",
      subConFactory: "Ext. Fac",
      custStyle: "Style",
      buyer: "Buyer",
      supplier: "Supplier",
      season: "Season",
    };

    const parts = [];

    Object.entries(filters).forEach(([key, val]) => {
      // 1. Skip empty strings, nulls, undefined
      // 2. Skip "All" values
      if (!val || val === "All") return;

      const label = readableLabels[key] || key;

      // Optional: Format dates to look nicer?
      // For now, just displaying the value as is.
      parts.push(`${label}: ${val}`);
    });

    if (parts.length === 0) return "";
    return `(${parts.join(", ")})`;
  }, [filters, activeFilterName]);

  // --- Count active filters for mobile badge ---
  const activeFilterCount = useMemo(() => {
    let count = 0;
    Object.entries(filters).forEach(([key, val]) => {
      if (val && val !== "All" && val !== "") count++;
    });
    return count;
  }, [filters]);

  return (
    <div className="w-full max-w-full min-w-0 overflow-x-hidden space-y-3 sm:space-y-4 animate-fadeIn">
      {/* --- 1. FILTER PANE --- */}
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 relative z-40">
        {/* Filter Header - Always Visible */}
        <div
          className="flex items-center justify-between p-3 sm:p-4 cursor-pointer sm:cursor-default"
          onClick={() => setIsFilterExpanded(!isFilterExpanded)}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="p-1.5 sm:p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400 flex-shrink-0">
              <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <h2 className="text-sm sm:text-base font-bold text-gray-800 dark:text-white flex-shrink-0">
              Filters
            </h2>
            {/* Active filter count badge - Mobile */}
            {activeFilterCount > 0 && (
              <span className="sm:hidden px-1.5 py-0.5 bg-indigo-600 text-white text-[10px] font-bold rounded-full">
                {activeFilterCount}
              </span>
            )}
            {/* --- LOADED FILTER BADGE - Hidden on Mobile when collapsed --- */}
            {activeFilterName && (
              <div className="hidden sm:flex ml-2 px-2 sm:px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg items-center gap-2 min-w-0 animate-fadeIn">
                <span className="text-[10px] uppercase font-bold text-indigo-500 flex-shrink-0">
                  Loaded:
                </span>
                <div className="text-xs text-indigo-700 dark:text-indigo-300 truncate">
                  <span className="font-bold mr-1">{activeFilterName}</span>
                  <span className="hidden lg:inline text-indigo-400 dark:text-indigo-500 font-normal">
                    {activeFilterSummary}
                  </span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveFilterName(null);
                  }}
                  className="ml-1 p-0.5 rounded hover:bg-indigo-200 dark:hover:bg-indigo-800 text-indigo-400"
                  title="Clear saved filter label"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Mobile Toggle Button */}
          <button
            className="sm:hidden p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              setIsFilterExpanded(!isFilterExpanded);
            }}
          >
            {isFilterExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            {/* Save Filters Button */}
            <button
              onClick={handleSaveFilterClick}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-400 dark:hover:bg-indigo-900/50 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800"
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Save Filter</span>
            </button>

            {/* Standard Reset (Soft) */}
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-green-200 dark:border-green-500"
              title="Reset fields (keep dates)"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Reset/Default</span>
            </button>

            {/* Reset All (Hard) */}
            <button
              onClick={handleResetAll}
              className="flex items-center gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-red-400 dark:border-red-900/30"
              title="Reset ALL fields & dates"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Reset All</span>
            </button>
          </div>
        </div>

        {/* Filter Content - Collapsible on Mobile */}
        <div
          className={`transition-all duration-300 ease-in-out ${
            // On Mobile: Visible if expanded, Hidden if collapsed.
            // On Desktop (sm): Always Visible.
            isFilterExpanded
              ? "overflow-visible"
              : "overflow-hidden sm:overflow-visible"
          } ${
            isFilterExpanded
              ? "max-h-[2000px] opacity-100"
              : "max-h-0 sm:max-h-none opacity-0 sm:opacity-100"
          }`}
        >
          <div className="px-3 sm:px-4 pb-3 sm:pb-4 border-t border-gray-100 dark:border-gray-700 sm:border-t-0">
            {/* Mobile Active Filter Badge */}
            {activeFilterName && (
              <div className="sm:hidden mb-3 mt-3 px-2 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold text-indigo-500 flex-shrink-0">
                  Loaded:
                </span>
                <span className="text-xs text-indigo-700 dark:text-indigo-300 font-bold truncate flex-1">
                  {activeFilterName}
                </span>
                <button
                  onClick={() => setActiveFilterName(null)}
                  className="p-0.5 rounded hover:bg-indigo-200 text-indigo-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Filter Grid - Responsive */}
            <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-3 sm:gap-4 mt-3 sm:mt-0">
              {/* Date Range */}
              <FilterWrapper label="Start Date" icon={Calendar}>
                <input
                  type="date"
                  className="w-full px-2 sm:px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={filters.startDate}
                  onChange={(e) =>
                    handleFilterChange("startDate", e.target.value)
                  }
                  placeholder="MM/DD/YYYY"
                />
              </FilterWrapper>

              <FilterWrapper label="End Date" icon={Calendar}>
                <input
                  type="date"
                  className="w-full px-2 sm:px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={filters.endDate}
                  onChange={(e) =>
                    handleFilterChange("endDate", e.target.value)
                  }
                  placeholder="MM/DD/YYYY"
                />
              </FilterWrapper>

              {/* IDs */}
              <FilterWrapper label="Report ID" icon={Hash}>
                <input
                  type="number"
                  placeholder="10-digit ID..."
                  className="w-full px-2 sm:px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={filters.reportId}
                  onChange={(e) =>
                    handleFilterChange("reportId", e.target.value)
                  }
                />
              </FilterWrapper>

              {/* QA ID (Multi Select) */}
              <FilterWrapper label="QA ID" icon={User}>
                <MultiInspectorSelect
                  selectedItems={filters.empId} // Pass the full objects array
                  onChange={(val) => handleFilterChange("empId", val)} // Updates state with objects
                />
              </FilterWrapper>

              {/* Order No (Multi Select) */}
              <FilterWrapper label="Order No" icon={Search}>
                <MultiSelectAutocomplete
                  selectedItems={filters.orderNo}
                  onChange={(val) => handleFilterChange("orderNo", val)}
                  placeholder="Search Order..."
                  apiEndpoint="/api/fincheck-reports/autocomplete/order-no"
                />
              </FilterWrapper>

              {/* Report Type (Multi Select) */}
              <FilterWrapper label="Report Name" icon={FileText}>
                <MultiSelectAutocomplete
                  selectedItems={filters.reportType}
                  onChange={(val) => handleFilterChange("reportType", val)}
                  placeholder="Select Reports..."
                  staticOptions={options.reportTypes}
                />
              </FilterWrapper>

              {/* Order Type (Single Select) */}
              <FilterWrapper label="Order Type" icon={Layers}>
                <select
                  className="w-full px-2 sm:px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={filters.orderType}
                  onChange={(e) =>
                    handleFilterChange("orderType", e.target.value)
                  }
                >
                  <option value="All">All Types</option>
                  <option value="Single">Single</option>
                  <option value="Multi">Multi</option>
                  <option value="Batch">Batch</option>
                </select>
              </FilterWrapper>

              {/* Product Type (Multi Select) */}
              <FilterWrapper label="Product Type" icon={Box}>
                <MultiSelectAutocomplete
                  selectedItems={filters.productType}
                  onChange={(val) => handleFilterChange("productType", val)}
                  placeholder="Select Products..."
                  staticOptions={options.productTypes}
                />
              </FilterWrapper>

              {/* Cust Style (Now Multi Select) */}
              <FilterWrapper label="Cust. Style" icon={Search}>
                <MultiSelectAutocomplete
                  selectedItems={filters.custStyle}
                  onChange={(val) => handleFilterChange("custStyle", val)}
                  placeholder="Search Style..."
                  apiEndpoint="/api/fincheck-reports/autocomplete/cust-style"
                />
              </FilterWrapper>

              {/* Buyer (Static Multi Select) */}
              <FilterWrapper label="Buyer" icon={User}>
                <MultiSelectAutocomplete
                  selectedItems={filters.buyer}
                  onChange={(val) => handleFilterChange("buyer", val)}
                  placeholder="Select Buyers..."
                  staticOptions={options.buyers}
                />
              </FilterWrapper>

              {/* Supplier (Static Multi Select) */}
              <FilterWrapper label="Supplier" icon={Building2}>
                <MultiSelectAutocomplete
                  selectedItems={filters.supplier}
                  onChange={(val) => handleFilterChange("supplier", val)}
                  placeholder="Select Suppliers..."
                  staticOptions={options.suppliers}
                />
              </FilterWrapper>

              {/* Ext. Factory (Static Multi Select) */}
              <FilterWrapper label="Ext. Factory" icon={Factory}>
                <MultiSelectAutocomplete
                  selectedItems={filters.subConFactory}
                  onChange={(val) => handleFilterChange("subConFactory", val)}
                  placeholder="Select External..."
                  staticOptions={options.subConFactories}
                />
              </FilterWrapper>
              {/* --- QA Status (Mobile/Tablet Only - Hidden on XL) --- */}
              <div className="xl:hidden">
                <FilterWrapper label="QA Status" icon={CheckCircle2}>
                  <MultiSelectAutocomplete
                    selectedItems={filters.qaStatus}
                    onChange={(val) => handleFilterChange("qaStatus", val)}
                    placeholder="Select Status..."
                    staticOptions={staticFilterOptions.qaStatus}
                  />
                </FilterWrapper>
              </div>

              {/* --- Leader Decision (Mobile/Tablet Only - Hidden on LG) --- */}
              <div className="lg:hidden">
                <FilterWrapper label="Leader Decision" icon={User}>
                  <MultiSelectAutocomplete
                    selectedItems={filters.leaderDecision}
                    onChange={(val) =>
                      handleFilterChange("leaderDecision", val)
                    }
                    placeholder="Select Decision..."
                    staticOptions={staticFilterOptions.leaderDecision}
                  />
                </FilterWrapper>
              </div>

              {/* --- Season (Mobile/Tablet Only - Hidden on LG) --- */}
              <div className="lg:hidden">
                <FilterWrapper label="Season" icon={Calendar}>
                  <MultiSelectAutocomplete
                    selectedItems={filters.season}
                    onChange={(val) => handleFilterChange("season", val)}
                    placeholder="Select Season..."
                    apiEndpoint="/api/fincheck-reports/autocomplete/season"
                  />
                </FilterWrapper>
              </div>
            </div>

            {/* Mobile Action Buttons */}
            <div className="sm:hidden flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
              <button
                onClick={handleSaveFilterClick}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 rounded-lg border border-indigo-200"
              >
                <Save className="w-3.5 h-3.5" /> Save
              </button>
              <button
                onClick={handleReset}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-gray-600 bg-gray-100 rounded-lg"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reset
              </button>
              <button
                onClick={handleResetAll}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-red-500 bg-red-50 rounded-lg border border-red-200"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- 2. DATA TABLE CONTAINER --- */}
      <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
        {/* Table Header / Toolbar - FIXED */}
        <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col gap-3 sm:gap-4 sticky top-0 z-30">
          {/* Top Row: Title and Actions */}
          <div className="flex justify-between items-center flex-wrap gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-600 text-white shadow-md">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </span>
              <h3 className="font-bold text-gray-800 dark:text-white text-base sm:text-lg">
                Results
              </h3>
              <span className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-[10px] sm:text-xs font-bold text-gray-600 dark:text-gray-300">
                {totalCount.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end min-w-0">
              <div className="hidden xl:block w-[160px]">
                <MultiSelectAutocomplete
                  selectedItems={filters.qaStatus}
                  onChange={(val) => handleFilterChange("qaStatus", val)}
                  placeholder="QA Status..."
                  staticOptions={staticFilterOptions.qaStatus}
                />
              </div>

              {/* --- Leader Decision (Desktop Only) --- */}
              <div className="hidden lg:block w-[180px]">
                <MultiSelectAutocomplete
                  selectedItems={filters.leaderDecision}
                  onChange={(val) => handleFilterChange("leaderDecision", val)}
                  placeholder="Leader Decision..."
                  staticOptions={staticFilterOptions.leaderDecision}
                />
              </div>
              {/* --- Season (Desktop Only) --- */}
              <div className="hidden lg:block w-[140px]">
                <MultiSelectAutocomplete
                  selectedItems={filters.season}
                  onChange={(val) => handleFilterChange("season", val)}
                  placeholder="Season..."
                  apiEndpoint="/api/fincheck-reports/autocomplete/season"
                />
              </div>
              {/* --- PO LINE FILTER --- */}
              <div className="w-full max-w-[140px] sm:max-w-[250px]">
                <MultiSelectAutocomplete
                  selectedItems={filters.poLines || []}
                  onChange={(newItems) =>
                    handleFilterChange("poLines", newItems)
                  }
                  placeholder="Filter PO Line..."
                  apiEndpoint="/api/fincheck-reports/autocomplete/po-line"
                />
              </div>
              {/* Customize View Button */}
              <button
                onClick={() => setShowColumnModal(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl shadow-sm transition-all active:scale-95 border bg-white text-gray-600 border-gray-200 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
              >
                <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Customize</span>
              </button>
            </div>
          </div>

          {/* Pagination Controls - FIXED */}
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            loading={loading}
          />
        </div>

        {/* Table Content - Scrollable with touch support */}
        <div
          className="overflow-auto flex-1 overscroll-x-contain"
          style={{
            maxHeight: "calc(100vh - 350px)",
            minHeight: "300px",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <table className="w-full text-sm text-left min-w-[800px]">
            <thead className="bg-gray-900 dark:bg-gray-950 text-[10px] sm:text-xs uppercase font-bold text-gray-100 sticky top-0 z-20">
              <tr>
                {isColumnVisible("date") && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                    Date
                  </th>
                )}
                {isColumnVisible("reportId") && canViewReportId && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                    Report ID
                  </th>
                )}
                {isColumnVisible("poLines") && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                    PO Line
                  </th>
                )}

                {isColumnVisible("orderNo") && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                    Order No
                  </th>
                )}
                {isColumnVisible("custStyle") && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                    Cust. Style
                  </th>
                )}
                {isColumnVisible("customer") && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                    Customer
                  </th>
                )}
                {isColumnVisible("season") && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                    Season
                  </th>
                )}
                {isColumnVisible("reportType") && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                    Report Name
                  </th>
                )}
                {isColumnVisible("product") && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                    Product
                  </th>
                )}
                {isColumnVisible("orderType") && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                    Type
                  </th>
                )}
                {isColumnVisible("method") && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                    Method
                  </th>
                )}
                {isColumnVisible("wash") && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                    Wash
                  </th>
                )}
                {isColumnVisible("qaId") && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                    QA ID
                  </th>
                )}
                {isColumnVisible("supplier") && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                    Supplier
                  </th>
                )}
                {isColumnVisible("external") && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                    External
                  </th>
                )}
                {isColumnVisible("factory") && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                    Factory
                  </th>
                )}
                {isColumnVisible("finishedQty") && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 text-right whitespace-nowrap">
                    Finished #
                  </th>
                )}
                {isColumnVisible("sampleSize") && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 text-right whitespace-nowrap">
                    Sample Size
                  </th>
                )}
                {isColumnVisible("defectQty") && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 text-right whitespace-nowrap text-red-300">
                    Defect Qty
                  </th>
                )}
                {isColumnVisible("createdDate") && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                    Created Date
                  </th>
                )}
                {isColumnVisible("updatedDate") && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                    Updated Date
                  </th>
                )}
                {isColumnVisible("status") && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap text-center">
                    QA Status
                  </th>
                )}
                {isColumnVisible("resubmission") && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                    Resubmission
                  </th>
                )}
                {isColumnVisible("decision") && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                    Leader Decision
                  </th>
                )}
                {isColumnVisible("action") && (
                  <th className="px-3 sm:px-5 py-3 sm:py-4 text-center whitespace-nowrap sticky right-0 bg-gray-900 dark:bg-gray-950">
                    Action
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={20} className="px-6 py-16 sm:py-20 text-center">
                    <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-500 animate-spin mx-auto mb-3" />
                    <p className="text-gray-500 font-medium text-sm">
                      Loading reports...
                    </p>
                  </td>
                </tr>
              ) : reports.length === 0 ? (
                <tr>
                  <td colSpan={20} className="px-6 py-16 sm:py-20 text-center">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-800 dark:text-white font-bold text-base sm:text-lg">
                      No Reports Found
                    </p>
                    <p className="text-gray-500 text-xs sm:text-sm mt-1">
                      Try adjusting your filters.
                    </p>
                  </td>
                </tr>
              ) : (
                reports.map((report, index) => {
                  const details = report.inspectionDetails || {};
                  const config = report.inspectionConfig || {};
                  const isSubCon = details.isSubCon;
                  const isAQL = report.inspectionMethod === "AQL";

                  const created = formatDateTime(report.createdAt);
                  const updated = formatDateTime(report.updatedAt);

                  const finishedQtyDisplay =
                    isAQL && details.inspectedQty > 0
                      ? details.inspectedQty.toLocaleString()
                      : "";

                  let sampleSizeDisplay = 0;
                  if (isAQL) {
                    sampleSizeDisplay = details.aqlSampleSize || 0;
                  } else {
                    sampleSizeDisplay = config.sampleSize || 0;
                  }

                  const totalDefectQty = (report.defectData || []).reduce(
                    (sum, d) => sum + (d.qty || 0),
                    0,
                  );

                  const productImage = report.productTypeId?.imageURL;

                  return (
                    <tr
                      key={report.reportId}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group"
                    >
                      {/* Date */}
                      {isColumnVisible("date") && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap text-xs sm:text-sm">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 flex-shrink-0" />
                            <span className="truncate">
                              {new Date(
                                report.inspectionDate,
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Report ID */}
                      {isColumnVisible("reportId") && canViewReportId && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs">
                              {report.reportId}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingReportQR(report);
                              }}
                              className="p-1 sm:p-1.5 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-gray-400 hover:text-indigo-600 transition-colors"
                              title="View Report QR"
                            >
                              <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}

                      {/* --- PO LINE COLUMN --- */}
                      {isColumnVisible("poLines") && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4 max-w-[100px] sm:max-w-[150px] align-top">
                          {report.poLines ? (
                            <div className="flex flex-col gap-1">
                              {report.poLines.split(", ").map((line, idx) => (
                                <p
                                  key={idx}
                                  className="text-[11px] sm:text-[12px] leading-tight text-gray-600 dark:text-gray-400 font-medium truncate border-b border-dashed border-gray-200 dark:border-gray-700 last:border-0 pb-0.5 last:pb-0"
                                  title={line}
                                >
                                  {line}
                                </p>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-[11px] sm:text-[12px]">
                              -
                            </span>
                          )}
                        </td>
                      )}

                      {/* Order No */}
                      {isColumnVisible("orderNo") && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4 max-w-[120px] sm:max-w-[200px]">
                          <p
                            className="truncate font-medium text-gray-800 dark:text-gray-200 text-xs sm:text-sm"
                            title={report.orderNosString}
                          >
                            {report.orderNosString}
                          </p>
                        </td>
                      )}

                      {/* Cust. Style */}
                      {isColumnVisible("custStyle") && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4 max-w-[100px] sm:max-w-[120px]">
                          <p className="text-[11px] sm:text-[12px] leading-tight text-gray-600 dark:text-gray-400 break-words font-medium">
                            {details.custStyle || "-"}
                          </p>
                        </td>
                      )}

                      {/* Customer (Buyer) */}
                      {isColumnVisible("customer") && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4 text-[11px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 capitalize">
                          {report.buyer || "-"}
                        </td>
                      )}

                      {/* Season */}
                      {isColumnVisible("season") && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4">
                          <span className="text-[11px] sm:text-xs font-medium text-gray-600 dark:text-gray-300">
                            {report.season || "-"}
                          </span>
                        </td>
                      )}

                      {/* Report Name */}
                      {isColumnVisible("reportType") && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4 text-gray-600 dark:text-gray-300 text-[11px] sm:text-[12px] break-words max-w-[100px] sm:max-w-none">
                          {report.reportType}
                        </td>
                      )}

                      {/* Product */}
                      {isColumnVisible("product") && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            {productImage ? (
                              <div
                                className="w-6 h-6 sm:w-8 sm:h-8 rounded border border-gray-200 dark:border-gray-700 overflow-hidden flex-shrink-0 bg-white cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all"
                                onClick={() =>
                                  setPreviewImage({
                                    src: getProductImageUrl(productImage),
                                    alt: report.productType,
                                  })
                                }
                              >
                                <img
                                  src={getProductImageUrl(productImage)}
                                  alt={report.productType}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            ) : (
                              <div className="w-6 h-6 sm:w-8 sm:h-8 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-800 text-gray-400 text-[6px] sm:text-[8px] font-bold flex-shrink-0">
                                NO IMG
                              </div>
                            )}
                            <span className="text-gray-600 dark:text-gray-300 font-medium text-[11px] sm:text-sm truncate max-w-[60px] sm:max-w-none">
                              {report.productType}
                            </span>
                          </div>
                        </td>
                      )}

                      {/* Order Type */}
                      {isColumnVisible("orderType") && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4">
                          <span
                            className={`px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[9px] sm:text-[10px] font-bold uppercase border ${
                              report.orderType === "single"
                                ? "bg-blue-50 text-blue-600 border-blue-100"
                                : report.orderType === "multi"
                                  ? "bg-purple-50 text-purple-600 border-purple-100"
                                  : "bg-orange-50 text-orange-600 border-orange-100"
                            }`}
                          >
                            {report.orderType}
                          </span>
                        </td>
                      )}

                      {/* Method */}
                      {isColumnVisible("method") && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4">
                          {report.inspectionMethod === "AQL" ? (
                            <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                              AQL
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                              {report.inspectionMethod || "Fixed"}
                            </span>
                          )}
                        </td>
                      )}

                      {/* Wash */}
                      {isColumnVisible("wash") && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4">
                          {report.measurementMethod === "Before" ? (
                            <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-blue-100 text-blue-700 border border-blue-200">
                              Before
                            </span>
                          ) : report.measurementMethod === "After" ? (
                            <span className="inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                              After
                            </span>
                          ) : (
                            <span className="text-gray-400 text-[10px] sm:text-xs font-medium">
                              N/A
                            </span>
                          )}
                        </td>
                      )}

                      {/* QA ID */}
                      {isColumnVisible("qaId") && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4 align-top">
                          <div className="flex items-start justify-between gap-2 sm:gap-3">
                            <div className="flex flex-col min-w-0">
                              <span className="font-mono font-bold text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                                {report.empId}
                              </span>
                              {(report.empName || "-")
                                .split(" ")
                                .slice(0, 2)
                                .map((namePart, i) => (
                                  <span
                                    key={i}
                                    className="text-[9px] sm:text-[10px] font-bold text-gray-400 dark:text-gray-500 leading-3 truncate"
                                  >
                                    {namePart}
                                  </span>
                                ))}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingInspector({
                                  empId: report.empId,
                                  empName: report.empName,
                                });
                              }}
                              className="p-1 sm:p-1.5 rounded-full bg-gray-100 hover:bg-indigo-100 text-gray-400 hover:text-indigo-600 dark:bg-gray-800 dark:hover:bg-indigo-900/50 transition-colors flex-shrink-0"
                              title="View Inspector Info"
                            >
                              <Info className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}

                      {/* Supplier */}
                      {isColumnVisible("supplier") && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4 text-gray-600 dark:text-gray-300 font-medium text-[11px] sm:text-sm">
                          {details.supplier || "YM"}
                        </td>
                      )}

                      {/* External */}
                      {isColumnVisible("external") && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4">
                          {isSubCon ? (
                            <div className="flex items-center gap-1 sm:gap-1.5 text-orange-600 font-bold text-[10px] sm:text-xs">
                              <Globe className="w-3 h-3 sm:w-3.5 sm:h-3.5" />{" "}
                              Yes
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 sm:gap-1.5 text-gray-400 text-[10px] sm:text-xs">
                              <Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />{" "}
                              No
                            </div>
                          )}
                        </td>
                      )}

                      {/* Factory */}
                      {isColumnVisible("factory") && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4 text-gray-600 dark:text-gray-300 text-[10px] sm:text-xs">
                          {isSubCon
                            ? details.subConFactory || "Unknown"
                            : details.factory || "N/A"}
                        </td>
                      )}

                      {/* Finished Qty */}
                      {isColumnVisible("finishedQty") && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4 text-right font-mono text-[10px] sm:text-xs text-gray-800 dark:text-gray-200">
                          {finishedQtyDisplay}
                        </td>
                      )}

                      {/* Sample Size */}
                      {isColumnVisible("sampleSize") && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4 text-right">
                          {sampleSizeDisplay > 0 ? (
                            <span className="inline-flex items-center justify-center min-w-[20px] sm:min-w-[24px] h-5 sm:h-6 px-1 sm:px-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] sm:text-xs font-bold rounded">
                              {sampleSizeDisplay}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      )}

                      {/* --- DEFECT QTY COLUMN --- */}
                      {isColumnVisible("defectQty") && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4 text-right">
                          <span
                            className={`font-mono text-[10px] sm:text-xs font-bold ${
                              totalDefectQty > 0
                                ? "text-red-600 dark:text-red-400"
                                : "text-gray-400"
                            }`}
                          >
                            {totalDefectQty}
                          </span>
                        </td>
                      )}

                      {/* Created At */}
                      {isColumnVisible("createdDate") && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5 sm:gap-1">
                            <span className="text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-300">
                              {created.date}
                            </span>
                            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-gray-500 font-medium bg-gray-100 dark:bg-gray-700 px-1 sm:px-1.5 py-0.5 rounded w-fit">
                              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              {created.time}
                            </div>
                          </div>
                        </td>
                      )}

                      {/* Updated At */}
                      {isColumnVisible("updatedDate") && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-0.5 sm:gap-1">
                            <span className="text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-300">
                              {updated.date}
                            </span>
                            <div className="flex items-center gap-1 text-[9px] sm:text-[10px] text-gray-500 font-medium bg-gray-100 dark:bg-gray-700 px-1 sm:px-1.5 py-0.5 rounded w-fit">
                              <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />{" "}
                              {updated.time}
                            </div>
                          </div>
                        </td>
                      )}

                      {/* 1. QA Status Column */}
                      {isColumnVisible("status") && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4 text-center">
                          <span
                            className={`px-2 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[9px] sm:text-xs font-bold uppercase border shadow-sm ${
                              report.status === "completed"
                                ? "bg-green-100 text-green-700 border-green-300"
                                : "bg-gray-100 text-gray-600 border-gray-300"
                            }`}
                          >
                            {report.status === "completed"
                              ? "Completed"
                              : "Pending"}
                          </span>
                        </td>
                      )}

                      {/* 2. Resubmission Column */}
                      {isColumnVisible("resubmission") && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4">
                          {report.resubmissionHistory &&
                          report.resubmissionHistory.length > 0 ? (
                            (() => {
                              const lastResub =
                                report.resubmissionHistory[
                                  report.resubmissionHistory.length - 1
                                ];
                              const resubDate = formatDateTime(
                                lastResub.resubmissionDate,
                              );
                              return (
                                <div className="flex items-start gap-2 sm:gap-3">
                                  <div className="flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-purple-100 border border-purple-300 text-purple-700 text-[10px] sm:text-xs font-bold shadow-sm flex-shrink-0">
                                    {lastResub.resubmissionNo}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="text-[10px] sm:text-xs font-bold text-gray-700 dark:text-gray-300">
                                      {resubDate.date}
                                    </span>
                                    <span className="text-[9px] sm:text-[10px] text-gray-500 font-mono">
                                      {resubDate.time}
                                    </span>
                                  </div>
                                </div>
                              );
                            })()
                          ) : (
                            <span className="text-gray-300 text-[10px] sm:text-xs">
                              -
                            </span>
                          )}
                        </td>
                      )}

                      {/* 3. Decision Column */}
                      {isColumnVisible("decision") && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4">
                          {(() => {
                            // 1. Determine Status Label
                            let statusLabel = "Pending";
                            let statusClass =
                              "bg-gray-100 text-gray-500 border-gray-300";

                            // If QA is not complete, decision is N/A or Pending
                            if (report.status !== "completed") {
                              statusLabel = "Pending QA";
                            }
                            // QA Complete but no decision record found
                            else if (!report.decisionStatus) {
                              statusLabel = "Pending";
                            }
                            // Decision Exists
                            else {
                              statusLabel = report.decisionStatus;
                              if (statusLabel === "Approved")
                                statusClass =
                                  "bg-green-100 text-green-700 border-green-600";
                              else if (statusLabel === "Rework")
                                statusClass =
                                  "bg-orange-100 text-orange-700 border-orange-600";
                              else if (statusLabel === "Rejected")
                                statusClass =
                                  "bg-red-100 text-red-700 border-red-600";
                            }

                            // 2. Determine Action Required
                            let actionRequired = false;
                            if (
                              report.decisionStatus &&
                              report.resubmissionHistory?.length > 0
                            ) {
                              const lastDecisionTime = new Date(
                                report.decisionUpdatedAt,
                              ).getTime();
                              const lastResub =
                                report.resubmissionHistory[
                                  report.resubmissionHistory.length - 1
                                ];
                              const lastResubTime = new Date(
                                lastResub.resubmissionDate,
                              ).getTime();

                              // If QA submitted AFTER leader decided -> Action Required
                              if (lastResubTime > lastDecisionTime) {
                                actionRequired = true;
                              }
                            }

                            return (
                              <div className="flex flex-col items-start gap-1 sm:gap-1.5">
                                <span
                                  className={`px-1.5 sm:px-2.5 py-0.5 rounded-md text-[9px] sm:text-[11px] font-bold uppercase border ${statusClass}`}
                                >
                                  {statusLabel}
                                </span>

                                {actionRequired && (
                                  <div className="flex items-center gap-1 animate-pulse">
                                    <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-red-500"></span>
                                    <span className="text-[8px] sm:text-[10px] font-bold text-red-500 uppercase tracking-tight border border-red-200 bg-red-50 px-1 sm:px-1.5 rounded">
                                      Action Required
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </td>
                      )}

                      {/* Action - Sticky on mobile */}
                      {isColumnVisible("action") && (
                        <td className="px-3 sm:px-5 py-3 sm:py-4 text-center relative sticky right-0 bg-white dark:bg-gray-800 group-hover:bg-gray-50 dark:group-hover:bg-gray-700/30">
                          <button
                            onClick={(e) =>
                              handleMenuToggle(e, report.reportId, index)
                            }
                            className={`p-1.5 sm:p-2 rounded-full transition-colors ${
                              openMenuId === report.reportId
                                ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400"
                                : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600"
                            }`}
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Pagination for Mobile */}
        <div className="sm:hidden px-3 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            totalCount={totalCount}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            loading={loading}
          />
        </div>
      </div>

      {/* --- FLOATING ACTION MENU PORTAL --- */}
      {openMenuId &&
        (() => {
          // Find the report data for the currently open menu
          const activeReport = reports.find((r) => r.reportId === openMenuId);
          if (!activeReport) return null;

          return createPortal(
            <div
              className="fixed z-[9999] w-36 sm:w-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-fadeIn"
              style={{
                top: menuPos.top,
                left: menuPos.left,
              }}
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
            >
              <div className="flex flex-col">
                <button
                  onClick={() => {
                    setOpenMenuId(null); // Close menu
                    handleViewReport(activeReport);
                  }}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-[11px] sm:text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center gap-2 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-500" />
                  View Report
                </button>

                <div className="h-px bg-gray-100 dark:bg-gray-700"></div>

                <button
                  onClick={() => {
                    setOpenMenuId(null);
                    handleFilterByOrderNo(activeReport.orderNosString);
                  }}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-[11px] sm:text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 flex items-center gap-2 transition-colors"
                >
                  <Filter className="w-3.5 h-3.5" />
                  Filter All
                </button>

                <div className="h-px bg-gray-100 dark:bg-gray-700"></div>

                <button
                  onClick={() => {
                    setOpenMenuId(null);
                    handleDeleteReport(activeReport);
                  }}
                  className="px-3 sm:px-4 py-2.5 sm:py-3 text-left text-[11px] sm:text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete
                </button>
              </div>
            </div>,
            document.body,
          );
        })()}

      {/* --- MODALS --- */}
      {previewImage && (
        <ProductImageModal
          src={previewImage.src}
          alt={previewImage.alt}
          onClose={() => setPreviewImage(null)}
        />
      )}

      {viewingInspector && (
        <InspectorAutoCloseModal
          data={viewingInspector}
          onClose={() => setViewingInspector(null)}
        />
      )}

      {viewingReportQR && (
        <ReportQRModal
          report={viewingReportQR}
          onClose={() => setViewingReportQR(null)}
        />
      )}

      {showColumnModal && (
        <ColumnCustomizeModal
          columns={availableColumnsForModal}
          visibleColumns={visibleColumns}
          savedFilters={savedFiltersList} // <--- Pass List
          onApplyColumns={handleColumnChangeAndSave} // <--- Use new handler
          onApplyFilter={applySavedFilter} // <--- Pass Apply Function
          onDeleteFilter={handleDeleteFilter} // <--- Pass Delete Function
          onClose={() => setShowColumnModal(false)}
        />
      )}

      {/* Save Filter Name Modal */}
      {showSaveFilterModal &&
        createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm p-5 sm:p-6 border border-gray-200 dark:border-gray-700">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white mb-4">
                Save Current Filter
              </h3>

              <div className="mb-4">
                <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                  Filter Name
                </label>
                <input
                  type="text"
                  maxLength={25}
                  value={newFilterName}
                  onChange={(e) => setNewFilterName(e.target.value)}
                  placeholder="e.g. My Monthly AQL"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                  autoFocus
                />
                <p className="text-[10px] text-gray-400 text-right mt-1">
                  {newFilterName.length}/25
                </p>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowSaveFilterModal(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSaveFilter}
                  className="px-4 py-2 text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg shadow-lg"
                >
                  Save
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* --- Auto dismisaal Modal --- */}
      <AutoDismissModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        type={statusModal.type}
        message={statusModal.message}
      />

      <style jsx>{`
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
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
        @keyframes shrinkWidth {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .animate-shrinkWidth {
          animation: shrinkWidth 3s linear forwards;
        }
        /* Better touch scrolling for mobile */
        .overscroll-x-contain {
          overscroll-behavior-x: contain;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
    </div>
  );
};

export default YPivotQAReportMain;
