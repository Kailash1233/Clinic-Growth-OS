import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#2563eb",
          600: "#1d4ed8",
          700: "#1e40af",
        },
        // Landing page v2 palette (requirements: landing-page-v2-prompt.md) —
        // deep navy/teal dark, warm off-white body, one sparing gold accent.
        // Scoped to marketing/landing components; dashboard/admin keep `brand`.
        navy: {
          50: "#EEF2F5",
          100: "#D7E0E6",
          400: "#3D5A70",
          700: "#123246",
          800: "#0D2636",
          900: "#0A1E2B",
          950: "#071620",
        },
        cream: {
          50: "#FBF8F2",
          100: "#F4EEE1",
        },
        gold: {
          400: "#D9AE5C",
          500: "#C6963A",
          600: "#A87A28",
        },
      },
      fontFamily: {
        serif: ["var(--font-display)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
