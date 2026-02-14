import axios from "axios";
import { jsPDF } from "jspdf";
import {
  X,
  ShieldCheck,
  Users as UsersIcon,
  Tag,
  Search,
  ChevronLeft,
  ChevronRight,
  Settings,
  UserPlus,
  Shield,
  FileText,
  Download,
  CheckCircle,
  AlertCircle,
  Loader2,
  Filter,
  Grid3X3,
  List,
} from "lucide-react";
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "../components/authentication/AuthContext";
import { API_BASE_URL } from "../../config";
import autoTable from "jspdf-autotable";

// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const getPageNumbers = () => {
    const pages = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          currentPage === 1
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 shadow-sm"
        }`}
      >
        <ChevronLeft className="w-4 h-4" />
        Previous
      </button>

      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) => (
          <button
            key={index}
            onClick={() => typeof page === "number" && onPageChange(page)}
            disabled={page === "..."}
            className={`min-w-[40px] h-10 rounded-lg text-sm font-medium transition-all duration-200 ${
              page === currentPage
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
                : page === "..."
                  ? "bg-transparent text-gray-400 cursor-default"
                  : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200"
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
          currentPage === totalPages
            ? "bg-gray-100 text-gray-400 cursor-not-allowed"
            : "bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 shadow-sm"
        }`}
      >
        Next
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// User Card Component - Enhanced
const UserCard = ({ user, size = "normal" }) => {
  const sizeClasses = {
    small: "w-20",
    normal: "w-28",
    large: "w-32",
  };

  const imgSizes = {
    small: "w-10 h-10",
    normal: "w-14 h-14",
    large: "w-16 h-16",
  };

  return (
    <div className={`${sizeClasses[size]} flex-shrink-0 group`}>
      <div className="relative">
        <img
          src={user.face_photo || "/default-avatar.png"}
          alt={user.name}
          className={`${imgSizes[size]} mx-auto rounded-full object-cover border-2 border-gray-200 group-hover:border-blue-400 transition-all duration-200 shadow-sm`}
        />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
      </div>
      <div className="mt-2 text-center">
        <div className="text-xs font-semibold text-gray-800 truncate">
          {user.emp_id}
        </div>
        <div className="text-xs text-gray-500 truncate">{user.name}</div>
      </div>
    </div>
  );
};

// Selectable User Card Component - Enhanced
const SelectableUserCard = ({ user, isSelected, onSelect }) => (
  <div
    className={`w-28 flex-shrink-0 p-3 rounded-xl cursor-pointer transition-all duration-200 ${
      isSelected
        ? "bg-blue-50 border-2 border-blue-500 shadow-lg shadow-blue-500/20"
        : "bg-gray-50 border-2 border-transparent hover:bg-gray-100 hover:border-gray-300"
    }`}
    onClick={onSelect}
  >
    <div className="relative">
      <img
        src={user.face_photo || "/default-avatar.png"}
        alt={user.name}
        className={`w-14 h-14 mx-auto rounded-full object-cover transition-all duration-200 ${
          isSelected ? "ring-4 ring-blue-400/50" : ""
        }`}
      />
      <div
        className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center transition-all duration-200 ${
          isSelected
            ? "bg-blue-600 text-white"
            : "bg-gray-200 border-2 border-white"
        }`}
      >
        {isSelected && <CheckCircle className="w-3 h-3" />}
      </div>
    </div>
    <div className="mt-2 text-center">
      <div className="text-xs font-bold text-gray-800 truncate">
        {user.emp_id}
      </div>
      <div className="text-xs text-gray-500 truncate">{user.name}</div>
      <div className="text-[10px] text-gray-400 truncate mt-0.5">
        {user.job_title}
      </div>
    </div>
  </div>
);

// Job Title Group Card
const JobTitleGroupCard = ({ jobTitle, users }) => (
  <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
    <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
      <Tag className="w-4 h-4 text-blue-600" />
      <span className="font-semibold text-gray-800 text-sm">{jobTitle}</span>
      <span className="ml-auto bg-blue-100 text-blue-700 text-xs font-bold px-2 py-0.5 rounded-full">
        {users.length}
      </span>
    </div>
    <div className="flex flex-wrap gap-3">
      {users.map((user) => (
        <UserCard key={user.emp_id} user={user} size="small" />
      ))}
    </div>
  </div>
);

