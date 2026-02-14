import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  BarChart3,
  Download,
  ArrowLeft,
  Home,
  User,
  LayoutGrid,
  Sparkles,
  ShieldCheck,
  Bell,
  FileCog,
  Bot,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../components/authentication/AuthContext";
import { API_BASE_URL } from "../../config";

// --- Import Tab Components ---
import YPivotQAReportMain from "../components/inspection/PivotY/QAReports/YPivotQAReportMain";
import FincheckApprovalAssignee from "../components/inspection/PivotY/QAReports/FincheckApprovalAssignee";
import FincheckNotificationGroup from "../components/inspection/PivotY/QAReports/FincheckNotificationGroup";
import FincheckAnalyticsReport from "../components/inspection/PivotY/FincheckAnalytics/FincheckAnalyticsReport";
import FincheckInspectionReportModify from "../components/inspection/PivotY/QAReports/FincheckInspectionReportModify";
import FincheckAIChatMain from "../components/inspection/PivotY/AI/FincheckAIChatMain";

// --- Placeholder Components for Future Tabs ---
const AnalyticsPlaceholder = () => (
  <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 min-h-[400px] animate-fadeIn">
    <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-full mb-4">
      <BarChart3 className="w-12 h-12 text-emerald-500" />
    </div>
    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
      Analytics Dashboard
    </h3>
    <p className="text-gray-500 dark:text-gray-400 mt-2">Coming soon...</p>
  </div>
);

const ExportPlaceholder = () => (
  <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 min-h-[400px] animate-fadeIn">
    <div className="p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-4">
      <Download className="w-12 h-12 text-orange-500" />
    </div>
    <h3 className="text-xl font-bold text-gray-800 dark:text-white">
      Export Tools
    </h3>
    <p className="text-gray-500 dark:text-gray-400 mt-2">Coming soon...</p>
  </div>
);

