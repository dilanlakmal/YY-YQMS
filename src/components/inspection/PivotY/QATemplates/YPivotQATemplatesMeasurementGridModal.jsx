// //Old Logic

// import React, { useState, useEffect, useMemo } from "react";
// import { createPortal } from "react-dom";
// import {
//   X,
//   Plus,
//   Minus,
//   Save,
//   Search,
//   Check,
//   AlertTriangle,
//   Edit3,
//   Star
// } from "lucide-react";
// import MeasurementNumPad from "../../cutting/MeasurementNumPad";
// import {
//   checkTolerance,
//   formatToleranceDisplay
// } from "./YPivotQATemplatesHelpers";

// const YPivotQATemplatesMeasurementGridModal = ({
//   isOpen,
//   onClose,
//   specsData,
//   selectedSpecsList, // ⭐ NEW: Pass selected specs list to identify critical points
//   selectedSize,
//   selectedKValue,
//   initialQty = 3,
//   displayMode = "selected",
//   onSave,
//   measType,
//   editingData = null,
//   isEditing = false
// }) => {
//   const [qty, setQty] = useState(initialQty);
//   const [measurements, setMeasurements] = useState({});
//   const [activePcsIndices, setActivePcsIndices] = useState(new Set([0]));
//   const [activeCell, setActiveCell] = useState(null);
//   const [searchTerm, setSearchTerm] = useState("");

//   useEffect(() => {
//     if (isOpen && specsData.length > 0) {
//       if (isEditing && editingData) {
//         console.log(
//           "Loading existing measurement data for editing:",
//           editingData
//         );

//         setQty(editingData.qty || initialQty);

//         if (editingData.selectedPcs) {
//           if (editingData.selectedPcs === "ALL") {
//             const allIndices = new Set(
//               Array.from({ length: editingData.qty || initialQty }, (_, i) => i)
//             );
//             setActivePcsIndices(allIndices);
//           } else if (Array.isArray(editingData.selectedPcs)) {
//             setActivePcsIndices(new Set(editingData.selectedPcs));
//           } else {
//             setActivePcsIndices(new Set([0]));
//           }
//         } else {
//           setActivePcsIndices(new Set([0]));
//         }

//         if (
//           editingData.measurements &&
//           Object.keys(editingData.measurements).length > 0
//         ) {
//           const loadedMeasurements = JSON.parse(
//             JSON.stringify(editingData.measurements)
//           );
//           console.log("Loaded measurements:", loadedMeasurements);
//           setMeasurements(loadedMeasurements);
//         } else {
//           const initialMeasurements = {};
//           specsData.forEach((spec) => {
//             initialMeasurements[spec.id] = {};
//             for (let i = 0; i < (editingData.qty || initialQty); i++) {
//               initialMeasurements[spec.id][i] = { decimal: 0, fraction: "0" };
//             }
//           });
//           setMeasurements(initialMeasurements);
//         }
//       } else {
//         console.log("Initializing fresh measurement data");
//         setQty(initialQty);
//         const initialMeasurements = {};
//         specsData.forEach((spec) => {
//           initialMeasurements[spec.id] = {};
//           for (let i = 0; i < initialQty; i++) {
//             initialMeasurements[spec.id][i] = { decimal: 0, fraction: "0" };
//           }
//         });
//         setMeasurements(initialMeasurements);
//         setActivePcsIndices(new Set([0]));
//       }

//       setSearchTerm("");
//     }
//   }, [isOpen, specsData, isEditing, editingData, initialQty]);

//   const filteredSpecs = useMemo(() => {
//     let specs = specsData;

//     if (selectedKValue && measType === "Before") {
//       specs = specs.filter(
//         (s) => s.kValue === selectedKValue || s.kValue === "NA"
//       );
//     }

//     if (searchTerm) {
//       specs = specs.filter(
//         (s) =>
//           s.MeasurementPointEngName?.toLowerCase().includes(
//             searchTerm.toLowerCase()
//           ) ||
//           s.MeasurementPointChiName?.toLowerCase().includes(
//             searchTerm.toLowerCase()
//           )
//       );
//     }

//     return specs;
//   }, [specsData, selectedKValue, measType, searchTerm]);

//   // ⭐ NEW: Helper to check if a spec is critical (in selectedSpecsList)
//   const isCriticalSpec = (spec) => {
//     if (!selectedSpecsList || selectedSpecsList.length === 0) return false;
//     return selectedSpecsList.some((s) => s.id === spec.id);
//   };

//   if (!isOpen) return null;

//   const togglePcsActive = (index) => {
//     const newSet = new Set(activePcsIndices);
//     if (newSet.has(index)) {
//       if (newSet.size > 1) {
//         newSet.delete(index);
//       }
//     } else {
//       newSet.add(index);
//     }
//     setActivePcsIndices(newSet);
//   };

//   const handleNumPadInput = (decimal, fraction) => {
//     if (activeCell) {
//       setMeasurements((prev) => ({
//         ...prev,
//         [activeCell.specId]: {
//           ...(prev[activeCell.specId] || {}),
//           [activeCell.sampleIndex]: { decimal, fraction }
//         }
//       }));
//       setActiveCell(null);
//     }
//   };

//   const handleCellClick = (specId, sampleIndex) => {
//     if (activePcsIndices.has(sampleIndex)) {
//       setActiveCell({ specId, sampleIndex });
//     }
//   };

