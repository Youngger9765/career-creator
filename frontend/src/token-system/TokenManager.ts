/**
 * TokenManager - 籌碼管理系統
 *
 * 用於生活改造王玩法，管理100點生活能量的分配
 * 確保總和始終等於100，支援區域間轉移
 */

export interface TokenAllocation {
  area: string;
  amount: number;
  percentage: number;
}

export interface TokenConstraints {
  total: number;
  minPerArea?: number;
  maxPerArea?: number;
  sumEquals: number;
}

export interface TokenTransfer {
  from: string;
  to: string;
  amount: number;
  timestamp: Date;
}

export class TokenManager {
  private total: number;
  private allocations: Map<string, number>;
  private constraints: TokenConstraints;
  private history: TokenTransfer[];
  private listeners: Set<(allocations: TokenAllocation[]) => void>;

  constructor(total: number = 100, constraints?: Partial<TokenConstraints>) {
    this.total = total;
    this.allocations = new Map();
    this.constraints = {
      total,
      minPerArea: constraints?.minPerArea ?? 0,
      maxPerArea: constraints?.maxPerArea ?? total,
      sumEquals: constraints?.sumEquals ?? total,
    };
    this.history = [];
    this.listeners = new Set();
  }

  /**
   * 初始化區域
   */
  initializeAreas(areas: string[]): void {
    areas.forEach(area => {
      if (!this.allocations.has(area)) {
        this.allocations.set(area, 0);
      }
    });
  }

  /**
   * 分配籌碼到指定區域
   */
  allocate(area: string, amount: number): boolean {
    if (!this.validateAllocation(area, amount)) {
      return false;
    }

    const currentAmount = this.allocations.get(area) || 0;
    const newAmount = currentAmount + amount;

    // 檢查是否超過區域上限
    if (this.constraints.maxPerArea && newAmount > this.constraints.maxPerArea) {
      return false;
    }

    // 檢查是否超過總量
    if (this.getAllocatedTotal() + amount > this.total) {
      return false;
    }

    this.allocations.set(area, newAmount);
    this.notifyListeners();
    return true;
  }

  /**
   * 設定區域的絕對值
   */
  setAllocation(area: string, amount: number): boolean {
    if (amount < 0 || amount > this.total) {
      return false;
    }

    // 檢查約束
    if (this.constraints.minPerArea && amount < this.constraints.minPerArea) {
      return false;
    }
    if (this.constraints.maxPerArea && amount > this.constraints.maxPerArea) {
      return false;
    }

    // 檢查總和約束
    const otherAreas = this.getAllocatedTotal() - (this.allocations.get(area) || 0);
    if (otherAreas + amount > this.total) {
      return false;
    }

    this.allocations.set(area, amount);
    this.notifyListeners();
    return true;
  }

  /**
   * 在區域間轉移籌碼
   */
  transfer(from: string, to: string, amount: number): boolean {
    const fromAmount = this.allocations.get(from) || 0;
    const toAmount = this.allocations.get(to) || 0;

    // 檢查來源區域是否有足夠籌碼
    if (fromAmount < amount) {
      return false;
    }

    // 檢查目標區域是否會超過上限
    if (this.constraints.maxPerArea && toAmount + amount > this.constraints.maxPerArea) {
      return false;
    }

    // 檢查來源區域是否會低於下限
    if (this.constraints.minPerArea && fromAmount - amount < this.constraints.minPerArea) {
      return false;
    }

    // 執行轉移
    this.allocations.set(from, fromAmount - amount);
    this.allocations.set(to, toAmount + amount);

    // 記錄歷史
    this.history.push({
      from,
      to,
      amount,
      timestamp: new Date(),
    });

    this.notifyListeners();
    return true;
  }

  /**
   * 從區域移除籌碼
   */
  deallocate(area: string, amount: number): boolean {
    const currentAmount = this.allocations.get(area) || 0;

    if (amount > currentAmount) {
      return false;
    }

    const newAmount = currentAmount - amount;

    // 檢查是否低於區域下限
    if (this.constraints.minPerArea && newAmount < this.constraints.minPerArea) {
      return false;
    }

    this.allocations.set(area, newAmount);
    this.notifyListeners();
    return true;
  }

  /**
   * 取得特定區域的分配量
   */
  getAllocation(area: string): number {
    return this.allocations.get(area) || 0;
  }

  /**
   * 取得所有分配
   */
  getAllAllocations(): TokenAllocation[] {
    const total = this.getAllocatedTotal() || 1; // 避免除以0
    return Array.from(this.allocations.entries()).map(([area, amount]) => ({
      area,
      amount,
      percentage: (amount / total) * 100,
    }));
  }

