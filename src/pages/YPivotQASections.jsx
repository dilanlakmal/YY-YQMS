import {
  Camera,
  FileText,
  Package,
  TrendingUp,
  User,
  Shield,
  Sparkles,
  Circle,
  Layers,
  Users,
  MapPin,
  CheckSquare,
  Image as ImageIcon,
  BookOpen,
  Sliders,
  Factory,
  Grid,
  Ship,
  Scissors,
} from "lucide-react";
import React, { useMemo, useState } from "react";
import { useAuth } from "../components/authentication/AuthContext";
import YPivotQASectionsHeader from "../components/inspection/PivotY/QASections/YPivotQASectionsHeader";
import YPivotQASectionsPacking from "../components/inspection/PivotY/QASections/YPivotQASectionsPacking";
import YPivotQASectionsPhotos from "../components/inspection/PivotY/QASections/YPivotQASectionsPhotos";
import YPivotQASectionsProduct from "../components/inspection/PivotY/QASections/YPivotQASectionsProduct";
import YPivotQASectionsSubConFactoryManagement from "../components/inspection/PivotY/QASections/YPivotQASectionsSubConFactoryManagement";

const PlaceholderComponent = ({ title, icon: Icon }) => {
  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-[400px] flex flex-col justify-center items-center">
      <div className="mb-4 text-indigo-500 dark:text-indigo-400">
        <Icon size={64} strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
        {title}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center">
        This section is under development.
      </p>
    </div>
  );
};

