/**
 * Client Management API
 * 客戶管理 API
 */

import { apiClient } from './client';
import type {
  Client,
  ClientCreate,
  ClientUpdate,
  ConsultationRecord,
  ConsultationRecordCreate,
} from '@/types/client';
import type { Room } from '@/types/api';

/**
 * Clients API
 */
export const clientsAPI = {
  /**
   * Get my clients
   */
  getMyClients: async (): Promise<Client[]> => {
    const response = await apiClient.get('/api/clients');
    return response.data;
  },

  /**
   * Create a new client
   */
  createClient: async (data: ClientCreate): Promise<Client> => {
    const response = await apiClient.post('/api/clients', data);
    return response.data;
  },

  /**
   * Get client by ID
   */
  getClient: async (clientId: string): Promise<Client> => {
    const response = await apiClient.get(`/api/clients/${clientId}`);
    return response.data;
  },

  /**
   * Update client
   */
  updateClient: async (clientId: string, data: ClientUpdate): Promise<Client> => {
    const response = await apiClient.put(`/api/clients/${clientId}`, data);
    return response.data;
  },

  /**
   * Delete (archive) client
   */
  deleteClient: async (clientId: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/api/clients/${clientId}`);
    return response.data;
  },

  /**
   * Get client's rooms
   */
  getClientRooms: async (clientId: string): Promise<Room[]> => {
    const response = await apiClient.get(`/api/clients/${clientId}/rooms`);
    return response.data;
  },

  /**
   * Get client statistics
   */
  getClientStatistics: async (
    clientId: string
  ): Promise<{
    active_rooms_count: number;
    total_consultations: number;
    last_consultation_date: string | null;
  }> => {
    const response = await apiClient.get(`/api/clients/${clientId}/statistics`);
    return response.data;
  },
};

/**
 * Consultation Records API
 */
export const consultationRecordsAPI = {
  /**
   * Create consultation record
   */
  createRecord: async (
    clientId: string,
    data: ConsultationRecordCreate
  ): Promise<ConsultationRecord> => {
    const response = await apiClient.post(`/api/clients/${clientId}/consultation-records`, data);
    return response.data;
  },

  /**
   * Get client's consultation records
   */
  getClientRecords: async (clientId: string): Promise<ConsultationRecord[]> => {
    const response = await apiClient.get(`/api/clients/${clientId}/consultation-records`);
    return response.data;
  },

  /**
   * Update consultation record
   */
  updateRecord: async (
    recordId: string,
    data: { notes?: string; tags?: string[] }
  ): Promise<ConsultationRecord> => {
    const response = await apiClient.put(`/api/clients/consultation-records/${recordId}`, data);
    return response.data;
  },

  /**
   * Upload screenshot for consultation record with optional game state
   */
  uploadScreenshot: async (
    recordId: string,
    file: File,
    options?: {
      gameState?: any;
      gameRuleId?: string;
    }
  ): Promise<{ url: string; record_id: string; total_screenshots: number }> => {
    const formData = new FormData();
    formData.append('file', file);

    if (options?.gameState) {
      formData.append('game_state', JSON.stringify(options.gameState));
    }

    if (options?.gameRuleId) {
      formData.append('game_rule_id', options.gameRuleId);
    }

    const response = await apiClient.post(
      `/api/clients/consultation-records/${recordId}/screenshots`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};
