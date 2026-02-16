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
import React, { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../components/authentication/AuthContext";
import YPivotQASectionsHeader from "../components/inspection/PivotY/QASections/YPivotQASectionsHeader";
// import YPivotQASectionsPacking from "../components/inspection/PivotY/QASections/YPivotQASectionsPacking";
import YPivotQASectionsPhotos from "../components/inspection/PivotY/QASections/YPivotQASectionsPhotos";
import YPivotQASectionsProduct from "../components/inspection/PivotY/QASections/YPivotQASectionsProduct";
import YPivotQASectionsSubConFactoryManagement from "../components/inspection/PivotY/QASections/YPivotQASectionsSubConFactoryManagement";

const PlaceholderComponent = ({ title, icon: Icon, t }) => {
  return (
    <div className="p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md min-h-[400px] flex flex-col justify-center items-center">
      <div className="mb-4 text-indigo-500 dark:text-indigo-400">
        <Icon size={64} strokeWidth={1.5} />
      </div>
      <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
        {title}
      </h2>
      <p className="text-gray-600 dark:text-gray-400 text-center">
        {t("fincheckSettingMain.underDevelopment")}
      </p>
    </div>
  );
};

const YPivotQASections = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState("header");
  const [activeSubTab, setActiveSubTab] = useState("buyer");

  // Current language state for reactivity
  const [currentLanguage, setCurrentLanguage] = useState(
    () => localStorage.getItem("preferredLanguage") || i18n.language || "en",
  );

  // Language change listener
  useEffect(() => {
    const handleI18nLanguageChange = (lng) => {
      setCurrentLanguage(lng);
    };

    const handleCustomLanguageChange = (event) => {
      const newLang = event.detail?.language;
      if (newLang) {
        setCurrentLanguage(newLang);
      }
    };

    i18n.on("languageChanged", handleI18nLanguageChange);
    window.addEventListener("languageChanged", handleCustomLanguageChange);

    return () => {
      i18n.off("languageChanged", handleI18nLanguageChange);
      window.removeEventListener("languageChanged", handleCustomLanguageChange);
    };
  }, [i18n]);

  const tabs = useMemo(
    () => [
      {
        id: "header",
        label: t("fincheckSettingMain.tabs.header"),
        icon: <FileText size={20} />,
        component: <YPivotQASectionsHeader />,
        gradient: "from-blue-500 to-cyan-500",
        description: t("fincheckSettingMain.tabs.headerDesc"),
      },
      {
        id: "photos",
        label: t("fincheckSettingMain.tabs.photos"),
        icon: <Camera size={20} />,
        component: <YPivotQASectionsPhotos />,
        gradient: "from-purple-500 to-pink-500",
        description: t("fincheckSettingMain.tabs.photosDesc"),
      },
      // {
      //   id: "packing",
      //   label: t("fincheckSettingMain.tabs.packing"),
      //   icon: <Package size={20} />,
      //   component: <YPivotQASectionsPacking />,
      //   gradient: "from-orange-500 to-red-500",
      //   description: t("fincheckSettingMain.tabs.packingDesc"),
      // },
      {
        id: "production",
        label: t("fincheckSettingMain.tabs.production"),
        icon: <TrendingUp size={20} />,
        component: (
          <YPivotQASectionsProduct
            activeSubTab={activeSubTab}
            setActiveSubTab={setActiveSubTab}
          />
        ),
        gradient: "from-green-500 to-emerald-500",
        description: t("fincheckSettingMain.tabs.productionDesc"),
      },
      {
        id: "subcon",
        label: t("fincheckSettingMain.tabs.subcon"),
        icon: <Factory size={20} />,
        component: <YPivotQASectionsSubConFactoryManagement />,
        gradient: "from-teal-500 to-emerald-500",
        description: t("fincheckSettingMain.tabs.subconDesc"),
      },
    ],
    [activeSubTab, t, currentLanguage],
  );

  const subTabs = useMemo(
    () => [
      {
        id: "buyer",
        label: t("fincheckSettingMain.subTabs.buyer"),
        icon: <Users size={20} />,
      },
      {
        id: "lines",
        label: t("fincheckSettingMain.subTabs.lines"),
        icon: <Factory size={20} />,
      },
      {
        id: "tables",
        label: t("fincheckSettingMain.subTabs.tables"),
        icon: <Grid size={20} />,
      },
      {
        id: "shipping",
        label: t("fincheckSettingMain.subTabs.shipping"),
        icon: <Ship size={20} />,
      },
      {
        id: "category",
        label: t("fincheckSettingMain.subTabs.category"),
        icon: <Layers size={20} />,
      },
      {
        id: "product-type",
        label: t("fincheckSettingMain.subTabs.productType"),
        icon: <ImageIcon size={20} />,
      },
      {
        id: "product-location",
        label: t("fincheckSettingMain.subTabs.location"),
        icon: <MapPin size={20} />,
      },
      {
        id: "style-location",
        label: t("fincheckSettingMain.subTabs.styleLoc"),
        icon: <Scissors size={20} />,
      },
      {
        id: "defect",
        label: t("fincheckSettingMain.subTabs.defect"),
        icon: <FileText size={20} />,
      },
      {
        id: "buyer-status",
        label: t("fincheckSettingMain.subTabs.buyerStatus"),
        icon: <CheckSquare size={20} />,
      },
      {
        id: "aql-term",
        label: t("fincheckSettingMain.subTabs.aqlTerm"),
        icon: <BookOpen size={20} />,
      },
      {
        id: "aql-config",
        label: t("fincheckSettingMain.subTabs.aqlConfig"),
        icon: <Sliders size={20} />,
      },
    ],
    [t, currentLanguage],
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800 text-gray-800 dark:text-gray-200 flex flex-col">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-400/10 dark:bg-purple-600/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* FIXED Header Section - Below Navbar */}
      <div className="fixed top-12 lg:top-16 left-0 right-0 z-40 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 shadow-2xl">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>

        <div className="relative max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 py-2 lg:py-3">
          {/* MOBILE/TABLET LAYOUT (< lg) */}
          <div className="lg:hidden space-y-2">
            {/* Top Row: Title + User Info */}
            <div className="flex items-center justify-between gap-3">
              {/* Title Section - Compact */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex items-center justify-center w-9 h-9 bg-white/20 backdrop-blur-sm rounded-lg shadow-lg flex-shrink-0">
                  <Shield size={18} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <h1 className="text-sm font-black text-white tracking-tight truncate">
                      {t("fincheckSettingMain.pageTitle")}
                    </h1>
                    <div className="flex items-center gap-0.5 px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full flex-shrink-0">
                      <Sparkles size={8} className="text-yellow-300" />
                      <span className="text-[8px] font-bold text-white">
                        {t("fincheckSettingMain.pro")}
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] text-indigo-100 font-medium truncate">
                    {t("fincheckSettingMain.pageSubtitle")}
                  </p>
                </div>
              </div>

              {/* User Info - Compact */}
              {user && (
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-2 py-1 shadow-xl flex-shrink-0">
                  <div className="flex items-center justify-center w-7 h-7 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-md shadow-lg">
                    <User size={14} className="text-white" />
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-white font-bold text-[10px] leading-tight">
                      {user.job_title || t("fincheckSettingMain.operator")}
                    </p>
                    <p className="text-indigo-200 text-[9px] font-medium leading-tight">
                      {t("fincheckSettingMain.id")}: {user.emp_id}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Main Tabs - Smaller, Scrollable */}
            <div className="overflow-x-auto scrollbar-hide -mx-4 px-4">
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1 min-w-max">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group relative flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-lg transition-all duration-300 min-w-[70px] ${
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
                          className: "w-3.5 h-3.5",
                        })}
                      </div>
                      <span
                        className={`text-[9px] font-bold transition-colors duration-300 whitespace-nowrap ${
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

            {/* Sub Tabs - Only show when Production tab is active */}
            {activeTab === "production" && (
              <div className="animate-slideDown overflow-x-auto scrollbar-hide -mx-4 px-4">
                <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1 min-w-max">
                  {subTabs.map((subTab) => {
                    const isActive = activeSubTab === subTab.id;
                    return (
                      <button
                        key={subTab.id}
                        onClick={() => setActiveSubTab(subTab.id)}
                        className={`group relative flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-all duration-300 min-w-[55px] ${
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
                            className: "w-3 h-3",
                          })}
                        </div>
                        <span
                          className={`text-[8px] font-bold transition-colors duration-300 whitespace-nowrap ${
                            isActive ? "text-indigo-600" : "text-white"
                          }`}
                        >
                          {subTab.label}
                        </span>
                        {isActive && (
                          <div className="absolute -top-0.5 -right-0.5 w-1 h-1 bg-green-400 rounded-full shadow-lg animate-pulse"></div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Active Status Indicator - Mobile */}
            <div className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg px-3 py-1.5">
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
                <p className="text-indigo-200 text-[9px] font-medium leading-tight">
                  {t("fincheckSettingMain.activeSection")}
                </p>
              </div>
            </div>
          </div>

          {/* DESKTOP LAYOUT (>= lg) */}
          <div className="hidden lg:flex lg:flex-col lg:gap-0">
            <div className="flex items-center justify-between gap-4">
              {/* Left Side - Title, Navigation, and Active Status */}
              <div className="flex items-center gap-4 flex-1">
                {/* Title Section */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                    <Shield size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h1 className="text-lg font-black text-white tracking-tight">
                        {t("fincheckSettingMain.pageTitleFull")}
                      </h1>
                      <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/20 backdrop-blur-sm rounded-full">
                        <Sparkles size={10} className="text-yellow-300" />
                        <span className="text-[10px] font-bold text-white">
                          {t("fincheckSettingMain.pro")}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-indigo-100 font-medium">
                      {t("fincheckSettingMain.pageSubtitle")}
                    </p>
                  </div>
                </div>

                {/* Icon Navigation Buttons with Labels */}
                <div className="flex items-center gap-2">
                  {/* Main Tabs */}
                  <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1.5">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id)}
                          className={`group relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-300 ${
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
                              className: "w-4 h-4",
                            })}
                          </div>
                          <span
                            className={`text-[10px] font-bold transition-colors duration-300 ${
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

                  {/* Sub Tabs - Only show when Production tab is active */}
                  {activeTab === "production" && (
                    <>
                      <div className="h-12 w-px bg-white/30"></div>

                      <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-1.5 overflow-x-auto scrollbar-hide flex-1 min-w-0">
                        {subTabs.map((subTab) => {
                          const isActive = activeSubTab === subTab.id;
                          return (
                            <button
                              key={subTab.id}
                              onClick={() => setActiveSubTab(subTab.id)}
                              className={`group relative flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg transition-all duration-300 flex-shrink-0 ${
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
                    </>
                  )}

                  {/* Active Status Indicator */}
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 min-w-[120px]">
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
                      <p className="text-indigo-200 text-[9px] font-medium leading-tight">
                        {t("fincheckSettingMain.activeSection")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Side - User Info (Compact) */}
              {user && (
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl px-3 py-2 shadow-xl">
                  <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg">
                    <User size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-xs leading-tight">
                      {user.job_title || t("fincheckSettingMain.operator")}
                    </p>
                    <p className="text-indigo-200 text-[10px] font-medium leading-tight">
                      {t("fincheckSettingMain.id")}: {user.emp_id}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Container - With padding for fixed navbar + header */}
      {/* Mobile: navbar=48px, header varies based on tabs ~140px-180px */}
      {/* Desktop: navbar=64px, header~70px */}
      <div
        className={`flex-1 relative max-w-8xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-8 ${
          activeTab === "production"
            ? "pt-[220px] lg:pt-[140px]"
            : "pt-[180px] lg:pt-[140px]"
        }`}
      >
        <div className="animate-fadeIn">
          {/* Active Component */}
          <div className="transform transition-all duration-500 ease-out">
            {activeComponent}
          </div>
        </div>
      </div>

      {/* Styles */}
      <style>
        {`
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
        `}
      </style>
    </div>
  );
};

export default YPivotQASections;
