/**
 * Card Asset Manager - Usage Examples
 * 使用範例
 */

import React from 'react';
import {
  getCardImageUrl,
  getCardBothSides,
  getDeckCards,
  getDeckInfo,
  loadDeckImages,
  preloadCardImages,
  getCardSrcSet,
  isCardAvailable,
} from './card-asset-manager';

// ============================================
// Example 1: Get single card image URL
// ============================================
function Example1() {
  const imageUrl = getCardImageUrl({
    deck: 'personality-riasec',
    card: 'artistic',
    size: 'L',
    side: 'front',
    lang: 'zhtw',
  });

  return <img src={imageUrl} alt="Artistic Card" />;
}

// ============================================
// Example 2: Get both front and back
// ============================================
function Example2() {
  const [showFront, setShowFront] = React.useState(true);
  const { front, back } = getCardBothSides('personality-riasec', 'artistic', 'L', 'zhtw');

  return (
    <div onClick={() => setShowFront(!showFront)}>
      <img src={showFront ? front : back} alt="Card" />
    </div>
  );
}

// ============================================
// Example 3: Load all cards in a deck
// ============================================
function Example3() {
  const cards = getDeckCards('personality-riasec');

  return (
    <div className="grid grid-cols-3 gap-4">
      {cards.map((card) => {
        const url = getCardImageUrl({
          deck: 'personality-riasec',
          card: card.id,
          size: 'L',
          side: 'front',
          lang: 'zhtw',
        });

        return (
          <div key={card.id}>
            <img src={url} alt={card.name.zhtw} />
            <p>{card.name.zhtw}</p>
          </div>
        );
      })}
    </div>
  );
}

// ============================================
// Example 4: Batch load with preloading
// ============================================
function Example4() {
  React.useEffect(() => {
    // Load all front images for a deck
    const imageUrls = loadDeckImages('personality-riasec', 'L', 'zhtw', 'front');

    // Preload for better performance
    preloadCardImages(Object.values(imageUrls));
  }, []);

  return <div>Images preloaded!</div>;
}

// ============================================
// Example 5: Responsive images with srcset
// ============================================
function Example5() {
  const srcSet = getCardSrcSet('personality-riasec', 'artistic', 'front', 'zhtw');

  return (
    <img
      srcSet={srcSet}
      sizes="(max-width: 768px) 150px, (max-width: 1024px) 300px, 440px"
      src={getCardImageUrl({
        deck: 'personality-riasec',
        card: 'artistic',
        size: 'L',
        side: 'front',
        lang: 'zhtw',
      })}
      alt="Artistic Card"
    />
  );
}

// ============================================
// Example 6: Check availability before rendering
// ============================================
function Example6() {
  const isAvailable = isCardAvailable('personality-riasec', 'M', 'zhtw', 'front');

  if (!isAvailable) {
    return <div>Card size M not available yet</div>;
  }

  return (
    <img
      src={getCardImageUrl({
        deck: 'personality-riasec',
        card: 'artistic',
        size: 'M',
        side: 'front',
        lang: 'zhtw',
      })}
      alt="Medium card"
    />
  );
}

// ============================================
// Example 7: Deck info display
// ============================================
function Example7() {
  const deckInfo = getDeckInfo('personality-riasec');

  if (!deckInfo) return null;

  return (
    <div>
      <h2>{deckInfo.name}</h2>
      <p>{deckInfo.description}</p>
      <p>Available sizes: {deckInfo.sizes.join(', ')}</p>
      <p>Languages: {deckInfo.languages.join(', ')}</p>
      <p>Total cards: {deckInfo.cardCount}</p>
    </div>
  );
}

// ============================================
// Example 8: Integration with existing CardData
// ============================================
import { CardData } from '@/types/cards';

function convertToCardData(deckId: 'personality-riasec'): CardData[] {
  const cards = getDeckCards(deckId);

  return cards.map((card) => ({
    id: card.id,
    title: card.name.zhtw,
    description: '',
    category: card.category,
    imageUrl: getCardImageUrl({
      deck: deckId,
      card: card.id,
      size: 'L',
      side: 'front',
      lang: 'zhtw',
    }),
    tags: [],
  }));
}

// ============================================
// Example 9: Multi-language support
// ============================================
function Example9({ lang = 'zhtw' }: { lang: 'zhtw' | 'en' }) {
  const cards = getDeckCards('personality-riasec');

  return (
    <div>
      {cards.map((card) => (
        <div key={card.id}>
          <img
            src={getCardImageUrl({
              deck: 'personality-riasec',
              card: card.id,
              size: 'L',
              side: 'front',
              lang,
            })}
            alt={card.name[lang]}
          />
          <p>{card.name[lang]}</p>
        </div>
      ))}
    </div>
  );
}

// ============================================
// Example 10: Dynamic size selection
// ============================================
function Example10() {
  const [size, setSize] = React.useState<'L' | 'M' | 'S'>('L');

  return (
    <div>
      <select value={size} onChange={(e) => setSize(e.target.value as any)}>
        <option value="L">Large (440px)</option>
        <option value="M">Medium (300px)</option>
        <option value="S">Small (150px)</option>
      </select>

      {isCardAvailable('personality-riasec', size, 'zhtw', 'front') ? (
        <img
          src={getCardImageUrl({
            deck: 'personality-riasec',
            card: 'artistic',
            size,
            side: 'front',
            lang: 'zhtw',
          })}
          alt="Card"
        />
      ) : (
        <div>This size is not available yet</div>
      )}
    </div>
  );
}

export {
  Example1,
  Example2,
  Example3,
  Example4,
  Example5,
  Example6,
  Example7,
  Example9,
  Example10,
  convertToCardData,
};
