/**
 * CardSidebar - 通用卡片側邊欄組件
 *
 * 可重用的卡片面板，支援單牌組或多牌組Tab切換
 * 用於各種遊戲模式的卡片選擇區
 */

'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CardItem from '../game-cards/CardItem';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface DeckConfig {
  id: string;
  label: string;
  cards: any[];
  color: 'blue' | 'orange' | 'green' | 'purple' | 'red';
  type?: 'skill' | 'action' | 'value' | 'career';
}

interface CardSidebarProps {
  decks: DeckConfig[];
  width?: string; // 預設 w-96
  columns?: number; // 預設 2
  showGradientBg?: boolean; // 是否顯示漸層背景
  onCardDragStart?: (cardId: string) => void;
  className?: string;
  collapsible?: boolean; // 是否可收合
  defaultCollapsed?: boolean; // 預設收合狀態
}

const CardSidebar: React.FC<CardSidebarProps> = ({
  decks,
  width = 'w-96',
  columns = 2,
  showGradientBg = true,
  onCardDragStart,
  className = '',
  collapsible = true,
  defaultCollapsed = false,
}) => {
  const [activeTab, setActiveTab] = useState(decks[0]?.id || '');
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  // 顏色配置
  const colorConfig = {
    blue: {
      tab: 'data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400',
      badge: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
    },
    orange: {
      tab: 'data-[state=active]:text-orange-600 dark:data-[state=active]:text-orange-400',
      badge: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',
    },
    green: {
      tab: 'data-[state=active]:text-green-600 dark:data-[state=active]:text-green-400',
      badge: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
    },
    purple: {
      tab: 'data-[state=active]:text-purple-600 dark:data-[state=active]:text-purple-400',
      badge: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
    },
    red: {
      tab: 'data-[state=active]:text-red-600 dark:data-[state=active]:text-red-400',
      badge: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
    },
  };

  const handleDragStart = (e: React.DragEvent, cardId: string) => {
    e.dataTransfer.setData('cardId', cardId);
    onCardDragStart?.(cardId);
  };

  // 單牌組模式（無Tab）
  if (decks.length === 1) {
    const deck = decks[0];
    return (
      <div
        className={`
          ${isCollapsed ? 'w-12' : width}
          border-r border-gray-200 dark:border-gray-700
          flex flex-col relative transition-all duration-300
          ${showGradientBg ? 'bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800' : ''}
          ${className}
        `}
      >
        {/* 收合按鈕 */}
        {collapsible && (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-50 w-6 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-r-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
            title={isCollapsed ? '展開側邊欄' : '收合側邊欄'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        )}

        {/* 內容區域 */}
        <div className={`${isCollapsed ? 'hidden' : 'block'} flex flex-col h-full`}>
          <div className="px-4 pt-4 pb-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {deck.label}
              </h3>
              <span
                className={`
                text-xs px-2 py-1 rounded-full font-medium
                ${colorConfig[deck.color].badge}
              `}
              >
                {deck.cards.length} 張
              </span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <div className={`grid grid-cols-${columns} gap-2`}>
              {deck.cards.map((card) => (
                <div
                  key={card.id}
                  className="cursor-move"
                  draggable
                  onDragStart={(e) => handleDragStart(e, card.id)}
                >
                  <CardItem
                    id={card.id}
                    title={card.title}
                    description={card.description}
                    category={card.category}
                    type={deck.type}
                    isDraggable={true}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 多牌組模式（有Tab）
  return (
    <div
      className={`
        ${isCollapsed ? 'w-12' : width}
        border-r border-gray-200 dark:border-gray-700
        flex flex-col relative transition-all duration-300
        ${showGradientBg ? 'bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800' : ''}
        ${className}
      `}
    >
      {/* 收合按鈕 */}
      {collapsible && (
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-50 w-6 h-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-r-md flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
          title={isCollapsed ? '展開側邊欄' : '收合側邊欄'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          )}
        </button>
      )}

      {/* 內容區域 */}
      <div className={`${isCollapsed ? 'hidden' : 'block'} h-full`}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
          <div className="px-4 pt-4">
            <TabsList
              className={`grid w-full grid-cols-${decks.length} bg-gray-100 dark:bg-gray-800 p-1 rounded-lg`}
            >
              {decks.map((deck) => (
                <TabsTrigger
                  key={deck.id}
                  value={deck.id}
                  className={`
                  data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700
                  data-[state=active]:shadow-sm font-medium transition-all
                  ${colorConfig[deck.color].tab}
                `}
                >
                  {deck.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {decks.map((deck) => (
            <TabsContent
              key={deck.id}
              value={deck.id}
              className="flex-1 overflow-hidden mt-0 data-[state=inactive]:hidden"
            >
              <div className="flex flex-col h-full">
                <div className="px-4 pt-4 pb-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {deck.label}
                    </h3>
                    <span
                      className={`
                      text-xs px-2 py-1 rounded-full font-medium
                      ${colorConfig[deck.color].badge}
                    `}
                    >
                      {deck.cards.length} 張
                    </span>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4">
                  <div className={`grid grid-cols-${columns} gap-2`}>
                    {deck.cards.map((card) => (
                      <div
                        key={card.id}
                        className="cursor-move"
                        draggable
                        onDragStart={(e) => handleDragStart(e, card.id)}
                      >
                        <CardItem
                          id={card.id}
                          title={card.title}
                          description={card.description}
                          category={card.category}
                          type={deck.type}
                          isDraggable={true}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default CardSidebar;
