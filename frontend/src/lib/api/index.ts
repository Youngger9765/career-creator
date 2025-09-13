/**
 * API Module Exports
 * 統一匯出所有 API 模組
 */

export { apiClient, handleApiError } from './client';
export { authAPI } from './auth';
export { roomsAPI } from './rooms';
export { visitorsAPI } from './visitors';
export { cardEventsAPI, CardEventType } from './card-events';

// Re-export types
export type { User, LoginCredentials, RegisterData, AuthResponse, DemoAccount } from './auth';
export type { Room, CreateRoomData, RoomStatistics } from './rooms';
export type { Visitor, JoinRoomData } from './visitors';
export type { CardEvent, CreateCardEventData, CardEventSummary } from './card-events';