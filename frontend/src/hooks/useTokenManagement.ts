/**
 * useTokenManagement hook
 * Manages game tokens (chips and markers) on the consultation canvas
 */

import { useState, useCallback } from 'react';

export interface GameToken {
  id: string;
  type: 'chip' | 'marker';
  color: string;
  value?: number;
  position: { x: number; y: number };
  zIndex: number;
}

export function useTokenManagement() {
  const [tokens, setTokens] = useState<GameToken[]>([]);

  // Add a new token to the canvas
  const addToken = useCallback((tokenType: 'chip' | 'marker', color: string, value?: number) => {
    const newToken: GameToken = {
      id: `token-${Date.now()}-${Math.random()}`,
      type: tokenType,
      color,
      value,
      position: {
        x: 200 + Math.random() * 200,
        y: 200 + Math.random() * 200,
      },
      zIndex: 1,
    };
    setTokens((prev) => [...prev, newToken]);
  }, []);

  // Update token position (for drag and drop)
  const updateTokenPosition = useCallback((tokenId: string, position: { x: number; y: number }) => {
    setTokens((prev) =>
      prev.map((token) => (token.id === tokenId ? { ...token, position } : token))
    );
  }, []);

  // Clear all tokens
  const clearTokens = useCallback(() => {
    setTokens([]);
  }, []);

  // Get token by id
  const getToken = useCallback(
    (tokenId: string) => {
      return tokens.find((token) => token.id === tokenId);
    },
    [tokens]
  );

  return {
    tokens,
    addToken,
    updateTokenPosition,
    clearTokens,
    getToken,
  };
}