//   const handleSave = () => {
//     const result = {
//       size: selectedSize,
//       kValue: selectedKValue,
//       qty: qty,
//       measurements: measurements,
//       selectedPcs: Array.from(activePcsIndices),
//       measType: measType,
//       timestamp: new Date().toISOString(),
//       displayMode: displayMode
//     };

//     console.log("Saving measurement data:", result);
//     onSave(result);
//     onClose();
//   };

//   const handleQtyChange = (newQty) => {
//     setQty(newQty);

//     setMeasurements((prev) => {
//       const updated = { ...prev };
//       specsData.forEach((spec) => {
//         if (!updated[spec.id]) {
//           updated[spec.id] = {};
//         }
//         for (let i = 0; i < newQty; i++) {
//           if (!updated[spec.id][i]) {
//             updated[spec.id][i] = { decimal: 0, fraction: "0" };
//           }
//         }
//       });
//       return updated;
//     });
//   };

//   const getCompletionStats = () => {
//     let total = 0;
//     let filled = 0;

//     filteredSpecs.forEach((spec) => {
//       activePcsIndices.forEach((pcsIndex) => {
//         total++;
//         const val = measurements[spec.id]?.[pcsIndex];
//         if (val && val.decimal !== 0) {
//           filled++;
//         }
//       });
//     });

//     return {
//       total,
//       filled,
//       percentage: total > 0 ? Math.round((filled / total) * 100) : 0
//     };
//   };

//   const completionStats = getCompletionStats();

//   const renderRows = () => {
//     return filteredSpecs.map((spec, index) => {
//       const specValueObj = spec.Specs?.find((s) => s.size === selectedSize);
//       const specValueDisplay =
//         specValueObj?.fraction || specValueObj?.decimal?.toString() || "-";

//       const tolMinusDisplay = formatToleranceDisplay(spec.TolMinus, true);
//       const tolPlusDisplay = formatToleranceDisplay(spec.TolPlus, false);

//       const specId = spec.id || index;

//       // ⭐ Check if this spec is critical
//       const isCritical = displayMode === "all" && isCriticalSpec(spec);

//       return (
//         <tr
//           key={specId}
//           className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
//         >
//           {/* ⭐ MODIFIED: Measurement Point Name with conditional styling */}
//           <td
//             className={`p-2 sm:p-3 border-r border-gray-200 dark:border-gray-700 sticky left-0 z-[5] ${
//               isCritical
//                 ? "bg-blue-50 dark:bg-blue-900/30"
//                 : "bg-white dark:bg-gray-900"
//             }`}
//           >
//             <div className="max-w-[120px] sm:max-w-[200px]">
//               <div className="flex items-center gap-2">
//                 {isCritical && (
//                   <Star className="w-3 h-3 text-blue-500 fill-current flex-shrink-0" />
//                 )}
//                 <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 line-clamp-2">
//                   {spec.MeasurementPointEngName}
//                 </span>
//               </div>
//               {spec.MeasurementPointChiName && (
//                 <span className="text-[10px] text-gray-400 block truncate">
//                   {spec.MeasurementPointChiName}
//                 </span>
//               )}
//               {isCritical && (
//                 <span className="inline-block mt-1 text-[9px] bg-blue-500 text-white px-1.5 py-0.5 rounded font-bold">
//                   CRITICAL
//                 </span>
//               )}
//             </div>
//           </td>

//           <td className="p-1 sm:p-2 text-center text-xs font-mono border-r dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
//             <span className="text-red-600 dark:text-red-400">
//               -{tolMinusDisplay}
//             </span>
//           </td>

//           <td className="p-1 sm:p-2 text-center text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 border-r dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
//             {specValueDisplay}
//           </td>

//           <td className="p-1 sm:p-2 text-center text-xs font-mono border-r dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
//             <span className="text-green-600 dark:text-green-400">
//               +{tolPlusDisplay}
//             </span>
//           </td>

//           {Array.from({ length: qty }).map((_, pcsIndex) => {
//             const currentVal = measurements[specId]?.[pcsIndex] || {
//               decimal: 0,
//               fraction: "0"
//             };
//             const displayVal = currentVal.fraction || "0";
//             const numVal = currentVal.decimal || 0;

//             const isActive = activePcsIndices.has(pcsIndex);
//             const toleranceResult = checkTolerance(spec, numVal, selectedSize);

//             let cellBgClass = "bg-gray-100 dark:bg-gray-800";
//             let textClass = "text-gray-400";

//             if (isActive) {
//               if (toleranceResult.isDefault) {
//                 cellBgClass = "bg-gray-50 dark:bg-gray-700";
//                 textClass = "text-gray-600 dark:text-gray-400";
//               } else if (toleranceResult.isWithin) {
//                 cellBgClass = "bg-green-100 dark:bg-green-900/40";
//                 textClass = "text-green-700 dark:text-green-300";
//               } else {
//                 cellBgClass = "bg-red-100 dark:bg-red-900/40";
//                 textClass = "text-red-700 dark:text-red-300";
//               }
//             }

//             return (
//               <td
//                 key={pcsIndex}
//                 className="p-1 border-r border-gray-200 dark:border-gray-700 min-w-[60px] sm:min-w-[80px]"
//               >
//                 <button
//                   disabled={!isActive}
//                   onClick={() => handleCellClick(specId, pcsIndex)}
//                   className={`w-full h-9 sm:h-10 rounded-lg border flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${cellBgClass} ${textClass} ${
//                     isActive
//                       ? "border-gray-300 dark:border-gray-600 cursor-pointer hover:shadow-md active:scale-95"
//                       : "border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50"
//                   }`}
//                 >
//                   {displayVal}
//                 </button>
//               </td>
//             );
//           })}
//         </tr>
//       );
//     });
//   };

