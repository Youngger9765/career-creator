# 🚨 需要重構的巨大函數報告

**分析時間**: 2025-10-22

---

## 🔴 高優先級（嚴重問題）

### 1. **ConsultationArea.tsx** (1512 行)

**實際狀況**:

- **ConsultationArea 組件主體**: 1262 lines (L250-1512) 🔴🔴🔴
  - 包含：10+ useState, useMemo, useCallback
  - 包含：300+ 行的 mockCards 數據
  - 包含：大量拖放邏輯、卡片管理、籌碼管理
  - 包含：複雜的 JSX (多種遊戲模式渲染)

**重構優先級**: ⭐️⭐️⭐️⭐️⭐️ (最高 - 核心遊戲組件)

**影響範圍**: 核心遊戲邏輯，諮詢區域主要組件

**建議拆分方案**:

```typescript
// 拆成多個檔案
ConsultationArea/
├── index.tsx                    // 主組件 (< 100 lines)
├── hooks/
│   ├── useCardManagement.ts     // 卡片管理邏輯
│   ├── useGameRules.ts          // 遊戲規則邏輯
│   └── useDragAndDrop.ts        // 拖放邏輯
├── components/
│   ├── CardSelector.tsx         // 卡片選擇器
│   ├── GameArea.tsx             // 遊戲區域
│   └── AuxiliaryCards.tsx       // 輔助卡片
└── utils/
    ├── cardFilters.ts           // 卡片過濾函數
    └── validation.ts            // 驗證邏輯
```

---

### 2. **ClientManagement.tsx** (978 行) ❌ 分析錯誤已修正

**實際狀況**:

- 最大函數只有 35 行 (getRoomStatusBadge)
- 所有函數都 < 50 行，代碼健康
- **真正問題**：組件本身太大（978 行 JSX + 邏輯混在一起）

**重構優先級**: ⭐️⭐️⭐️ (中等)

**建議拆分方案**:

```typescript
ClientManagement/
├── index.tsx                    // 主組件 (< 200 lines)
├── components/
│   ├── ClientTable.tsx          // Desktop 表格視圖
│   ├── ClientCard.tsx           // Mobile 卡片視圖
│   ├── ClientRecords.tsx        // 諮詢記錄展開區
│   └── ClientModal.tsx          // 檢視/編輯 modal
└── hooks/
    └── useClientData.ts         // Data fetching logic
```

---

### 3. **LifeTransformationGame.tsx** (944 行)

**問題函數：**

- 🔴 **availableCards**: 195 lines (L470-664)
- 🔴 **getDeck**: 150 lines (L176-325)
- 🔴 **card render**: 138 lines (L741-878)

**重構優先級**: ⭐️⭐️⭐️⭐️

**建議**:

- 將 card render 邏輯拆成獨立組件 `GameCard.tsx`
- 將 deck 邏輯移到 service 或 hook

---

### 4. **backend/app/core/seeds.py** (1147 行)

**問題函數：**

- 🔴 **seed_crm_data**: 313 lines
- 🔴 **seed_career_cards**: 291 lines
- 🔴 **seed_value_cards**: 169 lines
- 🔴 **seed_skill_cards**: 169 lines

**重構優先級**: ⭐️⭐️⭐️

**建議拆分方案**:

```python
backend/app/core/seeds/
├── __init__.py
├── users.py          # seed_demo_users, seed_test_users
├── cards/
│   ├── __init__.py
│   ├── career.py     # seed_career_cards
│   ├── value.py      # seed_value_cards
│   └── skill.py      # seed_skill_cards
└── crm.py            # seed_crm_data
```

---

## 🟡 中優先級

### 5. **backend/app/api/clients.py** (758 行)

**狀況**: 檔案大但函數都還好（< 50 行）

**建議**: 可以考慮拆成多個 router 檔案

---

## 📊 統計摘要

