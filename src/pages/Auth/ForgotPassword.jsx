import { ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../../components/layout/AuthLayout";
import Button from "../../components/layout/Button";
import FormInput from "../../components/layout/FormInput";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <AuthLayout
      title="Forgot Password?"
      subtitle="Enter your email address and we'll send you instructions to reset your password."
    >
      <a href="/" className="flex items-center text-gray-600 mb-8">
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Login
      </a>

      {!isSubmitted ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            label="Email Address"
            id="email"
            name="email"
            type="email"
            required
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Button type="submit">Send Reset Instructions</Button>
        </form>
      ) : (
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center">
              <svg
                className="h-8 w-8 text-green-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Check Your Email
          </h2>
          <p className="text-gray-600 mb-6">
            We've sent password reset instructions to {email}
          </p>
          <Link
            to="/"
            className="text-blue-600 hover:text-blue-500 font-medium"
          >
            Back to Login
          </Link>
        </div>
      )}
    </AuthLayout>
  );
};
export default ForgotPassword;
