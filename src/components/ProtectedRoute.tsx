import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/lib/auth';
interface ProtectedRouteProps {
  children: React.ReactNode;
}
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = useAuthStore(s => s.token);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}