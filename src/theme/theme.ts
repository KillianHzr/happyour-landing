// Web design theme, built from design-tokens.json.
//
// Mirrors mobile/theme.ts but emits web-friendly values. Consume it two ways:
//   1. CSS variables  — generated in cssVariables.ts, injected at :root, used by
//      .module.css files via var(--color-brand), var(--space-lg), …
//   2. Typed TS object — import { lightTheme, darkTheme } or use useTheme() for
//      inline styles / JS access (e.g. recharts colors).

import type { CSSProperties } from "react";
import { resolveToken, resolveShadowCss, resolveTextStyle, type ThemeMode } from "./resolve";

export type { ThemeMode };

// ─── Primitive palettes (mode-independent) ───────────────────────────────────
const shade = (name: string) =>
  Object.fromEntries(
    [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000].map((n) => [
      n,
      resolveToken(`Primitives/color/${name}/${n}`, "Value") as string,
    ])
  ) as Record<100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 | 1000, string>;

export const palette = {
  slate: shade("slate"),
  brand: shade("brand"),
  red: shade("red"),
  yellow: shade("yellow"),
  green: shade("green"),
  pink: shade("pink"),
  gray: shade("gray"),
  blue: shade("blue"),
  white: shade("white"), // rgba(255,255,255, N/1000)
  black: shade("black"), // rgba(12,12,13, N/1000)
} as const;

