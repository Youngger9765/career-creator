/**
 * Room state management using Zustand
 * 房間狀態管理
 */
import { create } from 'zustand';
import { Room, RoomCreate, Visitor, CardEvent } from '@/types/api';
import apiClient from '@/lib/api-client';
import wsClient from '@/lib/websocket-client';

interface RoomState {
  // Current room data
  currentRoom: Room | null;
  visitors: Visitor[];
  cardEvents: CardEvent[];
  isConnected: boolean;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // User rooms
  userRooms: Room[];
  
  // Actions
  createRoom: (roomData: RoomCreate) => Promise<Room>;
  joinRoom: (roomId: string) => Promise<void>;
  joinRoomByShareCode: (shareCode: string) => Promise<void>;
  leaveRoom: () => void;
  
  loadUserRooms: () => Promise<void>;
  loadRoomVisitors: (roomId: string) => Promise<void>;
  loadRoomEvents: (roomId: string) => Promise<void>;
  
  // WebSocket actions
  connectWebSocket: (userInfo: { user_id?: string; user_name?: string; user_type?: 'user' | 'visitor' }) => Promise<void>;
  disconnectWebSocket: () => void;
  
  // Real-time updates
  addVisitor: (visitor: Visitor) => void;
  removeVisitor: (visitorId: string) => void;
  addCardEvent: (event: CardEvent) => void;
  
  clearError: () => void;
  clearCurrentRoom: () => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  currentRoom: null,
  visitors: [],
  cardEvents: [],
  isConnected: false,
  isLoading: false,
  error: null,
  userRooms: [],

  createRoom: async (roomData: RoomCreate) => {
    set({ isLoading: true, error: null });
    
    try {
      const room = await apiClient.createRoom(roomData);
      
      // Add to user rooms
      const { userRooms } = get();
      set({ 
        userRooms: [...userRooms, room],
        isLoading: false
      });
      
      return room;
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to create room';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  joinRoom: async (roomId: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const room = await apiClient.getRoom(roomId);
      set({ 
        currentRoom: room,
        isLoading: false
      });
      
      // Load room data
      await Promise.all([
        get().loadRoomVisitors(roomId),
        get().loadRoomEvents(roomId)
      ]);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to join room';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  joinRoomByShareCode: async (shareCode: string) => {
    set({ isLoading: true, error: null });
    
    try {
      const room = await apiClient.getRoomByShareCode(shareCode);
      set({ 
        currentRoom: room,
        isLoading: false
      });
      
      // Load room data
      await Promise.all([
        get().loadRoomVisitors(room.id),
        get().loadRoomEvents(room.id)
      ]);
      
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Room not found';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  leaveRoom: () => {
    get().disconnectWebSocket();
    set({ 
      currentRoom: null,
      visitors: [],
      cardEvents: [],
      isConnected: false
    });
  },

  loadUserRooms: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const rooms = await apiClient.getUserRooms();
      set({ 
        userRooms: rooms,
        isLoading: false
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to load rooms';
      set({ error: errorMessage, isLoading: false });
    }
  },

  loadRoomVisitors: async (roomId: string) => {
    try {
      const visitors = await apiClient.getRoomVisitors(roomId);
      set({ visitors });
    } catch (error) {
      console.error('Failed to load room visitors:', error);
    }
  },

  loadRoomEvents: async (roomId: string) => {
    try {
      const events = await apiClient.getLatestRoomEvents(roomId);
      set({ cardEvents: events });
    } catch (error) {
      console.error('Failed to load room events:', error);
    }
  },

  connectWebSocket: async (userInfo) => {
    const { currentRoom } = get();
    if (!currentRoom) {
      throw new Error('No current room to connect to');
    }

    try {
      await wsClient.connect(currentRoom.id, userInfo);
      set({ isConnected: true });
      
      // Set up event listeners
      wsClient.on('user_joined', (data) => {
        console.log('User joined:', data);
      });
      
      wsClient.on('user_left', (data) => {
        console.log('User left:', data);
      });
      
      wsClient.on('card_event', (data) => {
        get().addCardEvent(data);
      });
      
      wsClient.on('disconnected', () => {
        set({ isConnected: false });
      });
      
    } catch (error) {
      console.error('Failed to connect WebSocket:', error);
      throw error;
    }
  },

  disconnectWebSocket: () => {
    wsClient.disconnect();
    set({ isConnected: false });
  },

  addVisitor: (visitor: Visitor) => {
    const { visitors } = get();
    set({ 
      visitors: [...visitors, visitor]
    });
  },

  removeVisitor: (visitorId: string) => {
    const { visitors } = get();
    set({ 
      visitors: visitors.filter(v => v.id !== visitorId)
    });
  },

  addCardEvent: (event: CardEvent) => {
    const { cardEvents } = get();
    set({ 
      cardEvents: [...cardEvents, event].sort((a, b) => a.sequence_number - b.sequence_number)
    });
  },

  clearError: () => {
    set({ error: null });
  },

  clearCurrentRoom: () => {
    set({ 
      currentRoom: null,
      visitors: [],
      cardEvents: [],
      isConnected: false
    });
  },
}));