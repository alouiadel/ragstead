const COPY_ICON = `
  <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
    <rect x="5.5" y="5.5" width="7" height="8" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4" />
    <path d="M10.5 5V3.5A1.5 1.5 0 0 0 9 2H4.5A1.5 1.5 0 0 0 3 3.5V9a1.5 1.5 0 0 0 1.5 1.5H5" fill="none" stroke="currentColor" stroke-width="1.4" />
  </svg>
`;

const CHECK_ICON = `
  <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true">
    <path d="m3 8.5 3 3 7-7" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
`;

async function writeClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall through to the selection-based copy path.
    }
  }

  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.append(area);
  area.select();
  const copied = document.execCommand('copy');
  area.remove();
  if (!copied) throw new Error('Copy failed');
}

/**
 * Build a copy button with transient "Copied" feedback. `getText` is called
 * when clicked so callers can copy the original message or code source.
 */
export function createCopyButton({
  getText,
  label = 'Copy',
  className = '',
} = {}) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = `copy-button${className ? ` ${className}` : ''}`;
  button.title = label;
  button.setAttribute('aria-label', label);

  const icon = document.createElement('span');
  icon.className = 'copy-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.innerHTML = COPY_ICON;

  const text = document.createElement('span');
  text.className = 'copy-label';
  text.textContent = label;

  button.append(icon, text);
  let resetTimer;

  function reset() {
    button.classList.remove('copied', 'copy-failed');
    button.title = label;
    button.setAttribute('aria-label', label);
    text.textContent = label;
    icon.innerHTML = COPY_ICON;
  }

  function feedback(state) {
    clearTimeout(resetTimer);
    button.classList.toggle('copied', state === 'copied');
    button.classList.toggle('copy-failed', state === 'failed');
    const message =
      state === 'copied'
        ? 'Copied'
        : state === 'failed'
          ? 'Copy failed'
          : label;
    button.title = message;
    button.setAttribute('aria-label', message);
    text.textContent = message;
    icon.innerHTML = state === 'copied' ? CHECK_ICON : COPY_ICON;
    resetTimer = setTimeout(reset, 1600);
  }

  button.addEventListener('click', async () => {
    try {
      await writeClipboard(getText());
      feedback('copied');
    } catch {
      feedback('failed');
    }
  });

  return button;
}
