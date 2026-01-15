# 首頁產品展示區設計文檔

**日期**: 2026-01-16
**目標**: 打造「第二波視覺高潮」的互動式產品展示區
**設計理念**: 活潑有趣、互動性強、視覺震撼

---

## 一、整體視覺架構

### 1.1 區域定位
- **位置**: 插入在「How It Works」和「Features」之間
- **高度**: 全屏沉浸式（min-h-screen）
- **背景**: 淡色漸層 `bg-gradient-to-br from-amber-50/30 via-white to-teal-50/30`
- **裝飾元素**:
  - 右上角大圓形 blur (#7AB7B7/15, 500px)
  - 左下角小圓形 blur (#FFCC3A/20, 300px)

### 1.2 佈局概念
- 三張產品卡片呈「攤開在桌上」的不規則擺放
- 初始狀態：全部顯示「牌背」（品牌視覺）
- 卡片部分重疊，營造真實牌卡質感

---

## 二、滾動觸發的入場動畫

### 2.1 技術實現
- **偵測機制**: Intersection Observer API
- **觸發時機**: 區域進入視窗 50% 時
- **動畫技術**: CSS transform + transition

### 2.2 動畫編排
| 卡片 | 入場方向 | 旋轉角度 | 延遲時間 | 最終位置 |
|------|---------|---------|---------|---------|
| 職游旅人卡 | 左上飛入 | -15° | 0s | 左上 |
| 價值導航卡 | 右上飛入 | +8° | 0.2s | 右側 |
| 職能盤點卡 | 下方飛入 | -5° | 0.4s | 中下 |

### 2.3 動畫參數
- **持續時間**: 每張卡片 0.8s
- **緩動函數**: cubic-bezier(0.34, 1.56, 0.64, 1) (彈跳效果)
- **初始狀態**: opacity: 0, translateY(100px)
- **最終狀態**: opacity: 1, translateY(0)

---

## 三、互動翻轉機制

### 3.1 翻轉觸發
- **操作**: 點擊卡片
- **效果**: 3D 翻轉動畫（rotateY 180deg）
- **技術**: `transform-style: preserve-3d`
- **狀態管理**: React useState 追蹤每張卡片的 isFlipped 狀態

### 3.2 牌背設計（品牌視覺）

**職游旅人卡**
- 背景: `bg-gradient-to-br from-[#0056A7] to-[#003d75]`
- 中央圖示: 🧭 (text-8xl)
- 產品名稱: "職游旅人卡" (text-2xl font-bold text-white)
- 底部提示: "點擊翻開" (text-sm text-white/60)

**價值導航卡**
- 背景: `bg-gradient-to-br from-[#7AB7B7] to-[#5A9A9A]`
- 中央圖示: 💎 (text-8xl)
- 產品名稱: "價值導航卡" (text-2xl font-bold text-white)
- 底部提示: "點擊翻開" (text-sm text-white/60)

**職能盤點卡**
- 背景: `bg-gradient-to-br from-[#FFCC3A] to-[#E6B800]`
- 中央圖示: 📊 (text-8xl)
- 產品名稱: "職能盤點卡" (text-2xl font-bold text-white)
- 底部提示: "點擊翻開" (text-sm text-white/60)

### 3.3 牌面設計（產品資訊）

**佈局結構**
```
┌─────────────────┐
│ 🧭 職游旅人卡    │ ← 標題 (text-xl font-bold)
├─────────────────┤
│ [產品描述]       │ ← 2-3 行精簡描述 (text-sm)
│ ...             │
├─────────────────┤
│ 100 張卡        │ ← 關鍵數字 (text-4xl font-black)
│ 大學生・新鮮人   │ ← 適用對象 (text-xs)
├─────────────────┤
│ [了解更多 →]     │ ← CTA 按鈕
└─────────────────┘
```

**文字內容**

*職游旅人卡*
- 描述: "100 張職業資訊卡，透過職業卡的多元分類與六大興趣分類，快速找到喜歡的職業。"
- 數字: "100 張卡"
- 對象: "大學生・職場新鮮人"

*價值導航卡*
- 描述: "71 張價值導航卡，系統性地釐清核心價值觀，以價值為核心重新對生活做出選擇。"
- 數字: "71 張卡"
- 對象: "全年齡適用"

*職能盤點卡*
- 描述: "43 張職能盤點卡，系統性盤點能力資本，清楚定位優劣勢，規劃職涯藍圖。"
- 數字: "43 張卡"
- 對象: "學生・職場工作者"

### 3.4 翻轉動畫參數
- **持續時間**: 0.6s
- **緩動函數**: ease-out
- **backface-visibility**: hidden (隱藏背面)
- **perspective**: 1000px (3D 視角深度)

---

## 四、微互動細節

### 4.1 Hover 效果
- 卡片上浮: `translateY(-10px)`
- 陰影加深: `shadow-lg → shadow-2xl`
- 過渡時間: 0.3s

### 4.2 聚焦效果
- 翻轉時其他卡片縮小: `scale(0.95)`
- 翻轉卡片邊緣微光:
  - 職游旅人卡: `shadow-[0_0_30px_rgba(0,86,167,0.5)]`
  - 價值導航卡: `shadow-[0_0_30px_rgba(122,183,183,0.5)]`
  - 職能盤點卡: `shadow-[0_0_30px_rgba(255,204,58,0.5)]`

### 4.3 點擊反饋
- 點擊時短暫縮放: `scale(0.98)` (0.1s)
- 翻轉開始前的準備動作

---

## 五、響應式設計

### 5.1 桌面版（≥1024px）
- 卡片尺寸: 300px × 420px
- 不規則擺放位置:
  - 職游旅人卡: `left-[10%] top-[15%] rotate-[-15deg]`
  - 價值導航卡: `right-[10%] top-[25%] rotate-[8deg]`
  - 職能盤點卡: `left-[35%] bottom-[15%] rotate-[-5deg]`

### 5.2 平板版（768px - 1023px）
- 卡片尺寸: 260px × 360px
- 旋轉角度減半
- 垂直間距增加

### 5.3 手機版（< 768px）
- 卡片垂直堆疊 (flex-col gap-6)
- 卡片寬度: 90vw
- 旋轉角度取消: `rotate(0deg)`
- 滾動動畫簡化: 僅淡入 (opacity 0 → 1)
- 卡片尺寸: 90vw × 480px

---

## 六、無障礙設計

### 6.1 鍵盤操作
- 卡片支援 Tab 導航
- Enter/Space 鍵觸發翻轉
- Focus 狀態明確可見: `ring-2 ring-offset-2`

### 6.2 語意化標記
- Section 使用 `<section aria-label="產品展示">`
- 卡片使用 `<button aria-label="翻轉職游旅人卡">`
- 翻轉狀態 ARIA 提示: `aria-pressed={isFlipped}`

### 6.3 動畫偏好
- 尊重系統設置: `@media (prefers-reduced-motion: reduce)`
- 減弱動畫用戶: 取消飛入動畫，僅保留翻轉效果

---

## 七、技術實作要點

### 7.1 React Hooks
```typescript
const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
const [isVisible, setIsVisible] = useState(false);
const sectionRef = useRef<HTMLElement>(null);
```

### 7.2 Intersection Observer
```typescript
useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
      }
    },
    { threshold: 0.3 }
  );

  if (sectionRef.current) {
    observer.observe(sectionRef.current);
  }

  return () => observer.disconnect();
}, []);
```

### 7.3 翻轉處理
```typescript
const handleCardFlip = (cardId: string) => {
  setFlippedCards(prev => {
    const newSet = new Set(prev);
    if (newSet.has(cardId)) {
      newSet.delete(cardId);
    } else {
      newSet.add(cardId);
    }
    return newSet;
  });
};
```

---

## 八、效能優化

### 8.1 動畫效能
- 使用 CSS transform（GPU 加速）
- 避免使用 top/left 屬性動畫
- will-change: transform（提前通知瀏覽器）

### 8.2 重繪優化
- 翻轉時僅重繪當前卡片
- 使用 transform: translateZ(0) 創建新圖層

---

## 九、開發檢查清單

### 實作階段
- [ ] 創建 ProductShowcase 組件
- [ ] 實作 Intersection Observer 入場動畫
- [ ] 實作 3D 翻轉卡片組件
- [ ] 添加三張卡片的牌背設計
- [ ] 添加三張卡片的牌面內容
- [ ] 實作 hover 微互動
- [ ] 響應式斷點調整

### 測試階段
- [ ] 桌面瀏覽器測試（Chrome, Safari, Firefox）
- [ ] 平板測試（iPad）
- [ ] 手機測試（iOS, Android）
- [ ] 鍵盤導航測試
- [ ] 螢幕閱讀器測試
- [ ] 效能測試（60fps 驗證）
- [ ] 減弱動畫偏好測試

### 整合階段
- [ ] 插入 page.tsx 正確位置（line 206 之後）
- [ ] 與上下區域間距協調
- [ ] Build 驗證無錯誤
- [ ] 視覺一致性檢查
- [ ] Code review
- [ ] 部署到 staging 測試

---

## 十、預期成果

**視覺效果**
- 訪客滾動到此區域時，三張卡片依序飛入並旋轉落地
- 卡片呈不規則擺放，營造真實牌卡在桌上的感覺
- 點擊卡片觸發流暢的 3D 翻轉動畫
- Hover 時卡片上浮並加深陰影

**互動體驗**
- 訪客可以「玩」這些卡片（點擊翻轉、hover 互動）
- 翻轉後可查看產品詳細資訊
- 點擊「了解更多」導向 navicareer.tw

**技術品質**
- 60fps 流暢動畫
- 響應式完美適配
- 無障礙合規
- 零 console 錯誤

---

**設計核心**: 讓訪客「體驗」牌卡的互動性，而非只是「閱讀」產品資訊。
