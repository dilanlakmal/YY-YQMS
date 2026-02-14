import React, { useState, useMemo } from "react";
import {
  FileText,
  Sparkles,
  Shield,
  User,
  Layout,
  Camera,
  MapPin,
  Bug,
  Ruler,
  ClipboardCheck
} from "lucide-react";
import { useAuth } from "../components/authentication/AuthContext";
import YPivotQATemplatesReportType from "../components/inspection/PivotY/QATemplates/YPivotQATemplatesReportType";
import YPivotQATemplatesHeader from "../components/inspection/PivotY/QATemplates/YPivotQATemplatesHeader";
import YPivotQATemplatesPhotos from "../components/inspection/PivotY/QATemplates/YPivotQATemplatesPhotos";
import YPivotQATemplatesDefectLocationSelection from "../components/inspection/PivotY/QATemplates/YPivotQATemplatesDefectLocationSelection";
import YPivotQATemplatesDefectTotalSelection from "../components/inspection/PivotY/QATemplates/YPivotQATemplatesDefectTotalSelection";
import YPivotQATemplatesMeasurementSelection from "../components/inspection/PivotY/QATemplates/YPivotQATemplatesMeasurementSelection";
import YPivotQATemplatesPPSheet from "../components/inspection/PivotY/QATemplates/YPivotQATemplatesPPSheet";

const YPivotQATemplates = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("reports");

  const tabs = useMemo(
    () => [
      {
        id: "reports",
        label: "Reports",
        icon: <FileText size={20} />,
        component: <YPivotQATemplatesReportType />,
        gradient: "from-blue-500 to-cyan-500",
        description: "Report configuration"
      },
      {
        id: "header",
        label: "Header Preview",
        icon: <Layout size={20} />,
        component: <YPivotQATemplatesHeader />,
        gradient: "from-purple-500 to-pink-500",
        description: "Header templates"
      },
      {
        id: "photos",
        label: "Photo Sections",
        icon: <Camera size={20} />,
        component: <YPivotQATemplatesPhotos />,
        gradient: "from-orange-500 to-red-500",
        description: "Photo management"
      },
      {
        id: "defects",
        label: "Defect Locations",
        icon: <MapPin size={20} />,
        component: <YPivotQATemplatesDefectLocationSelection />,
        gradient: "from-pink-500 to-rose-500",
        description: "Location selection"
      },
      {
        id: "total_defects",
        label: "Defect Selection",
        icon: <Bug size={20} />,
        component: <YPivotQATemplatesDefectTotalSelection />,
        gradient: "from-green-500 to-teal-500",
        description: "Full defect workflow"
      },
      {
        id: "measurements",
        label: "Measurements",
        icon: <Ruler size={20} />,
        component: <YPivotQATemplatesMeasurementSelection />,
        gradient: "from-indigo-500 to-violet-500",
        description: "Measurement specs configuration"
      },
      {
        id: "pp_sheet",
        label: "PP Sheet",
        icon: <ClipboardCheck size={20} />,
        component: <YPivotQATemplatesPPSheet />,
        gradient: "from-blue-600 to-cyan-600",
        description: "Pre-production meeting report"
      }
    ],
    []
  );

  const activeComponent = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab)?.component || null;
  }, [activeTab, tabs]);

  const activeTabData = useMemo(() => {
    return tabs.find((tab) => tab.id === activeTab);
  }, [activeTab, tabs]);

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
                      Fin Check | Templates
                    </h1>
                    <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full flex-shrink-0">
                      <Sparkles size={10} className="text-yellow-300" />
                      <span className="text-[10px] font-bold text-white">
                        PRO
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] sm:text-xs text-indigo-100 font-medium truncate">
                    Manage Inspection Templates
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
                          className: "w-4 h-4"
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

            {/* Active Status Indicator - Mobile */}
            <div className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-3 py-2">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
              </div>
              <div>
                <p className="text-white font-bold text-xs leading-tight">
                  {activeTabData?.label}
                </p>
                <p className="text-indigo-200 text-[10px] font-medium leading-tight">
                  Active Section
                </p>
              </div>
            </div>
          </div>

          {/* DESKTOP LAYOUT (>= lg) */}
          <div className="hidden lg:flex lg:flex-col lg:gap-0">
            <div className="flex items-center justify-between gap-4">
              {/* Left Side - Title & Navigation */}
              <div className="flex items-center gap-6 flex-1">
                {/* Title Section */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                    <Shield size={24} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-black text-white tracking-tight">
                        Fin Check | Templates
                      </h1>
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                        <Sparkles size={12} className="text-yellow-300" />
                        <span className="text-xs font-bold text-white">
                          PRO
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-indigo-100 font-medium">
                      Manage Inspection Templates & Configurations
                    </p>
                  </div>
                </div>

                {/* Main Tabs */}
                <div className="flex items-center gap-3">
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
                              className: "w-5 h-5"
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

                  {/* Active Status Indicator */}
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5">
                    <div className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400"></span>
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm leading-tight">
                        {activeTabData?.label}
                      </p>
                      <p className="text-indigo-200 text-xs font-medium leading-tight">
                        Active Section
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - User Info */}
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

        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }

        .bg-grid-white {
          background-image: linear-gradient(
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

export default YPivotQATemplates;
