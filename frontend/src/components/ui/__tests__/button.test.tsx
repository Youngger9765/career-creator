/**
 * TDD Red Phase: Tests for Navicareer-style Button variants
 * Phase 1, Task 3 of design alignment plan
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from '../button';

describe('Button - Navicareer Brand Variants', () => {
  it('renders primary button with rounded-full', () => {
    render(<Button variant="primary">Primary Button</Button>);
    const button = screen.getByRole('button', { name: /primary button/i });

    expect(button).toHaveClass('rounded-full');
  });

  it('renders secondary button with border', () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    const button = screen.getByRole('button', { name: /secondary button/i });

    expect(button).toHaveClass('border-2');
    expect(button).toHaveClass('border-black');
  });

  it('renders brand-gold button with correct background', () => {
    render(<Button variant="brand-gold">Brand Gold</Button>);
    const button = screen.getByRole('button', { name: /brand gold/i });

    expect(button).toHaveClass('bg-brand-gold');
    expect(button).toHaveClass('text-white');
  });

  it('renders brand-teal button with correct background', () => {
    render(<Button variant="brand-teal">Brand Teal</Button>);
    const button = screen.getByRole('button', { name: /brand teal/i });

    expect(button).toHaveClass('bg-brand-teal');
    expect(button).toHaveClass('text-white');
  });

  it('applies large size with correct padding', () => {
    render(<Button size="lg">Large Button</Button>);
    const button = screen.getByRole('button', { name: /large button/i });

    expect(button).toHaveClass('px-8');
    expect(button).toHaveClass('py-4');
  });

  it('has transition-all for smooth animations', () => {
    render(<Button>Test Button</Button>);
    const button = screen.getByRole('button', { name: /test button/i });

    expect(button).toHaveClass('transition-all');
  });

  it('has font-bold for emphasis', () => {
    render(<Button variant="brand-gold">Gold Button</Button>);
    const button = screen.getByRole('button', { name: /gold button/i });

    expect(button).toHaveClass('font-bold');
  });
});
