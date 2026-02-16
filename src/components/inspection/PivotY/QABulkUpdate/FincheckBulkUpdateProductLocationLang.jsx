import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Save,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertCircle,
  MapPin,
  Loader2,
  ClipboardPaste,
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";

const FincheckBulkUpdateProductLocationLang = () => {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [changedItems, setChangedItems] = useState(new Set()); // Track modified English names

  // Fetch Data
  const fetchLocations = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/qa-sections-product-location/distinct-names`,
      );
      if (response.data.success) {
        setLocations(response.data.data);
        setChangedItems(new Set()); // Reset changes on refresh
      }
    } catch (error) {
      console.error("Error fetching locations:", error);
      alert("Failed to load location data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLocations();
  }, []);

  // Handle Input Change (Single row typing)
  const handleInputChange = (englishName, newChineseValue) => {
    setLocations((prev) =>
      prev.map((item) =>
        item.locationName === englishName
          ? { ...item, locationNameChinese: newChineseValue }
          : item,
      ),
    );

    // Mark as changed
    setChangedItems((prev) => {
      const newSet = new Set(prev);
      newSet.add(englishName);
      return newSet;
    });
  };

  // ✅ EXCEL-LIKE PASTE HANDLER
  const handlePaste = (e, startIndex) => {
    // 1. Get data from clipboard
    const clipboardData = e.clipboardData.getData("text");
    if (!clipboardData) return;

    // 2. Prevent default paste (which just puts all text in one box)
    e.preventDefault();

    // 3. Split by newlines to get rows (Excel copies with \n or \r\n)
    // Filter out empty lines at the end which Excel sometimes adds
    const rows = clipboardData.split(/\r\n|\n|\r/);
    if (rows.length > 0 && rows[rows.length - 1].trim() === "") {
      rows.pop();
    }

    // 4. Update State
    setLocations((prevLocations) => {
      const newLocations = [...prevLocations];
      const newChangedItems = new Set(changedItems); // Clone existing changes

      // We need to iterate over the *Filtered* list logic to ensure we paste visual order
      // However, we update the *Main* list based on ID (English Name)

      // Since we are inside the state setter, we re-derive the filtered list based on current search
      // to find which items correspond to the visual index "startIndex"
      const currentFiltered = newLocations.filter(
        (item) =>
          item.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.locationNameChinese
            .toLowerCase()
            .includes(searchQuery.toLowerCase()),
      );

      // Loop through pasted rows and apply to the filtered list sequentially
      rows.forEach((pastedValue, i) => {
        const targetIndex = startIndex + i;

        // Ensure we don't go out of bounds of the current visible list
        if (targetIndex < currentFiltered.length) {
          const targetItem = currentFiltered[targetIndex];
          const cleanValue = pastedValue.trim(); // Clean whitespace (excel cells)

          // Find this item in the main array to update it
          const mainIndex = newLocations.findIndex(
            (loc) => loc.locationName === targetItem.locationName,
          );

          if (mainIndex !== -1) {
            newLocations[mainIndex] = {
              ...newLocations[mainIndex],
              locationNameChinese: cleanValue,
            };
            // Mark as changed so "Save" button activates
            newChangedItems.add(targetItem.locationName);
          }
        }
      });

      // Update the Set of changed items outside the state setter (React batching handles this)
      setChangedItems(newChangedItems);
      return newLocations;
    });
  };

  // Handle Save
  const handleSave = async () => {
    if (changedItems.size === 0) return;

    setSaving(true);
    try {
      // Filter only changed items that have a chinese value
      const updates = locations
        .filter(
          (item) =>
            changedItems.has(item.locationName) &&
            item.locationNameChinese.trim() !== "",
        )
        .map((item) => ({
          name: item.locationName,
          chinese: item.locationNameChinese,
        }));

      if (updates.length === 0) {
        setSaving(false);
        return;
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/qa-sections-product-location/bulk-update-names`,
        { updates },
      );

      if (response.data.success) {
        alert(
          `Successfully updated ${response.data.modifiedCount} translations!`,
        );
        setChangedItems(new Set()); // Clear changes
        fetchLocations(); // Refresh to ensure sync
      }
    } catch (error) {
      console.error("Error saving updates:", error);
      alert("Failed to save updates.");
    } finally {
      setSaving(false);
    }
  };

  // Filter Logic
  const filteredLocations = locations.filter(
    (item) =>
      item.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.locationNameChinese
        .toLowerCase()
        .includes(searchQuery.toLowerCase()),
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col h-[calc(100vh-220px)]">
      {/* Toolbar */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
            <MapPin className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800 dark:text-white">
              Product Locations
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {locations.length} unique locations found
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Paste Hint */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-100 dark:border-blue-800">
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Supports Excel Paste</span>
          </div>

          {/* Search */}
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search locations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          {/* Refresh */}
          <button
            onClick={fetchLocations}
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
            title="Refresh List"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={saving || changedItems.size === 0}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all
              ${
                changedItems.size > 0
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:scale-105 active:scale-95"
                  : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
              }
            `}
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            Save Changes ({changedItems.size})
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto p-0">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-100 dark:bg-gray-700 sticky top-0 z-10 shadow-sm">
            <tr>
              <th className="py-3 px-4 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-12 text-center">
                Status
              </th>
              <th className="py-3 px-4 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-1/2">
                Location Name (English)
              </th>
              <th className="py-3 px-4 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider w-1/2">
                Location Name (Chinese)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan="3" className="py-12 text-center text-gray-500">
                  <div className="flex justify-center items-center gap-2">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    <span>Loading distinct locations...</span>
                  </div>
                </td>
              </tr>
            ) : filteredLocations.length === 0 ? (
              <tr>
                <td colSpan="3" className="py-12 text-center text-gray-500">
                  No locations found matching your search.
                </td>
              </tr>
            ) : (
              filteredLocations.map((item, index) => {
                const isComplete =
                  item.locationName && item.locationNameChinese;
                const isModified = changedItems.has(item.locationName);

                return (
                  <tr
                    key={index}
                    className={`
                      transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50
                      ${
                        isComplete
                          ? "bg-emerald-50/60 dark:bg-emerald-900/10"
                          : ""
                      }
                    `}
                  >
                    <td className="py-3 px-4 text-center">
                      {isComplete ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-amber-500 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-gray-800 dark:text-gray-200">
                      {item.locationName}
                    </td>
                    <td className="py-2 px-4">
                      <input
                        type="text"
                        value={item.locationNameChinese}
                        onChange={(e) =>
                          handleInputChange(item.locationName, e.target.value)
                        }
                        // ✅ Attach Paste Handler here, passing the current index
                        onPaste={(e) => handlePaste(e, index)}
                        placeholder="Enter Chinese translation..."
                        className={`
                          w-full px-3 py-1.5 text-sm border rounded-lg outline-none transition-all
                          bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100
                          ${
                            isModified
                              ? "border-indigo-500 ring-1 ring-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                              : "border-gray-300 dark:border-gray-600 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          }
                        `}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FincheckBulkUpdateProductLocationLang;
