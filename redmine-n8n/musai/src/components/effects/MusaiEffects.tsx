import React, { useMemo } from 'react';
import { cn } from '@/lib/utils';
import musaiLogoImage from '@/assets/images/musai_logo.png';
import musaiCoreImage from '@/assets/images/musai_core.png';
import musaiWaveLogo from '@/assets/images/logo_musai_wave.png';
import musaiCurationsImage from '@/assets/images/musai_curations.png';
import { useCurationsAvailability } from '@/hooks/useCurationsAvailability';
import { MUSAI_CHROMATIC_12, MUSAI_CHROMATIC_7 } from '@/config/constants';

// Map months (0-11) to MUSAI_CHROMATIC_12 indices
const monthToChromaticIndex = (month: number) => month % 12;
// Map days (0-6, Sunday=0) to MUSAI_CHROMATIC_7 indices
const dayToChromaticIndex = (day: number) => day % 7;

export function getTemporalChromaticColors(date = new Date()) {
  const monthIndex = monthToChromaticIndex(date.getMonth());
  const dayIndex = dayToChromaticIndex(date.getDay());
  const yearTone = MUSAI_CHROMATIC_12[monthIndex];
  const weekTone = MUSAI_CHROMATIC_7[dayIndex];
  return { yearTone, weekTone };
}

// Chakra mapping (root->violet) aligned to 7-tone
export const CHAKRA_TONES = [
  MUSAI_CHROMATIC_7[0], // Root - Red
  MUSAI_CHROMATIC_7[1], // Sacral - Orange
  MUSAI_CHROMATIC_7[2], // Solar Plexus - Yellow
  MUSAI_CHROMATIC_7[3], // Heart - Yellow-Green
  MUSAI_CHROMATIC_7[5], // Throat - Indigo (stylized)
  MUSAI_CHROMATIC_7[4], // Third Eye - Teal/Cyan
  MUSAI_CHROMATIC_7[6], // Crown - Violet
];

interface MusaiLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  isDarkMode?: boolean;
  noShimmer?: boolean;
  useCurationsLogo?: boolean; // Override to manually set curations logo
  logoWithText?: boolean; // For backwards compatibility
  onClick?: () => void; // Click handler for curations navigation
}

interface MusaiShimmerProps {
  children: React.ReactNode;
  className?: string;
  speed?: 'slow' | 'normal' | 'fast';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

// Reusable Musai Life Effects
export const MusaiShimmer = ({ children, className, speed = 'normal', rounded = 'lg' }: MusaiShimmerProps) => {
  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md', 
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    full: 'rounded-full'
  };

  return (
    <div className={cn(
      "relative overflow-hidden",
      className
    )}>
      {/* Enhanced mystical shimmer overlay */}
      <div className={cn("absolute inset-0 mystical-shimmer", roundedClasses[rounded])} />
      
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
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32',
    '3xl': 'w-48 h-48',
    '4xl': 'w-64 h-64'
  };

