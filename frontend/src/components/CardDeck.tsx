'use client';

import React, { useState } from 'react';
import { Card } from './Card';
import { CardData, DEFAULT_CAREER_CARDS } from '@/types/cards';
import { CardEventType } from '@/types/api';

interface CardDeckProps {
  cards?: CardData[];
  onDealCard?: (card: CardData) => void;
  onCardEvent?: (cardId: string, eventType: CardEventType, data?: any) => void;
  maxVisible?: number;
}

export function CardDeck({
  cards = DEFAULT_CAREER_CARDS,
  onDealCard,
  onCardEvent,
  maxVisible = 3,
}: CardDeckProps) {
  const [shuffledCards, setShuffledCards] = useState(cards);
  const [dealtCards, setDealtCards] = useState<Set<string>>(new Set());

  const shuffle = () => {
    const newCards = [...shuffledCards];
    for (let i = newCards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newCards[i], newCards[j]] = [newCards[j], newCards[i]];
    }
    setShuffledCards(newCards);
    setDealtCards(new Set()); // Reset dealt cards
  };

  const dealRandomCard = () => {
    const availableCards = shuffledCards.filter((card) => !dealtCards.has(card.id));
    if (availableCards.length === 0) {
      // All cards dealt, shuffle and reset
      shuffle();
      return;
    }

    const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
    setDealtCards((prev) => {
      const newSet = new Set(prev);
      newSet.add(randomCard.id);
      return newSet;
    });

    onDealCard?.(randomCard);
    onCardEvent?.(randomCard.id, CardEventType.CARD_DEALT, {
      position: { x: 400, y: 300 }, // Default center position
      from_deck: true,
    });
  };

  const remainingCount = shuffledCards.length - dealtCards.size;

  return (
    <div className="relative">
      {/* Deck Stack */}
      <div className="relative w-32 h-44">
        {/* Stack effect - show multiple card backs */}
        {Array.from({ length: Math.min(maxVisible, remainingCount) }).map((_, index) => (
          <div
            key={index}
            className={`absolute rounded-lg bg-gradient-to-br from-indigo-600 to-purple-700 shadow-md transition-all duration-300`}
            style={{
              width: '8rem',
              height: '11rem',
              transform: `translate(${index * 2}px, ${index * -2}px)`,
              zIndex: maxVisible - index,
            }}
          >
            <div className="w-full h-full rounded-lg flex items-center justify-center">
              <div className="text-center text-white">
                <div className="text-lg font-bold mb-1">Career</div>
                <div className="text-xs opacity-75">Cards</div>
                <div className="mt-2 w-6 h-6 mx-auto border-2 border-white rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Deal button overlay */}
        {remainingCount > 0 && (
          <button
            onClick={dealRandomCard}
            className="absolute inset-0 z-10 w-full h-full rounded-lg bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 flex items-center justify-center group"
            title="發牌"
          >
            <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white bg-opacity-90 rounded-full p-2">
              <svg
                className="w-6 h-6 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
          </button>
        )}
      </div>

      {/* Deck Info */}
      <div className="mt-4 text-center">
        <div className="text-sm text-gray-600 mb-2">剩餘: {remainingCount} 張</div>

        <div className="space-y-2">
          <button
            onClick={dealRandomCard}
            disabled={remainingCount === 0}
            className="w-full deal-button disabled:bg-gray-400 disabled:cursor-not-allowed disabled:transform-none text-sm"
          >
            {remainingCount === 0 ? '已發完' : '發牌'}
          </button>

          <button
            onClick={shuffle}
            className="w-full px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors text-sm"
          >
            重新洗牌
          </button>
        </div>
      </div>

      {/* Card categories info */}
      <div className="mt-4 text-xs text-gray-500">
        <div className="font-medium mb-1">卡牌分類:</div>
        <div className="space-y-1">
          <div>• 科技/管理/創意</div>
          <div>• 分析/行銷/人資</div>
          <div>• 財務/銷售/教育</div>
          <div>• 創業/諮詢/醫療</div>
        </div>
      </div>
    </div>
  );
}
