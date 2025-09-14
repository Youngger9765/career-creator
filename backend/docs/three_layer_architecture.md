# 三層通用框架架構定義

## 核心三層設計

```
┌─────────────────────────────────────┐
│      應用層 (Application Layer)      │  ← 用戶交互 + 業務流程
├─────────────────────────────────────┤
│      配置層 (Configuration Layer)    │  ← 規則 + 內容管理
├─────────────────────────────────────┤
│      引擎層 (Engine Layer)           │  ← 核心邏輯 + 狀態管理
└─────────────────────────────────────┘
```

## 第一層：引擎層 (Engine Layer) - 核心邏輯

### 職責

- **狀態管理**: 遊戲狀態的存儲、更新、查詢
- **動作執行**: 處理所有遊戲動作的執行邏輯
- **規則驗證**: 驗證動作是否符合當前規則
- **事件發布**: 觸發狀態變更事件

### 核心組件

```typescript
// 遊戲引擎核心
interface GameEngine {
  // 狀態管理
  getState(roomId: string): GameState;
  updateState(roomId: string, newState: GameState): void;

  // 動作處理
  executeAction(action: GameAction): ActionResult;
  validateAction(action: GameAction, state: GameState): boolean;

  // 事件系統
  publishEvent(event: GameEvent): void;
  subscribeToEvents(callback: EventCallback): void;
}

// 遊戲狀態定義
interface GameState {
  roomId: string;
  ruleId: string;
  cards: Map<string, CardState>;      // 所有牌卡狀態
  zones: Map<string, ZoneState>;      // 所有區域狀態
  players: Map<string, PlayerState>;  // 玩家狀態
  metadata: GameMetadata;             // 額外資訊
  version: number;                    // 版本控制
}

// 動作定義
interface GameAction {
  type: ActionType;                   // FLIP, MOVE, ARRANGE, ANNOTATE
  playerId: string;
  cardId?: string;
  targetZone?: string;
  position?: Position;
  data?: any;
}
```

### 實現特點

- **規則無關**: 不關心具體規則，只處理通用邏輯
- **狀態不可變**: 每次更新產生新狀態
- **事務安全**: 支持原子操作和回滾
- **並發安全**: 支持多用戶同時操作

## 第二層：配置層 (Configuration Layer) - 規則與內容

### 職責

- **規則定義**: 定義各種遊戲規則和限制
- **內容管理**: 管理牌卡內容和布局
- **驗證邏輯**: 實現具體的規則驗證
- **UI配置**: 定義用戶界面布局

### 核心組件

```typescript
// 規則配置接口
interface GameRuleConfig {
  id: string;
  name: string;
  version: string;

  // 布局配置
  layout: LayoutConfig;

  // 規則配置
  constraints: ConstraintConfig;

  // 驗證器
  validators: GameValidator[];

  // UI配置
  uiConfig: UIConfig;
}

// 布局配置
interface LayoutConfig {
  deckArea: {
    position: Position;
    style: 'stack' | 'grid' | 'categorized';
    cardCount?: number;
  };

  dropZones: DropZoneConfig[];
}

interface DropZoneConfig {
  id: string;
  name: string;
  position: Position;
  size: Size;
  maxCards?: number;
  minCards?: number;
  cardTypes?: string[];          // 限制卡片類型
  validationRules?: string[];    // 驗證規則ID
}

// 約束配置
interface ConstraintConfig {
  placement: {
    maxPerZone: Record<string, number>;
    minPerZone: Record<string, number>;
    totalLimit?: number;
    uniquePositions?: boolean;    // 如九宮格排序
  };

  movement: {
    allowReorder: boolean;
    allowCrossZone: boolean;
    requireConfirmation?: boolean;
  };

  completion: {
    winConditions: WinCondition[];
    scoringRules: ScoringRule[];
  };
}

// 遊戲驗證器
interface GameValidator {
  id: string;
  validate(action: GameAction, state: GameState, config: GameRuleConfig): ValidationResult;
}
```

### 三種遊戲的配置範例

```typescript
// 1. 職能盤點卡配置
const skillAssessmentConfig: GameRuleConfig = {
  id: "skill_assessment",
  name: "職能盤點卡",
  layout: {
    deckArea: { position: {x: 0, y: 0}, style: 'stack' },
    dropZones: [
      {
        id: "advantage", name: "優勢",
        position: {x: 60, y: 20}, maxCards: 5
      },
      {
        id: "disadvantage", name: "劣勢",
        position: {x: 60, y: 60}, maxCards: 5
      }
    ]
  },
  constraints: {
    placement: {
      maxPerZone: { "advantage": 5, "disadvantage": 5 },
      totalLimit: 10
    }
  }
};

// 2. 價值導航卡配置
const valueNavigationConfig: GameRuleConfig = {
  id: "value_navigation",
  name: "價值導航卡",
  layout: {
    deckArea: { position: {x: 0, y: 0}, style: 'categorized' },
    dropZones: [
      { id: "rank_1", name: "第1名", position: {x: 60, y: 20}, maxCards: 1 },
      { id: "rank_2", name: "第2名", position: {x: 80, y: 20}, maxCards: 1 },
      // ... 9個排序位置
    ]
  },
  constraints: {
    placement: {
      maxPerZone: { /* 每個位置限1張 */ },
      totalLimit: 9,
      uniquePositions: true
    }
  }
};

// 3. 職游旅人卡配置
const careerPersonalityConfig: GameRuleConfig = {
  id: "career_personality",
  name: "職游旅人卡",
  layout: {
    deckArea: {
      position: {x: 0, y: 0},
      style: 'categorized',  // 解釋卡+職業卡分層
    },
    dropZones: [
      { id: "like", name: "喜歡", position: {x: 60, y: 20}, maxCards: 20 },
      { id: "neutral", name: "中立", position: {x: 60, y: 50} },
      { id: "dislike", name: "討厭", position: {x: 60, y: 80}, maxCards: 20 }
    ]
  },
  constraints: {
    placement: {
      maxPerZone: { "like": 20, "dislike": 20 },
      minPerZone: { "like": 1, "dislike": 1 }
    }
  }
};
```

