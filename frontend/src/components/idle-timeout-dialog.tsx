'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Clock } from 'lucide-react';

interface IdleTimeoutDialogProps {
  open: boolean;
  countdown: number;
  onContinue: () => void;
}

export function IdleTimeoutDialog({ open, countdown, onContinue }: IdleTimeoutDialogProps) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-full bg-yellow-100 p-2">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <AlertDialogTitle>閒置偵測</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base">
            由於長時間無操作，系統即將自動存檔並關閉連線。
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 mb-2">{countdown}</div>
            <div className="text-sm text-gray-500">秒後自動關閉</div>
          </div>
        </div>

        <AlertDialogFooter>
          <AlertDialogAction onClick={onContinue} className="w-full">
            繼續使用
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
