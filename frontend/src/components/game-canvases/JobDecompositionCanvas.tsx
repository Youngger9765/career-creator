/**
 * JobDecompositionCanvas - 職位拆解畫布元件
 *
 * 左側：使用 DropZone 組件，用於職能卡片分析
 * 右側：PDF/圖片上傳區域，用於職位說明文件
 */

'use client';

import React, { useState } from 'react';
import { FileText } from 'lucide-react';
import DropZone from '../common/DropZone';
import PDFUploader from '@/components/common/PDFUploader';

interface Card {
  id: string;
  title: string;
  description?: string;
  category?: string;
}

interface JobDecompositionCanvasProps {
  cards?: Card[];
  onCardMove?: (cardId: string, zone: string | null) => void;
  onFileUpload?: (file: File) => void;
  maxCards?: number;
  isRoomOwner?: boolean;
  className?: string;
}

const JobDecompositionCanvas: React.FC<JobDecompositionCanvasProps> = ({
  cards = [],
  onCardMove,
  onFileUpload,
  maxCards = 10,
  isRoomOwner = false,
  className = '',
}) => {
  const [placedCardIds, setPlacedCardIds] = useState<string[]>([]);
  const [isLocked, setIsLocked] = useState(false);
  const [localMaxCards, setLocalMaxCards] = useState(maxCards);

  const handleCardAdd = (cardId: string) => {
    setPlacedCardIds((prev) => [...prev, cardId]);
    onCardMove?.(cardId, 'job-canvas');
  };

  const handleCardRemove = (cardId: string) => {
    setPlacedCardIds((prev) => prev.filter((id) => id !== cardId));
    onCardMove?.(cardId, null);
  };

  const handleCardReorder = (newCardIds: string[]) => {
    setPlacedCardIds(newCardIds);
  };

  const handleMaxCardsChange = (newMax: number) => {
    setLocalMaxCards(newMax);
  };

  return (
    <div className={`w-full h-full flex ${className}`}>
      {/* 左側 - 職能卡片拖放區域 */}
      <div className="flex-1 p-4 min-w-0">
        <DropZone
          id="job-decomposition-zone"
          cards={cards}
          placedCardIds={placedCardIds}
          maxCards={localMaxCards}
          title="職能分析區"
          subtitle="拖曳卡片到此處進行職位分析"
          icon={FileText}
          emptyMessage="拖曳卡片到此處"
          emptySubMessage={`最多可放 ${localMaxCards} 張卡片`}
          className="h-full"
          headerClassName="bg-blue-50 dark:bg-blue-900/20"
          dragOverColor="border-blue-500 bg-blue-50 dark:bg-blue-900/20"
          cardWidth="135px"  // 1.5x of default 90px
          cardHeight="240px" // 1.5x of default 160px
          showCardNumbers={true}
          showRemoveButton={true}
          allowReorder={true}
          showCounter={true}
          isEditable={isRoomOwner}
          isLocked={isLocked}
          onMaxCardsChange={handleMaxCardsChange}
          onLockToggle={setIsLocked}
          onCardAdd={handleCardAdd}
          onCardRemove={handleCardRemove}
          onCardReorder={handleCardReorder}
        />
      </div>

      {/* 右側 - PDF上傳區域 */}
      <div className="w-96 p-4 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700">
        <PDFUploader
          title="職位說明文件"
          subtitle="上傳 JD 或職位需求文件"
          onFileUpload={onFileUpload}
          className="h-full"
        />
      </div>
    </div>
  );
};

export default JobDecompositionCanvas;
