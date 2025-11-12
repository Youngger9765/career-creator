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
import { ChevronLeft, ChevronRight, LayoutGrid, Square, RotateCw } from 'lucide-react';
import CardModal from './CardModal';

// 大卡片組件 - 用於 Single 模式
interface BigCardProps {
  card: any;
  type?: 'skill' | 'action' | 'value' | 'career';
}

const BigCard: React.FC<BigCardProps> = ({ card, type }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // 根據卡片類型決定背景色
  const getCardBackground = () => {
    if (type === 'skill' || card.id.startsWith('skill_')) {
      return 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/60 dark:to-indigo-900/60 border-blue-200 dark:border-blue-700';
    } else if (type === 'action' || card.id.startsWith('action_')) {
      return 'bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/60 dark:to-amber-900/60 border-orange-200 dark:border-orange-700';
    } else if (type === 'value' || card.id.startsWith('value_')) {
      return 'bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/60 dark:to-emerald-900/60 border-green-200 dark:border-green-700';
    } else if (type === 'career' || card.id.startsWith('career_')) {
      return 'bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/60 dark:to-violet-900/60 border-purple-200 dark:border-purple-700';
    }
    return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700';
  };

  // 根據卡片類型決定分類顏色
  const getCategoryColor = () => {
    if (type === 'skill' || card.id.startsWith('skill_')) {
      return 'text-blue-600 dark:text-blue-400';
    } else if (type === 'action' || card.id.startsWith('action_')) {
      return 'text-orange-600 dark:text-orange-400';
    } else if (type === 'value' || card.id.startsWith('value_')) {
      return 'text-green-600 dark:text-green-400';
    } else if (type === 'career' || card.id.startsWith('career_')) {
      return 'text-purple-600 dark:text-purple-400';
    }
    return 'text-gray-600 dark:text-gray-400';
  };

  // Get image URLs - use M size for BigCard in sidebar
  const imageUrls =
    typeof card.imageUrl === 'object' && card.imageUrl !== null
      ? 'M' in card.imageUrl
        ? card.imageUrl.M || null // M size
        : 'front' in card.imageUrl
          ? card.imageUrl // Direct { front, back } object
          : null
      : card.imageUrl
        ? { front: card.imageUrl, back: card.imageUrl }
        : null;

  return (
    <div className="relative w-full h-full">
      {/* 背景卡片層 - 創造堆疊效果（3層，向左上平移） */}
      <div
        className={`${getCardBackground()} border-2 rounded-lg shadow-md absolute top-0 left-0 right-0 bottom-0 -translate-x-4 -translate-y-4 opacity-25`}
      />
      <div
        className={`${getCardBackground()} border-2 rounded-lg shadow-lg absolute top-0 left-0 right-0 bottom-0 -translate-x-2 -translate-y-2 opacity-45`}
      />

      {/* 主卡片 */}
      <div
        className={`${getCardBackground()} border-2 rounded-lg shadow-2xl h-full w-full flex flex-col relative z-10 overflow-hidden`}
      >
        {/* 翻轉按鈕 */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsFlipped(!isFlipped);
          }}
          className="absolute bottom-3 left-3 right-3 px-3 py-2 bg-white/30 dark:bg-gray-800/30 backdrop-blur-sm rounded-md flex items-center justify-center gap-2 hover:bg-white/50 dark:hover:bg-gray-700/50 transition-colors z-20 border border-gray-200/30 dark:border-gray-600/30 shadow-sm"
          title="翻轉卡片"
        >
          <RotateCw className="w-4 h-4 text-gray-700 dark:text-gray-200" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">翻轉</span>
        </button>

        {/* 卡片內容 */}
        <div className="flex flex-col h-full overflow-hidden">
          {imageUrls ? (
            // 有圖片時顯示圖片
            <img
              src={isFlipped ? imageUrls.back : imageUrls.front}
              alt={isFlipped ? `${card.title} - 背面` : card.title}
              className="w-full h-full object-contain rounded-lg"
            />
          ) : (
            <div className="p-5 pb-16 flex flex-col h-full">
              {/* 沒有圖片時顯示文字卡片 */}
              {!isFlipped ? (
                // 正面
                <>
                  {/* 分類標籤 */}
                  {card.category && (
                    <div
                      className={`text-sm font-semibold uppercase tracking-wider ${getCategoryColor()} mb-3`}
                    >
                      {card.category}
                    </div>
                  )}
                  {/* 標題 */}
                  <div className="flex-1 flex items-center justify-center px-2">
                    <div className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center break-words leading-relaxed">
                      {card.title}
                    </div>
                  </div>
                  {/* 描述 */}
                  {card.description && (
                    <div className="text-sm text-gray-600 dark:text-gray-300 mt-3 text-center leading-relaxed">
                      {card.description}
                    </div>
                  )}
                </>
              ) : (
                // 背面 - 顯示詳細說明
                <div className="flex flex-col h-full">
                  <div className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3 text-center">
                    詳細說明
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="text-base text-gray-700 dark:text-gray-300 text-center leading-relaxed px-2">
                      {card.description || card.title}
                    </div>
                    {card.category && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
                          分類: <span className={getCategoryColor()}>{card.category}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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
  const [viewMode, setViewMode] = useState<'list' | 'single'>('list'); // 視圖模式
  const [currentCardIndex, setCurrentCardIndex] = useState(0); // 單卡模式當前卡片索引
  const [viewingCard, setViewingCard] = useState<any | null>(null); // 查看大卡的狀態

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
          h-full
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
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                {deck.label}
              </h3>
              <div className="flex items-center gap-2">
                {/* 視圖模式切換 */}
                <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-md p-0.5">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white dark:bg-gray-700 shadow-sm'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    title="列表模式"
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('single');
                      setCurrentCardIndex(0);
                    }}
                    className={`p-1.5 rounded transition-colors ${
                      viewMode === 'single'
                        ? 'bg-white dark:bg-gray-700 shadow-sm'
                        : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                    title="單卡模式"
                  >
                    <Square className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
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
          </div>

          {/* List 模式 */}
          {viewMode === 'list' && (
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              <div
                className="grid gap-2"
                style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
              >
                {deck.cards.map((card) => (
                  <div
                    key={card.id}
                    className="cursor-move"
                    draggable
                    onDragStart={(e) => handleDragStart(e, card.id)}
                    onClick={() => setViewingCard(card)}
                  >
                    <CardItem
                      id={card.id}
                      title={card.title}
                      description={card.description}
                      category={card.category}
                      type={deck.type}
                      imageUrl={card.imageUrl}
                      isDraggable={true}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Single 模式 */}
          {viewMode === 'single' && deck.cards.length > 0 && (
            <div className="flex-1 flex flex-col px-4 pb-4">
              {/* 大卡片顯示 */}
              <div className="h-full flex flex-col items-center justify-center gap-4">
                {/* 當前卡片索引 */}
                <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {currentCardIndex + 1} / {deck.cards.length}
                </div>

                {/* 大卡片 - 直接渲染放大版，添加 padding 以顯示3層堆疊效果（左上方向） */}
                <div
                  className="w-72 flex-shrink-0 cursor-move"
                  style={{ padding: '20px 8px 8px 20px', aspectRatio: '3/4' }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, deck.cards[currentCardIndex].id)}
                >
                  <BigCard card={deck.cards[currentCardIndex]} type={deck.type} />
                </div>

                {/* 切換按鈕 */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setCurrentCardIndex((prev) => Math.max(0, prev - 1))}
                    disabled={currentCardIndex === 0}
                    className="p-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
                    title="上一張"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </button>
                  <button
                    onClick={() =>
                      setCurrentCardIndex((prev) => Math.min(deck.cards.length - 1, prev + 1))
                    }
                    disabled={currentCardIndex === deck.cards.length - 1}
                    className="p-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
                    title="下一張"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* CardModal */}
        <CardModal card={viewingCard} isOpen={!!viewingCard} onClose={() => setViewingCard(null)} />
      </div>
    );
  }

  // 多牌組模式（有Tab）
  return (
    <div
      className={`
        ${isCollapsed ? 'w-12' : width}
        h-full
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
              className="grid w-full bg-gray-100 dark:bg-gray-800 p-1 rounded-lg"
              style={{ gridTemplateColumns: `repeat(${decks.length}, minmax(0, 1fr))` }}
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
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {deck.label}
                    </h3>
                    <div className="flex items-center gap-2">
                      {/* 視圖模式切換 */}
                      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-md p-0.5">
                        <button
                          onClick={() => setViewMode('list')}
                          className={`p-1.5 rounded transition-colors ${
                            viewMode === 'list'
                              ? 'bg-white dark:bg-gray-700 shadow-sm'
                              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                          title="列表模式"
                        >
                          <LayoutGrid className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                        </button>
                        <button
                          onClick={() => {
                            setViewMode('single');
                            setCurrentCardIndex(0);
                          }}
                          className={`p-1.5 rounded transition-colors ${
                            viewMode === 'single'
                              ? 'bg-white dark:bg-gray-700 shadow-sm'
                              : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                          }`}
                          title="單卡模式"
                        >
                          <Square className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
                        </button>
                      </div>
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
                </div>

                {/* List 模式 */}
                {viewMode === 'list' && (
                  <div className="flex-1 overflow-y-auto px-4 pb-4">
                    <div
                      className="grid gap-2"
                      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                    >
                      {deck.cards.map((card) => (
                        <div
                          key={card.id}
                          className="cursor-move"
                          draggable
                          onDragStart={(e) => handleDragStart(e, card.id)}
                          onClick={() => setViewingCard(card)}
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
                )}

                {/* Single 模式 */}
                {viewMode === 'single' && deck.cards.length > 0 && (
                  <div className="flex-1 flex flex-col px-4 pb-4">
                    <div className="h-full flex flex-col items-center justify-center gap-4">
                      <div className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                        {currentCardIndex + 1} / {deck.cards.length}
                      </div>

                      <div
                        className="w-72 flex-shrink-0 cursor-move"
                        style={{ padding: '20px 8px 8px 20px', aspectRatio: '3/4' }}
                        draggable
                        onDragStart={(e) => handleDragStart(e, deck.cards[currentCardIndex].id)}
                      >
                        <BigCard card={deck.cards[currentCardIndex]} type={deck.type} />
                      </div>

                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => setCurrentCardIndex((prev) => Math.max(0, prev - 1))}
                          disabled={currentCardIndex === 0}
                          className="p-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
                          title="上一張"
                        >
                          <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </button>
                        <button
                          onClick={() =>
                            setCurrentCardIndex((prev) => Math.min(deck.cards.length - 1, prev + 1))
                          }
                          disabled={currentCardIndex === deck.cards.length - 1}
                          className="p-2 rounded-lg bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors shadow-sm"
                          title="下一張"
                        >
                          <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* CardModal */}
      <CardModal card={viewingCard} isOpen={!!viewingCard} onClose={() => setViewingCard(null)} />
    </div>
  );
};

export default CardSidebar;
