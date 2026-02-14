import axios from "axios";
import { ClipboardList } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../../config";
import { useAuth } from "../../components/authentication/AuthContext";
import { useFormData } from "../../components/context/FormDataContext";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const { updateFormData } = useFormData();

  useEffect(() => {
    const token =
      localStorage.getItem("accessToken") ||
      sessionStorage.getItem("accessToken");
    if (token) {
      authenticateUser(token);
    }
  }, []);

  const authenticateUser = async (token) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/user-profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.status === 200) {
        onLogin();
        updateUser(response.data);
        navigate("/home");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      if (error.response && error.response.status === 401) {
        localStorage.removeItem("accessToken");
        sessionStorage.removeItem("accessToken");
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(""); // Clear previous errors

    if (username && password) {
      try {
        const response = await axios.post(`${API_BASE_URL}/api/login`, {
          username,
          password,
        });

        if (response.status === 200) {
          const { accessToken, refreshToken, user } = response.data;

          // Always store tokens in localStorage for cross-tab compatibility
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          localStorage.setItem("user", JSON.stringify(user));

          // Fire a specific 'login' event for other tabs to notice
          localStorage.setItem("authEvent", `login-${Date.now()}`);

          onLogin(accessToken);
          updateUser(user);
          navigate("/home");
        }
      } catch (error) {
        console.error("Login error:", error);

        // Enhanced error handling
        if (error.response) {
          switch (error.response.status) {
            case 401:
              setError("Invalid username or password");
              break;
            case 403:
              setError("Account is disabled. Please contact administrator.");
              break;
            case 429:
              setError("Too many login attempts. Please try again later.");
              break;
            case 500:
              setError("Server error. Please try again later.");
              break;
            default:
              setError("Login failed. Please try again.");
          }
        } else if (error.request) {
          setError("Network error. Please check your connection.");
        } else {
          setError("An unexpected error occurred. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    } else {
      setError("Please enter both username and password");
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    const refreshToken =
      localStorage.getItem("refreshToken") ||
      sessionStorage.getItem("refreshToken");

    if (!refreshToken) {
      navigate("/login");
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/refresh-token`, {
        refreshToken,
      });

      if (response.status === 200) {
        const { accessToken } = response.data;
        if (localStorage.getItem("refreshToken")) {
          localStorage.setItem("accessToken", accessToken);
        } else {
          sessionStorage.setItem("accessToken", accessToken);
        }
        authenticateUser(accessToken);
      } else {
        navigate("/login");
      }
    } catch (error) {
      navigate("/login");
    }
  };

  useEffect(() => {
    const interval = setInterval(refreshToken, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <ClipboardList className="h-12 w-12 text-blue-600" />
            <h1 className="ml-2 text-4xl font-bold text-blue-600">YQMS</h1>
          </div>

          <div className="flex justify-center items-center mb-8">
            <img
              src={`/assets/Home/YQMSLogoEdit.png`}
              alt="Loading"
              className="h-32 w-32 rounded-full"
            />
          </div>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Welcome Back!
            </h1>
            <p className="text-lg text-gray-600">
              Please enter login details below
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-red-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="username"
                className="block text-s font-medium text-gray-700 mb-1"
              >
                User Name
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className={`appearance-none block w-full px-4 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  error ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter your User Name"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError(""); // Clear error when user starts typing
                }}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-s font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className={`appearance-none block w-full px-4 py-3 border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  error ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="Enter the Password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(""); // Clear error when user starts typing
                }}
              />
            </div>

            <div className="flex items-center">
              <input
                id="rememberMe"
                name="rememberMe"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label
                htmlFor="rememberMe"
                className="ml-2 block text-s text-gray-900"
              >
                Remember me
              </label>
            </div>

            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-s text-blue-600 hover:text-blue-600"
              >
                Forgot password?
              </Link>
            </div>

            <div className="text-center">
              <center>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-40 h-15 flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Logging in...
                    </div>
                  ) : (
                    "Log in"
                  )}
                </button>
              </center>
            </div>

            <p className="text-center text-s text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>

      <div className="flex-1 hidden lg:flex items-center justify-center p-12 bg-black">
        <div className="max-w-2xl text-center">
          <img
            src="https://cdn.sanity.io/images/ztw74qc4/production/91213435f1cf5293b2105aea50d48c3df854ce68-1200x664.jpg?w=1536&fit=max&auto=format"
            alt="Quality Management"
            className="w-full rounded-lg shadow-lg mb-8"
          />
          <p className="text-xl text-gray-600 italic">
            Manage your QC, QA Inspection and Reports with YQMS...
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
