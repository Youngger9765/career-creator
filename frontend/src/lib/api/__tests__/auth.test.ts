import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { authAPI } from '../auth';
import { apiClient } from '../client';
import type { AuthResponse } from '../auth';

// Mock apiClient
vi.mock('../client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
  handleApiError: vi.fn((error) => error?.message || 'Unknown error'),
}));

describe('AuthAPI', () => {
  const mockAuthResponse: AuthResponse = {
    access_token: 'mock-token-123',
    token_type: 'bearer',
    user: {
      id: 'user-1',
      email: 'test@example.com',
      full_name: 'Test User',
      roles: ['counselor'],
      is_active: true,
    },
  };

  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks();

    // Clear localStorage
    localStorage.clear();

    // Mock window.location
    delete (window as any).location;
    window.location = { href: '' } as any;
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('login', () => {
    it('should login successfully and store token', async () => {
      // Arrange
      (apiClient.post as any).mockResolvedValue({ data: mockAuthResponse });

      // Act
      const result = await authAPI.login({
        email: 'test@example.com',
        password: 'password123',
      });

      // Assert
      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/login', {
        email: 'test@example.com',
        password: 'password123',
      });
      expect(result).toEqual(mockAuthResponse);
      expect(localStorage.getItem('access_token')).toBe('mock-token-123');
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockAuthResponse.user));
    });

    it('should throw error on login failure', async () => {
      // Arrange
      (apiClient.post as any).mockRejectedValue(new Error('Invalid credentials'));

      // Act & Assert
      await expect(
        authAPI.login({
          email: 'wrong@example.com',
          password: 'wrong',
        })
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should register successfully and store token', async () => {
      // Arrange
      (apiClient.post as any).mockResolvedValue({ data: mockAuthResponse });

      // Act
      const result = await authAPI.register({
        email: 'new@example.com',
        password: 'password123',
        name: 'New User',
      });

      // Assert
      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/register', {
        email: 'new@example.com',
        password: 'password123',
        full_name: 'New User',
        roles: ['counselor'],
      });
      expect(result).toEqual(mockAuthResponse);
      expect(localStorage.getItem('access_token')).toBe('mock-token-123');
    });

    it('should use custom roles if provided', async () => {
      // Arrange
      (apiClient.post as any).mockResolvedValue({ data: mockAuthResponse });

      // Act
      await authAPI.register({
        email: 'admin@example.com',
        password: 'password123',
        name: 'Admin User',
        roles: ['admin', 'counselor'],
      });

      // Assert
      expect(apiClient.post).toHaveBeenCalledWith('/api/auth/register', {
        email: 'admin@example.com',
        password: 'password123',
        full_name: 'Admin User',
        roles: ['admin', 'counselor'],
      });
    });
  });

  describe('getCurrentUser', () => {
    it('should fetch current user info', async () => {
      // Arrange
      (apiClient.get as any).mockResolvedValue({ data: mockAuthResponse.user });

      // Act
      const user = await authAPI.getCurrentUser();

      // Assert
      expect(apiClient.get).toHaveBeenCalledWith('/api/auth/me');
      expect(user).toEqual(mockAuthResponse.user);
    });
  });

  describe('logout', () => {
    it('should clear all stored data and redirect', () => {
      // Arrange
      localStorage.setItem('access_token', 'token');
      localStorage.setItem('user', JSON.stringify(mockAuthResponse.user));
      localStorage.setItem('auth-storage', 'some-data');

      // Act
      authAPI.logout();

      // Assert
      expect(localStorage.getItem('access_token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
      expect(localStorage.getItem('auth-storage')).toBeNull();
      expect(window.location.href).toBe('/');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      // Arrange
      localStorage.setItem('access_token', 'token');

      // Act & Assert
      expect(authAPI.isAuthenticated()).toBe(true);
    });

    it('should return false when no token', () => {
      // Act & Assert
      expect(authAPI.isAuthenticated()).toBe(false);
    });
  });

  describe('getStoredUser', () => {
    it('should return parsed user from localStorage', () => {
      // Arrange
      localStorage.setItem('user', JSON.stringify(mockAuthResponse.user));

      // Act
      const user = authAPI.getStoredUser();

      // Assert
      expect(user).toEqual(mockAuthResponse.user);
    });

    it('should return null when no user in storage', () => {
      // Act
      const user = authAPI.getStoredUser();

      // Assert
      expect(user).toBeNull();
    });

    it('should return null when user data is invalid JSON', () => {
      // Arrange
      localStorage.setItem('user', 'invalid-json{');

      // Act
      const user = authAPI.getStoredUser();

      // Assert
      expect(user).toBeNull();
    });
  });
});
