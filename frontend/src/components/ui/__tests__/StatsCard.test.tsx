/**
 * TDD Red Phase: Tests for StatsCard component
 * Phase 2, Task 5 of design alignment plan
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import StatsCard from '../StatsCard';

describe('StatsCard - Navicareer Dark Gradient Style', () => {
  it('renders stats card with number and label', () => {
    render(<StatsCard number="42" label="張卡片" />);

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('張卡片')).toBeInTheDocument();
  });

  it('applies dark gradient background', () => {
    const { container } = render(<StatsCard number="100" label="客戶" />);
    const card = container.firstChild;

    expect(card).toHaveClass('bg-gradient-to-br');
    expect(card).toHaveClass('from-brand-navy');
  });

  it('renders with optional icon', () => {
    const TestIcon = () => <div data-testid="test-icon">Icon</div>;
    render(<StatsCard number="1000" label="諮詢時數" icon={<TestIcon />} />);

    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <StatsCard number="7K" label="用戶" className="custom-class" />
    );
    const card = container.firstChild;

    expect(card).toHaveClass('custom-class');
  });

  it('has large number font size', () => {
    render(<StatsCard number="42" label="張卡片" />);
    const numberElement = screen.getByText('42');

    expect(numberElement).toHaveClass('text-5xl');
    expect(numberElement).toHaveClass('font-black');
  });

  it('has white text color', () => {
    const { container } = render(<StatsCard number="100" label="測試" />);
    const card = container.firstChild;

    expect(card).toHaveClass('text-white');
  });

  it('has rounded-3xl border radius', () => {
    const { container } = render(<StatsCard number="50" label="測試" />);
    const card = container.firstChild;

    expect(card).toHaveClass('rounded-3xl');
  });
});