const YPivotQAReport = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("reports");
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingPermission, setIsLoadingPermission] = useState(true);

  // Permission Check Effect
  useEffect(() => {
    const checkPermission = async () => {
      if (!user?.emp_id) {
        console.log("[TAB VISIBILITY] No user found");
        setIsAdmin(false);
        setIsLoadingPermission(false);
        return;
      }

      try {
        setIsLoadingPermission(true);

        // Use the EXISTING working endpoint
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-reports/check-permission`,
          {
            params: { empId: user.emp_id },
            timeout: 10000, // 10 second timeout
          },
        );

        // VERY STRICT boolean check
        const isAdminValue = res.data?.isAdmin;

        if (isAdminValue === true) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        setIsAdmin(false);
      } finally {
        setIsLoadingPermission(false);
      }
    };

    checkPermission();
  }, [user?.emp_id]);

  const handleGoHome = () => {
    navigate("/home");
  };

  // --- TAB CONFIGURATION ---
  const tabs = useMemo(() => {
    const baseTabs = [
      // Base tabs available to everyone
      {
        id: "reports",
        label: "Reports",
        icon: <FileText size={18} />,
        component: <YPivotQAReportMain />, // The actual content component
        color: "text-indigo-600",
      },
      {
        id: "analytics",
        label: "Analytics",
        icon: <BarChart3 size={18} />,
        component: <FincheckAnalyticsReport />,
        color: "text-emerald-600",
      },
      {
        id: "export",
        label: "Export",
        icon: <Download size={18} />,
        component: <ExportPlaceholder />,
        color: "text-orange-600",
      },
      {
        id: "ai_chat",
        label: "AI",
        icon: <Bot size={18} />,
        component: <FincheckAIChatMain />,
        color: "text-rose-500",
      },
    ];
    if (!isLoadingPermission && isAdmin === true) {
      baseTabs.push({
        id: "approval",
        label: "Assignees",
        icon: <ShieldCheck size={18} />,
        component: <FincheckApprovalAssignee />,
        color: "text-purple-600",
      });
      //  Notify Group Tab
      baseTabs.push({
        id: "notify",
        label: "Notify Group",
        icon: <Bell size={18} />,
        component: <FincheckNotificationGroup />,
        color: "text-pink-600",
      });
      // Modify Tab
      baseTabs.push({
        id: "modify",
        label: "Modify",
        icon: <FileCog size={18} />,
        component: <FincheckInspectionReportModify />,
        color: "text-red-600", // Distinct red color for admin action
      });
    }
    return baseTabs;
  }, [isAdmin, isLoadingPermission]);

  const activeTabData = tabs.find((t) => t.id === activeTab);

  // --- Helper to determine layout mode ---
  const isAnalyticsMode = activeTab === "analytics";

  //className="min-h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 text-gray-800 dark:text-gray-200 font-sans flex flex-col"

  return (
    <div
      className={`bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 text-gray-800 dark:text-gray-200 font-sans flex flex-col ${
        isAnalyticsMode ? "h-screen overflow-hidden" : "min-h-screen"
      }`}
    >
      {/* Background Ambience */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* --- HEADER (FIXED) --- */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:16px_16px]"></div>

        <div className="relative max-w-8xl mx-auto px-3 sm:px-4 lg:px-6 py-2 lg:py-3">
          {/* MOBILE LAYOUT */}
          <div className="lg:hidden space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {/* Home Button */}
                <button
                  onClick={handleGoHome}
                  className="flex-shrink-0 flex items-center justify-center w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 rounded-lg shadow-lg transition-all active:scale-95"
                >
                  <Home size={18} className="text-white" />
                </button>
                <div className="flex items-center justify-center w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg shadow-lg flex-shrink-0">
                  <LayoutGrid size={18} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h1 className="text-sm font-black text-white tracking-tight truncate">
                      Fincheck | Reports
                    </h1>
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full flex-shrink-0">
                      <Sparkles size={8} className="text-yellow-300" />
                      <span className="text-[8px] font-bold text-white">
                        PRO
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-indigo-100 font-medium truncate">
                    {activeTabData?.label} • Active
                  </p>
                </div>
              </div>

              {/* User Avatar */}
              {user && (
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-2 py-1 shadow-lg flex-shrink-0">
                  <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-md shadow">
                    <User size={14} className="text-white" />
                  </div>
                </div>
              )}
            </div>

            {/* Scrollable Tabs (Mobile) */}
            <div className="overflow-x-auto scrollbar-hide -mx-3 px-3">
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1 min-w-max">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-300 ${
                        isActive
                          ? "bg-white shadow-lg scale-105"
                          : "bg-transparent hover:bg-white/20"
                      }`}
                    >
                      <div
                        className={`transition-colors duration-300 ${
                          isActive ? tab.color : "text-white"
                        }`}
                      >
                        {React.cloneElement(tab.icon, { className: "w-4 h-4" })}
                      </div>
                      <span
                        className={`text-[9px] font-bold transition-colors duration-300 ${
                          isActive ? tab.color : "text-white"
                        }`}
                      >
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* DESKTOP LAYOUT */}
          <div className="hidden lg:flex lg:items-center lg:justify-between lg:gap-4">
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={handleGoHome}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 rounded-xl shadow-lg transition-all hover:shadow-xl hover:scale-105 active:scale-95"
              >
                <ArrowLeft size={16} className="text-white" />
                <span className="text-sm font-bold text-white">YQMS</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                  <LayoutGrid size={22} className="text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-black text-white tracking-tight">
                      Fincheck | Reports
                    </h1>
                    <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                      <Sparkles size={10} className="text-yellow-300" />
                      <span className="text-[10px] font-bold text-white">
                        PRO
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-indigo-100 font-medium">
                    All Inspection Reports
                  </p>
                </div>
              </div>

              {/* Desktop Tabs */}
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1.5">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group relative flex flex-col items-center gap-1 px-4 py-1.5 rounded-lg transition-all duration-300 ${
                        isActive
                          ? "bg-white shadow-lg scale-105"
                          : "bg-transparent hover:bg-white/20"
                      }`}
                    >
                      <div
                        className={`transition-colors duration-300 ${
                          isActive ? tab.color : "text-white"
                        }`}
                      >
                        {React.cloneElement(tab.icon, { className: "w-4 h-4" })}
                      </div>
                      <span
                        className={`text-[10px] font-bold transition-colors duration-300 ${
                          isActive ? tab.color : "text-white"
                        }`}
                      >
                        {tab.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* User Info */}
            {user && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 shadow-lg">
                <div className="flex items-center justify-center w-9 h-9 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow">
                  <User size={18} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">
                    {user.job_title || "Viewer"}
                  </p>
                  <p className="text-indigo-200 text-xs font-medium leading-tight">
                    {user.emp_id}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- CONTENT AREA --- */}
      {/* 
          Content Wrapper Logic
      */}
      <div
        className={`flex-1 w-full max-w-full flex flex-col pt-[90px] lg:pt-[70px] ${
          isAnalyticsMode ? "h-full overflow-hidden" : ""
        }`}
      >
        <div className="relative w-full max-w-8xl mx-auto px-3 sm:px-4 lg:px-6 pb-4 h-full flex flex-col min-h-0">
          {/* 
             Component Wrapper 
          */}
          <div className="h-full w-full max-w-full animate-fadeIn flex flex-col min-h-0">
            {activeTabData?.component}
          </div>
        </div>
      </div>

      {/* <div className="flex-1 overflow-hidden pt-[90px] lg:pt-[70px] flex flex-col w-full max-w-full">
        <div className="relative w-full max-w-8xl mx-auto px-3 sm:px-4 lg:px-6 pb-4 h-full flex flex-col min-h-0">

          <div className="h-full w-full max-w-full animate-fadeIn flex flex-col min-h-0">
            {tabs.find((tab) => tab.id === activeTab)?.component}
          </div>
        </div>
      </div> */}

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
          animation: fadeIn 0.4s ease-out;
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
      `}</style>
    </div>
  );
};

export default YPivotQAReport;
