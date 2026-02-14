import React, { useState } from "react";
import {
  Users,
  Layers,
  ChevronRight,
  LayoutDashboard,
  PieChart,
  ShoppingBag,
} from "lucide-react";
import FincheckAnalyticsQASummary from "./QASummary/FincheckAnalyticsQASummary";
import FincheckAnalyticsStyleSummary from "./StyleSummary/FincheckAnalyticsStyleSummary";
import FincheckAnalyticsBuyerSummary from "./BuyerSummary/FincheckAnalyticsBuyerSummary";

// Placeholder for Style Summary (Unchanged)
const StyleSummaryPlaceholder = () => (
  <div className="flex flex-col items-center justify-center h-96 text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 animate-fadeIn">
    <Layers className="w-16 h-16 mb-4 opacity-20" />
    <h3 className="text-lg font-bold">Style Summary Analytics</h3>
    <p className="text-sm">This module is under development.</p>
  </div>
);

// Placeholder for Total Summary (Unchanged)
const TotalSummaryPlaceholder = () => (
  <div className="flex flex-col items-center justify-center h-96 text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700 animate-fadeIn">
    <PieChart className="w-16 h-16 mb-4 opacity-20" />
    <h3 className="text-lg font-bold">Total Operational Summary</h3>
    <p className="text-sm">This module is under development.</p>
  </div>
);

const FincheckAnalyticsReport = () => {
  const [activeView, setActiveView] = useState("qa-summary");

  const menuItems = [
    {
      id: "qa-summary",
      label: "QA Summary",
      icon: Users,
      component: <FincheckAnalyticsQASummary />,
      color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20",
    },
    {
      id: "style-summary",
      label: "Style Summary",
      icon: Layers,
      component: <FincheckAnalyticsStyleSummary />,
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
    },

    {
      id: "buyer-summary",
      label: "Buyer Summary",
      icon: ShoppingBag, // Changed Icon to distinct from Style
      component: <FincheckAnalyticsBuyerSummary />, // <--- Connected Component
      color: "text-blue-600 bg-blue-50 dark:bg-blue-900/20", // Adjusted color
    },
    {
      id: "total-summary",
      label: "Total Summary",
      icon: PieChart,
      component: <TotalSummaryPlaceholder />,
      color: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
    },
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:gap-6 h-full overflow-hidden animate-fadeIn pb-2">
      {/* 
          1. NAVIGATION PANEL 
          - Mobile: Top horizontal bar, white background, border bottom.
          - Desktop (lg): Left vertical sidebar, w-64, full height.
      */}
      <div className="w-full lg:w-64 shrink-0 lg:h-full bg-white dark:bg-gray-800 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-700 lg:bg-transparent lg:dark:bg-transparent lg:overflow-y-auto no-scrollbar z-40">
        {/* Inner Container: On Desktop adds padding/card styling. On Mobile it's plain. */}
        <div className="lg:bg-white lg:dark:bg-gray-800 lg:rounded-2xl lg:shadow-lg lg:border lg:border-gray-200 lg:dark:border-gray-700 lg:p-4 min-h-min">
          {/* Header Title: Hidden on Mobile, Visible on Desktop */}
          <div className="hidden lg:flex items-center gap-2 mb-6 px-2">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white shadow-md">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-gray-800 dark:text-white tracking-tight">
              Total Analytics
            </h2>
          </div>

          {/* Buttons Container: Horizontal Row on Mobile, Vertical Stack on Desktop */}
          <div className="flex flex-row lg:flex-col items-center lg:items-stretch justify-around lg:justify-start lg:space-y-2 p-2 lg:p-0">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`
                  relative group transition-all duration-300
                  /* Mobile Styles: Flex Col (Icon Top, Text Bottom), Flex-1 (Equal Width) */
                  flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg
                  /* Desktop Styles: Flex Row (Icon Left, Text Right), Standard Padding */
                  lg:flex-row lg:justify-between lg:p-3 lg:rounded-xl lg:w-full
                  ${
                    activeView === item.id
                      ? "bg-gray-50 lg:bg-gray-100 dark:bg-gray-700/50 lg:shadow-sm lg:ring-1 ring-gray-200 dark:ring-gray-600"
                      : "hover:bg-gray-50 dark:hover:bg-gray-700/30"
                  }
                `}
              >
                {/* Content Wrapper */}
                <div className="flex flex-col lg:flex-row items-center gap-1.5 lg:gap-3">
                  {/* Icon Box */}
                  <div
                    className={`p-1.5 lg:p-2 rounded-lg transition-colors ${
                      activeView === item.id
                        ? item.color
                        : "text-gray-400 lg:bg-gray-100 lg:dark:bg-gray-800"
                    }`}
                  >
                    <item.icon className="w-5 h-5 lg:w-4 lg:h-4" />
                  </div>

                  {/* Label */}
                  <span
                    className={`
                      font-bold leading-tight text-center lg:text-left
                      /* Mobile Font: Very Small */
                      text-[10px] 
                      /* Desktop Font: Normal Small */
                      lg:text-sm
                      ${
                        activeView === item.id
                          ? "text-gray-900 dark:text-white"
                          : "text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                      }
                    `}
                  >
                    {item.label}
                  </span>
                </div>

                {/* Arrow: Hidden on Mobile, Visible on Desktop */}
                {activeView === item.id && (
                  <ChevronRight className="hidden lg:block w-4 h-4 text-gray-400 animate-slideRight" />
                )}

                {/* Active Indicator Line (Mobile Only) */}
                {activeView === item.id && (
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-indigo-500 rounded-full lg:hidden"></div>
                )}
              </button>
            ))}
          </div>

          {/* Info Card: Hidden on Mobile */}
          <div className="hidden lg:block mt-8 p-4 bg-gradient-to-br from-gray-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-xl border border-indigo-100 dark:border-gray-600">
            <p className="text-xs font-medium text-gray-600 dark:text-gray-300 leading-relaxed">
              Select a module to view detailed performance metrics and defect
              analysis.
            </p>
          </div>
        </div>
      </div>

      {/* 
          2. MAIN CONTENT AREA 
          - Padded on top for mobile to account for sticky headers if any, 
            but here handled by flex layout.
          - lg:w-auto to fill remaining space.
      */}
      <div className="flex-1 min-w-0 h-full overflow-y-auto custom-scrollbar p-3 lg:pr-2 lg:pl-0">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className={activeView === item.id ? "block" : "hidden"}
          >
            {item.component}
          </div>
        ))}
      </div>

      <style jsx>{`
        @keyframes slideRight {
          from {
            transform: translateX(-5px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slideRight {
          animation: slideRight 0.3s ease-out;
        }

        /* Scrollbar styling */
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 20px;
        }
      `}</style>
    </div>
  );
};

export default FincheckAnalyticsReport;
