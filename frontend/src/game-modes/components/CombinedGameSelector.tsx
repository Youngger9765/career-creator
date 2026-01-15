/**
 * CombinedGameSelector - 統合遊戲選擇器
 *
 * 直接展示所有模式 x 玩法的組合
 * 不需要二階段選擇
 */

'use client';

import React, { useState, useEffect } from 'react';
import { GameModeService, GameMode, Gameplay } from '../services/mode.service';
import { GAMEPLAY_IDS } from '@/constants/game-modes';
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
  ArrowRight,
} from 'lucide-react';

interface GameOption {
  id: string;
  modeId: string;
  modeName: string;
  gameplayId: string;
  gameplayName: string;
  description: string;
  icon: React.ReactNode;
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
    const iconClass = 'w-5 h-5';
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

  // 模式配色 - 使用品牌色
  const getModeStyles = (modeId: string) => {
    switch (modeId) {
      case 'career_traveler':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          text: 'text-blue-700',
          icon: 'bg-blue-500',
          hover: 'hover:border-blue-300 hover:bg-blue-50/80',
          selected: 'border-blue-500 bg-blue-50 ring-2 ring-blue-200',
        };
      case 'skill_inventory':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          text: 'text-amber-700',
          icon: 'bg-amber-500',
          hover: 'hover:border-amber-300 hover:bg-amber-50/80',
          selected: 'border-amber-500 bg-amber-50 ring-2 ring-amber-200',
        };
      case 'value_navigation':
        return {
          bg: 'bg-teal-50',
          border: 'border-teal-200',
          text: 'text-teal-700',
          icon: 'bg-teal-500',
          hover: 'hover:border-teal-300 hover:bg-teal-50/80',
          selected: 'border-teal-500 bg-teal-50 ring-2 ring-teal-200',
        };
      default:
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          icon: 'bg-gray-500',
          hover: 'hover:border-gray-300 hover:bg-gray-50/80',
          selected: 'border-gray-500 bg-gray-50 ring-2 ring-gray-200',
        };
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

  // 將選項按模式分組到三列
  const modeOrder = ['career_traveler', 'skill_inventory', 'value_navigation'];
  const orderedGroups = modeOrder
    .map((modeId) => ({
      modeId,
      group: groupedOptions[modeId],
    }))
    .filter((item) => item.group);

  return (
    <div className={`space-y-8 ${className}`}>
      {/* 標題 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-800">選擇遊戲模式</h2>
        <p className="text-gray-500 mt-2">選擇適合的諮詢工具開始今天的諮詢</p>
      </div>

      {/* Desktop: 三欄式分組顯示 */}
      <div className="hidden md:grid md:grid-cols-3 gap-6">
        {orderedGroups.map(({ modeId, group }) => {
          const styles = getModeStyles(modeId);
          return (
            <div key={modeId} className="space-y-4">
              {/* 模式標題卡片 */}
              <div className={`rounded-xl p-4 ${styles.bg} border ${styles.border}`}>
                <h3 className={`text-lg font-bold ${styles.text}`}>{group.modeName}</h3>
              </div>

              {/* 該模式下的玩法卡片 */}
              <div className="space-y-3">
                {group.options.map((option) => {
                  const isSelected = selectedOption === option.id;
                  const optionStyles = getModeStyles(option.modeId);

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(option)}
                      disabled={disabled}
                      className={`
                        w-full text-left p-4 rounded-xl border-2 transition-all duration-200
                        ${isSelected ? optionStyles.selected : `bg-white border-gray-100 ${optionStyles.hover}`}
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div
                          className={`p-2 rounded-lg text-white flex-shrink-0 ${optionStyles.icon}`}
                        >
                          {option.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-semibold text-gray-800">{option.gameplayName}</h4>
                            {isSelected && (
                              <span
                                className={`text-xs font-medium px-2 py-0.5 rounded-full ${optionStyles.bg} ${optionStyles.text}`}
                              >
                                已選擇
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {option.description}
                          </p>
                        </div>

                        {/* Arrow */}
                        <ArrowRight
                          className={`w-4 h-4 flex-shrink-0 transition-transform ${isSelected ? optionStyles.text : 'text-gray-300'}`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: 列表式選擇 */}
      <div className="md:hidden space-y-6">
        {orderedGroups.map(({ modeId, group }) => {
          const styles = getModeStyles(modeId);
          return (
            <div key={modeId} className="space-y-3">
              {/* 模式標題 */}
              <div className={`rounded-lg px-4 py-3 ${styles.bg} border ${styles.border}`}>
                <h3 className={`font-bold ${styles.text}`}>{group.modeName}</h3>
              </div>

              {/* 該模式下的玩法按鈕 */}
              <div className="space-y-2">
                {group.options.map((option) => {
                  const isSelected = selectedOption === option.id;
                  const optionStyles = getModeStyles(option.modeId);

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(option)}
                      disabled={disabled}
                      className={`
                        w-full p-4 rounded-xl border-2 transition-all text-left
                        ${isSelected ? optionStyles.selected : `bg-white border-gray-100 ${optionStyles.hover}`}
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.99]'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg text-white flex-shrink-0 ${optionStyles.icon}`}
                        >
                          {option.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-800">{option.gameplayName}</h4>
                          <p className="text-sm text-gray-500 line-clamp-1">{option.description}</p>
                        </div>
                        {isSelected && (
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded-full ${optionStyles.bg} ${optionStyles.text}`}
                          >
                            ✓
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CombinedGameSelector;
