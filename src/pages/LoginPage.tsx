/** DEPRECATED: Redirecting to home */
import { Navigate } from 'react-router-dom';
export function LoginPage() {
  return <Navigate to="/" replace />;
}