//   return createPortal(
//     <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900 flex flex-col h-[100dvh] animate-fadeIn">
//       {/* ⭐ MODIFIED: Header with displayMode label */}
//       <div className="flex-shrink-0 px-4 sm:px-6 py-3 sm:py-4 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center shadow-lg safe-area-top">
//         <div className="flex-1 min-w-0">
//           <h2 className="text-white font-bold text-base sm:text-xl truncate flex items-center gap-2">
//             {isEditing && <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />}
//             {displayMode === "selected" ? "Critical Points" : "All Points"}
//           </h2>
//           <div className="flex flex-wrap gap-2 mt-1">
//             <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
//               Size: {selectedSize}
//             </span>
//             {selectedKValue && (
//               <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full">
//                 K: {selectedKValue}
//               </span>
//             )}
//             <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-semibold">
//               {measType} Wash
//             </span>
//             {isEditing && (
//               <span className="text-xs bg-yellow-500 text-white px-2 py-0.5 rounded-full font-semibold">
//                 EDITING
//               </span>
//             )}
//           </div>
//         </div>
//         <button
//           onClick={onClose}
//           className="p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors ml-2"
//         >
//           <X className="w-5 h-5 sm:w-6 sm:h-6" />
//         </button>
//       </div>

//       <div className="flex-shrink-0 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
//         <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
//           <div className="relative flex-1 max-w-md">
//             <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Search measurement point..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
//             />
//           </div>

//           <div className="flex items-center gap-4">
//             <div className="flex items-center gap-2">
//               <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
//                 Qty:
//               </span>
//               <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm">
//                 <button
//                   onClick={() => handleQtyChange(Math.max(1, qty - 1))}
//                   className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-l-lg transition-colors"
//                 >
//                   <Minus className="w-4 h-4" />
//                 </button>
//                 <div className="w-10 text-center font-bold text-gray-800 dark:text-white text-sm">
//                   {qty}
//                 </div>
//                 <button
//                   onClick={() => handleQtyChange(qty + 1)}
//                   className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-r-lg transition-colors"
//                 >
//                   <Plus className="w-4 h-4" />
//                 </button>
//               </div>
//             </div>

//             <div className="hidden sm:flex items-center gap-2">
//               <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
//                 <div
//                   className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
//                   style={{ width: `${completionStats.percentage}%` }}
//                 />
//               </div>
//               <span className="text-xs text-gray-500 dark:text-gray-400">
//                 {completionStats.filled}/{completionStats.total}
//               </span>
//             </div>
//           </div>
//         </div>
//       </div>

//       <div className="flex-1 overflow-auto">
//         <table className="w-full border-collapse">
//           <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 shadow-sm">
//             <tr>
//               <th className="p-2 sm:p-3 text-left text-[10px] sm:text-xs font-bold text-gray-500 uppercase border-r dark:border-gray-700 sticky left-0 bg-gray-100 dark:bg-gray-800 z-[15] min-w-[120px] sm:min-w-[200px]">
//                 Measurement Point
//               </th>
//               <th className="p-1 sm:p-2 text-center text-[10px] sm:text-xs font-bold text-red-500 uppercase border-r dark:border-gray-700 w-12 sm:w-16 bg-red-50 dark:bg-red-900/20">
//                 Tol-
//               </th>
//               <th className="p-1 sm:p-2 text-center text-[10px] sm:text-xs font-bold text-blue-600 uppercase border-r dark:border-gray-700 w-12 sm:w-16 bg-blue-50 dark:bg-blue-900/20">
//                 Spec
//               </th>
//               <th className="p-1 sm:p-2 text-center text-[10px] sm:text-xs font-bold text-green-500 uppercase border-r dark:border-gray-700 w-12 sm:w-16 bg-green-50 dark:bg-green-900/20">
//                 Tol+
//               </th>

//               {Array.from({ length: qty }).map((_, i) => (
//                 <th
//                   key={i}
//                   className={`p-1 sm:p-2 text-center border-r dark:border-gray-700 min-w-[60px] sm:min-w-[80px] transition-colors ${
//                     activePcsIndices.has(i)
//                       ? "bg-indigo-100 dark:bg-indigo-900/30"
//                       : "bg-gray-100 dark:bg-gray-800"
//                   }`}
//                 >
//                   <button
//                     onClick={() => togglePcsActive(i)}
//                     className="flex flex-col items-center justify-center w-full gap-1"
//                   >
//                     <div
//                       className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
//                         activePcsIndices.has(i)
//                           ? "bg-indigo-500 border-indigo-500 text-white"
//                           : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
//                       }`}
//                     >
//                       {activePcsIndices.has(i) && <Check className="w-3 h-3" />}
//                     </div>
//                     <span
//                       className={`text-[10px] sm:text-xs font-bold ${
//                         activePcsIndices.has(i)
//                           ? "text-indigo-700 dark:text-indigo-300"
//                           : "text-gray-400"
//                       }`}
//                     >
//                       Pcs {i + 1}
//                     </span>
//                   </button>
//                 </th>
//               ))}
//             </tr>
//           </thead>
//           <tbody className="bg-white dark:bg-gray-900">{renderRows()}</tbody>
//         </table>

