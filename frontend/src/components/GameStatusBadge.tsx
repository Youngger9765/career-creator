/**
 * Game Status Badge Component
 * 遊戲狀態標籤組件
 */

import React from 'react';
import { GameStatus } from '@/lib/api/game-sessions';
import { Badge } from '@/components/ui/badge';
import { Clock, Play, CheckCircle, XCircle } from 'lucide-react';

interface GameStatusBadgeProps {
  status: GameStatus;
  size?: 'default' | 'lg';
  showIcon?: boolean;
}

const statusConfig = {
  [GameStatus.WAITING]: {
    label: '等待中',
    variant: 'secondary' as const,
    icon: Clock,
    className: 'bg-gray-100 text-gray-700 border-gray-300',
  },
  [GameStatus.IN_PROGRESS]: {
    label: '進行中',
    variant: 'default' as const,
    icon: Play,
    className: 'bg-blue-100 text-blue-700 border-blue-300',
  },
  [GameStatus.COMPLETED]: {
    label: '已完成',
    variant: 'default' as const,
    icon: CheckCircle,
    className: 'bg-green-100 text-green-700 border-green-300',
  },
  [GameStatus.CANCELLED]: {
    label: '已取消',
    variant: 'destructive' as const,
    icon: XCircle,
    className: 'bg-red-100 text-red-700 border-red-300',
  },
};

export function GameStatusBadge({ 
  status, 
  size = 'default',
  showIcon = true 
}: GameStatusBadgeProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${
        size === 'lg' ? 'text-base px-4 py-2' : ''
      }`}
    >
      {showIcon && <Icon className={`${size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} mr-1`} />}
      {config.label}
    </Badge>
  );
}