import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Download, Play, Maximize2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CardTitle } from '@/components/ui/card';
import { SUPPORTED_LANGUAGES } from './constants';
import { useToast } from '@/hooks/use-toast';

interface EditorHeaderProps {
  language: string;
  setLanguage: (value: string) => void;
  code: string;
  onRun: () => void;
  onPopOutput: () => void;
  isOutputPopped: boolean;
}

export const EditorHeader: React.FC<EditorHeaderProps> = ({
  language,
  setLanguage,
  code,
  onRun,
  onPopOutput,
  isOutputPopped
}) => {
  const { toast } = useToast();
  const currentLanguage = SUPPORTED_LANGUAGES.find(lang => lang.value === language);
  const canRunInBrowser = currentLanguage?.canRunInBrowser ?? false;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Copied!",
        description: "Code copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy code",
        variant: "destructive",
      });
    }
  };

  const handleSaveToFile = () => {
    try {
      const currentLang = SUPPORTED_LANGUAGES.find(lang => lang.value === language);
      const extension = currentLang?.extension || '.txt';
      const filename = `code${extension}`;
      
      const blob = new Blob([code], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        description: `File saved as ${filename}`,
      });
    } catch (err) {
      toast({
        description: "Failed to save file",
        variant: "destructive",
      });
    }
  };

  return (
    <CardTitle className="flex justify-between items-center">
      <div className="flex items-center gap-4">
        <span className="text-xl font-semibold text-card-foreground">Code Playground</span>
        <Select value={language} onValueChange={setLanguage}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-2">
        {canRunInBrowser && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRun}
            className="hover:bg-accent"
          >
            <Play className="w-4 h-4 mr-2" />
            Run
          </Button>
        )}
        {canRunInBrowser && (
          <Button
            variant="outline"
            size="sm"
            onClick={onPopOutput}
            className="hover:bg-accent"
          >
            <Maximize2 className="w-4 h-4 mr-2" />
            {isOutputPopped ? 'Close Output' : 'Pop Output'}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSaveToFile}
          className="hover:bg-accent"
        >
          <Download className="w-4 h-4 mr-2" />
          Save
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="hover:bg-accent"
        >
          <Copy className="w-4 h-4 mr-2" />
          Copy
        </Button>
      </div>
    </CardTitle>
  );
};