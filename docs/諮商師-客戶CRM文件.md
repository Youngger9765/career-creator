# 諮商師-客戶CRM系統設計文件

## 1. 系統概述

本CRM系統旨在幫助諮商師有效管理客戶關係，將諮詢房間按客戶組織，提供清晰的諮詢歷史記錄和客戶資訊管理。

## 2. 核心功能

### 2.1 客戶管理

- 客戶資料維護（基本信息、聯絡方式、備註）
- 客戶標籤分類（新客戶、長期客戶、VIP等）
- 客戶狀態追蹤（活躍、休眠、結案）

### 2.2 諮商師-客戶關係

- 多對多關係（一個客戶可有多個諮商師，一個諮商師可服務多個客戶）
- 關係狀態（主責諮商師、協同諮商師）
- 關係歷史記錄

### 2.3 房間組織

- 按客戶分組顯示房間
- 每個客戶下顯示所有相關諮詢房間
- 房間時間軸視圖

### 2.4 諮詢記錄

- 諮詢次數統計
- 諮詢主題追蹤
- 諮詢進度管理

## 3. 資料庫設計

### 3.1 clients 表

```sql
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    phone VARCHAR(50),
    notes TEXT,
    tags JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, archived
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3.2 counselor_client_relationships 表

```sql
CREATE TABLE counselor_client_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counselor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) DEFAULT 'primary', -- primary, secondary, consultant
    status VARCHAR(50) DEFAULT 'active', -- active, paused, terminated
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(counselor_id, client_id)
);
```

### 3.3 room_clients 表（連結房間與客戶）

```sql
CREATE TABLE room_clients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(room_id, client_id)
);
```

### 3.4 consultation_records 表（諮詢記錄）

```sql
CREATE TABLE consultation_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    counselor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_date TIMESTAMP NOT NULL,
    duration_minutes INTEGER,
    topics JSONB DEFAULT '[]',
    notes TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

## 4. API設計

### 4.1 客戶管理 API

#### GET /api/clients

獲取諮商師的所有客戶列表

#### POST /api/clients

創建新客戶

#### GET /api/clients/{client_id}

獲取特定客戶詳細資料

#### PUT /api/clients/{client_id}

更新客戶資料

#### DELETE /api/clients/{client_id}

刪除客戶（軟刪除）

### 4.2 關係管理 API

#### POST /api/counselor-client-relationships

建立諮商師與客戶關係

#### GET /api/counselor-client-relationships

獲取諮商師的所有客戶關係

#### PUT /api/counselor-client-relationships/{relationship_id}

更新關係狀態

### 4.3 房間-客戶關聯 API

#### POST /api/rooms/{room_id}/clients

將房間關聯到客戶

#### GET /api/clients/{client_id}/rooms

獲取客戶的所有房間

### 4.4 諮詢記錄 API

#### POST /api/consultation-records

創建諮詢記錄

#### GET /api/clients/{client_id}/consultation-records

獲取客戶的所有諮詢記錄

## 5. 前端介面設計

### 5.1 客戶列表頁面

```text
/dashboard/clients
```

- 客戶卡片視圖（顯示姓名、email、標籤、最後諮詢日期）
- 搜尋和篩選功能
- 快速新增客戶按鈕

### 5.2 客戶詳情頁面

```text
/dashboard/clients/{client_id}
```

- 客戶基本資訊
- 諮詢歷史時間軸
- 相關房間列表
- 諮詢記錄
- 編輯客戶資料

### 5.3 儀表板增強

```text
/dashboard
```

- 新增「按客戶分組」視圖選項
- 客戶分組展開/收合
- 每個客戶顯示房間數量和最後活動時間

### 5.4 創建房間增強

```text
/rooms/create
```

- 新增「選擇客戶」下拉選單
- 支援新增客戶快捷方式
- 自動關聯房間到選定客戶

## 6. 使用流程

### 6.1 新客戶流程

1. 諮商師在客戶列表新增客戶（輸入email、姓名等）
2. 系統自動建立諮商師-客戶關係
3. 創建房間時選擇該客戶
4. 房間自動歸類到該客戶名下

### 6.2 既有客戶流程

1. 創建房間時從下拉選單選擇既有客戶
2. 或在房間創建後，從房間設定關聯客戶
3. 房間出現在該客戶的房間列表中

### 6.3 客戶識別流程

1. 訪客加入房間時輸入email
2. 系統檢查email是否已存在於clients表
3. 如存在，自動關聯；如不存在，創建新客戶記錄
4. 自動建立房間-客戶關聯

## 7. 權限管理

### 7.1 諮商師權限

- 查看和管理自己的客戶
- 查看自己與客戶相關的所有房間
- 創建和編輯諮詢記錄

### 7.2 管理員權限

- 查看所有諮商師的客戶關係
- 管理客戶資料
- 查看系統整體統計

### 7.3 客戶隱私保護

- 諮商師只能看到自己服務的客戶
- 客戶資料加密存儲
- 操作日誌記錄

## 8. 實施計劃

### Phase 1: 基礎架構（當前）

1. ✅ 創建資料庫表結構
2. ⏳ 實作基本CRUD API
3. ⏳ 前端客戶列表和詳情頁

### Phase 2: 整合優化

1. 房間創建流程整合
2. 儀表板視圖優化
3. 客戶自動識別機制

### Phase 3: 進階功能

1. 客戶標籤系統
2. 諮詢記錄分析
3. 報表生成功能

## 9. 技術實作細節

### 9.1 前端狀態管理（Zustand）

```typescript
interface ClientState {
  clients: Client[];
  selectedClient: Client | null;
  loadClients: () => Promise<void>;
  selectClient: (client: Client) => void;
  createClient: (data: CreateClientDTO) => Promise<Client>;
  updateClient: (id: string, data: UpdateClientDTO) => Promise<void>;
}
```

### 9.2 後端服務層

```python
class ClientService:
    async def create_client(self, email: str, counselor_id: str) -> Client
    async def get_counselor_clients(self, counselor_id: str) -> List[Client]
    async def link_room_to_client(self, room_id: str, client_id: str) -> None
    async def get_client_rooms(self, client_id: str) -> List[Room]
```

### 9.3 資料庫查詢優化

- 使用索引優化查詢效能
- 實作分頁機制
- 快取常用查詢結果

## 10. 監控與維護

### 10.1 關鍵指標

- 平均每客戶諮詢次數
- 客戶活躍度
- 諮商師工作量分析

### 10.2 資料備份

- 每日自動備份客戶資料
- 諮詢記錄定期歸檔
- 災難恢復計劃

---

*文件版本: 1.0*
*更新日期: 2025-01-24*
*作者: Career Creator 開發團隊*
