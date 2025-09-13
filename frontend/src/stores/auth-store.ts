/**
 * Authentication store using Zustand
 * 認證狀態管理
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserResponse, DemoAccount, LoginRequest } from '@/types/api';
import apiClient from '@/lib/api-client';

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
          const response = await apiClient.login(credentials);
          set({
            user: response.user,
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
        apiClient.logout();
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      getCurrentUser: async () => {
        if (!apiClient.getToken()) {
          return;
        }

        set({ isLoading: true });

        try {
          const user = await apiClient.getCurrentUser();
          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error: any) {
          // Token might be invalid
          apiClient.logout();
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
          const accounts = await apiClient.getDemoAccounts();
          set({ demoAccounts: accounts });
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