// ─── Semantic colors (factory per mode) ──────────────────────────────────────
export const buildColors = (mode: ThemeMode) => ({
  // Background / default
  bg:               resolveToken("-> Color/background/default/default", mode),
  bgHover:          resolveToken("-> Color/background/default/default-hover", mode),
  card:             resolveToken("-> Color/background/default/secondary", mode),
  cardHover:        resolveToken("-> Color/background/default/secondary-hover", mode),
  accentMuted:      resolveToken("-> Color/background/default/tertiary", mode),
  bgTertiaryHover:  resolveToken("-> Color/background/default/tertiary-hover", mode),
  opacityLight:     resolveToken("-> Color/background/default/default-opacity", mode),
  opacityDark:      resolveToken("-> Color/background/default/secondary-opacity", mode),
  bgInverse:        resolveToken("-> Color/background/default/default-inverse", mode),

  // Background / neutral
  bgNeutral:               resolveToken("-> Color/background/neutral/default", mode),
  bgNeutralHover:          resolveToken("-> Color/background/neutral/default-hover", mode),
  bgNeutralSecondary:      resolveToken("-> Color/background/neutral/secondary", mode),
  bgNeutralSecondaryHover: resolveToken("-> Color/background/neutral/secondary-hover", mode),
  bgNeutralTertiary:       resolveToken("-> Color/background/neutral/tertiary", mode),
  bgNeutralTertiaryHover:  resolveToken("-> Color/background/neutral/tertiary-hover", mode),

  // Background / brand
  brand:               resolveToken("-> Color/background/brand/default", mode),
  brandHover:          resolveToken("-> Color/background/brand/default-hover", mode),
  brandSecondary:      resolveToken("-> Color/background/brand/secondary", mode),
  brandSecondaryHover: resolveToken("-> Color/background/brand/secondary-hover", mode),
  brandTertiary:       resolveToken("-> Color/background/brand/tertiary", mode),
  brandTertiaryHover:  resolveToken("-> Color/background/brand/tertiary-hover", mode),

  // Background / positive
  bgPositive:              resolveToken("-> Color/background/positive/default", mode),
  bgPositiveHover:         resolveToken("-> Color/background/positive/default-hover", mode),
  bgPositiveSecondary:     resolveToken("-> Color/background/positive/secondary", mode),
  bgPositiveTertiary:      resolveToken("-> Color/background/positive/tertiary", mode),

  // Background / warning
  bgWarning:               resolveToken("-> Color/background/warning/default", mode),
  bgWarningHover:          resolveToken("-> Color/background/warning/default-hover", mode),
  bgWarningSecondary:      resolveToken("-> Color/background/warning/secondary", mode),
  bgWarningTertiary:       resolveToken("-> Color/background/warning/tertiary", mode),

  // Background / danger
  bgDanger:                resolveToken("-> Color/background/danger/default", mode),
  bgDangerHover:           resolveToken("-> Color/background/danger/default-hover", mode),
  bgDangerSecondary:       resolveToken("-> Color/background/danger/secondary", mode),
  bgDangerTertiary:        resolveToken("-> Color/background/danger/tertiary", mode),

  // Background / disabled & utilities
  bgDisabled:    resolveToken("-> Color/background/disabled/default", mode),
  scrim:         resolveToken("-> Color/background/utilities/scrim", mode),
  blanket:       resolveToken("-> Color/background/utilities/blanket", mode),
  bgOverlay:     resolveToken("-> Color/background/utilities/overlay", mode),

  // Text / default
  text:          resolveToken("-> Color/text/default/default", mode),
  textInverse:   resolveToken("-> Color/text/default/default-inverse", mode),
  textSecondary: resolveToken("-> Color/text/default/secondary", mode),
  textTertiary:  resolveToken("-> Color/text/default/tertiary", mode),

  // Text / neutral
  textNeutral:          resolveToken("-> Color/text/neutral/default", mode),
  secondary:            resolveToken("-> Color/text/neutral/secondary", mode),
  muted:                resolveToken("-> Color/text/neutral/tertiary", mode),
  textNeutralOnBrand:   resolveToken("-> Color/text/neutral/on-neutral-brand", mode),

  // Text / brand
  brandText:          resolveToken("-> Color/text/brand/default", mode),
  textBrandSecondary: resolveToken("-> Color/text/brand/secondary", mode),
  textBrandOnBrand:   resolveToken("-> Color/text/brand/on-brand-default", mode),

  // Text / status
  textPositive: resolveToken("-> Color/text/positive/default", mode),
  textWarning:  resolveToken("-> Color/text/warning/default", mode),
  textDanger:   resolveToken("-> Color/text/danger/default", mode),
  danger:       resolveToken("-> Color/text/danger/secondary", mode),

  // Text / disabled & utilities
  textDisabled:  resolveToken("-> Color/text/disabled/default", mode),
  textOnOverlay: resolveToken("-> Color/text/utilities/text-on-overlay", mode),

  // Accent (compatibility)
  accent: resolveToken("-> Color/text/default/default", mode),

  // Borders
  cardBorder:      resolveToken("-> Color/border/default/default", mode),
  borderSecondary: resolveToken("-> Color/border/default/secondary", mode),
  borderTertiary:  resolveToken("-> Color/border/default/tertiary", mode),
  borderBrand:     resolveToken("-> Color/border/brand/default", mode),
  borderPositive:  resolveToken("-> Color/border/positive/default", mode),
  borderWarning:   resolveToken("-> Color/border/warning/default", mode),
  borderDanger:    resolveToken("-> Color/border/danger/default", mode),

  // Icons
  icon:          resolveToken("-> Color/icon/default/default", mode),
  iconSecondary: resolveToken("-> Color/icon/default/secondary", mode),
  iconTertiary:  resolveToken("-> Color/icon/default/tertiary", mode),
  iconBrand:     resolveToken("-> Color/icon/brand/default", mode),

  // Status aliases (mode-independent primitives)
  gold:     resolveToken("Primitives/color/yellow/400", "Value"),
  goldDark: resolveToken("Primitives/color/yellow/600", "Value"),

  // Fixed utilities
  white:       "#FFFFFF",
  black:       "#0C0C0D",
  glass:       "rgba(0, 0, 0, 0.5)",
  glassMuted:  "rgba(255, 255, 255, 0.07)",
  glassBorder: "rgba(255, 255, 255, 0.12)",
});

export type ThemeColors = ReturnType<typeof buildColors>;

// ─── Spacing (mode-independent) ──────────────────────────────────────────────
export const spacing = {
  xxs:  resolveToken("-> Size/space/050", "Value") as number,   // 2
  xs:   resolveToken("-> Size/space/100", "Value") as number,   // 4
  xs2:  resolveToken("-> Size/space/150", "Value") as number,   // 6
  sm:   resolveToken("-> Size/space/200", "Value") as number,   // 8
  md:   resolveToken("-> Size/space/300", "Value") as number,   // 12
  lg:   resolveToken("-> Size/space/400", "Value") as number,   // 16
  xl:   resolveToken("-> Size/space/600", "Value") as number,   // 24
  xxl:  resolveToken("-> Size/space/800", "Value") as number,   // 32
  xl3:  resolveToken("-> Size/space/1200", "Value") as number,  // 48
  xl4:  resolveToken("-> Size/space/1600", "Value") as number,  // 64
  xl6:  resolveToken("-> Size/space/2400", "Value") as number,  // 96
  xl10: resolveToken("-> Size/space/4000", "Value") as number,  // 160
} as const;

