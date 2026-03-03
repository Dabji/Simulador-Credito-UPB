import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/modules/auth/context/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  /** Si se especifica, sólo usuarios con ese rol pueden acceder. */
  requiredRole?: 'STUDENT' | 'ADMIN';
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
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

  // Si se exige un rol específico y el usuario no lo tiene, redirigir a su ruta correcta
  if (requiredRole && user?.role !== requiredRole) {
    const fallback = user?.role === 'ADMIN' ? '/admin' : '/student/main';
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