const YPivotQASections = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("header");
  const [activeSubTab, setActiveSubTab] = useState("buyer");

  const tabs = useMemo(
    () => [
      {
        id: "header",
        label: "Header",
        icon: <FileText size={20} />,
        component: <YPivotQASectionsHeader />,
        gradient: "from-blue-500 to-cyan-500",
        description: "Manage header information",
      },
      {
        id: "photos",
        label: "Photos",
        icon: <Camera size={20} />,
        component: <YPivotQASectionsPhotos />,
        gradient: "from-purple-500 to-pink-500",
        description: "Photo management",
      },
      {
        id: "packing",
        label: "Packing",
        icon: <Package size={20} />,
        component: <YPivotQASectionsPacking />,
        gradient: "from-orange-500 to-red-500",
        description: "Packing details",
      },
      {
        id: "production",
        label: "Production",
        icon: <TrendingUp size={20} />,
        component: (
          <YPivotQASectionsProduct
            activeSubTab={activeSubTab}
            setActiveSubTab={setActiveSubTab}
          />
        ),
        gradient: "from-green-500 to-emerald-500",
        description: "Production management",
      },
      {
        id: "subcon",
        label: "Sub-Con Factory",
        icon: <Factory size={20} />, // You can use Factory icon or Users
        component: <YPivotQASectionsSubConFactoryManagement />,
        gradient: "from-teal-500 to-emerald-500", // Choose a distinct gradient
        description: "Manage Sub-Con Factories & QCs",
      },
    ],
    [activeSubTab],
  );

  const subTabs = useMemo(
    () => [
      {
        id: "buyer",
        label: "Buyer",
        icon: <Users size={20} />,
      },
      {
        id: "lines",
        label: "Lines",
        icon: <Factory size={20} />,
      },
      {
        id: "tables",
        label: "Tables",
        icon: <Grid size={20} />,
      },
      {
        id: "shipping",
        label: "Shipping",
        icon: <Ship size={20} />,
      },
      {
        id: "category",
        label: "Category",
        icon: <Layers size={20} />,
      },
      {
        id: "product-type",
        label: "Product Type",
        icon: <ImageIcon size={20} />,
      },
      {
        id: "product-location",
        label: "Location",
        icon: <MapPin size={20} />,
      },
      {
        id: "style-location",
        label: "Style Loc",
        icon: <Scissors size={20} />, // Ensure Scissors is imported from lucide-react
      },
      {
        id: "defect",
        label: "Defect",
        icon: <FileText size={20} />,
      },
      {
        id: "buyer-status",
        label: "Buyer Status",
        icon: <CheckSquare size={20} />,
      },
      {
        id: "aql-term",
        label: "AQL Term",
        icon: <BookOpen size={20} />,
      },
      {
        id: "aql-config",
        label: "AQL Config",
        icon: <Sliders size={20} />,
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
    return subTabs.find((tab) => tab.id === activeSubTab);
  }, [activeSubTab, subTabs]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 text-gray-800 dark:text-gray-200">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Compact Header Section with Integrated Tabs */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>

        <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-5">
          {/* MOBILE/TABLET LAYOUT (< lg) */}
          <div className="lg:hidden space-y-3">
            {/* Top Row: Title + User Info */}
            <div className="flex items-center justify-between gap-3">
              {/* Title Section - Compact */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg shadow-lg flex-shrink-0">
                  <Shield size={20} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h1 className="text-sm sm:text-base font-black text-white tracking-tight truncate">
                      Fin Check | Settings
                    </h1>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full flex-shrink-0">
                      <Sparkles size={10} className="text-yellow-300" />
                      <span className="text-[10px] font-bold text-white">
                        PRO
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-xs text-indigo-100 font-medium truncate">
                    Configure System Settings
                  </p>
                </div>
              </div>

              {/* User Info - Compact */}
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

            {/* Main Tabs - Smaller, Scrollable */}
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
                      {/* Icon */}
                      <div
                        className={`transition-colors duration-300 ${
                          isActive ? "text-indigo-600" : "text-white"
                        }`}
                      >
                        {React.cloneElement(tab.icon, {
                          className: "w-4 h-4",
                        })}
                      </div>

                      {/* Label */}
                      <span
                        className={`text-[10px] font-bold transition-colors duration-300 whitespace-nowrap ${
                          isActive ? "text-indigo-600" : "text-white"
                        }`}
                      >
                        {tab.label}
                      </span>

                      {/* Active Indicator Dot */}
                      {isActive && (
                        <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub Tabs - Only show when Production tab is active */}
            {activeTab === "production" && (
              <div className="animate-slideDown overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1.5 min-w-max">
                  {subTabs.map((subTab) => {
                    const isActive = activeSubTab === subTab.id;
                    return (
                      <button
                        key={subTab.id}
                        onClick={() => setActiveSubTab(subTab.id)}
                        className={`group relative flex flex-col items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all duration-300 ${
                          isActive
                            ? "bg-white shadow-lg scale-105"
                            : "bg-transparent hover:bg-white/20 hover:scale-102"
                        }`}
                      >
                        {/* Icon */}
                        <div
                          className={`transition-colors duration-300 ${
                            isActive ? "text-indigo-600" : "text-white"
                          }`}
                        >
                          {React.cloneElement(subTab.icon, {
                            className: "w-3.5 h-3.5",
                          })}
                        </div>

                        {/* Label */}
                        <span
                          className={`text-[9px] font-bold transition-colors duration-300 whitespace-nowrap ${
                            isActive ? "text-indigo-600" : "text-white"
                          }`}
                        >
                          {subTab.label}
                        </span>

                        {/* Active Indicator Dot */}
                        {isActive && (
                          <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Status Indicator - Mobile */}
            <div className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-3 py-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
              </div>
              <div>
                <p className="text-white font-bold text-xs leading-tight">
                  {activeTab === "production" && activeSubTabData
                    ? activeSubTabData.label
                    : activeTabData?.label}
                </p>
                <p className="text-indigo-200 text-[10px] font-medium leading-tight">
                  Active Section
                </p>
              </div>
            </div>
          </div>

          {/* DESKTOP LAYOUT (>= lg) - ORIGINAL PRESERVED */}
          <div className="hidden lg:flex lg:flex-col lg:gap-0">
            <div className="flex items-center justify-between gap-4">
              {/* Left Side - Title, Navigation, and Active Status */}
              <div className="flex items-center gap-6 flex-1">
                {/* Title Section */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                    <Shield size={24} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-black text-white tracking-tight">
                        Fin Check System | Settings
                      </h1>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                        <Sparkles size={12} className="text-yellow-300" />
                        <span className="text-xs font-bold text-white">
                          PRO
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-indigo-100 font-medium">
                      Configure System Settings
                    </p>
                  </div>
                </div>

                {/* Icon Navigation Buttons with Labels */}
                <div className="flex items-center gap-3">
                  {/* Main Tabs */}
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2">
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
                          {/* Icon */}
                          <div
                            className={`transition-colors duration-300 ${
                              isActive ? "text-indigo-600" : "text-white"
                            }`}
                          >
                            {React.cloneElement(tab.icon, {
                              className: "w-5 h-5",
                            })}
                          </div>

                          {/* Label */}
                          <span
                            className={`text-xs font-bold transition-colors duration-300 ${
                              isActive ? "text-indigo-600" : "text-white"
                            }`}
                          >
                            {tab.label}
                          </span>

                          {/* Active Indicator Dot */}
                          {isActive && (
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Sub Tabs - Only show when Production tab is active */}
                  {activeTab === "production" && (
                    <>
                      {/* Vertical Divider */}
                      <div className="h-20 w-px bg-white/30"></div>

                      {/* Sub Tabs */}
                      <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-2">
                        {subTabs.map((subTab) => {
                          const isActive = activeSubTab === subTab.id;
                          return (
                            <button
                              key={subTab.id}
                              onClick={() => setActiveSubTab(subTab.id)}
                              className={`group relative flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all duration-300 ${
                                isActive
                                  ? "bg-white shadow-lg scale-105"
                                  : "bg-transparent hover:bg-white/20 hover:scale-102"
                              }`}
                            >
                              {/* Icon */}
                              <div
                                className={`transition-colors duration-300 ${
                                  isActive ? "text-indigo-600" : "text-white"
                                }`}
                              >
                                {React.cloneElement(subTab.icon, {
                                  className: "w-4 h-4",
                                })}
                              </div>

                              {/* Label */}
                              <span
                                className={`text-[10px] font-bold transition-colors duration-300 whitespace-nowrap ${
                                  isActive ? "text-indigo-600" : "text-white"
                                }`}
                              >
                                {subTab.label}
                              </span>

                              {/* Active Indicator Dot */}
                              {isActive && (
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Active Status Indicator */}
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5">
                    <div className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400"></span>
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm leading-tight">
                        {activeTab === "production" && activeSubTabData
                          ? activeSubTabData.label
                          : activeTabData?.label}
                      </p>
                      <p className="text-indigo-200 text-xs font-medium leading-tight">
                        Active Section
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - User Info (Compact) */}
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

      {/* Content Container */}
      <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-6">
        <div className="animate-fadeIn">
          {/* Active Component */}
          <div className="transform transition-all duration-500 ease-out">
            {activeComponent}
          </div>
        </div>
      </div>

      {/* Styles */}
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

export default YPivotQASections;
