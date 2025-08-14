import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";



const RoleBasedRoute = ({ allowedRoles = [] }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null; // Or a loading spinner
  }

  // Check if this route is for "not logged in" users
  const isGuestRoute = allowedRoles.includes('guest');

  // --- Logic for Guest (Not Logged In) Routes ---
  if (isGuestRoute) {
    // If a user IS logged in, redirect them away from the guest page
    if (user) {
      const redirectTo = user.role === 'admin' ? '/admindashboard' : '/';
      return <Navigate to={redirectTo} replace />;
    }
    // Otherwise, the user is not logged in, so allow access
    return <Outlet />;
  }

  // --- Logic for Protected (Logged In) Routes ---
  // If there's no user, they can't access a protected route
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If the logged-in user's role is not in the allowed list, block them
  if (!allowedRoles.includes(user.role)) {
    const redirectTo = user.role === 'admin' ? '/admindashboard' : '/';
    return <Navigate to={redirectTo} replace />;
  }

  // If all checks pass, the user has the right role, so allow access
  return <Outlet />;
};

export default RoleBasedRoute;
