import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../../config.js";
import { debounce } from "lodash";
import { Search, Filter } from "lucide-react";

const FilterPlane = ({ onFilter, loading }) => {
  const [styleNo, setStyleNo] = useState("");
  const [washType, setWashType] = useState("beforeWash");
  const [suggestions, setSuggestions] = useState([]);
  const [isSuggestionsVisible, setIsSuggestionsVisible] = useState(false);

  const isSelectionRef = useRef(false);

  const fetchSuggestions = useCallback(
    debounce(async (query) => {
      if (query.length > 0) {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/measurement/styles/search?query=${query}`,
          );
          setSuggestions(response.data);
          setIsSuggestionsVisible(true);
        } catch (error) {
          console.error("Failed to fetch style suggestions:", error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    }, 300),
    [],
  );

  useEffect(() => {
    if (isSelectionRef.current) {
      isSelectionRef.current = false;
      return;
    }
    fetchSuggestions(styleNo);
  }, [styleNo, fetchSuggestions]);

  const handleSuggestionClick = (suggestion) => {
    fetchSuggestions.cancel();
    isSelectionRef.current = true;

    setStyleNo(suggestion);
    setIsSuggestionsVisible(false);
    onFilter({ styleNo: suggestion, washType });
  };

  const handleWashTypeChange = (newWashType) => {
    setWashType(newWashType);
    if (styleNo) {
      onFilter({ styleNo, washType: newWashType });
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 max-w-3xl">
      <div className="flex items-center gap-2 mb-4 text-gray-700 dark:text-gray-200">
        <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
        <h3 className="text-sm font-bold uppercase tracking-wider">
          Filter Options
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-end">
        {/* Style Number Search */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="flex flex-col relative"
        >
          <label
            htmlFor="styleNo"
            className="mb-1.5 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase"
          >
            Style No
          </label>
          <div className="relative">
            <input
              id="styleNo"
              type="text"
              value={styleNo}
              className="w-full p-2.5 pl-9 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none transition-all placeholder-gray-400 dark:placeholder-gray-500"
              onChange={(e) => setStyleNo(e.target.value)}
              placeholder="Search Style (e.g., STYLE123)"
              autoComplete="off"
              onBlur={() =>
                setTimeout(() => setIsSuggestionsVisible(false), 200)
              }
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
          </div>

          {/* Suggestions Dropdown */}
          {isSuggestionsVisible && suggestions.length > 0 && (
            <ul className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg mt-1 z-50 max-h-60 overflow-y-auto shadow-xl">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className="px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors"
                  onMouseDown={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          )}
        </form>

        {/* Wash Type Selection */}
        <div className="flex flex-col">
          <label
            htmlFor="washType"
            className="mb-1.5 text-xs font-bold text-gray-600 dark:text-gray-400 uppercase"
          >
            Wash Type
          </label>
          <select
            id="washType"
            value={washType}
            onChange={(e) => handleWashTypeChange(e.target.value)}
            className="w-full p-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 outline-none cursor-pointer transition-all"
          >
            <option value="beforeWash">Before Wash</option>
            <option value="afterWash">After Wash</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterPlane;
