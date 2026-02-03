# Centralized File Upload with Backend + Supabase Storage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Base64 broadcast-only file uploads with centralized Backend + GCS storage, supporting both counselor and visitor uploads with timestamp-based conflict resolution.

**Architecture:** All file uploads go to Supabase Storage (GCS), with metadata stored in backend gameplay_states table. Frontend broadcasts URL + metadata for real-time updates. Late-joining visitors load from backend, always seeing the latest file based on timestamp.

**Tech Stack:**
- Frontend: React + TypeScript + Supabase Storage Client
- Backend: FastAPI + PostgreSQL (gameplay_states table)
- Storage: Supabase Storage (GCS)
- Sync: Supabase Realtime Broadcast

---

## Task 1: Update Backend API to Support File Metadata

**Files:**
- Modify: `backend/app/api/gameplay_states.py`
- Modify: `backend/app/models/gameplay_state.py`
- Test: `backend/tests/test_gameplay_states.py`

**Step 1: Write failing test for file metadata in gameplay state**

```python
# backend/tests/test_gameplay_states.py
def test_gameplay_state_with_uploaded_file(client, auth_headers, test_room):
    """Test storing file metadata in gameplay state"""
    gameplay_state = {
        "state": {
            "cardPlacements": {},
            "uploadedFile": {
                "name": "test.pdf",
                "url": "https://storage.supabase.co/bucket/test.pdf",
                "size": 12345,
                "type": "application/pdf",
                "uploadedAt": 1706889600000,
                "uploadedBy": {
                    "userId": "user-123",
                    "userName": "Test User",
                    "role": "owner"
                }
            },
            "metadata": {
                "version": 1,
                "lastModified": 1706889600000
            }
        }
    }

    response = client.put(
        f"/api/rooms/{test_room['id']}/gameplay-states/position_breakdown",
        json=gameplay_state,
        headers=auth_headers
    )

    assert response.status_code == 200

    # Retrieve and verify
    get_response = client.get(
        f"/api/rooms/{test_room['id']}/gameplay-states/position_breakdown",
        headers=auth_headers
    )

    assert get_response.status_code == 200
    data = get_response.json()
    assert data["state"]["uploadedFile"]["name"] == "test.pdf"
    assert data["state"]["uploadedFile"]["url"].startswith("https://storage")
    assert data["state"]["uploadedFile"]["uploadedBy"]["userId"] == "user-123"
```

**Step 2: Run test to verify it fails**

```bash
cd backend
pytest tests/test_gameplay_states.py::test_gameplay_state_with_uploaded_file -v
```

Expected: FAIL (uploadedFile not persisted or schema mismatch)

**Step 3: Update gameplay state model to include uploadedFile**

```python
# backend/app/models/gameplay_state.py
from pydantic import BaseModel
from typing import Optional, Dict, Any

class FileUploadMetadata(BaseModel):
    name: str
    url: str
    size: int
    type: str
    uploadedAt: int
    uploadedBy: Dict[str, Any]

class GameplayStateData(BaseModel):
    cardPlacements: Optional[Dict[str, Any]] = {}
    uploadedFile: Optional[FileUploadMetadata] = None
    metadata: Optional[Dict[str, Any]] = {}
    # Allow additional fields for backward compatibility
    class Config:
        extra = "allow"

class GameplayState(BaseModel):
    state: GameplayStateData
```

**Step 4: Verify backend properly stores and retrieves uploadedFile**

```bash
pytest tests/test_gameplay_states.py::test_gameplay_state_with_uploaded_file -v
```

Expected: PASS

**Step 5: Commit backend changes**

```bash
cd backend
git add app/models/gameplay_state.py tests/test_gameplay_states.py
git commit -m "feat(backend): add uploadedFile support to gameplay state schema

- Add FileUploadMetadata model for file metadata
- Update GameplayStateData to include uploadedFile field
- Add test coverage for file metadata persistence

Part of centralized file upload system."
```

---

## Task 2: Create Supabase Storage Bucket and Policies

**Files:**
- Create: `frontend/lib/supabase-storage.ts`
- Modify: `frontend/.env.local.example`

**Step 1: Configure Supabase Storage bucket (manual setup)**

Instructions:
1. Go to Supabase Dashboard → Storage
2. Create new bucket: `gameplay-uploads`
3. Set as **Public bucket** (files accessible via URL)
4. Add RLS policies:
   - Allow authenticated uploads: `auth.role() = 'authenticated'`
   - Allow public reads: `true` (files are public once uploaded)

