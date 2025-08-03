import React, { useEffect, useState } from 'react';
import { useMusaiMood } from '@/contexts/MusaiMoodContext';

interface RainbowEffectProps {
  isActive: boolean;
  onComplete: () => void;
}

export const RainbowEffect: React.FC<RainbowEffectProps> = ({ isActive, onComplete }) => {
  const [currentMoodIndex, setCurrentMoodIndex] = useState(0);
  const [showMessage, setShowMessage] = useState(true);
  const { setMood } = useMusaiMood();

  const moods = [
    'calm', 'energetic', 'creative', 'focused', 
    'mysterious', 'playful', 'zen', 'default'
  ];

  useEffect(() => {
    if (!isActive) {
      setCurrentMoodIndex(0);
      setShowMessage(true);
      return;
    }

    const interval = setInterval(() => {
      setCurrentMoodIndex(prev => {
        const nextIndex = (prev + 1) % moods.length;
        setMood(moods[nextIndex]);
        return nextIndex;
      });
    }, 1000); // Change mood every second

    // Hide message after 3 seconds
    const messageTimeout = setTimeout(() => {
      setShowMessage(false);
    }, 3000);

    // Auto-complete after 8 seconds (one cycle through all moods)
    const timeout = setTimeout(() => {
      onComplete();
    }, 8000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
      clearTimeout(messageTimeout);
    };
  }, [isActive, onComplete, setMood]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {/* Rainbow overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-yellow-500/20 via-green-500/20 via-blue-500/20 via-purple-500/20 to-pink-500/20 animate-pulse" />
      
      {/* Floating mood indicator */}
      {showMessage && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="text-4xl font-bold text-white drop-shadow-lg">
            🌈 Rainbow Mode
          </div>
        </div>
      )}
    </div>
  );
}; 