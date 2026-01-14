/**
 * CardItem Component Tests
 * Testing flip button visibility for single-sided vs double-sided cards
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import CardItem from '../CardItem';

describe('CardItem - Flip Button', () => {
  describe('Single-sided cards (no back image)', () => {
    it('should NOT show flip button when card only has front image', () => {
      const singleSidedCard = {
        id: 'career_001',
        title: '幼教老師',
        description: '負責教導幼兒知識與課程',
        imageUrl: {
          M: {
            front: 'https://example.com/front.png',
            // No "back" property - single-sided card
          },
        },
      };

      render(<CardItem {...singleSidedCard} />);

      // Flip button should NOT exist
      const flipButton = screen.queryByTitle('翻轉卡片');
      expect(flipButton).not.toBeInTheDocument();
    });

    it('should NOT show flip button when imageUrl.M.back is undefined', () => {
      const cardWithUndefinedBack = {
        id: 'career_002',
        title: '國高中老師',
        imageUrl: {
          M: {
            front: 'https://example.com/front.png',
            back: undefined, // Explicitly undefined
          },
        },
      };

      render(<CardItem {...cardWithUndefinedBack} />);

      const flipButton = screen.queryByTitle('翻轉卡片');
      expect(flipButton).not.toBeInTheDocument();
    });
  });

  describe('Double-sided cards (has back image)', () => {
    it('should show flip button when card has both front and back images', () => {
      const doubleSidedCard = {
        id: 'skill_011',
        title: '溝通技巧',
        imageUrl: {
          M: {
            front: 'https://example.com/front.png',
            back: 'https://example.com/back.png', // Has back image
          },
        },
      };

      render(<CardItem {...doubleSidedCard} />);

      // Flip button SHOULD exist
      const flipButton = screen.getByTitle('翻轉卡片');
      expect(flipButton).toBeInTheDocument();
    });
  });

  describe('Text-only cards (no images)', () => {
    it('should NOT show flip button when card has no imageUrl', () => {
      const textOnlyCard = {
        id: 'text_001',
        title: 'Text Card',
        description: 'A card without images',
        // No imageUrl property
      };

      render(<CardItem {...textOnlyCard} />);

      const flipButton = screen.queryByTitle('翻轉卡片');
      expect(flipButton).not.toBeInTheDocument();
    });
  });
});