**Step 2: Write Supabase Storage utility**

```typescript
// frontend/src/lib/supabase-storage.ts
import { supabase } from './supabase-client';

const BUCKET_NAME = 'gameplay-uploads';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png'];

export interface UploadFileOptions {
  roomId: string;
  gameplayId: string;
  file: File;
  userId: string;
}

export interface UploadedFileMetadata {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: number;
  storagePath: string;
}

/**
 * Upload file to Supabase Storage
 * Returns public URL and metadata
 */
export async function uploadFileToStorage(
  options: UploadFileOptions
): Promise<UploadedFileMetadata> {
  const { roomId, gameplayId, file, userId } = options;

  // Validation
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`文件過大！最大支援 ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('僅支援 PDF、JPG、PNG 格式');
  }

  // Generate unique filename
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop();
  const storagePath = `${roomId}/${gameplayId}/${timestamp}_${userId}.${fileExt}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('[SupabaseStorage] Upload error:', error);
    throw new Error(`上傳失敗: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  return {
    name: file.name,
    url: urlData.publicUrl,
    size: file.size,
    type: file.type,
    uploadedAt: timestamp,
    storagePath: storagePath,
  };
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFileFromStorage(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([storagePath]);

  if (error) {
    console.error('[SupabaseStorage] Delete error:', error);
    throw new Error(`刪除失敗: ${error.message}`);
  }
}
```

**Step 3: Add environment variable example**

```bash
# frontend/.env.local.example
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# Storage bucket should be created in Supabase Dashboard
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=gameplay-uploads
```

**Step 4: Write unit test for storage utility**

```typescript
// frontend/src/lib/__tests__/supabase-storage.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { uploadFileToStorage, deleteFileFromStorage } from '../supabase-storage';
import { supabase } from '../supabase-client';

vi.mock('../supabase-client', () => ({
  supabase: {
    storage: {
      from: vi.fn(),
    },
  },
}));

describe('Supabase Storage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should upload file and return metadata', async () => {
    const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const mockUploadResponse = {
      data: { path: 'room1/gameplay1/123_user1.pdf' },
      error: null,
    };
    const mockUrlResponse = {
      data: { publicUrl: 'https://storage.supabase.co/bucket/room1/gameplay1/123_user1.pdf' },
    };

    const mockFrom = vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue(mockUploadResponse),
      getPublicUrl: vi.fn().mockReturnValue(mockUrlResponse),
    });

    (supabase.storage.from as any) = mockFrom;

    const result = await uploadFileToStorage({
      roomId: 'room1',
      gameplayId: 'gameplay1',
      file: mockFile,
      userId: 'user1',
    });

    expect(result.name).toBe('test.pdf');
    expect(result.url).toContain('https://storage.supabase.co');
    expect(result.size).toBe(mockFile.size);
    expect(result.type).toBe('application/pdf');
    expect(mockFrom).toHaveBeenCalledWith('gameplay-uploads');
  });

  it('should reject file larger than 5MB', async () => {
    const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.pdf', {
      type: 'application/pdf',
    });

    await expect(
      uploadFileToStorage({
        roomId: 'room1',
        gameplayId: 'gameplay1',
        file: largeFile,
        userId: 'user1',
      })
    ).rejects.toThrow('文件過大');
  });

  it('should reject unsupported file types', async () => {
    const unsupportedFile = new File(['content'], 'malware.exe', {
      type: 'application/x-msdownload',
    });

    await expect(
      uploadFileToStorage({
        roomId: 'room1',
        gameplayId: 'gameplay1',
        file: unsupportedFile,
        userId: 'user1',
      })
    ).rejects.toThrow('僅支援 PDF、JPG、PNG 格式');
  });
});
```

**Step 5: Run tests**

```bash
cd frontend
npm test supabase-storage.test.ts --run
```

Expected: PASS

**Step 6: Commit storage utility**

```bash
cd frontend
git add src/lib/supabase-storage.ts src/lib/__tests__/supabase-storage.test.ts .env.local.example
git commit -m "feat(storage): add Supabase Storage upload utility

- Implement uploadFileToStorage with validation
- Add file size (5MB) and type (PDF/JPG/PNG) checks
- Generate unique storage paths per room/gameplay
- Add deleteFileFromStorage for cleanup
- Full test coverage with edge cases

