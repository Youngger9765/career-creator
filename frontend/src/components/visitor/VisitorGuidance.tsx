'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  HelpCircle,
  MousePointer,
  Hand,
  Eye,
  MessageCircle,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface VisitorGuidanceProps {
  gameMode: string;
  isVisible: boolean;
  onClose: () => void;
}

export function VisitorGuidance({ gameMode, isVisible, onClose }: VisitorGuidanceProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!isVisible) return null;

  const getGameInstructions = () => {
    switch (gameMode) {
      case '優劣勢分析':
        return {
          title: '優劣勢分析',
          steps: [
            '選擇與您相關的職能卡片',
            '將卡片拖拽到「優勢」或「劣勢」區域',
            '每個區域最多放置5張卡片',
            '與諮詢師討論您的選擇',
          ],
          tips: [
            '誠實面對自己的能力現狀',
            '優勢是您擅長且喜歡的技能',
            '劣勢是需要加強的部分，也是成長機會',
          ],
        };
      case '價值觀排序':
        return {
          title: '價值觀排序',
          steps: [
            '將重要的價值觀卡片拖拽到格子中',
            '使用籌碼為價值觀加權（紅10分，藍5分，綠1分）',
            '排列出您最在意的價值觀組合',
            '與諮詢師討論您的價值觀優先順序',
          ],
          tips: [
            '沒有標準答案，每個人的價值觀都不同',
            '考慮當下最重要的價值，也可以思考未來',
            '籌碼數量有限，需要做出選擇',
          ],
        };
      case '六大性格分析':
        return {
          title: '六大性格分析',
          steps: [
            '瀏覽各種職業卡片',
            '將卡片分類到「喜歡」、「中性」、「不喜歡」',
            '參考Holland性格解釋卡了解分類標準',
            '發現您的職業性格傾向',
          ],
          tips: [
            '根據直覺反應分類，不要過度思考',
            '考慮您對工作內容的真實感受',
            '每個分類都很重要，包括「不喜歡」',
          ],
        };
      default:
        return {
          title: '互動指引',
          steps: ['選擇牌卡', '拖拽到指定區域', '與諮詢師討論'],
          tips: ['跟隨諮詢師的引導', '誠實表達想法'],
        };
    }
  };

  const instructions = getGameInstructions();

  return (
    <Card className="fixed top-4 right-4 w-80 z-50 shadow-lg border-orange-200 bg-orange-50">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-orange-600" />
            {instructions.title} - 操作指引
          </CardTitle>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1 h-6 w-6"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="p-1 h-6 w-6">
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          {/* 操作步驟 */}
          <div className="mb-4">
            <h4 className="font-medium text-orange-800 mb-2 flex items-center gap-1">
              <MousePointer className="w-4 h-4" />
              操作步驟
            </h4>
            <ol className="text-sm space-y-1 text-orange-700">
              {instructions.steps.map((step, index) => (
                <li key={index} className="flex gap-2">
                  <span className="flex-shrink-0 w-5 h-5 bg-orange-200 text-orange-800 rounded-full text-xs flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* 基本操作 */}
          <div className="mb-4">
            <h4 className="font-medium text-orange-800 mb-2 flex items-center gap-1">
              <Hand className="w-4 h-4" />
              基本操作
            </h4>
            <ul className="text-sm space-y-1 text-orange-700">
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span>拖拽卡片到指定區域</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span>點擊卡片可以翻面查看</span>
              </li>
              <li className="flex items-center gap-2">
                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                <span>點擊卡片右上角「×」移除</span>
              </li>
            </ul>
          </div>

          {/* 小提醒 */}
          <div className="mb-4">
            <h4 className="font-medium text-orange-800 mb-2 flex items-center gap-1">
              <Eye className="w-4 h-4" />
              小提醒
            </h4>
            <ul className="text-sm space-y-1 text-orange-700">
              {instructions.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 互動提醒 */}
          <div className="bg-orange-100 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <MessageCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-700">
                <span className="font-medium">隨時與諮詢師互動</span>
                <br />
                有任何疑問都可以直接詢問，諮詢師會引導您完成整個過程。
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
