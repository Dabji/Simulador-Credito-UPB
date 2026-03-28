import { useContext } from 'react';
import { AuthContext } from './AuthContext.types';
import type { AuthContextValue } from './AuthContext.types';

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
  }

  return context;
}
