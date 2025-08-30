import React, { useEffect, useMemo, useRef, useState } from 'react';
import { eyeApi } from '@/lib/eyeApi';

interface AgentArticleProps {
	html: string;
}

type SectionDefinition = {
	id: string;
	label: string;
};

const SECTION_DEFINITIONS: SectionDefinition[] = [
	{ id: 'headline', label: 'Headline' },
	{ id: 'subhead', label: 'Subhead' },
	{ id: 'lede', label: 'Lede' },
	{ id: 'background', label: 'Background' },
	{ id: 'agreement', label: 'Agreement' },
	{ id: 'points-of-conflict', label: 'Points of Conflict' },
	{ id: 'bias-check', label: 'Bias Check' },
	{ id: 'analysis', label: 'Analysis' },
	{ id: 'commentary', label: 'Commentary' },
	{ id: 'next-steps', label: 'Next Steps' },
];

function sanitizeSectionElement(sectionEl: Element): string
{
	// Remove trailing placeholder paragraph (—) when there is other content
	try {
		const paragraphNodes = Array.from(sectionEl.querySelectorAll('p'));
		if (paragraphNodes.length > 1)
		{
			const lastParagraph = paragraphNodes[paragraphNodes.length - 1];
			const lastText = (lastParagraph.textContent || '').trim();
			const totalText = (sectionEl.textContent || '').trim();
			if ((lastText === '—' || lastText === '-') && totalText.replace(/[—-]/g, '').trim().length > 0)
			{
				lastParagraph.remove();
			}
		}
	} catch {}
	return sectionEl.innerHTML || '';
}

function htmlToPlainText(html: string): string
{
	try
	{
    // Use DOM to extract text for better fidelity than regex
    const container = document.createElement('div');
    container.innerHTML = html;
    const text = container.textContent || container.innerText || '';
    return text.replace(/\s+/g, ' ').trim();
  }
  catch
  {
    // Fallback: rough strip of tags
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }
}

function isMeaningfulPrompt(text: string): boolean
{
  if (!text) return false;
  const normalized = text.replace(/[—-]/g, '').trim();
  return normalized.length >= 8; // avoid triggering on placeholders
}

