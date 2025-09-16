'use client';

import { useState, useEffect } from 'react';
import { Room } from '@/lib/api/rooms';
import { roomsAPI } from '@/lib/api/rooms';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, AlertTriangle } from 'lucide-react';

interface DeleteRoomDialogProps {
  room: Room;
  open: boolean;
  onClose: () => void;
  onSuccess: (roomId: string) => void;
}

export function DeleteRoomDialog({ room, open, onClose, onSuccess }: DeleteRoomDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset error when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setError(null);
    }
  }, [open]);

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);

    try {
      await roomsAPI.deleteRoom(room.id);
      onSuccess(room.id);
      onClose();
    } catch (err: any) {
      setError(`刪除失敗：${err.message || 'Unknown error'}`);
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            確認刪除房間
          </DialogTitle>
          <DialogDescription className="space-y-3 pt-3">
            <p>
              確定要刪除房間「<strong className="text-foreground font-semibold">{room.name}</strong>
              」嗎？
            </p>
            {room.share_code && (
              <p className="text-sm flex items-center gap-2">
                <span className="text-muted-foreground">分享碼:</span>
                <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
                  {room.share_code}
                </code>
              </p>
            )}
            <Alert variant="destructive" className="mt-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>警告：</strong>此操作無法復原，所有相關資料將永久刪除。
              </AlertDescription>
            </Alert>
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <DialogFooter className="sm:justify-between">
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            取消
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? '刪除中...' : '確認刪除'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
