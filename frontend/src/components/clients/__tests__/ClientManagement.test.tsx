/**
 * ClientManagement Component Tests
 * Following TDD principles from CLAUDE.md
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ClientManagement } from '../ClientManagement';
import { clientsAPI } from '@/lib/api/clients';

// Mock API
vi.mock('@/lib/api/clients');
const mockedClientsAPI = vi.mocked(clientsAPI);

// Mock client data with rooms
const mockClientWithRooms = {
  id: 'client-1',
  name: '陳雅琪 (Alice Chen)',
  email: 'alice.chen@example.com',
  phone: '0912-345-678',
  status: 'active' as const,
  tags: ['應屆畢業生', '資訊科技'],
  created_at: '2025-09-24T19:22:36.254848',
  updated_at: '2025-09-24T19:22:36.254850',
  active_rooms_count: 2,
  total_consultations: 4,
  last_consultation_date: '2025-09-24T19:22:36.296551',
  rooms: [
    {
      id: 'room-1',
      name: '陳雅琪 的職涯諮詢室',
      description: '職涯探索與規劃',
      share_code: 'VDGH8M',
      is_active: true,
      expires_at: '2025-10-01T19:22:36.288792',
      session_count: 1,
      created_at: '2025-09-24T19:22:36.288850',
      last_activity: null,
    },
    {
      id: 'room-2',
      name: '陳雅琪 的技能盤點室',
      description: '個人能力評估',
      share_code: 'U5ZIIR',
      is_active: false,
      expires_at: '2025-10-14T20:18:17.993306',
      session_count: 3,
      created_at: '2025-09-23T20:18:17.993352',
      last_activity: null,
    },
  ],
};

const mockClientWithoutRooms = {
  id: 'client-2',
  name: '王建明 (Bob Wang)',
  email: 'bob.wang@example.com',
  status: 'active' as const,
  tags: [],
  created_at: '2025-09-24T19:22:36.259533',
  updated_at: '2025-09-24T19:22:36.259534',
  active_rooms_count: 0,
  total_consultations: 0,
  rooms: [],
};

describe('ClientManagement', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Client Expansion Functionality', () => {
    it('should show chevron right icon for clients with rooms', async () => {
      mockedClientsAPI.getMyClients.mockResolvedValue([mockClientWithRooms]);

      render(<ClientManagement />);

      await waitFor(() => {
        expect(screen.getByText('陳雅琪 (Alice Chen)')).toBeInTheDocument();
      });

      // Should show chevron right (collapsed state)
      const chevronRight = screen.getByTitle('展開/收合房間');
      expect(chevronRight).toBeInTheDocument();

      // Should show ChevronRight icon (not ChevronDown)
      expect(chevronRight.querySelector('svg')).toBeInTheDocument();
    });

    it('should not show chevron for clients without rooms', async () => {
      mockedClientsAPI.getMyClients.mockResolvedValue([mockClientWithoutRooms]);

      render(<ClientManagement />);

      await waitFor(() => {
        expect(screen.getByText('王建明 (Bob Wang)')).toBeInTheDocument();
      });

      // Should not show chevron for clients with no rooms
      expect(screen.queryByTitle('展開/收合房間')).not.toBeInTheDocument();
    });

    it('should expand client and show rooms in timeline when chevron is clicked', async () => {
      mockedClientsAPI.getMyClients.mockResolvedValue([mockClientWithRooms]);

      render(<ClientManagement />);

      await waitFor(() => {
        expect(screen.getByText('陳雅琪 (Alice Chen)')).toBeInTheDocument();
      });

      // Initially rooms should not be visible
      expect(screen.queryByText('諮詢房間 (2 個)')).not.toBeInTheDocument();
      expect(screen.queryByText('陳雅琪 的職涯諮詢室')).not.toBeInTheDocument();

      // Click to expand
      const chevronButton = screen.getByTitle('展開/收合房間');
      fireEvent.click(chevronButton);

      // Should now show expanded rooms
      expect(screen.getByText('諮詢房間 (2 個)')).toBeInTheDocument();
      expect(screen.getByText('陳雅琪 的職涯諮詢室')).toBeInTheDocument();
      expect(screen.getByText('陳雅琪 的技能盤點室')).toBeInTheDocument();
    });

    it('should display rooms in reverse chronological order (newest first)', async () => {
      mockedClientsAPI.getMyClients.mockResolvedValue([mockClientWithRooms]);

      render(<ClientManagement />);

      await waitFor(() => {
        expect(screen.getByText('陳雅琪 (Alice Chen)')).toBeInTheDocument();
      });

      // Expand client
      const chevronButton = screen.getByTitle('展開/收合房間');
      fireEvent.click(chevronButton);

      // Get all room elements
      const roomElements = screen.getAllByText(/的職涯諮詢室|的技能盤點室/);

      // First room should be the newer one (created on 2025-09-24)
      expect(roomElements[0]).toHaveTextContent('陳雅琪 的職涯諮詢室');
      // Second room should be the older one (created on 2025-09-23)
      expect(roomElements[1]).toHaveTextContent('陳雅琪 的技能盤點室');
    });

    it('should show correct room status badges', async () => {
      mockedClientsAPI.getMyClients.mockResolvedValue([mockClientWithRooms]);

      render(<ClientManagement />);

      await waitFor(() => {
        expect(screen.getByText('陳雅琪 (Alice Chen)')).toBeInTheDocument();
      });

      // Expand client
      const chevronButton = screen.getByTitle('展開/收合房間');
      fireEvent.click(chevronButton);

      // Should show "進行中" for active room
      expect(screen.getByText('進行中')).toBeInTheDocument();

      // Should show "已結束" for inactive room
      expect(screen.getByText('已結束')).toBeInTheDocument();
    });

    it('should show timeline visual elements', async () => {
      mockedClientsAPI.getMyClients.mockResolvedValue([mockClientWithRooms]);

      render(<ClientManagement />);

      await waitFor(() => {
        expect(screen.getByText('陳雅琪 (Alice Chen)')).toBeInTheDocument();
      });

      // Expand client
      const chevronButton = screen.getByTitle('展開/收合房間');
      fireEvent.click(chevronButton);

      // Should have timeline dots (one green for active, one gray for inactive)
      const container = screen.getByText('諮詢房間 (2 個)').closest('div');
      const timelineDots = container?.querySelectorAll('.w-3.h-3.rounded-full');

      expect(timelineDots).toHaveLength(2);
      expect(timelineDots?.[0]).toHaveClass('bg-green-500'); // Active room
      expect(timelineDots?.[1]).toHaveClass('bg-gray-400'); // Inactive room
    });

    it('should provide room action buttons', async () => {
      mockedClientsAPI.getMyClients.mockResolvedValue([mockClientWithRooms]);

      render(<ClientManagement />);

      await waitFor(() => {
        expect(screen.getByText('陳雅琪 (Alice Chen)')).toBeInTheDocument();
      });

      // Expand client
      const chevronButton = screen.getByTitle('展開/收合房間');
      fireEvent.click(chevronButton);

      // Should have "進入" buttons for each room
      const enterButtons = screen.getAllByText('進入');
      expect(enterButtons).toHaveLength(2);

      // Should have share code buttons
      const shareButtons = screen.getAllByText(/^#[A-Z0-9]+$/);
      expect(shareButtons).toHaveLength(2);
      expect(shareButtons[0]).toHaveTextContent('#VDGH8M');
      expect(shareButtons[1]).toHaveTextContent('#U5ZIIR');
    });

    it('should collapse rooms when chevron is clicked again', async () => {
      mockedClientsAPI.getMyClients.mockResolvedValue([mockClientWithRooms]);

      render(<ClientManagement />);

      await waitFor(() => {
        expect(screen.getByText('陳雅琪 (Alice Chen)')).toBeInTheDocument();
      });

      const chevronButton = screen.getByTitle('展開/收合房間');

      // Expand
      fireEvent.click(chevronButton);
      expect(screen.getByText('諮詢房間 (2 個)')).toBeInTheDocument();

      // Collapse
      fireEvent.click(chevronButton);
      expect(screen.queryByText('諮詢房間 (2 個)')).not.toBeInTheDocument();
    });
  });
});
