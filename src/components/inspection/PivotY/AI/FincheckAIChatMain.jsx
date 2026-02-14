import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import {
  Send,
  Loader2,
  Sparkles,
  Menu,
  BarChart3,
  FileSearch,
  Lightbulb,
  RefreshCw,
  AlertCircle,
  Zap,
} from "lucide-react";
import { API_BASE_URL } from "../../../../../config";
import { useAuth } from "../../../authentication/AuthContext";
import ChatSidebar from "./ChatSidebar";
import ChatMessage from "./ChatMessage";
import QuickActions from "./QuickActions";

const FincheckAIChatMain = () => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load Chats and Stats on Mount
  useEffect(() => {
    if (user?.emp_id) {
      fetchChats();
      fetchStats();
    }
  }, [user?.emp_id]);

  // Fetch user's chats
  const fetchChats = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-ai/list?empId=${user.emp_id}`,
      );
      if (res.data.success) {
        setChats(res.data.data);
      }
    } catch (error) {
      console.error("Failed to load chats", error);
    }
  };

  // Fetch quick stats
  const fetchStats = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-ai/stats?empId=${user.emp_id}`,
      );
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error("Failed to load stats", error);
    }
  };

  // Load chat details
  const loadChatDetails = async (chatId) => {
    setIsLoading(true);
    setError(null);
    setActiveChatId(chatId);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-ai/chat/${chatId}`,
      );
      if (res.data.success) {
        setMessages(res.data.data.messages);
      }
    } catch (error) {
      console.error("Error loading chat", error);
      setError("Failed to load chat history");
    } finally {
      setIsLoading(false);
    }
  };

  // Start new chat
  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setInput("");
    setError(null);
    if (window.innerWidth < 768) setSidebarOpen(false);
    inputRef.current?.focus();
  };

  // Send message
  const handleSendMessage = async (customMessage = null) => {
    const messageToSend = customMessage || input;
    if (!messageToSend.trim()) return;

    setInput("");
    setError(null);

    // Optimistic update
    const tempMessages = [
      ...messages,
      { role: "user", content: messageToSend, timestamp: new Date() },
    ];
    setMessages(tempMessages);
    setIsLoading(true);

    try {
      let currentChatId = activeChatId;

      // Create chat if doesn't exist
      if (!currentChatId) {
        const createRes = await axios.post(
          `${API_BASE_URL}/api/fincheck-ai/create`,
          {
            empId: user.emp_id,
            initialMessage: messageToSend,
          },
        );
        if (createRes.data.success) {
          currentChatId = createRes.data.data._id;
          setActiveChatId(currentChatId);
        }
      }

      // Send message
      const res = await axios.post(`${API_BASE_URL}/api/fincheck-ai/send`, {
        chatId: currentChatId,
        message: messageToSend,
      });

      if (res.data.success) {
        setMessages(res.data.data.messages);
        fetchChats(); // Refresh sidebar
      } else {
        throw new Error(res.data.error || "Failed to send message");
      }
    } catch (error) {
      console.error("Send Error", error);
      setError(
        error.response?.data?.error ||
          error.message ||
          "Failed to send message",
      );
      setMessages([
        ...tempMessages,
        {
          role: "model",
          content:
            "I apologize, but I encountered an error processing your request. Please try again.",
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle quick action
  const handleQuickAction = (prompt) => {
    setInput(prompt);
    setShowQuickActions(false);
    handleSendMessage(prompt);
  };

  // Rename chat
  const handleRename = async (id, newTitle) => {
    try {
      await axios.put(`${API_BASE_URL}/api/fincheck-ai/rename`, {
        chatId: id,
        newTitle,
      });
      fetchChats();
    } catch (e) {
      console.error(e);
    }
  };

  // Delete chat
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this chat?")) return;
    try {
      await axios.post(`${API_BASE_URL}/api/fincheck-ai/delete`, {
        chatId: id,
      });
      fetchChats();
      if (activeChatId === id) handleNewChat();
    } catch (e) {
      console.error(e);
    }
  };

  // Retry last message
  const handleRetry = () => {
    if (messages.length >= 2) {
      const lastUserMessage = [...messages]
        .reverse()
        .find((m) => m.role === "user");
      if (lastUserMessage) {
        setMessages(messages.slice(0, -1));
        handleSendMessage(lastUserMessage.content);
      }
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-[calc(100vh-120px)] bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 rounded-2xl shadow-2xl overflow-hidden border border-gray-200/50 dark:border-gray-800/50">
      {/* Sidebar */}
      <ChatSidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={loadChatDetails}
        onNewChat={handleNewChat}
        onRenameChat={handleRename}
        onDeleteChat={handleDelete}
      />

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile Header Toggle */}
        {!sidebarOpen && (
          <div className="absolute top-4 left-4 z-10 md:hidden">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2.5 bg-white dark:bg-gray-800 shadow-lg rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all"
            >
              <Menu size={20} className="text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        )}

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <WelcomeScreen
              user={user}
              stats={stats}
              onQuickAction={handleQuickAction}
            />
          ) : (
            <div className="flex flex-col pb-4">
              {messages.map((msg, idx) => (
                <ChatMessage key={idx} message={msg} />
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="p-6 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                    <Sparkles size={18} className="text-white animate-pulse" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <span
                        className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                      Analyzing...
                    </span>
                  </div>
                </div>
              )}

              {/* Error with Retry */}
              {error && !isLoading && (
                <div className="mx-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <span className="text-sm text-red-700 dark:text-red-300">
                      {error}
                    </span>
                  </div>
                  <button
                    onClick={handleRetry}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 dark:bg-red-800/30 text-red-700 dark:text-red-300 rounded-lg text-sm font-medium hover:bg-red-200 dark:hover:bg-red-800/50 transition-colors"
                  >
                    <RefreshCw size={14} />
                    Retry
                  </button>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200/50 dark:border-gray-800/50 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto relative">
            {/* Quick Actions Popup */}
            {showQuickActions && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowQuickActions(false)}
                />

                {/* Popup */}
                <div className="absolute bottom-full left-0 right-0 mb-2 max-h-[500px] overflow-y-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 animate-slideUp z-50">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-sm text-gray-800 dark:text-gray-200 flex items-center gap-2">
                      <Zap size={16} className="text-amber-500" />
                      Quick Actions
                    </h3>
                    <button
                      onClick={() => setShowQuickActions(false)}
                      className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                      <svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <QuickActions
                    onAction={handleQuickAction}
                    empId={user?.emp_id}
                    collapsed={false}
                  />
                </div>
              </>
            )}

            {/* Input Box */}
            <div className="relative flex items-end gap-3 bg-white dark:bg-gray-800 rounded-2xl p-2 border border-gray-200 dark:border-gray-700 shadow-lg focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-500 transition-all">
              {/* Quick Actions Toggle Button */}
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className={`flex-shrink-0 p-3 rounded-xl transition-all ${
                  showQuickActions
                    ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
                    : "text-gray-400 hover:text-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700"
                }`}
                title="Quick Actions"
              >
                <Zap size={20} />
              </button>

              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about inspections, defects, AQL results..."
                className="w-full bg-transparent border-0 focus:ring-0 resize-none max-h-32 py-3 px-4 text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm leading-relaxed"
                rows={1}
                style={{ minHeight: "48px" }}
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={!input.trim() || isLoading}
                className={`flex-shrink-0 p-3 rounded-xl mb-0.5 transition-all duration-200 ${
                  input.trim() && !isLoading
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-lg hover:scale-105 active:scale-95"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed"
                }`}
              >
                {isLoading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>

            <p className="text-center text-[10px] text-gray-400 mt-3">
              Press{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-mono">
                Enter
              </kbd>{" "}
              to send •{" "}
              <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-[9px] font-mono">
                Shift+Enter
              </kbd>{" "}
              for new line
            </p>
          </div>
        </div>
      </div>

      {/* Animation Styles */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.2s ease-out;
        }
      `}</style>
    </div>
  );
};

