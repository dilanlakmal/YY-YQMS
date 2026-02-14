import { createContext, useEffect, useState } from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";

import "./App.css";
import Navbar from "./components/Navbar";
import RoleManagement from "./components/RoleManagement";

// Super Admin Setting
import Setting from "./pages/Setting";

import Home from "./pages/Home";

//Languages
import "../src/lang/i18n";

// Authentication components
import UserList from "./components/users/userList";
import ForgotPassword from "./pages/Auth/ForgotPassword";
import Login from "./pages/Auth/Login";
import Profile from "./pages/Auth/Profile";
import Register from "./pages/Auth/Register";

// Context
import { AuthProvider } from "./components/authentication/AuthContext.jsx";
import { FormDataProvider } from "./components/context/FormDataContext";
import { ThemeProvider } from "./components/context/ThemeContext";

import YPivotQASections from "./pages/YPivotQASections.jsx";
import YPivotQAMeasurements from "./pages/YPivotQAMeasurements.jsx";
import YPivotQATemplates from "./pages/YPivotQATemplates.jsx";
import YPivotQAInspection from "./pages/YPivotQAInspection.jsx";
import YPivotQAReport from "./pages/YPivotQAReport";
import YPivotQAReportFullView from "./components/inspection/PivotY/QAReports/YPivotQAReportFullView";

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return !!localStorage.getItem("accessToken");
  });

  const [detailsSubmitted, setDetailsSubmitted] = useState(false);
  const [sharedState, setSharedState] = useState({
    cumulativeChecked: 0,
    cumulativeDefects: 0,
    cumulativeGoodOutput: 0,
    cumulativeDefectPieces: 0,
    returnDefectList: [],
    returnDefectArray: [],
    returnDefectQty: 0,
    cumulativeReturnDefectQty: 0,
    defectArray: [],
  });
  const [inspectionState, setInspectionState] = useState(null);
  const [returnState, setReturnState] = useState(null);
  const [logsState, setLogsState] = useState({
    details: null,
    logs: [],
    startTime: null,
    lastActionTime: null,
  });
  const [timer, setTimer] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [inspectionStartTime, setInspectionStartTime] = useState(null);

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const handleUpdateSharedState = (newState) => {
    setSharedState((prev) => ({
      ...prev,
      ...newState,
    }));
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  // --- MODIFIED handleLogout ---
  const handleLogout = () => {
    // Clear only localStorage for auth data
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");

    // Also remove sessionStorage items in case old data exists
    sessionStorage.removeItem("accessToken");
    sessionStorage.removeItem("refreshToken");
    sessionStorage.removeItem("user");

    setIsAuthenticated(false);
    resetAllStates();

    // Fire a specific 'logout' event for other tabs to notice.
    localStorage.setItem("authEvent", `logout-${Date.now()}`);
  };

  const resetAllStates = () => {
    setInspectionState(null);
    setReturnState(null);
    setSharedState({
      cumulativeChecked: 0,
      cumulativeDefects: 0,
      cumulativeGoodOutput: 0,
      cumulativeDefectPieces: 0,
      returnDefectList: [],
      returnDefectArray: [],
      returnDefectQty: 0,
      cumulativeReturnDefectQty: 0,
      defectArray: [],
    });
    setLogsState({
      details: null,
      logs: [],
      startTime: null,
      lastActionTime: null,
    });
    setDetailsSubmitted(false);
    setTimer(0);
    setIsPlaying(false);
    setInspectionStartTime(null);
  };

  const handleDetailsSubmit = (details) => {
    const initialState = {
      inspectionData: details,
      defects: {},
      currentDefectCount: {},
      checkedQuantity: 0,
      goodOutput: 0,
      defectPieces: 0,
      language: "english",
      view: "list",
      hasDefectSelected: false,
    };

    setInspectionState(initialState);
    setReturnState({
      ...initialState,
      returnDefects: {},
      returnDefectQty: 0,
    });
    setLogsState((prev) => ({
      ...prev,
      details,
    }));
    setDetailsSubmitted(true);
  };

  const handleLogEntry = (entry) => {
    const currentTime = new Date().getTime();
    let inspectionTime;

    if (logsState.logs.length === 0) {
      inspectionTime = (currentTime - inspectionStartTime.getTime()) / 60000;
    } else {
      inspectionTime = (currentTime - logsState.lastActionTime) / 60000;
    }

    const newEntry = {
      ...entry,
      inspectionTime: inspectionTime.toFixed(2),
    };

    setLogsState((prev) => ({
      ...prev,
      logs: [...prev.logs, newEntry],
      lastActionTime: currentTime,
    }));
  };

  const handlePlayPause = () => {
    const currentTime = new Date();
    setIsPlaying(!isPlaying);

    if (!inspectionStartTime) {
      setInspectionStartTime(currentTime);
      setLogsState((prev) => ({
        ...prev,
        startTime: currentTime.getTime(),
      }));
    }
  };

  const handleSubmit = () => {
    resetAllStates();
  };

  const handleInspectionStateChange = (newState) => {
    setInspectionState((prev) => ({
      ...prev,
      ...newState,
    }));
  };

  const handleReturnStateChange = (newState) => {
    setReturnState((prev) => ({
      ...prev,
      ...newState,
    }));
    if (newState.goodOutput !== inspectionState?.goodOutput) {
      setInspectionState((prev) => ({
        ...prev,
        goodOutput: newState.goodOutput,
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {isAuthenticated && <Navbar onLogout={handleLogout} />}
      <div className={isAuthenticated ? "pt-12 lg:pt-16" : ""}>
        <Routes>
          {/* Public Routes */}
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/home" replace />
              ) : (
                <Login onLogin={handleLogin} />
              )
            }
          />
          {isAuthenticated ? (
            <>
              <Route path="/home" element={<Home />} />

              <Route path="/user-list" element={<UserList />} />
              <Route path="/role-management" element={<RoleManagement />} />
              <Route path="/super-admin-assign" element={<Setting />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/qa-sections" element={<YPivotQASections />} />
              <Route
                path="/qa-measurements"
                element={<YPivotQAMeasurements />}
              />
              <Route path="/qa-templates" element={<YPivotQATemplates />} />
              <Route
                path="/fincheck-inspection"
                element={<YPivotQAInspection />}
              />
              <Route path="/fincheck-reports" element={<YPivotQAReport />} />
              <Route
                path="/fincheck-reports/view/:reportId"
                element={<YPivotQAReportFullView />}
              />
            </>
          ) : (
            <Route path="*" element={<Navigate to="/" replace />} />
          )}
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ThemeProvider>
          <FormDataProvider>
            <AppContent />
          </FormDataProvider>
        </ThemeProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
