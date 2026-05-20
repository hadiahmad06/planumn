import { createTheme, MantineColorsTuple } from "@mantine/core";

/**
 * Mantine theme — consumes CSS variables defined in `frontend/src/app/globals.css`.
 *
 * Source of truth for design tokens is `:root` in globals.css. This file is the
 * Mantine-side bridge: every Mantine primitive should be able to pick up the
 * canvas/surface/text/accent tokens without ever redeclaring a literal value.
 */

const cssVar = (name: string): string => `var(--${name})`;

const tupleFromVar = (name: string): MantineColorsTuple =>
  Array(10).fill(cssVar(name)) as unknown as MantineColorsTuple;

export const theme = createTheme({
  fontFamily: cssVar("font-sans"),
  fontFamilyMonospace: cssVar("font-mono"),

  white: cssVar("bg-surface"),

  primaryColor: "accent",
  primaryShade: 6,

  colors: {
    accent: tupleFromVar("accent-primary"),
    "accent-hover": tupleFromVar("accent-primary-hover"),
    success: tupleFromVar("success"),
    canvas: tupleFromVar("bg-canvas"),
    surface: tupleFromVar("bg-surface"),
    "text-primary": tupleFromVar("text-primary"),
    "text-secondary": tupleFromVar("text-secondary"),
    "text-tertiary": tupleFromVar("text-tertiary"),
    "border-subtle": tupleFromVar("border-subtle"),
    "stripe-cs-math": tupleFromVar("stripe-cs-math"),
    "stripe-humanities": tupleFromVar("stripe-humanities"),
    "stripe-sciences": tupleFromVar("stripe-sciences"),
    "stripe-neutral": tupleFromVar("stripe-neutral"),
  },

  fontSizes: {
    xs: cssVar("font-size-micro"),
    sm: cssVar("font-size-body"),
    md: cssVar("font-size-label"),
    lg: cssVar("font-size-label"),
    xl: cssVar("font-size-title"),
  },

  radius: {
    xs: cssVar("radius-sm"),
    sm: cssVar("radius-sm"),
    md: cssVar("radius-md"),
    lg: cssVar("radius-lg"),
    xl: cssVar("radius-pill"),
  },

  defaultRadius: "md",

  shadows: {
    xs: cssVar("shadow-card"),
    sm: cssVar("shadow-card"),
    md: cssVar("shadow-card"),
    lg: cssVar("shadow-overlay"),
    xl: cssVar("shadow-overlay"),
  },

  spacing: {
    xs: cssVar("space-1"),
    sm: cssVar("space-2"),
    md: cssVar("space-3"),
    lg: cssVar("space-4"),
    xl: cssVar("space-6"),
  },
});

export default theme;
