/**
 * ModeSelector - 遊戲模式選擇器元件
 *
 * 提供三大遊戲模式的選擇介面
 * 支援視覺化預覽和描述
 */

'use client';

import React, { useState, useEffect } from 'react';
import { GameModeService, GameMode } from '../services/mode.service';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users, // 職游旅人卡
  BarChart, // 職能盤點卡
  Target, // 價值導航卡
} from 'lucide-react';

interface ModeSelectorProps {
  currentMode?: string;
  onModeSelect: (modeId: string) => void;
  className?: string;
  disabled?: boolean;
}

const ModeSelector: React.FC<ModeSelectorProps> = ({
  currentMode,
  onModeSelect,
  className = '',
  disabled = false,
}) => {
  const [modes, setModes] = useState<GameMode[]>([]);
  const [selectedMode, setSelectedMode] = useState<string | undefined>(currentMode);
  const [hoveredMode, setHoveredMode] = useState<string | null>(null);

  useEffect(() => {
    // 載入所有遊戲模式
    const allModes = GameModeService.getAllModes();
    setModes(allModes);
  }, []);

  useEffect(() => {
    setSelectedMode(currentMode);
  }, [currentMode]);

  const handleModeSelect = (modeId: string) => {
    if (disabled) return;

    setSelectedMode(modeId);
    onModeSelect(modeId);
  };

  const getModeIcon = (modeId: string) => {
    switch (modeId) {
      case 'career_traveler':
        return <Users className="w-8 h-8" />;
      case 'skill_inventory':
        return <BarChart className="w-8 h-8" />;
      case 'value_navigation':
        return <Target className="w-8 h-8" />;
      default:
        return null;
    }
  };

  const getModeColor = (modeId: string) => {
    switch (modeId) {
      case 'career_traveler':
        return 'bg-blue-500';
      case 'skill_inventory':
        return 'bg-green-500';
      case 'value_navigation':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getModeGradient = (modeId: string) => {
    switch (modeId) {
      case 'career_traveler':
        return 'from-blue-400 to-blue-600';
      case 'skill_inventory':
        return 'from-green-400 to-green-600';
      case 'value_navigation':
        return 'from-purple-400 to-purple-600';
      default:
        return 'from-gray-400 to-gray-600';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">選擇遊戲模式</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2">請選擇一個適合的諮詢工具開始</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {modes.map((mode) => {
          const isSelected = selectedMode === mode.id;
          const isHovered = hoveredMode === mode.id;

          return (
            <Card
              key={mode.id}
              data-testid={`mode-${mode.id}`}
              className={`
                relative cursor-pointer transition-all duration-300
                ${isSelected ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                ${isHovered ? 'transform -translate-y-1 shadow-lg' : ''}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onMouseEnter={() => setHoveredMode(mode.id)}
              onMouseLeave={() => setHoveredMode(null)}
              onClick={() => handleModeSelect(mode.id)}
            >
              {/* 頂部彩色條 */}
              <div
                className={`
                  h-2 w-full bg-gradient-to-r rounded-t-lg
                  ${getModeGradient(mode.id)}
                `}
              />

              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div
                    className={`
                    p-3 rounded-lg text-white
                    ${getModeColor(mode.id)}
                  `}
                  >
                    {getModeIcon(mode.id)}
                  </div>

                  {isSelected && (
                    <Badge variant="default" className="bg-blue-500">
                      已選擇
                    </Badge>
                  )}
                </div>

                <CardTitle className="mt-4 text-lg">{mode.name}</CardTitle>

                <CardDescription className="text-sm mt-2">{mode.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">可用玩法</span>
                    <Badge variant="secondary">{mode.gameplays.length} 種</Badge>
                  </div>

                  {/* 顯示玩法列表 */}
                  <div className="pt-2 space-y-1">
                    {mode.gameplays.slice(0, 2).map((gameplay) => (
                      <div
                        key={gameplay.id}
                        className="text-xs text-gray-600 dark:text-gray-400
                                   flex items-center"
                      >
                        <span
                          className="w-1.5 h-1.5 bg-gray-400
                                       rounded-full mr-2"
                        />
                        {gameplay.name}
                      </div>
                    ))}
                    {mode.gameplays.length > 2 && (
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        還有 {mode.gameplays.length - 2} 種玩法...
                      </div>
                    )}
                  </div>
                </div>

                {/* 選擇按鈕 */}
                <Button
                  className={`
                    w-full mt-4 transition-all
                    ${
                      isSelected
                        ? 'bg-blue-500 hover:bg-blue-600'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }
                  `}
                  disabled={disabled}
                  variant={isSelected ? 'default' : 'outline'}
                >
                  {isSelected ? '已選擇此模式' : '選擇此模式'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 快速切換按鈕（行動裝置） */}
      <div className="flex md:hidden gap-2 mt-6 overflow-x-auto pb-2">
        {modes.map((mode) => (
          <Button
            key={mode.id}
            variant={selectedMode === mode.id ? 'default' : 'outline'}
            size="sm"
            className="flex-shrink-0"
            onClick={() => handleModeSelect(mode.id)}
            disabled={disabled}
          >
            {mode.name}
          </Button>
        ))}
      </div>
    </div>
  );
};

export default ModeSelector;
