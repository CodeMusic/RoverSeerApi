import MarkdownIt from 'markdown-it';
import mk from 'markdown-it-katex';

export const createMarkdownRenderer = () => {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true
  });

  // Configure KaTeX
  md.use(mk, {
    throwOnError: false,
    errorColor: '#cc0000',
    displayMode: true,
    strict: false
  });

  return md;
};