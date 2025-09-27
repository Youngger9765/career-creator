/**
 * GameplaySelector - 玩法選擇器元件
 *
 * 根據選擇的模式顯示可用的玩法選項
 * 支援玩法預覽和詳細說明
 */

'use client';

import React, { useState, useEffect } from 'react';
import { GameModeService, Gameplay } from '../services/mode.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Grid3x3,
  Columns3,
  Layout,
  Layers,
  Maximize2,
  BarChart3,
  Info,
} from 'lucide-react';

interface GameplaySelectorProps {
  modeId: string;
  currentGameplay?: string;
  onGameplaySelect: (gameplayId: string) => void;
  className?: string;
  disabled?: boolean;
  showDescription?: boolean;
}

const GameplaySelector: React.FC<GameplaySelectorProps> = ({
  modeId,
  currentGameplay,
  onGameplaySelect,
  className = '',
  disabled = false,
  showDescription = true,
}) => {
  const [gameplays, setGameplays] = useState<Gameplay[]>([]);
  const [selectedGameplay, setSelectedGameplay] = useState<string | undefined>(currentGameplay);
  const [modeName, setModeName] = useState<string>('');

  useEffect(() => {
    // 載入該模式下的所有玩法
    const mode = GameModeService.getMode(modeId);
    if (mode) {
      setGameplays(mode.gameplays);
      setModeName(mode.name);
    }
  }, [modeId]);

  useEffect(() => {
    setSelectedGameplay(currentGameplay);
  }, [currentGameplay]);

  const handleGameplaySelect = (gameplayId: string) => {
    if (disabled) return;

    setSelectedGameplay(gameplayId);
    onGameplaySelect(gameplayId);
  };

  const getGameplayIcon = (gameplayId: string) => {
    const iconClass = 'w-6 h-6';

    switch (gameplayId) {
      // 職游旅人卡
      case 'personality_analysis':
        return <Columns3 className={iconClass} />;
      case 'career_collector':
        return <Sparkles className={iconClass} />;

      // 職能盤點卡
      case 'advantage_analysis':
        return <Layout className={iconClass} />;
      case 'growth_planning':
        return <Layers className={iconClass} />;
      case 'position_breakdown':
        return <Maximize2 className={iconClass} />;

      // 價值導航卡
      case 'value_ranking':
        return <Grid3x3 className={iconClass} />;
      case 'life_redesign':
        return <BarChart3 className={iconClass} />;

      default:
        return <Info className={iconClass} />;
    }
  };

  const getGameplayFeatures = (gameplayId: string): string[] => {
    switch (gameplayId) {
      case 'personality_analysis':
        return ['RIASEC 性格分析', '職業分類', '三欄式排序'];
      case 'career_collector':
        return ['職業精選', '最多15張', '個人收藏'];
      case 'advantage_analysis':
        return ['優勢識別', '劣勢分析', '各限5張'];
      case 'growth_planning':
        return ['技能盤點', '學習路徑', '目標設定'];
      case 'position_breakdown':
        return ['職位分析', '自由排列', '截圖對照'];
      case 'value_ranking':
        return ['價值排序', '3×3宮格', '優先級設定'];
      case 'life_redesign':
        return ['100點能量', '生活平衡', '籌碼分配'];
      default:
        return [];
    }
  };

  const getGameplayColor = (gameplayId: string) => {
    // 根據模式決定顏色系列
    if (modeId === 'career_traveler') {
      return 'border-blue-200 hover:border-blue-400 dark:border-blue-800 dark:hover:border-blue-600';
    } else if (modeId === 'skill_inventory') {
      return 'border-green-200 hover:border-green-400 dark:border-green-800 dark:hover:border-green-600';
    } else if (modeId === 'value_navigation') {
      return 'border-purple-200 hover:border-purple-400 dark:border-purple-800 dark:hover:border-purple-600';
    }
    return 'border-gray-200 hover:border-gray-400';
  };

  const getGameplayBadgeColor = (gameplayId: string) => {
    if (gameplayId === 'life_redesign') {
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
  };

  if (gameplays.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">請先選擇遊戲模式</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {showDescription && (
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">選擇玩法</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {modeName} - 共有 {gameplays.length} 種玩法
          </p>
        </div>
      )}

      {/* 桌面版：卡片式佈局 */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gameplays.map((gameplay) => {
          const isSelected = selectedGameplay === gameplay.id;
          const features = getGameplayFeatures(gameplay.id);

          return (
            <Card
              key={gameplay.id}
              data-testid={`gameplay-${gameplay.id}`}
              className={`
                cursor-pointer transition-all duration-200
                ${getGameplayColor(gameplay.id)}
                ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500 shadow-md' : ''}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}
              `}
              onClick={() => handleGameplaySelect(gameplay.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                      {getGameplayIcon(gameplay.id)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{gameplay.name}</CardTitle>
                      {gameplay.id === 'life_redesign' && (
                        <Badge className={`mt-1 text-xs ${getGameplayBadgeColor(gameplay.id)}`}>
                          特色玩法
                        </Badge>
                      )}
                    </div>
                  </div>
                  {isSelected && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                {gameplay.description && (
                  <CardDescription className="text-xs mb-3">{gameplay.description}</CardDescription>
                )}

                {/* 特色標籤 */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {features.map((feature, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5
                               text-xs bg-gray-50 dark:bg-gray-900
                               text-gray-600 dark:text-gray-400
                               rounded-full"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                <Button
                  size="sm"
                  variant={isSelected ? 'default' : 'outline'}
                  className="w-full"
                  disabled={disabled}
                >
                  {isSelected ? '已選擇' : '選擇此玩法'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 手機版：列表式佈局 */}
      <div className="md:hidden space-y-2">
        {gameplays.map((gameplay) => {
          const isSelected = selectedGameplay === gameplay.id;

          return (
            <button
              key={gameplay.id}
              className={`
                w-full p-4 rounded-lg border-2 text-left
                transition-all duration-200
                ${getGameplayColor(gameplay.id)}
                ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950 border-blue-500'
                    : 'bg-white dark:bg-gray-900'
                }
                ${disabled ? 'opacity-50' : ''}
              `}
              onClick={() => handleGameplaySelect(gameplay.id)}
              disabled={disabled}
            >
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {getGameplayIcon(gameplay.id)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {gameplay.name}
                    </span>
                    {gameplay.id === 'life_redesign' && (
                      <Badge className={getGameplayBadgeColor(gameplay.id)}>特色</Badge>
                    )}
                  </div>
                  {gameplay.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {gameplay.description}
                    </p>
                  )}
                </div>
                {isSelected && (
                  <div className="text-blue-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default GameplaySelector;