async function blobToDataUrl(blob: Blob): Promise<string>
{
  return new Promise((resolve, reject) =>
  {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function hashStringStable(input: string): string
{
  // Simple deterministic 53-bit hash (FNV-1a like), adequate for cache keys
  let hash = 0xcbf29ce484222325n; // FNV offset basis (64-bit)
  const prime = 0x100000001b3n;   // FNV prime (64-bit)
  for (let i = 0; i < input.length; i++)
  {
    hash ^= BigInt(input.charCodeAt(i));
    hash = (hash * prime) & 0xffffffffffffffffn;
  }
  return 'h' + hash.toString(16);
}

// Renders trusted agent-supplied article HTML with labeled section cards
export const AgentArticle: React.FC<AgentArticleProps> = ({ html }) =>
{
	const [featureImageUrl, setFeatureImageUrl] = useState<string | null>(null);
	const [isGenerating, setIsGenerating] = useState<boolean>(false);
	const lastPromptRef = useRef<string | null>(null);

	const sections = useMemo(() =>
	{
		// Gracefully fall back to raw HTML if DOMParser is unavailable
		if (typeof window === 'undefined' || typeof DOMParser === 'undefined')
		{
			return null;
		}

		const parser = new DOMParser();
		const doc = parser.parseFromString(html, 'text/html');
		const articleEl = doc.querySelector('article');

		const contentById: Record<string, string> = {};
		for (const def of SECTION_DEFINITIONS)
		{
			const el = (articleEl || doc).querySelector(`section#${def.id}`);
			if (el)
			{
				contentById[def.id] = sanitizeSectionElement(el);
			}
			else
			{
				contentById[def.id] = '<p>—</p>';
			}
		}
		return contentById;
	}, [html]);

	useEffect(() =>
	{
		if (!sections)
		{
			return;
		}

		const commentaryHtml = sections['commentary'] || '';
		const commentaryText = htmlToPlainText(commentaryHtml);
		const prompt = commentaryText;

		if (!isMeaningfulPrompt(prompt))
		{
			return;
		}

		if (lastPromptRef.current === prompt)
		{
			return;
		}

		let isCancelled = false;
		setIsGenerating(true);
		lastPromptRef.current = prompt;

		(async () =>
		{
			try
			{
				const cacheKey = `agentArticle:featureImage:${hashStringStable(prompt)}`;
				const cached = typeof window !== 'undefined' ? window.localStorage.getItem(cacheKey) : null;
				if (cached)
				{
					if (!isCancelled)
					{
						setFeatureImageUrl(cached);
						setIsGenerating(false);
					}
					return;
				}

				const blob = await eyeApi.generateImage(prompt);
				if (isCancelled)
				{
					return;
				}
				const dataUrl = await blobToDataUrl(blob);
				try
				{
					if (typeof window !== 'undefined')
					{
						window.localStorage.setItem(cacheKey, dataUrl);
					}
				}
				catch {}
				setFeatureImageUrl(dataUrl);
			}
			catch
			{
				// Swallow errors to avoid disrupting article rendering
			}
			finally
			{
				if (!isCancelled)
				{
					setIsGenerating(false);
				}
			}
		})();

		return () =>
		{
			isCancelled = true;
		};
	}, [sections]);

	if (!sections)
	{
		// Fallback to raw when parsing is not possible (e.g., SSR)
		return (
			<div className="agent-article">
				<div dangerouslySetInnerHTML={{ __html: html }} />
			</div>
		);
	}

	// Show labels selectively for a more newspaper-like feel
	const showLabelForIds = new Set<string>([
		'analysis',
		'points-of-conflict',
		'bias-check',
		'commentary',
		'next-steps',
	]);

	const headlineText = useMemo(() =>
	{
		if (!sections)
		{
			return '';
		}
		return htmlToPlainText(sections['headline'] || '');
	}, [sections]);

	return (
		<article className="agent-article space-y-4 w-full max-w-4xl xl:max-w-5xl mx-auto">
			{/* Feature image generated from Commentary */}
			{(isGenerating || featureImageUrl) && (
				<div className="rounded border bg-card overflow-hidden">
					<div className="w-full h-40 sm:h-52 md:h-64 lg:h-80 xl:h-96">
						{featureImageUrl ? (
							<img
								src={featureImageUrl}
								alt={headlineText ? `Illustration for: ${headlineText}` : 'Illustration generated by Eye of Musai from Commentary'}
								className="w-full h-full object-cover object-center"
							/>
						) : (
							<div className="w-full h-full bg-muted animate-pulse" />
						)}
					</div>
				</div>
			)}
			{SECTION_DEFINITIONS.map((def) => {
				const content = sections[def.id] || '<p>—</p>';
				const isHeadline = def.id === 'headline';
				const isSubhead = def.id === 'subhead';
				const isLede = def.id === 'lede';

				const bodyClass = isHeadline
					? 'text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-left'
					: isSubhead
					? 'text-xl sm:text-2xl font-semibold text-muted-foreground text-left'
					: isLede
					? 'prose prose-sm dark:prose-invert max-w-none text-left text-base first-letter:float-left first-letter:text-5xl first-letter:font-bold first-letter:mr-2 first-letter:leading-[0.8] first-letter:tracking-tight'
					: 'prose prose-sm dark:prose-invert max-w-none text-left text-sm';

				const sectionClass = isHeadline || isSubhead
					? 'p-0 border-0 bg-transparent'
					: 'rounded border bg-card p-3';

				const shouldShowLabel = showLabelForIds.has(def.id);

				return (
					<section key={def.id} id={def.id} className={sectionClass}>
						{shouldShowLabel && (
							<div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">
								{def.label}
							</div>
						)}
						<div className={bodyClass} dangerouslySetInnerHTML={{ __html: content }} />
					</section>
				);
			})}
		</article>
	);
};

export default AgentArticle;



// Side effect: generate a feature image from the Commentary when available
// Placed after export to keep render body focused; hook relies on component scope
// Note: Hooks must run inside component; thus augment component above
