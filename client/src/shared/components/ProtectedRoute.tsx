import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { FullPageSpinner } from './FullPageSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Si se especifica, sólo usuarios con alguno de estos roles pueden acceder. */
  allowedRoles?: ('STUDENT' | 'ADMIN')[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // RBAC: si se definen roles permitidos y el usuario no tiene uno de ellos, redirigir
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/simulator/create" replace />;
  }

  return <>{children}</>;
}
