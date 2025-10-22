/**
 * TDD Red Phase: Tests for useTokenManagement hook
 * These tests define expected behavior before implementation
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { useTokenManagement } from '../useTokenManagement';

describe('useTokenManagement', () => {
  beforeEach(() => {
    // Reset any state between tests
  });

  describe('addToken', () => {
    it('should add a chip token to canvas', () => {
      const { result } = renderHook(() => useTokenManagement());

      act(() => {
        result.current.addToken('chip', 'red', 1);
      });

      expect(result.current.tokens).toHaveLength(1);
      expect(result.current.tokens[0]).toMatchObject({
        type: 'chip',
        color: 'red',
        value: 1,
      });
      expect(result.current.tokens[0].id).toMatch(/^token-/);
    });

    it('should add a marker token without value', () => {
      const { result } = renderHook(() => useTokenManagement());

      act(() => {
        result.current.addToken('marker', 'yellow');
      });

      expect(result.current.tokens).toHaveLength(1);
      expect(result.current.tokens[0]).toMatchObject({
        type: 'marker',
        color: 'yellow',
      });
      expect(result.current.tokens[0].value).toBeUndefined();
    });

    it('should add multiple tokens', () => {
      const { result } = renderHook(() => useTokenManagement());

      act(() => {
        result.current.addToken('chip', 'red', 1);
        result.current.addToken('chip', 'blue', 5);
        result.current.addToken('marker', 'yellow');
      });

      expect(result.current.tokens).toHaveLength(3);
    });

    it('should assign random positions to new tokens', () => {
      const { result } = renderHook(() => useTokenManagement());

      act(() => {
        result.current.addToken('chip', 'red', 1);
        result.current.addToken('chip', 'blue', 5);
      });

      const token1 = result.current.tokens[0];
      const token2 = result.current.tokens[1];

      // Positions should be within expected range
      expect(token1.position.x).toBeGreaterThanOrEqual(200);
      expect(token1.position.x).toBeLessThanOrEqual(400);
      expect(token1.position.y).toBeGreaterThanOrEqual(200);
      expect(token1.position.y).toBeLessThanOrEqual(400);

      // Different tokens should have different positions (with high probability)
      expect(
        token1.position.x !== token2.position.x || token1.position.y !== token2.position.y
      ).toBe(true);
    });

    it('should assign zIndex of 1 to new tokens', () => {
      const { result } = renderHook(() => useTokenManagement());

      act(() => {
        result.current.addToken('chip', 'red', 1);
      });

      expect(result.current.tokens[0].zIndex).toBe(1);
    });
  });

  describe('updateTokenPosition', () => {
    it('should update token position', () => {
      const { result } = renderHook(() => useTokenManagement());

      act(() => {
        result.current.addToken('chip', 'red', 1);
      });

      const tokenId = result.current.tokens[0].id;

      act(() => {
        result.current.updateTokenPosition(tokenId, { x: 500, y: 300 });
      });

      const updatedToken = result.current.tokens[0];
      expect(updatedToken.position).toEqual({ x: 500, y: 300 });
    });

    it('should not affect other tokens when updating position', () => {
      const { result } = renderHook(() => useTokenManagement());

      act(() => {
        result.current.addToken('chip', 'red', 1);
        result.current.addToken('chip', 'blue', 5);
      });

      const tokenId1 = result.current.tokens[0].id;
      const token2OriginalPosition = result.current.tokens[1].position;

      act(() => {
        result.current.updateTokenPosition(tokenId1, { x: 500, y: 300 });
      });

      expect(result.current.tokens[0].position).toEqual({ x: 500, y: 300 });
      expect(result.current.tokens[1].position).toEqual(token2OriginalPosition);
    });

    it('should handle updating non-existent token gracefully', () => {
      const { result } = renderHook(() => useTokenManagement());

      act(() => {
        result.current.addToken('chip', 'red', 1);
      });

      // Should not throw error
      act(() => {
        result.current.updateTokenPosition('non-existent-id', { x: 500, y: 300 });
      });

      // Original token should remain unchanged
      expect(result.current.tokens).toHaveLength(1);
    });
  });

  describe('clearTokens', () => {
    it('should clear all tokens', () => {
      const { result } = renderHook(() => useTokenManagement());

      act(() => {
        result.current.addToken('chip', 'red', 1);
        result.current.addToken('chip', 'blue', 5);
        result.current.addToken('marker', 'yellow');
      });

      expect(result.current.tokens).toHaveLength(3);

      act(() => {
        result.current.clearTokens();
      });

      expect(result.current.tokens).toHaveLength(0);
    });

    it('should handle clearing when no tokens exist', () => {
      const { result } = renderHook(() => useTokenManagement());

      // Should not throw error
      act(() => {
        result.current.clearTokens();
      });

      expect(result.current.tokens).toHaveLength(0);
    });
  });

  describe('getToken', () => {
    it('should return token by id', () => {
      const { result } = renderHook(() => useTokenManagement());

      act(() => {
        result.current.addToken('chip', 'red', 1);
      });

      const tokenId = result.current.tokens[0].id;
      const token = result.current.getToken(tokenId);
      expect(token).toBeDefined();
      expect(token?.id).toBe(tokenId);
      expect(token?.color).toBe('red');
    });

    it('should return undefined for non-existent token', () => {
      const { result } = renderHook(() => useTokenManagement());

      const token = result.current.getToken('non-existent-id');
      expect(token).toBeUndefined();
    });
  });

  describe('token state persistence', () => {
    it('should maintain token state across multiple operations', () => {
      const { result } = renderHook(() => useTokenManagement());

      // Add token
      act(() => {
        result.current.addToken('chip', 'red', 1);
      });

      const tokenId = result.current.tokens[0].id;

      // Update position
      act(() => {
        result.current.updateTokenPosition(tokenId, { x: 100, y: 100 });
      });

      // Add another token
      act(() => {
        result.current.addToken('marker', 'blue');
      });

      // Verify first token maintained its updated position
      const firstToken = result.current.getToken(tokenId);
      expect(firstToken?.position).toEqual({ x: 100, y: 100 });
      expect(result.current.tokens).toHaveLength(2);
    });
  });
});
