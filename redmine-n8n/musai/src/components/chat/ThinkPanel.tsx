import { useState } from "react";
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface ThinkPanelProps {
  thoughts: string;
  isDarkMode?: boolean;
}

export const ThinkPanel = ({ thoughts, isDarkMode = false }: ThinkPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="mt-3">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "flex items-center gap-2 p-2 h-auto text-xs",
              isDarkMode 
                ? "text-gray-400 hover:text-gray-200 hover:bg-gray-700" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
            )}
          >
            <MessageCircle className="w-4 h-4" />
            <span>Show thoughts</span>
            {isOpen ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="mt-2">
          <div className={cn(
            "p-4 rounded-lg border",
            isDarkMode 
              ? "bg-gray-800/50 border-gray-600 text-gray-300" 
              : "bg-gray-50 border-gray-200 text-gray-700"
          )}>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isDarkMode ? "bg-purple-400" : "bg-purple-500"
                )} />
              </div>
              <div className="flex-1">
                <h4 className={cn(
                  "text-sm font-medium mb-2",
                  isDarkMode ? "text-purple-300" : "text-purple-700"
                )}>
                  Internal Thoughts
                </h4>
                <div className={cn(
                  "text-sm leading-relaxed whitespace-pre-wrap",
                  isDarkMode ? "text-gray-300" : "text-gray-600"
                )}>
                  {thoughts}
                </div>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}; 