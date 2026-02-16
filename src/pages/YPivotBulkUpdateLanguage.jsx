import React, { useState, useMemo } from "react";
import {
  MapPin,
  Layers,
  FileText,
  Shield,
  Sparkles,
  User,
  Languages,
} from "lucide-react";
import { useAuth } from "../components/authentication/AuthContext";
import FincheckBulkUpdateProductLocationLang from "../components/inspection/PivotY/QABulkUpdate/FincheckBulkUpdateProductLocationLang";

// Placeholder for other components
const PlaceholderComponent = ({ title, icon: Icon }) => {
  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-[400px] flex flex-col justify-center items-center border border-dashed border-gray-300 dark:border-gray-700">
      <div className="mb-4 text-indigo-500 dark:text-indigo-400 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-full">
        <Icon size={48} strokeWidth={1.5} />
      </div>
      <h2 className="text-xl font-bold text-gray-700 dark:text-gray-200 mb-2">
        {title}
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-center text-sm">
        Bulk language update for this section is coming soon.
      </p>
    </div>
  );
};

const YPivotBulkUpdateLanguage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("location");

  const tabs = useMemo(
    () => [
      {
        id: "location",
        label: "Product Location",
        icon: <MapPin size={20} />,
        component: <FincheckBulkUpdateProductLocationLang />,
        gradient: "from-blue-500 to-cyan-500",
      },
      {
        id: "category",
        label: "Category",
        icon: <Layers size={20} />,
        component: (
          <PlaceholderComponent title="Category Translation" icon={Layers} />
        ),
        gradient: "from-purple-500 to-pink-500",
      },
      {
        id: "defects",
        label: "Defects",
        icon: <FileText size={20} />,
        component: (
          <PlaceholderComponent title="Defect Translation" icon={FileText} />
        ),
        gradient: "from-orange-500 to-red-500",
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 text-gray-800 dark:text-gray-200">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header Section */}
      <div className="relative bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>

        <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-3 lg:py-5">
          {/* Header Layout */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            {/* Title */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                <Languages size={24} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    Fin Check | Bulk Translate
                  </h1>
                  <div className="flex items-center gap-1 px-2 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                    <Sparkles size={12} className="text-yellow-300" />
                    <span className="text-xs font-bold text-white">PRO</span>
                  </div>
                </div>
                <p className="text-sm text-indigo-100 font-medium">
                  Manage System Translations
                </p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="w-full lg:w-auto overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1.5 min-w-max">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`
                        group relative flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all duration-300
                        ${isActive ? "bg-white shadow-lg scale-105" : "bg-transparent hover:bg-white/20 hover:scale-102"}
                      `}
                    >
                      <div
                        className={`transition-colors duration-300 ${isActive ? "text-indigo-600" : "text-white"}`}
                      >
                        {React.cloneElement(tab.icon, { className: "w-5 h-5" })}
                      </div>
                      <span
                        className={`text-xs font-bold transition-colors duration-300 ${isActive ? "text-indigo-600" : "text-white"}`}
                      >
                        {tab.label}
                      </span>
                      {isActive && (
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* User Info (Hidden on Mobile) */}
            {user && (
              <div className="hidden lg:flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2.5 shadow-xl">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg">
                  <User size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm leading-tight">
                    {user.job_title || "Admin"}
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

      {/* Content Container */}
      <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-6">
        <div className="animate-fadeIn">{activeComponent}</div>
      </div>

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
      `}</style>
    </div>
  );
};

export default YPivotBulkUpdateLanguage;
