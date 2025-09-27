/**
 * GrowthPlanningGame - 成長計畫玩法
 *
 * 結合技能卡和行動卡制定成長計畫
 * 包含三個區域：已有技能、欲發展技能、行動計畫
 */

'use client';

import React, { useState, useEffect } from 'react';
import { CardLoaderService } from '@/game-modes/services/card-loader.service';
import GrowthPlanCanvas from '../game-canvases/GrowthPlanCanvas';
import CardItem from '../game-canvases/CardItem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GrowthPlanningGameProps {
  roomId: string;
  isRoomOwner: boolean;
  mode?: string;
  deckType?: string;
}

const GrowthPlanningGame: React.FC<GrowthPlanningGameProps> = ({
  roomId,
  isRoomOwner,
  mode = 'skill',
  deckType = 'skill',
}) => {
  const [skillDeck, setSkillDeck] = useState<any>(null);
  const [actionDeck, setActionDeck] = useState<any>(null);
  const [usedCards, setUsedCards] = useState<Set<string>>(new Set());
  const [selectedCardType, setSelectedCardType] = useState<'skill' | 'action'>('skill');

  // 載入牌組
  useEffect(() => {
    const getDecks = async () => {
      const cardLoader = CardLoaderService;
      const skills = await cardLoader.getDeck('skill');
      const actions = await cardLoader.getDeck('auxiliary_action');
      setSkillDeck(skills);
      setActionDeck(actions);
    };
    getDecks();
  }, []);

  // 處理卡片使用
  const handleCardUse = (cardId: string) => {
    setUsedCards((prev) => new Set(Array.from(prev).concat(cardId)));
  };

  // 處理卡片移除
  const handleCardRemove = (cardId: string) => {
    setUsedCards((prev) => {
      const newSet = new Set(prev);
      newSet.delete(cardId);
      return newSet;
    });
  };

  // 處理計畫建立
  const handlePlanCreate = (cardAId: string, cardBId: string, planText: string) => {
    console.log('計畫建立:', { cardAId, cardBId, planText });
  };

  // 過濾出未使用的卡片
  const availableSkillCards =
    skillDeck?.cards?.filter((card: any) => !usedCards.has(card.id)) || [];
  const availableActionCards =
    actionDeck?.cards?.filter((card: any) => !usedCards.has(card.id)) || [];

  // 合併所有卡片供畫布使用
  const allCards = [...(skillDeck?.cards || []), ...(actionDeck?.cards || [])];

  return (
    <div className="h-full flex">
      {/* 左側卡片區 */}
      <div className="w-64 border-r border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
        <Tabs
          value={selectedCardType}
          onValueChange={(v) => setSelectedCardType(v as 'skill' | 'action')}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="skill">技能卡</TabsTrigger>
            <TabsTrigger value="action">行動卡</TabsTrigger>
          </TabsList>

          <TabsContent value="skill" className="mt-3">
            <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
              技能卡 ({availableSkillCards.length})
            </h3>
            <div className="space-y-2">
              {availableSkillCards.map((card: any) => (
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
          </TabsContent>

          <TabsContent value="action" className="mt-3">
            <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
              行動卡 ({availableActionCards.length})
            </h3>
            <div className="space-y-2">
              {availableActionCards.map((card: any) => (
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
          </TabsContent>
        </Tabs>
      </div>

      {/* 右側畫布區 */}
      <div className="flex-1">
        <GrowthPlanCanvas
          cards={allCards}
          onCardUse={handleCardUse}
          onCardRemove={handleCardRemove}
          onPlanCreate={handlePlanCreate}
        />
      </div>
    </div>
  );
};

export default GrowthPlanningGame;
