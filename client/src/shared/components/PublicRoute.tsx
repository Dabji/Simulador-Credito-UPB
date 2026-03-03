import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/modules/auth/context/AuthContext';

interface PublicRouteProps {
  children: ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
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

  if (isAuthenticated) {
    const redirectTo = user?.role === 'ADMIN' ? '/admin' : '/student/main';
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