//         {filteredSpecs.length === 0 && (
//           <div className="text-center py-16">
//             <AlertTriangle className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
//             <p className="text-gray-500 dark:text-gray-400">
//               No measurement points found.
//             </p>
//           </div>
//         )}
//       </div>

//       <div className="flex-shrink-0 p-3 sm:p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 safe-area-bottom">
//         <div className="flex items-center justify-between gap-3">
//           <div className="flex items-center gap-2 text-sm">
//             <div className="flex items-center gap-1">
//               <div className="w-3 h-3 rounded bg-green-500"></div>
//               <span className="text-gray-600 dark:text-gray-400 text-xs">
//                 Pass
//               </span>
//             </div>
//             <div className="flex items-center gap-1">
//               <div className="w-3 h-3 rounded bg-red-500"></div>
//               <span className="text-gray-600 dark:text-gray-400 text-xs">
//                 Fail
//               </span>
//             </div>
//             {isEditing && (
//               <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium ml-2">
//                 • Editing Mode
//               </span>
//             )}
//           </div>

//           <button
//             onClick={handleSave}
//             className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95"
//           >
//             <Save className="w-4 h-4 sm:w-5 sm:h-5" />
//             <span className="hidden sm:inline">
//               {isEditing ? "Update Measurements" : "Save Measurements"}
//             </span>
//             <span className="sm:hidden">{isEditing ? "Update" : "Save"}</span>
//           </button>
//         </div>
//       </div>

//       {activeCell && (
//         <MeasurementNumPad
//           onClose={() => setActiveCell(null)}
//           onInput={handleNumPadInput}
//           initialValue={
//             measurements[activeCell.specId]?.[activeCell.sampleIndex]?.decimal
//           }
//         />
//       )}
//     </div>,
//     document.body
//   );
// };

// export default YPivotQATemplatesMeasurementGridModal;

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Plus,
  Minus,
  Save,
  Search,
  Check,
  AlertTriangle,
  Edit3,
  Star,
  List,
  CheckCircle,
  XCircle,
  AlertCircle,
  Power,
  MessageSquare
} from "lucide-react";
import MeasurementNumPad from "../../cutting/MeasurementNumPad";
import {
  checkTolerance,
  formatToleranceDisplay
} from "./YPivotQATemplatesHelpers";

