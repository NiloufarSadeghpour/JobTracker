import { Navigate, useLocation } from 'react-router-dom';

export default function AdminRoute({ user, children }) {
  const loc = useLocation();

  // Not logged in → send to auth, remember where they wanted to go
  if (!user) return <Navigate to="/auth" replace state={{ from: loc }} />;

  // Logged in but not admin → 403
  if (user.role !== 'admin') return <Navigate to="/403" replace />;

  // Logged in and admin
  return children;
}
