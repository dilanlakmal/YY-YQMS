import PropTypes from "prop-types";
import React, { useState } from "react";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { useAuth } from "../../components/authentication/AuthContext.jsx";

const MySwal = withReactContent(Swal);

const CreateUserModal = ({
  isOpen,
  onClose,
  onSubmit,
  existingUserIds = [],
  existingUserNames = [], // <<< NEW: Prop for existing user names
}) => {
  const { hashPassword } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    emp_id: "",
    job_title: "",
    eng_name: "",
    kh_name: "",
    phone_number: "",
    dept_name: "",
    sect_name: "",
    working_status: "Working", // Auto-filled field
    password: "",
    email: "",
  });

  // Control extra (optional) fields visibility
  const [showExtraFields, setShowExtraFields] = useState(false);

  const toggleExtraFields = () => {
    setShowExtraFields((prev) => !prev);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Ensure required fields are provided.
    if (!formData.name || !formData.password) return;

    // >>> NEW: Check if the name already exists in the users collection
    if (existingUserNames.includes(formData.name.trim().toLowerCase())) {
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: "User already exist! Please Use different Name",
      });
      return;
    }
    // <<<

    // If emp_id is provided and already exists, alert the user.
    if (formData.emp_id && existingUserIds.includes(formData.emp_id)) {
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: "Employee ID already exists. Please use a different ID.",
      }).then(() => {
        setFormData({
          name: "",
          emp_id: "",
          job_title: "",
          eng_name: "",
          kh_name: "",
          phone_number: "",
          dept_name: "",
          sect_name: "",
          working_status: "Working",
          password: "",
          email: "",
        });
        onClose();
      });
      return;
    }

    try {
      const hashedPassword = await hashPassword(formData.password);
      const updatedFormData = { ...formData, password: hashedPassword };

      const response = await onSubmit(updatedFormData);

      if (response.status === 400) {
        throw new Error(response.data.message);
      }

      MySwal.fire({
        icon: "success",
        title: "Success",
        text: "User created successfully!",
      }).then(() => {
        setFormData({
          name: "",
          emp_id: "",
          job_title: "",
          eng_name: "",
          kh_name: "",
          phone_number: "",
          dept_name: "",
          sect_name: "",
          working_status: "Working",
          password: "",
          email: "",
        });
        onClose();
      });
    } catch (err) {
      console.error("Error creating user:", err);
      MySwal.fire({
        icon: "error",
        title: "Error",
        text: err.message || "Failed to create user. Please try again later.",
      }).then(() => {
        setFormData({
          name: "",
          emp_id: "",
          job_title: "",
          eng_name: "",
          kh_name: "",
          phone_number: "",
          dept_name: "",
          sect_name: "",
          working_status: "Working",
          password: "",
          email: "",
        });
        onClose();
      });
    }
  };

  if (!isOpen) return null;

  // Disable the submit button until both Name and Password are provided.
  const isSubmitDisabled = !formData.name || !formData.password;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-center items-center w-full h-full bg-black bg-opacity-50"
      onClick={onClose}
    >
      <div
        className="relative p-4 w-full max-w-2xl max-h-full bg-white rounded-lg shadow dark:bg-gray-700 overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Create an External User / Device
          </h3>
          <button
            type="button"
            className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
            onClick={onClose}
          >
            <svg
              className="w-3 h-3"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 14 14"
            >
              <path
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
              />
            </svg>
            <span className="sr-only">Close modal</span>
          </button>
        </div>
        <form
          id="create-form"
          className="p-4 md:px-8 md:pb-8 md:pt-5 text-center"
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          {/* Required Field: Name */}
          <div className="mb-4">
            <label
              htmlFor="name"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 text-left"
            >
              Name *
            </label>
            <input
              type="text"
              name="name"
              id="name"
              placeholder="Enter name"
              required
              value={formData.name}
              onChange={handleChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
            />
          </div>

          {/* Read-only Working Status */}
          <div className="mb-4">
            <label
              htmlFor="working_status"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 text-left"
            >
              Working Status
            </label>
            <input
              type="text"
              name="working_status"
              id="working_status"
              value={formData.working_status}
              readOnly
              className="bg-gray-100 border border-gray-300 text-gray-700 text-sm rounded-lg block w-full p-2.5 dark:bg-gray-700 dark:border-gray-500 dark:text-gray-300"
            />
          </div>

          {/* Toggle Optional Fields */}
          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={toggleExtraFields}
              className="text-blue-600 hover:text-blue-800 focus:outline-none"
            >
              {showExtraFields
                ? "− Hide Optional Fields"
                : "+ Add Optional Fields"}
            </button>
          </div>

          {showExtraFields && (
            <div className="grid gap-4 mb-4 grid-cols-2">
              <div className="col-span-2">
                <label
                  htmlFor="emp_id"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 text-left"
                >
                  Employee ID
                </label>
                <input
                  type="text"
                  name="emp_id"
                  id="emp_id"
                  placeholder="Enter Employee ID"
                  value={formData.emp_id}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                />
              </div>
              <div>
                <label
                  htmlFor="job_title"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 text-left"
                >
                  Job Title
                </label>
                <input
                  type="text"
                  name="job_title"
                  id="job_title"
                  placeholder="Enter Job Title"
                  value={formData.job_title}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                />
              </div>
              <div>
                <label
                  htmlFor="eng_name"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 text-left"
                >
                  English Name
                </label>
                <input
                  type="text"
                  name="eng_name"
                  id="eng_name"
                  placeholder="Enter English Name"
                  value={formData.eng_name}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                />
              </div>
              <div>
                <label
                  htmlFor="kh_name"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 text-left"
                >
                  Khmer Name
                </label>
                <input
                  type="text"
                  name="kh_name"
                  id="kh_name"
                  placeholder="Enter Khmer Name"
                  value={formData.kh_name}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                />
              </div>
              <div>
                <label
                  htmlFor="phone_number"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 text-left"
                >
                  Phone Number
                </label>
                <input
                  type="text"
                  name="phone_number"
                  id="phone_number"
                  placeholder="Enter Phone Number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                />
              </div>
              <div>
                <label
                  htmlFor="dept_name"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 text-left"
                >
                  Department Name
                </label>
                <input
                  type="text"
                  name="dept_name"
                  id="dept_name"
                  placeholder="Enter Department Name"
                  value={formData.dept_name}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                />
              </div>
              <div>
                <label
                  htmlFor="sect_name"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 text-left"
                >
                  Section Name
                </label>
                <input
                  type="text"
                  name="sect_name"
                  id="sect_name"
                  placeholder="Enter Section Name"
                  value={formData.sect_name}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                />
              </div>
              <div className="col-span-2">
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 text-left"
                >
                  Email (optional)
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  placeholder="Enter Email"
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                />
              </div>
            </div>
          )}
          <div className="mb-4">
            <label
              htmlFor="password"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300 text-left"
            >
              Default Password *
            </label>
            <input
              type="password"
              name="password"
              id="password"
              placeholder="Enter default password"
              required
              value={formData.password}
              onChange={handleChange}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`mt-0 sm:mt-2 text-white inline-flex items-center ${
              isSubmitDisabled
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300"
            } font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800`}
          >
            <svg
              className="me-1 -ms-1 w-5 h-5"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              ></path>
            </svg>
            Add User
          </button>
        </form>
      </div>
    </div>
  );
};

CreateUserModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  existingUserIds: PropTypes.arrayOf(PropTypes.string),
  existingUserNames: PropTypes.arrayOf(PropTypes.string), // <<< NEW prop type
};

export default CreateUserModal;
