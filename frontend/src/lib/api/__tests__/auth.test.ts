/**
 * TDD: Auth API Tests
 * Following Kent Beck's Red-Green-Refactor cycle
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authAPI } from '../auth-simple';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// No need to mock axios in simple version - we're not using it yet

describe('Auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('login', () => {
    it('should successfully login and store token', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };
      const mockResponse = {
        access_token: 'mock-token',
        token_type: 'bearer',
        user: {
          id: '123',
          email: 'test@example.com',
          full_name: 'Test User',
          roles: ['counselor'],
          is_active: true,
        },
      };

      // This test will fail initially (RED phase)
      const result = await authAPI.login(credentials);

      expect(result).toEqual(mockResponse);
      expect(localStorage.setItem).toHaveBeenCalledWith('access_token', 'mock-token');
      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.user));
    });

    it('should handle login error with invalid credentials', async () => {
      const credentials = { email: 'wrong@example.com', password: 'wrong' };

      // This test will fail initially (RED phase)
      await expect(authAPI.login(credentials)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorageMock.getItem.mockReturnValue('mock-token');

      // This test will fail initially (RED phase)
      expect(authAPI.isAuthenticated()).toBe(true);
      expect(localStorage.getItem).toHaveBeenCalledWith('access_token');
    });

    it('should return false when token does not exist', () => {
      localStorageMock.getItem.mockReturnValue(null);

      // This test will fail initially (RED phase)
      expect(authAPI.isAuthenticated()).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear token and redirect to login', () => {
      // Mock window.location
      delete (window as any).location;
      window.location = { href: '' } as any;

      // This test will fail initially (RED phase)
      authAPI.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('access_token');
      expect(localStorage.removeItem).toHaveBeenCalledWith('user');
      expect(window.location.href).toBe('/login');
    });
  });

  describe('getStoredUser', () => {
    it('should return parsed user when exists', () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        full_name: 'Test User',
        roles: ['counselor'],
        is_active: true,
      };
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockUser));

      // This test will fail initially (RED phase)
      const user = authAPI.getStoredUser();
      expect(user).toEqual(mockUser);
    });

    it('should return null when user does not exist', () => {
      localStorageMock.getItem.mockReturnValue(null);

      // This test will fail initially (RED phase)
      const user = authAPI.getStoredUser();
      expect(user).toBeNull();
    });

    it('should return null when stored data is invalid JSON', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json');

      // This test will fail initially (RED phase)
      const user = authAPI.getStoredUser();
      expect(user).toBeNull();
    });
  });
});
