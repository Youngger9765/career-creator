/**
 * LifeTransformationGame - 生活改造王玩法
 *
 * 使用籌碼系統進行生活各領域的平衡規劃
 * 包含8個生活領域和100個籌碼分配
 */

'use client';

import React, { useState, useEffect } from 'react';
import { TokenManager, TokenAllocation } from '../../token-system/TokenManager';
import TokenControls from '../../token-system/components/TokenControls';
import TokenDisplay from '../../token-system/components/TokenDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import GameInfoBar from '../game-info/GameInfoBar';
import {
  Home,
  Heart,
  Briefcase,
  DollarSign,
  Users,
  BookOpen,
  Gamepad2,
  TrendingUp,
} from 'lucide-react';

interface LifeTransformationGameProps {
  roomId: string;
  isRoomOwner: boolean;
  mode?: string;
}

const LifeTransformationGame: React.FC<LifeTransformationGameProps> = ({
  roomId,
  isRoomOwner,
  mode = 'life_balance',
}) => {
  const [tokenAllocations, setTokenAllocations] = useState<TokenAllocation[]>([]);
  const [tokenManager] = useState(() => new TokenManager());

  // 生活領域配置
  const lifeAreas = [
    { id: 'family', name: '家庭', icon: Home },
    { id: 'love', name: '愛情', icon: Heart },
    { id: 'career', name: '事業', icon: Briefcase },
    { id: 'wealth', name: '財富', icon: DollarSign },
    { id: 'friends', name: '友誼', icon: Users },
    { id: 'growth', name: '成長', icon: BookOpen },
    { id: 'leisure', name: '休閒', icon: Gamepad2 },
    { id: 'health', name: '健康', icon: TrendingUp },
  ];

  // 初始化籌碼分配
  useEffect(() => {
    const initialAllocations = lifeAreas.map((area) => ({
      area: area.id,
      amount: Math.floor(100 / lifeAreas.length), // 初始平均分配
      percentage: Math.floor(100 / lifeAreas.length),
    }));
    setTokenAllocations(initialAllocations);
    // Initialize token manager with areas
    lifeAreas.forEach((area) => {
      tokenManager.setAllocation(area.id, Math.floor(100 / lifeAreas.length));
    });
  }, []);

  // 處理籌碼分配變化
  const handleAllocationChange = (allocations: TokenAllocation[]) => {
    setTokenAllocations(allocations);
    console.log('Token allocations updated:', allocations);
  };

  // 處理籌碼重置
  const handleReset = () => {
    const resetAllocations = lifeAreas.map((area) => ({
      area: area.id,
      amount: Math.floor(100 / lifeAreas.length),
      percentage: Math.floor(100 / lifeAreas.length),
    }));
    setTokenAllocations(resetAllocations);
    tokenManager.reset();
    // Re-initialize with reset allocations
    lifeAreas.forEach((area) => {
      tokenManager.setAllocation(area.id, Math.floor(100 / lifeAreas.length));
    });
  };

  // 處理隨機分配
  const handleRandomize = () => {
    // Generate random allocations that sum to 100
    const randomValues = lifeAreas.map(() => Math.random());
    const sum = randomValues.reduce((a, b) => a + b, 0);
    const randomAllocations = lifeAreas.map((area, index) => ({
      area: area.id,
      amount: Math.floor((randomValues[index] / sum) * 100),
      percentage: Math.floor((randomValues[index] / sum) * 100),
    }));
    setTokenAllocations(randomAllocations);
    // Update token manager
    randomAllocations.forEach((allocation) => {
      tokenManager.setAllocation(allocation.area, allocation.amount);
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* 遊戲資訊欄 */}
      <GameInfoBar
        mode="生活平衡"
        gameplay="生活改造王"
        canvas="籌碼分配畫布"
        deckName="生活領域籌碼"
        totalCards={100}
        availableCards={tokenManager.getRemaining()}
      />

      <div className="flex-1 p-4">
        {/* 標題區 */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">生活改造王 - 人生平衡規劃</CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              分配100個籌碼到8個生活領域，規劃理想的生活平衡
            </p>
          </CardHeader>
        </Card>

        {/* 主要內容區 */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* 左側：籌碼控制區 */}
          <div className="space-y-4">
            <TokenControls
              areas={lifeAreas.map((area) => ({
                id: area.id,
                name: area.name,
                icon: <area.icon className="w-4 h-4" />,
              }))}
              onChange={handleAllocationChange}
            />
          </div>

          {/* 右側：視覺化展示區 */}
          <div className="space-y-4">
            <TokenDisplay allocations={tokenAllocations} title="生活平衡雷達圖" />

            {/* 諮詢紀錄區 */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">諮詢洞察</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded">
                  <p className="text-center text-gray-600 dark:text-gray-400">
                    生活改造王 - 使用籌碼系統進行生活平衡規劃
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LifeTransformationGame;
