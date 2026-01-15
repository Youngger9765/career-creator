# Navicareer.tw 设计系统分析

> 撰写时间：2026-01-15
> 目的：作为 Career Creator 设计改版的参考标准

---

## 📋 概述

Navicareer.tw 是职涯谘询品牌「职游」的官方网站，其设计风格展现了专业、温暖、亲和的品牌特质。本文档详细记录其设计系统，供 Career Creator 平台改版参考。

---

## 🎨 一、配色系统

### 1.1 主色调

| 色彩名称 | 色值（推测） | 用途 | 示例 |
|---------|-------------|------|------|
| **品牌金** | `#F5B942` ~ `#FFB84D` | 主要 CTA、强调元素、标签 | 「立即报名」按钮、统计数字背景 |
| **职游青** | `#5DBAAE` ~ `#4DB8A8` | 次要 CTA、区块背景 | 「我要预约诸询」区域 |
| **深海蓝** | `#2C4A6B` ~ `#1E3A5F` | 专业形象、制服、深色卡片 | 创办人西装、统计卡片背景 |

### 1.2 中性色

| 色彩 | 色值（推测） | 用途 |
|-----|-------------|------|
| **纯白** | `#FFFFFF` | 主背景、卡片背景 |
| **浅灰** | `#F7F7F7` ~ `#F0F0F0` | 次要背景 |
| **文字黑** | `#1A1A1A` ~ `#2D2D2D` | 主要文字 |
| **文字灰** | `#6B7280` | 次要文字、描述 |

### 1.3 辅助色

| 色彩 | 色值（推测） | 用途 |
|-----|-------------|------|
| **强调橙** | `#FF6B35` ~ `#FF7849` | 强调文字、小装饰 |
| **柔和黄** | `#FFE5B4` | 标签、柔和背景 |

---

## 🔤 二、字体系统

### 2.1 字体家族

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

| 层级 | 字重 | 用途 |
|------|------|------|
| **超粗** | 900 | 大标题（Hero） |
| **粗体** | 700 | 小标题、按钮 |
| **中等** | 500 | 强调文字 |
| **常规** | 400 | 正文、描述 |

### 2.3 字号系统（推测）

| 层级 | 尺寸 | Line Height | 用途 |
|------|------|-------------|------|
| **H1** | 48-56px | 1.2 | 首页大标题 |
| **H2** | 36-42px | 1.3 | 区块标题 |
| **H3** | 24-28px | 1.4 | 卡片标题 |
| **Body** | 16-18px | 1.6 | 正文 |
| **Small** | 14px | 1.5 | 辅助文字 |

---

## 🧩 三、UI 元件设计

### 3.1 按钮（Buttons）

#### 主要 CTA（Primary）
```css
background: #000000;
color: #FFFFFF;
border-radius: 999px; /* 全圆角 */
padding: 16px 32px;
font-weight: 700;
font-size: 18px;
transition: all 0.3s ease;

/* Hover 状态 */
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

#### 标准卡片
```css
background: #FFFFFF;
border-radius: 16px;
padding: 24px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
transition: all 0.3s ease;

/* Hover 状态 */
box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
transform: translateY(-4px);
```

#### 深色统计卡片
```css
background: linear-gradient(135deg, #2C4A6B 0%, #1E3A5F 100%);
color: #FFFFFF;
border-radius: 24px;
padding: 32px;
```

### 3.3 标签（Tags/Badges）

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

## 🎭 四、装饰性元素

### 4.1 有机形状背景（Organic Shapes）

**特征**：
- 不规则圆形、椭圆形
- 柔和的渐变填充
- 用于背景装饰，不干扰内容
- 颜色：青绿色、浅黄色、浅灰色

**用法**：
```css
background: radial-gradient(
  circle at 30% 50%,
  rgba(93, 186, 174, 0.15) 0%,
  transparent 50%
);
```

### 4.2 装饰性线条

- 短小的强调线（underline）
- 颜色：品牌金或强调橙
- 宽度：3-4px
- 长度：40-60px

---

## 📐 五、布局系统

### 5.1 栅格系统

- **最大宽度（Container）**：1280px
- **列数**：12 列
- **间距（Gutter）**：24px
- **左右边距（Margin）**：40px (Desktop), 20px (Mobile)

### 5.2 间距系统（Spacing Scale）

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

### 5.3 常见布局模式

#### Hero Section
- 高度：600-700px
- 背景：浅色渐变 + 装饰性形状
- 内容：左文字 + 右图片（60/40 比例）

#### 三栏 CTA 区域
- 布局：3 列等宽（Desktop），1 列（Mobile）
- 间距：24px
- 卡片：带边框色（金/青/黄）

#### 统计数字区块
- 背景：深色卡片（深海蓝渐变）
- 布局：4 列等宽
- 强调：大号数字 + 金色图标

---

## 🌊 六、动画与互动

### 6.1 过渡效果（Transitions）

```css
/* 标准过渡 */
transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);

