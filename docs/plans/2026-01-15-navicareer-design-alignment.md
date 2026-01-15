# Career Creator 設計改版計畫 - 對齊 Navicareer.tw

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**目標：** 將 Career Creator 的視覺設計對齊 Navicareer.tw 的專業、溫暖、有機風格

**架構：** 採用漸進式改版策略，從核心配色系統開始，逐步優化按鈕、卡片、佈局等元件，最後加入裝飾性元素和真人照片。

**技術棧：** Next.js 14, Tailwind CSS, TypeScript, React

---

## 階段一：設計系統基礎建立

### Task 1: 建立 Navicareer 配色 Token

**目標：** 在 Tailwind 配置中加入 Navicareer 品牌色

**檔案：**
- 修改: `frontend/tailwind.config.ts`

**Step 1: 讀取現有 Tailwind 配置**

確認目前的配色系統結構。

**Step 2: 加入 Navicareer 品牌色**

在 `tailwind.config.ts` 的 `theme.extend.colors` 中加入：

```typescript
colors: {
  // Navicareer 品牌色
  'brand-gold': {
    DEFAULT: '#F5B942',
    light: '#FFB84D',
    dark: '#E5A932',
  },
  'brand-teal': {
    DEFAULT: '#5DBAAE',
    light: '#6DCDC1',
    dark: '#4DB8A8',
  },
  'brand-navy': {
    DEFAULT: '#2C4A6B',
    light: '#3A5A7B',
    dark: '#1E3A5F',
  },
  'brand-orange': {
    DEFAULT: '#FF6B35',
    light: '#FF7849',
  },
  'brand-yellow-soft': '#FFE5B4',
}
```

**Step 3: 測試配色 Token**

建立測試頁面驗證顏色是否正確載入：

```bash
npm run dev
```

訪問任一頁面，在開發者工具中測試 `bg-brand-gold` 等類別。

**Step 4: Commit**

```bash
git add frontend/tailwind.config.ts
git commit -m "feat: add Navicareer brand colors to Tailwind config"
```

---

### Task 2: 更新主色調應用

**目標：** 將現有的多彩色按鈕統一為 Navicareer 配色方案

**檔案：**
- 修改: `frontend/src/app/page.tsx` (首頁)
- 修改: `frontend/src/app/login/page.tsx` (登入頁)

**Step 1: 更新首頁 CTA 按鈕**

將「諮詢師登入」按鈕改為品牌金：

```tsx
// 從
<button className="... bg-orange-500 hover:bg-orange-600">
  諮詢師登入
</button>

// 改為
<button className="... bg-brand-gold hover:bg-brand-gold-dark">
  諮詢師登入
</button>
```

將「加入諮詢室」按鈕改為品牌青：

```tsx
// 從
<button className="... bg-teal-500 hover:bg-teal-600">
  加入諮詢室
</button>

// 改為
<button className="... bg-brand-teal hover:bg-brand-teal-dark">
  加入諮詢室
</button>
```

**Step 2: 測試視覺效果**

```bash
npm run dev
```

檢查首頁按鈕顏色是否符合設計規範。

**Step 3: Commit**

```bash
git add frontend/src/app/page.tsx
git commit -m "style: update homepage CTA buttons to Navicareer colors"
```

---

### Task 3: 建立通用按鈕元件

**目標：** 建立符合 Navicareer 設計規範的按鈕元件

**檔案：**
- 建立: `frontend/src/components/ui/Button.tsx`
- 建立: `frontend/src/components/ui/Button.test.tsx`

**Step 1: 撰寫按鈕元件測試**

```typescript
// frontend/src/components/ui/Button.test.tsx
import { render, screen } from '@testing-library/react';
import Button from './Button';

describe('Button', () => {
  it('renders primary button with correct styles', () => {
    render(<Button variant="primary">測試按鈕</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('bg-black');
    expect(button).toHaveClass('rounded-full');
  });

  it('renders secondary button with correct styles', () => {
    render(<Button variant="secondary">測試按鈕</Button>);
    const button = screen.getByRole('button');

    expect(button).toHaveClass('border-2');
    expect(button).toHaveClass('border-black');
  });
});
```

