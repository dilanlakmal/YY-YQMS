import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import {
  User,
  Search,
  Plus,
  Save,
  Trash2,
  Edit2,
  BellRing,
  Loader2,
  X,
  Briefcase,
  Users,
  CheckCircle2,
  Tag
} from "lucide-react";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";

// Helper for Image URLs
const getPhotoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const baseUrl = PUBLIC_ASSET_URL.endsWith("/")
    ? PUBLIC_ASSET_URL.slice(0, -1)
    : PUBLIC_ASSET_URL;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${path}`;
};

// Toast notification helper
const showToast = (icon, title, timer = 2500) => {
  const Toast = Swal.mixin({
    toast: true,
    position: "top-end",
    showConfirmButton: false,
    timer: timer,
    timerProgressBar: true,
    didOpen: (toast) => {
      toast.onmouseenter = Swal.stopTimer;
      toast.onmouseleave = Swal.resumeTimer;
    }
  });
  Toast.fire({ icon, title });
};

// Confirm dialog helper
const showConfirm = async (
  title,
  text,
  confirmButtonText = "Yes, delete it!"
) => {
  const result = await Swal.fire({
    title: title,
    text: text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#d33",
    cancelButtonColor: "#3085d6",
    confirmButtonText: confirmButtonText,
    cancelButtonText: "Cancel"
  });
  return result.isConfirmed;
};

const FincheckNotificationGroup = () => {
  const [members, setMembers] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);

  // Staging (Selected but not saved yet)
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Buyer Selection
  const [selectedBuyers, setSelectedBuyers] = useState([]);
  const [selectAllBuyers, setSelectAllBuyers] = useState(false);

  // Edit Mode
  const [editMode, setEditMode] = useState(null);
  const [editingMember, setEditingMember] = useState(null);

  useEffect(() => {
    fetchMembers();
    fetchBuyers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-notification-group/list`
      );
      if (res.data.success) setMembers(res.data.data);
    } catch (error) {
      console.error("Error fetching group", error);
      showToast("error", "Failed to load members");
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyers = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-notification-group/buyers`
      );
      if (res.data.success) setBuyers(res.data.data);
    } catch (error) {
      console.error("Error fetching buyers", error);
      showToast("error", "Failed to load buyers");
    }
  };

  // --- Search Logic ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchTerm && searchTerm.length >= 2 && !editMode) {
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/users/search?term=${searchTerm}`
          );
          setSearchResults(res.data || []);
          setShowDropdown(true);
        } catch (error) {
          setSearchResults([]);
        }
      } else {
        setSearchResults([]);
        setShowDropdown(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, editMode]);

  // --- Handlers ---
  const handleSelectUser = (user) => {
    const isStaged = selectedUsers.some((u) => u.emp_id === user.emp_id);
    const isInDb = members.some((m) => m.empId === user.emp_id);

    if (isStaged) {
      showToast("warning", "User is already selected");
      return;
    }

    if (isInDb) {
      showToast(
        "info",
        "User already exists. You can edit their buyer assignments.",
        3500
      );
      return;
    }

    setSelectedUsers((prev) => [...prev, user]);
    setSearchTerm("");
    setShowDropdown(false);
    showToast("success", `${user.eng_name} added to selection`);
  };

  const handleRemoveFromStaging = (empId) => {
    setSelectedUsers((prev) => prev.filter((u) => u.emp_id !== empId));
  };

  const handleBuyerToggle = (buyerName) => {
    setSelectedBuyers((prev) => {
      const newSelection = prev.includes(buyerName)
        ? prev.filter((b) => b !== buyerName)
        : [...prev, buyerName];

      setSelectAllBuyers(newSelection.length === buyers.length);
      return newSelection;
    });
  };

  const handleSelectAllBuyers = () => {
    if (selectAllBuyers) {
      setSelectedBuyers([]);
      setSelectAllBuyers(false);
    } else {
      setSelectedBuyers(buyers.map((b) => b.buyer));
      setSelectAllBuyers(true);
    }
  };

  const handleAssign = async () => {
    if (selectedUsers.length === 0) {
      showToast("warning", "Please select at least one user");
      return;
    }

    if (selectedBuyers.length === 0) {
      showToast("warning", "Please select at least one buyer");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        members: selectedUsers.map((u) => ({
          empId: u.emp_id,
          empName: u.eng_name,
          jobTitle: u.job_title || "Staff",
          facePhoto: u.face_photo
        })),
        notifiedCustomers: selectedBuyers
      };

      const res = await axios.post(
        `${API_BASE_URL}/api/fincheck-notification-group/add`,
        payload
      );

      if (res.data.success) {
        const result = res.data.data;
        let message = "";
        if (result.added > 0) message += `${result.added} member(s) added. `;
        if (result.updated > 0)
          message += `${result.updated} member(s) updated.`;

        showToast("success", message || "Members assigned successfully", 3000);

        fetchMembers();
        setSelectedUsers([]);
        setSelectedBuyers([]);
        setSelectAllBuyers(false);
      }
    } catch (error) {
      showToast(
        "error",
        error.response?.data?.message || "Failed to assign members"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = (member) => {
    setEditMode(member._id);
    setEditingMember(member);
    setSelectedBuyers(member.notifiedCustomers || []);
    setSelectAllBuyers(member.notifiedCustomers?.length === buyers.length);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditMode(null);
    setEditingMember(null);
    setSelectedBuyers([]);
    setSelectAllBuyers(false);
  };

  const handleUpdateMember = async () => {
    if (selectedBuyers.length === 0) {
      showToast("warning", "Please select at least one buyer");
      return;
    }

    setSaving(true);
    try {
      const res = await axios.put(
        `${API_BASE_URL}/api/fincheck-notification-group/update/${editMode}`,
        {
          notifiedCustomers: selectedBuyers,
          empName: editingMember.empName,
          jobTitle: editingMember.jobTitle,
          facePhoto: editingMember.facePhoto
        }
      );

      if (res.data.success) {
        showToast("success", "Member updated successfully");
        fetchMembers();
        handleCancelEdit();
      }
    } catch (error) {
      showToast(
        "error",
        error.response?.data?.message || "Failed to update member"
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    const confirmed = await showConfirm(
      "Remove Member?",
      `Are you sure you want to remove ${name} from the notification group?`,
      "Yes, remove"
    );

    if (!confirmed) return;

    try {
      await axios.delete(
        `${API_BASE_URL}/api/fincheck-notification-group/delete/${id}`
      );
      showToast("success", "Member removed successfully");
      fetchMembers();
    } catch (error) {
      console.error("Delete failed", error);
      showToast("error", "Failed to remove member");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* --- ADD / EDIT MEMBERS CARD --- */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-700 pb-2">
          <BellRing className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            {editMode
              ? "Edit Member Buyer Assignments"
              : "Add Members to Notification Group"}
          </h2>
          {editMode && (
            <button
              onClick={handleCancelEdit}
              className="ml-auto px-3 py-1 text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Left Side: User Selection / Edit Info */}
          <div className="flex flex-col space-y-4 min-w-0">
            {editMode ? (
              // Edit Mode: Show selected member info
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
                  Editing Member
                </label>
                <div className="flex items-center gap-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                  <div className="w-12 h-12 rounded-full border-2 border-white dark:border-gray-700 shadow-md overflow-hidden bg-gray-200 flex-shrink-0">
                    {editingMember?.facePhoto ? (
                      <img
                        src={getPhotoUrl(editingMember.facePhoto)}
                        alt="User"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white truncate">
                      {editingMember?.empName}
                    </h3>
                    <p className="text-xs font-mono font-bold text-amber-600 dark:text-amber-400">
                      {editingMember?.empId}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5 truncate">
                      {editingMember?.jobTitle || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Add Mode: Search and select users
              <>
                <div className="relative z-20">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
                    Search Employees
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by ID or Name..."
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>

                  {/* Dropdown */}
                  {showDropdown && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl max-h-60 overflow-y-auto z-50">
                      {searchResults.map((u) => (
                        <button
                          key={u.emp_id}
                          onClick={() => handleSelectUser(u)}
                          className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-center gap-3 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                            {u.face_photo ? (
                              <img
                                src={getPhotoUrl(u.face_photo)}
                                className="w-full h-full object-cover"
                                alt=""
                              />
                            ) : (
                              <User className="w-4 h-4 m-2 text-gray-500" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs text-gray-800 dark:text-gray-200">
                              {u.emp_id}
                            </p>
                            <p className="text-[10px] text-gray-500 truncate">
                              {u.eng_name} • {u.job_title || "Staff"}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Staging Area (Selected Users) */}
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      Selected ({selectedUsers.length})
                    </label>
                    {selectedUsers.length > 0 && (
                      <button
                        onClick={() => setSelectedUsers([])}
                        className="text-[10px] text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        Clear
                      </button>
                    )}
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 h-[140px] overflow-y-auto overflow-x-hidden">
                    {selectedUsers.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <User className="w-6 h-6 mb-1.5 opacity-50" />
                        <p className="text-[10px]">No users selected</p>
                        <p className="text-[9px] mt-0.5">
                          Search and click to add
                        </p>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedUsers.map((u) => (
                          <div
                            key={u.emp_id}
                            className="flex items-center gap-1.5 px-2 py-1.5 bg-white dark:bg-gray-800 border border-indigo-100 dark:border-gray-700 rounded-lg shadow-sm max-w-full"
                          >
                            <div className="w-5 h-5 rounded-full bg-gray-200 overflow-hidden flex-shrink-0">
                              {u.face_photo ? (
                                <img
                                  src={getPhotoUrl(u.face_photo)}
                                  className="w-full h-full object-cover"
                                  alt=""
                                />
                              ) : (
                                <User className="w-2.5 h-2.5 m-1 text-gray-500" />
                              )}
                            </div>
                            <div className="min-w-0 max-w-[80px]">
                              <p className="text-[10px] font-bold text-gray-800 dark:text-gray-200 truncate leading-tight">
                                {u.eng_name}
                              </p>
                              <p className="text-[8px] text-gray-500 truncate leading-tight">
                                {u.emp_id}
                              </p>
                            </div>
                            <button
                              onClick={() => handleRemoveFromStaging(u.emp_id)}
                              className="p-0.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors flex-shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Right Side: Buyer Selection */}
          <div className="flex flex-col space-y-4 min-w-0">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" />
                Notify for Buyers
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-full">
                  {selectedBuyers.length} Selected
                </span>
                <button
                  onClick={handleSelectAllBuyers}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                    selectAllBuyers
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-indigo-100"
                  }`}
                >
                  {selectAllBuyers ? "Deselect All" : "Select All"}
                </button>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-3 h-[180px] overflow-y-auto">
              {buyers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <Loader2 className="w-5 h-5 animate-spin mb-2" />
                  <p className="text-[10px]">Loading buyers...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {buyers.map((b) => {
                    const isSelected = selectedBuyers.includes(b.buyer);
                    return (
                      <button
                        key={b._id}
                        onClick={() => handleBuyerToggle(b.buyer)}
                        className={`px-2 py-1.5 rounded-lg text-[10px] font-bold text-left transition-all border flex items-center gap-1.5 ${
                          isSelected
                            ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                            : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-indigo-300"
                        }`}
                      >
                        {isSelected && (
                          <CheckCircle2 className="w-3 h-3 flex-shrink-0" />
                        )}
                        <span className="truncate">{b.buyer}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              {editMode ? (
                <>
                  <button
                    onClick={handleCancelEdit}
                    className="px-4 py-2 rounded-xl font-bold text-xs text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateMember}
                    disabled={saving || selectedBuyers.length === 0}
                    className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                  >
                    {saving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    Update
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAssign}
                  disabled={
                    saving ||
                    selectedUsers.length === 0 ||
                    selectedBuyers.length === 0
                  }
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  Assign{" "}
                  {selectedUsers.length > 0 ? `(${selectedUsers.length})` : ""}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* --- LIST TABLE --- */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-indigo-500" />
            Notification Group
          </h3>
          <span className="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full text-[10px] font-bold border border-indigo-200 dark:border-indigo-800">
            {members.length} Members
          </span>
        </div>

        {/* Scrollable Table Container */}
        <div className="overflow-auto max-h-[500px]">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 dark:bg-gray-700 text-[10px] uppercase font-bold text-gray-500 dark:text-gray-300 sticky top-0 z-10">
              <tr>
                <th className="px-4 sm:px-6 py-3 whitespace-nowrap">
                  User Info
                </th>
                <th className="px-4 sm:px-6 py-3 whitespace-nowrap">
                  Job Title
                </th>
                <th className="px-4 sm:px-6 py-3 whitespace-nowrap">
                  Buyer Group
                </th>
                <th className="px-4 sm:px-6 py-3 text-center whitespace-nowrap">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-10 text-center">
                    <Loader2 className="w-6 h-6 text-indigo-500 animate-spin mx-auto" />
                    <p className="text-xs text-gray-400 mt-2">
                      Loading members...
                    </p>
                  </td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No members in the group yet.</p>
                    <p className="text-[10px] mt-1">
                      Add members using the form above.
                    </p>
                  </td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr
                    key={m._id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      editMode === m._id
                        ? "bg-amber-50 dark:bg-amber-900/10"
                        : ""
                    }`}
                  >
                    {/* User Info */}
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full border border-gray-200 overflow-hidden bg-gray-100 flex-shrink-0">
                          {m.facePhoto ? (
                            <img
                              src={getPhotoUrl(m.facePhoto)}
                              alt={m.empName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-gray-800 dark:text-white max-w-[120px]">
                            {m.empName}
                          </p>
                          <p className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
                            {m.empId}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Job Title */}
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                        <Briefcase className="w-3 h-3 opacity-50 flex-shrink-0" />
                        <span className="font-medium text-[10px] truncate max-w-[100px]">
                          {m.jobTitle || "N/A"}
                        </span>
                      </div>
                    </td>

                    {/* Buyer Group - Display All */}
                    <td className="px-4 sm:px-6 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[400px]">
                        {m.notifiedCustomers &&
                        m.notifiedCustomers.length > 0 ? (
                          m.notifiedCustomers.map((cust, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[9px] font-bold border border-purple-100 dark:border-purple-800 whitespace-nowrap"
                            >
                              {cust}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-gray-400 italic">
                            No buyers assigned
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 sm:px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleEditClick(m)}
                          disabled={editMode && editMode !== m._id}
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors group disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Edit Buyers"
                        >
                          <Edit2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        </button>
                        <button
                          onClick={() => handleDelete(m._id, m.empName)}
                          disabled={editMode === m._id}
                          className="p-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors group disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Remove Member"
                        >
                          <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FincheckNotificationGroup;
