// Public entry point for the design system.
//
//   import { useTheme, palette, spacing, textStyles } from "@/theme";
//
// CSS-variable consumers don't import anything — they use var(--color-brand)
// etc., injected once by <ThemeStyleTag /> in the root layout.

export * from "./theme";
export { themeCss } from "./cssVariables";
export { ThemeProvider, useTheme, noFlashThemeScript } from "./ThemeProvider";
