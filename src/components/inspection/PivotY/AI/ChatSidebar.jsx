import React, { useState, useMemo } from "react";
import {
  MessageSquare,
  Plus,
  MoreVertical,
  Edit3,
  Trash2,
  X,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Clock,
  Sparkles,
  Archive,
} from "lucide-react";

const ChatSidebar = ({
  isOpen,
  setIsOpen,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onRenameChat,
  onDeleteChat,
}) => {
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Filter and group chats
  const groupedChats = useMemo(() => {
    const filtered = chats.filter((chat) =>
      chat.title.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const groups = {
      today: [],
      yesterday: [],
      thisWeek: [],
      older: [],
    };

    filtered.forEach((chat) => {
      const chatDate = new Date(chat.updatedAt);
      if (chatDate >= today) {
        groups.today.push(chat);
      } else if (chatDate >= yesterday) {
        groups.yesterday.push(chat);
      } else if (chatDate >= weekAgo) {
        groups.thisWeek.push(chat);
      } else {
        groups.older.push(chat);
      }
    });

    return groups;
  }, [chats, searchQuery]);

  const startEdit = (e, chat) => {
    e.stopPropagation();
    setEditingId(chat._id);
    setEditTitle(chat.title);
    setMenuOpenId(null);
  };

  const saveEdit = (e, id) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameChat(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelEdit = (e) => {
    e.stopPropagation();
    setEditingId(null);
  };

  const ChatItem = ({ chat }) => (
    <div
      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 ${
        activeChatId === chat._id
          ? "bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
      }`}
      onClick={() => {
        onSelectChat(chat._id);
        if (window.innerWidth < 768) setIsOpen(false);
      }}
    >
      <MessageSquare size={15} className="flex-shrink-0 opacity-60" />

      {editingId === chat._id ? (
        <div
          className="flex items-center gap-1 flex-1 min-w-0"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveEdit(e, chat._id);
              if (e.key === "Escape") cancelEdit(e);
            }}
            className="w-full bg-white dark:bg-gray-900 border border-indigo-300 dark:border-indigo-600 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            autoFocus
          />
          <button
            onClick={(e) => saveEdit(e, chat._id)}
            className="p-1 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 rounded"
          >
            <Check size={14} />
          </button>
          <button
            onClick={cancelEdit}
            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <span className="text-sm font-medium truncate flex-1">
          {chat.title}
        </span>
      )}

      {/* Menu */}
      {!editingId && (
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpenId(menuOpenId === chat._id ? null : chat._id);
            }}
            className={`p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all ${
              menuOpenId === chat._id ? "opacity-100" : ""
            }`}
          >
            <MoreVertical size={14} />
          </button>

          {menuOpenId === chat._id && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setMenuOpenId(null)}
              />
              {/* Menu */}
              <div className="absolute right-0 top-6 w-36 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden animate-fadeIn">
                <button
                  onClick={(e) => startEdit(e, chat)}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-xs hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
                >
                  <Edit3 size={12} /> Rename
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(null);
                    onDeleteChat(chat._id);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-xs hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 transition-colors"
                >
                  <Trash2 size={12} /> Delete
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );

  const ChatGroup = ({ title, chats, icon: Icon }) => {
    if (chats.length === 0) return null;
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 px-3 mb-2">
          <Icon size={12} className="text-gray-400" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {title}
          </span>
        </div>
        <div className="space-y-1">
          {chats.map((chat) => (
            <ChatItem key={chat._id} chat={chat} />
          ))}
        </div>
      </div>
    );
  };

  // Collapsed View
  if (!isOpen) {
    return (
      <div className="hidden md:flex flex-col items-center py-4 bg-gray-50/50 dark:bg-gray-900/50 border-r border-gray-200/50 dark:border-gray-800/50 w-16 h-full">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2.5 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
          title="Expand Sidebar"
        >
          <PanelLeftOpen size={22} />
        </button>
        <div className="my-4 w-8 h-px bg-gray-200 dark:bg-gray-800" />
        <button
          onClick={onNewChat}
          className="p-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all"
          title="New Chat"
        >
          <Plus size={20} />
        </button>
      </div>
    );
  }

  // Expanded View
  return (
    <div className="flex flex-col w-full md:w-72 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-gray-800/50 h-full z-20 absolute md:relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-500" />
          <h3 className="font-bold text-gray-800 dark:text-white">Chats</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg hidden md:block"
        >
          <PanelLeftClose size={18} />
        </button>
        {/* Mobile Close */}
        <button
          onClick={() => setIsOpen(false)}
          className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg md:hidden"
        >
          <X size={18} />
        </button>
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="flex items-center gap-2 w-full px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
        >
          <Plus size={18} />
          <span>New Chat</span>
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full bg-gray-50 dark:bg-gray-800 border-0 rounded-lg py-2 pl-9 pr-3 text-sm focus:ring-2 focus:ring-indigo-500/30 transition-all"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mb-3">
              <MessageSquare size={24} className="text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
              No conversations yet
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Start a new chat to begin
            </p>
          </div>
        ) : (
          <>
            <ChatGroup title="Today" chats={groupedChats.today} icon={Clock} />
            <ChatGroup
              title="Yesterday"
              chats={groupedChats.yesterday}
              icon={Clock}
            />
            <ChatGroup
              title="This Week"
              chats={groupedChats.thisWeek}
              icon={Clock}
            />
            <ChatGroup
              title="Older"
              chats={groupedChats.older}
              icon={Archive}
            />
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800">
        <p className="text-[10px] text-center text-gray-400">
          Powered by Fincheck AI
        </p>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.15s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ChatSidebar;
