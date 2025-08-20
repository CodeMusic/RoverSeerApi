export function isLikelyMarkdown(text: string): boolean
{
  if (!text) return false;
  return (
    /(^|\n)```/.test(text) ||
    /`[^`]+`/.test(text) ||
    /\[[^\]]+\]\([^\)]+\)/.test(text) ||
    /(^|\n)#{1,6}\s+/.test(text) ||
    /(^|\n)(-|\*|\+)\s+/.test(text) ||
    /(^|\n)\d+\.\s+/.test(text) ||
    /!\[[^\]]*\]\([^\)]+\)/.test(text) ||
    /\|[^\n]*\|/.test(text)
  );
}


