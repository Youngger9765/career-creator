/**
 * Client Management Types
 * 客戶管理類型定義
 */

export interface Client {
  id: string;
  counselor_id: string; // Each counselor has independent client records
  email?: string; // Optional - can be added later
  name: string;
  phone?: string;
  notes?: string;
  tags: string[];
  status: 'active' | 'inactive' | 'archived';
  email_verified: boolean;
  verification_token?: string;
  verified_at?: string;
  created_at: string;
  updated_at: string;
  // Statistics (may come from API separately)
  active_rooms_count?: number;
  total_consultations?: number;
  last_consultation_date?: string;
  // Default room (for simplified UX)
  default_room_id?: string;
  default_room_name?: string;
  // Room data from expanded API response
  rooms?: Array<{
    id: string;
    name: string;
    description?: string;
    counselor_id: string;
    share_code: string;
    is_active: boolean;
    expires_at?: string;
    session_count?: number;
    created_at: string;
    last_activity?: string;
    counselor_name?: string; // 諮詢師名稱
  }>;
}

export interface ClientCreate {
  email?: string; // Optional - can be added later
  name: string;
  phone?: string;
  notes?: string;
  tags?: string[];
}

export interface ClientUpdate {
  name?: string;
  phone?: string;
  notes?: string;
  tags?: string[];
  status?: 'active' | 'inactive' | 'archived';
}

export interface ClientEmailBind {
  client_id: string;
  email: string;
  send_verification?: boolean;
}

export interface ConsultationRecord {
  id: string;
  client_id: string;
  room_id: string;
  counselor_id: string;
  game_rule_id?: string;
  game_rule_name?: string; // 玩法名稱
  session_date: string;
  duration_minutes?: number;
  // Visual records
  screenshots: string[]; // GCS URL array
  // Data records
  game_state?: {
    gameMode: string;
    gameplay: string;
    cards: Array<{
      id: string;
      title: string;
      zone: string;
      position?: { x: number; y: number };
      flipped: boolean;
    }>;
  };
  topics: string[];
  notes?: string;
  follow_up_required: boolean;
  follow_up_date?: string;
  ai_summary?: string;
  created_at: string;
  updated_at: string;
}

export interface ConsultationRecordCreate {
  room_id: string;
  client_id: string;
  session_date: string;
  duration_minutes?: number;
  game_state?: Record<string, any>;
  topics?: string[];
  notes?: string;
  follow_up_required?: boolean;
  follow_up_date?: string;
}

export interface RoomClient {
  id: string;
  room_id: string;
  client_id: string;
  created_at: string;
}
