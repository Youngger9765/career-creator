'use client';

import { useState, useEffect, useRef } from 'react';
import FlipCard from './FlipCard';

interface ProductCard {
  id: string;
  emoji: string;
  title: string;
  description: string;
  cardCount: string;
  targetAudience: string;
  brandColor: string;
  delay: number;
  desktopPosition: string;
  desktopRotation: string;
  tabletRotation: string;
}

const PRODUCT_CARDS: ProductCard[] = [
  {
    id: 'career-explorer',
    emoji: '🧭',
    title: '職游旅人卡',
    description:
      '100 張職業資訊卡，透過職業卡的多元分類與六大興趣分類，快速找到喜歡的職業。',
    cardCount: '100 張卡',
    targetAudience: '大學生・職場新鮮人',
    brandColor: '#0056A7',
    delay: 0,
    desktopPosition: 'left-[10%] top-[15%]',
    desktopRotation: '-rotate-[15deg]',
    tabletRotation: '-rotate-[7.5deg]',
  },
  {
    id: 'value-navigator',
    emoji: '💎',
    title: '價值導航卡',
    description:
      '71 張價值導航卡，系統性地釐清核心價值觀，以價值為核心重新對生活做出選擇。',
    cardCount: '71 張卡',
    targetAudience: '全年齡適用',
    brandColor: '#7AB7B7',
    delay: 0.2,
    desktopPosition: 'right-[10%] top-[25%]',
    desktopRotation: 'rotate-[8deg]',
    tabletRotation: 'rotate-[4deg]',
  },
  {
    id: 'skill-inventory',
    emoji: '📊',
    title: '職能盤點卡',
    description:
      '43 張職能盤點卡，系統性盤點能力資本，清楚定位優劣勢，規劃職涯藍圖。',
    cardCount: '43 張卡',
    targetAudience: '學生・職場工作者',
    brandColor: '#FFCC3A',
    delay: 0.4,
    desktopPosition: 'left-[35%] bottom-[15%]',
    desktopRotation: '-rotate-[5deg]',
    tabletRotation: '-rotate-[2.5deg]',
  },
];

export default function ProductShowcase() {
  const [isVisible, setIsVisible] = useState(false);
  const [flippedCards, setFlippedCards] = useState<Set<string>>(new Set());
  const sectionRef = useRef<HTMLElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Intersection Observer for scroll-triggered animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleCardFlip = (cardId: string, isFlipped: boolean) => {
    setFlippedCards((prev) => {
      const newSet = new Set(prev);
      if (isFlipped) {
        newSet.add(cardId);
      } else {
        newSet.delete(cardId);
      }
      return newSet;
    });
  };

  return (
    <section
      ref={sectionRef}
      aria-label="產品展示"
      className="relative min-h-screen flex items-center justify-center overflow-hidden py-24 bg-gradient-to-br from-amber-50/30 via-white to-teal-50/30"
    >
      {/* Decorative Background Blur Circles */}
      <div
        className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: 'rgba(122, 183, 183, 0.15)' }}
      />
      <div
        className="absolute bottom-0 left-0 w-[300px] h-[300px] rounded-full blur-3xl pointer-events-none"
        style={{ backgroundColor: 'rgba(255, 204, 58, 0.2)' }}
      />

      {/* Content Container */}
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        {/* Section Title */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">
            三大產品系列
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            專業設計的職涯探索工具，陪伴你找到屬於自己的道路
          </p>
        </div>

        {/* Cards Container */}
        {/* Desktop: Irregular positioning with overlaps */}
        <div className="hidden lg:block relative h-[700px]">
          {PRODUCT_CARDS.map((card) => (
            <div
              key={card.id}
              className={`
                absolute w-[300px] h-[420px]
                ${card.desktopPosition}
                ${!prefersReducedMotion ? card.desktopRotation : ''}
                transition-transform duration-300
                ${flippedCards.has(card.id) ? 'z-20' : 'z-10'}
                ${flippedCards.size > 0 && !flippedCards.has(card.id) ? 'scale-95' : 'scale-100'}
              `}
            >
              <FlipCard
                {...card}
                isVisible={isVisible}
                onFlip={handleCardFlip}
              />
            </div>
          ))}
        </div>

        {/* Tablet: Reduced rotation with spacing */}
        <div className="hidden md:block lg:hidden">
          <div className="flex flex-wrap justify-center gap-8">
            {PRODUCT_CARDS.map((card) => (
              <div
                key={card.id}
                className={`
                  w-[260px] h-[360px]
                  ${!prefersReducedMotion ? card.tabletRotation : ''}
                  transition-transform duration-300
                  ${flippedCards.has(card.id) ? 'z-20' : 'z-10'}
                  ${flippedCards.size > 0 && !flippedCards.has(card.id) ? 'scale-95' : 'scale-100'}
                `}
              >
                <FlipCard
                  {...card}
                  isVisible={isVisible}
                  onFlip={handleCardFlip}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Mobile: Vertical stack, no rotation */}
        <div className="md:hidden flex flex-col gap-6 items-center">
          {PRODUCT_CARDS.map((card) => (
            <div
              key={card.id}
              className="w-[90vw] h-[480px] max-w-[360px]"
              style={{
                transition: 'transform 0.3s',
                transform:
                  flippedCards.size > 0 && !flippedCards.has(card.id)
                    ? 'scale(0.95)'
                    : 'scale(1)',
              }}
            >
              <FlipCard
                {...card}
                isVisible={isVisible}
                onFlip={handleCardFlip}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Reduced Motion Alternative */}
      {prefersReducedMotion && (
        <style jsx>{`
          @media (prefers-reduced-motion: reduce) {
            * {
              animation-duration: 0.01ms !important;
              animation-iteration-count: 1 !important;
              transition-duration: 0.01ms !important;
            }
          }
        `}</style>
      )}
    </section>
  );
}
