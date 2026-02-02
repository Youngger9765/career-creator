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
import { fileUploadsAPI } from '@/lib/api/file-uploads';

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
  const [fullDeck, setFullDeck] = useState<any>(null);
  const [maxCards, setMaxCards] = useState(10);

  // 使用統一的卡片同步 Hook
  const { state, draggedByOthers, handleCardMove, handleCardReorder, handleFileUpload, cardSync } =
    useUnifiedCardSync({
      roomId,
      gameType: GAMEPLAY_IDS.POSITION_BREAKDOWN,
      storeKey: GAMEPLAY_IDS.POSITION_BREAKDOWN,
      isRoomOwner,
      zones: ['position'], // 定義這個遊戲的區域
    });

  // 載入牌組
  useEffect(() => {
    const getDeck = async () => {
      const cardLoader = CardLoaderService;
      const deck = await cardLoader.getDeck(deckType);
      setFullDeck(deck);
    };
    getDeck();
  }, [deckType]);

  // 職位拆解只用 mindset 卡
  const mindsetCards = useMemo(
    () => fullDeck?.cards?.filter((card: any) => card.category === 'mindset') || [],
    [fullDeck]
  );

  // 處理文件上傳（上傳到 GCS 後端並廣播 URL）
  const onFileUpload = async (file: File) => {
    console.log('上傳文件:', file.name, file.type);

    // 1. File size validation (max 5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      alert(`文件過大！最大支援 ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
      return;
    }

    // 2. File type validation (PDF, JPG, PNG only)
    const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('僅支援 PDF、JPG、PNG 格式');
      return;
    }

    // 3. Connection check
    if (!cardSync.isConnected) {
      alert('網路連線中斷，無法同步文件');
      return;
    }

    try {
      // 4. Upload file to backend GCS endpoint
      const response = await fileUploadsAPI.uploadFile(roomId, file);

      console.log('文件上傳成功:', response.url);

      // 5. Broadcast GCS URL (使用統一的 handleFileUpload)
      handleFileUpload({
        name: response.name,
        type: response.type,
        size: response.size,
        url: response.url, // GCS public URL
        uploadedAt: response.uploadedAt,
      });
    } catch (error) {
      console.error('文件上傳失敗:', error);
      alert(`文件上傳失敗: ${error instanceof Error ? error.message : '未知錯誤'}`);
    }
  };

  // 計算已使用的卡片
  const positionCards = state.cardPlacements.positionCards || [];
  const usedCardIds = new Set(positionCards);

  // 過濾出未使用的 mindset 卡片
  const availableCards = mindsetCards.filter((card: any) => !usedCardIds.has(card.id));

  return (
    <GameLayout
      infoBar={{
        mode: '職位分析',
        gameplay: '職位拆解',
        canvas: '職位分析畫布',
        deckName: '職能卡',
        totalCards: mindsetCards.length,
        availableCards: availableCards.length,
      }}
      sidebar={{
        type: 'single',
        decks: [
          {
            id: 'mindset',
            label: '職能卡',
            cards: availableCards,
            color: 'blue',
            type: 'mindset',
          },
        ],
        width: 'w-96',
        columns: 2,
      }}
      enableViewModeToggle={true}
      defaultViewMode="grid"
      canvas={(viewMode, onViewModeChange) => (
        <JobDecompositionCanvas
          cards={mindsetCards}
          maxCards={maxCards}
          isRoomOwner={isRoomOwner}
          onCardMove={(cardId, zone) => handleCardMove(cardId, zone ? 'position' : null)}
          onCardReorder={(newCardIds) => handleCardReorder('position', newCardIds)}
          onFileUpload={onFileUpload}
          placedCards={positionCards}
          uploadedFile={state.cardPlacements.uploadedFile}
          draggedByOthers={draggedByOthers}
          onDragStart={cardSync.startDrag}
          onDragEnd={cardSync.endDrag}
          viewMode={viewMode}
          onViewModeChange={onViewModeChange}
        />
      )}
    />
  );
};

export default PositionBreakdownGame;
