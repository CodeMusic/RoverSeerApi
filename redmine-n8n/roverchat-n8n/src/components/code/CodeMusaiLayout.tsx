import { Button } from "@/components/ui/button";
import { ArrowLeft, Code, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import CodePlayground from "@/components/CodePlayground";

interface CodeMusaiLayoutProps {
  onClose: () => void;
}

export const CodeMusaiLayout = ({ onClose }: CodeMusaiLayoutProps) => {
  return (
    <div className="flex-1 flex flex-col bg-background h-[100dvh] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-sidebar/30">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Code className="w-5 h-5 text-primary flex-shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-semibold">CodeMusai</h1>
              <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                <Sparkles className="w-3 h-3" />
                Interactive Playground
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Write, run, and experiment with code in multiple programming languages
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={onClose} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        </div>
      </div>

      {/* Code Playground Content */}
      <div className="flex-1 overflow-hidden">
        <CodePlayground />
      </div>
    </div>
  );
};