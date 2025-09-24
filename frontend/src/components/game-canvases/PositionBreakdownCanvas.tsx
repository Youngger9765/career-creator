/**
 * PositionBreakdownCanvas - 職位拆解畫布元件
 * 
 * 用於分析職位描述(JD)所需的技能和能力
 * 左側：上傳JD圖像或截圖
 * 右側：放置相關技能卡片
 */

'use client';

import React, { useState, useRef } from 'react';
import { Card as CardData } from '@/game-modes/services/card-loader.service';
import { Upload, Image, X, FileText, Briefcase } from 'lucide-react';
import CardItem from './CardItem';

interface PositionBreakdownCanvasProps {
  cards?: CardData[];
  onCardUse?: (cardId: string) => void;
  onCardRemove?: (cardId: string) => void;
  className?: string;
}

const PositionBreakdownCanvas: React.FC<PositionBreakdownCanvasProps> = ({
  cards = [],
  onCardUse,
  onCardRemove,
  className = '',
}) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedCards, setSelectedCards] = useState<string[]>([]);
  const [dragOverCards, setDragOverCards] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 處理圖片上傳
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 處理拖放圖片
  const handleImageDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 處理拖放卡片
  const handleCardDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCards(false);

    const cardId = e.dataTransfer.getData('cardId');
    if (cardId && !selectedCards.includes(cardId)) {
      setSelectedCards([...selectedCards, cardId]);
      onCardUse?.(cardId);
    }
  };

  // 移除卡片
  const removeCard = (cardId: string) => {
    setSelectedCards(selectedCards.filter(id => id !== cardId));
    onCardRemove?.(cardId);
  };

  // 清除圖片
  const clearImage = () => {
    setUploadedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={`w-full h-full p-4 ${className}`}>
      <div className="h-full grid grid-cols-2 gap-6">
        {/* 左側：JD 圖片上傳區 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  職位描述 (JD)
                </h3>
              </div>
              {uploadedImage && (
                <button
                  onClick={clearImage}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  title="清除圖片"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              上傳職位描述截圖或圖片
            </p>
          </div>

          <div className="flex-1 p-4 overflow-hidden">
            {uploadedImage ? (
              <div className="h-full relative">
                <img
                  src={uploadedImage}
                  alt="Job Description"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>
            ) : (
              <div
                className="h-full border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg 
                         flex flex-col items-center justify-center cursor-pointer
                         hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
                onDrop={handleImageDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-12 h-12 text-gray-400 dark:text-gray-500 mb-4" />
                <p className="text-gray-600 dark:text-gray-400 font-medium mb-2">
                  點擊上傳或拖曳圖片到此處
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500">
                  支援 JPG, PNG, GIF 格式
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </div>

        {/* 右側：技能卡片放置區 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                  所需技能
                </h3>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {selectedCards.length} 張卡片
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              拖曳相關技能卡片到此處
            </p>
          </div>

          <div 
            className={`flex-1 p-4 overflow-y-auto transition-colors ${
              dragOverCards 
                ? 'bg-blue-50 dark:bg-blue-950 border-2 border-dashed border-blue-400 dark:border-blue-600 rounded-lg m-2' 
                : ''
            }`}
            onDrop={handleCardDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverCards(true);
            }}
            onDragLeave={() => setDragOverCards(false)}
          >
            {selectedCards.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                  <Briefcase className="w-10 h-10 text-gray-400 dark:text-gray-600" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-medium">
                  拖曳技能卡片到此處
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                  分析職位所需的技能和能力
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {selectedCards.map((cardId) => {
                  const card = cards.find(c => c.id === cardId);
                  if (!card) return null;

                  return (
                    <div key={cardId} className="relative">
                      <button
                        onClick={() => removeCard(cardId)}
                        className="absolute -top-2 -right-2 z-10 w-6 h-6 bg-red-500 hover:bg-red-600 
                                 text-white rounded-full flex items-center justify-center shadow-md"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <CardItem
                        id={card.id}
                        title={card.title}
                        description={card.description}
                        category={card.category || ''}
                        isDraggable={false}
                        showRemoveButton={false}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PositionBreakdownCanvas;