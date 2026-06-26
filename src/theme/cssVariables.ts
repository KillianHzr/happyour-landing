// Turns the resolved theme into CSS custom properties so .module.css / globals
// can use var(--color-brand), var(--space-lg), var(--shadow-md), …
//
// Layout: mode-independent tokens + Light colors live on :root (Light is the
// site default). Dark colors override under [data-theme="dark"]. Toggling the
// data-theme attribute on <html> re-themes every var()-based style instantly.

import {
  palette,
  spacing,
  radii,
  depth,
  blur,
  stroke,
  iconSize,
  typography,
  fontFamily,
  textStyles,
  lightColors,
  darkColors,
  lightShadows,
  darkShadows,
  type ThemeColors,
  type ThemeShadows,
} from "./theme";

const kebab = (s: string) =>
  s.replace(/([a-z0-9])([A-Z])/g, "$1-$2").replace(/_/g, "-").toLowerCase();

const line = (name: string, value: unknown): string => {
  if (value === undefined || value === null || value === "") return "";
  return `  --${name}: ${value};\n`;
};

const colorVars = (colors: ThemeColors): string =>
  Object.entries(colors)
    .map(([k, v]) => line(`color-${kebab(k)}`, v))
    .join("");

const shadowVars = (shadows: ThemeShadows): string =>
  Object.entries(shadows)
    .map(([k, v]) => line(`shadow-${kebab(k)}`, v))
    .join("");

// Mode-independent primitives & scales (emitted once, on :root).
const staticVars = (): string => {
  let out = "";

  for (const [name, shades] of Object.entries(palette))
    for (const [n, v] of Object.entries(shades)) out += line(`palette-${name}-${n}`, v);

  for (const [k, v] of Object.entries(spacing)) out += line(`space-${kebab(k)}`, `${v}px`);
  for (const [k, v] of Object.entries(radii)) out += line(`radius-${kebab(k)}`, `${v}px`);
  for (const [k, v] of Object.entries(depth)) out += line(`depth-${kebab(k)}`, v);
  for (const [k, v] of Object.entries(blur)) out += line(`blur-${kebab(k)}`, `${v}px`);
  for (const [k, v] of Object.entries(stroke)) out += line(`stroke-${kebab(k)}`, `${v}px`);
  for (const [k, v] of Object.entries(iconSize)) out += line(`icon-${kebab(k)}`, `${v}px`);
  for (const [k, v] of Object.entries(typography.size)) out += line(`text-${kebab(k)}`, `${v}px`);
  for (const [k, v] of Object.entries(typography.weight)) out += line(`font-weight-${kebab(k)}`, v);

  // Font-family stacks (--font-sans comes from next/font in layout.tsx).
  out += line("font-display", fontFamily.display);
  out += line("font-mono", fontFamily.mono);
  // Per text-style font-family, e.g. --font-title-page -> the display (Parkinsans) stack.
  for (const [name, style] of Object.entries(textStyles))
    out += line(`font-${kebab(name)}`, style.fontFamily);

  return out;
};

/** CSS custom properties (Light on :root, Dark override). */
export const themeCss = (): string =>
  `:root {
${staticVars()}${colorVars(lightColors)}${shadowVars(lightShadows)}}

[data-theme="dark"] {
${colorVars(darkColors)}${shadowVars(darkShadows)}}
`;
