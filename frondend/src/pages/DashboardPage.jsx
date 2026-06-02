import { Navigate } from 'react-router-dom';
import DashboardLayout from '../components/dashboard/DashboardLayout';

export default function DashboardPage() {
  return <DashboardLayout />;
}

// Redirect /dashboard to /dashboard/theme by default
export function DashboardRedirect() {
  return <Navigate to="/dashboard/theme" replace />;
}
