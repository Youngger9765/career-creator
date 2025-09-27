# 生活改造王遊戲特色功能文檔

## 🎯 遊戲概念

**生活改造王**是價值導航卡模式下的創新玩法，採用**籌碼分配系統**幫助來訪者重新思考生活資源分配。

### 核心理念

- **100個生活能量籌碼**：象徵個人的時間、精力、注意力等有限資源
- **價值卡轉籌碼工具**：拖曳價值卡自動變成籌碼分配介面
- **動態圓餅圖**：即時視覺化呈現資源分配狀況
- **自主規劃**：可自訂卡片數量和總籌碼數

## 🧩 核心組件

### 1. CardTokenWidget - 卡片籌碼分配工具

#### 設計特色

**位置**: `frontend/src/components/games/CardTokenWidget.tsx`

```typescript
interface CardTokenWidgetProps {
  card: CardData;           // 價值卡資料
  allocation?: TokenAllocation;  // 當前籌碼分配
  onAllocationChange: (amount: number) => void;  // 籌碼變化回調
  onRemove: () => void;     // 移除卡片回調
  maxTokens?: number;       // 最大籌碼數（預設100）
}
```

#### 功能特點

1. **緊湊佈局設計**
   - 卡片標題區域：價值卡資訊 + 快速調整按鈕
   - 籌碼控制區域：滑桿 + 精確輸入 + 微調按鈕

2. **多重操作方式**
   - 🎛️ **滑桿控制**：直觀拖拽分配
   - 🔢 **數字輸入**：精確輸入籌碼數
   - ⚡ **快速按鈕**：+10, +20, -10 快速調整
   - 🔧 **微調按鈕**：+1, -1 精細調整

3. **智能防護機制**
   - 總籌碼不能超過設定上限
   - 自動計算其他卡片已用籌碼
   - 即時顯示可用籌碼餘額

4. **視覺回饋系統**
   - 即時顯示當前分配數值和百分比
   - 滑桿漸層顏色反映分配程度
   - 按鈕狀態反映操作可用性

#### 創新設計亮點

**按鈕位置優化**：快速調整按鈕移動到卡片標題旁邊，節省垂直空間，提升操作效率。

```typescript
{/* 快速調整按鈕移至標題旁 */}
<div className="flex space-x-1">
  <Button onClick={() => handleQuickAdjust(10)}>+10</Button>
  <Button onClick={() => handleQuickAdjust(20)}>+20</Button>
  <Button onClick={() => handleQuickAdjust(-10)}>-10</Button>
</div>
```

### 2. LifeTransformationGame - 主遊戲組件

#### 設計架構

**位置**: `frontend/src/components/games/LifeTransformationGame.tsx`

#### 核心狀態管理

```typescript
const [tokenAllocations, setTokenAllocations] = useState<TokenAllocation[]>([]);
const [selectedCards, setSelectedCards] = useState<string[]>([]);
const [maxCards, setMaxCards] = useState(10);      // 可調整卡片上限
const [totalTokens, setTotalTokens] = useState(100); // 可調整籌碼總數
```

#### 創新功能

1. **拖曳自動轉換系統**
   ```typescript
   // 拖曳價值卡自動變成籌碼分配工具
   const handleCardAdd = (cardId: string) => {
     setSelectedCards(prev => [...prev, cardId]);
     setTokenAllocations(prev => [...prev, {
       area: cardId,
       amount: 0,
       percentage: 0,
     }]);
   };
   ```

2. **智能籌碼分配算法**
   ```typescript
   // 防止超量分配的智能限制
   const maxAvailable = totalTokens - otherAllocations;
   const finalAmount = Math.min(amount, maxAvailable);
   ```

3. **可編輯遊戲設定**
   - 最多卡片數：可動態調整選擇卡片的上限
   - 總籌碼數：可設定不同的籌碼總量（預設100）

## 📊 動態圓餅圖可視化

### 設計特點

1. **即時更新**：籌碼分配變化立即反映在圓餅圖上
2. **色彩區分**：每個價值領域使用不同顏色
3. **數值顯示**：扇形區域內顯示籌碼數量（比例>5%時）
4. **中心統計**：顯示已用籌碼總數和總籌碼數
5. **圖例說明**：下方列表顯示顏色對應的價值和數值

### 技術實現

```typescript
// SVG 圓餅圖動態計算
const angle = (percentage / 100) * 360;
const pathData = [
  `M 100 100`,
  `L ${x1} ${y1}`,
  `A 80 80 0 ${largeArc} 1 ${x2} ${y2}`,
  'Z'
].join(' ');
```

### 視覺效果

- **10種顏色循環**：green, blue, amber, red, violet, cyan, orange, lime, pink, indigo
- **動態文字**：只在扇形面積足夠大時顯示數值（避免擁擠）
- **響應式設計**：圖例區域可滾動，適應不同螢幕尺寸

## 🎮 遊戲流程設計

### 1. 初始狀態
- 左側：價值導航卡堆疊（36張核心價值卡）
- 右側：空白畫布，提示拖曳操作

### 2. 卡片選擇階段
- 拖曳價值卡到畫布
- 卡片自動轉換為籌碼分配工具
- 最多可選擇10張（可調整）

### 3. 籌碼分配階段
- 使用滑桿、按鈕或直接輸入分配籌碼
- 即時顯示剩餘可用籌碼
- 圓餅圖動態更新分配狀況

### 4. 分析討論階段
- 諮詢師引導來訪者觀察分配結果
- 討論理想分配與現實落差
- 制定生活改造行動計畫

## 🛠️ 技術創新點

### 1. 組件化設計
- **CardTokenWidget**：可復用的籌碼分配組件
- **動態圓餅圖**：實時計算和渲染
- **響應式佈局**：GameLayout統一佈局管理

### 2. 狀態管理創新
- **獨立狀態隔離**：不同遊戲模式狀態互不影響
- **樂觀更新**：操作立即反映，提升使用體驗
- **智能約束**：自動防止籌碼超量分配

### 3. 用戶體驗優化
- **緊湊佈局**：快速按鈕移至標題區，節省空間
- **多重操作**：滑桿、按鈕、輸入框多種操作方式
- **即時回饋**：視覺化圓餅圖提供即時反饋

## 🎯 諮詢應用場景

### 適用對象
- 生活失衡感強烈的來訪者
- 需要重新規劃生活重心的人群
- 追求工作生活平衡的職場人士

### 諮詢目標
1. **現況覺察**：了解當前生活資源分配狀況
2. **理想規劃**：設計理想的生活資源分配
3. **差距分析**：找出現實與理想的落差
4. **行動計畫**：制定具體的生活改造步驟

### 諮詢師指導要點
1. 引導來訪者選擇最重要的價值領域（不超過10個）
2. 協助思考每個領域應該分配多少生活能量
3. 透過圓餅圖視覺化幫助來訪者理解分配狀況
4. 討論如何調整分配以達到更理想的生活狀態

## 📈 未來擴展方向

### 短期優化
- 加入分配建議功能（AI推薦）
- 支援預設分配模板
- 增加歷史記錄比較

### 長期發展
- 多維度分配（時間、精力、金錢等）
- 分配效果追蹤功能
- 個人化分配建議系統

---

*Version: 1.0*  
*Date: 2025-09-28*  
*Status: 完整實現，可投入使用*  
*Innovation: 首創籌碼分配系統 + 拖曳轉換機制*