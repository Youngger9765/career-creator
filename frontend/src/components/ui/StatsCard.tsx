/**
 * StatsCard - Navicareer-style statistics display card
 * Features dark gradient background with gold accents
 * Phase 2, Task 5 of design alignment plan
 */

'use client';

import React from 'react';

interface StatsCardProps {
  number: string;
  label: string;
  icon?: React.ReactNode;
  className?: string;
}

const StatsCard: React.FC<StatsCardProps> = ({
  number,
  label,
  icon,
  className = '',
}) => {
  return (
    <div className={`bg-gradient-to-br from-brand-navy to-brand-navy-dark text-white rounded-3xl p-8 ${className}`}>
      {icon && (
        <div className="text-brand-gold mb-4 text-3xl">
          {icon}
        </div>
      )}
      <div className="text-5xl font-black mb-2">{number}</div>
      <div className="text-base font-medium opacity-90">{label}</div>
    </div>
  );
};

export default StatsCard;