Part of centralized file upload system."
```

---

## Task 3: Update use-gameplay-state-persistence to Include uploadedFile

**Files:**
- Modify: `frontend/src/hooks/use-gameplay-state-persistence.ts`
- Test: `frontend/src/hooks/__tests__/use-gameplay-state-persistence.test.ts`

**Step 1: Write failing test for uploadedFile persistence**

```typescript
// frontend/src/hooks/__tests__/use-gameplay-state-persistence.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useGameplayStatePersistence } from '../use-gameplay-state-persistence';
import { useGameStateStore } from '@/stores/game-state-store';
import { gameplayStatesAPI } from '@/lib/api/gameplay-states';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@/stores/game-state-store');
vi.mock('@/lib/api/gameplay-states');

describe('useGameplayStatePersistence - uploadedFile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should persist uploadedFile to backend for room owner', async () => {
    const mockState = {
      cardPlacements: { zone1: ['card1'] },
      uploadedFile: {
        name: 'test.pdf',
        url: 'https://storage.supabase.co/test.pdf',
        size: 12345,
        type: 'application/pdf',
        uploadedAt: 1706889600000,
      },
      metadata: { version: 1, lastModified: Date.now() },
    };

    (useGameStateStore as any).mockReturnValue({
      getGameState: vi.fn().mockReturnValue(mockState),
    });

    const mockUpsert = vi.fn().mockResolvedValue({});
    (gameplayStatesAPI.upsertGameplayState as any) = mockUpsert;

    const { result } = renderHook(() =>
      useGameplayStatePersistence({
        roomId: 'room1',
        gameplayId: 'position_breakdown',
        enabled: true, // Room owner
      })
    );

    // Mark dirty and trigger save
    result.current.markDirty();
    await result.current.saveState();

    await waitFor(() => {
      expect(mockUpsert).toHaveBeenCalledWith('room1', 'position_breakdown', {
        state: expect.objectContaining({
          uploadedFile: mockState.uploadedFile,
        }),
      });
    });
  });

  it('should load uploadedFile from backend', async () => {
    const mockBackendState = {
      state: {
        cardPlacements: {},
        uploadedFile: {
          name: 'loaded.pdf',
          url: 'https://storage.supabase.co/loaded.pdf',
          size: 54321,
          type: 'application/pdf',
          uploadedAt: 1706889700000,
        },
        metadata: { version: 1 },
      },
      updated_at: new Date().toISOString(),
    };

    (gameplayStatesAPI.getGameplayState as any) = vi
      .fn()
      .mockResolvedValue(mockBackendState);

    const mockSetGameState = vi.fn();
    (useGameStateStore as any).mockReturnValue({
      getGameState: vi.fn().mockReturnValue({ cardPlacements: {}, metadata: {} }),
      setGameState: mockSetGameState,
    });

    const { result } = renderHook(() =>
      useGameplayStatePersistence({
        roomId: 'room1',
        gameplayId: 'position_breakdown',
        enabled: true,
      })
    );

    await result.current.loadState();

    await waitFor(() => {
      expect(mockSetGameState).toHaveBeenCalledWith(
        'room1',
        'position_breakdown',
        expect.objectContaining({
          uploadedFile: mockBackendState.state.uploadedFile,
        })
      );
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test use-gameplay-state-persistence.test.ts --run
```

Expected: FAIL (uploadedFile not included in save/load)

**Step 3: Update saveState to include uploadedFile**

```typescript
// frontend/src/hooks/use-gameplay-state-persistence.ts (line 49-52)
const stateToSave = {
  cardPlacements: currentState.cardPlacements,
  uploadedFile: currentState.uploadedFile, // ← ADD THIS LINE
  metadata: currentState.metadata,
};
```

**Step 4: Update loadState to include uploadedFile**

```typescript
// frontend/src/hooks/use-gameplay-state-persistence.ts (line 92-98)
savedState = {
  cardPlacements: backendState.state.cardPlacements || {},
  uploadedFile: backendState.state.uploadedFile || null, // ← ADD THIS LINE
  metadata: backendState.state.metadata || {
    version: 1,
    lastModified: new Date(backendState.updated_at).getTime(),
    syncStatus: 'synced',
  },
};
```

**Step 5: Update localStorage load path similarly**

```typescript
// frontend/src/hooks/use-gameplay-state-persistence.ts (line 105-111)
savedState = {
  cardPlacements: parsed.cardPlacements || {},
  uploadedFile: parsed.uploadedFile || null, // ← ADD THIS LINE
  metadata: parsed.metadata || {
    version: 1,
    lastModified: Date.now(),
    syncStatus: 'local',
  },
};
```

**Step 6: Run tests to verify they pass**

```bash
npm test use-gameplay-state-persistence.test.ts --run
```

Expected: PASS

**Step 7: Commit persistence fix**

```bash
git add src/hooks/use-gameplay-state-persistence.ts src/hooks/__tests__/use-gameplay-state-persistence.test.ts
git commit -m "fix(persistence): include uploadedFile in save/load state

- Add uploadedFile to stateToSave for backend persistence
- Load uploadedFile from backend on state restoration
- Load uploadedFile from localStorage for visitors
- Add test coverage for uploadedFile persistence

Fixes bug where uploaded files disappear after page reload."
```

---

## Task 4: Refactor File Upload to Use Supabase Storage

**Files:**
- Modify: `frontend/src/hooks/use-unified-card-sync.ts`
- Modify: `frontend/src/components/games/PositionBreakdownGame.tsx`
- Test: `frontend/src/hooks/__tests__/use-unified-card-sync-file-upload.test.ts`

**Step 1: Update handleFileUpload to use Supabase Storage**

```typescript
// frontend/src/hooks/use-unified-card-sync.ts (line 212-236)
const handleFileUpload = useCallback(
  async (file: File) => {
    console.log(`[${gameType}] Local file upload:`, file.name);

    try {
      // 1. Upload to Supabase Storage
      const uploadedMetadata = await uploadFileToStorage({
        roomId: roomId,
        gameplayId: gameType,
        file: file,
        userId: userId,
      });

      // 2. Create file data with uploader info
      const fileData = {
        name: uploadedMetadata.name,
        url: uploadedMetadata.url,
        size: uploadedMetadata.size,
        type: uploadedMetadata.type,
        uploadedAt: uploadedMetadata.uploadedAt,
        uploadedBy: {
          userId,
          userName,
          role: isRoomOwner ? 'owner' : 'visitor',
        },
      };

      // 3. Update local state
      updateCards({
        uploadedFile: fileData,
      });

      // 4. Broadcast to other users (URL only, not Base64)
      if (cardSync.isConnected) {
        cardSync.uploadFile(fileData);
      }

      // 5. Mark as dirty for persistence
      persistence.markDirty();

      return fileData;
    } catch (error) {
      console.error(`[${gameType}] File upload failed:`, error);
      throw error;
    }
  },
  [roomId, gameType, userId, userName, isRoomOwner, updateCards, cardSync, persistence]
);
```

**Step 2: Update PositionBreakdownGame to handle async upload**

```typescript
// frontend/src/components/games/PositionBreakdownGame.tsx (line 59-107)
const onFileUpload = async (file: File) => {
  console.log('上傳文件:', file.name, file.type);

  try {
    // Use centralized handleFileUpload (async)
    await handleFileUpload(file);

    // Show success message
    console.log('✅ 文件上傳成功:', file.name);
  } catch (error) {
    // Show error to user
    const errorMessage = error instanceof Error ? error.message : '上傳失敗';
    alert(errorMessage);
    console.error('❌ 文件上傳失敗:', error);
  }
};
```

**Step 3: Update FileUploadEvent interface to remove dataUrl**

```typescript
// frontend/src/hooks/use-card-sync.ts (line 32-42)
export interface FileUploadEvent {
  name: string;
  url: string; // ← Changed from dataUrl to url
  size: number;
  type: string;
  uploadedAt: number;
  uploadedBy: {
    userId: string;
    userName: string;
    role: 'owner' | 'visitor';
  };
}
```

**Step 4: Update remote file upload handler with timestamp comparison**

```typescript
// frontend/src/hooks/use-unified-card-sync.ts (onFileUpload callback)
useEffect(() => {
  if (!cardSync.isConnected) return;

  // Handle remote file uploads
  const unsubscribeFileUpload = cardSync.onFileUpload((remoteFileData) => {
    console.log(`[${gameType}] Received remote file upload:`, remoteFileData.name);

    // Prevent processing own uploads
    if (remoteFileData.uploadedBy.userId === userId) {
      console.log(`[${gameType}] Ignoring own file upload`);
      return;
    }

    // Compare timestamps - accept only if remote is newer
    const currentFile = state.uploadedFile;
    if (!currentFile || remoteFileData.uploadedAt > currentFile.uploadedAt) {
      console.log(`[${gameType}] Accepting remote file (newer):`, remoteFileData.name);
      updateCards({
        uploadedFile: remoteFileData,
      });

      // If we're the owner, persist the visitor's upload
      if (isRoomOwner) {
        persistence.markDirty();
      }
    } else {
      console.log(`[${gameType}] Rejecting remote file (older):`, remoteFileData.name);
    }
  });

  return () => {
    unsubscribeFileUpload();
  };
}, [cardSync, gameType, userId, state.uploadedFile, updateCards, isRoomOwner, persistence]);
```

**Step 5: Update test to mock Supabase Storage**

```typescript
// frontend/src/hooks/__tests__/use-unified-card-sync-file-upload.test.ts
import { uploadFileToStorage } from '@/lib/supabase-storage';

vi.mock('@/lib/supabase-storage', () => ({
  uploadFileToStorage: vi.fn(),
}));

it('should upload to Supabase Storage and broadcast URL', async () => {
  const mockUploadedMetadata = {
    name: 'test.pdf',
    url: 'https://storage.supabase.co/gameplay-uploads/room1/position_breakdown/123_user1.pdf',
    size: 12345,
    type: 'application/pdf',
    uploadedAt: Date.now(),
    storagePath: 'room1/position_breakdown/123_user1.pdf',
  };

  (uploadFileToStorage as any).mockResolvedValue(mockUploadedMetadata);

  const { result } = renderHook(() =>
    useUnifiedCardSync({
      roomId: 'room1',
      gameType: 'position_breakdown',
      isRoomOwner: true,
    })
  );

  const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });

  await act(async () => {
    await result.current.handleFileUpload(mockFile);
  });

  // Verify Supabase Storage was called
  expect(uploadFileToStorage).toHaveBeenCalledWith({
    roomId: 'room1',
    gameplayId: 'position_breakdown',
    file: mockFile,
    userId: expect.any(String),
  });

  // Verify broadcast sent URL (not Base64)
  await waitFor(() => {
    expect(mockChannel.send).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'file_uploaded',
        payload: expect.objectContaining({
          url: mockUploadedMetadata.url,
          name: 'test.pdf',
        }),
      })
    );
  });
});
```

**Step 6: Run tests**

```bash
npm test use-unified-card-sync-file-upload.test.ts --run
```

Expected: PASS

**Step 7: Commit file upload refactor**

```bash
git add src/hooks/use-unified-card-sync.ts src/components/games/PositionBreakdownGame.tsx src/hooks/use-card-sync.ts src/hooks/__tests__/use-unified-card-sync-file-upload.test.ts
git commit -m "refactor(upload): replace Base64 with Supabase Storage URLs

