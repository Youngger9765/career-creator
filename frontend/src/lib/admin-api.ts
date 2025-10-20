/**
 * Admin API Client
 *
 * API client for admin-only endpoints
 * Uses the centralized apiClient from lib/api/client.ts
 */

import { apiClient } from './api';

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

export interface WhitelistImportResult {
  total_rows: number;
  created: number;
  skipped: number;
  errors: string[];
  created_users: { email: string; password: string }[];
}

export const adminAPI = {
  /**
   * Batch create users from email list
   */
  async batchCreateUsers(data: BatchCreateUserRequest): Promise<BatchCreateUserResponse> {
    const response = await apiClient.post('/api/admin/users/batch', data);
    return response.data;
  },

  /**
   * Import whitelist from CSV file
   */
  async importWhitelist(file: File): Promise<WhitelistImportResult> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post('/api/admin/import-whitelist', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * List all users
   */
  async listUsers(skip: number = 0, limit: number = 100): Promise<ListUsersResponse> {
    const response = await apiClient.get('/api/admin/users', {
      params: { skip, limit },
    });
    return response.data;
  },

  /**
   * Reset user password
   */
  async resetUserPassword(userId: string): Promise<{ email: string; password: string }> {
    const response = await apiClient.put(`/api/admin/users/${userId}/password`);
    return response.data;
  },
};