/* 快速过渡 */
transition: all 0.15s ease-out;

/* 缓慢过渡（用于大元素）*/
transition: all 0.5s cubic-bezier(0.4, 0.0, 0.2, 1);
```

### 6.2 Hover 状态

| 元素 | 效果 |
|------|------|
| **按钮** | 阴影增强 + 上移 2-4px |
| **卡片** | 阴影增强 + 上移 4px |
| **链接** | 下划线出现 |
| **图标** | 旋转或缩放 1.1x |

---

## 📷 七、图片使用原则

### 7.1 照片风格

- **真实性**：使用真人照片，非库存图
- **情感**：微笑、专业、温暖
- **环境**：明亮、现代化空间
- **色调**：自然色调，略微增强饱和度

### 7.2 图片处理

```css
/* 圆角 */
border-radius: 16px;

/* 阴影 */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);

/* Hover 缩放 */
transform: scale(1.05);
transition: transform 0.4s ease;
```

---

## 🎯 八、品牌识别元素

### 8.1 Logo 使用

- **主 Logo**：职游 + 英文字 + 图标
- **颜色版本**：全彩（金色+青绿色）、纯白、纯黑
- **最小尺寸**：120px 宽（保持可读性）
- **安全区域**：Logo 周围至少 20px 空白

### 8.2 图标风格

- **样式**：简约线性图标（Line Icons）
- **粗细**：2px stroke
- **圆角**：圆滑末端
- **尺寸**：24px × 24px（标准）

---

## 📱 九、响应式设计

### 9.1 断点（Breakpoints）

```css
/* Mobile First */
@media (min-width: 640px)  { /* sm */ }
@media (min-width: 768px)  { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

### 9.2 响应式原则

- **Mobile First**：先设计移动版，再扩展至桌面
- **字号缩放**：移动端字号减少 10-15%
- **间距缩放**：移动端间距减少 25-50%
- **单栏布局**：移动端多数区块改为单栏

---

## ✅ 十、设计检查清单

在应用此设计系统时，确保：

- [ ] 使用正确的品牌色（金色 + 青绿色）
- [ ] 按钮使用全圆角（border-radius: 999px）
- [ ] 卡片有柔和阴影和 hover 效果
- [ ] 大标题使用粗字重（700-900）
- [ ] 有机形状装饰性元素点缀背景
- [ ] 真人照片使用（非图标化插图）
- [ ] 统计数字用深色卡片 + 金色强调
- [ ] Hover 状态有明显反馈
- [ ] 移动端优化（单栏、字号缩放）
- [ ] 保持足够的空白和呼吸感

---

## 🔗 十一、参考资源

- **官网**：https://navicareer.tw/
- **品牌**：职游创新职涯发展与谘询
- **分析日期**：2026-01-15

---

## 📝 十二、设计原则总结

**Navicareer.tw 的核心设计哲学**：

1. **专业但不冰冷**：深色卡片 + 温暖金色平衡专业感和亲和力
2. **有机而非机械**：不规则形状、真人照片增加人性化
3. **简约但有细节**：干净布局中加入微妙的装饰性元素
4. **重视视觉层级**：大胆的标题、清晰的区块划分
5. **强调行动**：明显的 CTA 按钮、引导性文案

**关键差异化元素**（与 Career Creator 对比）：

| 维度 | Navicareer.tw | Career Creator |
|------|--------------|----------------|
| **视觉风格** | 有机、温暖、专业 | 功能性、简洁、卡片化 |
| **装饰性** | 丰富（形状、照片） | 极简 |
| **配色** | 金+青（成熟） | 多彩（功能性） |
| **照片使用** | 大量真人照片 | 较少 |
| **CTA 风格** | 黑色圆角大按钮 | 彩色圆角按钮 |

---

**建议应用方向**：

1. **首页重设计**：参考 Hero Section 和三栏 CTA 布局
2. **配色调整**：统一为金色+青绿色，减少多彩色
3. **增加真人元素**：诸询师照片、客户使用场景
4. **优化按钮设计**：改为黑色全圆角大按钮
5. **加入装饰性元素**：有机形状背景、短线强调
6. **提升空白感**：增加间距，降低信息密度

---

**最后更新**：2026-01-15
**撰写者**：Claude (基于 Navicareer.tw 网站分析)
