import { marked } from '../vendor/marked/18.2.1/marked.esm.js';
import DOMPurify from '../vendor/dompurify/3.4.18/purify.es.mjs';
import { createCopyButton } from './clipboard.js';

const CHEVRON_ICON = `
  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
    <path d="m5 6 3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
`;

/**
 * Wrap each fenced code block with a header that shows its language, a
 * collapse toggle, and a copy action. The pre stays scrollable when oversized.
 */
function enhanceCodeBlocks(root) {
  for (const pre of root.querySelectorAll('pre')) {
    const code = pre.querySelector('code');
    if (!code) continue;

    const languageClass = [...code.classList].find((name) =>
      name.startsWith('language-'),
    );
    const language = languageClass
      ? languageClass.slice('language-'.length)
      : 'Code';

    const figure = document.createElement('figure');
    figure.className = 'code-block';

    const header = document.createElement('div');
    header.className = 'code-block-header';

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'code-toggle';
    toggle.setAttribute('aria-expanded', 'true');
    toggle.title = 'Collapse code block';

    const chevron = document.createElement('span');
    chevron.className = 'code-chevron';
    chevron.setAttribute('aria-hidden', 'true');
    chevron.innerHTML = CHEVRON_ICON;

    const label = document.createElement('span');
    label.className = 'code-language';
    label.textContent = language;

    toggle.append(chevron, label);
    toggle.addEventListener('click', () => {
      const collapsed = figure.classList.toggle('collapsed');
      toggle.setAttribute('aria-expanded', String(!collapsed));
      toggle.title = collapsed ? 'Expand code block' : 'Collapse code block';
    });

    header.append(
      toggle,
      createCopyButton({
        getText: () => code.textContent,
        label: 'Copy code',
        className: 'code-copy',
      }),
    );

    pre.replaceWith(figure);
    figure.append(header, pre);
  }
}

/**
 * Render model output as sanitized HTML. Raw HTML in the model reply is
 * stripped by DOMPurify, so only safe markdown formatting survives.
 */
export function renderMarkdown(text) {
  const html = marked.parse(text, { gfm: true, breaks: true });
  const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  const template = document.createElement('template');
  template.innerHTML = clean;
  enhanceCodeBlocks(template.content);
  return template.content;
}
