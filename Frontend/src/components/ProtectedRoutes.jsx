import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoutes({ allowedRoles }) {
  const { token, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="relative">
          <div className="h-16 w-16 rounded-full border-4 border-slate-200 border-t-emerald-600 animate-spin"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-emerald-700">
            OCP
          </div>
        </div>
        <p className="mt-4 text-sm font-medium text-slate-500 animate-pulse">
          Vérification des accès sécurisés...
        </p>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Normalize role to allow matching with and without 'ROLE_' prefix
  const userRoleNormalized = String(role).toUpperCase().replace('ROLE_', '');
  const hasAccess = !allowedRoles || allowedRoles.some(r => {
    const rNormalized = String(r).toUpperCase().replace('ROLE_', '');
    return rNormalized === userRoleNormalized;
  });

  if (!hasAccess) {
    // If not allowed, redirect to standard login or root
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