// Welcome Screen Component
const WelcomeScreen = ({ user, stats, onQuickAction }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center p-6 sm:p-8">
      {/* Logo & Greeting */}
      <div className="relative mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl rotate-3 hover:rotate-6 transition-transform">
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white dark:border-gray-900 shadow-lg" />
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-2 text-center">
        Hello, {user?.name?.split(" ")[0] || "there"}! 👋
      </h1>
      <p className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-8">
        I'm your Fincheck AI Assistant. I can help you analyze inspection
        reports, calculate AQL results, and find quality insights.
      </p>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-3 mb-8 w-full max-w-md">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-xl p-3 text-center border border-blue-200/50 dark:border-blue-700/30">
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalReports}
            </p>
            <p className="text-[10px] text-blue-600/70 dark:text-blue-400/70 font-medium uppercase">
              Total Reports
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-3 text-center border border-green-200/50 dark:border-green-700/30">
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {stats.todayReports}
            </p>
            <p className="text-[10px] text-green-600/70 dark:text-green-400/70 font-medium uppercase">
              Today
            </p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-xl p-3 text-center border border-orange-200/50 dark:border-orange-700/30">
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {stats.pendingReports}
            </p>
            <p className="text-[10px] text-orange-600/70 dark:text-orange-400/70 font-medium uppercase">
              Pending
            </p>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="w-full max-w-2xl">
        <QuickActions
          onAction={onQuickAction}
          empId={user?.emp_id}
          collapsed={false}
        />
      </div>
    </div>
  );
};

export default FincheckAIChatMain;
