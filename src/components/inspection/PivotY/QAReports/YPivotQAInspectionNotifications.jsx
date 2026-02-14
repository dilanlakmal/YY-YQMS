import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MessageSquare,
  Play,
  Pause,
  Calendar,
  User,
  Hash,
  Loader2,
  Volume2,
  Copy,
  ClipboardCheck
} from "lucide-react";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";

// Helper to resolve URL
const getAssetUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const baseUrl = PUBLIC_ASSET_URL.endsWith("/")
    ? PUBLIC_ASSET_URL
    : `${PUBLIC_ASSET_URL}/`;
  const cleanPath = url.startsWith("/") ? url.substring(1) : url;
  return `${baseUrl}${cleanPath}`;
};

const NotificationCard = ({ notification }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  const audioRef = React.useRef(null);

  const copyReportId = async () => {
    const reportId = notification.reportId;

    try {
      // Modern Clipboard API - works on all devices
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(reportId);
      } else {
        // Fallback for older browsers/devices
        const textArea = document.createElement("textarea");
        textArea.value = reportId;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Determine Styles based on status
  let statusColor = "bg-gray-100 border-gray-200";
  let icon = null;
  let titleColor = "text-gray-700";

  if (notification.status === "Approved") {
    statusColor =
      "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800";
    icon = <CheckCircle2 className="w-6 h-6 text-green-600" />;
    titleColor = "text-green-700 dark:text-green-400";
  } else if (notification.status === "Rework") {
    statusColor =
      "bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800";
    icon = <AlertTriangle className="w-6 h-6 text-amber-600" />;
    titleColor = "text-amber-700 dark:text-amber-400";
  } else if (notification.status === "Rejected") {
    statusColor =
      "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800";
    icon = <XCircle className="w-6 h-6 text-red-600" />;
    titleColor = "text-red-700 dark:text-red-400";
  }

  return (
    <div
      className={`rounded-xl border p-4 shadow-sm transition-all hover:shadow-md ${statusColor} mb-4`}
    >
      <div className="flex items-start gap-4">
        {/* Icon Column */}
        <div className="flex-shrink-0 mt-1">{icon}</div>

        {/* Content Column */}
        <div className="flex-1 min-w-0">
          {/* Header Row */}
          <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
            <div>
              <h3
                className={`font-bold text-sm uppercase tracking-wide ${titleColor}`}
              >
                {notification.status}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Report: {notification.reportId}
                  <button
                    onClick={copyReportId}
                    className={`ml-1 p-1 rounded transition-all duration-200 ${
                      copied
                        ? "bg-green-100 text-green-600"
                        : "hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-400 hover:text-gray-600"
                    }`}
                    title={copied ? "Copied!" : "Copy Report ID"}
                  >
                    {copied ? (
                      <ClipboardCheck className="w-3 h-3" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />{" "}
                  {new Date(notification.updatedAt).toLocaleString()}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-1 bg-white/50 dark:bg-black/20 px-2 py-1 rounded text-xs font-medium text-gray-600 dark:text-gray-300">
              <User className="w-3 h-3" />
              {notification.leaderName}
            </div>
          </div>

          {/* System Comment */}
          <div className="bg-white/60 dark:bg-black/20 rounded-lg p-3 text-xs font-mono text-gray-600 dark:text-gray-300 mb-3 whitespace-pre-wrap border border-gray-100 dark:border-gray-700">
            {notification.systemComment}
          </div>

          {/* Issues / Additional Remarks (Only if exists) */}
          {(notification.additionalComment || notification.audioUrl) && (
            <div className="space-y-3 pt-2 border-t border-black/5 dark:border-white/5">
              {/* Text Remark */}
              {notification.additionalComment && (
                <div className="flex gap-2">
                  <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold text-gray-500 uppercase block mb-0.5">
                      Leader Remarks:
                    </span>
                    <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                      {notification.additionalComment}
                    </p>
                  </div>
                </div>
              )}

              {/* Audio Player */}
              {notification.audioUrl && (
                <div className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 w-fit">
                  <button
                    onClick={toggleAudio}
                    className="w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4" />
                    ) : (
                      <Play className="w-4 h-4 pl-0.5" />
                    )}
                  </button>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">
                      Voice Note
                    </span>
                    <div className="flex items-center gap-1 text-xs font-medium text-gray-700 dark:text-gray-300">
                      <Volume2 className="w-3 h-3" /> Audio Recording
                    </div>
                  </div>
                  <audio
                    ref={audioRef}
                    src={getAssetUrl(notification.audioUrl)}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const YPivotQAInspectionNotifications = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  // Calculate action-required count (Rework + Rejected only)
  const actionRequiredCount = useMemo(() => {
    return notifications.filter(
      (n) => n.status === "Rework" || n.status === "Rejected"
    ).length;
  }, [notifications]);

  // ADD: Request Browser Notification Permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  //   useEffect(() => {
  //     if (!user?.emp_id) return;

  //     const fetchNotifications = async () => {
  //       setLoading(true);
  //       try {
  //         const res = await axios.get(
  //           `${API_BASE_URL}/api/fincheck-reports/notifications?empId=${user.emp_id}`
  //         );
  //         if (res.data.success) {
  //           setNotifications(res.data.data);
  //         }
  //       } catch (error) {
  //         console.error("Error fetching notifications", error);
  //       } finally {
  //         setLoading(false);
  //       }
  //     };

  useEffect(() => {
    if (!user?.emp_id) return;

    // ADD: Store previous count to detect new notifications
    let previousCount = 0;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await axios.get(
          `${API_BASE_URL}/api/fincheck-reports/notifications?empId=${user.emp_id}`
        );
        if (res.data.success) {
          const newNotifications = res.data.data;

          // ADD: Check for new Rework/Rejected notifications
          const newActionCount = newNotifications.filter(
            (n) => n.status === "Rework" || n.status === "Rejected"
          ).length;

          // Show browser notification if count increased
          if (newActionCount > previousCount && previousCount > 0) {
            showBrowserNotification(newActionCount - previousCount);
          }
          previousCount = newActionCount;

          setNotifications(newNotifications);
        }
      } catch (error) {
        console.error("Error fetching notifications", error);
      } finally {
        setLoading(false);
      }
    };

    // ADD: Browser Notification Function
    const showBrowserNotification = (count) => {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Fincheck Action Required", {
          body: `You have ${count} new report(s) requiring attention.`,
          icon: "/assets/Home/Fincheck_Inspection.png", // Your app icon
          tag: "fincheck-notification", // Prevents duplicate notifications
          requireInteraction: true // Stays until user interacts (mobile)
        });
      }
    };

    fetchNotifications();

    // Optional: Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user?.emp_id]);

  if (loading && notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <Loader2 className="w-10 h-10 animate-spin mb-2" />
        <p>Checking for updates...</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
        <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full mb-3">
          <Bell className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-bold text-gray-600 dark:text-gray-300">
          All Caught Up!
        </h3>
        <p className="text-sm">
          No pending actions or new messages from leaders.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fadeIn pb-20">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Bell className="w-5 h-5 text-indigo-500" />
          Notifications
        </h2>
        <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold border border-red-200">
          {notifications.length} New
        </span>
      </div>

      {notifications.map((notif) => (
        <NotificationCard key={notif._id} notification={notif} />
      ))}
    </div>
  );
};

export default YPivotQAInspectionNotifications;
