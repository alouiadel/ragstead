/**
 * Ragstead design tokens.
 *
 * Palette inspired by the logo (assets/logo.svg): the warm black tile
 * (#121210), the paper-white doorway (#F3F0E7), and the ember retrieval
 * line (#FF5C35). Supporting tones are derived shades of those three.
 * Components should consume the semantic `color` tokens, not raw palette
 * values, so the theme can evolve without touching feature code.
 */

export const palette = {
  ink: '#121210',
  paper: '#F3F0E7',
  ember: '#FF5C35',
  emberSoft: '#FF7959',
  emberLine: '#70402F',
  emberWash: '#3B211A',
  emberWashHover: '#47251B',
  panel: '#191917',
  raised: '#201F1C',
  hover: '#292824',
  field: '#151513',
  fieldHover: '#1B1A17',
  active: '#2A2925',
  line: '#302F2A',
  lineSoft: '#252420',
  lineStrong: '#4C4940',
  textSoft: '#C3C0B7',
  muted: '#828078',
  green: '#A7CFB4',
  greenLine: '#324338',
  danger: '#FF8C7B',
  dangerSurface: '#7A3328',
  dangerSurfaceHover: '#944435',
  dangerWash: '#2B1E19',
  dangerLine: '#5A332C',
};

export const tokens = {
  color: {
    canvas: palette.ink,
    panel: palette.panel,
    panelRaised: palette.raised,
    panelHover: palette.hover,
    field: palette.field,
    fieldHover: palette.fieldHover,
    active: palette.active,
    line: palette.line,
    lineSoft: palette.lineSoft,
    lineStrong: palette.lineStrong,
    text: palette.paper,
    textSoft: palette.textSoft,
    muted: palette.muted,
    accent: palette.ember,
    accentSoft: palette.emberSoft,
    accentLine: palette.emberLine,
    accentWash: palette.emberWash,
    accentWashHover: palette.emberWashHover,
    onAccent: palette.ink,
    success: palette.green,
    successLine: palette.greenLine,
    danger: palette.danger,
    dangerSurface: palette.dangerSurface,
    dangerSurfaceHover: palette.dangerSurfaceHover,
    dangerWash: palette.dangerWash,
    dangerLine: palette.dangerLine,
    scrim: 'rgb(18 18 16 / 0.75)',
  },
  font: {
    sans: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  },
  space: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
  },
  radius: {
    sm: '2px',
    md: '4px',
    round: '999px',
  },
  shadow: {
    menu: '0 8px 24px rgb(0 0 0 / 0.5)',
    dialog: '0 16px 48px rgb(0 0 0 / 0.6)',
  },
  duration: {
    fast: '120ms',
    normal: '200ms',
  },
};
