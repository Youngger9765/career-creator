/**
 * ParticipantList Component
 * 參與者列表組件 - 顯示諮詢室內的參與者
 */
import React from 'react';
import { Users, Crown, User } from 'lucide-react';
import { RoomParticipant } from '@/hooks/use-room-participants';

interface ParticipantListProps {
  participants: RoomParticipant[];
  onlineCount: number;
  isLoading?: boolean;
  className?: string;
}

// Participant avatar component
function ParticipantAvatar({ participant }: { participant: RoomParticipant }) {
  const getAvatarColor = (type: string, name: string) => {
    const colors = {
      counselor: 'bg-blue-500 text-white',
      visitor: 'bg-green-500 text-white',
      user: 'bg-gray-500 text-white',
    };

    // Fallback color based on name hash
    if (!colors[type as keyof typeof colors]) {
      const hash = name.split('').reduce((a, b) => {
        a = (a << 5) - a + b.charCodeAt(0);
        return a & a;
      }, 0);
      const colorIndex = Math.abs(hash) % 6;
      const fallbackColors = [
        'bg-purple-500 text-white',
        'bg-indigo-500 text-white',
        'bg-pink-500 text-white',
        'bg-orange-500 text-white',
        'bg-teal-500 text-white',
        'bg-cyan-500 text-white',
      ];
      return fallbackColors[colorIndex];
    }

    return colors[type as keyof typeof colors];
  };

  const avatarColor = getAvatarColor(participant.type, participant.name);

  return (
    <div className="relative group">
      <div
        className={`
        w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold
        ${avatarColor}
        ${participant.isOnline ? 'ring-2 ring-green-400' : 'opacity-60'}
        transition-all duration-200 hover:scale-110
      `}
      >
        {participant.initials}
        {participant.type === 'counselor' && (
          <Crown className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500" />
        )}
      </div>

      {/* Online status indicator */}
      {participant.isOnline && (
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white"></div>
      )}

      {/* Tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
        <div className="bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
          <div className="font-medium">{participant.name}</div>
          <div className="text-gray-300 capitalize">{participant.type}</div>
          <div className="text-gray-400">{participant.isOnline ? '線上' : '離線'}</div>
        </div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-2 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );
}

export function ParticipantList({
  participants,
  onlineCount,
  isLoading,
  className,
}: ParticipantListProps) {
  if (isLoading) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <Users className="w-4 h-4 text-gray-400" />
        <div className="flex space-x-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  const maxVisible = 5;
  const visibleParticipants = participants.slice(0, maxVisible);
  const remainingCount = Math.max(0, participants.length - maxVisible);

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Online count */}
      <div className="flex items-center space-x-1 text-sm text-gray-600">
        <Users className="w-4 h-4" />
        <span>{onlineCount} 線上</span>
      </div>

      {/* Participant avatars */}
      <div className="flex items-center space-x-1">
        {visibleParticipants.map((participant) => (
          <ParticipantAvatar key={participant.id} participant={participant} />
        ))}

        {/* Overflow indicator */}
        {remainingCount > 0 && (
          <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-xs font-medium">
            +{remainingCount}
          </div>
        )}
      </div>
    </div>
  );
}
