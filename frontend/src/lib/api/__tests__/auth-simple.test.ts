/**
 * TDD: Simplified Auth API Tests
 * Testing with real localStorage (simpler setup)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { authAPI } from '../auth-simple';

describe('Auth API - Simple', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('login', () => {
    it('should successfully login and store token', async () => {
      const credentials = { email: 'test@example.com', password: 'password123' };

      const result = await authAPI.login(credentials);

      // Check returned data
      expect(result.access_token).toBe('mock-token');
      expect(result.user.email).toBe('test@example.com');

      // Check localStorage
      expect(localStorage.getItem('access_token')).toBe('mock-token');
      expect(localStorage.getItem('user')).toBeTruthy();
    });

    it('should handle login error with invalid credentials', async () => {
      const credentials = { email: 'wrong@example.com', password: 'wrong' };

      await expect(authAPI.login(credentials)).rejects.toThrow('Invalid credentials');
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists', () => {
      localStorage.setItem('access_token', 'some-token');
      expect(authAPI.isAuthenticated()).toBe(true);
    });

    it('should return false when token does not exist', () => {
      expect(authAPI.isAuthenticated()).toBe(false);
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
      localStorage.setItem('user', JSON.stringify(mockUser));

      const user = authAPI.getStoredUser();
      expect(user).toEqual(mockUser);
    });

    it('should return null when user does not exist', () => {
      const user = authAPI.getStoredUser();
      expect(user).toBeNull();
    });

    it('should return null when stored data is invalid JSON', () => {
      localStorage.setItem('user', 'invalid-json');
      const user = authAPI.getStoredUser();
      expect(user).toBeNull();
    });
  });
});
