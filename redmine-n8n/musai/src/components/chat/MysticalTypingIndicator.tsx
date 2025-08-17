import { Brain, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MysticalTypingIndicatorProps {
  isDarkMode?: boolean;
  label?: string;
  size?: "default" | "compact";
  align?: "start" | "center";
}

export const MysticalTypingIndicator = ({ isDarkMode = false, label = "Musai is thinking", size = "default", align = "start" }: MysticalTypingIndicatorProps) => {
  return (
    <div className={cn("flex w-full animate-fade-in", align === "center" ? "justify-center" : "justify-start") }>
      <div className={cn(
        size === "compact" ? "max-w-[260px] rounded-xl px-3 py-2" : "max-w-[85%] rounded-2xl px-4 py-3",
        "backdrop-blur-sm relative overflow-hidden mystical-glow",
        isDarkMode
          ? "bg-gradient-to-br from-slate-900/80 to-blue-900/80 border border-blue-800/30"
          : "bg-gradient-to-br from-slate-50/80 to-blue-50/80 border border-blue-200/50"
      )}>
        {/* Mystical background effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10 mystical-pulse" />
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/5 via-transparent to-orange-600/5" />
        
        {/* Content */}
        <div className={cn("relative flex items-center", size === "compact" ? "gap-2" : "gap-3") }>
          {/* AI Icon with mystical glow */}
          <div className="relative mystical-float">
            <div className={cn(
              size === "compact" ? "w-6 h-6" : "w-8 h-8",
              "rounded-full flex items-center justify-center mystical-glow",
              isDarkMode
                ? "bg-gradient-to-br from-purple-500 to-blue-500 shadow-lg shadow-purple-500/25"
                : "bg-gradient-to-br from-purple-400 to-blue-400 shadow-lg shadow-purple-400/25"
            )}>
              <Brain className={cn("text-white", size === "compact" ? "w-3.5 h-3.5" : "w-4 h-4")} />
            </div>
            {/* Animated sparkles */}
            <div className="absolute -top-1 -right-1">
              <Sparkles className={cn(
                size === "compact" ? "w-2.5 h-2.5" : "w-3 h-3",
                "mystical-sparkle",
                isDarkMode ? "text-yellow-400" : "text-yellow-500"
              )} />
            </div>
            <div className="absolute -bottom-1 -left-1">
              <Sparkles className={cn(
                size === "compact" ? "w-1.5 h-1.5" : "w-2 h-2",
                "mystical-sparkle",
                isDarkMode ? "text-cyan-400" : "text-cyan-500"
              )} style={{ animationDelay: '1s' }} />
            </div>
          </div>
          
          {/* Typing text and dots */}
          <div className="flex items-center gap-2">
            <span className={cn(
              size === "compact" ? "text-xs font-medium" : "text-sm font-medium",
              isDarkMode ? "text-gray-200" : "text-gray-700"
            )}>
              {label}
            </span>
            
            {/* Animated dots */}
            <div className="flex items-center gap-1">
              <div className={cn(
                size === "compact" ? "w-1.5 h-1.5" : "w-1.5 h-1.5",
                "rounded-full mystical-dots",
                isDarkMode ? "bg-purple-400" : "bg-purple-500"
              )} style={{ animationDelay: '0ms' }} />
              <div className={cn(
                size === "compact" ? "w-1.5 h-1.5" : "w-1.5 h-1.5",
                "rounded-full mystical-dots",
                isDarkMode ? "bg-blue-400" : "bg-blue-500"
              )} style={{ animationDelay: '200ms' }} />
              <div className={cn(
                size === "compact" ? "w-1.5 h-1.5" : "w-1.5 h-1.5",
                "rounded-full mystical-dots",
                isDarkMode ? "bg-cyan-400" : "bg-cyan-500"
              )} style={{ animationDelay: '400ms' }} />
            </div>
          </div>
        </div>
        
        {/* Floating particles effect */}
        <div className="absolute top-2 right-4">
          <div className={cn(
            "w-1 h-1 rounded-full mystical-pulse",
            isDarkMode ? "bg-purple-400" : "bg-purple-500"
          )} style={{ animationDelay: '0ms' }} />
        </div>
        <div className="absolute bottom-2 right-6">
          <div className={cn(
            "w-0.5 h-0.5 rounded-full mystical-pulse",
            isDarkMode ? "bg-blue-400" : "bg-blue-500"
          )} style={{ animationDelay: '500ms' }} />
        </div>
        <div className="absolute top-4 right-2">
          <div className={cn(
            "w-0.5 h-0.5 rounded-full mystical-pulse",
            isDarkMode ? "bg-cyan-400" : "bg-cyan-500"
          )} style={{ animationDelay: '1000ms' }} />
        </div>
        
        {/* Additional mystical elements */}
        <div className="absolute top-1 left-1/2 transform -translate-x-1/2">
          <div className={cn(
            "w-0.5 h-0.5 rounded-full mystical-sparkle",
            isDarkMode ? "bg-orange-400" : "bg-orange-500"
          )} style={{ animationDelay: '300ms' }} />
        </div>
        <div className="absolute bottom-1 left-1/3">
          <div className={cn(
            "w-0.5 h-0.5 rounded-full mystical-sparkle",
            isDarkMode ? "bg-pink-400" : "bg-pink-500"
          )} style={{ animationDelay: '700ms' }} />
        </div>
      </div>
    </div>
  );
}; 