'use client';

import { useState } from 'react';
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
import { AlertCircle } from 'lucide-react';

interface EditRoomDialogProps {
  room: Room;
  open: boolean;
  onClose: () => void;
  onSuccess: (updatedRoom: Room) => void;
}

export function EditRoomDialog({ room, open, onClose, onSuccess }: EditRoomDialogProps) {
  const [name, setName] = useState(room.name);
  const [description, setDescription] = useState(room.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!name.trim()) {
      setError('房間名稱不能為空');
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedRoom = await roomsAPI.updateRoom(room.id, {
        name: name.trim(),
        description: description.trim() || undefined,
      });

      onSuccess(updatedRoom);
      onClose();
    } catch (err: any) {
      setError(`更新失敗：${err.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>編輯房間</DialogTitle>
          <DialogDescription>修改房間的名稱和描述</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="room-name"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              房間名稱 <span className="text-red-500">*</span>
            </label>
            <input
              id="room-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 100))}
              maxLength={100}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="房間名稱"
              placeholder="輸入房間名稱"
            />
            <p className="text-xs text-muted-foreground">{name.length}/100 字</p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="room-description"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              房間描述
            </label>
            <textarea
              id="room-description"
              value={description}
              onChange={(e) => setDescription(e.target.value.slice(0, 500))}
              maxLength={500}
              rows={3}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              aria-label="房間描述"
              placeholder="輸入房間描述（選填）"
            />
            <p className="text-xs text-muted-foreground">{description.length}/500 字</p>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              取消
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '儲存中...' : '儲存變更'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
