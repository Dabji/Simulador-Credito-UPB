import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import { getCurrentUser, logoutUser, NETWORK_ERROR_MESSAGE } from '@/shared/services/api';
import type { UserData } from '@/shared/services/api';

// ── Tipos del contexto ─────────────────────────────────────────────────────

interface AuthContextValue {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: UserData) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const login = useCallback((token: string, userData: UserData) => {
    localStorage.setItem('token', token);
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    // Notificar al backend (fire-and-forget, no bloquea el logout local)
    logoutUser().catch(() => {});

    // Limpiar estado local — token y cualquier dato de sesión (HU-05)
    localStorage.removeItem('token');
    sessionStorage.clear();
    setUser(null);
  }, []);

  // Al montar, intenta recuperar la sesión si hay token
  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      setIsLoading(false);
      return;
    }

    getCurrentUser()
      .then((result) => {
        if (result.data?.user) {
          setUser(result.data.user);
          return;
        }

        // Si hay un error de conexión, mantenemos el token y no cerramos sesión
        if (result.error === NETWORK_ERROR_MESSAGE) {
          return;
        }

        // Token inválido o expirado u otro error de autenticación
        logout();
      })
      .catch((error) => {
        // getCurrentUser normalmente no rechaza, pero por seguridad no cerramos sesión aquí
        console.error('Error obteniendo el usuario actual', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [logout]);

  // Escuchar evento global de 401 para sincronizar estado de sesión inmediatamente
  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [logout]);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook personalizado ─────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
  }

  return context;
}
