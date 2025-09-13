/**
 * API Client for Career Creator backend
 * API 客戶端
 */
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { 
  DemoAccount, 
  LoginRequest, 
  LoginResponse, 
  Room, 
  RoomCreate,
  Visitor,
  VisitorCreate,
  CardEvent,
  CardEventCreate
} from '@/types/api';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') {
    this.client = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.setToken(null);
          // Could redirect to login here
        }
        return Promise.reject(error);
      }
    );

    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      const savedToken = localStorage.getItem('auth_token');
      if (savedToken) {
        this.setToken(savedToken);
      }
    }
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  // Auth API
  async getDemoAccounts(): Promise<DemoAccount[]> {
    const response = await this.client.get('/api/auth/demo-accounts');
    return response.data;
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await this.client.post('/api/auth/login', credentials);
    const loginData = response.data;
    this.setToken(loginData.access_token);
    return loginData;
  }

  async getCurrentUser() {
    const response = await this.client.get('/api/auth/me');
    return response.data;
  }

  logout() {
    this.setToken(null);
  }

  // Room API
  async createRoom(roomData: RoomCreate): Promise<Room> {
    const response = await this.client.post('/api/rooms', roomData);
    return response.data;
  }

  async getRoom(roomId: string): Promise<Room> {
    const response = await this.client.get(`/api/rooms/${roomId}`);
    return response.data;
  }

  async getRoomByShareCode(shareCode: string): Promise<Room> {
    const response = await this.client.get(`/api/rooms/by-code/${shareCode}`);
    return response.data;
  }

  async getUserRooms(): Promise<Room[]> {
    const response = await this.client.get('/api/rooms');
    return response.data;
  }

  async updateRoom(roomId: string, roomData: RoomCreate): Promise<Room> {
    const response = await this.client.put(`/api/rooms/${roomId}`, roomData);
    return response.data;
  }

  async deleteRoom(roomId: string): Promise<void> {
    await this.client.delete(`/api/rooms/${roomId}`);
  }

  // Visitor API
  async joinRoomAsVisitor(shareCode: string, visitorData: VisitorCreate): Promise<Visitor> {
    const response = await this.client.post(`/api/visitors/join-room/${shareCode}`, visitorData);
    return response.data;
  }

  async getRoomVisitors(roomId: string): Promise<Visitor[]> {
    const response = await this.client.get(`/api/visitors/room/${roomId}`);
    return response.data;
  }

  async updateVisitorHeartbeat(visitorId: string): Promise<Visitor> {
    const response = await this.client.put(`/api/visitors/${visitorId}/heartbeat`, {
      last_seen: new Date().toISOString()
    });
    return response.data;
  }

  async leaveRoom(visitorId: string): Promise<void> {
    await this.client.delete(`/api/visitors/${visitorId}`);
  }

  // Card Event API
  async createCardEvent(eventData: CardEventCreate): Promise<CardEvent> {
    const response = await this.client.post('/api/card-events', eventData);
    return response.data;
  }

  async getRoomEvents(
    roomId: string, 
    filters?: {
      event_type?: string;
      performer_id?: string;
      from_sequence?: number;
      to_sequence?: number;
      limit?: number;
      offset?: number;
    }
  ): Promise<CardEvent[]> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const response = await this.client.get(`/api/card-events/room/${roomId}?${params}`);
    return response.data;
  }

  async getLatestRoomEvents(roomId: string, limit: number = 50): Promise<CardEvent[]> {
    const response = await this.client.get(`/api/card-events/room/${roomId}/latest?limit=${limit}`);
    return response.data;
  }

  async getRoomEventSummary(roomId: string) {
    const response = await this.client.get(`/api/card-events/room/${roomId}/summary`);
    return response.data;
  }

  async getCardEvent(eventId: string): Promise<CardEvent> {
    const response = await this.client.get(`/api/card-events/${eventId}`);
    return response.data;
  }

  async deleteCardEvent(eventId: string): Promise<void> {
    await this.client.delete(`/api/card-events/${eventId}`);
  }

  // Active users API
  async getActiveUsers(roomId: string) {
    const response = await this.client.get(`/api/rooms/${roomId}/active-users`);
    return response.data;
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
export default apiClient;