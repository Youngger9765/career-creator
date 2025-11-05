/**
 * CardLoaderService - 牌卡資料載入服務
 *
 * 負責載入和管理所有牌卡資料
 * 支援懶加載和快取機制
 */

// Import card data
import riasecCards from '../data/cards/riasec-cards.json';
import careerCards from '../data/cards/career-cards.json';
import skillCards from '../data/cards/skill-cards.json';
import valueCards from '../data/cards/value-cards.json';
import actionCards from '../data/cards/action-cards.json';

export interface Card {
  id: string;
  title: string;
  description: string;
  category?: string;
  icon?: string;
  imageUrl?:
    | string
    | { front: string; back: string }
    | { L?: { front: string; back: string }; M?: { front: string; back: string } }; // 支援單張、雙面圖片、或多尺寸圖片
  [key: string]: any; // 允許額外屬性
}

export interface CardDeck {
  id: string;
  name: string;
  description: string;
  type: 'main' | 'auxiliary' | 'explanation';
  version: string;
  cards: Card[];
}

export class CardLoaderService {
  private static cache: Map<string, CardDeck> = new Map();
  private static initialized = false;

  /**
   * 初始化服務，預載入所有牌組
   */
  static async initialize(): Promise<void> {
    if (this.initialized) return;

    // 載入所有牌組到快取
    this.cache.set('riasec_explanation', {
      ...riasecCards.deck,
      type: riasecCards.deck.type as 'explanation',
      cards: riasecCards.cards,
    } as CardDeck);

    this.cache.set('career_cards_100', {
      ...careerCards.deck,
      type: careerCards.deck.type as 'main',
      cards: careerCards.cards,
    } as CardDeck);

    this.cache.set('skill_cards_52', {
      ...skillCards.deck,
      type: skillCards.deck.type as 'main',
      cards: skillCards.cards,
    } as CardDeck);

    this.cache.set('value_cards_36', {
      ...valueCards.deck,
      type: valueCards.deck.type as 'main',
      cards: valueCards.cards,
    } as CardDeck);

    this.cache.set('action_cards_24', {
      ...actionCards.deck,
      type: actionCards.deck.type as 'auxiliary',
      cards: actionCards.cards,
    } as CardDeck);

    this.initialized = true;
  }

  /**
   * 取得特定牌組
   */
  static async getDeck(deckId: string): Promise<CardDeck | undefined> {
    await this.initialize();
    return this.cache.get(deckId);
  }

  /**
   * 取得所有牌組
   */
  static async getAllDecks(): Promise<CardDeck[]> {
    await this.initialize();
    return Array.from(this.cache.values());
  }

  /**
   * 取得特定牌組的卡片
   */
  static async getCards(deckId: string): Promise<Card[]> {
    const deck = await this.getDeck(deckId);
    return deck?.cards || [];
  }

  /**
   * 取得單張卡片
   */
  static async getCard(deckId: string, cardId: string): Promise<Card | undefined> {
    const cards = await this.getCards(deckId);
    return cards.find((card) => card.id === cardId);
  }

  /**
   * 根據類別篩選卡片
   */
  static async getCardsByCategory(deckId: string, category: string): Promise<Card[]> {
    const cards = await this.getCards(deckId);
    return cards.filter((card) => card.category === category);
  }

  /**
   * 搜尋卡片
   */
  static async searchCards(query: string, deckId?: string): Promise<Card[]> {
    await this.initialize();

    const decks = deckId
      ? ([await this.getDeck(deckId)].filter(Boolean) as CardDeck[])
      : Array.from(this.cache.values());

    const results: Card[] = [];
    const lowerQuery = query.toLowerCase();

    for (const deck of decks) {
      const matchingCards = deck.cards.filter(
        (card) =>
          card.title.toLowerCase().includes(lowerQuery) ||
          card.description.toLowerCase().includes(lowerQuery) ||
          (card.category && card.category.toLowerCase().includes(lowerQuery))
      );
      results.push(...matchingCards);
    }

    return results;
  }

