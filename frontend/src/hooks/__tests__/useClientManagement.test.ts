/**
 * TDD Red Phase: Tests for useClientManagement hook
 * These tests define expected behavior before implementation
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useClientManagement } from '../useClientManagement';
import { clientsAPI, consultationRecordsAPI } from '@/lib/api/clients';
import type { Client, ClientCreate, ClientUpdate } from '@/types/client';

// Mock the API modules
vi.mock('@/lib/api/clients', () => ({
  clientsAPI: {
    getMyClients: vi.fn(),
    createClient: vi.fn(),
    updateClient: vi.fn(),
  },
  consultationRecordsAPI: {
    getClientRecords: vi.fn(),
  },
}));

describe('useClientManagement', () => {
  const mockClients: Client[] = [
    {
      id: '1',
      counselor_id: 'counselor-1',
      name: 'Test Client 1',
      email: 'test1@example.com',
      phone: '0912345678',
      status: 'active',
      email_verified: false,
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      tags: ['tag1'],
    },
    {
      id: '2',
      counselor_id: 'counselor-1',
      name: 'Test Client 2',
      email: 'test2@example.com',
      status: 'active',
      email_verified: true,
      created_at: '2025-01-02T00:00:00Z',
      updated_at: '2025-01-02T00:00:00Z',
      tags: [],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(clientsAPI.getMyClients).mockResolvedValue(mockClients);
  });

  describe('initialization', () => {
    it('should load clients on mount', async () => {
      const { result } = renderHook(() => useClientManagement());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(clientsAPI.getMyClients).toHaveBeenCalledTimes(1);
      expect(result.current.clients).toHaveLength(2);
    });

    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useClientManagement());

      expect(result.current.clients).toEqual([]);
      expect(result.current.searchTerm).toBe('');
      expect(result.current.showCreateForm).toBe(false);
      expect(result.current.editingClient).toBeNull();
      expect(result.current.viewingClient).toBeNull();
    });
  });

  describe('search functionality', () => {
    it('should filter clients by name', async () => {
      const { result } = renderHook(() => useClientManagement());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSearchTerm('Client 1');
      });

      expect(result.current.filteredClients).toHaveLength(1);
      expect(result.current.filteredClients[0].name).toBe('Test Client 1');
    });

    it('should filter clients by email', async () => {
      const { result } = renderHook(() => useClientManagement());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSearchTerm('test2@');
      });

      expect(result.current.filteredClients).toHaveLength(1);
      expect(result.current.filteredClients[0].email).toBe('test2@example.com');
    });

    it('should be case insensitive', async () => {
      const { result } = renderHook(() => useClientManagement());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setSearchTerm('CLIENT');
      });

      expect(result.current.filteredClients).toHaveLength(2);
    });
  });

  describe('client sorting', () => {
    it('should sort archived clients to the end', async () => {
      const clientsWithArchived = [
        ...mockClients,
        {
          id: '3',
          counselor_id: 'counselor-1',
          name: 'Archived Client',
          status: 'archived' as const,
          email_verified: false,
          created_at: '2025-01-03T00:00:00Z',
          updated_at: '2025-01-03T00:00:00Z',
          tags: [],
        },
      ];

      vi.mocked(clientsAPI.getMyClients).mockResolvedValue(clientsWithArchived);

      const { result } = renderHook(() => useClientManagement());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const filtered = result.current.filteredClients;
      expect(filtered[filtered.length - 1].status).toBe('archived');
    });

    it('should sort by created_at descending (newest first)', async () => {
      const { result } = renderHook(() => useClientManagement());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const filtered = result.current.filteredClients;
      expect(new Date(filtered[0].created_at).getTime()).toBeGreaterThan(
        new Date(filtered[1].created_at).getTime()
      );
    });
  });

  describe('createClient', () => {
    it('should create a new client', async () => {
      const newClient: Client = {
        id: '3',
        counselor_id: 'counselor-1',
        name: 'New Client',
        email: 'new@example.com',
        status: 'active',
        email_verified: false,
        created_at: '2025-01-03T00:00:00Z',
        updated_at: '2025-01-03T00:00:00Z',
        tags: [],
      };

      vi.mocked(clientsAPI.createClient).mockResolvedValue(newClient);

      const { result } = renderHook(() => useClientManagement());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const clientData: ClientCreate = {
        name: 'New Client',
        email: 'new@example.com',
      };

      await act(async () => {
        await result.current.handleCreateClient(clientData);
      });

      expect(clientsAPI.createClient).toHaveBeenCalledWith(clientData);
      expect(result.current.clients).toHaveLength(3);
      expect(result.current.clients[0].name).toBe('New Client');
      expect(result.current.showCreateForm).toBe(false);
    });

    it('should set submitLoading during creation', async () => {
      const { result } = renderHook(() => useClientManagement());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const promise = act(async () => {
        await result.current.handleCreateClient({ name: 'Test', email: 'test@test.com' });
      });

      expect(result.current.submitLoading).toBe(true);

      await promise;

      expect(result.current.submitLoading).toBe(false);
    });
  });

  describe('updateClient', () => {
    it('should update an existing client', async () => {
      const updatedClient: Client = {
        ...mockClients[0],
        name: 'Updated Name',
      };

      vi.mocked(clientsAPI.updateClient).mockResolvedValue(updatedClient);

      const { result } = renderHook(() => useClientManagement());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const updateData: ClientUpdate = { name: 'Updated Name' };

      await act(async () => {
        await result.current.handleUpdateClient('1', updateData);
      });

      expect(clientsAPI.updateClient).toHaveBeenCalledWith('1', updateData);
      expect(result.current.clients[0].name).toBe('Updated Name');
      expect(result.current.editingClient).toBeNull();
    });
  });

  describe('deleteClient', () => {
    it('should archive a client', async () => {
      // Mock window.confirm
      vi.stubGlobal('confirm', vi.fn(() => true));

      const archivedClient: Client = {
        ...mockClients[0],
        status: 'archived',
      };

      vi.mocked(clientsAPI.updateClient).mockResolvedValue(archivedClient);

      const { result } = renderHook(() => useClientManagement());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.handleDeleteClient('1', 'Test Client 1');
      });

      expect(clientsAPI.updateClient).toHaveBeenCalledWith('1', { status: 'archived' });
      expect(result.current.clients.find((c) => c.id === '1')?.status).toBe('archived');

      vi.unstubAllGlobals();
    });

    it('should not delete if user cancels confirmation', async () => {
      vi.stubGlobal('confirm', vi.fn(() => false));

      const { result } = renderHook(() => useClientManagement());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.handleDeleteClient('1', 'Test Client 1');
      });

      expect(clientsAPI.updateClient).not.toHaveBeenCalled();

      vi.unstubAllGlobals();
    });
  });

  describe('consultation records', () => {
    it('should toggle records expansion', async () => {
      const { result } = renderHook(() => useClientManagement());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.expandedRecords.has('1')).toBe(false);

      await act(async () => {
        await result.current.handleToggleRecords('1');
      });

      expect(result.current.expandedRecords.has('1')).toBe(true);

      await act(async () => {
        await result.current.handleToggleRecords('1');
      });

      expect(result.current.expandedRecords.has('1')).toBe(false);
    });

    it('should load records when expanding', async () => {
      const mockRecords = [
        {
          id: 'rec1',
          client_id: '1',
          room_id: 'room-1',
          counselor_id: 'counselor-1',
          session_date: '2025-01-01T00:00:00Z',
          screenshots: [],
          topics: ['career'],
          notes: 'Test note',
          follow_up_required: false,
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      vi.mocked(consultationRecordsAPI.getClientRecords).mockResolvedValue(mockRecords);

      const { result } = renderHook(() => useClientManagement());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.handleToggleRecords('1');
      });

      expect(consultationRecordsAPI.getClientRecords).toHaveBeenCalledWith('1');
      expect(result.current.clientRecords['1']).toEqual(mockRecords);
    });
  });

  describe('UI state management', () => {
    it('should toggle create form', () => {
      const { result } = renderHook(() => useClientManagement());

      expect(result.current.showCreateForm).toBe(false);

      act(() => {
        result.current.setShowCreateForm(true);
      });

      expect(result.current.showCreateForm).toBe(true);
    });

    it('should set editing client', async () => {
      const { result } = renderHook(() => useClientManagement());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setEditingClient(mockClients[0]);
      });

      expect(result.current.editingClient).toEqual(mockClients[0]);
    });

    it('should set viewing client', async () => {
      const { result } = renderHook(() => useClientManagement());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.setViewingClient(mockClients[0]);
      });

      expect(result.current.viewingClient).toEqual(mockClients[0]);
    });
  });
});
