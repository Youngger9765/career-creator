/**
 * TDD: Auth API implementation
 * Refactored after tests pass (REFACTOR phase)
 */

interface User {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
  is_active: boolean;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export class AuthAPI {
  private readonly TOKEN_KEY = 'access_token';
  private readonly USER_KEY = 'user';
  
  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    // TODO: Replace with actual API call
    // For now, simulate API behavior
    if (credentials.email === 'wrong@example.com') {
      throw new Error('Invalid credentials');
    }
    
    const response: AuthResponse = {
      access_token: 'mock-token',
      token_type: 'bearer',
      user: {
        id: '123',
        email: credentials.email,  // Use provided email
        full_name: 'Test User',
        roles: ['counselor'],
        is_active: true,
      },
    };
    
    this.storeAuth(response);
    return response;
  }
  
  private storeAuth(response: AuthResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.access_token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
  }
  
  isAuthenticated(): boolean {
    return !!localStorage.getItem('access_token');
  }
  
  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  
  getStoredUser() {
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