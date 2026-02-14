import axios from "axios";
import React, { useEffect, useState } from "react";
import { useAuth } from "../components/authentication/AuthContext";
// Import the API_BASE_URL from our config file
import { API_BASE_URL } from "../../config";

const allowedInitialEmpIds = ["TL04", "TL09"];

export default function Settings() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [existingRole, setExistingRole] = useState(null);

  const isAllowed = allowedInitialEmpIds.includes(user?.emp_id);

  useEffect(() => {
    // Check if Super Admin role already exists
    const checkExistingRole = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/role-management`);
        const superAdminRole = response.data.find(
          (role) => role.role === "Super Admin",
        );
        setExistingRole(superAdminRole);
      } catch (error) {
        console.error("Error checking existing role:", error);
      }
    };
    checkExistingRole();
  }, []);

  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/search-users?q=${query}`,
      );
      setSearchResults(response.data);
    } catch (error) {
      console.error("Error searching users:", error);
      setError("Failed to search users");
    }
  };

  const handleUserSelect = async (user) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/user-details?empId=${user.emp_id}`,
      );
      setSelectedUser({ ...user, ...response.data });
      setSearchResults([]);
      setError("");
    } catch (error) {
      console.error("Error fetching user details:", error);
      setError("Failed to fetch user details");
    }
  };

  const handleRegister = async () => {
    if (!selectedUser) return;

    try {
      // First, check if the role exists
      const roleResponse = await axios.get(
        `${API_BASE_URL}/api/role-management`,
      );
      const superAdminRole = roleResponse.data.find(
        (role) => role.role === "Super Admin",
      );

      if (superAdminRole) {
        // Check if user is already in the role
        const userExists = superAdminRole.users.some(
          (u) => u.emp_id === selectedUser.emp_id,
        );
        if (userExists) {
          setError("User is already a Super Admin");
          return;
        }
      }

      // Register the Super Admin
      const response = await axios.post(
        `${API_BASE_URL}/api/role-management/super-admin`,
        {
          user: selectedUser,
        },
      );

      setSuccessMessage("Super Admin registered successfully!");
      setSelectedUser(null);
      setSearchQuery("");
      setError("");

      // Refresh the existing role data
      const updatedRoleResponse = await axios.get(
        `${API_BASE_URL}/api/role-management`,
      );
      const updatedSuperAdminRole = updatedRoleResponse.data.find(
        (role) => role.role === "Super Admin",
      );
      setExistingRole(updatedSuperAdminRole);

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error registering super admin:", error);
      setError(
        error.response?.data?.message || "Failed to register super admin",
      );
    }
  };

  const handleDelete = async (empId) => {
    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/role-management/super-admin/${empId}`,
      );

      setSuccessMessage("Super Admin removed successfully!");

      // Update the existing role data immediately after successful deletion
      const updatedRoleResponse = await axios.get(
        `${API_BASE_URL}/api/role-management`,
      );
      const updatedSuperAdminRole = updatedRoleResponse.data.find(
        (role) => role.role === "Super Admin",
      );
      setExistingRole(updatedSuperAdminRole);

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error("Error deleting super admin:", error);
      setError(error.response?.data?.message || "Failed to delete super admin");

      setTimeout(() => {
        setError("");
      }, 3000);
    }
  };

  if (!isAllowed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-600">
          You do not have permission to access this page.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Super Admin Registration</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          {successMessage}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Role
          </label>
          <input
            type="text"
            value="Super Admin"
            disabled
            className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Job Title
          </label>
          <input
            type="text"
            value="Developer"
            disabled
            className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Search Employee ID
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Enter employee ID"
          />

          {searchResults.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-md">
              {searchResults.map((user) => (
                <div
                  key={user.emp_id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleUserSelect(user)}
                >
                  {user.emp_id} - {user.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedUser && (
          <div className="mb-4 p-4 border border-gray-200 rounded-md">
            <h3 className="font-medium mb-2">Selected User Details</h3>
            <p>Name: {selectedUser.name}</p>
            <p>English Name: {selectedUser.eng_name}</p>
            <p>Khmer Name: {selectedUser.kh_name}</p>
            <p>Job Title: {selectedUser.job_title}</p>
            <p>Department: {selectedUser.dept_name}</p>
            <p>Section: {selectedUser.sect_name}</p>
            <p>Phone Number: {selectedUser.phone_number}</p>
            <p>Working Status: {selectedUser.working_status}</p>
          </div>
        )}

        {existingRole && (
          <div className="mb-4 p-4 border border-gray-200 rounded-md">
            <h3 className="font-medium mb-2">Current Super Admins</h3>
            <div className="flex flex-wrap gap-4">
              {existingRole.users.map((user) => (
                <div key={user.emp_id} className="text-center relative">
                  <img
                    src={user.face_photo || "/default-avatar.png"}
                    alt={user.name}
                    className="w-12 h-12 rounded-full mx-auto"
                  />
                  <p className="text-sm mt-1">{user.emp_id}</p>
                  <p className="text-sm">{user.name}</p>
                  {!allowedInitialEmpIds.includes(user.emp_id) && (
                    <button
                      onClick={() => handleDelete(user.emp_id)}
                      className="mt-2 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleRegister}
          disabled={!selectedUser}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
        >
          Register Super Admin
        </button>
      </div>
    </div>
  );
}
