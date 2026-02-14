import axios from "axios";
import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../components/authentication/AuthContext";
import { useTranslation } from "react-i18next";
import { API_BASE_URL } from "../../config";
import {
  Layers,
  Settings,
  BarChart3,
  Sun,
  Moon,
  Bell,
  X,
  Loader2,
  AlertCircle,
  ChevronRight,
  Home as HomeIcon,
  FileCheck,
  Cog,
  TrendingUp,
  LayoutDashboard,
  FolderOpen,
  Lock,
} from "lucide-react";

// --- Theme Hook for Dark Mode ---
const useTheme = () => {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("home-theme") || "light",
  );

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove(theme === "dark" ? "light" : "dark");
    root.classList.add(theme);
    localStorage.setItem("home-theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  return { theme, toggleTheme };
};

// --- Custom Hook for Screen Size Detection ---
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

// --- Utility for Push Notifications ---
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// --- Settings Modal Component ---
const SettingsModal = ({
  isOpen,
  onClose,
  user,
  isMobile,
  theme,
  toggleTheme,
}) => {
  const [permission, setPermission] = useState("default");
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [debugError, setDebugError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  useEffect(() => {
    if (!user?.emp_id) {
      setCheckingSubscription(false);
      return;
    }

    const checkSubscriptionStatus = async () => {
      setCheckingSubscription(true);

      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        console.log("Push Messaging not supported");
        setCheckingSubscription(false);
        return;
      }

      setPermission(Notification.permission);

      try {
        const registration = await navigator.serviceWorker.ready;
        const browserSubscription =
          await registration.pushManager.getSubscription();

        if (browserSubscription) {
          try {
            const response = await axios.post(
              `${API_BASE_URL}/api/fincheck-reports/push/verify`,
              {
                empId: user.emp_id,
                endpoint: browserSubscription.endpoint,
              },
            );

            if (response.data.success && response.data.exists) {
              setIsSubscribed(true);
            } else {
              setIsSubscribed(false);
            }
          } catch (verifyError) {
            console.log("Verify API not available, using local check");
            setIsSubscribed(true);
          }
        } else {
          setIsSubscribed(false);
        }
      } catch (e) {
        console.error("Error checking subscription:", e);
        setIsSubscribed(false);
      } finally {
        setCheckingSubscription(false);
      }
    };

    checkSubscriptionStatus();
  }, [user?.emp_id]);

  useEffect(() => {
    if (isOpen) {
      setDebugError(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  const subscribeToPush = async () => {
    if (!user || !user.emp_id) return;
    setLoading(true);
    setDebugError(null);
    setSuccessMessage(null);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);

      if (perm !== "granted") {
        throw new Error(
          "Permission Denied. Please enable notifications in browser settings.",
        );
      }

      let registration;
      try {
        registration = await navigator.serviceWorker.register("/sw.js");
        await navigator.serviceWorker.ready;
      } catch (swError) {
        throw new Error(`SW Register Failed: ${swError.message}`);
      }

      let publicVapidKey;
      try {
        const keyRes = await axios.get(
          `${API_BASE_URL}/api/fincheck-reports/push/vapid-key`,
        );
        publicVapidKey = keyRes.data.publicKey;
      } catch (apiError) {
        throw new Error(`API VAPID Key Error: ${apiError.message}`);
      }

      try {
        const existingSub = await registration.pushManager.getSubscription();
        if (existingSub) {
          await existingSub.unsubscribe();
        }
      } catch (unsubError) {
        console.log("No existing subscription to remove");
      }

      let subscription;
      try {
        const convertedKey = urlBase64ToUint8Array(publicVapidKey);
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedKey,
        });
      } catch (subError) {
        throw new Error(`PushManager Subscribe Error: ${subError.message}`);
      }

      try {
        await axios.post(
          `${API_BASE_URL}/api/fincheck-reports/push/subscribe`,
          {
            empId: user.emp_id,
            subscription: subscription,
            userAgent: navigator.userAgent,
          },
        );
      } catch (backendError) {
        throw new Error(`Backend Save Error: ${backendError.message}`);
      }

      setIsSubscribed(true);
      setSuccessMessage("Notifications enabled successfully!");
    } catch (error) {
      console.error("Push Flow Error:", error);
      setDebugError(error.message || JSON.stringify(error));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] ${
        isMobile ? "" : "flex items-center justify-center"
      }`}
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        className={`relative bg-white dark:bg-slate-900 ${
          isMobile
            ? "h-full w-full"
            : "rounded-2xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto shadow-2xl"
        }`}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-700 px-4 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Settings
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <Bell className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800 dark:text-white">
                  Push Notifications
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Get alerts for Fincheck updates
                </p>
              </div>
            </div>

            {debugError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-3 py-2 rounded-lg mb-3 text-sm">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span className="break-words">{debugError}</span>
                </div>
                <button
                  className="mt-2 text-xs underline"
                  onClick={() => setDebugError(null)}
                >
                  Dismiss
                </button>
              </div>
            )}

            {successMessage && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-3 py-2 rounded-lg mb-3 text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                {successMessage}
              </div>
            )}

            {checkingSubscription ? (
              <div className="flex items-center gap-2 text-slate-500 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking status...
              </div>
            ) : permission === "denied" ? (
              <div className="text-sm text-slate-500 dark:text-slate-400 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                <p className="font-medium text-yellow-700 dark:text-yellow-400 mb-1">
                  Notifications Blocked
                </p>
                <p className="text-xs">
                  Please enable them in your browser settings and refresh the
                  page.
                </p>
              </div>
            ) : permission === "granted" && isSubscribed ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400 text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Notifications are enabled
              </div>
            ) : (
              <button
                onClick={subscribeToPush}
                disabled={loading}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-semibold transition-all ${
                  loading
                    ? "bg-gray-300 dark:bg-slate-700 cursor-not-allowed text-gray-500"
                    : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg active:scale-[0.98]"
                }`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Bell className="w-5 h-5" />
                    Enable Notifications
                  </>
                )}
              </button>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  {theme === "dark" ? (
                    <Moon className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  ) : (
                    <Sun className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 dark:text-white">
                    Appearance
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {theme === "dark" ? "Dark mode" : "Light mode"}
                  </p>
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-white dark:bg-slate-700 shadow-sm border border-gray-200 dark:border-slate-600 transition-all active:scale-95"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-slate-600" />
                )}
              </button>
            </div>
          </div>

          {user && (
            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-slate-800 dark:text-white truncate">
                    {user.name || "User"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.job_title || "Employee"} • ID: {user.emp_id}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="text-center text-xs text-slate-400 dark:text-slate-500 pt-4">
            YQMS Version 2.0
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Mobile Bottom Navigation Component ---
const MobileBottomNav = ({
  sections,
  activeSection,
  onSectionChange,
  onSettingsClick,
}) => {
  const navRef = useRef(null);
  const activeButtonRef = useRef(null);

  useEffect(() => {
    if (activeButtonRef.current && navRef.current) {
      const container = navRef.current;
      const button = activeButtonRef.current;
      const containerRect = container.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();

      if (
        buttonRect.left < containerRect.left ||
        buttonRect.right > containerRect.right
      ) {
        button.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      }
    }
  }, [activeSection]);

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 z-50">
      <div
        ref={navRef}
        className="flex overflow-x-auto scrollbar-hide"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {sections.map((section) => (
          <button
            key={section.id}
            ref={activeSection === section.id ? activeButtonRef : null}
            onClick={() => onSectionChange(section.id)}
            className={`flex-shrink-0 min-w-[72px] flex flex-col items-center py-2 px-2 transition-all duration-200 ${
              section.locked
                ? "text-slate-300 dark:text-slate-600 cursor-not-allowed"
                : activeSection === section.id
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-400 dark:text-slate-500"
            }`}
            disabled={section.locked}
          >
            <div
              className={`p-1.5 rounded-lg transition-colors relative ${
                section.locked
                  ? "bg-slate-100 dark:bg-slate-800"
                  : activeSection === section.id
                    ? "bg-blue-100 dark:bg-blue-900/30"
                    : ""
              }`}
            >
              {React.cloneElement(section.icon, {
                className: `w-5 h-5 ${section.locked ? "opacity-40" : ""}`,
                style: { margin: 0 },
              })}
              {section.locked && (
                <Lock className="w-3 h-3 absolute -top-1 -right-1 text-slate-400" />
              )}
            </div>
            <span
              className={`text-[9px] mt-1 font-medium leading-tight text-center max-w-[60px] truncate ${
                section.locked ? "opacity-40" : ""
              }`}
            >
              {section.title}
            </span>
          </button>
        ))}
        <button
          onClick={onSettingsClick}
          className="flex-shrink-0 min-w-[72px] flex flex-col items-center py-2 px-2 text-slate-400 dark:text-slate-500"
        >
          <div className="p-1.5">
            <Settings className="w-5 h-5" />
          </div>
          <span className="text-[9px] mt-1 font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
};

// --- Mobile Compact Grid Item Component ---
const MobileGridItem = ({ item, onClick, fincheckActionCount }) => {
  const isLocked = item.locked;

  return (
    <div
      onClick={isLocked ? undefined : onClick}
      className={`relative flex flex-col items-center justify-start p-2 rounded-xl shadow-sm transition-all border aspect-square ${
        isLocked
          ? "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60"
          : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 active:scale-[0.95] active:bg-gray-50 dark:active:bg-slate-700"
      }`}
    >
      {/* Lock Icon */}
      {isLocked && (
        <div className="absolute top-1 right-1 bg-slate-200 dark:bg-slate-700 rounded-full p-1">
          <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
        </div>
      )}

      {/* Notification Badge */}
      {item.path === "/fincheck-inspection" &&
        fincheckActionCount > 0 &&
        !isLocked && (
          <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center px-1 shadow-sm animate-pulse">
            {fincheckActionCount}
          </div>
        )}

      <div
        className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden mt-1 ${
          isLocked
            ? "bg-slate-200 dark:bg-slate-700"
            : "bg-gray-50 dark:bg-slate-700"
        }`}
      >
        <img
          src={item.image}
          alt={item.title}
          className={`w-7 h-7 object-contain ${isLocked ? "grayscale" : ""}`}
          onError={(e) => {
            e.target.style.display = "none";
          }}
        />
      </div>
      <h3
        className={`text-[10px] font-medium text-center leading-tight mt-1.5 line-clamp-2 px-0.5 ${
          isLocked
            ? "text-slate-400 dark:text-slate-500"
            : "text-slate-700 dark:text-white"
        }`}
      >
        {item.title}
      </h3>
    </div>
  );
};

// --- Tablet Grid Item Component ---
const TabletGridItem = ({ item, onClick, fincheckActionCount }) => {
  const isLocked = item.locked;

  return (
    <div
      onClick={isLocked ? undefined : onClick}
      className={`relative flex flex-col items-center justify-center p-4 rounded-xl shadow-sm transition-all border ${
        isLocked
          ? "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 cursor-not-allowed"
          : "bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 cursor-pointer hover:shadow-md active:scale-[0.98]"
      }`}
    >
      {/* Lock Icon */}
      {isLocked && (
        <div className="absolute top-2 right-2 bg-slate-200 dark:bg-slate-700 rounded-full p-1.5">
          <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </div>
      )}

      {/* Notification Badge */}
      {item.path === "/fincheck-inspection" &&
        fincheckActionCount > 0 &&
        !isLocked && (
          <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 shadow-sm animate-pulse">
            {fincheckActionCount}
          </div>
        )}

      <img
        src={item.image}
        alt={item.title}
        className={`w-10 h-10 object-contain mb-2 ${
          isLocked ? "grayscale opacity-50" : ""
        }`}
      />
      <h3
        className={`text-xs font-bold text-center line-clamp-2 ${
          isLocked
            ? "text-slate-400 dark:text-slate-500"
            : "text-slate-700 dark:text-slate-100"
        }`}
      >
        {item.title}
      </h3>
      <p
        className={`text-[10px] text-center mt-0.5 line-clamp-1 ${
          isLocked
            ? "text-slate-300 dark:text-slate-600"
            : "text-slate-500 dark:text-slate-400"
        }`}
      >
        {isLocked ? "Coming Soon" : item.description}
      </p>
    </div>
  );
};

// --- Desktop Sidebar Navigation Item ---
const DesktopNavItem = ({ section, isActive, onClick }) => {
  const isLocked = section.locked;

  return (
    <button
      onClick={isLocked ? undefined : onClick}
      disabled={isLocked}
      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${
        isLocked
          ? "text-slate-400 dark:text-slate-600 cursor-not-allowed bg-slate-50 dark:bg-slate-800/30"
          : isActive
            ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
      }`}
    >
      <div
        className={`p-2 rounded-lg transition-colors relative ${
          isLocked
            ? "bg-slate-100 dark:bg-slate-800"
            : isActive
              ? "bg-white/20"
              : "bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700"
        }`}
      >
        {React.cloneElement(section.icon, {
          className: `w-5 h-5 ${isActive ? "text-white" : ""} ${
            isLocked ? "opacity-40" : ""
          }`,
          style: { margin: 0 },
        })}
        {isLocked && (
          <Lock className="w-3 h-3 absolute -top-1 -right-1 text-slate-400" />
        )}
      </div>
      <span
        className={`font-semibold tracking-wide text-sm uppercase ${
          isActive ? "text-white" : ""
        } ${isLocked ? "opacity-40" : ""}`}
        style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
      >
        {section.title}
      </span>
      {isLocked ? (
        <span className="ml-auto text-[10px] uppercase font-semibold text-slate-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
          Soon
        </span>
      ) : (
        <ChevronRight
          className={`w-4 h-4 ml-auto transition-transform ${
            isActive
              ? "text-white/70 translate-x-1"
              : "opacity-0 group-hover:opacity-50"
          }`}
        />
      )}
    </button>
  );
};

// --- Desktop Grid Item Component ---
const DesktopGridItem = ({ item, onClick, fincheckActionCount }) => {
  const isLocked = item.locked;

  return (
    <div
      onClick={isLocked ? undefined : onClick}
      className={`group relative w-full h-full ${
        isLocked ? "cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      {/* Glowing Gradient Background - only for unlocked items */}
      {!isLocked && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-2xl opacity-0 group-hover:opacity-100 blur transition duration-1000 group-hover:duration-200" />
      )}

      {/* Main Content Card */}
      <div
        className={`relative flex flex-col items-center justify-center p-6 rounded-2xl h-full border transition-all duration-300 ${
          isLocked
            ? "bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
            : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm hover:-translate-y-1"
        }`}
      >
        {/* Lock Icon */}
        {isLocked && (
          <div className="absolute top-3 right-3 bg-slate-200 dark:bg-slate-700 rounded-full p-2">
            <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
        )}

        {/* Notification Badge */}
        {item.path === "/fincheck-inspection" &&
          fincheckActionCount > 0 &&
          !isLocked && (
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full min-w-[24px] h-6 flex items-center justify-center px-2 shadow-lg animate-pulse z-10">
              {fincheckActionCount}
            </div>
          )}

        {/* Image Container */}
        <div
          className={`w-24 h-24 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 shadow-inner ${
            isLocked
              ? "bg-slate-200 dark:bg-slate-700"
              : "bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-700 dark:to-slate-800 group-hover:scale-110"
          }`}
        >
          <img
            src={item.image}
            alt={item.title}
            className={`w-20 h-20 object-contain ${
              isLocked ? "grayscale opacity-40" : ""
            }`}
          />
        </div>

        {/* Title */}
        <h3
          className={`text-sm font-bold text-center transition-colors ${
            isLocked
              ? "text-slate-400 dark:text-slate-500"
              : "text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400"
          }`}
        >
          {item.title}
        </h3>

        {/* Description */}
        <p
          className={`text-xs text-center mt-1.5 line-clamp-2 ${
            isLocked
              ? "text-slate-300 dark:text-slate-600"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          {isLocked ? "Coming Soon" : item.description}
        </p>

        {/* Bottom Line Indicator - only for unlocked items */}
        {!isLocked && (
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full group-hover:w-1/2 transition-all duration-300" />
        )}
      </div>
    </div>
  );
};

function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const screenSize = useScreenSize();

  const [errorMessage, setErrorMessage] = useState("");
  const [userRoles, setUserRoles] = useState([]);
  const [roleManagement, setRoleManagement] = useState(null);
  const [pageLoading, setPageLoading] = useState(true);

  const [fincheckActionCount, setFincheckActionCount] = useState(0);
  const [activeSection, setActiveSection] = useState(() => {
    return localStorage.getItem("home-active-section") || null;
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  const sectionRefs = useRef({});

  const isMobile = screenSize === "mobile";
  const isTablet = screenSize === "tablet";

  const allSections = useMemo(
    () => [
      {
        id: "y-pivot",
        title: "Fincheck",
        icon: <FileCheck className="w-5 h-5" />,
        bgColor: "bg-indigo-50 dark:bg-indigo-900/20",
        gradientFrom: "from-indigo-500",
        gradientTo: "to-blue-500",
        locked: false,
        items: [
          {
            path: "/qa-sections",
            roles: ["Fincheck Config"],
            image: "assets/Home/Fincheck_Setting.png",
            title: t("home.qa_sections"),
            description: "Configuration",
            locked: false,
          },
          {
            path: "/qa-measurements",
            roles: ["Fincheck Measurement"],
            image: "assets/Home/FinCheck_Measurements.png",
            title: t("home.qa_measurements"),
            description: "Upload/Measurement Settings",
            locked: false,
          },
          {
            path: "/qa-templates",
            roles: ["Fincheck Templates"],
            image: "assets/Home/Fincheck_Templates.png",
            title: t("home.qa_templates"),
            description: "Template Management",
            locked: false,
          },
          {
            path: "/fincheck-inspection",
            roles: ["Fincheck Inspections"],
            image: "assets/Home/Fincheck_Inspection.png",
            title: t("home.y_pivot_inspection"),
            description: "Inspection Module",
            locked: false,
          },
          {
            path: "/fincheck-reports",
            roles: ["Fincheck Reports"],
            image: "assets/Home/Fincheck_Reports.png",
            title: t("home.y_pivot_report"),
            description: "View Reports",
            locked: false,
          },
          {
            path: "/P88Legacy",
            roles: ["P88"],
            image: "assets/Home/p88Legacy.png",
            title: t("home.p88_Legacy"),
            description: "Historical Data",
            version: "0",
            locked: false,
          },
        ],
      },
      {
        id: "admin-panel",
        title: "Admin",
        icon: <Cog className="w-5 h-5" />,
        bgColor: "bg-slate-100 dark:bg-slate-800/40",
        gradientFrom: "from-slate-500",
        gradientTo: "to-gray-500",
        locked: false,
        items: [
          // User Management - NOT LOCKED
          {
            path: "/user-list",
            roles: ["Admin", "Super Admin"],
            image: "assets/Home/user-management.png",
            title: "User Management",
            description: "Manage Users",
            locked: false,
          },
          // Role Management - NOT LOCKED
          {
            path: "/role-management",
            roles: ["Admin", "Super Admin"],
            image: "assets/Home/role-management.png",
            title: "Role Management",
            description: "Manage Roles & Permissions",
            locked: false,
          },
          // System Admin - LOCKED
          {
            path: "/sysadmin",
            roles: ["System Administration"],
            image: "assets/Home/sysadmin.jpg",
            title: t("home.systemadmin"),
            description: "Modify Defects",
            locked: true,
          },
        ],
      },
      {
        id: "analytics",
        title: "Analytics",
        icon: <TrendingUp className="w-5 h-5" />,
        bgColor: "bg-rose-50 dark:bg-rose-900/20",
        gradientFrom: "from-rose-500",
        gradientTo: "to-red-500",
        locked: true,
        items: [
          {
            path: "/powerbi",
            roles: ["Power BI"],
            image: "assets/Home/powerbi.png",
            title: "Power BI",
            description: "View Power BI Reports",
            locked: true,
          },
        ],
      },
    ],
    [t],
  );

  // Persist active section to localStorage
  useEffect(() => {
    if (activeSection) {
      localStorage.setItem("home-active-section", activeSection);
    }
  }, [activeSection]);

  // STEP 1: Initial check for user authentication
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  // STEP 2: Fetch legacy and user-specific roles once user is available
  useEffect(() => {
    if (user) {
      const fetchBaseRoles = async () => {
        setPageLoading(true);
        setErrorMessage("");
        try {
          const [roleManagementRes, userRolesRes] = await Promise.all([
            axios.get(`${API_BASE_URL}/api/role-management`),
            axios.get(`${API_BASE_URL}/api/user-roles/${user.emp_id}`),
          ]);
          setRoleManagement(roleManagementRes.data);
          setUserRoles(userRolesRes.data.roles);
        } catch (error) {
          console.error("Error fetching base roles:", error);
          setErrorMessage("Error loading base page permissions.");
        } finally {
          setPageLoading(false);
        }
      };
      fetchBaseRoles();
    }
  }, [user]);

  // Hybrid access function (simplified - no IE logic)
  const hasAccess = useCallback(
    (item) => {
      if (!user) return false;
      // Locked items have no access
      if (item.locked) return false;

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

  // Dynamic filtering logic - include locked sections but filter items based on access
  const accessibleSections = useMemo(() => {
    if (pageLoading || !userRoles) return [];

    return allSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          // If item is locked, include it (it will be shown as locked)
          if (item.locked) return true;
          // Otherwise check access
          return hasAccess(item);
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [allSections, hasAccess, pageLoading, userRoles]);

  // Set initial active section when accessible sections are loaded
  useEffect(() => {
    if (accessibleSections.length > 0) {
      const savedSection = localStorage.getItem("home-active-section");
      const sectionExists = accessibleSections.some(
        (s) => s.id === savedSection,
      );

      // Find first non-locked section
      const firstUnlockedSection = accessibleSections.find((s) => !s.locked);

      if (!activeSection || !sectionExists) {
        setActiveSection(
          sectionExists
            ? savedSection
            : firstUnlockedSection?.id || accessibleSections[0].id,
        );
      }
    }
  }, [accessibleSections, activeSection]);

  const handleNavigation = (item) => {
    if (item.locked) {
      setErrorMessage("This feature is coming soon!");
      setTimeout(() => setErrorMessage(""), 3000);
      return;
    }
    if (hasAccess(item)) {
      navigate(item.path);
    } else {
      setErrorMessage("Unauthorized Access");
      setTimeout(() => setErrorMessage(""), 3000);
    }
  };

  const handleTabClick = (sectionId) => {
    const section = accessibleSections.find((s) => s.id === sectionId);
    if (section?.locked) return;

    sectionRefs.current[sectionId]?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleSectionChange = (sectionId) => {
    const section = accessibleSections.find((s) => s.id === sectionId);
    if (section?.locked) return;
    setActiveSection(sectionId);
  };

  // Get current section items for mobile/tablet view
  const currentSectionItems = useMemo(() => {
    if (!activeSection) return [];
    const section = accessibleSections.find((s) => s.id === activeSection);
    return section ? section.items : [];
  }, [activeSection, accessibleSections]);

  const currentSection = useMemo(() => {
    return accessibleSections.find((s) => s.id === activeSection);
  }, [activeSection, accessibleSections]);

  // Fetch Fincheck Action Required Count for Badge
  useEffect(() => {
    if (!user?.emp_id) return;

    const fetchActionCount = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-reports/action-count?empId=${user.emp_id}`,
        );
        if (res.data.success) {
          setFincheckActionCount(res.data.count);
        }
      } catch (error) {
        console.error("Error fetching action count:", error);
      }
    };

    fetchActionCount();

    const interval = setInterval(fetchActionCount, 60000);
    return () => clearInterval(interval);
  }, [user?.emp_id]);

  // Register Service Worker on Mount (Required for Push Notifications)
  useEffect(() => {
    if (!user?.emp_id) return;

    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      console.log("Push Messaging not supported");
      return;
    }

    const registerServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        console.log("Service Worker registered:", registration.scope);
      } catch (error) {
        console.error("Service Worker registration failed:", error);
      }
    };

    registerServiceWorker();
  }, [user?.emp_id]);

  if (loading || pageLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-slate-900 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <div className="text-sm text-gray-600 dark:text-gray-300">
          Loading...
        </div>
      </div>
    );
  }

  // --- Mobile Layout ---
  if (isMobile) {
    return (
      <>
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          user={user}
          isMobile={true}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        <div className="fixed inset-0 top-12 bg-gray-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex flex-col overflow-hidden">
          <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between px-4 h-12">
              <div className="flex items-center gap-2">
                {currentSection && (
                  <>
                    <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      {React.cloneElement(currentSection.icon, {
                        className: "w-4 h-4 text-blue-600 dark:text-blue-400",
                        style: { margin: 0 },
                      })}
                    </div>
                    <h1 className="text-sm font-bold text-slate-800 dark:text-white">
                      {currentSection.title}
                    </h1>
                  </>
                )}
              </div>
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
          </header>

          {errorMessage && (
            <div className="mx-3 mt-2 bg-red-500 text-white text-center py-2 rounded-lg text-xs font-medium">
              {errorMessage}
            </div>
          )}

          <main className="p-2 pb-24 overflow-y-auto">
            {currentSectionItems.length > 0 ? (
              <div className="grid grid-cols-4 gap-2">
                {currentSectionItems.map((item, index) => (
                  <MobileGridItem
                    key={index}
                    item={item}
                    onClick={() => handleNavigation(item)}
                    fincheckActionCount={fincheckActionCount}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <HomeIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  No items available in this section
                </p>
              </div>
            )}
          </main>

          <MobileBottomNav
            sections={accessibleSections}
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            onSettingsClick={() => setSettingsOpen(true)}
          />
        </div>
      </>
    );
  }

  // --- Tablet Layout ---
  if (isTablet) {
    return (
      <>
        <SettingsModal
          isOpen={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          user={user}
          isMobile={false}
          theme={theme}
          toggleTheme={toggleTheme}
        />
        <div className="fixed inset-0 top-12 bg-gray-100 dark:bg-slate-950 text-slate-800 dark:text-slate-200 flex flex-col overflow-hidden">
          <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between px-4 h-14">
              <div className="flex items-center gap-2">
                {currentSection && (
                  <>
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      {React.cloneElement(currentSection.icon, {
                        className: "w-5 h-5 text-blue-600 dark:text-blue-400",
                        style: { margin: 0 },
                      })}
                    </div>
                    <h1 className="text-base font-bold text-slate-800 dark:text-white">
                      {currentSection.title}
                    </h1>
                  </>
                )}
              </div>
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
              </button>
            </div>
          </header>

          {errorMessage && (
            <div className="mx-4 mt-2 bg-red-500 text-white text-center py-2 rounded-lg text-sm font-medium">
              {errorMessage}
            </div>
          )}

          <main className="p-4 pb-24 overflow-y-auto">
            {currentSectionItems.length > 0 ? (
              <div className="grid grid-cols-4 gap-3">
                {currentSectionItems.map((item, index) => (
                  <TabletGridItem
                    key={index}
                    item={item}
                    onClick={() => handleNavigation(item)}
                    fincheckActionCount={fincheckActionCount}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-200 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <HomeIcon className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-slate-500 dark:text-slate-400">
                  No items available in this section
                </p>
              </div>
            )}
          </main>

          <MobileBottomNav
            sections={accessibleSections}
            activeSection={activeSection}
            onSectionChange={handleSectionChange}
            onSettingsClick={() => setSettingsOpen(true)}
          />
        </div>
      </>
    );
  }

  // --- Desktop Layout (Vertical Sidebar - Matching YM YQMS) ---
  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        user={user}
        isMobile={false}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <div className="flex h-full">
        {/* --- Vertical Sidebar Navigation --- */}
        <aside className="w-72 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-xl">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <LayoutDashboard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1
                  className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent tracking-tight"
                  style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif" }}
                >
                  YQMS
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Quality Management System
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
            {accessibleSections.map((section) => (
              <DesktopNavItem
                key={section.id}
                section={section}
                isActive={activeSection === section.id}
                onClick={() => handleSectionChange(section.id)}
              />
            ))}
          </nav>

          {/* Sidebar Footer - User Info & Settings */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            {user && (
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold shadow-md">
                  {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-slate-800 dark:text-white truncate">
                    {user.name || "User"}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {user.job_title || "Employee"}
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSettingsOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300 font-medium text-sm"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </aside>

        {/* --- Main Content Area --- */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {/* Error Message */}
          {errorMessage && (
            <div className="mx-8 mt-6 bg-gradient-to-r from-red-500 to-pink-500 text-white text-center py-3 rounded-xl shadow-lg font-medium">
              {errorMessage}
            </div>
          )}

          {/* Content */}
          <div className="p-8">
            {currentSection ? (
              <div>
                {/* Section Header */}
                <div className="mb-8">
                  <div className="flex items-center gap-4 mb-2">
                    <div
                      className={`p-3 rounded-xl bg-gradient-to-br ${currentSection.gradientFrom} ${currentSection.gradientTo} shadow-lg`}
                    >
                      {React.cloneElement(currentSection.icon, {
                        className: "w-6 h-6 text-white",
                        style: { margin: 0 },
                      })}
                    </div>
                    <div>
                      <h2
                        className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight uppercase"
                        style={{
                          fontFamily: "'Inter', 'Segoe UI', sans-serif",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {currentSection.title}
                      </h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {currentSectionItems.filter((i) => !i.locked).length}{" "}
                        module
                        {currentSectionItems.filter((i) => !i.locked).length !==
                        1
                          ? "s"
                          : ""}{" "}
                        available
                      </p>
                    </div>
                  </div>
                  {/* Decorative Line */}
                  <div className="flex items-center gap-2 mt-4">
                    <div
                      className={`h-1 w-20 rounded-full bg-gradient-to-r ${currentSection.gradientFrom} ${currentSection.gradientTo}`}
                    />
                    <div className="h-1 w-8 rounded-full bg-slate-200 dark:bg-slate-700" />
                    <div className="h-1 w-4 rounded-full bg-slate-200 dark:bg-slate-700" />
                  </div>
                </div>

                {/* Grid Items */}
                {currentSectionItems.length > 0 ? (
                  <div
                    className="grid gap-5"
                    style={{
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(180px, 1fr))",
                    }}
                  >
                    {currentSectionItems.map((item, itemIndex) => (
                      <DesktopGridItem
                        key={itemIndex}
                        item={item}
                        onClick={() => handleNavigation(item)}
                        fincheckActionCount={fincheckActionCount}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20">
                    <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                      <FolderOpen className="w-12 h-12 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                      No Modules Available
                    </h3>
                    <p className="text-slate-500 dark:text-slate-400">
                      Select a different section from the sidebar
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-24 h-24 mx-auto mb-6 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                  <LayoutDashboard className="w-12 h-12 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Welcome to YQMS
                </h2>
                <p className="text-slate-500 dark:text-slate-400">
                  Select a section from the sidebar to get started
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default Home;
