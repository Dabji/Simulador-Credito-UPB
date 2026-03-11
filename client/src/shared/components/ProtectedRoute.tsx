import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { FullPageSpinner } from './FullPageSpinner';

type Role = 'STUDENT' | 'ADMIN';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Si se especifica, sólo usuarios con ese rol pueden acceder. (HU-08) */
  requiredRole?: Role;
  /** Alternativa: lista de roles permitidos. (HU-07 / Develop) */
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, requiredRole, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const role = user?.role;
  const fallback = role === 'ADMIN' ? '/admin/main' : '/student/main';

  // requiredRole: prop usada en HU-08/HU-09 (App.tsx)
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={fallback} replace />;
  }

  // allowedRoles: prop usada en develop (App.tsx rutas /simulator)
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}