import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services';
import type { User, LoginRequest, RegisterRequest } from '@/types';

// Re-export User type for external use
export type { User };

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  loginWithCredentials: (credentials: LoginRequest) => Promise<void>;
  registerWithCredentials: (data: RegisterRequest) => Promise<void>;
  validateToken: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: (user, token) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        set({ user, token, isAuthenticated: true, error: null });
      },
      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null, isAuthenticated: false, error: null });
      },
      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          set({ user: updatedUser });
        }
      },
      loginWithCredentials: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(credentials);
          get().login(response.user, response.token);
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Login failed' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      registerWithCredentials: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(data);
          get().login(response.user, response.token);
        } catch (error: any) {
          set({ error: error.response?.data?.message || 'Registration failed' });
          throw error;
        } finally {
          set({ isLoading: false });
        }
      },
      validateToken: async () => {
        const token = get().token;
        if (!token) return;
        
        set({ isLoading: true });
        try {
          const response = await authService.getCurrentUser();
          get().updateUser(response.user);
        } catch (error) {
          get().logout();
        } finally {
          set({ isLoading: false });
        }
      },
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user, 
        token: state.token, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);
