/**
 * Game Rule Selector Component
 * 遊戲規則選擇器組件
 */

import React from 'react';
import { GameRule } from '@/lib/api/game-rules';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Target, Compass } from 'lucide-react';

interface GameRuleSelectorProps {
  rules: GameRule[];
  selectedRuleId?: string;
  onSelect: (ruleId: string) => void;
  disabled?: boolean;
}

const ruleIcons: Record<string, React.ReactNode> = {
  skill_assessment: <Target className="w-6 h-6" />,
  value_navigation: <Compass className="w-6 h-6" />,
  career_personality: <Users className="w-6 h-6" />,
};

const ruleDescriptions: Record<string, string> = {
  skill_assessment: '評估個人優勢與劣勢，每個區域最多放置5張卡片',
  value_navigation: '排列9張價值觀卡片，建立個人價值觀優先順序',
  career_personality: '探索職業性格，分類卡片到喜歡、中立、討厭三個區域',
};

export function GameRuleSelector({
  rules,
  selectedRuleId,
  onSelect,
  disabled = false,
}: GameRuleSelectorProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {rules.map((rule) => (
        <Card
          key={rule.id}
          className={`cursor-pointer transition-all hover:shadow-lg ${
            selectedRuleId === rule.id ? 'ring-2 ring-primary bg-primary/5' : ''
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !disabled && onSelect(rule.id)}
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {ruleIcons[rule.slug] || <Target className="w-6 h-6" />}
                <CardTitle className="text-lg">{rule.name}</CardTitle>
              </div>
              {selectedRuleId === rule.id && <Badge variant="default">已選擇</Badge>}
            </div>
          </CardHeader>
          <CardContent>
            <CardDescription>
              {ruleDescriptions[rule.slug] || rule.description || '探索你的職涯可能性'}
            </CardDescription>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline">{rule.layout_config.drop_zones.length} 個區域</Badge>
              {rule.constraint_config.total_limit && (
                <Badge variant="outline">限制 {rule.constraint_config.total_limit} 張卡片</Badge>
              )}
              <Badge variant="secondary">v{rule.version}</Badge>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
