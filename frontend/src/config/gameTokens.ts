/**
 * 遊戲籌碼配置檔案
 * 讓籌碼設定更容易維護和擴展
 */

export interface GameToken {
  id: string;
  label: string;
  value: number;
  color: string;
  shape: 'circle' | 'square' | 'triangle';
}

export interface TokenConfig {
  gameMode: string;
  deckType?: string;
  tokens: GameToken[];
}

/**
 * 不同玩法的籌碼配置
 * 可以根據需求輕鬆添加新的配置
 */
export const TOKEN_CONFIGS: TokenConfig[] = [
  {
    gameMode: '價值觀排序',
    tokens: [
      { id: 'token-10', label: '10', value: 10, color: 'bg-red-200', shape: 'circle' },
      { id: 'token-5', label: '5', value: 5, color: 'bg-blue-200', shape: 'square' },
      { id: 'token-1', label: '1', value: 1, color: 'bg-green-200', shape: 'triangle' },
    ],
  },
  // 未來可以添加其他玩法的籌碼配置
  // {
  //   gameMode: '其他玩法',
  //   deckType: '特定牌組', // 可選：限定特定牌組
  //   tokens: [
  //     { id: 'token-special', label: 'S', value: 100, color: 'bg-purple-200', shape: 'circle' },
  //   ],
  // },
];

/**
 * 根據遊戲模式和牌組獲取籌碼配置
 */
export function getTokensForMode(gameMode: string, deckType?: string): GameToken[] {
  const config = TOKEN_CONFIGS.find((c) => {
    if (c.gameMode !== gameMode) return false;
    if (c.deckType && c.deckType !== deckType) return false;
    return true;
  });

  return config?.tokens || [];
}

/**
 * 檢查特定遊戲模式是否需要顯示籌碼
 */
export function shouldShowTokens(gameMode: string, deckType?: string): boolean {
  return getTokensForMode(gameMode, deckType).length > 0;
}
