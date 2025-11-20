/**
 * Room state management using Zustand
 * 諮詢室狀態管理
 */
import { create } from 'zustand';
import { Room, CreateRoomData } from '@/lib/api/rooms';
import { roomsAPI } from '@/lib/api/rooms';
import type { Visitor, CardEvent } from '@/types/api';

interface RoomState {
  // Current room data
  currentRoom: Room | null;

  // UI state
  isLoading: boolean;
  error: string | null;

  // User rooms
  userRooms: Room[];

  // Actions
  createRoom: (roomData: CreateRoomData) => Promise<Room>;
  joinRoom: (roomId: string) => Promise<void>;
  joinRoomByShareCode: (shareCode: string) => Promise<void>;
  leaveRoom: () => void;

  loadUserRooms: () => Promise<void>;

  clearError: () => void;
  clearCurrentRoom: () => void;
}

export const useRoomStore = create<RoomState>((set, get) => ({
  currentRoom: null,
  isLoading: false,
  error: null,
  userRooms: [],

  createRoom: async (roomData: CreateRoomData) => {
    set({ isLoading: true, error: null });

    try {
      const room = await roomsAPI.createRoom(roomData);

      // Add to user rooms
      const { userRooms } = get();
      set({
        userRooms: [...userRooms, room],
        isLoading: false,
      });

      return room;
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to create room';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  joinRoom: async (roomId: string) => {
    set({ isLoading: true, error: null });

    try {
      const room = await roomsAPI.getRoom(roomId);
      set({
        currentRoom: room,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to join room';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  joinRoomByShareCode: async (shareCode: string) => {
    set({ isLoading: true, error: null });

    try {
      const room = await roomsAPI.getRoomByShareCode(shareCode);
      set({
        currentRoom: room,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Room not found';
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  leaveRoom: () => {
    set({
      currentRoom: null,
    });
  },

  loadUserRooms: async () => {
    set({ isLoading: true, error: null });

    try {
      const rooms = await roomsAPI.getMyRooms();
      set({
        userRooms: rooms,
        isLoading: false,
      });
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to load rooms';
      set({ error: errorMessage, isLoading: false });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  clearCurrentRoom: () => {
    set({
      currentRoom: null,
    });
  },
}));
