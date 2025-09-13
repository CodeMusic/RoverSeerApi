import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Download } from 'lucide-react';
import { universityApi } from '@/lib/universityApi';
import { MarkdownRenderer } from '@/components/chat/MarkdownRenderer';
import { isLikelyMarkdown } from '@/utils/markdown';
import { eyeApi } from '@/lib/eyeApi';

interface LecturePreviewModalProps 
{
  open: boolean;
  onClose: () => void;
  title: string;
  summary?: string;
  courseTitle?: string;
  courseDescription?: string;
  instructor?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  tags?: string[];
  syllabus?: Array<{ title: string; summary?: string; duration?: string }>;
  currentIndex?: number;
  // Caching support
  cacheKey?: string;
  cachedContent?: string;
  cachedIsHtml?: boolean;
  cachedResolvedTitle?: string;
  onGenerated?: (key: string, payload: { content: string; isHtml: boolean; title: string }) => void;
}

export function LecturePreviewModal({ open, onClose, title, summary, courseTitle, courseDescription, instructor, difficulty, tags, syllabus, currentIndex, cacheKey, cachedContent, cachedIsHtml, cachedResolvedTitle, onGenerated }: LecturePreviewModalProps)
{
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [content, setContent] = useState<string>('');
  const [isHtml, setIsHtml] = useState<boolean>(false);
  const [resolvedTitle, setResolvedTitle] = useState<string>(title);
  const isFetchingRef = useRef<boolean>(false);
  const lastSignatureRef = useRef<string | null>(null);
  const isMountedRef = useRef<boolean>(false);
  const [featureImageUrl, setFeatureImageUrl] = useState<string | null>(null);

  useEffect(() => 
  {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => 
  {
    if (!open)
    {
      return;
    }

    const run = async () => 
    {
      try 
      {
        // Serve from cache only if meaningful; otherwise regenerate
        if (cachedContent)
        {
          const cachedLooksHtml = Boolean(cachedIsHtml);
          const textCandidate = cachedLooksHtml ? cachedContent.replace(/<[^>]*>/g, ' ') : cachedContent;
          const stripped = textCandidate
            .replace(/!\[[^\]]*\]\([^\)]+\)/g, ' ')
            .replace(/```[\s\S]*?```/g, ' ')
            .replace(/[#*>`*_>-]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          const meaningful = stripped.length >= 20;
          if (meaningful)
          {
            setIsLoading(false);
            setResolvedTitle(cachedResolvedTitle || title);
            setContent(cachedContent);
            setIsHtml(cachedLooksHtml);
            // Attempt to pull cached image if previously generated
            try
            {
              const imgKey = cacheKey ? `lecturePreviewImage::${cacheKey}` : (resolvedTitle ? `lecturePreviewImage::${resolvedTitle}` : '');
              if (imgKey)
              {
                const cachedImg = window.localStorage.getItem(imgKey);
                if (cachedImg)
                {
                  setFeatureImageUrl(cachedImg);
                }
              }
            }
            catch {}
            return;
          }
        }
        // Build stable signature to prevent duplicate runs from focus/re-render
        const syllabusSig = Array.isArray(syllabus) ? syllabus.map(s => `${s.title}::${s.summary ?? ''}::${s.duration ?? ''}`).join('|') : '';
        const tagsSig = Array.isArray(tags) ? tags.join(',') : '';
        const signature = JSON.stringify({ title, summary, courseTitle, courseDescription, instructor, difficulty, tagsSig, syllabusSig, currentIndex });
        if (lastSignatureRef.current === signature || isFetchingRef.current)
        {
          return;
        }
        lastSignatureRef.current = signature;
        isFetchingRef.current = true;
        setIsLoading(true);
        setContent('');
        setResolvedTitle(title);
        const contextLines: string[] = [];
        if (courseTitle) contextLines.push(`Course: ${courseTitle}`);
        if (courseDescription) contextLines.push(`Course description: ${courseDescription}`);
        if (Array.isArray(syllabus) && syllabus.length > 0)
        {
          const index = typeof currentIndex === 'number' ? currentIndex : Math.max(0, syllabus.findIndex(s => s.title === title));
          const neighbor = (i: number) => syllabus[i] ? `${i + 1}. ${syllabus[i].title}${syllabus[i].summary ? ` — ${syllabus[i].summary}` : ''}` : '';
          const prevLine = index - 1 >= 0 ? `Previous: ${neighbor(index - 1)}` : '';
          const nextLine = index + 1 < syllabus.length ? `Next: ${neighbor(index + 1)}` : '';
          if (prevLine) contextLines.push(prevLine);
          if (nextLine) contextLines.push(nextLine);
        }
        const descriptionWithContext = `${summary || 'Preview generation from syllabus item'}\n\nContext:\n${contextLines.join('\n')}`;
        const steps = [{ title, description: descriptionWithContext }];
        const generated = await universityApi.generateLectureContent(steps, { courseTitle, courseDescription, instructor, difficulty, tags, syllabus, currentIndex });
        if (!isMountedRef.current)
        {
          return;
        }
        setResolvedTitle(generated.title || title);
        // generated may be an object with content or a raw HTML string; support both
        const raw = (generated && typeof generated === 'object') ? (generated as any).content : generated;
        const asString = typeof raw === 'string' ? raw : JSON.stringify(raw ?? {}, null, 2);
        const looksHtml = typeof asString === 'string' && /<([a-z][\w-]*)(\s|>)/i.test(asString.trim());
        const computedIsHtml = (looksHtml && !isLikelyMarkdown(asString));
        setIsHtml(computedIsHtml);

        // Generate feature image from summary or derived text
        let generatedImageDataUrl: string | null = null;
        try
        {
          const imgKey = cacheKey ? `lecturePreviewImage::${cacheKey}` : (generated.title ? `lecturePreviewImage::${generated.title}` : '');
          const existing = imgKey ? window.localStorage.getItem(imgKey) : null;
          const promptSource = (summary && summary.trim().length > 0) ? summary : htmlToPlainTextSafe(asString).slice(0, 800);
          if (!existing && promptSource && promptSource.trim().length > 0)
          {
            const blob = await eyeApi.generateImage(promptSource);
            generatedImageDataUrl = await blobToDataUrl(blob);
            if (imgKey)
            {
              try { window.localStorage.setItem(imgKey, generatedImageDataUrl); } catch {}
            }
          }
          else if (existing)
          {
            generatedImageDataUrl = existing;
          }
        }
        catch {}

        setFeatureImageUrl(generatedImageDataUrl);

        // Inject image into content for HTML or prepend markdown image for MD
        const contentWithImage = (() =>
        {
          if (!generatedImageDataUrl)
          {
            return asString || '';
          }
          if (computedIsHtml)
          {
            // Avoid double-inserting if an <img> already exists at the top
            const hasImg = /<img\b/i.test(asString);
            if (hasImg)
            {
              return asString || '';
            }
            const imgBlock = `<div class="rounded border bg-card overflow-hidden mb-4"><img src="${generatedImageDataUrl}" alt="Illustration" style="width:100%;height:auto;object-fit:cover;" /></div>`;
            return `${imgBlock}${asString || ''}`;
          }
          // Markdown: prepend image syntax so viewers render it
          return `![](${generatedImageDataUrl})\n\n${asString || ''}`;
        })();

        setContent(contentWithImage);
        // Emit to cache owner
        if (cacheKey && onGenerated)
        {
          onGenerated(cacheKey, { content: contentWithImage || '', isHtml: computedIsHtml, title: generated.title || title });
        }
      }
      catch 
      {
        if (isMountedRef.current)
        {
          setIsHtml(true);
          setContent('<p class="text-red-600">Failed to generate preview.</p>');
        }
      }
      finally 
      {
        isFetchingRef.current = false;
        if (isMountedRef.current)
        {
          setIsLoading(false);
        }
      }
    };

    run();
  // Include context props in signature; effect will guard duplicates using lastSignatureRef
  }, [open, title, summary, courseTitle, courseDescription, instructor, difficulty, tags, syllabus, currentIndex]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            {resolvedTitle || 'Lecture Preview'}
          </DialogTitle>
        </DialogHeader>
        <div className="min-h-[200px] max-h-[60vh] overflow-y-auto pr-2">
          {isLoading ? (
            <div className="py-10 text-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3"></div>
              <p className="text-gray-600 dark:text-gray-300">Generating lecture from syllabus item...</p>
            </div>
          ) : (
            <>
              {featureImageUrl && !isHtml && (
                <div className="rounded border bg-card overflow-hidden mb-4">
                  <img src={featureImageUrl} alt="Illustration" style={{ width: '100%', height: 'auto', objectFit: 'cover' }} />
                </div>
              )}
              {isHtml ? (
                <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: content }} />
              ) : (
                <MarkdownRenderer content={content} />
              )}
            </>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => {
              try {
                const blob = new Blob([content], { type: isHtml ? 'text/html' : 'text/markdown' });
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                const ext = isHtml ? 'html' : 'md';
                link.download = `${(resolvedTitle || 'lecture').replace(/\s+/g, '-').toLowerCase()}.${ext}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
              } catch {}
            }}
          >
            <Download className="mr-2 h-4 w-4" /> Export {isHtml ? 'HTML' : 'Markdown'}
          </Button>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default LecturePreviewModal;

// Helpers — localized to this module to avoid broader dependencies
function htmlToPlainTextSafe(input: string): string
{
  try
  {
    if (typeof window === 'undefined' || typeof DOMParser === 'undefined')
    {
      return input;
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString(input, 'text/html');
    const text = doc.body?.textContent || '';
    return text.replace(/\s+/g, ' ').trim();
  }
  catch
  {
    return input;
  }
}

async function blobToDataUrl(blob: Blob): Promise<string>
{
  return new Promise((resolve, reject) =>
  {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}