  return (
    <div className={cn(
      "relative flex items-center justify-center rounded-full overflow-hidden",
      "bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500",
      "mystical-glow logo-gentle-pulse border border-gray-300/30",
      sizeClasses[size],
      className
    )}>
      {/* Background gradient with mystical effects - contained within border */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-600/80 via-blue-600/80 to-cyan-600/80 mystical-pulse" />
      
      {/* AI Face elements */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        {/* Eyes */}
        <div className={cn(
          "flex mb-0.5",
          size === 'sm' ? 'gap-1' : size === 'md' ? 'gap-1' : size === 'lg' ? 'gap-1' : size === 'xl' ? 'gap-1.5' : size === '2xl' ? 'gap-2' : size === '3xl' ? 'gap-3' : 'gap-4'
        )}>
          <div className={cn(
            "rounded-full mystical-pulse",
            size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-2 h-2' : size === 'xl' ? 'w-3 h-3' : size === '2xl' ? 'w-4 h-4' : size === '3xl' ? 'w-6 h-6' : 'w-8 h-8',
            isDarkMode ? 'bg-white' : 'bg-white'
          )} />
          <div className={cn(
            "rounded-full mystical-pulse",
            size === 'sm' ? 'w-1 h-1' : size === 'md' ? 'w-1.5 h-1.5' : size === 'lg' ? 'w-2 h-2' : size === 'xl' ? 'w-3 h-3' : size === '2xl' ? 'w-4 h-4' : size === '3xl' ? 'w-6 h-6' : 'w-8 h-8',
            isDarkMode ? 'bg-white' : 'bg-white'
          )} style={{ animationDelay: '0.2s' }} />
        </div>
        
        {/* Neural network pattern / brain-like structure */}
        <div className={cn(
          "rounded mystical-pulse",
          size === 'sm' ? 'w-2 h-0.5' : size === 'md' ? 'w-3 h-0.5' : size === 'lg' ? 'w-4 h-1' : size === 'xl' ? 'w-6 h-1' : size === '2xl' ? 'w-8 h-1.5' : size === '3xl' ? 'w-12 h-2' : 'w-16 h-2.5',
          isDarkMode ? 'bg-white/80' : 'bg-white/90'
        )} />
      </div>
      
      {/* Floating particles */}
      <div className="absolute top-0 right-0">
        <div className={cn(
          "rounded-full mystical-pulse",
          size === 'sm' ? 'w-0.5 h-0.5' : size === 'md' ? 'w-1 h-1' : size === 'lg' ? 'w-1 h-1' : size === 'xl' ? 'w-1.5 h-1.5' : size === '2xl' ? 'w-2 h-2' : size === '3xl' ? 'w-3 h-3' : 'w-4 h-4',
          isDarkMode ? 'bg-purple-300' : 'bg-purple-200'
        )} style={{ animationDelay: '0ms' }} />
      </div>
      <div className="absolute bottom-0 left-0">
        <div className={cn(
          "rounded-full mystical-pulse", 
          size === 'sm' ? 'w-0.5 h-0.5' : size === 'md' ? 'w-1 h-1' : size === 'lg' ? 'w-1 h-1' : size === 'xl' ? 'w-1.5 h-1.5' : size === '2xl' ? 'w-2 h-2' : size === '3xl' ? 'w-3 h-3' : 'w-4 h-4',
          isDarkMode ? 'bg-cyan-300' : 'bg-cyan-200'
        )} style={{ animationDelay: '500ms' }} />
      </div>
    </div>
  );
};

// Custom Musai Logo Image with Effects
export const MusaiCustomLogo = ({ size = 'md', className, isDarkMode = false, logoWithText = false, useCurationsLogo = false }: MusaiLogoProps) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32',
    '3xl': 'w-48 h-48',
    '4xl': 'w-64 h-64'
  };

  // Choose logo image based on curations availability
  // Use new wave/prayer logo as the primary brand mark
  const logoImage = useCurationsLogo 
    ? musaiCurationsImage 
    : musaiWaveLogo;

  return (
    <div className={cn(
      "relative flex items-center justify-center rounded-full overflow-hidden",
      "mystical-glow logo-gentle-pulse border border-gray-300/30",
      sizeClasses[size],
      className
    )}>
      {/* Background glow effect - contained within border */}
      <div className={cn(
        "absolute inset-0 mystical-pulse blur-sm",
        useCurationsLogo 
          ? "bg-gradient-to-br from-emerald-600/30 via-teal-600/30 to-cyan-600/30"
          : "bg-gradient-to-br from-purple-600/30 via-blue-600/30 to-cyan-600/30"
      )} />
      
      {/* Custom logo image */}
      <img 
        src={logoImage} 
        alt={useCurationsLogo ? "Musai AI Curations" : "Musai AI Logo"}
        className={cn(
          "relative z-10 object-contain logo-color-pulse",
          sizeClasses[size]
        )}
        style={{ 
          filter: useCurationsLogo 
            ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))' 
            : 'drop-shadow(0 0 8px rgba(147, 51, 234, 0.5))' 
        }}
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
export const MusaiLifeLogo = ({ size = 'md', className, isDarkMode = false, noShimmer = false, useCurationsLogo, onClick }: MusaiLogoProps) => {
  const { isAvailable: curationsAvailable } = useCurationsAvailability();
  
  // Determine if we should show curations logo
  const shouldUseCurationsLogo = useCurationsLogo !== undefined ? useCurationsLogo : curationsAvailable;
  
  const logoContent = noShimmer ? (
    <MusaiCustomLogo 
      size={size} 
      isDarkMode={isDarkMode} 
      className={className} 
      logoWithText={false} 
      useCurationsLogo={shouldUseCurationsLogo}
    />
  ) : (
    <MusaiShimmer className={className} speed="normal" rounded="none">
      <MusaiCustomLogo 
        size={size} 
        isDarkMode={isDarkMode} 
        logoWithText={true} 
        useCurationsLogo={shouldUseCurationsLogo}
      />
    </MusaiShimmer>
  );

  // If curations logo and clickable, wrap in button
  if (shouldUseCurationsLogo && onClick) {
    return (
      <button 
        onClick={onClick}
        className="transition-transform hover:scale-105 cursor-pointer"
        title="View AI Curations"
      >
        {logoContent}
      </button>
    );
  }

  return logoContent;
};

