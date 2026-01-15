# Navicareer.tw 設計系統分析

> 撰寫時間：2026-01-15
> 目的：作為 Career Creator 設計改版的參考標準

---

## 📋 概述

Navicareer.tw 是職涯諮詢品牌「職游」的官方網站，其設計風格展現了專業、溫暖、親和的品牌特質。本文檔詳細記錄其設計系統，供 Career Creator 平台改版參考。

---

## 🎨 一、配色系統

### 1.1 主色調

> **更新時間：2026-01-15**
> **來源：從 navicareer.tw 實際網站抽取**

| 色彩名稱 | 精確色值 | RGB | 用途 | 示例 |
|---------|---------|-----|------|------|
| **品牌金** | `#FFCC3A` | `rgb(255, 204, 58)` | 主要 CTA、強調元素、標籤 | 「立即報名」按鈕、統計數字背景 |
| **職游青** | `#7AB7B7` | `rgb(122, 183, 183)` | 次要 CTA、區塊背景 | 「我要預約諮詢」區域 |
| **深海藍** | `#0056A7` | `rgb(0, 86, 167)` | 專業形象、制服、深色卡片 | 創辦人西裝、統計卡片背景 |
| **純黑** | `#000000` | `rgb(0, 0, 0)` | 主要按鈕 | 黑色 CTA 按鈕 |

### 1.2 中性色

| 色彩 | 色值（推測） | 用途 |
|-----|-------------|------|
| **純白** | `#FFFFFF` | 主背景、卡片背景 |
| **淺灰** | `#F7F7F7` ~ `#F0F0F0` | 次要背景 |
| **文字黑** | `#1A1A1A` ~ `#2D2D2D` | 主要文字 |
| **文字灰** | `#6B7280` | 次要文字、描述 |

### 1.3 輔助色

| 色彩 | 色值（推測） | 用途 |
|-----|-------------|------|
| **強調橙** | `#FF6B35` ~ `#FF7849` | 強調文字、小裝飾 |
| **柔和黃** | `#FFE5B4` | 標籤、柔和背景 |

---

## 🔤 二、字體系統

### 2.1 字體家族

```css
font-family:
  "Noto Sans TC",
  -apple-system,
  BlinkMacSystemFont,
  "Segoe UI",
  "Microsoft JhengHei",
  sans-serif;
```

### 2.2 字重（Font Weight）

| 層級 | 字重 | 用途 |
|------|------|------|
| **超粗** | 900 | 大標題（Hero） |
| **粗體** | 700 | 小標題、按鈕 |
| **中等** | 500 | 強調文字 |
| **常規** | 400 | 正文、描述 |

### 2.3 字號系統（推測）

| 層級 | 尺寸 | Line Height | 用途 |
|------|------|-------------|------|
| **H1** | 48-56px | 1.2 | 首頁大標題 |
| **H2** | 36-42px | 1.3 | 區塊標題 |
| **H3** | 24-28px | 1.4 | 卡片標題 |
| **Body** | 16-18px | 1.6 | 正文 |
| **Small** | 14px | 1.5 | 輔助文字 |

---

## 🧩 三、UI 元件設計

### 3.1 按鈕（Buttons）

#### 主要 CTA（Primary）
```css
background: #000000;
color: #FFFFFF;
border-radius: 999px; /* 全圓角 */
padding: 16px 32px;
font-weight: 700;
font-size: 18px;
transition: all 0.3s ease;

/* Hover 狀態 */
background: #2D2D2D;
transform: translateY(-2px);
box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
```

#### 次要 CTA（Secondary）
```css
background: transparent;
color: #2D2D2D;
border: 2px solid #2D2D2D;
border-radius: 999px;
padding: 14px 30px;
font-weight: 600;
```

### 3.2 卡片（Cards）

#### 標準卡片
```css
background: #FFFFFF;
border-radius: 16px;
padding: 24px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
transition: all 0.3s ease;

/* Hover 狀態 */
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
transform: translateY(-4px);
```

#### 深色統計卡片
```css
background: linear-gradient(135deg, #2C4A6B 0%, #1E3A5F 100%);
color: #FFFFFF;
border-radius: 24px;
padding: 32px;
```

### 3.3 標籤（Tags/Badges）

```css
background: #FFE5B4;
color: #2D2D2D;
border-radius: 999px;
padding: 6px 16px;
font-size: 14px;
font-weight: 600;
display: inline-block;
```

---

## 🎭 四、裝飾性元素

### 4.1 有機形狀背景（Organic Shapes）

**特徵**：
- 不規則圓形、橢圓形
- 柔和的漸變填充
- 用於背景裝飾，不干擾內容
- 顏色：青綠色、淺黃色、淺灰色

**用法**：
```css
background: radial-gradient(
  circle at 30% 50%,
  rgba(93, 186, 174, 0.15) 0%,
  transparent 50%
);
```

### 4.2 裝飾性線條

- 短小的強調線（underline）
- 顏色：品牌金或強調橙
- 寬度：3-4px
- 長度：40-60px

---

## 📐 五、布局系統

### 5.1 柵格系統

- **最大寬度（Container）**：1280px
- **列數**：12 列
- **間距（Gutter）**：24px
- **左右邊距（Margin）**：40px (Desktop), 20px (Mobile)

