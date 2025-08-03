import React, { useEffect, useState } from 'react';
import { useMusaiMood } from '@/contexts/MusaiMoodContext';

interface PartyEffectProps {
  isActive: boolean;
  onComplete: () => void;
}

interface Confetti {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
}

export const PartyEffect: React.FC<PartyEffectProps> = ({ isActive, onComplete }) => {
  const [confetti, setConfetti] = useState<Confetti[]>([]);
  const { setMood } = useMusaiMood();

  const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd'];

  useEffect(() => {
    if (!isActive) {
      setConfetti([]);
      return;
    }

    // Set energetic mood
    setMood('energetic');

    // Create confetti
    const newConfetti: Confetti[] = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: -10,
      vx: (Math.random() - 0.5) * 8,
      vy: Math.random() * 3 + 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: Math.random() * 8 + 4
    }));

    setConfetti(newConfetti);

    // Auto-complete after 5 seconds
    const timeout = setTimeout(() => {
      onComplete();
    }, 5000);

    return () => {
      clearTimeout(timeout);
    };
  }, [isActive, onComplete, setMood]);

  useEffect(() => {
    if (!isActive || confetti.length === 0) return;

    const interval = setInterval(() => {
      setConfetti(prev => 
        prev.map(c => ({
          ...c,
          x: c.x + c.vx,
          y: c.y + c.vy,
          vy: c.vy + 0.1 // gravity
        })).filter(c => c.y < window.innerHeight + 100)
      );
    }, 16); // 60fps

    return () => clearInterval(interval);
  }, [isActive, confetti.length]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[9998] pointer-events-none">
      {/* Party overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-orange-500/20 to-red-500/20 animate-pulse" />
      
      {/* Confetti */}
      {confetti.map(c => (
        <div
          key={c.id}
          className="absolute w-2 h-2 rounded-full"
          style={{
            left: c.x,
            top: c.y,
            backgroundColor: c.color,
            width: c.size,
            height: c.size,
            transform: `rotate(${c.x * 0.1}deg)`
          }}
        />
      ))}
      
      {/* Party message */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
        <div className="text-4xl font-bold text-white drop-shadow-lg animate-bounce">
          🎉 Party Mode! 🎉
        </div>
        <div className="text-xl text-white mt-2">
          Musai is now energetic!
        </div>
      </div>
    </div>
  );
}; 