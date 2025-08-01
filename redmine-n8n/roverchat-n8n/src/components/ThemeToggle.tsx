import { Moon, Sun } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/contexts/ThemeContext";

interface ThemeToggleProps {
  isExpanded?: boolean;
}

export function ThemeToggle({ isExpanded = true }: ThemeToggleProps) {
  const { isDark, toggleTheme } = useTheme();

  if (!isExpanded) {
    // Collapsed view - just the switch
    return (
      <div className="flex justify-center">
        <Switch
          checked={isDark}
          onCheckedChange={toggleTheme}
          aria-label="Toggle dark mode"
          className="scale-90"
        />
      </div>
    );
  }

  // Expanded view - icons + switch, centered
  return (
    <div className="flex items-center justify-center gap-2">
      <Sun className="h-4 w-4 text-muted-foreground" />
      <Switch
        checked={isDark}
        onCheckedChange={toggleTheme}
        aria-label="Toggle dark mode"
      />
      <Moon className="h-4 w-4 text-muted-foreground" />
    </div>
  );
}