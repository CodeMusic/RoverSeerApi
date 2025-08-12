import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useMusaiMood } from '@/contexts/MusaiMoodContext';

interface MatrixEffectProps {
  isActive: boolean;
  onClose: () => void;
  mode?: 'passive' | 'overlay';
  density?: number; // 0..1 scaling for number of columns (passive defaults lower)
}

interface MatrixCharacter {
  char: string;
  x: number;
  y: number;
  speed: number;
  opacity: number;
  color: string;
}

export const MatrixEffect: React.FC<MatrixEffectProps> = ({ isActive, onClose, mode = 'passive', density }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const { currentMood, accentColor } = useMusaiMood();
  const charactersRef = useRef<MatrixCharacter[]>([]);

  // Matrix characters (Japanese katakana, numbers, symbols)
  const matrixChars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789@#$%&*()_+-=[]{}|;:,.<>?';

  // Get mood-based color
  const getMoodColor = () => {
    const moodColors: Record<string, string> = {
      'calm': '#0891b2',      // Cyan
      'energetic': '#ea580c',  // Orange
      'creative': '#9333ea',   // Purple
      'focused': '#16a34a',    // Green
      'mysterious': '#7c3aed', // Indigo
      'playful': '#f59e0b',    // Amber
      'zen': '#2563eb',        // Blue
      'default': '#8b5cf6'     // Violet
    };
    return moodColors[currentMood] || accentColor;
  };

  useEffect(() => {
    if (!isActive || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Initialize characters
    const initCharacters = () => {
      const columnWidth = mode === 'overlay' ? 20 : 26;
      const scale = typeof density === 'number' ? Math.max(0.1, Math.min(1, density)) : (mode === 'overlay' ? 1 : 0.5);
      const cols = Math.max(8, Math.floor((canvas.width / columnWidth) * scale));
      const newChars: MatrixCharacter[] = [];
      for (let i = 0; i < cols; i++) {
        newChars.push({
          char: matrixChars[Math.floor(Math.random() * matrixChars.length)],
          x: i * columnWidth,
          y: Math.random() * canvas.height,
          speed: (mode === 'overlay' ? 0.6 : 0.3) + Math.random() * (mode === 'overlay' ? 2 : 0.8),
          opacity: mode === 'overlay' ? Math.random() : Math.random() * 0.6,
          color: getMoodColor()
        });
      }
      charactersRef.current = newChars;
    };

    initCharacters();

    // Animation loop (no React state churn)
    const animate = () => {
      if (!ctx || !canvas) return;

      // Clear canvas with optional fade overlay
      if (mode === 'overlay') {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.10)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }

      const arr = charactersRef.current;
      for (let i = 0; i < arr.length; i++) {
        const char = arr[i];
        char.y += char.speed;
        if (char.y > canvas.height) {
          char.y = -20;
          char.char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
          char.opacity = mode === 'overlay' ? Math.random() : Math.random() * 0.6;
        }
        ctx.font = '16px monospace';
        ctx.fillStyle = `${char.color}${Math.floor(char.opacity * 255).toString(16).padStart(2, '0')}`;
        ctx.fillText(char.char, char.x, char.y);
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [isActive, currentMood, accentColor, mode, density]);

  if (!isActive) return null;

  return (
    <div className={cn(
      mode === 'overlay' ? 'fixed inset-0 z-[999] pointer-events-none' : 'fixed inset-0 z-0 pointer-events-none'
    )}>
      <canvas
        ref={canvasRef}
        className="w-full h-full pointer-events-none"
      />
      {mode === 'overlay' && (
        <div className="absolute top-4 right-4 pointer-events-auto z-[10000]">
          <button
            onClick={onClose}
            className="bg-black/50 text-white px-4 py-2 rounded-lg hover:bg-black/70 transition-colors"
          >
            Exit Matrix
          </button>
        </div>
      )}
    </div>
  );
}; 