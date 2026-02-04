'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { consultationRecordsAPI } from '@/lib/api/clients';
import { Camera } from 'lucide-react';
import type { ConsultationRecord } from '@/types/client';
import { GAMEPLAY_NAMES } from '@/constants/game-modes';

interface NotesDrawerProps {
  roomId: string;
  clientId?: string;
  currentGameplay?: string; // Current gameplay ID for filtering
  isOpen: boolean;
  onToggle: () => void;
  onCaptureScreenshot?: (notes: string) => void;
  onScreenshotSuccess?: () => void; // Callback after screenshot saved
  isCapturingScreenshot?: boolean;
  screenshotMessage?: {
    type: 'success' | 'error';
    text: string;
  } | null;
}

export function NotesDrawer({
  roomId,
  clientId,
  currentGameplay,
  isOpen,
  onToggle,
  onCaptureScreenshot,
  onScreenshotSuccess,
  isCapturingScreenshot,
  screenshotMessage,
}: NotesDrawerProps) {
  const [noteContent, setNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [consultationRecords, setConsultationRecords] = useState<ConsultationRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<ConsultationRecord | null>(null); // For modal
  const [newRecordId, setNewRecordId] = useState<string | null>(null); // Track newly added record for animation
  const [historyExpanded, setHistoryExpanded] = useState(true); // Control history section expansion

  // Fetch note and consultation records on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch note
        const noteRes = await apiClient.get(`/api/rooms/${roomId}/notes`);
        setNoteContent(noteRes.data.content || '');

        // Fetch consultation records if clientId is available
        if (clientId) {
          setRecordsLoading(true);
          const records = await consultationRecordsAPI.getClientRecords(clientId);

          console.log('[NotesDrawer] Current gameplay:', currentGameplay);
          console.log(
            '[NotesDrawer] All records:',
            records.map((r) => ({
              id: r.id,
              gameplay: r.game_state?.gameplay,
              screenshots: r.screenshots.length,
            }))
          );

          // Filter records by current gameplay and sort by date descending
          const filtered = records
            .filter((r) => r.game_state?.gameplay === currentGameplay && r.screenshots.length > 0)
            .sort(
              (a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime()
            );

          console.log('[NotesDrawer] Filtered records:', filtered.length);

          setConsultationRecords(filtered);
          setRecordsLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setRecordsLoading(false);
      }
    };

    if (isOpen) {
      fetchData();
    }
  }, [roomId, clientId, currentGameplay, isOpen]);

  const saveNote = useCallback(async () => {
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
  }, [roomId, noteContent]);

  // Auto-save with debounce
  useEffect(() => {
    const saveTimer = setTimeout(async () => {
      if (noteContent !== undefined && noteContent !== null) {
        await saveNote();
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(saveTimer);
  }, [noteContent, saveNote]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date
      .toLocaleDateString('zh-TW', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      .replace(/\//g, '/')
      .replace(',', '');
  };

  // Refresh records and clear notes after screenshot
  const refreshAfterScreenshot = useCallback(async () => {
    if (!clientId || !currentGameplay) {
      console.log('[NotesDrawer] Refresh skipped - clientId or currentGameplay missing:', {
        clientId,
        currentGameplay,
      });
      return;
    }

    try {
      // Fetch updated records
      const records = await consultationRecordsAPI.getClientRecords(clientId);

      console.log('[NotesDrawer Refresh] Current gameplay:', currentGameplay);
      console.log(
        '[NotesDrawer Refresh] All records:',
        records.map((r) => ({
          id: r.id,
          gameplay: r.game_state?.gameplay,
          screenshots: r.screenshots.length,
        }))
      );

      const filtered = records
        .filter((r) => r.game_state?.gameplay === currentGameplay && r.screenshots.length > 0)
        .sort((a, b) => new Date(b.session_date).getTime() - new Date(a.session_date).getTime());

      console.log('[NotesDrawer Refresh] Filtered records:', filtered.length);

      // Set new record ID for animation
      if (filtered.length > 0) {
        setNewRecordId(filtered[0].id);
        // Clear animation after 2 seconds
        setTimeout(() => setNewRecordId(null), 2000);
      }

      setConsultationRecords(filtered);
      // Clear notes
      setNoteContent('');
    } catch (error) {
      console.error('Failed to refresh records:', error);
    }
  }, [clientId, currentGameplay]);

  // Watch for screenshot success message
  useEffect(() => {
    if (screenshotMessage?.type === 'success') {
      if (onScreenshotSuccess) {
        onScreenshotSuccess();
      }
      refreshAfterScreenshot();
    }
  }, [screenshotMessage, onScreenshotSuccess, refreshAfterScreenshot]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black/20 z-30 md:hidden" onClick={onToggle} />}

      {/* Drawer */}
      <div
        className={`
          fixed
          right-0 top-0 bottom-0
          pt-20
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
          <div className="flex items-center gap-2">
            {onCaptureScreenshot && (
              <button
                onClick={() => onCaptureScreenshot(noteContent)}
                disabled={isCapturingScreenshot}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                title="儲存筆記與諮詢畫面截圖"
              >
                <Camera className="w-4 h-4" />
                {isCapturingScreenshot ? '處理中...' : '儲存筆記截圖'}
              </button>
            )}
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
        </div>

        {/* Screenshot Message */}
        {screenshotMessage && (
          <div
            className={`mx-4 mt-4 p-3 rounded-lg text-sm ${
              screenshotMessage.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {screenshotMessage.text}
          </div>
        )}

        {/* Consultation Records History */}
        {clientId && consultationRecords.length > 0 && (
          <div className="border-b">
            {/* History Header - Collapsible */}
            <button
              onClick={() => setHistoryExpanded(!historyExpanded)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <h4 className="text-sm font-semibold text-gray-700">
                歷史紀錄 ({consultationRecords.length})
              </h4>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${
                  historyExpanded ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* History Content - Expandable */}
            <div
              className={`overflow-hidden transition-all duration-300 ${
                historyExpanded ? 'max-h-[40vh] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-4 pb-4 overflow-y-auto max-h-[40vh]">
                <div className="space-y-2">
                  {consultationRecords.map((record) => (
                    <button
                      key={record.id}
                      onClick={() => setSelectedRecord(record)}
                      className={`w-full text-left p-3 rounded-lg hover:bg-gray-100 transition-all duration-300 border ${
                        record.id === newRecordId
                          ? 'animate-pulse bg-green-50 border-green-500'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 mb-1">
                            {formatDate(record.session_date)}
                          </div>
                          <div className="text-sm font-medium text-gray-700">
                            {(record.game_state?.gameplay &&
                              GAMEPLAY_NAMES[record.game_state.gameplay]) ||
                              record.game_rule_name ||
                              '未知玩法'}
                          </div>
                        </div>
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notes Area */}
        <div className="flex-1 flex flex-col p-4 min-h-0">
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
            disabled={isCapturingScreenshot}
            className={`flex-1 w-full p-3 border rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${
              isCapturingScreenshot ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
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

      {/* Record Detail Modal */}
      {selectedRecord && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedRecord(null)}
        >
          <div
            className="relative bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b bg-gray-50">
              <div className="flex items-center gap-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-full">
                  <span className="text-sm font-medium text-blue-700">
                    {(selectedRecord.game_state?.gameplay &&
                      GAMEPLAY_NAMES[selectedRecord.game_state.gameplay]) ||
                      selectedRecord.game_rule_name ||
                      '未知玩法'}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{formatDate(selectedRecord.session_date)}</p>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Modal Content - Two Column Layout */}
            <div className="flex-1 overflow-hidden flex">
              {/* Left Column - Notes */}
              <div className="w-1/2 border-r overflow-y-auto p-6">
                <h4 className="text-base font-semibold text-gray-900 mb-3">筆記</h4>
                {selectedRecord.notes ? (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {selectedRecord.notes}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">無筆記</p>
                )}
              </div>

              {/* Right Column - Screenshots */}
              <div className="w-1/2 overflow-y-auto p-6">
                <h4 className="text-base font-semibold text-gray-900 mb-3">截圖</h4>
                {selectedRecord.screenshots && selectedRecord.screenshots.length > 0 ? (
                  <div className="space-y-4">
                    {selectedRecord.screenshots.map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedImage(url)}
                        className="relative group cursor-pointer w-full block rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all"
                      >
                        <img
                          src={url}
                          alt={`Screenshot ${idx + 1}`}
                          className="w-full h-auto object-contain bg-gray-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <div className="bg-white/90 rounded-full p-3">
                            <Camera className="w-6 h-6 text-gray-800" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">無截圖</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <img
              src={selectedImage}
              alt="Preview"
              className="max-w-full max-h-[90vh] object-contain rounded"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </>
  );
}
