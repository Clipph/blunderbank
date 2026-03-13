/** DEPRECATED: Redirecting to home */
import { Navigate } from 'react-router-dom';
export function AccountPage() {
  return <Navigate to="/" replace />;
}