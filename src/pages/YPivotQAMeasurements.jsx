import React, { useMemo, useState } from "react";
import {
  Shield,
  Sparkles,
  User,
  ShoppingCart, // Main: YorkSys Orders
  Upload, // Main: Spec Upload
  Printer, // Main: Print
  UploadCloud, // Sub: Upload
  View, // Sub: View
  Layers, // Sub: Product Type
  Ruler,
  FileText,
  Scissors,
  Pencil,
} from "lucide-react";
import { useAuth } from "../components/authentication/AuthContext";

// --- EXTERNAL COMPONENT IMPORTS ---
import UploadYorksysOrders from "./UploadYorksysOrders";
import UploadWashingSpecs from "./UploadWashingSpecs";
import Measurement from "./Measurement";
import QASectionsMeasurementSpecsSelection from "../components/inspection/PivotY/QAMeasurement/QASectionsMeasurementSpecsSelection";
import QASectionsMeasurementAWSelection from "../components/inspection/PivotY/QAMeasurement/QASectionsMeasurementAWSelection";
import ModifyDTSpec from "../components/inspection/PivotY/QAMeasurement/ModifyDTSpec";

// --- PLACEHOLDER ---
const PlaceholderComponent = ({ title, icon: Icon }) => {
  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg min-h-[400px] flex flex-col justify-center items-center text-center animate-fadeIn">
      <div className="mb-6 p-6 bg-indigo-50 dark:bg-indigo-900/30 rounded-full">
        <Icon
          size={64}
          strokeWidth={1.5}
          className="text-indigo-500 dark:text-indigo-400"
        />
      </div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-3">
        {title}
      </h2>
      <p className="text-gray-500 dark:text-gray-400 max-w-md">
        This section is currently under development.
      </p>
    </div>
  );
};