| 檔案 | 總行數 | 最大函數行數 | 狀態 |
|------|--------|--------------|------|
| ConsultationArea.tsx | 1512 | 433 | 🔴 嚴重 |
| ClientManagement.tsx | 978 | 742 | 🔴 嚴重 |
| LifeTransformationGame.tsx | 944 | 195 | 🔴 嚴重 |
| seeds.py | 1147 | 313 | 🔴 嚴重 |
| clients.py | 758 | < 50 | 🟡 尚可 |

---

## ✅ 重構行動計畫

### Phase 1: 立即處理（本週）

- [ ] **ConsultationArea.tsx** - 最優先
  - [x] ✅ 步驟 1: 拆出 mockCards 數據到獨立檔案 (已完成 - 減少 296 行)
    - 創建 `frontend/src/data/mockCards.ts`
    - ConsultationArea.tsx: 1512 行 → 1216 行
  - [x] ✅ 步驟 2: 提取 useCardManagement hook (已完成 - 減少 115 行)
    - 創建 `frontend/src/hooks/useCardManagement.ts`
    - 創建 12 個單元測試 (100% 通過)
    - ConsultationArea.tsx: 1216 行 → 1101 行
  - [x] ✅ 步驟 3: 提取 useTokenManagement hook (已完成 - 減少 24 行)
    - 創建 `frontend/src/hooks/useTokenManagement.ts`
    - 創建 13 個單元測試 (100% 通過)
    - ConsultationArea.tsx: 1101 行 → 1077 行
  - [ ] 預期效果：主組件從 1262 行減少到 ~400 行 (目前已減至 1077 行，-435 行，-28.8%)

### Phase 2: 高優先級（本週）

- [ ] **ClientManagement.tsx**
  - [x] ✅ 步驟 1: 提取 useClientManagement hook (已完成 - 減少 101 行)
    - 創建 `frontend/src/hooks/useClientManagement.ts`
    - 創建 17 個單元測試
    - ClientManagement.tsx: 978 行 → 877 行
  - [x] ✅ 步驟 2: 拆分 ClientTableRow 組件 (Desktop 視圖) (已完成 - 減少 136 行)
    - 創建 `frontend/src/components/clients/ClientTableRow.tsx`
    - 創建 16 個單元測試 (100% 通過)
    - ClientManagement.tsx: 877 行 → 741 行
  - [x] ✅ 步驟 3: 拆分 ClientMobileCard 組件 (Mobile 視圖) (已完成 - 減少 92 行)
    - 創建 `frontend/src/components/clients/ClientMobileCard.tsx`
    - 創建 13 個單元測試 (100% 通過)
    - ClientManagement.tsx: 741 行 → 649 行
  - [ ] 預期效果：從 978 行減少到 ~300 行 (目前已減至 649 行，-329 行，-33.6%)

### Phase 3: 持續改進（兩週內）

- [ ] **LifeTransformationGame.tsx**
  - [ ] 拆分 card render 邏輯
  - [ ] 重構 deck 管理

- [ ] **backend/app/core/seeds.py**
  - [ ] 拆分成多個檔案
  - [ ] 每個 seed 獨立模組

---

## 📝 重構原則

1. **單一職責原則**
   - 每個函數只做一件事
   - 函數行數建議 < 50 行

2. **組件拆分原則**
   - 主組件 < 100 行
   - 複雜邏輯移到 hooks
   - UI 邏輯拆成子組件

3. **檔案大小原則**
   - 組件檔案 < 300 行
   - API 檔案 < 500 行
   - Utils 檔案 < 200 行

---

## ⚠️ 注意事項

**重構前必須**:

1. ✅ 確保現有測試全部通過
2. ✅ 為要重構的部分補充測試（TDD）
3. ✅ 一次重構一個檔案
4. ✅ 每次重構後跑測試確認沒破壞功能

**不要**:

- ❌ 一次重構多個檔案
- ❌ 在重構時加新功能
- ❌ 沒有測試就重構

---

**報告產生時間**: 2025-10-22
**下次檢查**: 重構完 Phase 1 後
