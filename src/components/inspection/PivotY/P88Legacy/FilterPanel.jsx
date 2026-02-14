import { useState, useRef, useEffect } from "react";

const FilterField = ({
  label,
  type = "input",
  value,
  onChange,
  placeholder,
  options = [],
  icon,
  datalistId
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const [inputValue, setInputValue] = useState(value); // Separate input value from filter value
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Update input value when prop value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Filter options based on input value
  useEffect(() => {
    if (inputValue && type !== "select") {
      const filtered = options.filter((option) =>
        option.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [inputValue, options, type]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
        // Reset input to last selected value if no option was selected
        if (inputValue !== value) {
          setInputValue(value);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [inputValue, value]);

  const baseInputClasses = `
    w-full px-4 py-3 border rounded-lg text-sm transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    hover:border-gray-400 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:hover:border-gray-500
    ${isFocused ? 'border-blue-500 shadow-md' : 'border-gray-300'}
    ${type !== 'select' ? 'pr-10' : ''}
  `;

  const handleInputFocus = () => {
    setIsFocused(true);
    if (type !== "select" && options.length > 0) {
      setIsDropdownOpen(true);
    }
  };

  const handleInputBlur = () => {
    setIsFocused(false);
    // Delay closing dropdown to allow for option selection
    setTimeout(() => {
      setIsDropdownOpen(false);
      // Reset input to last selected value if no option was selected
      if (inputValue !== value) {
        setInputValue(value);
      }
    }, 200);
  };

  const handleOptionSelect = (option) => {
    setInputValue(option);
    onChange(option); // Only call onChange when option is actually selected
    setIsDropdownOpen(false);
    inputRef.current?.blur();
  };

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue); // Update input display value
    // Don't call onChange here - only update the visual input

    if (type !== "select" && options.length > 0) {
      setIsDropdownOpen(true);
    }
  };

  const handleDropdownToggle = () => {
    if (type === "select") return;

    if (isDropdownOpen) {
      setIsDropdownOpen(false);
      // Reset input to last selected value
      if (inputValue !== value) {
        setInputValue(value);
      }
    } else {
      inputRef.current?.focus();
      setIsDropdownOpen(true);
    }
  };

  const handleClear = () => {
    setInputValue("");
    onChange(""); // Clear the filter
    setIsDropdownOpen(false);
  };

  // Handle Enter key to select first filtered option
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && filteredOptions.length > 0) {
      e.preventDefault();
      handleOptionSelect(filteredOptions[0]);
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
      setInputValue(value); // Reset to last selected value
      inputRef.current?.blur();
    }
  };

  return (
    <div className="relative group" ref={dropdownRef}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        {label}
      </label>

      <div className="relative">
        {type === "select" ? (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            className={baseInputClasses}
          >
            <option value="">All Status</option>
            {options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <>
            <input
              ref={inputRef}
              type="text"
              placeholder={placeholder}
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              onKeyDown={handleKeyDown}
              className={baseInputClasses}
              autoComplete="off"
            />

            {/* Dropdown Arrow - Only show if there are options */}
            {options.length > 0 && (
              <button
                type="button"
                onClick={handleDropdownToggle}
                className="absolute inset-y-0 right-8 flex items-center px-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                tabIndex={-1}
              >
                <svg
                  className={`w-4 h-4 transition-transform duration-200 ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            )}

            {/* Custom Dropdown with improved styling */}
            {isDropdownOpen && filteredOptions.length > 0 && (
              <div 
                className="absolute z-[9999] w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto"
                style={{
                  boxShadow:
                    "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
              >
                {filteredOptions.slice(0, 10).map((option, index) => (
                  <div
                    key={`${option}-${index}`}
                    className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-900 dark:hover:text-blue-200 cursor-pointer text-sm border-b border-gray-100 dark:border-gray-700 last:border-b-0 transition-all duration-150 flex items-center justify-between"
                    onMouseDown={(e) => e.preventDefault()} // Prevent input blur
                    onClick={() => handleOptionSelect(option)}
                  >
                    <span className="text-gray-800 dark:text-gray-200 font-medium">{option}</span>
                    {value === option && (
                      <span className="text-xs text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full font-semibold">
                        Selected
                      </span>
                    )}
                  </div>
                ))}

                {filteredOptions.length > 10 && (
                  <div className="px-4 py-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 font-medium">
                    Showing 10 of {filteredOptions.length} results. Keep typing to narrow down...
                  </div>
                )}

                {filteredOptions.length === 0 && inputValue && (
                  <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center italic">
                    No matches found for "{inputValue}"
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Clear Button */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            tabIndex={-1}
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

const FilterPanel = ({ filters, onFilterChange, options }) => {
  const hasActiveFilters = Object.values(filters).some((value) => value !== "");
  const activeFilterCount = Object.values(filters).filter(
    (value) => value !== ""
  ).length;

  const clearAllFilters = () => {
    Object.keys(filters).forEach((key) => {
      onFilterChange(key, "");
    });
  };

  const filterFields = [
    {
      key: "inspector",
      label: "Inspector",
      placeholder: "",
      icon: "👤",
      options: [...(options.inspector || [])].sort()
    },
    {
      key: 'approvalStatus',
      label: 'Status',
      type: 'select',
      icon: '✅',
      options: ['Pending Approval', 'Accepted', 'Reworked'],
    },
    {
      key: "reportType",
      label: "Report Type",
      placeholder: "",
      icon: "📋",
      options: [...(options.reportType || [])].sort()
    },
    {
      key: "supplier",
      label: "Supplier",
      placeholder: "",
      icon: "🏢",
      options: [...(options.supplier || [])].sort()
    },
    {
      key: "project",
      label: "Project",
      placeholder: "",
      icon: "🏗️",
      options: [...(options.project || [])].sort()
    },
    {
      key: "poNumbers",
      label: "PO #",
      placeholder: "",
      icon: "🏷️",
      options: [...(options.poNumbers || [])].sort()
    },
    {
      key: 'style',
      label: 'Style',
      placeholder: '',
      icon: '👕',
      options: [...(options.style || [])].sort()
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 mb-8 overflow-visible">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg">
              <span className="text-xl">🔍</span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Filter Inspections</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {hasActiveFilters 
                  ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} applied`
                  : ''
                }
              </p>
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearAllFilters}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg transition-colors duration-200"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Filter Fields */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-4 lg:grid-cols-8 xl:grid-cols-8 gap-6">
          {filterFields.map((field) => (
            <FilterField
              key={field.key}
              label={field.label}
              type={field.type}
              value={filters[field.key]}
              onChange={(value) => onFilterChange(field.key, value)}
              placeholder={field.placeholder}
              options={field.options}
              icon={field.icon}
              datalistId={`${field.key}-options`}
            />
          ))}
        </div>

        {/* Quick Filter Chips */}
        {hasActiveFilters && (
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Active filters:</span>
              {Object.entries(filters).map(([key, value]) => {
                if (!value) return null;
                const field = filterFields.find((f) => f.key === key);
                return (
                  <div
                    key={key}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                  >
                    <span className="text-xs">{field?.icon}</span>
                    <span className="font-medium">{field?.label}:</span>
                    <span className="max-w-32 truncate">{value}</span>
                    <button
                      type="button"
                      onClick={() => onFilterChange(key, '')}
                      className="ml-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterPanel;
