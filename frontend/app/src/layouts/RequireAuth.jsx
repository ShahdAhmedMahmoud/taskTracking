import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useData } from '../hooks/useData';
import { homeFor } from '../utils/helpers';

export function RequireAuth({ children }) {
  const { session } = useAuth();
  return session ? children : <Navigate to="/login" replace />;
}

export function RequireRole({ roles, children }) {
  const { session } = useAuth();
  const { teams } = useData();
  return roles.includes(session.role) ? children : <Navigate to={homeFor(session, teams)} replace />;
}