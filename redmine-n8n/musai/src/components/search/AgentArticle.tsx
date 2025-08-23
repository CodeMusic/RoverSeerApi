import React, { useMemo } from 'react';

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

// Renders trusted agent-supplied article HTML with labeled section cards
export const AgentArticle: React.FC<AgentArticleProps> = ({ html }) =>
{
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

	return (
		<article className="agent-article space-y-4">
			{SECTION_DEFINITIONS.map((def) => {
				const content = sections[def.id] || '<p>—</p>';
				const isHeadline = def.id === 'headline';
				const isSubhead = def.id === 'subhead';
				const isLede = def.id === 'lede';

				const bodyClass = isHeadline
					? 'text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight'
					: isSubhead
					? 'text-xl sm:text-2xl font-semibold text-muted-foreground'
					: isLede
					? 'prose prose-sm dark:prose-invert max-w-none text-base first-letter:float-left first-letter:text-5xl first-letter:font-bold first-letter:mr-2 first-letter:leading-[0.8] first-letter:tracking-tight'
					: 'prose prose-sm dark:prose-invert max-w-none text-sm';

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


