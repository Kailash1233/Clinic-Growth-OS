import localFont from "next/font/local";

// Inter, bundled from the @fontsource-variable/inter package rather than
// downloaded from Google Fonts at build time: that download made `next build`
// fail intermittently (next/font "Cannot read properties of null (reading '1')").
// tailwind's font-sans/font-serif read --font-display, so every root layout
// must put this class on <html> or text falls back to the browser's serif.
export const displayFont = localFont({
  src: "../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
  variable: "--font-display",
});
