/**
 * Game Session Panel Component
 * 遊戲會話控制面板
 */

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useGameSessionStore } from '@/stores/game-session-store';
import { GameRuleSelector } from './GameRuleSelector';
import { GameStatusBadge } from './GameStatusBadge';
import { GameStatus } from '@/lib/api/game-sessions';
import { Loader2, Play, CheckCircle, Plus, AlertCircle } from 'lucide-react';

interface GameSessionPanelProps {
  roomId: string;
  isCounselor: boolean;
}

export function GameSessionPanel({ roomId, isCounselor }: GameSessionPanelProps) {
  const [showRuleSelector, setShowRuleSelector] = useState(false);
  const [selectedRuleId, setSelectedRuleId] = useState<string>('');

  const {
    currentSession,
    currentRule,
    availableRules,
    isLoading,
    error,
    loadAvailableRules,
    loadActiveSession,
    createSession,
    startSession,
    completeSession,
    clearError,
  } = useGameSessionStore();

  // Load active session and available rules on mount
  useEffect(() => {
    loadActiveSession(roomId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]); // Only reload when roomId changes

  // Load available rules once when counselor
  useEffect(() => {
    if (isCounselor) {
      loadAvailableRules();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only load once on mount

  const handleCreateSession = async () => {
    if (!selectedRuleId) {
      return;
    }

    try {
      await createSession(roomId, selectedRuleId);
      setShowRuleSelector(false);
      setSelectedRuleId('');
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleStartSession = async () => {
    await startSession();
  };

  const handleCompleteSession = async () => {
    if (confirm('確定要結束此遊戲會話嗎？')) {
      await completeSession();
    }
  };

  // If no session exists and user is counselor, show create button
  if (!currentSession && isCounselor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>遊戲會話</CardTitle>
          <CardDescription>開始一個新的卡牌諮商會話</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Dialog open={showRuleSelector} onOpenChange={setShowRuleSelector}>
            <DialogTrigger asChild>
              <Button className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                創建遊戲會話
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>選擇遊戲規則</DialogTitle>
                <DialogDescription>選擇適合的卡牌類型開始諮商會話</DialogDescription>
              </DialogHeader>

              <div className="mt-6">
                <GameRuleSelector
                  rules={availableRules}
                  selectedRuleId={selectedRuleId}
                  onSelect={setSelectedRuleId}
                  disabled={isLoading}
                />
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowRuleSelector(false)}
                  disabled={isLoading}
                >
                  取消
                </Button>
                <Button onClick={handleCreateSession} disabled={!selectedRuleId || isLoading}>
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  創建會話
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  // If no session and user is visitor, show waiting message
  if (!currentSession && !isCounselor) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>等待遊戲開始</CardTitle>
          <CardDescription>諮商師尚未開始遊戲會話</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
            請等待諮商師創建遊戲會話...
          </div>
        </CardContent>
      </Card>
    );
  }

  // If session exists, show session info and controls
  if (currentSession) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{currentRule?.name || '遊戲會話'}</CardTitle>
              <CardDescription className="mt-2">
                {currentRule?.description || '進行中的卡牌諮商會話'}
              </CardDescription>
            </div>
            <GameStatusBadge status={currentSession.status} size="lg" />
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Session Info */}
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">規則版本</span>
              <span>v{currentRule?.version}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">區域數量</span>
              <span>{currentRule?.layout_config.drop_zones.length} 個</span>
            </div>
            {currentSession.started_at && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">開始時間</span>
                <span>{new Date(currentSession.started_at).toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {isCounselor && (
            <div className="space-y-3">
              {currentSession.status === GameStatus.WAITING && (
                <Button className="w-full" onClick={handleStartSession} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="mr-2 h-4 w-4" />
                  )}
                  開始遊戲
                </Button>
              )}

              {currentSession.status === GameStatus.IN_PROGRESS && (
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={handleCompleteSession}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  結束遊戲
                </Button>
              )}

              {currentSession.status === GameStatus.COMPLETED && (
                <div className="text-center py-4 text-muted-foreground">遊戲已結束</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
}
