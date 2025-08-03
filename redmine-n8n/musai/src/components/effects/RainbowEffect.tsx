import React, { useEffect, useState } from 'react';
import { useMusaiMood } from '@/contexts/MusaiMoodContext';

interface RainbowEffectProps {
  isActive: boolean;
  onComplete: () => void;
}

export const RainbowEffect: React.FC<RainbowEffectProps> = ({ isActive, onComplete }) => {
  const [currentMoodIndex, setCurrentMoodIndex] = useState(0);
  const { setMood } = useMusaiMood();

  const moods = [
    'calm', 'energetic', 'creative', 'focused', 
    'mysterious', 'playful', 'zen', 'default'
  ];

  useEffect(() => {
    if (!isActive) {
      setCurrentMoodIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentMoodIndex(prev => {
        const nextIndex = (prev + 1) % moods.length;
        setMood(moods[nextIndex]);
        return nextIndex;
      });
    }, 1000); // Change mood every second

    // Auto-complete after 8 seconds (one cycle through all moods)
    const timeout = setTimeout(() => {
      onComplete();
    }, 8000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [isActive, onComplete, setMood]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {/* Rainbow overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-yellow-500/20 via-green-500/20 via-blue-500/20 via-purple-500/20 to-pink-500/20 animate-pulse" />
      
      {/* Floating mood indicator */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="text-4xl font-bold text-white drop-shadow-lg">
          🌈 Rainbow Mode
        </div>
        <div className="text-xl text-white mt-2">
          Current Mood: {moods[currentMoodIndex]}
        </div>
      </div>
    </div>
  );
}; 