// Tab Button Component
const TabButton = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-6 py-3 text-sm font-medium rounded-t-xl transition-all duration-200 ${
      active
        ? "bg-white text-blue-600 border-t-2 border-x border-blue-500 shadow-sm -mb-px"
        : "bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700"
    }`}
  >
    <Icon className={`w-4 h-4 ${active ? "text-blue-600" : "text-gray-400"}`} />
    {label}
  </button>
);

export default function RoleManagement() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("current");
  const [roles, setRoles] = useState([]);
  const [jobTitles, setJobTitles] = useState([]);
  const [selectedRole, setSelectedRole] = useState("");
  const [selectedJobTitles, setSelectedJobTitles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [matchingUsers, setMatchingUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [userRoles, setUserRoles] = useState([]);
  const [filterRole, setFilterRole] = useState("");
  const [ieRoleSummary, setIeRoleSummary] = useState([]);
  const [loadingIeRoles, setLoadingIeRoles] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Search & Filter states for Current Roles
  const [currentSearchQuery, setCurrentSearchQuery] = useState("");
  const [currentSearchType, setCurrentSearchType] = useState("role");
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredRoles, setFilteredRoles] = useState([]);
  const itemsPerPage = 5;

  // User Roles tab pagination
  const [userRolesPage, setUserRolesPage] = useState(1);
  const userRolesPerPage = 15;

  useEffect(() => {
    fetchRoles();
    fetchJobTitles();
    if (user?.emp_id) {
      fetchUserRoles();
    }
  }, [user?.emp_id]);

  useEffect(() => {
    setFilteredRoles(roles);
  }, [roles]);

  const fetchIeRoleSummary = useCallback(async () => {
    setLoadingIeRoles(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/ie/role-management/summary`,
      );
      setIeRoleSummary(response.data);
    } catch (error) {
      console.error("Error fetching IE role summary:", error);
      setError("Failed to fetch IE process access roles.");
    } finally {
      setLoadingIeRoles(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "ie-roles") {
      fetchIeRoleSummary();
    }
  }, [activeTab, fetchIeRoleSummary]);

  const fetchUserRoles = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/user-roles/${user.emp_id}`,
      );
      setUserRoles(response.data.roles);
    } catch (error) {
      console.error("Error fetching user roles:", error);
    }
  };

  const isSuperAdmin = userRoles.includes("Super Admin");

  const fetchRoles = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/role-management`);
      setRoles(response.data);
    } catch (error) {
      setError("Failed to fetch roles");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchJobTitles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/job-titles`);
      setJobTitles(response.data);
    } catch (error) {
      setError("Failed to fetch job titles");
    }
  };

  // Search handler for Current Roles tab
  const handleCurrentSearch = useCallback(async () => {
    if (!currentSearchQuery.trim()) {
      setFilteredRoles(roles);
      setCurrentPage(1);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/role-management/search`,
        {
          params: {
            query: currentSearchQuery,
            type: currentSearchType,
          },
        },
      );
      setFilteredRoles(response.data);
      setCurrentPage(1);
    } catch (error) {
      console.error("Error searching roles:", error);
      setError("Failed to search roles");
    } finally {
      setIsLoading(false);
    }
  }, [currentSearchQuery, currentSearchType, roles]);

  useEffect(() => {
    // If no search query, just show all roles directly
    if (!currentSearchQuery.trim()) {
      setFilteredRoles(roles);
      setCurrentPage(1);
      return;
    }

    // Only debounce when there's an actual search
    const debounceTimer = setTimeout(() => {
      handleCurrentSearch();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [currentSearchQuery, currentSearchType, roles]);

  // Paginated data for Current Roles
  const paginatedRoles = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRoles.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRoles, currentPage, itemsPerPage]);

  const totalCurrentPages = Math.ceil(filteredRoles.length / itemsPerPage);

  const handleRoleSelect = async (role) => {
    setSelectedRole(role);
    const existingRole = roles.find((r) => r.role === role);
    if (existingRole) {
      setSelectedJobTitles(existingRole.jobTitles);
      const users = [];
      for (const title of existingRole.jobTitles) {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/api/users-by-job-title?jobTitle=${title}`,
          );
          users.push(
            ...response.data.filter(
              (user) => user.working_status === "Working",
            ),
          );
        } catch (error) {
          console.error("Error fetching users for job title:", title);
        }
      }
      setMatchingUsers(users);
      setSelectedUsers(existingRole.users.map((u) => u.emp_id));
      setIsEditing(true);
    } else {
      setSelectedJobTitles([]);
      setMatchingUsers([]);
      setSelectedUsers([]);
      setIsEditing(false);
    }
  };

  const handleJobTitleSelect = async (title) => {
    if (!selectedJobTitles.includes(title)) {
      const newJobTitles = [...selectedJobTitles, title];
      setSelectedJobTitles(newJobTitles);
      try {
        const response = await axios.get(
          `${API_BASE_URL}/api/users-by-job-title?jobTitle=${title}`,
        );
        const workingUsers = response.data.filter(
          (user) => user.working_status === "Working",
        );
        setMatchingUsers((prev) => {
          const existingEmpIds = new Set(prev.map((u) => u.emp_id));
          const newUsers = workingUsers.filter(
            (u) => !existingEmpIds.has(u.emp_id),
          );
          return [...prev, ...newUsers];
        });
      } catch (error) {
        setError("Failed to fetch users");
      }
    }
    setSearchQuery("");
  };

  const handleJobTitleRemove = (title) => {
    setSelectedJobTitles((prev) => prev.filter((t) => t !== title));
    const removedUsers = matchingUsers.filter(
      (user) => user.job_title === title,
    );
    setMatchingUsers((prev) => prev.filter((user) => user.job_title !== title));
    setSelectedUsers((prev) =>
      prev.filter((empId) => !removedUsers.some((u) => u.emp_id === empId)),
    );
  };

  const handleUserSelect = (empId) => {
    setSelectedUsers((prev) =>
      prev.includes(empId)
        ? prev.filter((id) => id !== empId)
        : [...prev, empId],
    );
  };

  const handleSelectAll = () => {
    const allEmpIds = matchingUsers.map((u) => u.emp_id);
    setSelectedUsers(allEmpIds);
  };

  const handleDeselectAll = () => {
    setSelectedUsers([]);
  };

  const handleSubmit = async () => {
    if (!selectedRole || selectedJobTitles.length === 0) {
      setError("Please select both role and job titles");
      return;
    }

    if (selectedUsers.length === 0) {
      setError("Please select at least one user");
      return;
    }

    if (selectedRole === "Admin" && !isSuperAdmin) {
      setError("Only Super Admin can modify Admin role");
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/api/role-management`, {
        role: selectedRole,
        jobTitles: selectedJobTitles,
        selectedUsers: selectedUsers,
      });

      setSuccessMessage(
        isEditing ? "Role updated successfully!" : "Role added successfully!",
      );
      fetchRoles();
      if (!isEditing) {
        setSelectedRole("");
        setSelectedJobTitles([]);
        setMatchingUsers([]);
        setSelectedUsers([]);
      }
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (error) {
      setError(error.response?.data?.message || "Failed to save role");
    } finally {
      setIsLoading(false);
    }
  };

  // Download PDF handler
  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);

    const pdfTitle = filterRole ? `${filterRole} Users Data` : "All Users Data";
    doc.text(pdfTitle, 14, 22);

    const tableData = [];
    roles.forEach((role) => {
      if (filterRole && role.role !== filterRole) return;
      role.users
        .sort((a, b) => (a.emp_id || "").localeCompare(b.emp_id || ""))
        .forEach((user) => {
          tableData.push([
            role.role,
            user.name || "N/A",
            user.emp_id || "N/A",
            user.eng_name || "N/A",
            user.job_title || "N/A",
            user.dept_name || "N/A",
            user.sect_name || "N/A",
          ]);
        });
    });

    const tableColumns = [
      "Role",
      "User Name",
      "Password (Emp ID)",
      "Eng Name",
      "Job Title",
      "Department",
      "Section",
    ];

    autoTable(doc, {
      head: [tableColumns],
      body: tableData,
      startY: 30,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      margin: { top: 30 },
    });

    const pdfFileName = filterRole
      ? `${filterRole}_users.pdf`
      : "All_users.pdf";
    doc.save(pdfFileName);
  };

  const availableRoles = [
    ...(isSuperAdmin ? ["Admin"] : []),
    "QA",
    "Washing Clerk",
    "QA Clerk",
    "Fincheck Config",
    "Fincheck Measurement",
    "Fincheck Templates",
    "Fincheck Inspections",
    "Fincheck Reports",
    "P88",
  ].sort();

  // User Roles tab data
  const sortedTableData = useMemo(() => {
    const data = [];
    roles.forEach((role) => {
      if (filterRole && role.role !== filterRole) return;
      role.users
        .sort((a, b) => (a.emp_id || "").localeCompare(b.emp_id || ""))
        .forEach((user) => {
          data.push({ role: role.role, user });
        });
    });
    return data;
  }, [roles, filterRole]);

  const paginatedUserRoles = useMemo(() => {
    const startIndex = (userRolesPage - 1) * userRolesPerPage;
    return sortedTableData.slice(startIndex, startIndex + userRolesPerPage);
  }, [sortedTableData, userRolesPage]);

  const totalUserRolesPages = Math.ceil(
    sortedTableData.length / userRolesPerPage,
  );

  // Clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/30">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Role Management
              </h1>
              <p className="text-gray-500 text-sm">
                Manage user roles and permissions
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-0">
          <div className="flex gap-1 border-b border-gray-200 bg-gray-100 rounded-t-xl p-1">
            <TabButton
              active={activeTab === "current"}
              onClick={() => setActiveTab("current")}
              icon={Grid3X3}
              label="Current Roles"
            />
            <TabButton
              active={activeTab === "add"}
              onClick={() => setActiveTab("add")}
              icon={UserPlus}
              label="Add/Update Role"
            />
            <TabButton
              active={activeTab === "ie-roles"}
              onClick={() => setActiveTab("ie-roles")}
              icon={Settings}
              label="IE Process Access"
            />
            <TabButton
              active={activeTab === "user-roles"}
              onClick={() => setActiveTab("user-roles")}
              icon={List}
              label="User Roles"
            />
          </div>
        </div>

        {/* Notifications */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError("")} className="ml-auto">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="bg-white rounded-b-xl rounded-tr-xl shadow-xl border border-gray-100">
          {/* ==================== CURRENT ROLES TAB ==================== */}
          {activeTab === "current" && (
            <div className="p-6">
              {/* Search Bar */}
              <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search roles, employees, or job titles..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={currentSearchQuery}
                    onChange={(e) => setCurrentSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="w-5 h-5 text-gray-400" />
                  <select
                    className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    value={currentSearchType}
                    onChange={(e) => setCurrentSearchType(e.target.value)}
                  >
                    <option value="role">Search by Role</option>
                    <option value="emp_id">Search by Emp ID</option>
                    <option value="name">Search by Name</option>
                    <option value="job_title">Search by Job Title</option>
                  </select>
                </div>
              </div>

              {/* Results Count */}
              <div className="mb-4 text-sm text-gray-500">
                Showing {paginatedRoles.length} of {filteredRoles.length} roles
              </div>

              {/* Loading State */}
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <span className="ml-3 text-gray-500">Loading roles...</span>
                </div>
              ) : (
                <>
                  {/* Roles Grid */}
                  <div className="space-y-6">
                    {paginatedRoles.map((role) => {
                      // Group users by job title
                      const usersByJobTitle = role.users.reduce((acc, user) => {
                        const title = user.job_title || "Unknown";
                        if (!acc[title]) acc[title] = [];
                        acc[title].push(user);
                        return acc;
                      }, {});

                      return (
                        <div
                          key={role.role}
                          className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
                        >
                          {/* Role Header - Sticky */}
                          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <ShieldCheck className="w-6 h-6" />
                              <h3 className="text-lg font-bold">{role.role}</h3>
                              <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                                {role.users.length} users
                              </span>
                            </div>
                            <div className="flex gap-2">
                              {role.jobTitles.slice(0, 3).map((title) => (
                                <span
                                  key={title}
                                  className="bg-white/20 text-white text-xs px-3 py-1 rounded-full"
                                >
                                  {title}
                                </span>
                              ))}
                              {role.jobTitles.length > 3 && (
                                <span className="bg-white/30 text-white text-xs px-3 py-1 rounded-full">
                                  +{role.jobTitles.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Users grouped by Job Title */}
                          <div className="p-4 bg-gray-50 max-h-96 overflow-y-auto">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {Object.entries(usersByJobTitle).map(
                                ([jobTitle, users]) => (
                                  <JobTitleGroupCard
                                    key={jobTitle}
                                    jobTitle={jobTitle}
                                    users={users}
                                  />
                                ),
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalCurrentPages}
                    onPageChange={setCurrentPage}
                  />
                </>
              )}
            </div>
          )}

          {/* ==================== ADD/UPDATE ROLE TAB ==================== */}
          {activeTab === "add" && (
            <div className="p-6">
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <UserPlus className="w-6 h-6 text-blue-600" />
                    {isEditing
                      ? "Update Role Assignment"
                      : "Add New Role Assignment"}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Select a role and assign job titles with their users
                  </p>
                </div>

                <div className="space-y-6">
                  {/* Role Selection */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-blue-600" />
                      Select Role
                    </label>
                    <select
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white text-gray-800"
                      value={selectedRole}
                      onChange={(e) => handleRoleSelect(e.target.value)}
                    >
                      <option value="">-- Choose a Role --</option>
                      {availableRoles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    {isEditing && (
                      <div className="mt-2 flex items-center gap-2 text-sm text-amber-600">
                        <AlertCircle className="w-4 h-4" />
                        Editing existing role assignment
                      </div>
                    )}
                  </div>

                  {/* Job Titles Selection */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-blue-600" />
                      Job Titles
                    </label>
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search and select job titles..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <div className="absolute z-20 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                          {jobTitles
                            .filter((title) =>
                              title
                                .toLowerCase()
                                .includes(searchQuery.toLowerCase()),
                            )
                            .map((title) => (
                              <div
                                key={title}
                                className="px-4 py-3 hover:bg-blue-50 cursor-pointer flex items-center gap-2 transition-colors duration-150"
                                onClick={() => handleJobTitleSelect(title)}
                              >
                                <Tag className="w-4 h-4 text-gray-400" />
                                <span className="text-gray-700">{title}</span>
                                {selectedJobTitles.includes(title) && (
                                  <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                                )}
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {/* Selected Job Titles */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {selectedJobTitles.map((title) => (
                        <span
                          key={title}
                          className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium group hover:bg-blue-200 transition-colors duration-150"
                        >
                          {title}
                          <X
                            className="w-4 h-4 cursor-pointer opacity-60 group-hover:opacity-100"
                            onClick={() => handleJobTitleRemove(title)}
                          />
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Users Selection */}
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <UsersIcon className="w-4 h-4 text-blue-600" />
                        Select Users
                        <span className="bg-blue-600 text-white px-2 py-0.5 rounded-full text-xs ml-2">
                          {selectedUsers.length} / {matchingUsers.length}
                        </span>
                      </label>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSelectAll}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Select All
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={handleDeselectAll}
                          className="text-sm text-gray-500 hover:text-gray-700 font-medium"
                        >
                          Deselect All
                        </button>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-200 rounded-xl p-4 min-h-[250px] max-h-[400px] overflow-y-auto">
                      {matchingUsers.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 text-gray-400">
                          <UsersIcon className="w-12 h-12 mb-3" />
                          <p>Select job titles to see available users</p>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          {matchingUsers.map((user) => (
                            <SelectableUserCard
                              key={user.emp_id}
                              user={user}
                              isSelected={selectedUsers.includes(user.emp_id)}
                              onSelect={() => handleUserSelect(user.emp_id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmit}
                    disabled={
                      isLoading || !selectedRole || selectedUsers.length === 0
                    }
                    className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 flex items-center justify-center gap-2 ${
                      isLoading || !selectedRole || selectedUsers.length === 0
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                    }`}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        {isEditing
                          ? "Update Role Assignment"
                          : "Add Role Assignment"}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ==================== IE PROCESS ACCESS TAB ==================== */}
          {activeTab === "ie-roles" && (
            <div className="p-6">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Settings className="w-6 h-6 text-indigo-600" />
                  IE Process Access Summary
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  <span className="inline-flex items-center gap-1 text-amber-600">
                    <AlertCircle className="w-4 h-4" />
                    Read-only view
                  </span>{" "}
                  - Access is granted by assigning workers to specific Task
                  Numbers in the IE dashboard.
                </p>
              </div>

              {loadingIeRoles ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  <span className="ml-3 text-gray-500">
                    Loading IE roles...
                  </span>
                </div>
              ) : (
                <div className="space-y-6">
                  {ieRoleSummary.map((section) => (
                    <div
                      key={section.pageName}
                      className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow duration-300"
                    >
                      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-4 flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6" />
                        <h3 className="text-lg font-bold">
                          {section.pageName}
                        </h3>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-sm ml-auto">
                          {section.users.length} users
                        </span>
                      </div>

                      <div className="p-6 bg-gray-50">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          {/* Required Tasks */}
                          <div className="bg-white rounded-xl p-4 border border-gray-200">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                              <Tag className="w-4 h-4 text-indigo-600" />
                              Required Tasks
                            </label>
                            <div className="flex flex-wrap gap-2">
                              {section.requiredTasks.length > 0 ? (
                                section.requiredTasks.map((task) => (
                                  <span
                                    key={task}
                                    className="bg-indigo-100 text-indigo-700 text-xs font-mono px-3 py-1.5 rounded-lg"
                                  >
                                    {task}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-400 text-sm">
                                  No tasks required
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Users with Access */}
                          <div className="lg:col-span-2 bg-white rounded-xl p-4 border border-gray-200">
                            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 mb-3">
                              <UsersIcon className="w-4 h-4 text-indigo-600" />
                              Users with Access
                            </label>
                            <div className="flex flex-wrap gap-4 max-h-40 overflow-y-auto">
                              {section.users.length > 0 ? (
                                section.users.map((u) => (
                                  <UserCard
                                    key={u.emp_id}
                                    user={u}
                                    size="small"
                                  />
                                ))
                              ) : (
                                <span className="text-gray-400 text-sm">
                                  No users have access
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ==================== USER ROLES TAB ==================== */}
          {activeTab === "user-roles" && (
            <div className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <List className="w-6 h-6 text-blue-600" />
                    User Roles Directory
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    Complete list of all users and their assigned roles
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Filter className="w-5 h-5 text-gray-400" />
                    <select
                      className="px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm"
                      value={filterRole}
                      onChange={(e) => {
                        setFilterRole(e.target.value);
                        setUserRolesPage(1);
                      }}
                    >
                      <option value="">All Roles</option>
                      {roles.map((role) => (
                        <option key={role.role} value={role.role}>
                          {role.role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={handleDownloadPDF}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-5 py-2.5 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg shadow-green-500/30 font-medium text-sm"
                  >
                    <Download className="w-4 h-4" />
                    Download PDF
                  </button>
                </div>
              </div>

              {/* Results Summary */}
              <div className="mb-4 text-sm text-gray-500">
                Showing {paginatedUserRoles.length} of {sortedTableData.length}{" "}
                entries
              </div>

              {/* Table */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white sticky top-0">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                          User Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                          Emp ID
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                          Eng Name
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                          Job Title
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                          Department
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider">
                          Section
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {paginatedUserRoles.map(({ role, user }, index) => (
                        <tr
                          key={`${role}-${user.emp_id}-${index}`}
                          className={`${
                            index % 2 === 0 ? "bg-white" : "bg-gray-50"
                          } hover:bg-blue-50 transition-colors duration-150`}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center gap-2">
                              <Shield className="w-4 h-4 text-blue-600" />
                              <span className="font-medium text-gray-900">
                                {role}
                              </span>
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <img
                                src={user.face_photo || "/default-avatar.png"}
                                alt={user.name}
                                className="w-8 h-8 rounded-full object-cover border border-gray-200"
                              />
                              <span className="text-gray-700">
                                {user.name || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">
                              {user.emp_id || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                            {user.eng_name || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600">
                              {user.job_title || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">
                            {user.dept_name || "N/A"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">
                            {user.sect_name || "N/A"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={userRolesPage}
                totalPages={totalUserRolesPages}
                onPageChange={setUserRolesPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
