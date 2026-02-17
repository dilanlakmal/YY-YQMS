import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Factory,
  Scissors,
  Shirt,
  Thermometer,
  CheckSquare,
  FolderOpen,
  Package,
  Boxes,
  Hash,
  Calculator,
  TrendingUp,
  AlertCircle,
  Percent,
} from "lucide-react";
import { useTranslation } from "react-i18next";

// ============================================================
// Production Stage Input Component
// ============================================================
const ProductionStageInput = ({
  icon: Icon,
  label,
  value,
  onChange,
  color = "indigo",
}) => {
  const { t } = useTranslation();
  const [localValue, setLocalValue] = useState(value || "");
  const [error, setError] = useState(null);

  const colorClasses = {
    indigo: {
      bg: "bg-indigo-50 dark:bg-indigo-900/30",
      border: "border-indigo-200 dark:border-indigo-800",
      text: "text-indigo-600 dark:text-indigo-400",
      ring: "focus:ring-indigo-500",
    },
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-900/30",
      border: "border-emerald-200 dark:border-emerald-800",
      text: "text-emerald-600 dark:text-emerald-400",
      ring: "focus:ring-emerald-500",
    },
    orange: {
      bg: "bg-orange-50 dark:bg-orange-900/30",
      border: "border-orange-200 dark:border-orange-800",
      text: "text-orange-600 dark:text-orange-400",
      ring: "focus:ring-orange-500",
    },
    purple: {
      bg: "bg-purple-50 dark:bg-purple-900/30",
      border: "border-purple-200 dark:border-purple-800",
      text: "text-purple-600 dark:text-purple-400",
      ring: "focus:ring-purple-500",
    },
    cyan: {
      bg: "bg-cyan-50 dark:bg-cyan-900/30",
      border: "border-cyan-200 dark:border-cyan-800",
      text: "text-cyan-600 dark:text-cyan-400",
      ring: "focus:ring-cyan-500",
    },
    pink: {
      bg: "bg-pink-50 dark:bg-pink-900/30",
      border: "border-pink-200 dark:border-pink-800",
      text: "text-pink-600 dark:text-pink-400",
      ring: "focus:ring-pink-500",
    },
  };

  const colors = colorClasses[color] || colorClasses.indigo;

  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  const handleChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");

    if (rawValue === "") {
      setLocalValue("");
      setError(null);
      onChange("");
      return;
    }

    const numValue = parseInt(rawValue, 10);

    if (numValue < 0 || numValue > 100) {
      setError(
        t("fincheckInspectionOrderDataProductionStatus.errors.valueRange"),
      );
      return;
    }

    setError(null);
    setLocalValue(rawValue);
    onChange(rawValue);
  };

  const getProgressColor = (val) => {
    const num = parseInt(val) || 0;
    if (num >= 100) return "bg-green-500";
    if (num >= 75) return "bg-emerald-500";
    if (num >= 50) return "bg-yellow-500";
    if (num >= 25) return "bg-orange-500";
    return "bg-red-500";
  };

  const progressPercent = Math.min(parseInt(localValue) || 0, 100);

  return (
    <div
      className={`p-3 rounded-xl border-2 ${colors.border} ${colors.bg} transition-all hover:shadow-md`}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
          <Icon className={`w-4 h-4 ${colors.text}`} />
        </div>
        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
          {label}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-2 overflow-hidden">
        <div
          className={`h-full ${getProgressColor(
            localValue,
          )} transition-all duration-300 rounded-full`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Input */}
      <div className="flex items-center gap-1">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={localValue}
          onChange={handleChange}
          placeholder="0"
          className={`flex-1 px-2 py-1.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-bold text-center text-gray-800 dark:text-gray-200 ${colors.ring} focus:ring-2 focus:border-transparent transition-all w-full min-w-0`}
        />
        <span className={`text-sm font-bold ${colors.text} flex-shrink-0`}>
          %
        </span>
      </div>

      {error && (
        <p className="text-[10px] text-red-500 mt-1 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
};

// ============================================================
// Packing Input Component
// ============================================================
const PackingInput = ({
  label,
  cartonValue,
  pcsValue,
  onCartonChange,
  onPcsChange,
  icon: Icon,
  color = "indigo",
  disabled = false,
}) => {
  const { t } = useTranslation();
  const colorClasses = {
    indigo: {
      bg: "bg-indigo-50 dark:bg-indigo-900/30",
      border: "border-indigo-200 dark:border-indigo-800",
      text: "text-indigo-600 dark:text-indigo-400",
    },
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-900/30",
      border: "border-emerald-200 dark:border-emerald-800",
      text: "text-emerald-600 dark:text-emerald-400",
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-900/30",
      border: "border-amber-200 dark:border-amber-800",
      text: "text-amber-600 dark:text-amber-400",
    },
  };

  const colors = colorClasses[color] || colorClasses.indigo;

  const handleCartonChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    onCartonChange(rawValue);
  };

  const handlePcsChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, "");
    onPcsChange(rawValue);
  };

  return (
    <div className={`p-4 rounded-xl border-2 ${colors.border} ${colors.bg}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
          <Icon className={`w-5 h-5 ${colors.text}`} />
        </div>
        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
          {label}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* Carton Input */}
        <div className="flex items-center gap-1.5 flex-1 min-w-[120px]">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={cartonValue}
            onChange={handleCartonChange}
            placeholder="0"
            disabled={disabled}
            className={`w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-bold text-center text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />
          <span className="text-xs font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap">
            {t("fincheckInspectionOrderDataProductionStatus.units.ctns")}
          </span>
        </div>

        <span className="text-gray-400 font-bold">/</span>

        {/* Pcs Input */}
        <div className="flex items-center gap-1.5 flex-1 min-w-[120px]">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pcsValue}
            onChange={handlePcsChange}
            placeholder="0"
            disabled={disabled}
            className={`w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-bold text-center text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          />
          <span className="text-xs font-bold text-gray-600 dark:text-gray-400 whitespace-nowrap">
            {t("fincheckInspectionOrderDataProductionStatus.units.pcs")}
          </span>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Main Component
// ============================================================
const YPivotQualityPlan = ({
  selectedTemplate,
  qualityPlanData,
  onQualityPlanChange,
}) => {
  const { t } = useTranslation();
  // Check if QualityPlan should be shown
  const showQualityPlan = selectedTemplate?.QualityPlan === "Yes";

  // Local state for production stages
  const [productionStatus, setProductionStatus] = useState({
    cutting: qualityPlanData?.productionStatus?.cutting || "",
    sewing: qualityPlanData?.productionStatus?.sewing || "",
    ironing: qualityPlanData?.productionStatus?.ironing || "",
    qc2FinishedChecking:
      qualityPlanData?.productionStatus?.qc2FinishedChecking || "",
    folding: qualityPlanData?.productionStatus?.folding || "",
    packing: qualityPlanData?.productionStatus?.packing || "",
  });

  // Local state for packing list
  const [packingList, setPackingList] = useState({
    totalCartons: qualityPlanData?.packingList?.totalCartons || "",
    totalPcs: qualityPlanData?.packingList?.totalPcs || "",
    finishedCartons: qualityPlanData?.packingList?.finishedCartons || "",
    finishedPcs: qualityPlanData?.packingList?.finishedPcs || "",
  });

  // Calculate accounted percentage
  const accountedPercentage = useMemo(() => {
    const totalCartons = parseInt(packingList.totalCartons) || 0;
    const finishedCartons = parseInt(packingList.finishedCartons) || 0;

    if (totalCartons === 0) return "0.00";

    const percentage = (finishedCartons / totalCartons) * 100;
    return percentage.toFixed(2);
  }, [packingList.totalCartons, packingList.finishedCartons]);

  // Sync with external data
  useEffect(() => {
    if (qualityPlanData?.productionStatus) {
      setProductionStatus(qualityPlanData.productionStatus);
    }
    if (qualityPlanData?.packingList) {
      setPackingList(qualityPlanData.packingList);
    }
  }, [qualityPlanData]);

  // Update parent when data changes
  const updateParent = useCallback(
    (newProductionStatus, newPackingList) => {
      if (onQualityPlanChange) {
        const totalCartons = parseInt(newPackingList.totalCartons) || 0;
        const finishedCartons = parseInt(newPackingList.finishedCartons) || 0;
        const accountedPct =
          totalCartons > 0
            ? ((finishedCartons / totalCartons) * 100).toFixed(2)
            : "0.00";

        onQualityPlanChange({
          productionStatus: newProductionStatus,
          packingList: newPackingList,
          accountedPercentage: accountedPct,
        });
      }
    },
    [onQualityPlanChange],
  );

  // Handle production status change
  const handleProductionChange = (field, value) => {
    const newStatus = { ...productionStatus, [field]: value };
    setProductionStatus(newStatus);
    updateParent(newStatus, packingList);
  };

  // Handle packing list change
  const handlePackingChange = (field, value) => {
    const newPacking = { ...packingList, [field]: value };
    setPackingList(newPacking);
    updateParent(productionStatus, newPacking);
  };

  // Don't render if QualityPlan is not "Yes"
  if (!showQualityPlan) {
    return null;
  }

  // Get color based on percentage
  const getAccountedColor = (pct) => {
    const num = parseFloat(pct) || 0;
    if (num >= 100)
      return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800";
    if (num >= 75)
      return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800";
    if (num >= 50)
      return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800";
    if (num >= 25)
      return "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800";
    return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-3">
        <h3 className="text-white font-bold text-sm flex items-center gap-2">
          <Factory className="w-4 h-4" />
          {t(
            "fincheckInspectionOrderDataProductionStatus.sections.productionStatus",
          )}
        </h3>
      </div>

      <div className="p-4 space-y-6">
        {/* Production Stages Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <ProductionStageInput
            icon={Scissors}
            label={t(
              "fincheckInspectionOrderDataProductionStatus.stages.cutting",
            )}
            value={productionStatus.cutting}
            onChange={(val) => handleProductionChange("cutting", val)}
            color="indigo"
          />
          <ProductionStageInput
            icon={Shirt}
            label={t(
              "fincheckInspectionOrderDataProductionStatus.stages.sewing",
            )}
            value={productionStatus.sewing}
            onChange={(val) => handleProductionChange("sewing", val)}
            color="emerald"
          />
          <ProductionStageInput
            icon={Thermometer}
            label={t(
              "fincheckInspectionOrderDataProductionStatus.stages.ironing",
            )}
            value={productionStatus.ironing}
            onChange={(val) => handleProductionChange("ironing", val)}
            color="orange"
          />
          <ProductionStageInput
            icon={CheckSquare}
            label={t(
              "fincheckInspectionOrderDataProductionStatus.stages.qc2Finished",
            )}
            value={productionStatus.qc2FinishedChecking}
            onChange={(val) =>
              handleProductionChange("qc2FinishedChecking", val)
            }
            color="purple"
          />
          <ProductionStageInput
            icon={FolderOpen}
            label={t(
              "fincheckInspectionOrderDataProductionStatus.stages.folding",
            )}
            value={productionStatus.folding}
            onChange={(val) => handleProductionChange("folding", val)}
            color="cyan"
          />
          <ProductionStageInput
            icon={Package}
            label={t(
              "fincheckInspectionOrderDataProductionStatus.stages.packing",
            )}
            value={productionStatus.packing}
            onChange={(val) => handleProductionChange("packing", val)}
            color="pink"
          />
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-700" />

        {/* Packing List Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
              {t(
                "fincheckInspectionOrderDataProductionStatus.sections.packingList",
              )}
            </h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Total Packing */}
            <PackingInput
              label={t(
                "fincheckInspectionOrderDataProductionStatus.packing.total",
              )}
              icon={Hash}
              cartonValue={packingList.totalCartons}
              pcsValue={packingList.totalPcs}
              onCartonChange={(val) => handlePackingChange("totalCartons", val)}
              onPcsChange={(val) => handlePackingChange("totalPcs", val)}
              color="indigo"
            />

            {/* Actual Finished Packing */}
            <PackingInput
              label={t(
                "fincheckInspectionOrderDataProductionStatus.packing.actualFinished",
              )}
              icon={CheckSquare}
              cartonValue={packingList.finishedCartons}
              pcsValue={packingList.finishedPcs}
              onCartonChange={(val) =>
                handlePackingChange("finishedCartons", val)
              }
              onPcsChange={(val) => handlePackingChange("finishedPcs", val)}
              color="emerald"
            />
          </div>

          {/* Accounted Percentage */}
          <div
            className={`p-4 rounded-xl border-2 ${getAccountedColor(
              accountedPercentage,
            )} transition-all`}
          >
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-sm font-bold">
                  {t(
                    "fincheckInspectionOrderDataProductionStatus.accounted.label",
                  )}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-2xl font-black">
                  {accountedPercentage}
                </span>
                <Percent className="w-5 h-5" />
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mt-3 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  parseFloat(accountedPercentage) >= 100
                    ? "bg-green-500"
                    : parseFloat(accountedPercentage) >= 75
                      ? "bg-emerald-500"
                      : parseFloat(accountedPercentage) >= 50
                        ? "bg-yellow-500"
                        : parseFloat(accountedPercentage) >= 25
                          ? "bg-orange-500"
                          : "bg-red-500"
                }`}
                style={{
                  width: `${Math.min(parseFloat(accountedPercentage), 100)}%`,
                }}
              />
            </div>
          </div>

          {/* Validation Messages */}
          {parseInt(packingList.totalCartons) === 0 &&
            packingList.finishedCartons && (
              <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-300">
                  {t(
                    "fincheckInspectionOrderDataProductionStatus.validation.enterTotalCartons",
                  )}
                </p>
              </div>
            )}

          {parseInt(packingList.finishedCartons) >
            parseInt(packingList.totalCartons) &&
            parseInt(packingList.totalCartons) > 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-300">
                  {t(
                    "fincheckInspectionOrderDataProductionStatus.validation.finishedExceedsTotal",
                  )}
                </p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default YPivotQualityPlan;