**Step 2: 執行測試確認失敗**

```bash
npm test Button.test.tsx
```

預期：FAIL - "Cannot find module './Button'"

**Step 3: 實作按鈕元件**

```tsx
// frontend/src/components/ui/Button.tsx
'use client';

import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'brand-gold' | 'brand-teal';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}) => {
  const baseStyles = 'px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg';

  const variantStyles = {
    primary: 'bg-black text-white hover:bg-gray-800 hover:shadow-xl',
    secondary: 'bg-transparent text-black border-2 border-black hover:bg-gray-50',
    'brand-gold': 'bg-brand-gold text-white hover:bg-brand-gold-dark hover:shadow-xl',
    'brand-teal': 'bg-brand-teal text-white hover:bg-brand-teal-dark hover:shadow-xl',
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
```

**Step 4: 執行測試確認通過**

```bash
npm test Button.test.tsx
```

預期：PASS - 2/2 tests passed

**Step 5: Commit**

```bash
git add frontend/src/components/ui/Button.tsx frontend/src/components/ui/Button.test.tsx
git commit -m "feat: create Navicareer-style Button component with tests"
```

---

## 階段二：卡片與佈局優化

### Task 4: 更新卡片元件設計

**目標：** 優化卡片的陰影、圓角、hover 效果以符合 Navicareer 風格

**檔案：**
- 修改: `frontend/src/components/game-cards/CardItem.tsx`

**Step 1: 更新卡片基礎樣式**

找到 CardItem 的主要 div，更新 className：

```tsx
// 找到目前的樣式
<div className="... rounded-xl shadow-sm hover:shadow-lg">

// 改為 Navicareer 風格
<div className="... rounded-2xl shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
```

**Step 2: 測試卡片 Hover 效果**

```bash
npm run dev
```

進入諮詢室 → 選擇任一玩法 → 測試卡片 hover 是否有明顯上移 + 陰影增強效果。

**Step 3: Commit**

```bash
git add frontend/src/components/game-cards/CardItem.tsx
git commit -m "style: enhance card hover effects to match Navicareer design"
```

---

### Task 5: 建立深色統計卡片元件

**目標：** 建立 Navicareer 風格的深色統計展示卡片

**檔案：**
- 建立: `frontend/src/components/ui/StatsCard.tsx`
- 建立: `frontend/src/components/ui/StatsCard.test.tsx`

**Step 1: 撰寫統計卡片測試**

```typescript
// frontend/src/components/ui/StatsCard.test.tsx
import { render, screen } from '@testing-library/react';
import StatsCard from './StatsCard';

describe('StatsCard', () => {
  it('renders stats card with number and label', () => {
    render(<StatsCard number="42" label="張卡片" />);

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('張卡片')).toBeInTheDocument();
  });

  it('applies dark gradient background', () => {
    const { container } = render(<StatsCard number="100" label="客戶" />);
    const card = container.firstChild;

    expect(card).toHaveClass('bg-gradient-to-br');
    expect(card).toHaveClass('from-brand-navy');
  });
});
```

**Step 2: 執行測試確認失敗**

```bash
npm test StatsCard.test.tsx
```

**Step 3: 實作統計卡片元件**

```tsx
// frontend/src/components/ui/StatsCard.tsx
'use client';

import React from 'react';

interface StatsCardProps {
  number: string;
  label: string;
  icon?: React.ReactNode;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  number,
  label,
  icon,
  className = '',
}) => {
  return (
    <div className={`bg-gradient-to-br from-brand-navy to-brand-navy-dark text-white rounded-3xl p-8 ${className}`}>
      {icon && (
        <div className="text-brand-gold mb-4 text-3xl">
          {icon}
        </div>
      )}
      <div className="text-5xl font-black mb-2">{number}</div>
      <div className="text-base font-medium opacity-90">{label}</div>
    </div>
  );
};

export default StatsCard;
```

**Step 4: 執行測試確認通過**

