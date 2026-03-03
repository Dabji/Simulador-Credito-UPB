import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/modules/auth/context/AuthContext';

type Role = 'STUDENT' | 'ADMIN';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Si se especifica, sólo usuarios con ese rol pueden acceder. */
  requiredRole?: Role;
  /** Alternativa: lista de roles permitidos (compatible con develop/HU-07). */
  allowedRoles?: Role[];
}

export function ProtectedRoute({ children, requiredRole, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-green-700" />
        <span className="sr-only">Cargando…</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const role = user?.role;
  const fallback = role === 'ADMIN' ? '/admin' : '/student/main';

  // requiredRole: prop usada en HU-08 (App.tsx)
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={fallback} replace />;
  }

  // allowedRoles: prop usada en HU-07 (develop)
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
