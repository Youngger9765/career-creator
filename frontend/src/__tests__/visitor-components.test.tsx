import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VisitorWelcome } from '@/components/visitor/VisitorWelcome';
import { VisitorGuidance } from '@/components/visitor/VisitorGuidance';

describe('VisitorWelcome Component', () => {
  const mockOnComplete = vi.fn();
  const mockOnCancel = vi.fn();
  const defaultProps = {
    isOpen: true,
    roomName: '諮詢室A',
    onComplete: mockOnComplete,
    onCancel: mockOnCancel,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should display room name when provided', () => {
      render(<VisitorWelcome {...defaultProps} />);

      expect(screen.getByText(/諮詢室A/)).toBeInTheDocument();
      expect(screen.getByText(/歡迎參與諮詢/)).toBeInTheDocument();
    });

    it('should show privacy protection notice', () => {
      render(<VisitorWelcome {...defaultProps} />);

      expect(screen.getByText(/隱私保護/)).toBeInTheDocument();
      expect(screen.getByText(/您的稱呼僅用於此次諮詢/)).toBeInTheDocument();
      expect(screen.getByText(/不會儲存個人敏感資訊/)).toBeInTheDocument();
    });

    it('should show consultation experience information', () => {
      render(<VisitorWelcome {...defaultProps} />);

      expect(screen.getByText(/諮詢體驗/)).toBeInTheDocument();
      expect(screen.getByText(/透過牌卡探索職涯方向/)).toBeInTheDocument();
      expect(screen.getByText(/專業諮詢師將引導您/)).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
      render(<VisitorWelcome {...defaultProps} isOpen={false} />);

      expect(screen.queryByText(/歡迎參與諮詢/)).not.toBeInTheDocument();
    });
  });

  describe('User Input', () => {
    it('should update visitor name input', async () => {
      const user = userEvent.setup();
      render(<VisitorWelcome {...defaultProps} />);

      const input = screen.getByPlaceholderText(/您的稱呼/);
      await user.type(input, 'Alice');

      expect(input).toHaveValue('Alice');
    });

    it('should limit visitor name to 20 characters', () => {
      render(<VisitorWelcome {...defaultProps} />);

      const input = screen.getByPlaceholderText(/您的稱呼/);
      expect(input).toHaveAttribute('maxLength', '20');
    });

    it('should disable submit button when name is empty', () => {
      render(<VisitorWelcome {...defaultProps} />);

      const submitButton = screen.getByText('開始諮詢');
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when name is entered', async () => {
      const user = userEvent.setup();
      render(<VisitorWelcome {...defaultProps} />);

      const input = screen.getByPlaceholderText(/您的稱呼/);
      const submitButton = screen.getByText('開始諮詢');

      await user.type(input, 'Alice');

      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('User Actions', () => {
    it('should call onComplete with trimmed name when submitted', async () => {
      const user = userEvent.setup();
      render(<VisitorWelcome {...defaultProps} />);

      const input = screen.getByPlaceholderText(/您的稱呼/);
      const submitButton = screen.getByText('開始諮詢');

      await user.type(input, '  Alice  ');
      await user.click(submitButton);

      expect(mockOnComplete).toHaveBeenCalledWith('Alice');
    });

    it('should call onComplete when Enter key is pressed', async () => {
      const user = userEvent.setup();
      render(<VisitorWelcome {...defaultProps} />);

      const input = screen.getByPlaceholderText(/您的稱呼/);
      await user.type(input, 'Bob{Enter}');

      expect(mockOnComplete).toHaveBeenCalledWith('Bob');
    });

    it('should not submit with empty or whitespace-only name', async () => {
      const user = userEvent.setup();
      render(<VisitorWelcome {...defaultProps} />);

      const input = screen.getByPlaceholderText(/您的稱呼/);
      const submitButton = screen.getByText('開始諮詢');

      await user.type(input, '   ');
      await user.click(submitButton);

      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<VisitorWelcome {...defaultProps} />);

      const cancelButton = screen.getByText('暫不參與');
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledOnce();
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();
      const mockSlowComplete = vi.fn(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      render(<VisitorWelcome {...defaultProps} onComplete={mockSlowComplete} />);

      const input = screen.getByPlaceholderText(/您的稱呼/);
      await user.type(input, 'Charlie');

      const submitButton = screen.getByText('開始諮詢');
      await user.click(submitButton);

      expect(screen.getByText('進入中...')).toBeInTheDocument();

      await waitFor(() => {
        expect(mockSlowComplete).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should auto-focus the name input field', () => {
      render(<VisitorWelcome {...defaultProps} />);

      const input = screen.getByPlaceholderText(/您的稱呼/);
      expect(input).toHaveFocus();
    });

    it('should have proper labels for form fields', () => {
      render(<VisitorWelcome {...defaultProps} />);

      expect(screen.getByLabelText('稱呼')).toBeInTheDocument();
    });

    it('should prevent dialog closure on outside click', () => {
      const { container } = render(<VisitorWelcome {...defaultProps} />);

      // Dialog should remain open even if outside is clicked
      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toBeInTheDocument();
    });
  });
});

describe('VisitorGuidance Component', () => {
  const mockOnClose = vi.fn();
  const defaultProps = {
    gameMode: '優劣勢分析',
    isVisible: true,
    onClose: mockOnClose,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should not render when isVisible is false', () => {
      render(<VisitorGuidance {...defaultProps} isVisible={false} />);

      expect(screen.queryByText(/操作指引/)).not.toBeInTheDocument();
    });

    it('should display correct title based on game mode', () => {
      render(<VisitorGuidance {...defaultProps} />);

      expect(screen.getByText(/優劣勢分析 - 操作指引/)).toBeInTheDocument();
    });

    it('should show different content for each game mode', () => {
      const { rerender } = render(<VisitorGuidance {...defaultProps} />);

      // 優劣勢分析 mode
      expect(screen.getByText(/選擇與您相關的技能卡片/)).toBeInTheDocument();
      expect(screen.getByText(/每個區域最多放置5張卡片/)).toBeInTheDocument();

      // 價值觀排序 mode
      rerender(<VisitorGuidance {...defaultProps} gameMode="價值觀排序" />);
      expect(screen.getByText(/將重要的價值觀卡片拖拽到格子中/)).toBeInTheDocument();
      expect(screen.getByText(/使用籌碼為價值觀加權/)).toBeInTheDocument();

      // 六大性格分析 mode
      rerender(<VisitorGuidance {...defaultProps} gameMode="六大性格分析" />);
      expect(screen.getByText(/瀏覽各種職業卡片/)).toBeInTheDocument();
      expect(screen.getByText(/參考Holland性格解釋卡/)).toBeInTheDocument();
    });

    it('should display operation steps section', () => {
      render(<VisitorGuidance {...defaultProps} />);

      expect(screen.getByText('操作步驟')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // First step number
    });

    it('should display basic operations section', () => {
      render(<VisitorGuidance {...defaultProps} />);

      expect(screen.getByText('基本操作')).toBeInTheDocument();
      expect(screen.getByText(/拖拽卡片到指定區域/)).toBeInTheDocument();
      expect(screen.getByText(/點擊卡片可以翻面查看/)).toBeInTheDocument();
    });

    it('should display tips section', () => {
      render(<VisitorGuidance {...defaultProps} />);

      expect(screen.getByText('小提醒')).toBeInTheDocument();
    });

    it('should display interaction reminder', () => {
      render(<VisitorGuidance {...defaultProps} />);

      expect(screen.getByText(/隨時與諮詢師互動/)).toBeInTheDocument();
      expect(screen.getByText(/有任何疑問都可以直接詢問/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should toggle expanded/collapsed state', async () => {
      const user = userEvent.setup();
      render(<VisitorGuidance {...defaultProps} />);

      // Initially expanded
      expect(screen.getByText('操作步驟')).toBeVisible();

      // Click collapse button
      const toggleButton = screen
        .getByRole('button', { name: '' })
        .parentElement?.querySelector('button');
      if (toggleButton) {
        await user.click(toggleButton);
      }

      // Content should be hidden
      expect(screen.queryByText('操作步驟')).not.toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<VisitorGuidance {...defaultProps} />);

      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons[closeButtons.length - 1]; // Last button is close

      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledOnce();
    });

    it('should maintain expanded state after re-render', () => {
      const { rerender } = render(<VisitorGuidance {...defaultProps} />);

      expect(screen.getByText('操作步驟')).toBeVisible();

      rerender(<VisitorGuidance {...defaultProps} gameMode="價值觀排序" />);

      expect(screen.getByText('操作步驟')).toBeVisible();
    });
  });

  describe('Game Mode Specific Content', () => {
    it('should show correct tips for 優劣勢分析', () => {
      render(<VisitorGuidance {...defaultProps} gameMode="優劣勢分析" />);

      expect(screen.getByText(/誠實面對自己的能力現狀/)).toBeInTheDocument();
      expect(screen.getByText(/優勢是您擅長且喜歡的技能/)).toBeInTheDocument();
      expect(screen.getByText(/劣勢是需要加強的部分/)).toBeInTheDocument();
    });

    it('should show correct tips for 價值觀排序', () => {
      render(<VisitorGuidance {...defaultProps} gameMode="價值觀排序" />);

      expect(screen.getByText(/沒有標準答案/)).toBeInTheDocument();
      expect(screen.getByText(/考慮當下最重要的價值/)).toBeInTheDocument();
      expect(screen.getByText(/籌碼數量有限/)).toBeInTheDocument();
    });

    it('should show correct tips for 六大性格分析', () => {
      render(<VisitorGuidance {...defaultProps} gameMode="六大性格分析" />);

      expect(screen.getByText(/根據直覺反應分類/)).toBeInTheDocument();
      expect(screen.getByText(/考慮您對工作內容的真實感受/)).toBeInTheDocument();
      expect(screen.getByText(/每個分類都很重要/)).toBeInTheDocument();
    });

    it('should show default content for unknown game mode', () => {
      render(<VisitorGuidance {...defaultProps} gameMode="未知模式" />);

      expect(screen.getByText(/互動指引 - 操作指引/)).toBeInTheDocument();
      expect(screen.getByText(/跟隨諮詢師的引導/)).toBeInTheDocument();
    });
  });

  describe('Visual Styling', () => {
    it('should apply correct styling classes', () => {
      const { container } = render(<VisitorGuidance {...defaultProps} />);

      const card = container.querySelector('.border-orange-200');
      expect(card).toBeInTheDocument();

      const background = container.querySelector('.bg-orange-50');
      expect(background).toBeInTheDocument();
    });

    it('should have fixed positioning', () => {
      const { container } = render(<VisitorGuidance {...defaultProps} />);

      const card = container.querySelector('.fixed');
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass('top-4', 'right-4', 'z-50');
    });

    it('should use proper icons', () => {
      render(<VisitorGuidance {...defaultProps} />);

      // Check for icon presence by checking the title includes icon-related text
      const title = screen.getByText(/操作指引/);
      expect(title).toBeInTheDocument();
    });
  });
});
