# Design system

Small dependency-free token library for the frontend. Plain ES modules, no
build step.

## Usage

Call `applyDesignSystem()` once from the frontend entry point. It writes every
token as a CSS custom property on `:root` and sets `color-scheme: dark`.

```js
import { applyDesignSystem, tokens } from './design/index.js';

applyDesignSystem();
```

Then consume tokens in CSS or JS:

```css
.chat-message {
  background: var(--ds-color-panel);
  color: var(--ds-color-text);
  border: 1px solid var(--ds-color-line);
  padding: var(--ds-space-lg);
  border-radius: var(--ds-radius-sm);
}
```

```js
chart.fillStyle = tokens.color.teal;
```

## Conventions

- Variable names are `--ds-` plus the token path in kebab-case:
  `tokens.color.accentWashHover` becomes `--ds-color-accent-wash-hover`.
- The palette comes from the logo: warm black surfaces, paper-white text,
  ember-orange accents.
- Use semantic tokens (`color.accent`, `color.muted`) rather than raw palette
  values (`palette.gold2`) in feature code.
- Fonts are system stacks. If an open-licensed font or third-party library is
  ever added, vendor it under `frontend/vendor/` instead of loading a CDN.
