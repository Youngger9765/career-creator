'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';

interface NotesDrawerProps {
  roomId: string;
  isOpen: boolean;
  onToggle: () => void;
}

export function NotesDrawer({ roomId, isOpen, onToggle }: NotesDrawerProps) {
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Fetch note on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch note
        const noteRes = await apiClient.get(`/api/rooms/${roomId}/notes`);
        setNoteContent(noteRes.data.content || '');
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [roomId, isOpen]);

  // Auto-save with debounce
  useEffect(() => {
    const saveTimer = setTimeout(async () => {
      if (noteContent !== undefined && noteContent !== null) {
        await saveNote();
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(saveTimer);
  }, [noteContent]);

  const saveNote = async () => {
    setIsSaving(true);
    try {
      await apiClient.put(`/api/rooms/${roomId}/notes`, {
        content: noteContent,
      });
      setLastSaved(new Date());
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={onToggle} />}

      {/* Drawer */}
      <div
        className={`
          fixed
          right-0 top-0 bottom-0
          w-80 md:w-96
          bg-white border-l shadow-lg
          transform transition-transform duration-300 ease-in-out
          z-40
          flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900">諮詢筆記</h3>
          <button
            onClick={onToggle}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="收合筆記"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Notes Area */}
        <div className="flex-1 flex flex-col p-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-gray-700">筆記</h4>
            <div className="text-xs text-gray-500">
              {isSaving ? (
                <span className="text-blue-600">儲存中...</span>
              ) : lastSaved ? (
                <span>已儲存 {lastSaved.toLocaleTimeString()}</span>
              ) : null}
            </div>
          </div>
          <textarea
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            placeholder="記錄觀察、計畫、重要資訊..."
            className="flex-1 w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Toggle Button - 桌面版：右側邊緣按鈕，手機版：浮動按鈕 */}
      {!isOpen && (
        <>
          {/* 桌面版：右側邊緣按鈕 */}
          <button
            onClick={onToggle}
            className="hidden md:block fixed right-0 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-3 rounded-l-lg shadow-lg z-30 hover:bg-blue-700 transition-colors"
            title="展開筆記"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          {/* 手機版：浮動按鈕 */}
          <button
            onClick={onToggle}
            className="md:hidden fixed right-4 bottom-20 bg-blue-600 text-white p-4 rounded-full shadow-lg z-30"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          </button>
        </>
      )}
    </>
  );
}