// Original AI Face Logo (keeping for backward compatibility)
export const MusaiGeneratedLogo = ({ size = 'md', className, isDarkMode = false }: MusaiLogoProps) => {
  return (
    <MusaiShimmer className={className} speed="normal" rounded="none">
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
      "relative mystical-float px-2 py-1",
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

// Dynamic Profile Logo Component
interface DynamicProfileLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  className?: string;
  isDarkMode?: boolean;
  noShimmer?: boolean;
  useCurationsLogo?: boolean;
  onClick?: () => void;
  userPhotoUrl?: string;
  showUserPhoto?: boolean;
}

export const DynamicProfileLogo = ({ 
  size = 'md', 
  className, 
  isDarkMode = false, 
  noShimmer = false, 
  useCurationsLogo, 
  onClick,
  userPhotoUrl,
  showUserPhoto = false
}: DynamicProfileLogoProps) => {
  const { isAvailable: curationsAvailable } = useCurationsAvailability();
  
  // Determine if we should show curations logo
  const shouldUseCurationsLogo = useCurationsLogo !== undefined ? useCurationsLogo : curationsAvailable;
  
  // Choose logo image based on curations availability
  const logoImage = shouldUseCurationsLogo 
    ? musaiCurationsImage 
    : musaiWaveLogo;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12', 
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
    '2xl': 'w-32 h-32',
    '3xl': 'w-48 h-48',
    '4xl': 'w-64 h-64'
  };

  const logoContent = (
    <div className={cn(
      "relative flex items-center justify-center rounded-full overflow-hidden",
      "mystical-glow logo-gentle-pulse border border-gray-300/30",
      sizeClasses[size],
      className
    )}>
      {/* Background glow effect */}
      <div className={cn(
        "absolute inset-0 mystical-pulse blur-sm",
        shouldUseCurationsLogo 
          ? "bg-gradient-to-br from-emerald-600/30 via-teal-600/30 to-cyan-600/30"
          : "bg-gradient-to-br from-purple-600/30 via-blue-600/30 to-cyan-600/30"
      )} />
      
      {/* Musai Logo - always present but can be faded */}
      <img 
        src={logoImage} 
        alt={shouldUseCurationsLogo ? "Musai AI Curations" : "Musai AI Logo"}
        className={cn(
          "absolute inset-0 object-contain logo-color-pulse transition-opacity duration-500",
          sizeClasses[size],
          showUserPhoto && userPhotoUrl ? "opacity-0" : "opacity-100"
        )}
        style={{ 
          filter: shouldUseCurationsLogo 
            ? 'drop-shadow(0 0 8px rgba(16, 185, 129, 0.5))' 
            : 'drop-shadow(0 0 8px rgba(147, 51, 234, 0.5))' 
        }}
      />
      
      {/* User Photo - overlays when available and enabled */}
      {userPhotoUrl && (
        <img 
          src={userPhotoUrl} 
          alt="User Profile"
          className={cn(
            "absolute inset-0 object-cover transition-opacity duration-500",
            sizeClasses[size],
            showUserPhoto ? "opacity-100" : "opacity-0"
          )}
        />
      )}
      
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

  const finalContent = noShimmer ? logoContent : (
    <MusaiShimmer className={className} speed="normal" rounded="none">
      {logoContent}
    </MusaiShimmer>
  );

  // If curations logo and clickable, wrap in button
  if (shouldUseCurationsLogo && onClick) {
    return (
      <button 
        onClick={onClick}
        className="transition-transform hover:scale-105 cursor-pointer"
        title="View AI Curations"
      >
        {finalContent}
      </button>
    );
  }

  return finalContent;
};