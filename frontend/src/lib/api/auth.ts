/**
 * Authentication API
 * 認證相關 API
 */
import { apiClient, handleApiError } from './client';

export interface User {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
  is_active: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  roles?: string[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface DemoAccount {
  email: string;
  password: string;
  description: string;
}

class AuthAPI {
  /**
   * Login with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials);
      const { access_token, user } = response.data;

      // Store token and user info
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Register new counselor account
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/api/auth/register', {
        email: data.email,
        password: data.password,
        full_name: data.name,
        roles: data.roles || ['counselor'],
      });
      const { access_token, user } = response.data;

      // Store token and user info
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('user', JSON.stringify(user));

      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get demo accounts for testing
   */
  async getDemoAccounts(): Promise<DemoAccount[]> {
    try {
      const response = await apiClient.get<DemoAccount[]>('/api/auth/demo-accounts');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Get current user info
   */
  async getCurrentUser(): Promise<User> {
    try {
      const response = await apiClient.get<User>('/api/auth/me');
      return response.data;
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  }

  /**
   * Logout user
   */
  logout(): void {
    // Clear localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('auth-storage');

    // Clear sessionStorage (in case anything is stored there)
    sessionStorage.clear();

    // Clear cookies (if any)
    document.cookie.split(';').forEach((c) => {
      document.cookie = c
        .replace(/^ +/, '')
        .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
    });

    // Redirect to homepage
    window.location.href = '/';
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }

  /**
   * Get stored user info
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
}

export const authAPI = new AuthAPI();
export default authAPI;
