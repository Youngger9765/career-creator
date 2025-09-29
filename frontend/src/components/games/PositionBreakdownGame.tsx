/**
 * PositionBreakdownGame - 職位拆解玩法
 *
 * 使用職能盤點卡拆解職位需求
 * 包含左側職能分析區和右側PDF上傳區
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { CardLoaderService } from '@/game-modes/services/card-loader.service';
import JobDecompositionCanvas from '../game-canvases/JobDecompositionCanvas';
import GameLayout from '../common/GameLayout';
import { useUnifiedCardSync } from '@/hooks/use-unified-card-sync';
import { GAMEPLAY_IDS } from '@/constants/game-modes';

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
  const [maxCards, setMaxCards] = useState(10);

  // 使用統一的卡片同步 Hook
  const { state, draggedByOthers, handleCardMove, cardSync, updateCards } = useUnifiedCardSync({
    roomId,
    gameType: GAMEPLAY_IDS.POSITION_BREAKDOWN,
    storeKey: 'position',
    isRoomOwner,
    zones: ['position'], // 定義這個遊戲的區域
  });

  // 載入牌組
  useEffect(() => {
    const getDeck = async () => {
      const cardLoader = CardLoaderService;
      const deck = await cardLoader.getDeck(deckType);
      setMainDeck(deck);
    };
    getDeck();
  }, [deckType]);

  // 處理文件上傳
  const handleFileUpload = (file: File) => {
    console.log('上傳文件:', file.name, file.type);

    // 將文件轉換為 base64 並儲存
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      updateCards({
        uploadedFile: {
          name: file.name,
          type: file.type,
          size: file.size,
          dataUrl: dataUrl,
          uploadedAt: Date.now(),
        },
      });
    };
    reader.readAsDataURL(file);
  };

  // 計算已使用的卡片
  const positionCards = state.cardPlacements.positionCards || [];
  const usedCardIds = new Set(positionCards);

  // 過濾出未使用的卡片
  const availableCards = mainDeck?.cards?.filter((card: any) => !usedCardIds.has(card.id)) || [];

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
          onCardMove={(cardId, zone) => handleCardMove(cardId, zone ? 'position' : null)}
          onFileUpload={handleFileUpload}
          placedCards={positionCards}
          uploadedFile={state.cardPlacements.uploadedFile}
          draggedByOthers={draggedByOthers}
          onDragStart={cardSync.startDrag}
          onDragEnd={cardSync.endDrag}
        />
      }
    />
  );
};

export default PositionBreakdownGame;
