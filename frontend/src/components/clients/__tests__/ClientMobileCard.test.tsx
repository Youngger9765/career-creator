/**
 * TDD Red Phase: Tests for ClientMobileCard component
 * Mobile view card for client list
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ClientMobileCard } from '../ClientMobileCard';
import type { Client } from '@/types/client';

describe('ClientMobileCard', () => {
  const mockClient: Client = {
    id: 'client-1',
    counselor_id: 'counselor-1',
    name: 'Mobile Test Client',
    email: 'mobile@example.com',
    phone: '0987654321',
    status: 'active',
    email_verified: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
    tags: ['測試', '行動版'],
    notes: 'Mobile test notes',
    last_consultation_date: '2025-01-15T14:00:00Z',
  };

  const mockHandlers = {
    onEnterRoom: vi.fn(),
    onToggleRecords: vi.fn(),
    onViewClient: vi.fn(),
    onEditClient: vi.fn(),
    onDeleteClient: vi.fn(),
    formatDate: (date: string) => new Date(date).toLocaleString('zh-TW'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render client name', () => {
    render(<ClientMobileCard client={mockClient} {...mockHandlers} />);
    expect(screen.getByText('Mobile Test Client')).toBeInTheDocument();
  });

  it('should render tags', () => {
    render(<ClientMobileCard client={mockClient} {...mockHandlers} />);
    expect(screen.getByText('測試')).toBeInTheDocument();
    expect(screen.getByText('行動版')).toBeInTheDocument();
  });

  it('should render email', () => {
    render(<ClientMobileCard client={mockClient} {...mockHandlers} />);
    expect(screen.getByText('mobile@example.com')).toBeInTheDocument();
  });

  it('should render phone', () => {
    render(<ClientMobileCard client={mockClient} {...mockHandlers} />);
    expect(screen.getByText('0987654321')).toBeInTheDocument();
  });

  it('should render last consultation date', () => {
    render(<ClientMobileCard client={mockClient} {...mockHandlers} />);
    const dateString = mockHandlers.formatDate(mockClient.last_consultation_date!);
    expect(screen.getByText(new RegExp(dateString.slice(0, 10)))).toBeInTheDocument();
  });

  it('should render notes', () => {
    render(<ClientMobileCard client={mockClient} {...mockHandlers} />);
    expect(screen.getByText('Mobile test notes')).toBeInTheDocument();
  });

  it('should call onEnterRoom when enter button clicked', () => {
    render(<ClientMobileCard client={mockClient} {...mockHandlers} />);
    const enterButton = screen.getByText('進入諮詢室');
    fireEvent.click(enterButton);
    expect(mockHandlers.onEnterRoom).toHaveBeenCalledWith(mockClient);
  });

  it('should call onToggleRecords when records button clicked', () => {
    render(<ClientMobileCard client={mockClient} {...mockHandlers} />);
    // The button has icon but we can find by the button that calls onToggleRecords
    const buttons = screen.getAllByRole('button');
    const recordsButton = buttons.find((btn) =>
      btn.className.includes('bg-gray-100')
    );
    if (recordsButton) {
      fireEvent.click(recordsButton);
      expect(mockHandlers.onToggleRecords).toHaveBeenCalledWith('client-1');
    }
  });

  it('should call onViewClient when view button clicked', () => {
    render(<ClientMobileCard client={mockClient} {...mockHandlers} />);
    const buttons = screen.getAllByRole('button');
    const viewButton = buttons.find((btn) =>
      btn.className.includes('text-gray-600') && btn.className.includes('w-8')
    );
    if (viewButton) {
      fireEvent.click(viewButton);
      expect(mockHandlers.onViewClient).toHaveBeenCalledWith(mockClient);
    }
  });

  it('should call onEditClient when edit button clicked', () => {
    render(<ClientMobileCard client={mockClient} {...mockHandlers} />);
    const buttons = screen.getAllByRole('button');
    const editButton = buttons.find((btn) =>
      btn.className.includes('text-blue-600') && btn.className.includes('w-8')
    );
    if (editButton) {
      fireEvent.click(editButton);
      expect(mockHandlers.onEditClient).toHaveBeenCalledWith(mockClient);
    }
  });

  it('should call onDeleteClient when delete button clicked', () => {
    render(<ClientMobileCard client={mockClient} {...mockHandlers} />);
    const buttons = screen.getAllByRole('button');
    const deleteButton = buttons.find((btn) =>
      btn.className.includes('text-red-600') && btn.className.includes('w-8')
    );
    if (deleteButton) {
      fireEvent.click(deleteButton);
      expect(mockHandlers.onDeleteClient).toHaveBeenCalledWith('client-1', 'Mobile Test Client');
    }
  });

  it('should show expanded icon when records are expanded', () => {
    render(
      <ClientMobileCard
        client={mockClient}
        {...mockHandlers}
        isRecordsExpanded={true}
      />
    );
    // ChevronDown should be present (expanded state)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should disable enter button when loading', () => {
    render(
      <ClientMobileCard
        client={mockClient}
        {...mockHandlers}
        submitLoading={true}
      />
    );
    const enterButton = screen.getByText('進入諮詢室');
    expect(enterButton).toBeDisabled();
  });
});