```bash
npm test StatsCard.test.tsx
```

**Step 5: Commit**

```bash
git add frontend/src/components/ui/StatsCard.tsx frontend/src/components/ui/StatsCard.test.tsx
git commit -m "feat: create StatsCard component with Navicareer dark gradient style"
```

---

## 階段三：裝飾性元素與動畫

### Task 6: 建立有機形狀背景元件

**目標：** 建立不規則圓形背景裝飾元件

**檔案：**
- 建立: `frontend/src/components/ui/OrganicShape.tsx`

**Step 1: 建立有機形狀 SVG 元件**

```tsx
// frontend/src/components/ui/OrganicShape.tsx
'use client';

import React from 'react';

interface OrganicShapeProps {
  color?: 'teal' | 'yellow' | 'gray';
  size?: 'sm' | 'md' | 'lg';
  position?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  className?: string;
}

const OrganicShape: React.FC<OrganicShapeProps> = ({
  color = 'teal',
  size = 'md',
  position = {},
  className = '',
}) => {
  const colorClasses = {
    teal: 'bg-brand-teal/10',
    yellow: 'bg-brand-yellow-soft/20',
    gray: 'bg-gray-200/30',
  };

  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-64 h-64',
    lg: 'w-96 h-96',
  };

  const positionStyles = {
    top: position.top,
    bottom: position.bottom,
    left: position.left,
    right: position.right,
  };

  return (
    <div
      className={`absolute ${sizeClasses[size]} ${colorClasses[color]} rounded-full blur-3xl ${className}`}
      style={positionStyles}
      aria-hidden="true"
    />
  );
};

export default OrganicShape;
```

**Step 2: 測試背景裝飾**

在首頁加入測試：

```tsx
// 在 frontend/src/app/page.tsx 加入
import OrganicShape from '@/components/ui/OrganicShape';

// 在適當位置加入
<div className="relative">
  <OrganicShape color="teal" size="lg" position={{ top: '-10%', right: '-5%' }} />
  <OrganicShape color="yellow" size="md" position={{ bottom: '10%', left: '5%' }} />
  {/* 其他內容 */}
</div>
```

**Step 3: Commit**

```bash
git add frontend/src/components/ui/OrganicShape.tsx
git commit -m "feat: create organic shape background decoration component"
```

---

## 階段四：響應式與細節優化

### Task 7: 優化間距系統

**目標：** 調整全站間距以提升空白感和呼吸感

**檔案：**
- 修改: `frontend/src/app/dashboard/page.tsx`
- 修改: `frontend/src/components/game-canvases/TwoZoneCanvas.tsx`

**Step 1: 增加容器內邊距**

在 dashboard 頁面：

```tsx
// 找到主容器
<div className="p-6">

// 改為
<div className="p-8 lg:p-12">
```

**Step 2: 增加元件間距**

```tsx
// 卡片之間的間距
<div className="gap-4">

// 改為
<div className="gap-6 lg:gap-8">
```

**Step 3: 測試響應式間距**

在不同螢幕尺寸下測試（手機、平板、桌面）。

**Step 4: Commit**

```bash
git add frontend/src/app/dashboard/page.tsx frontend/src/components/game-canvases/TwoZoneCanvas.tsx
git commit -m "style: increase spacing for better breathability"
```

---

### Task 8: 更新字體字重

**目標：** 加強標題字重以符合 Navicareer 的視覺層級

**檔案：**
- 修改: `frontend/src/components/common/GameLayout.tsx`
- 修改: `frontend/src/app/room/[roomId]/page.tsx`

**Step 1: 更新主標題字重**

```tsx
// 找到 h1 或大標題
<h1 className="text-2xl font-semibold">

// 改為
<h1 className="text-3xl lg:text-4xl font-black">
```

**Step 2: 更新次標題字重**

```tsx
// h2 或次標題
<h2 className="text-xl font-medium">

// 改為
<h2 className="text-2xl font-bold">
```

**Step 3: 測試視覺層級**

確認標題層級清晰分明。

