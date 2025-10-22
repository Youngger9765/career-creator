/**
 * useClientManagement hook
 * Manages client list state, CRUD operations, and UI interactions
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { clientsAPI, consultationRecordsAPI } from '@/lib/api/clients';
import type { Client, ClientCreate, ClientUpdate, ConsultationRecord } from '@/types/client';

export function useClientManagement() {
  // State management
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [expandedClients, setExpandedClients] = useState<Set<string>>(new Set());
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState<any>(null);
  const [clientRecords, setClientRecords] = useState<Record<string, ConsultationRecord[]>>({});
  const [loadingRecords, setLoadingRecords] = useState<Set<string>>(new Set());
  const [expandedRecords, setExpandedRecords] = useState<Set<string>>(new Set());
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Load clients on mount
  useEffect(() => {
    loadClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadClients = useCallback(async () => {
    try {
      setLoading(true);
      const data = await clientsAPI.getMyClients();
      setClients(data);
    } catch (error) {
      console.error('Failed to load clients:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filtered and sorted clients
  const filteredClients = useMemo(() => {
    return clients
      .filter((client) => {
        const matchesSearch =
          client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (client.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        return matchesSearch;
      })
      .sort((a, b) => {
        // Archived clients go to the end
        if (a.status === 'archived' && b.status !== 'archived') return 1;
        if (a.status !== 'archived' && b.status === 'archived') return -1;

        // Others sorted by creation time (newest first)
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
  }, [clients, searchTerm]);

  // CRUD operations
  const handleCreateClient = useCallback(async (data: ClientCreate | ClientUpdate) => {
    try {
      setSubmitLoading(true);
      const newClient = await clientsAPI.createClient(data as ClientCreate);
      setClients((prev) => [newClient, ...prev]);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create client:', error);
      alert('新增客戶失敗，請稍後再試');
    } finally {
      setSubmitLoading(false);
    }
  }, []);

  const handleUpdateClient = useCallback(async (clientId: string, data: ClientUpdate) => {
    try {
      setSubmitLoading(true);
      const updatedClient = await clientsAPI.updateClient(clientId, data);
      setClients((prev) => prev.map((client) => (client.id === clientId ? updatedClient : client)));
      setEditingClient(null);
    } catch (error) {
      console.error('Failed to update client:', error);
      alert('更新客戶資料失敗，請稍後再試');
    } finally {
      setSubmitLoading(false);
    }
  }, []);

  const handleDeleteClient = useCallback(async (clientId: string, clientName: string) => {
    if (!confirm(`確定要刪除客戶「${clientName}」嗎？此操作會將客戶狀態設為封存。`)) {
      return;
    }

    try {
      await clientsAPI.updateClient(clientId, { status: 'archived' });
      setClients((prev) =>
        prev.map((client) =>
          client.id === clientId ? { ...client, status: 'archived' as const } : client
        )
      );
    } catch (error) {
      console.error('Failed to delete client:', error);
      alert('刪除客戶失敗，請稍後再試');
    }
  }, []);

  const handleVerifyEmail = useCallback(async (clientId: string, clientEmail: string) => {
    alert(
      `未來功能：系統將寄送驗證信件到 ${clientEmail}\n\n客戶將收到驗證連結，點擊後即可完成 Email 驗證。\n\n此功能正在開發中，敬請期待！`
    );
  }, []);

  const handleDeleteRoomSuccess = useCallback(
    (deletedRoomId: string) => {
      // Refresh clients to update room counts
      loadClients();
      setDeletingRoom(null);
    },
    [loadClients]
  );

  // Consultation records management
  const handleToggleRecords = useCallback(async (clientId: string) => {
    setExpandedRecords((prevExpanded) => {
      const newExpanded = new Set(prevExpanded);

      if (newExpanded.has(clientId)) {
        // Collapse
        newExpanded.delete(clientId);
      } else {
        // Expand
        newExpanded.add(clientId);

        // Load records if not already loaded (check within functional update)
        setClientRecords((prevRecords) => {
          if (!prevRecords[clientId]) {
            // Async load
            (async () => {
              try {
                setLoadingRecords((prev) => new Set(prev).add(clientId));
                const records = await consultationRecordsAPI.getClientRecords(clientId);
                setClientRecords((prev) => ({ ...prev, [clientId]: records }));
              } catch (error) {
                console.error('Failed to load consultation records:', error);
                alert('載入諮詢記錄失敗');
              } finally {
                setLoadingRecords((prev) => {
                  const newSet = new Set(prev);
                  newSet.delete(clientId);
                  return newSet;
                });
              }
            })();
          }
          return prevRecords;
        });
      }

      return newExpanded;
    });
  }, []);

  return {
    // State
    clients,
    loading,
    searchTerm,
    showCreateForm,
    editingClient,
    viewingClient,
    isEditMode,
    expandedClients,
    submitLoading,
    deletingRoom,
    clientRecords,
    loadingRecords,
    expandedRecords,
    selectedImage,

    // Computed
    filteredClients,

    // State setters
    setSearchTerm,
    setShowCreateForm,
    setEditingClient,
    setViewingClient,
    setIsEditMode,
    setExpandedClients,
    setSubmitLoading,
    setDeletingRoom,
    setSelectedImage,

    // Operations
    loadClients,
    handleCreateClient,
    handleUpdateClient,
    handleDeleteClient,
    handleVerifyEmail,
    handleDeleteRoomSuccess,
    handleToggleRecords,
  };
}
