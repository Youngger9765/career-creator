/**
 * CombinedGameSelector - 統合遊戲選擇器
 *
 * 直接展示所有模式 x 玩法的組合
 * 參考 navicareer-design-system.md 設計
 */

'use client';

import React, { useState, useEffect } from 'react';
import { GameModeService } from '../services/mode.service';
import { GAMEPLAY_IDS } from '@/constants/game-modes';
import {
  Sparkles,
  TrendingUp,
  Grid3X3,
  Briefcase,
  Layers,
  Navigation,
  RefreshCcw,
  BarChart,
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

  // 模式配色 - 參考 navicareer-design-system.md
  // 品牌金 #FFCC3A、職游青 #7AB7B7、深海藍 #0056A7
  const getModeStyles = (modeId: string) => {
    switch (modeId) {
      case 'career_traveler':
        // 深海藍系
        return {
          headerBg: 'bg-[#0056A7]',
          headerText: 'text-white',
          iconBg: 'bg-[#0056A7]',
          selectedBorder: 'border-[#0056A7]',
          selectedRing: 'ring-[#0056A7]/20',
        };
      case 'skill_inventory':
        // 品牌金系
        return {
          headerBg: 'bg-[#FFCC3A]',
          headerText: 'text-gray-900',
          iconBg: 'bg-[#FFCC3A]',
          selectedBorder: 'border-[#FFCC3A]',
          selectedRing: 'ring-[#FFCC3A]/20',
        };
      case 'value_navigation':
        // 職游青系
        return {
          headerBg: 'bg-[#7AB7B7]',
          headerText: 'text-white',
          iconBg: 'bg-[#7AB7B7]',
          selectedBorder: 'border-[#7AB7B7]',
          selectedRing: 'ring-[#7AB7B7]/20',
        };
      default:
        return {
          headerBg: 'bg-gray-500',
          headerText: 'text-white',
          iconBg: 'bg-gray-500',
          selectedBorder: 'border-gray-500',
          selectedRing: 'ring-gray-500/20',
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
      <div className="text-center space-y-2">
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900">選擇遊戲模式</h2>
        <p className="text-gray-500">選擇適合的諮詢工具開始今天的諮詢</p>
      </div>

      {/* Desktop: 三欄式 */}
      <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8">
        {orderedGroups.map(({ modeId, group }) => {
          const styles = getModeStyles(modeId);
          return (
            <div key={modeId} className="space-y-4">
              {/* 模式標題 - 全圓角標籤 */}
              <div
                className={`rounded-full px-6 py-3 text-center ${styles.headerBg} ${styles.headerText}`}
              >
                <h3 className="font-bold text-lg">{group.modeName}</h3>
              </div>

              {/* 玩法卡片 */}
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
                        w-full text-left p-5 rounded-2xl border-2 transition-all duration-300
                        bg-white shadow-sm hover:shadow-lg hover:-translate-y-1
                        ${
                          isSelected
                            ? `${optionStyles.selectedBorder} ring-4 ${optionStyles.selectedRing}`
                            : 'border-gray-100 hover:border-gray-200'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div
                          className={`p-2.5 rounded-xl text-white flex-shrink-0 ${optionStyles.iconBg}`}
                        >
                          {option.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900 text-base mb-1">
                            {option.gameplayName}
                          </h4>
                          <p className="text-sm text-gray-500 leading-relaxed">
                            {option.description}
                          </p>
                        </div>
                      </div>

                      {/* 選擇按鈕 - 黑色全圓角 */}
                      <div className="mt-4">
                        <span
                          className={`
                            inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all
                            ${
                              isSelected
                                ? 'bg-black text-white'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }
                          `}
                        >
                          {isSelected ? '已選擇' : '選擇此玩法'}
                          <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Mobile: 列表式 */}
      <div className="md:hidden space-y-6">
        {orderedGroups.map(({ modeId, group }) => {
          const styles = getModeStyles(modeId);
          return (
            <div key={modeId} className="space-y-3">
              {/* 模式標題 */}
              <div className={`rounded-full px-5 py-2.5 ${styles.headerBg} ${styles.headerText}`}>
                <h3 className="font-bold text-center">{group.modeName}</h3>
              </div>

              {/* 玩法按鈕 */}
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
                        w-full p-4 rounded-2xl border-2 transition-all text-left bg-white
                        ${
                          isSelected
                            ? `${optionStyles.selectedBorder} ring-4 ${optionStyles.selectedRing}`
                            : 'border-gray-100'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.99]'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-xl text-white flex-shrink-0 ${optionStyles.iconBg}`}
                        >
                          {option.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-gray-900">{option.gameplayName}</h4>
                          <p className="text-sm text-gray-500 line-clamp-1">{option.description}</p>
                        </div>
                        {isSelected && (
                          <span className="px-3 py-1 rounded-full bg-black text-white text-xs font-semibold">
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
