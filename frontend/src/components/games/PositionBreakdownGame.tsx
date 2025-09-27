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
import CardItem from '../game-canvases/CardItem';

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
  deckType = 'skill',
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
    <div className="h-full flex">
      {/* 左側卡片區 */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
        <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
          職能盤點卡 ({availableCards.length})
        </h3>
        <div className="space-y-2">
          {availableCards.map((card: any) => (
            <div key={card.id} className="cursor-move">
              <CardItem
                id={card.id}
                title={card.title}
                description={card.description}
                category={card.category}
                isDraggable={true}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 右側畫布區 */}
      <div className="flex-1">
        <JobDecompositionCanvas
          cards={mainDeck?.cards || []}
          maxCards={maxCards}
          isRoomOwner={isRoomOwner}
          onCardMove={handleCardMove}
          onFileUpload={handleFileUpload}
        />
      </div>
    </div>
  );
};

export default PositionBreakdownGame;
