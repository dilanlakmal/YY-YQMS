import React, { useState, useMemo } from "react";
import {
  Search,
  FileSearch,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Calendar,
  Package,
  Users,
  Factory,
  Ruler,
  Target,
  Zap,
  Clock,
  Filter,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ArrowRight,
  Building2,
  ShoppingBag,
  ClipboardList,
  PieChart,
} from "lucide-react";

const QuickActions = ({ onAction, empId, collapsed = false }) => {
  const [expandedCategory, setExpandedCategory] = useState("recent");
  const [showAll, setShowAll] = useState(false);

  // Quick action categories with prompts
  const actionCategories = useMemo(
    () => [
      {
        id: "recent",
        title: "Recent Reports",
        icon: Clock,
        color: "from-blue-500 to-cyan-500",
        bgColor: "bg-blue-50 dark:bg-blue-900/20",
        borderColor: "border-blue-200 dark:border-blue-800",
        actions: [
          {
            label: "My Recent Reports",
            prompt: `Show me my 5 most recent inspection reports (empId: ${empId})`,
            icon: FileSearch,
          },
          {
            label: "Today's Inspections",
            prompt: "Show all inspection reports completed today",
            icon: Calendar,
          },
          {
            label: "Pending Reports",
            prompt: `Show my pending inspection reports that are in draft or in_progress status (empId: ${empId})`,
            icon: ClipboardList,
          },
          {
            label: "This Week's Summary",
            prompt:
              "Give me a summary of all inspections completed this week including pass/fail rates",
            icon: TrendingUp,
          },
        ],
      },
      {
        id: "aql",
        title: "AQL Analysis",
        icon: Target,
        color: "from-purple-500 to-pink-500",
        bgColor: "bg-purple-50 dark:bg-purple-900/20",
        borderColor: "border-purple-200 dark:border-purple-800",
        actions: [
          {
            label: "Failed AQL Reports",
            prompt:
              "Show me the most recent reports that failed AQL inspection",
            icon: XCircle,
          },
          {
            label: "Passed AQL Reports",
            prompt:
              "Show me AQL inspection reports that passed in the last 7 days",
            icon: CheckCircle,
          },
          {
            label: "Critical Defects",
            prompt: "Show reports with Critical defects in the last month",
            icon: AlertTriangle,
          },
          {
            label: "Major Defects Analysis",
            prompt:
              "What are the most common Major defects found across all inspections?",
            icon: BarChart3,
          },
          {
            label: "AQL vs Fixed Comparison",
            prompt:
              "Compare pass rates between AQL and Fixed inspection methods",
            icon: PieChart,
          },
        ],
      },
      {
        id: "defects",
        title: "Defect Analysis",
        icon: AlertTriangle,
        color: "from-orange-500 to-red-500",
        bgColor: "bg-orange-50 dark:bg-orange-900/20",
        borderColor: "border-orange-200 dark:border-orange-800",
        actions: [
          {
            label: "Top Defects",
            prompt:
              "What are the top 10 most common defects across all inspections?",
            icon: TrendingUp,
          },
          {
            label: "Defect by Buyer",
            prompt: "Show defect patterns grouped by buyer for the last month",
            icon: ShoppingBag,
          },
          {
            label: "Defect Trend",
            prompt:
              "Show me the defect trend over the last 30 days - are defects increasing or decreasing?",
            icon: BarChart3,
          },
          {
            label: "Zero Defect Reports",
            prompt: "Show me completed reports with zero defects",
            icon: CheckCircle,
          },
        ],
      },
      {
        id: "measurements",
        title: "Measurements",
        icon: Ruler,
        color: "from-green-500 to-emerald-500",
        bgColor: "bg-green-50 dark:bg-green-900/20",
        borderColor: "border-green-200 dark:border-green-800",
        actions: [
          {
            label: "Style Measurement Summary",
            prompt: "Show measurement summary for style: [Enter Style No]",
            icon: Ruler,
          },
          {
            label: "Failed Measurements",
            prompt: "Show me reports with failed measurement inspections",
            icon: XCircle,
          },
          {
            label: "Before Wash Analysis",
            prompt:
              "Show Before Wash measurement summary for style: [Enter Style No]",
            icon: Filter,
          },
          {
            label: "After Wash Analysis",
            prompt:
              "Show After Wash/Buyer Spec measurement summary for style: [Enter Style No]",
            icon: Filter,
          },
          {
            label: "Measurement Pass Rate",
            prompt:
              "What is the overall measurement pass rate across all inspections?",
            icon: Target,
          },
          {
            label: "Out of Tolerance Points",
            prompt:
              "Show me which measurement points are frequently out of tolerance",
            icon: AlertTriangle,
          },
        ],
      },
      {
        id: "buyers",
        title: "Buyer Analysis",
        icon: ShoppingBag,
        color: "from-indigo-500 to-violet-500",
        bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
        borderColor: "border-indigo-200 dark:border-indigo-800",
        actions: [
          {
            label: "Aritzia Reports",
            prompt:
              "Show me the latest 5 Aritzia inspection reports with their AQL results",
            icon: FileSearch,
          },
          {
            label: "Costco Reports",
            prompt: "Show me Costco inspection reports from this month",
            icon: FileSearch,
          },
          {
            label: "ANF Reports",
            prompt: "Show ANF inspection reports with defect summary",
            icon: FileSearch,
          },
          {
            label: "Reitmans Reports",
            prompt: "Show Reitmans inspection reports with defect summary",
            icon: FileSearch,
          },
          {
            label: "MWW Reports",
            prompt: "Show MWW inspection reports with defect summary",
            icon: FileSearch,
          },
          {
            label: "Elite Reports",
            prompt:
              "Show Elite Sub orders inspection reports with defect summary",
            icon: FileSearch,
          },
          {
            label: "Buyer Comparison",
            prompt: "Compare inspection pass rates across different buyers",
            icon: BarChart3,
          },
        ],
      },
      {
        id: "factories",
        title: "Factory & Supplier",
        icon: Factory,
        color: "from-teal-500 to-cyan-500",
        bgColor: "bg-teal-50 dark:bg-teal-900/20",
        borderColor: "border-teal-200 dark:border-teal-800",
        actions: [
          {
            label: "Factory Performance",
            prompt: "Which factories have the highest defect rates?",
            icon: Building2,
          },
          {
            label: "Subcon Analysis",
            prompt: "Show inspection results for subcontracted factories",
            icon: Factory,
          },
          {
            label: "Factory Trend",
            prompt:
              "Show quality trend for our main factories over the last month",
            icon: TrendingUp,
          },
        ],
      },
      {
        id: "inspectors",
        title: "Inspector Stats",
        icon: Users,
        color: "from-rose-500 to-pink-500",
        bgColor: "bg-rose-50 dark:bg-rose-900/20",
        borderColor: "border-rose-200 dark:border-rose-800",
        actions: [
          {
            label: "My Statistics",
            prompt: `Show my inspection statistics for the last 30 days (empId: ${empId})`,
            icon: BarChart3,
          },
          {
            label: "My Defect History",
            prompt: `What defects have I found most frequently? (empId: ${empId})`,
            icon: AlertTriangle,
          },
          {
            label: "Team Performance",
            prompt:
              "Compare inspection volumes and pass rates across all inspectors",
            icon: Users,
          },
        ],
      },
      {
        id: "orders",
        title: "Order Search",
        icon: Package,
        color: "from-amber-500 to-orange-500",
        bgColor: "bg-amber-50 dark:bg-amber-900/20",
        borderColor: "border-amber-200 dark:border-amber-800",
        actions: [
          {
            label: "Search by Order No",
            prompt:
              "Search for inspection report with Order number: [Enter Order No number]",
            icon: Search,
          },
          {
            label: "Search by Style",
            prompt:
              "Find all inspections for Customer style: [Enter Cust.Style]",
            icon: FileSearch,
          },
          {
            label: "Multi-Order Reports",
            prompt: "Show me multi-order or batch inspection reports",
            icon: Package,
          },
        ],
      },
    ],
    [empId],
  );

  // Featured/highlighted actions for the collapsed view
  const featuredActions = [
    {
      label: "Recent Reports",
      prompt: `Show me my 5 most recent inspection reports (empId: ${empId})`,
      icon: Clock,
      color: "from-blue-500 to-cyan-500",
    },
    {
      label: "Failed AQL",
      prompt: "Show me reports that failed AQL inspection this week",
      icon: XCircle,
      color: "from-red-500 to-orange-500",
    },
    {
      label: "Defect Analysis",
      prompt: "What are the top defects found today?",
      icon: AlertTriangle,
      color: "from-amber-500 to-yellow-500",
    },
    {
      label: "My Stats",
      prompt: `Show my inspection statistics for the last 30 days (empId: ${empId})`,
      icon: BarChart3,
      color: "from-purple-500 to-pink-500",
    },
  ];

  // Collapsed compact view
  if (collapsed) {
    return (
      <div className="flex flex-wrap gap-2 p-2">
        {featuredActions.map((action, idx) => (
          <button
            key={idx}
            onClick={() => onAction(action.prompt)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r ${action.color} text-white text-xs font-medium rounded-full shadow-sm hover:shadow-md hover:scale-105 transition-all`}
          >
            <action.icon size={12} />
            {action.label}
          </button>
        ))}
      </div>
    );
  }

  // Get visible categories
  const visibleCategories = showAll
    ? actionCategories
    : actionCategories.slice(0, 4);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider">
            Quick Actions
          </span>
        </div>
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-[10px] text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
        >
          {showAll ? "Show Less" : "Show All"}
          {showAll ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Categories */}
      <div className="space-y-2">
        {visibleCategories.map((category) => (
          <div
            key={category.id}
            className={`rounded-xl border ${category.borderColor} overflow-hidden transition-all duration-200`}
          >
            {/* Category Header */}
            <button
              onClick={() =>
                setExpandedCategory(
                  expandedCategory === category.id ? null : category.id,
                )
              }
              className={`w-full flex items-center justify-between p-3 ${category.bgColor} hover:opacity-90 transition-opacity`}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center shadow-sm`}
                >
                  <category.icon size={14} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {category.title}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 bg-white/50 dark:bg-gray-800/50 rounded-full text-gray-500">
                  {category.actions.length}
                </span>
              </div>
              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform duration-200 ${
                  expandedCategory === category.id ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Actions */}
            {expandedCategory === category.id && (
              <div className="p-2 bg-white dark:bg-gray-800/50 space-y-1 animate-slideDown">
                {category.actions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => onAction(action.prompt)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left transition-all group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:bg-gray-200 dark:group-hover:bg-gray-600 transition-colors">
                      <action.icon
                        size={14}
                        className="text-gray-500 dark:text-gray-400"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {action.label}
                      </p>
                      <p className="text-[10px] text-gray-400 truncate">
                        {action.prompt.substring(0, 50)}...
                      </p>
                    </div>
                    <ArrowRight
                      size={14}
                      className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pro Tips */}
      <div className="mt-4 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800/50">
        <div className="flex items-start gap-2">
          <Sparkles className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 mb-1">
              Pro Tip
            </p>
            <p className="text-[10px] text-indigo-600/70 dark:text-indigo-400/70 leading-relaxed">
              You can ask specific questions like "Calculate AQL for report
              7582054152" or "Compare defects between Aritzia and Reitmans this
              month"
            </p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 500px;
          }
        }
        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

export default QuickActions;
