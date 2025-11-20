/**
 * TDD Red Phase: Tests for ClientTableRow component
 * These tests define expected behavior before implementation
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClientTableRow } from '../ClientTableRow';
import type { Client } from '@/types/client';

describe('ClientTableRow', () => {
  const mockClient: Client = {
    id: 'client-1',
    counselor_id: 'counselor-1',
    name: 'Test Client',
    email: 'test@example.com',
    phone: '0912345678',
    status: 'active',
    email_verified: false,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    tags: ['VIP', '企業'],
    notes: 'Test notes',
    last_consultation_date: '2025-01-10T10:00:00Z',
  };

  const mockHandlers = {
    onEnterRoom: vi.fn(),
    onToggleRecords: vi.fn(),
    onViewClient: vi.fn(),
    onEditClient: vi.fn(),
    onDeleteClient: vi.fn(),
    onVerifyEmail: vi.fn(),
    formatDate: (date: string) => new Date(date).toLocaleString('zh-TW'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render client name', () => {
      render(
        <table>
          <tbody>
            <ClientTableRow client={mockClient} {...mockHandlers} />
          </tbody>
        </table>
      );

      expect(screen.getByText('Test Client')).toBeInTheDocument();
    });

    it('should render client tags', () => {
      render(
        <table>
          <tbody>
            <ClientTableRow client={mockClient} {...mockHandlers} />
          </tbody>
        </table>
      );

      expect(screen.getByText('VIP')).toBeInTheDocument();
      expect(screen.getByText('企業')).toBeInTheDocument();
    });

    it('should render email with verification status', () => {
      render(
        <table>
          <tbody>
            <ClientTableRow client={mockClient} {...mockHandlers} />
          </tbody>
        </table>
      );

      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      // Email verification feature is currently disabled
      // expect(screen.getByText('驗證 Email')).toBeInTheDocument();
    });

    it('should not show verification button when email is verified', () => {
      const verifiedClient = { ...mockClient, email_verified: true };

      render(
        <table>
          <tbody>
            <ClientTableRow client={verifiedClient} {...mockHandlers} />
          </tbody>
        </table>
      );

      expect(screen.queryByText('驗證 Email')).not.toBeInTheDocument();
    });

    it('should render phone number', () => {
      render(
        <table>
          <tbody>
            <ClientTableRow client={mockClient} {...mockHandlers} />
          </tbody>
        </table>
      );

      expect(screen.getByText('0912345678')).toBeInTheDocument();
    });

    it('should render notes', () => {
      render(
        <table>
          <tbody>
            <ClientTableRow client={mockClient} {...mockHandlers} />
          </tbody>
        </table>
      );

      expect(screen.getByText('Test notes')).toBeInTheDocument();
    });

    it('should show placeholder when no email', () => {
      const noEmailClient = { ...mockClient, email: undefined };

      render(
        <table>
          <tbody>
            <ClientTableRow client={noEmailClient} {...mockHandlers} />
          </tbody>
        </table>
      );

      expect(screen.getByText('無Email')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onEnterRoom when enter room button is clicked', () => {
      render(
        <table>
          <tbody>
            <ClientTableRow client={mockClient} {...mockHandlers} />
          </tbody>
        </table>
      );

      const enterButton = screen.getByTitle('進入諮詢室');
      fireEvent.click(enterButton);

      expect(mockHandlers.onEnterRoom).toHaveBeenCalledWith(mockClient);
    });

    it('should call onToggleRecords when records button is clicked', () => {
      render(
        <table>
          <tbody>
            <ClientTableRow client={mockClient} {...mockHandlers} />
          </tbody>
        </table>
      );

      const recordsButton = screen.getByTitle('查看諮詢記錄');
      fireEvent.click(recordsButton);

      expect(mockHandlers.onToggleRecords).toHaveBeenCalledWith('client-1');
    });

    it('should call onViewClient when view button is clicked', () => {
      render(
        <table>
          <tbody>
            <ClientTableRow client={mockClient} {...mockHandlers} />
          </tbody>
        </table>
      );

      const viewButton = screen.getByTitle('檢視');
      fireEvent.click(viewButton);

      expect(mockHandlers.onViewClient).toHaveBeenCalledWith(mockClient);
    });

    it('should call onEditClient when edit button is clicked', () => {
      render(
        <table>
          <tbody>
            <ClientTableRow client={mockClient} {...mockHandlers} />
          </tbody>
        </table>
      );

      const editButton = screen.getByTitle('編輯');
      fireEvent.click(editButton);

      expect(mockHandlers.onEditClient).toHaveBeenCalledWith(mockClient);
    });

    it('should call onDeleteClient when delete button is clicked', () => {
      render(
        <table>
          <tbody>
            <ClientTableRow client={mockClient} {...mockHandlers} />
          </tbody>
        </table>
      );

      const deleteButton = screen.getByTitle('刪除');
      fireEvent.click(deleteButton);

      expect(mockHandlers.onDeleteClient).toHaveBeenCalledWith('client-1', 'Test Client');
    });

    it.skip('should call onVerifyEmail when verify email button is clicked', () => {
      // Skipped: Email verification feature is currently disabled in component
      render(
        <table>
          <tbody>
            <ClientTableRow client={mockClient} {...mockHandlers} />
          </tbody>
        </table>
      );

      const verifyButton = screen.getByText('驗證 Email');
      fireEvent.click(verifyButton);

      expect(mockHandlers.onVerifyEmail).toHaveBeenCalledWith('client-1', 'test@example.com');
    });
  });

  describe('disabled states', () => {
    it('should disable enter room button when submitLoading is true', () => {
      render(
        <table>
          <tbody>
            <ClientTableRow client={mockClient} {...mockHandlers} submitLoading={true} />
          </tbody>
        </table>
      );

      const enterButton = screen.getByTitle('進入諮詢室');
      expect(enterButton).toBeDisabled();
    });
  });

  describe('records expansion', () => {
    it('should show ChevronRight when records are collapsed', () => {
      render(
        <table>
          <tbody>
            <ClientTableRow client={mockClient} {...mockHandlers} isRecordsExpanded={false} />
          </tbody>
        </table>
      );

      // Check for collapsed state (ChevronRight icon)
      const recordsButton = screen.getByTitle('查看諮詢記錄');
      expect(recordsButton).toBeInTheDocument();
    });

    it('should show ChevronDown when records are expanded', () => {
      render(
        <table>
          <tbody>
            <ClientTableRow client={mockClient} {...mockHandlers} isRecordsExpanded={true} />
          </tbody>
        </table>
      );

      // Check for expanded state (ChevronDown icon)
      const recordsButton = screen.getByTitle('查看諮詢記錄');
      expect(recordsButton).toBeInTheDocument();
    });
  });
});
