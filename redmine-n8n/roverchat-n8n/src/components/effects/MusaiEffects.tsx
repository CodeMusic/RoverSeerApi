import React from 'react';
import { cn } from '@/lib/utils';
import musaiLogoImage from '@/assets/images/musai_logo.png';

interface MusaiLogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  isDarkMode?: boolean;
}

interface MusaiShimmerProps {
  children: React.ReactNode;
  className?: string;
  speed?: 'slow' | 'normal' | 'fast';
}

// Reusable Musai Life Effects
export const MusaiShimmer = ({ children, className, speed = 'normal' }: MusaiShimmerProps) => {
  return (
    <div className={cn(
      "relative overflow-hidden",
      className
    )}>
      {/* Enhanced mystical shimmer overlay */}
      <div className="absolute inset-0 mystical-shimmer rounded-full" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

// AI Face Logo Component
export const MusaiLogo = ({ size = 'md', className, isDarkMode = false }: MusaiLogoProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };

  return (
    <div className={cn(
      "relative flex items-center justify-center rounded-full",
      "bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500",
      "mystical-glow mystical-float",
      sizeClasses[size],
      className
    )}>
      {/* Background gradient with mystical effects */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600/80 via-blue-600/80 to-cyan-600/80 mystical-pulse" />
      
      {/* AI Face elements */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Eyes */}
        <div className="flex gap-1 mb-0.5">
          <div className={cn(
            "rounded-full mystical-sparkle",
            size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-1.5 h-1.5' : 'w-2 h-2',
            isDarkMode ? 'bg-white' : 'bg-white'
          )} />
          <div className={cn(
            "rounded-full mystical-sparkle",
            size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-1.5 h-1.5' : 'w-2 h-2',
            isDarkMode ? 'bg-white' : 'bg-white'
          )} style={{ animationDelay: '0.2s' }} />
        </div>
        
        {/* Neural network pattern / brain-like structure */}
        <div className={cn(
          "rounded mystical-pulse",
          size === 'sm' ? 'w-2 h-0.5' : size === 'md' ? 'w-3 h-0.5' : 'w-4 h-1',
          isDarkMode ? 'bg-white/80' : 'bg-white/90'
        )} />
      </div>
      
      {/* Floating particles */}
      <div className="absolute top-0 right-0">
        <div className={cn(
          "rounded-full mystical-pulse",
          size === 'sm' ? 'w-0.5 h-0.5' : 'w-1 h-1',
          isDarkMode ? 'bg-purple-300' : 'bg-purple-200'
        )} style={{ animationDelay: '0ms' }} />
      </div>
      <div className="absolute bottom-0 left-0">
        <div className={cn(
          "rounded-full mystical-pulse", 
          size === 'sm' ? 'w-0.5 h-0.5' : 'w-1 h-1',
          isDarkMode ? 'bg-cyan-300' : 'bg-cyan-200'
        )} style={{ animationDelay: '500ms' }} />
      </div>
    </div>
  );
};

// Custom Musai Logo Image with Effects
export const MusaiCustomLogo = ({ size = 'md', className, isDarkMode = false }: MusaiLogoProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16'
  };

  return (
    <div className={cn(
      "relative flex items-center justify-center rounded-full",
      "mystical-glow mystical-float",
      sizeClasses[size],
      className
    )}>
      {/* Background glow effect */}
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-600/30 via-blue-600/30 to-cyan-600/30 mystical-pulse blur-sm" />
      
      {/* Custom logo image */}
      <img 
        src={musaiLogoImage} 
        alt="Musai AI Logo"
        className={cn(
          "relative z-10 object-contain mystical-sparkle",
          sizeClasses[size]
        )}
        style={{ filter: 'drop-shadow(0 0 8px rgba(147, 51, 234, 0.5))' }}
      />
      
      {/* Floating particles around the logo */}
      <div className="absolute top-0 right-0">
        <div className={cn(
          "rounded-full mystical-pulse",
          size === 'sm' ? 'w-0.5 h-0.5' : 'w-1 h-1',
          isDarkMode ? 'bg-purple-300' : 'bg-purple-400'
        )} style={{ animationDelay: '0ms' }} />
      </div>
      <div className="absolute bottom-0 left-0">
        <div className={cn(
          "rounded-full mystical-pulse", 
          size === 'sm' ? 'w-0.5 h-0.5' : 'w-1 h-1',
          isDarkMode ? 'bg-cyan-300' : 'bg-cyan-400'
        )} style={{ animationDelay: '500ms' }} />
      </div>
      <div className="absolute top-1/4 left-0">
        <div className={cn(
          "rounded-full mystical-pulse", 
          size === 'sm' ? 'w-0.5 h-0.5' : 'w-0.5 h-0.5',
          isDarkMode ? 'bg-blue-300' : 'bg-blue-400'
        )} style={{ animationDelay: '1000ms' }} />
      </div>
    </div>
  );
};

// Combined Custom Musai Logo with Shimmer
export const MusaiLifeLogo = ({ size = 'md', className, isDarkMode = false }: MusaiLogoProps) => {
  return (
    <MusaiShimmer className={className} speed="normal">
      <MusaiCustomLogo size={size} isDarkMode={isDarkMode} />
    </MusaiShimmer>
  );
};

// Original AI Face Logo (keeping for backward compatibility)
export const MusaiGeneratedLogo = ({ size = 'md', className, isDarkMode = false }: MusaiLogoProps) => {
  return (
    <MusaiShimmer className={className} speed="normal">
      <MusaiLogo size={size} isDarkMode={isDarkMode} />
    </MusaiShimmer>
  );
};

// Mystical Text Effect
interface MusaiTextProps {
  children: React.ReactNode;
  className?: string;
  isDarkMode?: boolean;
}

export const MusaiText = ({ children, className, isDarkMode = false }: MusaiTextProps) => {
  return (
    <div className={cn(
      "relative mystical-float",
      className
    )}>
      {/* Glow effect behind text */}
      <div className="absolute inset-0 mystical-glow blur-sm opacity-50" />
      
      {/* Text content */}
      <div className={cn(
        "relative z-10 font-semibold bg-gradient-to-r from-purple-500 via-blue-500 to-cyan-500 bg-clip-text text-transparent",
        isDarkMode ? "text-white" : "text-gray-900"
      )}>
        {children}
      </div>
    </div>
  );
};