// --- MAIN COMPONENT ---
const YPivotQAMeasurements = () => {
  const { user } = useAuth();

  // State for Main Tabs
  const [activeTab, setActiveTab] = useState("yorksys-orders");

  // State for Sub Tabs (Specific to YorkSys Orders)
  const [activeYorksysSubTab, setActiveYorksysSubTab] = useState("upload");

  // --- Configuration: Main Tabs ---
  const tabs = useMemo(
    () => [
      {
        id: "yorksys-orders",
        label: "YorkSys Orders",
        icon: <ShoppingCart size={20} />,
        component: <UploadYorksysOrders activeSubTab={activeYorksysSubTab} />, // Pass subTab state!
        description: "Manage Buyer Specs & Orders",
      },
      {
        id: "spec-upload",
        label: "BW/AW Spec Upload",
        icon: <Upload size={20} />,
        component: <UploadWashingSpecs />,
        description: "Upload Washing Specifications",
      },
      {
        id: "measurement-print",
        label: "MES. Print",
        icon: <Printer size={20} />,
        component: <Measurement />,
        description: "Print Measurement Reports",
      },
      {
        id: "qa-spec-selection",
        label: "BW Mes. Specs",
        icon: <Ruler size={20} />,
        component: <QASectionsMeasurementSpecsSelection />,
        description: "Select and Config Measurement Specs",
      },
      {
        id: "qa-aw-spec-selection",
        label: "AW Mes. Specs",
        icon: <FileText size={20} />,
        component: <QASectionsMeasurementAWSelection />,
        description: "Select Measurement Specs (After Wash)",
      },
      {
        id: "modify-dt-measurement",
        label: "Modify DT Spec",
        icon: <Pencil size={20} />,
        component: <ModifyDTSpec />,
        description: "Select Measurement Specs (After Wash)",
      },
    ],
    [activeYorksysSubTab], // Dependency added so component updates when subTab changes
  );

  // --- Configuration: Sub Tabs (YorkSys Only) ---
  const yorksysSubTabs = useMemo(
    () => [
      { id: "upload", label: "Upload Order", icon: <UploadCloud size={20} /> },
      { id: "view", label: "View Orders", icon: <View size={20} /> },
      { id: "productType", label: "Product Type", icon: <Layers size={20} /> },
      {
        id: "ribContent",
        label: "RIB Content",
        icon: <Scissors size={20} />,
      },
    ],
    [],
  );

  const activeComponent = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab)?.component || null;
  }, [activeTab, tabs]);

  const activeTabData = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab);
  }, [activeTab, tabs]);

  const activeSubTabData = useMemo(() => {
    if (activeTab === "yorksys-orders") {
      return yorksysSubTabs.find((t) => t.id === activeYorksysSubTab);
    }
    return null;
  }, [activeTab, activeYorksysSubTab, yorksysSubTabs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 text-gray-800 dark:text-gray-200">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>

        <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-5">
          {/* ======================= */}
          {/* MOBILE/TABLET LAYOUT (< lg) */}
          {/* ======================= */}
          <div className="lg:hidden space-y-3">
            {/* Top Row: Title + User */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg shadow-lg flex-shrink-0">
                  <Shield size={20} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                      Fin Check | Measurements
                    </h1>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full flex-shrink-0">
                      <Sparkles size={10} className="text-yellow-300" />
                      <span className="text-[10px] font-bold text-white">
                        PRO
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-xs text-indigo-100 font-medium truncate">
                    QA Measurement System
                  </p>
                </div>
              </div>

              {user && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-2.5 py-1.5 shadow-xl flex-shrink-0">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-md shadow-lg">
                    <User size={16} className="text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-white font-bold text-xs leading-tight">
                      {user.job_title || "Operator"}
                    </p>
                    <p className="text-indigo-200 text-[10px] font-medium leading-tight">
                      ID: {user.emp_id}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Main Tabs - Scrollable */}
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1.5 min-w-max">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-all duration-300 ${
                        isActive
                          ? "bg-white shadow-lg scale-105"
                          : "bg-transparent hover:bg-white/20 hover:scale-102"
                      }`}
                    >
                      <div
                        className={`transition-colors duration-300 ${
                          isActive ? "text-indigo-600" : "text-white"
                        }`}
                      >
                        {React.cloneElement(tab.icon, { className: "w-4 h-4" })}
                      </div>
                      <span
                        className={`text-[10px] font-bold transition-colors duration-300 whitespace-nowrap ${
                          isActive ? "text-indigo-600" : "text-white"
                        }`}
                      >
                        {tab.label}
                      </span>
                      {isActive && (
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub Tabs (Only for YorkSys Orders) */}
            {activeTab === "yorksys-orders" && (
              <div className="animate-slideDown overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1.5 min-w-max">
                  {yorksysSubTabs.map((subTab) => {
                    const isActive = activeYorksysSubTab === subTab.id;
                    return (
                      <button
                        key={subTab.id}
                        onClick={() => setActiveYorksysSubTab(subTab.id)}
                        className={`group relative flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all duration-300 ${
                          isActive
                            ? "bg-white shadow-lg scale-105"
                            : "bg-transparent hover:bg-white/20 hover:scale-102"
                        }`}
                      >
                        <div
                          className={`transition-colors duration-300 ${
                            isActive ? "text-indigo-600" : "text-white"
                          }`}
                        >
                          {React.cloneElement(subTab.icon, {
                            className: "w-3.5 h-3.5",
                          })}
                        </div>
                        <span
                          className={`text-[9px] font-bold transition-colors duration-300 whitespace-nowrap ${
                            isActive ? "text-indigo-600" : "text-white"
                          }`}
                        >
                          {subTab.label}
                        </span>
                        {isActive && (
                          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Status Indicator */}
            <div className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-3 py-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
              </div>
              <div>
                <p className="text-white font-bold text-xs leading-tight">
                  {activeTab === "yorksys-orders" && activeSubTabData
                    ? activeSubTabData.label
                    : activeTabData?.label}
                </p>
                <p className="text-indigo-200 text-[10px] font-medium leading-tight">
                  Active Module
                </p>
              </div>
            </div>
          </div>

          {/* ======================= */}
          {/* DESKTOP LAYOUT (>= lg)  */}
          {/* ======================= */}
          <div className="hidden lg:flex lg:flex-col lg:gap-0">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-6 flex-1">
                {/* Logo Area */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                    <Shield size={24} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-black text-white tracking-tight">
                        Fin Check System | Measurements
                      </h1>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                        <Sparkles size={12} className="text-yellow-300" />
                        <span className="text-xs font-bold text-white">
                          PRO
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-indigo-100 font-medium">
                      QA Measurement & Specification System
                    </p>
                  </div>
                </div>

                {/* Navigation Bar */}
                <div className="flex items-center gap-3">
                  {/* Main Tabs + Optional Sub Tabs */}
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2">
                    {/* Render Main Tabs */}
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`group relative flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-300 ${
                            isActive
                              ? "bg-white shadow-lg scale-105"
                              : "bg-transparent hover:bg-white/20 hover:scale-102"
                          }`}
                        >
                          <div
                            className={`transition-colors duration-300 ${
                              isActive ? "text-indigo-600" : "text-white"
                            }`}
                          >
                            {React.cloneElement(tab.icon, {
                              className: "w-5 h-5",
                            })}
                          </div>
                          <span
                            className={`text-xs font-bold transition-colors duration-300 ${
                              isActive ? "text-indigo-600" : "text-white"
                            }`}
                          >
                            {tab.label}
                          </span>
                          {isActive && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
                          )}
                        </button>
                      );
                    })}

                    {/* Sub Tabs (Only for YorkSys Orders) */}
                    {activeTab === "yorksys-orders" && (
                      <>
                        {/* Vertical Divider */}
                        <div className="h-10 w-px bg-white/30 mx-1"></div>

                        {/* YorkSys Sub Tabs */}
                        {yorksysSubTabs.map((subTab) => {
                          const isActive = activeYorksysSubTab === subTab.id;
                          return (
                            <button
                              key={subTab.id}
                              onClick={() => setActiveYorksysSubTab(subTab.id)}
                              className={`group relative flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-300 ${
                                isActive
                                  ? "bg-white shadow-lg scale-105"
                                  : "bg-transparent hover:bg-white/20 hover:scale-102"
                              }`}
                            >
                              <div
                                className={`transition-colors duration-300 ${
                                  isActive ? "text-indigo-600" : "text-white"
                                }`}
                              >
                                {React.cloneElement(subTab.icon, {
                                  className: "w-4 h-4",
                                })}
                              </div>
                              <span
                                className={`text-[10px] font-bold transition-colors duration-300 whitespace-nowrap ${
                                  isActive ? "text-indigo-600" : "text-white"
                                }`}
                              >
                                {subTab.label}
                              </span>
                              {isActive && (
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
                              )}
                            </button>
                          );
                        })}
                      </>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5">
                    <div className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400"></span>
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm leading-tight">
                        {activeTab === "yorksys-orders" && activeSubTabData
                          ? activeSubTabData.label
                          : activeTabData?.label}
                      </p>
                      <p className="text-indigo-200 text-xs font-medium leading-tight">
                        Active Module
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Info */}
              {user && (
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 shadow-xl">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm leading-tight">
                      {user.job_title || "Operator"}
                    </p>
                    <p className="text-indigo-200 text-xs font-medium leading-tight">
                      ID: {user.emp_id}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-6">
        <div className="animate-fadeIn">
          <div className="transform transition-all duration-500 ease-out">
            {activeComponent}
          </div>
        </div>
      </div>

      {/* Global Styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        .bg-grid-white {
          background-image:
            linear-gradient(
              to right,
              rgba(255, 255, 255, 0.1) 1px,
              transparent 1px
            ),
            linear-gradient(
              to bottom,
              rgba(255, 255, 255, 0.1) 1px,
              transparent 1px
            );
        }
        .delay-1000 {
          animation-delay: 1s;
        }
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

export default YPivotQAMeasurements;