// ─── Border radii (mode-independent) ─────────────────────────────────────────
export const radii = {
  none:   resolveToken("-> Size/radius/empty", "Value") as number, // 0
  xs:     resolveToken("-> Size/radius/100", "Value") as number,   // 4
  sm:     resolveToken("-> Size/radius/200", "Value") as number,   // 8
  md:     resolveToken("-> Size/radius/300", "Value") as number,   // 12
  lg:     resolveToken("-> Size/radius/400", "Value") as number,   // 16
  xl:     resolveToken("-> Size/radius/600", "Value") as number,   // 24
  xxl:    resolveToken("-> Size/radius/800", "Value") as number,   // 32
  xl3:    resolveToken("-> Size/radius/1000", "Value") as number,  // 40
  full:   resolveToken("-> Size/radius/full", "Value") as number,  // 999
  card:   resolveToken("-> Size/radius/400", "Value") as number,   // 16 (alias)
  button: resolveToken("-> Size/radius/200", "Value") as number,   // 8  (alias)
} as const;

// ─── Z-index / depth, blur, stroke, icon sizes (mode-independent) ────────────
export const depth = {
  none: resolveToken("-> Size/depth/empty", "Value") as number,
  xxs:  resolveToken("-> Size/depth/025", "Value") as number,
  xs:   resolveToken("-> Size/depth/100", "Value") as number,
  sm:   resolveToken("-> Size/depth/200", "Value") as number,
  md:   resolveToken("-> Size/depth/400", "Value") as number,
  lg:   resolveToken("-> Size/depth/800", "Value") as number,
  xl:   resolveToken("-> Size/depth/1200", "Value") as number,
} as const;

export const blur = {
  sm: resolveToken("-> Size/blur/100", "Value") as number,
  md: resolveToken("-> Size/blur/400", "Value") as number,
  lg: resolveToken("-> Size/blur/1200", "Value") as number,
  xl: resolveToken("-> Size/blur/2400", "Value") as number,
} as const;

export const stroke = {
  sm: resolveToken("-> Size/stroke/025", "Value") as number, // 1
  md: resolveToken("-> Size/stroke/050", "Value") as number, // 2
} as const;

export const iconSize = {
  sm: resolveToken("-> Size/icon/small", "Value") as number,  // 24
  md: resolveToken("-> Size/icon/medium", "Value") as number, // 32
  lg: resolveToken("-> Size/icon/large", "Value") as number,  // 40
} as const;

// ─── Font families ───────────────────────────────────────────────────────────
// The design system has three primitive families (sans / cursive / mono). We map
// each to a real, loaded web font stack. The "cursive" family is the display face
// used by title-hero / title-page / subtitle — on web we render it with Parkinsans
// (loaded via next/font as --font-parkinsans in layout.tsx).
export const fontFamily = {
  sans:    "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  display: "var(--font-parkinsans), var(--font-sans), sans-serif",
  mono:    "ui-monospace, SFMono-Regular, Menlo, 'Roboto Mono', monospace",
} as const;

// Primitive family name (from the tokens) → web stack above.
const PRIMITIVE_FAMILY: Record<string, keyof typeof fontFamily> = {
  "Neulis Sans": "sans",
  "Neulis Cursive": "display",
  "Roboto Mono": "mono",
};

/** Resolve a primitive family name (e.g. "Neulis Cursive") to its web stack. */
export const webFontFamily = (primitive: string | undefined): string =>
  fontFamily[PRIMITIVE_FAMILY[primitive ?? ""] ?? "sans"];

