import React, { useState } from "react";
import {
  Calendar,
  Filter,
  RefreshCw,
  ChevronDown,
  Check,
  Search,
} from "lucide-react";

const MultiSelectDropdown = ({ label, options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleOption = (opt) => {
    let newSelected;
    if (selected.includes(opt)) {
      newSelected = selected.filter((s) => s !== opt);
    } else {
      newSelected = [...selected, opt];
    }
    onChange(newSelected);
  };

  return (
    <div className="relative min-w-[180px]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium shadow-sm hover:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
      >
        <div className="flex flex-col items-start truncate">
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
            {label}
          </span>
          <span className="truncate max-w-[140px] text-gray-700 dark:text-gray-200 leading-tight">
            {selected.length === 0
              ? "All Selected"
              : selected.length === 1
                ? selected[0]
                : `${selected.length} Selected`}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute z-20 top-full mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl animate-fadeIn overflow-hidden">
            <div className="p-2 border-b border-gray-100 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-8 pr-2 py-1.5 text-xs bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:border-indigo-500"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-60 overflow-y-auto p-1 custom-scrollbar">
              <button
                onClick={() => onChange([])}
                className={`w-full text-left px-2 py-1.5 rounded-md text-xs font-bold mb-1 flex items-center justify-between ${
                  selected.length === 0
                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300"
                    : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                }`}
              >
                <span>All {label}s</span>
                {selected.length === 0 && <Check className="w-3.5 h-3.5" />}
              </button>
              {filteredOptions.map((opt) => (
                <button
                  key={opt}
                  onClick={() => toggleOption(opt)}
                  className={`w-full text-left px-2 py-1.5 rounded-md text-xs mb-0.5 flex items-center justify-between ${
                    selected.includes(opt)
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 font-bold"
                      : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}
                >
                  <span className="truncate">{opt}</span>
                  {selected.includes(opt) && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const BuyerSummaryFilters = ({
  dateRange,
  setDateRange,
  selectedBuyers,
  setSelectedBuyers,
  availableBuyers,
  selectedReportTypes,
  setSelectedReportTypes,
  availableReportTypes,
  onDefault,
  onReset,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4">
      <div className="flex items-center gap-2 mb-2 xl:mb-0">
        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600">
          <Filter className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-gray-800 dark:text-white">Filters</h3>
          <p className="text-xs text-gray-500">Customize view</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1 h-[42px]">
          <Calendar className="w-4 h-4 text-gray-400" />
          <input
            type="date"
            className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 outline-none w-28 lg:w-auto"
            value={dateRange.start}
            onChange={(e) =>
              setDateRange({ ...dateRange, start: e.target.value })
            }
          />
          <span className="text-gray-400">-</span>
          <input
            type="date"
            className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-200 outline-none w-28 lg:w-auto"
            value={dateRange.end}
            onChange={(e) =>
              setDateRange({ ...dateRange, end: e.target.value })
            }
          />
        </div>

        <MultiSelectDropdown
          label="Buyer"
          options={availableBuyers}
          selected={selectedBuyers}
          onChange={setSelectedBuyers}
        />

        <MultiSelectDropdown
          label="Report Type"
          options={availableReportTypes}
          selected={selectedReportTypes}
          onChange={setSelectedReportTypes}
        />

        <div className="flex gap-2 ml-auto xl:ml-0">
          <button
            onClick={onDefault}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 dark:text-gray-200 text-sm font-bold rounded-lg transition-colors h-[42px]"
          >
            Default
          </button>
          <button
            onClick={onReset}
            className="px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm font-bold rounded-lg transition-colors flex items-center gap-1 h-[42px]"
          >
            <RefreshCw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export default BuyerSummaryFilters;
