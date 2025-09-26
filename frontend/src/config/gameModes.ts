/**
 * 遊戲模式配置檔案
 * 集中管理所有遊戲模式的設定
 */

export interface GameModeConfig {
  id: string;
  name: string;
  description: string;
  supportedDecks: string[]; // 支援的牌組
  maxCards?: number; // 最大卡片數量限制
  features: {
    tokens?: boolean; // 是否使用籌碼
    auxiliaryCards?: boolean; // 是否使用輔助卡
    timer?: boolean; // 是否有計時器
    notes?: boolean; // 是否可以加註記
    fileUpload?: boolean; // 是否支援文件上傳
  };
  layout: {
    type: 'zones' | 'grid' | 'columns' | 'canvas';
    config?: any; // 特定佈局的配置
  };
}

/**
 * 所有遊戲模式的配置
 */
export const GAME_MODES: GameModeConfig[] = [
  {
    id: 'advantage-disadvantage',
    name: '優劣勢分析',
    description: '分析個人的優勢與劣勢',
    supportedDecks: ['職游旅人卡', '職能盤點卡', '價值導航卡'],
    maxCards: 10, // 每個區域最多5張
    features: {
      notes: true,
    },
    layout: {
      type: 'zones',
      config: {
        zones: ['advantage', 'disadvantage'],
        maxPerZone: 5,
      },
    },
  },
  {
    id: 'value-ranking',
    name: '價值觀排序',
    description: '將價值觀依重要性排序',
    supportedDecks: ['價值導航卡'],
    maxCards: 9, // 3x3 網格
    features: {
      tokens: true, // 使用籌碼來標記重要性
      notes: true,
    },
    layout: {
      type: 'grid',
      config: {
        rows: 3,
        cols: 3,
      },
    },
  },
  {
    id: 'personality-analysis',
    name: '六大性格分析',
    description: '分析Holland六大性格類型',
    supportedDecks: ['職游旅人卡'],
    features: {
      auxiliaryCards: true, // 使用Holland解釋卡
      notes: true,
    },
    layout: {
      type: 'columns',
      config: {
        columns: ['like', 'neutral', 'dislike'],
      },
    },
  },
  {
    id: 'job-decomposition',
    name: '職位拆解',
    description: '將職位需求與個人職能進行對照分析',
    supportedDecks: ['職能盤點卡'],
    features: {
      notes: true,
      fileUpload: true, // 支援上傳職位說明文件
    },
    layout: {
      type: 'canvas',
      config: {
        canvasType: 'free', // 自由畫布
        splitView: true, // 分割視圖（左邊卡片，右邊文件）
      },
    },
  },
];

/**
 * 根據ID獲取遊戲模式配置
 */
export function getGameModeConfig(modeId: string): GameModeConfig | undefined {
  return GAME_MODES.find((mode) => mode.id === modeId || mode.name === modeId);
}

/**
 * 檢查牌組是否支援該遊戲模式
 */
export function isDeckSupported(modeName: string, deckName: string): boolean {
  const config = getGameModeConfig(modeName);
  return config?.supportedDecks.includes(deckName) || false;
}
