import { create } from 'zustand';

export interface CardPosition {
  id: string;
  x: number;
  y: number;
  rotation?: number;
  scale?: number;
}

interface CanvasState {
  // Canvas state
  scale: number;
  offset: { x: number; y: number };

  // Card positions
  cardPositions: Map<string, CardPosition>;

  // Selected cards
  selectedCards: Set<string>;

  // Uploaded file
  uploadedFile: {
    type: 'pdf' | 'image';
    url: string;
    name: string;
    file?: File;
  } | null;

  // Actions
  setScale: (scale: number) => void;
  setOffset: (offset: { x: number; y: number }) => void;
  updateCardPosition: (cardId: string, position: Partial<CardPosition>) => void;
  removeCard: (cardId: string) => void;
  selectCard: (cardId: string) => void;
  deselectCard: (cardId: string) => void;
  clearSelection: () => void;
  setUploadedFile: (
    file: {
      type: 'pdf' | 'image';
      url: string;
      name: string;
      file?: File;
    } | null
  ) => void;
  reset: () => void;
}

export const useCanvasGameStore = create<CanvasState>((set) => ({
  // Initial state
  scale: 1,
  offset: { x: 0, y: 0 },
  cardPositions: new Map(),
  selectedCards: new Set(),
  uploadedFile: null,

  // Actions
  setScale: (scale) => set({ scale }),

  setOffset: (offset) => set({ offset }),

  updateCardPosition: (cardId, position) =>
    set((state) => {
      const newPositions = new Map(state.cardPositions);
      const currentPos = newPositions.get(cardId) || {
        id: cardId,
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
      };
      newPositions.set(cardId, { ...currentPos, ...position });
      return { cardPositions: newPositions };
    }),

  removeCard: (cardId) =>
    set((state) => {
      const newPositions = new Map(state.cardPositions);
      newPositions.delete(cardId);
      const newSelected = new Set(state.selectedCards);
      newSelected.delete(cardId);
      return { cardPositions: newPositions, selectedCards: newSelected };
    }),

  selectCard: (cardId) =>
    set((state) => {
      const newSelected = new Set(state.selectedCards);
      newSelected.add(cardId);
      return { selectedCards: newSelected };
    }),

  deselectCard: (cardId) =>
    set((state) => {
      const newSelected = new Set(state.selectedCards);
      newSelected.delete(cardId);
      return { selectedCards: newSelected };
    }),

  clearSelection: () => set({ selectedCards: new Set() }),

  setUploadedFile: (file) => set({ uploadedFile: file }),

  reset: () =>
    set({
      scale: 1,
      offset: { x: 0, y: 0 },
      cardPositions: new Map(),
      selectedCards: new Set(),
      uploadedFile: null,
    }),
}));
