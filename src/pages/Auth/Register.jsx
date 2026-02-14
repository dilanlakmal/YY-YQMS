import axios from "axios";
import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import Button from "../../components/layout/Button";
import FormInput from "../../components/layout/FormInput";
// Import the API_BASE_URL from our config file
import { API_BASE_URL } from "../../../config";

const Register = () => {
  const [formData, setFormData] = useState({
    emp_id: "",
    eng_name: "",
    kh_name: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    let transformedValue = value;

    if (name === "emp_id") {
      transformedValue = value.toUpperCase().replace(/\s/g, "");
    }

    setFormData({
      ...formData,
      [name]: transformedValue,
    });
  };

  const validateForm = () => {
    if (!formData.eng_name && !formData.kh_name) {
      setError("Please fill at least one of the name fields.");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        console.log("Form data being sent:", formData);
        const response = await axios.post(
          `${API_BASE_URL}/api/register`,
          formData
        );
        if (response.status === 201) {
          setSuccess("User registered successfully.");
          setTimeout(() => {
            navigate("/");
          }, 2000);
        }
      } catch (error) {
        console.error("Error response from server:", error.response);
        setError(error.response?.data?.message || "Failed to register user.");
      }
    }
  };

  return (
    <AuthLayout
      title="Create Account"
      subtitle="Join YQMS to manage your quality control processes"
    >
      <Link to="/" className="flex items-left text-gray-600 mb-8">
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Login
      </Link>
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <div className="text-red-500 mb-4">{error}</div>}
        {success && <div className="text-green-500 mb-4">{success}</div>}
        <FormInput
          label="Employee ID"
          id="emp_id"
          name="emp_id"
          type="text"
          required
          placeholder="Employee ID"
          value={formData.emp_id}
          onChange={handleChange}
        />
        <FormInput
          label="Name (English)"
          id="eng_name"
          name="eng_name"
          type="text"
          placeholder="English Name"
          value={formData.eng_name}
          onChange={handleChange}
        />
        <FormInput
          label="Name (Khmer)"
          id="kh_name"
          name="kh_name"
          type="text"
          placeholder="Khmer Name"
          value={formData.kh_name}
          onChange={handleChange}
        />
        <FormInput
          label="Password"
          id="password"
          name="password"
          type="password"
          required
          placeholder="Create a password"
          value={formData.password}
          onChange={handleChange}
        />
        <FormInput
          label="Confirm Password"
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleChange}
        />
        <Button type="submit">Register</Button>
        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            to="/"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            Log in
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Register;
