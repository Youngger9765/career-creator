/**
 * TwoZoneCanvas - 優劣勢雙區畫布元件
 *
 * 用於職能盤點卡的優劣勢分析玩法
 * 提供優勢和劣勢兩個區域，每區最多放5張卡片
 */

'use client';

import React, { useState } from 'react';
import { Card as CardData } from '@/game-modes/services/card-loader.service';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface TwoZoneCanvasProps {
  cards?: CardData[];
  onCardMove?: (cardId: string, zone: 'advantage' | 'disadvantage') => void;
  maxCardsPerZone?: number;
  className?: string;
}

const TwoZoneCanvas: React.FC<TwoZoneCanvasProps> = ({
  cards = [],
  onCardMove,
  maxCardsPerZone = 5,
  className = '',
}) => {
  const [zones, setZones] = useState<{
    advantage: string[];
    disadvantage: string[];
  }>({
    advantage: [],
    disadvantage: [],
  });

  const [dragOverZone, setDragOverZone] = useState<string | null>(null);

  const handleDrop = (e: React.DragEvent, zone: 'advantage' | 'disadvantage') => {
    e.preventDefault();
    setDragOverZone(null);

    const cardId = e.dataTransfer.getData('cardId');

    // 檢查是否超過限制
    if (zones[zone].length >= maxCardsPerZone && !zones[zone].includes(cardId)) {
      // 顯示提示訊息
      return;
    }

    // 更新本地狀態
    setZones((prev) => {
      // 從其他區域移除
      const newZones = {
        advantage: prev.advantage.filter((id) => id !== cardId),
        disadvantage: prev.disadvantage.filter((id) => id !== cardId),
      };

      // 如果未超過限制，加到新區域
      if (newZones[zone].length < maxCardsPerZone) {
        newZones[zone] = [...newZones[zone], cardId];
      }

      return newZones;
    });

    // 通知父元件
    onCardMove?.(cardId, zone);
  };

  const handleDragOver = (e: React.DragEvent, zone: string) => {
    e.preventDefault();
    setDragOverZone(zone);
  };

  const handleDragLeave = () => {
    setDragOverZone(null);
  };

  const zoneConfig = [
    {
      id: 'advantage',
      title: '優勢',
      subtitle: '我擅長的技能',
      icon: TrendingUp,
      bgColor: 'bg-blue-50 dark:bg-blue-950',
      borderColor: 'border-blue-400 dark:border-blue-600',
      headerBg: 'bg-blue-100 dark:bg-blue-900',
      iconColor: 'text-blue-600 dark:text-blue-400',
      dragOverColor: 'border-blue-500 bg-blue-100 dark:bg-blue-900',
    },
    {
      id: 'disadvantage',
      title: '劣勢',
      subtitle: '需要加強的技能',
      icon: TrendingDown,
      bgColor: 'bg-orange-50 dark:bg-orange-950',
      borderColor: 'border-orange-400 dark:border-orange-600',
      headerBg: 'bg-orange-100 dark:bg-orange-900',
      iconColor: 'text-orange-600 dark:text-orange-400',
      dragOverColor: 'border-orange-500 bg-orange-100 dark:bg-orange-900',
    },
  ];

  return (
    <div className={`w-full h-full p-4 ${className}`}>
      <div className="h-full grid grid-cols-2 gap-6">
        {zoneConfig.map((zone) => {
          const Icon = zone.icon;
          const zoneCards = zones[zone.id as keyof typeof zones];
          const isOverLimit = zoneCards.length >= maxCardsPerZone;
          const isDraggingOver = dragOverZone === zone.id;

          return (
            <div
              key={zone.id}
              className={`
                flex flex-col rounded-xl border-2 transition-all duration-200
                ${isDraggingOver && !isOverLimit ? zone.dragOverColor : `${zone.borderColor} ${zone.bgColor}`}
              `}
              onDrop={(e) => handleDrop(e, zone.id as 'advantage' | 'disadvantage')}
              onDragOver={(e) => handleDragOver(e, zone.id)}
              onDragLeave={handleDragLeave}
            >
              {/* 區域標題 */}
              <div
                className={`px-4 py-4 ${zone.headerBg} border-b border-gray-200 dark:border-gray-700 rounded-t-lg`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-6 h-6 ${zone.iconColor}`} />
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {zone.title}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400">{zone.subtitle}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span
                      className={`
                      text-sm font-medium px-2 py-1 rounded
                      ${
                        isOverLimit
                          ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }
                    `}
                    >
                      {zoneCards.length} / {maxCardsPerZone}
                    </span>
                    {isOverLimit && <AlertCircle className="w-4 h-4 text-red-500" />}
                  </div>
                </div>
              </div>

              {/* 卡片區域 */}
              <div className="flex-1 p-4 overflow-y-auto">
                {zoneCards.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                      <Icon className="w-10 h-10 text-gray-400 dark:text-gray-600" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">拖曳卡片到此處</p>
                    <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                      最多可放 {maxCardsPerZone} 張卡片
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {zoneCards.map((cardId, index) => {
                      const card = cards.find((c) => c.id === cardId);
                      if (!card) return null;

                      return (
                        <div
                          key={cardId}
                          className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('cardId', cardId);
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                {index + 1}
                              </span>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900 dark:text-gray-100">
                                {card.title}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {card.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TwoZoneCanvas;
