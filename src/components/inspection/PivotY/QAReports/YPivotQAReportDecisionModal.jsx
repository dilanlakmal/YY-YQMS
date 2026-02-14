import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import {
  X,
  User,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Gavel,
  Save,
  Loader2,
  Lock,
  Mic,
  Square,
  Trash2,
  History,
  CalendarClock,
  Plus,
  Minus,
  Volume2,
  AlertCircle,
  RefreshCw,
  FileWarning,
} from "lucide-react";
import { createPortal } from "react-dom";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";

// Helper to resolve photo/audio URL
const getAssetUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  const cleanPath = url.startsWith("/") ? url.substring(1) : url;
  const baseUrl = PUBLIC_ASSET_URL.endsWith("/")
    ? PUBLIC_ASSET_URL
    : `${PUBLIC_ASSET_URL}/`;
  return `${baseUrl}${cleanPath}`;
};

// --- Auto Dismiss Modal Component ---
const AutoDismissModal = ({ isOpen, onClose, type, message }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => onClose(), 1500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const isSuccess = type === "success";

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/20 backdrop-blur-[2px] animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col items-center gap-3 min-w-[250px] transform scale-100 transition-all">
        <div
          className={`p-3 rounded-full ${
            isSuccess
              ? "bg-green-100 text-green-600"
              : "bg-red-100 text-red-600"
          }`}
        >
          {isSuccess ? (
            <CheckCircle2 className="w-8 h-8" />
          ) : (
            <AlertCircle className="w-8 h-8" />
          )}
        </div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white text-center">
          {isSuccess ? "Success" : "Error"}
        </h3>
        <p className="text-sm font-medium text-gray-600 dark:text-gray-300 text-center">
          {message}
        </p>
      </div>
    </div>,
    document.body,
  );
};

const getNumSuffix = (num) => {
  const j = num % 10,
    k = num % 100;
  if (j === 1 && k !== 11) return "st";
  if (j === 2 && k !== 12) return "nd";
  if (j === 3 && k !== 13) return "rd";
  return "th";
};

