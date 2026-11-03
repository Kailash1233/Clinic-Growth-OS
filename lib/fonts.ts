import { Inter } from "next/font/google";

// tailwind's font-sans/font-serif read --font-display, so every root layout
// must put this class on <html> or text falls back to the browser's serif.
// Inter stands in for Owner.com's STKBureauSans, which isn't licensable here.
export const displayFont = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-display",
});
