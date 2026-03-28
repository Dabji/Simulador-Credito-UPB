import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/modules/auth/context/useAuth';
import { FullPageSpinner } from './FullPageSpinner';

interface PublicRouteProps {
  children: ReactNode;
}

export function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (isAuthenticated) {
    const redirectTo = user?.role === 'ADMIN' ? '/admin/main' : '/student/main';
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}
