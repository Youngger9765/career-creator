/**
 * GridCanvas - 3+1格局畫布元件
 *
 * 用於價值導航卡的價值觀排序玩法
 * 提供3個上方格子和1個下方大格子
 * 1-3名只能放一張卡片，其他區域可設定張數（預設7張）
 */

'use client';

import React, { useState } from 'react';
import { Card as CardData } from '@/game-modes/services/card-loader.service';
import { Trophy, Medal, Award, Square } from 'lucide-react';
import DropZone from '../common/DropZone';

interface GridCanvasProps {
  cards?: CardData[];
  onCardMove?: (cardId: string, position: { row: number; col: number } | null) => void;
  className?: string;
  gridState?: Array<string | null>; // 外部狀態
}

interface GridZone {
  id: string;
  title: string;
  placedCardIds: string[];
  maxCards: number;
  icon: any;
  type: 'rank' | 'others';
  rank?: number;
}

const GridCanvas: React.FC<GridCanvasProps> = ({
  cards = [],
  onCardMove,
  className = '',
  gridState,
}) => {
  // 定義區域配置
  const zoneConfigs: Omit<GridZone, 'placedCardIds'>[] = [
    { id: 'rank1', title: '第一名', maxCards: 1, icon: Trophy, type: 'rank', rank: 1 },
    { id: 'rank2', title: '第二名', maxCards: 1, icon: Medal, type: 'rank', rank: 2 },
    { id: 'rank3', title: '第三名', maxCards: 1, icon: Award, type: 'rank', rank: 3 },
    { id: 'others', title: '其他', maxCards: 7, icon: Square, type: 'others' },
  ];

  // 從 gridState 計算每個區域的卡片
  const zones: GridZone[] = zoneConfigs.map((config, index) => ({
    ...config,
    placedCardIds: gridState && gridState[index] ? [gridState[index]!] : [],
  }));

  // 處理卡片添加
  const handleCardAdd = (zoneId: string, cardId: string) => {
    const zoneIndex = zoneConfigs.findIndex((z) => z.id === zoneId);
    if (zoneIndex !== -1) {
      onCardMove?.(cardId, { row: 0, col: zoneIndex });
    }
  };

  // 處理卡片移除
  const handleCardRemove = (zoneId: string, cardId: string) => {
    onCardMove?.(cardId, null);
  };

  // 處理最大卡片數變更（僅其他區域可變更）
  const handleMaxCardsChange = (zoneId: string, newMax: number) => {
    // Note: This function is currently not used as maxCards is fixed by configuration
    // In the future, this could be extended to support dynamic max card limits
    console.log(`Max cards change for ${zoneId}: ${newMax}`);
  };

  return (
    <div className={`w-full h-full overflow-y-auto p-6 ${className}`}>
      <div className="min-h-full flex flex-col space-y-4">
        {/* 前三名區域 */}
        <div className="grid grid-cols-3 gap-4 h-80">
          {zones
            .filter((zone) => zone.type === 'rank')
            .map((zone) => (
              <DropZone
                key={zone.id}
                id={zone.id}
                cards={cards}
                placedCardIds={zone.placedCardIds}
                maxCards={zone.maxCards}
                title={zone.title}
                icon={zone.icon}
                emptyMessage="拖曳卡片到此"
                emptySubMessage="只能放置一張卡片"
                showCardNumbers={false}
                showRemoveButton={true}
                allowReorder={false}
                showCounter={false}
                isEditable={false}
                cardWidth="150px" // 增大卡片寬度
                cardHeight="210px" // 增大卡片高度
                onCardAdd={(cardId) => handleCardAdd(zone.id, cardId)}
                onCardRemove={(cardId) => handleCardRemove(zone.id, cardId)}
                dragOverColor={`border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20`}
                className="h-full"
                headerClassName="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20"
                contentClassName="flex items-center justify-center"
              />
            ))}
        </div>

        {/* 其他區域 */}
        <div className="flex-1">
          {zones
            .filter((zone) => zone.type === 'others')
            .map((zone) => (
              <DropZone
                key={zone.id}
                id={zone.id}
                cards={cards}
                placedCardIds={zone.placedCardIds}
                maxCards={zone.maxCards}
                title={zone.title}
                subtitle={`可放置多張卡片（預設 ${zone.maxCards} 張）`}
                icon={zone.icon}
                emptyMessage="拖曳其他卡片到此區域"
                emptySubMessage={`最多可放置 ${zone.maxCards} 張卡片`}
                showCardNumbers={true}
                showRemoveButton={true}
                allowReorder={true}
                showCounter={true}
                isEditable={true}
                cardWidth="120px" // 增大卡片寬度
                cardHeight="180px" // 增大卡片高度
                onCardAdd={(cardId) => handleCardAdd(zone.id, cardId)}
                onCardRemove={(cardId) => handleCardRemove(zone.id, cardId)}
                onMaxCardsChange={(newMax) => handleMaxCardsChange(zone.id, newMax)}
                dragOverColor={`border-green-500 bg-green-50 dark:bg-green-900/20`}
                className="h-full"
                headerClassName="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20"
              />
            ))}
        </div>
      </div>
    </div>
  );
};

export default GridCanvas;
