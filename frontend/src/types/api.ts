/**
 * API type definitions for Career Creator
 * API 類型定義
 */

// Base types
export interface BaseEntity {
  id: string;
  created_at: string;
}

// User types
export interface DemoAccount {
  id: string;
  name: string;
  email: string;
  roles: string[];
  description: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  roles: string[];
  is_active: boolean;
  created_at: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

// Room types
export interface Room extends BaseEntity {
  name: string;
  description?: string;
  counselor_id: string;
  share_code: string;
  is_active: boolean;
}

export interface RoomCreate {
  name: string;
  description?: string;
}

// Visitor types
export interface Visitor extends BaseEntity {
  name: string;
  room_id: string;
  session_id: string;
  is_active: boolean;
  joined_at: string;
  last_seen: string;
}

export interface VisitorCreate {
  name: string;
  room_id: string;
  session_id: string;
}

// Card Event types
export enum CardEventType {
  CARD_DEALT = "card_dealt",
  CARD_FLIPPED = "card_flipped",
  CARD_SELECTED = "card_selected",
  CARD_MOVED = "card_moved",
  CARD_ARRANGED = "card_arranged",
  CARD_DISCUSSED = "card_discussed",
  NOTES_ADDED = "notes_added",
  INSIGHT_RECORDED = "insight_recorded"
}

export interface CardEvent extends BaseEntity {
  room_id: string;
  event_type: CardEventType;
  card_id?: string;
  event_data?: Record<string, any>;
  notes?: string;
  performer_id?: string;
  performer_type: "user" | "visitor";
  performer_name?: string;
  sequence_number: number;
}

export interface CardEventCreate {
  room_id: string;
  event_type: CardEventType;
  card_id?: string;
  event_data?: Record<string, any>;
  notes?: string;
  performer_id?: string;
  performer_type?: "user" | "visitor";
  performer_name?: string;
}

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  data: any;
}

export interface CardEventMessage extends WebSocketMessage {
  type: "card_event";
  data: CardEventCreate;
}

export interface ChatMessage extends WebSocketMessage {
  type: "chat_message";
  data: {
    message: string;
  };
}

export interface UserActionMessage extends WebSocketMessage {
  type: "user_action";
  data: {
    action: string;
    position?: { x: number; y: number };
    target?: string;
    [key: string]: any;
  };
}

// API Response types
export interface ApiError {
  detail: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}