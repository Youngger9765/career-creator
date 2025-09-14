/**
 * Card system type definitions
 * 卡牌系統類型定義
 */

export interface CardPosition {
  x: number;
  y: number;
}

export interface CardData {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  tags: string[];
}

export interface GameCard {
  id: string;
  data: CardData;
  position: CardPosition;
  isFaceUp: boolean;
  isSelected: boolean;
  rotation: number;
  scale: number;
  zIndex: number;
  zone?: string; // Zone assignment for 六大性格分析 mode
}

export interface CardSet {
  id: string;
  name: string;
  description: string;
  cards: CardData[];
  category: 'career' | 'personality' | 'values' | 'skills' | 'custom';
}

// 預設的職業諮詢卡牌
export const DEFAULT_CAREER_CARDS: CardData[] = [
  {
    id: 'card-1',
    title: '軟體工程師',
    description: '設計和開發軟體應用程式，解決技術問題',
    category: 'technology',
    tags: ['程式設計', '邏輯思考', '問題解決'],
  },
  {
    id: 'card-2',
    title: '產品經理',
    description: '負責產品策略規劃和跨部門協調',
    category: 'management',
    tags: ['策略規劃', '溝通協調', '市場分析'],
  },
  {
    id: 'card-3',
    title: '設計師',
    description: '創造視覺和用戶體驗設計',
    category: 'creative',
    tags: ['創意思考', '美感', '用戶體驗'],
  },
  {
    id: 'card-4',
    title: '數據分析師',
    description: '分析數據並提供業務洞察',
    category: 'analytics',
    tags: ['數據分析', '統計', '洞察力'],
  },
  {
    id: 'card-5',
    title: '行銷專員',
    description: '制定和執行行銷策略',
    category: 'marketing',
    tags: ['創意', '溝通', '市場敏感度'],
  },
  {
    id: 'card-6',
    title: '人力資源',
    description: '負責人才招募和組織發展',
    category: 'hr',
    tags: ['人際關係', '溝通', '組織能力'],
  },
  {
    id: 'card-7',
    title: '財務分析師',
    description: '進行財務規劃和投資分析',
    category: 'finance',
    tags: ['邏輯分析', '數字敏感', '風險評估'],
  },
  {
    id: 'card-8',
    title: '銷售代表',
    description: '建立客戶關係並達成銷售目標',
    category: 'sales',
    tags: ['人際溝通', '說服力', '目標導向'],
  },
  {
    id: 'card-9',
    title: '教育工作者',
    description: '傳授知識並培育人才',
    category: 'education',
    tags: ['教學', '耐心', '知識傳遞'],
  },
  {
    id: 'card-10',
    title: '創業家',
    description: '創建和經營自己的事業',
    category: 'entrepreneurship',
    tags: ['創新', '領導力', '風險承擔'],
  },
  {
    id: 'card-11',
    title: '諮詢顧問',
    description: '為企業提供專業建議和解決方案',
    category: 'consulting',
    tags: ['問題解決', '分析思考', '專業知識'],
  },
  {
    id: 'card-12',
    title: '醫療工作者',
    description: '提供醫療服務和健康照護',
    category: 'healthcare',
    tags: ['同理心', '專業技能', '責任感'],
  },
];

export const CARD_CATEGORIES = {
  technology: { name: '科技', color: 'bg-blue-500' },
  management: { name: '管理', color: 'bg-purple-500' },
  creative: { name: '創意', color: 'bg-pink-500' },
  analytics: { name: '分析', color: 'bg-green-500' },
  marketing: { name: '行銷', color: 'bg-orange-500' },
  hr: { name: '人資', color: 'bg-indigo-500' },
  finance: { name: '財務', color: 'bg-yellow-500' },
  sales: { name: '銷售', color: 'bg-red-500' },
  education: { name: '教育', color: 'bg-teal-500' },
  entrepreneurship: { name: '創業', color: 'bg-emerald-500' },
  consulting: { name: '諮詢', color: 'bg-cyan-500' },
  healthcare: { name: '醫療', color: 'bg-rose-500' },
};