const YPivotQATemplatesMeasurementGridModal = ({
  isOpen,
  onClose,
  specsData,
  selectedSpecsList,
  selectedSize,
  selectedKValue,
  onSave,
  measType,
  editingData = null,
  isEditing = false
}) => {
  // Display mode: "all" or "selected" (critical)
  const [displayMode, setDisplayMode] = useState("all");

  // Separate measurements for each mode to preserve data
  const [allMeasurements, setAllMeasurements] = useState({});
  const [criticalMeasurements, setCriticalMeasurements] = useState({});

  // Piece quantities for each mode
  const [allQty, setAllQty] = useState(1);
  const [criticalQty, setCriticalQty] = useState(2);

  // Enabled pieces - user must click to enable
  const [allEnabledPcs, setAllEnabledPcs] = useState(new Set());
  const [criticalEnabledPcs, setCriticalEnabledPcs] = useState(new Set());

  const [activeCell, setActiveCell] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Inspector Decision and Remark
  const [inspectorDecision, setInspectorDecision] = useState("pass");
  const [remark, setRemark] = useState("");

  // Current mode getters
  const currentMeasurements =
    displayMode === "all" ? allMeasurements : criticalMeasurements;
  const setCurrentMeasurements =
    displayMode === "all" ? setAllMeasurements : setCriticalMeasurements;
  const currentQty = displayMode === "all" ? allQty : criticalQty;
  const setCurrentQty = displayMode === "all" ? setAllQty : setCriticalQty;
  const currentEnabledPcs =
    displayMode === "all" ? allEnabledPcs : criticalEnabledPcs;
  const setCurrentEnabledPcs =
    displayMode === "all" ? setAllEnabledPcs : setCriticalEnabledPcs;

  // Initialize measurements
  const initializeMeasurements = useCallback((specs, qty) => {
    const initial = {};
    specs.forEach((spec) => {
      initial[spec.id] = {};
      for (let i = 0; i < qty; i++) {
        initial[spec.id][i] = { decimal: 0, fraction: "0" };
      }
    });
    return initial;
  }, []);

  useEffect(() => {
    if (isOpen && specsData.length > 0) {
      if (isEditing && editingData) {
        // Load existing data
        setDisplayMode(editingData.displayMode || "all");
        setInspectorDecision(editingData.inspectorDecision || "pass");
        setRemark(editingData.remark || "");

        // Load All measurements
        if (editingData.allMeasurements) {
          setAllMeasurements(
            JSON.parse(JSON.stringify(editingData.allMeasurements))
          );
          setAllQty(editingData.allQty || 1);
          setAllEnabledPcs(new Set(editingData.allEnabledPcs || []));
        } else {
          setAllMeasurements(initializeMeasurements(specsData, 1));
          setAllQty(1);
          setAllEnabledPcs(new Set());
        }

        // Load Critical measurements
        if (editingData.criticalMeasurements) {
          setCriticalMeasurements(
            JSON.parse(JSON.stringify(editingData.criticalMeasurements))
          );
          setCriticalQty(editingData.criticalQty || 2);
          setCriticalEnabledPcs(new Set(editingData.criticalEnabledPcs || []));
        } else {
          setCriticalMeasurements(initializeMeasurements(selectedSpecsList, 2));
          setCriticalQty(2);
          setCriticalEnabledPcs(new Set());
        }
      } else {
        // Fresh initialization
        setDisplayMode("all");
        setInspectorDecision("pass");
        setRemark("");

        setAllMeasurements(initializeMeasurements(specsData, 1));
        setAllQty(1);
        setAllEnabledPcs(new Set());

        setCriticalMeasurements(initializeMeasurements(selectedSpecsList, 2));
        setCriticalQty(2);
        setCriticalEnabledPcs(new Set());
      }
      setSearchTerm("");
      setActiveCell(null);
    }
  }, [
    isOpen,
    specsData,
    selectedSpecsList,
    isEditing,
    editingData,
    initializeMeasurements
  ]);

  // Handle display mode change - preserve measurements
  const handleDisplayModeChange = (newMode) => {
    if (newMode === displayMode) return;
    setDisplayMode(newMode);
    setActiveCell(null);
  };

  // Toggle piece enabled state
  const togglePcsEnabled = (index) => {
    const newSet = new Set(currentEnabledPcs);
    if (newSet.has(index)) {
      newSet.delete(index);
    } else {
      newSet.add(index);
    }
    setCurrentEnabledPcs(newSet);
  };

  // Filter specs based on mode
  const filteredSpecs = useMemo(() => {
    let specs = displayMode === "all" ? specsData : selectedSpecsList;

    if (selectedKValue && measType === "Before") {
      specs = specs.filter(
        (s) => s.kValue === selectedKValue || s.kValue === "NA"
      );
    }

    if (searchTerm) {
      specs = specs.filter(
        (s) =>
          s.MeasurementPointEngName?.toLowerCase().includes(
            searchTerm.toLowerCase()
          ) ||
          s.MeasurementPointChiName?.toLowerCase().includes(
            searchTerm.toLowerCase()
          )
      );
    }

    return specs;
  }, [
    specsData,
    selectedSpecsList,
    displayMode,
    selectedKValue,
    measType,
    searchTerm
  ]);

  // Check if spec is critical
  const isCriticalSpec = useCallback(
    (spec) => {
      if (!selectedSpecsList || selectedSpecsList.length === 0) return false;
      return selectedSpecsList.some((s) => s.id === spec.id);
    },
    [selectedSpecsList]
  );

  // FIXED: Calculate System Decision based on correct logic
  // Under All tab: Pcs 1 fail = fail, only if Pcs 2 (all pass) can change back to pass
  const calculateSystemDecision = useMemo(() => {
    // Get critical specs for evaluation
    const criticalSpecs = selectedSpecsList.filter((s) => {
      if (selectedKValue && measType === "Before") {
        return s.kValue === selectedKValue || s.kValue === "NA";
      }
      return true;
    });

    if (criticalSpecs.length === 0) return "pending";

    const allEnabledArray = Array.from(allEnabledPcs).sort((a, b) => a - b);
    const criticalEnabledArray = Array.from(criticalEnabledPcs).sort(
      (a, b) => a - b
    );

    let hasAllData = allEnabledArray.length > 0;
    let hasCriticalData = criticalEnabledArray.length > 0;

    if (!hasAllData && !hasCriticalData) return "pending";

    // Helper function to check if a Pcs has any critical point fail
    const checkPcsForFail = (measurements, pcsIndex, specs) => {
      for (const spec of specs) {
        const val = measurements[spec.id]?.[pcsIndex];
        // If value is 0 (default/not touched), consider as PASS
        if (!val || val.decimal === 0) {
          continue; // Pass - not touched means OK
        }
        const toleranceResult = checkTolerance(spec, val.decimal, selectedSize);
        if (!toleranceResult.isWithin && !toleranceResult.isDefault) {
          return true; // Has fail
        }
      }
      return false; // No fail
    };

    // Logic for All Point evaluation (Under All tab)
    let allPointResult = null;
    if (hasAllData) {
      // Check Pcs 1 first (index 0)
      if (allEnabledPcs.has(0)) {
        const pcs1HasFail = checkPcsForFail(allMeasurements, 0, criticalSpecs);

        if (pcs1HasFail) {
          // Pcs 1 has fail - check if Pcs 2 is enabled and all pass
          if (allEnabledPcs.has(1)) {
            const pcs2HasFail = checkPcsForFail(
              allMeasurements,
              1,
              criticalSpecs
            );
            if (pcs2HasFail) {
              allPointResult = "fail"; // Pcs 2 also has fail
            } else {
              allPointResult = "pass"; // Pcs 2 all pass, can recover
            }
          } else {
            allPointResult = "fail"; // Pcs 1 fail, no Pcs 2
          }
        } else {
          allPointResult = "pass"; // Pcs 1 all pass
        }
      }
    }

    // Logic for Critical Point evaluation
    let criticalPointResult = null;
    if (hasCriticalData) {
      // Check each enabled Pcs
      let anyPcsHasFail = false;
      let lastPcsAllPass = false;

      for (let i = 0; i < criticalEnabledArray.length; i++) {
        const pcsIndex = criticalEnabledArray[i];
        const hasFail = checkPcsForFail(
          criticalMeasurements,
          pcsIndex,
          criticalSpecs
        );

        if (hasFail) {
          anyPcsHasFail = true;
          lastPcsAllPass = false;
        } else {
          lastPcsAllPass = true;
        }
      }

      // If any Pcs has fail and the last checked Pcs also has fail, result is fail
      // Only if the last checked Pcs is all pass can recover to pass
      if (anyPcsHasFail) {
        criticalPointResult = lastPcsAllPass ? "pass" : "fail";
      } else {
        criticalPointResult = "pass";
      }
    }

    // Combine results - prioritize fail
    if (allPointResult === "fail" || criticalPointResult === "fail") {
      return "fail";
    }
    if (allPointResult === "pass" || criticalPointResult === "pass") {
      return "pass";
    }

    return "pending";
  }, [
    allMeasurements,
    criticalMeasurements,
    allEnabledPcs,
    criticalEnabledPcs,
    selectedSpecsList,
    selectedSize,
    selectedKValue,
    measType
  ]);

  if (!isOpen) return null;

  const handleNumPadInput = (decimal, fraction) => {
    if (activeCell) {
      setCurrentMeasurements((prev) => ({
        ...prev,
        [activeCell.specId]: {
          ...(prev[activeCell.specId] || {}),
          [activeCell.sampleIndex]: { decimal, fraction }
        }
      }));
      setActiveCell(null);
    }
  };

  const handleCellClick = (specId, sampleIndex) => {
    if (currentEnabledPcs.has(sampleIndex)) {
      setActiveCell({ specId, sampleIndex });
    }
  };

  const handleSave = () => {
    const result = {
      size: selectedSize,
      kValue: selectedKValue,
      measType: measType,
      timestamp: new Date().toISOString(),
      displayMode: displayMode,

      // All point data
      allMeasurements: allMeasurements,
      allQty: allQty,
      allEnabledPcs: Array.from(allEnabledPcs),

      // Critical point data
      criticalMeasurements: criticalMeasurements,
      criticalQty: criticalQty,
      criticalEnabledPcs: Array.from(criticalEnabledPcs),

      // Decision data
      systemDecision: calculateSystemDecision,
      inspectorDecision: inspectorDecision,
      remark: remark
    };

    onSave(result);
    onClose();
  };

  const handleQtyChange = (newQty) => {
    if (newQty < 1) return;
    setCurrentQty(newQty);

    const specs = displayMode === "all" ? specsData : selectedSpecsList;
    setCurrentMeasurements((prev) => {
      const updated = { ...prev };
      specs.forEach((spec) => {
        if (!updated[spec.id]) {
          updated[spec.id] = {};
        }
        for (let i = 0; i < newQty; i++) {
          if (!updated[spec.id][i]) {
            updated[spec.id][i] = { decimal: 0, fraction: "0" };
          }
        }
      });
      return updated;
    });
  };

  const getCompletionStats = () => {
    let total = 0;
    let filled = 0;

    filteredSpecs.forEach((spec) => {
      currentEnabledPcs.forEach((pcsIndex) => {
        total++;
        const val = currentMeasurements[spec.id]?.[pcsIndex];
        if (val && val.decimal !== 0) {
          filled++;
        }
      });
    });

    return {
      total,
      filled,
      percentage: total > 0 ? Math.round((filled / total) * 100) : 0
    };
  };

  const completionStats = getCompletionStats();

  const renderRows = () => {
    return filteredSpecs.map((spec, index) => {
      const specValueObj = spec.Specs?.find((s) => s.size === selectedSize);
      const specValueDisplay =
        specValueObj?.fraction || specValueObj?.decimal?.toString() || "-";
      const tolMinusDisplay = formatToleranceDisplay(spec.TolMinus, true);
      const tolPlusDisplay = formatToleranceDisplay(spec.TolPlus, false);
      const specId = spec.id || index;
      const isCritical = displayMode === "all" && isCriticalSpec(spec);

      return (
        <tr
          key={specId}
          className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
        >
          <td
            className={`p-2 sm:p-3 border-r border-gray-200 dark:border-gray-700 sticky left-0 z-[5] ${
              isCritical
                ? "bg-blue-50 dark:bg-blue-900/30"
                : "bg-white dark:bg-gray-900"
            }`}
          >
            <div className="max-w-[120px] sm:max-w-[200px]">
              <div className="flex items-start gap-2">
                {isCritical && (
                  <Star className="w-3 h-3 text-blue-500 fill-current flex-shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <span className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300 break-words whitespace-normal block leading-tight">
                    {spec.MeasurementPointEngName}
                  </span>
                  {spec.MeasurementPointChiName && (
                    <span className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 break-words whitespace-normal block mt-0.5 leading-tight">
                      {spec.MeasurementPointChiName}
                    </span>
                  )}
                </div>
              </div>
              {isCritical && (
                <span className="inline-block mt-1 text-[8px] bg-blue-500 text-white px-1 py-0.5 rounded font-bold">
                  CRITICAL
                </span>
              )}
            </div>
          </td>

          <td className="p-1 sm:p-2 text-center text-xs font-mono border-r dark:border-gray-700 bg-red-50 dark:bg-red-900/20">
            <span className="text-red-600 dark:text-red-400">
              -{tolMinusDisplay}
            </span>
          </td>

          <td className="p-1 sm:p-2 text-center text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 border-r dark:border-gray-700 bg-blue-50 dark:bg-blue-900/20">
            {specValueDisplay}
          </td>

          <td className="p-1 sm:p-2 text-center text-xs font-mono border-r dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
            <span className="text-green-600 dark:text-green-400">
              +{tolPlusDisplay}
            </span>
          </td>

          {Array.from({ length: currentQty }).map((_, pcsIndex) => {
            const currentVal = currentMeasurements[specId]?.[pcsIndex] || {
              decimal: 0,
              fraction: "0"
            };
            const displayVal = currentVal.fraction || "0";
            const numVal = currentVal.decimal || 0;
            const isEnabled = currentEnabledPcs.has(pcsIndex);
            const toleranceResult = checkTolerance(spec, numVal, selectedSize);

            let cellBgClass = "bg-gray-100 dark:bg-gray-800";
            let textClass = "text-gray-400";

            if (isEnabled) {
              if (toleranceResult.isDefault) {
                cellBgClass = "bg-gray-50 dark:bg-gray-700";
                textClass = "text-gray-600 dark:text-gray-400";
              } else if (toleranceResult.isWithin) {
                cellBgClass = "bg-green-100 dark:bg-green-900/40";
                textClass = "text-green-700 dark:text-green-300";
              } else {
                cellBgClass = "bg-red-100 dark:bg-red-900/40";
                textClass = "text-red-700 dark:text-red-300";
              }
            }

            return (
              <td
                key={pcsIndex}
                className="p-1 border-r border-gray-200 dark:border-gray-700 min-w-[60px] sm:min-w-[80px]"
              >
                <button
                  disabled={!isEnabled}
                  onClick={() => handleCellClick(specId, pcsIndex)}
                  className={`w-full h-9 sm:h-10 rounded-lg border flex items-center justify-center text-xs sm:text-sm font-bold transition-all ${cellBgClass} ${textClass} ${
                    isEnabled
                      ? "border-gray-300 dark:border-gray-600 cursor-pointer hover:shadow-md active:scale-95"
                      : "border-gray-200 dark:border-gray-700 cursor-not-allowed opacity-50"
                  }`}
                >
                  {displayVal}
                </button>
              </td>
            );
          })}
        </tr>
      );
    });
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-white dark:bg-gray-900 flex flex-col h-[100dvh] animate-fadeIn">
      {/* Header with Close */}
      <div className="flex-shrink-0 px-3 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 flex justify-between items-center shadow-lg safe-area-top">
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-bold text-sm sm:text-lg truncate flex items-center gap-2">
            {isEditing && <Edit3 className="w-4 h-4" />}
            Measurement Entry
          </h2>
          <div className="flex flex-wrap gap-1 mt-0.5">
            <span className="text-[10px] sm:text-xs bg-white/20 text-white px-1.5 sm:px-2 py-0.5 rounded-full">
              Size: {selectedSize}
            </span>
            {selectedKValue && (
              <span className="text-[10px] sm:text-xs bg-white/20 text-white px-1.5 sm:px-2 py-0.5 rounded-full">
                K: {selectedKValue}
              </span>
            )}
          </div>
        </div>

        {/* System Decision Badge in Header */}
        <div className="flex items-center gap-2">
          <div
            className={`hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${
              calculateSystemDecision === "pass"
                ? "bg-green-500/30 text-green-100"
                : calculateSystemDecision === "fail"
                ? "bg-red-500/30 text-red-100"
                : "bg-white/20 text-white/70"
            }`}
          >
            {calculateSystemDecision === "pass" ? (
              <CheckCircle className="w-3 h-3" />
            ) : calculateSystemDecision === "fail" ? (
              <XCircle className="w-3 h-3" />
            ) : (
              <AlertCircle className="w-3 h-3" />
            )}
            <span>Sys: {calculateSystemDecision.toUpperCase()}</span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Compact Control Card */}
      <div className="flex-shrink-0 p-2 sm:p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-2 lg:items-center lg:justify-between">
          {/* Left: Mode Toggle + System Decision (Mobile) */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Display Mode Toggle */}
            <div className="flex bg-white dark:bg-gray-700 rounded-lg p-0.5 border border-gray-200 dark:border-gray-600 shadow-sm">
              <button
                onClick={() => handleDisplayModeChange("all")}
                className={`px-2 sm:px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                  displayMode === "all"
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <List className="w-3 h-3" />
                <span className="hidden sm:inline">All</span> (
                {specsData.length})
              </button>
              <button
                onClick={() => handleDisplayModeChange("selected")}
                className={`px-2 sm:px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                  displayMode === "selected"
                    ? "bg-indigo-500 text-white shadow-sm"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <Star className="w-3 h-3" />
                <span className="hidden sm:inline">Critical</span> (
                {selectedSpecsList.length})
              </button>
            </div>

            {/* System Decision (Mobile) */}
            <div
              className={`sm:hidden flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${
                calculateSystemDecision === "pass"
                  ? "bg-green-100 text-green-700"
                  : calculateSystemDecision === "fail"
                  ? "bg-red-100 text-red-700"
                  : "bg-gray-100 text-gray-500"
              }`}
            >
              {calculateSystemDecision === "pass" ? (
                <CheckCircle className="w-3 h-3" />
              ) : calculateSystemDecision === "fail" ? (
                <XCircle className="w-3 h-3" />
              ) : (
                <AlertCircle className="w-3 h-3" />
              )}
              Sys: {calculateSystemDecision.toUpperCase()}
            </div>
          </div>

          {/* Right: Qty Control + Search */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Qty Control */}
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-gray-500 uppercase">
                Qty:
              </span>
              <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm">
                <button
                  onClick={() => handleQtyChange(Math.max(1, currentQty - 1))}
                  disabled={currentQty <= 1}
                  className={`p-1 sm:p-1.5 rounded-l-lg transition-colors ${
                    currentQty <= 1
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:bg-gray-100 dark:hover:bg-gray-600"
                  }`}
                >
                  <Minus className="w-3 h-3" />
                </button>
                <div className="w-6 sm:w-8 text-center font-bold text-gray-800 dark:text-white text-xs sm:text-sm">
                  {currentQty}
                </div>
                <button
                  onClick={() => handleQtyChange(currentQty + 1)}
                  className="p-1 sm:p-1.5 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-r-lg transition-colors"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[120px] max-w-[200px]">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              />
            </div>

            {/* Progress */}
            <div className="hidden md:flex items-center gap-1">
              <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                  style={{ width: `${completionStats.percentage}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-500">
                {completionStats.filled}/{completionStats.total}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Measurement Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead className="sticky top-0 z-10 bg-gray-100 dark:bg-gray-800 shadow-sm">
            <tr>
              <th className="p-2 text-left text-[10px] font-bold text-gray-500 uppercase border-r dark:border-gray-700 sticky left-0 bg-gray-100 dark:bg-gray-800 z-[15] min-w-[120px] sm:min-w-[180px]">
                Point
              </th>
              <th className="p-1 text-center text-[10px] font-bold text-red-500 uppercase border-r dark:border-gray-700 w-10 sm:w-14 bg-red-50 dark:bg-red-900/20">
                -
              </th>
              <th className="p-1 text-center text-[10px] font-bold text-blue-600 uppercase border-r dark:border-gray-700 w-10 sm:w-14 bg-blue-50 dark:bg-blue-900/20">
                Spec
              </th>
              <th className="p-1 text-center text-[10px] font-bold text-green-500 uppercase border-r dark:border-gray-700 w-10 sm:w-14 bg-green-50 dark:bg-green-900/20">
                +
              </th>

              {Array.from({ length: currentQty }).map((_, i) => {
                const isEnabled = currentEnabledPcs.has(i);
                return (
                  <th
                    key={i}
                    className={`p-1 text-center border-r dark:border-gray-700 min-w-[55px] sm:min-w-[70px] transition-colors ${
                      isEnabled
                        ? "bg-indigo-100 dark:bg-indigo-900/30"
                        : "bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    <button
                      onClick={() => togglePcsEnabled(i)}
                      className="flex flex-col items-center justify-center w-full gap-0.5"
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          isEnabled
                            ? "bg-indigo-500 border-indigo-500 text-white"
                            : "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                        }`}
                      >
                        {isEnabled ? (
                          <Power className="w-3 h-3" />
                        ) : (
                          <Power className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold ${
                          isEnabled
                            ? "text-indigo-700 dark:text-indigo-300"
                            : "text-gray-400"
                        }`}
                      >
                        Pcs {i + 1}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900">{renderRows()}</tbody>
        </table>

        {filteredSpecs.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="w-10 h-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              No measurement points found.
            </p>
          </div>
        )}
      </div>

      {/* Footer: Inspector Decision + Remark */}
      <div className="flex-shrink-0 p-2 sm:p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 safe-area-bottom">
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          {/* Inspector Decision + Remark */}
          <div className="flex flex-col sm:flex-row gap-2 flex-1">
            {/* Inspector Decision Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-gray-500 uppercase whitespace-nowrap">
                Inspector:
              </span>
              <div className="flex bg-white dark:bg-gray-700 rounded-lg p-0.5 border border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => setInspectorDecision("pass")}
                  className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                    inspectorDecision === "pass"
                      ? "bg-green-500 text-white"
                      : "text-gray-500"
                  }`}
                >
                  <CheckCircle className="w-3 h-3" />
                  Pass
                </button>
                <button
                  onClick={() => setInspectorDecision("fail")}
                  className={`px-2 sm:px-3 py-1 text-[10px] sm:text-xs font-bold rounded-md transition-all flex items-center gap-1 ${
                    inspectorDecision === "fail"
                      ? "bg-red-500 text-white"
                      : "text-gray-500"
                  }`}
                >
                  <XCircle className="w-3 h-3" />
                  Fail
                </button>
              </div>
            </div>

            {/* Remark Field */}
            <div className="flex items-center gap-2 flex-1">
              <MessageSquare className="w-3 h-3 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Remark (optional)"
                value={remark}
                onChange={(e) => setRemark(e.target.value.slice(0, 200))}
                maxLength={200}
                className="flex-1 px-2 py-1.5 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              />
              <span className="text-[10px] text-gray-400 whitespace-nowrap">
                {remark.length}/200
              </span>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            className="px-4 sm:px-6 py-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 text-sm"
          >
            <Save className="w-4 h-4" />
            {isEditing ? "Update" : "Save"}
          </button>
        </div>
      </div>

      {activeCell && (
        <MeasurementNumPad
          onClose={() => setActiveCell(null)}
          onInput={handleNumPadInput}
          initialValue={
            currentMeasurements[activeCell.specId]?.[activeCell.sampleIndex]
              ?.decimal
          }
        />
      )}
    </div>,
    document.body
  );
};

export default YPivotQATemplatesMeasurementGridModal;
