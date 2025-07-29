import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface MysticalWaveEffectProps {
  isDarkMode?: boolean;
  trigger?: boolean;
  onAnimationComplete?: () => void;
}

export const MysticalWaveEffect = ({ 
  isDarkMode = false, 
  trigger = false,
  onAnimationComplete 
}: MysticalWaveEffectProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (trigger && !isAnimating) {
      setIsAnimating(true);
      
      // Reset animation after completion
      const timer = setTimeout(() => {
        setIsAnimating(false);
        onAnimationComplete?.();
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [trigger, isAnimating, onAnimationComplete]);

  if (!isAnimating) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
      {/* Multiple wave ripples with different delays */}
      <div className="relative">
        {/* Primary wave */}
        <div className={cn(
          "absolute inset-0 w-32 h-32 rounded-full mystical-wave",
          isDarkMode 
            ? "bg-gradient-to-r from-purple-500/30 to-blue-500/30" 
            : "bg-gradient-to-r from-purple-400/30 to-blue-400/30"
        )} />
        
        {/* Secondary ripple */}
        <div className={cn(
          "absolute inset-0 w-32 h-32 rounded-full mystical-wave-ripple",
          isDarkMode 
            ? "bg-gradient-to-r from-cyan-500/20 to-purple-500/20" 
            : "bg-gradient-to-r from-cyan-400/20 to-purple-400/20"
        )} style={{ animationDelay: '0.2s' }} />
        
        {/* Tertiary ripple */}
        <div className={cn(
          "absolute inset-0 w-32 h-32 rounded-full mystical-wave-ripple",
          isDarkMode 
            ? "bg-gradient-to-r from-orange-500/15 to-pink-500/15" 
            : "bg-gradient-to-r from-orange-400/15 to-pink-400/15"
        )} style={{ animationDelay: '0.4s' }} />
        
        {/* Central sparkle effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center mystical-wave",
            isDarkMode
              ? "bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/50"
              : "bg-gradient-to-br from-purple-400 to-blue-400 shadow-lg shadow-purple-400/50"
          )}>
            <div className={cn(
              "w-4 h-4 rounded-full",
              isDarkMode ? "bg-white/90" : "bg-white/90"
            )} />
          </div>
        </div>
      </div>
    </div>
  );
}; 