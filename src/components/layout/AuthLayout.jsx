import { ClipboardList } from "lucide-react";

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gray-50">
      {/* Left Section */}
      <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-center mb-8">
            <ClipboardList className="h-12 w-12 text-blue-600" />
            <h1 className="ml-2 text-4xl font-bold text-blue-600">YQMS</h1>
          </div>
          <div className="flex justify-center items-center mb-8">
            <img
              src={`/IMG/logo.jpg`}
              alt="Loading"
              className="h-32 w-32 rounded-full"
            />
          </div>

          {(title || subtitle) && (
            <div className="text-center mb-8">
              {title && (
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {title}
                </h1>
              )}
              {subtitle && <p className="text-lg text-gray-600">{subtitle}</p>}
            </div>
          )}

          {children}
        </div>
      </div>

      {/* Right Section */}
      <div className="flex-1 hidden lg:flex items-center justify-center p-12 bg-black">
        <div className="max-w-2xl text-center">
          <img
            src="/IMG/Quality.webp"
            alt="Quality Management"
            className="w-full rounded-lg shadow-lg mb-8"
          />
          <p className="text-xl text-gray-600 italic">
            Manage your QC, QA Inspection and Reports with YQMS...
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
