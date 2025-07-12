import MarkdownIt from 'markdown-it';
import markdownItKatex from 'markdown-it-katex';
import markdownItHighlight from 'markdown-it-highlightjs';
import hljs from 'highlight.js';
import xml from 'highlight.js/lib/languages/xml';

// Register languages
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('hcl', xml);
hljs.registerLanguage('terraform', xml);

export const createMarkdownRenderer = () => {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
    highlight: function(str, lang) {
      const mappedLang = lang.toLowerCase() === 'terraform' ? 'hcl' : lang;
      if (mappedLang && str) {
        return `<pre class="code-block-placeholder" data-language="${mappedLang}" data-code="${encodeURIComponent(str)}"></pre>`;
      }
      return '';
    }
  });

  // Configure plugins
  md.use(markdownItKatex)
    .use(markdownItHighlight);

  return md;
};