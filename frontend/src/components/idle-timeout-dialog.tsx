'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Clock } from 'lucide-react';

interface IdleTimeoutDialogProps {
  open: boolean;
  countdown: number;
  onContinue: () => void;
}

export function IdleTimeoutDialog({ open, countdown, onContinue }: IdleTimeoutDialogProps) {
  return (
    <Dialog open={open}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-yellow-100 p-2">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <DialogTitle>閒置偵測</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            由於長時間無操作，系統即將自動存檔並關閉連線。
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 mb-2">{countdown}</div>
            <div className="text-sm text-gray-500">秒後自動關閉</div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onContinue} className="w-full">
            繼續使用
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
