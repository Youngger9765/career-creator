/**
 * CardLoaderService Tests
 * Testing card filtering for different gameplay modes
 */

import { CardLoaderService } from '../card-loader.service';

describe('CardLoaderService - Gameplay Card Filtering', () => {
  beforeAll(async () => {
    await CardLoaderService.initialize();
  });

  describe('advantage_analysis (優劣勢分析)', () => {
    it('should only return mindset cards (skill-inventory 11-52)', async () => {
      const decks = await CardLoaderService.getDecksForGameplay('advantage_analysis');

      expect(decks.main).toBeDefined();
      expect(decks.main?.cards).toBeDefined();

      const cards = decks.main!.cards;

      // Should have 42 mindset cards (skill-inventory 11-52)
      expect(cards.length).toBe(42);

      // All cards should have category "mindset"
      cards.forEach((card) => {
        expect(card.category).toBe('mindset');
      });

      // Should NOT include action cards (01-10)
      const hasActionCard = cards.some(
        (card) => card.id === 'skill_001' || card.category === 'hard' || card.category === 'soft'
      );
      expect(hasActionCard).toBe(false);
    });
  });

  describe('growth_planning (成長規劃)', () => {
    it('should return all 52 skill cards (action + mindset)', async () => {
      const decks = await CardLoaderService.getDecksForGameplay('growth_planning');

      expect(decks.main).toBeDefined();
      expect(decks.main?.cards).toBeDefined();

      const cards = decks.main!.cards;

      // Should have all 52 cards
      expect(cards.length).toBe(52);

      // Should include both action cards (01-10) and mindset cards (11-52)
      const actionCards = cards.filter(
        (card) => card.category === 'hard' || card.category === 'soft'
      );
      const mindsetCards = cards.filter((card) => card.category === 'mindset');

      expect(actionCards.length).toBe(10);
      expect(mindsetCards.length).toBe(42);
    });
  });

  describe('position_breakdown (職位拆解)', () => {
    it('should return all 52 skill cards', async () => {
      const decks = await CardLoaderService.getDecksForGameplay('position_breakdown');

      expect(decks.main).toBeDefined();
      const cards = decks.main!.cards;
      expect(cards.length).toBe(52);
    });
  });
});
