/**
 * Room Statistics Card Component
 * 諮詢室統計資料卡片元件
 */
'use client';

import React from 'react';
import { RoomStatistics } from '@/types/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, BarChart3, Users, Activity, Clock } from 'lucide-react';

interface RoomStatisticsCardProps {
  roomId: string;
  isLoading: boolean;
  statistics: RoomStatistics | null;
  error: string | null;
}

export function RoomStatisticsCard({
  roomId,
  isLoading,
  statistics,
  error,
}: RoomStatisticsCardProps) {
  // Loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            諮詢室統計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">載入統計資料中...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            諮詢室統計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              <div className="font-medium">無法載入統計資料</div>
              <div className="text-sm text-muted-foreground mt-1">{error}</div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Empty state
  if (!statistics || statistics.total_events === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            諮詢室統計
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>尚無活動記錄</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Format last activity time
  const formatLastActivity = (lastActivity?: string) => {
    if (!lastActivity) return '無';

    const date = new Date(lastActivity);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return `${diffMinutes} 分鐘前`;
    } else if (diffHours < 24) {
      return `${diffHours} 小時前`;
    } else {
      return date.toLocaleDateString('zh-TW');
    }
  };

  // Event type labels
  const eventTypeLabels: Record<string, string> = {
    CARD_FLIPPED: '翻牌次數',
    CARD_MOVED: '移動次數',
    CARD_SELECTED: '選擇次數',
    NOTES_ADDED: '筆記次數',
    INSIGHT_RECORDED: '洞察次數',
    CARD_DEALT: '發牌次數',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          諮詢室統計
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Activity className="h-5 w-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{statistics.total_events}</div>
            <div className="text-sm text-muted-foreground">總互動次數</div>
          </div>

          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-5 w-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{statistics.unique_visitors}</div>
            <div className="text-sm text-muted-foreground">不重複訪客</div>
          </div>
        </div>

        {/* Last Activity */}
        {statistics.last_activity && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>最後活動時間: {formatLastActivity(statistics.last_activity)}</span>
          </div>
        )}

        {/* Event Breakdown */}
        {Object.keys(statistics.event_breakdown).length > 0 && (
          <div>
            <h4 className="font-medium mb-3">活動明細</h4>
            <div className="space-y-2">
              {Object.entries(statistics.event_breakdown)
                .sort(([, a], [, b]) => b - a) // Sort by count descending
                .map(([eventType, count]) => (
                  <div key={eventType} className="flex justify-between items-center">
                    <span className="text-sm">{eventTypeLabels[eventType] || eventType}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
