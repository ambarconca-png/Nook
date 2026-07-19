import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nook: {
          background: "rgb(var(--nook-background) / <alpha-value>)",
          card: "rgb(var(--nook-card) / <alpha-value>)",
          ink: "rgb(var(--nook-ink) / <alpha-value>)",
          muted: "rgb(var(--nook-muted) / <alpha-value>)",
          subtle: "rgb(var(--nook-subtle) / <alpha-value>)",
          teal: "rgb(var(--module-color) / <alpha-value>)",
          violet: "rgb(var(--nook-violet) / <alpha-value>)",
          rose: "rgb(var(--nook-rose) / <alpha-value>)",
        },
      },
      boxShadow: {
        nook:
          "0 1px 2px rgba(20,20,18,0.04), 0 8px 24px rgba(20,20,18,0.05)",
      },
      borderRadius: {
        nook: "24px",
      },
    },
  },
  plugins: [],
} satisfies Config;