- Upload files to Supabase Storage instead of Base64 encoding
- Broadcast storage URL instead of dataUrl
- Add timestamp-based conflict resolution (last-write-wins)
- Owner persists visitor uploads to backend
- Remove 200KB broadcast size limitation
- Update FileUploadEvent interface (url instead of dataUrl)
- Full async error handling with user feedback

Breaking change: Old Base64 uploads incompatible with new system."
```

---

## Task 5: Add File Display Component with GCS URL Rendering

**Files:**
- Create: `frontend/src/components/games/UploadedFileDisplay.tsx`
- Modify: `frontend/src/components/games/PositionBreakdownGame.tsx`
- Test: `frontend/src/components/games/__tests__/UploadedFileDisplay.test.tsx`

**Step 1: Write test for file display component**

```typescript
// frontend/src/components/games/__tests__/UploadedFileDisplay.test.tsx
import { render, screen } from '@testing-library/react';
import { UploadedFileDisplay } from '../UploadedFileDisplay';
import { describe, it, expect } from 'vitest';

describe('UploadedFileDisplay', () => {
  it('should display PDF file with icon and metadata', () => {
    const fileData = {
      name: 'test-document.pdf',
      url: 'https://storage.supabase.co/gameplay-uploads/room1/test.pdf',
      size: 123456,
      type: 'application/pdf',
      uploadedAt: 1706889600000,
      uploadedBy: {
        userId: 'user1',
        userName: 'John Doe',
        role: 'owner' as const,
      },
    };

    render(<UploadedFileDisplay file={fileData} />);

    expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
    expect(screen.getByText(/120.6 KB/i)).toBeInTheDocument();
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
  });

  it('should display image preview for JPG/PNG', () => {
    const imageFile = {
      name: 'photo.jpg',
      url: 'https://storage.supabase.co/gameplay-uploads/room1/photo.jpg',
      size: 54321,
      type: 'image/jpeg',
      uploadedAt: 1706889600000,
      uploadedBy: {
        userId: 'user2',
        userName: 'Jane Smith',
        role: 'visitor' as const,
      },
    };

    render(<UploadedFileDisplay file={imageFile} />);

    const img = screen.getByAltText('photo.jpg');
    expect(img).toHaveAttribute('src', imageFile.url);
  });

  it('should render nothing when no file provided', () => {
    const { container } = render(<UploadedFileDisplay file={null} />);
    expect(container.firstChild).toBeNull();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test UploadedFileDisplay.test.tsx --run
```

Expected: FAIL (component doesn't exist)

**Step 3: Create UploadedFileDisplay component**

```typescript
// frontend/src/components/games/UploadedFileDisplay.tsx
import React from 'react';

interface UploadedFileData {
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: number;
  uploadedBy: {
    userId: string;
    userName: string;
    role: 'owner' | 'visitor';
  };
}

interface UploadedFileDisplayProps {
  file: UploadedFileData | null;
  onDelete?: () => void;
}

export function UploadedFileDisplay({ file, onDelete }: UploadedFileDisplayProps) {
  if (!file) return null;

  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="uploaded-file-display border rounded-lg p-4 bg-white shadow-sm">
      {/* File Preview */}
      <div className="file-preview mb-3">
        {isImage ? (
          <img
            src={file.url}
            alt={file.name}
            className="max-w-full max-h-64 rounded object-contain"
          />
        ) : isPDF ? (
          <div className="pdf-icon flex items-center justify-center h-32 bg-red-50 rounded">
            <svg className="w-16 h-16 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h10l4 4v16H2v-1z" />
            </svg>
          </div>
        ) : null}
      </div>

      {/* File Metadata */}
      <div className="file-metadata space-y-1">
        <div className="font-medium text-gray-900 truncate" title={file.name}>
          {file.name}
        </div>
        <div className="text-sm text-gray-500">
          {formatFileSize(file.size)} • 上傳於 {formatDate(file.uploadedAt)}
        </div>
        <div className="text-sm text-gray-600">
          上傳者: {file.uploadedBy.userName} ({file.uploadedBy.role === 'owner' ? '諮商師' : '訪客'})
        </div>
      </div>

      {/* Actions */}
      <div className="file-actions mt-3 flex gap-2">
        <a
          href={file.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary text-sm"
        >
          開啟文件
        </a>
        {onDelete && (
          <button onClick={onDelete} className="btn-secondary text-sm">
            刪除
          </button>
        )}
      </div>
    </div>
  );
}
```

**Step 4: Run tests to verify they pass**

```bash
npm test UploadedFileDisplay.test.tsx --run
```

Expected: PASS

**Step 5: Integrate into PositionBreakdownGame**

```typescript
// frontend/src/components/games/PositionBreakdownGame.tsx
import { UploadedFileDisplay } from './UploadedFileDisplay';

// ... inside component JSX, after file upload button
{state.uploadedFile && (
  <div className="mt-4">
    <UploadedFileDisplay
      file={state.uploadedFile}
      onDelete={handleFileDelete} // Optional: implement delete
    />
  </div>
)}
```

**Step 6: Commit file display component**

```bash
git add src/components/games/UploadedFileDisplay.tsx src/components/games/__tests__/UploadedFileDisplay.test.tsx src/components/games/PositionBreakdownGame.tsx
git commit -m "feat(ui): add file display component for GCS URLs

- Create UploadedFileDisplay component
- Show image preview for JPG/PNG files
- Show PDF icon for PDF files
- Display file metadata (name, size, uploader, timestamp)
- Add 'Open file' link to GCS URL
- Integrate into PositionBreakdownGame
- Full test coverage

Replaces Base64 preview with proper file rendering."
```

---

## Task 6: Integration Testing & Manual Verification

**Files:**
- Test: Manual testing checklist

**Step 1: Deploy to staging**

```bash
git push origin staging
gh run watch --branch staging
```

**Step 2: Manual testing checklist**

**Scenario 1: Counselor uploads file, visitor joins later**
- [ ] Login as counselor
- [ ] Enter room, select position breakdown
- [ ] Upload test.pdf (< 5MB)
- [ ] Verify file appears with preview
- [ ] In incognito window, login as visitor
- [ ] Join same room
- [ ] Verify visitor sees the uploaded file
- [ ] Verify file metadata shows counselor as uploader

**Scenario 2: Visitor uploads file**
- [ ] As visitor, upload photo.jpg
- [ ] Verify counselor receives real-time update
- [ ] Verify image preview displays correctly
- [ ] Refresh counselor page
- [ ] Verify file persists after refresh

**Scenario 3: Concurrent uploads (timestamp resolution)**
- [ ] Open two browser windows (counselor + visitor)
- [ ] Upload file A from counselor (timestamp T1)
- [ ] Upload file B from visitor (timestamp T2, T2 > T1)
- [ ] Verify both users see file B (latest)
- [ ] Refresh both browsers
- [ ] Verify file B persists (not file A)

**Scenario 4: File size and type validation**
- [ ] Try uploading 6MB file → Should reject with error
- [ ] Try uploading .exe file → Should reject
- [ ] Try uploading .doc file → Should reject
- [ ] Upload valid 4.5MB PDF → Should succeed

**Scenario 5: Network resilience**
- [ ] Upload file while offline → Should show error
- [ ] Go offline, then try to upload → Should show connection error
- [ ] Upload file, then disconnect → File should persist after reconnection

**Step 3: Check Supabase Storage**

- [ ] Go to Supabase Dashboard → Storage → gameplay-uploads
- [ ] Verify uploaded files are organized by room/gameplay
- [ ] Verify file naming convention: `{roomId}/{gameplayId}/{timestamp}_{userId}.{ext}`
- [ ] Verify public URLs are accessible

**Step 4: Check backend database**

```sql
SELECT
  gameplay_id,
  state->'uploadedFile'->>'name' as filename,
  state->'uploadedFile'->>'url' as file_url,
  state->'uploadedFile'->'uploadedBy'->>'userName' as uploader,
  updated_at
FROM gameplay_states
WHERE room_id = 'test-room-id'
  AND state ? 'uploadedFile';
```

- [ ] Verify uploadedFile is stored in database
- [ ] Verify URL points to Supabase Storage
- [ ] Verify uploader metadata is correct

**Step 5: Document any issues found**

Create GitHub issues for any bugs discovered during testing.

---

## Task 7: Update Documentation

**Files:**
- Create: `docs/file-upload-architecture.md`
- Modify: `README.md`

**Step 1: Create architecture documentation**

```markdown
<!-- docs/file-upload-architecture.md -->
# File Upload Architecture

## Overview

Career Creator uses a centralized file upload system with **Backend + Supabase Storage (GCS)** for all gameplay-related file uploads.

## Architecture Diagram

```
User (Counselor/Visitor)
    ↓
Frontend Upload Handler
    ↓
Supabase Storage Upload (GCS)
    ↓ (returns public URL)
Backend API (gameplay_states table)
    ↓
Supabase Realtime Broadcast
    ↓
All Connected Users (real-time sync)
```

## Key Components

### 1. Supabase Storage (GCS)
- **Bucket:** `gameplay-uploads`
- **Path Structure:** `{roomId}/{gameplayId}/{timestamp}_{userId}.{ext}`
- **Access:** Public URLs (files are publicly accessible)
- **Limits:** 5MB max per file, PDF/JPG/PNG only

### 2. Backend Persistence
- **Table:** `gameplay_states`
- **Field:** `state.uploadedFile` (JSONB)
- **Schema:**
```json
{
  "name": "document.pdf",
  "url": "https://storage.supabase.co/...",
  "size": 123456,
  "type": "application/pdf",
  "uploadedAt": 1706889600000,
  "uploadedBy": {
    "userId": "user-id",
    "userName": "John Doe",
    "role": "owner"
  }
}
```

### 3. Real-time Sync
- **Protocol:** Supabase Realtime Broadcast
- **Event:** `file_uploaded`
- **Conflict Resolution:** Last-write-wins (timestamp comparison)

## Upload Flow

### Counselor/Visitor Upload
1. User selects file
2. Frontend validates size (≤5MB) and type (PDF/JPG/PNG)
3. Upload to Supabase Storage
4. Get public URL
5. Update local state with URL + metadata
6. Broadcast to other users via Realtime
7. Mark state as dirty for backend persistence
8. Backend auto-saves within 30 seconds

### Late-Joining Visitor
1. Visitor joins room
2. Backend loads gameplay state
3. State includes `uploadedFile` with GCS URL
4. Frontend renders file display component
5. File is accessible via public URL

## Conflict Resolution

When multiple users upload files concurrently:
- Each upload gets unique timestamp (`uploadedAt`)
- Remote updates are compared with local state
- **Last-write-wins:** File with latest timestamp is kept
- Owner persists visitor uploads to backend

Example:
```
T0: Counselor uploads A.pdf (uploadedAt: 1000)
T1: Visitor uploads B.pdf (uploadedAt: 1100)
Result: Both users see B.pdf (latest)
Backend: Stores B.pdf
```

## Security

### File Validation
- Max size: 5MB (prevents storage abuse)
- Allowed types: PDF, JPG, PNG (prevents malware)
- Type validation: MIME type check (frontend)

### Future Enhancements
- Backend magic byte verification
- Virus scanning (ClamAV)
- Rate limiting (5 uploads/min per user)
- File encryption for sensitive documents

## API Endpoints

### Upload File
```typescript
POST /api/rooms/{roomId}/gameplay-states/{gameplayId}
Body: { state: { uploadedFile: {...} } }
Auth: Required (counselor or visitor)
```

### Get Gameplay State
```typescript
GET /api/rooms/{roomId}/gameplay-states/{gameplayId}
Response: { state: { uploadedFile: {...} }, updated_at: "..." }
Auth: Required
```

## Testing

### Unit Tests
- `supabase-storage.test.ts`: Upload utility
- `use-gameplay-state-persistence.test.ts`: Persistence logic
- `use-unified-card-sync-file-upload.test.ts`: Real-time sync
- `UploadedFileDisplay.test.tsx`: UI component

### Integration Tests
- Manual testing checklist (see Task 6)
- E2E tests with Playwright (future)

## Migration from Base64

**Breaking Change:** Old Base64 file uploads are incompatible.

**Migration Path:**
1. Old `dataUrl` field is deprecated
2. New `url` field points to GCS
3. Existing rooms with Base64 uploads will lose files on first new upload
4. No automated migration (Base64 data was ephemeral)

## Troubleshooting

### File not showing for late-joining visitor
- Check: Is `uploadedFile` in backend gameplay state?
- Check: Is file URL accessible (try opening in browser)?
- Check: Does visitor have network connectivity?

### Upload fails with "Failed to upload"
- Check: Is Supabase Storage bucket configured?
- Check: Are RLS policies set correctly?
- Check: Is file within size/type limits?

### Concurrent uploads overwriting each other
- Expected behavior: Last-write-wins
- Verify: Timestamps are correctly compared
- Verify: Owner persists visitor uploads

## Future Roadmap

- [ ] Support multiple file uploads per gameplay
- [ ] File deletion API
- [ ] File versioning (keep history)
- [ ] Direct upload to GCS (signed URLs)
- [ ] Progress indicator for large uploads
- [ ] Thumbnail generation for images
```

**Step 2: Update README with file upload feature**

```markdown
<!-- README.md - add new section -->
## File Upload System

Career Creator supports file uploads in gameplay sessions:
- **Supported formats:** PDF, JPG, PNG
- **Max file size:** 5MB
- **Storage:** Supabase Storage (GCS)
- **Real-time sync:** All users see uploads instantly
- **Persistence:** Files persist across page reloads

See [docs/file-upload-architecture.md](./docs/file-upload-architecture.md) for technical details.
```

**Step 3: Commit documentation**

```bash
git add docs/file-upload-architecture.md README.md
git commit -m "docs: add file upload architecture documentation

- Document centralized GCS storage approach
- Explain conflict resolution (last-write-wins)
- Add API endpoints and schema
- Include troubleshooting guide
- Document migration from Base64 system"
```

---

## Summary

**Total commits:** 7 commits
**Total time:** ~2-3 hours
**Testing:** Unit + Integration + Manual

**Deployment checklist:**
- [ ] All tests passing
- [ ] Supabase Storage bucket created
- [ ] RLS policies configured
- [ ] Manual testing completed
- [ ] Documentation updated
- [ ] Staging deployment successful
- [ ] Production deployment (after staging verification)

**Breaking changes:**
- Old Base64 file uploads incompatible
- Existing uploaded files will be lost on first new upload

**Future improvements:**
- Multiple file support
- File deletion API
- Backend magic byte verification
- Rate limiting enforcement
- Progress indicators

---

**End of Implementation Plan**
