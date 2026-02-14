import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { Loader2 } from "lucide-react";

const ProtectedRoute = () => {
  // --- FIX #3: GET `loading` AND `isAuthenticated` FROM THE CONTEXT ---
  const { isAuthenticated, loading } = useAuth();

  // While the context is verifying the token, show a loading screen.
  // This PREVENTS the premature redirect.
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  // After loading is complete, make the decision.
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />;
};

export default ProtectedRoute;
