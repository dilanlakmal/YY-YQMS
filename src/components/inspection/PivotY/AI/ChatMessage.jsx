import React, { useState, useMemo } from "react";
import {
  User,
  Sparkles,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const ChatMessage = ({ message }) => {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Handle copy
  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Detect special content types
  const contentAnalysis = useMemo(() => {
    const content = message.content || "";
    return {
      hasAQLResult:
        content.includes("AQL") &&
        (content.includes("PASS") || content.includes("FAIL")),
      hasTable: content.includes("|") && content.includes("---"),
      hasCode: content.includes("```"),
      isLong: content.length > 1000,
      hasDefects: content.toLowerCase().includes("defect"),
    };
  }, [message.content]);

  // Extract AQL status if present
  const aqlStatus = useMemo(() => {
    const content = message.content || "";
    if (content.includes("INSPECTION PASSED") || content.includes("✅")) {
      return "pass";
    }
    if (content.includes("INSPECTION FAILED") || content.includes("❌")) {
      return "fail";
    }
    return null;
  }, [message.content]);

  // Custom components for Markdown
  const markdownComponents = {
    // Code blocks with syntax highlighting look
    code({ node, inline, className, children, ...props }) {
      if (inline) {
        return (
          <code
            className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-indigo-600 dark:text-indigo-400 rounded font-mono text-xs"
            {...props}
          >
            {children}
          </code>
        );
      }
      return (
        <div className="relative my-3">
          <pre className="bg-gray-900 dark:bg-gray-950 text-gray-100 p-4 rounded-xl overflow-x-auto text-xs leading-relaxed">
            <code className={className} {...props}>
              {children}
            </code>
          </pre>
        </div>
      );
    },
    // Tables with better styling
    table({ children }) {
      return (
        <div className="my-4 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
          <table className="w-full text-xs">{children}</table>
        </div>
      );
    },
    thead({ children }) {
      return (
        <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
          {children}
        </thead>
      );
    },
    th({ children }) {
      return (
        <th className="px-3 py-2 text-left font-bold text-[10px] uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
          {children}
        </th>
      );
    },
    td({ children }) {
      return (
        <td className="px-3 py-2 border-b border-gray-100 dark:border-gray-800">
          {children}
        </td>
      );
    },
    // Lists
    ul({ children }) {
      return (
        <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>
      );
    },
    ol({ children }) {
      return (
        <ol className="list-decimal list-inside space-y-1 my-2">{children}</ol>
      );
    },
    // Paragraphs
    p({ children }) {
      return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
    },
    // Strong (bold)
    strong({ children }) {
      return (
        <strong className="font-bold text-gray-900 dark:text-white">
          {children}
        </strong>
      );
    },
    // Headers
    h1({ children }) {
      return <h1 className="text-lg font-bold mt-4 mb-2">{children}</h1>;
    },
    h2({ children }) {
      return <h2 className="text-base font-bold mt-3 mb-2">{children}</h2>;
    },
    h3({ children }) {
      return <h3 className="text-sm font-bold mt-2 mb-1">{children}</h3>;
    },
  };

  return (
    <div
      className={`group flex gap-4 p-4 sm:p-6 transition-colors ${
        isUser
          ? "bg-transparent"
          : "bg-gradient-to-r from-gray-50/80 to-gray-100/50 dark:from-gray-800/50 dark:to-gray-800/30"
      } ${message.isError ? "bg-red-50/50 dark:bg-red-900/10" : ""}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-md ${
          isUser
            ? "bg-gradient-to-br from-gray-600 to-gray-700"
            : message.isError
              ? "bg-gradient-to-br from-red-500 to-red-600"
              : "bg-gradient-to-br from-indigo-500 to-purple-600"
        }`}
      >
        {isUser ? (
          <User size={16} className="text-white" />
        ) : (
          <Sparkles size={16} className="text-white" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100">
              {isUser ? "You" : "Fincheck AI"}
            </span>
            {message.timestamp && (
              <span className="text-[10px] text-gray-400">
                {new Date(message.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            )}
          </div>

          {/* Actions */}
          {!isUser && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Copy"
              >
                {copied ? (
                  <Check size={14} className="text-green-500" />
                ) : (
                  <Copy size={14} />
                )}
              </button>
              {contentAnalysis.isLong && (
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  title={expanded ? "Collapse" : "Expand"}
                >
                  {expanded ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* AQL Status Badge */}
        {aqlStatus && (
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${
              aqlStatus === "pass"
                ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
            }`}
          >
            {aqlStatus === "pass" ? (
              <>
                <CheckCircle size={14} /> AQL PASSED
              </>
            ) : (
              <>
                <XCircle size={14} /> AQL FAILED
              </>
            )}
          </div>
        )}

        {/* Message Content */}
        <div
          className={`prose dark:prose-invert max-w-none text-sm text-gray-700 dark:text-gray-300 ${
            !expanded ? "max-h-40 overflow-hidden relative" : ""
          }`}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {message.content}
            </ReactMarkdown>
          )}

          {!expanded && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 dark:from-gray-800 to-transparent" />
          )}
        </div>

        {/* Expand Button */}
        {contentAnalysis.isLong && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
          >
            Show more...
          </button>
        )}

        {/* Feedback (for AI messages) */}
        {!isUser && !message.isError && (
          <div className="flex items-center gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-gray-400 mr-1">Helpful?</span>
            <button
              onClick={() => setFeedback("up")}
              className={`p-1 rounded transition-colors ${
                feedback === "up"
                  ? "text-green-500 bg-green-50 dark:bg-green-900/30"
                  : "text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30"
              }`}
            >
              <ThumbsUp size={12} />
            </button>
            <button
              onClick={() => setFeedback("down")}
              className={`p-1 rounded transition-colors ${
                feedback === "down"
                  ? "text-red-500 bg-red-50 dark:bg-red-900/30"
                  : "text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
              }`}
            >
              <ThumbsDown size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
