/**
 * CombinedGameSelector - 統合遊戲選擇器
 *
 * 直接展示所有模式 x 玩法的組合
 * 不需要二階段選擇
 */

'use client';

import React, { useState, useEffect } from 'react';
import { GameModeService, GameMode, Gameplay } from '../services/mode.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  BarChart,
  Target,
  Sparkles,
  TrendingUp,
  Grid3X3,
  Briefcase,
  Layers,
  Navigation,
  RefreshCcw,
} from 'lucide-react';

interface GameOption {
  id: string;
  modeId: string;
  modeName: string;
  gameplayId: string;
  gameplayName: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
}

interface CombinedGameSelectorProps {
  onGameSelect: (modeId: string, gameplayId: string) => void;
  currentMode?: string;
  currentGameplay?: string;
  className?: string;
  disabled?: boolean;
}

const CombinedGameSelector: React.FC<CombinedGameSelectorProps> = ({
  onGameSelect,
  currentMode,
  currentGameplay,
  className = '',
  disabled = false,
}) => {
  const [gameOptions, setGameOptions] = useState<GameOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  useEffect(() => {
    // 載入所有遊戲模式和玩法組合
    const modes = GameModeService.getAllModes();
    const options: GameOption[] = [];

    modes.forEach((mode) => {
      mode.gameplays.forEach((gameplay) => {
        options.push({
          id: `${mode.id}_${gameplay.id}`,
          modeId: mode.id,
          modeName: mode.name,
          gameplayId: gameplay.id,
          gameplayName: gameplay.name,
          description: gameplay.description || '',
          icon: getGameplayIcon(gameplay.id),
          color: getModeColor(mode.id),
          gradient: getModeGradient(mode.id),
        });
      });
    });

    setGameOptions(options);

    // 設置當前選擇的選項
    if (currentMode && currentGameplay) {
      setSelectedOption(`${currentMode}_${currentGameplay}`);
    }
  }, [currentMode, currentGameplay]);

  const getGameplayIcon = (gameplayId: string) => {
    const iconClass = 'w-6 h-6';
    switch (gameplayId) {
      case 'personality_analysis':
        return <Sparkles className={iconClass} />;
      case 'advantage_analysis':
        return <TrendingUp className={iconClass} />;
      case 'value_ranking':
        return <Grid3X3 className={iconClass} />;
      case 'career_collector':
        return <Briefcase className={iconClass} />;
      case 'growth_planning':
        return <Layers className={iconClass} />;
      case 'position_breakdown':
        return <Navigation className={iconClass} />;
      case 'life_redesign':
        return <RefreshCcw className={iconClass} />;
      default:
        return <BarChart className={iconClass} />;
    }
  };

  const getModeColor = (modeId: string) => {
    switch (modeId) {
      case 'career_traveler':
        return 'bg-purple-500';
      case 'skill_inventory':
        return 'bg-blue-500';
      case 'value_navigation':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getModeGradient = (modeId: string) => {
    switch (modeId) {
      case 'career_traveler':
        return 'from-purple-400 to-purple-600';
      case 'skill_inventory':
        return 'from-blue-400 to-blue-600';
      case 'value_navigation':
        return 'from-green-400 to-green-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  const handleOptionSelect = (option: GameOption) => {
    if (disabled) return;
    setSelectedOption(option.id);
    onGameSelect(option.modeId, option.gameplayId);
  };

  // 按模式分組
  const groupedOptions = gameOptions.reduce(
    (acc, option) => {
      if (!acc[option.modeId]) {
        acc[option.modeId] = {
          modeName: option.modeName,
          options: [],
        };
      }
      acc[option.modeId].options.push(option);
      return acc;
    },
    {} as Record<string, { modeName: string; options: GameOption[] }>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">選擇遊戲模式</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">選擇適合的諮詢工具和玩法</p>
      </div>

      {/* 分組顯示 */}
      {Object.entries(groupedOptions).map(([modeId, group]) => (
        <div key={modeId} className="space-y-2">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 px-1">
            {group.modeName}
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-2">
            {group.options.map((option) => {
              const isSelected = selectedOption === option.id;
              const isHovered = hoveredOption === option.id;

              return (
                <Card
                  key={option.id}
                  className={`
                    relative cursor-pointer transition-all duration-200
                    ${isSelected ? 'ring-2 ring-offset-1 ring-blue-500 shadow-md' : ''}
                    ${isHovered ? 'transform -translate-y-0.5 shadow-sm' : ''}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md'}
                  `}
                  onMouseEnter={() => setHoveredOption(option.id)}
                  onMouseLeave={() => setHoveredOption(null)}
                  onClick={() => handleOptionSelect(option)}
                >
                  {/* 頂部彩色條 */}
                  <div className={`h-1 w-full bg-gradient-to-r rounded-t-lg ${option.gradient}`} />

                  <CardHeader className="pb-2 pt-3 px-3">
                    <div className="flex items-start justify-between mb-1">
                      <div className={`p-1.5 rounded-md text-white ${option.color}`}>
                        {React.cloneElement(option.icon as React.ReactElement, {
                          className: 'w-4 h-4',
                        })}
                      </div>
                      {isSelected && (
                        <Badge variant="default" className="bg-blue-500 text-[10px] px-1 py-0">
                          選中
                        </Badge>
                      )}
                    </div>

                    <CardTitle className="text-sm font-medium">{option.gameplayName}</CardTitle>
                  </CardHeader>

                  <CardContent className="pt-0 px-3 pb-3">
                    <CardDescription className="text-[10px] leading-relaxed line-clamp-2 min-h-[2rem] mb-2">
                      {option.description}
                    </CardDescription>

                    <Button
                      className={`
                        w-full text-[10px] h-6
                        ${
                          isSelected
                            ? 'bg-blue-500 hover:bg-blue-600 text-white'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-300'
                        }
                      `}
                      disabled={disabled}
                      variant={isSelected ? 'default' : 'outline'}
                      size="sm"
                    >
                      {isSelected ? '已選擇' : '選擇'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* 行動裝置快速選擇 */}
      <div className="block md:hidden space-y-2 pt-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 px-1 mb-2">快速選擇：</p>
        <div className="space-y-2">
          {gameOptions.map((option) => (
            <Button
              key={option.id}
              variant={selectedOption === option.id ? 'default' : 'outline'}
              className="w-full justify-start text-left"
              onClick={() => handleOptionSelect(option)}
              disabled={disabled}
            >
              <div className="flex items-center gap-2">
                {option.icon}
                <div>
                  <div className="font-medium">{option.gameplayName}</div>
                  <div className="text-xs text-gray-500">{option.modeName}</div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CombinedGameSelector;
