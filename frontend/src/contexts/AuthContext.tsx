import React, { createContext, useEffect } from 'react';
import { useAuthStore, type User } from '@/stores/authStore';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  loginWithCredentials: (credentials: { email: string; password: string }) => Promise<void>;
  registerWithCredentials: (data: { email: string; password: string; name: string }) => Promise<void>;
  validateToken: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { 
    user, 
    isAuthenticated, 
    isLoading,
    error,
    login, 
    logout, 
    updateUser,
    loginWithCredentials,
    registerWithCredentials,
    validateToken,
    clearError
  } = useAuthStore();

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData);
        login(parsedUser, token);
        // Validate token on app start
        validateToken();
      } catch (error) {
        console.error('Failed to parse user data from localStorage:', error);
        logout();
      }
    }
  }, [login, logout, validateToken]);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    updateUser,
    loginWithCredentials,
    registerWithCredentials,
    validateToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