// ─── Typography (mode-independent) ───────────────────────────────────────────
export const typography = {
  size: {
    xxs:          resolveToken("-> Typography/body/size-extra-small", "Value") as number,
    xs:           resolveToken("Primitives/typography/scale-01", "Value") as number,
    sm:           resolveToken("-> Typography/body/size-small", "Value") as number,
    md:           resolveToken("-> Typography/body/size-medium", "Value") as number,
    lg:           17,
    xl:           resolveToken("-> Typography/body/size-large", "Value") as number,
    xxl:          resolveToken("-> Typography/heading/size-base", "Value") as number,
    headingSm:    resolveToken("-> Typography/heading/size-small", "Value") as number,
    headingLg:    resolveToken("-> Typography/heading/size-large", "Value") as number,
    subheadingSm: resolveToken("-> Typography/subheading/size-small", "Value") as number,
    subheadingMd: resolveToken("-> Typography/subheading/size-medium", "Value") as number,
    subtitleSm:   resolveToken("-> Typography/subtitle/size-small", "Value") as number,
    subtitle:     resolveToken("-> Typography/subtitle/size-base", "Value") as number,
    subtitleLg:   resolveToken("-> Typography/subtitle/size-large", "Value") as number,
    titleSm:      resolveToken("-> Typography/title-page/size-small", "Value") as number,
    title:        resolveToken("-> Typography/title-page/size-base", "Value") as number,
    titleLg:      resolveToken("-> Typography/title-page/size-large", "Value") as number,
    hero:         resolveToken("-> Typography/title-hero/size", "Value") as number,
  },
  weight: {
    thin:       resolveToken("Primitives/typography/weight-thin", "Value") as number,
    extraLight: resolveToken("Primitives/typography/weight-extra-light", "Value") as number,
    light:      resolveToken("Primitives/typography/weight-light", "Value") as number,
    regular:    resolveToken("Primitives/typography/weight-regular", "Value") as number,
    medium:     resolveToken("Primitives/typography/weight-medium", "Value") as number,
    semibold:   resolveToken("Primitives/typography/weight-semibold", "Value") as number,
    bold:       resolveToken("Primitives/typography/weight-bold", "Value") as number,
    extraBold:  resolveToken("Primitives/typography/weight-extra-bold", "Value") as number,
    black:      resolveToken("Primitives/typography/weight-black", "Value") as number,
  },
} as const;

// ─── Shadows (factory per mode) → CSS box-shadow strings ─────────────────────
export const buildShadows = (mode: ThemeMode) => ({
  sm:        resolveShadowCss("drop-shadow/100", mode), // alias
  md:        resolveShadowCss("drop-shadow/300", mode), // alias
  lg:        resolveShadowCss("drop-shadow/600", mode), // alias
  shadow100: resolveShadowCss("drop-shadow/100", mode),
  shadow200: resolveShadowCss("drop-shadow/200", mode),
  shadow300: resolveShadowCss("drop-shadow/300", mode),
  shadow400: resolveShadowCss("drop-shadow/400", mode),
  shadow500: resolveShadowCss("drop-shadow/500", mode),
  shadow600: resolveShadowCss("drop-shadow/600", mode),
});

export type ThemeShadows = ReturnType<typeof buildShadows>;

// ─── Text styles (Figma Text Styles → CSSProperties, mode-independent) ───────
// Translate each style's primitive fontFamily name to its loaded web stack.
const textStyle = (name: string): CSSProperties => {
  const s = resolveTextStyle(name);
  return { ...s, fontFamily: webFontFamily(s.fontFamily as string | undefined) };
};

export const textStyles = {
  bodyBase:        textStyle("body-base"),
  bodyStrong:      textStyle("body-strong"),
  bodyEmphasis:    textStyle("body-emphasis"),
  bodySmall:       textStyle("body-small"),
  bodySmallStrong: textStyle("body-small-strong"),
  bodyExtraSmall:       textStyle("body-extra-small"),
  bodyExtraSmallStrong: textStyle("body-extra-small-strong"),
  bodyCode:        textStyle("body-code"),
  subheading:      textStyle("subheading"),
  heading:         textStyle("heading"),
  subtitle:        textStyle("subtitle"),
  subtitleStrong:  textStyle("subtitle-strong"),
  titlePage:       textStyle("title-page"),
  titleHero:       textStyle("title-hero"),
} as const satisfies Record<string, CSSProperties>;

// ─── Precomputed per-mode bundles ────────────────────────────────────────────
export const lightColors = buildColors("Light");
export const darkColors = buildColors("Dark");
export const lightShadows = buildShadows("Light");
export const darkShadows = buildShadows("Dark");

export interface Theme {
  mode: ThemeMode;
  colors: ThemeColors;
  shadows: ThemeShadows;
  spacing: typeof spacing;
  radii: typeof radii;
  typography: typeof typography;
  textStyles: typeof textStyles;
}

export const lightTheme: Theme = {
  mode: "Light",
  colors: lightColors,
  shadows: lightShadows,
  spacing,
  radii,
  typography,
  textStyles,
};

export const darkTheme: Theme = {
  mode: "Dark",
  colors: darkColors,
  shadows: darkShadows,
  spacing,
  radii,
  typography,
  textStyles,
};
