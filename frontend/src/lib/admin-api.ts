/**
 * Admin API Client
 *
 * API client for admin-only endpoints
 */

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with auth
const createAuthClient = () => {
  const token = localStorage.getItem('access_token'); // Fixed: use 'access_token' not 'token'
  return axios.create({
    baseURL: API_URL,
    headers: {
      Authorization: token ? `Bearer ${token}` : '',
    },
  });
};

export interface BatchCreateUserRequest {
  emails: string[];
  on_duplicate: 'skip' | 'reset_password';
}

export interface UserCreatedResponse {
  email: string;
  password: string;
  created: boolean;
}

export interface UserExistingResponse {
  email: string;
  password?: string;
  created_at?: string;
  action: 'skipped' | 'password_reset';
}

export interface UserFailedResponse {
  email: string;
  reason: string;
}

export interface BatchCreateUserResponse {
  success: UserCreatedResponse[];
  existing: UserExistingResponse[];
  failed: UserFailedResponse[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  is_active: boolean;
  created_at: string;
}

export interface ListUsersResponse {
  users: User[];
  total: number;
}

export const adminAPI = {
  /**
   * Batch create users from email list
   */
  async batchCreateUsers(data: BatchCreateUserRequest): Promise<BatchCreateUserResponse> {
    const client = createAuthClient();
    const response = await client.post('/api/admin/users/batch', data);
    return response.data;
  },

  /**
   * List all users
   */
  async listUsers(skip: number = 0, limit: number = 100): Promise<ListUsersResponse> {
    const client = createAuthClient();
    const response = await client.get('/api/admin/users', {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Reset user password
   */
  async resetUserPassword(userId: string): Promise<{ email: string; password: string }> {
    const client = createAuthClient();
    const response = await client.put(`/api/admin/users/${userId}/password`);
    return response.data;
  },
};
