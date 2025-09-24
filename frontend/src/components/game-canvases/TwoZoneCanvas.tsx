/**
 * TwoZoneCanvas - 優劣勢雙區畫布元件
 *
 * 用於職能盤點卡的優劣勢分析玩法
 * 提供優勢和劣勢兩個區域，每區最多放5張卡片
 */

'use client';

import React, { useState } from 'react';
import { Card as CardData } from '@/game-modes/services/card-loader.service';
import { TrendingUp, TrendingDown, AlertCircle, X, Settings, Lock, Unlock } from 'lucide-react';
import CardItem from './CardItem';

interface TwoZoneCanvasProps {
  cards?: CardData[];
  onCardMove?: (cardId: string, zone: 'advantage' | 'disadvantage') => void;
  maxCardsPerZone?: number;
  maxAdvantageCards?: number;
  maxDisadvantageCards?: number;
  onMaxAdvantageCardsChange?: (newMax: number) => void;
  onMaxDisadvantageCardsChange?: (newMax: number) => void;
  isRoomOwner?: boolean;
  className?: string;
}

const TwoZoneCanvas: React.FC<TwoZoneCanvasProps> = ({
  cards = [],
  onCardMove,
  maxCardsPerZone = 5,
  maxAdvantageCards = 5,
  maxDisadvantageCards = 5,
  onMaxAdvantageCardsChange,
  onMaxDisadvantageCardsChange,
  isRoomOwner = false,
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
  
  // 上限設定狀態
  const [isEditingAdvantageLimit, setIsEditingAdvantageLimit] = useState(false);
  const [isEditingDisadvantageLimit, setIsEditingDisadvantageLimit] = useState(false);
  const [tempMaxAdvantageCards, setTempMaxAdvantageCards] = useState(maxAdvantageCards);
  const [tempMaxDisadvantageCards, setTempMaxDisadvantageCards] = useState(maxDisadvantageCards);
  const [isAdvantageLimitLocked, setIsAdvantageLimitLocked] = useState(false);
  const [isDisadvantageLimitLocked, setIsDisadvantageLimitLocked] = useState(false);

  const handleDrop = (e: React.DragEvent, zone: 'advantage' | 'disadvantage') => {
    e.preventDefault();
    setDragOverZone(null);

    const cardId = e.dataTransfer.getData('cardId');
    const currentMaxCards = zone === 'advantage' ? maxAdvantageCards : maxDisadvantageCards;

    // 檢查卡片類型限制
    const isActionCard = cardId.startsWith('action-');
    const isSkillCard = !isActionCard;

    // 職能盤點卡 (A區卡) 只能放到優勢區域
    // 策略行動卡 (B區卡) 只能放到劣勢區域
    if ((isSkillCard && zone === 'disadvantage') || (isActionCard && zone === 'advantage')) {
      // 顯示錯誤提示 - 卡片類型不匹配
      return;
    }

    // 檢查是否超過限制
    if (zones[zone].length >= currentMaxCards && !zones[zone].includes(cardId)) {
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
      if (newZones[zone].length < currentMaxCards) {
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

  // 計算狀態
  const hasAdvantageCards = zones.advantage.length > 0;
  const hasDisadvantageCards = zones.disadvantage.length > 0;
  const effectivelyAdvantageLockedLocked = isAdvantageLimitLocked || hasAdvantageCards;
  const effectivelyDisadvantageLockedLocked = isDisadvantageLimitLocked || hasDisadvantageCards;

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
          const currentMaxCards = zone.id === 'advantage' ? maxAdvantageCards : maxDisadvantageCards;
          const isOverLimit = zoneCards.length >= currentMaxCards;
          const isDraggingOver = dragOverZone === zone.id;
          
          // 獲取當前區域的設定狀態
          const hasCards = zone.id === 'advantage' ? hasAdvantageCards : hasDisadvantageCards;
          const isEditingLimit = zone.id === 'advantage' ? isEditingAdvantageLimit : isEditingDisadvantageLimit;
          const tempMaxCards = zone.id === 'advantage' ? tempMaxAdvantageCards : tempMaxDisadvantageCards;
          const isLimitLocked = zone.id === 'advantage' ? isAdvantageLimitLocked : isDisadvantageLimitLocked;
          const effectivelyLocked = zone.id === 'advantage' ? effectivelyAdvantageLockedLocked : effectivelyDisadvantageLockedLocked;

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
                    {/* 房間擁有者控制 */}
                    {isRoomOwner && (
                      <div className="flex items-center space-x-1">
                        {isEditingLimit ? (
                          <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-full px-2 py-1 border border-gray-200 dark:border-gray-700">
                            <input
                              type="number"
                              value={tempMaxCards}
                              onChange={(e) => {
                                const newValue = Math.max(1, Math.min(10, parseInt(e.target.value) || 1));
                                if (zone.id === 'advantage') {
                                  setTempMaxAdvantageCards(newValue);
                                } else {
                                  setTempMaxDisadvantageCards(newValue);
                                }
                              }}
                              className="w-12 text-xs text-center bg-transparent border-none outline-none"
                              min="1"
                              max="10"
                            />
                            <button
                              onClick={() => {
                                if (zone.id === 'advantage') {
                                  onMaxAdvantageCardsChange?.(tempMaxAdvantageCards);
                                  setIsEditingAdvantageLimit(false);
                                } else {
                                  onMaxDisadvantageCardsChange?.(tempMaxDisadvantageCards);
                                  setIsEditingDisadvantageLimit(false);
                                }
                              }}
                              className="text-green-600 hover:text-green-700 p-0.5"
                            >
                              ✓
                            </button>
                            <button
                              onClick={() => {
                                if (zone.id === 'advantage') {
                                  setTempMaxAdvantageCards(maxAdvantageCards);
                                  setIsEditingAdvantageLimit(false);
                                } else {
                                  setTempMaxDisadvantageCards(maxDisadvantageCards);
                                  setIsEditingDisadvantageLimit(false);
                                }
                              }}
                              className="text-red-600 hover:text-red-700 p-0.5"
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <>
                            <button
                              onClick={() => {
                                if (!effectivelyLocked) {
                                  if (zone.id === 'advantage') {
                                    setTempMaxAdvantageCards(maxAdvantageCards);
                                    setIsEditingAdvantageLimit(true);
                                  } else {
                                    setTempMaxDisadvantageCards(maxDisadvantageCards);
                                    setIsEditingDisadvantageLimit(true);
                                  }
                                }
                              }}
                              className={`p-1 rounded text-xs ${
                                effectivelyLocked 
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                              }`}
                              disabled={effectivelyLocked}
                            >
                              <Settings className="w-3 h-3" />
                            </button>
                            
                            <button
                              onClick={() => {
                                if (!hasCards) {
                                  if (zone.id === 'advantage') {
                                    setIsAdvantageLimitLocked(!isAdvantageLimitLocked);
                                  } else {
                                    setIsDisadvantageLimitLocked(!isDisadvantageLimitLocked);
                                  }
                                }
                              }}
                              className={`p-1 rounded text-xs ${
                                hasCards
                                  ? 'bg-yellow-500 text-white cursor-default'
                                  : isLimitLocked
                                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                                  : 'bg-gray-500 hover:bg-gray-600 text-white'
                              }`}
                            >
                              {effectivelyLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            </button>
                          </>
                        )}
                      </div>
                    )}

                    <span
                      className={`
                      text-sm font-medium px-2 py-1 rounded flex items-center space-x-1
                      ${
                        isOverLimit
                          ? 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }
                    `}
                    >
                      <span>{zoneCards.length} / {currentMaxCards}</span>
                      {effectivelyLocked && <Lock className="w-3 h-3 ml-1" />}
                    </span>
                    {isOverLimit && <AlertCircle className="w-4 h-4 text-red-500" />}
                  </div>
                </div>
              </div>

              {/* 卡片區域 */}
              <div className="flex-1 p-3 overflow-y-auto">
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
                  <div className="flex flex-wrap gap-2 justify-start">
                    {zoneCards.map((cardId, index) => {
                      const card = cards.find((c) => c.id === cardId);
                      if (!card) return null;

                      return (
                        <div key={cardId} className="relative w-[100px]">
                          <div className="absolute -top-2 -right-1 w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center z-10">
                            <span className="text-[10px] font-bold">{index + 1}</span>
                          </div>
                          <CardItem
                            id={card.id}
                            title={card.title}
                            description=""
                            category=""
                            showRemoveButton={true}
                            isDraggable={false}
                            onRemove={() => {
                              // 移除卡片
                              setZones((prev) => ({
                                ...prev,
                                [zone.id]: prev[zone.id as keyof typeof prev].filter(
                                  (id) => id !== cardId
                                ),
                              }));
                              onCardMove?.(cardId, null as any);
                            }}
                          />
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