### 5.2 間距系統（Spacing Scale）

```
4px   → xs
8px   → sm
12px  → md
16px  → base
24px  → lg
32px  → xl
48px  → 2xl
64px  → 3xl
96px  → 4xl
128px → 5xl
```

### 5.3 常見布局模式

#### Hero Section
- 高度：600-700px
- 背景：淺色漸變 + 裝飾性形狀
- 內容：左文字 + 右圖片（60/40 比例）

#### 三欄 CTA 區域
- 布局：3 列等寬（Desktop），1 列（Mobile）
- 間距：24px
- 卡片：帶邊框色（金/青/黃）

#### 統計數字區塊
- 背景：深色卡片（深海藍漸變）
- 布局：4 列等寬
- 強調：大號數字 + 金色圖標

---

## 🌊 六、動畫與互動

### 6.1 過渡效果（Transitions）

```css
/* 標準過渡 */
transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);

/* 快速過渡 */
transition: all 0.15s ease-out;

/* 緩慢過渡（用於大元素）*/
transition: all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1);
```

### 6.2 Hover 狀態

| 元素 | 效果 |
|------|------|
| **按鈕** | 陰影增強 + 上移 2-4px |
| **卡片** | 陰影增強 + 上移 4px |
| **連結** | 下劃線出現 |
| **圖標** | 旋轉或縮放 1.1x |

---

## 📷 七、圖片使用原則

### 7.1 照片風格

- **真實性**：使用真人照片，非庫存圖
- **情感**：微笑、專業、溫暖
- **環境**：明亮、現代化空間
- **色調**：自然色調，略微增強飽和度

### 7.2 圖片處理

```css
/* 圓角 */
border-radius: 16px;

/* 陰影 */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

/* Hover 縮放 */
transform: scale(1.05);
transition: transform 0.4s ease;
```

---

## 🎯 八、品牌識別元素

### 8.1 Logo 使用

- **主 Logo**：職游 + 英文字 + 圖標
- **顏色版本**：全彩（金色+青綠色）、純白、純黑
- **最小尺寸**：120px 寬（保持可讀性）
- **安全區域**：Logo 周圍至少 20px 空白

### 8.2 圖標風格

- **樣式**：簡約線性圖標（Line Icons）
- **粗細**：2px stroke
- **圓角**：圓滑末端
- **尺寸**：24px × 24px（標準）

---

## 📱 九、響應式設計

### 9.1 斷點（Breakpoints）

```css
/* Mobile First */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

### 9.2 響應式原則

- **Mobile First**：先設計移動版，再擴展至桌面
- **字號縮放**：移動端字號減少 10-15%
- **間距縮放**：移動端間距減少 25-50%
- **單欄布局**：移動端多數區塊改為單欄

---

## ✅ 十、設計檢查清單

在應用此設計系統時，確保：

- [ ] 使用正確的品牌色（金色 + 青綠色）
- [ ] 按鈕使用全圓角（border-radius: 999px）
- [ ] 卡片有柔和陰影和 hover 效果
- [ ] 大標題使用粗字重（700-900）
- [ ] 有機形狀裝飾性元素點綴背景
- [ ] 真人照片使用（非圖標化插圖）
- [ ] 統計數字用深色卡片 + 金色強調
- [ ] Hover 狀態有明顯反饋
- [ ] 移動端優化（單欄、字號縮放）
- [ ] 保持足夠的空白和呼吸感

---

## 🔗 十一、參考資源

- **官網**：https://navicareer.tw/
- **品牌**：職游創新職涯發展與諮詢
- **分析日期**：2026-01-15

---

## 📝 十二、設計原則總結

**Navicareer.tw 的核心設計哲學**：

1. **專業但不冰冷**：深色卡片 + 溫暖金色平衡專業感和親和力
2. **有機而非機械**：不規則形狀、真人照片增加人性化
3. **簡約但有細節**：乾淨布局中加入微妙的裝飾性元素
4. **重視視覺層級**：大膽的標題、清晰的區塊劃分
5. **強調行動**：明顯的 CTA 按鈕、引導性文案

**關鍵差異化元素**（與 Career Creator 對比）：

| 維度 | Navicareer.tw | Career Creator |
|------|--------------|----------------|
| **視覺風格** | 有機、溫暖、專業 | 功能性、簡潔、卡片化 |
| **裝飾性** | 豐富（形狀、照片） | 極簡 |
| **配色** | 金+青（成熟） | 多彩（功能性） |
| **照片使用** | 大量真人照片 | 較少 |
| **CTA 風格** | 黑色圓角大按鈕 | 彩色圓角按鈕 |

---

**建議應用方向**：

1. **首頁重設計**：參考 Hero Section 和三欄 CTA 布局
2. **配色調整**：統一為金色+青綠色，減少多彩色
3. **增加真人元素**：諮詢師照片、客戶使用場景
4. **優化按鈕設計**：改為黑色全圓角大按鈕
5. **加入裝飾性元素**：有機形狀背景、短線強調
6. **提升空白感**：增加間距，降低資訊密度

---

**最後更新**：2026-01-15
**撰寫者**：Claude (基於 Navicareer.tw 網站分析)
