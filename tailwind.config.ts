import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-figtree)", "Figtree", "sans-serif"],
      },
      colors: {
        dark: {
          950: "#090c13",
          900: "#0f1420",
          850: "#151b2a",
          800: "#1b2235",
          750: "#222a42",
          700: "#2b3452",
        },
        sky: {
          accent: "#0084ff",
          bright: "#38bdf8",
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'sky-glow': '0 0 24px -4px rgba(0, 132, 255, 0.35)',
        'sky-pill': '0 4px 14px 0 rgba(0, 132, 255, 0.39)',
        'card-subtle': '0 8px 30px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
};
export default config;
