'use client';

import React from 'react';
import { CardData } from '@/types/cards';
import { DraggableCard } from './DraggableCard';

interface CardListProps {
  title: string;
  cards: CardData[];
  deckType: string;
  searchQuery: string;
  usedCardIds?: Set<string>;
}

export function CardList({ title, cards, deckType, searchQuery, usedCardIds }: CardListProps) {
  const filteredCards = cards.filter(
    (card) =>
      !usedCardIds?.has(card.id) && // Hide used cards
      (card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Determine deck color based on deck type
  const getDeckColor = () => {
    if (title.includes('職游旅人卡')) return 'bg-teal-600';
    if (title.includes('職能盤點卡')) return 'bg-blue-600';
    if (title.includes('價值導航卡')) return 'bg-purple-600';
    return 'bg-gray-600';
  };

  const deckColor = getDeckColor();

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <h3 className="text-lg font-semibold mb-3 flex-shrink-0">{title}</h3>
      <div className="flex-1 overflow-y-auto pr-2">
        <div className="grid grid-cols-2 gap-2">
          {filteredCards.map((card) => (
            <DraggableCard
              key={card.id}
              card={card}
              idPrefix="list"
              cardColor={deckColor}
              cardStyle="default"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
