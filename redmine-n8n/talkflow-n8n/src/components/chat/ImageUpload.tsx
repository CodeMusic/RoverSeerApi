
import { Button } from "@/components/ui/button";
import { ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRef } from "react";

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  disabled?: boolean;
}

export const ImageUpload = ({ onImageSelect, disabled }: ImageUploadProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast({
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Check file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        description: "Image must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    onImageSelect(file);
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        className="hidden"
        disabled={disabled}
      />
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50"
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
      >
        <ImageIcon className="h-4 w-4" />
      </Button>
    </>
  );
};
