'use client';

import { useState } from 'react';

interface FlipCardProps {
  id: string;
  emoji: string;
  title: string;
  description: string;
  cardCount: string;
  targetAudience: string;
  brandColor: string;
  delay: number;
  isVisible: boolean;
  onFlip?: (id: string, isFlipped: boolean) => void;
}

export default function FlipCard({
  id,
  emoji,
  title,
  description,
  cardCount,
  targetAudience,
  brandColor,
  delay,
  isVisible,
  onFlip,
}: FlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const handleFlip = () => {
    const newFlipState = !isFlipped;
    setIsFlipped(newFlipState);
    onFlip?.(id, newFlipState);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleFlip();
    }
  };

  // Generate gradient colors based on brand color
  const getGradientColors = (color: string) => {
    const gradients: Record<string, { from: string; to: string }> = {
      '#0056A7': { from: '#0056A7', to: '#003d75' },
      '#7AB7B7': { from: '#7AB7B7', to: '#5A9A9A' },
      '#FFCC3A': { from: '#FFCC3A', to: '#E6B800' },
    };
    return gradients[color] || { from: color, to: color };
  };

  const gradient = getGradientColors(brandColor);

  // Get glow shadow color based on brand color
  const getGlowShadow = (color: string) => {
    const rgb: Record<string, string> = {
      '#0056A7': '0, 86, 167',
      '#7AB7B7': '122, 183, 183',
      '#FFCC3A': '255, 204, 58',
    };
    return `0 0 30px rgba(${rgb[color] || '0, 0, 0'}, 0.5)`;
  };

  return (
    <button
      onClick={handleFlip}
      onKeyDown={handleKeyDown}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      aria-label={`翻轉${title}`}
      aria-pressed={isFlipped}
      className={`
        relative w-full h-full
        transition-all duration-300
        hover:-translate-y-2 hover:shadow-2xl
        focus:outline-none
        active:scale-[0.98]
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-24'}
      `}
      style={{
        perspective: '1000px',
        transitionDelay: isVisible ? `${delay}s` : '0s',
        transitionDuration: '0.8s',
        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        willChange: 'transform',
        // Dynamic focus ring using inline styles
        ...(isFocused && {
          outline: `2px solid ${brandColor}`,
          outlineOffset: '2px',
        }),
      }}
    >
      <div
        className={`
          relative w-full h-full
          ${isFlipped ? '[transform:rotateY(180deg)]' : ''}
        `}
        style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s ease-out',
          boxShadow: isFlipped ? getGlowShadow(brandColor) : undefined,
        }}
      >
        {/* Card Back (牌背) - Brand Visual */}
        <div
          className="absolute inset-0 rounded-2xl shadow-lg flex flex-col items-center justify-center p-8"
          style={{
            background: `linear-gradient(to bottom right, ${gradient.from}, ${gradient.to})`,
            backfaceVisibility: 'hidden',
          }}
        >
          <div className="text-8xl mb-6" role="img" aria-label={emoji}>
            {emoji}
          </div>
          <h3 className="text-2xl font-bold text-white mb-3 text-center">
            {title}
          </h3>
          <p className="text-sm text-white/60">點擊翻開</p>
        </div>

        {/* Card Front (牌面) - Product Info */}
        <div
          className="absolute inset-0 bg-white rounded-2xl shadow-lg flex flex-col p-8"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl" role="img" aria-label={emoji}>
              {emoji}
            </span>
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-600 leading-relaxed mb-6 flex-grow">
            {description}
          </p>

          {/* Key Number */}
          <div className="mb-4">
            <div
              className="text-4xl font-black mb-1"
              style={{ color: brandColor }}
            >
              {cardCount}
            </div>
            <div className="text-xs text-gray-500">{targetAudience}</div>
          </div>

          {/* CTA Button */}
          <a
            href="https://navicareer.tw"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium text-white transition-all hover:scale-105"
            style={{ backgroundColor: brandColor }}
            onClick={(e) => e.stopPropagation()} // Prevent card flip when clicking CTA
          >
            了解更多
            <svg
              className="ml-2 w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </a>
        </div>
      </div>
    </button>
  );
}