### 牌卡內容管理

```typescript
// 牌組定義
interface CardDeck {
  id: string;
  ruleId: string;              // 屬於哪個規則
  name: string;
  version: string;
  isOfficial: boolean;
  cards: Card[];
}

// 牌卡定義
interface Card {
  id: string;
  key: string;                 // 唯一標識
  title: string;
  description: string;
  category: string;            // 分類
  subcategory?: string;
  metadata: CardMetadata;      // 擴展屬性
  assets: CardAssets;          // 圖片、音效等
}

// 牌卡元數據
interface CardMetadata {
  difficulty?: number;         // 難度等級
  importance?: number;         // 重要程度
  frequency?: number;          // 使用頻率
  tags?: string[];            // 標籤
  customFields?: Record<string, any>; // 自定義欄位
}
```

## 第三層：應用層 (Application Layer) - 業務流程

### 職責

- **用戶交互**: 處理用戶請求和響應
- **會話管理**: 管理房間和用戶會話
- **權限控制**: 處理用戶權限和安全
- **業務流程**: 協調底層服務完成業務邏輯

### 核心組件

```typescript
// 房間服務
interface RoomService {
  createRoom(request: CreateRoomRequest): Promise<Room>;
  joinRoom(roomId: string, visitor: VisitorInfo): Promise<JoinResult>;
  leaveRoom(roomId: string, userId: string): Promise<void>;
  closeRoom(roomId: string, counselorId: string): Promise<void>;
  getRoomStatus(roomId: string): Promise<RoomStatus>;
}

// 遊戲服務
interface GameService {
  initializeGame(roomId: string, ruleId: string, deckId: string): Promise<GameState>;
  executePlayerAction(roomId: string, action: PlayerAction): Promise<ActionResult>;
  getGameState(roomId: string): Promise<GameState>;
  getGameHistory(roomId: string): Promise<GameEvent[]>;
  saveGameSnapshot(roomId: string): Promise<void>;
}

// 用戶交互API
class GameController {
  // 房間管理
  async createRoom(req: Request): Promise<Response> {
    // 1. 驗證用戶權限
    // 2. 調用房間服務創建房間
    // 3. 初始化遊戲狀態
    // 4. 返回房間信息
  }

  // 遊戲操作
  async executeAction(req: Request): Promise<Response> {
    // 1. 解析用戶動作
    // 2. 獲取房間規則配置
    // 3. 調用引擎執行動作
    // 4. 廣播狀態變更
    // 5. 返回操作結果
  }

  // 狀態查詢
  async getGameState(req: Request): Promise<Response> {
    // 1. 驗證訪問權限
    // 2. 獲取當前遊戲狀態
    // 3. 應用UI配置
    // 4. 返回前端需要的數據
  }
}
```

### 業務流程範例

```typescript
// 完整的遊戲操作流程
async function handlePlayerAction(roomId: string, action: PlayerAction): Promise<ActionResult> {
  try {
    // 1. 應用層：獲取房間和配置
    const room = await roomService.getRoom(roomId);
    const ruleConfig = await configService.getRuleConfig(room.ruleId);

    // 2. 配置層：執行規則驗證
    const validationResult = ruleConfig.validators
      .map(v => v.validate(action, gameState, ruleConfig))
      .find(r => !r.isValid);

    if (validationResult && !validationResult.isValid) {
      return ActionResult.invalid(validationResult.message);
    }

    // 3. 引擎層：執行動作
    const result = await gameEngine.executeAction(action);

    // 4. 應用層：廣播變更
    await eventService.broadcastToRoom(roomId, {
      type: 'GAME_STATE_UPDATED',
      state: result.newState
    });

    // 5. 持久化
    await gameStateRepository.save(roomId, result.newState);

    return result;
  } catch (error) {
    return ActionResult.error(error.message);
  }
}
```

## 三層架構的優勢

### 1. 清晰的責任分離

- **引擎層**: 專注核心邏輯，不關心業務規則
- **配置層**: 管理規則和內容，不關心具體實現
- **應用層**: 處理業務流程，不關心底層邏輯

### 2. 極高的擴展性

- 新增遊戲規則：只需添加配置，無需修改引擎
- 修改業務流程：只需調整應用層，不影響核心邏輯
- 更換UI：只需修改配置層的UI配置

### 3. 優異的可測試性

- 每層可獨立測試
- 配置驅動的測試用例
- 清晰的依賴關係

### 4. 高性能

- 配置可緩存
- 狀態更新可批量處理
- 支持水平擴展

這個三層架構完全採用iGaming行業的成功模式，可以支撐我們實現三種牌卡遊戲，並為未來的擴展預留充足空間。
