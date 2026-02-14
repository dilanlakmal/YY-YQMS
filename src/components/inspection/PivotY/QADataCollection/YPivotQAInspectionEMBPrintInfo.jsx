import React, { useEffect, useState } from "react";
import {
  Settings,
  ToggleLeft,
  ToggleRight,
  Gauge,
  Scissors,
  PenTool,
  Printer,
  Activity,
  MessageSquare,
  Zap,
} from "lucide-react";

// Reusable Row Component
const ConfigRow = ({
  label,
  icon: Icon,
  value,
  onChange,
  isEnabled,
  onToggle,
  isSelect = false,
  options = [],
  placeholder = "Enter value...",
  type = "text",
  min,
  max,
  customError = false, // Prop to trigger red background
}) => {
  return (
    <div
      className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${
        isEnabled
          ? customError
            ? "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700"
            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          : "bg-gray-50 dark:bg-gray-900 border-transparent opacity-70"
      }`}
    >
      <div
        className={`p-2 rounded-lg ${
          isEnabled
            ? customError
              ? "bg-red-100 text-red-600"
              : "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
            : "bg-gray-200 dark:bg-gray-800 text-gray-400"
        }`}
      >
        <Icon size={16} />
      </div>

      <div className="flex-1">
        <p className="text-[10px] font-bold text-gray-500 uppercase">{label}</p>
        <div className="mt-0.5">
          {isSelect ? (
            <select
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={!isEnabled}
              className="w-full bg-transparent text-sm font-bold text-gray-800 dark:text-gray-200 focus:outline-none disabled:cursor-not-allowed"
            >
              {options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <input
              type={type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              disabled={!isEnabled}
              min={min}
              max={max}
              placeholder={isEnabled ? placeholder : "Disabled"}
              className={`w-full bg-transparent text-sm font-bold focus:outline-none placeholder-gray-400 disabled:cursor-not-allowed ${
                customError
                  ? "text-red-600 dark:text-red-400"
                  : "text-gray-800 dark:text-gray-200"
              }`}
            />
          )}
        </div>
      </div>

      <button
        onClick={onToggle}
        className={`transition-colors ${
          isEnabled
            ? "text-green-500 hover:text-green-600"
            : "text-gray-400 hover:text-gray-500"
        }`}
        title={isEnabled ? "Disable Field" : "Enable Field"}
      >
        {isEnabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
      </button>
    </div>
  );
};

const YPivotQAInspectionEMBPrintInfo = ({
  reportType = "",
  embData,
  printData,
  onUpdate,
}) => {
  const isEMB = reportType.toLowerCase().includes("emb");
  const isPrinting = reportType.toLowerCase().includes("printing");

  const [localEmb, setLocalEmb] = useState({
    speed: { value: "", enabled: true },
    stitch: { value: "", enabled: true },
    needleSize: { value: "", enabled: true },
    remarks: "",
  });

  const [localPrint, setLocalPrint] = useState({
    machineType: { value: "Auto", enabled: true },
    speed: { value: "", enabled: true },
    pressure: { value: "", enabled: true },
    remarks: "",
  });

  // Sync incoming props to local state
  useEffect(() => {
    if (embData) setLocalEmb((prev) => ({ ...prev, ...embData }));
  }, [embData]);

  useEffect(() => {
    if (printData) setLocalPrint((prev) => ({ ...prev, ...printData }));
  }, [printData]);

  const updateEmb = (field, subField, val) => {
    const newState = { ...localEmb };
    if (subField) {
      // Validate Needle Size (7-16)
      if (field === "needleSize" && subField === "value") {
        const num = parseFloat(val);
        // Allow empty string for typing, otherwise enforce simple check
        // Strictly blocking inputs < 0 or crazy numbers, but soft validation for range handled in render
        if (val !== "" && (num < 0 || val.length > 2)) return; // Prevent nonsense
      }

      // Numeric enforcement for Speed/Stitch
      if ((field === "speed" || field === "stitch") && subField === "value") {
        if (val !== "" && isNaN(val)) return;
      }

      newState[field] = { ...newState[field], [subField]: val };
    } else {
      newState[field] = val;
    }
    setLocalEmb(newState);
    onUpdate({ embInfo: newState, printInfo: localPrint });
  };

  const updatePrint = (field, subField, val) => {
    const newState = { ...localPrint };
    if (subField) {
      // Numeric enforcement
      if ((field === "speed" || field === "pressure") && subField === "value") {
        if (val !== "" && isNaN(val)) return;
        // Prevent negative pressure
        if (field === "pressure" && parseFloat(val) < 0) return;
      }

      newState[field] = { ...newState[field], [subField]: val };
    } else {
      newState[field] = val;
    }
    setLocalPrint(newState);
    onUpdate({ embInfo: localEmb, printInfo: newState });
  };

  // Validation Helpers
  const isNeedleSizeInvalid = (val) => {
    if (val === "" || !localEmb.needleSize.enabled) return false;
    const num = parseFloat(val);
    return num < 7 || num > 16;
  };

  const isPressureHigh = (val) => {
    if (val === "" || !localPrint.pressure.enabled) return false;
    const num = parseFloat(val);
    return num > 10;
  };

  if (!isEMB && !isPrinting) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div
        className={`px-4 py-3 bg-gradient-to-r ${
          isPrinting
            ? "from-pink-500 to-rose-600"
            : "from-blue-600 to-indigo-600"
        }`}
      >
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          {isPrinting ? (
            <Printer className="w-4 h-4" />
          ) : (
            <Settings className="w-4 h-4" />
          )}
          {isPrinting ? "Printing Configuration" : "EMB Configuration"}
        </h3>
      </div>

      <div className="p-4 space-y-4">
        {/* EMB SECTION */}
        {isEMB && !isPrinting && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ConfigRow
                label="Speed"
                icon={Gauge}
                value={localEmb.speed.value}
                isEnabled={localEmb.speed.enabled}
                onChange={(val) => updateEmb("speed", "value", val)}
                onToggle={() =>
                  updateEmb("speed", "enabled", !localEmb.speed.enabled)
                }
                type="number"
                placeholder="RPM / SPM"
              />
              <ConfigRow
                label="Stitch"
                icon={Activity}
                value={localEmb.stitch.value}
                isEnabled={localEmb.stitch.enabled}
                onChange={(val) => updateEmb("stitch", "value", val)}
                onToggle={() =>
                  updateEmb("stitch", "enabled", !localEmb.stitch.enabled)
                }
                type="number"
                placeholder="Stitch Count"
              />
              <ConfigRow
                label="Needle Size (7-16)"
                icon={PenTool}
                value={localEmb.needleSize.value}
                isEnabled={localEmb.needleSize.enabled}
                onChange={(val) => updateEmb("needleSize", "value", val)}
                onToggle={() =>
                  updateEmb(
                    "needleSize",
                    "enabled",
                    !localEmb.needleSize.enabled,
                  )
                }
                type="number"
                min="7"
                max="16"
                placeholder="7 - 16"
                // Pass true if invalid to trigger red styling
                customError={isNeedleSizeInvalid(localEmb.needleSize.value)}
              />
            </div>

            {/* Warning Message for Needle */}
            {isNeedleSizeInvalid(localEmb.needleSize.value) && (
              <p className="text-[10px] text-red-500 font-bold px-1">
                * Needle size must be between 7 and 16.
              </p>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                EMB Remarks
                <span className="text-[9px] text-gray-400 ml-auto">
                  {localEmb.remarks.length}/250
                </span>
              </label>
              <textarea
                value={localEmb.remarks}
                onChange={(e) =>
                  updateEmb("remarks", null, e.target.value.slice(0, 250))
                }
                placeholder="Enter additional EMB details..."
                rows={2}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        )}

        {/* PRINTING SECTION */}
        {isPrinting && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <ConfigRow
                label="Machine Type"
                icon={Settings}
                value={localPrint.machineType.value}
                isEnabled={localPrint.machineType.enabled}
                onChange={(val) => updatePrint("machineType", "value", val)}
                onToggle={() =>
                  updatePrint(
                    "machineType",
                    "enabled",
                    !localPrint.machineType.enabled,
                  )
                }
                isSelect={true}
                options={["Auto", "Manual"]}
              />
              <ConfigRow
                label="Speed"
                icon={Zap}
                value={localPrint.speed.value}
                isEnabled={localPrint.speed.enabled}
                onChange={(val) => updatePrint("speed", "value", val)}
                onToggle={() =>
                  updatePrint("speed", "enabled", !localPrint.speed.enabled)
                }
                type="number"
                placeholder="Speed value"
              />
              <ConfigRow
                label="Pressure (1-10)"
                icon={Activity}
                value={localPrint.pressure.value}
                isEnabled={localPrint.pressure.enabled}
                onChange={(val) => updatePrint("pressure", "value", val)}
                onToggle={() =>
                  updatePrint(
                    "pressure",
                    "enabled",
                    !localPrint.pressure.enabled,
                  )
                }
                type="number"
                min="0"
                placeholder="1 - 10"
                // Pass true if > 10 to trigger red styling
                customError={isPressureHigh(localPrint.pressure.value)}
              />
            </div>

            {/* Warning Message for Pressure */}
            {isPressureHigh(localPrint.pressure.value) && (
              <p className="text-[10px] text-red-500 font-bold px-1">
                * Pressure is higher than recommended (1-10).
              </p>
            )}

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-gray-500" />
                Printing Remarks
                <span className="text-[9px] text-gray-400 ml-auto">
                  {localPrint.remarks.length}/250
                </span>
              </label>
              <textarea
                value={localPrint.remarks}
                onChange={(e) =>
                  updatePrint("remarks", null, e.target.value.slice(0, 250))
                }
                placeholder="Enter additional Printing details..."
                rows={2}
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default YPivotQAInspectionEMBPrintInfo;