  /**
   * 取得已分配總量
   */
  getAllocatedTotal(): number {
    return Array.from(this.allocations.values()).reduce((sum, amount) => sum + amount, 0);
  }

  /**
   * 取得剩餘籌碼
   */
  getRemaining(): number {
    return this.total - this.getAllocatedTotal();
  }

  /**
   * 取得總籌碼數
   */
  getTotal(): number {
    return this.total;
  }

  /**
   * 驗證當前分配是否符合約束
   */
  validate(): boolean {
    const allocated = this.getAllocatedTotal();

    // 檢查總和約束
    if (this.constraints.sumEquals && allocated !== this.constraints.sumEquals) {
      return false;
    }

    // 檢查每個區域的約束
    for (const [area, amount] of this.allocations) {
      if (this.constraints.minPerArea && amount < this.constraints.minPerArea) {
        return false;
      }
      if (this.constraints.maxPerArea && amount > this.constraints.maxPerArea) {
        return false;
      }
    }

    return true;
  }

  /**
   * 重置所有分配
   */
  reset(): void {
    this.allocations.clear();
    this.history = [];
    this.notifyListeners();
  }

  /**
   * 平均分配到所有區域
   */
  distributeEvenly(areas?: string[]): void {
    const targetAreas = areas || Array.from(this.allocations.keys());
    if (targetAreas.length === 0) return;

    const amountPerArea = Math.floor(this.total / targetAreas.length);
    const remainder = this.total % targetAreas.length;

    targetAreas.forEach((area, index) => {
      const amount = amountPerArea + (index < remainder ? 1 : 0);
      this.allocations.set(area, amount);
    });

    this.notifyListeners();
  }

  /**
   * 按比例分配
   */
  distributeByRatio(ratios: Map<string, number>): boolean {
    const totalRatio = Array.from(ratios.values()).reduce((sum, ratio) => sum + ratio, 0);
    if (totalRatio === 0) return false;

    const allocations = new Map<string, number>();
    let allocated = 0;

    // 計算每個區域的分配
    const areas = Array.from(ratios.entries());
    areas.forEach(([area, ratio], index) => {
      const isLast = index === areas.length - 1;
      const amount = isLast
        ? this.total - allocated // 最後一個區域取得剩餘的
        : Math.floor((ratio / totalRatio) * this.total);

      allocations.set(area, amount);
      allocated += amount;
    });

    // 驗證並應用分配
    for (const [area, amount] of allocations) {
      if (this.constraints.minPerArea && amount < this.constraints.minPerArea) {
        return false;
      }
      if (this.constraints.maxPerArea && amount > this.constraints.maxPerArea) {
        return false;
      }
    }

    this.allocations = allocations;
    this.notifyListeners();
    return true;
  }

  /**
   * 取得歷史記錄
   */
  getHistory(): TokenTransfer[] {
    return [...this.history];
  }

  /**
   * 訂閱分配變化
   */
  subscribe(listener: (allocations: TokenAllocation[]) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 取得視覺化數據
   */
  getVisualizationData(): {
    labels: string[];
    values: number[];
    percentages: number[];
    colors: string[];
  } {
    const allocations = this.getAllAllocations();
    const colors = this.generateColors(allocations.length);

    return {
      labels: allocations.map(a => a.area),
      values: allocations.map(a => a.amount),
      percentages: allocations.map(a => a.percentage),
      colors,
    };
  }

  /**
   * 私有方法：驗證分配
   */
  private validateAllocation(area: string, amount: number): boolean {
    if (amount < 0) {
      return false;
    }

    if (this.constraints.minPerArea && amount < this.constraints.minPerArea) {
      return false;
    }

    return true;
  }

  /**
   * 私有方法：通知監聽器
   */
  private notifyListeners(): void {
    const allocations = this.getAllAllocations();
    this.listeners.forEach(listener => listener(allocations));
  }

  /**
   * 私有方法：生成顏色
   */
  private generateColors(count: number): string[] {
    const baseColors = [
      '#3B82F6', // blue
      '#10B981', // emerald
      '#F59E0B', // amber
      '#EF4444', // red
      '#8B5CF6', // violet
      '#EC4899', // pink
      '#14B8A6', // teal
      '#F97316', // orange
    ];

    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      colors.push(baseColors[i % baseColors.length]);
    }
    return colors;
  }

  /**
   * 導出/導入功能
   */
  export(): string {
    return JSON.stringify({
      total: this.total,
      allocations: Array.from(this.allocations.entries()),
      constraints: this.constraints,
    });
  }

  import(data: string): boolean {
    try {
      const parsed = JSON.parse(data);
      this.total = parsed.total;
      this.allocations = new Map(parsed.allocations);
      this.constraints = parsed.constraints;
      this.notifyListeners();
      return true;
    } catch {
      return false;
    }
  }
}
