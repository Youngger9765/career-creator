/**
 * PositionBreakdownGame - 職位拆解玩法
 *
 * 使用職能盤點卡拆解職位需求
 * 包含左側職能分析區和右側PDF上傳區
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CardLoaderService } from '@/game-modes/services/card-loader.service';
import JobDecompositionCanvas from '../game-canvases/JobDecompositionCanvas';
import GameLayout from '../common/GameLayout';

interface PositionBreakdownGameProps {
  roomId: string;
  isRoomOwner: boolean;
  mode?: string;
  deckType?: string;
}

const PositionBreakdownGame: React.FC<PositionBreakdownGameProps> = ({
  roomId,
  isRoomOwner,
  mode = 'skill',
  deckType = 'skill_cards_52',
}) => {
  const [mainDeck, setMainDeck] = useState<any>(null);
  const [usedCards, setUsedCards] = useState<Set<string>>(new Set());
  const [maxCards, setMaxCards] = useState(10);

  // 載入牌組
  useEffect(() => {
    const getDeck = async () => {
      const cardLoader = CardLoaderService;
      const deck = await cardLoader.getDeck(deckType);
      setMainDeck(deck);
    };
    getDeck();
  }, [deckType]);

  // 處理卡片移動
  const handleCardMove = (cardId: string, zone: string | null) => {
    if (zone === null) {
      // 卡片被移除，回到左邊
      setUsedCards((prev) => {
        const newSet = new Set(prev);
        newSet.delete(cardId);
        return newSet;
      });
    } else {
      // 卡片被放置到分析區
      setUsedCards((prev) => new Set(Array.from(prev).concat(cardId)));
    }
  };

  // 處理文件上傳
  const handleFileUpload = (file: File) => {
    console.log('上傳文件:', file.name, file.type);
    // 這裡可以加入文件處理邏輯
  };

  // 過濾出未使用的卡片
  const availableCards = mainDeck?.cards?.filter((card: any) => !usedCards.has(card.id)) || [];

  return (
    <GameLayout
      infoBar={{
        mode: '職位分析',
        gameplay: '職位拆解',
        canvas: '職位分析畫布',
        deckName: mainDeck?.name || '職能盤點卡',
        totalCards: mainDeck?.cards?.length || 0,
        availableCards: availableCards.length,
      }}
      sidebar={{
        type: 'single',
        decks: [
          {
            id: 'skill',
            label: '職能盤點卡',
            cards: availableCards,
            color: 'blue',
            type: 'skill',
          },
        ],
        width: 'w-96',
        columns: 2,
      }}
      canvas={
        <JobDecompositionCanvas
          cards={mainDeck?.cards || []}
          maxCards={maxCards}
          isRoomOwner={isRoomOwner}
          onCardMove={handleCardMove}
          onFileUpload={handleFileUpload}
        />
      }
    />
  );
};

export default PositionBreakdownGame;
