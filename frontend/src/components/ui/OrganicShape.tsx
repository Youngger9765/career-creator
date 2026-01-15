/**
 * OrganicShape - Decorative background element
 * Creates organic, irregular circular shapes for visual interest
 * Part of Navicareer design system
 * Phase 3, Task 6 of design alignment plan
 */

'use client';

import React from 'react';

interface OrganicShapeProps {
  color?: 'teal' | 'yellow' | 'gray' | 'gold';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  position?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  className?: string;
}

const OrganicShape: React.FC<OrganicShapeProps> = ({
  color = 'teal',
  size = 'md',
  position = {},
  className = '',
}) => {
  const colorClasses = {
    teal: 'bg-brand-teal/10',
    yellow: 'bg-brand-yellow-soft/20',
    gray: 'bg-gray-200/30',
    gold: 'bg-brand-gold/10',
  };

  const sizeClasses = {
    sm: 'w-32 h-32',
    md: 'w-64 h-64',
    lg: 'w-96 h-96',
    xl: 'w-[32rem] h-[32rem]',
  };

  const positionStyles = {
    top: position.top,
    bottom: position.bottom,
    left: position.left,
    right: position.right,
  };

  return (
    <div
      className={`absolute ${sizeClasses[size]} ${colorClasses[color]} rounded-full blur-3xl ${className}`}
      style={positionStyles}
      aria-hidden="true"
    />
  );
};

export default OrganicShape;
