import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { MUSAI_CHROMATIC_12 } from "@/config/constants";

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
  const monthIndex = new Date().getMonth();
  const primary = MUSAI_CHROMATIC_12[monthIndex];
  // Optional adjacent tone for subtle dual-color months (e.g., September Blue→Indigo)
  const secondary = monthIndex === 8 ? MUSAI_CHROMATIC_12[9] : undefined;

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
        <div
          className={cn("absolute inset-0 w-32 h-32 rounded-full mystical-wave")}
          style={{
            background: `linear-gradient(135deg, ${primary.hex}40 0%, ${(secondary?.hex || primary.hex)}40 100%)`
          }}
        />
        
        {/* Secondary ripple */}
        <div
          className={cn("absolute inset-0 w-32 h-32 rounded-full mystical-wave-ripple")}
          style={{
            animationDelay: '0.2s',
            background: `linear-gradient(135deg, ${primary.hex}2e 0%, ${(secondary?.hex || primary.hex)}2e 100%)`
          }}
        />
        
        {/* Tertiary ripple */}
        <div
          className={cn("absolute inset-0 w-32 h-32 rounded-full mystical-wave-ripple")}
          style={{
            animationDelay: '0.4s',
            background: `linear-gradient(135deg, ${primary.hex}1f 0%, ${(secondary?.hex || primary.hex)}1f 100%)`
          }}
        />
        
        {/* Central sparkle effect */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={cn("w-8 h-8 rounded-full flex items-center justify-center mystical-wave", isDarkMode ? "shadow-lg" : "shadow-lg")}
            style={{
              background: `linear-gradient(135deg, ${primary.hex}59 0%, ${(secondary?.hex || primary.hex)}59 100%)`,
              boxShadow: `0 8px 24px ${primary.hex}59`
            }}
          >
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