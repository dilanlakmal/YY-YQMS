import React, { useMemo } from "react";
import {
  Edit3,
  CheckCircle2,
  XCircle,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  BarChart3,
  Trash2,
  Layers,
  Lock,
  Star,
  List,
  Shield,
  AlertCircle,
  MessageSquare,
  Package,
  Percent,
  Award,
  Activity,
  PieChart,
} from "lucide-react";
import { checkTolerance } from "./YPivotQATemplatesHelpers";
import { useTranslation } from "react-i18next";

const YPivotQATemplatesMeasurementResultsTab = ({
  savedMeasurements,
  specsData,
  selectedSpecsList,
  onEditMeasurement,
  onDeleteMeasurement,
  activeGroup,
}) => {
  const { t } = useTranslation();
  // Group measurements by size (combining All and Critical)
  const groupedBySize = useMemo(() => {
    const sizeGroups = {};

    savedMeasurements.forEach((m, index) => {
      const key = `${m.groupId || "none"}_${m.size}_${m.kValue || ""}`;

      if (!sizeGroups[key]) {
        sizeGroups[key] = {
          size: m.size,
          kValue: m.kValue,
          groupId: m.groupId,
          lineName: m.lineName,
          tableName: m.tableName,
          colorName: m.colorName,
          qcUser: m.qcUser,
          allData: null,
          criticalData: null,
          originalIndex: index,
          inspectorDecision: m.inspectorDecision,
          systemDecision: m.systemDecision,
          remark: m.remark,
          timestamp: m.timestamp,
        };
      }

      // Since new structure combines all data in one entry
      sizeGroups[key] = {
        ...sizeGroups[key],
        allData:
          m.allMeasurements && Object.keys(m.allMeasurements).length > 0
            ? {
                measurements: m.allMeasurements,
                enabledPcs: m.allEnabledPcs || [],
                qty: m.allQty || 1,
              }
            : null,
        criticalData:
          m.criticalMeasurements &&
          Object.keys(m.criticalMeasurements).length > 0
            ? {
                measurements: m.criticalMeasurements,
                enabledPcs: m.criticalEnabledPcs || [],
                qty: m.criticalQty || 2,
              }
            : null,
        inspectorDecision: m.inspectorDecision,
        systemDecision: m.systemDecision,
        remark: m.remark,
        timestamp: m.timestamp,
        originalIndex: index,
        rawData: m,
      };
    });

    return Object.values(sizeGroups);
  }, [savedMeasurements]);

  // Group by context
  const groupedByContext = useMemo(() => {
    const groups = {};
    const noContext = [];

    groupedBySize.forEach((item) => {
      if (item.groupId) {
        if (!groups[item.groupId]) {
          groups[item.groupId] = {
            id: item.groupId,
            lineName: item.lineName,
            tableName: item.tableName,
            colorName: item.colorName,
            qcUser: item.qcUser,
            items: [],
          };
        }
        groups[item.groupId].items.push(item);
      } else {
        noContext.push(item);
      }
    });

    return { groups: Object.values(groups), noContext };
  }, [groupedBySize]);

  if (!savedMeasurements || savedMeasurements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <BarChart3 className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-bold text-gray-600 dark:text-gray-400 mb-2">
          {t("fincheckInspectionMeasurementResult.empty.title")}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-500 text-center max-w-md">
          {t("fincheckInspectionMeasurementResult.empty.description")}
        </p>
      </div>
    );
  }

  // Helper to filter specs by K value
  const getFilteredSpecs = (specs, kValue) => {
    if (kValue) {
      return specs.filter((s) => s.kValue === kValue || s.kValue === "NA");
    }
    return specs;
  };

  // Calculate stats with correct logic
  // - Total Points = ALL specs count × enabled pcs (not just touched ones)
  // - If value is 0 (default/not touched) = Pass Point
  // - If value is touched and within tolerance = Pass Point
  // - If value is touched and out of tolerance = Fail Point
  // - Pass Pcs = Pcs where ALL points are pass
  // - Fail Pcs = Pcs where at least 1 point is fail
  const calculateSubStats = (measurements, enabledPcsSet, specs, size) => {
    // Convert Set to Array for safe iteration/length check
    const enabledPcs = Array.from(enabledPcsSet || []);

    if (!measurements || enabledPcs.length === 0 || specs.length === 0) {
      return {
        totalPoints: 0,
        passPoints: 0,
        failPoints: 0,
        totalPcs: 0,
        passPcs: 0,
        failPcs: 0,
        pointPassRate: "0.00",
        pcsPassRate: "0.00",
      };
    }

    const totalPcs = enabledPcs.length;
    let passPcs = 0;
    let failPcs = 0;

    const totalPoints = specs.length * totalPcs;
    let passPoints = 0;
    let failPoints = 0;

    enabledPcs.forEach((pcsIndex) => {
      let pcsHasFail = false;

      specs.forEach((spec) => {
        const val = measurements[spec.id]?.[pcsIndex];

        if (!val || val.decimal === 0) {
          passPoints++;
        } else {
          const toleranceResult = checkTolerance(spec, val.decimal, size);
          if (toleranceResult.isWithin || toleranceResult.isDefault) {
            passPoints++;
          } else {
            failPoints++;
            pcsHasFail = true;
          }
        }
      });

      if (pcsHasFail) {
        failPcs++;
      } else {
        passPcs++;
      }
    });

    const pointPassRate =
      totalPoints > 0 ? (passPoints / totalPoints) * 100 : 0;
    const pcsPassRate = totalPcs > 0 ? (passPcs / totalPcs) * 100 : 0;

    return {
      totalPoints,
      passPoints,
      failPoints,
      totalPcs,
      passPcs,
      failPcs,
      pointPassRate: pointPassRate.toFixed(2),
      pcsPassRate: pcsPassRate.toFixed(2),
    };
  };

  // Render stats section with icons and progress bars
  const renderStatsSection = (stats, colorScheme) => {
    if (!stats) return null;

    const colors = {
      indigo: {
        bg: "bg-indigo-100 dark:bg-indigo-900/30",
        text: "text-indigo-600 dark:text-indigo-400",
        border: "border-indigo-200 dark:border-indigo-700",
      },
      amber: {
        bg: "bg-amber-100 dark:bg-amber-900/30",
        text: "text-amber-600 dark:text-amber-400",
        border: "border-amber-200 dark:border-amber-700",
      },
    };

    const scheme = colors[colorScheme] || colors.indigo;

    return (
      <div className="space-y-3">
        {/* Points Stats */}
        <div className="grid grid-cols-3 gap-1 text-center">
          <div className="bg-white dark:bg-gray-800 rounded p-1.5">
            <Target className="w-3 h-3 mx-auto text-gray-500 mb-0.5" />
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {stats.totalPoints}
            </p>
            <p className="text-[9px] text-gray-500">
              {t("fincheckInspectionMeasurementResult.stats.totalPts")}
            </p>
          </div>
          <div className="bg-green-100 dark:bg-green-900/30 rounded p-1.5">
            <CheckCircle2 className="w-3 h-3 mx-auto text-green-500 mb-0.5" />
            <p className="text-sm font-bold text-green-600">
              {stats.passPoints}
            </p>
            <p className="text-[9px] text-green-600">
              {t("fincheckInspectionMeasurementResult.stats.passPts")}
            </p>
          </div>
          <div className="bg-red-100 dark:bg-red-900/30 rounded p-1.5">
            <XCircle className="w-3 h-3 mx-auto text-red-500 mb-0.5" />
            <p className="text-sm font-bold text-red-600">{stats.failPoints}</p>
            <p className="text-[9px] text-red-600">
              {t("fincheckInspectionMeasurementResult.stats.failPts")}
            </p>
          </div>
        </div>

        {/* Pcs Stats */}
        <div className="grid grid-cols-3 gap-1 text-center">
          <div className="bg-white dark:bg-gray-800 rounded p-1.5">
            <Package className="w-3 h-3 mx-auto text-gray-500 mb-0.5" />
            <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {stats.totalPcs}
            </p>
            <p className="text-[9px] text-gray-500">
              {t("fincheckInspectionMeasurementResult.stats.totalPcs")}
            </p>
          </div>
          <div className="bg-green-100 dark:bg-green-900/30 rounded p-1.5">
            <Award className="w-3 h-3 mx-auto text-green-500 mb-0.5" />
            <p className="text-sm font-bold text-green-600">{stats.passPcs}</p>
            <p className="text-[9px] text-green-600">
              {t("fincheckInspectionMeasurementResult.stats.passPcs")}
            </p>
          </div>
          <div className="bg-red-100 dark:bg-red-900/30 rounded p-1.5">
            <XCircle className="w-3 h-3 mx-auto text-red-500 mb-0.5" />
            <p className="text-sm font-bold text-red-600">{stats.failPcs}</p>
            <p className="text-[9px] text-red-600">
              {t("fincheckInspectionMeasurementResult.stats.failPcs")}
            </p>
          </div>
        </div>

        {/* Pass Rates with Progress Bars */}
        <div className={`space-y-2 pt-2 border-t ${scheme.border}`}>
          {/* Point Pass Rate */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <Activity className="w-3 h-3" />{" "}
                {t("fincheckInspectionMeasurementResult.stats.pointPassRate")}
              </span>
              <span
                className={`text-xs font-bold ${
                  parseFloat(stats.pointPassRate) >= 95
                    ? "text-green-600"
                    : parseFloat(stats.pointPassRate) >= 80
                      ? "text-amber-600"
                      : "text-red-600"
                }`}
              >
                {stats.pointPassRate}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  parseFloat(stats.pointPassRate) >= 95
                    ? "bg-gradient-to-r from-green-400 to-green-500"
                    : parseFloat(stats.pointPassRate) >= 80
                      ? "bg-gradient-to-r from-amber-400 to-amber-500"
                      : "bg-gradient-to-r from-red-400 to-red-500"
                }`}
                style={{
                  width: `${Math.min(100, parseFloat(stats.pointPassRate))}%`,
                }}
              />
            </div>
          </div>

          {/* Pcs Pass Rate */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <PieChart className="w-3 h-3" />{" "}
                {t("fincheckInspectionMeasurementResult.stats.pcsPassRate")}
              </span>
              <span
                className={`text-xs font-bold ${
                  parseFloat(stats.pcsPassRate) === 100
                    ? "text-green-600"
                    : parseFloat(stats.pcsPassRate) >= 50
                      ? "text-amber-600"
                      : "text-red-600"
                }`}
              >
                {stats.pcsPassRate}%
              </span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  parseFloat(stats.pcsPassRate) === 100
                    ? "bg-gradient-to-r from-green-400 to-green-500"
                    : parseFloat(stats.pcsPassRate) >= 50
                      ? "bg-gradient-to-r from-amber-400 to-amber-500"
                      : "bg-gradient-to-r from-red-400 to-red-500"
                }`}
                style={{
                  width: `${Math.min(100, parseFloat(stats.pcsPassRate))}%`,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSizeCard = (item, isEditable) => {
    // FIX: Check .size for Sets
    const allSet = item.allData?.enabledPcs;
    const critSet = item.criticalData?.enabledPcs;

    const hasAll =
      allSet && (allSet instanceof Set ? allSet.size > 0 : allSet.length > 0);
    const hasCritical =
      critSet &&
      (critSet instanceof Set ? critSet.size > 0 : critSet.length > 0);

    const allStats = hasAll
      ? calculateSubStats(
          item.allData.measurements,
          item.allData.enabledPcs,
          getFilteredSpecs(specsData, item.kValue),
          item.size,
        )
      : null;

    const criticalStats = hasCritical
      ? calculateSubStats(
          item.criticalData.measurements,
          item.criticalData.enabledPcs,
          getFilteredSpecs(selectedSpecsList, item.kValue),
          item.size,
        )
      : null;

    // Calculate overall stats for the card header
    const overallFailPcs =
      (allStats?.failPcs || 0) + (criticalStats?.failPcs || 0);
    const overallTotalPcs =
      (allStats?.totalPcs || 0) + (criticalStats?.totalPcs || 0);

    return (
      <div
        key={`${item.size}_${item.kValue || ""}`}
        className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg border overflow-hidden hover:shadow-xl transition-all ${
          isEditable
            ? "border-gray-200 dark:border-gray-700"
            : "border-gray-300 dark:border-gray-600 opacity-75"
        }`}
      >
        {/* Card Header */}
        <div
          className={`p-3 ${
            item.inspectorDecision === "pass"
              ? isEditable
                ? "bg-gradient-to-r from-green-500 to-emerald-600"
                : "bg-gray-500"
              : isEditable
                ? "bg-gradient-to-r from-red-500 to-rose-600"
                : "bg-gray-500"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-white font-bold text-lg flex items-center gap-2">
                {t("fincheckInspectionMeasurementResult.card.size")} {item.size}
                {!isEditable && <Lock className="w-3 h-3 text-gray-300" />}
              </h4>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {item.kValue && (
                  <span className="text-[10px] bg-white/20 text-white px-2 py-0.5 rounded-full">
                    K: {item.kValue}
                  </span>
                )}
                {overallTotalPcs > 0 && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      overallFailPcs > 0
                        ? "bg-red-500/50 text-white"
                        : "bg-green-500/50 text-white"
                    }`}
                  >
                    {overallFailPcs} / {overallTotalPcs}{" "}
                    {t("fincheckInspectionMeasurementResult.card.fail")}
                  </span>
                )}

                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                    item.systemDecision === "pass"
                      ? "bg-green-300 text-green-800"
                      : item.systemDecision === "fail"
                        ? "bg-red-300 text-red-800"
                        : "bg-white/30 text-white"
                  }`}
                >
                  {item.systemDecision === "pass" ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : item.systemDecision === "fail" ? (
                    <XCircle className="w-3 h-3" />
                  ) : (
                    <AlertCircle className="w-3 h-3" />
                  )}
                  Sys:{" "}
                  {(
                    item.systemDecision ||
                    t("fincheckInspectionMeasurementResult.status.pending")
                  ).toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  isEditable &&
                  onEditMeasurement(item.rawData, item.originalIndex)
                }
                disabled={!isEditable}
                className={`p-1.5 rounded-full transition-colors ${
                  isEditable
                    ? "bg-white/20 hover:bg-white/30 text-white"
                    : "bg-black/10 text-gray-300 cursor-not-allowed"
                }`}
                title={
                  isEditable
                    ? t("fincheckInspectionMeasurementResult.actions.edit")
                    : t("fincheckInspectionMeasurementResult.actions.locked")
                }
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() =>
                  isEditable && onDeleteMeasurement(item.originalIndex)
                }
                disabled={!isEditable}
                className={`p-1.5 rounded-full transition-colors ${
                  isEditable
                    ? "bg-white/20 hover:bg-red-500 text-white"
                    : "bg-black/10 text-gray-300 cursor-not-allowed"
                }`}
                title={
                  isEditable
                    ? t("fincheckInspectionMeasurementResult.actions.delete")
                    : t("fincheckInspectionMeasurementResult.actions.locked")
                }
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-3 space-y-3">
          {/* Sub-cards for All and Critical */}
          <div className="grid grid-cols-1 gap-3">
            {/* All Points Sub-card */}
            <div
              className={`p-3 rounded-xl border-2 ${
                hasAll
                  ? "border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-50"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <List className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-bold text-indigo-700 dark:text-indigo-400">
                  {t("fincheckInspectionMeasurementResult.sections.allPoints")}
                </span>
                {hasAll && (
                  <span className="ml-auto text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded font-bold">
                    {item.allData.enabledPcs.length}{" "}
                    {t(
                      "fincheckInspectionMeasurementResult.sections.pcsChecked",
                    )}
                  </span>
                )}
              </div>
              {hasAll && allStats ? (
                renderStatsSection(allStats, "indigo")
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="w-6 h-6 mx-auto text-gray-300 mb-1" />
                  <p className="text-xs text-gray-400 italic">
                    {t(
                      "fincheckInspectionMeasurementResult.sections.noAllData",
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Critical Points Sub-card */}
            <div
              className={`p-3 rounded-xl border-2 ${
                hasCritical
                  ? "border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20"
                  : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 opacity-50"
              }`}
            >
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-amber-500 fill-current" />
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                  {t(
                    "fincheckInspectionMeasurementResult.sections.criticalPoints",
                  )}
                </span>
                {hasCritical && (
                  <span className="ml-auto text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-bold">
                    {item.criticalData.enabledPcs.length}{" "}
                    {t(
                      "fincheckInspectionMeasurementResult.sections.pcsChecked",
                    )}
                  </span>
                )}
              </div>
              {hasCritical && criticalStats ? (
                renderStatsSection(criticalStats, "amber")
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="w-6 h-6 mx-auto text-gray-300 mb-1" />
                  <p className="text-xs text-gray-400 italic">
                    {t(
                      "fincheckInspectionMeasurementResult.sections.noCriticalData",
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Inspector Decision Display */}
          <div className="flex items-center justify-between p-2.5 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2">
              <Shield
                className={`w-4 h-4 ${
                  item.inspectorDecision === "pass"
                    ? "text-green-500"
                    : "text-red-500"
                }`}
              />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {t("fincheckInspectionMeasurementResult.decision.inspector")}
              </span>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded flex items-center gap-1 ${
                item.inspectorDecision === "pass"
                  ? "bg-green-500 text-white"
                  : "bg-red-500 text-white"
              }`}
            >
              {item.inspectorDecision === "pass" ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : (
                <XCircle className="w-3 h-3" />
              )}
              {(item.inspectorDecision || "PASS").toUpperCase()}
            </span>
          </div>

          {/* Remark */}
          {item.remark && (
            <div className="flex items-start gap-2 p-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
              <MessageSquare className="w-3.5 h-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-0.5">
                  {t("fincheckInspectionMeasurementResult.card.remark")}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 break-words">
                  {item.remark}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="px-3 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
          <p className="text-[10px] text-gray-400 text-center flex items-center justify-center gap-1">
            <Activity className="w-3 h-3" />
            {new Date(item.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    );
  };

  // Calculate summary stats for each group
  const calculateGroupSummary = (items) => {
    let totalPoints = 0;
    let passPoints = 0;
    let failPoints = 0;
    let totalPcs = 0;
    let passPcs = 0;
    let failPcs = 0;

    items.forEach((item) => {
      // All points stats
      if (item.allData && item.allData.enabledPcs.length > 0) {
        const allStats = calculateSubStats(
          item.allData.measurements,
          item.allData.enabledPcs,
          //specsData,
          getFilteredSpecs(specsData, item.kValue),
          item.size,
        );
        totalPoints += allStats.totalPoints;
        passPoints += allStats.passPoints;
        failPoints += allStats.failPoints;
        totalPcs += allStats.totalPcs;
        passPcs += allStats.passPcs;
        failPcs += allStats.failPcs;
      }

      // Critical points stats
      if (item.criticalData && item.criticalData.enabledPcs.length > 0) {
        const critStats = calculateSubStats(
          item.criticalData.measurements,
          item.criticalData.enabledPcs,
          //selectedSpecsList,
          getFilteredSpecs(selectedSpecsList, item.kValue),
          item.size,
        );
        totalPoints += critStats.totalPoints;
        passPoints += critStats.passPoints;
        failPoints += critStats.failPoints;
        totalPcs += critStats.totalPcs;
        passPcs += critStats.passPcs;
        failPcs += critStats.failPcs;
      }
    });

    return {
      totalPoints,
      passPoints,
      failPoints,
      totalPcs,
      passPcs,
      failPcs,
      pointPassRate:
        totalPoints > 0
          ? ((passPoints / totalPoints) * 100).toFixed(2)
          : "0.00",
      pcsPassRate:
        totalPcs > 0 ? ((passPcs / totalPcs) * 100).toFixed(2) : "0.00",
    };
  };

  return (
    <div className="p-4 space-y-6 max-w-6xl mx-auto">
      {/* Overall Summary Card */}
      {groupedBySize.length > 0 && (
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-4 shadow-lg text-white">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5" />
            <h3 className="font-bold text-lg">
              {t("fincheckInspectionMeasurementResult.summary.title")}
            </h3>
          </div>
          {(() => {
            const summary = calculateGroupSummary(groupedBySize);
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/20 rounded-xl p-3 text-center">
                  <Target className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{summary.totalPoints}</p>
                  <p className="text-xs opacity-80">
                    {t("fincheckInspectionMeasurementResult.stats.totalPcs")}
                  </p>
                </div>
                <div className="bg-white/20 rounded-xl p-3 text-center">
                  <Package className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{summary.totalPcs}</p>
                  <p className="text-xs opacity-80">
                    {t("fincheckInspectionMeasurementResult.stats.passPcs")}
                  </p>
                </div>
                <div className="bg-white/20 rounded-xl p-3 text-center">
                  <Activity className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{summary.pointPassRate}%</p>
                  <p className="text-xs opacity-80">
                    {t(
                      "fincheckInspectionMeasurementResult.stats.pointPassRate",
                    )}
                  </p>
                </div>
                <div className="bg-white/20 rounded-xl p-3 text-center">
                  <PieChart className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-2xl font-bold">{summary.pcsPassRate}%</p>
                  <p className="text-xs opacity-80">
                    {t("fincheckInspectionMeasurementResult.stats.pcsPassRate")}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {groupedByContext.groups.map((group) => {
        const isGroupActive = activeGroup && activeGroup.id === group.id;

        const headerParts = [
          group.lineName
            ? `${t("fincheckInspectionMeasurementResult.group.line")} ${group.lineName}`
            : null,
          group.tableName
            ? `${t("fincheckInspectionMeasurementResult.group.table")} ${group.tableName}`
            : null,
          group.colorName
            ? `${t("fincheckInspectionMeasurementResult.group.color")} ${group.colorName}`
            : null,
        ].filter(Boolean);
        const headerLabel =
          headerParts.length > 0
            ? headerParts.join(" / ")
            : t("fincheckInspectionMeasurementResult.group.session");

        const groupSummary = calculateGroupSummary(group.items);

        return (
          <div key={group.id} className="space-y-3">
            <div
              className={`flex flex-col sm:flex-row sm:items-center gap-3 pb-3 border-b-2 ${
                isGroupActive
                  ? "border-green-500"
                  : "border-gray-200 dark:border-gray-700"
              }`}
            >
              <div className="flex items-center gap-3 flex-1">
                <div
                  className={`p-2 rounded-lg ${
                    isGroupActive
                      ? "bg-green-100 text-green-600"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Layers className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4
                    className={`text-sm font-bold truncate ${
                      isGroupActive
                        ? "text-green-700 dark:text-green-400"
                        : "text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {headerLabel}
                  </h4>
                  {group.qcUser && (
                    <p className="text-xs text-gray-500 truncate">
                      {t("fincheckInspectionMeasurementResult.group.qc")}{" "}
                      {group.qcUser.eng_name}
                    </p>
                  )}
                </div>
              </div>

              {/* Group Summary Stats */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded flex items-center gap-1">
                  <Target className="w-3 h-3 text-gray-500" />
                  <span className="font-bold">
                    {groupSummary.pointPassRate}%
                  </span>
                  <span className="text-gray-500">
                    {t("fincheckInspectionMeasurementResult.units.pts")}
                  </span>
                </div>
                <div className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded flex items-center gap-1">
                  <Package className="w-3 h-3 text-gray-500" />
                  <span className="font-bold">{groupSummary.pcsPassRate}%</span>
                  <span className="text-gray-500">
                    {t("fincheckInspectionMeasurementResult.units.pcs")}
                  </span>
                </div>
                {isGroupActive ? (
                  <span className="text-xs bg-green-500 text-white px-2 py-1 rounded font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {t("fincheckInspectionMeasurementResult.group.active")}
                  </span>
                ) : (
                  <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 px-2 py-1 rounded font-bold flex items-center gap-1">
                    <Lock className="w-3 h-3" />{" "}
                    {t("fincheckInspectionMeasurementResult.actions.locked")}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.items.map((item) => renderSizeCard(item, isGroupActive))}
            </div>
          </div>
        );
      })}

      {groupedByContext.noContext.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 pb-2 border-b-2 border-gray-200 dark:border-gray-700">
            <div className="p-2 bg-gray-100 text-gray-500 rounded-lg">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-gray-600 dark:text-gray-300">
              {t("fincheckInspectionMeasurementResult.group.general")}
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupedByContext.noContext.map((item) =>
              renderSizeCard(item, !activeGroup),
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default YPivotQATemplatesMeasurementResultsTab;
