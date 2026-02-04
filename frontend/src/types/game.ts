/**
 * Game state type definitions
 *
 * Provides strongly-typed interfaces for game state management
 * across all card-based gameplay hooks.
 */

// Re-export the store's GameState for convenience
export type { GameState as StoreGameState } from '@/stores/game-state-store';

/**
 * Uploaded file information stored in game state
 *
 * Note: This matches the structure in game-state-store.ts
 */
export interface UploadedFile {
  /** File name */
  name: string;
  /** MIME type */
  type: string;
  /** File size in bytes */
  size: number;
  /** GCS public URL (previously was dataUrl/base64) */
  url: string;
  /** Upload timestamp */
  uploadedAt: number;
}

/**
 * Card position information for a single card
 */
export interface CardZoneInfo {
  zone: string;
  position?: { x: number; y: number };
  index?: number;
}

/**
 * Serialized game state for persistence and broadcast
 *
 * This is the format used when saving to backend or broadcasting via realtime
 */
export interface SerializedGameState {
  /** Card positions indexed by card ID */
  cards: Record<string, CardZoneInfo>;
  /** Optional uploaded file data */
  uploadedFile?: UploadedFile;
  /** Game-specific settings */
  settings?: Record<string, unknown>;
  /** Text inputs (legacy, kept for backward compatibility) */
  textInputs?: Record<string, string>;
  /** Last update timestamp */
  lastUpdated: number;
  /** Game type identifier */
  gameType: string;
}
