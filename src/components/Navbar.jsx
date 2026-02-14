import axios from "axios";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./authentication/AuthContext";
import { useTheme } from "./context/ThemeContext";
import { API_BASE_URL } from "../../config";
import LanguageSwitcher from "../components/layout/LangSwitch";

import {
  Settings,
  BarChart3,
  Shield,
  Sun,
  Moon,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Menu,
  X,
  TerminalSquare,
  UserPlus,
  Home,
  FileCheck,
  Cog,
  TrendingUp,
  Lock,
} from "lucide-react";

// Custom hook for screen size detection
const useScreenSize = () => {
  const [screenSize, setScreenSize] = useState(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 640) return "mobile";
      if (window.innerWidth < 1024) return "tablet";
      return "desktop";
    }
    return "desktop";
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setScreenSize("mobile");
      } else if (window.innerWidth < 1024) {
        setScreenSize("tablet");
      } else {
        setScreenSize("desktop");
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return screenSize;
};

export default function Navbar({ onLogout }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, clearUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const screenSize = useScreenSize();

  const isMobile = screenSize === "mobile";
  const isTablet = screenSize === "tablet";

  const [isMenuOpen, setIsMenuOpen] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isAdminMenuOpen, setIsAdminMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedMobileSection, setExpandedMobileSection] = useState(null);

  const [roleManagement, setRoleManagement] = useState(null);
  const [userRoles, setUserRoles] = useState([]);

  const profileMenuRef = useRef(null);
  const adminMenuRef = useRef(null);
  const navRef = useRef(null);
  const mobileMenuRef = useRef(null);

  const navScrollRef = useRef(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const [dropdownPosition, setDropdownPosition] = useState({ left: 0 });

  // Navigation sections with items matching Home.jsx
  const navSections = useMemo(
    () => [
      {
        id: "y-pivot",
        title: "Fincheck",
        icon: <FileCheck size={16} />,
        color: "text-indigo-600 dark:text-indigo-400",
        bgColor: "bg-indigo-100 dark:bg-indigo-900/30",
        locked: false,
        items: [
          {
            path: "/qa-sections",
            roles: ["Fincheck Config"],
            title: t("home.qa_sections"),
          },
          {
            path: "/qa-measurements",
            roles: ["Fincheck Measurement"],
            title: t("home.qa_measurements"),
          },
          {
            path: "/qa-templates",
            roles: ["Fincheck Templates"],
            title: t("home.qa_templates"),
          },
          {
            path: "/fincheck-inspection",
            roles: ["Fincheck Inspections"],
            title: t("home.y_pivot_inspection"),
          },
          {
            path: "/fincheck-reports",
            roles: ["Fincheck Reports"],
            title: t("home.y_pivot_report"),
          },
          {
            path: "/P88Legacy",
            roles: ["P88"],
            title: t("home.p88_Legacy"),
          },
        ],
      },
      {
        id: "analytics",
        title: "Analytics",
        icon: <TrendingUp size={16} />,
        color: "text-rose-600 dark:text-rose-400",
        bgColor: "bg-rose-100 dark:bg-rose-900/30",
        locked: true,
        items: [
          {
            path: "/powerbi",
            roles: ["Power BI"],
            title: "Power BI",
            locked: true,
          },
        ],
      },
    ],
    [t],
  );

  // Admin menu items - ONLY shown in Menu dropdown (all locked for YY)
  const adminMenuItems = useMemo(
    () => [
      // User Management - NOT LOCKED
      {
        path: "/user-list",
        roles: ["Admin", "Super Admin"],
        title: "User Management",
        icon: <User size={16} />,
        locked: false,
      },
      // Role Management - NOT LOCKED
      {
        path: "/role-management",
        roles: ["Admin", "Super Admin"],
        title: "Role Management",
        icon: <Shield size={16} />,
        locked: false,
      },
      // System Administration - LOCKED
      {
        path: "/sysadmin",
        roles: ["System Administration"],
        title: t("home.systemadmin"),
        icon: <Settings size={16} />,
        locked: true,
      },
      // Super Admin Assign - LOCKED
      {
        path: "/super-admin-assign",
        title: "Super Admin Assign",
        requiredEmpIds: ["TL04", "TL09"],
        icon: <UserPlus size={16} />,
        locked: true,
      },
    ],
    [t],
  );

  // Fetch roles data (simplified - no IE logic)
  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [roleManagementRes, userRolesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/role-management`),
        axios.get(`${API_BASE_URL}/api/user-roles/${user.emp_id}`),
      ]);
      setRoleManagement(roleManagementRes.data);
      setUserRoles(userRolesRes.data.roles);
    } catch (error) {
      console.error("Error fetching Navbar permissions:", error);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Access control function (simplified - no IE logic)
  const hasAccess = useCallback(
    (item) => {
      if (!user) return false;

      // Locked items have no access
      if (item.locked) return false;

      if (item.requiredEmpIds) {
        return item.requiredEmpIds.includes(user.emp_id);
      }

      const isSuperAdmin = userRoles.includes("Super Admin");
      const isAdmin = userRoles.includes("Admin");
      if (isSuperAdmin || isAdmin) return true;

      if (item.roles && roleManagement && user.job_title) {
        return roleManagement.some(
          (role) =>
            item.roles.includes(role.role) &&
            role.jobTitles.includes(user.job_title),
        );
      }
      return false;
    },
    [user, userRoles, roleManagement],
  );

  // Filter navigation sections based on access
  const accessibleNavSections = useMemo(() => {
    if (!userRoles || !user) return [];
    return navSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          // If item is locked, include it (it will be shown as locked)
          if (item.locked) return true;
          // Otherwise check access
          return hasAccess(item);
        }),
      }))
      .filter((section) => section.items.length > 0 || section.locked);
  }, [navSections, hasAccess, userRoles, user]);

  // Filter admin menu items based on access
  const accessibleAdminItems = useMemo(() => {
    if (!userRoles || !user) return [];
    return adminMenuItems.filter((item) => {
      if (item.locked) return true;
      return hasAccess(item);
    });
  }, [adminMenuItems, hasAccess, userRoles, user]);

  // Check if user has access to admin menu
  const hasAdminAccess = accessibleAdminItems.length > 0;

  const handleSignOut = () => {
    clearUser();
    onLogout();
    navigate("/", { replace: true });
  };

  const toggleDropdown = (sectionId) => {
    const section = navSections.find((s) => s.id === sectionId);
    if (section?.locked) return;

    if (isMenuOpen === sectionId) {
      setIsMenuOpen(null);
    } else {
      // Calculate button position
      const buttonElement = navScrollRef.current?.querySelector(
        `[data-section-id="${sectionId}"]`,
      );
      if (buttonElement && navRef.current) {
        const buttonRect = buttonElement.getBoundingClientRect();
        const navRect = navRef.current.getBoundingClientRect();
        setDropdownPosition({
          left: buttonRect.left - navRect.left,
        });
      }
      setIsMenuOpen(sectionId);
    }
  };

  const closeAllDropdowns = () => {
    setIsMenuOpen(null);
    setIsProfileOpen(false);
    setIsAdminMenuOpen(false);
    setIsMobileMenuOpen(false);
    setExpandedMobileSection(null);
  };

  // Handle navigation to a page
  const handleNavigate = (path, isLocked) => {
    if (isLocked) return;
    closeAllDropdowns();
    navigate(path);
  };

  // Check scroll position for arrows
  const checkScrollArrows = useCallback(() => {
    if (navScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = navScrollRef.current;
      setShowLeftArrow(scrollLeft > 0);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 5);
    }
  }, []);

  // Scroll navigation left/right
  const scrollNav = (direction) => {
    if (navScrollRef.current) {
      const scrollAmount = 200;
      navScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Check arrows on mount and resize
  useEffect(() => {
    checkScrollArrows();
    window.addEventListener("resize", checkScrollArrows);
    return () => window.removeEventListener("resize", checkScrollArrows);
  }, [checkScrollArrows, accessibleNavSections]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (event.target.closest("button")) {
        return;
      }

      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
      if (
        adminMenuRef.current &&
        !adminMenuRef.current.contains(event.target)
      ) {
        setIsAdminMenuOpen(false);
      }
      if (navRef.current && !navRef.current.contains(event.target)) {
        setIsMenuOpen(null);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest("[data-mobile-menu-trigger]")
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- MOBILE & TABLET NAVBAR ---
  if (isMobile || isTablet) {
    return (
      <>
        <nav className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm shadow-sm fixed top-0 left-0 right-0 z-50 transition-colors">
          <div className="px-3 sm:px-4">
            <div className="flex justify-between h-12 items-center">
              {/* Left Side: Menu Button & YQMS Logo */}
              <div className="flex items-center gap-2">
                {/* Mobile Menu Button */}
                <button
                  data-mobile-menu-trigger
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isMobileMenuOpen
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                      : "text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {isMobileMenuOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </button>

                {/* YQMS Logo */}
                <Link
                  to="/home"
                  className="flex-shrink-0 rounded-lg px-3 py-1 text-base font-bold tracking-wide transition-all duration-300 text-blue-600 dark:text-blue-400 hover:bg-gradient-to-r hover:from-amber-400 hover:via-orange-500 hover:to-amber-500 hover:text-white hover:shadow-lg hover:shadow-orange-500/25"
                  style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
                >
                  YQMS
                </Link>
              </div>

              {/* Right Side: Actions */}
              <div className="flex items-center space-x-1 sm:space-x-1.5">
                {/* Language Switcher - Compact */}
                <div className="scale-75 sm:scale-90 origin-right">
                  <LanguageSwitcher />
                </div>

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="p-1.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
                >
                  {theme === "light" ? (
                    <Moon className="w-4 h-4" />
                  ) : (
                    <Sun className="w-4 h-4" />
                  )}
                </button>

                {/* User Profile */}
                {user && (
                  <div className="relative" ref={profileMenuRef}>
                    <button
                      onClick={() => {
                        setIsProfileOpen((p) => !p);
                        setIsAdminMenuOpen(false);
                      }}
                      className="flex items-center"
                    >
                      <img
                        src={user.face_photo || "/default-avatar.png"}
                        alt={user.name}
                        className="h-7 w-7 sm:h-8 sm:w-8 rounded-full object-cover border-2 border-gray-200 dark:border-slate-700"
                      />
                    </button>
                    {isProfileOpen && (
                      <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-lg shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black dark:ring-slate-700 ring-opacity-5 py-1 z-50">
                        <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700">
                          <p className="text-sm font-medium text-slate-800 dark:text-white truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {user.emp_id}
                          </p>
                        </div>
                        <Link
                          to="/profile"
                          onClick={closeAllDropdowns}
                          className="flex items-center w-full px-4 py-2 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Profile
                        </Link>
                        <button
                          onClick={handleSignOut}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-slate-700"
                        >
                          <LogOut className="w-4 h-4 mr-2" />
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Mobile Slide-out Menu */}
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-black/50 z-40 transition-opacity"
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Slide-out Panel */}
            <div
              ref={mobileMenuRef}
              className="fixed top-12 left-0 bottom-0 w-80 bg-white dark:bg-slate-900 z-50 shadow-xl overflow-y-auto transition-transform"
            >
              {/* User Info Header */}
              {user && (
                <div className="p-4 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600">
                  <div className="flex items-center gap-3">
                    <img
                      src={user.face_photo || "/default-avatar.png"}
                      alt={user.name}
                      className="h-12 w-12 rounded-full object-cover border-2 border-white/30"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-white/70 truncate">
                        {user.job_title || "Employee"} • {user.emp_id}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Home Link */}
              <div className="p-2 border-b border-gray-100 dark:border-slate-800">
                <Link
                  to="/home"
                  onClick={closeAllDropdowns}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
                >
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <Home className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <span className="font-medium">Home Dashboard</span>
                </Link>
              </div>

              {/* Section Navigation with Expandable Sub-items */}
              <div className="p-2">
                <p className="px-4 py-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  Modules
                </p>
                <div className="space-y-1">
                  {accessibleNavSections.map((section) => (
                    <div key={section.id}>
                      {/* Section Header */}
                      <button
                        onClick={() => {
                          if (section.locked) return;
                          setExpandedMobileSection(
                            expandedMobileSection === section.id
                              ? null
                              : section.id,
                          );
                        }}
                        disabled={section.locked}
                        className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl transition-all ${
                          section.locked
                            ? "text-slate-400 dark:text-slate-600 cursor-not-allowed bg-slate-50 dark:bg-slate-800/30"
                            : expandedMobileSection === section.id
                              ? `${section.bgColor} ${section.color}`
                              : "text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-1.5 rounded-lg relative ${
                              section.locked
                                ? "bg-slate-100 dark:bg-slate-800"
                                : expandedMobileSection === section.id
                                  ? "bg-white/50 dark:bg-black/20"
                                  : "bg-gray-100 dark:bg-slate-800"
                            }`}
                          >
                            {React.cloneElement(section.icon, {
                              className: `w-4 h-4 ${
                                section.locked
                                  ? "text-slate-400 dark:text-slate-600 opacity-50"
                                  : expandedMobileSection === section.id
                                    ? section.color
                                    : "text-slate-500 dark:text-slate-400"
                              }`,
                            })}
                            {section.locked && (
                              <Lock className="w-2.5 h-2.5 absolute -top-0.5 -right-0.5 text-slate-400" />
                            )}
                          </div>
                          <span
                            className={`text-sm font-medium ${
                              section.locked ? "opacity-50" : ""
                            }`}
                          >
                            {section.title}
                          </span>
                        </div>
                        {section.locked ? (
                          <span className="text-[10px] uppercase font-semibold text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                            Soon
                          </span>
                        ) : (
                          <ChevronDown
                            className={`w-4 h-4 transition-transform ${
                              expandedMobileSection === section.id
                                ? "rotate-180"
                                : ""
                            }`}
                          />
                        )}
                      </button>

                      {/* Sub-items */}
                      {!section.locked &&
                        expandedMobileSection === section.id && (
                          <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                            {section.items.map((item) => (
                              <button
                                key={item.path}
                                onClick={() =>
                                  handleNavigate(item.path, item.locked)
                                }
                                disabled={item.locked}
                                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                                  item.locked
                                    ? "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                                    : "text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                                }`}
                              >
                                {item.title}
                                {item.locked && (
                                  <span className="ml-2 text-[9px] uppercase font-semibold text-slate-400">
                                    Soon
                                  </span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Sign Out Button */}
              <div className="p-4 border-t border-gray-100 dark:border-slate-800">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </>
        )}
      </>
    );
  }

  // --- DESKTOP NAVBAR ---
  return (
    <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm fixed top-0 left-0 right-0 z-50 transition-colors border-b border-slate-200/50 dark:border-slate-800/50">
      <div className="w-full mx-auto px-4 lg:px-6">
        <div className="flex justify-between h-16 items-center">
          {/* Left Side: Logo & Section Navigation */}
          <div className="flex items-center flex-1 min-w-0">
            {/* YQMS Logo */}
            <Link
              to="/home"
              className="flex-shrink-0 rounded-xl px-4 py-2 text-xl font-bold tracking-wide transition-all duration-300 ease-in-out text-blue-600 dark:text-blue-400 hover:bg-gradient-to-r hover:from-amber-400 hover:via-orange-500 hover:to-amber-500 hover:text-white hover:shadow-lg hover:shadow-orange-500/25"
              style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
            >
              YQMS
            </Link>

            {/* Divider */}
            <div className="hidden lg:block w-px h-8 bg-slate-200 dark:bg-slate-700 mx-4" />

            {/* Section Navigation Dropdowns */}
            <div
              className="hidden lg:flex items-center flex-1 min-w-0 relative"
              ref={navRef}
            >
              {/* Left Arrow */}
              {showLeftArrow && (
                <button
                  onClick={() => scrollNav("left")}
                  className="absolute left-0 z-10 p-1.5 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}

              {/* Scrollable Navigation Container */}
              <div
                ref={navScrollRef}
                onScroll={checkScrollArrows}
                className={`flex items-center space-x-1 overflow-x-auto scrollbar-hide scroll-smooth ${
                  showLeftArrow ? "ml-8" : ""
                } ${showRightArrow ? "mr-8" : ""}`}
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {accessibleNavSections.map((section) => (
                  <div key={section.id} className="relative flex-shrink-0">
                    <button
                      data-section-id={section.id}
                      onClick={() => toggleDropdown(section.id)}
                      disabled={section.locked}
                      className={`flex items-center px-3 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                        section.locked
                          ? "text-slate-400 dark:text-slate-600 cursor-not-allowed bg-slate-50 dark:bg-slate-800/30"
                          : isMenuOpen === section.id
                            ? `${section.bgColor} ${section.color}`
                            : "text-slate-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-800"
                      }`}
                    >
                      <div className="relative mr-2">
                        {React.cloneElement(section.icon, {
                          className: section.locked ? "opacity-50" : "",
                        })}
                        {section.locked && (
                          <Lock className="w-2.5 h-2.5 absolute -top-1 -right-1 text-slate-400" />
                        )}
                      </div>
                      <span className={section.locked ? "opacity-50" : ""}>
                        {section.title}
                      </span>
                      {section.locked ? (
                        <span className="ml-2 text-[10px] uppercase font-semibold text-slate-400 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                          Soon
                        </span>
                      ) : (
                        <ChevronDown
                          className={`w-4 h-4 ml-1 transition-transform ${
                            isMenuOpen === section.id ? "rotate-180" : ""
                          }`}
                        />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* Dropdown Menu - Rendered Outside Scrollable Container */}
              {accessibleNavSections.map((section) => {
                if (isMenuOpen !== section.id || section.locked) return null;
                return (
                  <div
                    key={`dropdown-${section.id}`}
                    className="absolute top-full mt-2 w-56 rounded-xl shadow-xl bg-white dark:bg-slate-800 ring-1 ring-black/5 dark:ring-slate-700 py-2 z-50"
                    style={{
                      left: `${dropdownPosition.left}px`,
                    }}
                  >
                    {section.items.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => handleNavigate(item.path, item.locked)}
                        disabled={item.locked}
                        className={`block w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          item.locked
                            ? "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                            : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700"
                        }`}
                      >
                        {item.title}
                        {item.locked && (
                          <span className="ml-2 text-[9px] uppercase font-semibold text-slate-400">
                            Soon
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}

              {/* Right Arrow */}
              {showRightArrow && (
                <button
                  onClick={() => scrollNav("right")}
                  className="absolute right-0 z-10 p-1.5 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right Side: Actions */}
          <div className="flex items-center space-x-2 lg:space-x-3">
            <LanguageSwitcher />

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5" />
              ) : (
                <Sun className="w-5 h-5" />
              )}
            </button>

            {/* Divider */}
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />

            {/* User Profile */}
            {user && (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => {
                    setIsProfileOpen((p) => !p);
                    setIsAdminMenuOpen(false);
                  }}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <img
                    src={user.face_photo || "/default-avatar.png"}
                    alt={user.name}
                    className="h-8 w-8 rounded-lg object-cover ring-2 ring-slate-200 dark:ring-slate-700"
                  />
                  <div className="hidden xl:block text-left">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate max-w-[100px]">
                      {user.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {user.emp_id}
                    </p>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 transition-transform ${
                      isProfileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-xl shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black/5 dark:ring-slate-700 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700">
                      <p className="text-sm font-semibold text-slate-800 dark:text-white">
                        {user.name}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {user.job_title || "Employee"}
                      </p>
                    </div>
                    <Link
                      to="/profile"
                      onClick={closeAllDropdowns}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <User className="w-4 h-4 mr-3 text-slate-400" />
                      View Profile
                    </Link>
                    <Link
                      to="/home"
                      onClick={closeAllDropdowns}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <Home className="w-4 h-4 mr-3 text-slate-400" />
                      Go to Home
                    </Link>
                    <div className="border-t border-gray-100 dark:border-slate-700 my-1" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3" />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Admin Menu (Menu Icon) - Only show if user has admin access */}
            {user && hasAdminAccess && (
              <div className="relative" ref={adminMenuRef}>
                <button
                  onClick={() => {
                    setIsAdminMenuOpen((p) => !p);
                    setIsProfileOpen(false);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    isAdminMenuOpen
                      ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                      : "text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-800"
                  }`}
                  title="Admin Panel"
                >
                  <Menu className="w-5 h-5" />
                </button>
                {isAdminMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl shadow-xl bg-white dark:bg-slate-800 ring-1 ring-black/5 dark:ring-slate-700 py-1 z-50">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-t-xl">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                          <Cog className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-amber-700 dark:text-amber-400">
                            Admin Panel
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            System Configuration
                          </p>
                        </div>
                      </div>
                    </div>

                    {accessibleAdminItems.map((item) => (
                      <button
                        key={item.path}
                        onClick={() => handleNavigate(item.path, item.locked)}
                        disabled={item.locked}
                        className={`flex items-center w-full px-4 py-2.5 text-sm transition-colors ${
                          item.locked
                            ? "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                            : "text-slate-700 dark:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-700"
                        }`}
                      >
                        {item.icon && (
                          <span
                            className={`mr-3 ${
                              item.locked
                                ? "text-slate-300 dark:text-slate-600"
                                : "text-slate-400 dark:text-slate-500"
                            }`}
                          >
                            {item.icon}
                          </span>
                        )}
                        <span className={item.locked ? "opacity-50" : ""}>
                          {item.title}
                        </span>
                        {item.locked && (
                          <Lock className="w-3 h-3 ml-auto text-slate-400" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
