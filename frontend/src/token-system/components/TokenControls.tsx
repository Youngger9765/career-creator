/**
 * TokenControls - 籌碼控制互動元件
 * 
 * 提供籌碼分配的互動控制介面
 * 支援滑桿、按鈕、拖曳等操作方式
 */

'use client';

import React, { useState, useEffect } from 'react';
import { TokenManager, TokenAllocation } from '../TokenManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plus, 
  Minus, 
  RotateCcw, 
  Save,
  AlertCircle,
  Sparkles,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface TokenControlsProps {
  areas: Array<{
    id: string;
    name: string;
    icon?: React.ReactNode;
    description?: string;
  }>;
  total?: number;
  initialAllocations?: Map<string, number>;
  onChange?: (allocations: TokenAllocation[]) => void;
  onSave?: (allocations: TokenAllocation[]) => void;
  className?: string;
  showSuggestions?: boolean;
  minPerArea?: number;
  maxPerArea?: number;
}

const TokenControls: React.FC<TokenControlsProps> = ({
  areas,
  total = 100,
  initialAllocations,
  onChange,
  onSave,
  className = '',
  showSuggestions = true,
  minPerArea = 0,
  maxPerArea = 100
}) => {
  const [tokenManager] = useState(() => {
    const manager = new TokenManager(total, { 
      minPerArea, 
      maxPerArea,
      sumEquals: total 
    });
    
    // 初始化區域
    manager.initializeAreas(areas.map(a => a.id));
    
    // 設定初始分配
    if (initialAllocations) {
      initialAllocations.forEach((amount, area) => {
        manager.setAllocation(area, amount);
      });
    }
    
    return manager;
  });

  const [allocations, setAllocations] = useState<TokenAllocation[]>([]);
  const [remaining, setRemaining] = useState(total);
  const [error, setError] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    // 訂閱分配變化
    const unsubscribe = tokenManager.subscribe((newAllocations) => {
      setAllocations(newAllocations);
      setRemaining(tokenManager.getRemaining());
      setIsDirty(true);
      
      if (onChange) {
        onChange(newAllocations);
      }
    });

    // 初始化
    setAllocations(tokenManager.getAllAllocations());
    setRemaining(tokenManager.getRemaining());

    return unsubscribe;
  }, [tokenManager, onChange]);

  const handleSliderChange = (areaId: string, value: number[]) => {
    const success = tokenManager.setAllocation(areaId, value[0]);
    if (!success) {
      setError(`無法分配 ${value[0]} 點到此區域`);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleInputChange = (areaId: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (isNaN(numValue)) return;
    
    const success = tokenManager.setAllocation(areaId, numValue);
    if (!success) {
      setError(`無法分配 ${numValue} 點到此區域`);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleIncrement = (areaId: string, amount: number = 5) => {
    const current = tokenManager.getAllocation(areaId);
    const newValue = Math.min(current + amount, maxPerArea);
    tokenManager.setAllocation(areaId, newValue);
  };

  const handleDecrement = (areaId: string, amount: number = 5) => {
    const current = tokenManager.getAllocation(areaId);
    const newValue = Math.max(current - amount, minPerArea);
    tokenManager.setAllocation(areaId, newValue);
  };

  const handleReset = () => {
    tokenManager.reset();
    setIsDirty(false);
    setError(null);
  };

  const handleDistributeEvenly = () => {
    tokenManager.distributeEvenly(areas.map(a => a.id));
    setIsDirty(true);
  };

  const handleAutoBalance = () => {
    // 自動平衡到總和等於100
    const currentTotal = tokenManager.getAllocatedTotal();
    if (currentTotal === 0) {
      handleDistributeEvenly();
      return;
    }

    const ratio = total / currentTotal;
    const currentAllocations = new Map<string, number>();
    
    areas.forEach(area => {
      const current = tokenManager.getAllocation(area.id);
      if (current > 0) {
        currentAllocations.set(area.id, current * ratio);
      }
    });

    tokenManager.distributeByRatio(currentAllocations);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(allocations);
      setIsDirty(false);
    }
  };

  const getSuggestion = (areaId: string): string => {
    const suggestions: Record<string, string> = {
      family: '建議 15-25 點，維持家庭和諧',
      career: '建議 20-30 點，職涯發展重要',
      health: '建議 15-20 點，健康是基礎',
      wealth: '建議 10-20 點，財務穩定',
      love: '建議 10-15 點，感情需要經營',
      friends: '建議 5-10 點，友誼支持網',
      growth: '建議 10-15 點，持續學習',
      leisure: '建議 5-10 點，適度放鬆'
    };
    return suggestions[areaId] || '';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 頂部狀態列 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center space-x-4">
          <Badge 
            variant={remaining === 0 ? 'default' : 'secondary'}
            className="text-lg px-3 py-1"
          >
            剩餘: {remaining}/{total}
          </Badge>
          
          {remaining === 0 && (
            <Badge variant="outline" className="text-green-600 border-green-600">
              <Sparkles className="w-3 h-3 mr-1" />
              分配完成
            </Badge>
          )}
          
          {isDirty && (
            <Badge variant="outline" className="text-orange-600 border-orange-600">
              未儲存
            </Badge>
          )}
        </div>

        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleDistributeEvenly}
            title="平均分配"
          >
            平均分配
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleAutoBalance}
            title="自動平衡"
          >
            自動平衡
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            title="重置"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          {onSave && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isDirty || remaining !== 0}
            >
              <Save className="w-4 h-4 mr-1" />
              儲存
            </Button>
          )}
        </div>
      </div>

      {/* 錯誤提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 控制區域 */}
      <div className="space-y-4">
        {areas.map((area) => {
          const allocation = allocations.find(a => a.area === area.id);
          const currentValue = allocation?.amount || 0;
          const percentage = allocation?.percentage || 0;
          const suggestion = showSuggestions ? getSuggestion(area.id) : '';

          return (
            <Card key={area.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {area.icon}
                    <div>
                      <CardTitle className="text-base">
                        {area.name}
                      </CardTitle>
                      {area.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {area.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {currentValue}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {percentage.toFixed(0)}%
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                {/* 滑桿控制 */}
                <div className="flex items-center space-x-4">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => handleDecrement(area.id, 5)}
                    disabled={currentValue <= minPerArea}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  
                  <Slider
                    value={[currentValue]}
                    onValueChange={(value) => handleSliderChange(area.id, value)}
                    max={Math.min(maxPerArea, remaining + currentValue)}
                    min={minPerArea}
                    step={1}
                    className="flex-1"
                  />
                  
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => handleIncrement(area.id, 5)}
                    disabled={currentValue >= maxPerArea || remaining === 0}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  
                  <Input
                    type="number"
                    value={currentValue}
                    onChange={(e) => handleInputChange(area.id, e.target.value)}
                    className="w-16 text-center"
                    min={minPerArea}
                    max={maxPerArea}
                  />
                </div>

                {/* 快速調整按鈕 */}
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => handleIncrement(area.id, 10)}
                    disabled={remaining < 10}
                  >
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +10
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => handleIncrement(area.id, 20)}
                    disabled={remaining < 20}
                  >
                    +20
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => handleDecrement(area.id, 10)}
                    disabled={currentValue < 10}
                  >
                    <TrendingDown className="w-3 h-3 mr-1" />
                    -10
                  </Button>
                </div>

                {/* 建議提示 */}
                {suggestion && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                    💡 {suggestion}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 底部提示 */}
      {remaining > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            還有 <span className="font-bold text-orange-600">{remaining}</span> 點能量待分配。
            請將所有能量分配完成。
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default TokenControls;