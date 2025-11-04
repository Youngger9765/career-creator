/**
 * Card Asset Manager
 * Manages card image URLs with support for multiple sizes, languages, and sides
 */

import cardAssetsConfig from '@/data/card-assets.json';

export type DeckId = 'personality-riasec' | 'value-navigation' | 'skill-inventory';
export type CardSize = 'L' | 'M' | 'S';
export type CardSide = 'front' | 'back';
export type Language = 'zhtw' | 'en' | 'ja' | 'ko';

interface CardImageOptions {
  deck: DeckId;
  card: string;
  size?: CardSize;
  side?: CardSide;
  lang?: Language;
}

/**
 * Generate card image URL based on naming convention:
 * {deck}-{card}-{size}-{side}-{lang}.png
 *
 * @example
 * getCardImageUrl({
 *   deck: 'personality-riasec',
 *   card: 'artistic',
 *   size: 'L',
 *   side: 'front',
 *   lang: 'zh'
 * })
 * // Returns: "https://storage.googleapis.com/career-creator-assets/cards/personality-riasec-artistic-L-front-zh.png"
 */
export function getCardImageUrl(options: CardImageOptions): string {
  const { deck, card, size = 'L', side = 'front', lang = 'zhtw' } = options;

  const filename = `${deck}-${card}-${size}-${side}-${lang}.png`;
  return `${cardAssetsConfig.baseUrl}/${filename}`;
}

/**
 * Get both front and back URLs for a card
 */
export function getCardBothSides(
  deck: DeckId,
  card: string,
  size: CardSize = 'L',
  lang: Language = 'zhtw'
): { front: string; back: string } {
  return {
    front: getCardImageUrl({ deck, card, size, side: 'front', lang }),
    back: getCardImageUrl({ deck, card, size, side: 'back', lang }),
  };
}

/**
 * Check if a card image is available
 */
export function isCardAvailable(
  deck: DeckId,
  size: CardSize,
  lang: Language,
  side: CardSide
): boolean {
  const deckConfig = cardAssetsConfig.decks[deck];
  if (!deckConfig) return false;

  const availability = deckConfig.availability as any;
  return availability?.[size]?.[lang]?.[side] === true;
}

/**
 * Get all available cards for a deck
 */
export function getDeckCards(deck: DeckId) {
  const deckConfig = cardAssetsConfig.decks[deck];
  return deckConfig?.cards || [];
}

/**
 * Get deck metadata
 */
export function getDeckInfo(deck: DeckId) {
  const deckConfig = cardAssetsConfig.decks[deck];
  if (!deckConfig) return null;

  return {
    name: deckConfig.name,
    description: deckConfig.description,
    sizes: deckConfig.sizes,
    languages: deckConfig.languages,
    cardCount: deckConfig.cards.length,
  };
}

/**
 * Batch load card URLs for a deck
 */
export function loadDeckImages(
  deck: DeckId,
  size: CardSize = 'L',
  lang: Language = 'zhtw',
  side: CardSide = 'front'
): Record<string, string> {
  const cards = getDeckCards(deck);
  const urls: Record<string, string> = {};

  cards.forEach((card: any) => {
    urls[card.id] = getCardImageUrl({
      deck,
      card: card.id,
      size,
      side,
      lang,
    });
  });

  return urls;
}

/**
 * Preload card images for better performance
 */
export async function preloadCardImages(urls: string[]): Promise<void> {
  const promises = urls.map((url) => {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  });

  try {
    await Promise.all(promises);
  } catch (error) {
    console.error('Error preloading card images:', error);
  }
}

/**
 * Get responsive image srcset for a card
 * Useful for responsive design with different sizes
 */
export function getCardSrcSet(
  deck: DeckId,
  card: string,
  side: CardSide = 'front',
  lang: Language = 'zhtw'
): string {
  const sizes: CardSize[] = ['S', 'M', 'L'];
  const srcset = sizes
    .filter((size) => isCardAvailable(deck, size, lang, side))
    .map((size) => {
      const url = getCardImageUrl({ deck, card, size, side, lang });
      // Approximate widths based on size
      const width = size === 'L' ? '440w' : size === 'M' ? '300w' : '150w';
      return `${url} ${width}`;
    })
    .join(', ');

  return srcset;
}

// Export config for direct access if needed
export { cardAssetsConfig };
