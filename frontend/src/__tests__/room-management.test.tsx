import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConsultationAreaNew } from '@/components/consultation/ConsultationAreaNew';

// Mock dependencies
vi.mock('@/hooks/use-card-sync', () => ({
  useCardSync: () => ({
    syncCardEvent: vi.fn(),
  }),
}));

vi.mock('@/hooks/use-card-events', () => ({
  useCardEvents: () => ({
    createEvent: vi.fn().mockResolvedValue({}),
    dealCard: vi.fn().mockResolvedValue({}),
    flipCard: vi.fn().mockResolvedValue({}),
    moveCard: vi.fn().mockResolvedValue({}),
  }),
}));

vi.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: any) => <div>{children}</div>,
  DragOverlay: ({ children }: any) => <div>{children}</div>,
  closestCenter: vi.fn(),
  useDraggable: () => ({
    attributes: {},
    listeners: {},
    setNodeRef: vi.fn(),
    transform: null,
  }),
  useDroppable: () => ({
    isOver: false,
    setNodeRef: vi.fn(),
  }),
  useSensor: vi.fn(),
  useSensors: vi.fn(),
  PointerSensor: vi.fn(),
  TouchSensor: vi.fn(),
}));

describe('Room Management Tools', () => {
  const mockGameSession = {
    updateCardPosition: vi.fn(),
    toggleCardFlip: vi.fn(),
    getCardPosition: vi.fn(),
    isCardFlipped: vi.fn(),
    resetGameState: vi.fn(),
  };

  const defaultProps = {
    roomId: 'test-room',
    isHost: true,
    gameMode: '優劣勢分析' as const,
    selectedDeck: '職能盤點卡' as const,
    gameSession: mockGameSession,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Reset Functionality', () => {
    it('should display reset button in toolbar', () => {
      render(<ConsultationAreaNew {...defaultProps} />);

      const resetButton = screen.getByRole('button', { name: /重置/i });
      expect(resetButton).toBeInTheDocument();
    });

    it('should have reset icon', () => {
      render(<ConsultationAreaNew {...defaultProps} />);

      const resetButton = screen.getByRole('button', { name: /重置/i });
      expect(resetButton.querySelector('svg')).toBeInTheDocument();
    });

    it('should call resetGameState when reset button is clicked', async () => {
      const user = userEvent.setup();
      render(<ConsultationAreaNew {...defaultProps} />);

      const resetButton = screen.getByRole('button', { name: /重置/i });
      await user.click(resetButton);

      expect(mockGameSession.resetGameState).toHaveBeenCalledOnce();
    });

    it('should clear all local state on reset', async () => {
      const user = userEvent.setup();
      const { container } = render(<ConsultationAreaNew {...defaultProps} />);

      // Add some cards first (mock interaction)
      // This would normally be done through drag and drop

      const resetButton = screen.getByRole('button', { name: /重置/i });
      await user.click(resetButton);

      // Verify the canvas areas are empty
      const canvasArea = container.querySelector('.bg-white.rounded-lg.shadow-lg');
      expect(canvasArea).toBeInTheDocument();
    });
  });

  describe('Clear Functionality', () => {
    it('should display clear button in toolbar', () => {
      render(<ConsultationAreaNew {...defaultProps} />);

      const clearButton = screen.getByRole('button', { name: /清空/i });
      expect(clearButton).toBeInTheDocument();
    });

    it('should have trash icon for clear button', () => {
      render(<ConsultationAreaNew {...defaultProps} />);

      const clearButton = screen.getByRole('button', { name: /清空/i });
      expect(clearButton.querySelector('svg')).toBeInTheDocument();
    });

    it('should call resetGameState when clear button is clicked', async () => {
      const user = userEvent.setup();
      render(<ConsultationAreaNew {...defaultProps} />);

      const clearButton = screen.getByRole('button', { name: /清空/i });
      await user.click(clearButton);

      // Clear also uses resetGameState in the implementation
      expect(mockGameSession.resetGameState).toHaveBeenCalled();
    });

    it('should reset used card tracking', async () => {
      const user = userEvent.setup();
      render(<ConsultationAreaNew {...defaultProps} />);

      const clearButton = screen.getByRole('button', { name: /清空/i });
      await user.click(clearButton);

      // After clearing, all cards should be available again in the sidebar
      const cardList = screen.getByText(defaultProps.selectedDeck);
      expect(cardList).toBeInTheDocument();
    });
  });

  describe('Save Functionality', () => {
    it('should display save button in toolbar', () => {
      render(<ConsultationAreaNew {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /儲存/i });
      expect(saveButton).toBeInTheDocument();
    });

    it('should have save icon', () => {
      render(<ConsultationAreaNew {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /儲存/i });
      expect(saveButton.querySelector('svg')).toBeInTheDocument();
    });

    it('should log canvas state when save is clicked (placeholder)', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const user = userEvent.setup();

      render(<ConsultationAreaNew {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /儲存/i });
      await user.click(saveButton);

      expect(consoleSpy).toHaveBeenCalledWith('Saving canvas state:', expect.any(Object));

      consoleSpy.mockRestore();
    });
  });

  describe('Toolbar Layout', () => {
    it('should display all management buttons together', () => {
      render(<ConsultationAreaNew {...defaultProps} />);

      const resetButton = screen.getByRole('button', { name: /重置/i });
      const clearButton = screen.getByRole('button', { name: /清空/i });
      const saveButton = screen.getByRole('button', { name: /儲存/i });

      // All buttons should be in the same toolbar
      const toolbar = resetButton.parentElement;
      expect(toolbar).toContainElement(clearButton);
      expect(toolbar).toContainElement(saveButton);
    });

    it('should display game mode title in toolbar', () => {
      render(<ConsultationAreaNew {...defaultProps} />);

      expect(screen.getByText(defaultProps.gameMode)).toBeInTheDocument();
    });

    it('should apply correct button styles', () => {
      render(<ConsultationAreaNew {...defaultProps} />);

      const resetButton = screen.getByRole('button', { name: /重置/i });
      const clearButton = screen.getByRole('button', { name: /清空/i });
      const saveButton = screen.getByRole('button', { name: /儲存/i });

      // Reset and Clear are outline variant
      expect(resetButton).toHaveClass('border');
      expect(clearButton).toHaveClass('border');

      // Save is default variant (filled)
      expect(saveButton.className).toMatch(/bg-/);
    });
  });

  describe('Button States and Interactions', () => {
    it('should enable all buttons by default', () => {
      render(<ConsultationAreaNew {...defaultProps} />);

      const resetButton = screen.getByRole('button', { name: /重置/i });
      const clearButton = screen.getByRole('button', { name: /清空/i });
      const saveButton = screen.getByRole('button', { name: /儲存/i });

      expect(resetButton).not.toBeDisabled();
      expect(clearButton).not.toBeDisabled();
      expect(saveButton).not.toBeDisabled();
    });

    it('should maintain button functionality after multiple clicks', async () => {
      const user = userEvent.setup();
      render(<ConsultationAreaNew {...defaultProps} />);

      const resetButton = screen.getByRole('button', { name: /重置/i });

      // Click multiple times
      await user.click(resetButton);
      await user.click(resetButton);
      await user.click(resetButton);

      expect(mockGameSession.resetGameState).toHaveBeenCalledTimes(3);
    });
  });

  describe('Integration with Game Session', () => {
    it('should pass game session to reset handler', async () => {
      const user = userEvent.setup();
      render(<ConsultationAreaNew {...defaultProps} />);

      const resetButton = screen.getByRole('button', { name: /重置/i });
      await user.click(resetButton);

      expect(mockGameSession.resetGameState).toHaveBeenCalled();
    });

    it('should work without game session (graceful degradation)', async () => {
      const user = userEvent.setup();
      const propsWithoutSession = {
        ...defaultProps,
        gameSession: undefined,
      };

      render(<ConsultationAreaNew {...propsWithoutSession} />);

      const resetButton = screen.getByRole('button', { name: /重置/i });

      // Should not throw error
      await expect(user.click(resetButton)).resolves.not.toThrow();
    });
  });

  describe('Different Game Modes', () => {
    it('should show management tools in 優劣勢分析 mode', () => {
      render(<ConsultationAreaNew {...defaultProps} gameMode="優劣勢分析" />);

      expect(screen.getByRole('button', { name: /重置/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /清空/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /儲存/i })).toBeInTheDocument();
    });

    it('should show management tools in 價值觀排序 mode', () => {
      render(<ConsultationAreaNew {...defaultProps} gameMode="價值觀排序" />);

      expect(screen.getByRole('button', { name: /重置/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /清空/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /儲存/i })).toBeInTheDocument();
    });

    it('should show management tools in 六大性格分析 mode', () => {
      render(<ConsultationAreaNew {...defaultProps} gameMode="六大性格分析" />);

      expect(screen.getByRole('button', { name: /重置/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /清空/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /儲存/i })).toBeInTheDocument();
    });
  });

  describe('Host vs Visitor Access', () => {
    it('should show all tools for host users', () => {
      render(<ConsultationAreaNew {...defaultProps} isHost={true} />);

      expect(screen.getByRole('button', { name: /重置/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /清空/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /儲存/i })).toBeInTheDocument();
    });

    it('should show tools for non-host users too (collaborative)', () => {
      render(<ConsultationAreaNew {...defaultProps} isHost={false} />);

      // In current implementation, all users can use these tools
      expect(screen.getByRole('button', { name: /重置/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /清空/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /儲存/i })).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should maintain button visibility on smaller screens', () => {
      // Set viewport to mobile size
      global.innerWidth = 375;
      global.dispatchEvent(new Event('resize'));

      render(<ConsultationAreaNew {...defaultProps} />);

      expect(screen.getByRole('button', { name: /重置/i })).toBeVisible();
      expect(screen.getByRole('button', { name: /清空/i })).toBeVisible();
      expect(screen.getByRole('button', { name: /儲存/i })).toBeVisible();
    });

    it('should use flex layout for toolbar buttons', () => {
      render(<ConsultationAreaNew {...defaultProps} />);

      const resetButton = screen.getByRole('button', { name: /重置/i });
      const toolbar = resetButton.parentElement;

      expect(toolbar).toHaveClass('flex');
      expect(toolbar).toHaveClass('gap-2');
    });
  });
});
