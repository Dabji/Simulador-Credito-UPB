import { createContext } from 'react';
import type { UserData } from '@/shared/services/api';

export interface AuthContextValue {
  user: UserData | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: UserData) => void;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);
