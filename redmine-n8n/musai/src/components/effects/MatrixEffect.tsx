import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useMusaiMood } from '@/contexts/MusaiMoodContext';

interface MatrixEffectProps {
  isActive: boolean;
  onClose: () => void;
}

interface MatrixCharacter {
  char: string;
  x: number;
  y: number;
  speed: number;
  opacity: number;
  color: string;
}

export const MatrixEffect: React.FC<MatrixEffectProps> = ({ isActive, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const { currentMood, accentColor } = useMusaiMood();
  const [characters, setCharacters] = useState<MatrixCharacter[]>([]);

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
      const cols = Math.floor(canvas.width / 20);
      const newChars: MatrixCharacter[] = [];
      
      for (let i = 0; i < cols; i++) {
        newChars.push({
          char: matrixChars[Math.floor(Math.random() * matrixChars.length)],
          x: i * 20,
          y: Math.random() * canvas.height,
          speed: 0.5 + Math.random() * 2,
          opacity: Math.random(),
          color: getMoodColor()
        });
      }
      setCharacters(newChars);
    };

    initCharacters();

    // Animation loop
    const animate = () => {
      if (!ctx || !canvas) return;

      // Clear canvas with fade effect
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw characters
      setCharacters(prevChars => 
        prevChars.map(char => {
          // Update position
          char.y += char.speed;
          
          // Reset if off screen
          if (char.y > canvas.height) {
            char.y = -20;
            char.char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
            char.opacity = Math.random();
          }

          // Draw character
          ctx.font = '16px monospace';
          ctx.fillStyle = `${char.color}${Math.floor(char.opacity * 255).toString(16).padStart(2, '0')}`;
          ctx.fillText(char.char, char.x, char.y);

          return char;
        })
      );

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
  }, [isActive, currentMood, accentColor]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      <canvas
        ref={canvasRef}
        className="w-full h-full pointer-events-none"
      />
      
      {/* Close button - only this is clickable */}
      <div className="absolute top-4 right-4 pointer-events-auto z-[10000]">
        <button
          onClick={onClose}
          className="bg-black/50 text-white px-4 py-2 rounded-lg hover:bg-black/70 transition-colors"
        >
          Exit Matrix
        </button>
      </div>
    </div>
  );
}; 