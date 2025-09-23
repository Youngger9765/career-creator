/**
 * TokenDisplay - 籌碼視覺化顯示元件
 *
 * 提供多種視覺化方式顯示籌碼分配
 * 支援圓餅圖、長條圖、數字顯示
 */

'use client';

import React, { useMemo } from 'react';
import { TokenAllocation } from '../TokenManager';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface TokenDisplayProps {
  allocations: TokenAllocation[];
  total?: number;
  visualType?: 'pie' | 'bar' | 'number' | 'progress';
  title?: string;
  className?: string;
  showLegend?: boolean;
  showPercentage?: boolean;
  colorScheme?: 'default' | 'gradient' | 'category';
}

const TokenDisplay: React.FC<TokenDisplayProps> = ({
  allocations,
  total = 100,
  visualType = 'progress',
  title = '生活能量分配',
  className = '',
  showLegend = true,
  showPercentage = true,
  colorScheme = 'default',
}) => {
  // 顏色配置
  const getColors = useMemo(() => {
    if (colorScheme === 'gradient') {
      return [
        '#3B82F6',
        '#60A5FA',
        '#93BBFC',
        '#C6DBFE',
        '#8B5CF6',
        '#A78BFA',
        '#C4B5FD',
        '#E9D5FF',
      ];
    } else if (colorScheme === 'category') {
      return [
        '#EF4444', // 紅 - 緊急
        '#F59E0B', // 橙 - 重要
        '#10B981', // 綠 - 健康
        '#3B82F6', // 藍 - 工作
        '#8B5CF6', // 紫 - 成長
        '#EC4899', // 粉 - 關係
        '#14B8A6', // 青 - 休閒
        '#F97316', // 橘 - 其他
      ];
    }
    return ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];
  }, [colorScheme]);

  // 計算總分配量
  const allocatedTotal = useMemo(() => {
    return allocations.reduce((sum, item) => sum + item.amount, 0);
  }, [allocations]);

  const remaining = total - allocatedTotal;

  // 準備圖表數據
  const chartData = useMemo(() => {
    return allocations.map((item, index) => ({
      name: item.area,
      value: item.amount,
      percentage: item.percentage,
      color: getColors[index % getColors.length],
    }));
  }, [allocations, getColors]);

  // 圓餅圖顯示
  const PieChartDisplay = () => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={
            showPercentage
              ? ({ value, percentage }) => `${value} (${percentage.toFixed(0)}%)`
              : false
          }
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        {showLegend && <Legend />}
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );

  // 長條圖顯示
  const BarChartDisplay = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
        <YAxis />
        <Tooltip />
        {showLegend && <Legend />}
        <Bar dataKey="value" fill="#3B82F6">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );

  // 進度條顯示
  const ProgressDisplay = () => (
    <div className="space-y-4">
      {allocations.map((allocation, index) => {
        const color = getColors[index % getColors.length];
        const percentage = (allocation.amount / total) * 100;

        return (
          <div key={allocation.area} className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {allocation.area}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  {allocation.amount}
                </span>
                {showPercentage && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({percentage.toFixed(0)}%)
                  </span>
                )}
              </div>
            </div>
            <Progress
              value={percentage}
              className="h-2"
              style={
                {
                  '--progress-color': color,
                } as React.CSSProperties
              }
            />
          </div>
        );
      })}

      {/* 顯示剩餘籌碼 */}
      {remaining > 0 && (
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">剩餘能量</span>
            <span className="text-lg font-bold text-orange-500">{remaining}</span>
          </div>
        </div>
      )}
    </div>
  );

  // 數字顯示
  const NumberDisplay = () => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {allocations.map((allocation, index) => {
        const color = getColors[index % getColors.length];
        const percentage = (allocation.amount / total) * 100;

        return (
          <div
            key={allocation.area}
            className="bg-white dark:bg-gray-800 rounded-lg p-4
                     border-2 border-gray-200 dark:border-gray-700
                     hover:shadow-md transition-shadow"
            style={{ borderColor: color }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="w-2 h-2 rounded-full mt-1" style={{ backgroundColor: color }} />
              <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {allocation.amount}
              </span>
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {allocation.area}
            </div>
            {showPercentage && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {percentage.toFixed(1)}%
              </div>
            )}
          </div>
        );
      })}

      {/* 剩餘籌碼卡片 */}
      {remaining > 0 && (
        <div
          className="bg-orange-50 dark:bg-orange-950 rounded-lg p-4
                      border-2 border-orange-300 dark:border-orange-700"
        >
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 mb-2">
            {remaining}
          </div>
          <div className="text-sm font-medium text-orange-700 dark:text-orange-300">待分配</div>
        </div>
      )}
    </div>
  );

  // 根據類型選擇顯示方式
  const getDisplay = () => {
    switch (visualType) {
      case 'pie':
        return <PieChartDisplay />;
      case 'bar':
        return <BarChartDisplay />;
      case 'number':
        return <NumberDisplay />;
      case 'progress':
      default:
        return <ProgressDisplay />;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>{title}</span>
          <span className="text-sm font-normal text-gray-500 dark:text-gray-400">
            已分配: {allocatedTotal}/{total}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allocations.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">尚未分配任何籌碼</div>
        ) : (
          getDisplay()
        )}
      </CardContent>
    </Card>
  );
};

export default TokenDisplay;
