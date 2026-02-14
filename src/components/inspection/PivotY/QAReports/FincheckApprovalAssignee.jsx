import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  User,
  Search,
  Plus,
  Save,
  Trash2,
  Edit2,
  X,
  ShieldCheck,
  Loader2,
  CheckCircle2
} from "lucide-react";
import { API_BASE_URL, PUBLIC_ASSET_URL } from "../../../../../config";

// Helper to construct full image URL
const getPhotoUrl = (url) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  const baseUrl = PUBLIC_ASSET_URL.endsWith("/")
    ? PUBLIC_ASSET_URL.slice(0, -1)
    : PUBLIC_ASSET_URL;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${baseUrl}${path}`;
};

const FincheckApprovalAssignee = () => {
  const [assignees, setAssignees] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form State
  const [editMode, setEditMode] = useState(null); // ID if editing
  const [searchEmpId, setSearchEmpId] = useState("");
  const [foundUser, setFoundUser] = useState(null); // { emp_id, eng_name, face_photo }
  const [selectedBuyers, setSelectedBuyers] = useState([]); // Array of buyer strings
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // --- 1. Fetch Data on Mount ---
  useEffect(() => {
    fetchAssignees();
    fetchBuyers();
  }, []);

  const fetchAssignees = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/api/fincheck-approval/list`);
      if (res.data.success) setAssignees(res.data.data);
    } catch (error) {
      console.error("Error fetching assignees", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBuyers = async () => {
    try {
      const res = await axios.get(
        `${API_BASE_URL}/api/fincheck-approval/buyers`
      );
      if (res.data.success) setBuyers(res.data.data);
    } catch (error) {
      console.error("Error fetching buyers", error);
    }
  };

  // --- 2. User Search Logic ---
  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (searchEmpId && searchEmpId.length >= 2 && !editMode) {
        try {
          const res = await axios.get(
            `${API_BASE_URL}/api/users/search?term=${searchEmpId}`
          );
          setUserSearchResults(res.data || []);
          setShowUserDropdown(true);
        } catch (error) {
          setUserSearchResults([]);
        }
      } else {
        setUserSearchResults([]);
        setShowUserDropdown(false);
      }
    }, 400);
    return () => clearTimeout(delayDebounceFn);
  }, [searchEmpId, editMode]);

  const selectUser = (u) => {
    setFoundUser(u);
    setSearchEmpId(u.emp_id);
    setShowUserDropdown(false);
  };

  // --- 3. Form Handling ---
  const handleBuyerToggle = (buyerName) => {
    setSelectedBuyers((prev) =>
      prev.includes(buyerName)
        ? prev.filter((b) => b !== buyerName)
        : [...prev, buyerName]
    );
  };

  const handleEditClick = (assignee) => {
    setEditMode(assignee._id);
    setFoundUser({
      emp_id: assignee.empId,
      eng_name: assignee.empName,
      face_photo: assignee.facePhoto
    });
    setSearchEmpId(assignee.empId);
    setSelectedBuyers(assignee.allowedCustomers || []);
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancel = () => {
    setEditMode(null);
    setFoundUser(null);
    setSearchEmpId("");
    setSelectedBuyers([]);
  };

  const handleSave = async () => {
    if (!foundUser || selectedBuyers.length === 0) {
      alert("Please select a user and at least one allowed customer.");
      return;
    }

    setSaving(true);
    try {
      if (editMode) {
        // Update
        const res = await axios.put(
          `${API_BASE_URL}/api/fincheck-approval/update/${editMode}`,
          {
            empName: foundUser.eng_name,
            facePhoto: foundUser.face_photo,
            allowedCustomers: selectedBuyers
          }
        );
        if (res.data.success) {
          fetchAssignees();
          handleCancel();
        }
      } else {
        // Create
        const res = await axios.post(
          `${API_BASE_URL}/api/fincheck-approval/add`,
          {
            empId: foundUser.emp_id,
            empName: foundUser.eng_name,
            facePhoto: foundUser.face_photo,
            allowedCustomers: selectedBuyers
          }
        );
        if (res.data.success) {
          fetchAssignees();
          handleCancel();
        }
      }
    } catch (error) {
      alert(error.response?.data?.message || "Error saving assignee");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this assignee?"))
      return;
    try {
      await axios.delete(`${API_BASE_URL}/api/fincheck-approval/delete/${id}`);
      fetchAssignees();
    } catch (error) {
      console.error("Delete error", error);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* --- FORM SECTION --- */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-700 pb-2">
          <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            {editMode ? "Edit Approval Leader" : "Add New Approval Leader"}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: User Search & Info */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Select Employee
            </label>
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Type ID or Name..."
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-60"
                  value={searchEmpId}
                  onChange={(e) => setSearchEmpId(e.target.value)}
                  disabled={!!editMode} // Disable ID change during edit
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              </div>

              {/* Dropdown Results */}
              {showUserDropdown && userSearchResults.length > 0 && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                  {userSearchResults.map((u) => (
                    <button
                      key={u.emp_id}
                      onClick={() => selectUser(u)}
                      className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-center gap-3 transition-colors"
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
                      <div>
                        <p className="font-bold text-sm text-gray-800 dark:text-gray-200">
                          {u.emp_id}
                        </p>
                        <p className="text-xs text-gray-500">{u.eng_name}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Found User Display */}
            {foundUser && (
              <div className="flex items-center gap-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                <div className="w-16 h-16 rounded-full border-4 border-white dark:border-gray-700 shadow-md overflow-hidden bg-gray-200 flex-shrink-0">
                  {foundUser.face_photo ? (
                    <img
                      src={getPhotoUrl(foundUser.face_photo)}
                      alt="User"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-800 dark:text-white">
                    {foundUser.eng_name}
                  </h3>
                  <p className="text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {foundUser.emp_id}
                  </p>
                  <p className="text-xs text-green-600 font-bold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> User Selected
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Right: Customer Selection */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                Allowed Customers (Buyers)
              </label>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {selectedBuyers.length} Selected
              </span>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 max-h-[300px] overflow-y-auto">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {buyers.map((b) => {
                  const isSelected = selectedBuyers.includes(b.buyer);
                  return (
                    <button
                      key={b._id}
                      onClick={() => handleBuyerToggle(b.buyer)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold text-left transition-all border ${
                        isSelected
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105"
                          : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-indigo-300"
                      }`}
                    >
                      {b.buyer}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-2">
              {editMode && (
                <button
                  onClick={handleCancel}
                  className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={!foundUser || saving}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : editMode ? (
                  <Save className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                {editMode ? "Update Assignee" : "Add Leader"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- LIST SECTION --- */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 dark:text-white">
            Approval Leaders List
          </h3>
          <span className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full text-xs font-bold text-gray-600 dark:text-gray-300">
            {assignees.length}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 dark:bg-gray-700 text-xs uppercase font-bold text-gray-500 dark:text-gray-300">
              <tr>
                <th className="px-6 py-3">Leader Info</th>
                <th className="px-6 py-3">Allowed Customers</th>
                <th className="px-6 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="3" className="px-6 py-10 text-center">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
                  </td>
                </tr>
              ) : assignees.length === 0 ? (
                <tr>
                  <td
                    colSpan="3"
                    className="px-6 py-10 text-center text-gray-400"
                  >
                    No approval leaders assigned yet.
                  </td>
                </tr>
              ) : (
                assignees.map((a) => (
                  <tr
                    key={a._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full border border-gray-200 overflow-hidden bg-gray-100 flex-shrink-0">
                          {a.facePhoto ? (
                            <img
                              src={getPhotoUrl(a.facePhoto)}
                              alt={a.empName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 dark:text-white">
                            {a.empName}
                          </p>
                          <p className="text-xs font-mono text-indigo-600 dark:text-indigo-400">
                            {a.empId}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {a.allowedCustomers.map((cust, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[10px] font-bold border border-purple-100 dark:border-purple-800"
                          >
                            {cust}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(a)}
                          className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(a._id)}
                          className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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

export default FincheckApprovalAssignee;
