/**
 * Client Management Types
 * 客戶管理類型定義
 */

export interface Client {
  id: string;
  email: string;
  name: string;
  phone?: string;
  notes?: string;
  tags: string[];
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
  // Statistics (may come from API separately)
  active_rooms_count?: number;
  total_consultations?: number;
  last_consultation_date?: string;
  // Room data from expanded API response
  rooms?: Array<{
    id: string;
    name: string;
    description?: string;
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
  email: string;
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

export interface CounselorClient {
  id: string;
  counselor_id: string;
  client_id: string;
  relationship_type: 'primary' | 'secondary' | 'consultant';
  created_at: string;
  is_active: boolean;
}

export interface CounselorClientCreate {
  client_id: string;
  relationship_type?: 'primary' | 'secondary' | 'consultant';
}

export interface ConsultationRecord {
  id: string;
  client_id: string;
  room_id?: string;
  game_session_id?: string;
  consultation_date: string;
  duration_minutes?: number;
  session_type: 'initial' | 'followup' | 'assessment' | 'closure';
  notes?: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export interface ConsultationRecordCreate {
  room_id?: string;
  game_session_id?: string;
  consultation_date?: string;
  duration_minutes?: number;
  session_type?: 'initial' | 'followup' | 'assessment' | 'closure';
  notes?: string;
  tags?: string[];
}

export interface RoomClient {
  id: string;
  room_id: string;
  client_id: string;
  joined_at: string;
  last_active?: string;
  is_primary: boolean;
}
