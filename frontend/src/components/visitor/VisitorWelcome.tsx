'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Heart, Shield } from 'lucide-react';

interface VisitorWelcomeProps {
  isOpen: boolean;
  roomName?: string;
  onComplete: (visitorName: string) => void;
  onCancel: () => void;
}

export function VisitorWelcome({ isOpen, roomName, onComplete, onCancel }: VisitorWelcomeProps) {
  const [visitorName, setVisitorName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!visitorName.trim()) return;

    setIsSubmitting(true);
    try {
      onComplete(visitorName.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && visitorName.trim()) {
      handleSubmit();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            歡迎參與諮詢
          </DialogTitle>
          <DialogDescription className="text-left">
            {roomName && (
              <div className="mb-3">
                您即將進入「<span className="font-semibold text-gray-700">{roomName}</span>」諮詢室
              </div>
            )}
            為了更好的互動體驗，請告訴我們您的稱呼
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="visitor-name" className="text-right">
              稱呼
            </Label>
            <Input
              id="visitor-name"
              placeholder="您的稱呼（例如：小王、Alice）"
              className="col-span-3"
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              onKeyDown={handleKeyDown}
              maxLength={20}
              autoFocus
            />
          </div>

          {/* 隱私提醒 */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <div className="font-medium mb-1">隱私保護</div>
                <ul className="text-xs space-y-1 text-blue-600">
                  <li>• 您的稱呼僅用於此次諮詢</li>
                  <li>• 不會儲存個人敏感資訊</li>
                  <li>• 諮詢結束後可隨時離開</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 諮詢說明 */}
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Heart className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-green-700">
                <div className="font-medium mb-1">諮詢體驗</div>
                <ul className="text-xs space-y-1 text-green-600">
                  <li>• 透過牌卡探索職涯方向</li>
                  <li>• 專業諮詢師將引導您</li>
                  <li>• 輕鬆互動，無壓力環境</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            暫不參與
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!visitorName.trim() || isSubmitting}
            className="min-w-[80px]"
          >
            {isSubmitting ? '進入中...' : '開始諮詢'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
