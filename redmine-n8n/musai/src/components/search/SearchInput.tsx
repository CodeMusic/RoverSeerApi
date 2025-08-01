import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  isLoading?: boolean;
  autoFocus?: boolean;
}

export const SearchInput = ({
  onSearch,
  placeholder = "Search...",
  className,
  isLoading = false,
  autoFocus = false,
}: SearchInputProps) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setQuery("");
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-20"
          disabled={isLoading}
          autoFocus={autoFocus}
        />
        {query && (
          <Button
            type="submit"
            disabled={isLoading}
            size="sm"
            className="absolute right-1 top-1/2 -translate-y-1/2"
          >
            {isLoading ? (
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Search"
            )}
          </Button>
        )}
      </div>
    </form>
  );
};