**Step 4: Commit**

```bash
git add frontend/src/components/common/GameLayout.tsx frontend/src/app/room/[roomId]/page.tsx
git commit -m "style: enhance heading font weights for visual hierarchy"
```

---

## 階段五：圖片與品牌元素

### Task 9: 準備品牌圖片資源

**目標：** 從 Navicareer.tw 下載並整理品牌圖片

**檔案：**
- 建立目錄: `frontend/public/images/brand/`

**Step 1: 建立圖片目錄**

```bash
mkdir -p frontend/public/images/brand
```

**Step 2: 下載職游 Logo**

從 https://navicareer.tw/ 下載：
- Logo（全彩版）
- Logo（純白版）
- Logo（純黑版）

儲存至 `frontend/public/images/brand/`

**Step 3: 下載參考照片**

從 Google 圖片搜尋「職游」：
https://www.google.com/search?q=%E8%81%B7%E6%B8%B8&udm=2

下載：
- 真人照片（專業形象）
- 辦公環境照片
- 諮詢場景照片

儲存至 `frontend/public/images/brand/photos/`

**Step 4: 優化圖片尺寸**

使用 Sharp 或線上工具壓縮圖片（目標：<500KB）

**Step 5: Commit**

```bash
git add frontend/public/images/brand/
git commit -m "assets: add Navicareer brand images and photos"
```

---

### Task 10: 更新 Logo 使用

**目標：** 將專案 Logo 替換為職游 Logo

**檔案：**
- 修改: `frontend/src/app/page.tsx`
- 修改: `frontend/src/components/layout/Header.tsx`（如有）

**Step 1: 更新首頁 Logo**

```tsx
// frontend/src/app/page.tsx
import Image from 'next/image';

// 在適當位置
<Image
  src="/images/brand/navicareer-logo.svg"
  alt="職游 Logo"
  width={180}
  height={60}
  priority
/>
```

**Step 2: 測試 Logo 顯示**

```bash
npm run dev
```

確認 Logo 清晰顯示，尺寸適當。

**Step 3: Commit**

```bash
git add frontend/src/app/page.tsx
git commit -m "style: update to Navicareer brand logo"
```

---

## 階段六：整合測試與優化

### Task 11: 視覺回歸測試

**目標：** 使用 Playwright 截圖測試確保視覺一致性

**檔案：**
- 建立: `frontend/tests/visual/design-alignment.spec.ts`

**Step 1: 撰寫視覺測試**

```typescript
// frontend/tests/visual/design-alignment.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Design Alignment - Navicareer Style', () => {
  test('homepage buttons use correct brand colors', async ({ page }) => {
    await page.goto('/');

    const counselorButton = page.locator('text=諮詢師登入');
    await expect(counselorButton).toHaveCSS('background-color', 'rgb(245, 185, 66)'); // brand-gold
  });

  test('cards have enhanced shadow on hover', async ({ page }) => {
    await page.goto('/dashboard');

    const card = page.locator('.card').first();
    await card.hover();

    const box = await card.boundingBox();
    await expect(card).toHaveCSS('transform', 'matrix(1, 0, 0, 1, 0, -4)'); // translateY(-4px)
  });
});
```

**Step 2: 執行視覺測試**

```bash
npx playwright test design-alignment.spec.ts
```

**Step 3: 如有失敗，修正後重測**

**Step 4: Commit**

```bash
git add frontend/tests/visual/design-alignment.spec.ts
git commit -m "test: add visual regression tests for design alignment"
```

---

### Task 12: 效能優化 - 圖片懶加載

**目標：** 優化圖片載入以提升頁面效能

**檔案：**
- 修改: 所有使用 `<Image>` 的檔案

**Step 1: 加入 loading="lazy"**

```tsx
<Image
  src="/images/brand/photo.jpg"
  alt="描述"
  width={800}
  height={600}
  loading="lazy"
/>
```

**Step 2: 測試頁面載入速度**

使用 Lighthouse 測試：

```bash
npm run build
npm run start
# 在 Chrome DevTools 執行 Lighthouse
```

