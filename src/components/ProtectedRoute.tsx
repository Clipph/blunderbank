/**
 * DEPRECATED: All routes are now public. 
 * This component simply passes through children.
 */
import React from 'react';
export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}