const YPivotQAReportDecisionModal = ({
  isOpen,
  onClose,
  report,
  user,
  onSubmit,
}) => {
  const [status, setStatus] = useState("Approved");
  const [autoComment, setAutoComment] = useState("");

  // New input state (Always starts empty for new modifications)
  const [additionalComment, setAdditionalComment] = useState("");

  // --- Rework PO ---
  const [isReworkPO, setIsReworkPO] = useState(false);
  const [reworkPOComment, setReworkPOComment] = useState("");

  const [leaderDetails, setLeaderDetails] = useState(null);
  const [loadingUser, setLoadingUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [existingDecision, setExistingDecision] = useState(null);

  // Toggle for History Section
  const [showHistory, setShowHistory] = useState(false);

  // --- Audio States (For New Recording) ---
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [recordingDuration, setRecordingDuration] = useState(0);

  const [reportResubmissions, setReportResubmissions] = useState([]);
  const [qaInfo, setQaInfo] = useState(null);
  const [actionRequired, setActionRequired] = useState(false);

  // --- Status Modal State ---
  const [statusModal, setStatusModal] = useState({
    isOpen: false,
    type: "success",
    message: "",
  });

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // 1. Fetch Existing Decision & Leader Details
  useEffect(() => {
    if (!isOpen || !report?.reportId) return;

    const fetchData = async () => {
      setLoadingUser(true);
      try {
        // Fetch Leader Info
        const userRes = await axios.get(
          `${API_BASE_URL}/api/user-details?empId=${user.emp_id}`,
        );
        if (userRes.data) {
          setLeaderDetails(userRes.data);
        }

        // Fetch Decision + Report Info
        const decisionRes = await axios.get(
          `${API_BASE_URL}/api/fincheck-reports/get-decision/${report.reportId}`,
        );

        if (decisionRes.data.success) {
          const { decision, resubmissionHistory, qaInfo } =
            decisionRes.data.data;

          setReportResubmissions(resubmissionHistory || []);
          setQaInfo(qaInfo);

          if (decision) {
            setExistingDecision(decision);
            // Pre-fill STATUS only
            if (decision.decisionStatus) setStatus(decision.decisionStatus);

            // Load Saved Rework PO Data
            if (decision.reworkPO === "Yes") {
              setIsReworkPO(true);
              setReworkPOComment(decision.reworkPOComment || "");
            } else {
              setIsReworkPO(false);
              setReworkPOComment("");
            }

            // LOGIC: Check for "Action Required"
            // Compare last Leader Decision Time vs Last QA Resubmission Time
            if (resubmissionHistory && resubmissionHistory.length > 0) {
              const lastDecisionTime = new Date(decision.updatedAt).getTime();
              const lastResubmission =
                resubmissionHistory[resubmissionHistory.length - 1];
              const lastResubmissionTime = new Date(
                lastResubmission.resubmissionDate,
              ).getTime();

              // If QA submitted AFTER leader decided -> Action Required
              if (lastResubmissionTime > lastDecisionTime) {
                setActionRequired(true);
              } else {
                setActionRequired(false);
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data", error);
        // Fallback user info
        setLeaderDetails({
          emp_id: user.emp_id,
          eng_name: user.eng_name || user.username,
          job_title: "Leader / Manager",
          face_photo: user.face_photo || null,
        });
      } finally {
        setLoadingUser(false);
      }
    };

    fetchData();
  }, [isOpen, report, user]);

  // 2. Auto-Generate System Comment
  useEffect(() => {
    if (report && user) {
      const dateStr = new Date(report.inspectionDate).toLocaleDateString();
      const orderStr = report.orderNos ? report.orderNos.join(", ") : "N/A";
      const approverName =
        leaderDetails?.eng_name || user.eng_name || "Unknown";

      const baseInfo = `Report ID: ${report.reportId}
Inspection Date: ${dateStr}
Order No: ${orderStr}
Report Type: ${report.reportType}
QA ID: ${report.empId}`;

      let statusMsg = "";

      if (status === "Approved") {
        statusMsg = `\n✅ DECISION: APPROVED by ${user.emp_id} - ${approverName}`;
      } else if (status === "Rework") {
        statusMsg = `\n⚠️ DECISION: Marked for REWORK by ${user.emp_id} - ${approverName}`;
      } else if (status === "Rejected") {
        statusMsg = `\n❌ DECISION: REJECTED by ${user.emp_id} - ${approverName}`;
      }

      // Add Critical Header if Rework PO is active
      let criticalHeader = "";
      if (isReworkPO) {
        // Adding extra newlines for visibility in the textarea
        criticalHeader = "!!! CRITICAL: REWORK PO OPEN CARTON REQUIRED !!!\n\n";
      }
      setAutoComment(`${criticalHeader}${baseInfo}\n${statusMsg}`);
      //setAutoComment(`${baseInfo}\n${statusMsg}`);
    }
  }, [status, report, user, leaderDetails, isReworkPO]);

  // --- Date Formatter (+7 Hours) ---
  const formatDecisionDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const localTime = date.getTime() + 0 * 60 * 60 * 1000;
    const newDate = new Date(localTime);

    return newDate.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  // --- Audio Functions ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Microphone error:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingDuration(0);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  // --- Submit Handler ---
  const handleSubmit = async () => {
    if (
      (status === "Rework" || status === "Rejected") &&
      !additionalComment.trim() &&
      !audioBlob
    ) {
      setStatusModal({
        isOpen: true,
        type: "error",
        message: "Please provide a reason (Text or Audio).",
      });
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("reportId", report.reportId);
      formData.append("leaderId", user.emp_id);
      formData.append("leaderName", leaderDetails?.eng_name || user.eng_name);
      formData.append("status", status);
      formData.append("systemComment", autoComment);
      formData.append("additionalComment", additionalComment);

      // Append Rework PO Data
      formData.append("reworkPO", isReworkPO ? "Yes" : "");
      formData.append("reworkPOComment", isReworkPO ? reworkPOComment : "");

      if (audioBlob) {
        formData.append("audioBlob", audioBlob, "recording.webm");
      }

      await axios.post(
        `${API_BASE_URL}/api/fincheck-reports/submit-decision`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      // Broadcast the update to other tabs (specifically ReportMain)
      const channel = new BroadcastChannel("qa_report_updates");
      channel.postMessage({
        type: "DECISION_UPDATE",
        reportId: report.reportId,
        status: status, // e.g., "Approved", "Rework", "Rejected"
        updatedAt: new Date().toISOString(), // Needed to clear "Action Required" flags
      });
      channel.close();

      if (onSubmit) onSubmit({ success: true });
      // Show Success Modal
      setStatusModal({
        isOpen: true,
        type: "success",
        message: existingDecision
          ? "Decision Updated Successfully!"
          : "Decision Saved Successfully!",
      });

      // Delay closing the main modal so user sees the success message
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error("Submission failed", err);
      // Show Error Modal
      setStatusModal({
        isOpen: true,
        type: "error",
        message: "Failed to save decision. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <Gavel className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
              {existingDecision ? "Modify Decision" : "Leader Decision"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
          {/* --- EXISTING DECISION BANNER --- */}
          {existingDecision && (
            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 shadow-sm animate-fadeIn">
              {/* TOP ROW: Status & Action Required Badge */}
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                    <History className="w-5 h-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-blue-500 dark:text-blue-300 uppercase tracking-wide flex items-center gap-2">
                      Current Status:{" "}
                      <span className="text-blue-700 dark:text-blue-100 text-sm">
                        {existingDecision.decisionStatus}
                      </span>
                      {/* ACTION REQUIRED BADGE */}
                      {actionRequired && (
                        <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 border border-red-200 rounded-full text-[10px] font-bold animate-pulse">
                          Action Required
                        </span>
                      )}
                    </p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 mt-0.5">
                      <CalendarClock className="w-3.5 h-3.5 opacity-60" />
                      Decision made at:{" "}
                      {formatDecisionDate(existingDecision.updatedAt)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-bold text-gray-500 border border-gray-200 dark:border-gray-700">
                    Version: {existingDecision.approvalHistory?.length || 1}
                  </span>
                </div>
              </div>

              {/* BOTTOM ROW: QA Resubmission Info */}
              {reportResubmissions.length > 0 && (
                <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                  <p className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                    <span>
                      QA <b>{qaInfo?.empId}</b> ({qaInfo?.empName}) resubmitted
                      report{" "}
                      <b>
                        {
                          reportResubmissions[reportResubmissions.length - 1]
                            .resubmissionNo
                        }
                      </b>
                      {getNumSuffix(
                        reportResubmissions[reportResubmissions.length - 1]
                          .resubmissionNo,
                      )}{" "}
                      time at{" "}
                      <b>
                        {formatDecisionDate(
                          reportResubmissions[reportResubmissions.length - 1]
                            .resubmissionDate,
                        )}
                      </b>
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* --- LEFT COL: Info & Buttons --- */}
            <div className="space-y-6">
              {/* User Card */}
              <div className="bg-gradient-to-r from-slate-50 to-white dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 flex items-center gap-4 shadow-sm relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-indigo-500"></div>
                <div className="w-16 h-16 rounded-full border-2 border-white dark:border-gray-600 shadow-md overflow-hidden bg-gray-200 dark:bg-gray-600 flex-shrink-0 flex items-center justify-center">
                  {loadingUser ? (
                    <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                  ) : leaderDetails?.face_photo ? (
                    <img
                      src={getAssetUrl(leaderDetails.face_photo)}
                      alt="Leader"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">
                    Decision By
                  </p>
                  <h4 className="text-lg font-black text-gray-800 dark:text-white truncate">
                    {leaderDetails?.eng_name || user?.eng_name || "Unknown"}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 mt-1">
                    <span className="font-mono bg-gray-100 dark:bg-gray-600 px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-200 font-bold border border-gray-200 dark:border-gray-500">
                      {user?.emp_id}
                    </span>
                  </div>
                </div>
              </div>

              {/* Rework PO Toggle Section */}
              <div
                className={`p-4 rounded-xl border-2 transition-all ${
                  isReworkPO
                    ? "bg-red-50 border-red-500 dark:bg-red-900/20"
                    : "bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2 rounded-full ${
                        isReworkPO
                          ? "bg-red-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      <FileWarning className="w-5 h-5" />
                    </div>
                    <div>
                      <h4
                        className={`font-bold text-sm ${
                          isReworkPO ? "text-red-700" : "text-gray-600"
                        }`}
                      >
                        Rework PO Required
                      </h4>
                      <p className="text-xs text-gray-500">
                        Flag this order for opening Cartons
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={isReworkPO}
                      onChange={(e) => setIsReworkPO(e.target.checked)}
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                  </label>
                </div>

                {/* Specific Rework PO Comment Field - Only visible if Checked */}
                {isReworkPO && (
                  <div className="mt-3 animate-fadeIn">
                    <label className="text-xs font-bold text-red-600 uppercase mb-1 block">
                      Rework PO Reason (Internal)
                    </label>
                    <textarea
                      className="w-full p-2 bg-white border border-red-200 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-red-500 outline-none"
                      rows="2"
                      placeholder="Why is a Rework PO needed?"
                      value={reworkPOComment}
                      onChange={(e) => setReworkPOComment(e.target.value)}
                    ></textarea>
                  </div>
                )}
              </div>

              {/* Status Buttons */}
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase block mb-3">
                  Select {existingDecision ? "New " : ""}Status
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {["Approved", "Rework", "Rejected"].map((s) => {
                    let colorClass = "";
                    let icon = null;
                    let desc = "";
                    if (s === "Approved") {
                      colorClass =
                        status === s
                          ? "bg-green-50 border-green-500 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                          : "hover:border-green-300 hover:bg-green-50/50";
                      icon = <CheckCircle2 className="w-6 h-6" />;
                      desc = "Result verified OK";
                    } else if (s === "Rework") {
                      colorClass =
                        status === s
                          ? "bg-amber-50 border-amber-500 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400"
                          : "hover:border-amber-300 hover:bg-amber-50/50";
                      icon = <AlertTriangle className="w-6 h-6" />;
                      desc = "Requires corrections";
                    } else {
                      colorClass =
                        status === s
                          ? "bg-red-50 border-red-500 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                          : "hover:border-red-300 hover:bg-red-50/50";
                      icon = <XCircle className="w-6 h-6" />;
                      desc = "Failed inspection";
                    }

                    return (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`flex items-center gap-4 p-3 rounded-xl border-2 transition-all text-left group ${
                          status === s
                            ? `${colorClass} shadow-sm`
                            : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 " +
                              colorClass
                        }`}
                      >
                        <div
                          className={`p-2 rounded-full transition-colors ${
                            status === s
                              ? s === "Approved"
                                ? "bg-green-500 text-white"
                                : s === "Rework"
                                  ? "bg-amber-500 text-white"
                                  : "bg-red-500 text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {icon}
                        </div>
                        <div>
                          <span className="block font-bold uppercase text-sm">
                            {s}
                          </span>
                          <span className="text-xs opacity-80 font-medium">
                            {desc}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* --- RIGHT COL: Comments, History & Audio --- */}
            <div className="flex flex-col h-full space-y-4">
              {/* 1. System Message (Read Only) */}
              <div className="flex-1 min-h-[100px] flex flex-col">
                <label className="text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
                  <Lock className="w-3 h-3" /> System Message
                </label>
                <textarea
                  disabled
                  className={`w-full h-full p-4 border rounded-xl text-sm font-mono resize-none cursor-not-allowed focus:outline-none opacity-80 ${
                    isReworkPO
                      ? "bg-red-50 text-red-800 border-red-200 font-bold"
                      : "bg-gray-100 text-gray-500 border-gray-300"
                  }`}
                  //className="w-full h-full p-4 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm font-mono text-gray-500 dark:text-gray-400 resize-none cursor-not-allowed focus:outline-none opacity-80"
                  value={autoComment}
                ></textarea>
              </div>

              {/* 2. Previous History (Collapsible, Read Only) */}
              {existingDecision &&
                existingDecision.approvalHistory?.length > 0 && (
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 px-3 py-2 rounded-lg transition-colors w-full"
                    >
                      {showHistory ? (
                        <Minus className="w-3 h-3" />
                      ) : (
                        <Plus className="w-3 h-3" />
                      )}
                      Previous Remarks History (
                      {existingDecision.approvalHistory.length})
                    </button>

                    {showHistory && (
                      <div className="mt-2 space-y-3 max-h-[200px] overflow-y-auto custom-scrollbar pr-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                        {[...existingDecision.approvalHistory]
                          .reverse()
                          .map((item, idx) => (
                            <div
                              key={idx}
                              className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${
                                    item.decisionStatus === "Approved"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : item.decisionStatus === "Rework"
                                        ? "bg-amber-50 text-amber-700 border-amber-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                                  }`}
                                >
                                  {item.decisionStatus}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {formatDecisionDate(item.approvalDate)}
                                </span>
                              </div>

                              {/* Read-Only Comment */}
                              {item.additionalComment ? (
                                <p className="text-xs text-gray-600 dark:text-gray-300 italic mb-2">
                                  "{item.additionalComment}"
                                </p>
                              ) : (
                                <p className="text-[10px] text-gray-400 italic mb-2">
                                  No written remarks.
                                </p>
                              )}

                              {/* Read-Only Audio Player */}
                              {item.hasAudio && item.audioUrl && (
                                <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-900 rounded flex items-center gap-2">
                                  <Volume2 className="w-3 h-3 text-gray-500" />
                                  <audio
                                    controls
                                    src={getAssetUrl(item.audioUrl)}
                                    className="h-6 w-full max-w-[150px]"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                )}

              {/* 3. New Input Area (Conditional) */}
              <div className="flex-1 flex flex-col animate-fadeIn border-t border-gray-100 dark:border-gray-700 pt-4">
                <>
                  <label className="text-xs font-bold text-gray-800 dark:text-white uppercase mb-2">
                    New Remarks <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="w-full min-h-[100px] p-4 mb-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-sans focus:ring-2 focus:ring-indigo-500 outline-none resize-none transition-shadow shadow-inner"
                    placeholder={`Type NEW reasons for ${status}...`}
                    value={additionalComment}
                    onChange={(e) => setAdditionalComment(e.target.value)}
                  ></textarea>

                  {/* Audio Recorder */}
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between">
                    {!audioUrl && !isRecording && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500">
                          <Mic className="w-5 h-5" />
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                          Add Voice Note (New)
                        </span>
                      </div>
                    )}
                    {isRecording && (
                      <div className="flex items-center gap-3 text-red-500 animate-pulse">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span className="text-sm font-mono font-bold">
                          {formatTime(recordingDuration)}
                        </span>
                        <span className="text-xs text-gray-500">
                          Recording...
                        </span>
                      </div>
                    )}
                    {audioUrl && !isRecording && (
                      <div className="flex-1 flex items-center gap-3">
                        <audio
                          controls
                          src={audioUrl}
                          className="h-8 w-full max-w-[200px]"
                        />
                        <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Recorded
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      {!isRecording && !audioUrl && (
                        <button
                          onClick={startRecording}
                          className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Mic className="w-3 h-3" /> Record
                        </button>
                      )}
                      {isRecording && (
                        <button
                          onClick={stopRecording}
                          className="px-3 py-1.5 bg-gray-800 text-white hover:bg-black rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Square className="w-3 h-3 fill-current" /> Stop
                        </button>
                      )}
                      {audioUrl && (
                        <button
                          onClick={deleteRecording}
                          className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 transition-colors"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`px-8 py-3 rounded-xl text-sm font-bold text-white shadow-xl flex items-center gap-2 transition-transform active:scale-95 ${
              status === "Rejected"
                ? "bg-red-600 hover:bg-red-700"
                : status === "Rework"
                  ? "bg-amber-500 hover:bg-amber-600"
                  : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {submitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {existingDecision ? "Update Decision" : "Confirm Decision"}
          </button>
        </div>
      </div>
      {/* --- MODAL--- */}
      <AutoDismissModal
        isOpen={statusModal.isOpen}
        onClose={() => setStatusModal({ ...statusModal, isOpen: false })}
        type={statusModal.type}
        message={statusModal.message}
      />
    </div>,
    document.body,
  );
};

export default YPivotQAReportDecisionModal;
