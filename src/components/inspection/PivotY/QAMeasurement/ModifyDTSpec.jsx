import { useState, useRef, useEffect } from "react";
import { useAuth } from "../../../authentication/AuthContext";
import Swal from "sweetalert2";

const ModifyDTspec = () => {
  const { user } = useAuth();
  const [orderNo, setOrderNo] = useState("");
  const [orderData, setOrderData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isModified, setIsModified] = useState(false);
  const [modifiedData, setModifiedData] = useState(null);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [draggedSizeIndex, setDraggedSizeIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [modifiedFields, setModifiedFields] = useState(new Set());
  const [originalData, setOriginalData] = useState(null);
  const [newlyAddedSizes, setNewlyAddedSizes] = useState(new Set());
  const [editingSizeIndex, setEditingSizeIndex] = useState(-1);
  const [editingSizeName, setEditingSizeName] = useState("");
  const [editingTable, setEditingTable] = useState("");
  const editInputRef = useRef(null);

  const [editingToleranceIndex, setEditingToleranceIndex] = useState(-1);
  const [editingToleranceType, setEditingToleranceType] = useState(""); // 'minus' or 'plus'
  const [editingToleranceValue, setEditingToleranceValue] = useState("");
  const toleranceInputRef = useRef(null);

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const Toast = Swal.mixin({
    customClass: {
      confirmButton:
        "px-6 py-2.5 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 mx-2",
      cancelButton:
        "px-6 py-2.5 bg-gray-500 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-gray-600 mx-2",
      denyButton:
        "px-6 py-2.5 bg-red-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-red-700 mx-2",
    },
    buttonsStyling: false,
  });

  const useDebounce = (value, delay) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedOrderNo = useDebounce(orderNo, 300);

  // Fetch suggestions when user types
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedOrderNo.length >= 2) {
        setLoadingSuggestions(true);
        try {
          // Use the modified getDtOrderByOrderNo with suggest=true
          const response = await fetch(
            `${apiBaseUrl}/api/dt-modify/${encodeURIComponent(debouncedOrderNo)}?suggest=true`,
          );

          if (response.ok) {
            const result = await response.json();
            if (result.success && result.type === "suggestions") {
              setSuggestions(result.data);
              setShowSuggestions(true);
            }
          }
        } catch (error) {
          console.error("Error fetching suggestions:", error);
        } finally {
          setLoadingSuggestions(false);
        }
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [debouncedOrderNo, apiBaseUrl]);

  // Handle input change
  const handleOrderNoChange = (e) => {
    const value = e.target.value;
    setOrderNo(value);
    setSelectedSuggestionIndex(-1);

    if (value.length < 2) {
      setShowSuggestions(false);
      setSuggestions([]);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    setOrderNo(suggestion.Order_No);
    setShowSuggestions(false);
    setSuggestions([]);
    setSelectedSuggestionIndex(-1);
    // Automatically search when suggestion is selected
    setTimeout(() => {
      handleSearch(suggestion.Order_No);
    }, 100);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearch();
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedSuggestionIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        } else {
          handleSearch();
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Search for order by order number
  const handleSearch = async (searchOrderNo = null) => {
    const orderToSearch = searchOrderNo || orderNo;

    if (!orderToSearch.trim()) {
      setError("Please enter an order number");
      return;
    }
    setLoading(true);
    setError("");
    setShowSuggestions(false);

    // Reset editing states when loading new order
    setEditingSizeIndex(-1);
    setEditingSizeName("");
    setNewlyAddedSizes(new Set()); // Reset newly added sizes for new order

    try {
      const url = `${apiBaseUrl}/api/dt-modify/${orderToSearch}`;

      const response = await fetch(url);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          const errorText = await response.text();
          console.log("❌ Error response text:", errorText);
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success && result.data && result.type === "exact_match") {
        setOrderData(result.data);
        setModifiedData(JSON.parse(JSON.stringify(result.data)));
        setOriginalData(JSON.parse(JSON.stringify(result.data))); // Store original data
        setIsModified(false);
        setModifiedFields(new Set());
      } else {
        throw new Error(result.message || "Failed to fetch order");
      }
    } catch (err) {
      console.error("❌ Search error:", err);
      setError(err.message);
      setOrderData(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle size name editing
  const handleSizeNameEdit = (sizeIndex, newSizeName) => {
    const trimmedName = newSizeName.trim();

    if (!trimmedName) {
      alert("Size name cannot be empty");
      // Reset to original name and stay in edit mode
      setEditingSizeName(modifiedData.SizeList[sizeIndex]);
      return;
    }

    const oldSizeName = modifiedData.SizeList[sizeIndex];

    // If name hasn't changed, just exit edit mode
    if (trimmedName === oldSizeName) {
      setEditingSizeIndex(-1);
      setEditingSizeName("");
      setEditingTable("");
      return;
    }

    // Check if new name already exists (excluding current size)
    if (
      modifiedData.SizeList.some(
        (size, index) =>
          index !== sizeIndex &&
          size.toLowerCase() === trimmedName.toLowerCase(),
      )
    ) {
      alert(`Size "${trimmedName}" already exists!`);
      // Reset to original name and stay in edit mode
      setEditingSizeName(oldSizeName);
      return;
    }

    // Force a re-render by updating the key
    const timestamp = Date.now();

    setModifiedData((prevData) => {
      const updatedData = { ...prevData };

      // Update SizeList
      updatedData.SizeList = [...prevData.SizeList];
      updatedData.SizeList[sizeIndex] = trimmedName;

      // Update SizeSpec - rename size keys in Specs
      updatedData.SizeSpec = prevData.SizeSpec.map((spec) => ({
        ...spec,
        Specs: spec.Specs.map((specItem) => {
          if (specItem[oldSizeName]) {
            const { [oldSizeName]: value, ...rest } = specItem;
            return { ...rest, [trimmedName]: value };
          }
          return specItem;
        }),
      }));

      // Update OrderColors - rename size keys in OrderQty and CutQty
      updatedData.OrderColors = prevData.OrderColors.map((color) => {
        const updatedColor = { ...color };

        // Update OrderQty
        updatedColor.OrderQty = color.OrderQty.map((qtyItem) => {
          if (qtyItem[oldSizeName] !== undefined) {
            const { [oldSizeName]: value, ...rest } = qtyItem;
            return { ...rest, [trimmedName]: value };
          }
          return qtyItem;
        });

        // Update CutQty
        if (color.CutQty && color.CutQty[oldSizeName]) {
          const { [oldSizeName]: value, ...rest } = color.CutQty;
          updatedColor.CutQty = { ...rest, [trimmedName]: value };
        }

        return updatedColor;
      });

      // Update OrderColorShip - rename size keys in sizes arrays
      updatedData.OrderColorShip = prevData.OrderColorShip.map((colorShip) => ({
        ...colorShip,
        ShipSeqNo: colorShip.ShipSeqNo.map((shipSeq) => ({
          ...shipSeq,
          sizes: shipSeq.sizes.map((sizeItem) => {
            if (sizeItem[oldSizeName] !== undefined) {
              const { [oldSizeName]: value, ...rest } = sizeItem;
              return { ...rest, [trimmedName]: value };
            }
            return sizeItem;
          }),
        })),
      }));

      // Add a timestamp to force re-render
      updatedData._lastModified = timestamp;

      return updatedData;
    });

    // Update newly added sizes set if the renamed size was newly added
    setNewlyAddedSizes((prev) => {
      if (prev.has(oldSizeName)) {
        const newSet = new Set(prev);
        newSet.delete(oldSizeName);
        newSet.add(trimmedName);
        return newSet;
      }
      return prev;
    });

    setIsModified(true);

    // Exit edit mode
    setEditingSizeIndex(-1);
    setEditingSizeName("");
    setEditingTable("");
  };

  // Start editing size name - Updated
  const startEditingSizeName = (
    sizeIndex,
    currentName,
    tableType = "specs",
  ) => {
    setEditingSizeIndex(sizeIndex);
    setEditingSizeName(currentName);
    setEditingTable(tableType);

    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus({ preventScroll: true });
        editInputRef.current.select();
      }
    }, 50);
  };

  // Cancel editing size name - Updated
  const cancelEditingSizeName = () => {
    setEditingSizeIndex(-1);
    setEditingSizeName("");
    setEditingTable("");
  };

  const startEditingTolerance = (specIndex, toleranceType, currentValue) => {
    setEditingToleranceIndex(specIndex);
    setEditingToleranceType(toleranceType);
    setEditingToleranceValue(currentValue || "");
    setTimeout(() => {
      if (toleranceInputRef.current) {
        toleranceInputRef.current.focus();
        toleranceInputRef.current.select();
      }
    }, 50);
  };

  const cancelEditingTolerance = () => {
    setEditingToleranceIndex(-1);
    setEditingToleranceType("");
    setEditingToleranceValue("");
  };

  const handleToleranceEdit = (specIndex, toleranceType, newValue) => {
    const trimmedValue = newValue.trim();

    const fieldKey = createFieldKey("tolerance", specIndex, toleranceType);

    // Get original value for comparison
    const originalValue =
      toleranceType === "minus"
        ? originalData?.SizeSpec?.[specIndex]?.ToleranceMinus?.fraction || ""
        : originalData?.SizeSpec?.[specIndex]?.TolerancePlus?.fraction || "";

    setModifiedData((prevData) => {
      const updatedData = { ...prevData };

      // Convert the new value to decimal using the same function as measurements
      const decimalValue = convertFractionToDecimal(trimmedValue);

      if (toleranceType === "minus") {
        updatedData.SizeSpec[specIndex].ToleranceMinus = {
          fraction: trimmedValue,
          decimal: decimalValue,
        };
      } else {
        updatedData.SizeSpec[specIndex].TolerancePlus = {
          fraction: trimmedValue,
          decimal: decimalValue,
        };
      }

      return updatedData;
    });

    // Track if field is modified
    if (trimmedValue !== originalValue) {
      markFieldAsModified(fieldKey);
    } else {
      setModifiedFields((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fieldKey);
        return newSet;
      });
    }

    setIsModified(true);

    // Exit edit mode
    cancelEditingTolerance();
  };

  const handleToleranceChange = (specIndex, toleranceType, value) => {
    const fieldKey = createFieldKey("tolerance", specIndex, toleranceType);

    // Check if value is different from original
    const originalValue =
      toleranceType === "minus"
        ? originalData?.SizeSpec?.[specIndex]?.ToleranceMinus?.fraction || ""
        : originalData?.SizeSpec?.[specIndex]?.TolerancePlus?.fraction || "";

    const updatedData = { ...modifiedData };

    // Convert fraction to decimal using the same logic as measurements
    const decimalValue = convertFractionToDecimal(value);

    if (toleranceType === "minus") {
      updatedData.SizeSpec[specIndex].ToleranceMinus = {
        fraction: value,
        decimal: decimalValue,
      };
    } else {
      updatedData.SizeSpec[specIndex].TolerancePlus = {
        fraction: value,
        decimal: decimalValue,
      };
    }

    // Track if field is modified
    if (value !== originalValue) {
      markFieldAsModified(fieldKey);
    } else {
      // Remove from modified fields if value matches original
      setModifiedFields((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fieldKey);
        return newSet;
      });
    }

    setModifiedData(updatedData);
    setIsModified(true);
  };

  const createFieldKey = (type, ...identifiers) => {
    return `${type}_${identifiers.join("_")}`;
  };

  const isFieldModified = (fieldKey) => {
    return modifiedFields.has(fieldKey);
  };

  const markFieldAsModified = (fieldKey) => {
    setModifiedFields((prev) => new Set([...prev, fieldKey]));
  };

  // Handle size reordering
  const handleSizeReorder = (fromIndex, toIndex) => {
    if (fromIndex === toIndex) return;

    setModifiedData((prevData) => {
      const updatedData = { ...prevData };

      // Reorder SizeList
      const newSizeList = [...updatedData.SizeList];
      const [movedSize] = newSizeList.splice(fromIndex, 1);
      newSizeList.splice(toIndex, 0, movedSize);
      updatedData.SizeList = newSizeList;

      // Update SizeSpec - reorder the Specs arrays to match new size order
      updatedData.SizeSpec = updatedData.SizeSpec.map((spec) => {
        const newSpecs = [];

        // Reorder specs according to new size order
        newSizeList.forEach((size) => {
          const existingSpec = spec.Specs.find((s) => s[size]);
          if (existingSpec) {
            newSpecs.push(existingSpec);
          } else {
            // If spec doesn't exist for this size, create default
            newSpecs.push({
              [size]: { fraction: "0", decimal: 0 },
            });
          }
        });

        return {
          ...spec,
          Specs: newSpecs,
        };
      });

      // Update OrderColors - reorder OrderQty arrays to match new size order
      updatedData.OrderColors = updatedData.OrderColors.map((color) => {
        const newOrderQty = [];

        // Reorder OrderQty according to new size order
        newSizeList.forEach((size) => {
          const existingQty = color.OrderQty.find((q) => q[size] !== undefined);
          if (existingQty) {
            newOrderQty.push(existingQty);
          } else {
            // If qty doesn't exist for this size, create default
            newOrderQty.push({ [size]: 0 });
          }
        });

        // CutQty doesn't need reordering as it's an object, not an array
        // But ensure all sizes exist in CutQty
        const newCutQty = { ...color.CutQty };
        newSizeList.forEach((size) => {
          if (!newCutQty[size]) {
            newCutQty[size] = {
              ActualCutQty: 0,
              PlanCutQty: 0,
            };
          }
        });

        return {
          ...color,
          OrderQty: newOrderQty,
          CutQty: newCutQty,
        };
      });

      // Update OrderColorShip - reorder sizes arrays to match new size order
      updatedData.OrderColorShip = updatedData.OrderColorShip.map(
        (colorShip) => ({
          ...colorShip,
          ShipSeqNo: colorShip.ShipSeqNo.map((shipSeq) => {
            const newSizes = [];

            // Reorder sizes according to new size order
            newSizeList.forEach((size) => {
              const existingSize = shipSeq.sizes.find(
                (s) => s[size] !== undefined,
              );
              if (existingSize) {
                newSizes.push(existingSize);
              } else {
                // If size doesn't exist, create default
                newSizes.push({ [size]: 0 });
              }
            });

            return {
              ...shipSeq,
              sizes: newSizes,
            };
          }),
        }),
      );

      return updatedData;
    });

    setIsModified(true);
  };

  // Drag and drop handlers
  const handleDragStart = (e, index) => {
    // Don't allow dragging when in edit mode
    if (editingSizeIndex !== -1 && editingTable === "specs") {
      e.preventDefault();
      return;
    }

    setDraggedSizeIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target.outerHTML);
    e.target.style.opacity = "0.5";
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = "1";
    setDraggedSizeIndex(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    // Don't allow drag over when in edit mode
    if (editingSizeIndex !== -1 && editingTable === "specs") {
      return;
    }

    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedSizeIndex !== null && draggedSizeIndex !== dropIndex) {
      handleSizeReorder(draggedSizeIndex, dropIndex);
    }
    setDraggedSizeIndex(null);
    setDragOverIndex(null);
  };

  // Alternative: Handle size reordering with up/down buttons
  const moveSizeUp = (index) => {
    if (index > 0) {
      handleSizeReorder(index, index - 1);
    }
  };

  const moveSizeDown = (index) => {
    if (index < modifiedData.SizeList.length - 1) {
      handleSizeReorder(index, index + 1);
    }
  };

  // Handle specification changes
  const handleSpecChange = (specIndex, sizeKey, field, value) => {
    const fieldKey = createFieldKey("spec", specIndex, sizeKey, field);

    // Check if value is different from original
    const originalValue = originalData?.SizeSpec?.[specIndex]?.Specs?.find(
      (spec) => spec[sizeKey],
    )?.[sizeKey]?.[field];

    const updatedData = { ...modifiedData };

    if (field === "fraction") {
      updatedData.SizeSpec[specIndex].Specs.forEach((spec) => {
        if (spec[sizeKey]) {
          spec[sizeKey].fraction = value;
          spec[sizeKey].decimal = convertFractionToDecimal(value);
        }
      });
    } else if (field === "decimal") {
      updatedData.SizeSpec[specIndex].Specs.forEach((spec) => {
        if (spec[sizeKey]) {
          const decimalValue = parseFloat(value) || 0;
          spec[sizeKey].decimal = decimalValue;
          spec[sizeKey].fraction = convertDecimalToFraction(decimalValue);
        }
      });
    }

    // Track if field is modified
    if (value !== originalValue) {
      markFieldAsModified(fieldKey);
    } else {
      // Remove from modified fields if value matches original
      setModifiedFields((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fieldKey);
        return newSet;
      });
    }

    setModifiedData(updatedData);
    setIsModified(true);
  };

  // Convert decimal number to fraction string
  const convertDecimalToFraction = (decimal) => {
    if (typeof decimal !== "number" || isNaN(decimal)) {
      return "0";
    }

    // Handle whole numbers
    if (decimal % 1 === 0) {
      return decimal.toString();
    }

    // Handle negative numbers
    const isNegative = decimal < 0;
    const absDecimal = Math.abs(decimal);

    // Separate whole and fractional parts
    const wholePart = Math.floor(absDecimal);
    const fractionalPart = absDecimal - wholePart;

    // Convert fractional part to fraction
    const tolerance = 1e-6;
    let bestNumerator = 1;
    let bestDenominator = 1;
    let bestError = Math.abs(fractionalPart - bestNumerator / bestDenominator);

    // Try common denominators first (more accurate for typical measurements)
    const commonDenominators = [
      2, 4, 8, 16, 32, 64, 3, 6, 12, 5, 10, 100, 1000,
    ];

    for (const den of commonDenominators) {
      const num = Math.round(fractionalPart * den);
      const error = Math.abs(fractionalPart - num / den);

      if (error < bestError) {
        bestNumerator = num;
        bestDenominator = den;
        bestError = error;
      }

      if (error < tolerance) break;
    }

    // Reduce the fraction
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const commonDivisor = gcd(bestNumerator, bestDenominator);
    bestNumerator /= commonDivisor;
    bestDenominator /= commonDivisor;

    // Format the result
    let result = "";

    if (isNegative) result += "-";

    if (wholePart > 0) {
      result += wholePart;
      if (bestNumerator > 0) {
        result += ` ${bestNumerator}/${bestDenominator}`;
      }
    } else if (bestNumerator > 0) {
      result += `${bestNumerator}/${bestDenominator}`;
    } else {
      result += "0";
    }

    return result;
  };

  const convertFractionToDecimal = (fractionStr) => {
    if (!fractionStr || typeof fractionStr !== "string") {
      return 0;
    }

    const trimmed = fractionStr.trim();

    // Handle empty string
    if (trimmed === "") {
      return 0;
    }

    // Handle negative values
    let isNegative = false;
    let workingStr = trimmed;

    // Check for negative signs (including Unicode minus)
    if (trimmed.startsWith("-") || trimmed.startsWith("−")) {
      isNegative = true;
      workingStr = trimmed.substring(1).trim();
    }

    let decimal = 0;

    try {
      // Handle pure decimal numbers (like "1.5", "0.75")
      if (
        !workingStr.includes("/") &&
        !workingStr.includes("⁄") &&
        !workingStr.includes(" ")
      ) {
        decimal = parseFloat(workingStr);
        if (isNaN(decimal)) decimal = 0;
      }
      // Handle mixed numbers (like "1 1/2", "2 3⁄4") - FIXED: Now handles both / and ⁄
      else if (
        workingStr.includes(" ") &&
        (workingStr.includes("/") || workingStr.includes("⁄"))
      ) {
        const parts = workingStr.split(" ");
        if (parts.length === 2) {
          const wholePart = parseInt(parts[0]) || 0;
          const fractionPart = parts[1];

          // Handle both regular slash and Unicode fraction slash in mixed numbers
          const fractionParts = fractionPart.includes("⁄")
            ? fractionPart.split("⁄")
            : fractionPart.split("/");

          if (fractionParts.length === 2) {
            const num = parseInt(fractionParts[0]) || 0;
            const den = parseInt(fractionParts[1]) || 1;

            if (den !== 0) {
              decimal = wholePart + num / den;
            }
          }
        }
      }
      // Handle pure fractions (like "1/2", "3⁄4", "5⁄8")
      else if (workingStr.includes("/") || workingStr.includes("⁄")) {
        // Handle both regular slash and Unicode fraction slash
        const parts = workingStr.includes("⁄")
          ? workingStr.split("⁄")
          : workingStr.split("/");

        if (parts.length === 2) {
          const num = parseInt(parts[0]) || 0;
          const den = parseInt(parts[1]) || 1;

          if (den !== 0) {
            decimal = num / den;
          }
        }
      } else {
        const fallback = parseFloat(workingStr);
        decimal = isNaN(fallback) ? 0 : fallback;
      }
    } catch (error) {
      console.error("Error converting fraction to decimal:", error);
      decimal = 0;
    }

    // Apply negative sign if needed
    if (isNegative) {
      decimal = -decimal;
    }

    // Round to 6 decimal places to avoid floating point precision issues
    return Math.round(decimal * 1000000) / 1000000;
  };

  // Add new size to specifications
  const handleAddSize = (newSize) => {
    if (!modifiedData) {
      alert("Please search and load an order first");
      return;
    }

    if (!newSize.trim()) {
      return;
    }

    if (modifiedData.SizeList.includes(newSize)) {
      alert(`Size "${newSize}" already exists!`);
      return;
    }

    // Track newly added size
    setNewlyAddedSizes((prev) => new Set([...prev, newSize]));

    setModifiedData((prevData) => {
      const updatedData = { ...prevData };

      // Add to SizeList
      updatedData.SizeList = [...prevData.SizeList, newSize];
      updatedData.NoOfSize = updatedData.SizeList.length;

      // Add to each specification with proper initialization
      updatedData.SizeSpec = prevData.SizeSpec.map((spec) => ({
        ...spec,
        Specs: [
          ...spec.Specs,
          {
            [newSize]: {
              fraction: "0",
              decimal: 0,
            },
          },
        ],
      }));

      // Add to OrderQty and CutQty for each color
      updatedData.OrderColors = prevData.OrderColors.map((color) => ({
        ...color,
        OrderQty: [...(color.OrderQty || []), { [newSize]: 0 }],
        CutQty: {
          ...(color.CutQty || {}),
          [newSize]: {
            ActualCutQty: 0,
            PlanCutQty: 0,
          },
        },
      }));

      // Add to OrderColorShip
      updatedData.OrderColorShip = prevData.OrderColorShip.map((colorShip) => ({
        ...colorShip,
        ShipSeqNo: colorShip.ShipSeqNo.map((shipSeq) => ({
          ...shipSeq,
          sizes: [...(shipSeq.sizes || []), { [newSize]: 0 }],
        })),
      }));

      return updatedData;
    });

    setIsModified(true);
  };

  // Handle quantity changes
  const handleQtyChange = (colorIndex, sizeKey, qtyType, value) => {
    const fieldKey = createFieldKey("qty", colorIndex, sizeKey, qtyType);
    const qty = parseInt(value) || 0;

    // Get original value for comparison
    let originalValue = 0;
    if (qtyType === "order") {
      const originalOrderQty = originalData?.OrderColors?.[
        colorIndex
      ]?.OrderQty?.find((q) => q[sizeKey] !== undefined);
      originalValue = originalOrderQty?.[sizeKey] || 0;
    } else if (qtyType === "actualCut") {
      originalValue =
        originalData?.OrderColors?.[colorIndex]?.CutQty?.[sizeKey]
          ?.ActualCutQty || 0;
    } else if (qtyType === "planCut") {
      originalValue =
        originalData?.OrderColors?.[colorIndex]?.CutQty?.[sizeKey]
          ?.PlanCutQty || 0;
    }

    const updatedData = { ...modifiedData };

    if (qtyType === "order") {
      if (!updatedData.OrderColors[colorIndex].OrderQty) {
        updatedData.OrderColors[colorIndex].OrderQty = [];
      }

      let orderQtyItem = updatedData.OrderColors[colorIndex].OrderQty.find(
        (q) => q[sizeKey] !== undefined,
      );
      if (orderQtyItem) {
        orderQtyItem[sizeKey] = qty;
      } else {
        updatedData.OrderColors[colorIndex].OrderQty.push({ [sizeKey]: qty });
      }
    } else if (qtyType === "actualCut") {
      if (!updatedData.OrderColors[colorIndex].CutQty) {
        updatedData.OrderColors[colorIndex].CutQty = {};
      }
      if (!updatedData.OrderColors[colorIndex].CutQty[sizeKey]) {
        updatedData.OrderColors[colorIndex].CutQty[sizeKey] = {
          ActualCutQty: 0,
          PlanCutQty: 0,
        };
      }
      updatedData.OrderColors[colorIndex].CutQty[sizeKey].ActualCutQty = qty;
    } else if (qtyType === "planCut") {
      if (!updatedData.OrderColors[colorIndex].CutQty) {
        updatedData.OrderColors[colorIndex].CutQty = {};
      }
      if (!updatedData.OrderColors[colorIndex].CutQty[sizeKey]) {
        updatedData.OrderColors[colorIndex].CutQty[sizeKey] = {
          ActualCutQty: 0,
          PlanCutQty: 0,
        };
      }
      updatedData.OrderColors[colorIndex].CutQty[sizeKey].PlanCutQty = qty;
    }

    // Track if field is modified
    if (qty !== originalValue) {
      markFieldAsModified(fieldKey);
    } else {
      setModifiedFields((prev) => {
        const newSet = new Set(prev);
        newSet.delete(fieldKey);
        return newSet;
      });
    }

    setModifiedData(updatedData);
    setIsModified(true);
  };

  // Save changes
  const handleSave = async () => {
    if (!isModified) return;
    if (!user) {
      // Switched to SweetAlert
      Toast.fire({
        icon: "error",
        title: "Unauthorized",
        text: "You must be logged in to save changes",
      });
      return;
    }
    setLoading(true);
    try {
      const dataToSave = {
        ...modifiedData,
        isModify: true,
        modifiedAt: new Date(),
        modifiedBy:
          user.emp_id || user.eng_name || user.email || "Unknown User",
      };
      const url = `${apiBaseUrl}/api/dt-modify/${orderData._id}`;

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
        },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        let errorMessage = "Failed to save changes";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (jsonError) {
          const errorText = await response.text();
          console.log("❌ Save error response:", errorText);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (result.success && result.data) {
        setOrderData(result.data);
        setModifiedData(JSON.parse(JSON.stringify(result.data)));
        setOriginalData(JSON.parse(JSON.stringify(result.data)));
        setIsModified(false);
        setModifiedFields(new Set());
        setNewlyAddedSizes(new Set());
        // Switched to SweetAlert
        Toast.fire({
          icon: "success",
          title: "Success",
          text: "Changes saved successfully!",
        });
      } else {
        throw new Error(result.message || "Failed to save changes");
      }
    } catch (err) {
      console.error("❌ Save error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Delete size from specifications
  const handleDeleteSize = async (sizeToDelete) => {
    if (!orderData || !sizeToDelete) return;

    Toast.fire({
      title: "Are you sure?",
      text: `Do you want to delete size "${sizeToDelete}"? This will remove it from all specifications and quantity tables.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, cancel!",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        setNewlyAddedSizes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(sizeToDelete);
          return newSet;
        });
        setModifiedData((prevData) => {
          if (!prevData) return prevData;
          const updatedData = { ...prevData };
          updatedData.SizeList = prevData.SizeList.filter(
            (size) => size !== sizeToDelete,
          );
          updatedData.NoOfSize = updatedData.SizeList.length;
          updatedData.SizeSpec = prevData.SizeSpec.map((spec) => ({
            ...spec,
            Specs: spec.Specs.filter(
              (specItem) => !specItem.hasOwnProperty(sizeToDelete),
            ),
          }));
          updatedData.OrderColors = prevData.OrderColors.map((color) => {
            const updatedColor = { ...color };
            updatedColor.OrderQty = color.OrderQty.filter(
              (qtyItem) => !qtyItem.hasOwnProperty(sizeToDelete),
            );
            const { [sizeToDelete]: deletedSize, ...remainingCutQty } =
              color.CutQty;
            updatedColor.CutQty = remainingCutQty;
            return updatedColor;
          });
          updatedData.OrderColorShip = prevData.OrderColorShip.map(
            (colorShip) => ({
              ...colorShip,
              ShipSeqNo: colorShip.ShipSeqNo.map((shipSeq) => ({
                ...shipSeq,
                sizes: shipSeq.sizes.filter(
                  (sizeItem) => !sizeItem.hasOwnProperty(sizeToDelete),
                ),
              })),
            }),
          );
          return updatedData;
        });
        setIsModified(true);
        Toast.fire(
          "Deleted!",
          "The size has been removed from the UI. Remember to save changes.",
          "success",
        );
      }
    });
  };

  // Close edit mode when clicking outside - Add this useEffect
  // Close edit mode when clicking outside - Updated
  useEffect(() => {
    const handleClickOutsideEdit = (event) => {
      // Handle size name editing
      if (editingSizeIndex !== -1 && editingTable) {
        const editingElements = document.querySelectorAll('input[type="text"]');
        let clickedOutside = true;

        editingElements.forEach((element) => {
          if (element.contains(event.target) || element === event.target) {
            clickedOutside = false;
          }
        });

        if (
          event.target.closest('button[title="Save"]') ||
          event.target.closest('button[title="Cancel"]')
        ) {
          clickedOutside = false;
        }

        if (clickedOutside) {
          if (
            editingSizeName.trim() &&
            editingSizeName !== modifiedData.SizeList[editingSizeIndex]
          ) {
            handleSizeNameEdit(editingSizeIndex, editingSizeName);
          } else {
            cancelEditingSizeName();
          }
        }
      }

      // Handle tolerance editing
      if (editingToleranceIndex !== -1 && editingToleranceType) {
        const editingElements = document.querySelectorAll('input[type="text"]');
        let clickedOutside = true;

        editingElements.forEach((element) => {
          if (element.contains(event.target) || element === event.target) {
            clickedOutside = false;
          }
        });

        if (
          event.target.closest('button[title="Save"]') ||
          event.target.closest('button[title="Cancel"]')
        ) {
          clickedOutside = false;
        }

        if (clickedOutside) {
          if (editingToleranceValue.trim()) {
            handleToleranceEdit(
              editingToleranceIndex,
              editingToleranceType,
              editingToleranceValue,
            );
          } else {
            cancelEditingTolerance();
          }
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutsideEdit);
    return () => {
      document.removeEventListener("mousedown", handleClickOutsideEdit);
    };
  }, [
    editingSizeIndex,
    editingSizeName,
    editingTable,
    editingToleranceIndex,
    editingToleranceType,
    editingToleranceValue,
    modifiedData,
  ]);

  useEffect(() => {
    if (
      editingSizeIndex !== -1 &&
      editingTable === "specs" &&
      editInputRef.current
    ) {
      // Small delay to ensure the input is rendered
      const timer = setTimeout(() => {
        if (editInputRef.current) {
          editInputRef.current.focus({ preventScroll: true });
          editInputRef.current.select();
        }
      }, 10);

      return () => clearTimeout(timer);
    }
  }, [editingSizeIndex, editingTable]);

  // Render specifications table
  const renderSpecsTable = () => {
    if (!modifiedData?.SizeSpec) return null;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">
              Size Specifications
            </h3>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-2">
                  💡 How to manage sizes and tolerances:
                </p>
                <ul className="space-y-1 ml-4">
                  <li>
                    • <span className="font-medium">Click on size name</span> to
                    edit it
                  </li>
                  <li>
                    •{" "}
                    <span className="font-medium">
                      Click on tolerance values
                    </span>{" "}
                    to edit them
                  </li>
                  <li>• Drag and drop the size column headers to reorder</li>
                  <li>• Use the ↑↓ arrow buttons in each size header</li>
                  <li>
                    •{" "}
                    <span className="bg-yellow-200 px-2 py-1 rounded-md font-medium">
                      Yellow highlight
                    </span>{" "}
                    shows modified fields
                  </li>
                  <li>
                    •{" "}
                    <span className="bg-green-200 px-2 py-1 rounded-md font-medium">
                      Green highlight
                    </span>{" "}
                    shows new sizes
                  </li>
                  <li>
                    • Tolerance values support fractions (1/2), decimals (0.5),
                    and mixed numbers (1 1/2)
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="w-full border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <th className="border-r border-gray-200 px-4 py-3 text-center font-bold text-gray-700 sticky top-0 bg-gray-50 z-10">
                    <div className="flex flex-col items-center gap-1">
                      <span>Seq</span>
                      <div className="w-8 h-0.5 bg-gray-300 rounded"></div>
                    </div>
                  </th>
                  <th className="border-r border-gray-200 px-4 py-3 text-center font-bold text-gray-700 sticky top-0 bg-gray-50 z-10 min-w-[200px]">
                    <div className="flex flex-col items-center gap-1">
                      <span>Measurement Point</span>
                      <div className="w-16 h-0.5 bg-gray-300 rounded"></div>
                    </div>
                  </th>
                  {/* <th className="border-r border-gray-200 px-4 py-3 text-center font-bold text-gray-700 sticky top-0 bg-gray-50 z-10">
                    <div className="flex flex-col items-center gap-1">
                      <span>Unit</span>
                      <div className="w-8 h-0.5 bg-gray-300 rounded"></div>
                    </div>
                  </th> */}
                  <th className="border-r border-gray-200 px-4 py-3 text-center font-bold text-gray-700 sticky top-0 bg-gray-50 z-10">
                    <div className="flex flex-col items-center gap-1">
                      <span>Tol -</span>
                      <div className="w-8 h-0.5 bg-gray-300 rounded"></div>
                    </div>
                  </th>
                  <th className="border-r border-gray-200 px-4 py-3 text-center font-bold text-gray-700 sticky top-0 bg-gray-50 z-10">
                    <div className="flex flex-col items-center gap-1">
                      <span>Tol +</span>
                      <div className="w-8 h-0.5 bg-gray-300 rounded"></div>
                    </div>
                  </th>
                  {modifiedData.SizeList.map((size, sizeIndex) => {
                    const isNewSize = newlyAddedSizes.has(size);

                    return (
                      <th
                        key={size}
                        className={`border-r border-gray-200 px-3 py-3 text-center font-bold sticky top-0 z-10 transition-all duration-200 ${
                          dragOverIndex === sizeIndex
                            ? "bg-blue-200 shadow-lg transform scale-105"
                            : isNewSize
                              ? "bg-gradient-to-br from-green-100 to-emerald-100 hover:from-green-200 hover:to-emerald-200"
                              : "bg-gray-50 hover:bg-gray-100"
                        } ${editingSizeIndex === -1 ? "cursor-move" : "cursor-default"}`}
                        draggable={editingSizeIndex === -1} // Only draggable when not editing
                        onDragStart={(e) => handleDragStart(e, sizeIndex)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, sizeIndex)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, sizeIndex)}
                      >
                        <div className="flex flex-col items-center gap-2">
                          {/* New size indicator */}
                          {isNewSize && (
                            <div className="flex items-center gap-1 mb-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-xs font-bold text-green-700 bg-green-200 px-2 py-0.5 rounded-full">
                                NEW
                              </span>
                            </div>
                          )}

                          {/* Size controls - Only show when not editing */}
                          {editingSizeIndex !== sizeIndex && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveSizeUp(sizeIndex);
                                }}
                                disabled={sizeIndex === 0}
                                className="w-6 h-6 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md flex items-center justify-center transition-colors"
                                title="Move size left"
                              >
                                <svg
                                  className="w-3 h-3 text-gray-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  moveSizeDown(sizeIndex);
                                }}
                                disabled={
                                  sizeIndex === modifiedData.SizeList.length - 1
                                }
                                className="w-6 h-6 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed rounded-md flex items-center justify-center transition-colors"
                                title="Move size right"
                              >
                                <svg
                                  className="w-3 h-3 text-gray-600"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 5l7 7-7 7"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}

                          {/* Size info - Updated with edit functionality */}
                          <div className="text-center">
                            {editingSizeIndex === sizeIndex &&
                            editingTable === "specs" ? (
                              <div className="flex flex-col items-center gap-1">
                                <input
                                  ref={editInputRef} // Use the ref here
                                  type="text"
                                  value={editingSizeName}
                                  onChange={(e) =>
                                    setEditingSizeName(e.target.value)
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleSizeNameEdit(
                                        sizeIndex,
                                        editingSizeName,
                                      );
                                    } else if (e.key === "Escape") {
                                      e.preventDefault();
                                      cancelEditingSizeName();
                                    }
                                  }}
                                  className="w-16 px-2 py-1 text-xs font-bold text-center border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                  onFocus={(e) => e.target.select()} // Select all text on focus
                                />
                                <div className="flex gap-1">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleSizeNameEdit(
                                        sizeIndex,
                                        editingSizeName,
                                      );
                                    }}
                                    className="w-4 h-4 bg-green-500 hover:bg-green-600 text-white rounded-sm flex items-center justify-center"
                                    title="Save"
                                  >
                                    <svg
                                      className="w-2 h-2"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M5 13l4 4L19 7"
                                      />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      cancelEditingSizeName();
                                    }}
                                    className="w-4 h-4 bg-red-500 hover:bg-red-600 text-white rounded-sm flex items-center justify-center"
                                    title="Cancel"
                                  >
                                    <svg
                                      className="w-2 h-2"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={3}
                                        d="M6 18L18 6M6 6l12 12"
                                      />
                                    </svg>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-center">
                                <div
                                  className={`font-bold cursor-pointer hover:bg-gray-100 px-2 py-1 rounded transition-colors ${
                                    isNewSize
                                      ? "text-green-800"
                                      : "text-gray-800"
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    startEditingSizeName(
                                      sizeIndex,
                                      size,
                                      "specs",
                                    );
                                  }}
                                  title="Click to edit size name"
                                >
                                  {size}
                                </div>
                                <div
                                  className={`text-xs px-2 py-0.5 rounded-full mt-1 ${
                                    isNewSize
                                      ? "text-green-700 bg-green-200"
                                      : "text-gray-500 bg-gray-200"
                                  }`}
                                >
                                  #{sizeIndex + 1}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Action buttons - Only show when not editing */}
                          {!(
                            editingSizeIndex === sizeIndex &&
                            editingTable === "specs"
                          ) && (
                            <div className="flex gap-1">
                              {/* Edit button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  startEditingSizeName(
                                    sizeIndex,
                                    size,
                                    "specs",
                                  );
                                }}
                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                                  isNewSize
                                    ? "bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700"
                                    : "bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700"
                                }`}
                                title={`Edit size name: ${size}`}
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
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                              </button>

                              {/* Delete button */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  handleDeleteSize(size);
                                }}
                                className={`w-6 h-6 rounded-md flex items-center justify-center transition-colors ${
                                  isNewSize
                                    ? "bg-green-50 hover:bg-green-100 text-green-600 hover:text-green-700"
                                    : "bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700"
                                }`}
                                title={`Delete size ${size}`}
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
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </div>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {modifiedData.SizeSpec.map((spec, specIndex) => (
                  <tr
                    key={spec.Seq}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="border-r border-gray-200 px-4 py-3 text-center font-medium text-gray-700 bg-gray-50">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-sm font-bold text-blue-700">
                          {spec.Seq}
                        </span>
                      </div>
                    </td>
                    <td className="border-r border-gray-200 px-4 py-3">
                      <div className="text-left space-y-1">
                        <div className="font-medium text-gray-800">
                          {spec.EnglishRemark}
                        </div>
                        <div className="text-sm text-gray-500">
                          {spec.ChineseRemark}
                        </div>
                      </div>
                    </td>
                    {/* <td className="border-r border-gray-200 px-4 py-3 text-center">
                      <span className="inline-block bg-gray-100 px-2 py-1 rounded-md text-sm font-medium text-gray-700">
                        {spec.SizeSpecMeasUnit}
                      </span>
                    </td> */}
                    <td className="border-r border-gray-200 px-4 py-3 text-center text-sm">
                      {editingToleranceIndex === specIndex &&
                      editingToleranceType === "minus" ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            ref={toleranceInputRef}
                            type="text"
                            value={editingToleranceValue}
                            onChange={(e) =>
                              setEditingToleranceValue(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleToleranceEdit(
                                  specIndex,
                                  "minus",
                                  editingToleranceValue,
                                );
                              } else if (e.key === "Escape") {
                                e.preventDefault();
                                cancelEditingTolerance();
                              }
                            }}
                            className="w-20 px-2 py-1 text-xs text-center border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            onFocus={(e) => e.target.select()}
                            placeholder="e.g., 1/8, 0.125"
                          />
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToleranceEdit(
                                  specIndex,
                                  "minus",
                                  editingToleranceValue,
                                );
                              }}
                              className="w-3 h-3 bg-green-500 hover:bg-green-600 text-white rounded-sm flex items-center justify-center"
                              title="Save"
                            >
                              <svg
                                className="w-2 h-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelEditingTolerance();
                              }}
                              className="w-3 h-3 bg-red-500 hover:bg-red-600 text-white rounded-sm flex items-center justify-center"
                              title="Cancel"
                            >
                              <svg
                                className="w-2 h-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="text"
                            value={spec.ToleranceMinus?.fraction || ""}
                            onChange={(e) =>
                              handleToleranceChange(
                                specIndex,
                                "minus",
                                e.target.value,
                              )
                            }
                            className={`w-20 px-3 py-2 border rounded-lg text-center text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              isFieldModified(
                                createFieldKey("tolerance", specIndex, "minus"),
                              )
                                ? "bg-yellow-50 border-yellow-400 text-yellow-800 shadow-sm"
                                : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                            }`}
                            placeholder="0"
                            title={`Decimal: ${spec.ToleranceMinus?.decimal || 0}`}
                          />
                          {isFieldModified(
                            createFieldKey("tolerance", specIndex, "minus"),
                          ) && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="border-r border-gray-200 px-4 py-3 text-center text-sm">
                      {editingToleranceIndex === specIndex &&
                      editingToleranceType === "plus" ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            ref={toleranceInputRef}
                            type="text"
                            value={editingToleranceValue}
                            onChange={(e) =>
                              setEditingToleranceValue(e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleToleranceEdit(
                                  specIndex,
                                  "plus",
                                  editingToleranceValue,
                                );
                              } else if (e.key === "Escape") {
                                e.preventDefault();
                                cancelEditingTolerance();
                              }
                            }}
                            className="w-20 px-2 py-1 text-xs text-center border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            onFocus={(e) => e.target.select()}
                            placeholder="e.g., 1/8, 0.125"
                          />
                          <div className="flex flex-col gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToleranceEdit(
                                  specIndex,
                                  "plus",
                                  editingToleranceValue,
                                );
                              }}
                              className="w-3 h-3 bg-green-500 hover:bg-green-600 text-white rounded-sm flex items-center justify-center"
                              title="Save"
                            >
                              <svg
                                className="w-2 h-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelEditingTolerance();
                              }}
                              className="w-3 h-3 bg-red-500 hover:bg-red-600 text-white rounded-sm flex items-center justify-center"
                              title="Cancel"
                            >
                              <svg
                                className="w-2 h-2"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M6 18L18 6M6 6l12 12"
                                />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="relative">
                          <input
                            type="text"
                            value={spec.TolerancePlus?.fraction || ""}
                            onChange={(e) =>
                              handleToleranceChange(
                                specIndex,
                                "plus",
                                e.target.value,
                              )
                            }
                            className={`w-20 px-3 py-2 border rounded-lg text-center text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                              isFieldModified(
                                createFieldKey("tolerance", specIndex, "plus"),
                              )
                                ? "bg-yellow-50 border-yellow-400 text-yellow-800 shadow-sm"
                                : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                            }`}
                            placeholder="0"
                            title={`Decimal: ${spec.TolerancePlus?.decimal || 0}`}
                          />
                          {isFieldModified(
                            createFieldKey("tolerance", specIndex, "plus"),
                          ) && (
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white"></div>
                          )}
                        </div>
                      )}
                    </td>
                    {modifiedData.SizeList.map((size) => {
                      const sizeSpec = spec.Specs.find((s) => s[size]);
                      const value = sizeSpec?.[size];
                      const fieldKey = createFieldKey(
                        "spec",
                        specIndex,
                        size,
                        "fraction",
                      );
                      const isModified = isFieldModified(fieldKey);
                      const isNewSize = newlyAddedSizes.has(size);

                      return (
                        <td
                          key={size}
                          className={`border-r border-gray-200 px-3 py-3 text-center ${
                            isNewSize ? "bg-green-25" : ""
                          }`}
                        >
                          <div className="relative">
                            <input
                              type="text"
                              value={value?.fraction || ""}
                              onChange={(e) =>
                                handleSpecChange(
                                  specIndex,
                                  size,
                                  "fraction",
                                  e.target.value,
                                )
                              }
                              className={`w-20 px-3 py-2 border rounded-lg text-center text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                isModified
                                  ? "bg-yellow-50 border-yellow-400 text-yellow-800 shadow-sm"
                                  : isNewSize
                                    ? "bg-green-50 border-green-300 text-green-800 hover:border-green-400"
                                    : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                              }`}
                            />
                            {isModified && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white"></div>
                            )}
                            {isNewSize && !isModified && (
                              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Render quantities table
  const renderQuantitiesTable = () => {
    if (!modifiedData?.OrderColors) return null;

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800">
              Order Quantities & Cut Quantities
            </h3>
          </div>
        </div>

        <div className="p-6">
          <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-teal-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg
                  className="w-4 h-4 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div className="text-sm text-green-800">
                <p className="font-semibold mb-1">
                  ✅ Size order automatically matches specification table
                </p>
                <p>
                  •{" "}
                  <span className="bg-yellow-200 px-2 py-1 rounded-md font-medium">
                    Yellow highlight
                  </span>{" "}
                  shows modified fields
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            {modifiedData.OrderColors.map((color, colorIndex) => (
              <div
                key={color.ColorCode}
                className="bg-gray-50 rounded-xl p-6 border border-gray-200"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center">
                    <svg
                      className="w-6 h-6 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z"
                      />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-800">
                      {color.ColorCode}
                    </h4>
                    <p className="text-gray-600">{color.Color}</p>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                  <table className="w-full border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-gradient-to-r from-gray-50 to-gray-100">
                        <th className="border-r border-gray-200 px-4 py-3 text-center font-bold text-gray-700 sticky top-0 bg-gray-50 z-10">
                          <div className="flex flex-col items-center gap-1">
                            <span>Type</span>
                            <div className="w-8 h-0.5 bg-gray-300 rounded"></div>
                          </div>
                        </th>
                        {modifiedData.SizeList.map((size, index) => {
                          const isNewSize = newlyAddedSizes.has(size);

                          return (
                            <th
                              key={size}
                              className={`border-r border-gray-200 px-4 py-3 text-center font-bold sticky top-0 z-10 ${
                                isNewSize
                                  ? "bg-gradient-to-br from-green-100 to-emerald-100"
                                  : "bg-gray-50"
                              }`}
                            >
                              <div className="flex flex-col items-center gap-1">
                                {isNewSize && (
                                  <div className="flex items-center gap-1 mb-1">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                    <span className="text-xs font-bold text-green-700">
                                      NEW
                                    </span>
                                  </div>
                                )}

                                {/* NON-EDITABLE size name display */}
                                <span
                                  className={`font-bold px-2 py-1 rounded ${
                                    isNewSize
                                      ? "text-green-800"
                                      : "text-gray-700"
                                  }`}
                                  title="Edit size names in the Size Specifications table above"
                                >
                                  {size}
                                </span>

                                <div
                                  className={`text-xs px-2 py-0.5 rounded-full ${
                                    isNewSize
                                      ? "text-green-700 bg-green-200"
                                      : "text-gray-500 bg-gray-200"
                                  }`}
                                >
                                  #{index + 1}
                                </div>
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {/* Order Qty Row */}
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="border-r border-gray-200 px-4 py-3 bg-blue-50">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                            <span className="font-semibold text-gray-800">
                              Order Qty
                            </span>
                          </div>
                        </td>
                        {modifiedData.SizeList.map((size) => {
                          const orderQtyItem = color.OrderQty?.find(
                            (q) => q[size] !== undefined,
                          );
                          const fieldKey = createFieldKey(
                            "qty",
                            colorIndex,
                            size,
                            "order",
                          );
                          const isModified = isFieldModified(fieldKey);
                          const isNewSize = newlyAddedSizes.has(size);

                          return (
                            <td
                              key={size}
                              className={`border-r border-gray-200 px-3 py-3 text-center ${
                                isNewSize ? "bg-green-25" : ""
                              }`}
                            >
                              <div className="relative">
                                <input
                                  type="number"
                                  value={orderQtyItem?.[size] || 0}
                                  onChange={(e) =>
                                    handleQtyChange(
                                      colorIndex,
                                      size,
                                      "order",
                                      e.target.value,
                                    )
                                  }
                                  className={`w-20 px-3 py-2 border rounded-lg text-center text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    isModified
                                      ? "bg-yellow-50 border-yellow-400 text-yellow-800 shadow-sm"
                                      : isNewSize
                                        ? "bg-green-50 border-green-300 text-green-800 hover:border-green-400"
                                        : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                                  }`}
                                />
                                {isModified && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white"></div>
                                )}
                                {isNewSize && !isModified && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Plan Cut Qty Row */}
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="border-r border-gray-200 px-4 py-3 bg-green-50">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                            <span className="font-semibold text-gray-800">
                              Plan Cut Qty
                            </span>
                          </div>
                        </td>
                        {modifiedData.SizeList.map((size) => {
                          const fieldKey = createFieldKey(
                            "qty",
                            colorIndex,
                            size,
                            "planCut",
                          );
                          const isModified = isFieldModified(fieldKey);

                          return (
                            <td
                              key={size}
                              className="border-r border-gray-200 px-3 py-3 text-center"
                            >
                              <div className="relative">
                                <input
                                  type="number"
                                  value={color.CutQty?.[size]?.PlanCutQty || 0}
                                  onChange={(e) =>
                                    handleQtyChange(
                                      colorIndex,
                                      size,
                                      "planCut",
                                      e.target.value,
                                    )
                                  }
                                  className={`w-20 px-3 py-2 border rounded-lg text-center text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    isModified
                                      ? "bg-yellow-50 border-yellow-400 text-yellow-800 shadow-sm"
                                      : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                                  }`}
                                />
                                {isModified && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white"></div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>

                      {/* Actual Cut Qty Row */}
                      <tr className="hover:bg-gray-50 transition-colors">
                        <td className="border-r border-gray-200 px-4 py-3 bg-orange-50">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                            <span className="font-semibold text-gray-800">
                              Actual Cut Qty
                            </span>
                          </div>
                        </td>
                        {modifiedData.SizeList.map((size) => {
                          const fieldKey = createFieldKey(
                            "qty",
                            colorIndex,
                            size,
                            "actualCut",
                          );
                          const isModified = isFieldModified(fieldKey);

                          return (
                            <td
                              key={size}
                              className="border-r border-gray-200 px-3 py-3 text-center"
                            >
                              <div className="relative">
                                <input
                                  type="number"
                                  value={
                                    color.CutQty?.[size]?.ActualCutQty || 0
                                  }
                                  onChange={(e) =>
                                    handleQtyChange(
                                      colorIndex,
                                      size,
                                      "actualCut",
                                      e.target.value,
                                    )
                                  }
                                  className={`w-20 px-3 py-2 border rounded-lg text-center text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                                    isModified
                                      ? "bg-yellow-50 border-yellow-400 text-yellow-800 shadow-sm"
                                      : "bg-white border-gray-300 text-gray-700 hover:border-gray-400"
                                  }`}
                                />
                                {isModified && (
                                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white"></div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Add size component
  const AddSizeComponent = () => {
    const [newSize, setNewSize] = useState("");

    const handleAddNewSize = () => {
      if (newSize.trim()) {
        handleAddSize(newSize.trim());
        setNewSize("");
      }
    };

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <h4 className="text-lg font-bold text-gray-800">Add New Size</h4>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={newSize}
                onChange={(e) => setNewSize(e.target.value)}
                placeholder="Enter new size (e.g., XXXL, 2XL, etc.)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 hover:border-gray-400"
                onKeyPress={(e) => e.key === "Enter" && handleAddNewSize()}
              />
            </div>
            <button
              onClick={handleAddNewSize}
              disabled={!newSize.trim()}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-sm"
            >
              <div className="flex items-center gap-2">
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Add Size
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-8xl mx-auto p-6">
        {/* Header Section */}
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              DT Specifications Manager
            </h1>
            <p className="text-gray-600 text-sm">
              Modify and manage your design specifications with ease
            </p>
          </div>

          {/* Search Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-800">
                  Search Order
                </h2>
              </div>
            </div>

            <div className="p-6 overflow-visible">
              {" "}
              {/* Add overflow-visible */}
              <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center">
                <div className="flex-1 relative overflow-visible">
                  {" "}
                  {/* Add overflow-visible */}
                  <div className="relative">
                    <input
                      ref={inputRef}
                      type="text"
                      value={orderNo}
                      onChange={handleOrderNoChange}
                      onKeyDown={handleKeyDown}
                      placeholder="Enter Order Number (e.g., PTAF, GPRT, etc.)"
                      className="w-full pl-12 pr-12 py-4 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:border-gray-400 shadow-sm"
                      autoComplete="off"
                    />

                    <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>

                    {/* Loading indicator */}
                    {loadingSuggestions && (
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent"></div>
                      </div>
                    )}
                  </div>
                  {/* Improved Suggestions dropdown */}
                  {showSuggestions && suggestions.length > 0 && (
                    <div
                      ref={suggestionsRef}
                      className="absolute z-[9999] w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl max-h-80 overflow-y-auto"
                      style={{
                        top: "100%",
                        left: 0,
                        right: 0,
                        boxShadow:
                          "0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)",
                      }}
                    >
                      {suggestions.map((suggestion, index) => (
                        <div
                          key={suggestion._id}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`px-6 py-4 cursor-pointer transition-all duration-150 ${
                            index === selectedSuggestionIndex
                              ? "bg-blue-50 border-l-4 border-blue-500"
                              : "hover:bg-gray-50"
                          } ${index === suggestions.length - 1 ? "" : "border-b border-gray-100"}`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-gray-900 text-base mb-1 truncate">
                                {suggestion.Order_No}
                              </div>
                              <div className="text-sm text-gray-600 mb-1">
                                <span className="font-medium">
                                  {suggestion.Style}
                                </span>{" "}
                                - {suggestion.ShortName}
                              </div>
                              {suggestion.CustStyle && (
                                <div className="text-xs text-gray-500 truncate">
                                  Customer Style:{" "}
                                  <span className="font-medium">
                                    {suggestion.CustStyle}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2 flex-shrink-0">
                              <div className="text-sm font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-full whitespace-nowrap">
                                Qty: {suggestion.TotalQty}
                              </div>
                              {suggestion.isModify && (
                                <span className="inline-block bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-2 py-1 rounded-full text-xs font-bold shadow-sm">
                                  Modified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* No suggestions found */}
                  {showSuggestions &&
                    suggestions.length === 0 &&
                    !loadingSuggestions &&
                    debouncedOrderNo.length >= 2 && (
                      <div className="absolute z-[9999] w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl">
                        <div className="px-6 py-4 text-gray-500 text-center">
                          <svg
                            className="w-12 h-12 text-gray-300 mx-auto mb-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.5a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <p className="font-medium">No orders found</p>
                          <p className="text-sm">
                            Try searching with a different order number
                          </p>
                        </div>
                      </div>
                    )}
                </div>

                <button
                  onClick={() => handleSearch()}
                  disabled={loading}
                  className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-semibold shadow-lg"
                >
                  <div className="flex items-center gap-2">
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Searching...
                      </>
                    ) : (
                      <>
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
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                        Search
                      </>
                    )}
                  </div>
                </button>
              </div>
              {/* Error Message */}
              {error && (
                <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-4 h-4 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <p className="text-red-700 font-medium">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Information */}
        {orderData && (
          <div className="space-y-8">
            {/* Order Info Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-purple-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.5a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800">
                    Order Information
                  </h3>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="text-sm text-blue-600 font-medium mb-1">
                      Order No
                    </div>
                    <div className="text-lg font-bold text-blue-800">
                      {orderData.Order_No}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                    <div className="text-sm text-green-600 font-medium mb-1">
                      Style
                    </div>
                    <div className="text-lg font-bold text-green-800">
                      {orderData.Style}
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="text-sm text-purple-600 font-medium mb-1">
                      Customer
                    </div>
                    <div className="text-lg font-bold text-purple-800">
                      {orderData.ShortName}
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                    <div className="text-sm text-orange-600 font-medium mb-1">
                      Total Qty
                    </div>
                    <div className="text-lg font-bold text-orange-800">
                      {orderData.TotalQty}
                    </div>
                  </div>
                </div>

                {orderData.isModify && (
                  <div className="mt-4 inline-flex items-center gap-2 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-2 rounded-full text-sm font-bold shadow-sm">
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
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                    Previously Modified
                  </div>
                )}
              </div>
            </div>

            {/* Add Size Section */}
            <AddSizeComponent />

            {/* Specifications Table */}
            {renderSpecsTable()}

            {/* Quantities Table */}
            {renderQuantitiesTable()}

            {/* Save Section */}
            {isModified && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-red-50 to-pink-50 px-6 py-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <svg
                        className="w-5 h-5 text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">
                      Save Changes
                    </h3>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 font-bold shadow-lg"
                    >
                      <div className="flex items-center gap-2">
                        {loading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                            Saving Changes...
                          </>
                        ) : (
                          <>
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
                                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12"
                              />
                            </svg>
                            Save All Changes
                          </>
                        )}
                      </div>
                    </button>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-lg border border-yellow-300">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                        <span className="text-yellow-800 font-semibold text-sm">
                          {modifiedFields.size} field
                          {modifiedFields.size !== 1 ? "s" : ""} modified
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 bg-gray-100 px-3 py-2 rounded-lg">
                        <span className="font-medium">💡 Tip:</span> Changes are
                        highlighted in yellow
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!orderData && !loading && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              Search for an Order
            </h3>
            <p className="text-gray-500">
              Enter an order number above to start modifying specifications
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModifyDTspec;
