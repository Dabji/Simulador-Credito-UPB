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

  const role = user?.role as Role | undefined;
  
  // OJO AQUÍ: Si en la HU-08 la pantalla principal del estudiante ahora es '/student/main', 
  // dejamos esa. Si no, cámbiala de vuelta a '/simulator/create'.
  const fallbackRoute = role === 'ADMIN' ? '/admin' : '/student/main';

  // 1. Validación original de HU-08 (requiredRole)
  if (requiredRole && role !== requiredRole) {
    return <Navigate to={fallbackRoute} replace />;
  }

  // 2. Validación refactorizada de develop (allowedRoles)
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to={fallbackRoute} replace />;
  }

  return <>{children}</>;
}