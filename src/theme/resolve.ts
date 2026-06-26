// Web-native port of the mobile design-system resolver.
//
// Same source of truth as the mobile app (design-tokens.json, exported from
// Figma), but the output is CSS instead of React Native styles:
//   - shadows  -> `box-shadow` strings (incl. spread, which RN dropped)
//   - text     -> CSSProperties (fontWeight number + px lineHeight, no named fonts)
//   - sizes    -> kept as numbers; the CSS-variable layer appends `px`.
//
// The token-walking logic mirrors mobile/theme.ts so values stay in lockstep.

import type { CSSProperties } from "react";
import tokens from "./design-tokens.json";

export type ThemeMode = "Light" | "Dark";

/**
 * Resolve a design token by path and mode.
 *
 * Special rule: the primitives color/white/N and color/black/N are interpreted
 * as rgba values with opacity N/1000 (e.g. white/500 -> rgba(255,255,255,0.5)),
 * matching the semantic intent of the design system.
 */
export const resolveToken = (
  path: string,
  mode: "Light" | "Dark" | "Value" = "Light"
): any => {
  if (!path) return undefined;

  const firstSlashIndex = path.indexOf("/");
  if (firstSlashIndex === -1) return undefined;

  const collection = path.substring(0, firstSlashIndex);
  const variableName = path.substring(firstSlashIndex + 1);

  if (collection === "Primitives") {
    const white = variableName.match(/^color\/white\/(\d+)$/);
    if (white) return `rgba(255, 255, 255, ${parseInt(white[1]) / 1000})`;
    const black = variableName.match(/^color\/black\/(\d+)$/);
    if (black) return `rgba(12, 12, 13, ${parseInt(black[1]) / 1000})`;
  }

  const variable = (tokens as any)[collection]?.[variableName];
  if (!variable) return undefined;

  let value = variable.values[mode];
  if (value === undefined) value = variable.values["Value"];
  if (value === undefined) value = variable.values["Mode 1"];
  if (value === undefined) value = variable.values["Light"];

  if (typeof value === "string" && value.startsWith("{") && value.endsWith("}")) {
    return resolveToken(value.slice(1, -1), mode);
  }

  if (variable.type === "FLOAT" && typeof value === "string" && value.endsWith("px")) {
    return parseFloat(value);
  }

  return value;
};

// ─── Color helpers ───────────────────────────────────────────────────────────

/** Trim Figma's float noise (e.g. 0.05000000074505806 -> 0.05). */
const round = (n: number, dp = 4): number => Number(n.toFixed(dp));

/** "#0C0C0D" -> [12, 12, 13] */
const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const int = parseInt(full, 16);
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255];
};

/**
 * Resolve a Figma "Effect Style" (drop-shadow / inner-shadow) into a CSS
 * `box-shadow` string. The shadow color uses the effect's own `opacity`
 * (the primitive's baked-in alpha is intentionally ignored, matching mobile).
 */
export const resolveShadowCss = (
  effectStyleName: string,
  mode: "Light" | "Dark" = "Light"
): string => {
  const effect = (tokens as any).Styles?.["Effect styles"]?.[effectStyleName];
  if (!effect) return "none";

  const field = (raw: any): any => {
    if (typeof raw === "string" && raw.startsWith("{") && raw.endsWith("}"))
      return resolveToken(raw.slice(1, -1), mode);
    return raw;
  };

  const rawColor = field(effect.color) || "#000000";
  let rgb: [number, number, number] = [0, 0, 0];
  if (typeof rawColor === "string") {
    if (rawColor.startsWith("rgba(12, 12, 13,")) rgb = [12, 12, 13];
    else if (rawColor.startsWith("rgba(255, 255, 255,")) rgb = [255, 255, 255];
    else if (rawColor.startsWith("#")) rgb = hexToRgb(rawColor);
  }

  const opacity = round(effect.opacity ?? 1);
  const x = field(effect.x) || 0;
  const y = field(effect.y) || 0;
  const blur = field(effect.blur) || 0;
  const spread = field(effect.spread) || 0;
  const color = `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${opacity})`;
  const inset = effect.type === "INNER_SHADOW" ? "inset " : "";

  return `${inset}${x}px ${y}px ${blur}px ${spread}px ${color}`;
};

/**
 * Resolve a Figma "Text Style" into web CSSProperties: numeric fontWeight, px
 * fontSize and lineHeight, letterSpacing, and the raw primitive `fontFamily`
 * name (e.g. "Neulis Sans" / "Neulis Cursive"). theme.ts maps that primitive
 * name to an actual loaded web font stack (see `fontFamily`). One token carries
 * everything — change the text style in Figma and family/size/leading follow.
 */
export const resolveTextStyle = (
  textStyleName: string,
  mode: "Light" | "Dark" = "Light"
): CSSProperties => {
  const style = (tokens as any).Styles?.["Text styles"]?.[textStyleName];
  if (!style) return {};

  const getVal = (raw: any) => {
    if (typeof raw === "string" && raw.startsWith("{")) return resolveToken(raw.slice(1, -1), mode);
    return raw;
  };

  const fontFamily = getVal(style.fontFamily); // primitive name, mapped in theme.ts
  const fontSize = getVal(style.fontSize);

  const lh = style.lineHeight;
  let lineHeight: number | undefined;
  if (lh?.unit === "PERCENT" && fontSize) lineHeight = round((lh.value / 100) * fontSize, 2);
  else if (lh?.unit === "PIXELS") lineHeight = lh.value;

  const ls = style.letterSpacing;
  let letterSpacing: string | undefined;
  if (ls?.unit === "PERCENT" && ls.value && fontSize) letterSpacing = `${round((ls.value / 100) * fontSize, 3)}px`;
  else if (ls?.unit === "PIXELS" && ls.value) letterSpacing = `${ls.value}px`;

  const weightRaw = getVal(style.fontWeight);
  const weight = typeof weightRaw === "number" ? weightRaw : Number(weightRaw);

  return {
    fontFamily: typeof fontFamily === "string" ? fontFamily : undefined,
    fontWeight: Number.isFinite(weight) ? weight : 400,
    fontSize: fontSize ? `${fontSize}px` : undefined,
    lineHeight: lineHeight ? `${lineHeight}px` : undefined,
    letterSpacing,
  };
};
