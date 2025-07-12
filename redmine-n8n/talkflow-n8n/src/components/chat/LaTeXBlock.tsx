import { cn } from '@/lib/utils';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface LaTeXBlockProps {
  content: string;
  inline?: boolean;
}

export const LaTeXBlock = ({ content, inline = false }: LaTeXBlockProps) => {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        description: "LaTeX copied to clipboard",
        duration: 2000,
      });
    } catch (err) {
      toast({
        description: "Failed to copy LaTeX",
        variant: "destructive",
        duration: 2000,
      });
    }
  };

  if (inline) {
    return (
      <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-mono text-sm">
        {content}
      </code>
    );
  }

  return (
    <div className="relative group my-4">
      <div className="rounded-lg border bg-slate-950 dark:bg-slate-900">
        <div className="flex items-center justify-between px-4 py-2 border-b bg-slate-900 dark:bg-slate-800">
          <div className="text-xs text-slate-400">LaTeX</div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-slate-400 hover:text-slate-100"
            onClick={handleCopy}
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
        <div className="p-4 overflow-auto font-mono text-sm text-slate-50">
          {content}
        </div>
      </div>
    </div>
  );
};