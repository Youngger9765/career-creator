/**
 * Authentication store using Zustand
 * 認證狀態管理
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserResponse, DemoAccount, LoginRequest } from '@/types/api';
import { authAPI } from '@/lib/api/auth';

interface AuthState {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;

  // Demo accounts
  demoAccounts: DemoAccount[];
  loadDemoAccounts: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      demoAccounts: [],

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });

        try {
          const response = await authAPI.login(credentials);
          set({
            user: {
              ...response.user,
              name: response.user.full_name,
              created_at: new Date().toISOString(),
            } as any,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          const errorMessage = error.response?.data?.detail || 'Login failed';
          set({
            error: errorMessage,
            isLoading: false,
            isAuthenticated: false,
            user: null,
          });
          throw error;
        }
      },

      logout: () => {
        authAPI.logout();
        // Clear both state and localStorage
        localStorage.removeItem('auth-storage');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      getCurrentUser: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        set({ isLoading: true });

        try {
          const user = await authAPI.getCurrentUser();
          set({
            user: {
              ...user,
              name: user.full_name,
              created_at: new Date().toISOString(),
            } as any,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          // Token might be invalid, clear local storage but don't redirect
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          localStorage.removeItem('auth-storage');
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },

      loadDemoAccounts: async () => {
        try {
          const accounts = await authAPI.getDemoAccounts();
          set({ demoAccounts: accounts as any });
        } catch (error) {
          console.error('Failed to load demo accounts:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
