import { tokens } from './tokens.js';

export { palette, tokens } from './tokens.js';

const PREFIX = '--ds-';

const toKebab = (key) =>
  key.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/**
 * Flatten the token tree into CSS custom properties.
 * `tokens.color.accentWash` becomes `--ds-color-accent-wash`.
 */
export function cssVariables(source = tokens) {
  const variables = {};

  const walk = (node, path) => {
    for (const [key, value] of Object.entries(node)) {
      const next = [...path, toKebab(key)];
      if (typeof value === 'string') {
        variables[PREFIX + next.join('-')] = value;
      } else {
        walk(value, next);
      }
    }
  };

  walk(source, []);
  return variables;
}

/**
 * Expose every token as a CSS variable on `root` (the document element by
 * default) and flag the app as dark-only. Call once from the frontend entry
 * point before feature modules render.
 */
export function applyDesignSystem(root = document.documentElement) {
  const variables = cssVariables();
  for (const [name, value] of Object.entries(variables)) {
    root.style.setProperty(name, value);
  }
  root.style.setProperty('color-scheme', 'dark');
  return variables;
}