目標：Performance score > 90

**Step 3: Commit**

```bash
git add .
git commit -m "perf: add lazy loading to images"
```

---

### Task 13: 建立設計系統文檔頁面

**目標：** 建立內部設計系統展示頁面

**檔案：**
- 建立: `frontend/src/app/design-system/page.tsx`

**Step 1: 建立設計系統展示頁**

```tsx
// frontend/src/app/design-system/page.tsx
'use client';

import React from 'react';
import Button from '@/components/ui/Button';
import StatsCard from '@/components/ui/StatsCard';

export default function DesignSystemPage() {
  return (
    <div className="p-12 space-y-16">
      <h1 className="text-4xl font-black">Career Creator 設計系統</h1>

      {/* 配色展示 */}
      <section>
        <h2 className="text-2xl font-bold mb-6">配色系統</h2>
        <div className="grid grid-cols-5 gap-4">
          <div className="h-24 bg-brand-gold rounded-lg" />
          <div className="h-24 bg-brand-teal rounded-lg" />
          <div className="h-24 bg-brand-navy rounded-lg" />
          <div className="h-24 bg-brand-orange rounded-lg" />
          <div className="h-24 bg-brand-yellow-soft rounded-lg" />
        </div>
      </section>

      {/* 按鈕展示 */}
      <section>
        <h2 className="text-2xl font-bold mb-6">按鈕</h2>
        <div className="flex gap-4">
          <Button variant="primary">主要按鈕</Button>
          <Button variant="secondary">次要按鈕</Button>
          <Button variant="brand-gold">品牌金按鈕</Button>
          <Button variant="brand-teal">品牌青按鈕</Button>
        </div>
      </section>

      {/* 統計卡片展示 */}
      <section>
        <h2 className="text-2xl font-bold mb-6">統計卡片</h2>
        <div className="grid grid-cols-3 gap-6">
          <StatsCard number="42" label="張卡片" />
          <StatsCard number="7K" label="諮詢時數" />
          <StatsCard number="100K" label="用戶訪問" />
        </div>
      </section>
    </div>
  );
}
```

**Step 2: 測試設計系統頁面**

訪問 `http://localhost:3000/design-system`

**Step 3: Commit**

```bash
git add frontend/src/app/design-system/page.tsx
git commit -m "feat: create design system showcase page"
```

---

## 驗收標準

完成所有 Task 後，應符合以下標準：

### 視覺設計
- [ ] 主色調使用品牌金 (#F5B942) 和職游青 (#5DBAAE)
- [ ] 按鈕為全圓角（rounded-full）
- [ ] 按鈕 hover 有上移 + 陰影增強效果
- [ ] 卡片使用 rounded-2xl 和柔和陰影
- [ ] 標題使用粗字重（font-bold/font-black）

### 功能性
- [ ] 所有元件有 TypeScript 型別
- [ ] 關鍵元件有單元測試
- [ ] 視覺效果有 Playwright 測試
- [ ] 響應式設計在手機/平板/桌面都正常

### 效能
- [ ] Lighthouse Performance > 90
- [ ] 圖片已優化（<500KB）
- [ ] 使用 Next.js Image 元件
- [ ] 懶加載非關鍵圖片

### 文檔
- [ ] 設計系統展示頁面可訪問
- [ ] 每個新元件都有使用範例
- [ ] Git commit 訊息遵循 Conventional Commits

---

## 後續改進建議

完成基礎改版後，可考慮：

1. **首頁重設計**：參考 Navicareer Hero Section
2. **加入真人照片**：諮詢師頭像、客戶使用場景
3. **動畫優化**：加入微互動（按鈕點擊動畫、頁面切換過渡）
4. **無障礙提升**：確保 WCAG AA 合規
5. **暗黑模式**：如品牌允許，可考慮暗黑模式變體

---

**最後更新**：2026-01-15
**預估時間**：6-8 小時（分 3-4 個工作階段）
**技術債務**：無
**依賴項**：需確保 Tailwind CSS 3.0+ 和 Next.js 14+