  /**
   * 取得牌組統計資訊
   */
  static async getDeckStats(deckId: string): Promise<
    | {
        totalCards: number;
        categories: Map<string, number>;
        averageDescriptionLength: number;
      }
    | undefined
  > {
    const deck = await this.getDeck(deckId);
    if (!deck) return undefined;

    const categories = new Map<string, number>();
    let totalDescriptionLength = 0;

    deck.cards.forEach((card) => {
      if (card.category) {
        categories.set(card.category, (categories.get(card.category) || 0) + 1);
      }
      totalDescriptionLength += card.description.length;
    });

    return {
      totalCards: deck.cards.length,
      categories,
      averageDescriptionLength: Math.round(totalDescriptionLength / deck.cards.length),
    };
  }

  /**
   * 取得隨機卡片
   */
  static async getRandomCards(deckId: string, count: number): Promise<Card[]> {
    const cards = await this.getCards(deckId);
    const shuffled = [...cards].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, cards.length));
  }

  /**
   * 驗證牌組完整性
   */
  static async validateDeck(deckId: string): Promise<{
    isValid: boolean;
    errors: string[];
  }> {
    const errors: string[] = [];
    const deck = await this.getDeck(deckId);

    if (!deck) {
      return { isValid: false, errors: [`Deck ${deckId} not found`] };
    }

    // 檢查基本屬性
    if (!deck.id) errors.push('Deck missing ID');
    if (!deck.name) errors.push('Deck missing name');
    if (!deck.cards || deck.cards.length === 0) errors.push('Deck has no cards');

    // 檢查卡片唯一性
    const cardIds = new Set<string>();
    const duplicateIds: string[] = [];

    deck.cards.forEach((card) => {
      if (cardIds.has(card.id)) {
        duplicateIds.push(card.id);
      }
      cardIds.add(card.id);

      // 檢查卡片必要屬性
      if (!card.id) errors.push(`Card missing ID`);
      if (!card.title) errors.push(`Card ${card.id} missing title`);
      if (!card.description) errors.push(`Card ${card.id} missing description`);
    });

    if (duplicateIds.length > 0) {
      errors.push(`Duplicate card IDs found: ${duplicateIds.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * 取得特定玩法所需的牌組
   */
  static async getDecksForGameplay(gameplayId: string): Promise<{
    main?: CardDeck;
    auxiliary?: CardDeck;
    explanation?: CardDeck;
  }> {
    await this.initialize();

    // 根據玩法ID返回對應的牌組配置
    switch (gameplayId) {
      case 'personality_analysis':
        return {
          main: (await this.getDeck('career_cards_100')) || undefined,
          explanation: (await this.getDeck('riasec_explanation')) || undefined,
        };

      case 'career_collector':
        return {
          main: (await this.getDeck('career_cards_100')) || undefined,
        };

      case 'advantage_analysis':
      case 'growth_planning':
      case 'position_breakdown':
        return {
          main: (await this.getDeck('skill_cards_52')) || undefined,
          auxiliary: (await this.getDeck('action_cards_24')) || undefined,
        };

      case 'value_ranking':
      case 'life_redesign':
        return {
          main: (await this.getDeck('value_cards_36')) || undefined,
        };

      default:
        return {};
    }
  }

  /**
   * 清除快取
   */
  static clearCache(): void {
    this.cache.clear();
    this.initialized = false;
  }

  /**
   * 取得牌組摘要資訊
   */
  static async getDeckSummary(): Promise<
    Array<{
      id: string;
      name: string;
      cardCount: number;
      type: string;
    }>
  > {
    await this.initialize();

    return Array.from(this.cache.values()).map((deck) => ({
      id: deck.id,
      name: deck.name,
      cardCount: deck.cards.length,
      type: deck.type,
    }));
  }
}
